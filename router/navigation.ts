import { useCallback, useMemo, useRef, useState } from 'react';
import { normalizeRoute, Route, RouteInput } from './routes';

export interface NavigateOptions {
  replace?: boolean;
  /**
   * 类型安全的返回路径，优先于历史栈
   */
  back?: Route | null;
  /**
   * 导航时是否清空历史记录
   */
  clearHistory?: boolean;
}

export type NavigateFn = (route: RouteInput, options?: NavigateOptions) => void;
export type GoBackFn = () => void;

/**
 * 统一管理路由栈，提供 navigate / goBack
 */
export function useNavigationStack(initialRoute: RouteInput = null) {
  const [current, setCurrent] = useState<Route | null>(() => normalizeRoute(initialRoute));
  const historyRef = useRef<Route[]>([]);

  const navigate = useCallback<NavigateFn>(
    (target, options) => {
      const normalized = normalizeRoute(target);
      if (options?.clearHistory) {
        historyRef.current = [];
      }
      if (!options?.replace && current) {
        historyRef.current = [...historyRef.current, current];
      }
      const nextRoute = normalized
        ? { ...normalized, back: options?.back ?? normalized.back ?? null }
        : null;
      setCurrent(nextRoute);
    },
    [current],
  );

  const goBack = useCallback<GoBackFn>(() => {
    setCurrent((prev) => {
      let next: Route | null = null;

      if (prev?.back) {
        next = normalizeRoute(prev.back);
        console.log('[goBack] Using route.back:', prev.back, '-> next:', next?.name ?? 'null');
      } else {
        const stack = [...historyRef.current];
        next = stack.pop() ?? null;
        historyRef.current = stack;
        console.log('[goBack] Popped from stack, remaining:', stack.length, '-> next:', next?.name ?? 'null');
      }

      return next;
    });
  }, []);

  const history = useMemo(() => historyRef.current, []);

  const reset = useCallback(() => {
    historyRef.current = [];
    setCurrent(null);
  }, []);

  return {
    current,
    history,
    navigate,
    goBack,
    reset,
  };
}

