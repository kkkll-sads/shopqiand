import { useCallback, useMemo } from 'react';
import { oldAssetsApi, type OldAssetsUnlockStatusRaw } from '../api';
import type { UnlockStatusState } from '../features/rights/types';
import { useRequest } from './useRequest';
import { useAuthSession } from './useAuthSession';

function mapStatusToUnlockState(raw: OldAssetsUnlockStatusRaw | null): UnlockStatusState {
  if (!raw) {
    return {
      currentGold: undefined,
      canUnlock: false,
      alreadyUnlocked: false,
      unlockedCount: undefined,
      availableQuota: undefined,
      requiredGold: undefined,
      rewardValue: undefined,
      isLoading: false,
      hasSelfTrade: false,
      requiredTransactions: undefined,
      activeReferrals: undefined,
      requiredReferrals: undefined,
      referralTarget: undefined,
    };
  }

  const cond = raw.unlock_conditions;
  const hasSelfTrade = cond?.has_transaction ?? false;
  const qualifiedCount = cond?.qualified_referrals;
  const requiredRef = raw.required_referrals;

  return {
    currentGold: raw.current_gold,
    canUnlock: raw.can_unlock ?? false,
    alreadyUnlocked: raw.unlock_status === 1,
    unlockedCount: raw.unlock_status === 1 ? 1 : 0,
    availableQuota: raw.can_unlock ? 1 : 0,
    requiredGold: raw.required_gold,
    rewardValue: raw.reward_value,
    isLoading: false,
    hasSelfTrade,
    requiredTransactions: raw.required_transactions,
    activeReferrals: qualifiedCount,
    requiredReferrals: requiredRef,
    referralTarget: requiredRef,
    unlockConditions: {
      transaction_count: cond?.transaction_count,
    },
  };
}

export function useOldAssetsUnlock() {
  const { isAuthenticated } = useAuthSession();

  const {
    data: statusRaw,
    loading: statusLoading,
    error: statusError,
    reload: reloadStatus,
  } = useRequest(
    (signal) => oldAssetsApi.checkStatus({ signal }),
    {
      cacheKey: 'old-assets:unlock-status',
      manual: !isAuthenticated,
    },
  );

  const unlockStatus = useMemo(
    () => mapStatusToUnlockState(statusRaw ?? null),
    [statusRaw],
  );

  const unlockStatusWithLoading = useMemo(
    () => ({
      ...unlockStatus,
      isLoading: statusLoading,
    }),
    [unlockStatus, statusLoading],
  );

  const unlock = useCallback(async () => {
    await oldAssetsApi.unlock();
    await reloadStatus();
  }, [reloadStatus]);

  return {
    unlockStatus: unlockStatusWithLoading,
    statusError,
    reloadStatus,
    unlock,
  };
}
