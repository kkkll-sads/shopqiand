import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  CreditCard,
  FileText,
  HeadphonesIcon,
  Heart,
  HelpCircle,
  Info,
  Landmark,
  Lock,
  LogOut,
  MapPin,
  MessageSquare,
  Package,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Ticket,
  Truck,
  Users,
  Wallet,
  Zap,
  Coins,
  Banknote,
  ChevronRight,
  CircleDollarSign,
} from 'lucide-react';
import { accountApi, userApi } from '../../api';
import { messageApi } from '../../api/modules/message';

import ProfileBalanceCard from './components/ProfileBalanceCard';
import ProfileHeader from './components/ProfileHeader';
import ProfileSectionGrid from './components/ProfileSectionGrid';
import {
  buildPointsOrder,
  buildRightsManagement,
  buildConvenientServices,
  buildServiceManagement,
} from './userProfileMenus';
import { OfflineBanner } from '../../components/layout/OfflineBanner';
import { ActionSheet } from '../../components/ui/ActionSheet';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { PullToRefreshContainer } from '../../components/ui/PullToRefreshContainer';
import { useAuthSession } from '../../hooks/useAuthSession';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useRequest } from '../../hooks/useRequest';
import { useRouteScrollRestoration } from '../../hooks/useRouteScrollRestoration';
import { CURRENT_APP_VERSION, formatVersionLabel } from '../../lib/appVersion';
import { useAppNavigate } from '../../lib/navigation';

function formatMoney(value: number | string | undefined, fractionDigits = 2) {
  const nextValue = typeof value === 'string' ? Number(value) : value;
  if (typeof nextValue !== 'number' || !Number.isFinite(nextValue)) {
    return '--';
  }

  return nextValue.toLocaleString('zh-CN', {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
    useGrouping: false,
  });
}

function formatCount(value: number | string | undefined) {
  const nextValue = typeof value === 'string' ? Number(value) : value;
  if (typeof nextValue !== 'number' || !Number.isFinite(nextValue)) {
    return '--';
  }

  return nextValue.toLocaleString('zh-CN', {
    maximumFractionDigits: 0,
    useGrouping: false,
  });
}

export const UserPage = () => {
  const { goTo } = useAppNavigate();
  const { clearAuthSession, isAuthenticated, session } = useAuthSession();
  const { isOffline, refreshStatus } = useNetworkStatus();
  const [loading, setLoading] = useState(true);
  const [showLogoutSheet, setShowLogoutSheet] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const isLoggedIn = isAuthenticated;
  const profileRequest = useRequest((signal) => accountApi.getProfile({ signal }), {
    deps: [isLoggedIn],
    manual: !isLoggedIn,
  });
  const profile = profileRequest.data;
  const profileLoading = profileRequest.loading;
  const accountOverviewRequest = useRequest((signal) => accountApi.getAccountOverview({ signal }), {
    deps: [isLoggedIn],
    manual: !isLoggedIn,
  });
  const accountOverview = accountOverviewRequest.data;
  const accountOverviewLoading = accountOverviewRequest.loading;
  const realNameRequest = useRequest((signal) => userApi.getRealNameStatus({ signal }), {
    deps: [isLoggedIn],
    manual: !isLoggedIn,
  });
  const realNameStatus = realNameRequest.data;
  const realNameLoading = realNameRequest.loading;
  const unreadRequest = useRequest((signal) => messageApi.unreadCount(signal), {
    deps: [isLoggedIn],
    manual: !isLoggedIn,
    cacheKey: 'messages:unread',
  });
  const unreadTotal = unreadRequest.data?.total ?? 0;
  const profileUserInfo = profile?.userInfo ?? session?.userInfo;
  const userInfo = (profileUserInfo ?? {}) as Record<string, unknown>;
  const displayName = String(
    userInfo.nickname ?? userInfo.username ?? userInfo.mobile ?? '会员用户',
  );
  const displayUid = String(userInfo.uid ?? userInfo.id ?? '--');
  const displayMobile =
    typeof userInfo.mobile === 'string' && userInfo.mobile.trim()
      ? userInfo.mobile.trim()
      : typeof userInfo.username === 'string' && userInfo.username.trim()
        ? userInfo.username.trim()
        : '会员账号';
  const displayAvatar =
    typeof userInfo.avatar === 'string' && userInfo.avatar.trim()
      ? userInfo.avatar.trim()
      : '';
  const isHeaderLoading =
    loading || (isLoggedIn && (profileLoading || accountOverviewLoading || realNameLoading));

  const assetItems = useMemo(
    () => [
      {
        icon: Coins,
        label: '专项金余额',
        value: formatMoney(accountOverview?.balance?.balanceAvailable ?? profile?.userInfo?.balanceAvailable),
      },
      {
        icon: Banknote,
        label: '可提现余额',
        value: formatMoney(
          accountOverview?.balance?.withdrawableMoney ?? profile?.userInfo?.withdrawableMoney,
        ),
      },
      {
        icon: ShoppingBag,
        label: '消费金',
        value: formatCount(accountOverview?.balance?.score ?? profile?.userInfo?.score),
      },
      {
        icon: Zap,
        label: '算力',
        value: formatMoney(accountOverview?.balance?.greenPower ?? profile?.userInfo?.greenPower),
      },
      {
        icon: ShieldCheck,
        label: '确权金',
        value: formatMoney(
          accountOverview?.balance?.serviceFeeBalance ?? profile?.userInfo?.serviceFeeBalance,
        ),
      },
      {
        icon: CircleDollarSign,
        label: '待激活确权金',
        value: formatMoney(profile?.userInfo?.pendingActivationGold),
      },
    ],
    [accountOverview, profile?.userInfo],
  );

  useEffect(() => {
    setLoading(true);
    const timer = window.setTimeout(() => {
      setLoading(false);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [isLoggedIn]);

  useRouteScrollRestoration({
    containerRef: scrollContainerRef,
    namespace: 'user-page',
    restoreDeps: [isHeaderLoading, isLoggedIn, loading],
    restoreWhen: !loading && !isHeaderLoading,
  });

  /** 下拉刷新回调 */
  const handleRefresh = useCallback(
    () => Promise.allSettled([
      profileRequest.reload(),
      accountOverviewRequest.reload(),
      realNameRequest.reload(),
    ]),
    [profileRequest, accountOverviewRequest, realNameRequest],
  );

  const handleLogout = () => {
    setIsLoggingOut(true);
    window.setTimeout(() => {
      clearAuthSession();
      setIsLoggingOut(false);
      setShowLogoutSheet(false);
      goTo('login');
    }, 300);
  };

  const renderHeader = () => {
    if (isHeaderLoading) {
      return (
        <div className="px-4 pt-4 pb-6 bg-gradient-to-b from-red-50 to-bg-base relative">
          <div className="absolute top-4 right-4 flex space-x-4">
            <Skeleton className="w-[22px] h-[22px] rounded-full" />
            <Skeleton className="w-[22px] h-[22px] rounded-full" />
          </div>
          <div className="mt-4 flex items-center space-x-4">
            <Skeleton className="w-16 h-16 rounded-full shrink-0" />
            <div className="flex flex-1 flex-col space-y-2">
              <Skeleton className="w-32 h-6" />
              <Skeleton className="w-24 h-4" />
              <Skeleton className="w-16 h-4 rounded-full" />
            </div>
          </div>
        </div>
      );
    }

    if (!isLoggedIn) {
      return (
        <div className="px-4 pt-4 pb-2 relative">
          <div className="absolute top-4 right-4 flex space-x-4 text-text-main">
            <Settings size={22} />
            <MessageSquare size={22} />
          </div>
          <div className="mt-4 flex items-center space-x-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white bg-border-light shadow-sm">
              <HeadphonesIcon size={28} className="text-text-sub" />
            </div>
            <div className="flex flex-col items-start">
              <h2 className="mb-1 text-2xl font-bold text-text-main">未登录</h2>
              <p className="mb-2 text-sm text-text-sub">登录后查看账户信息和业务数据</p>
              <button
                onClick={() => goTo('login')}
                className="rounded-full bg-gradient-to-r from-primary-start to-primary-end px-5 py-1.5 text-sm font-medium text-white shadow-sm"
              >
                登录 / 注册
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="pt-4 pb-2 relative z-10">
        <ProfileHeader
          userInfo={profileUserInfo ?? null}
          displayName={displayName}
          displayAvatarText={(displayName || '用').slice(0, 1)}
          displayAvatarUrl={displayAvatar}
          displayId={displayUid}
          unreadCount={unreadTotal}
          onNavigate={goTo}
        />
      </div>
    );
  };

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-bg-base">
      {isOffline && <OfflineBanner onAction={refreshStatus} className="absolute top-0 right-0 left-0 z-50" />}

      <PullToRefreshContainer
        onRefresh={handleRefresh}
        disabled={isOffline || !isLoggedIn}
      >
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto no-scrollbar min-h-0">
          {/* 背景装饰弧线 */}
          <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-red-50 to-bg-base dark:from-red-950/20 pointer-events-none z-0 rounded-b-[40px] scale-x-110"></div>

          {renderHeader()}

          <div className="relative z-10 space-y-4 pt-2">
          <ProfileBalanceCard 
            userInfo={profile?.userInfo}
            onNavigate={goTo}
          />
          
          <div className="px-4 space-y-4">
            {/* 我的订单板块 */}
            <Card className="p-4">
              <div
                className="flex items-center justify-between mb-4 cursor-pointer"
                onClick={() => goTo('order')}
              >
                <h3 className="text-base font-bold text-text-main">商城订单</h3>
                <span className="flex items-center text-xs text-text-aux">
                  全部订单 <ChevronRight size={14} />
                </span>
              </div>
              <ProfileSectionGrid 
                items={buildPointsOrder(goTo, null)}
                columns={4}
              />
            </Card>

            {/* 权益管理与服务 */}
            <Card className="p-4">
              <h3 className="text-base font-bold text-text-main mb-4">资产与权益库</h3>
              <ProfileSectionGrid 
                items={buildRightsManagement(goTo)} 
                columns={4}
              />
            </Card>

            <Card className="p-4">
              <h3 className="text-base font-bold text-text-main mb-4">便捷服务平台</h3>
              <ProfileSectionGrid 
                items={buildConvenientServices({ navigate: goTo, hasSignedToday: false })}
                columns={4}
              />
            </Card>

            <Card className="p-4 bg-transparent border-0 shadow-none !p-0">
              <h3 className="text-base font-bold text-text-main mb-2">服务与帮助</h3>
              <div className="bg-bg-card rounded-2xl p-4 shadow-sm border border-border-light">
                <ProfileSectionGrid items={buildServiceManagement(goTo)} columns={4} />
              </div>
            </Card>
          </div>

          {isLoggedIn && !loading && (
            <div className="px-4 pb-8 pt-4">
              <button
                onClick={() => setShowLogoutSheet(true)}
                className="flex h-[44px] w-full items-center justify-center rounded-xl border border-border-light bg-bg-card text-base font-medium text-text-main shadow-sm transition-colors active:bg-bg-base"
              >
                退出登录
              </button>
            </div>
          )}
          </div>
        </div>
      </PullToRefreshContainer>

      <ActionSheet
        isOpen={showLogoutSheet}
        onClose={() => setShowLogoutSheet(false)}
        title="确认退出登录？"
        groups={[
          {
            options: [
              {
                label: '退出登录',
                icon: <LogOut size={18} />,
                danger: true,
                loading: isLoggingOut,
                onClick: handleLogout,
              },
            ],
          },
        ]}
      />
    </div>
  );
};

export default UserPage;
