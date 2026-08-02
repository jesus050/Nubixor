import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isRetryableBillingError,
  retryDelaySeconds,
} from '../src/electronic-billing/billing-worker.js';

test('billing worker only retries transient provider responses', () => {
  assert.equal(isRetryableBillingError({ status: 429 }), true);
  assert.equal(isRetryableBillingError({ status: 502 }), true);
  assert.equal(isRetryableBillingError({ status: 422 }), false);
  assert.equal(isRetryableBillingError({ status: 401 }), false);
});

test('billing worker honors provider retry-after and bounds exponential backoff', () => {
  assert.equal(retryDelaySeconds({ retryAfter: 17 }, 1), 17);
  assert.equal(retryDelaySeconds({}, 1), 30);
  assert.equal(retryDelaySeconds({}, 2), 60);
  assert.equal(retryDelaySeconds({}, 99), 1920);
});
