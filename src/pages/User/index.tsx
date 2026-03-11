/**
 * @file User/index.tsx - 个人中心页面
 * @description 用户个人中心，展示个人信息、余额、订单入口、功能菜单等。
 */

import { useCallback, useEffect, useRef, useState } from 'react'; // React 核心 Hook
import { ChevronRight, HeadphonesIcon, LogOut, MessageSquare, Settings } from 'lucide-react';
import { accountApi, userApi } from '../../api';
import { messageApi } from '../../api/modules/message';
import { OfflineBanner } from '../../components/layout/OfflineBanner';
import { ActionSheet } from '../../components/ui/ActionSheet';
import { Card } from '../../components/ui/Card';
import { PullToRefreshContainer } from '../../components/ui/PullToRefreshContainer';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { Skeleton } from '../../components/ui/Skeleton';
import { useAuthSession } from '../../hooks/useAuthSession';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useRequest } from '../../hooks/useRequest';
import { useRouteScrollRestoration } from '../../hooks/useRouteScrollRestoration';
import { useAppNavigate } from '../../lib/navigation';
import { openCustomerServiceLink } from '../../lib/customerService';
import ProfileBalanceCard from './components/ProfileBalanceCard';
import ProfileHeader from './components/ProfileHeader';
import ProfileSectionGrid from './components/ProfileSectionGrid';
import {
  buildConvenientServices,
  buildPointsOrder,
  buildRightsManagement,
  buildServiceManagement,
} from './userProfileMenus';

export const UserPage = () => {
  const { goTo } = useAppNavigate();
  const { showToast } = useFeedback();
  const { clearAuthSession, isAuthenticated, session } = useAuthSession();
  const { isOffline, refreshStatus } = useNetworkStatus();
  const [loading, setLoading] = useState(true);
  const [showLogoutSheet, setShowLogoutSheet] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const isLoggedIn = isAuthenticated;
  const profileRequest = useRequest((signal) => accountApi.getProfile({ signal }), {
    cacheKey: 'user:profile',
    deps: [isLoggedIn],
    manual: !isLoggedIn,
  });
  const accountOverviewRequest = useRequest((signal) => accountApi.getAccountOverview({ signal }), {
    cacheKey: 'user:account-overview',
    deps: [isLoggedIn],
    manual: !isLoggedIn,
  });
  const realNameRequest = useRequest((signal) => userApi.getRealNameStatus({ signal }), {
    cacheKey: 'user:real-name-status',
    deps: [isLoggedIn],
    manual: !isLoggedIn,
  });
  const unreadRequest = useRequest((signal) => messageApi.unreadCount(signal), {
    cacheKey: 'messages:unread',
    deps: [isLoggedIn],
    manual: !isLoggedIn,
  });

  const profile = profileRequest.data;
  const profileLoading = profileRequest.loading;
  const accountOverviewLoading = accountOverviewRequest.loading;
  const realNameLoading = realNameRequest.loading;
  const unreadTotal = unreadRequest.data?.total ?? 0;
  const openSupport = useCallback(() => {
    void openCustomerServiceLink(({ duration, message, type }) => {
      showToast({ duration, message, type });
    });
  }, [showToast]);

  const profileUserInfo = profile?.userInfo ?? session?.userInfo;
  const userInfo = (profileUserInfo ?? {}) as Record<string, unknown>;
  const displayName = String(userInfo.nickname ?? userInfo.username ?? userInfo.mobile ?? '会员用户');
  const displayUid = String(userInfo.uid ?? userInfo.id ?? '--');
  const displayAvatar =
    typeof userInfo.avatar === 'string' && userInfo.avatar.trim() ? userInfo.avatar.trim() : '';

  const isHeaderLoading =
    loading || (isLoggedIn && (profileLoading || accountOverviewLoading || realNameLoading));
  const showContentSkeleton = isHeaderLoading;

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

  const handleRefresh = useCallback(
    () =>
      Promise.allSettled([
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
        <div className="relative bg-gradient-to-b from-red-50 to-bg-base px-4 pt-4 pb-6">
          <div className="absolute top-4 right-4 flex space-x-4">
            <Skeleton className="h-[22px] w-[22px] rounded-full" />
            <Skeleton className="h-[22px] w-[22px] rounded-full" />
          </div>
          <div className="mt-4 flex items-center space-x-4">
            <Skeleton className="h-16 w-16 shrink-0 rounded-full" />
            <div className="flex flex-1 flex-col space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16 rounded-full" />
            </div>
          </div>
        </div>
      );
    }

    if (!isLoggedIn) {
      return (
        <div className="relative px-4 pt-4 pb-2">
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
      <div className="relative z-10 pt-4 pb-2">
        <ProfileHeader
          userInfo={profileUserInfo ?? null}
          displayName={displayName}
          displayAvatarText={(displayName || '用').slice(0, 1)}
          displayAvatarUrl={displayAvatar}
          displayId={displayUid}
          unreadCount={unreadTotal}
          onNavigate={goTo}
          onOpenHelp={openSupport}
        />
      </div>
    );
  };

  const renderGridSkeleton = () => (
    <div className="grid grid-cols-4 gap-y-4">
      {[0, 1, 2, 3].map((item) => (
        <div key={item} className="flex flex-col items-center">
          <Skeleton className="mb-2 h-10 w-10 rounded-xl" />
          <Skeleton className="h-3 w-12" />
        </div>
      ))}
    </div>
  );

  const renderAssetSkeleton = () => (
    <div className="relative z-10 px-4 transition-transform">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 to-red-500 p-4 text-white shadow-xl">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute top-0 right-0 h-48 w-48 translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 h-40 w-40 -translate-x-1/4 translate-y-1/4 rounded-full bg-orange-300/20 blur-2xl"></div>
        </div>

        <div className="relative z-10">
          <div className="mb-3 flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-28 rounded-full bg-white/20" />
              <Skeleton className="h-5 w-20 rounded-full bg-white/20" />
            </div>
            <Skeleton className="h-4 w-14 rounded-full bg-white/20" />
          </div>

          <div className="mb-4 space-y-2">
            <Skeleton className="h-3 w-12 rounded-full bg-white/20" />
            <Skeleton className="h-10 w-40 rounded-full bg-white/20" />
          </div>

          <div className="grid grid-cols-4 gap-2 border-t border-white/20 pt-3">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="space-y-2">
                <Skeleton className="mx-auto h-3 w-12 rounded-full bg-white/20" />
                <Skeleton className="mx-auto h-4 w-10 rounded-full bg-white/20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSectionSkeleton = (titleWidthClassName: string) => (
    <Card className="p-4">
      <Skeleton className={`mb-4 h-5 ${titleWidthClassName}`} />
      {renderGridSkeleton()}
    </Card>
  );

  const renderContent = () => {
    if (showContentSkeleton) {
      return (
        <>
          {renderAssetSkeleton()}

          <div className="px-4 space-y-4">
            {renderSectionSkeleton('w-28')}
            {renderSectionSkeleton('w-28')}

            <Card className="border-0 bg-transparent p-0 shadow-none">
              <Skeleton className="mb-2 h-5 w-20" />
              <div className="rounded-2xl border border-border-light bg-bg-card p-4 shadow-sm">
                {renderGridSkeleton()}
              </div>
            </Card>
          </div>
        </>
      );
    }

    return (
      <>
        <ProfileBalanceCard userInfo={profile?.userInfo} onNavigate={goTo} />

        <div className="px-4 space-y-4">
          <Card className="hidden">
            <div
              className="mb-4 flex cursor-pointer items-center justify-between"
              onClick={() => goTo('order')}
            >
              <h3 className="text-base font-bold text-text-main">商城订单</h3>
              <span className="flex items-center text-xs text-text-aux">
                全部订单 <ChevronRight size={14} />
              </span>
            </div>
            <ProfileSectionGrid items={buildPointsOrder(goTo, null)} columns={4} />
          </Card>

          <Card className="p-4">
            <h3 className="mb-4 text-base font-bold text-text-main">资产与权益库</h3>
            <ProfileSectionGrid items={buildRightsManagement(goTo)} columns={4} />
          </Card>

          <Card className="p-4">
            <h3 className="mb-4 text-base font-bold text-text-main">便捷服务平台</h3>
            <ProfileSectionGrid
              items={buildConvenientServices({ navigate: goTo, hasSignedToday: false })}
              columns={4}
            />
          </Card>

          <Card className="p-4">
            <h3 className="mb-4 text-base font-bold text-text-main">服务与帮助</h3>
          <ProfileSectionGrid items={buildServiceManagement({ navigate: goTo, openSupport })} columns={4} />
          </Card>
        </div>

        {isLoggedIn && !loading && (
          <div className="px-4 pt-4 pb-8">
            <button
              onClick={() => setShowLogoutSheet(true)}
              className="flex h-[44px] w-full items-center justify-center rounded-xl border border-border-light bg-bg-card text-base font-medium text-text-main shadow-sm transition-colors active:bg-bg-base"
            >
              退出登录
            </button>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-bg-base">
      {isOffline && (
        <OfflineBanner onAction={refreshStatus} className="absolute top-0 right-0 left-0 z-50" />
      )}

      <PullToRefreshContainer onRefresh={handleRefresh} disabled={isOffline || !isLoggedIn}>
        <div ref={scrollContainerRef} className="min-h-0 flex-1 overflow-y-auto no-scrollbar">
          <div className="pointer-events-none absolute top-0 left-0 right-0 z-0 h-48 scale-x-110 rounded-b-[40px] bg-gradient-to-b from-red-50 to-bg-base dark:from-red-950/20"></div>

          {renderHeader()}

          <div className="relative z-10 space-y-4 pt-2">{renderContent()}</div>
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

