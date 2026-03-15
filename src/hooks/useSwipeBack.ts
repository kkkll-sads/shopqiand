import { type RefObject, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

/** 左侧触发区宽度 — 设为屏幕左 56px，避开安卓系统手势区（~24px） */
const EDGE_WIDTH = 56;
const TRIGGER_THRESHOLD = 80;
const MAX_TRANSLATE = 300;
const DIRECTION_LOCK_DISTANCE = 8;
const DAMPING = 0.55;

interface UseSwipeBackOptions {
  /** 监听触摸事件的容器 */
  containerRef: RefObject<HTMLElement | null>;
  /** 需要平移的内容元素 */
  contentRef: RefObject<HTMLElement | null>;
  /** 左侧阴影指示元素 */
  shadowRef: RefObject<HTMLElement | null>;
  /** 左侧返回箭头提示元素 */
  arrowRef: RefObject<HTMLElement | null>;
  disabled?: boolean;
}

/**
 * 左边缘滑动返回手势。
 * 全程通过直接 DOM 操作驱动动画，不触发 React re-render，保证 60fps。
 */
export function useSwipeBack({
  containerRef,
  contentRef,
  shadowRef,
  arrowRef,
  disabled = false,
}: UseSwipeBackOptions) {
  const navigate = useNavigate();

  const stateRef = useRef({
    startX: 0,
    startY: 0,
    currentX: 0,
    tracking: false,
    locked: false,
    isHorizontal: false,
    activated: false,
  });

  const canGoBack = useCallback(() => {
    const hs = window.history.state as { idx?: number } | null;
    if (typeof hs?.idx === 'number') return hs.idx > 0;
    return window.history.length > 1;
  }, []);

  const applyTransform = useCallback((px: number, animate: boolean) => {
    const content = contentRef.current;
    const shadow = shadowRef.current;
    const arrow = arrowRef.current;
    if (content) {
      content.style.transition = animate ? 'transform .25s ease-out' : 'none';
      content.style.transform = px > 0 ? `translateX(${px}px)` : '';
    }
    if (shadow) {
      shadow.style.transition = animate ? 'opacity .25s ease-out, transform .25s ease-out' : 'none';
      shadow.style.opacity = px > 0 ? String(Math.min(px / 200, 0.5)) : '0';
      shadow.style.transform = px > 0 ? `translateX(${px}px)` : '';
    }
    if (arrow) {
      arrow.style.transition = animate ? 'opacity .25s ease-out' : 'none';
      arrow.style.opacity = px > 0 ? String(Math.min(px / 60, 1)) : '0';
    }
  }, [contentRef, shadowRef, arrowRef]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || disabled) return;

    const onMove = (e: TouchEvent) => {
      const s = stateRef.current;
      if (!s.tracking) return;

      const t = e.touches[0];
      const dx = t.clientX - s.startX;
      const dy = t.clientY - s.startY;

      if (!s.locked) {
        if (Math.abs(dx) < DIRECTION_LOCK_DISTANCE && Math.abs(dy) < DIRECTION_LOCK_DISTANCE) return;
        s.locked = true;
        s.isHorizontal = Math.abs(dx) > Math.abs(dy);
        if (!s.isHorizontal || dx < 0) {
          s.tracking = false;
          return;
        }
        s.activated = true;
      }

      if (!s.isHorizontal) return;
      e.preventDefault();

      const dampedX = Math.max(0, Math.min(dx * DAMPING, MAX_TRANSLATE));
      s.currentX = dampedX;
      applyTransform(dampedX, false);
    };

    const detachMove = () => {
      el.removeEventListener('touchmove', onMove);
    };

    const onStart = (e: TouchEvent) => {
      if (!canGoBack()) return;
      const t = e.touches[0];
      if (t.clientX > EDGE_WIDTH) return;

      const s = stateRef.current;
      s.startX = t.clientX;
      s.startY = t.clientY;
      s.currentX = 0;
      s.tracking = true;
      s.locked = false;
      s.isHorizontal = false;
      s.activated = false;

      const content = contentRef.current;
      if (content) content.style.willChange = 'transform';

      el.addEventListener('touchmove', onMove, { passive: false });
    };

    const onEnd = () => {
      detachMove();

      const s = stateRef.current;
      const wasActivated = s.activated;
      const finalX = s.currentX;

      s.tracking = false;
      s.locked = false;
      s.isHorizontal = false;
      s.activated = false;
      s.currentX = 0;

      const content = contentRef.current;
      if (content) content.style.willChange = '';

      if (!wasActivated) return;

      if (finalX >= TRIGGER_THRESHOLD) {
        applyTransform(MAX_TRANSLATE, true);
        setTimeout(() => {
          applyTransform(0, false);
          navigate(-1);
        }, 200);
      } else {
        applyTransform(0, true);
      }
    };

    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchend', onEnd, { passive: true });
    el.addEventListener('touchcancel', onEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onStart);
      detachMove();
      el.removeEventListener('touchend', onEnd);
      el.removeEventListener('touchcancel', onEnd);
    };
  }, [containerRef, contentRef, shadowRef, arrowRef, disabled, canGoBack, navigate, applyTransform]);
}
