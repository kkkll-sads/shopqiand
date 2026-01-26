import { useCallback, useState } from 'react';
import {
  checkOldAssetsUnlockStatus,
  unlockOldAssets,
  type CheckOldAssetsUnlockStatusResult,
} from '@/services/user';
import { getStoredToken } from '@/services/client';
import { UserInfo } from '@/types';
import { isSuccess, extractData, extractError } from '@/utils/apiHelpers';
import { errorLog } from '@/utils/logger';

export type UnlockStatusState = {
  hasSelfTrade: boolean;
  activeReferrals: number;
  referralTarget: number;
  canUnlock: boolean;
  isLoading: boolean;
  unlockConditions?: CheckOldAssetsUnlockStatusResult['unlock_conditions'];
  requiredGold?: number;
  currentGold?: number;
  canUnlockDirect?: boolean;
  alreadyUnlocked?: boolean;
  unlockedCount?: number;
  availableQuota?: number;
  // 配置化字段
  requiredTransactions?: number; // 所需交易次数
  requiredReferrals?: number; // 所需直推用户数
  rewardValue?: number; // 奖励价值
};

type UseClaimUnlockParams = {
  showToast: (type: string, title: string, message?: string) => void;
  userInfo: UserInfo | null;
  setUserInfo: (info: UserInfo) => void;
};

/**
 * 旧资产解锁状态与操作
 */
export const useClaimUnlock = ({ showToast, userInfo, setUserInfo }: UseClaimUnlockParams) => {
  const [unlockStatus, setUnlockStatus] = useState<UnlockStatusState>({
    hasSelfTrade: false,
    activeReferrals: 0,
    referralTarget: 3, // 默认值，后续会从后端更新
    canUnlock: false,
    isLoading: true,
    requiredTransactions: 1, // 默认值
    requiredReferrals: 3, // 默认值
    rewardValue: 1000, // 默认值
  });
  const [unlockLoading, setUnlockLoading] = useState(false);

  const loadUnlockStatus = useCallback(async (token?: string) => {
    const finalToken = token ?? getStoredToken();
    if (!finalToken) {
      showToast('error', '登录过期', '请重新登录');
      return;
    }

    setUnlockStatus((prev) => ({ ...prev, isLoading: true }));
    try {
      const res = await checkOldAssetsUnlockStatus(finalToken);
      const data = extractData(res);
      if (data) {
        const conditions = data.unlock_conditions;
        setUnlockStatus({
          hasSelfTrade: conditions.has_transaction,
          activeReferrals: conditions.qualified_referrals,
          referralTarget: (data as any).required_referrals || 3, // 从后端读取配置
          canUnlock: conditions.is_qualified,
          isLoading: false,
          unlockConditions: conditions,
          requiredGold: data.required_gold,
          currentGold: data.current_gold,
          canUnlockDirect: data.can_unlock,
          alreadyUnlocked: data.unlock_status === 1,
          unlockedCount: data.unlocked_count || 0,
          availableQuota: data.available_quota || 0,
          requiredTransactions: (data as any).required_transactions || 1, // 从后端读取配置
          requiredReferrals: (data as any).required_referrals || 3, // 从后端读取配置
          rewardValue: (data as any).reward_value || 1000, // 从后端读取配置
        });
      } else {
        setUnlockStatus((prev) => ({
          ...prev,
          isLoading: false,
        }));
      }
    } catch (error) {
      errorLog('useClaimUnlock', '获取解锁状态失败', error);
      setUnlockStatus((prev) => ({
        ...prev,
        isLoading: false,
      }));
    }
  }, [showToast]);

  const handleUnlockLegacy = useCallback(async () => {
    // Priority check using the current_gold returned by the check API
    const currentBalance = unlockStatus.currentGold ?? Number(userInfo?.confirm_rights_gold);
    const requiredAmount = unlockStatus.requiredGold;


    if (requiredAmount === undefined) {
      showToast('error', '配置错误', '无法获取所需确权金数量');
      return;
    }

    if (currentBalance === undefined) {
      showToast('error', '状态错误', '无法获取当前确权金余额');
      return;
    }

    if (!unlockStatus.canUnlock) {
      showToast('warning', '条件未满足', '请先满足解锁条件');
      return;
    }

    const token = getStoredToken();
    if (!token) {
      showToast('error', '登录过期', '请重新登录');
      return;
    }

    setUnlockLoading(true);
    try {
      const res = await unlockOldAssets(token);
      // 使用 isSuccess 判断是否成功
      if (isSuccess(res)) {
        const data = extractData(res);
        if (data) {
          // 优先使用响应中的 message 字段
          const successMessage = data.message || `已发放旧资产包（价值${data.reward_item_price || 1000}元）和寄售券x${data.reward_consignment_coupon || 1}，请前往"我的藏品"寄售变现`;
          showToast('success', '解锁成功', successMessage);

          if (userInfo && data.consumed_gold) {
            setUserInfo({
              ...userInfo,
              confirm_rights_gold: Number(userInfo.confirm_rights_gold) - data.consumed_gold,
            });
          }

          await loadUnlockStatus(token);
        }
      } else {
        // 失败情况，使用错误信息
        const errorMsg = extractError(res, '解锁失败，请重试');
        showToast('error', '解锁失败', errorMsg);
      }
    } catch (error: any) {
      errorLog('useClaimUnlock', '解锁旧资产失败', error);
      showToast('error', '解锁失败', error.message || '网络错误，请重试');
    } finally {
      setUnlockLoading(false);
    }
  }, [loadUnlockStatus, setUserInfo, showToast, unlockStatus.canUnlock, userInfo]);

  return {
    unlockStatus,
    unlockLoading,
    loadUnlockStatus,
    handleUnlockLegacy,
  };
};

export default useClaimUnlock;

