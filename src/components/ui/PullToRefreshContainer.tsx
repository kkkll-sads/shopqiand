/**
 * @file 下拉刷新容器组件
 * @description 包裹可滚动内容区域，提供下拉刷新 UI。
 *              通过检测子元素的 scrollTop 判断是否在顶部，
 *              仅在滚动到顶部且明确下拉时拦截触摸事件。
 */

import { type PropsWithChildren, useCallback, useEffect, useRef, useState } from 'react';

/** 触发刷新的最小下拉距离（px） */
const TRIGGER_THRESHOLD = 80;
/** 最大下拉距离（px） */
const MAX_PULL_DISTANCE = 120;
/** 阻尼系数 */
const DAMPING = 0.4;
/** 进入下拉模式的最小移动距离（px），防止与正常滚动冲突 */
const START_THRESHOLD = 10;

interface PullToRefreshContainerProps {
  /** 自定义 className */
  className?: string;
  /** 是否禁用下拉刷新 */
  disabled?: boolean;
  /** 刷新回调，需返回 Promise */
  onRefresh: () => Promise<unknown>;
}

export const PullToRefreshContainer = ({
  children,
  className = '',
  disabled = false,
  onRefresh,
}: PropsWithChildren<PullToRefreshContainerProps>) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  
  // 用于保存 SVG 各个部分的 DOM，避免重新渲染
  const treeRefs = useRef({
    trunk: null as SVGPathElement | null,
    branchL: null as SVGPathElement | null,
    branchR: null as SVGPathElement | null,
    leafTop: null as SVGCircleElement | null,
    leafLT: null as SVGCircleElement | null,
    leafR: null as SVGCircleElement | null,
    leafRB: null as SVGCircleElement | null,
    leafB1: null as SVGCircleElement | null,
    leafB2: null as SVGCircleElement | null,
  });

  const [refreshing, setRefreshing] = useState(false);

  const startYRef = useRef(0);
  /** 'idle' → 'pending' → 'pulling' | 'scrolling' */
  const gestureRef = useRef<'idle' | 'pending' | 'pulling' | 'scrolling'>('idle');
  const isRefreshingRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);
  const pullDistanceRef = useRef(0);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  /** 查找第一个可滚动的子元素 */
  const findScrollable = useCallback((): HTMLElement | null => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return null;
    return wrapper.querySelector<HTMLElement>('[class*="overflow-y"]');
  }, []);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper || disabled) return undefined;

    const handleTouchStart = (event: TouchEvent) => {
      if (isRefreshingRef.current) return;

      startYRef.current = event.touches[0].clientY;
      gestureRef.current = 'pending';
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (isRefreshingRef.current) return;

      // 已决定为普通滚动，不干预
      if (gestureRef.current === 'scrolling') return;

      const deltaY = event.touches[0].clientY - startYRef.current;

      // 待决定阶段：根据方向和 scrollTop 决定是下拉刷新还是正常滚动
      if (gestureRef.current === 'pending') {
        // 向上移动（滚动内容向下）→ 正常滚动
        if (deltaY <= 0) {
          gestureRef.current = 'scrolling';
          return;
        }

        // 向下移动但滚动容器不在顶部 → 正常滚动
        const scrollable = findScrollable();
        if (scrollable && scrollable.scrollTop > 0) {
          gestureRef.current = 'scrolling';
          return;
        }

        // 向下移动量太小，还不确定 → 保持 pending 但不干预
        if (deltaY < START_THRESHOLD) {
          return;
        }

        // 确认进入下拉模式
        gestureRef.current = 'pulling';
      }

      // 下拉模式
      if (gestureRef.current === 'pulling') {
        const deltaFromStart = event.touches[0].clientY - startYRef.current;
        const dampedDistance = Math.min(Math.max(deltaFromStart * DAMPING, 0), MAX_PULL_DISTANCE);

        pullDistanceRef.current = dampedDistance;

        // 使用 requestAnimationFrame 直接更新 DOM，避免 React 重绘引起掉帧
        requestAnimationFrame(() => updateDOM(dampedDistance, false));

        // 阻止页面默认滚动和浏览器原生下拉刷新
        event.preventDefault();
      }
    };

    const handleTouchEnd = async () => {
      if (gestureRef.current !== 'pulling' || isRefreshingRef.current) {
        gestureRef.current = 'idle';
        return;
      }

      gestureRef.current = 'idle';
      const currentDistance = pullDistanceRef.current;

      if (currentDistance >= TRIGGER_THRESHOLD) {
        isRefreshingRef.current = true;
        setRefreshing(true);
        requestAnimationFrame(() => updateDOM(TRIGGER_THRESHOLD, true));

        try {
          await onRefreshRef.current();
        } catch {
          /* 静默处理 */
        } finally {
          isRefreshingRef.current = false;
          setRefreshing(false);
          pullDistanceRef.current = 0;
          requestAnimationFrame(() => updateDOM(0, true));
        }
      } else {
        pullDistanceRef.current = 0;
        requestAnimationFrame(() => updateDOM(0, true));
      }
    };

    wrapper.addEventListener('touchstart', handleTouchStart, { passive: true });
    wrapper.addEventListener('touchmove', handleTouchMove, { passive: false });
    wrapper.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      wrapper.removeEventListener('touchstart', handleTouchStart);
      wrapper.removeEventListener('touchmove', handleTouchMove);
      wrapper.removeEventListener('touchend', handleTouchEnd);
    };
  }, [disabled, findScrollable]);

  /** 直接操作 DOM 更新动画帧 */
  const updateDOM = useCallback((distance: number, isAnimated: boolean) => {
    // 1. 更新主容器位置
    if (contentRef.current) {
      contentRef.current.style.transform = distance > 0 ? `translateY(${distance}px)` : '';
      contentRef.current.style.transition = isAnimated ? 'transform 0.3s ease-out' : 'none';
    }

    // 2. 更新指示器容器
    if (indicatorRef.current) {
      indicatorRef.current.style.height = `${Math.max(distance, TRIGGER_THRESHOLD)}px`;
      // 当 distance 为 0 且不是刷新状态时隐藏
      indicatorRef.current.style.display = (distance > 0 || isRefreshingRef.current) ? 'flex' : 'none';
    }

    // 3. 计算并更新 SVG 树的生长进度
    const pullProgress = Math.min(Math.max(distance / TRIGGER_THRESHOLD, 0), 1);
    const trunkProgress = Math.min(pullProgress / 0.3, 1);
    const branchProgress = Math.max(0, Math.min((pullProgress - 0.3) / 0.4, 1));
    const leafProgress = Math.max(0, (pullProgress - 0.7) / 0.3);

    const refs = treeRefs.current;
    if (refs.trunk) refs.trunk.style.strokeDashoffset = `${60 * (1 - trunkProgress)}`;
    if (refs.branchL) refs.branchL.style.strokeDashoffset = `${40 * (1 - branchProgress)}`;
    if (refs.branchR) refs.branchR.style.strokeDashoffset = `${40 * (1 - branchProgress)}`;

    // 更新树叶的 scale 和 opacity
    const updateLeaf = (el: SVGCircleElement | null, scale: number, opacityFactor: number) => {
      if (!el) return;
      el.style.transform = `scale(${scale})`;
      el.style.opacity = `${scale * opacityFactor}`;
    };

    updateLeaf(refs.leafTop, leafProgress, 0.9);
    updateLeaf(refs.leafLT, leafProgress, 0.85);
    updateLeaf(refs.leafR, leafProgress, 0.95);
    updateLeaf(refs.leafRB, leafProgress, 0.9);
    updateLeaf(refs.leafB1, leafProgress, 0.8);
    updateLeaf(refs.leafB2, leafProgress, 0.8);
  }, []);

  return (
    <div ref={wrapperRef} className={`relative flex min-h-0 flex-1 flex-col overflow-hidden ${className}`}>
      {/* 刷新指示器 */}
      <div
        ref={indicatorRef}
        className="absolute left-0 right-0 z-30 flex items-end justify-center pointer-events-none"
        style={{ display: 'none', paddingBottom: '16px' }}
      >
        <div className="relative w-12 h-12 flex items-center justify-center">
          <svg 
            viewBox="0 0 100 100" 
            className={`w-full h-full ${refreshing ? 'tree-sway' : ''}`}
          >
            {/* 树干 */}
            <path 
              ref={(el) => { treeRefs.current.trunk = el; }}
              d="M50 95 C50 70, 50 60, 50 40" 
              fill="none" stroke="#8b5a2b" strokeWidth="6" strokeLinecap="round"
              strokeDasharray="60" style={{ strokeDashoffset: '60' }}
            />
            {/* 左枝 */}
            <path 
              ref={(el) => { treeRefs.current.branchL = el; }}
              d="M50 75 Q35 60, 25 50" 
              fill="none" stroke="#8b5a2b" strokeWidth="4" strokeLinecap="round"
              strokeDasharray="40" style={{ strokeDashoffset: '40' }}
            />
            {/* 右枝 */}
            <path 
              ref={(el) => { treeRefs.current.branchR = el; }}
              d="M50 65 Q65 50, 75 40" 
              fill="none" stroke="#8b5a2b" strokeWidth="4" strokeLinecap="round"
              strokeDasharray="40" style={{ strokeDashoffset: '40' }}
            />
            {/* 树叶 */}
            <circle ref={(el) => { treeRefs.current.leafTop = el; }} cx="50" cy="35" r="20" fill="#4caf50" className={refreshing ? 'leaf-pulse' : ''} style={{ transform: 'scale(0)', transformOrigin: '50% 35%', opacity: 0 }} />
            <circle ref={(el) => { treeRefs.current.leafLT = el; }} cx="30" cy="45" r="16" fill="#388e3c" className={refreshing ? 'leaf-pulse-delay' : ''} style={{ transform: 'scale(0)', transformOrigin: '30% 45%', opacity: 0 }} />
            <circle ref={(el) => { treeRefs.current.leafR = el; }} cx="70" cy="35" r="15" fill="#66bb6a" className={refreshing ? 'leaf-pulse' : ''} style={{ transform: 'scale(0)', transformOrigin: '70% 35%', opacity: 0 }} />
            <circle ref={(el) => { treeRefs.current.leafRB = el; }} cx="65" cy="50" r="14" fill="#43a047" className={refreshing ? 'leaf-pulse-delay' : ''} style={{ transform: 'scale(0)', transformOrigin: '65% 50%', opacity: 0 }} />
            {/* 小树叶 */}
            <circle ref={(el) => { treeRefs.current.leafB1 = el; }} cx="20" cy="55" r="10" fill="#81c784" style={{ transform: 'scale(0)', transformOrigin: '20% 55%', opacity: 0 }} />
            <circle ref={(el) => { treeRefs.current.leafB2 = el; }} cx="80" cy="45" r="8" fill="#a5d6a7" style={{ transform: 'scale(0)', transformOrigin: '80% 45%', opacity: 0 }} />
          </svg>
        </div>
      </div>
      
      {/* 内容区域 — 不添加额外的 overflow，由子元素自行处理滚动 */}
      <div ref={contentRef} className="flex min-h-0 flex-1 flex-col">
        {children}
      </div>
    </div>
  );
};
