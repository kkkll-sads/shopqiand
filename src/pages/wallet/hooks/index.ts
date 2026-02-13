/**
 * 钱包页面 Hooks 导出
 */

// 藏品相关
export { useCollectionStateMachines, loadingMachineConfig, formMachineConfig } from './useCollectionStateMachines';
export { useCollectionCache } from './useCollectionCache';
export { useCollectionFilters, deduplicateCollections } from './useCollectionFilters';
export { useCollectionData } from './useCollectionData';
export {
  useConsignmentAction,
  resolveCollectionId,
  check48Hours,
  hasConsignedBefore,
  hasConsignedSuccessfully,
  isConsigning,
  isDelivered,
  formatSeconds,
} from './useConsignmentAction';

// 提货相关
export { useClaimData } from './useClaimData';
export { useClaimForm } from './useClaimForm';
export { useClaimSubmit } from './useClaimSubmit';
export { useClaimUnlock } from './useClaimUnlock';
export { useClaimUpload } from './useClaimUpload';
export { useGrowthRights } from './useGrowthRights';
export { useImageUploads } from './useImageUploads';

// 类型导出
export type { CategoryTab, CollectionCacheState } from './useCollectionCache';
export type { FilterState } from './useCollectionFilters';
