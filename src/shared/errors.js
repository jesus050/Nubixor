export class AppError extends Error {
  constructor(message, status = 500, code = 'APP_ERROR', expose = true) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.code = code;
    this.expose = expose;
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message, code = 'SERVICE_UNAVAILABLE') {
    super(message, 503, code);
  }
}
