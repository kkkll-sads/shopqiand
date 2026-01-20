import { useEffect, useRef, useCallback } from 'react';

/**
 * useInfiniteScroll - A hook to trigger a callback when an element enters the viewport
 * @param callback The function to call when the sentinel element intersects
 * @param hasMore Whether there is more data to load. If false, the observer will disconnect or not trigger.
 * @param isLoading Whether data is currently loading. If true, preventing multiple triggers.
 * @param options IntersectionObserver options (root, rootMargin, threshold)
 */
export function useInfiniteScroll(
    callback: () => void,
    hasMore: boolean,
    isLoading: boolean,
    options: IntersectionObserverInit = { root: null, rootMargin: '20px', threshold: 1.0 }
) {
    const observer = useRef<IntersectionObserver | null>(null);

    const lastElementRef = useCallback(
        (node: HTMLElement | null) => {
            if (isLoading) return;

            if (observer.current) {
                observer.current.disconnect();
            }

            observer.current = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting && hasMore) {
                    callback();
                }
            }, options);

            if (node) {
                observer.current.observe(node);
            }
        },
        [isLoading, hasMore, callback, options.root, options.rootMargin, options.threshold]
    );

    return lastElementRef;
}
