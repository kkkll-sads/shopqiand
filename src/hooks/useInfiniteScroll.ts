import { useEffect, type RefObject } from 'react';

interface UseInfiniteScrollOptions {
  disabled?: boolean;
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void | Promise<void>;
  rootMargin?: string;
  rootRef?: RefObject<Element | null>;
  targetRef: RefObject<Element | null>;
  threshold?: number;
}

export function useInfiniteScroll({
  disabled = false,
  hasMore,
  loading,
  onLoadMore,
  rootMargin = '160px 0px',
  rootRef,
  targetRef,
  threshold = 0,
}: UseInfiniteScrollOptions) {
  useEffect(() => {
    if (disabled || loading || !hasMore) {
      return;
    }

    const target = targetRef.current;
    if (!target) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void onLoadMore();
        }
      },
      {
        root: rootRef?.current ?? null,
        rootMargin,
        threshold,
      },
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [disabled, hasMore, loading, onLoadMore, rootMargin, rootRef, targetRef, threshold]);
}
