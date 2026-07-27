import { createHash, randomUUID } from 'node:crypto';
import { Router } from 'express';
import { query, withTransaction } from '../db.js';
import { requireTenant } from '../middleware.js';
import { writeAudit } from '../audit.js';
import { asyncHandler } from '../shared/async-handler.js';
import { AppError } from '../shared/errors.js';
import { encryptBillingCredentials } from '../electronic-billing/credentials.js';

const router = Router();
const UUID_PATTERN = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const PROVIDER_PATTERN = /^[A-Z0-9][A-Z0-9_-]{1,39}$/;
const ENVIRONMENTS = new Set(['TEST', 'PRODUCTION']);
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

router.use(requireTenant);

function text(value, maxLength = 160) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (!normalized) return null;
  if (normalized.length > maxLength) {
    throw new AppError(
      `El campo supera ${maxLength} caracteres.`,
      422,
      'FIELD_TOO_LONG',
    );
  }
  return normalized;
}

function validDate(value) {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function validateBaseUrl(value, environment) {
  const normalized = text(value, 500);
  if (!normalized) return null;
  let parsed;
  try {
    parsed = new URL(normalized);
  } catch {
    throw new AppError('La URL del proveedor no es válida.', 422, 'INVALID_PROVIDER_URL');
  }
  if (!['http:', 'https:'].includes(parsed.protocol) ||
      (environment === 'PRODUCTION' && parsed.protocol !== 'https:')) {
    throw new AppError(
      'La conexión de producción debe utilizar HTTPS.',
      422,
      'INSECURE_PROVIDER_URL',
    );
  }
  return parsed.toString().replace(/\/$/, '');
}

router.get('/overview', asyncHandler(async (req, res) => {
  const [profile, account, resolutions, documents, counts] = await Promise.all([
    query(
      `SELECT company_id, taxpayer_type, electronic_invoicing_required,
              default_document_type, vat_responsibility, tax_regime
       FROM company_tax_profiles
       WHERE company_id = $1`,
      [req.context.tenantId],
    ),
    query(
      `SELECT id, provider_code, display_name, environment, base_url,
              connection_status, provider_config,
              (encrypted_credentials IS NOT NULL) credentials_configured,
              last_tested_at, last_success_at, last_error, active, updated_at
       FROM electronic_billing_accounts
       WHERE company_id = $1 AND active = TRUE
       ORDER BY updated_at DESC
       LIMIT 1`,
      [req.context.tenantId],
    ),
    query(
      `SELECT id, branch_id, prefix, number_from, number_to, current_number,
              valid_from, valid_until, active,
              GREATEST(number_to - current_number + 1, 0) remaining_numbers
       FROM billing_resolutions
       WHERE company_id = $1
       ORDER BY active DESC, valid_until DESC, prefix`,
      [req.context.tenantId],
    ),
    query(
      `SELECT document.id, document.document_type, document.prefix,
              document.document_number, document.status,
              document.provider_reference, document.cufe,
              document.failure_reason, document.retry_count,
              document.created_at, document.updated_at,
              sale.sequence_number, sale.total,
              transmission.status transmission_status,
              transmission.error_message transmission_error
       FROM electronic_documents document
       JOIN sales sale
         ON sale.id = document.sale_id AND sale.company_id = document.company_id
       LEFT JOIN LATERAL (
         SELECT status, error_message
         FROM electronic_document_transmissions
         WHERE electronic_document_id = document.id
         ORDER BY attempt_number DESC
         LIMIT 1
       ) transmission ON TRUE
       WHERE document.company_id = $1
       ORDER BY document.created_at DESC
       LIMIT 20`,
      [req.context.tenantId],
    ),
    query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'PENDING')::integer pending,
         COUNT(*) FILTER (WHERE status = 'SUBMITTED')::integer submitted,
         COUNT(*) FILTER (WHERE status = 'ACCEPTED')::integer accepted,
         COUNT(*) FILTER (WHERE status = 'REJECTED')::integer rejected
       FROM electronic_documents
       WHERE company_id = $1`,
      [req.context.tenantId],
    ),
  ]);
  const fiscalProfile = profile.rows[0] || null;
  const activeAccount = account.rows[0] || null;
  const activeResolution = resolutions.rows.find((resolution) =>
    resolution.active &&
    new Date(`${resolution.valid_from}T00:00:00Z`) <= new Date() &&
    new Date(`${resolution.valid_until}T23:59:59Z`) >= new Date() &&
    Number(resolution.remaining_numbers) > 0) || null;
  res.json({
    fiscalProfile,
    account: activeAccount,
    resolutions: resolutions.rows,
    documents: documents.rows,
    counts: counts.rows[0],
    readiness: {
      electronicMode: Boolean(fiscalProfile?.electronic_invoicing_required),
      providerConfigured: Boolean(activeAccount),
      credentialsConfigured: Boolean(
        activeAccount?.credentials_configured || activeAccount?.provider_code === 'SANDBOX',
      ),
      connectionReady: activeAccount?.connection_status === 'READY',
      resolutionReady: Boolean(activeResolution),
    },
  });
}));

router.put('/connection', asyncHandler(async (req, res) => {
  const providerCode = text(req.body.providerCode, 40)?.toUpperCase();
  const displayName = text(req.body.displayName, 120);
  const environment = text(req.body.environment, 20)?.toUpperCase();
  if (!providerCode || !PROVIDER_PATTERN.test(providerCode) ||
      !displayName || !ENVIRONMENTS.has(environment)) {
    throw new AppError(
      'Indica proveedor, nombre y ambiente válidos.',
      422,
      'INVALID_BILLING_CONNECTION',
    );
  }
  const baseUrl = validateBaseUrl(req.body.baseUrl, environment);
  const credentials = req.body.credentials;
  if (credentials !== undefined &&
      (!credentials || typeof credentials !== 'object' || Array.isArray(credentials))) {
    throw new AppError(
      'Las credenciales deben enviarse como un objeto.',
      422,
      'INVALID_BILLING_CREDENTIALS',
    );
  }
  if (credentials && JSON.stringify(credentials).length > 20000) {
    throw new AppError(
      'Las credenciales superan el tamaño permitido.',
      422,
      'BILLING_CREDENTIALS_TOO_LARGE',
    );
  }
  const encrypted = credentials && Object.keys(credentials).length
    ? encryptBillingCredentials(credentials)
    : null;
  const result = await withTransaction(async (client) => {
    await client.query(
      `UPDATE electronic_billing_accounts
       SET active = FALSE, connection_status = 'DISABLED', updated_at = now()
       WHERE company_id = $1 AND active = TRUE
         AND (provider_code <> $2 OR environment <> $3)`,
      [req.context.tenantId, providerCode, environment],
    );
    const saved = await client.query(
      `INSERT INTO electronic_billing_accounts(
         company_id, provider_code, display_name, environment, base_url,
         encrypted_credentials, credentials_key_version, connection_status,
         provider_config, active
       )
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,TRUE)
       ON CONFLICT(company_id, provider_code, environment)
       DO UPDATE SET
         display_name = EXCLUDED.display_name,
         base_url = EXCLUDED.base_url,
         encrypted_credentials = COALESCE(
           EXCLUDED.encrypted_credentials,
           electronic_billing_accounts.encrypted_credentials
         ),
         credentials_key_version = COALESCE(
           EXCLUDED.credentials_key_version,
           electronic_billing_accounts.credentials_key_version
         ),
         connection_status = EXCLUDED.connection_status,
         provider_config = EXCLUDED.provider_config,
         active = TRUE,
         last_error = NULL,
         updated_at = now()
       RETURNING id, provider_code, display_name, environment, base_url,
                 connection_status, provider_config,
                 (encrypted_credentials IS NOT NULL) credentials_configured,
                 active, updated_at`,
      [
        req.context.tenantId,
        providerCode,
        displayName,
        environment,
        baseUrl,
        encrypted,
        encrypted ? 'aes-256-gcm-v1' : null,
        providerCode === 'SANDBOX' || encrypted ? 'CONFIGURED' : 'DRAFT',
        { adapter: providerCode === 'SANDBOX' ? 'sandbox-v1' : 'pending' },
      ],
    );
    await writeAudit(client, {
      tenantId: req.context.tenantId,
      userId: req.context.userId,
      action: 'electronic_billing.connection_configured',
      entityType: 'electronic_billing_account',
      entityId: saved.rows[0].id,
      after: saved.rows[0],
      reason: 'Configuración de proveedor tecnológico',
    });
    return saved.rows[0];
  });
  res.json(result);
}));

router.post('/connection/test', asyncHandler(async (req, res) => {
  const result = await withTransaction(async (client) => {
    const account = await client.query(
      `SELECT id, provider_code, environment,
              (encrypted_credentials IS NOT NULL) credentials_configured
       FROM electronic_billing_accounts
       WHERE company_id = $1 AND active = TRUE
       ORDER BY updated_at DESC
       LIMIT 1
       FOR UPDATE`,
      [req.context.tenantId],
    );
    if (!account.rowCount) {
      throw new AppError(
        'Configura primero una conexión de facturación.',
        409,
        'BILLING_CONNECTION_REQUIRED',
      );
    }
    const current = account.rows[0];
    if (current.provider_code !== 'SANDBOX') {
      await client.query(
        `UPDATE electronic_billing_accounts
         SET connection_status = 'CONFIGURED',
             last_tested_at = now(),
             last_error = $2,
             updated_at = now()
         WHERE id = $1`,
        [
          current.id,
          'El adaptador se activará cuando se seleccione y documente el proveedor.',
        ],
      );
      throw new AppError(
        'La configuración quedó guardada. Falta instalar el adaptador específico del proveedor.',
        501,
        'BILLING_ADAPTER_PENDING',
      );
    }
    const tested = await client.query(
      `UPDATE electronic_billing_accounts
       SET connection_status = 'READY',
           last_tested_at = now(),
           last_success_at = now(),
           last_error = NULL,
           updated_at = now()
       WHERE id = $1
       RETURNING id, provider_code, environment, connection_status,
                 last_tested_at, last_success_at`,
      [current.id],
    );
    await writeAudit(client, {
      tenantId: req.context.tenantId,
      userId: req.context.userId,
      action: 'electronic_billing.connection_tested',
      entityType: 'electronic_billing_account',
      entityId: current.id,
      after: tested.rows[0],
      reason: 'Prueba controlada de conexión',
    });
    return tested.rows[0];
  });
  res.json(result);
}));

router.post('/resolutions', asyncHandler(async (req, res) => {
  const branchId = req.body.branchId;
  const prefix = text(req.body.prefix, 20)?.toUpperCase();
  const numberFrom = Number(req.body.numberFrom);
  const numberTo = Number(req.body.numberTo);
  const validFrom = req.body.validFrom;
  const validUntil = req.body.validUntil;
  if (!UUID_PATTERN.test(branchId || '') || !prefix ||
      !Number.isSafeInteger(numberFrom) || numberFrom <= 0 ||
      !Number.isSafeInteger(numberTo) || numberTo < numberFrom ||
      !validDate(validFrom) || !validDate(validUntil) || validUntil < validFrom) {
    throw new AppError(
      'La sucursal, prefijo, rango o vigencia de la resolución no son válidos.',
      422,
      'INVALID_BILLING_RESOLUTION',
    );
  }
  const result = await withTransaction(async (client) => {
    const branch = await client.query(
      `SELECT id FROM branches
       WHERE id = $1 AND tenant_id = $2 AND active = TRUE`,
      [branchId, req.context.tenantId],
    );
    if (!branch.rowCount) {
      throw new AppError(
        'La sucursal no pertenece a la empresa activa.',
        404,
        'BILLING_BRANCH_NOT_FOUND',
      );
    }
    await client.query(
      `UPDATE billing_resolutions
       SET active = FALSE, updated_at = now()
       WHERE company_id = $1 AND branch_id = $2 AND prefix = $3 AND active = TRUE`,
      [req.context.tenantId, branchId, prefix],
    );
    const resolution = await client.query(
      `INSERT INTO billing_resolutions(
         company_id, branch_id, prefix, number_from, number_to,
         current_number, valid_from, valid_until, active
       )
       VALUES($1,$2,$3,$4,$5,$4,$6,$7,TRUE)
       RETURNING *`,
      [
        req.context.tenantId,
        branchId,
        prefix,
        numberFrom,
        numberTo,
        validFrom,
        validUntil,
      ],
    );
    await writeAudit(client, {
      tenantId: req.context.tenantId,
      userId: req.context.userId,
      action: 'electronic_billing.resolution_created',
      entityType: 'billing_resolution',
      entityId: resolution.rows[0].id,
      after: resolution.rows[0],
      reason: 'Registro de numeración autorizada',
    });
    return resolution.rows[0];
  });
  res.status(201).json(result);
}));

router.post('/documents/:documentId/queue', asyncHandler(async (req, res) => {
  const { documentId } = req.params;
  if (!UUID_PATTERN.test(documentId || '')) {
    throw new AppError(
      'El documento electrónico debe tener un UUID válido.',
      422,
      'INVALID_ELECTRONIC_DOCUMENT_ID',
    );
  }
  const result = await withTransaction(async (client) => {
    const document = await client.query(
      `SELECT document.id, document.status, document.document_type,
              document.prefix, document.document_number, document.sale_id,
              sale.total, sale.tax_total, sale.created_at,
              account.id billing_account_id, account.connection_status
       FROM electronic_documents document
       JOIN sales sale
         ON sale.id = document.sale_id AND sale.company_id = document.company_id
       JOIN electronic_billing_accounts account
         ON account.company_id = document.company_id AND account.active = TRUE
       WHERE document.id = $1 AND document.company_id = $2
       ORDER BY account.updated_at DESC
       LIMIT 1
       FOR UPDATE OF document`,
      [documentId, req.context.tenantId],
    );
    if (!document.rowCount) {
      throw new AppError(
        'No encontramos el documento o una conexión activa.',
        404,
        'ELECTRONIC_DOCUMENT_NOT_READY',
      );
    }
    const record = document.rows[0];
    if (!record.prefix || !record.document_number) {
      throw new AppError(
        'El documento no tiene numeración autorizada.',
        409,
        'BILLING_RESOLUTION_REQUIRED',
      );
    }
    if (record.connection_status !== 'READY') {
      throw new AppError(
        'La conexión debe estar probada antes de poner documentos en cola.',
        409,
        'BILLING_CONNECTION_NOT_READY',
      );
    }
    const attempts = await client.query(
      `SELECT COALESCE(MAX(attempt_number), 0)::integer + 1 next_attempt
       FROM electronic_document_transmissions
       WHERE electronic_document_id = $1`,
      [documentId],
    );
    const attemptNumber = attempts.rows[0].next_attempt;
    const payload = {
      schema: 'megasuite-electronic-document-v1',
      companyId: req.context.tenantId,
      documentId,
      documentType: record.document_type,
      number: `${record.prefix}${record.document_number}`,
      saleId: record.sale_id,
      total: record.total,
      taxTotal: record.tax_total,
      issuedAt: record.created_at,
    };
    const requestHash = createHash('sha256')
      .update(JSON.stringify(payload))
      .digest('hex');
    const transmission = await client.query(
      `INSERT INTO electronic_document_transmissions(
         company_id, electronic_document_id, billing_account_id,
         attempt_number, idempotency_key, status, request_hash,
         payload_snapshot, created_by
       )
       VALUES($1,$2,$3,$4,$5,'QUEUED',$6,$7,$8)
       RETURNING *`,
      [
        req.context.tenantId,
        documentId,
        record.billing_account_id,
        attemptNumber,
        `${documentId}:${attemptNumber}:${randomUUID()}`,
        requestHash,
        payload,
        req.context.userId,
      ],
    );
    await client.query(
      `UPDATE electronic_documents
       SET failure_reason = 'Documento preparado en la cola de transmisión.',
           updated_at = now()
       WHERE id = $1`,
      [documentId],
    );
    await writeAudit(client, {
      tenantId: req.context.tenantId,
      userId: req.context.userId,
      action: 'electronic_billing.document_queued',
      entityType: 'electronic_document_transmission',
      entityId: transmission.rows[0].id,
      after: {
        electronicDocumentId: documentId,
        attemptNumber,
        requestHash,
      },
      reason: 'Documento preparado para transmisión',
    });
    return transmission.rows[0];
  });
  res.status(202).json(result);
}));

export default router;
