import { FactusAdapter } from './factus-adapter.js';

export class ResilientFactusAdapter extends FactusAdapter {
  async findDocumentByReference(referenceCode) {
    const query = new URLSearchParams();
    query.set('filter[reference_code]', String(referenceCode || '').trim());
    const response = await this.request(`/v2/bills?${query}`);
    const candidates = Array.isArray(response?.data?.data)
      ? response.data.data
      : Array.isArray(response?.data)
        ? response.data
        : [];
    const document = candidates.find((candidate) =>
      candidate?.reference_code === referenceCode) || candidates[0];
    if (!document) return null;
    return {
      status: document.is_validated === true ? 'ACCEPTED' : 'SUBMITTED',
      providerReference: document.number || document.reference_code || referenceCode,
      cufe: document.cufe || null,
      qrUrl: document.qr || document.qr_url || null,
      response,
    };
  }
}
