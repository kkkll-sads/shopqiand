import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, Info, Ticket, WifiOff, X } from 'lucide-react';
import { shopCouponApi, type ShopCouponItem, type ShopCouponTab } from '../../api';
import { getErrorMessage, isAbortError } from '../../api/core/errors';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { PullToRefreshContainer } from '../../components/ui/PullToRefreshContainer';
import { useAuthSession } from '../../hooks/useAuthSession';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useRouteScrollRestoration } from '../../hooks/useRouteScrollRestoration';
import { useSessionState } from '../../hooks/useSessionState';
import { useAppNavigate } from '../../lib/navigation';

const TAB_OPTIONS: Array<{ id: ShopCouponTab; label: string }> = [
  { id: 'available', label: '可领取' },
  { id: 'received', label: '已领取' },
  { id: 'expired', label: '已过期' },
];

function formatCouponValue(coupon: ShopCouponItem) {
  if (coupon.type === 'discount') {
    return (
      <>
        <span className="text-7xl font-bold leading-none tracking-tighter">{coupon.value}</span>
        <span className="ml-0.5 text-md font-bold">折</span>
      </>
    );
  }

  return (
    <>
      <span className="mr-0.5 text-md font-bold">¥</span>
      <span className="text-7xl font-bold leading-none tracking-tighter">{coupon.value}</span>
    </>
  );
}

function getEmptyMessage(tab: ShopCouponTab) {
  switch (tab) {
    case 'received':
      return '暂无已领取优惠券';
    case 'expired':
      return '暂无过期优惠券';
    default:
      return '暂无可领取优惠券';
  }
}

export const CouponPage = () => {
  const { goBack, goTo } = useAppNavigate();
  const { isAuthenticated } = useAuthSession();
  const { isOffline, refreshStatus } = useNetworkStatus();
  const { showToast } = useFeedback();

  const [activeTab, setActiveTab] = useSessionState<ShopCouponTab>('coupon:tab', 'available');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [coupons, setCoupons] = useState<ShopCouponItem[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<ShopCouponItem | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const loadCoupons = async (signal?: AbortSignal, tab: ShopCouponTab = activeTab) => {
    if (!isAuthenticated) {
      setCoupons([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await shopCouponApi.list(
        {
          limit: 50,
          page: 1,
          tab,
        },
        { signal },
      );
      setCoupons(response.list);
    } catch (nextError) {
      if (isAbortError(nextError)) {
        return;
      }
      setCoupons([]);
      setError(nextError instanceof Error ? nextError : new Error('加载优惠券失败'));
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    void loadCoupons(controller.signal);
    return () => controller.abort();
  }, [activeTab, isAuthenticated]);

  useRouteScrollRestoration({
    containerRef: scrollContainerRef,
    enabled: isAuthenticated && !selectedCoupon,
    namespace: `coupon:${activeTab}`,
    restoreDeps: [activeTab, coupons.length, Boolean(error), loading, isAuthenticated],
    restoreWhen: isAuthenticated && !loading && !error && !selectedCoupon,
  });

  const handleRefresh = async () => {
    refreshStatus();
    await loadCoupons();
  };

  const handleClaim = async (coupon: ShopCouponItem) => {
    if (claimingId) {
      return;
    }

    setClaimingId(coupon.id);
    try {
      await shopCouponApi.claim(coupon.couponId);
      showToast({ message: '领取成功', type: 'success' });
      setSelectedCoupon((current) => (current?.id === coupon.id ? null : current));
      await loadCoupons(undefined, activeTab);
    } catch (nextError) {
      showToast({ message: getErrorMessage(nextError), type: 'error', duration: 3000 });
    } finally {
      setClaimingId(null);
    }
  };

  const renderHeader = () => (
    <div className="relative z-40 shrink-0 bg-white dark:bg-gray-900">
      {isOffline ? (
        <div className="flex items-center justify-between bg-red-50 px-4 py-2 text-sm text-primary-start dark:bg-red-500/12 dark:text-red-300">
          <div className="flex items-center">
            <WifiOff size={14} className="mr-2" />
            <span>网络连接不稳定，请检查后重试</span>
          </div>
          <button
            type="button"
            onClick={() => {
              void handleRefresh();
            }}
            className="rounded bg-bg-card px-2 py-1 font-medium text-text-main shadow-soft"
          >
            刷新
          </button>
        </div>
      ) : null}

      <div className="flex h-12 items-center justify-between px-3 pt-safe">
        <div className="flex w-1/3 items-center">
          <button type="button" onClick={goBack} className="p-1 -ml-1 text-text-main active:opacity-70">
            <ChevronLeft size={24} />
          </button>
        </div>
        <h1 className="w-1/3 text-center text-xl font-bold text-text-main">优惠券</h1>
        <div className="w-1/3" />
      </div>

      <div className="relative flex h-11 border-b border-border-light px-4">
        {TAB_OPTIONS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex flex-1 items-center justify-center text-md font-medium transition-colors ${
              activeTab === tab.id ? 'text-primary-start' : 'text-text-sub'
            }`}
          >
            {tab.label}
            {activeTab === tab.id ? (
              <div className="absolute bottom-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-primary-start" />
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );

  const renderSkeleton = () => (
    <div className="space-y-3 p-4">
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="flex h-[100px] overflow-hidden rounded-xl bg-white shadow-sm animate-pulse dark:bg-gray-900">
          <div className="w-[104px] bg-gray-100 dark:bg-gray-800" />
          <div className="relative w-0 border-l border-dashed border-border-light">
            <div className="absolute top-[-6px] left-[-6px] h-3 w-3 rounded-full bg-bg-base" />
            <div className="absolute bottom-[-6px] left-[-6px] h-3 w-3 rounded-full bg-bg-base" />
          </div>
          <div className="flex flex-1 flex-col justify-between p-3">
            <div>
              <div className="mb-2 h-4 w-3/4 rounded bg-gray-100 dark:bg-gray-800" />
              <div className="h-3 w-1/2 rounded bg-gray-100 dark:bg-gray-800" />
            </div>
            <div className="flex items-end justify-between">
              <div className="h-3 w-1/3 rounded bg-gray-100 dark:bg-gray-800" />
              <div className="h-6 w-16 rounded-full bg-gray-100 dark:bg-gray-800" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderEmpty = () => (
    <EmptyState
      icon={<Ticket size={48} />}
      message={getEmptyMessage(activeTab)}
      actionText={activeTab === 'available' ? '去商城逛逛' : '返回首页'}
      onAction={() => goTo(activeTab === 'available' ? 'store' : 'home')}
    />
  );

  const renderContent = () => {
    if (!isAuthenticated) {
      return (
        <EmptyState
          icon={<Ticket size={48} />}
          message="登录后查看你的优惠券"
          actionText="去登录"
          actionVariant="primary"
          onAction={() => goTo('login')}
        />
      );
    }

    if (loading) {
      return renderSkeleton();
    }

    if (error) {
      return <ErrorState message={getErrorMessage(error)} onRetry={() => void handleRefresh()} />;
    }

    if (coupons.length === 0) {
      return renderEmpty();
    }

    return (
      <div className="space-y-3 p-4 pb-safe">
        {coupons.map((coupon) => (
          <div key={coupon.id} className="relative flex overflow-hidden rounded-xl bg-white shadow-sm dark:bg-gray-900">
            <div
              className={`flex w-[104px] shrink-0 flex-col items-center justify-center p-3 ${
                coupon.status === 'expired'
                  ? 'bg-gray-50 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                  : 'bg-red-50 text-primary-start dark:bg-red-500/12 dark:text-red-300'
              }`}
            >
              <div className="flex items-baseline">{formatCouponValue(coupon)}</div>
              <div className="mt-1 text-s font-medium">满¥{coupon.threshold}可用</div>
            </div>

            <div className="relative w-0 shrink-0 border-l border-dashed border-border-light">
              <div className="absolute top-[-6px] left-[-6px] h-3 w-3 rounded-full bg-bg-base" />
              <div className="absolute bottom-[-6px] left-[-6px] h-3 w-3 rounded-full bg-bg-base" />
            </div>

            <div className="min-w-0 flex-1 bg-white p-3 dark:bg-gray-900">
              <div>
                <div className="mb-1 flex items-start">
                  <span
                    className={`mr-1.5 mt-0.5 shrink-0 rounded px-1 text-xs ${
                      coupon.status === 'expired'
                        ? 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                        : 'bg-primary-start text-white dark:bg-red-500/85'
                    }`}
                  >
                    {coupon.type === 'discount' ? '折扣' : '满减'}
                  </span>
                  <span
                    className={`line-clamp-2 text-md font-bold leading-tight ${
                      coupon.status === 'expired' ? 'text-text-aux' : 'text-text-main'
                    }`}
                  >
                    {coupon.title}
                  </span>
                </div>
                <div className="truncate text-s text-text-sub">{coupon.scope}</div>
              </div>

              <div className="mt-2 flex items-end justify-between">
                <button
                  type="button"
                  onClick={() => setSelectedCoupon(coupon)}
                  className="flex items-center py-1 pr-2 text-xs text-text-aux active:opacity-70"
                >
                  <span>{coupon.validUntil}</span>
                  <Info size={12} className="ml-1 shrink-0" />
                </button>

                {coupon.status === 'available' ? (
                  <button
                    type="button"
                    disabled={claimingId === coupon.id}
                    onClick={() => void handleClaim(coupon)}
                    className={`h-[26px] w-[64px] shrink-0 rounded-full text-sm font-medium shadow-sm ${
                      claimingId === coupon.id
                        ? 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                        : 'gradient-primary-r text-white active:opacity-80'
                    }`}
                  >
                    {claimingId === coupon.id ? '领取中' : '领取'}
                  </button>
                ) : null}

                {coupon.status === 'received' ? (
                  <button
                    type="button"
                    onClick={() => goTo('store')}
                    className="h-[26px] w-[64px] shrink-0 rounded-full border border-primary-start text-sm font-medium text-primary-start active:bg-red-50 dark:border-red-400 dark:text-red-300 dark:active:bg-red-500/12"
                  >
                    去使用
                  </button>
                ) : null}

                {coupon.status === 'expired' ? (
                  <div className="flex h-[26px] w-[64px] shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-400 dark:bg-gray-800 dark:text-gray-500">
                    已过期
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderDetailModal = () => {
    if (!selectedCoupon) {
      return null;
    }

    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setSelectedCoupon(null)}
        />
        <div className="relative z-10 flex max-h-[80vh] w-full flex-col rounded-t-[20px] bg-white animate-slide-up sm:w-[350px] sm:rounded-2xl sm:animate-fade-in dark:bg-gray-900">
          <div className="flex shrink-0 items-center justify-between border-b border-border-light p-4">
            <h3 className="text-xl font-bold text-text-main">优惠券详情</h3>
            <button
              type="button"
              onClick={() => setSelectedCoupon(null)}
              className="p-1 text-text-aux active:text-text-main"
            >
              <X size={20} />
            </button>
          </div>

          <div className="overflow-y-auto p-4 no-scrollbar">
            <div className="mb-6">
              <div className="mb-2 text-md font-bold text-text-main">使用规则</div>
              <div className="space-y-1.5">
                {selectedCoupon.rules.length > 0 ? (
                  selectedCoupon.rules.map((rule, index) => (
                    <div key={`${selectedCoupon.id}-${index}`} className="text-base leading-relaxed text-text-sub">
                      {rule}
                    </div>
                  ))
                ) : (
                  <div className="text-base leading-relaxed text-text-sub">暂无额外规则说明</div>
                )}
              </div>
            </div>

            {selectedCoupon.unusableReason ? (
              <div className="mb-6">
                <div className="mb-2 text-md font-bold text-text-main">不可用原因</div>
                <div className="rounded-lg bg-red-50 p-3 text-base leading-relaxed text-primary-start dark:bg-red-500/12 dark:text-red-300">
                  {selectedCoupon.unusableReason}
                </div>
              </div>
            ) : null}

            <div>
              <div className="mb-2 text-md font-bold text-text-main">有效期</div>
              <div className="text-base text-text-sub">{selectedCoupon.validUntil || '长期有效'}</div>
            </div>
          </div>

          <div className="shrink-0 border-t border-border-light p-4 pb-safe">
            <button
              type="button"
              onClick={() => setSelectedCoupon(null)}
              className="h-11 w-full rounded-full border border-border-main bg-bg-card text-lg font-medium text-text-main active:bg-gray-50 dark:bg-gray-800 dark:active:bg-gray-700"
            >
              我知道了
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative flex h-full flex-1 flex-col overflow-hidden bg-bg-base">
      {renderHeader()}

      {isAuthenticated ? (
        <PullToRefreshContainer
          className="flex-1"
          onRefresh={handleRefresh}
          disabled={Boolean(selectedCoupon) || loading}
        >
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto no-scrollbar">
            {renderContent()}
          </div>
        </PullToRefreshContainer>
      ) : (
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto no-scrollbar">
          {renderContent()}
        </div>
      )}

      {renderDetailModal()}
    </div>
  );
};
