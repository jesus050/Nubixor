import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { postSaleReturnAccounting } from '../accounting.js';
import { writeAudit } from '../audit.js';
import { query, withTransaction } from '../db.js';
import { requireTenant } from '../middleware.js';
import { asyncHandler } from '../shared/async-handler.js';
import { AppError } from '../shared/errors.js';

const router = Router();
const UUID_PATTERN = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const REFUND_METHODS = new Set(['CASH', 'CARD', 'TRANSFER']);

router.use(requireTenant);

function money(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function normalizedText(value, maxLength) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}

router.get('/sales/:saleId/returns', asyncHandler(async (req, res) => {
  if (!UUID_PATTERN.test(req.params.saleId || '')) {
    throw new AppError('La venta no es válida.', 422, 'INVALID_SALE_ID');
  }
  const result = await query(
    `SELECT header.id, header.return_number, header.status,
            header.refund_method, header.subtotal, header.tax_total,
            header.total, header.refund_reference, header.reason,
            header.electronic_adjustment_note_id, header.created_at,
            actor.full_name created_by_name,
            COALESCE(
              json_agg(
                json_build_object(
                  'id', item.id,
                  'saleItemId', item.sale_item_id,
                  'productId', item.product_id,
                  'quantity', item.quantity,
                  'lineTotal', item.line_total
                )
                ORDER BY item.id
              ) FILTER (WHERE item.id IS NOT NULL),
              '[]'::json
            ) items
     FROM sale_returns header
     LEFT JOIN sale_return_items item
       ON item.sale_return_id = header.id AND item.company_id = header.company_id
     LEFT JOIN users actor ON actor.id = header.created_by
     WHERE header.sale_id = $1 AND header.company_id = $2
     GROUP BY header.id, actor.full_name
     ORDER BY header.created_at DESC`,
    [req.params.saleId, req.context.tenantId],
  );
  res.json(result.rows);
}));

router.post('/sales/:saleId/returns', asyncHandler(async (req, res) => {
  const saleId = req.params.saleId;
  const cashSessionId = req.body?.cashSessionId;
  const reason = normalizedText(req.body?.reason, 500);
  const refundMethod = normalizedText(req.body?.refundMethod, 20).toUpperCase();
  const refundReference = normalizedText(req.body?.refundReference, 120) || null;
  const bankAccountId = req.body?.bankAccountId || null;
  const correctionConceptCode =
    normalizedText(req.body?.correctionConceptCode, 20) || null;
  const idempotencyKey =
    normalizedText(req.body?.idempotencyKey, 160) || randomUUID();
  const items = Array.isArray(req.body?.items) ? req.body.items : [];

  if (!UUID_PATTERN.test(saleId || '') || !UUID_PATTERN.test(cashSessionId || '')) {
    throw new AppError(
      'Selecciona una venta y un turno abierto válidos.',
      422,
      'INVALID_RETURN_CONTEXT',
    );
  }
  if (!reason || !REFUND_METHODS.has(refundMethod) || !items.length || items.length > 100) {
    throw new AppError(
      'Motivo, medio de reembolso y productos son obligatorios.',
      422,
      'INVALID_SALE_RETURN',
    );
  }
  if (
    (refundMethod === 'TRANSFER' &&
      (!UUID_PATTERN.test(bankAccountId || '') || !refundReference)) ||
    (refundMethod === 'CARD' && !refundReference)
  ) {
    throw new AppError(
      'El reembolso bancario requiere cuenta o referencia verificable.',
      422,
      'RETURN_REFUND_REFERENCE_REQUIRED',
    );
  }
  const requestedItems = new Map();
  for (const item of items) {
    const saleItemId = item?.saleItemId;
    const quantity = Number(item?.quantity);
    if (!UUID_PATTERN.test(saleItemId || '') ||
        !Number.isFinite(quantity) || quantity <= 0) {
      throw new AppError(
        'Las líneas y cantidades devueltas no son válidas.',
        422,
        'INVALID_RETURN_ITEMS',
      );
    }
    requestedItems.set(saleItemId, (requestedItems.get(saleItemId) || 0) + quantity);
  }

  const result = await withTransaction(async (client) => {
    const existing = await client.query(
      `SELECT id, return_number, total, status
       FROM sale_returns
       WHERE company_id = $1 AND idempotency_key = $2`,
      [req.context.tenantId, idempotencyKey],
    );
    if (existing.rowCount) return { ...existing.rows[0], repeated: true };

    const saleResult = await client.query(
      `SELECT sale.id, sale.status, sale.total, sale.returned_total,
              sale.sale_terms, sale.cash_session_id original_cash_session_id,
              sale.document_type, sale.customer_id,
              document.id electronic_document_id, document.status electronic_status,
              document.provider_reference, document.document_number,
              document.prefix
       FROM sales sale
       LEFT JOIN electronic_documents document
         ON document.sale_id = sale.id AND document.company_id = sale.company_id
       WHERE sale.id = $1 AND sale.company_id = $2
       FOR UPDATE OF sale`,
      [saleId, req.context.tenantId],
    );
    if (!saleResult.rowCount || saleResult.rows[0].status === 'VOIDED') {
      throw new AppError(
        'La venta no existe o ya fue anulada.',
        404,
        'SALE_NOT_RETURNABLE',
      );
    }
    const sale = saleResult.rows[0];
    if (sale.sale_terms === 'CREDIT') {
      throw new AppError(
        'Las ventas a crédito deben aplicar primero la nota a cartera.',
        409,
        'CREDIT_RETURN_REQUIRES_RECEIVABLE_ADJUSTMENT',
      );
    }
    if (sale.electronic_document_id && !correctionConceptCode) {
      throw new AppError(
        'La devolución fiscal requiere el concepto DIAN validado para la nota crédito.',
        422,
        'CREDIT_NOTE_CONCEPT_REQUIRED',
      );
    }
    const session = await client.query(
      `SELECT session.id
       FROM cash_sessions session
       JOIN cash_registers register ON register.id = session.cash_register_id
       WHERE session.id = $1 AND session.tenant_id = $2
         AND session.status = 'OPEN'
         AND ($3::uuid IS NULL OR register.branch_id = $3)
       FOR UPDATE OF session`,
      [cashSessionId, req.context.tenantId, req.context.branchId],
    );
    if (!session.rowCount) {
      throw new AppError(
        'La devolución requiere un turno de caja abierto.',
        409,
        'CASH_SESSION_REQUIRED',
      );
    }
    if (refundMethod === 'TRANSFER') {
      const bank = await client.query(
        `SELECT id FROM bank_accounts
         WHERE id = $1 AND tenant_id = $2 AND active = TRUE
         FOR SHARE`,
        [bankAccountId, req.context.tenantId],
      );
      if (!bank.rowCount) {
        throw new AppError(
          'La cuenta bancaria no pertenece a la empresa activa.',
          422,
          'RETURN_BANK_ACCOUNT_INVALID',
        );
      }
    }

    const saleItems = await client.query(
      `SELECT item.id, item.product_id, item.warehouse_id, item.quantity,
              item.unit_price, item.unit_cost, item.tax_rate,
              item.tax_amount, item.line_total,
              COALESCE(returned.quantity, 0) returned_quantity
       FROM sale_items item
       LEFT JOIN LATERAL (
         SELECT SUM(return_item.quantity) quantity
         FROM sale_return_items return_item
         JOIN sale_returns header
           ON header.id = return_item.sale_return_id
          AND header.company_id = return_item.company_id
          AND header.status = 'COMPLETED'
         WHERE return_item.company_id = item.seller_company_id
           AND return_item.sale_item_id = item.id
       ) returned ON TRUE
       WHERE item.sale_id = $1 AND item.seller_company_id = $2
         AND item.id = ANY($3::uuid[])
       FOR UPDATE OF item`,
      [saleId, req.context.tenantId, [...requestedItems.keys()]],
    );
    if (saleItems.rowCount !== requestedItems.size) {
      throw new AppError(
        'Una línea no pertenece a la venta seleccionada.',
        422,
        'RETURN_ITEM_SCOPE_INVALID',
      );
    }

    const lines = [];
    let subtotal = 0;
    let taxTotal = 0;
    let total = 0;
    for (const item of saleItems.rows) {
      const quantity = requestedItems.get(item.id);
      const available = Number(item.quantity) - Number(item.returned_quantity);
      if (quantity > available + 0.00001) {
        throw new AppError(
          'La devolución supera las unidades disponibles en la venta.',
          409,
          'RETURN_QUANTITY_EXCEEDED',
        );
      }
      const ratio = quantity / Number(item.quantity);
      const lineTotal = money(Number(item.line_total) * ratio);
      const taxAmount = money(Number(item.tax_amount) * ratio);
      const lineSubtotal = money(lineTotal - taxAmount);
      subtotal = money(subtotal + lineSubtotal);
      taxTotal = money(taxTotal + taxAmount);
      total = money(total + lineTotal);
      lines.push({
        ...item,
        quantity,
        subtotal: lineSubtotal,
        taxAmount,
        lineTotal,
      });
    }

    const header = await client.query(
      `INSERT INTO sale_returns(
         company_id, sale_id, cash_session_id, refund_method,
         subtotal, tax_total, total, refund_reference, bank_account_id,
         reason, idempotency_key, created_by
       )
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [
        req.context.tenantId,
        saleId,
        cashSessionId,
        refundMethod,
        subtotal,
        taxTotal,
        total,
        refundReference,
        refundMethod === 'TRANSFER' ? bankAccountId : null,
        reason,
        idempotencyKey,
        req.context.userId,
      ],
    );
    const saleReturn = header.rows[0];
    for (const line of lines) {
      await client.query(
        `INSERT INTO sale_return_items(
           company_id, sale_return_id, sale_item_id, product_id, warehouse_id,
           quantity, unit_price, unit_cost, tax_rate, subtotal, tax_amount, line_total
         )
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [
          req.context.tenantId,
          saleReturn.id,
          line.id,
          line.product_id,
          line.warehouse_id,
          line.quantity,
          line.unit_price,
          line.unit_cost,
          line.tax_rate,
          line.subtotal,
          line.taxAmount,
          line.lineTotal,
        ],
      );
      await client.query(
        `INSERT INTO inventory_movements(
           tenant_id, company_id, product_id, warehouse_id, movement_type,
           quantity, unit_cost, reference_type, reference_id, reason, created_by
         )
         VALUES($1,$1,$2,$3,'SALE_RETURN',$4,$5,'SALE_RETURN',$6,$7,$8)`,
        [
          req.context.tenantId,
          line.product_id,
          line.warehouse_id,
          line.quantity,
          line.unit_cost,
          saleReturn.id,
          reason,
          req.context.userId,
        ],
      );
      await client.query(
        `INSERT INTO inventory_balances(
           tenant_id, product_id, warehouse_id, on_hand, reserved, updated_at
         )
         VALUES($1,$2,$3,$4,0,now())
         ON CONFLICT(tenant_id, product_id, warehouse_id)
         DO UPDATE SET on_hand = inventory_balances.on_hand + EXCLUDED.on_hand,
                       updated_at = now()`,
        [req.context.tenantId, line.product_id, line.warehouse_id, line.quantity],
      );
    }

    let adjustmentNote = null;
    if (sale.electronic_document_id) {
      const note = await client.query(
        `INSERT INTO electronic_adjustment_notes(
           company_id, original_document_id, note_type, reason_code, reason,
           subtotal, tax_total, total, created_by
         )
         VALUES($1,$2,'CREDIT_NOTE',$3,$4,$5,$6,$7,$8)
         RETURNING id, status`,
        [
          req.context.tenantId,
          sale.electronic_document_id,
          correctionConceptCode,
          reason,
          subtotal,
          taxTotal,
          total,
          req.context.userId,
        ],
      );
      adjustmentNote = note.rows[0];
      await client.query(
        `UPDATE sale_returns
         SET electronic_adjustment_note_id = $2
         WHERE id = $1 AND company_id = $3`,
        [saleReturn.id, adjustmentNote.id, req.context.tenantId],
      );
    }

    if (refundMethod === 'CASH') {
      await client.query(
        `INSERT INTO cash_movements(
           tenant_id, cash_session_id, movement_type, category, amount,
           reference, notes, created_by
         )
         VALUES($1,$2,'EXPENSE','Devolución de venta',$3,$4,$5,$6)`,
        [
          req.context.tenantId,
          cashSessionId,
          total,
          saleReturn.return_number,
          reason,
          req.context.userId,
        ],
      );
    }

    const accumulated = money(Number(sale.returned_total) + total);
    const returnStatus = accumulated >= money(Number(sale.total)) ? 'FULL' : 'PARTIAL';
    await client.query(
      `UPDATE sales
       SET returned_total = $3, return_status = $4
       WHERE id = $1 AND company_id = $2`,
      [saleId, req.context.tenantId, accumulated, returnStatus],
    );
    await postSaleReturnAccounting(client, {
      tenantId: req.context.tenantId,
      saleReturnId: saleReturn.id,
      userId: req.context.userId,
    });
    await writeAudit(client, {
      tenantId: req.context.tenantId,
      userId: req.context.userId,
      action: returnStatus === 'FULL'
        ? 'pos.sale_fully_returned'
        : 'pos.sale_partially_returned',
      entityType: 'sale_return',
      entityId: saleReturn.id,
      before: {
        saleId,
        returnedTotal: sale.returned_total,
      },
      after: {
        returnNumber: saleReturn.return_number,
        refundMethod,
        subtotal,
        taxTotal,
        total,
        returnStatus,
        adjustmentNoteId: adjustmentNote?.id || null,
      },
      reason,
    });
    return {
      ...saleReturn,
      return_status: returnStatus,
      electronic_adjustment_note_id: adjustmentNote?.id || null,
      items: lines.map((line) => ({
        saleItemId: line.id,
        productId: line.product_id,
        quantity: line.quantity,
        lineTotal: line.lineTotal,
      })),
    };
  });
  res.status(result.repeated ? 200 : 201).json(result);
}));

export default router;
