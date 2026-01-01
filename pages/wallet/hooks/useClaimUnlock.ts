import { useCallback, useState } from 'react';
import {
  checkOldAssetsUnlockStatus,
  unlockOldAssets,
  type CheckOldAssetsUnlockStatusResult,
} from '../../../services/user';
import { getStoredToken } from '../../../services/client';
import { UserInfo } from '../../../types';
import { isSuccess, extractData, extractError } from '../../../utils/apiHelpers';

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
    referralTarget: 3,
    canUnlock: false,
    isLoading: true,
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
          referralTarget: 3,
          canUnlock: conditions.is_qualified,
          isLoading: false,
          unlockConditions: conditions,
          requiredGold: data.required_gold,
          currentGold: data.current_gold,
          canUnlockDirect: data.can_unlock,
          alreadyUnlocked: data.unlock_status === 1,
          unlockedCount: data.unlocked_count || 0,
          availableQuota: data.available_quota || 0,
        });
      } else {
        setUnlockStatus((prev) => ({
          ...prev,
          isLoading: false,
        }));
      }
    } catch (error) {
      console.error('获取解锁状态失败:', error);
      setUnlockStatus((prev) => ({
        ...prev,
        isLoading: false,
      }));
    }
  }, [showToast]);

  const handleUnlockLegacy = useCallback(async () => {
    // Priority check using the current_gold returned by the check API
    const currentBalance = unlockStatus.currentGold ?? Number(userInfo?.confirm_rights_gold || 0);
    const requiredAmount = unlockStatus.requiredGold || 1000;

    if (currentBalance < requiredAmount) {
      showToast('warning', '余额不足', `待激活确权金不足 ${requiredAmount}`);
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
      const data = extractData(res);
      if (data) {
        if (data.unlock_status === 1) {
          showToast(
            'success',
            '解锁成功',
            `权益资产包 ¥${data.reward_equity_package} 与 ${data.reward_consignment_coupon} 张寄售券已发放`,
          );

          if (userInfo && data.consumed_gold) {
            setUserInfo({
              ...userInfo,
              confirm_rights_gold: Number(userInfo.confirm_rights_gold) - data.consumed_gold,
            });
          }

          await loadUnlockStatus(token);
        } else {
          const messages = data.unlock_conditions?.messages || [];
          if (messages.length > 0) {
            showToast('warning', '解锁失败', messages.join('; '));
          } else {
            showToast('warning', '解锁失败', '条件未满足');
          }
        }
      } else {
        showToast('error', '解锁失败', extractError(res, '解锁失败，请重试'));
      }
    } catch (error: any) {
      console.error('解锁旧资产失败:', error);
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

