import { createHash, randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { config } from './config.js';
import { AppError } from './shared/errors.js';

const storageRoot = path.resolve(config.storageDir);
const EXTENSIONS = new Map([
  ['application/pdf', 'pdf'],
  ['application/xml', 'xml'],
  ['text/xml', 'xml'],
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);

function safeFileName(value, fallback) {
  const normalized = String(value || '').trim().replace(/[\u0000-\u001f/\\]/g, '-');
  return (normalized || fallback).slice(0, 240);
}

export function decodeProviderArtifact(payload, {
  contentField,
  fileNameField = 'file_name',
  fallbackName,
  contentType,
}) {
  const source = payload?.data && typeof payload.data === 'object' ? payload.data : payload;
  const encoded = source?.[contentField];
  if (typeof encoded !== 'string' || !encoded.trim()) {
    throw new AppError(
      `Factus no entregó el contenido ${contentType} esperado.`,
      502,
      'FISCAL_ARTIFACT_MISSING',
    );
  }
  const buffer = Buffer.from(encoded.replace(/\s/g, ''), 'base64');
  if (!buffer.length) {
    throw new AppError(
      'El archivo fiscal recibido está vacío.',
      502,
      'FISCAL_ARTIFACT_EMPTY',
    );
  }
  return {
    buffer,
    contentType,
    originalName: safeFileName(source?.[fileNameField], fallbackName),
  };
}

export async function stageSecureArtifact({
  tenantId,
  buffer,
  contentType,
  originalName,
}) {
  const extension = EXTENSIONS.get(contentType);
  if (!extension || !Buffer.isBuffer(buffer) || !buffer.length) {
    throw new AppError(
      'El archivo fiscal no tiene un formato admitido.',
      422,
      'FISCAL_ARTIFACT_INVALID',
    );
  }
  const id = randomUUID();
  const storageKey = path.join('documents', tenantId, `${id}.${extension}`);
  const filePath = path.resolve(storageRoot, storageKey);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, buffer, { flag: 'wx', mode: 0o600 });
  return {
    id,
    tenantId,
    storageKey,
    filePath,
    contentType,
    originalName: safeFileName(originalName, `documento-fiscal.${extension}`),
    byteSize: buffer.length,
    sha256: createHash('sha256').update(buffer).digest('hex'),
  };
}

export async function removeStagedArtifacts(artifacts) {
  await Promise.all(
    (artifacts || []).map((artifact) => unlink(artifact.filePath).catch(() => {})),
  );
}

export async function insertStagedArtifact(client, {
  artifact,
  tenantId,
  userId,
  description,
  category = 'SALE',
}) {
  const result = await client.query(
    `INSERT INTO secure_documents(
       id, tenant_id, category, original_name, storage_key, content_type,
       byte_size, sha256, description, uploaded_by
     )
     VALUES($1,$2,$10,$3,$4,$5,$6,$7,$8,$9)
     RETURNING id, original_name, content_type, byte_size, sha256, created_at`,
    [
      artifact.id,
      tenantId,
      artifact.originalName,
      artifact.storageKey,
      artifact.contentType,
      artifact.byteSize,
      artifact.sha256,
      description,
      userId,
      category,
    ],
  );
  return result.rows[0];
}
