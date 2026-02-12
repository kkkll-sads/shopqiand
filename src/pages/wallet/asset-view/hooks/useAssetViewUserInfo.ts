import { useEffect, useState } from 'react';
import { fetchProfile } from '@/services';
import { getStoredToken } from '@/services/client';
import type { UserInfo } from '@/types';
import { useAuthStore } from '@/stores/authStore';
import { extractData } from '@/utils/apiHelpers';
import { debugLog, errorLog } from '@/utils/logger';

export function useAssetViewUserInfo() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [consignmentTicketCount, setConsignmentTicketCount] = useState<number>(0);

  useEffect(() => {
    debugLog('AssetView', '寄售券数量变化', consignmentTicketCount);
  }, [consignmentTicketCount]);

  useEffect(() => {
    const loadUserInfo = async () => {
      const token = getStoredToken();
      if (!token) return;

      try {
        const response = await fetchProfile(token);
        const profileData = extractData(response);

        debugLog('AssetView', 'API响应数据', profileData);
        if (profileData?.userInfo) {
          debugLog('AssetView', '用户信息', profileData.userInfo);
          debugLog('AssetView', 'API中的寄售券数量', profileData.userInfo.consignment_coupon);
          setUserInfo(profileData.userInfo);
          useAuthStore.getState().updateUser(profileData.userInfo);
          const couponCount = profileData.userInfo.consignment_coupon || 0;
          debugLog('AssetView', '设置寄售券数量为', couponCount);
          setConsignmentTicketCount(couponCount);
        }
      } catch (error) {
        errorLog('AssetView', '加载用户信息失败', error);
      }
    };

    void loadUserInfo();
  }, []);

  return {
    userInfo,
    consignmentTicketCount,
  };
}
