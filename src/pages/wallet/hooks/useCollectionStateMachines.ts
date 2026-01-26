/**
 * 藏品页面状态机配置
 * 复用全局状态机配置
 */
import { useStateMachine } from '@/hooks/useStateMachine';
import {
  loadingMachineConfig,
  formMachineConfig,
  LoadingState,
  LoadingEvent,
  FormState,
  FormEvent,
} from '@/hooks/stateMachineConfigs';

/**
 * 藏品页面状态机 Hook
 * 提供所有需要的状态机实例
 */
export function useCollectionStateMachines() {
  const loadMachine = useStateMachine<LoadingState, LoadingEvent>(loadingMachineConfig);
  const actionMachine = useStateMachine<FormState, FormEvent>(formMachineConfig);
  const batchConsignMachine = useStateMachine<FormState, FormEvent>(formMachineConfig);
  const checkBatchMachine = useStateMachine<LoadingState, LoadingEvent>(loadingMachineConfig);

  return {
    loadMachine,
    actionMachine,
    batchConsignMachine,
    checkBatchMachine,
    // 便捷状态
    loading: loadMachine.state === LoadingState.LOADING,
    actionLoading: actionMachine.state === FormState.SUBMITTING,
    batchConsignLoading: batchConsignMachine.state === FormState.SUBMITTING,
    checkingBatchConsignable: checkBatchMachine.state === LoadingState.LOADING,
  };
}

export { LoadingState, LoadingEvent, FormState, FormEvent };
