/**
 * @file 申购记录列表页
 * @description 分页加载申购记录，使用 useInfiniteScroll 实现下拉加载更多。
 */

import { useCallback, useRef, useState } from 'react';
import { ChevronLeft, RefreshCcw } from 'lucide-react';
import { reservationApi, type ReservationItem } from '../../api';
import { getErrorMessage } from '../../api/core/errors';
import { PageHeader } from '../../components/layout/PageHeader';
import { OfflineBanner } from '../../components/layout/OfflineBanner';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { PullToRefreshContainer } from '../../components/ui/PullToRefreshContainer';
import { Skeleton } from '../../components/ui/Skeleton';
import { ReservationCard } from '../../features/reservation/ReservationCard';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useRequest } from '../../hooks/useRequest';
import { useRouteScrollRestoration } from '../../hooks/useRouteScrollRestoration';
import { useAppNavigate } from '../../lib/navigation';

const PAGE_SIZE = 10;
type ReservationStatusFilter = -1 | 0 | 1 | 2;

const STATUS_TABS: Array<{ key: ReservationStatusFilter; label: string }> = [
  { key: -1, label: '全部' },
  { key: 0, label: '待撮合' },
  { key: 1, label: '已撮合' },
  { key: 2, label: '已退款' },
];

export const ReservationsPage = () => {
  const { goBack, goTo } = useAppNavigate();
  const { isOffline, refreshStatus } = useNetworkStatus();
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  /* ---- 数据状态 ---- */
  const [items, setItems] = useState<ReservationItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ReservationStatusFilter>(-1);

  /* ---- 首次加载 ---- */
  const {
    error: firstError,
    loading: firstLoading,
    reload: reloadFirst,
  } = useRequest(
    async (signal) => {
      const res = await reservationApi.getList({ page: 1, limit: PAGE_SIZE, sstatus: statusFilter }, signal);
      const list = res?.list ?? [];
      setItems(list);
      setPage(1);
      setHasMore(list.length >= PAGE_SIZE);
      setLoadMoreError(null);
      return res;
    },
    {
      cacheKey: `reservations:first-page:${statusFilter}`,
      deps: [statusFilter],
    },
  );

  /* ---- 加载更多 ---- */
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    setLoadMoreError(null);

    const nextPage = page + 1;
    try {
      const res = await reservationApi.getList({ page: nextPage, limit: PAGE_SIZE, sstatus: statusFilter });
      const list = res?.list ?? [];
      setItems((prev) => [...prev, ...list]);
      setPage(nextPage);
      setHasMore(list.length >= PAGE_SIZE);
    } catch (err) {
      setLoadMoreError(getErrorMessage(err));
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, page, statusFilter]);

  useInfiniteScroll({
    hasMore,
    loading: loadingMore,
    onLoadMore: loadMore,
    rootRef: scrollContainerRef,
    targetRef: loadMoreRef,
  });

  useRouteScrollRestoration({
    containerRef: scrollContainerRef,
    namespace: `reservations-page:${statusFilter}`,
    restoreDeps: [firstLoading, items.length, statusFilter],
    restoreWhen: !firstLoading && items.length > 0,
  });

  /* ---- 下拉刷新 ---- */
  const handleRefresh = useCallback(async () => {
    await reloadFirst().catch(() => undefined);
  }, [reloadFirst]);

  const handleStatusChange = useCallback((nextStatus: ReservationStatusFilter) => {
    if (nextStatus === statusFilter) {
      return;
    }

    setStatusFilter(nextStatus);
    setItems([]);
    setPage(1);
    setHasMore(false);
    setLoadMoreError(null);
    scrollContainerRef.current?.scrollTo({ top: 0 });
  }, [statusFilter]);

  /* ---- 渲染 ---- */
  const renderSkeleton = () => (
    <div className="space-y-3 p-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="bg-white dark:bg-gray-900 rounded-[14px] p-4 border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <Skeleton className="w-40 h-4" />
            <Skeleton className="w-14 h-5 rounded-full" />
          </div>
          <Skeleton className="w-28 h-3 mb-2" />
          <Skeleton className="w-36 h-3" />
        </div>
      ))}
    </div>
  );

  const renderList = () => {
    if (firstLoading && items.length === 0) return renderSkeleton();

    if (firstError && items.length === 0) {
      return <ErrorState message={getErrorMessage(firstError)} onRetry={reloadFirst} />;
    }

    if (items.length === 0) {
      return <EmptyState message="暂无申购记录" />;
    }

    return (
      <div className="space-y-3 p-4 pb-8">
        {items.map((item) => (
          <ReservationCard 
            key={item.id} 
            item={item} 
            onClick={() => goTo(`/reservation_detail/${item.id}`)}
          />
        ))}

        {/* 加载更多触发器 */}
        <div ref={loadMoreRef} className="py-4 text-center text-sm text-gray-400">
          {loadingMore ? (
            <span className="inline-flex items-center">
              <RefreshCcw size={14} className="mr-2 animate-spin" />
              加载中...
            </span>
          ) : loadMoreError ? (
            <button
              type="button"
              className="rounded-full border border-gray-200 dark:border-gray-700 px-4 py-2 text-gray-700 dark:text-gray-300"
              onClick={() => void loadMore()}
            >
              加载失败，点击重试
            </button>
          ) : hasMore ? (
            <span>继续下拉加载更多</span>
          ) : items.length > PAGE_SIZE ? (
            <span>没有更多了</span>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-bg-base">
      {isOffline && <OfflineBanner onAction={refreshStatus} />}

      <PageHeader title="申购记录" onBack={goBack} />

      <div className="z-10 flex border-b border-border-light bg-white px-2 dark:bg-gray-900">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`relative flex-1 py-3 text-center text-[14px] font-medium transition-colors ${
              statusFilter === tab.key ? 'text-primary-start' : 'text-text-sub'
            }`}
            onClick={() => handleStatusChange(tab.key)}
          >
            {tab.label}
            {statusFilter === tab.key ? (
              <div className="absolute bottom-0 left-1/2 h-[3px] w-6 -translate-x-1/2 rounded-t-full bg-primary-start" />
            ) : null}
          </button>
        ))}
      </div>

      <PullToRefreshContainer onRefresh={handleRefresh} disabled={isOffline}>
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto no-scrollbar">
          {renderList()}
        </div>
      </PullToRefreshContainer>
    </div>
  );
};
