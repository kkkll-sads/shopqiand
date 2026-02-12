import { CLICK_THRESHOLD, LONG_PRESS_DURATION } from './constants';
import type { DragRuntimeState, Position, ChatButtonSide } from './types';

interface InteractionContext {
  state: DragRuntimeState;
  showDeleteButton: boolean;
  setShowDeleteButton: (show: boolean) => void;
  setCurrentSide: (side: ChatButtonSide) => void;
  setIsHalfHidden: (hidden: boolean) => void;
  cancelLongPress: () => void;
  resetHideTimer: () => void;
  constrainPosition: (x: number, y: number) => Position;
  snapToEdge: (position: Position) => { position: Position; side: ChatButtonSide };
  updateButtonStyle: (x: number, y: number, scale?: number, transition?: boolean) => void;
  savePosition: (position: Position) => void;
  onTap: () => void;
}

const beginPress = (clientX: number, clientY: number, ctx: InteractionContext) => {
  ctx.setIsHalfHidden(false);
  if (ctx.state.hideTimer) {
    clearTimeout(ctx.state.hideTimer);
  }

  ctx.state.pointerStart = { x: clientX, y: clientY };
  ctx.state.dragStart = { ...ctx.state.position };
  ctx.state.isPressed = true;
  ctx.state.hasMoved = false;
  ctx.state.isDragging = false;

  ctx.state.longPressTimer = window.setTimeout(() => {
    if (!ctx.state.hasMoved) {
      ctx.setShowDeleteButton(true);
    }
  }, LONG_PRESS_DURATION);
};

const movePress = (clientX: number, clientY: number, ctx: InteractionContext) => {
  if (!ctx.state.isPressed) return;

  const deltaX = clientX - ctx.state.pointerStart.x;
  const deltaY = clientY - ctx.state.pointerStart.y;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

  if (distance > CLICK_THRESHOLD) {
    ctx.state.hasMoved = true;
    ctx.state.isDragging = true;
    ctx.cancelLongPress();
    ctx.setShowDeleteButton(false);
  }

  const nextPosition = ctx.constrainPosition(
    ctx.state.dragStart.x + deltaX,
    ctx.state.dragStart.y + deltaY
  );

  if (ctx.state.rafId !== null) {
    cancelAnimationFrame(ctx.state.rafId);
  }
  ctx.state.rafId = requestAnimationFrame(() => {
    ctx.state.position = nextPosition;
    ctx.updateButtonStyle(nextPosition.x, nextPosition.y, ctx.state.isDragging ? 1.05 : 1);
    ctx.state.rafId = null;
  });
};

const endPress = (ctx: InteractionContext) => {
  ctx.cancelLongPress();

  if (ctx.state.rafId !== null) {
    cancelAnimationFrame(ctx.state.rafId);
    ctx.state.rafId = null;
  }

  if (ctx.state.isDragging) {
    const { position: snappedPosition, side } = ctx.snapToEdge(ctx.state.position);
    ctx.state.position = snappedPosition;
    ctx.state.side = side;
    ctx.setCurrentSide(side);
    ctx.updateButtonStyle(snappedPosition.x, snappedPosition.y, 1, true);
    ctx.savePosition(snappedPosition);
  } else if (!ctx.state.hasMoved && !ctx.showDeleteButton) {
    ctx.onTap();
  }

  ctx.updateButtonStyle(ctx.state.position.x, ctx.state.position.y, 1, true);
  ctx.state.isPressed = false;
  ctx.state.isDragging = false;
  ctx.state.hasMoved = false;
  ctx.resetHideTimer();
};

export const createTouchHandlers = (ctx: InteractionContext) => ({
  handleTouchStart: (event: TouchEvent) => {
    event.preventDefault();
    const touch = event.touches[0];
    beginPress(touch.clientX, touch.clientY, ctx);
  },
  handleTouchMove: (event: TouchEvent) => {
    if (!ctx.state.isPressed) return;
    event.preventDefault();
    const touch = event.touches[0];
    movePress(touch.clientX, touch.clientY, ctx);
  },
  handleTouchEnd: (event: TouchEvent) => {
    event.preventDefault();
    endPress(ctx);
  },
});

export const createMouseHandlers = (ctx: InteractionContext) => ({
  handleMouseDown: (event: MouseEvent) => {
    event.preventDefault();
    beginPress(event.clientX, event.clientY, ctx);
  },
  handleMouseMove: (event: MouseEvent) => {
    if (!ctx.state.isPressed) return;
    event.preventDefault();
    movePress(event.clientX, event.clientY, ctx);
  },
  handleMouseUp: () => {
    if (!ctx.state.isPressed) return;
    endPress(ctx);
  },
});
