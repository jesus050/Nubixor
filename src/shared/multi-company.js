import { AppError } from './errors.js';

const UUID_PATTERN = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const IMMUTABLE_IDENTITY_FIELDS = [
  'ownerCompanyId',
  'sellerCompanyId',
  'warehouseId',
  'taxCategoryId',
];

function validCompanyId(value) {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}

export function groupLinesBySellerCompany(lines) {
  if (!Array.isArray(lines) || !lines.length) {
    throw new AppError(
      'El carrito debe contener al menos un producto.',
      422,
      'CHECKOUT_ITEMS_REQUIRED',
    );
  }

  const groups = new Map();
  for (const line of lines) {
    if (!validCompanyId(line?.sellerCompanyId)) {
      throw new AppError(
        'Cada producto debe tener una empresa vendedora válida.',
        422,
        'SELLER_COMPANY_REQUIRED',
      );
    }
    const group = groups.get(line.sellerCompanyId) || [];
    group.push(line);
    groups.set(line.sellerCompanyId, group);
  }
  return groups;
}

export function assertSingleSellerSale(sellerCompanyId, lines) {
  if (!validCompanyId(sellerCompanyId)) {
    throw new AppError(
      'La venta debe identificar una empresa vendedora válida.',
      422,
      'SALE_SELLER_REQUIRED',
    );
  }

  const groups = groupLinesBySellerCompany(lines);
  if (groups.size !== 1 || !groups.has(sellerCompanyId)) {
    throw new AppError(
      'Una venta no puede mezclar productos de empresas vendedoras diferentes.',
      409,
      'MIXED_SELLER_SALE',
    );
  }
}

export function assertCanonicalProductIdentity(requestedLine, canonicalProduct) {
  for (const field of IMMUTABLE_IDENTITY_FIELDS) {
    const requestedValue = requestedLine?.[field];
    const canonicalValue = canonicalProduct?.[field];
    if (requestedValue !== undefined && requestedValue !== canonicalValue) {
      throw new AppError(
        'La empresa, bodega y configuración tributaria del producto no pueden modificarse desde Caja.',
        409,
        'PRODUCT_IDENTITY_TAMPERING',
      );
    }
  }
}

export function sumCurrency(values) {
  return Math.round(
    values.reduce((total, value) => total + Number(value || 0), 0) * 100,
  ) / 100;
}
