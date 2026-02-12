import { warnLog } from '@/utils/logger';

// 统一 API 前缀，与 vite.config.ts 中的代理前缀保持一致
export const API_PREFIX = '/api';

// API 基础配置：
// - 开发环境：使用 Vite 代理，走相对路径 /api
// - 生产环境：优先使用环境变量 VITE_API_BASE_URL，其次使用当前域名

// 动态获取当前域名，避免硬编码后端地址被攻击
const getOrigin = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return '';
};

const rawEnv = (import.meta as any).env ?? {};

const resolveApiBaseUrl = () => {
  const envBase = rawEnv?.VITE_API_BASE_URL;
  if (envBase) return envBase;
  // 开发和生产环境都使用相对路径，通过 Nginx 代理解决跨域
  return API_PREFIX;
};

const resolveApiOrigin = () => {
  const candidates = [rawEnv?.VITE_API_BASE_URL, rawEnv?.VITE_API_TARGET];

  for (const candidate of candidates) {
    if (candidate && candidate.startsWith('http')) {
      try {
        return new URL(candidate).origin;
      } catch (error) {
        warnLog('config', '无法解析 API origin', { candidate, error });
      }
    }
  }

  if (!rawEnv?.DEV) {
    const baseUrl = resolveApiBaseUrl();
    if (baseUrl.startsWith('http')) {
      try {
        return new URL(baseUrl).origin;
      } catch {
        // ignore parse errors and fallback to current origin
      }
    }
  }

  // 使用 window.location.origin 自适应当前域名
  return getOrigin();
};

// API 基础配置
export const API_BASE_URL = resolveApiBaseUrl();
export const API_ASSET_ORIGIN = resolveApiOrigin();

export const normalizeAssetUrl = (raw?: string) => {
  if (!raw) return '';

  // 如果是完整URL，检查是否需要转为相对路径
  if (raw.startsWith('http')) {
    try {
      const url = new URL(raw);
      const currentOrigin = getOrigin();

      // 检查是否是当前域名
      const isCurrentDomain = typeof window !== 'undefined' && url.host === window.location.host;

      // 检查是否与配置的 API Origin 匹配
      const isConfiguredApi =
        currentOrigin &&
        (() => {
          try {
            return url.host === new URL(currentOrigin).host;
          } catch {
            return false;
          }
        })();

      // 兼容处理：后端返回的 URL 可能包含旧的服务器地址（IP 格式）
      // 这些地址需要转换为相对路径，通过 Nginx 代理访问
      const isLegacyBackendUrl = /^\d+\.\d+\.\d+\.\d+/.test(url.hostname);

      if (isCurrentDomain || isConfiguredApi || isLegacyBackendUrl) {
        // 转换为相对路径，通过本地代理访问 (解决 Mixed Content 和跨域问题)
        const relativePath = url.pathname + url.search;
        return relativePath.startsWith('/') ? relativePath : '/' + relativePath;
      }
    } catch {
      // URL解析失败，返回原始值
    }
    return raw;
  }

  if (raw.startsWith('//')) {
    try {
      // 尝试使用当前页面协议
      const protocol = typeof window !== 'undefined' ? window.location.protocol : 'https:';
      return `${protocol}${raw}`;
    } catch {
      return `https:${raw}`;
    }
  }

  // 相对路径，直接返回（会通过代理访问）
  if (raw.startsWith('/')) {
    return raw;
  }

  return raw;
};
