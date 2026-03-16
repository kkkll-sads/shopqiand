import { apiConfig } from '../api/config';
import type { CheckInResponseData, UserInfo } from '../api/modules/auth';

const AUTH_SESSION_STORAGE_KEY = 'member_auth_session';
const AUTH_REDIRECT_PATH_STORAGE_KEY = 'member_auth_redirect_path';
export const AUTH_SESSION_CHANGE_EVENT = 'member-auth-session-change';

export const MOBILE_PATTERN = /^1\d{10}$/;
export const PASSWORD_PATTERN = /^[A-Za-z0-9]{6,32}$/;

type UnknownRecord = Record<string, unknown>;

export interface AuthSession {
  accessToken?: string;
  baToken?: string;
  baUserToken?: string;
  isAuthenticated: boolean;
  persistent: boolean;
  routePath?: string;
  userInfo?: UserInfo;
}

function isObject(value: unknown): value is UnknownRecord {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function readString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const nextValue = value.trim();
  return nextValue ? nextValue : undefined;
}

function pickString(source: UnknownRecord | undefined, keys: string[]): string | undefined {
  if (!source) {
    return undefined;
  }

  for (const key of keys) {
    const nextValue = readString(source[key]);
    if (nextValue) {
      return nextValue;
    }
  }

  return undefined;
}

function pickObject(source: UnknownRecord | undefined, keys: string[]): UnknownRecord | undefined {
  if (!source) {
    return undefined;
  }

  for (const key of keys) {
    const nextValue = source[key];
    if (isObject(nextValue)) {
      return nextValue;
    }
  }

  return undefined;
}

function normalizeAssetUrl(value: string): string {
  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  if (/^[\w-]+\.[\w-]+\.\w+\//.test(value)) {
    return `https://${value}`;
  }

  const baseURL =
    apiConfig.baseURL ||
    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost');

  try {
    return new URL(value.startsWith('/') ? value : `/${value}`, baseURL).toString();
  } catch {
    return value;
  }
}

function normalizeSessionUserInfo(userInfo: UserInfo | undefined): UserInfo | undefined {
  if (!userInfo || typeof userInfo !== 'object') {
    return userInfo;
  }

  const avatar = readString(userInfo.avatar);
  if (!avatar) {
    return userInfo;
  }

  return {
    ...userInfo,
    avatar: normalizeAssetUrl(avatar),
  };
}

function resolveSessionToken(
  session: Pick<AuthSession, 'accessToken' | 'baUserToken'> | null | undefined,
) {
  return readString(session?.baUserToken) ?? readString(session?.accessToken);
}

function hasValidAuthSession(
  session: Pick<AuthSession, 'accessToken' | 'baUserToken' | 'isAuthenticated'> | null | undefined,
) {
  return Boolean(session?.isAuthenticated && resolveSessionToken(session));
}

function safeParse(value: string | null): AuthSession | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as AuthSession;
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    if (!hasValidAuthSession(parsed)) {
      return null;
    }

    return {
      ...parsed,
      userInfo: normalizeSessionUserInfo(parsed.userInfo),
    };
  } catch {
    return null;
  }
}

function dispatchAuthSessionChange() {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new CustomEvent(AUTH_SESSION_CHANGE_EVENT));
}

function removeSessionFromStorage(storage: Storage) {
  storage.removeItem(AUTH_SESSION_STORAGE_KEY);
  storage.removeItem(apiConfig.tokenStorageKey);
}

function writeSessionToStorage(storage: Storage, session: AuthSession) {
  storage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));

  const token = session.baUserToken ?? session.accessToken;
  if (token) {
    storage.setItem(apiConfig.tokenStorageKey, token);
  } else {
    storage.removeItem(apiConfig.tokenStorageKey);
  }
}

function getBrowserStorages() {
  if (typeof window === 'undefined') {
    return null;
  }

  return {
    local: window.localStorage,
    session: window.sessionStorage,
  };
}

function resolveSafeRedirectPath(value: string | undefined): string | null {
  const nextPath = value?.trim();
  if (!nextPath) {
    return null;
  }

  if (/^https?:\/\//i.test(nextPath)) {
    return null;
  }

  if (nextPath.startsWith('#/')) {
    return nextPath.slice(1);
  }

  if (nextPath.startsWith('/')) {
    return nextPath;
  }

  return `/${nextPath.replace(/^\/+/, '')}`;
}

export function getAuthSessionSnapshot(): AuthSession | null {
  const storages = getBrowserStorages();
  if (!storages) {
    return null;
  }

  return (
    safeParse(storages.session.getItem(AUTH_SESSION_STORAGE_KEY)) ??
    safeParse(storages.local.getItem(AUTH_SESSION_STORAGE_KEY))
  );
}

export function createAuthSession(
  data: CheckInResponseData | null | undefined,
  fallbackUserInfo?: UserInfo,
): Omit<AuthSession, 'persistent'> {
  const source = isObject(data) ? data : undefined;
  const nestedUserInfo = pickObject(source, ['userInfo', 'userinfo', 'user']);
  const userInfo = normalizeSessionUserInfo(
    (nestedUserInfo as UserInfo | undefined) ??
      (isObject(fallbackUserInfo) ? fallbackUserInfo : undefined),
  );

  const accessToken = pickString(source, [
    'accessToken',
    'access_token',
    'token',
    'userToken',
    'user_token',
    'baUserToken',
    'ba_user_token',
  ]);

  const baUserToken =
    pickString(source, ['baUserToken', 'ba_user_token', 'userToken', 'user_token']) ??
    pickString(nestedUserInfo, ['baUserToken', 'ba_user_token', 'userToken', 'user_token', 'token']) ??
    accessToken;

  const baToken =
    pickString(source, ['baToken', 'ba_token']) ??
    pickString(nestedUserInfo, ['baToken', 'ba_token']);

  const routePath =
    pickString(source, ['routePath', 'route_path', 'redirect', 'redirectPath']) ??
    pickString(nestedUserInfo, ['routePath', 'route_path']);

  const isAuthenticated = Boolean(resolveSessionToken({ accessToken, baUserToken }));

  return {
    accessToken,
    baToken,
    baUserToken,
    isAuthenticated,
    routePath,
    userInfo,
  };
}

export function persistAuthSession(
  session: Omit<AuthSession, 'persistent'>,
  options: { persistent: boolean },
): boolean {
  const storages = getBrowserStorages();
  if (!storages) {
    return false;
  }

  const isAuthenticated = Boolean(resolveSessionToken(session));
  const nextSession: AuthSession = {
    ...session,
    isAuthenticated,
    persistent: options.persistent,
  };

  removeSessionFromStorage(storages.local);
  removeSessionFromStorage(storages.session);
  if (!nextSession.isAuthenticated) {
    dispatchAuthSessionChange();
    return false;
  }

  writeSessionToStorage(options.persistent ? storages.local : storages.session, nextSession);
  dispatchAuthSessionChange();
  return true;
}

export function clearAuthSession() {
  const storages = getBrowserStorages();
  if (!storages) {
    return;
  }

  removeSessionFromStorage(storages.local);
  removeSessionFromStorage(storages.session);
  dispatchAuthSessionChange();
}

export function patchAuthSessionUserInfo(patch: Partial<UserInfo>) {
  const storages = getBrowserStorages();
  if (!storages) {
    return;
  }

  const storage = storages.session.getItem(AUTH_SESSION_STORAGE_KEY)
    ? storages.session
    : storages.local.getItem(AUTH_SESSION_STORAGE_KEY)
      ? storages.local
      : null;

  if (!storage) {
    return;
  }

  const currentSession = safeParse(storage.getItem(AUTH_SESSION_STORAGE_KEY));
  if (!currentSession) {
    return;
  }

  const nextSession: AuthSession = {
    ...currentSession,
    userInfo: {
      ...(currentSession.userInfo ?? {}),
      ...patch,
      avatar:
        typeof patch.avatar === 'string' && patch.avatar.trim()
          ? normalizeAssetUrl(patch.avatar.trim())
          : patch.avatar,
    },
  };

  writeSessionToStorage(storage, nextSession);
  dispatchAuthSessionChange();
}

export function persistAuthRedirectPath(path: string) {
  const storages = getBrowserStorages();
  const nextPath = resolveSafeRedirectPath(path);
  if (!storages || !nextPath || nextPath === '/login' || nextPath === '/register') {
    return;
  }

  storages.session.setItem(AUTH_REDIRECT_PATH_STORAGE_KEY, nextPath);
}

export function consumeAuthRedirectPath() {
  const storages = getBrowserStorages();
  if (!storages) {
    return null;
  }

  const value = storages.session.getItem(AUTH_REDIRECT_PATH_STORAGE_KEY);
  storages.session.removeItem(AUTH_REDIRECT_PATH_STORAGE_KEY);
  return resolveSafeRedirectPath(value);
}

export function getAuthHeaders(): Record<string, string> {
  const session = getAuthSessionSnapshot();
  if (!session) {
    return {};
  }

  const headers: Record<string, string> = {};
  if (session.baToken) {
    headers['ba-token'] = session.baToken;
  }

  const userToken = session.baUserToken ?? session.accessToken;
  if (userToken) {
    headers['ba-user-token'] = userToken;
  }

  return headers;
}

export function subscribeAuthSessionChange(listener: () => void) {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const handleStorage = () => listener();

  window.addEventListener(AUTH_SESSION_CHANGE_EVENT, handleStorage);
  window.addEventListener('storage', handleStorage);

  return () => {
    window.removeEventListener(AUTH_SESSION_CHANGE_EVENT, handleStorage);
    window.removeEventListener('storage', handleStorage);
  };
}

export function resolveAuthRedirectPath(routePath?: string) {
  const nextPath = resolveSafeRedirectPath(routePath) ?? consumeAuthRedirectPath();
  if (!nextPath) {
    return '/user';
  }
  return nextPath;
}
