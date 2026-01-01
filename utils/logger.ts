const DEBUG_FLAG_STORAGE_KEY = 'app:debug-log-enabled';

// 默认：开发环境开启调试日志，生产环境需显式打开 VITE_ENABLE_DEBUG_LOG=true
const defaultDebugEnabled =
  (typeof import.meta !== 'undefined' && import.meta.env?.DEV) ||
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ENABLE_DEBUG_LOG === 'true');

// 业务日志默认开启，可通过 VITE_ENABLE_BIZ_LOG=false 关闭
const bizLogEnabled =
  typeof import.meta !== 'undefined'
    ? import.meta.env?.VITE_ENABLE_BIZ_LOG !== 'false'
    : true;

const getStoredDebugFlag = (): boolean | null => {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  const stored = window.localStorage.getItem(DEBUG_FLAG_STORAGE_KEY);
  return stored === null ? null : stored === 'true';
};

const setStoredDebugFlag = (enabled: boolean) => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  window.localStorage.setItem(DEBUG_FLAG_STORAGE_KEY, enabled ? 'true' : 'false');
};

const isDebugEnabled = (): boolean => {
  const stored = getStoredDebugFlag();
  if (stored !== null) return stored;
  return !!defaultDebugEnabled;
};

const scopeLabel = (type: string, scope?: string) =>
  scope ? `[${type}][${scope}]` : `[${type}]`;

export const debugLog = (scope: string, ...args: unknown[]) => {
  if (!isDebugEnabled()) return;
  console.debug(scopeLabel('DEBUG', scope), ...args);
};

export const bizLog = (event: string, payload?: unknown) => {
  if (!bizLogEnabled) return;
  console.info(scopeLabel('BIZ', event), payload);
};

export const warnLog = (scope: string, ...args: unknown[]) => {
  console.warn(scopeLabel('WARN', scope), ...args);
};

export const errorLog = (scope: string, ...args: unknown[]) => {
  console.error(scopeLabel('ERROR', scope), ...args);
};

export const enableDebugLog = () => setStoredDebugFlag(true);

export const disableDebugLog = () => setStoredDebugFlag(false);

export const isDebugLogEnabled = () => isDebugEnabled();

