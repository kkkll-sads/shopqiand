/**
 * 通用状态机配置
 * 
 * 提供预定义的状态机配置，避免在各个组件中重复定义
 * 
 * @example
 * ```ts
 * // 方式1：使用预封装的 hook（推荐）
 * import { useLoadingMachine, useFormMachine } from '@/hooks';
 * const loadMachine = useLoadingMachine();
 * 
 * // 方式2：使用配置对象
 * import { useStateMachine } from '@/hooks/useStateMachine';
 * import { loadingMachineConfig } from '@/hooks/stateMachineConfigs';
 * const loadMachine = useStateMachine(loadingMachineConfig);
 * ```
 */
import { LoadingState, LoadingEvent, FormState, FormEvent } from '@/types/states';
import { useStateMachine } from './useStateMachine';

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

// ========================================
// 预封装的 Hook 工厂函数
// ========================================

/**
 * 预封装的加载状态机 Hook
 * 
 * 直接返回配置好的状态机，无需重复定义转换配置
 * 
 * @example
 * ```tsx
 * const loadMachine = useLoadingMachine();
 * const loading = loadMachine.state === LoadingState.LOADING;
 * 
 * useEffect(() => {
 *   const fetchData = async () => {
 *     loadMachine.send(LoadingEvent.LOAD);
 *     try {
 *       const data = await api.getData();
 *       loadMachine.send(LoadingEvent.SUCCESS);
 *     } catch (err) {
 *       loadMachine.send(LoadingEvent.ERROR);
 *     }
 *   };
 *   fetchData();
 * }, []);
 * ```
 */
export function useLoadingMachine() {
  return useStateMachine<LoadingState, LoadingEvent>(loadingMachineConfig);
}

/**
 * 预封装的表单状态机 Hook
 * 
 * 适用于表单验证和提交场景
 * 
 * @example
 * ```tsx
 * const formMachine = useFormMachine();
 * const submitting = formMachine.state === FormState.SUBMITTING;
 * 
 * const handleSubmit = async (values: FormData) => {
 *   formMachine.send(FormEvent.SUBMIT);
 *   try {
 *     await api.submit(values);
 *     formMachine.send(FormEvent.SUBMIT_SUCCESS);
 *   } catch (err) {
 *     formMachine.send(FormEvent.SUBMIT_ERROR);
 *   }
 * };
 * ```
 */
export function useFormMachine() {
  return useStateMachine<FormState, FormEvent>(formMachineConfig);
}
