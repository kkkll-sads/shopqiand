export type ChatButtonSide = 'left' | 'right';

export interface Position {
  x: number;
  y: number;
}

export interface DragRuntimeState {
  position: Position;
  dragStart: Position;
  pointerStart: Position;
  isDragging: boolean;
  isPressed: boolean;
  hasMoved: boolean;
  rafId: number | null;
  longPressTimer: number | null;
  hideTimer: number | null;
  side: ChatButtonSide;
}
