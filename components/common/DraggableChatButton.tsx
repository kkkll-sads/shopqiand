/**
 * DraggableChatButton - 可拖动客服悬浮按钮
 * 
 * 功能：
 * - 可长按拖动，支持触摸和鼠标操作
 * - 自动保存位置到 localStorage
 * - 边界检测，防止拖出屏幕
 * - 点击打开客服窗口
 * 
 * @version 1.0.0
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle } from 'lucide-react';
import { openChatWidget } from './ChatWidget';

const STORAGE_KEY = 'chat_button_position';
const BUTTON_SIZE = 56; // 按钮大小（px）
const EDGE_MARGIN = 20; // 距离边缘的最小距离（px）
const BOTTOM_NAV_HEIGHT = 80; // 底部导航栏高度（包括安全区域，px）
const DRAG_THRESHOLD = 5; // 拖动阈值（px），超过此距离才认为是拖动

interface Position {
  x: number;
  y: number;
}

const DraggableChatButton: React.FC = () => {
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dragStartRef = useRef<Position>({ x: 0, y: 0 });
  const touchStartRef = useRef<Position>({ x: 0, y: 0 });
  const hasMovedRef = useRef(false);

  // 从 localStorage 加载保存的位置
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const pos = JSON.parse(saved) as Position;
        // 验证位置是否有效
        if (typeof pos.x === 'number' && typeof pos.y === 'number') {
          setPosition(pos);
          return;
        }
      }
    } catch (e) {
      // 忽略解析错误
    }
    
    // 默认位置：右下角（距离底部导航栏上方）
    if (typeof window !== 'undefined') {
      setPosition({
        x: window.innerWidth - BUTTON_SIZE - EDGE_MARGIN,
        y: window.innerHeight - BUTTON_SIZE - BOTTOM_NAV_HEIGHT - EDGE_MARGIN,
      });
    }
  }, []);

  // 保存位置到 localStorage
  const savePosition = useCallback((pos: Position) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pos));
    } catch (e) {
      // 忽略存储错误
    }
  }, []);

  // 限制位置在屏幕范围内（考虑底部导航栏）
  const constrainPosition = useCallback((x: number, y: number): Position => {
    if (typeof window === 'undefined') {
      return { x, y };
    }

    const maxX = window.innerWidth - BUTTON_SIZE - EDGE_MARGIN;
    // 最大 Y 需要考虑底部导航栏的高度
    const maxY = window.innerHeight - BUTTON_SIZE - BOTTOM_NAV_HEIGHT - EDGE_MARGIN;
    const minX = EDGE_MARGIN;
    const minY = EDGE_MARGIN;

    return {
      x: Math.max(minX, Math.min(maxX, x)),
      y: Math.max(minY, Math.min(maxY, y)),
    };
  }, []);

  // 处理触摸开始
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    dragStartRef.current = position;
    hasMovedRef.current = false;
    setIsPressed(true);
  }, [position]);

  // 处理触摸移动
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPressed) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // 如果移动距离超过阈值，开始拖动
    if (distance > DRAG_THRESHOLD) {
      hasMovedRef.current = true;
      if (!isDragging) {
        setIsDragging(true);
      }

      const newX = dragStartRef.current.x + deltaX;
      const newY = dragStartRef.current.y + deltaY;
      const constrained = constrainPosition(newX, newY);
      setPosition(constrained);
    }
  }, [isPressed, isDragging, constrainPosition]);

  // 处理触摸结束
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    
    if (isDragging) {
      // 拖动结束，保存位置
      savePosition(position);
      setIsDragging(false);
    } else if (!hasMovedRef.current) {
      // 没有移动，视为点击
      openChatWidget();
    }
    
    setIsPressed(false);
    hasMovedRef.current = false;
  }, [isDragging, position, savePosition]);

  // 处理鼠标按下（桌面端支持）
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragStartRef.current = position;
    touchStartRef.current = { x: e.clientX, y: e.clientY };
    hasMovedRef.current = false;
    setIsPressed(true);
  }, [position]);

  // 处理鼠标移动
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isPressed) return;

    const deltaX = e.clientX - touchStartRef.current.x;
    const deltaY = e.clientY - touchStartRef.current.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance > DRAG_THRESHOLD) {
      hasMovedRef.current = true;
      if (!isDragging) {
        setIsDragging(true);
      }

      const newX = dragStartRef.current.x + deltaX;
      const newY = dragStartRef.current.y + deltaY;
      const constrained = constrainPosition(newX, newY);
      setPosition(constrained);
    }
  }, [isPressed, isDragging, constrainPosition]);

  // 处理鼠标释放
  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (isDragging) {
      savePosition(position);
      setIsDragging(false);
    } else if (!hasMovedRef.current && isPressed) {
      openChatWidget();
    }
    
    setIsPressed(false);
    hasMovedRef.current = false;
  }, [isDragging, isPressed, position, savePosition]);

  // 监听全局鼠标事件（用于拖动）
  useEffect(() => {
    if (isPressed) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isPressed, handleMouseMove, handleMouseUp]);

  // 窗口大小变化时，重新约束位置
  useEffect(() => {
    const handleResize = () => {
      const constrained = constrainPosition(position.x, position.y);
      if (constrained.x !== position.x || constrained.y !== position.y) {
        setPosition(constrained);
        savePosition(constrained);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [position, constrainPosition, savePosition]);

  return (
    <button
      ref={buttonRef}
      className={`fixed z-[10000] rounded-full shadow-lg transition-all duration-200 ${
        isDragging ? 'scale-110 opacity-80' : 'scale-100 opacity-100'
      } ${isPressed ? 'active:scale-95' : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${BUTTON_SIZE}px`,
        height: `${BUTTON_SIZE}px`,
        touchAction: 'none', // 禁用默认触摸行为
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onClick={(e) => {
        // 如果已经处理过点击（在 touchEnd/mouseUp 中），阻止默认行为
        if (hasMovedRef.current) {
          e.preventDefault();
        }
      }}
      aria-label="打开客服"
    >
      <div className="w-full h-full rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
        <MessageCircle size={24} strokeWidth={2} />
      </div>
    </button>
  );
};

export default DraggableChatButton;
