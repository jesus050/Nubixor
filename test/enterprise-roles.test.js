import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/authorization.js', import.meta.url), 'utf8');
const roleBlock = (code) => {
  const start = source.indexOf(`${code}: [`);
  const end = source.indexOf('\n  ],', start);
  return source.slice(start, end);
};

test('los perfiles empresariales oficiales están disponibles para empresas nuevas', () => {
  for (const code of ['OWNER', 'ADMIN', 'SUPERVISOR', 'WAREHOUSE', 'CASHIER', 'SELLER', 'MARKETING', 'ACCOUNTANT']) {
    assert.notEqual(source.indexOf(`${code}:`), -1, `falta el rol ${code}`);
  }
  assert.ok(!source.includes("'superadmin.manage'"));
});

test('marketing no recibe permisos financieros ni de facturación', () => {
  const permissions = roleBlock('MARKETING');
  for (const forbidden of ['product.cost.view', 'product.margin.view', 'bank.view', 'bank.manage', 'accounting.manage', 'billing.manage', 'users.manage']) {
    assert.ok(!permissions.includes(`'${forbidden}'`), `marketing no debe incluir ${forbidden}`);
  }
  assert.ok(permissions.includes("'marketing.campaign.manage'"));
  assert.ok(permissions.includes("'commercial_planning.marketing'"));
});

test('bodeguero puede operar mercancía pero no aprobar ni ver costos', () => {
  const permissions = roleBlock('WAREHOUSE');
  for (const allowed of ['inventory.count.perform', 'inventory.adjustment.request', 'inventory.receive', 'inventory.evidence.upload']) {
    assert.ok(permissions.includes(`'${allowed}'`), `bodeguero debe incluir ${allowed}`);
  }
  for (const forbidden of ['inventory.adjustment.approve', 'inventory.adjustment.execute', 'product.cost.view', 'product.margin.view', 'bank.view']) {
    assert.ok(!permissions.includes(`'${forbidden}'`), `bodeguero no debe incluir ${forbidden}`);
  }
});

test('supervisor puede aprobar diferencias sin operar caja', () => {
  const permissions = roleBlock('SUPERVISOR');
  assert.ok(permissions.includes("'inventory.adjustment.approve'"));
  assert.ok(permissions.includes("'inventory.adjustment.execute'"));
  assert.ok(!permissions.includes("'pos.use'"));
  assert.ok(!permissions.includes("'cash.open'"));
});
