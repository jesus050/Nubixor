import { access } from 'node:fs/promises';
import path from 'node:path';
import { Router } from 'express';
import { config } from '../config.js';
import { query } from '../db.js';
import { asyncHandler } from '../shared/async-handler.js';
import { AppError } from '../shared/errors.js';

const router = Router();
const UUID_PATTERN = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const storageRoot = path.resolve(config.storageDir);
const legacyImageRoot = path.resolve('public/uploads/product-images');

async function assertMembership(userId, tenantId) {
  const membership = await query(
    `SELECT 1
     FROM tenant_users
     WHERE tenant_id = $1 AND user_id = $2 AND status = 'ACTIVE'`,
    [tenantId, userId],
  );
  if (!membership.rowCount) {
    throw new AppError('No tienes acceso a este archivo.', 403, 'ASSET_ACCESS_DENIED');
  }
}

router.get('/product-images/:id', asyncHandler(async (req, res) => {
  if (!UUID_PATTERN.test(req.params.id)) {
    throw new AppError('La imagen no es válida.', 422, 'INVALID_IMAGE_ID');
  }
  const result = await query(
    `SELECT tenant_id, file_name, content_type
     FROM product_images WHERE id = $1`,
    [req.params.id],
  );
  if (!result.rowCount) {
    throw new AppError('Imagen no encontrada.', 404, 'IMAGE_NOT_FOUND');
  }
  const image = result.rows[0];
  await assertMembership(req.context.userId, image.tenant_id);
  const securePath = path.join(storageRoot, 'product-images', image.tenant_id, image.file_name);
  const legacyPath = path.join(legacyImageRoot, path.basename(image.file_name));
  let selectedPath = securePath;
  try {
    await access(securePath);
  } catch {
    selectedPath = legacyPath;
    try {
      await access(legacyPath);
    } catch {
      throw new AppError('El archivo de imagen no está disponible.', 404, 'IMAGE_FILE_MISSING');
    }
  }
  res.setHeader('Content-Type', image.content_type);
  res.setHeader('Cache-Control', 'private, max-age=3600');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.sendFile(selectedPath);
}));

router.get('/documents/:id', asyncHandler(async (req, res) => {
  if (!UUID_PATTERN.test(req.params.id)) {
    throw new AppError('El documento no es válido.', 422, 'INVALID_DOCUMENT_ID');
  }
  const result = await query(
    `SELECT tenant_id, original_name, storage_key, content_type
     FROM secure_documents WHERE id = $1`,
    [req.params.id],
  );
  if (!result.rowCount) {
    throw new AppError('Documento no encontrado.', 404, 'DOCUMENT_NOT_FOUND');
  }
  const document = result.rows[0];
  await assertMembership(req.context.userId, document.tenant_id);
  const filePath = path.resolve(storageRoot, document.storage_key);
  if (!filePath.startsWith(`${storageRoot}${path.sep}`)) {
    throw new AppError('Ruta de almacenamiento inválida.', 500, 'INVALID_STORAGE_KEY');
  }
  try {
    await access(filePath);
  } catch {
    throw new AppError('El archivo no está disponible.', 404, 'DOCUMENT_FILE_MISSING');
  }
  res.setHeader('Content-Type', document.content_type);
  res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(document.original_name)}`);
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.sendFile(filePath);
}));

export default router;
