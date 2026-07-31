import { createHash, randomUUID } from 'node:crypto';
import { Router } from 'express';
import { query, withTransaction } from '../db.js';
import { requireTenant } from '../middleware.js';
import { writeAudit } from '../audit.js';
import { asyncHandler } from '../shared/async-handler.js';
import { AppError } from '../shared/errors.js';
import { encryptBillingCredentials } from '../electronic-billing/credentials.js';
import { createBillingAdapter } from '../electronic-billing/adapters/registry.js';
import {
  decodeProviderArtifact,
  insertStagedArtifact,
  removeStagedArtifacts,
  stageSecureArtifact,
} from '../secure-storage.js';

const router = Router();
const UUID_PATTERN = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const PROVIDER_PATTERN = /^[A-Z0-9][A-Z0-9_-]{1,39}$/;
const ENVIRONMENTS = new Set(['TEST', 'PRODUCTION']);
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const FACTUS_BASE_URLS = {
  TEST: 'https://api-sandbox.factus.com.co',
  PRODUCTION: 'https://api.factus.com.co',
};
const FACTUS_CATALOG_TYPES = new Set([
  'PAYMENT_FORM', 'PAYMENT_METHOD', 'DOCUMENT_TYPE', 'OPERATION_TYPE',
  'IDENTIFICATION_DOCUMENT', 'LEGAL_ORGANIZATION', 'TRIBUTE',
  'TAX', 'UNIT_MEASURE', 'STANDARD_CODE', 'MUNICIPALITY', 'COUNTRY',
]);

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

async function persistFactusDocumentArtifacts({
  adapter,
  companyId,
  documentId,
  providerReference,
  userId,
}) {
  const downloaded = await adapter.downloadDocumentArtifacts(providerReference);
  const decoded = [
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
    for (const artifact of decoded) {
      staged.push(await stageSecureArtifact({
        tenantId: companyId,
        ...artifact,
      }));
    }
    return await withTransaction(async (client) => {
      const archived = [];
      for (const artifact of staged) {
        archived.push(await insertStagedArtifact(client, {
          artifact,
          tenantId: companyId,
          userId,
          description: `Expediente fiscal Factus ${providerReference}`,
        }));
      }
      const [pdf, xml] = archived;
      await client.query(
        `UPDATE electronic_documents
         SET pdf_document_id = $3::uuid, xml_document_id = $4::uuid,
             pdf_url = '/api/assets/documents/' || $3::text,
             xml_url = '/api/assets/documents/' || $4::text,
             artifacts_synced_at = now(), updated_at = now()
         WHERE id = $1 AND company_id = $2`,
        [documentId, companyId, pdf.id, xml.id],
      );
      await writeAudit(client, {
        tenantId: companyId,
        userId,
        action: 'electronic_billing.artifacts_archived',
        entityType: 'electronic_document',
        entityId: documentId,
        after: {
          providerReference,
          pdfDocumentId: pdf.id,
          xmlDocumentId: xml.id,
          pdfSha256: pdf.sha256,
          xmlSha256: xml.sha256,
        },
        reason: 'PDF y XML fiscales almacenados de forma privada',
      });
      return { pdf, xml };
    });
  } catch (error) {
    await removeStagedArtifacts(staged);
    throw error;
  }
}

function moneyString(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    throw new AppError('Se encontró un valor monetario inválido.', 422, 'FACTUS_AMOUNT_INVALID');
  }
  return amount.toFixed(2);
}

function quantityString(value) {
  const quantity = Number(value);
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new AppError('Se encontró una cantidad inválida.', 422, 'FACTUS_QUANTITY_INVALID');
  }
  return quantity.toFixed(2);
}

function requiredFactusValue(value, label) {
  const normalized = typeof value === 'string' ? value.trim() : String(value || '').trim();
  if (!normalized) {
    throw new AppError(
      `Falta configurar ${label} con un valor validado de Factus V2.`,
      409,
      'FACTUS_REFERENCE_MAPPING_REQUIRED',
    );
  }
  return normalized;
}

function mappingKey(type, internalCode) {
  return `${type}:${String(internalCode || '').trim().toUpperCase()}`;
}

async function buildFactusInvoicePayload(client, record) {
  if (!record.provider_numbering_range_id) {
    throw new AppError(
      'Sincroniza el rango real de Factus antes de transmitir esta factura.',
      409,
      'FACTUS_NUMBERING_RANGE_REQUIRED',
    );
  }
  const [itemsResult, tendersResult, mappingsResult, customerResult] = await Promise.all([
    client.query(
      `SELECT item.product_id, item.sku_snapshot, item.name_snapshot,
              item.quantity, item.unit_price, item.discount_amount,
              item.tax_rate, item.tax_category_id,
              product.electronic_unit_measure_code,
              product.electronic_standard_code,
              tax.code tax_internal_code, tax.treatment tax_treatment
       FROM sale_items item
       JOIN products product
         ON product.id = item.product_id
        AND product.seller_company_id = item.seller_company_id
       LEFT JOIN tax_categories tax
         ON tax.id = item.tax_category_id
        AND tax.tenant_id = item.seller_company_id
       WHERE item.sale_id = $1 AND item.seller_company_id = $2
       ORDER BY item.id`,
      [record.sale_id, record.company_id],
    ),
    client.query(
      `SELECT method, amount, reference
       FROM sale_payment_tenders
       WHERE sale_id = $1 AND seller_company_id = $2
         AND reconciliation_status <> 'REVERSED'
       ORDER BY recorded_at, id`,
      [record.sale_id, record.company_id],
    ),
    client.query(
      `SELECT catalog_type, internal_code, provider_value
       FROM electronic_billing_reference_mappings
       WHERE company_id = $1 AND provider_code = 'FACTUS' AND environment = $2`,
      [record.company_id, record.environment],
    ),
    record.customer_id
      ? client.query(
        `SELECT id, name, document_type, document_number, email, phone, address,
                electronic_identification_code,
                electronic_legal_organization_code, electronic_tribute_code,
                municipality_code, country_code
         FROM customers
         WHERE id = $1 AND tenant_id = $2 AND active = TRUE`,
        [record.customer_id, record.company_id],
      )
      : Promise.resolve({ rows: [] }),
  ]);
  if (!itemsResult.rowCount) {
    throw new AppError('La factura no tiene productos.', 409, 'FACTUS_ITEMS_REQUIRED');
  }
  const mappings = new Map(mappingsResult.rows.map((mapping) => [
    mappingKey(mapping.catalog_type, mapping.internal_code),
    mapping.provider_value,
  ]));
  const mapped = (type, internalCode, label) => requiredFactusValue(
    mappings.get(mappingKey(type, internalCode)),
    label,
  );
  const DEFAULT_CONSUMER_FINAL = {
    electronic_identification_code: '13',
    document_number: '222222222222',
    electronic_legal_organization_code: '2',
    electronic_tribute_code: 'ZY',
    name: 'Consumidor Final',
  };
  const customer = customerResult.rows[0] || record.provider_config?.consumerFinal || DEFAULT_CONSUMER_FINAL;
  const customerIdentification = customer.document_number || customer.identification;
  const customerName = customer.name || customer.names || customer.company;
  const customerPayload = {
    identification_document_code: requiredFactusValue(
      customer.electronic_identification_code || customer.identification_document_code,
      'el tipo de identificación del cliente',
    ),
    identification: requiredFactusValue(customerIdentification, 'la identificación del cliente'),
    legal_organization_code: requiredFactusValue(
      customer.electronic_legal_organization_code || customer.legal_organization_code,
      'el tipo de organización del cliente',
    ),
    tribute_code: requiredFactusValue(
      customer.electronic_tribute_code || customer.tribute_code,
      'el tributo del cliente',
    ),
    ...((customer.company || (customer.id && customerName))
      ? { company: customer.company || customerName }
      : {}),
    ...(customerName ? { names: customerName } : {}),
    ...(customer.trade_name ? { trade_name: customer.trade_name } : {}),
    ...(customer.address ? { address: customer.address } : {}),
    ...(customer.email ? { email: customer.email } : {}),
    ...(customer.phone ? { phone: customer.phone } : {}),
    ...(customer.country_code ? { country_code: customer.country_code } : {}),
    ...(customer.municipality_code ? { municipality_code: customer.municipality_code } : {}),
  };
  const items = itemsResult.rows.map((item) => {
    const rate = Number(item.tax_rate);
    const unitPriceWithTax = Number(item.unit_price);
    const netPrice = rate > 0
      ? unitPriceWithTax / (1 + (rate / 100))
      : unitPriceWithTax;
    return {
      code_reference: requiredFactusValue(item.sku_snapshot, 'el SKU del producto'),
      name: requiredFactusValue(item.name_snapshot, 'el nombre del producto'),
      quantity: quantityString(item.quantity),
      ...(Number(item.discount_amount) > 0
        ? { discount_amount: moneyString(item.discount_amount) }
        : {}),
      price: moneyString(netPrice),
      unit_measure_code: mapped(
        'UNIT_MEASURE',
        item.electronic_unit_measure_code,
        `la unidad de medida del producto ${item.sku_snapshot}`,
      ),
      standard_code: mapped(
        'STANDARD_CODE',
        item.electronic_standard_code,
        `el estándar del producto ${item.sku_snapshot}`,
      ),
      taxes: [{
        code: mapped(
          'TAX',
          item.tax_internal_code,
          `el impuesto del producto ${item.sku_snapshot}`,
        ),
        rate: moneyString(rate),
        ...(item.tax_treatment === 'EXCLUDED' ? { is_excluded: true } : {}),
      }],
    };
  });
  const paymentForm = mapped(
    'PAYMENT_FORM',
    record.sale_terms,
    `la forma de pago ${record.sale_terms}`,
  );
  const sourceTenders = tendersResult.rowCount
    ? tendersResult.rows
    : [{ method: record.payment_method, amount: record.total, reference: null }];
  const paymentDetails = sourceTenders.map((tender) => ({
    payment_form: paymentForm,
    payment_method_code: mapped(
      'PAYMENT_METHOD',
      tender.method,
      `el medio de pago ${tender.method}`,
    ),
    ...(tender.reference ? { reference_code: tender.reference } : {}),
    amount: moneyString(tender.amount),
    ...(record.sale_terms === 'CREDIT'
      ? { due_date: requiredFactusValue(record.due_date, 'la fecha de vencimiento') }
      : {}),
  }));
  return {
    reference_code: `NUBIXOR-${record.id}`,
    document: mapped(
      'DOCUMENT_TYPE',
      record.document_type,
      `el tipo de documento ${record.document_type}`,
    ),
    numbering_range_id: Number(record.provider_numbering_range_id),
    operation_type: mapped(
      'OPERATION_TYPE',
      record.document_type,
      `el tipo de operación ${record.document_type}`,
    ),
    send_email: record.provider_config?.sendEmail === true,
    payment_details: paymentDetails,
    customer: customerPayload,
    items,
  };
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

async function activeFactusAccount(tenantId) {
  const account = await query(
    `SELECT id, company_id, provider_code, display_name, environment, base_url,
            encrypted_credentials, provider_config, connection_status
     FROM electronic_billing_accounts
     WHERE company_id = $1 AND provider_code = 'FACTUS' AND active = TRUE
     ORDER BY updated_at DESC
     LIMIT 1`,
    [tenantId],
  );
  if (!account.rowCount) {
    throw new AppError(
      'Configura una cuenta Factus para esta empresa.',
      409,
      'FACTUS_CONNECTION_REQUIRED',
    );
  }
  return account.rows[0];
}

router.get('/overview', asyncHandler(async (req, res) => {
  const [profile, account, resolutions, documents, counts, contingency] = await Promise.all([
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
              valid_from, valid_until, active, provider_numbering_range_id,
              provider_document_code, provider_synced_at,
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
              document.pdf_document_id, document.xml_document_id,
              document.pdf_url, document.xml_url,
              document.artifacts_synced_at,
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
    query(
      `SELECT id, status, reason, started_at, ended_at, resolution_notes
       FROM electronic_billing_contingencies
       WHERE company_id = $1
       ORDER BY started_at DESC
       LIMIT 1`,
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
    contingency: contingency.rows[0] || null,
    readiness: {
      electronicMode: Boolean(fiscalProfile?.electronic_invoicing_required),
      providerConfigured: Boolean(activeAccount),
      credentialsConfigured: Boolean(
        activeAccount?.credentials_configured || activeAccount?.provider_code === 'SANDBOX',
      ),
      connectionReady: activeAccount?.connection_status === 'READY',
      resolutionReady: Boolean(
        activeResolution &&
        (
          activeAccount?.provider_code !== 'FACTUS' ||
          (
            activeResolution.provider_numbering_range_id &&
            activeResolution.provider_document_code
          )
        )
      ),
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
  const requestedBaseUrl = validateBaseUrl(req.body.baseUrl, environment);
  const baseUrl = providerCode === 'FACTUS'
    ? FACTUS_BASE_URLS[environment]
    : requestedBaseUrl;
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
         provider_config = electronic_billing_accounts.provider_config ||
                           EXCLUDED.provider_config,
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
        {
          adapter: providerCode === 'SANDBOX'
            ? 'sandbox-v1'
            : providerCode === 'FACTUS' ? 'factus-v2' : 'pending',
          documentation: providerCode === 'FACTUS'
            ? 'https://developers.factus.com.co/'
            : null,
        },
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
      `SELECT id, company_id, provider_code, environment, base_url,
              encrypted_credentials, provider_config,
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
    const adapter = createBillingAdapter(current);
    const connectionResult = await adapter.testConnection();
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
      metadata: connectionResult,
      reason: current.provider_code === 'SANDBOX'
        ? 'Prueba controlada sin comunicación DIAN'
        : 'Prueba de conexión mediante adaptador del proveedor',
    });
    return tested.rows[0];
  });
  res.json(result);
}));

router.get('/factus/numbering-ranges', asyncHandler(async (req, res) => {
  const account = await activeFactusAccount(req.context.tenantId);
  const adapter = createBillingAdapter(account);
  const result = await adapter.listNumberingRanges({
    isActive: req.query.active === 'false' ? false : true,
  });
  res.json(result);
}));

router.get('/factus/dian-numbering-ranges', asyncHandler(async (req, res) => {
  const account = await activeFactusAccount(req.context.tenantId);
  const adapter = createBillingAdapter(account);
  res.json(await adapter.listDianNumberingRanges());
}));

router.get('/factus/mappings', asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT id, catalog_type, internal_code, provider_value, provider_label,
            source_url, validated_at, updated_at
     FROM electronic_billing_reference_mappings
     WHERE company_id = $1 AND provider_code = 'FACTUS'
     ORDER BY catalog_type, internal_code`,
    [req.context.tenantId],
  );
  res.json(result.rows);
}));

router.put('/factus/settings', asyncHandler(async (req, res) => {
  const consumerFinal = req.body.consumerFinal;
  const sendEmail = req.body.sendEmail === true;
  if (
    !consumerFinal ||
    typeof consumerFinal !== 'object' ||
    Array.isArray(consumerFinal) ||
    JSON.stringify(consumerFinal).length > 5000
  ) {
    throw new AppError(
      'Configura el perfil validado del consumidor final.',
      422,
      'FACTUS_FINAL_CONSUMER_INVALID',
    );
  }
  const normalized = {
    identification_document_code: requiredFactusValue(
      consumerFinal.identification_document_code,
      'el tipo de identificación del consumidor final',
    ),
    identification: requiredFactusValue(
      consumerFinal.identification,
      'la identificación del consumidor final',
    ),
    legal_organization_code: requiredFactusValue(
      consumerFinal.legal_organization_code,
      'el tipo de organización del consumidor final',
    ),
    tribute_code: requiredFactusValue(
      consumerFinal.tribute_code,
      'el tributo del consumidor final',
    ),
    names: requiredFactusValue(consumerFinal.names, 'el nombre del consumidor final'),
    ...(text(consumerFinal.address, 250) ? { address: text(consumerFinal.address, 250) } : {}),
    ...(text(consumerFinal.email, 254) ? { email: text(consumerFinal.email, 254) } : {}),
    ...(text(consumerFinal.phone, 40) ? { phone: text(consumerFinal.phone, 40) } : {}),
    ...(text(consumerFinal.country_code, 10)
      ? { country_code: text(consumerFinal.country_code, 10) }
      : {}),
    ...(text(consumerFinal.municipality_code, 20)
      ? { municipality_code: text(consumerFinal.municipality_code, 20) }
      : {}),
  };
  const account = await activeFactusAccount(req.context.tenantId);
  const result = await withTransaction(async (client) => {
    const saved = await client.query(
      `UPDATE electronic_billing_accounts
       SET provider_config = provider_config ||
         jsonb_build_object('consumerFinal', $3::jsonb, 'sendEmail', $4::boolean),
           updated_at = now()
       WHERE id = $1 AND company_id = $2
       RETURNING id, provider_code, environment, provider_config, updated_at`,
      [account.id, req.context.tenantId, JSON.stringify(normalized), sendEmail],
    );
    await writeAudit(client, {
      tenantId: req.context.tenantId,
      userId: req.context.userId,
      action: 'electronic_billing.factus_settings_updated',
      entityType: 'electronic_billing_account',
      entityId: account.id,
      after: {
        environment: account.environment,
        consumerFinalConfigured: true,
        sendEmail,
      },
      reason: 'Configuración tributaria de envío Factus V2 por empresa',
    });
    return saved.rows[0];
  });
  res.json(result);
}));

router.put('/factus/mappings/:catalogType/:internalCode', asyncHandler(async (req, res) => {
  const catalogType = String(req.params.catalogType || '').trim().toUpperCase();
  const internalCode = text(req.params.internalCode, 80);
  const providerValue = text(req.body.providerValue, 120);
  const providerLabel = text(req.body.providerLabel, 200);
  const sourceUrl = text(req.body.sourceUrl, 500);
  let parsedSource;
  try {
    parsedSource = new URL(sourceUrl || '');
  } catch {
    parsedSource = null;
  }
  if (
    !FACTUS_CATALOG_TYPES.has(catalogType) ||
    !internalCode ||
    !providerValue ||
    !parsedSource ||
    parsedSource.protocol !== 'https:' ||
    parsedSource.hostname !== 'developers.factus.com.co'
  ) {
    throw new AppError(
      'La equivalencia debe provenir de una tabla oficial de Factus V2.',
      422,
      'FACTUS_MAPPING_INVALID',
    );
  }
  const account = await activeFactusAccount(req.context.tenantId);
  const mapping = await withTransaction(async (client) => {
    const result = await client.query(
      `INSERT INTO electronic_billing_reference_mappings(
         company_id, provider_code, environment, catalog_type, internal_code,
         provider_value, provider_label, source_url, validated_by
       )
       VALUES($1,'FACTUS',$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT(company_id, provider_code, environment, catalog_type, internal_code)
       DO UPDATE SET provider_value = EXCLUDED.provider_value,
                     provider_label = EXCLUDED.provider_label,
                     source_url = EXCLUDED.source_url,
                     validated_at = now(),
                     validated_by = EXCLUDED.validated_by,
                     updated_at = now()
       RETURNING *`,
      [
        req.context.tenantId,
        account.environment,
        catalogType,
        internalCode,
        providerValue,
        providerLabel,
        parsedSource.toString(),
        req.context.userId,
      ],
    );
    await writeAudit(client, {
      tenantId: req.context.tenantId,
      userId: req.context.userId,
      action: 'electronic_billing.factus_mapping_validated',
      entityType: 'electronic_billing_reference_mapping',
      entityId: result.rows[0].id,
      after: result.rows[0],
      reason: 'Equivalencia validada contra documentación oficial Factus V2',
    });
    return result.rows[0];
  });
  res.json(mapping);
}));

router.post('/resolutions', asyncHandler(async (req, res) => {
  const branchId = req.body.branchId;
  const prefix = text(req.body.prefix, 20)?.toUpperCase();
  const numberFrom = Number(req.body.numberFrom);
  const numberTo = Number(req.body.numberTo);
  const validFrom = req.body.validFrom;
  const validUntil = req.body.validUntil;
  const providerNumberingRangeId = req.body.providerNumberingRangeId === null ||
    req.body.providerNumberingRangeId === undefined ||
    req.body.providerNumberingRangeId === ''
    ? null
    : Number(req.body.providerNumberingRangeId);
  const providerDocumentCode = text(req.body.providerDocumentCode, 30);
  const providerSnapshot = req.body.providerSnapshot;
  if (
    providerSnapshot !== undefined &&
    providerSnapshot !== null &&
    (
      typeof providerSnapshot !== 'object' ||
      Array.isArray(providerSnapshot) ||
      JSON.stringify(providerSnapshot).length > 20000
    )
  ) {
    throw new AppError(
      'La evidencia del rango Factus no es válida.',
      422,
      'FACTUS_RANGE_SNAPSHOT_INVALID',
    );
  }
  if (!UUID_PATTERN.test(branchId || '') || !prefix ||
      !Number.isSafeInteger(numberFrom) || numberFrom <= 0 ||
      !Number.isSafeInteger(numberTo) || numberTo < numberFrom ||
      !validDate(validFrom) || !validDate(validUntil) || validUntil < validFrom ||
      (providerNumberingRangeId !== null &&
        (!Number.isSafeInteger(providerNumberingRangeId) || providerNumberingRangeId <= 0))) {
    throw new AppError(
      'La sucursal, prefijo, rango o vigencia de la resolución no son válidos.',
      422,
      'INVALID_BILLING_RESOLUTION',
    );
  }
  const providerCurrent = Number(providerSnapshot?.current);
  const currentNumber = Number.isSafeInteger(providerCurrent) &&
    providerCurrent >= numberFrom &&
    providerCurrent <= numberTo
    ? providerCurrent
    : numberFrom;
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
         current_number, valid_from, valid_until, active,
         provider_numbering_range_id, provider_document_code,
         provider_synced_at, provider_snapshot
       )
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,TRUE,$9,$10,
              CASE WHEN $9::bigint IS NULL THEN NULL ELSE now() END,$11)
       RETURNING *`,
      [
        req.context.tenantId,
        branchId,
        prefix,
        numberFrom,
        numberTo,
        currentNumber,
        validFrom,
        validUntil,
        providerNumberingRangeId,
        providerDocumentCode,
        providerSnapshot || null,
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
              document.company_id,
              sale.total, sale.tax_total, sale.created_at, sale.customer_id,
              sale.sale_terms, sale.due_date, sale.payment_method,
              account.id billing_account_id, account.connection_status,
              account.provider_code, account.environment, account.provider_config,
              resolution.provider_numbering_range_id,
              resolution.provider_document_code
       FROM electronic_documents document
       JOIN sales sale
         ON sale.id = document.sale_id AND sale.company_id = document.company_id
       JOIN electronic_billing_accounts account
         ON account.company_id = document.company_id AND account.active = TRUE
       LEFT JOIN billing_resolutions resolution
         ON resolution.id = document.billing_resolution_id
        AND resolution.company_id = document.company_id
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
    if (record.status === 'ACCEPTED') {
      throw new AppError(
        'El documento ya fue aceptado y no puede volver a transmitirse.',
        409,
        'ELECTRONIC_DOCUMENT_ALREADY_ACCEPTED',
      );
    }
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
    const activeAttempt = await client.query(
      `SELECT id
       FROM electronic_document_transmissions
       WHERE electronic_document_id = $1
         AND status IN ('QUEUED', 'SENDING')
       LIMIT 1`,
      [documentId],
    );
    if (activeAttempt.rowCount) {
      throw new AppError(
        'El documento ya tiene una transmisión activa.',
        409,
        'ELECTRONIC_DOCUMENT_ALREADY_QUEUED',
      );
    }
    const attempts = await client.query(
      `SELECT COALESCE(MAX(attempt_number), 0)::integer + 1 next_attempt
       FROM electronic_document_transmissions
       WHERE electronic_document_id = $1`,
      [documentId],
    );
    const attemptNumber = attempts.rows[0].next_attempt;
    const payload = record.provider_code === 'FACTUS'
      ? await buildFactusInvoicePayload(client, record)
      : {
        schema: 'nubixor-electronic-document-v1',
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
        record.provider_code === 'FACTUS'
          ? `factus:${documentId}:${attemptNumber}`
          : `${documentId}:${attemptNumber}:${randomUUID()}`,
        requestHash,
        payload,
        req.context.userId,
      ],
    );
    await client.query(
      `UPDATE electronic_documents
       SET failure_reason = 'Documento preparado en la cola de transmisión.',
           retry_count = CASE WHEN status = 'REJECTED' THEN retry_count + 1 ELSE retry_count END,
           status = CASE WHEN status = 'REJECTED' THEN 'PENDING' ELSE status END,
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

router.post('/documents/:documentId/process-sandbox', asyncHandler(async (req, res) => {
  const { documentId } = req.params;
  if (!UUID_PATTERN.test(documentId || '')) {
    throw new AppError('El documento no es válido.', 422, 'INVALID_ELECTRONIC_DOCUMENT_ID');
  }
  const result = await withTransaction(async (client) => {
    const transmission = await client.query(
      `SELECT transmission.*, account.provider_code, account.environment,
              document.document_type, document.prefix, document.document_number,
              document.sale_id
       FROM electronic_document_transmissions transmission
       JOIN electronic_billing_accounts account
         ON account.id = transmission.billing_account_id
        AND account.company_id = transmission.company_id
       JOIN electronic_documents document
         ON document.id = transmission.electronic_document_id
        AND document.company_id = transmission.company_id
       WHERE transmission.electronic_document_id = $1
         AND transmission.company_id = $2
         AND transmission.status IN ('QUEUED', 'RETRYABLE')
       ORDER BY transmission.attempt_number DESC
       LIMIT 1
       FOR UPDATE OF transmission`,
      [documentId, req.context.tenantId],
    );
    if (!transmission.rowCount) {
      throw new AppError(
        'No existe una transmisión pendiente para procesar.',
        409,
        'SANDBOX_TRANSMISSION_NOT_QUEUED',
      );
    }
    const record = transmission.rows[0];
    if (record.provider_code !== 'SANDBOX' || record.environment !== 'TEST') {
      throw new AppError(
        'Este procesamiento controlado solo funciona con SANDBOX en ambiente TEST.',
        409,
        'SANDBOX_ONLY_OPERATION',
      );
    }
    const adapter = createBillingAdapter(record);
    const providerResult = await adapter.submitDocument(
      record.payload_snapshot,
      { outcome: req.body?.outcome },
    );
    const accepted = providerResult.status === 'ACCEPTED';
    const providerReference = providerResult.providerReference;
    const verificationPayload = {
      documentId,
      number: `${record.prefix || ''}${record.document_number || ''}`,
      ...providerResult.response,
      providerReference,
      result: providerResult.status,
    };
    const updatedTransmission = await client.query(
      `UPDATE electronic_document_transmissions
       SET status = $2,
           started_at = COALESCE(started_at, now()),
           completed_at = now(),
           provider_reference = $3,
           provider_status = $2,
           http_status = $4,
           response_summary = $5,
           error_code = $6,
           error_message = $7
       WHERE id = $1
       RETURNING *`,
      [
        record.id,
        accepted ? 'ACCEPTED' : 'REJECTED',
        providerReference,
        accepted ? 200 : 422,
        verificationPayload,
        accepted ? null : 'SANDBOX_REJECTION',
        accepted ? null : 'Rechazo solicitado para verificar el flujo de corrección.',
      ],
    );
    await client.query(
      `UPDATE electronic_documents
       SET status = $2,
           provider_reference = $3,
           provider_document_id = $3,
           submitted_at = COALESCE(submitted_at, now()),
           accepted_at = CASE WHEN $2 = 'ACCEPTED' THEN now() ELSE NULL END,
           last_synced_at = now(),
           failure_reason = $4,
           updated_at = now()
       WHERE id = $1`,
      [
        documentId,
        accepted ? 'ACCEPTED' : 'REJECTED',
        providerReference,
        accepted
          ? 'Aceptado únicamente por el simulador SANDBOX; no es una respuesta DIAN.'
          : 'Rechazado por el simulador para probar el flujo de reintento.',
      ],
    );
    await writeAudit(client, {
      tenantId: req.context.tenantId,
      userId: req.context.userId,
      action: accepted
        ? 'electronic_billing.sandbox_accepted'
        : 'electronic_billing.sandbox_rejected',
      entityType: 'electronic_document_transmission',
      entityId: record.id,
      after: verificationPayload,
      reason: 'Procesamiento controlado en ambiente de pruebas',
    });
    return updatedTransmission.rows[0];
  });
  res.json(result);
}));

router.post('/documents/:documentId/process', asyncHandler(async (req, res) => {
  const { documentId } = req.params;
  if (!UUID_PATTERN.test(documentId || '')) {
    throw new AppError('El documento no es válido.', 422, 'INVALID_ELECTRONIC_DOCUMENT_ID');
  }
  const claimed = await withTransaction(async (client) => {
    const transmission = await client.query(
      `SELECT transmission.*, account.company_id account_company_id,
              account.provider_code, account.environment, account.base_url,
              account.encrypted_credentials, account.provider_config
       FROM electronic_document_transmissions transmission
       JOIN electronic_billing_accounts account
         ON account.id = transmission.billing_account_id
        AND account.company_id = transmission.company_id
       WHERE transmission.electronic_document_id = $1
         AND transmission.company_id = $2
         AND transmission.status IN ('QUEUED', 'RETRYABLE')
         AND (transmission.next_attempt_at IS NULL OR transmission.next_attempt_at <= now())
       ORDER BY transmission.attempt_number DESC
       LIMIT 1
       FOR UPDATE OF transmission`,
      [documentId, req.context.tenantId],
    );
    if (!transmission.rowCount) {
      throw new AppError(
        'No existe una transmisión lista para procesar.',
        409,
        'ELECTRONIC_TRANSMISSION_NOT_READY',
      );
    }
    const record = transmission.rows[0];
    if (record.provider_code === 'SANDBOX') {
      throw new AppError(
        'Utiliza la prueba controlada para documentos SANDBOX.',
        409,
        'SANDBOX_PROCESS_ROUTE_REQUIRED',
      );
    }
    await client.query(
      `UPDATE electronic_document_transmissions
       SET status = 'SENDING', started_at = COALESCE(started_at, now()),
           error_code = NULL, error_message = NULL
       WHERE id = $1`,
      [record.id],
    );
    return record;
  });
  try {
    const adapter = createBillingAdapter(claimed);
    const providerResult = await adapter.submitDocument(claimed.payload_snapshot);
    const finalStatus = providerResult.status === 'ACCEPTED' ? 'ACCEPTED' : 'SUBMITTED';
    const result = await withTransaction(async (client) => {
      const updated = await client.query(
        `UPDATE electronic_document_transmissions
         SET status = $2, completed_at = now(), provider_reference = $3,
             provider_status = $2, http_status = $4, response_summary = $5,
             error_code = NULL, error_message = NULL, next_attempt_at = NULL
         WHERE id = $1 AND company_id = $6
         RETURNING *`,
        [
          claimed.id,
          finalStatus,
          providerResult.providerReference,
          finalStatus === 'ACCEPTED' ? 201 : 200,
          providerResult.response,
          req.context.tenantId,
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
          documentId,
          finalStatus,
          providerResult.providerReference,
          providerResult.cufe,
          providerResult.qrUrl,
          req.context.tenantId,
        ],
      );
      await writeAudit(client, {
        tenantId: req.context.tenantId,
        userId: req.context.userId,
        action: finalStatus === 'ACCEPTED'
          ? 'electronic_billing.document_accepted'
          : 'electronic_billing.document_submitted',
        entityType: 'electronic_document_transmission',
        entityId: claimed.id,
        after: {
          electronicDocumentId: documentId,
          provider: claimed.provider_code,
          providerReference: providerResult.providerReference,
          status: finalStatus,
          cufe: providerResult.cufe || null,
        },
        reason: 'Respuesta registrada desde el proveedor tecnológico',
      });
      return updated.rows[0];
    });
    let artifacts = null;
    let artifactWarning = null;
    if (
      finalStatus === 'ACCEPTED' &&
      claimed.provider_code === 'FACTUS' &&
      providerResult.providerReference
    ) {
      try {
        artifacts = await persistFactusDocumentArtifacts({
          adapter,
          companyId: req.context.tenantId,
          documentId,
          providerReference: providerResult.providerReference,
          userId: req.context.userId,
        });
      } catch (artifactError) {
        artifactWarning = artifactError.message;
        await withTransaction(async (client) => {
          await writeAudit(client, {
            tenantId: req.context.tenantId,
            userId: req.context.userId,
            action: 'electronic_billing.artifacts_pending',
            entityType: 'electronic_document',
            entityId: documentId,
            after: {
              providerReference: providerResult.providerReference,
              errorCode: artifactError.code || 'FISCAL_ARTIFACT_SYNC_FAILED',
            },
            reason: artifactError.message,
          });
        });
      }
    }
    res.json({
      ...result,
      artifactsArchived: Boolean(artifacts),
      artifactWarning,
    });
  } catch (error) {
    const providerStatus = Number(error.status) || 503;
    const retryable = [429, 500, 503].includes(providerStatus);
    const retryAfter = Math.max(
      1,
      Math.min(3600, Number(error.retryAfter) || (30 * (2 ** Math.min(claimed.attempt_number, 5)))),
    );
    await withTransaction(async (client) => {
      await client.query(
        `UPDATE electronic_document_transmissions
         SET status = $2, completed_at = now(), http_status = $3,
             response_summary = $4, error_code = $5, error_message = $6,
             next_attempt_at = CASE WHEN $2 = 'RETRYABLE'
               THEN now() + ($7::text || ' seconds')::interval ELSE NULL END
         WHERE id = $1 AND company_id = $8`,
        [
          claimed.id,
          retryable ? 'RETRYABLE' : 'REJECTED',
          providerStatus,
          error.providerResponse || null,
          error.code || 'FACTUS_PROCESSING_ERROR',
          error.message,
          retryAfter,
          req.context.tenantId,
        ],
      );
      await client.query(
        `UPDATE electronic_documents
         SET status = $2, failure_reason = $3, retry_count = retry_count + 1,
             last_synced_at = now(), updated_at = now()
         WHERE id = $1 AND company_id = $4`,
        [
          documentId,
          retryable ? 'PENDING' : 'REJECTED',
          error.message,
          req.context.tenantId,
        ],
      );
      await writeAudit(client, {
        tenantId: req.context.tenantId,
        userId: req.context.userId,
        action: retryable
          ? 'electronic_billing.document_retry_scheduled'
          : 'electronic_billing.document_rejected',
        entityType: 'electronic_document_transmission',
        entityId: claimed.id,
        after: {
          electronicDocumentId: documentId,
          provider: claimed.provider_code,
          httpStatus: providerStatus,
          retryable,
          retryAfter: retryable ? retryAfter : null,
          errorCode: error.code || null,
        },
        reason: 'Error controlado durante la transmisión al proveedor',
      });
    });
    throw error;
  }
}));

router.post('/documents/:documentId/sync-artifacts', asyncHandler(async (req, res) => {
  const { documentId } = req.params;
  if (!UUID_PATTERN.test(documentId || '')) {
    throw new AppError(
      'El documento electrónico no es válido.',
      422,
      'INVALID_ELECTRONIC_DOCUMENT_ID',
    );
  }
  const result = await query(
    `SELECT document.id, document.provider_reference,
            document.pdf_document_id, document.xml_document_id,
            account.id account_id, account.company_id, account.provider_code,
            account.environment, account.base_url, account.encrypted_credentials,
            account.provider_config
     FROM electronic_documents document
     JOIN electronic_billing_accounts account
       ON account.company_id = document.company_id
      AND account.provider_code = 'FACTUS'
      AND account.active = TRUE
     WHERE document.id = $1 AND document.company_id = $2
       AND document.status = 'ACCEPTED'
     ORDER BY account.updated_at DESC
     LIMIT 1`,
    [documentId, req.context.tenantId],
  );
  if (!result.rowCount || !result.rows[0].provider_reference) {
    throw new AppError(
      'La factura debe estar aceptada por Factus antes de recuperar sus archivos.',
      409,
      'FACTUS_ACCEPTED_DOCUMENT_REQUIRED',
    );
  }
  const record = result.rows[0];
  if (record.pdf_document_id && record.xml_document_id) {
    return res.json({
      alreadyArchived: true,
      pdfDocumentId: record.pdf_document_id,
      xmlDocumentId: record.xml_document_id,
    });
  }
  const artifacts = await persistFactusDocumentArtifacts({
    adapter: createBillingAdapter({
      id: record.account_id,
      company_id: record.company_id,
      provider_code: record.provider_code,
      environment: record.environment,
      base_url: record.base_url,
      encrypted_credentials: record.encrypted_credentials,
      provider_config: record.provider_config,
    }),
    companyId: req.context.tenantId,
    documentId,
    providerReference: record.provider_reference,
    userId: req.context.userId,
  });
  res.json({
    alreadyArchived: false,
    pdfDocumentId: artifacts.pdf.id,
    xmlDocumentId: artifacts.xml.id,
  });
}));

router.post('/contingencies', asyncHandler(async (req, res) => {
  const reason = text(req.body.reason, 1000);
  if (!reason) {
    throw new AppError(
      'Explica la causa de la contingencia.',
      422,
      'CONTINGENCY_REASON_REQUIRED',
    );
  }
  const result = await withTransaction(async (client) => {
    const account = await client.query(
      `SELECT id FROM electronic_billing_accounts
       WHERE company_id = $1 AND active = TRUE
       ORDER BY updated_at DESC LIMIT 1`,
      [req.context.tenantId],
    );
    const contingency = await client.query(
      `INSERT INTO electronic_billing_contingencies(
         company_id, billing_account_id, reason, created_by
       )
       VALUES($1,$2,$3,$4)
       RETURNING *`,
      [
        req.context.tenantId,
        account.rows[0]?.id || null,
        reason,
        req.context.userId,
      ],
    );
    await writeAudit(client, {
      tenantId: req.context.tenantId,
      userId: req.context.userId,
      action: 'electronic_billing.contingency_started',
      entityType: 'electronic_billing_contingency',
      entityId: contingency.rows[0].id,
      after: contingency.rows[0],
      reason,
    });
    return contingency.rows[0];
  });
  res.status(201).json(result);
}));

router.post('/contingencies/:contingencyId/close', asyncHandler(async (req, res) => {
  const { contingencyId } = req.params;
  const notes = text(req.body.resolutionNotes, 1000);
  if (!UUID_PATTERN.test(contingencyId || '') || !notes) {
    throw new AppError(
      'Indica la contingencia y cómo fue resuelta.',
      422,
      'INVALID_CONTINGENCY_CLOSE',
    );
  }
  const result = await withTransaction(async (client) => {
    const contingency = await client.query(
      `UPDATE electronic_billing_contingencies
       SET status = 'CLOSED', ended_at = now(), resolution_notes = $3,
           closed_by = $4, updated_at = now()
       WHERE id = $1 AND company_id = $2 AND status = 'OPEN'
       RETURNING *`,
      [contingencyId, req.context.tenantId, notes, req.context.userId],
    );
    if (!contingency.rowCount) {
      throw new AppError(
        'La contingencia no existe o ya fue cerrada.',
        404,
        'OPEN_CONTINGENCY_NOT_FOUND',
      );
    }
    await writeAudit(client, {
      tenantId: req.context.tenantId,
      userId: req.context.userId,
      action: 'electronic_billing.contingency_closed',
      entityType: 'electronic_billing_contingency',
      entityId: contingencyId,
      after: contingency.rows[0],
      reason: notes,
    });
    return contingency.rows[0];
  });
  res.json(result);
}));

export async function autoProcessElectronicDocument({ tenantId, userId, documentId }) {
  if (!UUID_PATTERN.test(documentId || '')) return null;
  try {
    const account = await query(
      `SELECT id, provider_code, environment, connection_status
       FROM electronic_billing_accounts
       WHERE company_id = $1 AND active = TRUE
       ORDER BY updated_at DESC LIMIT 1`,
      [tenantId],
    );
    if (!account.rowCount || account.rows[0].connection_status !== 'READY') {
      return null;
    }
    const acc = account.rows[0];

    await withTransaction(async (client) => {
      const docRes = await client.query(
        `SELECT id, status, prefix, document_number, sale_id, document_type, billing_resolution_id, customer_id
         FROM electronic_documents
         WHERE id = $1 AND company_id = $2
         FOR UPDATE`,
        [documentId, tenantId],
      );
      if (!docRes.rowCount || docRes.rows[0].status === 'ACCEPTED') return;
      const record = docRes.rows[0];

      const activeAttempt = await client.query(
        `SELECT id FROM electronic_document_transmissions
         WHERE electronic_document_id = $1 AND status IN ('QUEUED', 'SENDING')`,
        [documentId],
      );
      if (activeAttempt.rowCount) return;

      const attempts = await client.query(
        `SELECT COALESCE(MAX(attempt_number), 0)::integer + 1 next_attempt
         FROM electronic_document_transmissions WHERE electronic_document_id = $1`,
        [documentId],
      );
      const attemptNumber = attempts.rows[0].next_attempt;

      const docAccount = await client.query(
        `SELECT account.id billing_account_id, account.provider_code, account.environment,
                account.provider_config, resolution.provider_numbering_range_id,
                sale.total, sale.tax_total, sale.created_at, sale.sale_terms, sale.due_date, sale.payment_method
         FROM electronic_billing_accounts account
         LEFT JOIN billing_resolutions resolution ON resolution.id = $1
         JOIN sales sale ON sale.id = $2 AND sale.company_id = $3
         WHERE account.id = $4 AND account.company_id = $3`,
        [record.billing_resolution_id, record.sale_id, tenantId, acc.id],
      );
      if (!docAccount.rowCount) return;
      const fullRecord = { ...record, ...docAccount.rows[0], company_id: tenantId };

      const payload = acc.provider_code === 'FACTUS'
        ? await buildFactusInvoicePayload(client, fullRecord)
        : {
            schema: 'nubixor-electronic-document-v1',
            companyId: tenantId,
            documentId,
            documentType: record.document_type,
            number: `${record.prefix}${record.document_number}`,
            saleId: record.sale_id,
          };

      const requestHash = createHash('sha256').update(JSON.stringify(payload)).digest('hex');
      await client.query(
        `INSERT INTO electronic_document_transmissions(
           company_id, electronic_document_id, billing_account_id,
           attempt_number, idempotency_key, status, request_hash,
           payload_snapshot, created_by
         )
         VALUES($1,$2,$3,$4,$5,'QUEUED',$6,$7,$8)`,
        [
          tenantId,
          documentId,
          acc.id,
          attemptNumber,
          `factus:${documentId}:${attemptNumber}`,
          requestHash,
          payload,
          userId,
        ],
      );
    });

    if (acc.provider_code === 'SANDBOX') {
      const claimed = await withTransaction(async (client) => {
        const tr = await client.query(
          `SELECT transmission.*, account.provider_code, account.environment
           FROM electronic_document_transmissions transmission
           JOIN electronic_billing_accounts account ON account.id = transmission.billing_account_id
           WHERE transmission.electronic_document_id = $1 AND transmission.company_id = $2
             AND transmission.status IN ('QUEUED', 'RETRYABLE')
           ORDER BY transmission.attempt_number DESC LIMIT 1 FOR UPDATE`,
          [documentId, tenantId],
        );
        return tr.rows[0] || null;
      });
      if (claimed) {
        const adapter = createBillingAdapter(claimed);
        const providerResult = await adapter.submitDocument(claimed.payload_snapshot, { outcome: 'ACCEPTED' });
        await withTransaction(async (client) => {
          await client.query(
            `UPDATE electronic_document_transmissions
             SET status = 'ACCEPTED', completed_at = now(), provider_reference = $2, provider_status = 'ACCEPTED', http_status = 200
             WHERE id = $1`,
            [claimed.id, providerResult.providerReference],
          );
          await client.query(
            `UPDATE electronic_documents
             SET status = 'ACCEPTED', provider_reference = $2, provider_document_id = $2, cufe = $3, qr_url = $4, accepted_at = now(), last_synced_at = now()
             WHERE id = $1`,
            [documentId, providerResult.providerReference, providerResult.cufe, providerResult.qrUrl],
          );
        });
      }
    } else if (acc.provider_code === 'FACTUS') {
      const claimed = await withTransaction(async (client) => {
        const tr = await client.query(
          `SELECT transmission.*, account.company_id account_company_id,
                  account.provider_code, account.environment, account.base_url,
                  account.encrypted_credentials, account.provider_config
           FROM electronic_document_transmissions transmission
           JOIN electronic_billing_accounts account ON account.id = transmission.billing_account_id
           WHERE transmission.electronic_document_id = $1 AND transmission.company_id = $2
             AND transmission.status IN ('QUEUED', 'RETRYABLE')
           ORDER BY transmission.attempt_number DESC LIMIT 1 FOR UPDATE`,
          [documentId, tenantId],
        );
        if (!tr.rowCount) return null;
        const rec = tr.rows[0];
        await client.query(
          `UPDATE electronic_document_transmissions SET status = 'SENDING', started_at = COALESCE(started_at, now()) WHERE id = $1`,
          [rec.id],
        );
        return rec;
      });
      if (claimed) {
        try {
          const adapter = createBillingAdapter(claimed);
          const providerResult = await adapter.submitDocument(claimed.payload_snapshot);
          const finalStatus = providerResult.status === 'ACCEPTED' ? 'ACCEPTED' : 'SUBMITTED';
          await withTransaction(async (client) => {
            await client.query(
              `UPDATE electronic_document_transmissions
               SET status = $2, completed_at = now(), provider_reference = $3, provider_status = $2, http_status = 200, response_summary = $4
               WHERE id = $1`,
              [claimed.id, finalStatus, providerResult.providerReference, providerResult.response],
            );
            await client.query(
              `UPDATE electronic_documents
               SET status = $2, provider_reference = $3, provider_document_id = $3, cufe = $4, qr_url = $5, accepted_at = CASE WHEN $2 = 'ACCEPTED' THEN now() ELSE accepted_at END, last_synced_at = now()
               WHERE id = $1`,
              [documentId, finalStatus, providerResult.providerReference, providerResult.cufe, providerResult.qrUrl],
            );
          });
        } catch (err) {
          await withTransaction(async (client) => {
            await client.query(
              `UPDATE electronic_document_transmissions
               SET status = 'REJECTED', completed_at = now(), http_status = $2, error_message = $3
               WHERE id = $1`,
              [claimed.id, err.status || 500, err.message],
            );
            await client.query(
              `UPDATE electronic_documents
               SET status = 'REJECTED', failure_reason = $2, updated_at = now()
               WHERE id = $1`,
              [documentId, err.message],
            );
          });
        }
      }
    }

    const finalDoc = await query(
      `SELECT id, status, provider_reference, cufe, qr_url, failure_reason FROM electronic_documents WHERE id = $1`,
      [documentId],
    );
    return finalDoc.rows[0] || null;
  } catch (err) {
    console.error('Error auto-processing electronic document:', err);
    return null;
  }
}

export default router;
