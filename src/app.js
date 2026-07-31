import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config.js';
import { requestContext, requestLogger, notFound, errorHandler } from './middleware.js';
import { requireAuthenticatedSession } from './authentication.js';
import { authorizeApiRequest } from './authorization.js';
import healthRouter from './modules/health.js';
import companiesRouter from './modules/companies.js';
import branchesRouter from './modules/branches.js';
import warehousesRouter from './modules/warehouses.js';
import categoriesRouter from './modules/categories.js';
import brandsRouter from './modules/brands.js';
import productsRouter from './modules/products.js';
import catalogImportRouter from './modules/catalog-import.js';
import productStructuresRouter from './modules/product-structures.js';
import pricingRouter from './modules/pricing.js';
import taxesRouter from './modules/taxes.js';
import inventoryRouter from './modules/inventory.js';
import advancedInventoryRouter from './modules/advanced-inventory.js';
import moduleSettingsRouter from './modules/module-settings.js';
import logisticsRouter from './modules/logistics.js';
import purchasesRouter from './modules/purchases.js';
import posRouter from './modules/pos.js';
import returnsRouter from './modules/returns.js';
import receivablesRouter from './modules/receivables.js';
import payablesRouter from './modules/payables.js';
import expensesRouter from './modules/expenses.js';
import thirdPartiesRouter from './modules/third-parties.js';
import usersRouter from './modules/users.js';
import dashboardRouter from './modules/dashboard.js';
import physicalCountsRouter from './modules/physical-counts.js';
import authRouter from './modules/auth.js';
import auditRouter from './modules/audit.js';
import reportsRouter from './modules/reports.js';
import electronicBillingRouter from './modules/electronic-billing.js';
import billingWorkflowRouter from './modules/billing-workflow.js';
import secureAssetsRouter from './modules/secure-assets.js';
import secureFilesRouter from './modules/secure-files.js';
import { requireTenantModule } from './module-gates.js';

const publicDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public');

function corsOptions() {
  if (config.corsOrigins.includes('*')) {
    return { origin: true, credentials: true };
  }

  const allowedOrigins = new Set(config.corsOrigins);
  if (config.publicBaseUrl) {
    allowedOrigins.add(new URL(config.publicBaseUrl).origin);
  }

  return {
    credentials: true,
    origin(origin, callback) {
      const localFileAllowed = origin === 'null' && config.nodeEnv !== 'production';
      if (!origin || localFileAllowed || allowedOrigins.has(origin)) {
        return callback(null, true);
      }
      const error = new Error('Origen no permitido por CORS.');
      error.status = 403;
      error.code = 'CORS_ORIGIN_DENIED';
      return callback(error);
    },
  };
}

export function createApp({ health = healthRouter, security = true } = {}) {
  const application = express();
  if (config.trustProxy) application.set('trust proxy', 1);

  application.disable('x-powered-by');
  application.use(helmet({
    contentSecurityPolicy: {
      directives: {
        // Safari puede intentar subir los recursos locales a HTTPS y dejar la
        // interfaz sin CSS ni JavaScript cuando Nubixor corre por HTTP.
        'upgrade-insecure-requests': null,
      },
    },
  }));
  application.use(cors(corsOptions()));
  application.use(express.json({ limit: config.jsonBodyLimit }));
  application.use(requestContext);
  application.use(requestLogger);

  application.use('/uploads', (_req, res) => {
    res.status(404).json({ error: 'Los archivos públicos están deshabilitados.' });
  });
  application.use(express.static(publicDir, {
    index: 'index.html',
    maxAge: 0,
    setHeaders(response, filePath) {
      const ext = path.extname(filePath);
      if (['.html', '.css', '.js'].includes(ext)) {
        response.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
    },
  }));

  application.use('/api/health', health);
  application.get('/api/test-billing-queue', async (req, res, next) => {
    try {
      const { query } = await import('./db.js');
      const docs = await query(`
        SELECT doc.id, doc.prefix, doc.document_number, doc.status,
               (SELECT JSON_AGG(t) FROM (
                  SELECT id, status, error_message, attempt_number, created_at 
                  FROM electronic_document_transmissions 
                  WHERE electronic_document_id = doc.id 
                  ORDER BY attempt_number DESC
                ) t) transmissions
        FROM electronic_documents doc
        ORDER BY doc.created_at DESC
        LIMIT 5
      `);
      res.json(docs.rows);
    } catch(err) {
      next(err);
    }
  });
  application.use('/api/auth', authRouter);
  if (security) {
    application.use('/api', requireAuthenticatedSession, authorizeApiRequest);
  }
  application.use('/api/assets', secureAssetsRouter);
  application.use('/api/companies', companiesRouter);
  application.use('/api/branches', branchesRouter);
  application.use('/api/warehouses', warehousesRouter);
  application.use('/api/categories', categoriesRouter);
  application.use('/api/brands', brandsRouter);
  application.use('/api/products', productsRouter);
  application.use('/api/catalog-import', catalogImportRouter);
  application.use('/api/product-structures', productStructuresRouter);
  application.use('/api/pricing', pricingRouter);
  application.use('/api/taxes', taxesRouter);
  application.use('/api/module-settings', moduleSettingsRouter);
  const requireLogistics = requireTenantModule('LOGISTICS');
  application.use('/api/inventory', (req, res, next) => {
    if (/^\/(replenishments|incidents|transfer-orders|transfers)(?:\/|$)/.test(req.path)) {
      return requireLogistics(req, res, next);
    }
    return next();
  }, inventoryRouter);
  application.use('/api/inventory-advanced', requireLogistics, advancedInventoryRouter);
  application.use('/api/logistics', requireLogistics, logisticsRouter);
  application.use('/api/purchases', purchasesRouter);
  application.use('/api/pos', returnsRouter);
  application.use('/api/pos', posRouter);
  application.use('/api/receivables', receivablesRouter);
  application.use('/api/payables', payablesRouter);
  application.use('/api/expenses', expensesRouter);
  application.use('/api/third-parties', thirdPartiesRouter);
  application.use('/api/users', usersRouter);
  application.use('/api/dashboard', dashboardRouter);
  application.use('/api/physical-counts', physicalCountsRouter);
  application.use('/api/audit', auditRouter);
  application.use('/api/reports', reportsRouter);
  application.use('/api/electronic-billing', electronicBillingRouter);
  application.use('/api/billing-workflow', billingWorkflowRouter);
  application.use('/api/secure-files', secureFilesRouter);

  application.use(notFound);
  application.use(errorHandler);
  return application;
}

export const app = createApp();
