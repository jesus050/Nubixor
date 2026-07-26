import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config.js';
import { requestContext, requestLogger, notFound, errorHandler } from './middleware.js';
import healthRouter from './modules/health.js';
import companiesRouter from './modules/companies.js';
import warehousesRouter from './modules/warehouses.js';
import productsRouter from './modules/products.js';
import inventoryRouter from './modules/inventory.js';
import purchasesRouter from './modules/purchases.js';

function corsOptions() {
  if (config.corsOrigins.includes('*')) return {};
  return {
    origin(origin, callback) {
      if (!origin || config.corsOrigins.includes(origin)) return callback(null, true);
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
  application.use(helmet());
  application.use(cors(corsOptions()));
  application.use(express.json({ limit: config.jsonBodyLimit }));
  application.use(requestContext);
  application.use(requestLogger);

  application.get('/', (_req, res) => {
    res.json({
      ok: true,
      service: config.appName,
      health: '/api/health',
      readiness: '/api/health/ready',
    });
  });
  application.use('/api/health', health);
  application.use('/api/companies', companiesRouter);
  application.use('/api/warehouses', warehousesRouter);
  application.use('/api/products', productsRouter);
  application.use('/api/inventory', inventoryRouter);
  application.use('/api/purchases', purchasesRouter);

  application.use(notFound);
  application.use(errorHandler);
  return application;
}

export const app = createApp();
