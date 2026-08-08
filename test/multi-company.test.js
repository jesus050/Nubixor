import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assertCanonicalProductIdentity,
  assertSingleSellerSale,
  groupLinesBySellerCompany,
  sumCurrency,
} from '../src/shared/multi-company.js';
import { allocateTendersBySale } from '../src/modules/pos.js';

const COMPANY_A = '10000000-0000-0000-0000-000000000001';
const COMPANY_B = '10000000-0000-0000-0000-000000000002';
const WAREHOUSE_A = '20000000-0000-0000-0000-000000000001';
const TAX_A = '30000000-0000-0000-0000-000000000001';

test('agrupa un carrito visual por empresa vendedora sin mezclar líneas', () => {
  const groups = groupLinesBySellerCompany([
    { sellerCompanyId: COMPANY_A, productId: 'A-1' },
    { sellerCompanyId: COMPANY_B, productId: 'B-1' },
    { sellerCompanyId: COMPANY_A, productId: 'A-2' },
  ]);

  assert.equal(groups.size, 2);
  assert.deepEqual(
    groups.get(COMPANY_A).map((line) => line.productId),
    ['A-1', 'A-2'],
  );
  assert.deepEqual(
    groups.get(COMPANY_B).map((line) => line.productId),
    ['B-1'],
  );
});

test('rechaza una venta que contiene líneas de dos empresas', () => {
  assert.throws(
    () => assertSingleSellerSale(COMPANY_A, [
      { sellerCompanyId: COMPANY_A },
      { sellerCompanyId: COMPANY_B },
    ]),
    (error) => error.code === 'MIXED_SELLER_SALE' && error.status === 409,
  );
});

test('rechaza alteraciones de empresa, bodega o impuesto enviadas por el POS', () => {
  const canonical = {
    ownerCompanyId: COMPANY_A,
    sellerCompanyId: COMPANY_A,
    warehouseId: WAREHOUSE_A,
    taxCategoryId: TAX_A,
  };

  assert.doesNotThrow(() => assertCanonicalProductIdentity({}, canonical));
  assert.throws(
    () => assertCanonicalProductIdentity(
      { sellerCompanyId: COMPANY_B },
      canonical,
    ),
    (error) => error.code === 'PRODUCT_IDENTITY_TAMPERING',
  );
});

test('suma asignaciones monetarias sin residuos binarios', () => {
  assert.equal(sumCurrency([33.33, 33.33, 33.34]), 100);
});

test('prorratea un pago mixto entre factura y comprobante interno sin duplicar el vuelto', () => {
  const allocations = allocateTendersBySale([
    { method: 'CASH', amount: 20, tenderedAmount: 30 },
    { method: 'CARD', amount: 80 },
  ], [
    { id: 'invoice', total: 60 },
    { id: 'internal', total: 40 },
  ]);

  const invoice = allocations.get('invoice');
  const internal = allocations.get('internal');
  assert.deepEqual(invoice.map((line) => line.amount), [12, 48]);
  assert.deepEqual(internal.map((line) => line.amount), [8, 32]);
  assert.equal(sumCurrency([...invoice, ...internal].map((line) => line.amount)), 100);
  assert.equal(sumCurrency([...invoice, ...internal].map((line) => line.changeAmount)), 10);
  assert.equal(internal[0].tenderedAmount, 18);
});
