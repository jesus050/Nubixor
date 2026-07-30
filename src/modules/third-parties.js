import { Router } from 'express';
import { query, withTransaction } from '../db.js';
import { requireTenant } from '../middleware.js';
import { requireAnyPermission, requirePermission } from '../authorization.js';
import { asyncHandler } from '../shared/async-handler.js';
import { AppError } from '../shared/errors.js';
import { writeAudit } from '../audit.js';

const router = Router();
const UUID_PATTERN = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const DOCUMENT_TYPES = new Set(['NIT', 'CC', 'CE', 'PASSPORT', 'OTHER']);
const PARTY_TYPES = new Set(['PERSON', 'ORGANIZATION']);
const ROLE_FILTERS = new Set(['ALL', 'CUSTOMER', 'SUPPLIER', 'BOTH']);

router.use(requireTenant);

function text(value, maxLength) {
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

function validateEmail(email) {
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AppError(
      'El correo del tercero no es válido.',
      422,
      'INVALID_PARTY_EMAIL',
    );
  }
}

function normalizePayload(body) {
  const name = text(body.name, 160);
  const partyType = text(body.partyType, 20)?.toUpperCase() || 'ORGANIZATION';
  const documentType = text(body.documentType, 20)?.toUpperCase() || 'NIT';
  const documentNumber = text(body.documentNumber, 40);
  const email = text(body.email, 160);
  const roles = new Set(
    Array.isArray(body.roles)
      ? body.roles.map((role) => String(role).toUpperCase())
      : [
        body.isCustomer ? 'CUSTOMER' : null,
        body.isSupplier ? 'SUPPLIER' : null,
      ].filter(Boolean),
  );

  if (!name) {
    throw new AppError(
      'El nombre o razón social es obligatorio.',
      422,
      'PARTY_NAME_REQUIRED',
    );
  }
  if (!PARTY_TYPES.has(partyType) || !DOCUMENT_TYPES.has(documentType)) {
    throw new AppError(
      'El tipo de tercero o documento no es válido.',
      422,
      'INVALID_PARTY_IDENTITY',
    );
  }
  if (![...roles].every((role) => ['CUSTOMER', 'SUPPLIER'].includes(role)) ||
      !roles.size) {
    throw new AppError(
      'Selecciona si el tercero es cliente, proveedor o ambos.',
      422,
      'PARTY_ROLE_REQUIRED',
    );
  }
  if (roles.size > 1 && !documentNumber) {
    throw new AppError(
      'Para usar un tercero como cliente y proveedor debes registrar su documento.',
      422,
      'DUAL_PARTY_DOCUMENT_REQUIRED',
    );
  }
  validateEmail(email);
  const paymentTermsDays = Number(body.paymentTermsDays || 0);
  if (!Number.isInteger(paymentTermsDays) ||
      paymentTermsDays < 0 || paymentTermsDays > 3650) {
    throw new AppError(
      'El plazo de pago debe expresarse en días válidos.',
      422,
      'INVALID_PAYMENT_TERMS',
    );
  }
  return {
    name,
    partyType,
    tradeName: text(body.tradeName, 160),
    documentType,
    documentNumber,
    verificationDigit: text(body.verificationDigit, 2),
    email,
    phone: text(body.phone, 40),
    address: text(body.address, 240),
    municipalityCode: text(body.municipalityCode, 12),
    notes: text(body.notes, 1000),
    roles,
    paymentTermsDays,
    obligatedToInvoice: Boolean(body.obligatedToInvoice),
    electronicInvoicer: Boolean(body.electronicInvoicer),
  };
}

const partyProjection = `
  party.id, party.party_type, party.name, party.trade_name,
  party.document_type, party.document_number, party.verification_digit,
  party.email, party.phone, party.address, party.municipality_code,
  party.notes, party.is_customer, party.is_supplier,
  party.customer_id, party.supplier_id, party.active,
  party.created_at, party.updated_at,
  supplier.obligated_to_invoice, supplier.electronic_invoicer,
  supplier.payment_terms_days,
  COALESCE(receivable.outstanding, 0) receivable_balance,
  COALESCE(payable.outstanding, 0) payable_balance,
  COALESCE(expense.total, 0) expense_total,
  COALESCE(purchase.total, 0) purchase_total`;

const partyJoins = `
  LEFT JOIN suppliers supplier
    ON supplier.id = party.supplier_id
   AND supplier.tenant_id = party.tenant_id
  LEFT JOIN LATERAL (
    SELECT SUM(invoice.total - invoice.paid_amount) outstanding
    FROM ar_invoices invoice
    WHERE invoice.tenant_id = party.tenant_id
      AND invoice.customer_id = party.customer_id
      AND invoice.status IN ('ISSUED','PARTIAL')
  ) receivable ON TRUE
  LEFT JOIN LATERAL (
    SELECT SUM(invoice.total - invoice.paid_amount) outstanding
    FROM ap_invoices invoice
    WHERE invoice.tenant_id = party.tenant_id
      AND invoice.supplier_id = party.supplier_id
      AND invoice.status IN ('ISSUED','PARTIAL')
  ) payable ON TRUE
  LEFT JOIN LATERAL (
    SELECT SUM(expense.total) total
    FROM business_expenses expense
    WHERE expense.tenant_id = party.tenant_id
      AND expense.supplier_id = party.supplier_id
      AND expense.status <> 'VOID'
  ) expense ON TRUE
  LEFT JOIN LATERAL (
    SELECT SUM(purchase.total) total
    FROM purchases purchase
    WHERE purchase.tenant_id = party.tenant_id
      AND purchase.supplier_id = party.supplier_id
      AND purchase.status <> 'CANCELLED'
  ) purchase ON TRUE`;

router.get(
  '/summary',
  requireAnyPermission(['parties.view', 'parties.manage']),
  asyncHandler(async (req, res) => {
    const result = await query(
      `SELECT
         COUNT(*)::integer total,
         COUNT(*) FILTER (WHERE active)::integer active,
         COUNT(*) FILTER (WHERE is_customer)::integer customers,
         COUNT(*) FILTER (WHERE is_supplier)::integer suppliers,
         COUNT(*) FILTER (WHERE is_customer AND is_supplier)::integer dual_role,
         COALESCE(SUM(receivable.outstanding), 0) receivable_balance,
         COALESCE(SUM(payable.outstanding), 0) payable_balance
       FROM third_parties party
       LEFT JOIN LATERAL (
         SELECT SUM(invoice.total - invoice.paid_amount) outstanding
         FROM ar_invoices invoice
         WHERE invoice.tenant_id = party.tenant_id
           AND invoice.customer_id = party.customer_id
           AND invoice.status IN ('ISSUED','PARTIAL')
       ) receivable ON TRUE
       LEFT JOIN LATERAL (
         SELECT SUM(invoice.total - invoice.paid_amount) outstanding
         FROM ap_invoices invoice
         WHERE invoice.tenant_id = party.tenant_id
           AND invoice.supplier_id = party.supplier_id
           AND invoice.status IN ('ISSUED','PARTIAL')
       ) payable ON TRUE
       WHERE party.tenant_id = $1`,
      [req.context.tenantId],
    );
    res.json(result.rows[0]);
  }),
);

router.get(
  '/',
  requireAnyPermission(['parties.view', 'parties.manage']),
  asyncHandler(async (req, res) => {
    const search = text(req.query.search, 120);
    const role = text(req.query.role, 20)?.toUpperCase() || 'ALL';
    const status = text(req.query.status, 20)?.toUpperCase() || 'ACTIVE';
    if (!ROLE_FILTERS.has(role) || !['ALL', 'ACTIVE', 'INACTIVE'].includes(status)) {
      throw new AppError(
        'El filtro de terceros no es válido.',
        422,
        'INVALID_PARTY_FILTER',
      );
    }
    const result = await query(
      `SELECT ${partyProjection}
       FROM third_parties party
       ${partyJoins}
       WHERE party.tenant_id = $1
         AND ($2::text IS NULL
           OR party.name ILIKE '%' || $2 || '%'
           OR party.trade_name ILIKE '%' || $2 || '%'
           OR party.document_number ILIKE '%' || $2 || '%'
           OR party.email ILIKE '%' || $2 || '%')
         AND (
           $3 = 'ALL'
           OR ($3 = 'CUSTOMER' AND party.is_customer)
           OR ($3 = 'SUPPLIER' AND party.is_supplier)
           OR ($3 = 'BOTH' AND party.is_customer AND party.is_supplier)
         )
         AND (
           $4 = 'ALL'
           OR ($4 = 'ACTIVE' AND party.active)
           OR ($4 = 'INACTIVE' AND NOT party.active)
         )
       ORDER BY party.active DESC, party.name`,
      [req.context.tenantId, search, role, status],
    );
    res.json(result.rows);
  }),
);

router.get(
  '/:id',
  requireAnyPermission(['parties.view', 'parties.manage']),
  asyncHandler(async (req, res) => {
    if (!UUID_PATTERN.test(req.params.id)) {
      throw new AppError(
        'El tercero debe tener un UUID válido.',
        422,
        'INVALID_PARTY_ID',
      );
    }
    const party = await query(
      `SELECT ${partyProjection}
       FROM third_parties party
       ${partyJoins}
       WHERE party.id = $1 AND party.tenant_id = $2`,
      [req.params.id, req.context.tenantId],
    );
    if (!party.rowCount) {
      throw new AppError(
        'El tercero no pertenece a la empresa activa.',
        404,
        'PARTY_NOT_FOUND',
      );
    }
    const activity = await query(
      `SELECT * FROM (
         SELECT invoice.id, 'RECEIVABLE' kind, invoice.invoice_number reference,
                invoice.issue_date activity_date, invoice.total,
                invoice.total - invoice.paid_amount balance, invoice.status
         FROM ar_invoices invoice
         WHERE invoice.tenant_id = $2
           AND invoice.customer_id = $1
         UNION ALL
         SELECT invoice.id, 'PAYABLE', invoice.payable_number,
                invoice.issue_date, invoice.total,
                invoice.total - invoice.paid_amount, invoice.status
         FROM ap_invoices invoice
         WHERE invoice.tenant_id = $2
           AND invoice.supplier_id = $3
         UNION ALL
         SELECT purchase.id, 'PURCHASE', purchase.order_number,
                purchase.issue_date, purchase.total, 0, purchase.status
         FROM purchases purchase
         WHERE purchase.tenant_id = $2
           AND purchase.supplier_id = $3
         UNION ALL
         SELECT expense.id, 'EXPENSE', expense.expense_number,
                expense.issue_date, expense.total,
                expense.total - expense.paid_amount, expense.status
         FROM business_expenses expense
         WHERE expense.tenant_id = $2
           AND expense.supplier_id = $3
       ) activity
       ORDER BY activity_date DESC
       LIMIT 20`,
      [
        party.rows[0].customer_id,
        req.context.tenantId,
        party.rows[0].supplier_id,
      ],
    );
    res.json({ ...party.rows[0], activity: activity.rows });
  }),
);

async function createCustomerProfile(client, tenantId, data) {
  const result = await client.query(
    `INSERT INTO customers(
       tenant_id, name, document_type, document_number, email, phone, address
     )
     VALUES($1,$2,$3,$4,$5,$6,$7)
     RETURNING id`,
    [
      tenantId,
      data.name,
      data.documentType,
      data.documentNumber,
      data.email,
      data.phone,
      data.address,
    ],
  );
  return result.rows[0].id;
}

async function createSupplierProfile(client, tenantId, data) {
  const result = await client.query(
    `INSERT INTO suppliers(
       tenant_id, name, document_type, tax_id, email, phone, address,
       obligated_to_invoice, electronic_invoicer, payment_terms_days
     )
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING id`,
    [
      tenantId,
      data.name,
      data.documentType,
      data.documentNumber,
      data.email,
      data.phone,
      data.address,
      data.obligatedToInvoice,
      data.electronicInvoicer,
      data.paymentTermsDays,
    ],
  );
  return result.rows[0].id;
}

router.post(
  '/',
  requirePermission('parties.manage'),
  asyncHandler(async (req, res) => {
    const data = normalizePayload(req.body);
    try {
      const party = await withTransaction(async (client) => {
        let existing = null;
        if (data.documentNumber) {
          const result = await client.query(
            `SELECT * FROM third_parties
             WHERE tenant_id = $1
               AND document_type = $2
               AND document_number = $3
             FOR UPDATE`,
            [req.context.tenantId, data.documentType, data.documentNumber],
          );
          existing = result.rows[0] || null;
        }

        if (existing && (
          (data.roles.has('CUSTOMER') && existing.is_customer) ||
          (data.roles.has('SUPPLIER') && existing.is_supplier)
        )) {
          throw new AppError(
            'Ya existe un tercero con ese documento y función comercial.',
            409,
            'PARTY_DOCUMENT_EXISTS',
          );
        }

        let customerId = existing?.customer_id || null;
        let supplierId = existing?.supplier_id || null;
        if (data.roles.has('CUSTOMER') && !customerId) {
          customerId = await createCustomerProfile(
            client,
            req.context.tenantId,
            data,
          );
        }
        if (data.roles.has('SUPPLIER') && !supplierId) {
          supplierId = await createSupplierProfile(
            client,
            req.context.tenantId,
            data,
          );
        }

        const found = await client.query(
          `SELECT * FROM third_parties
           WHERE tenant_id = $1
             AND (customer_id = $2::uuid OR supplier_id = $3::uuid)
           ORDER BY (customer_id IS NOT NULL AND supplier_id IS NOT NULL) DESC
           LIMIT 1
           FOR UPDATE`,
          [req.context.tenantId, customerId, supplierId],
        );
        const canonical = found.rows[0];
        if (!canonical) {
          throw new AppError(
            'No fue posible consolidar el tercero.',
            500,
            'PARTY_CONSOLIDATION_FAILED',
          );
        }
        const updated = await client.query(
          `UPDATE third_parties
           SET party_type = $3,
               name = $4,
               trade_name = $5,
               verification_digit = $6,
               email = $7,
               phone = $8,
               address = $9,
               municipality_code = $10,
               notes = $11,
               created_by = COALESCE(created_by, $12),
               updated_at = now()
           WHERE id = $1 AND tenant_id = $2
           RETURNING *`,
          [
            canonical.id,
            req.context.tenantId,
            data.partyType,
            data.name,
            data.tradeName,
            data.verificationDigit,
            data.email,
            data.phone,
            data.address,
            data.municipalityCode,
            data.notes,
            req.context.userId,
          ],
        );
        await writeAudit(client, {
          tenantId: req.context.tenantId,
          userId: req.context.userId,
          action: existing ? 'third_party.role_added' : 'third_party.created',
          entityType: 'third_party',
          entityId: canonical.id,
          before: existing,
          after: updated.rows[0],
          reason: text(req.body.reason, 500) || 'Administración de terceros',
        });
        return updated.rows[0];
      });
      res.status(201).json(party);
    } catch (error) {
      if (error.code === '23505') {
        throw new AppError(
          'Ya existe un cliente o proveedor con ese documento.',
          409,
          'PARTY_DOCUMENT_EXISTS',
        );
      }
      throw error;
    }
  }),
);

router.patch(
  '/:id',
  requirePermission('parties.manage'),
  asyncHandler(async (req, res) => {
    if (!UUID_PATTERN.test(req.params.id)) {
      throw new AppError(
        'El tercero debe tener un UUID válido.',
        422,
        'INVALID_PARTY_ID',
      );
    }
    const data = normalizePayload(req.body);
    const saved = await withTransaction(async (client) => {
      const currentResult = await client.query(
        `SELECT * FROM third_parties
         WHERE id = $1 AND tenant_id = $2
         FOR UPDATE`,
        [req.params.id, req.context.tenantId],
      );
      if (!currentResult.rowCount) {
        throw new AppError(
          'El tercero no pertenece a la empresa activa.',
          404,
          'PARTY_NOT_FOUND',
        );
      }
      const current = currentResult.rows[0];
      if (current.is_customer && !data.roles.has('CUSTOMER') ||
          current.is_supplier && !data.roles.has('SUPPLIER')) {
        throw new AppError(
          'Las funciones comerciales existentes no se eliminan; puedes inactivar el tercero.',
          409,
          'PARTY_ROLE_REMOVAL_DENIED',
        );
      }
      let customerId = current.customer_id;
      let supplierId = current.supplier_id;
      if (data.roles.has('CUSTOMER') && !customerId) {
        customerId = await createCustomerProfile(
          client,
          req.context.tenantId,
          data,
        );
      }
      if (data.roles.has('SUPPLIER') && !supplierId) {
        supplierId = await createSupplierProfile(
          client,
          req.context.tenantId,
          data,
        );
      }
      if (customerId) {
        await client.query(
          `UPDATE customers
           SET name=$3, document_type=$4, document_number=$5,
               email=$6, phone=$7, address=$8, active=$9, updated_at=now()
           WHERE id=$1 AND tenant_id=$2`,
          [
            customerId, req.context.tenantId, data.name, data.documentType,
            data.documentNumber, data.email, data.phone, data.address,
            req.body.active !== false,
          ],
        );
      }
      if (supplierId) {
        await client.query(
          `UPDATE suppliers
           SET name=$3, document_type=$4, tax_id=$5, email=$6, phone=$7,
               address=$8, active=$9, obligated_to_invoice=$10,
               electronic_invoicer=$11, payment_terms_days=$12, updated_at=now()
           WHERE id=$1 AND tenant_id=$2`,
          [
            supplierId, req.context.tenantId, data.name, data.documentType,
            data.documentNumber, data.email, data.phone, data.address,
            req.body.active !== false, data.obligatedToInvoice,
            data.electronicInvoicer, data.paymentTermsDays,
          ],
        );
      }
      const result = await client.query(
        `UPDATE third_parties
         SET party_type=$3, name=$4, trade_name=$5, document_type=$6,
             document_number=$7, verification_digit=$8, email=$9, phone=$10,
             address=$11, municipality_code=$12, notes=$13, active=$14,
             updated_at=now()
         WHERE id=$1 AND tenant_id=$2
         RETURNING *`,
        [
          req.params.id, req.context.tenantId, data.partyType, data.name,
          data.tradeName, data.documentType, data.documentNumber,
          data.verificationDigit, data.email, data.phone, data.address,
          data.municipalityCode, data.notes, req.body.active !== false,
        ],
      );
      await writeAudit(client, {
        tenantId: req.context.tenantId,
        userId: req.context.userId,
        action: 'third_party.updated',
        entityType: 'third_party',
        entityId: req.params.id,
        before: current,
        after: result.rows[0],
        reason: text(req.body.reason, 500) || 'Actualización del tercero',
      });
      return result.rows[0];
    });
    res.json(saved);
  }),
);

export default router;
