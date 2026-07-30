import { Router } from 'express';
import { query, withTransaction } from '../db.js';
import { bootstrapTenantAccess } from '../authorization.js';
import { writeAudit } from '../audit.js';
import {
  insertStagedArtifact,
  removeStagedArtifacts,
  stageSecureArtifact,
} from '../secure-storage.js';
import { asyncHandler } from '../shared/async-handler.js';
import { AppError } from '../shared/errors.js';

const router = Router();
const BILLING_MODES = new Set(['ELECTRONIC_INVOICE', 'INTERNAL_RECEIPT']);
const UUID_PATTERN = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const TAXPAYER_TYPES = new Set(['NATURAL_PERSON', 'LEGAL_ENTITY']);
const VAT_RESPONSIBILITIES = new Set(['RESPONSIBLE', 'NOT_RESPONSIBLE']);
const TAX_REGIMES = new Set(['ORDINARY', 'SIMPLE', 'NOT_APPLICABLE']);
const DOCUMENT_TYPES = new Set([
  'ELECTRONIC_INVOICE',
  'EQUIVALENT_DOCUMENT',
  'INTERNAL_RECEIPT',
  'OTHER_CONFIGURED_DOCUMENT',
]);
const VALIDATION_STATUSES = new Set(['VALIDATED', 'OBSERVED']);
const LOGO_DATA_PATTERN =
  /^data:(image\/(?:jpeg|png|webp));base64,([a-z0-9+/=\s]+)$/i;
const MAX_LOGO_BYTES = 2 * 1024 * 1024;

function hasValidLogoSignature(contentType, buffer) {
  if (contentType === 'image/jpeg') {
    return buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
  }
  if (contentType === 'image/png') {
    return buffer.subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }
  if (contentType === 'image/webp') {
    return buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  }
  return false;
}

router.get('/', asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT t.id, t.legal_name, t.trade_name, t.tax_id, t.status, t.created_at,
            t.logo_document_id,
            CASE WHEN t.logo_document_id IS NOT NULL
              THEN '/api/assets/documents/' || t.logo_document_id::text
              ELSE NULL
            END logo_url,
            ctp.electronic_invoicing_required, ctp.default_document_type,
            ctp.taxpayer_type, ctp.vat_responsibility, ctp.tax_regime,
            ctp.validation_status, ctp.validation_notes, ctp.validated_at,
            ctp.rut_document_id,
            EXISTS(
              SELECT 1 FROM electronic_billing_accounts account
              WHERE account.company_id = t.id AND account.active = TRUE
            ) billing_account_configured,
            EXISTS(
              SELECT 1 FROM billing_resolutions resolution
              WHERE resolution.company_id = t.id AND resolution.active = TRUE
                AND CURRENT_DATE BETWEEN resolution.valid_from AND resolution.valid_until
                AND resolution.current_number <= resolution.number_to
            ) billing_resolution_configured
     FROM tenants t
     JOIN tenant_users tu ON tu.tenant_id = t.id
     LEFT JOIN company_tax_profiles ctp ON ctp.company_id = t.id
     WHERE tu.user_id = $1
       AND tu.status = 'ACTIVE'
       AND t.status = 'ACTIVE'
     ORDER BY t.legal_name`,
    [req.context.userId],
  );
  res.json(result.rows);
}));

router.post('/:id/logo', asyncHandler(async (req, res) => {
  if (!UUID_PATTERN.test(req.params.id) || req.params.id !== req.context.tenantId) {
    throw new AppError(
      'Solo puedes cambiar el logo de la empresa activa.',
      403,
      'COMPANY_LOGO_SCOPE_INVALID',
    );
  }
  const fileName = typeof req.body?.fileName === 'string'
    ? req.body.fileName.trim().slice(0, 240)
    : '';
  const match = typeof req.body?.dataUrl === 'string'
    ? req.body.dataUrl.match(LOGO_DATA_PATTERN)
    : null;
  if (!fileName || !match) {
    throw new AppError(
      'Selecciona un logo PNG, JPG o WEBP.',
      422,
      'COMPANY_LOGO_INVALID',
    );
  }
  const contentType = match[1].toLowerCase();
  const buffer = Buffer.from(match[2].replace(/\s/g, ''), 'base64');
  if (
    !buffer.length ||
    buffer.length > MAX_LOGO_BYTES ||
    !hasValidLogoSignature(contentType, buffer)
  ) {
    throw new AppError(
      'El logo debe ser PNG, JPG o WEBP válido y pesar máximo 2 MB.',
      422,
      'COMPANY_LOGO_FILE_INVALID',
    );
  }
  const company = await query(
    `SELECT id, legal_name, logo_document_id
     FROM tenants
     WHERE id = $1 AND status = 'ACTIVE'`,
    [req.params.id],
  );
  if (!company.rowCount) {
    throw new AppError('Empresa no encontrada.', 404, 'COMPANY_NOT_FOUND');
  }
  const staged = await stageSecureArtifact({
    tenantId: req.params.id,
    buffer,
    contentType,
    originalName: fileName,
  });
  try {
    const result = await withTransaction(async (client) => {
      const document = await insertStagedArtifact(client, {
        artifact: staged,
        tenantId: req.params.id,
        userId: req.context.userId,
        category: 'OTHER',
        description: `Logo corporativo de ${company.rows[0].legal_name}`,
      });
      await client.query(
        `UPDATE tenants
         SET logo_document_id = $2, updated_at = now()
         WHERE id = $1`,
        [req.params.id, document.id],
      );
      await writeAudit(client, {
        tenantId: req.params.id,
        userId: req.context.userId,
        action: 'company.logo_updated',
        entityType: 'company',
        entityId: req.params.id,
        before: { logoDocumentId: company.rows[0].logo_document_id },
        after: {
          logoDocumentId: document.id,
          contentType: document.content_type,
          byteSize: document.byte_size,
          sha256: document.sha256,
        },
        reason: 'Actualización de identidad visual de la empresa',
      });
      return document;
    });
    res.status(201).json({
      logo_document_id: result.id,
      logo_url: `/api/assets/documents/${result.id}`,
      content_type: result.content_type,
      byte_size: result.byte_size,
    });
  } catch (error) {
    await removeStagedArtifacts([staged]);
    throw error;
  }
}));

router.delete('/:id/logo', asyncHandler(async (req, res) => {
  if (!UUID_PATTERN.test(req.params.id) || req.params.id !== req.context.tenantId) {
    throw new AppError(
      'Solo puedes cambiar el logo de la empresa activa.',
      403,
      'COMPANY_LOGO_SCOPE_INVALID',
    );
  }
  const result = await withTransaction(async (client) => {
    const company = await client.query(
      `SELECT id, logo_document_id
       FROM tenants
       WHERE id = $1 AND status = 'ACTIVE'
       FOR UPDATE`,
      [req.params.id],
    );
    if (!company.rowCount) {
      throw new AppError('Empresa no encontrada.', 404, 'COMPANY_NOT_FOUND');
    }
    await client.query(
      `UPDATE tenants
       SET logo_document_id = NULL, updated_at = now()
       WHERE id = $1`,
      [req.params.id],
    );
    await writeAudit(client, {
      tenantId: req.params.id,
      userId: req.context.userId,
      action: 'company.logo_removed',
      entityType: 'company',
      entityId: req.params.id,
      before: { logoDocumentId: company.rows[0].logo_document_id },
      after: { logoDocumentId: null },
      reason: 'Logo retirado de la identidad visual activa',
    });
    return company.rows[0];
  });
  res.json({ removed: Boolean(result.logo_document_id) });
}));

router.post('/', asyncHandler(async (req, res) => {
  const {
    legalName,
    tradeName = null,
    taxId = null,
    billingMode = 'INTERNAL_RECEIPT',
  } = req.body;
  const normalizedLegalName = typeof legalName === 'string' ? legalName.trim() : '';
  const normalizedTradeName = typeof tradeName === 'string' ? tradeName.trim() || null : null;
  const normalizedTaxId = typeof taxId === 'string' ? taxId.trim() || null : null;
  const normalizedBillingMode = typeof billingMode === 'string'
    ? billingMode.trim().toUpperCase()
    : '';
  if (!normalizedLegalName) {
    return res.status(422).json({ error: 'legalName es obligatorio.' });
  }
  if (
    normalizedLegalName.length > 160 ||
    normalizedTradeName?.length > 160 ||
    normalizedTaxId?.length > 40
  ) {
    return res.status(422).json({ error: 'Uno o más campos superan la longitud permitida.' });
  }
  if (!BILLING_MODES.has(normalizedBillingMode)) {
    return res.status(422).json({ error: 'El modo de facturación no es válido.' });
  }

  const company = await withTransaction(async (client) => {
    const result = await client.query(
      `INSERT INTO tenants(legal_name, trade_name, tax_id)
       VALUES($1,$2,$3)
       RETURNING id, legal_name, trade_name, tax_id, status, created_at`,
      [normalizedLegalName, normalizedTradeName, normalizedTaxId],
    );
    const companyRecord = result.rows[0];
    await bootstrapTenantAccess(client, {
      tenantId: companyRecord.id,
      ownerUserId: req.context.userId,
    });

    const electronic = normalizedBillingMode === 'ELECTRONIC_INVOICE';
    await client.query(
      `UPDATE company_tax_profiles
       SET taxpayer_type = $2,
           electronic_invoicing_required = $3,
           default_document_type = $4,
           vat_responsibility = $5,
           tax_regime = 'PENDING_ACCOUNTING_REVIEW',
           updated_at = now()
       WHERE company_id = $1`,
      [
        companyRecord.id,
        electronic
          ? 'LEGAL_OR_NATURAL_PERSON_TO_CONFIRM'
          : 'NATURAL_OR_LEGAL_PERSON_TO_CONFIRM',
        electronic,
        normalizedBillingMode,
        electronic ? 'RESPONSIBLE_STATUS_TO_CONFIRM' : 'RESPONSIBILITY_TO_CONFIRM',
      ],
    );
    const branch = await client.query(
      `INSERT INTO branches(tenant_id, name, code)
       VALUES($1,'Principal','MAIN')
       RETURNING id, name, code`,
      [companyRecord.id],
    );
    const warehouse = await client.query(
      `INSERT INTO warehouses(tenant_id, branch_id, name, code, warehouse_type)
       VALUES($1,$2,'Bodega principal','MAIN','AVAILABLE')
       RETURNING id, name, code, warehouse_type`,
      [companyRecord.id, branch.rows[0].id],
    );
    const displayWarehouse = await client.query(
      `INSERT INTO warehouses(tenant_id, branch_id, name, code, warehouse_type)
       VALUES($1,$2,'Exhibición principal','EXH-01','DISPLAY')
       RETURNING id, name, code, warehouse_type`,
      [companyRecord.id, branch.rows[0].id],
    );
    const register = await client.query(
      `INSERT INTO cash_registers(tenant_id, branch_id, name, code)
       VALUES($1,$2,'Caja principal','CAJA-01')
       RETURNING id, name, code`,
      [companyRecord.id, branch.rows[0].id],
    );
    await client.query(
      `INSERT INTO cash_register_companies(
         cash_register_id, company_id, default_warehouse_id
       )
       VALUES($1,$2,$3)
       ON CONFLICT DO NOTHING`,
      [register.rows[0].id, companyRecord.id, displayWarehouse.rows[0].id],
    );
    await client.query(
      `INSERT INTO tax_categories(
         tenant_id, code, name, treatment, rate, dian_code
       )
       VALUES
         ($1,'IVA19','IVA 19%','TAXED',19,'01'),
         ($1,'IVA5','IVA 5%','TAXED',5,'01'),
         ($1,'EXCL','Excluido','EXCLUDED',0,NULL)
       ON CONFLICT(tenant_id, code) DO NOTHING`,
      [companyRecord.id],
    );
    await writeAudit(client, {
      tenantId: companyRecord.id,
      userId: req.context.userId,
      action: 'company.operational_setup_created',
      entityType: 'company',
      entityId: companyRecord.id,
      after: {
        company: companyRecord,
        billingMode: normalizedBillingMode,
        branch: branch.rows[0],
        warehouse: warehouse.rows[0],
        displayWarehouse: displayWarehouse.rows[0],
        register: register.rows[0],
      },
      reason: 'Alta guiada de empresa con estructura operativa inicial',
    });

    return {
      ...companyRecord,
      default_document_type: normalizedBillingMode,
      electronic_invoicing_required: electronic,
      setup: {
        branch: branch.rows[0],
        warehouse: warehouse.rows[0],
        displayWarehouse: displayWarehouse.rows[0],
        register: register.rows[0],
        standardTaxes: 3,
      },
    };
  });
  res.status(201).json(company);
}));

router.put('/:id/tax-profile', asyncHandler(async (req, res) => {
  if (!UUID_PATTERN.test(req.params.id) || req.params.id !== req.context.tenantId) {
    throw new AppError(
      'Solo puedes validar el perfil tributario de la empresa activa.',
      403,
      'TAX_PROFILE_COMPANY_SCOPE',
    );
  }
  const taxpayerType = String(req.body?.taxpayerType || '').trim().toUpperCase();
  const vatResponsibility =
    String(req.body?.vatResponsibility || '').trim().toUpperCase();
  const taxRegime = String(req.body?.taxRegime || '').trim().toUpperCase();
  const defaultDocumentType =
    String(req.body?.defaultDocumentType || '').trim().toUpperCase();
  const validationStatus =
    String(req.body?.validationStatus || '').trim().toUpperCase();
  const validationNotes = String(req.body?.validationNotes || '').trim();
  const rutDocumentId = req.body?.rutDocumentId || null;
  const electronicInvoicingRequired = Boolean(req.body?.electronicInvoicingRequired);
  if (!TAXPAYER_TYPES.has(taxpayerType) ||
      !VAT_RESPONSIBILITIES.has(vatResponsibility) ||
      !TAX_REGIMES.has(taxRegime) ||
      !DOCUMENT_TYPES.has(defaultDocumentType) ||
      !VALIDATION_STATUSES.has(validationStatus) ||
      validationNotes.length < 10 ||
      (rutDocumentId && !UUID_PATTERN.test(rutDocumentId))) {
    throw new AppError(
      'Completa el tipo de contribuyente, régimen, responsabilidad, documento y soporte de validación.',
      422,
      'INVALID_TAX_PROFILE_VALIDATION',
    );
  }
  if (electronicInvoicingRequired &&
      defaultDocumentType !== 'ELECTRONIC_INVOICE') {
    throw new AppError(
      'Una empresa obligada a facturar electrónicamente debe usar factura electrónica.',
      422,
      'INCONSISTENT_BILLING_MODE',
    );
  }
  const profile = await withTransaction(async (client) => {
    const current = await client.query(
      `SELECT * FROM company_tax_profiles
       WHERE company_id = $1 FOR UPDATE`,
      [req.params.id],
    );
    if (!current.rowCount) {
      throw new AppError('Perfil tributario no encontrado.', 404, 'TAX_PROFILE_NOT_FOUND');
    }
    if (rutDocumentId) {
      const rut = await client.query(
        `SELECT 1 FROM secure_documents
         WHERE id = $1 AND tenant_id = $2 AND category = 'RUT'`,
        [rutDocumentId, req.params.id],
      );
      if (!rut.rowCount) {
        throw new AppError(
          'El soporte RUT no pertenece a esta empresa.',
          422,
          'RUT_DOCUMENT_SCOPE_INVALID',
        );
      }
    }
    const result = await client.query(
      `UPDATE company_tax_profiles
       SET taxpayer_type = $2,
           electronic_invoicing_required = $3,
           default_document_type = $4,
           vat_responsibility = $5,
           tax_regime = $6,
           validation_status = $7,
           validation_notes = $8,
           validated_by = $9,
           validated_at = now(),
           rut_document_id = $10,
           updated_at = now()
       WHERE company_id = $1
       RETURNING *`,
      [
        req.params.id,
        taxpayerType,
        electronicInvoicingRequired,
        defaultDocumentType,
        vatResponsibility,
        taxRegime,
        validationStatus,
        validationNotes,
        req.context.userId,
        rutDocumentId,
      ],
    );
    await writeAudit(client, {
      tenantId: req.params.id,
      userId: req.context.userId,
      action: 'company.tax_profile_validated',
      entityType: 'company_tax_profile',
      entityId: req.params.id,
      before: current.rows[0],
      after: result.rows[0],
      reason: validationNotes,
    });
    return result.rows[0];
  });
  res.json(profile);
}));

export default router;
