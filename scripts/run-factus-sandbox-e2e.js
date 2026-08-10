import { createHash, randomBytes } from 'node:crypto';
import { pool, query } from '../src/db.js';

// Esta prueba crea una factura en el ambiente TEST. No usa identificadores,
// rangos, catálogos ni credenciales de ejemplo: cada ejecución debe declarar
// explícitamente los recursos de prueba que pertenecen a la empresa.
const REQUIRED_ENVIRONMENT = [
  'FACTUS_TEST_COMPANY_ID',
  'FACTUS_TEST_USER_ID',
  'FACTUS_TEST_CASH_SESSION_ID',
  'FACTUS_TEST_WAREHOUSE_ID',
  'FACTUS_TEST_PRODUCT_ID',
];
const apiBase = process.env.NUBIXOR_INTERNAL_URL || 'http://127.0.0.1:4100';

function requiredEnvironment() {
  const missing = REQUIRED_ENVIRONMENT.filter((name) => !process.env[name]?.trim());
  if (missing.length) {
    throw new Error(`Faltan variables para la prueba Factus TEST: ${missing.join(', ')}.`);
  }
  if (process.env.CONFIRM_FACTUS_TEST !== 'YES') {
    throw new Error('Confirma la emisión TEST con CONFIRM_FACTUS_TEST=YES.');
  }
}

function digest(value) {
  return createHash('sha256').update(value).digest('hex');
}

function rangeRows(payload) {
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
}

function sanitizedError(payload, fallback) {
  const message = payload?.error || payload?.message || fallback;
  return String(message).replace(/(token|secret|password)\s*[:=]\s*[^,\s]+/gi, '$1=[REDACTED]');
}

function maskedCufe(cufe) {
  if (!cufe) return null;
  const value = String(cufe);
  return value.length <= 12 ? '[PRESENT]' : `${value.slice(0, 6)}…${value.slice(-6)}`;
}

async function main() {
  requiredEnvironment();
  const companyId = process.env.FACTUS_TEST_COMPANY_ID.trim();
  const userId = process.env.FACTUS_TEST_USER_ID.trim();
  const cashSessionId = process.env.FACTUS_TEST_CASH_SESSION_ID.trim();
  const warehouseId = process.env.FACTUS_TEST_WAREHOUSE_ID.trim();
  const productId = process.env.FACTUS_TEST_PRODUCT_ID.trim();
  const sessionToken = randomBytes(32).toString('base64url');
  const csrfToken = randomBytes(24).toString('base64url');
  let temporarySessionId;

  const api = async (path, options = {}) => {
    const method = options.method || 'GET';
    const response = await fetch(`${apiBase}${path}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        Cookie: `megasuite_session=${sessionToken}`,
        'x-tenant-id': companyId,
        ...(!['GET', 'HEAD', 'OPTIONS'].includes(method) ? { 'x-csrf-token': csrfToken } : {}),
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(`${method} ${path}: ${response.status} ${sanitizedError(payload, 'Solicitud rechazada.')}`);
    }
    return payload;
  };

  try {
    const temporarySession = await query(
      `INSERT INTO auth_sessions(user_id, token_hash, csrf_token_hash, expires_at, user_agent)
       VALUES($1,$2,$3,now() + interval '15 minutes',$4)
       RETURNING id`,
      [
        userId,
        digest(sessionToken),
        digest(csrfToken),
        'Nubixor controlled Factus TEST end-to-end verification',
      ],
    );
    temporarySessionId = temporarySession.rows[0].id;

    const [overview, rangesPayload, catalog] = await Promise.all([
      api('/api/electronic-billing/overview'),
      api('/api/electronic-billing/factus/numbering-ranges'),
      api(`/api/pos/catalog?warehouseId=${encodeURIComponent(warehouseId)}`),
    ]);
    if (overview.account?.provider_code !== 'FACTUS' || overview.account?.environment !== 'TEST' ||
        overview.account?.connection_status !== 'READY') {
      throw new Error('La empresa seleccionada no tiene una conexión Factus TEST en estado READY.');
    }
    const ranges = rangeRows(rangesPayload);
    if (!ranges.length) {
      throw new Error('Factus TEST no devolvió rangos asociados a la cuenta de esta empresa.');
    }
    const product = catalog.find((item) => item.id === productId);
    if (!product) {
      throw new Error('El producto de prueba no es vendible desde la bodega indicada con este usuario.');
    }
    if (Number(product.on_hand) <= 0 || Number(product.sale_price) <= 0) {
      throw new Error('El producto de prueba debe tener existencias y un precio de venta mayor a cero.');
    }

    console.log('Factus TEST validado. Se emitirá una factura de prueba con el producto y turno indicados.');
    const sale = await api('/api/pos/sales', {
      method: 'POST',
      body: JSON.stringify({
        cashSessionId,
        warehouseId,
        paymentMethod: 'CASH',
        cashReceived: Number(product.sale_price),
        saleTerms: 'IMMEDIATE',
        items: [{ productId, quantity: 1 }],
      }),
    });
    const documentId = sale.billingDocument?.id;
    if (!documentId) {
      throw new Error('La venta de prueba no generó un documento electrónico para Factus.');
    }

    await api(`/api/electronic-billing/documents/${documentId}/queue`, {
      method: 'POST', body: JSON.stringify({}),
    });
    const processed = await api(`/api/electronic-billing/documents/${documentId}/process`, {
      method: 'POST', body: JSON.stringify({}),
    });
    // Repetir el proceso del mismo documento verifica que se conserva la misma
    // referencia interna en lugar de crear otra factura en Factus.
    await api(`/api/electronic-billing/documents/${documentId}/process`, {
      method: 'POST', body: JSON.stringify({}),
    });
    const finalOverview = await api('/api/electronic-billing/overview');
    const document = finalOverview.documents?.find((item) => item.id === documentId);
    if (!document || document.status !== 'ACCEPTED') {
      throw new Error('Factus TEST no confirmó la aceptación de la factura de prueba.');
    }
    if (!document.provider_reference || !document.cufe || !document.qr_url ||
        !document.pdf_document_id || !document.xml_document_id) {
      throw new Error('La factura fue aceptada, pero faltan número, CUFE, QR, PDF o XML archivado.');
    }

    console.log(JSON.stringify({
      environment: overview.account.environment,
      provider: overview.account.provider_code,
      accountSpecificRangeCount: ranges.length,
      electronicDocumentId: document.id,
      factusNumber: document.provider_reference,
      status: document.status,
      cufe: maskedCufe(document.cufe),
      officialQrPresent: Boolean(document.qr_url),
      pdfArchived: Boolean(document.pdf_document_id),
      xmlArchived: Boolean(document.xml_document_id),
      idempotencyRetest: 'same internal electronic document processed twice',
      artifactsArchived: processed.artifactsArchived === true,
    }, null, 2));
  } finally {
    if (temporarySessionId) {
      await query(
        'UPDATE auth_sessions SET revoked_at = now() WHERE id = $1',
        [temporarySessionId],
      ).catch(() => {});
    }
    await pool.end();
  }
}

main().catch((error) => {
  process.stderr.write(`Factus TEST E2E no completada: ${error.message}\n`);
  process.exitCode = 1;
});
