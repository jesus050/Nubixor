import { query } from './db.js';
import { AppError } from './shared/errors.js';

export function requireTenantModule(moduleCode) {
  return async function tenantModuleGuard(req, _res, next) {
    try {
      const tenantId = req.context?.tenantId;
      if (!tenantId) {
        throw new AppError(
          'Selecciona una empresa para consultar sus módulos.',
          400,
          'TENANT_CONTEXT_REQUIRED',
        );
      }
      const result = await query(
        `SELECT enabled
         FROM tenant_modules
         WHERE tenant_id=$1 AND module_code=$2`,
        [tenantId, moduleCode],
      );
      if (!result.rows[0]?.enabled) {
        const moduleName = moduleCode === 'PAYROLL' ? 'Nómina' : 'Logística';
        throw new AppError(
          `El módulo de ${moduleName} está desactivado para esta empresa.`,
          403,
          'TENANT_MODULE_DISABLED',
        );
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}
