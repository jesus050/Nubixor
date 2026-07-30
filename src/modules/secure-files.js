import { createHash, randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Router } from 'express';
import { writeAudit } from '../audit.js';
import { config } from '../config.js';
import { query, withTransaction } from '../db.js';
import { requireTenant } from '../middleware.js';
import { asyncHandler } from '../shared/async-handler.js';
import { AppError } from '../shared/errors.js';

const router = Router();
const MAX_DOCUMENT_BYTES = 8 * 1024 * 1024;
const DATA_PATTERN = /^data:(application\/pdf|image\/(?:jpeg|png|webp));base64,([a-z0-9+/=\s]+)$/i;
const CATEGORIES = new Set([
  'RUT', 'TAX', 'ACCOUNTING', 'BANK', 'PURCHASE', 'SALE', 'AUDIT', 'OTHER',
]);
const extensions = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
const storageRoot = path.resolve(config.storageDir);

function hasValidSignature(contentType, buffer) {
  if (contentType === 'application/pdf') {
    return buffer.subarray(0, 5).toString('ascii') === '%PDF-';
  }
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

router.use(requireTenant);

router.get('/', asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT id, category, original_name, content_type, byte_size, sha256,
            description, uploaded_by, created_at,
            '/api/assets/documents/' || id::text content_url
     FROM secure_documents
     WHERE tenant_id = $1
     ORDER BY created_at DESC`,
    [req.context.tenantId],
  );
  res.json(result.rows);
}));

router.post('/', asyncHandler(async (req, res) => {
  const category = String(req.body?.category || '').trim().toUpperCase();
  const originalName = String(req.body?.fileName || '').trim();
  const description = String(req.body?.description || '').trim() || null;
  const match = typeof req.body?.dataUrl === 'string'
    ? req.body.dataUrl.match(DATA_PATTERN)
    : null;
  if (!CATEGORIES.has(category) || !originalName || !match) {
    throw new AppError(
      'Categoría, nombre y archivo PDF/JPG/PNG/WEBP son obligatorios.',
      422,
      'INVALID_SECURE_DOCUMENT',
    );
  }
  if (originalName.length > 240 || description?.length > 1000) {
    throw new AppError('El nombre o la descripción son demasiado largos.', 422, 'DOCUMENT_TOO_LONG');
  }
  const contentType = match[1].toLowerCase();
  const buffer = Buffer.from(match[2].replace(/\s/g, ''), 'base64');
  if (!buffer.length || buffer.length > MAX_DOCUMENT_BYTES) {
    throw new AppError('El documento debe pesar máximo 8 MB.', 422, 'DOCUMENT_SIZE_INVALID');
  }
  if (!hasValidSignature(contentType, buffer)) {
    throw new AppError(
      'El contenido no coincide con el formato declarado.',
      422,
      'DOCUMENT_SIGNATURE_INVALID',
    );
  }
  const documentId = randomUUID();
  const storageKey = path.join(
    'documents',
    req.context.tenantId,
    `${documentId}.${extensions[contentType]}`,
  );
  const filePath = path.resolve(storageRoot, storageKey);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, buffer, { flag: 'wx', mode: 0o600 });
  try {
    const document = await withTransaction(async (client) => {
      const result = await client.query(
        `INSERT INTO secure_documents(
           id, tenant_id, category, original_name, storage_key, content_type,
           byte_size, sha256, description, uploaded_by
         )
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         RETURNING id, category, original_name, content_type, byte_size,
                   sha256, description, created_at`,
        [
          documentId,
          req.context.tenantId,
          category,
          originalName,
          storageKey,
          contentType,
          buffer.length,
          createHash('sha256').update(buffer).digest('hex'),
          description,
          req.context.userId,
        ],
      );
      await writeAudit(client, {
        tenantId: req.context.tenantId,
        userId: req.context.userId,
        action: 'secure_document.uploaded',
        entityType: 'secure_document',
        entityId: documentId,
        after: result.rows[0],
        reason: description || 'Documento protegido cargado',
      });
      return result.rows[0];
    });
    res.status(201).json({
      ...document,
      content_url: `/api/assets/documents/${document.id}`,
    });
  } catch (error) {
    await unlink(filePath).catch(() => {});
    throw error;
  }
}));

export default router;
