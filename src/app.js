import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config.js';
import { requestContext, requestLogger, notFound, errorHandler } from './middleware.js';
import healthRouter from './modules/health.js';
import companiesRouter from './modules/companies.js';
import branchesRouter from './modules/branches.js';
import warehousesRouter from './modules/warehouses.js';
import categoriesRouter from './modules/categories.js';
import brandsRouter from './modules/brands.js';
import productsRouter from './modules/products.js';
import taxesRouter from './modules/taxes.js';
import inventoryRouter from './modules/inventory.js';
import purchasesRouter from './modules/purchases.js';
import posRouter from './modules/pos.js';
import receivablesRouter from './modules/receivables.js';

const publicDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public');

function corsOptions() {
  if (config.corsOrigins.includes('*')) return {};
  return {
    origin(origin, callback) {
      const localFileAllowed = origin === 'null' && config.nodeEnv !== 'production';
      if (!origin || localFileAllowed || config.corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      const error = new Error('Origen no permitido por CORS.');
      error.status = 403;
      error.code = 'CORS_ORIGIN_DENIED';
      return callback(error);
    },
  };
}

export function createApp({ health = healthRouter } = {}) {
  const application = express();
  if (config.trustProxy) application.set('trust proxy', 1);

  application.disable('x-powered-by');
  application.use(helmet({
    contentSecurityPolicy: {
      directives: {
        // Safari puede intentar subir los recursos locales a HTTPS y dejar la
        // interfaz sin CSS ni JavaScript cuando MegaSuite corre por HTTP.
        'upgrade-insecure-requests': null,
      },
    },
  }));
  application.use(cors(corsOptions()));
  application.use(express.json({ limit: config.jsonBodyLimit }));
  application.use(requestContext);
  application.use(requestLogger);

  application.use(express.static(publicDir, {
    index: 'index.html',
    maxAge: config.nodeEnv === 'production' ? '1h' : 0,
    setHeaders(response, filePath) {
      if (path.extname(filePath) === '.html') {
        response.setHeader('Cache-Control', 'no-store');
      }
    },
  }));
  application.use('/api/health', health);
  application.use('/api/companies', companiesRouter);
  application.use('/api/branches', branchesRouter);
  application.use('/api/warehouses', warehousesRouter);
  application.use('/api/categories', categoriesRouter);
  application.use('/api/brands', brandsRouter);
  application.use('/api/products', productsRouter);
  application.use('/api/taxes', taxesRouter);
  application.use('/api/inventory', inventoryRouter);
  application.use('/api/purchases', purchasesRouter);
  application.use('/api/pos', posRouter);
  application.use('/api/receivables', receivablesRouter);

  application.use(notFound);
  application.use(errorHandler);
  return application;
}

export const app = createApp();
