/**
 * 通用状态机配置
 * 
 * 提供预定义的状态机配置，避免在各个组件中重复定义
 * 
 * @example
 * ```ts
 * import { useStateMachine } from './useStateMachine';
 * import { loadingMachineConfig, formMachineConfig } from './stateMachineConfigs';
 * 
 * // 使用加载状态机
 * const loadMachine = useStateMachine(loadingMachineConfig);
 * 
 * // 使用表单状态机
 * const formMachine = useStateMachine(formMachineConfig);
 * ```
 */
import { LoadingState, LoadingEvent, FormState, FormEvent } from '../types/states';

/**
 * 通用加载状态机配置
 * 
 * 状态流转：
 * IDLE -> LOADING (LOAD)
 * LOADING -> SUCCESS (SUCCESS) | ERROR (ERROR)
 * SUCCESS -> LOADING (LOAD/RETRY)
 * ERROR -> LOADING (LOAD/RETRY)
 */
export const loadingMachineConfig = {
  initial: LoadingState.IDLE as LoadingState,
  transitions: {
    [LoadingState.IDLE]: { 
      [LoadingEvent.LOAD]: LoadingState.LOADING 
    },
    [LoadingState.LOADING]: {
      [LoadingEvent.SUCCESS]: LoadingState.SUCCESS,
      [LoadingEvent.ERROR]: LoadingState.ERROR,
    },
    [LoadingState.SUCCESS]: {
      [LoadingEvent.LOAD]: LoadingState.LOADING,
      [LoadingEvent.RETRY]: LoadingState.LOADING,
      [LoadingEvent.RESET]: LoadingState.IDLE,
    },
    [LoadingState.ERROR]: {
      [LoadingEvent.LOAD]: LoadingState.LOADING,
      [LoadingEvent.RETRY]: LoadingState.LOADING,
      [LoadingEvent.RESET]: LoadingState.IDLE,
    },
  },
};

/**
 * 表单/操作状态机配置
 * 
 * 状态流转：
 * IDLE -> VALIDATING (VALIDATE) | SUBMITTING (SUBMIT)
 * VALIDATING -> SUBMITTING (VALIDATION_SUCCESS) | ERROR (VALIDATION_ERROR)
 * SUBMITTING -> SUCCESS (SUBMIT_SUCCESS) | ERROR (SUBMIT_ERROR)
 * SUCCESS -> SUBMITTING (SUBMIT) | IDLE (RESET)
 * ERROR -> SUBMITTING (SUBMIT) | IDLE (RESET)
 */
export const formMachineConfig = {
  initial: FormState.IDLE as FormState,
  transitions: {
    [FormState.IDLE]: { 
      [FormEvent.VALIDATE]: FormState.VALIDATING,
      [FormEvent.SUBMIT]: FormState.SUBMITTING,
    },
    [FormState.VALIDATING]: {
      [FormEvent.VALIDATION_SUCCESS]: FormState.SUBMITTING,
      [FormEvent.VALIDATION_ERROR]: FormState.ERROR,
    },
    [FormState.SUBMITTING]: {
      [FormEvent.SUBMIT_SUCCESS]: FormState.SUCCESS,
      [FormEvent.SUBMIT_ERROR]: FormState.ERROR,
    },
    [FormState.SUCCESS]: {
      [FormEvent.SUBMIT]: FormState.SUBMITTING,
      [FormEvent.RESET]: FormState.IDLE,
      [FormEvent.RETRY]: FormState.SUBMITTING,
    },
    [FormState.ERROR]: {
      [FormEvent.SUBMIT]: FormState.SUBMITTING,
      [FormEvent.RESET]: FormState.IDLE,
      [FormEvent.RETRY]: FormState.SUBMITTING,
    },
  },
};

/**
 * 状态机配置类型
 */
export type LoadingMachineConfig = typeof loadingMachineConfig;
export type FormMachineConfig = typeof formMachineConfig;

// 重导出状态和事件枚举
export { LoadingState, LoadingEvent, FormState, FormEvent };
