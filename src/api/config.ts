/* 不在前端暴露后端地址，API 请求通过 Vite 代理转发（开发环境）或 Nginx 反向代理（生产环境） */
const DEFAULT_API_BASE_URL = '';

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

export const apiConfig = {
  baTokenStorageKey: import.meta.env.VITE_API_BA_TOKEN_KEY?.trim() || 'ba-token',
  baUserTokenStorageKey: import.meta.env.VITE_API_BA_USER_TOKEN_KEY?.trim() || 'ba-user-token',
  baseURL: import.meta.env.VITE_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL,
  mockDelay: toNumber(import.meta.env.VITE_API_MOCK_DELAY, 250),
  timeout: toNumber(import.meta.env.VITE_API_TIMEOUT, 10000),
  tokenStorageKey: import.meta.env.VITE_API_TOKEN_KEY?.trim() || 'access_token',
  useMock: toBoolean(import.meta.env.VITE_API_USE_MOCK, false),
};
