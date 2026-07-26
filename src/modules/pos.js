import { Router } from 'express';
import { query, withTransaction } from '../db.js';
import { requireTenant } from '../middleware.js';
import { asyncHandler } from '../shared/async-handler.js';
import { AppError } from '../shared/errors.js';
import { writeAudit } from '../audit.js';

const router = Router();
const UUID_PATTERN = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

router.use(requireTenant);

router.get('/summary', asyncHandler(async (req, res) => {
  const summary = await withTransaction(async (client) => {
    const registers = await client.query(
      `SELECT cr.id, cr.name, cr.code, cr.branch_id, b.name branch_name, cr.active
       FROM cash_registers cr
       JOIN branches b ON b.id = cr.branch_id
       WHERE cr.tenant_id = $1 AND cr.active = TRUE
       ORDER BY b.name, cr.name`,
      [req.context.tenantId],
    );
    const session = await client.query(
      `SELECT cs.id, cs.cash_register_id, cs.status, cs.opening_amount,
              cs.opened_at, cr.name register_name, cr.code register_code,
              cr.branch_id, b.name branch_name
       FROM cash_sessions cs
       JOIN cash_registers cr ON cr.id = cs.cash_register_id
       JOIN branches b ON b.id = cr.branch_id
       WHERE cs.tenant_id = $1 AND cs.status = 'OPEN'
       ORDER BY cs.opened_at DESC
       LIMIT 1`,
      [req.context.tenantId],
    );
    return {
      registers: registers.rows,
      openSession: session.rows[0] || null,
    };
  });
  res.json(summary);
}));

router.get('/catalog', asyncHandler(async (req, res) => {
  const { warehouseId } = req.query;
  if (typeof warehouseId !== 'string' || !UUID_PATTERN.test(warehouseId)) {
    return res.status(422).json({ error: 'warehouseId debe ser un UUID válido.' });
  }
  const result = await query(
    `SELECT p.id, p.sku, p.name, p.sale_price, p.tax_review_status,
            tc.name tax_name, tc.rate tax_rate,
            COALESCE(ib.on_hand, 0) on_hand,
            pi.public_url image_url, pi.alt_text image_alt
     FROM products p
     LEFT JOIN tax_categories tc ON tc.id = p.sales_tax_category_id
     LEFT JOIN inventory_balances ib
       ON ib.product_id = p.id
      AND ib.tenant_id = p.tenant_id
      AND ib.warehouse_id = $2
     LEFT JOIN LATERAL (
       SELECT public_url, alt_text
       FROM product_images
       WHERE tenant_id = p.tenant_id AND product_id = p.id
       ORDER BY is_primary DESC, created_at
       LIMIT 1
     ) pi ON TRUE
     WHERE p.tenant_id = $1 AND p.deleted_at IS NULL
       AND EXISTS(
         SELECT 1 FROM warehouses
         WHERE id = $2 AND tenant_id = $1 AND active = TRUE
       )
     ORDER BY p.name`,
    [req.context.tenantId, warehouseId],
  );
  res.json(result.rows);
}));

router.post('/sessions', asyncHandler(async (req, res) => {
  const { cashRegisterId, openingAmount = 0 } = req.body;
  const amount = Number(openingAmount);
  if (!cashRegisterId) {
    return res.status(422).json({ error: 'cashRegisterId es obligatorio.' });
  }
  if (typeof cashRegisterId !== 'string' || !UUID_PATTERN.test(cashRegisterId)) {
    return res.status(422).json({ error: 'cashRegisterId debe ser un UUID válido.' });
  }
  if (!Number.isFinite(amount) || amount < 0) {
    return res.status(422).json({ error: 'openingAmount debe ser un valor positivo.' });
  }

  try {
    const session = await withTransaction(async (client) => {
      const register = await client.query(
        `SELECT id
         FROM cash_registers
         WHERE id = $1 AND tenant_id = $2 AND active = TRUE
         FOR UPDATE`,
        [cashRegisterId, req.context.tenantId],
      );
      if (!register.rowCount) {
        throw new AppError('La caja no pertenece a la empresa activa.', 404, 'CASH_REGISTER_NOT_FOUND');
      }
      const result = await client.query(
        `INSERT INTO cash_sessions(
           tenant_id, cash_register_id, opening_amount, opened_by
         )
         VALUES($1,$2,$3,$4)
         RETURNING id, tenant_id, cash_register_id, status, opening_amount, opened_at`,
        [req.context.tenantId, cashRegisterId, amount, req.context.userId],
      );
      return result.rows[0];
    });
    res.status(201).json(session);
  } catch (error) {
    if (error.code === '23505') {
      throw new AppError('Esta caja ya tiene un turno abierto.', 409, 'CASH_SESSION_ALREADY_OPEN');
    }
    throw error;
  }
}));

router.post('/sessions/:id/close', asyncHandler(async (req, res) => {
  const { closingAmount } = req.body;
  const amount = Number(closingAmount);
  if (!Number.isFinite(amount) || amount < 0) {
    return res.status(422).json({ error: 'closingAmount debe ser un valor positivo.' });
  }
  if (!UUID_PATTERN.test(req.params.id)) {
    return res.status(422).json({ error: 'El turno debe tener un UUID válido.' });
  }
  const session = await withTransaction(async (client) => {
    const result = await client.query(
      `UPDATE cash_sessions
       SET status = 'CLOSED', closing_amount = $1, closed_by = $2, closed_at = now()
       WHERE id = $3 AND tenant_id = $4 AND status = 'OPEN'
       RETURNING id, status, opening_amount, closing_amount, opened_at, closed_at`,
      [amount, req.context.userId, req.params.id, req.context.tenantId],
    );
    if (!result.rowCount) {
      throw new AppError('No encontramos un turno de caja abierto.', 404, 'CASH_SESSION_NOT_FOUND');
    }
    return result.rows[0];
  });
  res.json(session);
}));

router.post('/sales', asyncHandler(async (req, res) => {
  const {
    cashSessionId,
    warehouseId,
    paymentMethod,
    items,
  } = req.body;
  const normalizedPayment = typeof paymentMethod === 'string'
    ? paymentMethod.trim().toUpperCase()
    : '';
  const allowedPayments = ['CASH', 'CARD', 'TRANSFER'];

  if (!cashSessionId || !warehouseId || !normalizedPayment || !Array.isArray(items) || !items.length) {
    return res.status(422).json({
      error: 'cashSessionId, warehouseId, paymentMethod e items son obligatorios.',
    });
  }
  if (![cashSessionId, warehouseId].every((id) => typeof id === 'string' && UUID_PATTERN.test(id))) {
    return res.status(422).json({ error: 'La caja y la bodega deben tener UUID válidos.' });
  }
  if (!allowedPayments.includes(normalizedPayment)) {
    return res.status(422).json({ error: 'El medio de pago no es válido.' });
  }
  if (items.length > 100 || items.some((item) =>
    !item || typeof item.productId !== 'string' || !UUID_PATTERN.test(item.productId) ||
    !Number.isFinite(Number(item.quantity)) || Number(item.quantity) <= 0)) {
    return res.status(422).json({ error: 'Los productos y cantidades de la venta no son válidos.' });
  }

  const consolidatedItems = new Map();
  for (const item of items) {
    const quantity = Number(item.quantity);
    consolidatedItems.set(
      item.productId,
      (consolidatedItems.get(item.productId) || 0) + quantity,
    );
  }

  const receipt = await withTransaction(async (client) => {
    const session = await client.query(
      `SELECT cs.id, cr.branch_id
       FROM cash_sessions cs
       JOIN cash_registers cr ON cr.id = cs.cash_register_id
       WHERE cs.id = $1 AND cs.tenant_id = $2 AND cs.status = 'OPEN'
       FOR UPDATE OF cs`,
      [cashSessionId, req.context.tenantId],
    );
    if (!session.rowCount) {
      throw new AppError('La venta requiere un turno de caja abierto.', 409, 'CASH_SESSION_REQUIRED');
    }
    const warehouse = await client.query(
      `SELECT id
       FROM warehouses
       WHERE id = $1 AND tenant_id = $2 AND branch_id = $3 AND active = TRUE`,
      [warehouseId, req.context.tenantId, session.rows[0].branch_id],
    );
    if (!warehouse.rowCount) {
      throw new AppError(
        'La bodega debe pertenecer a la misma sucursal de la caja.',
        422,
        'WAREHOUSE_BRANCH_MISMATCH',
      );
    }

    const productIds = [...consolidatedItems.keys()];
    const productResult = await client.query(
      `SELECT p.id, p.sku, p.name, p.cost, p.sale_price,
              p.tax_review_status, COALESCE(tc.rate, 0) tax_rate
       FROM products p
       LEFT JOIN tax_categories tc ON tc.id = p.sales_tax_category_id
       WHERE p.tenant_id = $1 AND p.id = ANY($2::uuid[]) AND p.deleted_at IS NULL
       FOR SHARE OF p`,
      [req.context.tenantId, productIds],
    );
    if (productResult.rowCount !== productIds.length) {
      throw new AppError('Uno o más productos no pertenecen a la empresa.', 422, 'SALE_PRODUCT_INVALID');
    }

    const lines = [];
    let total = 0;
    let taxTotal = 0;
    for (const product of productResult.rows) {
      if (product.tax_review_status !== 'REVIEWED') {
        throw new AppError(
          `Revisa el impuesto de ${product.name} antes de venderlo.`,
          409,
          'PRODUCT_TAX_PENDING',
        );
      }
      const quantity = consolidatedItems.get(product.id);
      const unitPrice = Number(product.sale_price);
      const taxRate = Number(product.tax_rate);
      const lineTotal = Math.round(unitPrice * quantity * 100) / 100;
      const lineTax = taxRate > 0
        ? Math.round((lineTotal * taxRate / (100 + taxRate)) * 100) / 100
        : 0;
      total += lineTotal;
      taxTotal += lineTax;
      lines.push({
        ...product,
        quantity,
        unitPrice,
        taxRate,
        lineTotal,
        lineTax,
      });
    }
    total = Math.round(total * 100) / 100;
    taxTotal = Math.round(taxTotal * 100) / 100;
    const subtotal = Math.round((total - taxTotal) * 100) / 100;

    const saleResult = await client.query(
      `INSERT INTO sales(
         tenant_id, cash_session_id, warehouse_id, payment_method,
         subtotal, tax_total, total, created_by
       )
       VALUES($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id, sequence_number, status, payment_method,
                 subtotal, tax_total, total, created_at`,
      [
        req.context.tenantId,
        cashSessionId,
        warehouseId,
        normalizedPayment,
        subtotal,
        taxTotal,
        total,
        req.context.userId,
      ],
    );
    const sale = saleResult.rows[0];

    for (const line of lines) {
      const balance = await client.query(
        `UPDATE inventory_balances
         SET on_hand = on_hand - $1, updated_at = now()
         WHERE tenant_id = $2 AND product_id = $3 AND warehouse_id = $4
           AND on_hand - reserved >= $1
         RETURNING on_hand, reserved`,
        [line.quantity, req.context.tenantId, line.id, warehouseId],
      );
      if (!balance.rowCount) {
        throw new AppError(
          `No hay existencias suficientes de ${line.name}.`,
          409,
          'INSUFFICIENT_STOCK',
        );
      }
      await client.query(
        `INSERT INTO sale_items(
           tenant_id, sale_id, product_id, sku_snapshot, name_snapshot,
           quantity, unit_price, unit_cost, tax_rate, tax_amount, line_total
         )
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [
          req.context.tenantId,
          sale.id,
          line.id,
          line.sku,
          line.name,
          line.quantity,
          line.unitPrice,
          line.cost,
          line.taxRate,
          line.lineTax,
          line.lineTotal,
        ],
      );
      await client.query(
        `INSERT INTO inventory_movements(
           tenant_id, product_id, warehouse_id, movement_type, quantity,
           unit_cost, reference_type, reference_id, reason, created_by
         )
         VALUES($1,$2,$3,'SALE',$4,$5,'SALE',$6,$7,$8)`,
        [
          req.context.tenantId,
          line.id,
          warehouseId,
          -line.quantity,
          line.cost,
          sale.id,
          `Venta POS #${sale.sequence_number}`,
          req.context.userId,
        ],
      );
    }

    await writeAudit(client, {
      tenantId: req.context.tenantId,
      userId: req.context.userId,
      action: 'sale.completed',
      entityType: 'sale',
      entityId: sale.id,
      after: { ...sale, items: lines.length },
      reason: 'Venta confirmada desde Caja & POS',
    });

    return {
      ...sale,
      receiptNumber: `POS-${String(sale.sequence_number).padStart(6, '0')}`,
      items: lines.map((line) => ({
        productId: line.id,
        sku: line.sku,
        name: line.name,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        taxRate: line.taxRate,
        taxAmount: line.lineTax,
        lineTotal: line.lineTotal,
      })),
    };
  });
  res.status(201).json(receipt);
}));

export default router;
