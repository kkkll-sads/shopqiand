/**
 * @file MyCollection/index.tsx
 * @description 展示用户持有的数字藏品列表，支持搜索、状态筛选和无限滚动。
 */

import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Box, ChevronRight, RefreshCcw, Search, X } from 'lucide-react';
import {
  collectionTradeApi,
  type MyCollectionItem,
  type MyCollectionResponse,
  type MyCollectionStatus,
} from '../../api';
import { getErrorMessage } from '../../api/core/errors';
import { OfflineBanner } from '../../components/layout/OfflineBanner';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { PullToRefreshContainer } from '../../components/ui/PullToRefreshContainer';
import { Skeleton } from '../../components/ui/Skeleton';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useRequest } from '../../hooks/useRequest';
import { useRouteScrollRestoration } from '../../hooks/useRouteScrollRestoration';
import { useAppNavigate } from '../../lib/navigation';

const PAGE_SIZE = 10;
const EMPTY_RESPONSE: MyCollectionResponse = {
  list: [],
  total: 0,
  page: 1,
  limit: PAGE_SIZE,
  last_page: 1,
};

const STATUS_TABS: Array<{ key: MyCollectionStatus; label: string }> = [
  { key: 'holding', label: '持有中' },
  { key: 'consigned', label: '寄售中' },
  { key: 'mining', label: '运行中' },
  { key: 'sold', label: '已售出' },
  { key: 'failed', label: '寄售失败' },
  { key: 'all', label: '全部' },
];

function formatMoney(value: number): string {
  const amount = Number.isFinite(value) ? value : 0;
  return amount.toFixed(2);
}

function formatSignedAmount(value: number): string {
  const amount = Number.isFinite(value) ? value : 0;
  const prefix = amount > 0 ? '+' : '';
  return `${prefix}${amount.toFixed(2)}`;
}

function formatHash(value: string): string {
  if (!value) {
    return '--';
  }

  if (value.length <= 16) {
    return value;
  }

  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

function isFailedItem(item: MyCollectionItem): boolean {
  return item.consignment_status === 3 || item.status_text === '寄售失败';
}

function isSoldItem(item: MyCollectionItem): boolean {
  return item.consignment_status === 2 || item.status_text === '已售出';
}

function isMiningItem(item: MyCollectionItem): boolean {
  return item.mining_status === 1 || item.status_text === '运行中';
}

function getStatusBadgeClass(item: MyCollectionItem): string {
  if (isFailedItem(item)) {
    return 'bg-amber-100 text-amber-700';
  }

  if (isSoldItem(item)) {
    return 'bg-emerald-100 text-emerald-700';
  }

  if (isMiningItem(item)) {
    return 'bg-sky-100 text-sky-700';
  }

  if (item.consignment_status === 1 || item.status_text === '寄售中') {
    return 'bg-violet-100 text-violet-700';
  }

  return 'bg-red-100 text-red-700';
}

function getPrimaryTimeMeta(item: MyCollectionItem): { label: string; value: string } {
  if (isSoldItem(item)) {
    return { label: '成交时间', value: item.sold_time || item.settle_time || '--' };
  }

  if (isFailedItem(item)) {
    return { label: '寄售结束', value: item.sold_time || item.create_time_text || '--' };
  }

  if (isMiningItem(item)) {
    return { label: '启动时间', value: item.mining_start_time_text || item.create_time_text || '--' };
  }

  return { label: '入藏时间', value: item.create_time_text || '--' };
}

function CollectionCard({
  item,
  onClick,
}: {
  item: MyCollectionItem;
  onClick?: () => void;
}) {
  const sold = isSoldItem(item);
  const failed = isFailedItem(item);
  const zoneLabel = item.price_zone || item.zone_name || '--';
  const primaryPriceLabel = sold ? '成交价' : failed ? '挂单价' : '买入价';
  const primaryPriceValue = sold || failed ? item.sold_price || item.buy_price : item.buy_price;
  const secondaryLabel = sold || failed ? '买入价' : '市场价';
  const secondaryValue = sold || failed ? item.buy_price : item.market_price || item.buy_price;
  const thirdLabel = sold ? '收益' : failed ? '服务费' : '交易次数';
  const thirdValue = sold
    ? formatSignedAmount(item.profit_amount)
    : failed
      ? `￥${formatMoney(item.service_fee)}`
      : `${item.transaction_count} 次`;
  const fourthLabel = sold ? '到账拆分' : '流拍次数';
  const fourthValue = sold
    ? `可提现 ￥${formatMoney(item.payout_total_withdrawable)} / 消费金 ￥${formatMoney(item.payout_total_consume)}`
    : `${item.fail_count} 次`;
  const timeMeta = getPrimaryTimeMeta(item);
  const interactive = typeof onClick === 'function';

  return (
    <Card
      className={`overflow-hidden p-0 shadow-sm transition ${interactive ? 'cursor-pointer active:scale-[0.995]' : ''}`}
      onClick={onClick}
      onKeyDown={(event) => {
        if (!interactive) {
          return;
        }

        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      }}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
    >
      <div className="flex gap-3 border-b border-border-light px-4 py-4">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-bg-base">
          {item.image ? (
            <img
              src={item.image}
              alt={item.title}
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-text-aux">
              <Box size={30} />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="line-clamp-2 text-[15px] font-semibold leading-6 text-text-main">
                {item.title || '未命名藏品'}
              </h2>
              <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-text-aux">
                <span className="rounded-full bg-bg-base px-2 py-1">{item.session_title || '未分场次'}</span>
                <span className="rounded-full bg-bg-base px-2 py-1">{zoneLabel}</span>
              </div>
            </div>

            <div className="shrink-0 text-right">
              <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${getStatusBadgeClass(item)}`}>
                {item.status_text}
              </span>
              <div className="mt-3 text-[11px] text-text-aux">{primaryPriceLabel}</div>
              <div className="mt-1 text-xl font-bold leading-none text-text-main">
                ￥{formatMoney(primaryPriceValue)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[12px]">
            <div className="rounded-2xl bg-bg-base px-3 py-2.5">
              <div className="text-text-aux">{secondaryLabel}</div>
              <div className="mt-1 font-semibold text-text-main">￥{formatMoney(secondaryValue)}</div>
            </div>
            <div className="rounded-2xl bg-bg-base px-3 py-2.5">
              <div className="text-text-aux">{thirdLabel}</div>
              <div className={`mt-1 font-semibold ${sold ? (item.profit_amount >= 0 ? 'text-emerald-600' : 'text-red-600') : 'text-text-main'}`}>
                {thirdValue}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2 px-4 py-3 text-[12px] text-text-sub">
        <div className="flex items-center justify-between gap-4">
          <span className="text-text-aux">{timeMeta.label}</span>
          <span className="truncate text-right text-text-main">{timeMeta.value}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-text-aux">{fourthLabel}</span>
          <span className="truncate text-right text-text-main">{fourthValue}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-text-aux">资产编号</span>
          <span className="truncate text-right font-mono text-text-main">
            {item.asset_code || item.unique_id || '--'}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-text-aux">Hash</span>
          <span className="truncate text-right font-mono text-text-main">{formatHash(item.hash)}</span>
        </div>
        {interactive ? (
          <div className="flex items-center justify-end gap-1 pt-1 text-[12px] font-medium text-primary-start">
            <span>查看持有凭证</span>
            <ChevronRight size={14} />
          </div>
        ) : null}
      </div>
    </Card>
  );
}

function CollectionListSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {[1, 2, 3].map((item) => (
        <div key={item} className="rounded-[20px] border border-border-light bg-bg-card p-4 shadow-sm">
          <div className="flex gap-3">
            <Skeleton className="h-24 w-24 rounded-2xl" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
              <div className="grid grid-cols-2 gap-2">
                <Skeleton className="h-16 rounded-2xl" />
                <Skeleton className="h-16 rounded-2xl" />
              </div>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export const MyCollectionPage = () => {
  const { goBackOr, navigate } = useAppNavigate();
  const { isOffline, refreshStatus } = useNetworkStatus();
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [activeStatus, setActiveStatus] = useState<MyCollectionStatus>('holding');
  const [draftKeyword, setDraftKeyword] = useState('');
  const [keyword, setKeyword] = useState('');
  const [items, setItems] = useState<MyCollectionItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const queryKey = `${activeStatus}::${keyword}`;
  const queryKeyRef = useRef(queryKey);

  useEffect(() => {
    queryKeyRef.current = queryKey;
    setItems([]);
    setPage(1);
    setHasMore(false);
    setLoadMoreError(null);
    scrollContainerRef.current?.scrollTo({ top: 0 });
  }, [queryKey]);

  const firstRequest = useRequest(
    async (signal) => {
      const response = await collectionTradeApi.myCollection(
        {
          page: 1,
          limit: PAGE_SIZE,
          status: activeStatus,
          ...(keyword ? { keyword } : {}),
        },
        signal,
      );

      setItems(response.list);
      setPage(response.page);
      setHasMore(response.page < response.last_page);
      setLoadMoreError(null);
      return response;
    },
    {
      deps: [activeStatus, keyword],
      initialData: EMPTY_RESPONSE,
      keepPreviousData: false,
    },
  );

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) {
      return;
    }

    const nextPage = page + 1;
    const requestKey = queryKeyRef.current;

    setLoadingMore(true);
    setLoadMoreError(null);

    try {
      const response = await collectionTradeApi.myCollection({
        page: nextPage,
        limit: PAGE_SIZE,
        status: activeStatus,
        ...(keyword ? { keyword } : {}),
      });

      if (queryKeyRef.current !== requestKey) {
        return;
      }

      setItems((current) => [...current, ...response.list]);
      setPage(response.page);
      setHasMore(response.page < response.last_page);
    } catch (error) {
      if (queryKeyRef.current !== requestKey) {
        return;
      }

      setLoadMoreError(getErrorMessage(error));
    } finally {
      if (queryKeyRef.current === requestKey) {
        setLoadingMore(false);
      }
    }
  }, [activeStatus, hasMore, keyword, loadingMore, page]);

  useInfiniteScroll({
    hasMore,
    loading: loadingMore,
    onLoadMore: loadMore,
    rootRef: scrollContainerRef,
    targetRef: loadMoreRef,
  });

  useRouteScrollRestoration({
    containerRef: scrollContainerRef,
    namespace: 'my-collection-page',
    restoreDeps: [activeStatus, keyword, firstRequest.loading, items.length],
    restoreWhen: !firstRequest.loading && items.length > 0,
  });

  const handleRefresh = useCallback(async () => {
    await firstRequest.reload().catch(() => undefined);
  }, [firstRequest]);

  const handleSearchSubmit = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setKeyword(draftKeyword.trim());
  }, [draftKeyword]);

  const handleClearKeyword = useCallback(() => {
    setDraftKeyword('');
    setKeyword('');
  }, []);

  const handleOpenDetail = useCallback((item: MyCollectionItem) => {
    const targetId = item.user_collection_id || item.id;
    if (!targetId) {
      return;
    }

    navigate(`/my-collection/detail/${targetId}`);
  }, [navigate]);

  const total = firstRequest.data?.total ?? items.length;

  const renderLoadMore = () => {
    if (loadingMore) {
      return (
        <span className="inline-flex items-center">
          <RefreshCcw size={14} className="mr-2 animate-spin" />
          加载中...
        </span>
      );
    }

    if (loadMoreError) {
      return (
        <button
          type="button"
          className="rounded-full border border-border-light px-4 py-2 text-text-main"
          onClick={() => void loadMore()}
        >
          加载失败，点击重试
        </button>
      );
    }

    if (hasMore) {
      return <span>继续下拉加载更多</span>;
    }

    if (items.length > PAGE_SIZE) {
      return <span>没有更多了</span>;
    }

    return null;
  };

  const renderContent = () => {
    if (firstRequest.loading && items.length === 0) {
      return <CollectionListSkeleton />;
    }

    if (firstRequest.error && items.length === 0) {
      return (
        <ErrorState
          message={getErrorMessage(firstRequest.error)}
          onRetry={() => void firstRequest.reload()}
        />
      );
    }

    if (items.length === 0) {
      return (
        <EmptyState
          icon={<Box size={42} />}
          message={keyword ? '没有找到匹配的藏品' : '暂时还没有藏品'}
        />
      );
    }

    return (
      <div className="space-y-3 p-4 pb-8">
        {items.map((item) => (
          <div key={`${item.consignment_id || item.user_collection_id || item.id}-${item.status_text}`}>
            <CollectionCard item={item} onClick={() => handleOpenDetail(item)} />
          </div>
        ))}

        <div ref={loadMoreRef} className="py-4 text-center text-sm text-text-aux">
          {renderLoadMore()}
        </div>
      </div>
    );
  };

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-bg-base">
      {isOffline && <OfflineBanner onAction={refreshStatus} />}

      <PageHeader title="我的藏品" onBack={() => goBackOr('user')} />

      <div className="z-10 shrink-0 border-b border-border-light bg-bg-card px-4 pb-4 pt-2">
        <form onSubmit={handleSearchSubmit} className="flex h-auto shrink-0 gap-2">
          <div className="relative flex h-11 flex-1 items-center overflow-hidden">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-aux" />
            <input
              value={draftKeyword}
              onChange={(event) => setDraftKeyword(event.target.value)}
              placeholder="搜索藏品标题"
              className="h-11 w-full rounded-2xl border border-border-light bg-bg-base pl-10 pr-10 text-lg text-text-main outline-none placeholder:text-text-aux"
            />
            {draftKeyword ? (
              <button
                type="button"
                onClick={handleClearKeyword}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-aux"
                aria-label="清空搜索"
              >
                <X size={16} />
              </button>
            ) : null}
          </div>
          <button
            type="submit"
            className="h-11 rounded-2xl bg-primary-start px-4 text-[14px] font-medium text-white"
          >
            搜索
          </button>
        </form>

        <div className="mt-3 flex min-w-0 gap-2 overflow-x-auto overflow-y-hidden no-scrollbar overscroll-x-contain">
          {STATUS_TABS.map((tab) => {
            const active = tab.key === activeStatus;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveStatus(tab.key)}
                className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-medium transition ${
                  active ? 'bg-primary-start text-white' : 'bg-bg-base text-text-sub'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex items-center justify-between text-[12px] text-text-aux">
          <span>共 {total} 件</span>
          {keyword ? <span className="truncate">关键词: {keyword}</span> : <span>按状态浏览</span>}
        </div>
      </div>

      <PullToRefreshContainer onRefresh={handleRefresh} disabled={isOffline}>
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto no-scrollbar">
          {renderContent()}
        </div>
      </PullToRefreshContainer>
    </div>
  );
};
