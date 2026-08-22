// Un evento de auditoría sin origen sirve para saber qué pasó, pero no para
// investigarlo. La dirección, el dispositivo y el identificador de la petición
// viajan con el contexto y se sellan dentro de metadata, que es la columna que
// la cadena de integridad ya cubre.
import test from 'node:test';
import assert from 'node:assert/strict';
import { writeAudit } from '../src/audit.js';
import { runWithTenantScope } from '../src/tenant-context.js';

const EMPRESA = '11111111-1111-4111-8111-111111111111';
const USUARIO = '22222222-2222-4222-8222-222222222222';

function clienteFalso() {
  const inserciones = [];
  return {
    inserciones,
    query(text, values) {
      inserciones.push({ text, values });
      return Promise.resolve({ rows: [], rowCount: 0 });
    },
  };
}

function metadataDe(client) {
  return JSON.parse(client.inserciones.at(-1).values[8]);
}

test('el evento guarda dirección, dispositivo y petición de origen', async () => {
  const client = clienteFalso();
  await runWithTenantScope(
    {
      tenantId: EMPRESA,
      requestId: 'req-123',
      ip: '190.24.10.5',
      userAgent: 'Mozilla/5.0 (POS de mostrador)',
    },
    () => writeAudit(client, {
      tenantId: EMPRESA,
      userId: USUARIO,
      action: 'sale.completed',
      entityType: 'sale',
      entityId: 'venta-1',
    }),
  );

  assert.deepEqual(metadataDe(client), {
    ip: '190.24.10.5',
    userAgent: 'Mozilla/5.0 (POS de mostrador)',
    requestId: 'req-123',
  });
});

test('lo que declara el módulo tiene prioridad sobre el origen automático', async () => {
  const client = clienteFalso();
  await runWithTenantScope(
    { tenantId: EMPRESA, ip: '190.24.10.5', requestId: 'req-9' },
    () => writeAudit(client, {
      tenantId: EMPRESA,
      userId: USUARIO,
      action: 'inventory.adjusted',
      entityType: 'product',
      entityId: 'producto-1',
      metadata: { ip: 'declarada-por-el-modulo', motivo: 'conteo físico' },
    }),
  );

  const metadata = metadataDe(client);
  assert.equal(metadata.ip, 'declarada-por-el-modulo');
  assert.equal(metadata.motivo, 'conteo físico');
  assert.equal(metadata.requestId, 'req-9');
});

test('sin petición en curso el evento se escribe igual', async () => {
  // Los reprocesos y los scripts de mantenimiento auditan fuera de una
  // petición: no tienen origen que contar, pero el evento no puede perderse.
  const client = clienteFalso();
  await writeAudit(client, {
    tenantId: EMPRESA,
    userId: null,
    action: 'accounting.backfilled',
    entityType: 'journal_entry',
    entityId: 'asiento-1',
  });
  assert.deepEqual(metadataDe(client), {});
  assert.equal(client.inserciones.length, 1);
});
