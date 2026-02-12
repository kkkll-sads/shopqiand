import { BUTTON_SIZE, EDGE_MARGIN, BOTTOM_NAV_HEIGHT, HIDDEN_OFFSET } from './constants';
import type { Position, ChatButtonSide } from './types';

export const constrainPosition = (x: number, y: number): Position => {
  const maxX = window.innerWidth - BUTTON_SIZE - EDGE_MARGIN;
  const maxY = window.innerHeight - BUTTON_SIZE - BOTTOM_NAV_HEIGHT - EDGE_MARGIN;
  return {
    x: Math.max(EDGE_MARGIN, Math.min(maxX, x)),
    y: Math.max(EDGE_MARGIN, Math.min(maxY, y)),
  };
};

export const snapToEdge = (position: Position): { position: Position; side: ChatButtonSide } => {
  const centerX = window.innerWidth / 2;
  const side: ChatButtonSide = position.x + BUTTON_SIZE / 2 < centerX ? 'left' : 'right';
  const targetX =
    side === 'left' ? EDGE_MARGIN : window.innerWidth - BUTTON_SIZE - EDGE_MARGIN;
  return {
    position: { x: targetX, y: position.y },
    side,
  };
};

export const getHiddenPosition = (position: Position, side: ChatButtonSide): Position => {
  const hiddenX =
    side === 'left' ? -BUTTON_SIZE + HIDDEN_OFFSET : window.innerWidth - HIDDEN_OFFSET;
  return { x: hiddenX, y: position.y };
};

export const getDefaultPosition = (): Position => ({
  x: window.innerWidth - BUTTON_SIZE - EDGE_MARGIN,
  y: window.innerHeight - BUTTON_SIZE - BOTTOM_NAV_HEIGHT - EDGE_MARGIN,
});
