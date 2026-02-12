import { warnLog } from '@/utils/logger';

export interface PendingRealNameCallback {
  authToken: string;
  callbackCode: string | null;
  callbackSuccess: boolean | null;
  createdAt: number;
}

const REAL_NAME_CALLBACK_STORAGE_KEY = 'real_name_h5_callback_pending';
const REAL_NAME_CALLBACK_MAX_AGE_MS = 30 * 60 * 1000;

export const parseCallbackSuccess = (rawValue: string | null): boolean | null => {
  if (!rawValue) return null;

  const value = rawValue.trim().toLowerCase();
  if (['true', '1', 'yes', 'y', 'success'].includes(value)) {
    return true;
  }
  if (['false', '0', 'no', 'n', 'fail', 'failed', 'error'].includes(value)) {
    return false;
  }
  return null;
};

export const savePendingCallback = (payload: PendingRealNameCallback): void => {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.setItem(REAL_NAME_CALLBACK_STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    warnLog('useRealNameAuth', '保存实名回调缓存失败', error);
  }
};

export const readPendingCallback = (): PendingRealNameCallback | null => {
  if (typeof window === 'undefined') return null;

  try {
    const raw = sessionStorage.getItem(REAL_NAME_CALLBACK_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<PendingRealNameCallback>;
    const createdAt = Number(parsed.createdAt || 0);

    if (!parsed.authToken || typeof parsed.authToken !== 'string' || !createdAt) {
      clearPendingCallback();
      return null;
    }

    if (Date.now() - createdAt > REAL_NAME_CALLBACK_MAX_AGE_MS) {
      clearPendingCallback();
      return null;
    }

    return {
      authToken: parsed.authToken,
      callbackCode: typeof parsed.callbackCode === 'string' ? parsed.callbackCode : null,
      callbackSuccess: typeof parsed.callbackSuccess === 'boolean' ? parsed.callbackSuccess : null,
      createdAt,
    };
  } catch (error) {
    warnLog('useRealNameAuth', '读取实名回调缓存失败', error);
    clearPendingCallback();
    return null;
  }
};

export const clearPendingCallback = (): void => {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.removeItem(REAL_NAME_CALLBACK_STORAGE_KEY);
  } catch (error) {
    warnLog('useRealNameAuth', '清理实名回调缓存失败', error);
  }
};
