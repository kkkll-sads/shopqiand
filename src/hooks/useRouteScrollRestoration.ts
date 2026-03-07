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

    let attempt = 0;
    let frameId = 0;

    const restore = () => {
      const currentContainer = containerRef.current;
      if (!currentContainer) {
        return;
      }

      const maxScrollTop = Math.max(0, currentContainer.scrollHeight - currentContainer.clientHeight);
      const nextScrollTop = Math.min(targetScrollTop, maxScrollTop);

      currentContainer.scrollTop = nextScrollTop;
      lastKnownScrollTopRef.current = nextScrollTop;

      if (maxScrollTop >= targetScrollTop || attempt >= maxRestoreAttempts) {
        hasRestoredRef.current = true;
        return;
      }

      attempt += 1;
      frameId = window.requestAnimationFrame(restore);
    };

    frameId = window.requestAnimationFrame(restore);

    return () => {
      window.cancelAnimationFrame(frameId);
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
