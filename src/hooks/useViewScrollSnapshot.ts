import { useEffect, useRef, type RefObject } from 'react';

interface UseViewScrollSnapshotOptions {
  active: boolean;
  containerRef: RefObject<HTMLElement | null>;
  enabled?: boolean;
  resetOnDeactivate?: boolean;
}

export function useViewScrollSnapshot({
  active,
  containerRef,
  enabled = true,
  resetOnDeactivate = true,
}: UseViewScrollSnapshotOptions) {
  const previousActiveRef = useRef(active);
  const snapshotRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      previousActiveRef.current = active;
      return;
    }

    const container = containerRef.current;
    const wasActive = previousActiveRef.current;

    if (wasActive && !active && container) {
      snapshotRef.current = container.scrollTop;

      if (resetOnDeactivate) {
        container.scrollTop = 0;
      }
    }

    if (!wasActive && active) {
      const frameId = window.requestAnimationFrame(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = snapshotRef.current;
        }
      });

      previousActiveRef.current = active;
      return () => {
        window.cancelAnimationFrame(frameId);
      };
    }

    previousActiveRef.current = active;
  }, [active, containerRef, enabled, resetOnDeactivate]);
}
