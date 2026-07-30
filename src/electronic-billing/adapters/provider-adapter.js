import { AppError } from '../../shared/errors.js';

export class ProviderAdapter {
  constructor(account) {
    this.account = account;
  }

  async testConnection() {
    throw new AppError(
      'El adaptador no implementa prueba de conexión.',
      501,
      'BILLING_ADAPTER_METHOD_PENDING',
    );
  }

  async submitDocument() {
    throw new AppError(
      'El adaptador no implementa transmisión de documentos.',
      501,
      'BILLING_ADAPTER_METHOD_PENDING',
    );
  }

  async getDocumentStatus() {
    throw new AppError(
      'El adaptador no implementa consulta de estado.',
      501,
      'BILLING_ADAPTER_METHOD_PENDING',
    );
  }

  async submitAdjustmentNote() {
    throw new AppError(
      'El adaptador no implementa transmisión de notas crédito o débito.',
      501,
      'BILLING_ADAPTER_METHOD_PENDING',
    );
  }

  async getAdjustmentNoteStatus() {
    throw new AppError(
      'El adaptador no implementa consulta de notas crédito o débito.',
      501,
      'BILLING_ADAPTER_METHOD_PENDING',
    );
  }
}
