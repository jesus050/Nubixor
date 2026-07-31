import { createHash } from 'node:crypto';
import { getPool, withTransaction } from '../db.js';
import { writeAudit } from '../audit.js';
import { createBillingAdapter } from './adapters/registry.js';
import {
  decodeProviderArtifact,
  insertStagedArtifact,
  removeStagedArtifacts,
  stageSecureArtifact,
} from '../secure-storage.js';
import { logger } from '../shared/logger.js';

const RETRYABLE_HTTP = new Set([429, 500, 502, 503, 504]);
const DEFAULT_STALE_SECONDS = 600;
const DEFAULT_RECONCILE_SECONDS = 30;
const MAX_RETRY_SECONDS = 3600;

export function retryDelaySeconds(attemptNumber, retryAfter) {
  const providerDelay = Number(retryAfter);
  if (Number.isFinite(providerDelay) && providerDelay > 0) {
    return Math.min(MAX_RETRY_SECONDS, Math.max(1, Math.ceil(providerDelay)));
  }
  const attempt = Math.max(1, Number(attemptNumber) || 1);
  return Math.min(MAX_RETRY_SECONDS, 30 * (2 ** Math.min(attempt - 1, 6)));
}

export function isRetryableProviderError(error) {
  return RETRYABLE_HTTP.has(Number(error?.status) || 503);
}

async function archiveArtifacts({ adapter, record, providerReference }) {
  const downloaded = await adapter.downloadDocumentArtifacts(providerReference);
  const artifacts = [
    decodeProviderArtifact(downloaded.pdf, {
      contentField: 'pdf_base_64_encoded',
      fallbackName: `${providerReference}.pdf`,
      contentType: 'application/pdf',
    }),
    decodeProviderArtifact(downloaded.xml, {
      contentField: 'xml_base_64_encoded',
      fallbackName: `${providerReference}.xml`,
      contentType: 'application/xml',
    }),
  ];
  const staged = [];
  try {
    for (const artifact of artifacts) {
      staged.push(await stageSecureArtifact({ tenantId: record.company_id, ...artifact }));
    }
    return await withTransaction(async (client) => {
      const archived = [];
      for (const artifact of staged) {
        archived.push(await insertStagedArtifact(client, {
          artifact,
          tenantId: record.company_id,
          userId: record.created_by,
          description: `Expediente fiscal Factus ${providerReference}`,
        }));
      }
      const [pdf, xml] = archived;
      await client.query(
        `UPDATE electronic_documents
         SET pdf_document_id=$3::uuid, xml_document_id=$4::uuid,
             pdf_url='/api/assets/documents/' || $3::text,
             xml_url='/api/assets/documents/' || $4::text,
             artifacts_synced_at=now(), updated_at=now()
         WHERE id=$1 AND company_id=$2`,
        [record.electronic_document_id, record.company_id, pdf.id, xml.id],
      );
      return { pdf, xml };
    });
  } catch (error) {
    await removeStagedArtifacts(staged);
    throw error;
  }
}

export async function recoverStaleTransmissions({ staleSeconds = DEFAULT_STALE_SECONDS } = {}) {
  const result = await getPool().query(
    `UPDATE electronic_document_transmissions
     SET status='RETRYABLE', completed_at=now(),
         error_code='WORKER_STALE_RECOVERY',
         error_message='La transmisión quedó interrumpida y fue recuperada automáticamente.',
         next_attempt_at=now(), updated_at=now()
     WHERE status='SENDING'
       AND COALESCE(started_at, created_at) < now() - ($1::text || ' seconds')::interval
     RETURNING id`,
    [staleSeconds],
  );
  return result.rowCount;
}

export async function claimNextTransmission() {
  return withTransaction(async (client) => {
    const result = await client.query(
      `SELECT transmission.*, account.provider_code, account.environment,
              account.base_url, account.encrypted_credentials, account.provider_config,
              document.provider_reference document_provider_reference,
              document.status document_status
       FROM electronic_document_transmissions transmission
       JOIN electronic_billing_accounts account
         ON account.id=transmission.billing_account_id
        AND account.company_id=transmission.company_id
        AND account.active=TRUE
       JOIN electronic_documents document
         ON document.id=transmission.electronic_document_id
        AND document.company_id=transmission.company_id
       WHERE (
         transmission.status IN ('QUEUED','RETRYABLE')
         OR transmission.status='SUBMITTED'
       )
         AND (transmission.next_attempt_at IS NULL OR transmission.next_attempt_at <= now())
       ORDER BY
         CASE transmission.status WHEN 'SUBMITTED' THEN 1 ELSE 0 END,
         COALESCE(transmission.next_attempt_at, transmission.created_at),
         transmission.created_at
       LIMIT 1
       FOR UPDATE OF transmission SKIP LOCKED`,
    );
    if (!result.rowCount) return null;
    const record = result.rows[0];
    const lock = await client.query(
      `SELECT pg_try_advisory_xact_lock(hashtext($1)) locked`,
      [`nubixor:factus:${record.billing_account_id}`],
    );
    if (!lock.rows[0]?.locked) return null;
    await client.query(
      `UPDATE electronic_document_transmissions
       SET status='SENDING', started_at=COALESCE(started_at,now()),
           completed_at=NULL, error_code=NULL, error_message=NULL, updated_at=now()
       WHERE id=$1`,
      [record.id],
    );
    return record;
  });
}

async function reconcileAmbiguous(adapter, record) {
  const referenceCode = record.payload_snapshot?.reference_code;
  if (!referenceCode || typeof adapter.findDocumentByReference !== 'function') return null;
  try {
    return await adapter.findDocumentByReference(referenceCode);
  } catch (error) {
    if (Number(error.status) === 404) return null;
    throw error;
  }
}

async function markSuccess(record, providerResult) {
  const finalStatus = providerResult.status === 'ACCEPTED' ? 'ACCEPTED' : 'SUBMITTED';
  const providerReference = providerResult.providerReference ||
    record.document_provider_reference || record.payload_snapshot?.reference_code;
  await withTransaction(async (client) => {
    await client.query(
      `UPDATE electronic_document_transmissions
       SET status=$2, completed_at=now(), provider_reference=$3,
           provider_status=$2, http_status=200, response_summary=$4,
           error_code=NULL, error_message=NULL,
           next_attempt_at=CASE WHEN $2='SUBMITTED'
             THEN now() + ($5::text || ' seconds')::interval ELSE NULL END,
           updated_at=now()
       WHERE id=$1 AND company_id=$6`,
      [record.id, finalStatus, providerReference, providerResult.response,
        DEFAULT_RECONCILE_SECONDS, record.company_id],
    );
    await client.query(
      `UPDATE electronic_documents
       SET status=$2, provider_reference=$3, provider_document_id=$3,
           cufe=COALESCE($4,cufe), qr_url=COALESCE($5,qr_url),
           submitted_at=COALESCE(submitted_at,now()),
           accepted_at=CASE WHEN $2='ACCEPTED' THEN COALESCE(accepted_at,now()) ELSE accepted_at END,
           last_synced_at=now(), failure_reason=NULL, updated_at=now()
       WHERE id=$1 AND company_id=$6`,
      [record.electronic_document_id, finalStatus, providerReference,
        providerResult.cufe, providerResult.qrUrl, record.company_id],
    );
    await writeAudit(client, {
      tenantId: record.company_id,
      userId: record.created_by,
      action: finalStatus === 'ACCEPTED'
        ? 'electronic_billing.worker_accepted'
        : 'electronic_billing.worker_submitted',
      entityType: 'electronic_document_transmission',
      entityId: record.id,
      after: { providerReference, status: finalStatus, cufe: providerResult.cufe || null },
      reason: 'Procesamiento automático del worker de facturación',
    });
  });
  if (finalStatus === 'ACCEPTED' && record.provider_code === 'FACTUS' && providerReference) {
    try {
      await archiveArtifacts({ adapter: createBillingAdapter(record), record, providerReference });
    } catch (error) {
      logger.error('billing.worker.artifact_sync_failed', {
        transmissionId: record.id,
        documentId: record.electronic_document_id,
        errorCode: error.code,
        message: error.message,
      });
    }
  }
  return finalStatus;
}

async function markFailure(record, error) {
  const retryable = isRetryableProviderError(error);
  const delay = retryDelaySeconds(record.attempt_number, error.retryAfter);
  const httpStatus = Number(error.status) || 503;
  await withTransaction(async (client) => {
    await client.query(
      `UPDATE electronic_document_transmissions
       SET status=$2, completed_at=now(), http_status=$3,
           response_summary=$4, error_code=$5, error_message=$6,
           next_attempt_at=CASE WHEN $2='RETRYABLE'
             THEN now() + ($7::text || ' seconds')::interval ELSE NULL END,
           updated_at=now()
       WHERE id=$1 AND company_id=$8`,
      [record.id, retryable ? 'RETRYABLE' : 'REJECTED', httpStatus,
        error.providerResponse || null, error.code || 'FACTUS_PROCESSING_ERROR',
        error.message, delay, record.company_id],
    );
    await client.query(
      `UPDATE electronic_documents
       SET status=$2, failure_reason=$3, retry_count=retry_count+1,
           last_synced_at=now(), updated_at=now()
       WHERE id=$1 AND company_id=$4`,
      [record.electronic_document_id, retryable ? 'PENDING' : 'REJECTED',
        error.message, record.company_id],
    );
    await writeAudit(client, {
      tenantId: record.company_id,
      userId: record.created_by,
      action: retryable
        ? 'electronic_billing.worker_retry_scheduled'
        : 'electronic_billing.worker_rejected',
      entityType: 'electronic_document_transmission',
      entityId: record.id,
      after: { httpStatus, retryable, retryAfter: retryable ? delay : null },
      reason: error.message,
    });
  });
}

export async function processClaimedTransmission(record) {
  const adapter = createBillingAdapter(record);
  try {
    let providerResult;
    if (record.status === 'SUBMITTED' || record.document_status === 'SUBMITTED') {
      const reference = record.provider_reference || record.document_provider_reference;
      providerResult = reference
        ? await adapter.getDocumentStatus(reference)
        : await reconcileAmbiguous(adapter, record);
      if (!providerResult) {
        const missing = new Error('Factus aún no devuelve el documento enviado.');
        missing.status = 503;
        missing.code = 'FACTUS_RECONCILIATION_PENDING';
        throw missing;
      }
    } else {
      try {
        providerResult = await adapter.submitDocument(record.payload_snapshot);
      } catch (error) {
        if (isRetryableProviderError(error)) {
          const reconciled = await reconcileAmbiguous(adapter, record);
          if (reconciled) providerResult = reconciled;
          else throw error;
        } else {
          throw error;
        }
      }
    }
    return await markSuccess(record, providerResult);
  } catch (error) {
    await markFailure(record, error);
    throw error;
  }
}

export async function runWorkerIteration() {
  const record = await claimNextTransmission();
  if (!record) return false;
  try {
    const status = await processClaimedTransmission(record);
    logger.info('billing.worker.processed', {
      transmissionId: record.id,
      documentId: record.electronic_document_id,
      status,
    });
  } catch (error) {
    logger.error('billing.worker.failed', {
      transmissionId: record.id,
      documentId: record.electronic_document_id,
      errorCode: error.code,
      message: error.message,
    });
  }
  return true;
}

export function payloadFingerprint(payload) {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}
