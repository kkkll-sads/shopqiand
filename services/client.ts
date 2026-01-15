import { apiFetch, type ApiFetchConfig, type ApiResponse } from './networking';
import { useAuthStore } from '../src/stores/authStore';

/**
 * getStoredToken - 统一获取本地存储的用户 token
 * 说明：从 Zustand authStore 读取 token
 */
export const getStoredToken = () => useAuthStore.getState().token || '';

/**
 * authedFetch 额外配置
 * - retry: 网络错误重试次数
 * - retryDelayMs: 重试间隔（毫秒）
 * - onNeedLogin: 捕获 NeedLoginError 时回调，便于全局统一处理
 * - onNetworkError: 网络错误回调（最终失败时触发）
 */
export interface AuthedFetchConfig extends ApiFetchConfig {
  token?: string;
  retry?: number;
  retryDelayMs?: number;
  onNeedLogin?: () => void;
  onNetworkError?: (error: any) => void;
}

const isNetworkError = (error: any) =>
  error?.isCorsError || (error instanceof Error && error.message?.includes('Failed to fetch'));

/**
 * authedFetch - 自动注入 token 的请求封装
 *
 * 设计要点：
 * 1) 如调用方显式传入 token，优先使用传入值
 * 2) 未传 token 时，从本地存储读取（空值则视为未登录请求）
 * 3) 其余参数透传给 apiFetch，保持向后兼容
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
    ...rest
  } = config;

  const finalToken = token ?? getStoredToken();
  let attempt = 0;

  while (true) {
    try {
      return await apiFetch<T>(path, { ...rest, token: finalToken });
    } catch (error: any) {
      const needLogin = error?.name === 'NeedLoginError';
      const networkError = isNetworkError(error);

      // 需要登录的错误交由上层统一处理
      if (needLogin && onNeedLogin) {
        try {
          onNeedLogin();
        } catch { /* 回调失败不影响主流程 */ }
      }

      // 网络错误重试
      if (networkError && attempt < retry) {
        attempt += 1;
        if (retryDelayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
        }
        continue;
      }

      // 最终网络错误回调
      if (networkError && onNetworkError) {
        try {
          onNetworkError(error);
        } catch { /* 回调失败忽略 */ }
      }

      throw error;
    }
  }
}

export default authedFetch;

