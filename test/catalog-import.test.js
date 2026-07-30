import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseCatalogCsv,
  validateCatalogImport,
} from '../src/modules/catalog-import.js';

const TENANT_ID = '11111111-1111-1111-1111-111111111111';

test('interpreta plantilla CSV en español y conserva campos entre comillas', () => {
  const rows = parseCatalogCsv(
    '\uFEFFsku;nombre;costo;precio_venta;impuesto_codigo;bodega_codigo;existencia\n' +
    'ABC-1;"Producto; especial";10000;19900;EXCL;EXH-01;20\n',
  );
  assert.equal(rows.length, 1);
  assert.equal(rows[0].sku, 'ABC-1');
  assert.equal(rows[0].nombre, 'Producto; especial');
  assert.equal(rows[0].rowNumber, 2);
});

test('rechaza una plantilla que omite referencias operativas obligatorias', () => {
  assert.throws(
    () => parseCatalogCsv('sku;nombre;costo;precio_venta\nA;Artículo;1;2\n'),
    /Faltan estas columnas obligatorias/,
  );
});

test('valida la carga únicamente contra referencias de la empresa activa', async () => {
  const queriedTenants = [];
  const executor = async (sql, values) => {
    queriedTenants.push(values[0]);
    if (sql.includes('FROM products')) {
      return { rows: [{ id: 'product-1', sku: 'ABC-1', barcode: null }] };
    }
    if (sql.includes('FROM categories')) return { rows: [] };
    if (sql.includes('FROM brands')) return { rows: [] };
    if (sql.includes('FROM tax_categories')) {
      return {
        rows: [{ id: 'tax-1', code: 'EXCL', name: 'Excluido', treatment: 'EXCLUDED', rate: 0 }],
      };
    }
    if (sql.includes('FROM warehouses')) {
      return {
        rows: [{ id: 'warehouse-1', code: 'EXH-01', name: 'Exhibición', warehouse_type: 'DISPLAY' }],
      };
    }
    if (sql.includes('FROM inventory_balances')) {
      return {
        rows: [{
          product_id: 'product-1',
          warehouse_id: 'warehouse-1',
          on_hand: 5,
          reserved: 0,
        }],
      };
    }
    throw new Error(`Consulta inesperada: ${sql}`);
  };
  const preview = await validateCatalogImport(
    'sku;nombre;costo;precio_venta;impuesto_codigo;bodega_codigo;existencia\n' +
    'ABC-1;Artículo;1000;2000;EXCL;EXH-01;8\n',
    TENANT_ID,
    executor,
  );
  assert.equal(preview.summary.valid, true);
  assert.equal(preview.summary.updates, 1);
  assert.equal(preview.rows[0].currentStock, 5);
  assert.equal(preview.rows[0].stock, 8);
  assert.deepEqual(new Set(queriedTenants), new Set([TENANT_ID]));
});
