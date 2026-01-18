/**
 * API 客户端
 * 集成 Zustand store 的认证状态管理
 */
import { apiFetch, ApiResponse, ApiFetchConfig } from './networking';
import { useAuthStore } from '../src/stores/authStore';
import { extractError, isSuccess } from '../utils/apiHelpers';

/**
 * 获取当前 token
 */
export const getToken = (): string | null => {
  return useAuthStore.getState().token;
};

/**
 * 带认证的 API 请求
 * 自动附加 token，处理登录失效
 */
export async function authFetch<T = any>(
  path: string,
  config: Omit<ApiFetchConfig, 'token'> = {}
): Promise<ApiResponse<T>> {
  const token = getToken();

  if (!token) {
    throw new Error('用户未登录');
  }

  try {
    return await apiFetch<T>(path, { ...config, token });
  } catch (error: any) {
    // 登录失效时自动登出
    if (error.name === 'NeedLoginError' || error.code === 303) {
      useAuthStore.getState().logout();
    }
    throw error;
  }
}

/**
 * 公开 API 请求（不需要认证）
 */
export async function publicFetch<T = any>(
  path: string,
  config: ApiFetchConfig = {}
): Promise<ApiResponse<T>> {
  return apiFetch<T>(path, { ...config, disableNeedLoginHandler: true });
}

/**
 * API 响应处理工具
 */
export const isApiSuccess = (response: ApiResponse): boolean => {
  return isSuccess(response) || response.code === 200;
};

export const extractApiData = <T>(response: ApiResponse<T>): T | null => {
  return isApiSuccess(response) ? (response.data ?? null) : null;
};

export const extractApiError = (response: ApiResponse): string => {
  return extractError(response, '请求失败');
};
