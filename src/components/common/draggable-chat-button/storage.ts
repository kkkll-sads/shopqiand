import { HIDDEN_STORAGE_KEY, STORAGE_KEY } from './constants';
import type { Position } from './types';

export const getInitialHiddenState = () => {
  try {
    return sessionStorage.getItem(HIDDEN_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
};

export const setHiddenState = (hidden: boolean) => {
  try {
    sessionStorage.setItem(HIDDEN_STORAGE_KEY, String(hidden));
  } catch {
    // ignore storage failure
  }
};

export const savePositionToStorage = (position: Position) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
  } catch {
    // ignore storage failure
  }
};

export const loadPositionFromStorage = (): Position | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
      return parsed as Position;
    }
    return null;
  } catch {
    return null;
  }
};
