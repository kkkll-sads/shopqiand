export interface ApiErrorOptions {
  status?: number;
  code?: number | string;
  details?: unknown;
}

export class ApiError extends Error {
  readonly status?: number;
  readonly code?: number | string;
  readonly details?: unknown;

  constructor(message: string, options: ApiErrorOptions = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = options.status;
    this.code = options.code;
    this.details = options.details;
  }
}

export function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Request failed. Please try again.';
}
