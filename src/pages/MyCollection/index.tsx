/**
 * @file MyCollection/index.tsx
 * @description 展示用户持有的数字藏品列表，支持搜索、状态筛选和无限滚动。
 */

import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, ChevronRight, RefreshCcw, Search, X, Zap } from 'lucide-react';
import {
  collectionConsignmentApi,
  collectionTradeApi,
  type BatchConsignResult,
  type BatchConsignableListData,
  type MyCollectionItem,
  type MyCollectionResponse,
  type MyCollectionStatus,
} from '../../api';
import { getErrorMessage } from '../../api/core/errors';
import { OfflineBanner } from '../../components/layout/OfflineBanner';
import { PageHeader } from '../../components/layout/PageHeader';
import { useFeedback } from '../../components/ui/FeedbackProvider';
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

type CollectionCategoryTab = 'hold' | 'consign' | 'sold' | 'dividend';

const COLLECTION_CATEGORY_TABS: Array<{ key: CollectionCategoryTab; label: string }> = [
  { key: 'hold', label: '持仓中' },
  { key: 'consign', label: '寄售中' },
  { key: 'sold', label: '已流转' },
  { key: 'dividend', label: '权益节点' },
];

const CATEGORY_STATUS_MAP: Record<CollectionCategoryTab, MyCollectionStatus> = {
  hold: 'holding',
  consign: 'consigned',
  sold: 'sold',
  dividend: 'mining',
};

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

function isConsigningItem(item: MyCollectionItem): boolean {
  return item.consignment_status === 1 || item.status_text === '寄售中';
}

function isSoldItem(item: MyCollectionItem): boolean {
  return item.consignment_status === 2 || item.status_text === '已售出';
}

function isMiningItem(item: MyCollectionItem): boolean {
  return item.mining_status === 1 || item.status_text === '运行中';
}

function getStatusBadgeClass(item: MyCollectionItem): string {
  if (isFailedItem(item)) {
    return 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300';
  }

  if (isSoldItem(item)) {
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300';
  }

  if (isMiningItem(item)) {
    return 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300';
  }

  if (item.consignment_status === 1 || item.status_text === '寄售中') {
    return 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300';
  }

  return 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300';
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

function BatchConsignButton({
  checking,
  data,
  disabled,
  onClick,
}: {
  checking: boolean;
  data: BatchConsignableListData | null | undefined;
  disabled: boolean;
  onClick: () => void;
}) {
  if (!data || data.items.length === 0 || !data.stats.is_in_trading_time) {
    return null;
  }

  const availableCount = data.available_now_count || data.stats.available_collections || data.items.length;

  return (
    <div className="mt-3 rounded-2xl border border-[#f3d6cf] bg-[#fff7f4] p-3 dark:border-red-500/25 dark:bg-red-500/10">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary-start px-4 text-sm font-medium text-white disabled:opacity-50"
      >
        {checking ? (
          <>
            <RefreshCcw size={15} className="animate-spin" />
            <span>一键寄售检测中...</span>
          </>
        ) : (
          <>
            <Zap size={15} />
            <span>一键寄售</span>
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px]">
              {availableCount} 个可寄售
            </span>
          </>
        )}
      </button>
      <div className="mt-2 text-center text-[11px] leading-5 text-text-aux">
        当前时间 {data.stats.current_time || '--'}，活跃场次 {data.stats.active_sessions}
      </div>
    </div>
  );
}

function buildBatchFailureLines(result: BatchConsignResult): string[] {
  if (result.results.length > 0) {
    return result.results
      .filter((item) => !item.success)
      .map((item) => `藏品 ${item.user_collection_id}: ${item.message || '寄售失败'}`);
  }

  return Object.entries(result.failure_summary).map(([reason, count]) => `${reason}: ${count} 个`);
}

function getEmptyCollectionMessage(tab: CollectionCategoryTab, keyword: string): string {
  if (keyword) {
    return '没有找到匹配的藏品';
  }

  switch (tab) {
    case 'hold':
      return '暂时还没有持仓中的藏品';
    case 'consign':
      return '暂时还没有寄售中的藏品';
    case 'sold':
      return '暂时还没有已流转的藏品';
    case 'dividend':
      return '暂时还没有权益节点藏品';
    default:
      return '暂时还没有藏品';
  }
}

export const MyCollectionPage = () => {
  const { goBackOr, navigate } = useAppNavigate();
  const { isOffline, refreshStatus } = useNetworkStatus();
  const { hideLoading, showConfirm, showLoading, showToast } = useFeedback();
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [activeTab, setActiveTab] = useState<CollectionCategoryTab>('hold');
  const [draftKeyword, setDraftKeyword] = useState('');
  const [keyword, setKeyword] = useState('');
  const [items, setItems] = useState<MyCollectionItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const activeStatus = CATEGORY_STATUS_MAP[activeTab];
  const visibleItems = useMemo(() => {
    if (activeTab === 'consign') {
      return items.filter(isConsigningItem);
    }

    return items;
  }, [activeTab, items]);
  const queryKey = `${activeTab}::${keyword}`;
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
      deps: [activeTab, keyword],
      initialData: EMPTY_RESPONSE,
      keepPreviousData: false,
    },
  );

  const batchConsignRequest = useRequest<BatchConsignableListData | null>(
    (signal) => collectionConsignmentApi.batchConsignableList(signal),
    {
      cacheKey: 'my-collection:batch-consignable',
      initialData: null,
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
    restoreDeps: [activeTab, keyword, firstRequest.loading, visibleItems.length],
    restoreWhen: !firstRequest.loading && visibleItems.length > 0,
  });

  const handleRefresh = useCallback(async () => {
    refreshStatus();
    await Promise.allSettled([
      firstRequest.reload(),
      batchConsignRequest.reload(),
    ]);
  }, [batchConsignRequest, firstRequest, refreshStatus]);

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

    navigate(`/my-collection/detail/${targetId}`, { state: { item } });
  }, [navigate]);

  const handleBatchConsign = useCallback(async () => {
    const batchData = batchConsignRequest.data;
    if (!batchData || batchData.items.length === 0) {
      showToast({ type: 'warning', message: '暂无可一键寄售的藏品' });
      return;
    }

    if (!batchData.stats.is_in_trading_time) {
      showToast({ type: 'warning', message: '当前不在交易时段，暂不可一键寄售' });
      return;
    }

    const availableCount = batchData.available_now_count || batchData.stats.available_collections || batchData.items.length;
    const confirmed = await showConfirm({
      title: '一键寄售',
      message: (
        <div className="space-y-2 text-left text-sm leading-6">
          <p>将为 {availableCount} 个符合条件的藏品提交寄售申请。</p>
          {batchData.note ? <p className="text-text-sub">{batchData.note}</p> : null}
        </div>
      ),
      confirmText: '确认寄售',
      cancelText: '取消',
    });

    if (!confirmed) {
      return;
    }

    showLoading({ message: '一键寄售处理中...' });

    try {
      const result = await collectionConsignmentApi.batchConsign({
        consignments: batchData.items.map((item) => ({
          user_collection_id: item.user_collection_id,
        })),
      });

      await Promise.allSettled([
        firstRequest.reload(),
        batchConsignRequest.reload(),
      ]);

      hideLoading();

      if (result.success_count > 0 && result.failure_count === 0) {
        showToast({ type: 'success', message: `成功寄售 ${result.success_count} 个藏品` });
        return;
      }

      const failureLines = buildBatchFailureLines(result);
      await showConfirm({
        title: '一键寄售完成',
        message: (
          <div className="space-y-2 text-left text-sm leading-6">
            <p>总计 {result.total_count} 个</p>
            <p>成功 {result.success_count} 个，失败 {result.failure_count} 个</p>
            {result.note ? <p className="text-text-sub">{result.note}</p> : null}
            {failureLines.length > 0 ? (
              <div className="max-h-48 overflow-y-auto rounded-xl bg-bg-base px-3 py-2 text-xs text-text-sub">
                {failureLines.map((line) => (
                  <div key={line}>{line}</div>
                ))}
              </div>
            ) : null}
          </div>
        ),
        confirmText: '知道了',
        cancelText: '关闭',
      });
    } catch (error) {
      hideLoading();
      showToast({ type: 'error', message: getErrorMessage(error) || '一键寄售失败' });
    } finally {
      hideLoading();
    }
  }, [
    batchConsignRequest,
    firstRequest,
    hideLoading,
    showConfirm,
    showLoading,
    showToast,
  ]);

  const total = activeTab === 'consign'
    ? visibleItems.length
    : firstRequest.data?.total ?? visibleItems.length;

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

    if (visibleItems.length === 0) {
      return (
        <EmptyState
          icon={<Box size={42} />}
          message={getEmptyCollectionMessage(activeTab, keyword)}
        />
      );
    }

    return (
      <div className="space-y-3 p-4 pb-8">
        {visibleItems.map((item) => (
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

        <div className="mt-3 rounded-[18px] border border-[#f0e3d6] bg-[#fbf6ef] p-1.5 shadow-[0_8px_24px_rgba(140,97,54,0.06)] dark:border-white/10 dark:bg-white/5 dark:shadow-none">
          <div className="grid grid-cols-4 gap-1.5">
            {COLLECTION_CATEGORY_TABS.map((tab) => {
              const active = tab.key === activeTab;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`min-h-11 rounded-[14px] px-2 py-2 text-[12px] font-bold transition ${
                    active
                      ? 'bg-white text-primary-start shadow-[0_6px_18px_rgba(140,97,54,0.12)] dark:bg-bg-card dark:text-red-300 dark:shadow-none'
                      : 'text-text-sub'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <BatchConsignButton
          checking={batchConsignRequest.loading}
          data={batchConsignRequest.data}
          disabled={isOffline || batchConsignRequest.loading}
          onClick={() => void handleBatchConsign()}
        />

        <div className="mt-3 flex items-center justify-between text-[12px] text-text-aux">
          <span>共 {total} 件</span>
          {keyword ? <span className="truncate">关键词: {keyword}</span> : <span>按分类浏览</span>}
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
