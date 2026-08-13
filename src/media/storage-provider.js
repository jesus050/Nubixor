import { createReadStream } from 'node:fs';
import { access, mkdir, stat, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config.js';
import { AppError } from '../shared/errors.js';

export class StorageProvider {
  async upload() {
    throw new Error('StorageProvider.upload no está implementado.');
  }

  async delete() {
    throw new Error('StorageProvider.delete no está implementado.');
  }

  async getSignedUrl() {
    throw new Error('StorageProvider.getSignedUrl no está implementado.');
  }

  async exists() {
    throw new Error('StorageProvider.exists no está implementado.');
  }

  async getMetadata() {
    throw new Error('StorageProvider.getMetadata no está implementado.');
  }
}

function assertSafeStorageKey(root, storageKey) {
  const resolved = path.resolve(root, storageKey);
  if (!resolved.startsWith(`${root}${path.sep}`)) {
    throw new AppError('Ruta de almacenamiento inválida.', 500, 'INVALID_STORAGE_KEY');
  }
  return resolved;
}

export class LocalStorageProvider extends StorageProvider {
  constructor({ root = config.storageDir } = {}) {
    super();
    this.root = path.resolve(root);
    this.name = 'local';
  }

  async upload({ storageKey, buffer }) {
    if (!Buffer.isBuffer(buffer) || !buffer.length) {
      throw new AppError('El archivo está vacío.', 422, 'MEDIA_FILE_EMPTY');
    }
    const filePath = assertSafeStorageKey(this.root, storageKey);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, buffer, { flag: 'wx', mode: 0o600 });
    return { provider: this.name, storageKey };
  }

  async delete(storageKey) {
    const filePath = assertSafeStorageKey(this.root, storageKey);
    await unlink(filePath).catch(() => {});
  }

  async exists(storageKey) {
    const filePath = assertSafeStorageKey(this.root, storageKey);
    try {
      await access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async getMetadata(storageKey) {
    const filePath = assertSafeStorageKey(this.root, storageKey);
    const info = await stat(filePath);
    return {
      sizeBytes: info.size,
      modifiedAt: info.mtime,
    };
  }

  async getSignedUrl(storageKey) {
    return `/api/media/assets/${encodeURIComponent(storageKey)}`;
  }

  createReadStream(storageKey) {
    const filePath = assertSafeStorageKey(this.root, storageKey);
    return createReadStream(filePath);
  }
}

export class S3CompatibleStorageProvider extends StorageProvider {
  constructor() {
    super();
    this.name = 's3';
  }

  unavailable() {
    throw new AppError(
      'El almacenamiento S3 aún no está configurado para esta instalación.',
      503,
      'MEDIA_S3_NOT_CONFIGURED',
    );
  }

  async upload() { this.unavailable(); }
  async delete() { this.unavailable(); }
  async getSignedUrl() { this.unavailable(); }
  async exists() { this.unavailable(); }
  async getMetadata() { this.unavailable(); }
}

export function createStorageProvider(provider = config.mediaStorageProvider) {
  if (provider === 'local') return new LocalStorageProvider();
  return new S3CompatibleStorageProvider();
}
