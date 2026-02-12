/**
 * DraggableChatButton - 可拖动客服悬浮按钮
 */
import React, { useEffect, useRef, useCallback, useState } from 'react';
import { openChatWidget } from '../ChatWidget';
import { HIDE_DELAY } from './constants';
import { constrainPosition, getDefaultPosition, getHiddenPosition, snapToEdge } from './positioning';
import {
  getInitialHiddenState,
  loadPositionFromStorage,
  savePositionToStorage,
  setHiddenState,
} from './storage';
import { createTouchHandlers, createMouseHandlers } from './interactions';
import type { DragRuntimeState } from './types';
import DraggableChatButtonView from './DraggableChatButtonView';

const DraggableChatButton: React.FC = () => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const deleteZoneRef = useRef<HTMLDivElement>(null);

  const [isHalfHidden, setIsHalfHidden] = useState(false);
  const [showDeleteButton, setShowDeleteButton] = useState(false);
  const [isButtonHidden, setIsButtonHidden] = useState(getInitialHiddenState);
  const [currentSide, setCurrentSide] = useState<'left' | 'right'>('right');

  const stateRef = useRef<DragRuntimeState>({
    position: { x: 0, y: 0 },
    dragStart: { x: 0, y: 0 },
    pointerStart: { x: 0, y: 0 },
    isDragging: false,
    isPressed: false,
    hasMoved: false,
    rafId: null,
    longPressTimer: null,
    hideTimer: null,
    side: 'right',
  });

  const updateButtonStyle = useCallback(
    (x: number, y: number, scale = 1, transition = false) => {
      const button = buttonRef.current;
      if (button) {
        button.style.transition = transition ? 'transform 0.3s ease-out' : 'none';
        button.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
      }
    },
    []
  );

  const savePosition = useCallback((position: { x: number; y: number }) => {
    savePositionToStorage(position);
  }, []);

  const cancelLongPress = useCallback(() => {
    const state = stateRef.current;
    if (state.longPressTimer) {
      clearTimeout(state.longPressTimer);
      state.longPressTimer = null;
    }
  }, []);

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

  const handleClose = useCallback(() => {
    setIsButtonHidden(true);
    setShowDeleteButton(false);
    setHiddenState(true);
  }, []);

  const handleTapOpenChat = useCallback(() => {
    const state = stateRef.current;

    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }

    updateButtonStyle(state.position.x, state.position.y, 0.95, true);
    setTimeout(() => {
      updateButtonStyle(state.position.x, state.position.y, 1, true);
    }, 100);

    openChatWidget();
  }, [updateButtonStyle]);

  useEffect(() => {
    if (isButtonHidden) return;

    const storedPosition = loadPositionFromStorage();
    const initialPosition = constrainPosition(
      storedPosition?.x ?? getDefaultPosition().x,
      storedPosition?.y ?? getDefaultPosition().y
    );

    const { position: snappedPosition, side } = snapToEdge(initialPosition);
    stateRef.current.position = snappedPosition;
    stateRef.current.side = side;
    setCurrentSide(side);
    updateButtonStyle(snappedPosition.x, snappedPosition.y);
    resetHideTimer();
  }, [isButtonHidden, updateButtonStyle, resetHideTimer]);

  useEffect(() => {
    if (isButtonHidden) return;

    const state = stateRef.current;
    if (isHalfHidden) {
      const hiddenPosition = getHiddenPosition(state.position, state.side);
      updateButtonStyle(hiddenPosition.x, hiddenPosition.y, 1, true);
    } else {
      updateButtonStyle(state.position.x, state.position.y, 1, true);
    }
  }, [isHalfHidden, isButtonHidden, updateButtonStyle]);

  useEffect(() => {
    if (isButtonHidden) return;

    const button = buttonRef.current;
    if (!button) return;

    const touchHandlers = createTouchHandlers({
      state: stateRef.current,
      showDeleteButton,
      setShowDeleteButton,
      setCurrentSide,
      setIsHalfHidden,
      cancelLongPress,
      resetHideTimer,
      constrainPosition,
      snapToEdge,
      updateButtonStyle,
      savePosition,
      onTap: handleTapOpenChat,
    });

    button.addEventListener('touchstart', touchHandlers.handleTouchStart, { passive: false });
    button.addEventListener('touchmove', touchHandlers.handleTouchMove, { passive: false });
    button.addEventListener('touchend', touchHandlers.handleTouchEnd, { passive: false });
    button.addEventListener('touchcancel', touchHandlers.handleTouchEnd, { passive: false });

    return () => {
      button.removeEventListener('touchstart', touchHandlers.handleTouchStart);
      button.removeEventListener('touchmove', touchHandlers.handleTouchMove);
      button.removeEventListener('touchend', touchHandlers.handleTouchEnd);
      button.removeEventListener('touchcancel', touchHandlers.handleTouchEnd);
      cancelLongPress();

      const state = stateRef.current;
      if (state.rafId !== null) {
        cancelAnimationFrame(state.rafId);
      }
      if (state.hideTimer) {
        clearTimeout(state.hideTimer);
      }
    };
  }, [
    isButtonHidden,
    showDeleteButton,
    cancelLongPress,
    resetHideTimer,
    updateButtonStyle,
    savePosition,
    handleTapOpenChat,
  ]);

  useEffect(() => {
    if (isButtonHidden) return;

    const button = buttonRef.current;
    if (!button) return;

    const mouseHandlers = createMouseHandlers({
      state: stateRef.current,
      showDeleteButton,
      setShowDeleteButton,
      setCurrentSide,
      setIsHalfHidden,
      cancelLongPress,
      resetHideTimer,
      constrainPosition,
      snapToEdge,
      updateButtonStyle,
      savePosition,
      onTap: handleTapOpenChat,
    });

    button.addEventListener('mousedown', mouseHandlers.handleMouseDown);
    window.addEventListener('mousemove', mouseHandlers.handleMouseMove);
    window.addEventListener('mouseup', mouseHandlers.handleMouseUp);

    return () => {
      button.removeEventListener('mousedown', mouseHandlers.handleMouseDown);
      window.removeEventListener('mousemove', mouseHandlers.handleMouseMove);
      window.removeEventListener('mouseup', mouseHandlers.handleMouseUp);
    };
  }, [
    isButtonHidden,
    showDeleteButton,
    cancelLongPress,
    resetHideTimer,
    updateButtonStyle,
    savePosition,
    handleTapOpenChat,
  ]);

  useEffect(() => {
    if (isButtonHidden) return;

    const handleResize = () => {
      const state = stateRef.current;
      const constrained = constrainPosition(state.position.x, state.position.y);
      const { position: snappedPosition, side } = snapToEdge(constrained);

      if (snappedPosition.x !== state.position.x || snappedPosition.y !== state.position.y) {
        state.position = snappedPosition;
        state.side = side;
        setCurrentSide(side);
        updateButtonStyle(snappedPosition.x, snappedPosition.y);
        savePosition(snappedPosition);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isButtonHidden, updateButtonStyle, savePosition]);

  useEffect(() => {
    if (!showDeleteButton) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const button = buttonRef.current;
      const deleteZone = deleteZoneRef.current;
      const target = event.target as Node;

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

  if (isButtonHidden) {
    return null;
  }

  return (
    <DraggableChatButtonView
      buttonRef={buttonRef}
      deleteZoneRef={deleteZoneRef}
      currentSide={currentSide}
      isHalfHidden={isHalfHidden}
      showDeleteButton={showDeleteButton}
      positionY={stateRef.current.position.y}
      onClose={handleClose}
    />
  );
};

export default DraggableChatButton;
