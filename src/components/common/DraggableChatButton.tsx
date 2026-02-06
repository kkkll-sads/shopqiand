/**
 * DraggableChatButton - 可拖动客服悬浮按钮
 * 
 * 功能：
 * - 可长按拖动，支持触摸和鼠标操作
 * - 自动靠边吸附效果
 * - 静止后半隐藏效果
 * - 长按显示关闭按钮
 * - 自动保存位置和状态到 localStorage
 * 
 * @version 3.0.0
 */
import React, { useEffect, useRef, useCallback, useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { openChatWidget } from './ChatWidget';

const STORAGE_KEY = 'chat_button_position';
const HIDDEN_STORAGE_KEY = 'chat_button_hidden';
const BUTTON_SIZE = 56;
const EDGE_MARGIN = 8;
const BOTTOM_NAV_HEIGHT = 80;
const CLICK_THRESHOLD = 10; // 提高到10像素，避免轻微抖动被误判为拖动
const LONG_PRESS_DURATION = 800; // 长按时间
const HIDE_DELAY = 3000; // 静止后隐藏延时
const HIDDEN_OFFSET = 28; // 半隐藏时露出的宽度

interface Position {
  x: number;
  y: number;
}

const DraggableChatButton: React.FC = () => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const deleteZoneRef = useRef<HTMLDivElement>(null);
  
  // UI 状态
  const [isHalfHidden, setIsHalfHidden] = useState(false);
  const [showDeleteButton, setShowDeleteButton] = useState(false);
  const [isButtonHidden, setIsButtonHidden] = useState(() => {
    try {
      // 使用 sessionStorage：关闭状态仅当前会话有效，刷新/重开页面后按钮自动恢复
      return sessionStorage.getItem(HIDDEN_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [currentSide, setCurrentSide] = useState<'left' | 'right'>('right');
  
  // 使用 ref 存储所有状态，避免闭包问题
  const stateRef = useRef({
    position: { x: 0, y: 0 },
    dragStart: { x: 0, y: 0 },
    touchStart: { x: 0, y: 0 },
    isDragging: false,
    isPressed: false,
    hasMoved: false,
    rafId: null as number | null,
    longPressTimer: null as number | null,
    hideTimer: null as number | null,
    side: 'right' as 'left' | 'right',
  });

  // 限制位置在屏幕范围内
  const constrainPosition = useCallback((x: number, y: number): Position => {
    const maxX = window.innerWidth - BUTTON_SIZE - EDGE_MARGIN;
    const maxY = window.innerHeight - BUTTON_SIZE - BOTTOM_NAV_HEIGHT - EDGE_MARGIN;
    return {
      x: Math.max(EDGE_MARGIN, Math.min(maxX, x)),
      y: Math.max(EDGE_MARGIN, Math.min(maxY, y)),
    };
  }, []);

  // 计算吸附位置（靠左或靠右）
  const snapToEdge = useCallback((pos: Position): { position: Position; side: 'left' | 'right' } => {
    const centerX = window.innerWidth / 2;
    const side = pos.x + BUTTON_SIZE / 2 < centerX ? 'left' : 'right';
    const targetX = side === 'left' 
      ? EDGE_MARGIN 
      : window.innerWidth - BUTTON_SIZE - EDGE_MARGIN;
    return {
      position: { x: targetX, y: pos.y },
      side,
    };
  }, []);

  // 计算半隐藏位置
  const getHiddenPosition = useCallback((pos: Position, side: 'left' | 'right'): Position => {
    const hiddenX = side === 'left' 
      ? -BUTTON_SIZE + HIDDEN_OFFSET 
      : window.innerWidth - HIDDEN_OFFSET;
    return { x: hiddenX, y: pos.y };
  }, []);

  // 直接更新按钮位置
  const updateButtonStyle = useCallback((x: number, y: number, scale: number = 1, transition: boolean = false) => {
    const button = buttonRef.current;
    if (button) {
      button.style.transition = transition ? 'transform 0.3s ease-out' : 'none';
      button.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
    }
  }, []);

  // 保存位置
  const savePosition = useCallback((pos: Position) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pos));
    } catch (e) {}
  }, []);

  // 重置隐藏计时器
  const resetHideTimer = useCallback(() => {
    const state = stateRef.current;
    if (state.hideTimer) {
      clearTimeout(state.hideTimer);
    }
    setIsHalfHidden(false);
    state.hideTimer = window.setTimeout(() => {
      if (!state.isDragging && !state.isPressed) {
        setIsHalfHidden(true);
      }
    }, HIDE_DELAY);
  }, []);

  // 取消长按计时器
  const cancelLongPress = useCallback(() => {
    const state = stateRef.current;
    if (state.longPressTimer) {
      clearTimeout(state.longPressTimer);
      state.longPressTimer = null;
    }
  }, []);

  // 处理按钮关闭
  const handleClose = useCallback(() => {
    setIsButtonHidden(true);
    setShowDeleteButton(false);
    try {
      sessionStorage.setItem(HIDDEN_STORAGE_KEY, 'true');
    } catch (e) {}
  }, []);

  // 初始化位置
  useEffect(() => {
    if (isButtonHidden) return;
    
    const button = buttonRef.current;
    if (!button) return;

    let initialPos: Position;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const pos = JSON.parse(saved);
        if (typeof pos.x === 'number' && typeof pos.y === 'number') {
          initialPos = constrainPosition(pos.x, pos.y);
        } else {
          throw new Error();
        }
      } else {
        throw new Error();
      }
    } catch {
      initialPos = {
        x: window.innerWidth - BUTTON_SIZE - EDGE_MARGIN,
        y: window.innerHeight - BUTTON_SIZE - BOTTOM_NAV_HEIGHT - EDGE_MARGIN,
      };
    }

    // 吸附到边缘
    const { position: snappedPos, side } = snapToEdge(initialPos);
    stateRef.current.position = snappedPos;
    stateRef.current.side = side;
    setCurrentSide(side);
    updateButtonStyle(snappedPos.x, snappedPos.y);
    
    // 启动隐藏计时器
    resetHideTimer();
  }, [isButtonHidden, constrainPosition, snapToEdge, updateButtonStyle, resetHideTimer]);

  // 半隐藏效果
  useEffect(() => {
    if (isButtonHidden) return;
    
    const state = stateRef.current;
    if (isHalfHidden) {
      const hiddenPos = getHiddenPosition(state.position, state.side);
      updateButtonStyle(hiddenPos.x, hiddenPos.y, 1, true);
    } else {
      updateButtonStyle(state.position.x, state.position.y, 1, true);
    }
  }, [isHalfHidden, isButtonHidden, getHiddenPosition, updateButtonStyle]);

  // 原生触摸事件处理
  useEffect(() => {
    if (isButtonHidden) return;
    
    const button = buttonRef.current;
    if (!button) return;

    const state = stateRef.current;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      
      // 取消半隐藏
      setIsHalfHidden(false);
      if (state.hideTimer) {
        clearTimeout(state.hideTimer);
      }
      
      const touch = e.touches[0];
      state.touchStart = { x: touch.clientX, y: touch.clientY };
      state.dragStart = { ...state.position };
      state.isPressed = true;
      state.hasMoved = false;
      state.isDragging = false;

      // 启动长按计时器
      state.longPressTimer = window.setTimeout(() => {
        if (!state.hasMoved) {
          setShowDeleteButton(true);
        }
      }, LONG_PRESS_DURATION);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!state.isPressed) return;
      e.preventDefault();

      const touch = e.touches[0];
      const deltaX = touch.clientX - state.touchStart.x;
      const deltaY = touch.clientY - state.touchStart.y;
      
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      if (distance > CLICK_THRESHOLD) {
        state.hasMoved = true;
        state.isDragging = true;
        cancelLongPress();
        setShowDeleteButton(false);
      }

      const newX = state.dragStart.x + deltaX;
      const newY = state.dragStart.y + deltaY;
      const constrained = constrainPosition(newX, newY);
      
      if (state.rafId !== null) {
        cancelAnimationFrame(state.rafId);
      }
      state.rafId = requestAnimationFrame(() => {
        state.position = constrained;
        updateButtonStyle(constrained.x, constrained.y, state.isDragging ? 1.05 : 1);
        state.rafId = null;
      });
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      cancelLongPress();
      
      if (state.rafId !== null) {
        cancelAnimationFrame(state.rafId);
        state.rafId = null;
      }

      if (state.isDragging) {
        // 吸附到边缘
        const { position: snappedPos, side } = snapToEdge(state.position);
        state.position = snappedPos;
        state.side = side;
        setCurrentSide(side);
        updateButtonStyle(snappedPos.x, snappedPos.y, 1, true);
        savePosition(snappedPos);
      } else if (!state.hasMoved && !showDeleteButton) {
        // 点击事件 - 添加调试日志
        console.log('[DraggableChatButton] 触摸点击触发');
        
        // 添加触觉反馈（如果支持）
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
        
        // 添加视觉反馈
        updateButtonStyle(state.position.x, state.position.y, 0.95, true);
        setTimeout(() => {
          updateButtonStyle(state.position.x, state.position.y, 1, true);
        }, 100);
        
        // 调用客服打开函数
        const opened = openChatWidget();
        console.log('[DraggableChatButton] 客服窗口打开结果:', opened);
      }

      // 恢复缩放
      updateButtonStyle(state.position.x, state.position.y, 1, true);

      state.isPressed = false;
      state.isDragging = false;
      state.hasMoved = false;
      
      // 重启隐藏计时器
      resetHideTimer();
    };

    button.addEventListener('touchstart', handleTouchStart, { passive: false });
    button.addEventListener('touchmove', handleTouchMove, { passive: false });
    button.addEventListener('touchend', handleTouchEnd, { passive: false });
    button.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    return () => {
      button.removeEventListener('touchstart', handleTouchStart);
      button.removeEventListener('touchmove', handleTouchMove);
      button.removeEventListener('touchend', handleTouchEnd);
      button.removeEventListener('touchcancel', handleTouchEnd);
      cancelLongPress();
      if (state.rafId !== null) {
        cancelAnimationFrame(state.rafId);
      }
      if (state.hideTimer) {
        clearTimeout(state.hideTimer);
      }
    };
  }, [isButtonHidden, showDeleteButton, constrainPosition, snapToEdge, updateButtonStyle, savePosition, cancelLongPress, resetHideTimer]);

  // 原生鼠标事件处理
  useEffect(() => {
    if (isButtonHidden) return;
    
    const button = buttonRef.current;
    if (!button) return;

    const state = stateRef.current;

    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      
      setIsHalfHidden(false);
      if (state.hideTimer) {
        clearTimeout(state.hideTimer);
      }
      
      state.touchStart = { x: e.clientX, y: e.clientY };
      state.dragStart = { ...state.position };
      state.isPressed = true;
      state.hasMoved = false;
      state.isDragging = false;

      state.longPressTimer = window.setTimeout(() => {
        if (!state.hasMoved) {
          setShowDeleteButton(true);
        }
      }, LONG_PRESS_DURATION);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!state.isPressed) return;
      e.preventDefault();

      const deltaX = e.clientX - state.touchStart.x;
      const deltaY = e.clientY - state.touchStart.y;
      
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      if (distance > CLICK_THRESHOLD) {
        state.hasMoved = true;
        state.isDragging = true;
        cancelLongPress();
        setShowDeleteButton(false);
      }

      const newX = state.dragStart.x + deltaX;
      const newY = state.dragStart.y + deltaY;
      const constrained = constrainPosition(newX, newY);
      
      if (state.rafId !== null) {
        cancelAnimationFrame(state.rafId);
      }
      state.rafId = requestAnimationFrame(() => {
        state.position = constrained;
        updateButtonStyle(constrained.x, constrained.y, state.isDragging ? 1.05 : 1);
        state.rafId = null;
      });
    };

    const handleMouseUp = () => {
      if (!state.isPressed) return;
      cancelLongPress();
      
      if (state.rafId !== null) {
        cancelAnimationFrame(state.rafId);
        state.rafId = null;
      }

      if (state.isDragging) {
        const { position: snappedPos, side } = snapToEdge(state.position);
        state.position = snappedPos;
        state.side = side;
        setCurrentSide(side);
        updateButtonStyle(snappedPos.x, snappedPos.y, 1, true);
        savePosition(snappedPos);
      } else if (!state.hasMoved && !showDeleteButton) {
        // 点击事件 - 添加调试日志
        console.log('[DraggableChatButton] 鼠标点击触发');
        
        // 添加视觉反馈
        updateButtonStyle(state.position.x, state.position.y, 0.95, true);
        setTimeout(() => {
          updateButtonStyle(state.position.x, state.position.y, 1, true);
        }, 100);
        
        // 调用客服打开函数
        const opened = openChatWidget();
        console.log('[DraggableChatButton] 客服窗口打开结果:', opened);
      }

      updateButtonStyle(state.position.x, state.position.y, 1, true);

      state.isPressed = false;
      state.isDragging = false;
      state.hasMoved = false;
      
      resetHideTimer();
    };

    button.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      button.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isButtonHidden, showDeleteButton, constrainPosition, snapToEdge, updateButtonStyle, savePosition, cancelLongPress, resetHideTimer]);

  // 窗口大小变化时重新约束位置
  useEffect(() => {
    if (isButtonHidden) return;
    
    const handleResize = () => {
      const state = stateRef.current;
      const { position: snappedPos, side } = snapToEdge(constrainPosition(state.position.x, state.position.y));
      if (snappedPos.x !== state.position.x || snappedPos.y !== state.position.y) {
        state.position = snappedPos;
        state.side = side;
        setCurrentSide(side);
        updateButtonStyle(snappedPos.x, snappedPos.y);
        savePosition(snappedPos);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isButtonHidden, constrainPosition, snapToEdge, updateButtonStyle, savePosition]);

  // 点击外部关闭删除按钮
  useEffect(() => {
    if (!showDeleteButton) return;
    
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const button = buttonRef.current;
      const deleteZone = deleteZoneRef.current;
      const target = e.target as Node;
      
      if (button && !button.contains(target) && deleteZone && !deleteZone.contains(target)) {
        setShowDeleteButton(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showDeleteButton]);

  // 备用简单点击处理（兜底方案）
  const handleSimpleClick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    // 只有当原生事件处理没有拦截时才会执行
    console.log('[DraggableChatButton] 备用点击处理被触发');
    const state = stateRef.current;
    
    // 确保不是在拖动状态
    if (!state.isDragging && !state.hasMoved) {
      e.stopPropagation();
      openChatWidget();
    }
  }, []);

  // 如果按钮被隐藏，不渲染
  if (isButtonHidden) {
    return null;
  }

  return (
    <>
      {/* 主按钮 */}
      <button
        ref={buttonRef}
        className="fixed z-[10000] rounded-full shadow-lg"
        style={{
          width: `${BUTTON_SIZE}px`,
          height: `${BUTTON_SIZE}px`,
          transform: 'translate3d(0, 0, 0)',
          touchAction: 'none',
          willChange: 'transform',
          backfaceVisibility: 'hidden',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          outline: 'none',
          WebkitTapHighlightColor: 'transparent',
        }}
        aria-label="打开客服"
      >
        <div 
          className={`w-full h-full rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-300 ${
            isHalfHidden 
              ? 'bg-gradient-to-r from-orange-400 to-orange-500 shadow-orange-400/20' 
              : 'bg-gradient-to-r from-orange-500 to-orange-600 shadow-orange-500/30'
          }`}
        >
          <MessageCircle 
            size={24} 
            strokeWidth={2} 
            className={`transition-transform duration-300 ${
              currentSide === 'left' && isHalfHidden ? 'translate-x-3' : ''
            } ${
              currentSide === 'right' && isHalfHidden ? '-translate-x-3' : ''
            }`}
          />
        </div>
      </button>

      {/* 关闭按钮（长按显示） */}
      {showDeleteButton && (
        <div
          ref={deleteZoneRef}
          className="fixed z-[10001] animate-fadeIn"
          style={{
            left: currentSide === 'left' ? EDGE_MARGIN + BUTTON_SIZE + 8 : 'auto',
            right: currentSide === 'right' ? EDGE_MARGIN + BUTTON_SIZE + 8 : 'auto',
            top: stateRef.current.position.y + BUTTON_SIZE / 2 - 16,
          }}
        >
          <button
            onClick={handleClose}
            className="flex items-center gap-1.5 px-3 py-2 bg-white rounded-full shadow-lg border border-gray-200 text-gray-600 hover:text-red-500 hover:border-red-200 transition-all active:scale-95"
          >
            <X size={16} />
            <span className="text-xs font-medium">关闭</span>
          </button>
        </div>
      )}
    </>
  );
};

export default DraggableChatButton;
