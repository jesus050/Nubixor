import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeFactusRange } from '../src/electronic-billing/resolution-sync.js';

test('normaliza un rango Factus sin usar valores de ejemplo fijos', () => {
  const result = normalizeFactusRange({
    id: 77,
    prefix: ' setp ',
    from: 100,
    to: 199,
    current: 120,
    start_date: '2026-01-01T00:00:00.000Z',
    end_date: '2026-12-31T00:00:00.000Z',
    is_active: 1,
    is_expired: 0,
    document: { code: '01' },
  });
  assert.deepEqual(result && {
    id: result.id, prefix: result.prefix, current: result.current,
    documentCode: result.documentCode, active: result.active,
  }, { id: 77, prefix: 'SETP', current: 120, documentCode: '01', active: true });
});

test('descarta rangos Factus incompletos y limita el consecutivo al rango', () => {
  assert.equal(normalizeFactusRange({ id: 1, prefix: 'A' }), null);
  const result = normalizeFactusRange({
    id: 2, prefix: 'A', from: 10, to: 11, current: 999,
    start_date: '2026-01-01', end_date: '2026-12-31', is_active: 1,
  });
  assert.equal(result.current, 12);
});
