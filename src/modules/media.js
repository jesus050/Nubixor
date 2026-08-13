import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { Router } from 'express';
import { writeAudit } from '../audit.js';
import { config } from '../config.js';
import { query, withTransaction } from '../db.js';
import { requireTenant } from '../middleware.js';
import { createRateLimiter } from '../middleware/rate-limiter.js';
import {
  createStorageProvider,
  LocalStorageProvider,
} from '../media/storage-provider.js';
import {
  decodeImageDataUrl,
  extensionForMime,
  safeOriginalFilename,
} from '../media/image-processing.js';
import { asyncHandler } from '../shared/async-handler.js';
import { AppError } from '../shared/errors.js';

const router = Router();
const UUID_PATTERN = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const ENTITY_TYPES = new Set([
  'PRODUCT',
  'PRODUCT_VARIANT',
  'GOODS_RECEIPT',
  'GOODS_RECEIPT_ITEM',
  'INVENTORY_COUNT',
  'INVENTORY_COUNT_LINE',
  'INVENTORY_ADJUSTMENT',
  'RETURN',
  'TRANSFER',
  'PURCHASE',
]);
const PURPOSES = new Set([
  'PRIMARY_IMAGE',
  'GALLERY',
  'DAMAGE_EVIDENCE',
  'COUNT_EVIDENCE',
  'RECEIPT_EVIDENCE',
  'DIFFERENCE_EVIDENCE',
  'RETURN_EVIDENCE',
  'GENERAL_EVIDENCE',
]);
const COMMERCIAL_PURPOSES = new Set(['PRIMARY_IMAGE', 'GALLERY']);

const uploadLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: (req) => `${req.context?.tenantId || 'no-tenant'}:${req.context?.userId || req.ip}`,
  message: 'Demasiadas cargas de imágenes. Espera un momento e intenta de nuevo.',
  errorCode: 'MEDIA_UPLOAD_RATE_LIMITED',
});

function normalizeEnum(value, allowed, fieldName) {
  const normalized = String(value || '').trim().toUpperCase();
  if (!allowed.has(normalized)) {
    throw new AppError(`${fieldName} no es válido.`, 422, 'MEDIA_REFERENCE_INVALID');
  }
  return normalized;
}

function normalizeUuid(value, fieldName) {
  if (!UUID_PATTERN.test(String(value || ''))) {
    throw new AppError(`${fieldName} debe tener un UUID válido.`, 422, 'MEDIA_REFERENCE_INVALID');
  }
  return value;
}

async function assertEntityOwnership(client, { tenantId, entityType, entityId }) {
  const checks = {
    PRODUCT: {
      sql: 'SELECT 1 FROM products WHERE tenant_id = $1 AND id = $2 AND deleted_at IS NULL',
    },
    PRODUCT_VARIANT: {
      sql: `SELECT 1 FROM product_variants WHERE tenant_id = $1 AND id = $2
            UNION ALL
            SELECT 1 FROM products
            WHERE tenant_id = $1 AND id = $2 AND product_kind = 'VARIANT' AND deleted_at IS NULL
            LIMIT 1`,
    },
    PURCHASE: {
      sql: 'SELECT 1 FROM purchases WHERE tenant_id = $1 AND id = $2',
    },
    GOODS_RECEIPT: {
      sql: 'SELECT 1 FROM purchase_receipts WHERE tenant_id = $1 AND id = $2',
      optional: true,
    },
    GOODS_RECEIPT_ITEM: {
      sql: 'SELECT 1 FROM purchase_receipt_items WHERE tenant_id = $1 AND id = $2',
      optional: true,
    },
    INVENTORY_COUNT: {
      sql: 'SELECT 1 FROM inventory_counts WHERE tenant_id = $1 AND id = $2',
    },
    INVENTORY_COUNT_LINE: {
      sql: 'SELECT 1 FROM inventory_count_items WHERE tenant_id = $1 AND id = $2',
    },
    INVENTORY_ADJUSTMENT: {
      sql: `SELECT 1 FROM inventory_movements
            WHERE tenant_id = $1 AND id = $2 AND movement_type ILIKE '%ADJUST%'`,
    },
    RETURN: {
      sql: 'SELECT 1 FROM sale_returns WHERE company_id = $1 AND id = $2',
    },
    TRANSFER: {
      sql: 'SELECT 1 FROM inventory_transfer_orders WHERE company_id = $1 AND id = $2',
    },
  };

  const check = checks[entityType];
  if (!check) throw new AppError('Tipo de entidad no permitido.', 422, 'MEDIA_ENTITY_INVALID');
  try {
    const result = await client.query(check.sql, [tenantId, entityId]);
    if (!result.rowCount) {
      throw new AppError(
        'La entidad no existe o no pertenece a la empresa activa.',
        404,
        'MEDIA_ENTITY_NOT_FOUND',
      );
    }
  } catch (error) {
    if (check.optional && error?.code === '42P01') {
      throw new AppError(
        'Este tipo de evidencia aún no tiene tabla operativa instalada.',
        422,
        'MEDIA_ENTITY_NOT_AVAILABLE',
      );
    }
    throw error;
  }
}

function mediaResponse(row) {
  return {
    id: row.id,
    companyId: row.company_id,
    storageProvider: row.storage_provider,
    originalFilename: row.original_filename,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    width: row.width,
    height: row.height,
    sha256: row.sha256,
    metadata: row.metadata,
    createdAt: row.created_at,
    url: `/api/media/assets/${row.id}/content`,
  };
}

router.use(requireTenant);

router.get('/policy', asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT require_on_damage "requireOnDamage",
            require_on_receipt_difference "requireOnReceiptDifference",
            require_on_manual_adjustment "requireOnManualAdjustment",
            require_on_count_difference "requireOnCountDifference",
            adjustment_threshold_quantity "adjustmentThresholdQuantity",
            adjustment_threshold_value "adjustmentThresholdValue",
            require_supervisor_approval "requireSupervisorApproval",
            require_different_user_for_recount "requireDifferentUserForRecount",
            blind_count_enabled "blindCountEnabled"
     FROM inventory_evidence_policies
     WHERE company_id = $1`,
    [req.context.tenantId],
  );
  res.json(result.rows[0] || {
    requireOnDamage: true,
    requireOnReceiptDifference: true,
    requireOnManualAdjustment: false,
    requireOnCountDifference: false,
    adjustmentThresholdQuantity: null,
    adjustmentThresholdValue: null,
    requireSupervisorApproval: false,
    requireDifferentUserForRecount: false,
    blindCountEnabled: false,
  });
}));

router.post('/assets', uploadLimiter, asyncHandler(async (req, res) => {
  const originalFilename = safeOriginalFilename(req.body?.fileName, 'imagen');
  const description = typeof req.body?.description === 'string'
    ? req.body.description.trim().slice(0, 1000) || null
    : null;
  const maxBytes = config.mediaMaxUploadMb * 1024 * 1024;
  const decoded = decodeImageDataUrl(req.body?.dataUrl, {
    maxBytes,
    maxWidth: config.mediaMaxWidth,
  });
  const extension = extensionForMime(decoded.mimeType);
  const mediaId = randomUUID();
  const storageKey = path.join(
    'media',
    req.context.tenantId,
    `${mediaId}.${extension}`,
  );
  const provider = createStorageProvider();
  await provider.upload({ storageKey, buffer: decoded.buffer });
  try {
    const media = await withTransaction(async (client) => {
      const result = await client.query(
        `INSERT INTO media_assets(
           id, company_id, storage_provider, storage_key, original_filename,
           mime_type, size_bytes, width, height, sha256, created_by, metadata
         )
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb)
         RETURNING id, company_id, storage_provider, original_filename,
                   mime_type, size_bytes, width, height, sha256,
                   metadata, created_at`,
        [
          mediaId,
          req.context.tenantId,
          provider.name,
          storageKey,
          originalFilename,
          decoded.mimeType,
          decoded.buffer.length,
          decoded.width,
          decoded.height,
          decoded.sha256,
          req.context.userId,
          JSON.stringify({
            description,
            optimized: false,
            thumbnailGenerated: false,
            thumbnailWidth: config.mediaThumbWidth,
            originalStripped: false,
            stage: 'FOUNDATION',
          }),
        ],
      );
      await writeAudit(client, {
        tenantId: req.context.tenantId,
        userId: req.context.userId,
        action: 'media.asset_uploaded',
        entityType: 'media_asset',
        entityId: mediaId,
        after: result.rows[0],
        reason: description || 'Archivo de medios cargado',
        metadata: {
          requestId: req.context.requestId,
          ip: req.ip,
        },
      });
      return result.rows[0];
    });
    res.status(201).json(mediaResponse(media));
  } catch (error) {
    await provider.delete(storageKey);
    throw error;
  }
}));

router.get('/assets/:id/content', asyncHandler(async (req, res) => {
  const mediaId = normalizeUuid(req.params.id, 'mediaId');
  const result = await query(
    `SELECT id, company_id, storage_provider, storage_key, original_filename,
            mime_type, size_bytes, deleted_at
     FROM media_assets
     WHERE id = $1 AND company_id = $2`,
    [mediaId, req.context.tenantId],
  );
  if (!result.rowCount || result.rows[0].deleted_at) {
    throw new AppError('Archivo no encontrado.', 404, 'MEDIA_NOT_FOUND');
  }
  const media = result.rows[0];
  const provider = createStorageProvider(media.storage_provider);
  if (!(provider instanceof LocalStorageProvider)) {
    const signedUrl = await provider.getSignedUrl(media.storage_key);
    return res.json({ url: signedUrl });
  }
  if (!await provider.exists(media.storage_key)) {
    throw new AppError('El archivo no está disponible.', 404, 'MEDIA_FILE_MISSING');
  }
  res.setHeader('Content-Type', media.mime_type);
  res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(media.original_filename)}`);
  res.setHeader('Cache-Control', 'private, max-age=3600');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  provider.createReadStream(media.storage_key).pipe(res);
}));

router.post('/links', asyncHandler(async (req, res) => {
  const mediaId = normalizeUuid(req.body?.mediaId, 'mediaId');
  const entityType = normalizeEnum(req.body?.entityType, ENTITY_TYPES, 'entityType');
  const entityId = normalizeUuid(req.body?.entityId, 'entityId');
  const purpose = normalizeEnum(req.body?.purpose, PURPOSES, 'purpose');
  const isPrimary = req.body?.isPrimary === true || purpose === 'PRIMARY_IMAGE';
  const note = typeof req.body?.note === 'string'
    ? req.body.note.trim().slice(0, 1000) || null
    : null;

  if (COMMERCIAL_PURPOSES.has(purpose) && !['PRODUCT', 'PRODUCT_VARIANT'].includes(entityType)) {
    throw new AppError(
      'Las imágenes comerciales solo se pueden asociar a productos o variantes.',
      422,
      'MEDIA_PURPOSE_ENTITY_MISMATCH',
    );
  }
  if (!COMMERCIAL_PURPOSES.has(purpose) && ['PRODUCT', 'PRODUCT_VARIANT'].includes(entityType)) {
    throw new AppError(
      'Las evidencias operativas deben asociarse al proceso operativo correspondiente.',
      422,
      'MEDIA_PURPOSE_ENTITY_MISMATCH',
    );
  }

  const link = await withTransaction(async (client) => {
    const asset = await client.query(
      `SELECT id, company_id, storage_provider, original_filename, mime_type,
              size_bytes, width, height, sha256, metadata, created_at
       FROM media_assets
       WHERE id = $1 AND company_id = $2 AND deleted_at IS NULL`,
      [mediaId, req.context.tenantId],
    );
    if (!asset.rowCount) {
      throw new AppError('Archivo no encontrado.', 404, 'MEDIA_NOT_FOUND');
    }
    await assertEntityOwnership(client, {
      tenantId: req.context.tenantId,
      entityType,
      entityId,
    });
    if (isPrimary) {
      await client.query(
        `UPDATE media_links
         SET is_primary = FALSE
         WHERE company_id = $1
           AND entity_type = $2
           AND entity_id = $3
           AND purpose = $4
           AND is_primary = TRUE`,
        [req.context.tenantId, entityType, entityId, purpose],
      );
    }
    const result = await client.query(
      `INSERT INTO media_links(
         company_id, media_id, entity_type, entity_id, purpose, is_primary, created_by
       )
       VALUES($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT(company_id, media_id, entity_type, entity_id, purpose)
       DO UPDATE SET is_primary = EXCLUDED.is_primary
       RETURNING id, company_id, media_id, entity_type, entity_id,
                 purpose, is_primary, created_at`,
      [
        req.context.tenantId,
        mediaId,
        entityType,
        entityId,
        purpose,
        isPrimary,
        req.context.userId,
      ],
    );
    await writeAudit(client, {
      tenantId: req.context.tenantId,
      userId: req.context.userId,
      action: COMMERCIAL_PURPOSES.has(purpose) ? 'media.commercial_linked' : 'media.evidence_linked',
      entityType: 'media_link',
      entityId: result.rows[0].id,
      after: {
        ...result.rows[0],
        media: asset.rows[0],
      },
      reason: note || 'Archivo asociado a entidad operativa',
      metadata: {
        requestId: req.context.requestId,
        linkedEntityType: entityType,
        linkedEntityId: entityId,
      },
    });
    return {
      ...result.rows[0],
      media: mediaResponse(asset.rows[0]),
    };
  });
  res.status(201).json(link);
}));

router.get('/links', asyncHandler(async (req, res) => {
  const entityType = normalizeEnum(req.query?.entityType, ENTITY_TYPES, 'entityType');
  const entityId = normalizeUuid(req.query?.entityId, 'entityId');
  const purpose = req.query?.purpose
    ? normalizeEnum(req.query.purpose, PURPOSES, 'purpose')
    : null;
  const result = await query(
    `SELECT link.id, link.entity_type, link.entity_id, link.purpose,
            link.is_primary, link.created_at,
            media.id media_id, media.company_id, media.storage_provider,
            media.original_filename, media.mime_type, media.size_bytes,
            media.width, media.height, media.sha256, media.metadata,
            media.created_at media_created_at
     FROM media_links link
     JOIN media_assets media
       ON media.id = link.media_id
      AND media.company_id = link.company_id
      AND media.deleted_at IS NULL
     WHERE link.company_id = $1
       AND link.entity_type = $2
       AND link.entity_id = $3
       AND ($4::text IS NULL OR link.purpose = $4)
     ORDER BY link.is_primary DESC, link.created_at DESC
     LIMIT 100`,
    [req.context.tenantId, entityType, entityId, purpose],
  );
  res.json(result.rows.map((row) => ({
    id: row.id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    purpose: row.purpose,
    isPrimary: row.is_primary,
    createdAt: row.created_at,
    media: mediaResponse({
      id: row.media_id,
      company_id: row.company_id,
      storage_provider: row.storage_provider,
      original_filename: row.original_filename,
      mime_type: row.mime_type,
      size_bytes: row.size_bytes,
      width: row.width,
      height: row.height,
      sha256: row.sha256,
      metadata: row.metadata,
      created_at: row.media_created_at,
    }),
  })));
}));

router.delete('/links/:id', asyncHandler(async (req, res) => {
  const linkId = normalizeUuid(req.params.id, 'linkId');
  const reason = typeof req.body?.reason === 'string'
    ? req.body.reason.trim().slice(0, 500) || null
    : null;
  const removed = await withTransaction(async (client) => {
    const current = await client.query(
      `DELETE FROM media_links
       WHERE id = $1 AND company_id = $2
       RETURNING *`,
      [linkId, req.context.tenantId],
    );
    if (!current.rowCount) {
      throw new AppError('Relación no encontrada.', 404, 'MEDIA_LINK_NOT_FOUND');
    }
    await writeAudit(client, {
      tenantId: req.context.tenantId,
      userId: req.context.userId,
      action: 'media.link_deleted',
      entityType: 'media_link',
      entityId: linkId,
      before: current.rows[0],
      reason: reason || 'Relación de archivo retirada',
    });
    return current.rows[0];
  });
  res.json({ deleted: true, link: removed });
}));

router.delete('/assets/:id', asyncHandler(async (req, res) => {
  const mediaId = normalizeUuid(req.params.id, 'mediaId');
  const reason = typeof req.body?.reason === 'string'
    ? req.body.reason.trim().slice(0, 500) || null
    : null;
  const result = await withTransaction(async (client) => {
    const current = await client.query(
      `UPDATE media_assets
       SET deleted_at = now()
       WHERE id = $1 AND company_id = $2 AND deleted_at IS NULL
       RETURNING id, company_id, storage_provider, storage_key, original_filename,
                 mime_type, size_bytes, width, height, sha256, metadata, created_at`,
      [mediaId, req.context.tenantId],
    );
    if (!current.rowCount) {
      throw new AppError('Archivo no encontrado.', 404, 'MEDIA_NOT_FOUND');
    }
    await writeAudit(client, {
      tenantId: req.context.tenantId,
      userId: req.context.userId,
      action: 'media.asset_deleted',
      entityType: 'media_asset',
      entityId: mediaId,
      before: current.rows[0],
      reason: reason || 'Archivo eliminado lógicamente',
    });
    return current.rows[0];
  });
  res.json({ deleted: true, media: mediaResponse(result) });
}));

export default router;
