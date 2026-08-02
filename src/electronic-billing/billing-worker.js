import { query, withTransaction } from '../db.js';
import { writeAudit } from '../audit.js';
import { createBillingAdapter } from './adapters/registry.js';
import { logger } from '../shared/logger.js';
import {
  decodeProviderArtifact,
  insertStagedArtifact,
  removeStagedArtifacts,
  stageSecureArtifact,
} from '../secure-storage.js';

const RETRYABLE_HTTP_STATUSES = new Set([429, 500, 502, 503, 504]);
const MAX_RETRY_SECONDS = 3_600;

export function isRetryableBillingError(error) {
  return RETRYABLE_HTTP_STATUSES.has(Number(error?.status));
}

export function retryDelaySeconds(error, attemptNumber) {
  const providerDelay = Number(error?.retryAfter);
  if (Number.isFinite(providerDelay) && providerDelay > 0) {
    return Math.min(MAX_RETRY_SECONDS, Math.max(1, Math.ceil(providerDelay)));
  }
  // Backoff acotado: 30 s, 60 s, 120 s... hasta un máximo de una hora.
  return Math.min(
    MAX_RETRY_SECONDS,
    30 * (2 ** Math.min(Math.max(0, Number(attemptNumber) - 1), 6)),
  );
}

export async function releaseDueBillingRetries() {
  const [documents, notes] = await Promise.all([
    query(
      `UPDATE electronic_document_transmissions
       SET status = 'QUEUED', next_attempt_at = NULL
       WHERE status = 'RETRYABLE'
         AND next_attempt_at IS NOT NULL
         AND next_attempt_at <= now()
       RETURNING id`,
    ),
    query(
      `UPDATE electronic_note_transmissions
       SET status = 'QUEUED', next_attempt_at = NULL
       WHERE status = 'RETRYABLE'
         AND next_attempt_at IS NOT NULL
         AND next_attempt_at <= now()
       RETURNING id`,
    ),
  ]);
  return { documents: documents.rowCount, notes: notes.rowCount };
}

export async function recoverExpiredBillingLeases() {
  // Una transmisión nunca puede quedarse bloqueada indefinidamente si el
  // proceso se reinicia. Conservamos el mismo intento e idempotency_key.
  const result = await query(
    `UPDATE electronic_document_transmissions
     SET status = 'RETRYABLE',
         completed_at = now(),
         error_code = 'BILLING_WORKER_LEASE_EXPIRED',
         error_message = 'La transmisión se recuperó después de superar el tiempo de espera.',
         next_attempt_at = now()
     WHERE status = 'SENDING'
       AND started_at < now() - interval '10 minutes'
     RETURNING id`,
  );
  return result.rowCount;
}

async function claimQueuedTransmission() {
  return withTransaction(async (client) => {
    const transmission = await client.query(
      `SELECT transmission.*, account.provider_code, account.environment,
              account.base_url, account.encrypted_credentials, account.provider_config,
              account.company_id AS account_company_id
       FROM electronic_document_transmissions transmission
       JOIN electronic_billing_accounts account
         ON account.id = transmission.billing_account_id
        AND account.company_id = transmission.company_id
       WHERE transmission.status = 'QUEUED'
       ORDER BY transmission.queued_at ASC
       LIMIT 1
       FOR UPDATE OF transmission SKIP LOCKED`,
    );
    if (!transmission.rowCount) return null;
    const record = transmission.rows[0];
    await client.query(
      `UPDATE electronic_document_transmissions
       SET status = 'SENDING', started_at = now(), completed_at = NULL,
           error_code = NULL, error_message = NULL
       WHERE id = $1`,
      [record.id],
    );
    return record;
  });
}

async function completeTransmission(record, providerResult) {
  const finalStatus = providerResult.status === 'ACCEPTED' ? 'ACCEPTED' : 'SUBMITTED';
  await withTransaction(async (client) => {
    await client.query(
      `UPDATE electronic_document_transmissions
       SET status = $2, completed_at = now(), provider_reference = $3,
           provider_status = $2, http_status = $4, response_summary = $5,
           error_code = NULL, error_message = NULL, next_attempt_at = NULL
       WHERE id = $1`,
      [
        record.id,
        finalStatus,
        providerResult.providerReference,
        finalStatus === 'ACCEPTED' ? 201 : 200,
        providerResult.response || null,
      ],
    );
    await client.query(
      `UPDATE electronic_documents
       SET status = $2, provider_reference = $3, provider_document_id = $3,
           cufe = $4, qr_url = $5, submitted_at = COALESCE(submitted_at, now()),
           accepted_at = CASE WHEN $2 = 'ACCEPTED' THEN now() ELSE accepted_at END,
           last_synced_at = now(), failure_reason = NULL, updated_at = now()
       WHERE id = $1 AND company_id = $6`,
      [
        record.electronic_document_id,
        finalStatus,
        providerResult.providerReference,
        providerResult.cufe || null,
        providerResult.qrUrl || null,
        record.company_id,
      ],
    );
    await writeAudit(client, {
      tenantId: record.company_id,
      userId: record.created_by,
      action: finalStatus === 'ACCEPTED'
        ? 'electronic_billing.worker_document_accepted'
        : 'electronic_billing.worker_document_submitted',
      entityType: 'electronic_document_transmission',
      entityId: record.id,
      after: {
        electronicDocumentId: record.electronic_document_id,
        provider: record.provider_code,
        providerReference: providerResult.providerReference,
        status: finalStatus,
        cufe: providerResult.cufe || null,
      },
      reason: 'Procesamiento automático de cola de facturación',
    });
  });
  return finalStatus;
}

async function failTransmission(record, error) {
  const retryable = isRetryableBillingError(error);
  const retryAfter = retryDelaySeconds(error, record.attempt_number);
  const nextStatus = retryable ? 'RETRYABLE' : 'REJECTED';
  await withTransaction(async (client) => {
    await client.query(
      `UPDATE electronic_document_transmissions
       SET status = $2, completed_at = now(), http_status = $3,
           response_summary = $4, error_code = $5, error_message = $6,
           next_attempt_at = CASE WHEN $2 = 'RETRYABLE'
             THEN now() + ($7::integer * interval '1 second') ELSE NULL END
       WHERE id = $1`,
      [
        record.id,
        nextStatus,
        Number(error?.status) || 503,
        error?.providerResponse || null,
        error?.code || 'BILLING_WORKER_SUBMISSION_FAILED',
        error?.message || 'No fue posible transmitir el documento.',
        retryAfter,
      ],
    );
    await client.query(
      `UPDATE electronic_documents
       SET status = $2, failure_reason = $3,
           retry_count = retry_count + CASE WHEN $2 = 'PENDING' THEN 1 ELSE 0 END,
           last_synced_at = now(), updated_at = now()
       WHERE id = $1 AND company_id = $4`,
      [
        record.electronic_document_id,
        retryable ? 'PENDING' : 'REJECTED',
        error?.message || 'No fue posible transmitir el documento.',
        record.company_id,
      ],
    );
    await writeAudit(client, {
      tenantId: record.company_id,
      userId: record.created_by,
      action: retryable
        ? 'electronic_billing.worker_retry_scheduled'
        : 'electronic_billing.worker_document_rejected',
      entityType: 'electronic_document_transmission',
      entityId: record.id,
      after: {
        electronicDocumentId: record.electronic_document_id,
        provider: record.provider_code,
        httpStatus: Number(error?.status) || 503,
        retryable,
        retryAfter: retryable ? retryAfter : null,
        errorCode: error?.code || null,
      },
      reason: 'Error controlado durante el procesamiento automático',
    });
  });
  return { retryable, retryAfter };
}

async function claimQueuedNoteTransmission() {
  return withTransaction(async (client) => {
    const transmission = await client.query(
      `SELECT transmission.*, note.note_type, account.provider_code, account.environment,
              account.base_url, account.encrypted_credentials, account.provider_config
       FROM electronic_note_transmissions transmission
       JOIN electronic_adjustment_notes note
         ON note.id = transmission.adjustment_note_id AND note.company_id = transmission.company_id
       JOIN electronic_billing_accounts account
         ON account.id = transmission.billing_account_id AND account.company_id = transmission.company_id
       WHERE transmission.status = 'QUEUED'
       ORDER BY transmission.queued_at ASC
       LIMIT 1
       FOR UPDATE OF transmission SKIP LOCKED`,
    );
    if (!transmission.rowCount) return null;
    const record = transmission.rows[0];
    await client.query(
      `UPDATE electronic_note_transmissions
       SET status='SENDING', started_at=now(), completed_at=NULL,
           error_code=NULL, error_message=NULL
       WHERE id=$1`,
      [record.id],
    );
    return record;
  });
}

async function completeNoteTransmission(record, providerResult) {
  const finalStatus = providerResult.status === 'ACCEPTED' ? 'ACCEPTED' : 'SUBMITTED';
  await withTransaction(async (client) => {
    await client.query(
      `UPDATE electronic_note_transmissions
       SET status=$2, completed_at=now(), response_summary=$3,
           error_code=NULL, error_message=NULL, next_attempt_at=NULL
       WHERE id=$1`,
      [record.id, finalStatus, providerResult.response || null],
    );
    await client.query(
      `UPDATE electronic_adjustment_notes
       SET status=$2, provider_reference=$3, cude=$4, qr_url=$5,
           submitted_at=COALESCE(submitted_at, now()),
           accepted_at=CASE WHEN $2='ACCEPTED' THEN now() ELSE accepted_at END,
           failure_reason=NULL, updated_at=now()
       WHERE id=$1 AND company_id=$6`,
      [record.adjustment_note_id, finalStatus, providerResult.providerReference,
        providerResult.cude || null, providerResult.qrUrl || null, record.company_id],
    );
    await writeAudit(client, {
      tenantId: record.company_id, userId: record.created_by,
      action: finalStatus === 'ACCEPTED'
        ? 'electronic_billing.worker_note_accepted'
        : 'electronic_billing.worker_note_submitted',
      entityType: 'electronic_note_transmission', entityId: record.id,
      after: { noteId: record.adjustment_note_id, status: finalStatus, providerReference: providerResult.providerReference },
      reason: 'Procesamiento automático de nota electrónica',
    });
  });
  if (
    finalStatus === 'ACCEPTED' &&
    record.provider_code === 'FACTUS' &&
    providerResult.providerReference
  ) {
    archiveFactusNoteArtifactsInBackground({
      adapter: createBillingAdapter(record),
      companyId: record.company_id,
      noteId: record.adjustment_note_id,
      noteType: record.note_type,
      providerReference: providerResult.providerReference,
      userId: record.created_by,
    });
  }
  return finalStatus;
}

async function persistFactusNoteArtifacts({
  adapter, companyId, noteId, noteType, providerReference, userId,
}) {
  const downloaded = await adapter.downloadAdjustmentNoteArtifacts(noteType, providerReference);
  const artifacts = [
    decodeProviderArtifact(downloaded.pdf, {
      contentField: 'pdf_base_64_encoded',
      fallbackName: `${providerReference}.pdf`, contentType: 'application/pdf',
    }),
    decodeProviderArtifact(downloaded.xml, {
      contentField: 'xml_base_64_encoded',
      fallbackName: `${providerReference}.xml`, contentType: 'application/xml',
    }),
  ];
  const staged = [];
  try {
    for (const artifact of artifacts) {
      staged.push(await stageSecureArtifact({ tenantId: companyId, ...artifact }));
    }
    return await withTransaction(async (client) => {
      const saved = [];
      for (const artifact of staged) {
        saved.push(await insertStagedArtifact(client, {
          artifact, tenantId: companyId, userId,
          description: `Expediente fiscal Factus ${providerReference}`,
        }));
      }
      await client.query(
        `UPDATE electronic_adjustment_notes
         SET pdf_document_id=$3::uuid, xml_document_id=$4::uuid,
             pdf_url='/api/assets/documents/' || $3::text,
             xml_url='/api/assets/documents/' || $4::text,
             artifacts_synced_at=now(), updated_at=now()
         WHERE id=$1 AND company_id=$2`,
        [noteId, companyId, saved[0].id, saved[1].id],
      );
      await writeAudit(client, {
        tenantId: companyId, userId,
        action: 'electronic_billing.note_artifacts_archived',
        entityType: 'electronic_adjustment_note', entityId: noteId,
        after: { providerReference, pdfDocumentId: saved[0].id, xmlDocumentId: saved[1].id },
        reason: 'PDF y XML de nota Factus almacenados de forma privada',
      });
      return saved;
    });
  } catch (error) {
    await removeStagedArtifacts(staged);
    throw error;
  }
}

function archiveFactusNoteArtifactsInBackground(context) {
  setImmediate(() => {
    persistFactusNoteArtifacts(context).catch(async (error) => {
      logger.error('billing.note_artifacts_pending', {
        noteId: context.noteId, companyId: context.companyId, errorCode: error?.code,
      });
      try {
        await withTransaction((client) => writeAudit(client, {
          tenantId: context.companyId, userId: context.userId,
          action: 'electronic_billing.note_artifacts_pending',
          entityType: 'electronic_adjustment_note', entityId: context.noteId,
          after: { providerReference: context.providerReference, errorCode: error?.code || 'FISCAL_ARTIFACT_SYNC_FAILED' },
          reason: error?.message || 'No fue posible archivar los documentos fiscales de la nota.',
        }));
      } catch (auditError) {
        logger.error('billing.note_artifacts_audit_failed', { noteId: context.noteId, errorCode: auditError?.code });
      }
    });
  });
}

async function failNoteTransmission(record, error) {
  const retryable = isRetryableBillingError(error);
  const retryAfter = retryDelaySeconds(error, record.attempt_number);
  await withTransaction(async (client) => {
    await client.query(
      `UPDATE electronic_note_transmissions
       SET status=$2, completed_at=now(), error_code=$3, error_message=$4,
           next_attempt_at=CASE WHEN $2='RETRYABLE' THEN now() + ($5::integer * interval '1 second') ELSE NULL END
       WHERE id=$1`,
      [record.id, retryable ? 'RETRYABLE' : 'REJECTED', error?.code || 'NOTE_TRANSMISSION_FAILED', error?.message || 'No fue posible transmitir la nota.', retryAfter],
    );
    await client.query(
      `UPDATE electronic_adjustment_notes
       SET status=$2, failure_reason=$3,
           retry_count=retry_count + CASE WHEN $2='PENDING' THEN 1 ELSE 0 END,
           next_attempt_at=CASE WHEN $2='PENDING' THEN now() + ($4::integer * interval '1 second') ELSE NULL END,
           updated_at=now()
       WHERE id=$1 AND company_id=$5`,
      [record.adjustment_note_id, retryable ? 'PENDING' : 'REJECTED', error?.message || 'No fue posible transmitir la nota.', retryAfter, record.company_id],
    );
  });
  return { retryable, retryAfter };
}

export async function processOneQueuedNoteTransmission() {
  const record = await claimQueuedNoteTransmission();
  if (!record) return null;
  try {
    const result = await createBillingAdapter(record).submitAdjustmentNote(record.payload_snapshot);
    return { id: record.id, status: await completeNoteTransmission(record, result) };
  } catch (error) {
    const failed = await failNoteTransmission(record, error);
    logger.error('billing.worker_note_failed', { noteTransmissionId: record.id, companyId: record.company_id, errorCode: error?.code, retryable: failed.retryable });
    return { id: record.id, status: failed.retryable ? 'RETRYABLE' : 'REJECTED' };
  }
}

export async function processOneQueuedBillingTransmission() {
  const record = await claimQueuedTransmission();
  if (!record) return null;
  try {
    const adapter = createBillingAdapter(record);
    const providerResult = await adapter.submitDocument(record.payload_snapshot);
    const status = await completeTransmission(record, providerResult);
    return { id: record.id, status };
  } catch (error) {
    const failed = await failTransmission(record, error);
    logger.error('billing.worker_transmission_failed', {
      transmissionId: record.id,
      companyId: record.company_id,
      errorCode: error?.code,
      status: error?.status,
      retryable: failed.retryable,
    });
    return { id: record.id, status: failed.retryable ? 'RETRYABLE' : 'REJECTED' };
  }
}

export async function reconcileSubmittedBillingDocuments({ limit = 5 } = {}) {
  const pending = await query(
    `SELECT transmission.*, account.provider_code, account.environment,
            account.base_url, account.encrypted_credentials, account.provider_config
     FROM electronic_document_transmissions transmission
     JOIN electronic_billing_accounts account
       ON account.id = transmission.billing_account_id
      AND account.company_id = transmission.company_id
     WHERE transmission.status = 'SUBMITTED'
       AND transmission.provider_reference IS NOT NULL
     ORDER BY transmission.completed_at ASC NULLS FIRST
     LIMIT $1`,
    [Math.max(1, Math.min(20, Number(limit) || 5))],
  );
  let reconciled = 0;
  for (const record of pending.rows) {
    try {
      const result = await createBillingAdapter(record).getDocumentStatus(record.provider_reference);
      if (result.status !== 'ACCEPTED') continue;
      await completeTransmission(record, result);
      reconciled += 1;
    } catch (error) {
      logger.error('billing.reconciliation_failed', {
        transmissionId: record.id,
        companyId: record.company_id,
        errorCode: error?.code,
        status: error?.status,
      });
    }
  }
  return reconciled;
}

export async function runBillingWorkerCycle({ maxJobs = 3 } = {}) {
  const released = await releaseDueBillingRetries();
  const recovered = await recoverExpiredBillingLeases();
  const processed = [];
  for (let index = 0; index < Math.max(1, Math.min(20, Number(maxJobs) || 3)); index += 1) {
    const result = await processOneQueuedBillingTransmission();
    if (!result) break;
    processed.push(result);
  }
  const note = await processOneQueuedNoteTransmission();
  const reconciled = await reconcileSubmittedBillingDocuments();
  if (released.documents || released.notes || recovered || processed.length || note || reconciled) {
    logger.info('billing.worker_cycle', {
      released,
      recovered,
      processed: processed.length,
      notesProcessed: note ? 1 : 0,
      reconciled,
    });
  }
  return { released, recovered, processed, reconciled };
}
