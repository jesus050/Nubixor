import { Router } from 'express';
import { query, withTransaction } from '../db.js';
import { requireTenant } from '../middleware.js';
import { writeAudit } from '../audit.js';
import { asyncHandler } from '../shared/async-handler.js';
const router = Router();
router.use(requireTenant);
router.get('/', asyncHandler(async (req, res) => {
  const result = await query(`SELECT p.*, tc.name tax_name, tc.rate tax_rate FROM products p LEFT JOIN tax_categories tc ON tc.id=p.sales_tax_category_id WHERE p.tenant_id=$1 AND p.deleted_at IS NULL ORDER BY p.name`, [req.context.tenantId]);
  res.json(result.rows);
}));
router.post('/', asyncHandler(async (req, res) => {
  const { sku, name, barcode = null, category = null, salesTaxCategoryId = null, cost = 0, salePrice = 0 } = req.body;
  if (!sku || !name) return res.status(422).json({ error: 'sku y name son obligatorios.' });
  const product = await withTransaction(async (client) => {
    const result = await client.query(`INSERT INTO products(tenant_id,sku,name,barcode,category,sales_tax_category_id,cost,sale_price,tax_review_status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`, [req.context.tenantId,sku,name,barcode,category,salesTaxCategoryId,cost,salePrice,salesTaxCategoryId ? 'REVIEWED' : 'PENDING']);
    await writeAudit(client, { tenantId:req.context.tenantId, userId:req.context.userId, action:'product.created', entityType:'product', entityId:result.rows[0].id, after:result.rows[0] });
    return result.rows[0];
  });
  res.status(201).json(product);
}));
router.patch('/:id/tax', asyncHandler(async (req, res) => {
  const { taxCategoryId, reason } = req.body;
  if (!taxCategoryId || !reason) return res.status(422).json({ error: 'taxCategoryId y reason son obligatorios.' });
  const product = await withTransaction(async (client) => {
    const current = await client.query('SELECT * FROM products WHERE id=$1 AND tenant_id=$2 AND deleted_at IS NULL FOR UPDATE', [req.params.id, req.context.tenantId]);
    if (!current.rowCount) { const e=new Error('Producto no encontrado.'); e.status=404; throw e; }
    const updated = await client.query(`UPDATE products SET sales_tax_category_id=$1,tax_review_status='REVIEWED',updated_at=now() WHERE id=$2 RETURNING *`, [taxCategoryId, req.params.id]);
    await client.query(`INSERT INTO product_tax_history(tenant_id,product_id,previous_tax_category_id,new_tax_category_id,changed_by,reason) VALUES($1,$2,$3,$4,$5,$6)`, [req.context.tenantId,req.params.id,current.rows[0].sales_tax_category_id,taxCategoryId,req.context.userId,reason]);
    await writeAudit(client,{tenantId:req.context.tenantId,userId:req.context.userId,action:'product.tax_changed',entityType:'product',entityId:req.params.id,before:current.rows[0],after:updated.rows[0],reason});
    return updated.rows[0];
  });
  res.json(product);
}));
export default router;
