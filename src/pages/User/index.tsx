import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  Copy,
  CreditCard,
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
  ShoppingCart,
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
import { OfflineBanner } from '../../components/layout/OfflineBanner';
import { ActionSheet } from '../../components/ui/ActionSheet';
import { Card } from '../../components/ui/Card';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { Skeleton } from '../../components/ui/Skeleton';
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
  });
}

function formatCount(value: number | string | undefined) {
  const nextValue = typeof value === 'string' ? Number(value) : value;
  if (typeof nextValue !== 'number' || !Number.isFinite(nextValue)) {
    return '--';
  }

  return nextValue.toLocaleString('zh-CN', {
    maximumFractionDigits: 0,
  });
}

function getRealNameMeta(status: number | undefined) {
  if (status === 2) {
    return {
      className: 'bg-green-100 text-green-700',
      icon: ShieldCheck,
      text: '已实名',
    };
  }

  if (status === 1) {
    return {
      className: 'bg-orange-100 text-orange-700',
      icon: ShieldCheck,
      text: '审核中',
    };
  }

  if (status === 3) {
    return {
      className: 'bg-red-100 text-red-600',
      icon: ShieldCheck,
      text: '已驳回',
    };
  }

  return {
    className: 'bg-gray-100 text-gray-600',
    icon: ShieldCheck,
    text: '未实名',
  };
}

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
  const {
    data: profile,
    loading: profileLoading,
  } = useRequest((signal) => accountApi.getProfile({ signal }), {
    deps: [isLoggedIn],
    manual: !isLoggedIn,
  });
  const {
    data: accountOverview,
    loading: accountOverviewLoading,
  } = useRequest((signal) => accountApi.getAccountOverview({ signal }), {
    deps: [isLoggedIn],
    manual: !isLoggedIn,
  });
  const {
    data: realNameStatus,
    loading: realNameLoading,
  } = useRequest((signal) => userApi.getRealNameStatus({ signal }), {
    deps: [isLoggedIn],
    manual: !isLoggedIn,
  });
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
  const realNameMeta = getRealNameMeta(realNameStatus?.realNameStatus);
  const RealNameStatusIcon = realNameMeta.icon;

  const assetItems = useMemo(
    () => [
      {
        icon: Coins,
        label: '专项金余额',
        value: formatMoney(accountOverview?.balance.balanceAvailable ?? profile?.userInfo?.balanceAvailable),
      },
      {
        icon: Banknote,
        label: '可提现余额',
        value: formatMoney(
          accountOverview?.balance.withdrawableMoney ?? profile?.userInfo?.withdrawableMoney,
        ),
      },
      {
        icon: ShoppingBag,
        label: '消费金',
        value: formatCount(accountOverview?.balance.score ?? profile?.userInfo?.score),
      },
      {
        icon: Zap,
        label: '算力',
        value: formatMoney(accountOverview?.balance.greenPower ?? profile?.userInfo?.greenPower),
      },
      {
        icon: ShieldCheck,
        label: '确权金',
        value: formatMoney(
          accountOverview?.balance.serviceFeeBalance ?? profile?.userInfo?.serviceFeeBalance,
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

  const handleCopy = async (text: string) => {
    if (!text || text === '--') {
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      showToast({ message: '已复制', type: 'success' });
    } catch {
      showToast({ message: '复制失败，请稍后重试', type: 'error' });
    }
  };

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
        <div className="px-4 pt-12 pb-6 bg-gradient-to-b from-red-50 to-bg-base relative">
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
        <div className="px-4 pt-12 pb-6 bg-gradient-to-b from-red-50 to-bg-base relative">
          <div className="absolute top-4 right-4 flex space-x-4 text-text-main">
            <Settings size={22} />
            <MessageSquare size={22} />
          </div>
          <div className="mt-4 flex items-center space-x-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white bg-border-light shadow-sm">
              <HeadphonesIcon size={28} className="text-text-sub" />
            </div>
            <div className="flex flex-col items-start">
              <h2 className="mb-2 text-4xl font-bold text-text-main">未登录</h2>
              <p className="mb-3 text-sm text-text-sub">登录后查看账户信息和业务数据</p>
              <button
                onClick={() => goTo('login')}
                className="rounded-full bg-gradient-to-r from-primary-start to-primary-end px-5 py-1.5 text-base font-medium text-white shadow-sm"
              >
                登录 / 注册
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="px-4 pt-12 pb-6 bg-gradient-to-b from-red-50 to-bg-base relative">
        <div className="absolute top-4 right-4 flex space-x-4 text-text-main">
          <button className="active:opacity-70 transition-opacity" onClick={() => goTo('settings')}>
            <Settings size={22} />
          </button>
          <button className="active:opacity-70 transition-opacity" onClick={() => goTo('cart')}>
            <ShoppingCart size={22} />
          </button>
          <button className="active:opacity-70 transition-opacity" onClick={() => goTo('message_center')}>
            <MessageSquare size={22} />
          </button>
        </div>

        <div className="mt-4 flex items-center space-x-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-bg-card shadow-sm">
            {displayAvatar ? (
              <img
                src={displayAvatar}
                alt="Avatar"
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <HeadphonesIcon size={28} className="text-text-sub" />
            )}
          </div>
          <div className="flex flex-1 flex-col">
            <p className="mb-1 text-sm text-text-sub">{displayMobile}</p>
            <h2 className="mb-1 text-4xl font-bold leading-tight text-text-main">{displayName}</h2>
            <div className="mb-1.5 flex items-center text-sm text-text-sub">
              <span>UID: {displayUid}</span>
              <button onClick={() => void handleCopy(displayUid)} className="ml-1 p-0.5 text-text-aux active:text-text-main">
                <Copy size={12} />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-700">
                已登录
              </span>
              <span
                className={`flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium ${realNameMeta.className}`}
              >
                <RealNameStatusIcon size={12} className="mr-1" />
                {realNameMeta.text}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-x-2 gap-y-5 rounded-2xl border border-border-light bg-bg-card p-5 shadow-soft">
          {assetItems.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex flex-col items-center">
              <span className="mb-1 text-xl font-bold text-text-main">{value}</span>
              <span className="flex items-center text-s text-text-sub">
                <Icon size={12} className="mr-1" />
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const quickEntries = [
    { icon: CreditCard, label: '待付款', route: 'order' },
    { icon: MapPin, label: '收货地址', route: 'address' },
    { icon: Ticket, label: '优惠券', route: 'coupon' },
    { icon: HeadphonesIcon, label: '联系客服', route: 'help_center' },
  ];

  const serviceEntries = [
    { icon: Lock, label: '账号与安全', route: 'security', meta: '密码/支付安全' },
    { icon: Users, label: '我的好友', route: 'friends', meta: '邀请好友得奖励' },
    { icon: Heart, label: '收藏与足迹', route: 'favorites', meta: '商品/藏品' },
    { icon: MapPin, label: '地址管理', route: 'address' },
    { icon: Wallet, label: '资产明细', route: 'coupon', meta: '积分/余额' },
    { icon: CreditCard, label: '专项金充值', route: 'recharge' },
    { icon: Wallet, label: '专项金划转', route: 'transfer' },
    { icon: ShieldCheck, label: '确权金划转', route: 'rights_transfer' },
    { icon: Landmark, label: '收益提现', route: 'withdraw' },
    { icon: HelpCircle, label: '售后与帮助', route: 'help_center' },
    { icon: Bell, label: '公告中心', route: 'announcement' },
    { icon: Info, label: '关于我们', route: 'about', meta: formatVersionLabel(CURRENT_APP_VERSION) },
  ];

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-bg-base">
      {isOffline && <OfflineBanner onAction={refreshStatus} className="absolute top-0 right-0 left-0 z-50" />}

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto no-scrollbar pb-4">
        {renderHeader()}

        <div className="relative z-10 -mt-2 space-y-4 px-4">
          <Card className="flex justify-around p-4">
            {loading
              ? [1, 2, 3, 4].map((item) => (
                  <div key={item} className="flex flex-col items-center space-y-1.5">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-3 w-10" />
                  </div>
                ))
              : quickEntries.map(({ icon: Icon, label, route }) => (
                  <button
                    key={label}
                    className="flex flex-col items-center transition-opacity active:opacity-70"
                    onClick={() => goTo(route)}
                  >
                    <div className="mb-1 flex h-10 w-10 items-center justify-center text-text-main">
                      <Icon size={24} strokeWidth={1.5} />
                    </div>
                    <span className="text-sm text-text-main">{label}</span>
                  </button>
                ))}
          </Card>

          <Card className="overflow-hidden p-0">
            <div
              className="flex items-center justify-between border-b border-border-light px-4 py-3 transition-colors active:bg-bg-base"
              onClick={() => goTo('order')}
            >
              <h3 className="text-lg font-bold text-text-main">我的订单</h3>
              <span className="flex items-center text-sm text-text-aux">
                查看全部 <ChevronRight size={14} />
              </span>
            </div>
            <div className="flex justify-around p-4">
              {loading
                ? [1, 2, 3, 4].map((item) => (
                    <div key={item} className="flex flex-col items-center space-y-1.5">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-3 w-10" />
                    </div>
                  ))
                : [
                    { icon: CreditCard, label: '待付款', route: 'order' },
                    { icon: Package, label: '待发货', route: 'order' },
                    { icon: Truck, label: '待收货', route: 'order' },
                    { icon: HeadphonesIcon, label: '售后', route: 'after_sales' },
                  ].map(({ icon: Icon, label, route }) => (
                    <button
                      key={label}
                      className="flex flex-col items-center transition-opacity active:opacity-70"
                      onClick={() => goTo(route)}
                    >
                      <div className="mb-1 flex h-8 w-8 items-center justify-center text-text-main">
                        <Icon size={24} strokeWidth={1.5} />
                      </div>
                      <span className="text-sm text-text-main">{label}</span>
                    </button>
                  ))}
            </div>
          </Card>

          <Card className="overflow-hidden border border-primary-start/20 p-0">
            <div
              className="flex items-center justify-between border-b border-border-light bg-gradient-to-r from-red-50 to-white px-4 py-3 transition-colors active:bg-red-50/80"
              onClick={() => goTo('shield')}
            >
              <h3 className="flex items-center text-lg font-bold text-text-main">
                <ShieldCheck size={18} className="mr-1.5 text-primary-start" />
                确权中心
              </h3>
              <span className="flex items-center text-sm text-text-aux">
                查看详情 <ChevronRight size={14} />
              </span>
            </div>
            <div className="p-4">
              {loading ? (
                <div className="flex items-center justify-between">
                  <div className="mr-4 flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-7 w-16 rounded-full" />
                </div>
              ) : !isLoggedIn ? (
                <div className="flex items-center justify-between">
                  <div className="text-base text-text-sub">登录后查看确权记录</div>
                  <button
                    className="rounded-full border border-primary-start px-4 py-1.5 text-sm font-medium text-primary-start"
                    onClick={() => goTo('login')}
                  >
                    去登录
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="mb-1 text-base text-text-main">确权数据接入后显示</div>
                    <div className="text-s text-text-sub">当前已移除本地写死的确权统计数据</div>
                  </div>
                  <button
                    className="rounded-full bg-gradient-to-r from-primary-start to-primary-end px-4 py-1.5 text-sm font-medium text-white shadow-sm active:opacity-80"
                    onClick={() => goTo('shield')}
                  >
                    前往
                  </button>
                </div>
              )}
            </div>
          </Card>

          <Card className="overflow-hidden p-0">
            {loading ? (
              <div className="flex flex-col">
                {[1, 2, 3, 4, 5, 6].map((item, index) => (
                  <div key={item} className={`flex items-center justify-between px-4 py-3.5 ${index < 5 ? 'border-b border-border-light' : ''}`}>
                    <div className="flex items-center space-x-3">
                      <Skeleton className="h-[18px] w-[18px] rounded" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-4 w-4" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col">
                {serviceEntries.map(({ icon: Icon, label, route, meta }, index) => (
                  <button
                    key={label}
                    className={`flex items-center justify-between px-4 py-3.5 text-left transition-colors active:bg-bg-base ${index < serviceEntries.length - 1 ? 'border-b border-border-light' : ''}`}
                    onClick={() => goTo(route)}
                  >
                    <div className="flex items-center text-text-main">
                      <Icon size={18} className="mr-3 text-text-sub" />
                      <span className="text-md">{label}</span>
                    </div>
                    <div className="flex items-center">
                      {meta ? <span className="mr-1 text-s text-text-aux">{meta}</span> : null}
                      <ChevronRight size={16} className="text-text-aux" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>

          {isLoggedIn && !loading && (
            <div className="pb-8 pt-4">
              <button
                onClick={() => setShowLogoutSheet(true)}
                className="flex h-[48px] w-full items-center justify-center rounded-2xl border border-border-light bg-bg-card text-lg font-medium text-text-main shadow-sm transition-colors active:bg-bg-base"
              >
                <LogOut size={18} className="mr-2 text-text-sub" />
                退出登录
              </button>
            </div>
          )}
        </div>
      </div>

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
