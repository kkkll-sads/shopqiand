import { useEffect, useRef, type RefObject } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

interface UseRouteScrollRestorationOptions {
  containerRef: RefObject<HTMLElement | null>;
  enabled?: boolean;
  maxRestoreAttempts?: number;
  namespace?: string;
  restoreDeps?: readonly unknown[];
  restoreWhen?: boolean;
}

const RETRY_INTERVAL = 60;
const MAX_WAIT_MS = 800;

export function useRouteScrollRestoration({
  containerRef,
  enabled = true,
  maxRestoreAttempts = 12,
  namespace = 'route-scroll',
  restoreDeps = [],
  restoreWhen = true,
}: UseRouteScrollRestorationOptions) {
  const location = useLocation();
  const navigationType = useNavigationType();
  const hasRestoredRef = useRef(false);
  const lastKnownScrollTopRef = useRef(0);
  const storageKey = `${namespace}:${location.pathname}:${location.key}`;

  useEffect(() => {
    hasRestoredRef.current = false;
    lastKnownScrollTopRef.current = 0;
  }, [location.key]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const container = containerRef.current;
    if (!container) {
      return;
    }

    const updateScrollTop = () => {
      lastKnownScrollTopRef.current = container.scrollTop;
    };

    updateScrollTop();
    container.addEventListener('scroll', updateScrollTop, { passive: true });

    return () => {
      container.removeEventListener('scroll', updateScrollTop);
    };
  }, [containerRef, enabled]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    return () => {
      const container = containerRef.current;
      if (!container) {
        if (lastKnownScrollTopRef.current > 0) {
          sessionStorage.setItem(storageKey, String(lastKnownScrollTopRef.current));
        }
        return;
      }

      sessionStorage.setItem(storageKey, String(lastKnownScrollTopRef.current || container.scrollTop));
    };
  }, [containerRef, enabled, storageKey]);

  useEffect(() => {
    if (!enabled || !restoreWhen || navigationType !== 'POP' || hasRestoredRef.current) {
      return;
    }

    const container = containerRef.current;
    if (!container) {
      return;
    }

    const rawScrollTop = sessionStorage.getItem(storageKey);
    if (!rawScrollTop) {
      hasRestoredRef.current = true;
      return;
    }

    const targetScrollTop = Number(rawScrollTop);
    if (!Number.isFinite(targetScrollTop) || targetScrollTop <= 0) {
      hasRestoredRef.current = true;
      return;
    }

    if (Math.abs(container.scrollTop - targetScrollTop) < 2) {
      hasRestoredRef.current = true;
      return;
    }

    container.style.visibility = 'hidden';
    const startTime = Date.now();
    let attempt = 0;
    let timerId = 0;

    const finish = () => {
      container.style.visibility = '';
      hasRestoredRef.current = true;
    };

    const restore = () => {
      const el = containerRef.current;
      if (!el) {
        finish();
        return;
      }

      const maxScrollTop = Math.max(0, el.scrollHeight - el.clientHeight);
      const nextScrollTop = Math.min(targetScrollTop, maxScrollTop);

      el.scrollTop = nextScrollTop;
      lastKnownScrollTopRef.current = nextScrollTop;

      const elapsed = Date.now() - startTime;
      if (maxScrollTop >= targetScrollTop || attempt >= maxRestoreAttempts || elapsed >= MAX_WAIT_MS) {
        finish();
        return;
      }

      attempt += 1;
      timerId = window.setTimeout(restore, RETRY_INTERVAL);
    };

    timerId = window.setTimeout(restore, 0);

    return () => {
      window.clearTimeout(timerId);
      if (!hasRestoredRef.current) {
        container.style.visibility = '';
      }
    };
  }, [
    containerRef,
    enabled,
    maxRestoreAttempts,
    navigationType,
    restoreWhen,
    storageKey,
    ...restoreDeps,
  ]);
}
