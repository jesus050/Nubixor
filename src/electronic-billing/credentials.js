import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { config } from '../config.js';
import { AppError } from '../shared/errors.js';

const VERSION = 1;
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function encryptionKey() {
  if (!config.electronicBillingEncryptionKey) {
    throw new AppError(
      'Configura ELECTRONIC_BILLING_ENCRYPTION_KEY antes de guardar credenciales reales.',
      503,
      'BILLING_ENCRYPTION_KEY_REQUIRED',
    );
  }
  return createHash('sha256')
    .update(config.electronicBillingEncryptionKey, 'utf8')
    .digest();
}

export function encryptBillingCredentials(credentials) {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const plaintext = Buffer.from(JSON.stringify(credentials), 'utf8');
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([Buffer.from([VERSION]), iv, tag, ciphertext]);
}

export function decryptBillingCredentials(value) {
  const encrypted = Buffer.from(value);
  if (encrypted[0] !== VERSION ||
      encrypted.length <= 1 + IV_LENGTH + TAG_LENGTH) {
    throw new AppError(
      'Las credenciales almacenadas no tienen un formato compatible.',
      500,
      'INVALID_BILLING_CREDENTIALS',
    );
  }
  const iv = encrypted.subarray(1, 1 + IV_LENGTH);
  const tag = encrypted.subarray(1 + IV_LENGTH, 1 + IV_LENGTH + TAG_LENGTH);
  const ciphertext = encrypted.subarray(1 + IV_LENGTH + TAG_LENGTH);
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return JSON.parse(plaintext.toString('utf8'));
}
