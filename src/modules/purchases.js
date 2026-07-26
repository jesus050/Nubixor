import { Router } from 'express';
import { query } from '../db.js';
import { requireTenant } from '../middleware.js';
const router = Router();
router.use(requireTenant);
router.post('/', async (req,res) => {
  const { supplierId, branchId, documentType, documentNumber=null, electronicInvoice=false, supportDocumentRequired=false, notes=null }=req.body;
  if(!supplierId || !branchId || !documentType) return res.status(422).json({error:'supplierId, branchId y documentType son obligatorios.'});
  const result=await query(`INSERT INTO purchases(tenant_id,supplier_id,branch_id,document_type,document_number,electronic_invoice,support_document_required,notes,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,[req.context.tenantId,supplierId,branchId,documentType,documentNumber,electronicInvoice,supportDocumentRequired,notes,req.context.userId]);
  res.status(201).json(result.rows[0]);
});
export default router;
