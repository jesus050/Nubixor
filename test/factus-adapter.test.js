import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { FactusAdapter } from '../src/electronic-billing/adapters/factus-adapter.js';

function jsonResponse(status, payload, headers = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

function account(environment = 'TEST') {
  return {
    id: randomUUID(),
    company_id: randomUUID(),
    provider_code: 'FACTUS',
    environment,
    credentials: {
      client_id: 'client-test',
      client_secret: 'secret-test',
      username: 'billing@example.test',
      password: 'private-test',
    },
  };
}

test('Factus usa OAuth y lista únicamente rangos obtenidos de la cuenta', async () => {
  const calls = [];
  const adapter = new FactusAdapter(account(), {
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      if (url.endsWith('/oauth/token')) {
        return jsonResponse(200, {
          token_type: 'Bearer',
          expires_in: 600,
          access_token: 'access-token',
          refresh_token: 'refresh-token',
        });
      }
      return jsonResponse(200, {
        data: [{ id: 91, prefix: 'ACCOUNT-PREFIX', is_active: 1 }],
      });
    },
  });
  const result = await adapter.listNumberingRanges({ isActive: true });
  assert.equal(result.data[0].id, 91);
  assert.equal(
    calls[0].url,
    'https://api-sandbox.factus.com.co/oauth/token',
  );
  assert.ok(calls[0].options.body instanceof FormData);
  assert.equal(calls[0].options.body.get('grant_type'), 'password');
  assert.equal(
    calls[1].url,
    'https://api-sandbox.factus.com.co/v2/numbering-ranges?filter%5Bis_active%5D=1',
  );
  assert.equal(calls[1].options.headers.Authorization, 'Bearer access-token');
});

test('Factus renueva el token después de 401 y conserva la solicitud', async () => {
  let tokenCalls = 0;
  let rangeCalls = 0;
  const adapter = new FactusAdapter(account('PRODUCTION'), {
    fetchImpl: async (url, options) => {
      if (url.endsWith('/oauth/token')) {
        tokenCalls += 1;
        const refresh = options.body.get('grant_type') === 'refresh_token';
        return jsonResponse(200, {
          expires_in: 600,
          access_token: refresh ? 'refreshed-token' : 'initial-token',
          refresh_token: 'refresh-token',
        });
      }
      rangeCalls += 1;
      if (rangeCalls === 1) return jsonResponse(401, { message: 'Unauthenticated' });
      assert.equal(options.headers.Authorization, 'Bearer refreshed-token');
      return jsonResponse(200, { data: [] });
    },
  });
  await adapter.listDianNumberingRanges();
  assert.equal(tokenCalls, 2);
  assert.equal(rangeCalls, 2);
});

test('Factus crea la factura con reference_code idempotente y conserva CUFE', async () => {
  const payload = {
    reference_code: 'nubixor-sale-stable-reference',
    numbering_range_id: 321,
    payment_details: [],
    customer: {},
    items: [],
  };
  let submittedBody;
  const adapter = new FactusAdapter(account(), {
    fetchImpl: async (url, options) => {
      if (url.endsWith('/oauth/token')) {
        return jsonResponse(200, {
          expires_in: 600,
          access_token: 'token',
          refresh_token: 'refresh',
        });
      }
      submittedBody = JSON.parse(options.body);
      return jsonResponse(201, {
        status: 'Created',
        data: {
          reference_code: payload.reference_code,
          number: 'REAL-ACCOUNT-NUMBER',
          is_validated: true,
          cufe: 'real-cufe-from-provider',
          links: {
            qr: 'https://catalogo-vpfe.dian.gov.co/document/searchqr?documentkey=real-cufe',
            public_url: 'https://factus.com.co/documentos/REAL-ACCOUNT-NUMBER',
          },
        },
      });
    },
  });
  const result = await adapter.submitDocument(payload);
  assert.deepEqual(submittedBody, payload);
  assert.equal(result.status, 'ACCEPTED');
  assert.equal(result.providerReference, 'REAL-ACCOUNT-NUMBER');
  assert.equal(result.cufe, 'real-cufe-from-provider');
  assert.equal(
    result.qrUrl,
    'https://catalogo-vpfe.dian.gov.co/document/searchqr?documentkey=real-cufe',
  );
  assert.equal(
    result.publicUrl,
    'https://factus.com.co/documentos/REAL-ACCOUNT-NUMBER',
  );
});

test('Factus conserva códigos HTTP y Retry-After del proveedor', async () => {
  const adapter = new FactusAdapter(account(), {
    fetchImpl: async (url) => url.endsWith('/oauth/token')
      ? jsonResponse(200, {
        expires_in: 600,
        access_token: 'token',
        refresh_token: 'refresh',
      })
      : jsonResponse(429, { message: 'Too Many Requests' }, { 'Retry-After': '17' }),
  });
  await assert.rejects(
    () => adapter.listNumberingRanges(),
    (error) => {
      assert.equal(error.status, 429);
      assert.equal(error.code, 'FACTUS_HTTP_429');
      assert.equal(error.retryAfter, 17);
      return true;
    },
  );
});

test('Factus descarga PDF y XML usando el número real asignado', async () => {
  const calls = [];
  const adapter = new FactusAdapter(account(), {
    fetchImpl: async (url) => {
      calls.push(url);
      if (url.endsWith('/oauth/token')) {
        return jsonResponse(200, {
          expires_in: 600,
          access_token: 'token',
          refresh_token: 'refresh',
        });
      }
      if (url.endsWith('/download-pdf')) {
        return jsonResponse(200, {
          file_name: 'FV-123.pdf',
          pdf_base_64_encoded: Buffer.from('%PDF-archivo').toString('base64'),
        });
      }
      return jsonResponse(200, {
        file_name: 'FV-123.xml',
        xml_base_64_encoded: Buffer.from('<Invoice/>').toString('base64'),
      });
    },
  });
  const artifacts = await adapter.downloadDocumentArtifacts('FV 123/2026');
  assert.equal(artifacts.pdf.file_name, 'FV-123.pdf');
  assert.equal(artifacts.xml.file_name, 'FV-123.xml');
  assert.ok(calls.includes(
    'https://api-sandbox.factus.com.co/v2/bills/FV%20123%2F2026/download-pdf',
  ));
  assert.ok(calls.includes(
    'https://api-sandbox.factus.com.co/v2/bills/FV%20123%2F2026/download-xml/',
  ));
});
