/**
 * PullToRefresh - 下拉刷新组件
 * 提供移动端下拉刷新功能
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { errorLog } from '@/utils/logger';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
  threshold?: number; // 触发刷新的下拉距离
  disabled?: boolean;
  useWindowScroll?: boolean;
}

const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  className = '',
  threshold = 60,
  disabled = false,
  useWindowScroll = true,
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const canStartPullRef = useRef(false);
  const activeScrollableAncestorRef = useRef<Element | null>(null);
  const pullDistanceRef = useRef(0);
  const isPullingRef = useRef(false);
  const rafIdRef = useRef<number | null>(null);
  const pendingPullDistanceRef = useRef(0);

  const isScrollableNode = (node: Element) => {
    const style = window.getComputedStyle(node);
    const overflowY = style.overflowY;
    const canScrollY = overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay';
    return canScrollY && node.scrollHeight > node.clientHeight;
  };

  const getScrollableAncestor = (target: EventTarget | null): Element | null => {
    if (!(target instanceof Element)) return null;

    let node: Element | null = target;
    while (node && node !== document.body) {
      if (isScrollableNode(node)) {
        return node;
      }
      node = node.parentElement;
    }
    return null;
  };

  const isInteractiveTarget = (target: EventTarget | null) => {
    if (!(target instanceof Element)) return false;
    return Boolean(target.closest('input, textarea, select, [contenteditable=\"true\"]'));
  };

  const getWindowScrollTop = () =>
    window.scrollY ||
    window.pageYOffset ||
    document.documentElement?.scrollTop ||
    document.body?.scrollTop ||
    0;

  const isAtTop = (target: EventTarget | null) => {
    if (useWindowScroll && getWindowScrollTop() > 0) {
      return false;
    }

    const container = containerRef.current;
    if (container && container.scrollTop > 0) {
      return false;
    }

    const scrollableAncestor = getScrollableAncestor(target);
    if (scrollableAncestor && scrollableAncestor.scrollTop > 0) {
      return false;
    }

    return true;
  };

  const isAtTopWithAncestor = (ancestor: Element | null) => {
    if (useWindowScroll && getWindowScrollTop() > 0) {
      return false;
    }

    const container = containerRef.current;
    if (container && container.scrollTop > 0) {
      return false;
    }

    if (ancestor && ancestor.scrollTop > 0) {
      return false;
    }

    return true;
  };

  const setPullDistanceRaf = useCallback((nextDistance: number) => {
    const clamped = Math.max(0, nextDistance);
    pullDistanceRef.current = clamped;
    pendingPullDistanceRef.current = clamped;

    if (rafIdRef.current !== null) return;

    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;
      setPullDistance((prev) => {
        const next = pendingPullDistanceRef.current;
        return prev === next ? prev : next;
      });
    });
  }, []);

  const setPullingState = useCallback((next: boolean) => {
    if (isPullingRef.current === next) return;
    isPullingRef.current = next;
    setIsPulling(next);
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    canStartPullRef.current = false;
    activeScrollableAncestorRef.current = null;
    if (disabled || isRefreshing || e.touches.length !== 1) return;
    if (isInteractiveTarget(e.target)) return;
    if (!isAtTop(e.target)) return;

    activeScrollableAncestorRef.current = getScrollableAncestor(e.target);
    startY.current = e.touches[0].clientY;
    currentY.current = startY.current;
    canStartPullRef.current = true;
    setPullingState(false);
  }, [disabled, isRefreshing, useWindowScroll]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (disabled || isRefreshing || e.touches.length !== 1) return;
    if (!canStartPullRef.current) return;
    if (!isAtTopWithAncestor(activeScrollableAncestorRef.current)) {
      setPullingState(false);
      setPullDistanceRaf(0);
      return;
    }

    currentY.current = e.touches[0].clientY;
    const deltaY = currentY.current - startY.current;
    const distance = Math.max(0, deltaY * 0.5);

    if (distance > 0) {
      // 浏览器已进入滚动过程时，touchmove 可能不可取消，避免触发 Intervention 警告
      if (!e.cancelable) {
        return;
      }
      setPullingState(true);
      e.preventDefault();
      setPullDistanceRaf(Math.min(distance, threshold * 1.5));
      return;
    }

    setPullingState(false);
    setPullDistanceRaf(0);
  }, [disabled, isRefreshing, threshold, setPullDistanceRaf, setPullingState, useWindowScroll]);

  const handleTouchEnd = useCallback(async () => {
    const canStartPull = canStartPullRef.current;
    canStartPullRef.current = false;
    activeScrollableAncestorRef.current = null;

    if (!canStartPull || disabled) return;

    setPullingState(false);

    if (pullDistanceRef.current >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistanceRaf(threshold);

      try {
        await onRefresh();
      } catch (error) {
        errorLog('PullToRefresh', '刷新失败', error);
      } finally {
        setIsRefreshing(false);
        setPullDistanceRaf(0);
      }
    } else {
      setPullDistanceRaf(0);
    }
  }, [disabled, threshold, isRefreshing, onRefresh, setPullDistanceRaf, setPullingState]);

  const handleTouchCancel = useCallback(() => {
    canStartPullRef.current = false;
    activeScrollableAncestorRef.current = null;
    setPullingState(false);
    setPullDistanceRaf(0);
  }, [setPullDistanceRaf, setPullingState]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('touchcancel', handleTouchCancel);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel]);

  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  const progress = Math.min(pullDistance / threshold, 1);
  const shouldTrigger = pullDistance >= threshold;
  const shouldOffsetContent = pullDistance > 0 || isPulling || isRefreshing;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* 下拉指示器 */}
      <div 
        className="absolute left-0 right-0 flex items-center justify-center overflow-hidden z-10"
        style={{ 
          height: pullDistance,
          top: 0,
          transition: isPulling && !isRefreshing ? 'none' : 'height 200ms ease',
        }}
      >
        <div 
          className={`flex items-center gap-2 text-sm transition-all duration-200 ${
            shouldTrigger || isRefreshing ? 'text-red-500' : 'text-gray-400'
          }`}
        >
          <RefreshCw 
            size={18} 
            className={`transition-transform duration-200 ${
              isRefreshing ? 'animate-spin' : ''
            }`}
            style={{ 
              transform: isRefreshing ? undefined : `rotate(${progress * 180}deg)`,
            }}
          />
          <span className="text-xs font-medium">
            {isRefreshing 
              ? '刷新中...' 
              : shouldTrigger 
                ? '释放刷新' 
                : '下拉刷新'
            }
          </span>
        </div>
      </div>
      
      {/* 内容区域 */}
      <div 
        className={shouldOffsetContent ? 'will-change-transform' : ''}
        style={{ 
          transform: shouldOffsetContent ? `translateY(${pullDistance}px)` : undefined,
          transition: isPulling && !isRefreshing ? 'none' : 'transform 200ms ease',
          touchAction: 'pan-x pan-y',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;
