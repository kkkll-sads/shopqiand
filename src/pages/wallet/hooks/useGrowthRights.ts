import { useCallback, useState } from 'react';
import {
  fetchGrowthRightsInfo,
  unlockGrowthRightsAsset,
  type GrowthRightsInfoResult,
  type UnlockGrowthRightsAssetResult,
} from '@/services/user/assets';
import { getStoredToken } from '@/services/client';
import { extractData, extractError } from '@/utils/apiHelpers';
import { errorLog } from '@/utils/logger';

type ShowToast = (type: string, title: string, message?: string) => void;

export const useGrowthRights = (showToast: ShowToast) => {
  const [growthRights, setGrowthRights] = useState<GrowthRightsInfoResult | null>(null);
  const [growthLoading, setGrowthLoading] = useState(false);
  const [unlockingGrowth, setUnlockingGrowth] = useState(false);

  const loadGrowthRights = useCallback(
    async (token?: string) => {
      const authToken = token ?? getStoredToken();
      if (!authToken) {
        showToast('error', '登录过期', '请重新登录');
        return;
      }

      setGrowthLoading(true);
      try {
        const response = await fetchGrowthRightsInfo(authToken);
        const data = extractData(response);
        if (data) {
          setGrowthRights(data);
        } else {
          showToast('error', '加载失败', extractError(response, '获取成长权益信息失败'));
        }
      } catch (error: unknown) {
        errorLog('useGrowthRights', '获取成长权益信息失败', error);
        showToast('error', '加载失败', '获取成长权益信息失败');
      } finally {
        setGrowthLoading(false);
      }
    },
    [showToast]
  );

  return {
    growthRights,
    growthLoading,
    loadGrowthRights,
    unlockingGrowth,
    unlockGrowth: async (): Promise<UnlockGrowthRightsAssetResult | null> => {
      const authToken = getStoredToken();
      if (!authToken) {
        showToast('error', '登录过期', '请重新登录');
        return null;
      }

      if (unlockingGrowth) {
        return null;
      }

      setUnlockingGrowth(true);
      try {
        const response = await unlockGrowthRightsAsset(authToken);
        const data = extractData(response);
        if (!data) {
          showToast('error', '解锁失败', extractError(response, '成长权益藏品解锁失败'));
          return null;
        }
        showToast('success', '解锁成功', data.message || '成长权益藏品已发放，请前往我的藏品查看');
        return data;
      } catch (error: unknown) {
        errorLog('useGrowthRights', '解锁成长权益藏品失败', error);
        showToast('error', '解锁失败', '成长权益藏品解锁失败');
        return null;
      } finally {
        setUnlockingGrowth(false);
      }
    },
  };
};

export default useGrowthRights;
