const CHUNK_LOAD_RECOVERY_KEY = 'shopqiand:chunk-load-recovery';
const CHUNK_LOAD_RECOVERY_QUERY_KEY = '__app_reload__';
const CHUNK_LOAD_RECOVERY_TTL_MS = 60_000;

type ChunkLoadRecoveryState = {
  href: string;
  at: number;
};

const CHUNK_LOAD_ERROR_MARKERS = [
  'failed to fetch dynamically imported module',
  'error loading dynamically imported module',
  'importing a module script failed',
  'loading chunk',
  'chunkloaderror',
  'module script failed',
];

function canUseBrowserApis() {
  return typeof window !== 'undefined' && typeof sessionStorage !== 'undefined';
}

function toCanonicalHref(rawHref: string) {
  const url = new URL(rawHref, window.location.origin);
  url.searchParams.delete(CHUNK_LOAD_RECOVERY_QUERY_KEY);
  return `${url.pathname}${url.search}${url.hash}`;
}

function readRecoveryState(): ChunkLoadRecoveryState | null {
  if (!canUseBrowserApis()) return null;

  try {
    const raw = sessionStorage.getItem(CHUNK_LOAD_RECOVERY_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<ChunkLoadRecoveryState>;
    if (typeof parsed.href !== 'string' || typeof parsed.at !== 'number') {
      sessionStorage.removeItem(CHUNK_LOAD_RECOVERY_KEY);
      return null;
    }

    if (Date.now() - parsed.at > CHUNK_LOAD_RECOVERY_TTL_MS) {
      sessionStorage.removeItem(CHUNK_LOAD_RECOVERY_KEY);
      return null;
    }

    return {
      href: parsed.href,
      at: parsed.at,
    };
  } catch {
    sessionStorage.removeItem(CHUNK_LOAD_RECOVERY_KEY);
    return null;
  }
}

function writeRecoveryState(href: string) {
  if (!canUseBrowserApis()) return;

  const payload: ChunkLoadRecoveryState = {
    href,
    at: Date.now(),
  };

  sessionStorage.setItem(CHUNK_LOAD_RECOVERY_KEY, JSON.stringify(payload));
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return [error.name, error.message].filter(Boolean).join(': ');
  }

  if (typeof error === 'string') {
    return error;
  }

  if (typeof error === 'object' && error !== null) {
    const record = error as Record<string, unknown>;

    if (typeof record.message === 'string') {
      return record.message;
    }

    if (typeof record.statusText === 'string') {
      return record.statusText;
    }

    if (typeof record.data === 'string') {
      return record.data;
    }

    if ('error' in record) {
      return getErrorMessage(record.error);
    }
  }

  return '';
}

function buildRecoveryUrl() {
  const url = new URL(window.location.href);
  url.searchParams.set(CHUNK_LOAD_RECOVERY_QUERY_KEY, `${Date.now()}`);
  return url.toString();
}

export function isChunkLoadError(error: unknown) {
  const message = getErrorMessage(error).toLowerCase();
  return CHUNK_LOAD_ERROR_MARKERS.some((marker) => message.includes(marker));
}

export function hasRecentChunkLoadRecoveryAttempt() {
  if (!canUseBrowserApis()) return false;

  const state = readRecoveryState();
  if (!state) return false;

  return state.href === toCanonicalHref(window.location.href);
}

export function tryRecoverFromChunkLoad(error: unknown) {
  if (!canUseBrowserApis() || !isChunkLoadError(error)) {
    return false;
  }

  const currentHref = toCanonicalHref(window.location.href);
  if (hasRecentChunkLoadRecoveryAttempt()) {
    return false;
  }

  writeRecoveryState(currentHref);
  window.location.replace(buildRecoveryUrl());
  return true;
}

export function clearChunkLoadRecoveryState() {
  if (!canUseBrowserApis()) return;

  sessionStorage.removeItem(CHUNK_LOAD_RECOVERY_KEY);

  const url = new URL(window.location.href);
  if (!url.searchParams.has(CHUNK_LOAD_RECOVERY_QUERY_KEY)) {
    return;
  }

  url.searchParams.delete(CHUNK_LOAD_RECOVERY_QUERY_KEY);
  window.history.replaceState(window.history.state, '', url.toString());
}

export function getChunkLoadErrorMessage(error: unknown) {
  return getErrorMessage(error);
}
