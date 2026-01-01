/**
 * useStateMachine - 通用状态机 Hook
 *
 * 功能说明：
 * - 提供类型安全的状态管理
 * - 确保状态转换的互斥性和可控性
 * - 支持状态转换守卫（guard functions）
 * - 自动追踪状态转换历史（便于调试）
 *
 * @author 树交所前端团队
 * @version 1.0.0
 * @created 2025-12-29
 */

import { useState, useCallback, useRef } from 'react';
import { debugLog, warnLog } from '../utils/logger';

/**
 * 状态转换配置
 */
interface StateTransition<TState extends string, TEvent extends string> {
  /** 目标状态 */
  target: TState;
  /** 守卫函数：返回false时阻止转换 */
  guard?: () => boolean;
  /** 转换副作用（可选） */
  effect?: () => void;
}

/**
 * 状态机配置
 */
interface StateMachineConfig<
  TState extends string,
  TEvent extends string,
  TContext extends Record<string, any> = Record<string, any>
> {
  /** 初始状态 */
  initial: TState;
  /** 状态转换表 */
  transitions: Record<TState, Partial<Record<TEvent, TState | StateTransition<TState, TEvent>>>>;
  /** 上下文数据 */
  context?: TContext;
  /** 是否启用调试日志 */
  debug?: boolean;
}

/**
 * 状态机返回值
 */
interface StateMachineReturn<
  TState extends string,
  TEvent extends string,
  TContext extends Record<string, any>
> {
  /** 当前状态 */
  state: TState;
  /** 上下文数据 */
  context: TContext;
  /** 检查是否可以触发某个事件 */
  can: (event: TEvent) => boolean;
  /** 触发状态转换 */
  send: (event: TEvent, payload?: Partial<TContext>) => boolean;
  /** 直接设置状态（仅在特殊情况使用） */
  setState: (state: TState) => void;
  /** 更新上下文 */
  setContext: (updater: ((prev: TContext) => TContext) | Partial<TContext>) => void;
  /** 获取状态转换历史（调试用） */
  getHistory: () => Array<{ from: TState; event: TEvent; to: TState; timestamp: number }>;
}

/**
 * useStateMachine Hook
 *
 * @param config - 状态机配置
 * @returns 状态机控制器
 *
 * @example
 * ```tsx
 * enum LoadingState {
 *   IDLE = 'idle',
 *   LOADING = 'loading',
 *   SUCCESS = 'success',
 *   ERROR = 'error',
 * }
 *
 * const { state, can, send } = useStateMachine({
 *   initial: LoadingState.IDLE,
 *   transitions: {
 *     idle: { LOAD: 'loading' },
 *     loading: { SUCCESS: 'success', ERROR: 'error' },
 *     success: { RELOAD: 'loading' },
 *     error: { RETRY: 'loading' },
 *   },
 * });
 *
 * // 使用
 * <button onClick={() => send('LOAD')} disabled={!can('LOAD')}>
 *   {state === 'loading' ? 'Loading...' : 'Load Data'}
 * </button>
 * ```
 */
export function useStateMachine<
  TState extends string,
  TEvent extends string,
  TContext extends Record<string, any> = Record<string, any>
>(
  config: StateMachineConfig<TState, TEvent, TContext>
): StateMachineReturn<TState, TEvent, TContext> {
  const [state, setState] = useState<TState>(config.initial);
  const [context, setContext] = useState<TContext>((config.context || {}) as TContext);

  // 状态转换历史记录（便于调试）
  const historyRef = useRef<Array<{
    from: TState;
    event: TEvent;
    to: TState;
    timestamp: number;
  }>>([]);

  /**
   * 检查是否可以触发某个事件
   */
  const can = useCallback((event: TEvent): boolean => {
    const currentStateConfig = config.transitions[state];
    if (!currentStateConfig) return false;

    const transition = currentStateConfig[event];
    if (!transition) return false;

    // 如果有守卫函数，检查守卫条件
    if (typeof transition === 'object' && transition.guard) {
      return transition.guard();
    }

    return true;
  }, [state, config.transitions]);

  /**
   * 触发状态转换
   *
   * @param event - 事件名称
   * @param payload - 上下文更新数据（可选）
   * @returns 是否成功转换
   */
  const send = useCallback((event: TEvent, payload?: Partial<TContext>): boolean => {
    const currentStateConfig = config.transitions[state];

    if (!currentStateConfig) {
      if (config.debug) {
        warnLog('stateMachine.send', `No transitions defined for state: ${state}`);
      }
      return false;
    }

    const transition = currentStateConfig[event];

    if (!transition) {
      if (config.debug) {
        warnLog('stateMachine.send', `Invalid transition: ${state} + ${event}`);
      }
      return false;
    }

    // 解析转换配置
    let nextState: TState;
    let guard: (() => boolean) | undefined;
    let effect: (() => void) | undefined;

    if (typeof transition === 'string') {
      // 简单转换：直接指定目标状态
      nextState = transition as TState;
    } else {
      // 复杂转换：包含守卫和副作用
      nextState = transition.target;
      guard = transition.guard;
      effect = transition.effect;
    }

    // 检查守卫条件
    if (guard && !guard()) {
      if (config.debug) {
        warnLog('stateMachine.send', `Transition blocked by guard: ${state} + ${event}`);
      }
      return false;
    }

    // 记录状态转换历史
    historyRef.current.push({
      from: state,
      event,
      to: nextState,
      timestamp: Date.now(),
    });

    // 限制历史记录长度（保留最近50条）
    if (historyRef.current.length > 50) {
      historyRef.current = historyRef.current.slice(-50);
    }

    if (config.debug) {
      debugLog('stateMachine.send', `Transition: ${state} --[${event}]--> ${nextState}`, {
        payload,
      });
    }

    // 执行状态转换
    setState(nextState);

    // 更新上下文
    if (payload) {
      setContext((prev) => ({ ...prev, ...payload }));
    }

    // 执行副作用
    if (effect) {
      effect();
    }

    return true;
  }, [state, config.transitions, config.debug]);

  /**
   * 获取状态转换历史（调试用）
   */
  const getHistory = useCallback(() => {
    return [...historyRef.current];
  }, []);

  return {
    state,
    context,
    can,
    send,
    setState,
    setContext,
    getHistory,
  };
}

export default useStateMachine;
