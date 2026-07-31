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

  application.get('/api/test-billing-run-queue/:documentId', async (req, res, next) => {
    try {
      const { documentId } = req.params;
      const { query } = await import('./db.js');
      
      const tenantId = '00000000-0000-0000-0000-000000000001';
      const docRes = await query(
        `SELECT document.id, document.status, document.document_type,
                document.prefix, document.document_number, document.sale_id,
                document.company_id,
                sale.total, sale.tax_total, sale.created_at, sale.customer_id,
                sale.sale_terms, sale.due_date, sale.payment_method,
                account.id billing_account_id, account.connection_status,
                account.provider_code, account.environment, account.provider_config,
                resolution.provider_numbering_range_id,
                resolution.provider_document_code
         FROM electronic_documents document
         JOIN sales sale
           ON sale.id = document.sale_id AND sale.company_id = document.company_id
         JOIN electronic_billing_accounts account
           ON account.company_id = document.company_id AND account.active = TRUE
         LEFT JOIN billing_resolutions resolution
           ON resolution.id = document.billing_resolution_id
          AND resolution.company_id = document.company_id
         WHERE document.id = $1 AND document.company_id = $2`,
        [documentId, tenantId]
      );
      
      if (!docRes.rowCount) {
        return res.json({ error: 'No document found' });
      }
      
      const record = docRes.rows[0];
      
      const [items, tenders, mappings, customer] = await Promise.all([
        query(
          `SELECT item.product_id, item.sku_snapshot, item.name_snapshot,
                  item.quantity, item.unit_price, item.discount_amount,
                  item.tax_rate, item.tax_category_id,
                  product.electronic_unit_measure_code,
                  product.electronic_standard_code,
                  tax.code tax_internal_code, tax.treatment tax_treatment
           FROM sale_items item
           JOIN products product
             ON product.id = item.product_id
            AND product.seller_company_id = item.seller_company_id
           LEFT JOIN tax_categories tax
             ON tax.id = item.tax_category_id
            AND tax.tenant_id = item.seller_company_id
           WHERE item.sale_id = $1 AND item.seller_company_id = $2`,
          [record.sale_id, record.company_id]
        ),
        query(
          `SELECT method, amount, reference
           FROM sale_payment_tenders
           WHERE sale_id = $1 AND seller_company_id = $2
             AND reconciliation_status <> 'REVERSED'`,
          [record.sale_id, record.company_id]
        ),
        query(
          `SELECT catalog_type, internal_code, provider_value
           FROM electronic_billing_reference_mappings
           WHERE company_id = $1 AND provider_code = 'FACTUS' AND environment = $2`,
          [record.company_id, record.environment]
        ),
        record.customer_id
          ? query(
              `SELECT id, name, document_type, document_number, email, phone, address,
                      electronic_identification_code,
                      electronic_legal_organization_code, electronic_tribute_code,
                      municipality_code, country_code
               FROM customers
               WHERE id = $1 AND tenant_id = $2 AND active = TRUE`,
              [record.customer_id, record.company_id]
            )
          : Promise.resolve({ rows: [] })
      ]);
      
      res.json({
        record,
        items: items.rows,
        tenders: tenders.rows,
        mappings: mappings.rows,
        customer: customer.rows[0] || null
      });
    } catch(err) {
      res.status(500).json({ error: err.message });
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
