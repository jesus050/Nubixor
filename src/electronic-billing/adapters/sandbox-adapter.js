import { randomUUID } from 'node:crypto';
import { ProviderAdapter } from './provider-adapter.js';

export class SandboxAdapter extends ProviderAdapter {
  async testConnection() {
    return {
      ready: true,
      environment: 'TEST',
      provider: 'SANDBOX',
      disclaimer: 'Simulación local; no existe comunicación con la DIAN.',
    };
  }

  async submitDocument(payload, { outcome = 'ACCEPTED' } = {}) {
    const accepted = outcome !== 'REJECTED';
    return {
      status: accepted ? 'ACCEPTED' : 'REJECTED',
      providerReference: `SANDBOX-${randomUUID()}`,
      cufe: null,
      cude: null,
      qrUrl: null,
      response: {
        environment: 'TEST',
        disclaimer: 'Resultado simulado; no corresponde a validación DIAN.',
        payloadSchema: payload?.schema || null,
      },
    };
  }

  async getDocumentStatus(providerReference) {
    return {
      status: 'ACCEPTED',
      providerReference,
      environment: 'TEST',
      disclaimer: 'Estado simulado; no corresponde a consulta DIAN.',
    };
  }

  async submitAdjustmentNote(payload, options = {}) {
    const result = await this.submitDocument(payload, options);
    return {
      ...result,
      cude: null,
      disclaimer: 'La nota es una simulación local y no tiene CUDE ni QR real.',
    };
  }

  async getAdjustmentNoteStatus(providerReference) {
    return this.getDocumentStatus(providerReference);
  }
}
