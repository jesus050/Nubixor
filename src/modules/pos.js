import { Router } from 'express';
import { query, withTransaction } from '../db.js';
import { requireTenant } from '../middleware.js';
import { asyncHandler } from '../shared/async-handler.js';
import { AppError } from '../shared/errors.js';
import { writeAudit } from '../audit.js';

const router = Router();
const UUID_PATTERN = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const CASH_MOVEMENT_TYPES = new Set(['INCOME', 'EXPENSE', 'WITHDRAWAL']);
const CASH_DENOMINATIONS = new Set([
  100000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100, 50,
]);

router.use(requireTenant);

function normalizedText(value, maxLength) {
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

router.get('/summary', asyncHandler(async (req, res) => {
  const summary = await withTransaction(async (client) => {
    const registers = await client.query(
      `SELECT cr.id, cr.name, cr.code, cr.branch_id, b.name branch_name, cr.active
       FROM cash_registers cr
       JOIN branches b ON b.id = cr.branch_id
       WHERE cr.tenant_id = $1 AND cr.active = TRUE
         AND ($2::uuid IS NULL OR cr.branch_id = $2)
       ORDER BY b.name, cr.name`,
      [req.context.tenantId, req.context.branchId],
    );
    const session = await client.query(
      `SELECT cs.id, cs.cash_register_id, cs.status, cs.opening_amount,
              cs.opened_at, cr.name register_name, cr.code register_code,
              cr.branch_id, b.name branch_name,
              COALESCE(sales.cash_sales, 0) cash_sales,
              COALESCE(sales.card_sales, 0) card_sales,
              COALESCE(sales.transfer_sales, 0) transfer_sales,
              COALESCE(movements.income, 0) manual_income,
              COALESCE(movements.expense, 0) expenses,
              COALESCE(movements.withdrawal, 0) withdrawals,
              cs.opening_amount
                + COALESCE(sales.cash_sales, 0)
                + COALESCE(movements.income, 0)
                - COALESCE(movements.expense, 0)
                - COALESCE(movements.withdrawal, 0) calculated_cash
       FROM cash_sessions cs
       JOIN cash_registers cr ON cr.id = cs.cash_register_id
       JOIN branches b ON b.id = cr.branch_id
       LEFT JOIN LATERAL (
         SELECT
           COALESCE(SUM(total) FILTER (WHERE payment_method = 'CASH'), 0) cash_sales,
           COALESCE(SUM(total) FILTER (WHERE payment_method = 'CARD'), 0) card_sales,
           COALESCE(SUM(total) FILTER (WHERE payment_method = 'TRANSFER'), 0) transfer_sales
         FROM sales
         WHERE cash_session_id = cs.id
           AND tenant_id = cs.tenant_id
           AND status = 'COMPLETED'
       ) sales ON TRUE
       LEFT JOIN LATERAL (
         SELECT
           COALESCE(SUM(amount) FILTER (WHERE movement_type = 'INCOME'), 0) income,
           COALESCE(SUM(amount) FILTER (WHERE movement_type = 'EXPENSE'), 0) expense,
           COALESCE(SUM(amount) FILTER (WHERE movement_type = 'WITHDRAWAL'), 0) withdrawal
         FROM cash_movements
         WHERE cash_session_id = cs.id AND tenant_id = cs.tenant_id
       ) movements ON TRUE
       WHERE cs.tenant_id = $1 AND cs.status = 'OPEN'
         AND ($2::uuid IS NULL OR cr.branch_id = $2)
       ORDER BY cs.opened_at DESC
       LIMIT 1`,
      [req.context.tenantId, req.context.branchId],
    );
    return {
      registers: registers.rows,
      openSession: session.rows[0] || null,
    };
  });
  res.json(summary);
}));

router.get('/sessions', asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT cs.id, cs.status, cs.opening_amount, cs.closing_amount,
            cs.expected_cash, cs.difference, cs.opened_at, cs.closed_at,
            cs.closing_notes, cr.name register_name, cr.code register_code,
            b.name branch_name,
            COALESCE(sales.sale_count, 0)::integer sale_count,
            COALESCE(sales.sales_total, 0) sales_total,
            COALESCE(sales.cash_sales, 0) cash_sales,
            COALESCE(movements.movement_count, 0)::integer movement_count
     FROM cash_sessions cs
     JOIN cash_registers cr ON cr.id = cs.cash_register_id
     JOIN branches b ON b.id = cr.branch_id
     LEFT JOIN LATERAL (
       SELECT COUNT(*) sale_count, COALESCE(SUM(total), 0) sales_total,
              COALESCE(SUM(total) FILTER (WHERE payment_method = 'CASH'), 0) cash_sales
       FROM sales
       WHERE cash_session_id = cs.id
         AND tenant_id = cs.tenant_id
         AND status = 'COMPLETED'
     ) sales ON TRUE
     LEFT JOIN LATERAL (
       SELECT COUNT(*) movement_count
       FROM cash_movements
       WHERE cash_session_id = cs.id AND tenant_id = cs.tenant_id
     ) movements ON TRUE
     WHERE cs.tenant_id = $1
       AND ($2::uuid IS NULL OR cr.branch_id = $2)
     ORDER BY cs.opened_at DESC
     LIMIT 60`,
    [req.context.tenantId, req.context.branchId],
  );
  res.json(result.rows);
}));

router.get('/sessions/:id', asyncHandler(async (req, res) => {
  if (!UUID_PATTERN.test(req.params.id)) {
    throw new AppError(
      'El turno debe tener un UUID válido.',
      422,
      'INVALID_CASH_SESSION_ID',
    );
  }
  const [session, movements, sales, counts] = await Promise.all([
    query(
      `SELECT cs.*, cr.name register_name, cr.code register_code,
              b.name branch_name,
              COALESCE(sale_totals.cash_sales, 0) cash_sales,
              COALESCE(sale_totals.card_sales, 0) card_sales,
              COALESCE(sale_totals.transfer_sales, 0) transfer_sales,
              COALESCE(movement_totals.income, 0) manual_income,
              COALESCE(movement_totals.expense, 0) expenses,
              COALESCE(movement_totals.withdrawal, 0) withdrawals,
              cs.opening_amount
                + COALESCE(sale_totals.cash_sales, 0)
                + COALESCE(movement_totals.income, 0)
                - COALESCE(movement_totals.expense, 0)
                - COALESCE(movement_totals.withdrawal, 0) calculated_cash
       FROM cash_sessions cs
       JOIN cash_registers cr ON cr.id = cs.cash_register_id
       JOIN branches b ON b.id = cr.branch_id
       LEFT JOIN LATERAL (
         SELECT
           COALESCE(SUM(total) FILTER (WHERE payment_method = 'CASH'), 0) cash_sales,
           COALESCE(SUM(total) FILTER (WHERE payment_method = 'CARD'), 0) card_sales,
           COALESCE(SUM(total) FILTER (WHERE payment_method = 'TRANSFER'), 0) transfer_sales
         FROM sales
         WHERE cash_session_id = cs.id
           AND tenant_id = cs.tenant_id
           AND status = 'COMPLETED'
       ) sale_totals ON TRUE
       LEFT JOIN LATERAL (
         SELECT
           COALESCE(SUM(amount) FILTER (WHERE movement_type = 'INCOME'), 0) income,
           COALESCE(SUM(amount) FILTER (WHERE movement_type = 'EXPENSE'), 0) expense,
           COALESCE(SUM(amount) FILTER (WHERE movement_type = 'WITHDRAWAL'), 0) withdrawal
         FROM cash_movements
         WHERE cash_session_id = cs.id AND tenant_id = cs.tenant_id
       ) movement_totals ON TRUE
       WHERE cs.id = $1 AND cs.tenant_id = $2
         AND ($3::uuid IS NULL OR cr.branch_id = $3)`,
      [req.params.id, req.context.tenantId, req.context.branchId],
    ),
    query(
      `SELECT id, movement_type, category, amount, reference, notes,
              created_by, created_at
       FROM cash_movements
       WHERE cash_session_id = $1 AND tenant_id = $2
       ORDER BY created_at DESC`,
      [req.params.id, req.context.tenantId],
    ),
    query(
      `SELECT id, sequence_number, payment_method, total, created_at
       FROM sales
       WHERE cash_session_id = $1 AND tenant_id = $2
       ORDER BY created_at DESC`,
      [req.params.id, req.context.tenantId],
    ),
    query(
      `SELECT denomination, quantity, total
       FROM cash_count_lines
       WHERE cash_session_id = $1 AND tenant_id = $2
       ORDER BY denomination DESC`,
      [req.params.id, req.context.tenantId],
    ),
  ]);
  if (!session.rowCount) {
    throw new AppError(
      'No encontramos el turno de caja.',
      404,
      'CASH_SESSION_NOT_FOUND',
    );
  }
  res.json({
    ...session.rows[0],
    movements: movements.rows,
    sales: sales.rows,
    counts: counts.rows,
  });
}));

router.get('/catalog', asyncHandler(async (req, res) => {
  const { warehouseId } = req.query;
  if (typeof warehouseId !== 'string' || !UUID_PATTERN.test(warehouseId)) {
    return res.status(422).json({ error: 'warehouseId debe ser un UUID válido.' });
  }
  const result = await query(
    `SELECT p.id, p.sku, p.name, p.barcode, p.sale_price, p.tax_review_status,
            c.id category_id, c.name category_name,
            tc.name tax_name, tc.rate tax_rate,
            COALESCE(ib.on_hand, 0) on_hand,
            pi.public_url image_url, pi.alt_text image_alt
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id AND c.tenant_id = p.tenant_id
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
           AND ($3::uuid IS NULL OR branch_id = $3)
       )
     ORDER BY p.name`,
    [req.context.tenantId, warehouseId, req.context.branchId],
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
           AND ($3::uuid IS NULL OR branch_id = $3)
         FOR UPDATE`,
        [cashRegisterId, req.context.tenantId, req.context.branchId],
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
      await writeAudit(client, {
        tenantId: req.context.tenantId,
        userId: req.context.userId,
        action: 'cash.session_opened',
        entityType: 'cash_session',
        entityId: result.rows[0].id,
        after: result.rows[0],
        reason: 'Apertura de turno de caja',
      });
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

router.post('/sessions/:id/movements', asyncHandler(async (req, res) => {
  if (!UUID_PATTERN.test(req.params.id)) {
    throw new AppError(
      'El turno debe tener un UUID válido.',
      422,
      'INVALID_CASH_SESSION_ID',
    );
  }
  const movementType = normalizedText(req.body.movementType, 30)?.toUpperCase();
  const category = normalizedText(req.body.category, 80);
  const amount = Number(req.body.amount);
  const reference = normalizedText(req.body.reference, 100);
  const notes = normalizedText(req.body.notes, 300);
  if (!CASH_MOVEMENT_TYPES.has(movementType) || !category || !notes ||
      !Number.isFinite(amount) || amount <= 0) {
    throw new AppError(
      'Tipo, categoría, valor positivo y motivo son obligatorios.',
      422,
      'INVALID_CASH_MOVEMENT',
    );
  }
  const movement = await withTransaction(async (client) => {
    const session = await client.query(
      `SELECT cs.id FROM cash_sessions cs
       JOIN cash_registers cr ON cr.id = cs.cash_register_id
       WHERE cs.id = $1 AND cs.tenant_id = $2 AND cs.status = 'OPEN'
         AND ($3::uuid IS NULL OR cr.branch_id = $3)
       FOR UPDATE OF cs`,
      [req.params.id, req.context.tenantId, req.context.branchId],
    );
    if (!session.rowCount) {
      throw new AppError(
        'Los movimientos requieren un turno abierto.',
        409,
        'CASH_SESSION_REQUIRED',
      );
    }
    const result = await client.query(
      `INSERT INTO cash_movements(
         tenant_id, cash_session_id, movement_type, category, amount,
         reference, notes, created_by
       )
       VALUES($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [
        req.context.tenantId,
        req.params.id,
        movementType,
        category,
        amount,
        reference,
        notes,
        req.context.userId,
      ],
    );
    await writeAudit(client, {
      tenantId: req.context.tenantId,
      userId: req.context.userId,
      action: 'cash.movement_created',
      entityType: 'cash_movement',
      entityId: result.rows[0].id,
      after: result.rows[0],
      reason: notes,
    });
    return result.rows[0];
  });
  res.status(201).json(movement);
}));

router.post('/sessions/:id/close', asyncHandler(async (req, res) => {
  if (!UUID_PATTERN.test(req.params.id)) {
    return res.status(422).json({ error: 'El turno debe tener un UUID válido.' });
  }
  const counts = Array.isArray(req.body.counts) ? req.body.counts : [];
  const normalizedCounts = counts.map((line) => ({
    denomination: Number(line.denomination),
    quantity: Number(line.quantity),
  }));
  const countKeys = normalizedCounts.map((line) => line.denomination);
  if (normalizedCounts.some((line) =>
    !CASH_DENOMINATIONS.has(line.denomination) ||
    !Number.isInteger(line.quantity) ||
    line.quantity < 0
  ) || new Set(countKeys).size !== countKeys.length) {
    throw new AppError(
      'El conteo contiene denominaciones o cantidades no válidas.',
      422,
      'INVALID_CASH_COUNT',
    );
  }
  const countedFromLines = normalizedCounts.reduce(
    (total, line) => total + line.denomination * line.quantity,
    0,
  );
  const fallbackAmount = Number(req.body.closingAmount);
  const amount = normalizedCounts.length ? countedFromLines : fallbackAmount;
  const notes = normalizedText(req.body.notes, 500);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new AppError(
      'Registra el conteo de efectivo antes de cerrar.',
      422,
      'INVALID_CLOSING_AMOUNT',
    );
  }
  const session = await withTransaction(async (client) => {
    const current = await client.query(
      `SELECT cs.id, cs.opening_amount,
              COALESCE(sales.cash_sales, 0) cash_sales,
              COALESCE(movements.income, 0) manual_income,
              COALESCE(movements.expense, 0) expenses,
              COALESCE(movements.withdrawal, 0) withdrawals
       FROM cash_sessions cs
       JOIN cash_registers cr ON cr.id = cs.cash_register_id
       LEFT JOIN LATERAL (
         SELECT COALESCE(SUM(total), 0) cash_sales
         FROM sales
         WHERE cash_session_id = cs.id
           AND tenant_id = cs.tenant_id
           AND payment_method = 'CASH'
           AND status = 'COMPLETED'
       ) sales ON TRUE
       LEFT JOIN LATERAL (
         SELECT
           COALESCE(SUM(amount) FILTER (WHERE movement_type = 'INCOME'), 0) income,
           COALESCE(SUM(amount) FILTER (WHERE movement_type = 'EXPENSE'), 0) expense,
           COALESCE(SUM(amount) FILTER (WHERE movement_type = 'WITHDRAWAL'), 0) withdrawal
         FROM cash_movements
         WHERE cash_session_id = cs.id AND tenant_id = cs.tenant_id
       ) movements ON TRUE
       WHERE cs.id = $1 AND cs.tenant_id = $2 AND cs.status = 'OPEN'
         AND ($3::uuid IS NULL OR cr.branch_id = $3)
       FOR UPDATE OF cs`,
      [req.params.id, req.context.tenantId, req.context.branchId],
    );
    if (!current.rowCount) {
      throw new AppError('No encontramos un turno de caja abierto.', 404, 'CASH_SESSION_NOT_FOUND');
    }
    const expected =
      Number(current.rows[0].opening_amount) +
      Number(current.rows[0].cash_sales) +
      Number(current.rows[0].manual_income) -
      Number(current.rows[0].expenses) -
      Number(current.rows[0].withdrawals);
    const difference = amount - expected;
    if (Math.abs(difference) >= 0.01 && !notes) {
      throw new AppError(
        'Explica la diferencia encontrada antes de cerrar.',
        422,
        'CASH_DIFFERENCE_REASON_REQUIRED',
      );
    }
    if (normalizedCounts.length) {
      for (const line of normalizedCounts) {
        await client.query(
          `INSERT INTO cash_count_lines(
             tenant_id, cash_session_id, denomination, quantity
           )
           VALUES($1,$2,$3,$4)`,
          [
            req.context.tenantId,
            req.params.id,
            line.denomination,
            line.quantity,
          ],
        );
      }
    }
    const result = await client.query(
      `UPDATE cash_sessions
       SET status = 'CLOSED', closing_amount = $1, expected_cash = $2,
           difference = $3, closing_notes = $4, closed_by = $5,
           closed_at = now()
       WHERE id = $6 AND tenant_id = $7 AND status = 'OPEN'
       RETURNING id, status, opening_amount, closing_amount, expected_cash,
                 difference, closing_notes, opened_at, closed_at`,
      [
        amount,
        expected,
        difference,
        notes,
        req.context.userId,
        req.params.id,
        req.context.tenantId,
      ],
    );
    await writeAudit(client, {
      tenantId: req.context.tenantId,
      userId: req.context.userId,
      action: 'cash.session_closed',
      entityType: 'cash_session',
      entityId: result.rows[0].id,
      before: current.rows[0],
      after: result.rows[0],
      reason: notes || 'Cierre sin diferencias',
    });
    return result.rows[0];
  });
  res.json(session);
}));

router.post('/sales', asyncHandler(async (req, res) => {
  const {
    cashSessionId,
    warehouseId,
    paymentMethod,
    cashReceived,
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
  const normalizedCashReceived = Number(cashReceived);
  if (
    normalizedPayment === 'CASH' &&
    (!Number.isFinite(normalizedCashReceived) || normalizedCashReceived < 0)
  ) {
    return res.status(422).json({
      error: 'Registra el efectivo recibido antes de confirmar la venta.',
    });
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
         AND ($3::uuid IS NULL OR cr.branch_id = $3)
       FOR UPDATE OF cs`,
      [cashSessionId, req.context.tenantId, req.context.branchId],
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
    const tendered = normalizedPayment === 'CASH'
      ? Math.round(normalizedCashReceived * 100) / 100
      : null;
    const change = normalizedPayment === 'CASH'
      ? Math.round((tendered - total) * 100) / 100
      : null;
    if (normalizedPayment === 'CASH' && change < 0) {
      throw new AppError(
        'El efectivo recibido es menor que el total de la venta.',
        422,
        'INSUFFICIENT_CASH_RECEIVED',
      );
    }

    const saleResult = await client.query(
      `INSERT INTO sales(
         tenant_id, cash_session_id, warehouse_id, payment_method,
         subtotal, tax_total, total, cash_received, cash_change, created_by
       )
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING id, sequence_number, status, payment_method,
                 subtotal, tax_total, total, cash_received, cash_change, created_at`,
      [
        req.context.tenantId,
        cashSessionId,
        warehouseId,
        normalizedPayment,
        subtotal,
        taxTotal,
        total,
        tendered,
        change,
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
