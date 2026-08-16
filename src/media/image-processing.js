import { createHash } from 'node:crypto';
import { AppError } from '../shared/errors.js';

export const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const EXTENSIONS = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);

export function extensionForMime(mimeType) {
  return EXTENSIONS.get(mimeType);
}

export function safeOriginalFilename(value, fallback = 'imagen') {
  const normalized = String(value || '')
    .normalize('NFKC')
    .replace(/[\u0000-\u001f/\\:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
  return (normalized || fallback).slice(0, 180);
}

export function hasValidImageSignature(mimeType, buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return false;
  if (mimeType === 'image/jpeg') {
    return buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
  }
  if (mimeType === 'image/png') {
    return buffer.subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }
  if (mimeType === 'image/webp') {
    return buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  }
  return false;
}

function readPngDimensions(buffer) {
  if (!hasValidImageSignature('image/png', buffer) || buffer.length < 24) return {};
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function readWebpDimensions(buffer) {
  if (!hasValidImageSignature('image/webp', buffer) || buffer.length < 30) return {};
  const chunk = buffer.subarray(12, 16).toString('ascii');
  if (chunk === 'VP8 ' && buffer.length >= 30) {
    return {
      width: buffer.readUInt16LE(26) & 0x3fff,
      height: buffer.readUInt16LE(28) & 0x3fff,
    };
  }
  if (chunk === 'VP8L' && buffer.length >= 25) {
    const b0 = buffer[21];
    const b1 = buffer[22];
    const b2 = buffer[23];
    const b3 = buffer[24];
    return {
      width: 1 + (((b1 & 0x3f) << 8) | b0),
      height: 1 + ((b3 << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6)),
    };
  }
  if (chunk === 'VP8X' && buffer.length >= 30) {
    return {
      width: 1 + buffer.readUIntLE(24, 3),
      height: 1 + buffer.readUIntLE(27, 3),
    };
  }
  return {};
}

function readJpegDimensions(buffer) {
  if (!hasValidImageSignature('image/jpeg', buffer)) return {};
  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);
    if (!length || offset + 2 + length > buffer.length) break;
    const isSof = (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf);
    if (isSof) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      };
    }
    offset += 2 + length;
  }
  return {};
}

export function readImageDimensions(mimeType, buffer) {
  if (mimeType === 'image/png') return readPngDimensions(buffer);
  if (mimeType === 'image/webp') return readWebpDimensions(buffer);
  if (mimeType === 'image/jpeg') return readJpegDimensions(buffer);
  return {};
}

export function decodeImageDataUrl(dataUrl, {
  maxBytes,
  maxWidth,
} = {}) {
  const match = typeof dataUrl === 'string'
    ? dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,([a-z0-9+/=\s]+)$/i)
    : null;
  if (!match) {
    throw new AppError('La imagen debe ser JPG, PNG o WEBP.', 422, 'MEDIA_TYPE_INVALID');
  }
  const mimeType = match[1].toLowerCase();
  if (!ALLOWED_IMAGE_TYPES.has(mimeType)) {
    throw new AppError('El tipo de imagen no está permitido.', 422, 'MEDIA_TYPE_INVALID');
  }
  const buffer = Buffer.from(match[2].replace(/\s/g, ''), 'base64');
  if (!buffer.length) {
    throw new AppError('La imagen está vacía.', 422, 'MEDIA_FILE_EMPTY');
  }
  if (maxBytes && buffer.length > maxBytes) {
    throw new AppError('La imagen supera el tamaño máximo permitido.', 422, 'MEDIA_SIZE_LIMIT');
  }
  if (!hasValidImageSignature(mimeType, buffer)) {
    throw new AppError(
      'El contenido del archivo no coincide con un formato de imagen permitido.',
      422,
      'MEDIA_SIGNATURE_INVALID',
    );
  }
  const dimensions = readImageDimensions(mimeType, buffer);
  if (maxWidth && dimensions.width && dimensions.width > maxWidth) {
    throw new AppError(
      `La imagen supera el ancho máximo permitido de ${maxWidth}px.`,
      422,
      'MEDIA_DIMENSIONS_LIMIT',
    );
  }
  return {
    buffer,
    mimeType,
    sha256: createHash('sha256').update(buffer).digest('hex'),
    width: dimensions.width || null,
    height: dimensions.height || null,
  };
}
