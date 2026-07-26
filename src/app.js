import express from 'express';
import cors from 'cors';
import { requestContext, notFound, errorHandler } from './middleware.js';
import healthRouter from './modules/health.js';
import companiesRouter from './modules/companies.js';
import warehousesRouter from './modules/warehouses.js';
import productsRouter from './modules/products.js';
import inventoryRouter from './modules/inventory.js';
import purchasesRouter from './modules/purchases.js';

export const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(requestContext);

app.use('/api/health', healthRouter);
app.use('/api/companies', companiesRouter);
app.use('/api/warehouses', warehousesRouter);
app.use('/api/products', productsRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/purchases', purchasesRouter);

app.use(notFound);
app.use(errorHandler);
