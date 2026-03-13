/**
 * @file iOS 风格滚轮选择器（Drum Picker）
 * @description 类似苹果闹钟的滚动选择器，支持惯性滚动、回弹吸附、3D 透视效果。
 *   可用于分区选择、时间选择等场景。
 */

import React, { useRef, useEffect, useCallback, useState } from 'react';

export interface WheelPickerItem {
  /** 唯一值 */
  value: string | number;
  /** 显示文本 */
  label: string;
  /** 是否禁用 */
  disabled?: boolean;
}

interface WheelPickerProps {
  /** 选项列表 */
  items: WheelPickerItem[];
  /** 当前选中的值 */
  value?: string | number;
  /** 选中值变化回调 */
  onChange?: (value: string | number, index: number) => void;
  /** 每项高度（px），默认 44 */
  itemHeight?: number;
  /** 可见行数（奇数），默认 5 */
  visibleCount?: number;
}

export const WheelPicker: React.FC<WheelPickerProps> = ({
  items,
  value,
  onChange,
  itemHeight = 44,
  visibleCount = 5,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef({
    startY: 0,
    startTranslateY: 0,
    translateY: 0,
    lastY: 0,
    lastTime: 0,
    velocity: 0,
    animationId: 0,
    isDragging: false,
  });

  const halfVisible = Math.floor(visibleCount / 2);
  const containerHeight = itemHeight * visibleCount;

  // 找到当前选中项的 index
  const selectedIndex = items.findIndex((item) => item.value === value);
  const currentIndex = selectedIndex >= 0 ? selectedIndex : 0;

  // 使用 ref 保存 translateY 及每个 item 的 DOM，避免滑动时发生 React 重绘
  const itemsRef = useRef<(HTMLDivElement | null)[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);

  // 当 value 从外部变化时同步位置
  useEffect(() => {
    const idx = items.findIndex((item) => item.value === value);
    if (idx >= 0) {
      const targetY = -idx * itemHeight;
      scrollRef.current.translateY = targetY;
      updateDOM(targetY, false);
    }
  }, [value, items, itemHeight]);

  /** 直接操作 DOM 更新所有元素样式 */
  const updateDOM = useCallback((y: number, isDragging: boolean) => {
    if (contentRef.current) {
      contentRef.current.style.transform = `translateY(${y + halfVisible * itemHeight}px)`;
      contentRef.current.style.transition = isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
    }

    itemsRef.current.forEach((el, index) => {
      if (!el) return;
      const offset = index + y / itemHeight;
      const absOffset = Math.abs(offset);
      const scale = Math.max(0.7, 1 - absOffset * 0.08);
      const opacity = items[index]?.disabled ? 0.3 : Math.max(0.3, 1 - absOffset * 0.2);

      el.style.transform = `scale(${scale})`;
      el.style.opacity = `${opacity}`;
      el.style.transition = isDragging ? 'none' : 'transform 0.3s, opacity 0.3s';

      // 当靠得极近时，给个高亮的 class (粗体大字)
      const span = el.querySelector('span');
      if (span && !items[index]?.disabled) {
        if (absOffset < 0.5) {
          span.classList.add('text-primary-start', 'font-bold', 'text-xl');
          span.classList.remove('text-text-main', 'font-medium', 'text-lg');
        } else {
          span.classList.remove('text-primary-start', 'font-bold', 'text-xl');
          span.classList.add('text-text-main', 'font-medium', 'text-lg');
        }
      }
    });
  }, [items, itemHeight, halfVisible]);

  /** 吸附到最近的项 */
  const snapToNearest = useCallback(
    (y: number) => {
      let index = Math.round(-y / itemHeight);
      index = Math.max(0, Math.min(items.length - 1, index));

      // 跳过禁用项（向上或向下找最近可用项）
      const origIndex = index;
      while (index < items.length && items[index]?.disabled) index++;
      if (index >= items.length) {
        index = origIndex;
        while (index >= 0 && items[index]?.disabled) index--;
      }
      if (index < 0) index = 0;

      const targetY = -index * itemHeight;
      scrollRef.current.translateY = targetY;
      updateDOM(targetY, false);

      const selectedItem = items[index];
      if (selectedItem && selectedItem.value !== value) {
        onChange?.(selectedItem.value, index);
      }
    },
    [items, itemHeight, onChange, value, updateDOM],
  );

  /** 惯性动画 */
  const startMomentum = useCallback(
    (velocity: number) => {
      const friction = 0.95;
      const minVelocity = 0.5;

      const animate = () => {
        velocity *= friction;
        if (Math.abs(velocity) < minVelocity) {
          snapToNearest(scrollRef.current.translateY);
          return;
        }

        let newY = scrollRef.current.translateY + velocity;
        // 边界阻尼
        const maxY = 0;
        const minY = -(items.length - 1) * itemHeight;
        if (newY > maxY) {
          newY = maxY + (newY - maxY) * 0.3;
          velocity *= 0.5;
        } else if (newY < minY) {
          newY = minY + (newY - minY) * 0.3;
          velocity *= 0.5;
        }

        scrollRef.current.translateY = newY;
        updateDOM(newY, true);
        scrollRef.current.animationId = requestAnimationFrame(animate);
      };

      scrollRef.current.animationId = requestAnimationFrame(animate);
    },
    [items.length, itemHeight, snapToNearest],
  );

  const handleStart = useCallback(
    (clientY: number) => {
      cancelAnimationFrame(scrollRef.current.animationId);
      scrollRef.current.isDragging = true;
      scrollRef.current.startY = clientY;
      scrollRef.current.startTranslateY = scrollRef.current.translateY;
      scrollRef.current.lastY = clientY;
      scrollRef.current.lastTime = Date.now();
      scrollRef.current.velocity = 0;
    },
    [],
  );

  const handleMove = useCallback(
    (clientY: number) => {
      if (!scrollRef.current.isDragging) return;

      const now = Date.now();
      const deltaTime = now - scrollRef.current.lastTime;
      const deltaY = clientY - scrollRef.current.lastY;

      if (deltaTime > 0) {
        scrollRef.current.velocity = deltaY / deltaTime * 16; // 归一化到 ~60fps
      }

      scrollRef.current.lastY = clientY;
      scrollRef.current.lastTime = now;

      let newY = scrollRef.current.startTranslateY + (clientY - scrollRef.current.startY);

      // 边界橡皮筋效果
      const maxY = 0;
      const minY = -(items.length - 1) * itemHeight;
      if (newY > maxY) {
        newY = maxY + (newY - maxY) * 0.3;
      } else if (newY < minY) {
        newY = minY + (newY - minY) * 0.3;
      }

      scrollRef.current.translateY = newY;
      // 使用 requestAnimationFrame 更新 DOM，避免掉帧
      requestAnimationFrame(() => updateDOM(newY, true));
    },
    [items.length, itemHeight, updateDOM],
  );

  const handleEnd = useCallback(() => {
    if (!scrollRef.current.isDragging) return;
    scrollRef.current.isDragging = false;

    const velocity = scrollRef.current.velocity;
    if (Math.abs(velocity) > 2) {
      startMomentum(velocity);
    } else {
      snapToNearest(scrollRef.current.translateY);
    }
  }, [startMomentum, snapToNearest]);

  // 触摸事件
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      handleStart(e.touches[0].clientY);
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      handleMove(e.touches[0].clientY);
    };
    const onTouchEnd = () => handleEnd();

    const onMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      handleStart(e.clientY);
    };
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientY);
    const onMouseUp = () => handleEnd();
    const onMouseLeave = () => {
      if (scrollRef.current.isDragging) handleEnd();
    };

    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    el.addEventListener('mouseleave', onMouseLeave);

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      el.removeEventListener('mouseleave', onMouseLeave);
      cancelAnimationFrame(scrollRef.current.animationId);
    };
  }, [handleStart, handleMove, handleEnd]);

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden select-none cursor-grab active:cursor-grabbing"
      style={{ height: containerHeight, touchAction: 'none' }}
    >
      {/* 上下渐变遮罩 */}
      <div
        className="absolute top-0 left-0 right-0 z-10 pointer-events-none"
        style={{
          height: halfVisible * itemHeight,
          background: 'linear-gradient(to bottom, var(--color-bg-card, #fff) 10%, transparent 100%)',
        }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none"
        style={{
          height: halfVisible * itemHeight,
          background: 'linear-gradient(to top, var(--color-bg-card, #fff) 10%, transparent 100%)',
        }}
      />

      {/* 中间高亮条 */}
      <div
        className="absolute left-3 right-3 z-5 border-y border-primary-start/30 bg-primary-start/5 rounded-lg pointer-events-none"
        style={{
          top: halfVisible * itemHeight,
          height: itemHeight,
        }}
      />

      {/* 滚动内容 */}
      <div ref={contentRef}>
        {items.map((item, index) => {
          // 这里只进行初次渲染时的静态输出，动态 transform/opacity 靠 updateDOM 操控
          const isInitialSelected = index === currentIndex;
          const initialOpacity = item.disabled ? 0.3 : (isInitialSelected ? 1 : 0.6);
          
          return (
            <div
              key={item.value}
              ref={(el) => (itemsRef.current[index] = el)}
              className="flex items-center justify-center transform transition-none"
              style={{
                height: itemHeight,
                opacity: initialOpacity,
              }}
            >
              <span
                className={`transition-colors duration-200 ${
                  isInitialSelected && !item.disabled ? 'text-primary-start font-bold text-xl' : 'text-text-main font-medium text-lg'
                } ${item.disabled ? 'line-through text-text-aux' : ''}`}
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
