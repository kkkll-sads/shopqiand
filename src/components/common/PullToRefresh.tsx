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
}

const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  className = '',
  threshold = 60,
  disabled = false,
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) return;
    
    startY.current = e.touches[0].clientY;
    setIsPulling(true);
  }, [disabled, isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling || disabled || isRefreshing) return;
    
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) {
      setPullDistance(0);
      return;
    }

    currentY.current = e.touches[0].clientY;
    const distance = Math.max(0, (currentY.current - startY.current) * 0.5);
    
    if (distance > 0) {
      e.preventDefault();
      setPullDistance(Math.min(distance, threshold * 1.5));
    }
  }, [isPulling, disabled, isRefreshing, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling || disabled) return;
    
    setIsPulling(false);

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(threshold);
      
      try {
        await onRefresh();
      } catch (error) {
        errorLog('PullToRefresh', '刷新失败', error);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [isPulling, disabled, pullDistance, threshold, isRefreshing, onRefresh]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const progress = Math.min(pullDistance / threshold, 1);
  const shouldTrigger = pullDistance >= threshold;

  return (
    <div ref={containerRef} className={`relative overflow-auto ${className}`}>
      {/* 下拉指示器 */}
      <div 
        className="absolute left-0 right-0 flex items-center justify-center transition-all duration-200 overflow-hidden z-10"
        style={{ 
          height: pullDistance,
          top: 0,
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
        className="transition-transform duration-200"
        style={{ 
          transform: `translateY(${pullDistance}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;
