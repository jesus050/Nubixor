import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  decodeImageDataUrl,
  hasValidImageSignature,
  safeOriginalFilename,
} from '../src/media/image-processing.js';
import { LocalStorageProvider } from '../src/media/storage-provider.js';

const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/lq6KyAAAAABJRU5ErkJggg==',
  'base64',
);

test('media valida MIME real, tamaño, hash y dimensiones básicas', () => {
  const dataUrl = `data:image/png;base64,${PNG_1X1.toString('base64')}`;
  const image = decodeImageDataUrl(dataUrl, { maxBytes: 1024, maxWidth: 20 });

  assert.equal(image.mimeType, 'image/png');
  assert.equal(image.width, 1);
  assert.equal(image.height, 1);
  assert.equal(image.sha256.length, 64);
  assert.equal(hasValidImageSignature('image/png', image.buffer), true);
});

test('media rechaza archivos disfrazados aunque el data URL declare imagen', () => {
  const fake = Buffer.from('<script>alert(1)</script>');
  assert.throws(
    () => decodeImageDataUrl(`data:image/png;base64,${fake.toString('base64')}`, {
      maxBytes: 1024,
      maxWidth: 2000,
    }),
    /formato de imagen permitido/,
  );
});

test('media rechaza archivos que superan el límite configurado', () => {
  assert.throws(
    () => decodeImageDataUrl(`data:image/png;base64,${PNG_1X1.toString('base64')}`, {
      maxBytes: 8,
      maxWidth: 2000,
    }),
    /tamaño máximo/,
  );
});

test('media sanitiza nombres para no permitir rutas físicas peligrosas', () => {
  assert.equal(
    safeOriginalFilename('../producto\\foto?.png'),
    '..-producto-foto-.png',
  );
});

test('LocalStorageProvider evita path traversal y confirma existencia', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'nubixor-media-'));
  const provider = new LocalStorageProvider({ root });
  try {
    await provider.upload({
      storageKey: 'media/tenant/asset.png',
      buffer: PNG_1X1,
    });
    assert.equal(await provider.exists('media/tenant/asset.png'), true);
    await assert.rejects(
      () => provider.upload({
        storageKey: '../escape.png',
        buffer: PNG_1X1,
      }),
      /Ruta de almacenamiento inválida/,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
