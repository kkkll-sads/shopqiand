import { apiConfig } from '../config';

export interface ApiAuthOptions {
  baToken?: string;
  baUserToken?: string;
}

function getStorageValue(key: string): string | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  const value = window.localStorage.getItem(key)?.trim();
  return value || undefined;
}

export function createApiHeaders(options: ApiAuthOptions = {}): Record<string, string> {
  const headers: Record<string, string> = {};
  const baToken = options.baToken ?? getStorageValue(apiConfig.baTokenStorageKey);
  const baUserToken = options.baUserToken ?? getStorageValue(apiConfig.baUserTokenStorageKey);

  if (baToken) {
    headers['ba-token'] = baToken;
  }

  if (baUserToken) {
    headers['ba-user-token'] = baUserToken;
  }

  return headers;
}
