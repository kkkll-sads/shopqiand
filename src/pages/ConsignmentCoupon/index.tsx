/**
 * @file ConsignmentCoupon/index.tsx - 寄售券页面
 * @description 展示用户的寄售券列表，支持可用/已使用/已过期 Tab 切换，无限滚动加载。
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'; // React 核心 Hook
import { CalendarClock, CheckCircle2, Clock3, Ticket } from 'lucide-react';
import { userApi, type ConsignmentCoupon } from '../../api';
import { getErrorMessage } from '../../api/core/errors';
import { OfflineBanner } from '../../components/layout/OfflineBanner';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { PullToRefreshContainer } from '../../components/ui/PullToRefreshContainer';
import { Skeleton } from '../../components/ui/Skeleton';
import { useAuthSession } from '../../hooks/useAuthSession';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useRouteScrollRestoration } from '../../hooks/useRouteScrollRestoration';
import { useSessionState } from '../../hooks/useSessionState';
import { useAppNavigate } from '../../lib/navigation';

const PAGE_SIZE = 100;
const PREFETCH_PAGE_LIMIT = 4;

/** 寄售券 Tab 类型 */
type CouponTabKey = 'available' | 'used' | 'expired';

/** 单个 Tab 的加载状态 */
interface TabState {
  availableCount: number;
  error: string | null;
  hasMore: boolean;
  items: ConsignmentCoupon[];
  loaded: boolean;
  loading: boolean;
  loadingMore: boolean;
  page: number;
  total: number;
}

interface TabLoadResult {
  availableCount: number;
  hasMore: boolean;
  items: ConsignmentCoupon[];
  page: number;
  total: number;
}

const EMPTY_TAB_STATE: TabState = {
  availableCount: 0,
  error: null,
  hasMore: false,
  items: [],
  loaded: false,
  loading: false,
  loadingMore: false,
  page: 0,
  total: 0,
};

const TAB_ITEMS: Array<{ key: CouponTabKey; label: string }> = [
  { key: 'available', label: '可用' },
  { key: 'used', label: '已使用' },
  { key: 'expired', label: '已过期' },
];

const STATUS_META: Record<
  CouponTabKey,
  {
    badgeClassName: string;
    cardClassName: string;
    cardDetailClassName: string;
    iconClassName: string;
    iconWrapClassName: string;
  }
> = {
  available: {
    badgeClassName:
      'border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-300',
    cardClassName: 'border-emerald-200/80 bg-bg-card dark:border-emerald-900/60',
    cardDetailClassName: 'bg-emerald-50/70 dark:bg-emerald-950/25',
    iconClassName: 'text-emerald-600 dark:text-emerald-400',
    iconWrapClassName: 'bg-emerald-50 dark:bg-emerald-950/40',
  },
  used: {
    badgeClassName: 'border border-border-main bg-bg-hover text-text-sub',
    cardClassName: 'border-border-light bg-bg-card',
    cardDetailClassName: 'bg-bg-base',
    iconClassName: 'text-text-sub',
    iconWrapClassName: 'bg-bg-hover',
  },
  expired: {
    badgeClassName:
      'border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300',
    cardClassName: 'border-amber-200/80 bg-bg-card dark:border-amber-900/60',
    cardDetailClassName: 'bg-amber-50/70 dark:bg-amber-950/20',
    iconClassName: 'text-amber-600 dark:text-amber-400',
    iconWrapClassName: 'bg-amber-50 dark:bg-amber-950/35',
  },
};

/** 初始化 Tab 状态映射 */
function createTabStateMap(): Record<CouponTabKey, TabState> {
  return {
    available: { ...EMPTY_TAB_STATE },
    used: { ...EMPTY_TAB_STATE },
    expired: { ...EMPTY_TAB_STATE },
  };
}

/** 根据 Tab 类型返回 API 请求的 status 参数 */
function getRequestStatus(tab: CouponTabKey): 0 | 1 {
  return tab === 'used' ? 0 : 1;
}

/** 根据 Tab 类型筛选寄售券列表 */
function filterCouponsForTab(tab: CouponTabKey, items: ConsignmentCoupon[]) {
  if (tab === 'used') {
    return items;
  }

  return items.filter((item) => item.status === tab);
}

/** 合并去重寄售券列表 */
function mergeUniqueCoupons(current: ConsignmentCoupon[], incoming: ConsignmentCoupon[]) {
  const merged = new Map<number, ConsignmentCoupon>();

  current.forEach((item) => {
    merged.set(item.id, item);
  });

  incoming.forEach((item) => {
    merged.set(item.id, item);
  });

  return Array.from(merged.values());
}

/** 获取空状态提示文本 */
function getEmptyMessage(tab: CouponTabKey) {
  switch (tab) {
    case 'available':
      return '暂无可用寄售券';
    case 'used':
      return '暂无已使用寄售券';
    default:
      return '暂无已过期寄售券';
  }
}

/** 获取最近到期的寄售券时间文本 */
function getNearestExpiryText(coupons: ConsignmentCoupon[]) {
  const expiringCoupon = [...coupons]
    .filter((coupon) => typeof coupon.expireTime === 'number' && coupon.expireTime > 0)
    .sort((left, right) => (left.expireTime ?? 0) - (right.expireTime ?? 0))[0];

  return expiringCoupon?.expireTimeText;
}

/**
 * ConsignmentCouponPage - 寄售券页面
 * 功能：Tab 切换 → 寄售券列表 → 无限滚动加载 → 下拉刷新
 */
export const ConsignmentCouponPage = () => {
  const { goBack, goTo } = useAppNavigate();
  const { isAuthenticated, session } = useAuthSession();
  const { isOffline, refreshStatus } = useNetworkStatus();
  const [activeTab, setActiveTab] = useSessionState<CouponTabKey>(
    'consignment-coupon:tab',
    'available',
  );
  const [tabStates, setTabStates] = useState<Record<CouponTabKey, TabState>>(createTabStateMap);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const tabStatesRef = useRef(tabStates);
  const requestRef = useRef<AbortController | null>(null);

  useEffect(() => {
    tabStatesRef.current = tabStates;
  }, [tabStates]);

  useEffect(() => {
    return () => {
      requestRef.current?.abort();
    };
  }, []);

  const sessionUserId = useMemo(() => {
    const userInfo = (session?.userInfo ?? null) as Record<string, unknown> | null;
    return String(userInfo?.id ?? userInfo?.uid ?? 'guest');
  }, [session]);

  const loadTabData = useCallback(
    async (tab: CouponTabKey, mode: 'reset' | 'append' = 'reset') => {
      if (!isAuthenticated) {
        return;
      }

      requestRef.current?.abort();
      const controller = new AbortController();
      requestRef.current = controller;

      const previousState = tabStatesRef.current[tab];
      const seedItems = mode === 'append' ? previousState.items : [];
      const startPage = mode === 'append' ? previousState.page + 1 : 1;

      setTabStates((current) => ({
        ...current,
        [tab]: {
          ...current[tab],
          error: null,
          items: mode === 'reset' ? [] : current[tab].items,
          loaded: mode === 'append' ? current[tab].loaded : false,
          loading: mode === 'reset',
          loadingMore: mode === 'append',
          page: mode === 'reset' ? 0 : current[tab].page,
        },
      }));

      try {
        let page = startPage;
        let items = seedItems;
        let total = previousState.total;
        let availableCount = previousState.availableCount;
        let hasMore = false;
        let fetchedPageCount = 0;

        while (true) {
          const response = await userApi.getConsignmentCoupons(
            { limit: PAGE_SIZE, page, status: getRequestStatus(tab) },
            { signal: controller.signal },
          );

          total = response.total;
          availableCount = response.availableCount;
          hasMore = page * response.limit < response.total && response.list.length >= response.limit;

          const filteredItems = filterCouponsForTab(tab, response.list);
          items = mergeUniqueCoupons(items, filteredItems);
          fetchedPageCount += 1;

          const foundVisibleItems = items.length > seedItems.length;
          const shouldContinuePrefetch =
            tab !== 'used' &&
            !foundVisibleItems &&
            hasMore &&
            fetchedPageCount < PREFETCH_PAGE_LIMIT;

          if (!shouldContinuePrefetch) {
            const result: TabLoadResult = {
              availableCount,
              hasMore,
              items,
              page,
              total,
            };

            setTabStates((current) => ({
              ...current,
              [tab]: {
                availableCount: result.availableCount,
                error: null,
                hasMore: result.hasMore,
                items: result.items,
                loaded: true,
                loading: false,
                loadingMore: false,
                page: result.page,
                total: result.total,
              },
            }));

            return;
          }

          page += 1;
        }
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setTabStates((current) => ({
          ...current,
          [tab]: {
            ...current[tab],
            error: getErrorMessage(error),
            loading: false,
            loadingMore: false,
          },
        }));
      }
    },
    [isAuthenticated],
  );

  useEffect(() => {
    if (!isAuthenticated) {
      setTabStates(createTabStateMap());
      return;
    }

    if (!tabStates[activeTab].loaded && !tabStates[activeTab].loading) {
      void loadTabData(activeTab, 'reset');
    }
  }, [activeTab, isAuthenticated, loadTabData, tabStates]);

  const currentTabState = tabStates[activeTab];
  const nearestExpiryText = useMemo(
    () => getNearestExpiryText(tabStates.available.items),
    [tabStates.available.items],
  );

  const summaryMeta = useMemo(() => {
    if (activeTab === 'available') {
      return {
        helperText: nearestExpiryText ? `最近到期：${nearestExpiryText}` : '当前暂无即将到期寄售券',
        label: '张可用',
        value: currentTabState.availableCount || currentTabState.items.length,
      };
    }

    if (activeTab === 'used') {
      return {
        helperText: `已使用记录 ${currentTabState.total} 张`,
        label: '张已使用',
        value: currentTabState.total,
      };
    }

    return {
      helperText: currentTabState.hasMore ? '下滑可继续加载更多已过期寄售券' : '已展示当前已加载的过期寄售券',
      label: '张已加载',
      value: currentTabState.items.length,
    };
  }, [activeTab, currentTabState.availableCount, currentTabState.hasMore, currentTabState.items.length, currentTabState.total, nearestExpiryText]);

  useInfiniteScroll({
    disabled: !isAuthenticated || currentTabState.loading || currentTabState.items.length === 0,
    hasMore: currentTabState.hasMore,
    loading: currentTabState.loadingMore,
    onLoadMore: () => loadTabData(activeTab, 'append'),
    rootRef: scrollContainerRef,
    targetRef: loadMoreRef,
  });

  useRouteScrollRestoration({
    containerRef: scrollContainerRef,
    enabled: isAuthenticated,
    namespace: `consignment-coupon:${sessionUserId}:${activeTab}`,
    restoreDeps: [activeTab, currentTabState.items.length, currentTabState.loading],
    restoreWhen: isAuthenticated && !currentTabState.loading,
  });

  const handleRefresh = useCallback(async () => {
    refreshStatus();

    if (!isAuthenticated) {
      return;
    }

    await loadTabData(activeTab, 'reset');
  }, [activeTab, isAuthenticated, loadTabData, refreshStatus]);

  const retry = useCallback(() => {
    void loadTabData(activeTab, 'reset');
  }, [activeTab, loadTabData]);

  const renderTabs = () => (
    <div className="flex shrink-0 border-b border-border-light bg-bg-card/95 px-2 backdrop-blur">
      {TAB_ITEMS.map((item) => {
        const isActive = item.key === activeTab;

        return (
          <button
            key={item.key}
            type="button"
            onClick={() => setActiveTab(item.key)}
            className={`relative flex flex-1 items-center justify-center py-3 text-sm font-medium transition-colors ${
              isActive ? 'text-orange-600' : 'text-text-sub'
            }`}
          >
            <span>{item.label}</span>
            {isActive ? (
              <span className="absolute bottom-0 left-1/2 h-[3px] w-8 -translate-x-1/2 rounded-t-full bg-orange-500" />
            ) : null}
          </button>
        );
      })}
    </div>
  );

  const renderSummary = () => (
    <Card className="relative mx-4 mt-4 overflow-hidden border border-orange-200/60 bg-[linear-gradient(135deg,rgba(255,247,237,0.98)_0%,rgba(255,255,255,0.96)_55%,rgba(254,243,199,0.92)_100%)] p-5 shadow-sm dark:border-orange-900/40 dark:bg-[linear-gradient(135deg,rgba(28,28,30,0.98)_0%,rgba(42,42,42,0.96)_55%,rgba(68,47,24,0.92)_100%)]">
      <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-orange-200/30 dark:bg-orange-500/10" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-orange-700">寄售券中心</div>
          <div className="mt-3 flex items-end gap-2">
            <span className="text-4xl font-bold text-text-main">{summaryMeta.value}</span>
            <span className="pb-1 text-sm text-text-sub">{summaryMeta.label}</span>
          </div>
          <div className="mt-2 text-sm text-text-sub">{summaryMeta.helperText}</div>
        </div>
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-bg-card/80 text-orange-500 shadow-sm">
          <Ticket size={28} />
        </div>
      </div>

      <div className="relative mt-5 grid grid-cols-3 gap-2">
        {[
          { icon: CheckCircle2, label: '已使用', value: tabStates.used.total, tone: 'bg-bg-card/80 text-text-main' },
          { icon: Clock3, label: '已过期', value: tabStates.expired.items.length, tone: 'bg-bg-card/80 text-amber-700 dark:text-amber-300' },
          { icon: CalendarClock, label: '可用', value: tabStates.available.availableCount, tone: 'bg-bg-card/80 text-orange-700 dark:text-orange-300' },
        ].map((item) => (
          <div
            key={item.label}
            className={`rounded-2xl border border-white/70 px-3 py-3 shadow-sm dark:border-white/5 ${item.tone}`}
          >
            <div className="flex items-center gap-1 text-xs">
              <item.icon size={13} />
              <span>{item.label}</span>
            </div>
            <div className="mt-2 text-xl font-semibold">{item.value}</div>
          </div>
        ))}
      </div>
    </Card>
  );

  const renderLoading = () => (
    <div className="space-y-4 pb-8">
      <Card className="mx-4 mt-4 border border-orange-200/60 p-5 shadow-sm dark:border-orange-900/40">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-4 h-10 w-28" />
        <Skeleton className="mt-3 h-4 w-40" />
        <div className="mt-5 grid grid-cols-3 gap-2">
          {[1, 2, 3].map((item) => (
            <div key={item} className="rounded-2xl border border-border-light p-3">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="mt-3 h-6 w-10" />
            </div>
          ))}
        </div>
      </Card>

      <div className="space-y-3 px-4">
        {[1, 2, 3].map((item) => (
          <Card key={item} className="border border-border-light p-4 shadow-sm">
            <div className="flex items-start gap-4">
              <Skeleton className="h-12 w-12 rounded-2xl" />
              <div className="flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {[1, 2].map((cell) => (
                    <div key={cell} className="rounded-2xl border border-border-light p-3">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="mt-2 h-4 w-24" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderCouponCard = (coupon: ConsignmentCoupon) => {
    const meta = STATUS_META[coupon.status];

    return (
      <Card key={coupon.id} className={`overflow-hidden border p-0 shadow-sm ${meta.cardClassName}`}>
        <div className="h-1.5 bg-[linear-gradient(90deg,#fb923c_0%,#f97316_50%,#ea580c_100%)]" />
        <div className="p-4">
          <div className="flex items-start gap-4">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${meta.iconWrapClassName}`}>
              <Ticket size={22} className={meta.iconClassName} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-base font-semibold text-text-main">
                    {coupon.sessionTitle || '未命名场次'}
                  </div>
                  <div className="mt-1 truncate text-sm text-text-sub">
                    {coupon.zoneName || coupon.priceZone || '未命名分区'}
                  </div>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${meta.badgeClassName}`}>
                  {coupon.statusText}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className={`rounded-2xl px-3 py-3 ${meta.cardDetailClassName}`}>
                  <div className="text-xs text-text-aux">获得时间</div>
                  <div className="mt-1 text-sm font-medium text-text-main">
                    {coupon.createTimeText || '--'}
                  </div>
                </div>
                <div className={`rounded-2xl px-3 py-3 ${meta.cardDetailClassName}`}>
                  <div className="text-xs text-text-aux">有效期至</div>
                  <div className="mt-1 text-sm font-medium text-text-main">
                    {coupon.expireTimeText || '--'}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-text-aux">
                <span>券号 #{coupon.id}</span>
                <span>适用场次和分区以券面信息为准</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  const renderLoadMore = () => {
    if (!currentTabState.loaded || (!currentTabState.hasMore && !currentTabState.loadingMore)) {
      return null;
    }

    if (currentTabState.items.length === 0) {
      return currentTabState.loadingMore ? (
        <div className="py-4 text-center text-sm text-text-aux">加载更多中...</div>
      ) : currentTabState.hasMore ? (
        <div className="py-4 text-center">
          <button
            type="button"
            onClick={() => void loadTabData(activeTab, 'append')}
            className="rounded-full border border-border-main bg-bg-card px-4 py-2 text-sm text-text-main"
          >
            继续加载
          </button>
        </div>
      ) : null;
    }

    return (
      <div ref={loadMoreRef} className="py-4 text-center text-sm text-text-aux">
        {currentTabState.loadingMore ? '加载更多中...' : currentTabState.hasMore ? '继续下滑加载更多' : ''}
      </div>
    );
  };

  const renderAuthenticatedContent = () => {
    if (currentTabState.loading && currentTabState.items.length === 0) {
      return renderLoading();
    }

    if (currentTabState.error && currentTabState.items.length === 0) {
      return (
        <div className="px-4">
          <ErrorState message={currentTabState.error} onRetry={retry} />
        </div>
      );
    }

    return (
      <div className="space-y-4 pb-8">
        {renderSummary()}

        {currentTabState.items.length > 0 ? (
          <div className="space-y-3 px-4">
            {currentTabState.items.map(renderCouponCard)}
            {renderLoadMore()}
          </div>
        ) : (
          <div className="px-4">
            <EmptyState icon={<Ticket size={48} />} message={getEmptyMessage(activeTab)} />
            {renderLoadMore()}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-bg-base">
      {isOffline ? <OfflineBanner onAction={handleRefresh} /> : null}

      <PageHeader title="寄售券" onBack={goBack} className="bg-bg-card/95 backdrop-blur" />

      {isAuthenticated ? renderTabs() : null}

      <PullToRefreshContainer onRefresh={handleRefresh} disabled={isOffline || !isAuthenticated}>
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto no-scrollbar">
          {isAuthenticated ? (
            renderAuthenticatedContent()
          ) : (
            <EmptyState
              icon={<Ticket size={48} />}
              message="登录后查看寄售券"
              actionText="去登录"
              actionVariant="primary"
              onAction={() => goTo('login')}
            />
          )}
        </div>
      </PullToRefreshContainer>
    </div>
  );
};
