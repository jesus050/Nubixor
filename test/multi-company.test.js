import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assertCanonicalProductIdentity,
  assertSingleSellerSale,
  groupLinesBySellerCompany,
  sumCurrency,
} from '../src/shared/multi-company.js';

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
