import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isRetryableProviderError,
  payloadFingerprint,
  retryDelaySeconds,
} from '../src/electronic-billing/transmission-worker.js';

test('el worker aplica backoff exponencial con límite', () => {
  assert.equal(retryDelaySeconds(1), 30);
  assert.equal(retryDelaySeconds(2), 60);
  assert.equal(retryDelaySeconds(5), 480);
  assert.equal(retryDelaySeconds(50), 1920);
  assert.equal(retryDelaySeconds(3, 17), 17);
  assert.equal(retryDelaySeconds(3, 99999), 3600);
});

test('el worker reintenta únicamente errores temporales del proveedor', () => {
  for (const status of [429, 500, 502, 503, 504]) {
    assert.equal(isRetryableProviderError({ status }), true);
  }
  for (const status of [400, 401, 403, 404, 409, 422]) {
    assert.equal(isRetryableProviderError({ status }), false);
  }
});

test('la huella del payload es estable para idempotencia', () => {
  const payload = { reference_code: 'NUBIXOR-1', items: [{ quantity: '1.00' }] };
  assert.equal(payloadFingerprint(payload), payloadFingerprint(payload));
  assert.notEqual(payloadFingerprint(payload), payloadFingerprint({ ...payload, reference_code: 'NUBIXOR-2' }));
});
