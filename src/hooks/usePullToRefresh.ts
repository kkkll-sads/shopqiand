/**
 * @file 下拉刷新 Hook
 * @description 处理触摸手势交互：下拉拉伸 → 松手刷新 → 自动收回。
 *              仅在滚动容器 scrollTop === 0 时响应。
 */

import { type RefObject, useCallback, useEffect, useRef, useState } from 'react';

/** 触发刷新的最小下拉距离（px） */
const TRIGGER_THRESHOLD = 60;
/** 最大下拉距离（px） */
const MAX_PULL_DISTANCE = 120;
/** 阻尼系数，降低手指移动速度感 */
const DAMPING = 0.4;

interface UsePullToRefreshOptions {
  /** 滚动容器的 ref */
  containerRef: RefObject<HTMLElement | null>;
  /** 是否禁用下拉刷新 */
  disabled?: boolean;
  /** 刷新回调，返回 Promise */
  onRefresh: () => Promise<unknown>;
}

interface PullToRefreshState {
  /** 当前下拉距离 */
  pullDistance: number;
  /** 是否正在下拉 */
  pulling: boolean;
  /** 是否正在刷新 */
  refreshing: boolean;
}

export function usePullToRefresh({
  containerRef,
  disabled = false,
  onRefresh,
}: UsePullToRefreshOptions): PullToRefreshState {
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  const startYRef = useRef(0);
  const isPullingRef = useRef(false);
  const isRefreshingRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  const handleTouchStart = useCallback(
    (event: TouchEvent) => {
      if (disabled || isRefreshingRef.current) return;

      const container = containerRef.current;
      if (!container || container.scrollTop > 0) return;

      startYRef.current = event.touches[0].clientY;
      isPullingRef.current = false;
    },
    [containerRef, disabled],
  );

  const handleTouchMove = useCallback(
    (event: TouchEvent) => {
      if (disabled || isRefreshingRef.current) return;

      const container = containerRef.current;
      if (!container) return;

      if (container.scrollTop > 0) {
        if (isPullingRef.current) {
          isPullingRef.current = false;
          setPulling(false);
          setPullDistance(0);
        }
        return;
      }

      const deltaY = event.touches[0].clientY - startYRef.current;
      if (deltaY <= 0) {
        if (isPullingRef.current) {
          isPullingRef.current = false;
          setPulling(false);
          setPullDistance(0);
        }
        return;
      }

      const dampedDistance = Math.min(deltaY * DAMPING, MAX_PULL_DISTANCE);

      if (!isPullingRef.current) {
        isPullingRef.current = true;
        setPulling(true);
      }

      setPullDistance(dampedDistance);

      if (dampedDistance > 0) {
        event.preventDefault();
      }
    },
    [containerRef, disabled],
  );

  const handleTouchEnd = useCallback(async () => {
    if (!isPullingRef.current || isRefreshingRef.current) return;

    isPullingRef.current = false;

    if (pullDistance >= TRIGGER_THRESHOLD) {
      isRefreshingRef.current = true;
      setRefreshing(true);
      setPullDistance(TRIGGER_THRESHOLD);

      try {
        await onRefreshRef.current();
      } catch {
        /* 刷新失败静默处理 */
      } finally {
        isRefreshingRef.current = false;
        setRefreshing(false);
        setPulling(false);
        setPullDistance(0);
      }
    } else {
      setPulling(false);
      setPullDistance(0);
    }
  }, [pullDistance]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || disabled) return undefined;

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [containerRef, disabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { pullDistance, pulling, refreshing };
}
