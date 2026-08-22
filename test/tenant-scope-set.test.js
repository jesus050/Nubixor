// El alcance de una petición: la empresa activa y, cuando la caja se comparte,
// las empresas que esa caja atiende. La lista la calcula el servidor; estas
// pruebas fijan qué entra, qué no, y qué llega a la conexión.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  runWithTenantScope,
  tenantScopeIds,
  widenTenantScope,
} from '../src/tenant-context.js';

const ACTIVA = '11111111-1111-4111-8111-111111111111';
const SOCIA = '22222222-2222-4222-8222-222222222222';
const TERCERA = '33333333-3333-4333-8333-333333333333';

test('sin ampliar, el alcance es solo la empresa activa', () => {
  runWithTenantScope({ tenantId: ACTIVA }, () => {
    assert.deepEqual(tenantScopeIds(), [ACTIVA]);
  });
});

test('la ampliación añade las empresas que comparten la caja', () => {
  runWithTenantScope({ tenantId: ACTIVA }, () => {
    widenTenantScope([SOCIA, TERCERA]);
    assert.deepEqual(tenantScopeIds(), [ACTIVA, SOCIA, TERCERA]);
  });
});

test('ampliar dos veces no repite empresas', () => {
  runWithTenantScope({ tenantId: ACTIVA }, () => {
    widenTenantScope([SOCIA]);
    widenTenantScope([SOCIA, ACTIVA]);
    assert.deepEqual(tenantScopeIds(), [ACTIVA, SOCIA]);
  });
});

test('sin empresa activa no hay alcance, ni siquiera ampliado', () => {
  // Es el estado seguro: ninguna política devuelve filas. Una ampliación no
  // puede convertirse en la puerta de atrás de una petición sin empresa.
  runWithTenantScope({ tenantId: null }, () => {
    widenTenantScope([SOCIA]);
    assert.deepEqual(tenantScopeIds(), []);
  });
});

test('rechaza cualquier cosa que no sea el identificador de una empresa', () => {
  runWithTenantScope({ tenantId: ACTIVA }, () => {
    assert.throws(
      () => widenTenantScope([SOCIA, "' OR TRUE --"]),
      /identificadores válidos/,
    );
    assert.deepEqual(tenantScopeIds(), [ACTIVA], 'nada se amplía si algo no es válido');
  });
});

test('no se puede ampliar el alcance fuera de una petición', () => {
  assert.throws(() => widenTenantScope([SOCIA]), /petición en curso/);
});

test('el alcance no se filtra entre peticiones', () => {
  runWithTenantScope({ tenantId: ACTIVA }, () => {
    widenTenantScope([SOCIA]);
  });
  runWithTenantScope({ tenantId: ACTIVA }, () => {
    assert.deepEqual(tenantScopeIds(), [ACTIVA]);
  });
});
