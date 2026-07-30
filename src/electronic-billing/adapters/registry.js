import { AppError } from '../../shared/errors.js';
import { FactusAdapter } from './factus-adapter.js';
import { SandboxAdapter } from './sandbox-adapter.js';

const factories = new Map([
  ['SANDBOX', (account) => new SandboxAdapter(account)],
  ['FACTUS', (account) => new FactusAdapter(account)],
]);

export function registerBillingAdapter(providerCode, factory) {
  factories.set(providerCode.trim().toUpperCase(), factory);
}

export function createBillingAdapter(account) {
  const providerCode = account?.provider_code?.trim().toUpperCase();
  const factory = factories.get(providerCode);
  if (!factory) {
    throw new AppError(
      `El adaptador de ${providerCode || 'este proveedor'} aún no está instalado.`,
      501,
      'BILLING_ADAPTER_PENDING',
    );
  }
  return factory(account);
}
