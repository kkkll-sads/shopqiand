/**
 * API 客户端 - 统一的请求封装
 * 
 * 提供两种请求方式：
 * 1. authedFetch - 带认证的请求（自动注入 token，支持重试）
 * 2. publicFetch - 公开请求（不需要认证）
 */
import { apiFetch, type ApiFetchConfig, type ApiResponse } from './networking';
import { useAuthStore } from '@/stores/authStore';
import {
  type RequestStrategyConfig,
  buildRequestKey,
  clearInflightRequest,
  clearRequestCache,
  getInflightRequest,
  getLastInvokeAt,
  getValidCachedResponse,
  invalidateRequestCache,
  isCacheableResponse,
  setCachedResponse,
  setInflightRequest,
  setLastInvokeAt,
  shouldUseRequestStrategy,
} from './request-cache';

// ============================================================
// Token 管理
// ============================================================

/**
 * getStoredToken - 统一获取本地存储的用户 token
 * 说明：从 Zustand authStore 读取 token
 * 
 * 注意：这是获取 token 的唯一入口，其他地方不要直接访问 authStore.token
 */
export const getStoredToken = (): string => useAuthStore.getState().token || '';

/**
 * getToken - getStoredToken 的别名（兼容性）
 * @deprecated 请使用 getStoredToken
 */
export const getToken = getStoredToken;

/**
 * hasToken - 检查是否有有效 token
 */
export const hasToken = (): boolean => !!getStoredToken();

// ============================================================
// 请求配置类型
// ============================================================

/**
 * authedFetch 额外配置
 * - retry: 网络错误重试次数
 * - retryDelayMs: 重试间隔（毫秒）
 * - onNeedLogin: 捕获 NeedLoginError 时回调，便于全局统一处理
 * - onNetworkError: 网络错误回调（最终失败时触发）
 */
export interface AuthedFetchConfig extends ApiFetchConfig, RequestStrategyConfig {
  token?: string;
  retry?: number;
  retryDelayMs?: number;
  onNeedLogin?: () => void;
  onNetworkError?: (error: any) => void;
}

export interface RequestConfig extends ApiFetchConfig, RequestStrategyConfig {}

// ============================================================
// 工具函数
// ============================================================

const isNetworkError = (error: any) =>
  error?.isCorsError || (error instanceof Error && error.message?.includes('Failed to fetch'));

// ============================================================
// 请求方法
// ============================================================

/**
 * authedFetch - 自动注入 token 的请求封装
 *
 * 设计要点：
 * 1) 如调用方显式传入 token，优先使用传入值
 * 2) 未传 token 时，从本地存储读取（空值则视为未登录请求）
 * 3) 其余参数透传给 apiFetch，保持向后兼容
 * 4) 支持网络错误自动重试
 */
export async function authedFetch<T = any>(
  path: string,
  config: AuthedFetchConfig = {},
): Promise<ApiResponse<T>> {
  const {
    token,
    retry = 0,
    retryDelayMs = 500,
    onNeedLogin,
    onNetworkError,
    cacheTTL = 0,
    dedup = false,
    throttleMs = 0,
    forceRefresh = false,
    ...rest
  } = config;

  const finalToken = token ?? getStoredToken();
  const method = (rest.method ?? 'GET').toUpperCase();
  const strategy = { cacheTTL, dedup, throttleMs, forceRefresh };
  const useStrategy = shouldUseRequestStrategy(method, strategy);
  const requestKey = useStrategy ? buildRequestKey({ method, path, token: finalToken }) : '';

  const executeWithRetry = async (): Promise<ApiResponse<T>> => {
    let attempt = 0;
    while (true) {
      try {
        const response = await apiFetch<T>(path, { ...rest, token: finalToken });
        if (useStrategy && cacheTTL > 0 && isCacheableResponse(response)) {
          setCachedResponse(requestKey, response, cacheTTL);
        }
        return response;
      } catch (error: any) {
        const needLogin = error?.name === 'NeedLoginError';
        const networkError = isNetworkError(error);

        if (needLogin && onNeedLogin) {
          try {
            onNeedLogin();
          } catch {
            // 回调失败不影响主流程
          }
        }

        if (networkError && attempt < retry) {
          attempt += 1;
          if (retryDelayMs > 0) {
            await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
          }
          continue;
        }

        if (networkError && onNetworkError) {
          try {
            onNetworkError(error);
          } catch {
            // 回调失败忽略
          }
        }

        throw error;
      }
    }
  };

  if (!useStrategy) {
    return executeWithRetry();
  }

  const now = Date.now();
  if (!forceRefresh) {
    if (throttleMs > 0) {
      const lastInvokeAt = getLastInvokeAt(requestKey);
      if (typeof lastInvokeAt === 'number' && now - lastInvokeAt < throttleMs) {
        const inflightRequest = getInflightRequest<T>(requestKey);
        if (inflightRequest) return inflightRequest;
        const cachedInThrottle = getValidCachedResponse<T>(requestKey, now);
        if (cachedInThrottle) return cachedInThrottle;
      }
    }

    const cached = getValidCachedResponse<T>(requestKey, now);
    if (cached) return cached;

    if (dedup) {
      const inflightRequest = getInflightRequest<T>(requestKey);
      if (inflightRequest) return inflightRequest;
    }
  }

  if (throttleMs > 0) {
    setLastInvokeAt(requestKey, now);
  }

  const requestPromise = executeWithRetry();
  if (dedup) {
    setInflightRequest(requestKey, requestPromise);
    requestPromise.finally(() => {
      clearInflightRequest(requestKey);
    });
  }

  return requestPromise;
}

/**
 * publicFetch - 公开 API 请求（不需要认证）
 * 
 * 用于登录、注册等不需要 token 的接口
 */
export async function publicFetch<T = any>(
  path: string,
  config: RequestConfig = {},
): Promise<ApiResponse<T>> {
  const {
    cacheTTL = 0,
    dedup = false,
    throttleMs = 0,
    forceRefresh = false,
    ...rest
  } = config;
  const method = (rest.method ?? 'GET').toUpperCase();
  const strategy = { cacheTTL, dedup, throttleMs, forceRefresh };
  const useStrategy = shouldUseRequestStrategy(method, strategy);
  const requestKey = useStrategy ? buildRequestKey({ method, path }) : '';

  const execute = async (): Promise<ApiResponse<T>> => {
    const response = await apiFetch<T>(path, { ...rest, disableNeedLoginHandler: true });
    if (useStrategy && cacheTTL > 0 && isCacheableResponse(response)) {
      setCachedResponse(requestKey, response, cacheTTL);
    }
    return response;
  };

  if (!useStrategy) {
    return execute();
  }

  const now = Date.now();
  if (!forceRefresh) {
    if (throttleMs > 0) {
      const lastInvokeAt = getLastInvokeAt(requestKey);
      if (typeof lastInvokeAt === 'number' && now - lastInvokeAt < throttleMs) {
        const inflightRequest = getInflightRequest<T>(requestKey);
        if (inflightRequest) return inflightRequest;
        const cachedInThrottle = getValidCachedResponse<T>(requestKey, now);
        if (cachedInThrottle) return cachedInThrottle;
      }
    }

    const cached = getValidCachedResponse<T>(requestKey, now);
    if (cached) return cached;

    if (dedup) {
      const inflightRequest = getInflightRequest<T>(requestKey);
      if (inflightRequest) return inflightRequest;
    }
  }

  if (throttleMs > 0) {
    setLastInvokeAt(requestKey, now);
  }

  const requestPromise = execute();
  if (dedup) {
    setInflightRequest(requestKey, requestPromise);
    requestPromise.finally(() => {
      clearInflightRequest(requestKey);
    });
  }

  return requestPromise;
}

// ============================================================
// 统一导出 API 客户端对象
// ============================================================

/**
 * apiClient - 统一的 API 客户端对象
 * 
 * 使用示例：
 * ```ts
 * import { apiClient } from '@/services/client';
 * 
 * // 认证请求
 * const res = await apiClient.auth('/api/user/profile');
 * 
 * // 公开请求
 * const res = await apiClient.public('/api/common/config');
 * 
 * // 获取 token
 * const token = apiClient.getToken();
 * ```
 */
export const apiClient = {
  /** 认证请求 */
  auth: authedFetch,
  /** 公开请求 */
  public: publicFetch,
  /** 获取 Token */
  getToken: getStoredToken,
  /** 检查是否有 Token */
  hasToken,
  /** 清空请求缓存 */
  clearRequestCache,
  /** 失效指定请求缓存 */
  invalidateRequestCache,
};

// 默认导出
export default authedFetch;

export { clearRequestCache, invalidateRequestCache } from './request-cache';
export type { InvalidateRequestCacheOptions, RequestStrategyConfig } from './request-cache';

// 重导出类型
export type { ApiResponse, ApiFetchConfig } from './networking';

