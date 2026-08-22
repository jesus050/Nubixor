// La caja compartida contabiliza a nombre de la empresa vendedora, que no
// siempre es la empresa activa de la petición. Estas pruebas fijan el contrato
// de la declaración temporal: qué se declara, y que la empresa original vuelva
// a su sitio pase lo que pase.
import test from 'node:test';
import assert from 'node:assert/strict';
import { withDeclaredTenant } from '../src/db.js';
import { runWithTenantScope } from '../src/tenant-context.js';

function clienteFalso() {
  const sentencias = [];
  return {
    sentencias,
    query(text) {
      sentencias.push(text);
      return Promise.resolve({ rows: [], rowCount: 0 });
    },
  };
}

const EMPRESA_ACTIVA = '11111111-1111-4111-8111-111111111111';
const EMPRESA_VENDEDORA = '22222222-2222-4222-8222-222222222222';

test('declara la empresa vendedora y devuelve la activa al terminar', async () => {
  const client = clienteFalso();
  const resultado = await runWithTenantScope({ tenantId: EMPRESA_ACTIVA }, () =>
    withDeclaredTenant(client, EMPRESA_VENDEDORA, async () => {
      client.query('INSERT INTO journal_entries(...)');
      return 'asiento';
    }));

  assert.equal(resultado, 'asiento');
  assert.deepEqual(client.sentencias, [
    `SET LOCAL app.tenant_id = '${EMPRESA_VENDEDORA}'; `
      + `SET LOCAL app.tenant_ids = '${EMPRESA_VENDEDORA}'`,
    'INSERT INTO journal_entries(...)',
    `SET LOCAL app.tenant_id = '${EMPRESA_ACTIVA}'; `
      + `SET LOCAL app.tenant_ids = '${EMPRESA_ACTIVA}'`,
  ]);
});

test('restaura la empresa activa aunque el trabajo falle', async () => {
  const client = clienteFalso();
  await assert.rejects(
    runWithTenantScope({ tenantId: EMPRESA_ACTIVA }, () =>
      withDeclaredTenant(client, EMPRESA_VENDEDORA, async () => {
        throw new Error('el asiento no cuadra');
      })),
    /el asiento no cuadra/,
  );
  assert.match(
    client.sentencias.at(-1),
    new RegExp(`SET LOCAL app\\.tenant_id = '${EMPRESA_ACTIVA}'`),
    'la empresa activa debe quedar declarada aunque el tramo falle',
  );
});

test('sin empresa previa deja la conexión sin empresa declarada', async () => {
  const client = clienteFalso();
  await runWithTenantScope({ tenantId: null }, () =>
    withDeclaredTenant(client, EMPRESA_VENDEDORA, async () => null));
  // La cadena vacía deja app_tenant_scope() en NULL: ninguna política devuelve
  // filas, que es el lado seguro del error.
  assert.equal(
    client.sentencias.at(-1),
    "SET LOCAL app.tenant_id = ''; SET LOCAL app.tenant_ids = ''",
  );
});

test('rechaza un identificador que no sea el de una empresa', async () => {
  const client = clienteFalso();
  await assert.rejects(
    withDeclaredTenant(client, "'; DROP TABLE journal_entries; --", async () => null),
    /requiere el identificador de una empresa/,
  );
  assert.deepEqual(client.sentencias, [], 'no debe llegar nada a la conexión');
});
