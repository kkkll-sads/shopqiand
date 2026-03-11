import { ApiError, isAbortError } from './errors';
import { appendQueryParams, type QueryParams } from './query';
import { clearAuthSession } from '../../lib/auth';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type EnvelopeCode = number | string;

interface ApiEnvelope<TData> {
  code: EnvelopeCode;
  message?: string;
  msg?: string;
  data: TData;
}

export interface RequestOptions<TBody = unknown>
  extends Omit<RequestInit, 'body' | 'headers' | 'method' | 'signal'> {
  body?: TBody;
  headers?: HeadersInit;
  method?: HttpMethod;
  query?: QueryParams;
  responseType?: 'json' | 'text' | 'blob';
  signal?: AbortSignal;
  timeout?: number;
  useMock?: boolean;
}

export interface MockRequestContext {
  body?: unknown;
  headers: Headers;
  method: HttpMethod;
  signal: AbortSignal;
  url: URL;
}

export type MockHandler = (context: MockRequestContext) => unknown | Promise<unknown>;
export type MockHandlerMap = Record<string, MockHandler>;

export interface HttpClientOptions {
  baseURL?: string;
  defaultHeaders?: HeadersInit;
  enableMock?: boolean;
  getAccessToken?: () => string | null;
  getAuthHeaders?: () => HeadersInit | null;
  isSuccessCode?: (code: EnvelopeCode) => boolean;
  mockDelay?: number;
  mockHandlers?: MockHandlerMap;
  timeout?: number;
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`;
}

function trimLeadingSlash(value: string): string {
  return value.startsWith('/') ? value.slice(1) : value;
}

function resolveUrl(path: string, baseURL?: string): URL {
  if (/^https?:\/\//i.test(path)) {
    return new URL(path);
  }

  if (baseURL) {
    return new URL(trimLeadingSlash(path), ensureTrailingSlash(baseURL));
  }

  const origin = typeof window === 'undefined' ? 'http://localhost' : window.location.origin;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return new URL(normalizedPath, origin);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function isBodyInit(value: unknown): value is BodyInit {
  return (
    typeof value === 'string' ||
    value instanceof Blob ||
    value instanceof FormData ||
    value instanceof URLSearchParams ||
    value instanceof ArrayBuffer ||
    ArrayBuffer.isView(value)
  );
}

function hasJsonContentType(headers: Headers): boolean {
  return headers.get('content-type')?.includes('application/json') ?? false;
}

function isEnvelope<TData>(payload: unknown): payload is ApiEnvelope<TData> {
  return isPlainObject(payload) && 'code' in payload && 'data' in payload;
}

const responseListFieldKeys = new Set([
  'list',
  'rows',
  'items',
  'menus',
  'children',
  'sessions',
  'packages',
  'zones',
  'package_zones',
  'session_options',
  'records',
  'resources',
  'hotNews',
  'hotVideos',
  'loginTabs',
  'cards',
  'collections',
  'consignments',
  'controllers',
  'columns',
  'databases',
  'ips',
  'related_users',
  'errors',
  'skus',
  'specs',
  'stages',
  'top_winners',
]);

function normalizeArrayField(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeListPayload(item));
  }

  if (isPlainObject(value)) {
    return Object.values(value).map((item) => normalizeListPayload(item));
  }

  return [];
}

function normalizeListPayload<T>(payload: T): T {
  if (Array.isArray(payload)) {
    return payload.map((item) => normalizeListPayload(item)) as T;
  }

  if (!isPlainObject(payload)) {
    return payload;
  }

  const normalized = payload as Record<string, unknown>;
  Object.keys(normalized).forEach((key) => {
    const value = normalized[key];
    if (responseListFieldKeys.has(key)) {
      normalized[key] = normalizeArrayField(value);
      return;
    }

    normalized[key] = normalizeListPayload(value);
  });

  return payload;
}

function buildMockKey(method: HttpMethod, url: URL): string {
  return `${method} ${url.pathname}`;
}

function createAbortError(): Error {
  return new DOMException('The operation was aborted.', 'AbortError');
}

function shouldRedirectToLogin(status?: number, code?: EnvelopeCode): boolean {
  return status === 303 || code === 303 || code === '303';
}

function redirectToLogin() {
  if (typeof window === 'undefined') {
    return;
  }

  clearAuthSession();

  if (window.location.hash === '#/login') {
    return;
  }

  window.location.hash = '#/login';
}

async function delay(duration: number, signal: AbortSignal): Promise<void> {
  if (duration <= 0) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      signal.removeEventListener('abort', handleAbort);
      resolve();
    }, duration);

    const handleAbort = () => {
      window.clearTimeout(timer);
      reject(createAbortError());
    };

    signal.addEventListener('abort', handleAbort, { once: true });
  });
}

export class HttpClient {
  private readonly options: Required<
    Pick<HttpClientOptions, 'defaultHeaders' | 'enableMock' | 'mockDelay' | 'timeout'>
  > &
    Omit<HttpClientOptions, 'defaultHeaders' | 'enableMock' | 'mockDelay' | 'timeout'>;

  constructor(options: HttpClientOptions = {}) {
    this.options = {
      baseURL: options.baseURL,
      defaultHeaders: options.defaultHeaders ?? {},
      enableMock: options.enableMock ?? false,
      getAccessToken: options.getAccessToken,
      getAuthHeaders: options.getAuthHeaders,
      isSuccessCode: options.isSuccessCode ?? ((code) => code === 0),
      mockDelay: options.mockDelay ?? 0,
      mockHandlers: options.mockHandlers ?? {},
      timeout: options.timeout ?? 10000,
    };
  }

  async request<TResponse, TBody = unknown>(
    path: string,
    options: RequestOptions<TBody> = {},
  ): Promise<TResponse> {
    const method = options.method ?? 'GET';
    const headers = new Headers(this.options.defaultHeaders);
    const url = appendQueryParams(resolveUrl(path, this.options.baseURL), options.query);
    const controller = new AbortController();
    const timeout = options.timeout ?? this.options.timeout;
    let timedOut = false;

    if (options.headers) {
      new Headers(options.headers).forEach((value, key) => {
        headers.set(key, value);
      });
    }

    const authHeaders = this.options.getAuthHeaders?.();
    if (authHeaders) {
      new Headers(authHeaders).forEach((value, key) => {
        if (!headers.has(key)) {
          headers.set(key, value);
        }
      });
    }

    const token = this.options.getAccessToken?.();
    if (token && !headers.has('authorization')) {
      headers.set('authorization', `Bearer ${token}`);
    }

    const detachAbortBridge = this.bridgeAbortSignal(options.signal, controller);
    const timeoutId = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeout);

    try {
      const preparedBody = this.prepareBody(options.body, headers);
      const enableMock = options.useMock ?? this.options.enableMock;

      if (enableMock) {
        const mockHandler = this.options.mockHandlers[buildMockKey(method, url)];
        if (mockHandler) {
          await delay(this.options.mockDelay, controller.signal);
          const payload = await mockHandler({
            body: options.body,
            headers,
            method,
            signal: controller.signal,
            url,
          });
          return this.unwrapPayload<TResponse>(payload, 200);
        }
      }

      const response = await fetch(url.toString(), {
        ...options,
        body: preparedBody,
        headers,
        method,
        signal: controller.signal,
      });

      const payload = await this.parseResponse(response, options.responseType ?? 'json');

      if (!response.ok) {
        throw this.toApiError(payload, response.status);
      }

      return this.unwrapPayload<TResponse>(payload, response.status);
    } catch (error) {
      if (timedOut) {
        throw new ApiError('Request timed out.', { code: 'REQUEST_TIMEOUT' });
      }

      if (error instanceof ApiError || isAbortError(error)) {
        throw error;
      }

      throw new ApiError('Network request failed.', { details: error });
    } finally {
      window.clearTimeout(timeoutId);
      detachAbortBridge();
    }
  }

  get<TResponse>(path: string, options: Omit<RequestOptions<never>, 'body' | 'method'> = {}) {
    return this.request<TResponse>(path, { ...options, method: 'GET' });
  }

  post<TResponse, TBody = unknown>(
    path: string,
    body?: TBody,
    options: Omit<RequestOptions<TBody>, 'body' | 'method'> = {},
  ) {
    return this.request<TResponse, TBody>(path, { ...options, body, method: 'POST' });
  }

  put<TResponse, TBody = unknown>(
    path: string,
    body?: TBody,
    options: Omit<RequestOptions<TBody>, 'body' | 'method'> = {},
  ) {
    return this.request<TResponse, TBody>(path, { ...options, body, method: 'PUT' });
  }

  patch<TResponse, TBody = unknown>(
    path: string,
    body?: TBody,
    options: Omit<RequestOptions<TBody>, 'body' | 'method'> = {},
  ) {
    return this.request<TResponse, TBody>(path, { ...options, body, method: 'PATCH' });
  }

  delete<TResponse, TBody = unknown>(
    path: string,
    body?: TBody,
    options: Omit<RequestOptions<TBody>, 'body' | 'method'> = {},
  ) {
    return this.request<TResponse, TBody>(path, { ...options, body, method: 'DELETE' });
  }

  private bridgeAbortSignal(signal: AbortSignal | undefined, controller: AbortController) {
    if (!signal) {
      return () => undefined;
    }

    if (signal.aborted) {
      controller.abort();
      return () => undefined;
    }

    const handleAbort = () => controller.abort();
    signal.addEventListener('abort', handleAbort, { once: true });

    return () => signal.removeEventListener('abort', handleAbort);
  }

  private prepareBody<TBody>(body: TBody | undefined, headers: Headers): BodyInit | undefined {
    if (body == null) {
      return undefined;
    }

    if (isBodyInit(body)) {
      return body;
    }

    if (isPlainObject(body) || Array.isArray(body)) {
      if (!hasJsonContentType(headers)) {
        headers.set('content-type', 'application/json');
      }
      return JSON.stringify(body);
    }

    return String(body) as BodyInit;
  }

  private async parseResponse(response: Response, responseType: 'json' | 'text' | 'blob') {
    if (responseType === 'blob') {
      return response.blob();
    }

    if (responseType === 'text') {
      return response.text();
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      return response.json();
    }

    const text = await response.text();
    if (!text) {
      return null;
    }

    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  private toApiError(payload: unknown, status: number): ApiError {
    if (isEnvelope(payload)) {
      if (shouldRedirectToLogin(status, payload.code)) {
        redirectToLogin();
      }

      return new ApiError(payload.message || payload.msg || 'Request failed.', {
        code: payload.code,
        details: payload,
        status,
      });
    }

    if (shouldRedirectToLogin(status)) {
      redirectToLogin();
    }

    if (isPlainObject(payload) && typeof payload.message === 'string') {
      return new ApiError(payload.message, { details: payload, status });
    }

    return new ApiError('Request failed.', { details: payload, status });
  }

  private unwrapPayload<TResponse>(payload: unknown, status: number): TResponse {
    if (isEnvelope<TResponse>(payload)) {
      if (!this.options.isSuccessCode(payload.code)) {
        if (shouldRedirectToLogin(status, payload.code)) {
          redirectToLogin();
        }

        throw new ApiError(payload.message || payload.msg || 'Request failed.', {
          code: payload.code,
          details: payload,
          status,
        });
      }

      return normalizeListPayload(payload.data);
    }

    return normalizeListPayload(payload as TResponse);
  }
}

