import { useState, useCallback } from 'react';
import type { UnlockStatusState } from '../features/rights/types';

interface UseClaimUnlockOptions {
  initialStatus?: Partial<UnlockStatusState>;
}

/** 将后端/模拟解锁数据转为 UnlockPanel 所需格式 */
export function useClaimUnlock(options: UseClaimUnlockOptions = {}) {
  const [unlockStatus, setUnlockStatus] = useState<UnlockStatusState>(() => ({
    currentGold: 0,
    canUnlock: false,
    alreadyUnlocked: false,
    unlockedCount: 0,
    availableQuota: 0,
    requiredGold: 1000,
    rewardValue: 1000,
    isLoading: false,
    hasSelfTrade: false,
    requiredTransactions: 1,
    activeReferrals: 0,
    requiredReferrals: 0,
    referralTarget: 0,
    ...options.initialStatus,
  }));

  const updateUnlockStatus = useCallback((patch: Partial<UnlockStatusState>) => {
    setUnlockStatus((prev) => ({ ...prev, ...patch }));
  }, []);

  return { unlockStatus, updateUnlockStatus };
}
