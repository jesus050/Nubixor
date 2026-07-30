import { createHash, randomBytes } from 'node:crypto';
import { pool, query, withTransaction } from '../src/db.js';

const COMPANY_ID = '00000000-0000-0000-0000-000000000001';
const ADMIN_ID = '50000000-0000-0000-0000-000000000001';
const BRANCH_ID = '10000000-0000-0000-0000-000000000001';
const WAREHOUSE_ID = '20000000-0000-0000-0000-000000000001';
const CASH_SESSION_ID = '2e361c73-39e9-4368-aa0d-570c3cac72d2';
const PRODUCT_ID = '60000000-0000-0000-0000-000000000003';
const API_BASE = process.env.NUBIXOR_INTERNAL_URL || 'http://127.0.0.1:4100';
const OFFICIAL_TABLES = 'https://developers.factus.com.co/tablas-de-referencia/tablas/';
const OFFICIAL_UNITS =
  'https://developers.factus.com.co/tablas-de-referencia/unit-measures/';
const OFFICIAL_CONSUMER =
  'https://developers.factus.com.co/facturas/ejemplos/estandar-consumidor-final/';

function digest(value) {
  return createHash('sha256').update(value).digest('hex');
}

function rangeRows(payload) {
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
}

async function main() {
  const sessionToken = randomBytes(32).toString('base64url');
  const csrfToken = randomBytes(24).toString('base64url');
  let sessionId;
  const api = async (path, options = {}) => {
    const method = options.method || 'GET';
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        Cookie: `megasuite_session=${sessionToken}`,
        'x-tenant-id': COMPANY_ID,
        ...(!['GET', 'HEAD', 'OPTIONS'].includes(method)
          ? { 'x-csrf-token': csrfToken }
          : {}),
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(
        `${method} ${path}: ${response.status} ${payload.error || JSON.stringify(payload)}`,
      );
    }
    return payload;
  };

  try {
    const temporarySession = await query(
      `INSERT INTO auth_sessions(
         user_id, token_hash, csrf_token_hash, expires_at, user_agent
       )
       VALUES($1,$2,$3,now() + interval '30 minutes',$4)
       RETURNING id`,
      [
        ADMIN_ID,
        digest(sessionToken),
        digest(csrfToken),
        'Nubixor controlled Factus sandbox test',
      ],
    );
    sessionId = temporarySession.rows[0].id;

    const recoverDocumentId = process.env.RECOVER_FACTUS_DOCUMENT_ID;
    if (recoverDocumentId) {
      const recovered = await api(
        `/api/electronic-billing/documents/${recoverDocumentId}/sync-artifacts`,
        { method: 'POST', body: JSON.stringify({}) },
      );
      const overview = await api('/api/electronic-billing/overview');
      const visible = overview.documents?.find((item) => item.id === recoverDocumentId);
      console.log(JSON.stringify({
        environment: 'TEST',
        electronicDocumentId: visible?.id,
        factusNumber: visible?.provider_reference,
        status: visible?.status,
        cufePresent: Boolean(visible?.cufe),
        pdfDocumentId: visible?.pdf_document_id,
        xmlDocumentId: visible?.xml_document_id,
        recovered,
      }, null, 2));
      return;
    }

    const rangesPayload = await api('/api/electronic-billing/factus/numbering-ranges');
    const invoiceRange = rangeRows(rangesPayload).find((range) =>
      String(range.document || '').toLowerCase().includes('factura de venta'));
    if (!invoiceRange) {
      throw new Error('Factus no devolvió un rango activo para Factura de Venta.');
    }

    await api('/api/electronic-billing/factus/settings', {
      method: 'PUT',
      body: JSON.stringify({
        sendEmail: false,
        consumerFinal: {
          identification_document_code: '13',
          identification: '22222222222',
          legal_organization_code: '2',
          tribute_code: 'ZZ',
          names: 'Consumidor Final',
        },
      }),
    });

    const mappings = [
      ['DOCUMENT_TYPE', 'ELECTRONIC_INVOICE', '01', 'Factura electrónica', OFFICIAL_TABLES],
      ['OPERATION_TYPE', 'ELECTRONIC_INVOICE', '10', 'Operación estándar', OFFICIAL_TABLES],
      ['PAYMENT_FORM', 'IMMEDIATE', '1', 'Pago de contado', OFFICIAL_TABLES],
      ['PAYMENT_METHOD', 'CASH', '10', 'Efectivo', OFFICIAL_TABLES],
      ['TAX', 'IVA19', '01', 'IVA', OFFICIAL_TABLES],
      ['UNIT_MEASURE', 'UNIT', '94', 'Unidad', OFFICIAL_UNITS],
      ['STANDARD_CODE', 'OWN', '999', 'Adopción del contribuyente', OFFICIAL_TABLES],
    ];
    for (const [type, internalCode, providerValue, providerLabel, sourceUrl] of mappings) {
      await api(
        `/api/electronic-billing/factus/mappings/${type}/${internalCode}`,
        {
          method: 'PUT',
          body: JSON.stringify({ providerValue, providerLabel, sourceUrl }),
        },
      );
    }

    const numberFrom = Number(invoiceRange.from);
    const numberTo = Number(invoiceRange.to);
    const current = Number(invoiceRange.current);
    if (![numberFrom, numberTo, current].every(Number.isSafeInteger)) {
      throw new Error('Factus devolvió un rango con numeración no válida.');
    }
    const existingResolution = await query(
      `SELECT id
       FROM billing_resolutions
       WHERE company_id = $1 AND prefix = $2
         AND number_from = $3 AND number_to = $4
       LIMIT 1`,
      [COMPANY_ID, invoiceRange.prefix, numberFrom, numberTo],
    );
    if (existingResolution.rowCount) {
      await query(
        `UPDATE billing_resolutions
         SET branch_id = $2, current_number = $3, valid_from = $4,
             valid_until = $5, active = TRUE,
             provider_numbering_range_id = $6,
             provider_document_code = '01',
             provider_synced_at = now(), provider_snapshot = $7,
             updated_at = now()
         WHERE id = $1`,
        [
          existingResolution.rows[0].id,
          BRANCH_ID,
          current,
          invoiceRange.start_date,
          invoiceRange.end_date,
          Number(invoiceRange.id),
          invoiceRange,
        ],
      );
    } else {
      await api('/api/electronic-billing/resolutions', {
        method: 'POST',
        body: JSON.stringify({
          branchId: BRANCH_ID,
          prefix: invoiceRange.prefix,
          numberFrom,
          numberTo,
          validFrom: invoiceRange.start_date,
          validUntil: invoiceRange.end_date,
          providerNumberingRangeId: Number(invoiceRange.id),
          providerDocumentCode: '01',
          providerSnapshot: invoiceRange,
        }),
      });
    }

    await withTransaction(async (client) => {
      await client.query(
        `UPDATE company_tax_profiles
         SET electronic_invoicing_required = TRUE,
             default_document_type = 'ELECTRONIC_INVOICE',
             updated_at = now()
         WHERE company_id = $1`,
        [COMPANY_ID],
      );
      await client.query(
        `UPDATE products
         SET electronic_unit_measure_code = 'UNIT',
             electronic_standard_code = 'OWN',
             updated_at = now()
         WHERE seller_company_id = $1 AND deleted_at IS NULL`,
        [COMPANY_ID],
      );
    });

    const sale = await api('/api/pos/sales', {
      method: 'POST',
      body: JSON.stringify({
        cashSessionId: CASH_SESSION_ID,
        warehouseId: WAREHOUSE_ID,
        paymentMethod: 'CASH',
        cashReceived: 19900,
        saleTerms: 'IMMEDIATE',
        items: [{ productId: PRODUCT_ID, quantity: 1 }],
      }),
    });
    if (!sale.billingDocument?.id) {
      throw new Error('La venta no generó un documento electrónico.');
    }

    await api(`/api/electronic-billing/documents/${sale.billingDocument.id}/queue`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const processed = await api(
      `/api/electronic-billing/documents/${sale.billingDocument.id}/process`,
      {
        method: 'POST',
        body: JSON.stringify({}),
      },
    );
    const overview = await api('/api/electronic-billing/overview');
    const visible = overview.documents?.find((item) => item.id === sale.billingDocument.id);
    if (!visible || visible.status !== 'ACCEPTED') {
      throw new Error('La factura no quedó aceptada y visible en el monitor.');
    }
    if (!visible.pdf_document_id || !visible.xml_document_id) {
      throw new Error('La factura fue aceptada, pero faltan el PDF o XML archivados.');
    }

    console.log(JSON.stringify({
      environment: 'TEST',
      saleSequence: sale.sequence_number,
      electronicDocumentId: visible.id,
      factusNumber: visible.provider_reference,
      status: visible.status,
      cufePresent: Boolean(visible.cufe),
      pdfDocumentId: visible.pdf_document_id,
      xmlDocumentId: visible.xml_document_id,
      artifactsArchived: processed.artifactsArchived === true,
      consumerFinalSource: OFFICIAL_CONSUMER,
    }, null, 2));
  } finally {
    if (sessionId) {
      await query(
        'UPDATE auth_sessions SET revoked_at = now() WHERE id = $1',
        [sessionId],
      ).catch(() => {});
    }
    await pool?.end();
  }
}

if (process.env.CONFIRM_VISIBLE_FACTUS_TEST === 'YES') {
  await main();
}
