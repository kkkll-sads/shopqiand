/**
 * Hooks 统一导出
 */
export { default as useModal } from './useModal';
export { useErrorHandler } from './useErrorHandler';
export { useStateMachine } from './useStateMachine';
export { default as useAssetActionModal } from './useAssetActionModal';
export { default as useAssetTabs } from './useAssetTabs';
export { default as useRealNameAuth } from './useRealNameAuth';
export { default as useCashier } from './useCashier';

// 状态机配置
export {
  loadingMachineConfig,
  formMachineConfig,
  LoadingState,
  LoadingEvent,
  FormState,
  FormEvent,
} from './stateMachineConfigs';

// 新路由相关 hooks（从 src/hooks 重导出）
export { useRouteNavigation } from '../src/hooks/useRouteNavigation';
