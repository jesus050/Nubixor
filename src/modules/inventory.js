import { Router } from 'express';
import { query, withTransaction } from '../db.js';
import { requireTenant } from '../middleware.js';
import { writeAudit } from '../audit.js';
const router = Router();
router.use(requireTenant);
router.get('/balances', async (req, res) => {
  const result = await query(`SELECT ib.*,p.sku,p.name,w.name warehouse_name FROM inventory_balances ib JOIN products p ON p.id=ib.product_id JOIN warehouses w ON w.id=ib.warehouse_id WHERE ib.tenant_id=$1 ORDER BY p.name,w.name`,[req.context.tenantId]);
  res.json(result.rows);
});
router.post('/movements', async (req, res) => {
  const { productId, warehouseId, movementType, quantity, unitCost = 0, reason, referenceType = null, referenceId = null } = req.body;
  if (!productId || !warehouseId || !movementType || !quantity || !reason) return res.status(422).json({ error:'productId, warehouseId, movementType, quantity y reason son obligatorios.' });
  const signed = ['PURCHASE','RETURN_IN','TRANSFER_IN','ADJUSTMENT_IN'].includes(movementType) ? Math.abs(Number(quantity)) : -Math.abs(Number(quantity));
  const movement = await withTransaction(async (client) => {
    const created = await client.query(`INSERT INTO inventory_movements(tenant_id,product_id,warehouse_id,movement_type,quantity,unit_cost,reference_type,reference_id,reason,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,[req.context.tenantId,productId,warehouseId,movementType,signed,unitCost,referenceType,referenceId,reason,req.context.userId]);
    const balance = await client.query(`INSERT INTO inventory_balances(tenant_id,product_id,warehouse_id,on_hand) VALUES($1,$2,$3,$4) ON CONFLICT(tenant_id,product_id,warehouse_id) DO UPDATE SET on_hand=inventory_balances.on_hand + EXCLUDED.on_hand, updated_at=now() RETURNING *`,[req.context.tenantId,productId,warehouseId,signed]);
    if (Number(balance.rows[0].on_hand) < 0) { const e=new Error('El movimiento dejaría inventario negativo.'); e.status=409; throw e; }
    await writeAudit(client,{tenantId:req.context.tenantId,userId:req.context.userId,action:'inventory.movement_created',entityType:'inventory_movement',entityId:created.rows[0].id,after:created.rows[0],reason});
    return { movement:created.rows[0], balance:balance.rows[0] };
  });
  res.status(201).json(movement);
});
export default router;
