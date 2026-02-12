import { getStoredToken } from '@/services/client';
import { fetchProfile } from '@/services/user/profile';
import { fetchRealNameStatus } from '@/services/user/realname';
import { extractData, isSuccess } from '@/utils/apiHelpers';
import { warnLog } from '@/utils/logger';
import type { ChatWidgetConfig } from './types';

export const getCurrentUserInfo = async (): Promise<ChatWidgetConfig['userInfo']> => {
  try {
    const token = getStoredToken();
    if (!token) {
      return undefined;
    }

    const [profileRes, realNameRes] = await Promise.all([
      fetchProfile(token),
      fetchRealNameStatus(token),
    ]);

    const profileData = extractData(profileRes);
    const realNameData = isSuccess(realNameRes) ? realNameRes.data : null;

    if (profileData?.userInfo) {
      const user = profileData.userInfo;

      let userName = '用户';
      if (realNameData?.real_name && realNameData.real_name_status === 2) {
        userName = realNameData.real_name;
      } else if (user.nickname) {
        userName = user.nickname;
      } else if (user.username) {
        userName = user.username;
      }

      return {
        userName,
        phone: user.mobile || undefined,
        pid: String(user.id || ''),
        params: JSON.stringify({
          source: 'app',
          platform: 'web',
          userId: user.id,
          realNameVerified: realNameData?.real_name_status === 2,
        }),
      };
    }
  } catch (error) {
    warnLog('ChatWidget', '获取用户信息失败', error);
  }

  return undefined;
};
