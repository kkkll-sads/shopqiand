import React, { useEffect, useMemo, useState } from 'react';
import {
  fetchProfile,
  normalizeAssetUrl,
  fetchShopOrderStatistics,
  type ShopOrderStatistics,
  fetchSignInInfo,
} from '@/services';
import { getStoredToken } from '@/services/client';
import type { UserInfo } from '@/types';
import { useAuthStore } from '@/stores/authStore';
import { useUnreadNewsCount } from '@/stores/appStore';
import { isSuccess, extractData } from '@/utils/apiHelpers';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useNavigate } from 'react-router-dom';
import { useStateMachine } from '@/hooks/useStateMachine';
import { LoadingEvent, LoadingState } from '@/types/states';
import { debugLog, warnLog, errorLog } from '@/utils/logger';
import ProfileHeader from './components/ProfileHeader';
import ProfileBalanceCard from './components/ProfileBalanceCard';
import ProfileSectionGrid from './components/ProfileSectionGrid';
import { getUserTypeLabel } from './helpers';
import {
  buildConvenientServices,
  buildRightsManagement,
  buildPointsOrder,
  buildServiceManagement,
} from './sectionBuilders';

const Profile: React.FC<{ unreadCount?: number }> = ({ unreadCount: propUnreadCount }) => {
  const navigate = useNavigate();
  const storeUnreadCount = useUnreadNewsCount();
  const unreadCount = propUnreadCount ?? storeUnreadCount;

  const { errorMessage, hasError, handleError, clearError } = useErrorHandler();

  const storedUser = useAuthStore((state) => state.user);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(storedUser);
  const [orderStats, setOrderStats] = useState<ShopOrderStatistics | null>(null);
  const [hasSignedToday, setHasSignedToday] = useState<boolean>(false);

  const loadMachine = useStateMachine<LoadingState, LoadingEvent>({
    initial: LoadingState.IDLE,
    transitions: {
      [LoadingState.IDLE]: { [LoadingEvent.LOAD]: LoadingState.LOADING },
      [LoadingState.LOADING]: {
        [LoadingEvent.SUCCESS]: LoadingState.SUCCESS,
        [LoadingEvent.ERROR]: LoadingState.ERROR,
      },
      [LoadingState.SUCCESS]: {
        [LoadingEvent.LOAD]: LoadingState.LOADING,
        [LoadingEvent.RETRY]: LoadingState.LOADING,
      },
      [LoadingState.ERROR]: {
        [LoadingEvent.LOAD]: LoadingState.LOADING,
        [LoadingEvent.RETRY]: LoadingState.LOADING,
      },
    },
  });

  const { realName, updateUser } = useAuthStore();

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      handleError('未检测到登录信息，请重新登录', {
        persist: true,
        showToast: false,
      });
      return;
    }

    let isMounted = true;

    const loadProfile = async () => {
      loadMachine.send(LoadingEvent.LOAD);
      try {
        const response = await fetchProfile(token);
        if (!isMounted) return;

        if (isSuccess(response) && response.data?.userInfo) {
          setUserInfo(response.data.userInfo);
          updateUser(response.data.userInfo);
          clearError();
          loadMachine.send(LoadingEvent.SUCCESS);
        } else {
          handleError(response, {
            persist: true,
            showToast: false,
            customMessage: '获取用户信息失败',
          });
          loadMachine.send(LoadingEvent.ERROR);
        }
      } catch (err: any) {
        if (!isMounted) return;
        handleError(err, {
          persist: true,
          showToast: false,
          customMessage: '获取个人信息失败',
        });
        loadMachine.send(LoadingEvent.ERROR);
      }
    };

    const loadOrderStats = async () => {
      try {
        const res = await fetchShopOrderStatistics(token);
        if (isSuccess(res) && res.data) {
          setOrderStats(res.data);
        }
      } catch (e) {
        errorLog('Profile', '加载订单统计失败', e);
      }
    };

    const loadSignInStatus = async () => {
      try {
        debugLog('Profile', '开始加载签到状态');
        const res = await fetchSignInInfo(token);
        debugLog('Profile', '签到状态API响应', res);

        const signInData = extractData(res);
        if (signInData) {
          const hasSign = signInData.today_signed || false;
          debugLog('Profile', '今日是否已签到', hasSign);
          setHasSignedToday(hasSign);
        } else {
          warnLog('Profile', '签到状态API返回异常', res);
          setHasSignedToday(false);
        }
      } catch (e) {
        errorLog('Profile', '加载签到状态失败', e);
        setHasSignedToday(false);
      }
    };

    loadProfile();
    loadOrderStats();
    loadSignInStatus();

    const handleFocus = () => {
      loadSignInStatus();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      isMounted = false;
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const displayName = realName || userInfo?.nickname || userInfo?.username || '用户';
  const displayAvatarText = displayName.slice(0, 1).toUpperCase();
  const displayAvatarUrl = normalizeAssetUrl(userInfo?.avatar);
  const displayId = getUserTypeLabel(userInfo?.user_type);

  const convenientServices = useMemo(
    () => buildConvenientServices({ navigate, hasSignedToday }),
    [navigate, hasSignedToday]
  );
  const rightsManagement = useMemo(() => buildRightsManagement(navigate), [navigate]);
  const pointsOrder = useMemo(() => buildPointsOrder(navigate, orderStats), [navigate, orderStats]);
  const serviceManagement = useMemo(() => buildServiceManagement(navigate), [navigate]);

  return (
    <div className="pb-24 min-h-screen bg-gray-50">
      <div className="absolute top-0 left-0 right-0 h-72 bg-gradient-to-b from-red-100 to-gray-50 z-0"></div>

      <ProfileHeader
        userInfo={userInfo}
        displayName={displayName}
        displayAvatarText={displayAvatarText}
        displayAvatarUrl={displayAvatarUrl}
        displayId={displayId}
        unreadCount={unreadCount}
        onNavigate={(path) => navigate(path)}
      />

      <ProfileBalanceCard userInfo={userInfo} onNavigate={(path) => navigate(path)} />

      {hasError && !userInfo && !errorMessage.includes('登录态过期') && (
        <div className="mx-4 mt-4 bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg shadow-sm">
          {errorMessage}
        </div>
      )}

      <div className="px-4 mt-2 relative z-10 space-y-4">
        <ProfileSectionGrid title="便捷服务" items={convenientServices} />

        <ProfileSectionGrid title="权益管理" items={rightsManagement} />

        <ProfileSectionGrid title="消费金订单" items={pointsOrder} />

        <ProfileSectionGrid
          title="服务管理"
          items={serviceManagement}
          gridClassName="grid grid-cols-4 gap-y-6 gap-x-4"
          defaultLabelClassName="text-xs text-gray-500"
          defaultIconStrokeWidth={1.5}
        />
      </div>
    </div>
  );
};

export default Profile;
