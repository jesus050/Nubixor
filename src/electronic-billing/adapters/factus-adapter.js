import { createHash } from 'node:crypto';
import { AppError } from '../../shared/errors.js';
import { decryptBillingCredentials } from '../credentials.js';
import { ProviderAdapter } from './provider-adapter.js';

const BASE_URLS = {
  TEST: 'https://api-sandbox.factus.com.co',
  PRODUCTION: 'https://api.factus.com.co',
};
const REQUEST_LIMIT = 80;
const REQUEST_WINDOW_MS = 60_000;
const accountWindows = new Map();
const tokenSessions = new Map();

function tokenSessionKey(account) {
  const accountId = account?.id || `${account?.company_id || 'unknown'}:${account?.environment || 'TEST'}`;
  // Las credenciales nunca salen de memoria: se usa solo su huella para invalidar
  // el token si un administrador reemplaza la conexión de Factus.
  const credentialVersion = account?.encrypted_credentials || JSON.stringify(account?.credentials || {});
  const fingerprint = createHash('sha256').update(credentialVersion).digest('hex');
  return `${accountId}:${fingerprint}`;
}

function requiredCredential(credentials, name) {
  const value = credentials?.[name];
  if (typeof value !== 'string' || !value.trim()) {
    throw new AppError(
      `La credencial Factus "${name}" es obligatoria.`,
      422,
      'FACTUS_CREDENTIALS_INCOMPLETE',
    );
  }
  return value.trim();
}

function factusMessage(payload, fallback) {
  if (typeof payload?.message === 'string' && payload.message.trim()) {
    return payload.message.trim();
  }
  if (typeof payload?.error_description === 'string' && payload.error_description.trim()) {
    return payload.error_description.trim();
  }
  if (typeof payload?.error === 'string' && payload.error.trim()) {
    return payload.error.trim();
  }
  return fallback;
}

function factusDocumentResult(response, fallbackReference = null) {
  const document = response?.data || {};
  return {
    document,
    providerReference:
      document.number || document.reference_code || fallbackReference,
    cufe: document.cufe || null,
    cude: document.cude || null,
    // Factus API V2 publica el enlace oficial de consulta DIAN en data.links.qr.
    // Se conservan las formas anteriores solo para tolerar respuestas legadas.
    qrUrl: document.links?.qr || document.qr || document.qr_url || null,
    publicUrl: document.links?.public_url || document.public_url || null,
  };
}

function requiredText(value, name) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new AppError(
      `El campo Factus "${name}" es obligatorio.`,
      422,
      'FACTUS_REQUEST_INVALID',
    );
  }
  return value.trim();
}

function requiredObject(value, name) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new AppError(
      `El cuerpo Factus "${name}" debe ser un objeto.`,
      422,
      'FACTUS_REQUEST_INVALID',
    );
  }
  return value;
}

// El evento 034 (aceptación tácita) es generado por RADIAN: no se puede emitir
// manualmente. Los demás códigos se validan también por Factus según el estado
// previo de la factura recibida.
const MANUAL_RECEPTION_EVENTS = new Set(['030', '031', '032', '033']);

export class FactusAdapter extends ProviderAdapter {
  constructor(account, { fetchImpl = globalThis.fetch, now = () => Date.now() } = {}) {
    super(account);
    if (!BASE_URLS[account?.environment]) {
      throw new AppError(
        'El ambiente Factus debe ser TEST o PRODUCTION.',
        422,
        'FACTUS_ENVIRONMENT_INVALID',
      );
    }
    this.fetchImpl = fetchImpl;
    this.now = now;
    this.baseUrl = BASE_URLS[account.environment];
    this.credentials = account.credentials ||
      (account.encrypted_credentials
        ? decryptBillingCredentials(account.encrypted_credentials)
        : null);
    this.tokenSessionKey = tokenSessionKey(account);
    const cached = tokenSessions.get(this.tokenSessionKey);
    this.accessToken = cached?.accessToken || null;
    this.refreshToken = cached?.refreshToken || null;
    this.tokenExpiresAt = cached?.tokenExpiresAt || 0;
  }

  cacheTokenSession() {
    tokenSessions.set(this.tokenSessionKey, {
      accessToken: this.accessToken,
      refreshToken: this.refreshToken,
      tokenExpiresAt: this.tokenExpiresAt,
    });
  }

  consumeRateLimit() {
    const key = this.account.id || `${this.account.company_id}:${this.account.environment}`;
    const now = this.now();
    let window = accountWindows.get(key);
    if (!window || now >= window.resetAt) {
      window = { count: 0, resetAt: now + REQUEST_WINDOW_MS };
    }
    if (window.count >= REQUEST_LIMIT) {
      const error = new AppError(
        'Se alcanzó el límite local de 80 solicitudes Factus por minuto.',
        429,
        'FACTUS_LOCAL_RATE_LIMIT',
      );
      error.retryAfter = Math.max(1, Math.ceil((window.resetAt - now) / 1000));
      throw error;
    }
    window.count += 1;
    accountWindows.set(key, window);
  }

  async readResponse(response) {
    const contentType = response.headers?.get?.('content-type') || '';
    if (contentType.includes('application/json')) {
      return response.json();
    }
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      return text ? { message: text } : {};
    }
  }

  async tokenRequest(grantType) {
    const body = new FormData();
    body.set('grant_type', grantType);
    body.set('client_id', requiredCredential(this.credentials, 'client_id'));
    body.set('client_secret', requiredCredential(this.credentials, 'client_secret'));
    if (grantType === 'refresh_token') {
      body.set('refresh_token', requiredCredential(
        { refresh_token: this.refreshToken },
        'refresh_token',
      ));
    } else {
      body.set('username', requiredCredential(this.credentials, 'username'));
      body.set('password', requiredCredential(this.credentials, 'password'));
    }
    this.consumeRateLimit();
    const response = await this.fetchImpl(`${this.baseUrl}/oauth/token`, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body,
      signal: AbortSignal.timeout(15_000),
    });
    const payload = await this.readResponse(response);
    if (!response.ok || !payload?.access_token) {
      throw this.providerError(response, payload, 'No fue posible autenticar la cuenta Factus.');
    }
    this.accessToken = payload.access_token;
    this.refreshToken = payload.refresh_token || this.refreshToken;
    const expiresIn = Math.max(60, Number(payload.expires_in) || 3600);
    this.tokenExpiresAt = this.now() + (expiresIn * 1000) - 30_000;
    this.cacheTokenSession();
    return payload;
  }

  async authenticate({ force = false } = {}) {
    if (force) {
      tokenSessions.delete(this.tokenSessionKey);
      this.accessToken = null;
      this.tokenExpiresAt = 0;
    }
    if (!force && this.accessToken && this.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }
    if (this.refreshToken) {
      try {
        await this.tokenRequest('refresh_token');
        return this.accessToken;
      } catch (error) {
        if (![400, 401, 422].includes(error.status)) throw error;
        this.refreshToken = null;
      }
    }
    await this.tokenRequest('password');
    return this.accessToken;
  }

  providerError(response, payload, fallback) {
    const status = Number(response.status) || 502;
    const exposedStatus = [400, 401, 402, 403, 404, 409, 422, 429, 500, 503]
      .includes(status) ? status : 502;
    const error = new AppError(
      factusMessage(payload, fallback),
      exposedStatus,
      `FACTUS_HTTP_${status || 'ERROR'}`,
    );
    error.providerResponse = payload;
    const retryAfter = Number(response.headers?.get?.('retry-after'));
    if (status === 429 && Number.isFinite(retryAfter)) {
      error.retryAfter = retryAfter;
    }
    return error;
  }

  async request(path, {
    method = 'GET',
    body = null,
    retryAuthentication = true,
  } = {}) {
    const token = await this.authenticate();
    this.consumeRateLimit();
    let response;
    try {
      response = await this.fetchImpl(`${this.baseUrl}${path}`, {
        method,
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
          ...(body === null ? {} : { 'Content-Type': 'application/json' }),
        },
        ...(body === null ? {} : { body: JSON.stringify(body) }),
        signal: AbortSignal.timeout(30_000),
      });
    } catch (cause) {
      const error = new AppError(
        'No fue posible comunicarse con Factus.',
        503,
        'FACTUS_NETWORK_ERROR',
      );
      error.cause = cause;
      throw error;
    }
    const payload = await this.readResponse(response);
    if (response.status === 401 && retryAuthentication) {
      await this.authenticate({ force: true });
      return this.request(path, { method, body, retryAuthentication: false });
    }
    if (!response.ok) {
      throw this.providerError(response, payload, 'Factus rechazó la solicitud.');
    }
    return payload;
  }

  async testConnection() {
    const ranges = await this.listNumberingRanges({ isActive: true });
    return {
      ready: true,
      provider: 'FACTUS',
      environment: this.account.environment,
      rangesVisible: Array.isArray(ranges?.data?.data)
        ? ranges.data.data.length
        : Array.isArray(ranges?.data) ? ranges.data.length : 0,
    };
  }

  async listNumberingRanges({ isActive = true } = {}) {
    const query = new URLSearchParams();
    if (isActive !== null) query.set('filter[is_active]', isActive ? '1' : '0');
    return this.request(`/v2/numbering-ranges?${query}`);
  }

  async listDianNumberingRanges() {
    return this.request('/v2/numbering-ranges/dian');
  }

  async submitDocument(payload) {
    const response = await this.request('/v2/bills/validate', {
      method: 'POST',
      body: payload,
    });
    const result = factusDocumentResult(response, payload.reference_code);
    return {
      status: result.document.is_validated === true ? 'ACCEPTED' : 'SUBMITTED',
      providerReference: result.providerReference,
      cufe: result.cufe,
      cude: result.cude,
      qrUrl: result.qrUrl,
      publicUrl: result.publicUrl,
      response,
    };
  }

  /**
   * Crea y valida un documento soporte de compra. Los catálogos tributarios,
   * el rango y la referencia deben venir de la empresa conectada; este
   * adaptador no aplica valores predeterminados de ejemplos de Factus.
   */
  async submitSupportDocument(payload) {
    const providerPayload = requiredObject(payload, 'documento soporte');
    const referenceCode = requiredText(providerPayload.reference_code, 'reference_code');
    const response = await this.request('/v2/support-documents/validate', {
      method: 'POST',
      body: providerPayload,
    });
    const result = factusDocumentResult(response, referenceCode);
    return {
      status: result.document.is_validated === true ? 'ACCEPTED' : 'SUBMITTED',
      providerReference: result.providerReference,
      cufe: result.cufe,
      cude: result.cude,
      qrUrl: result.qrUrl,
      publicUrl: result.publicUrl,
      response,
    };
  }

  /** Carga una factura de proveedor ya emitida usando su CUFE/track_id real. */
  async uploadReceivedInvoice(trackId) {
    const normalizedTrackId = requiredText(trackId, 'track_id');
    return this.request('/v2/receptions/upload', {
      method: 'POST',
      body: { track_id: normalizedTrackId },
    });
  }

  /**
   * Emite un evento RADIAN permitido manualmente para una factura recibida.
   * La secuencia legal (030 → 032 → 031/033) la verifica el proveedor antes
   * de aceptarlo; Nubixor no intenta inventar ni adelantar estados.
   */
  async emitReceptionEvent(billId, eventType, payload) {
    const normalizedBillId = requiredText(billId, 'bill_id');
    const normalizedEventType = requiredText(eventType, 'event_type');
    if (!MANUAL_RECEPTION_EVENTS.has(normalizedEventType)) {
      throw new AppError(
        'El evento RADIAN solicitado no puede emitirse manualmente.',
        422,
        'FACTUS_RECEPTION_EVENT_INVALID',
      );
    }
    return this.request(
      `/v2/receptions/bills/${encodeURIComponent(normalizedBillId)}/radian/events/${normalizedEventType}`,
      {
        method: 'PATCH',
        body: requiredObject(payload, 'evento RADIAN'),
      },
    );
  }

  async getDocumentStatus(number) {
    const encoded = encodeURIComponent(number);
    const response = await this.request(`/v2/bills/${encoded}`);
    const result = factusDocumentResult(response, number);
    return {
      status: result.document.is_validated === true ? 'ACCEPTED' : 'SUBMITTED',
      providerReference: result.providerReference,
      cufe: result.cufe,
      qrUrl: result.qrUrl,
      publicUrl: result.publicUrl,
      response,
    };
  }

  async downloadDocumentArtifacts(number) {
    const encoded = encodeURIComponent(requiredCredential({ number }, 'number'));
    const [pdf, xml] = await Promise.all([
      this.request(`/v2/bills/${encoded}/download-pdf`),
      this.request(`/v2/bills/${encoded}/download-xml/`),
    ]);
    return { pdf, xml };
  }

  async downloadAdjustmentNoteArtifacts(noteType, number) {
    const normalizedType = String(noteType || '').toUpperCase();
    const resource = normalizedType === 'DEBIT_NOTE' || normalizedType === 'DEBIT'
      ? 'debit-notes'
      : normalizedType === 'CREDIT_NOTE' || normalizedType === 'CREDIT'
        ? 'credit-notes'
        : null;
    if (!resource) {
      throw new AppError(
        'El tipo de nota Factus no permite descargar artefactos.',
        422,
        'FACTUS_NOTE_TYPE_INVALID',
      );
    }
    const encoded = encodeURIComponent(requiredCredential({ number }, 'number'));
    const [pdf, xml] = await Promise.all([
      this.request(`/v2/${resource}/${encoded}/download-pdf`),
      this.request(`/v2/${resource}/${encoded}/download-xml/`),
    ]);
    return { pdf, xml };
  }

  async submitAdjustmentNote(payload) {
    const noteType = String(payload?.note_type || '').toUpperCase();
    const path = noteType === 'DEBIT'
      ? '/v2/debit-notes/validate'
      : noteType === 'CREDIT'
        ? '/v2/credit-notes/validate'
        : null;
    if (!path) {
      throw new AppError(
        'La nota Factus debe indicar CREDIT o DEBIT.',
        422,
        'FACTUS_NOTE_TYPE_INVALID',
      );
    }
    const { note_type: _noteType, ...providerPayload } = payload;
    const response = await this.request(path, {
      method: 'POST',
      body: providerPayload,
    });
    const result = factusDocumentResult(response, providerPayload.reference_code);
    return {
      status: result.document.is_validated === true ? 'ACCEPTED' : 'SUBMITTED',
      providerReference: result.providerReference,
      cufe: result.cufe,
      cude: result.cude,
      qrUrl: result.qrUrl,
      publicUrl: result.publicUrl,
      response,
    };
  }

  async getAdjustmentNoteStatus(noteType, number) {
    const normalizedType = String(noteType || '').toUpperCase();
    const resource = normalizedType === 'DEBIT_NOTE' || normalizedType === 'DEBIT'
      ? 'debit-notes'
      : normalizedType === 'CREDIT_NOTE' || normalizedType === 'CREDIT'
        ? 'credit-notes'
        : null;
    if (!resource) {
      throw new AppError('El tipo de nota Factus no es válido.', 422, 'FACTUS_NOTE_TYPE_INVALID');
    }
    const response = await this.request(`/v2/${resource}/${encodeURIComponent(number)}`);
    const result = factusDocumentResult(response, number);
    return {
      status: result.document.is_validated === true ? 'ACCEPTED' : 'SUBMITTED',
      providerReference: result.providerReference,
      cude: result.cude,
      qrUrl: result.qrUrl,
      publicUrl: result.publicUrl,
      response,
    };
  }
}
