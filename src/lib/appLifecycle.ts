import { useSyncExternalStore } from 'react';

export type AppLifecycleStatus = 'active' | 'inactive' | 'background';

export interface AppLifecycleSnapshot {
  appState: AppLifecycleStatus;
  hasFocus: boolean;
  isOffline: boolean;
  isOnline: boolean;
  isVisible: boolean;
  lastBecameActiveAt: number | null;
  lastBecameHiddenAt: number | null;
  lastUpdatedAt: number;
  lastWentOfflineAt: number | null;
  lastWentOnlineAt: number | null;
  visibilityState: DocumentVisibilityState;
}

type Listener = () => void;

const listeners = new Set<Listener>();

let stopObserver: (() => void) | null = null;

function canUseDOM() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function getVisibilityState(): DocumentVisibilityState {
  if (!canUseDOM()) {
    return 'hidden';
  }

  return document.visibilityState;
}

function getHasFocus() {
  if (!canUseDOM()) {
    return false;
  }

  return document.hasFocus();
}

function getIsOnline() {
  if (typeof navigator === 'undefined') {
    return true;
  }

  return navigator.onLine;
}

function resolveAppState(visibilityState: DocumentVisibilityState, hasFocus: boolean): AppLifecycleStatus {
  if (visibilityState === 'hidden') {
    return 'background';
  }

  return hasFocus ? 'active' : 'inactive';
}

function createInitialSnapshot(): AppLifecycleSnapshot {
  const now = Date.now();
  const visibilityState = getVisibilityState();
  const hasFocus = getHasFocus();
  const isOnline = getIsOnline();
  const appState = resolveAppState(visibilityState, hasFocus);

  return {
    appState,
    hasFocus,
    isOffline: !isOnline,
    isOnline,
    isVisible: visibilityState === 'visible',
    lastBecameActiveAt: appState === 'active' ? now : null,
    lastBecameHiddenAt: visibilityState === 'hidden' ? now : null,
    lastUpdatedAt: now,
    lastWentOfflineAt: isOnline ? null : now,
    lastWentOnlineAt: isOnline ? now : null,
    visibilityState,
  };
}

let snapshot = createInitialSnapshot();

function hasMeaningfulChange(nextSnapshot: AppLifecycleSnapshot) {
  return (
    snapshot.appState !== nextSnapshot.appState ||
    snapshot.hasFocus !== nextSnapshot.hasFocus ||
    snapshot.isOnline !== nextSnapshot.isOnline ||
    snapshot.visibilityState !== nextSnapshot.visibilityState
  );
}

function computeNextSnapshot(): AppLifecycleSnapshot {
  const now = Date.now();
  const visibilityState = getVisibilityState();
  const hasFocus = getHasFocus();
  const isOnline = getIsOnline();
  const appState = resolveAppState(visibilityState, hasFocus);

  return {
    appState,
    hasFocus,
    isOffline: !isOnline,
    isOnline,
    isVisible: visibilityState === 'visible',
    lastBecameActiveAt:
      appState === 'active' && snapshot.appState !== 'active'
        ? now
        : snapshot.lastBecameActiveAt,
    lastBecameHiddenAt:
      visibilityState === 'hidden' && snapshot.visibilityState !== 'hidden'
        ? now
        : snapshot.lastBecameHiddenAt,
    lastUpdatedAt: now,
    lastWentOfflineAt:
      !isOnline && snapshot.isOnline
        ? now
        : snapshot.lastWentOfflineAt,
    lastWentOnlineAt:
      isOnline && snapshot.isOffline
        ? now
        : snapshot.lastWentOnlineAt,
    visibilityState,
  };
}

function notifyListeners() {
  listeners.forEach((listener) => {
    listener();
  });
}

function refreshSnapshot() {
  const nextSnapshot = computeNextSnapshot();

  if (!hasMeaningfulChange(nextSnapshot)) {
    return snapshot;
  }

  snapshot = nextSnapshot;
  notifyListeners();
  return snapshot;
}

function attachObserver() {
  if (!canUseDOM() || stopObserver) {
    return;
  }

  const handleChange = () => {
    refreshSnapshot();
  };

  window.addEventListener('focus', handleChange);
  window.addEventListener('blur', handleChange);
  window.addEventListener('online', handleChange);
  window.addEventListener('offline', handleChange);
  window.addEventListener('pageshow', handleChange);
  window.addEventListener('pagehide', handleChange);
  document.addEventListener('visibilitychange', handleChange);

  stopObserver = () => {
    window.removeEventListener('focus', handleChange);
    window.removeEventListener('blur', handleChange);
    window.removeEventListener('online', handleChange);
    window.removeEventListener('offline', handleChange);
    window.removeEventListener('pageshow', handleChange);
    window.removeEventListener('pagehide', handleChange);
    document.removeEventListener('visibilitychange', handleChange);
    stopObserver = null;
  };
}

export function startAppLifecycleObserver() {
  attachObserver();
}

export function refreshAppLifecycleSnapshot() {
  return refreshSnapshot();
}

export function getAppLifecycleSnapshot() {
  attachObserver();
  return snapshot;
}

export function subscribeAppLifecycleChange(listener: Listener) {
  attachObserver();
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function useAppLifecycle() {
  return useSyncExternalStore(
    subscribeAppLifecycleChange,
    getAppLifecycleSnapshot,
    getAppLifecycleSnapshot,
  );
}
