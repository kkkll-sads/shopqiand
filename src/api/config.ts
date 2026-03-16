const DEFAULT_API_BASE_URL = '';
const DEFAULT_BASE_URL_PROBE_PATH = '/api/User/checkIn';
const DEFAULT_BASE_URL_PROBE_TIMEOUT = 3500;
const DEFAULT_BASE_URL_CACHE_KEY = 'api:resolved-base-url';

function toNumber(value: string | undefined, fallback: number): number {
  const next = Number(value);
  return Number.isFinite(next) && next > 0 ? next : fallback;
}

function toBoolean(value: string | undefined, fallback: boolean): boolean {
  if (typeof value !== 'string') {
    return fallback;
  }

  const normalizedValue = value.trim().toLowerCase();

  if (normalizedValue === 'true') {
    return true;
  }

  if (normalizedValue === 'false') {
    return false;
  }

  return fallback;
}

function normalizeBaseURL(value: string): string {
  return value.trim().replace(/\/+$/, '');
}

function appendUnique(target: string[], value: string | undefined) {
  if (!value) {
    return;
  }

  if (!target.includes(value)) {
    target.push(value);
  }
}

function splitBaseURLs(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(/[\n,;|]+/g)
    .map((entry) => normalizeBaseURL(entry))
    .filter((entry) => entry.length > 0);
}

function getRuntimeOrigin(): string | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  const { origin } = window.location;
  if (!origin || origin === 'null') {
    return undefined;
  }

  if (!/^https?:\/\//i.test(origin)) {
    return undefined;
  }

  try {
    const runtimeUrl = new URL(origin);
    const hostname = runtimeUrl.hostname.trim().toLowerCase();
    const isLocalHost =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '::1' ||
      hostname === '[::1]';

    if (isLocalHost) {
      return undefined;
    }
  } catch {
    return undefined;
  }

  return normalizeBaseURL(origin);
}

function resolveBaseURLCandidates(): string[] {
  const candidates: string[] = [];
  const singleBaseURL = import.meta.env.VITE_API_BASE_URL?.trim();
  const multiBaseURLs = splitBaseURLs(import.meta.env.VITE_API_BASE_URLS);
  const includeOrigin = toBoolean(import.meta.env.VITE_API_INCLUDE_ORIGIN, true);

  multiBaseURLs.forEach((entry) => appendUnique(candidates, entry));
  appendUnique(candidates, singleBaseURL ? normalizeBaseURL(singleBaseURL) : undefined);

  if (includeOrigin) {
    appendUnique(candidates, getRuntimeOrigin());
  }

  return candidates;
}

export const apiConfig = {
  baTokenStorageKey: import.meta.env.VITE_API_BA_TOKEN_KEY?.trim() || 'ba-token',
  baUserTokenStorageKey: import.meta.env.VITE_API_BA_USER_TOKEN_KEY?.trim() || 'ba-user-token',
  baseURL: import.meta.env.VITE_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL,
  baseURLCacheKey: import.meta.env.VITE_API_BASE_URL_CACHE_KEY?.trim() || DEFAULT_BASE_URL_CACHE_KEY,
  baseURLCandidates: resolveBaseURLCandidates(),
  baseURLProbePath:
    import.meta.env.VITE_API_BASE_URL_PROBE_PATH?.trim() || DEFAULT_BASE_URL_PROBE_PATH,
  baseURLProbeTimeout: toNumber(
    import.meta.env.VITE_API_BASE_URL_PROBE_TIMEOUT,
    DEFAULT_BASE_URL_PROBE_TIMEOUT,
  ),
  mockDelay: toNumber(import.meta.env.VITE_API_MOCK_DELAY, 250),
  timeout: toNumber(import.meta.env.VITE_API_TIMEOUT, 10000),
  tokenStorageKey: import.meta.env.VITE_API_TOKEN_KEY?.trim() || 'access_token',
  useMock: toBoolean(import.meta.env.VITE_API_USE_MOCK, false),
};
