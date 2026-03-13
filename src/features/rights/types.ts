/** 解锁状态（供 UnlockPanel 等使用） */
export interface UnlockStatusState {
  currentGold?: number | string;
  canUnlock: boolean;
  alreadyUnlocked?: boolean;
  unlockedCount?: number;
  availableQuota?: number;
  requiredGold?: number;
  rewardValue?: number;
  isLoading?: boolean;
  hasSelfTrade?: boolean;
  requiredTransactions?: number;
  activeReferrals?: number;
  requiredReferrals?: number;
  referralTarget?: number;
  unlockConditions?: {
    transaction_count?: number;
  };
}
