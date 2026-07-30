import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveCommercialPrice } from '../src/modules/pos.js';

test('precios comerciales respetan cliente, cantidad y promoción', () => {
  const product = { sale_price: 10000 };
  const pricing = {
    prices: [
      { min_quantity: 1, unit_price: 9000, price_list_name: 'Mayorista' },
      { min_quantity: 12, unit_price: 8000, price_list_name: 'Mayorista' },
      { min_quantity: 48, unit_price: 7000, price_list_name: 'Mayorista' },
    ],
    promotions: [],
  };
  assert.equal(resolveCommercialPrice(product, 1, pricing).unitPrice, 9000);
  assert.equal(resolveCommercialPrice(product, 12, pricing).unitPrice, 8000);
  assert.equal(resolveCommercialPrice(product, 60, pricing).unitPrice, 7000);

  const promoted = resolveCommercialPrice(product, 12, {
    ...pricing,
    promotions: [{
      name: 'Semana comercial',
      discount_type: 'PERCENT',
      discount_value: 10,
      min_quantity: 1,
    }],
  });
  assert.equal(promoted.unitPrice, 7200);
  assert.equal(promoted.source, 'PROMOTION');
  assert.equal(promoted.label, 'Semana comercial');
});
