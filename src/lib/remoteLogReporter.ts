import { getAuthHeaders, getAuthSessionSnapshot } from './auth';

export type RemoteLogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface RemoteLogEntry {
  id: string;
  at: number;
  level: RemoteLogLevel;
  scope: string;
  message: string;
  details?: string;
  route?: string;
}

interface StartupDiagnosticEntry {
  at: number;
  name: string;
  value: string | number | boolean | null;
}

interface RemoteLogPayload {
  app: string;
  source: 'web';
  reason: string;
  sentAt: number;
  sessionId: string;
  page: {
    href: string;
    pathname: string;
    search: string;
    hash: string;
    title: string;
    referrer: string;
  };
  device: {
    userAgent: string;
    language: string;
    viewportWidth: number;
    viewportHeight: number;
    devicePixelRatio: number;
  };
  auth: {
    isLoggedIn: boolean;
    userId: number | string | null;
  };
  startupDiagnostics: StartupDiagnosticEntry[];
  logs: RemoteLogEntry[];
}

declare global {
  interface Window {
    __CLIENT_REMOTE_LOG__?: {
      disable: () => void;
      enable: () => void;
      flush: (reason?: string) => void;
      getBufferedLogs: () => RemoteLogEntry[];
      getEndpoint: () => string;
      isEnabled: () => boolean;
    };
  }
}

const REMOTE_LOG_STORAGE_KEY = 'app:remote-log-enabled';
const REMOTE_LOG_SESSION_KEY = 'app:remote-log-session-id';
const APP_NAME = 'shopqiand-h5';
const MAX_BATCH_SIZE = 20;
const MAX_QUEUE_SIZE = 100;
const MAX_DETAILS_LENGTH = 4000;
const DEFAULT_FLUSH_DELAY_MS = 2000;
const IMMEDIATE_FLUSH_DELAY_MS = 32;
const LEVEL_PRIORITY: Record<RemoteLogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const defaultRemoteLogEnabled =
  import.meta.env.VITE_ENABLE_REMOTE_LOG === 'true' ||
  (import.meta.env.PROD && import.meta.env.VITE_ENABLE_REMOTE_LOG !== 'false');
const minimumRemoteLogLevel = normalizeLevel(import.meta.env.VITE_REMOTE_LOG_LEVEL) ?? 'warn';

const queue: RemoteLogEntry[] = [];
const startupDiagnostics = collectStartupDiagnostics();
let consolePatched = false;
let flushTimer: number | null = null;
let inFlight = false;
let initialized = false;
let sequence = 0;

function normalizeLevel(level?: string): RemoteLogLevel | null {
  const normalized = level?.trim().toLowerCase();
  if (
    normalized === 'debug' ||
    normalized === 'info' ||
    normalized === 'warn' ||
    normalized === 'error'
  ) {
    return normalized;
  }
  return null;
}

function collectStartupDiagnostics(): StartupDiagnosticEntry[] {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return [];
  }

  return [
    { at: Date.now(), name: 'online', value: navigator.onLine },
    { at: Date.now(), name: 'visibilityState', value: document.visibilityState },
    { at: Date.now(), name: 'readyState', value: document.readyState },
    {
      at: Date.now(),
      name: 'prefersDark',
      value:
        typeof window.matchMedia === 'function'
          ? window.matchMedia('(prefers-color-scheme: dark)').matches
          : null,
    },
  ];
}

function getStoredEnabledFlag(): boolean | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const stored = window.localStorage.getItem(REMOTE_LOG_STORAGE_KEY);
  return stored == null ? null : stored === 'true';
}

function setStoredEnabledFlag(enabled: boolean) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(REMOTE_LOG_STORAGE_KEY, enabled ? 'true' : 'false');
}

export function isRemoteLogReportingEnabled(): boolean {
  const stored = getStoredEnabledFlag();
  return stored == null ? defaultRemoteLogEnabled : stored;
}

export function enableRemoteLogReporting() {
  setStoredEnabledFlag(true);
  initializeClientLogReporting();
}

export function disableRemoteLogReporting() {
  setStoredEnabledFlag(false);
}

function getRemoteLogSessionId(): string {
  if (typeof window === 'undefined') {
    return `ssr-${Date.now()}`;
  }

  const existing = window.sessionStorage.getItem(REMOTE_LOG_SESSION_KEY);
  if (existing) {
    return existing;
  }

  const sessionId = `web-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  window.sessionStorage.setItem(REMOTE_LOG_SESSION_KEY, sessionId);
  return sessionId;
}

function resolveRemoteLogEndpoint(): string {
  const envEndpoint = import.meta.env.VITE_REMOTE_LOG_ENDPOINT?.trim();
  if (envEndpoint) {
    return envEndpoint;
  }

  return '/api/Common/clientLog';
}

function trimText(value: string, maxLength: number): string {
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

function serializeUnknown(value: unknown, depth = 0, seen = new WeakSet<object>()): unknown {
  if (depth > 4) {
    return '[MaxDepth]';
  }

  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }

  if (typeof value === 'undefined') {
    return '[undefined]';
  }

  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (typeof value === 'symbol') {
    return value.toString();
  }

  if (typeof value === 'function') {
    return `[Function ${value.name || 'anonymous'}]`;
  }

  if (value instanceof Error) {
    return {
      cause:
        'cause' in value
          ? serializeUnknown((value as Error & { cause?: unknown }).cause, depth + 1, seen)
          : undefined,
      message: value.message,
      name: value.name,
      stack: value.stack ? trimText(value.stack, 3000) : undefined,
    };
  }

  if (typeof Event !== 'undefined' && value instanceof Event) {
    const target = value.target as Partial<HTMLElement & { href?: string; src?: string }> | null;
    return {
      className: target?.className,
      href: target?.href,
      id: target?.id,
      src: target?.src,
      tagName: target?.tagName,
      type: value.type,
    };
  }

  if (typeof value === 'object') {
    const objectValue = value as Record<string, unknown>;
    if (seen.has(objectValue)) {
      return '[Circular]';
    }

    seen.add(objectValue);

    if (Array.isArray(value)) {
      const serialized = value
        .slice(0, 20)
        .map((item) => serializeUnknown(item, depth + 1, seen));
      seen.delete(objectValue);
      return serialized;
    }

    const serializedEntries = Object.entries(objectValue).slice(0, 30);
    const result: Record<string, unknown> = {};
    serializedEntries.forEach(([key, item]) => {
      result[key] = serializeUnknown(item, depth + 1, seen);
    });
    seen.delete(objectValue);
    return result;
  }

  return String(value);
}

function extractMessage(args: unknown[]): string {
  const parts = args
    .map((item) => {
      if (typeof item === 'string') {
        return item;
      }

      if (item instanceof Error) {
        return item.message;
      }

      if (item && typeof item === 'object' && 'message' in (item as Record<string, unknown>)) {
        const message = (item as Record<string, unknown>).message;
        return typeof message === 'string' ? message : '';
      }

      return '';
    })
    .filter(Boolean);

  return trimText(parts.join(' | ') || '[structured-log]', 400);
}

function buildDetails(args: unknown[]): string | undefined {
  if (args.length === 0) {
    return undefined;
  }

  try {
    return trimText(JSON.stringify(args.map((item) => serializeUnknown(item))), MAX_DETAILS_LENGTH);
  } catch (error) {
    return trimText(JSON.stringify([{ error: String(error) }]), MAX_DETAILS_LENGTH);
  }
}

function getCurrentRoute(): string | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

function shouldReportLevel(level: RemoteLogLevel): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[minimumRemoteLogLevel];
}

function scheduleFlush(delayMs: number) {
  if (typeof window === 'undefined') {
    return;
  }

  if (flushTimer !== null) {
    window.clearTimeout(flushTimer);
  }

  flushTimer = window.setTimeout(() => {
    flushTimer = null;
    void flushClientLogs('timer');
  }, delayMs);
}

function patchConsole() {
  if (consolePatched || typeof window === 'undefined') {
    return;
  }

  const originalWarn = console.warn.bind(console);
  const originalError = console.error.bind(console);

  console.warn = (...args: unknown[]) => {
    originalWarn(...args);
    enqueueRemoteLog('warn', 'console.warn', args);
  };

  console.error = (...args: unknown[]) => {
    originalError(...args);
    enqueueRemoteLog('error', 'console.error', args, true);
  };

  consolePatched = true;
}

function attachLifecycleListeners() {
  if (typeof window === 'undefined') {
    return;
  }

  window.addEventListener(
    'error',
    (event) => {
      const target = event.target as Partial<HTMLElement & { href?: string; src?: string }> | null;
      if (target && target !== window) {
        enqueueRemoteLog(
          'error',
          'window.resource-error',
          [
            {
              className: target.className,
              href: target.href,
              id: target.id,
              message: 'Resource failed to load',
              src: target.src,
              tagName: target.tagName,
            },
          ],
          true,
        );
        return;
      }

      enqueueRemoteLog(
        'error',
        'window.error',
        [
          event.message,
          event.error ?? {
            colno: event.colno,
            filename: event.filename,
            lineno: event.lineno,
          },
        ],
        true,
      );
    },
    true,
  );

  window.addEventListener('unhandledrejection', (event) => {
    enqueueRemoteLog('error', 'window.unhandledrejection', [event.reason], true);
  });

  window.addEventListener('pagehide', () => {
    void flushClientLogs('pagehide', { preferBeacon: true });
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      void flushClientLogs('visibility-hidden', { preferBeacon: true });
    }
  });
}

function exposeDebugHandle() {
  if (typeof window === 'undefined') {
    return;
  }

  window.__CLIENT_REMOTE_LOG__ = {
    disable: disableRemoteLogReporting,
    enable: enableRemoteLogReporting,
    flush: (reason?: string) => {
      void flushClientLogs(reason || 'manual');
    },
    getBufferedLogs: () => [...queue],
    getEndpoint: resolveRemoteLogEndpoint,
    isEnabled: isRemoteLogReportingEnabled,
  };
}

function resolveAuthUserId() {
  const session = getAuthSessionSnapshot();
  const userInfo = session?.userInfo as Record<string, unknown> | undefined;
  const rawUserId =
    userInfo?.id ??
    userInfo?.uid ??
    userInfo?.user_id ??
    userInfo?.userId ??
    userInfo?.member_id ??
    null;

  return typeof rawUserId === 'number' || typeof rawUserId === 'string' ? rawUserId : null;
}

function buildPayload(logs: RemoteLogEntry[], reason: string): RemoteLogPayload {
  const session = getAuthSessionSnapshot();

  return {
    app: APP_NAME,
    auth: {
      isLoggedIn: Boolean(session?.isAuthenticated),
      userId: resolveAuthUserId(),
    },
    device: {
      devicePixelRatio: window.devicePixelRatio || 1,
      language: navigator.language,
      userAgent: navigator.userAgent,
      viewportHeight: window.innerHeight,
      viewportWidth: window.innerWidth,
    },
    logs,
    page: {
      hash: window.location.hash,
      href: window.location.href,
      pathname: window.location.pathname,
      referrer: document.referrer,
      search: window.location.search,
      title: document.title,
    },
    reason,
    sentAt: Date.now(),
    sessionId: getRemoteLogSessionId(),
    source: 'web',
    startupDiagnostics,
  };
}

async function postPayload(payload: RemoteLogPayload, preferBeacon: boolean): Promise<boolean> {
  const body = JSON.stringify(payload);
  const endpoint = resolveRemoteLogEndpoint();

  if (
    preferBeacon &&
    typeof navigator !== 'undefined' &&
    typeof navigator.sendBeacon === 'function'
  ) {
    try {
      const blob = new Blob([body], { type: 'application/json' });
      if (navigator.sendBeacon(endpoint, blob)) {
        return true;
      }
    } catch {
      // Fall back to fetch.
    }
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-Client-Log': '1',
    ...getAuthHeaders(),
  };

  try {
    const response = await fetch(endpoint, {
      body,
      credentials: 'omit',
      headers,
      keepalive: preferBeacon || body.length < 60_000,
      method: 'POST',
      mode: 'cors',
    });
    return response.ok;
  } catch {
    return false;
  }
}

export function initializeClientLogReporting() {
  if (initialized || typeof window === 'undefined') {
    return;
  }

  initialized = true;
  patchConsole();
  attachLifecycleListeners();
  exposeDebugHandle();
}

export function enqueueRemoteLog(
  level: RemoteLogLevel,
  scope: string,
  args: unknown[] = [],
  flushImmediately = false,
) {
  if (!isRemoteLogReportingEnabled() || !shouldReportLevel(level)) {
    return;
  }

  initializeClientLogReporting();

  const entry: RemoteLogEntry = {
    at: Date.now(),
    details: buildDetails(args),
    id: `${Date.now()}-${sequence++}`,
    level,
    message: extractMessage(args),
    route: getCurrentRoute(),
    scope,
  };

  queue.push(entry);
  if (queue.length > MAX_QUEUE_SIZE) {
    queue.splice(0, queue.length - MAX_QUEUE_SIZE);
  }

  if (flushImmediately || level === 'error' || queue.length >= MAX_BATCH_SIZE) {
    scheduleFlush(IMMEDIATE_FLUSH_DELAY_MS);
    return;
  }

  scheduleFlush(DEFAULT_FLUSH_DELAY_MS);
}

export function reportManualClientLog(
  level: RemoteLogLevel,
  scope: string,
  ...args: unknown[]
) {
  enqueueRemoteLog(level, scope, args, level === 'error');
}

export async function flushClientLogs(
  reason = 'manual',
  options: { preferBeacon?: boolean } = {},
) {
  if (!isRemoteLogReportingEnabled() || typeof window === 'undefined') {
    return;
  }

  if (inFlight) {
    scheduleFlush(DEFAULT_FLUSH_DELAY_MS);
    return;
  }

  let logs = queue.splice(0, MAX_BATCH_SIZE);
  if (logs.length === 0 && reason === 'manual') {
    logs = [
      {
        at: Date.now(),
        id: `${Date.now()}-${sequence++}`,
        level: 'info',
        message: 'manual flush invoked',
        route: getCurrentRoute(),
        scope: 'manual.flush',
      },
    ];
  }

  if (logs.length === 0) {
    return;
  }

  inFlight = true;
  try {
    const payload = buildPayload(logs, reason);
    const sent = await postPayload(payload, Boolean(options.preferBeacon));
    if (!sent) {
      queue.unshift(...logs);
      if (queue.length > MAX_QUEUE_SIZE) {
        queue.splice(MAX_QUEUE_SIZE);
      }
    }
  } finally {
    inFlight = false;
    if (queue.length > 0) {
      scheduleFlush(DEFAULT_FLUSH_DELAY_MS);
    }
  }
}
