import React, { useCallback, useEffect, useRef, useState } from 'react';

interface DragState {
  startY: number;
  currentY: number;
  isDragging: boolean;
  offset: number;
}

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  headerLeft?: React.ReactNode;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxHeight?: string;
  draggable?: boolean;
  maskClosable?: boolean;
  zIndex?: number;
  className?: string;
}

const CLOSE_THRESHOLD = 120;
const CLOSE_DURATION = 250;
const SHEET_TRANSITION = 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
const MASK_TRANSITION = 'opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1)';

function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(
    target.closest('button, a, input, textarea, select, [role="button"], [data-no-drag="true"]'),
  );
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  headerLeft,
  headerRight,
  children,
  footer,
  maxHeight = '80vh',
  draggable = true,
  maskClosable = true,
  zIndex = 50,
  className = '',
}) => {
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const maskRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const unmountTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const rafRef = useRef<number | null>(null);
  const dragRef = useRef<DragState>({
    startY: 0,
    currentY: 0,
    isDragging: false,
    offset: 0,
  });

  const applyOffset = useCallback((offset: number) => {
    if (sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${offset}px)`;
    }
    if (maskRef.current) {
      maskRef.current.style.opacity = `${Math.max(0, 1 - offset / 400)}`;
    }
  }, []);

  const requestClose = useCallback(() => {
    if (isClosing) {
      return;
    }

    setIsClosing(true);
    dragRef.current.isDragging = false;
    dragRef.current.offset = 0;

    if (sheetRef.current) {
      sheetRef.current.style.transition = SHEET_TRANSITION;
      sheetRef.current.style.transform = 'translateY(100%)';
    }
    if (maskRef.current) {
      maskRef.current.style.transition = MASK_TRANSITION;
      maskRef.current.style.opacity = '0';
    }

    clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      onClose();
    }, CLOSE_DURATION);
  }, [isClosing, onClose]);

  const handleDragStart = useCallback((clientY: number) => {
    if (!draggable || isClosing || !isOpen) {
      return;
    }

    dragRef.current = {
      startY: clientY,
      currentY: clientY,
      isDragging: true,
      offset: dragRef.current.offset,
    };

    if (sheetRef.current) {
      sheetRef.current.style.transition = 'none';
    }
    if (maskRef.current) {
      maskRef.current.style.transition = 'none';
    }
  }, [draggable, isClosing, isOpen]);

  const handleDragMove = useCallback((clientY: number) => {
    if (!dragRef.current.isDragging) {
      return;
    }

    const delta = Math.max(0, clientY - dragRef.current.startY);
    dragRef.current.currentY = clientY;
    dragRef.current.offset = delta;

    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(() => {
      applyOffset(delta);
      rafRef.current = null;
    });
  }, [applyOffset]);

  const handleDragEnd = useCallback(() => {
    if (!dragRef.current.isDragging) {
      return;
    }

    dragRef.current.isDragging = false;
    const finalOffset = dragRef.current.offset;

    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (sheetRef.current) {
      sheetRef.current.style.transition = SHEET_TRANSITION;
    }
    if (maskRef.current) {
      maskRef.current.style.transition = MASK_TRANSITION;
    }

    if (finalOffset > CLOSE_THRESHOLD) {
      requestClose();
      return;
    }

    dragRef.current.offset = 0;
    applyOffset(0);
  }, [applyOffset, requestClose]);

  useEffect(() => {
    if (isOpen) {
      clearTimeout(unmountTimerRef.current);
      setIsRendered(true);
      setIsClosing(false);
      dragRef.current.offset = 0;
      dragRef.current.isDragging = false;

      requestAnimationFrame(() => {
        if (sheetRef.current) {
          sheetRef.current.style.transition = '';
          sheetRef.current.style.transform = 'translateY(0px)';
        }
        if (maskRef.current) {
          maskRef.current.style.transition = '';
          maskRef.current.style.opacity = '1';
        }
      });
      return;
    }

    if (!isRendered) {
      return;
    }

    setIsClosing(true);
    if (sheetRef.current) {
      sheetRef.current.style.transition = SHEET_TRANSITION;
      sheetRef.current.style.transform = 'translateY(100%)';
    }
    if (maskRef.current) {
      maskRef.current.style.transition = MASK_TRANSITION;
      maskRef.current.style.opacity = '0';
    }

    clearTimeout(unmountTimerRef.current);
    unmountTimerRef.current = setTimeout(() => {
      setIsRendered(false);
    }, CLOSE_DURATION + 20);
  }, [isOpen, isRendered]);

  useEffect(() => {
    if (!draggable || !isRendered) {
      return;
    }

    const onTouchMove = (event: TouchEvent) => {
      if (!dragRef.current.isDragging) {
        return;
      }
      event.preventDefault();
      handleDragMove(event.touches[0].clientY);
    };

    const onMouseMove = (event: MouseEvent) => {
      if (!dragRef.current.isDragging) {
        return;
      }
      handleDragMove(event.clientY);
    };

    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', handleDragEnd);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', handleDragEnd);

    return () => {
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', handleDragEnd);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', handleDragEnd);
    };
  }, [draggable, handleDragEnd, handleDragMove, isRendered]);

  useEffect(() => {
    return () => {
      clearTimeout(closeTimerRef.current);
      clearTimeout(unmountTimerRef.current);
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  if (!isRendered) {
    return null;
  }

  const resolvedHeaderLeft = headerLeft === undefined ? (
    <button type="button" onClick={requestClose} className="px-2 py-1 text-md text-text-sub">
      取消
    </button>
  ) : headerLeft;
  const resolvedHeaderRight = headerRight === undefined ? null : headerRight;

  return (
    <>
      <div
        ref={maskRef}
        className="fixed inset-0 bg-black/50 transition-opacity duration-300"
        style={{ zIndex, opacity: isClosing ? 0 : 1 }}
        onClick={maskClosable ? requestClose : undefined}
      />
      <div
        ref={sheetRef}
        className={`fixed bottom-0 inset-x-0 mx-auto flex w-full max-w-[750px] flex-col rounded-t-[20px] bg-white dark:bg-gray-900 transition-transform duration-300 ${isClosing ? 'translate-y-full' : 'animate-slide-up'} ${className}`}
        style={{ zIndex: zIndex + 1, maxHeight }}
      >
        <div
          className={`shrink-0 ${draggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
          onTouchStart={draggable ? (event) => {
            if (isInteractiveTarget(event.target)) {
              return;
            }
            handleDragStart(event.touches[0].clientY);
          } : undefined}
          onMouseDown={draggable ? (event) => {
            if (isInteractiveTarget(event.target)) {
              return;
            }
            event.preventDefault();
            handleDragStart(event.clientY);
          } : undefined}
        >
          <div className="flex justify-center pb-1 pt-3">
            <div className="h-1 w-10 rounded-full bg-border-light dark:bg-white/20" />
          </div>
          <div className="grid grid-cols-[minmax(56px,1fr)_auto_minmax(56px,1fr)] items-center gap-2 border-b border-border-light px-4 pb-3 dark:border-white/10">
            <div className="min-w-[56px]">{resolvedHeaderLeft}</div>
            <h3 className="truncate text-center text-xl font-bold text-text-main">{title}</h3>
            <div className="flex min-w-[56px] justify-end">{resolvedHeaderRight}</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">{children}</div>

        {footer ? (
          <div className="shrink-0 border-t border-border-light pb-safe dark:border-white/10">
            {footer}
          </div>
        ) : null}
      </div>
    </>
  );
};

