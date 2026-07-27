import { Router } from 'express';
import { query, withTransaction } from '../db.js';
import { bootstrapTenantAccess } from '../authorization.js';
import { writeAudit } from '../audit.js';
import { asyncHandler } from '../shared/async-handler.js';

const router = Router();
const BILLING_MODES = new Set(['ELECTRONIC_INVOICE', 'INTERNAL_RECEIPT']);

router.get('/', asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT t.id, t.legal_name, t.trade_name, t.tax_id, t.status, t.created_at,
            ctp.electronic_invoicing_required, ctp.default_document_type,
            ctp.taxpayer_type, ctp.vat_responsibility, ctp.tax_regime,
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
       RETURNING id, name, code`,
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
      [register.rows[0].id, companyRecord.id, warehouse.rows[0].id],
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
        register: register.rows[0],
        standardTaxes: 3,
      },
    };
  });
  res.status(201).json(company);
}));

export default router;
