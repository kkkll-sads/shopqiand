import type { ApiResponse } from './networking';

export interface RequestStrategyConfig {
  cacheTTL?: number;
  dedup?: boolean;
  throttleMs?: number;
  forceRefresh?: boolean;
}

interface RequestCacheEntry<T = any> {
  expiresAt: number;
  data: ApiResponse<T>;
}

interface RequestMeta {
  method: string;
  path: string;
  tokenScope: string;
}

export interface InvalidateRequestCacheOptions {
  method?: string;
  exactPath?: string;
  pathIncludes?: string;
  token?: string;
  predicate?: (key: string) => boolean;
}

const responseCache = new Map<string, RequestCacheEntry>();
const inflightMap = new Map<string, Promise<ApiResponse<any>>>();
const lastInvokeMap = new Map<string, number>();
const requestMetaMap = new Map<string, RequestMeta>();

const normalizePath = (path: string): string => {
  const [pathname, rawQuery = ''] = path.split('?');
  if (!rawQuery) return pathname;

  const searchParams = new URLSearchParams(rawQuery);
  const sortedEntries = [...searchParams.entries()].sort(([a], [b]) => a.localeCompare(b));
  const sorted = new URLSearchParams();
  sortedEntries.forEach(([key, value]) => sorted.append(key, value));
  const query = sorted.toString();
  return query ? `${pathname}?${query}` : pathname;
};

const resolveTokenScope = (token?: string): string => {
  if (!token) return 'public';
  return token;
};

export const shouldUseRequestStrategy = (
  method: string,
  strategy: RequestStrategyConfig,
): boolean => {
  if (method.toUpperCase() !== 'GET') return false;
  return !!(
    (strategy.cacheTTL && strategy.cacheTTL > 0) ||
    strategy.dedup ||
    (strategy.throttleMs && strategy.throttleMs > 0) ||
    strategy.forceRefresh
  );
};

export const buildRequestKey = (params: {
  method: string;
  path: string;
  token?: string;
}): string => {
  const normalizedPath = normalizePath(params.path);
  const method = params.method.toUpperCase();
  const tokenScope = resolveTokenScope(params.token);
  const key = `${method}|${tokenScope}|${normalizedPath}`;
  requestMetaMap.set(key, { method, path: normalizedPath, tokenScope });
  return key;
};

export const getValidCachedResponse = <T = any>(key: string, now = Date.now()): ApiResponse<T> | null => {
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= now) {
    responseCache.delete(key);
    return null;
  }
  return entry.data as ApiResponse<T>;
};

export const setCachedResponse = (key: string, response: ApiResponse<any>, cacheTTL: number): void => {
  if (cacheTTL <= 0) return;
  responseCache.set(key, {
    expiresAt: Date.now() + cacheTTL,
    data: response,
  });
};

export const getInflightRequest = <T = any>(key: string): Promise<ApiResponse<T>> | undefined => {
  return inflightMap.get(key) as Promise<ApiResponse<T>> | undefined;
};

export const setInflightRequest = <T = any>(key: string, request: Promise<ApiResponse<T>>): void => {
  inflightMap.set(key, request as Promise<ApiResponse<any>>);
};

export const clearInflightRequest = (key: string): void => {
  inflightMap.delete(key);
};

export const getLastInvokeAt = (key: string): number | undefined => {
  return lastInvokeMap.get(key);
};

export const setLastInvokeAt = (key: string, timestamp: number): void => {
  lastInvokeMap.set(key, timestamp);
};

export const isCacheableResponse = (response: ApiResponse<any>): boolean => {
  return response?.code === 0 || response?.code === 1 || typeof response?.code === 'undefined';
};

export const clearRequestCache = (): void => {
  responseCache.clear();
  inflightMap.clear();
  lastInvokeMap.clear();
  requestMetaMap.clear();
};

export const invalidateRequestCache = (options: InvalidateRequestCacheOptions = {}): number => {
  const {
    method,
    exactPath,
    pathIncludes,
    token,
    predicate,
  } = options;

  const targetMethod = method?.toUpperCase();
  const normalizedExactPath = exactPath ? normalizePath(exactPath) : undefined;
  const tokenScope = token ? resolveTokenScope(token) : undefined;
  let removed = 0;

  const matches = (key: string): boolean => {
    if (predicate && !predicate(key)) return false;

    const meta = requestMetaMap.get(key);
    if (!meta) return false;
    if (targetMethod && meta.method !== targetMethod) return false;
    if (normalizedExactPath && meta.path !== normalizedExactPath) return false;
    if (pathIncludes && !meta.path.includes(pathIncludes)) return false;
    if (tokenScope && meta.tokenScope !== tokenScope) return false;
    return true;
  };

  [...requestMetaMap.keys()].forEach((key) => {
    if (!matches(key)) return;
    responseCache.delete(key);
    inflightMap.delete(key);
    lastInvokeMap.delete(key);
    requestMetaMap.delete(key);
    removed += 1;
  });

  return removed;
};
