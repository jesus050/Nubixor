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

// Espeja EVIDENCE_MAX_DIMENSION de public/app.js. El navegador reduce la foto
// antes de subirla porque el servidor rechaza cualquier imagen más ancha que
// MEDIA_MAX_WIDTH; si alguien sube este tope por encima del límite del
// servidor, la evidencia operativa vuelve a fallar con 422 en producción.
const CLIENT_EVIDENCE_MAX_DIMENSION = 1600;
const SERVER_MAX_WIDTH = 2000;

function pngWithDimensions(width, height) {
  const buffer = Buffer.from(PNG_1X1);
  buffer.writeUInt32BE(width, 16);
  buffer.writeUInt32BE(height, 20);
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

test('evidencia: el tope del cliente cabe dentro del ancho máximo del servidor', () => {
  assert.ok(
    CLIENT_EVIDENCE_MAX_DIMENSION < SERVER_MAX_WIDTH,
    'El redimensionado del navegador debe quedar bajo MEDIA_MAX_WIDTH.',
  );

  const resized = decodeImageDataUrl(
    pngWithDimensions(CLIENT_EVIDENCE_MAX_DIMENSION, 1200),
    { maxBytes: 1024 * 1024, maxWidth: SERVER_MAX_WIDTH },
  );
  assert.equal(resized.width, CLIENT_EVIDENCE_MAX_DIMENSION);
});

test('evidencia: una foto de celular sin redimensionar es rechazada', () => {
  // 3024px es el ancho típico de una cámara de teléfono: sin el escalado del
  // cliente, adjuntar la evidencia de un ajuste fallaría siempre.
  assert.throws(
    () => decodeImageDataUrl(pngWithDimensions(3024, 4032), {
      maxBytes: 1024 * 1024,
      maxWidth: SERVER_MAX_WIDTH,
    }),
    /ancho máximo permitido/,
  );
});
