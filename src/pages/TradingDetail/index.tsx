/**
 * @file 资产申购详情页
 * @description 根据专场 ID 加载商品列表，支持分页、筛选、下拉刷新。
 */

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { HelpCircle, Image as ImageIcon, AlertCircle, Clock, FileText, Award, RefreshCcw } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../components/layout/PageHeader';
import { PullToRefreshContainer } from '../../components/ui/PullToRefreshContainer';
import { useAppNavigate } from '../../lib/navigation';
import { getCollectionSessionTiming } from '../../lib/collectionSessionTiming';
import { useRequest } from '../../hooks/useRequest';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import { useRouteScrollRestoration } from '../../hooks/useRouteScrollRestoration';
import { collectionItemApi, collectionSessionApi, type CollectionItem } from '../../api';
import { resolveUploadUrl } from '../../api/modules/upload';

const PAGE_SIZE = 10;

export const TradingDetailPage = () => {
  const { goTo, goBack, navigate } = useAppNavigate();
  const { id } = useParams();
  const sessionId = Number(id) || 0;

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const [imageError, setImageError] = useState<Record<number, boolean>>({});
  const [nowMs, setNowMs] = useState(() => Date.now());

  const [items, setItems] = useState<CollectionItem[]>([]);
  const [sessionData, setSessionData] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const {
    error: firstError,
    loading: firstLoading,
    reload: reloadFirst,
  } = useRequest(
    async (signal) => {
      if (!sessionId) return null;
      const res = await collectionItemApi.getBySession(
        { session_id: sessionId, page: 1, limit: PAGE_SIZE },
        signal,
      );
      const list = res?.list ?? [];
      setItems(list);
      if (res?.session) {
        setSessionData(res.session);
      }
      setPage(1);
      setHasMore(list.length >= PAGE_SIZE);
      return res;
    },
    {
      cacheKey: sessionId ? `trading-detail:${sessionId}` : undefined,
      deps: [sessionId],
      manual: !sessionId,
    },
  );

  const { data: sessionListData } = useRequest(
    (signal) => collectionSessionApi.getList(signal),
    { cacheKey: 'trading-zone:sessions' },
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => window.clearTimeout(timer);
  }, []);

  const currentSession = useMemo(() => {
    const fromList = sessionListData?.list?.find((session) => session.id === sessionId);
    return fromList || sessionData ? { ...fromList, ...sessionData } : null;
  }, [sessionId, sessionListData?.list, sessionData]);

  const sessionStartTime = currentSession?.start_time || '00:00';
  const sessionEndTime = currentSession?.end_time || '23:59';

  const sessionTiming = useMemo(
    () =>
      currentSession
        ? getCollectionSessionTiming(sessionStartTime, sessionEndTime, nowMs)
        : getCollectionSessionTiming('00:00', '23:59', nowMs),
    [currentSession, nowMs, sessionEndTime, sessionStartTime],
  );

  const poolStatus = sessionTiming.status;
  const sessionTimeSlot = currentSession
    ? `${sessionStartTime || '--:--'} - ${sessionEndTime || '--:--'}`
    : '00:00 - 21:00';

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !sessionId) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const res = await collectionItemApi.getBySession({
        session_id: sessionId,
        page: nextPage,
        limit: PAGE_SIZE,
      });
      const list = res?.list ?? [];
      setItems((prev) => [...prev, ...list]);
      setPage(nextPage);
      setHasMore(list.length >= PAGE_SIZE);
    } catch {
      // Ignore transient load-more failures.
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, page, sessionId]);

  useInfiniteScroll({
    hasMore,
    loading: loadingMore,
    onLoadMore: loadMore,
    rootRef: scrollContainerRef,
    targetRef: loadMoreRef,
  });

  useRouteScrollRestoration({
    containerRef: scrollContainerRef,
    namespace: `trading-detail-${sessionId}`,
    restoreDeps: [firstLoading, items.length],
    restoreWhen: !firstLoading && items.length > 0,
  });

  const handleRefresh = useCallback(async () => {
    await reloadFirst().catch(() => undefined);
  }, [reloadFirst]);

  const handleImageError = (id: number) => {
    setImageError((prev) => ({ ...prev, [id]: true }));
  };

  const getImageUrl = (item: CollectionItem) => {
    if (!item.image) return '';
    return resolveUploadUrl(item.image);
  };

  const openPreOrder = useCallback(
    (packageId: number) => {
      if (poolStatus !== 'in_progress') {
        return;
      }

      navigate(`/trading/pre-order/${sessionId}?package_id=${packageId}`);
    },
    [navigate, poolStatus, sessionId],
  );

  const renderSkeleton = () => (
    <div className="px-4 space-y-3">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="flex p-3">
          <Skeleton className="mr-3 h-[100px] w-[100px] shrink-0 rounded-xl" />
          <div className="flex flex-1 flex-col justify-between py-1">
            <div>
              <Skeleton className="mb-2 h-4 w-full" />
              <Skeleton className="mb-2 h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <div className="mt-2 flex items-end justify-between">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-8 w-16 rounded-full" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  const renderList = () => {
    if (firstLoading && items.length === 0) return renderSkeleton();

    if (firstError && items.length === 0) {
      return <ErrorState message="列表加载失败，请检查网络" onRetry={reloadFirst} />;
    }

    if (items.length === 0) {
      return (
        <EmptyState
          message="暂无可申购资产"
          actionText="返回交易场次"
          onAction={goBack}
        />
      );
    }

    return (
      <div className="space-y-3 px-4">
        {items.map((item, index) => (
          <Card
            key={`package-${item.package_id || 0}-${index}`}
            className={`flex border border-white/50 p-3 shadow-sm transition-opacity ${
              poolStatus === 'in_progress'
                ? 'cursor-pointer active:opacity-90'
                : 'cursor-not-allowed opacity-80'
            }`}
            onClick={() => openPreOrder(item.package_id)}
          >
            <div className="relative mr-3 h-[100px] w-[100px] shrink-0 overflow-hidden rounded-xl border border-border-light/50 bg-bg-base">
              {imageError[item.package_id] || !item.image ? (
                <div className="flex h-full w-full flex-col items-center justify-center bg-bg-card text-text-aux">
                  <ImageIcon size={20} className="mb-1 opacity-50" />
                  <span className="text-2xs">{item.image ? '加载失败' : '暂无图片'}</span>
                </div>
              ) : (
                <img
                  src={getImageUrl(item)}
                  alt={item.package_name}
                  className="h-full w-full object-cover"
                  onError={() => handleImageError(item.package_id)}
                  referrerPolicy="no-referrer"
                />
              )}
            </div>

            <div className="flex flex-1 flex-col justify-between py-0.5">
              <div>
                <h4 className="mb-1.5 line-clamp-2 text-lg font-bold leading-snug text-text-main">
                  {item.package_name}
                </h4>
                <div className="mb-1.5 flex flex-wrap items-center gap-y-1 space-x-1.5">
                  <span className="rounded-sm border border-primary-start/30 bg-red-50/50 px-1.5 py-0.5 text-2xs text-primary-start">
                    官方自营
                  </span>
                  {currentSession?.is_mixed_pay_available === true && (
                    <span className="rounded-sm border border-orange-500/30 bg-orange-50/50 px-1.5 py-0.5 text-2xs text-orange-500">
                      支持混合支付
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-2 flex items-end justify-between">
                <div className="flex flex-col">
                  <span className="mb-0.5 text-xs text-text-sub">申购区间</span>
                  <span className="text-xl font-bold leading-none text-primary-start">
                    ¥{item.zone_range}
                  </span>
                </div>
                <button
                  className={`h-[36px] rounded-2xl px-5 text-base font-medium text-white shadow-sm transition-opacity ${
                    poolStatus !== 'in_progress'
                      ? 'cursor-not-allowed bg-border-light text-text-aux'
                      : 'gradient-primary-r active:opacity-80'
                  }`}
                  disabled={poolStatus !== 'in_progress'}
                  onClick={(event) => {
                    event.stopPropagation();
                    openPreOrder(item.package_id);
                  }}
                >
                  {poolStatus === 'not_started' ? '未开始' : poolStatus === 'ended' ? '本场已结束' : '申购'}
                </button>
              </div>
            </div>
          </Card>
        ))}

        <div ref={loadMoreRef} className="py-4 text-center text-sm text-text-aux dark:text-white/45">
          {loadingMore ? (
            <span className="inline-flex items-center">
              <RefreshCcw size={14} className="mr-2 animate-spin" />
              加载中...
            </span>
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
      <PageHeader
        title="资产申购"
        onBack={goBack}
        rightAction={
          <button className="p-1 transition-opacity active:opacity-70">
            <HelpCircle size={20} className="text-text-main" />
          </button>
        }
      />

      <PullToRefreshContainer onRefresh={handleRefresh}>
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto bg-gradient-to-b from-red-50/50 to-bg-base pb-8 no-scrollbar dark:from-bg-base dark:to-bg-base">
          <div className="mb-5 mt-4 px-4">
            {firstLoading && items.length === 0 ? (
              <Card className="p-4">
                <div className="mb-4 flex justify-between">
                  <div>
                    <Skeleton className="mb-2 h-5 w-16 rounded-full" />
                    <Skeleton className="h-6 w-32" />
                  </div>
                  <Skeleton className="h-10 w-10 rounded-full" />
                </div>
                <Skeleton className="mb-4 h-4 w-24" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </Card>
            ) : (
              <Card className="relative overflow-hidden border border-white/50 p-4 shadow-sm">
                <div className="absolute right-0 top-0 -z-10 h-32 w-32 rounded-bl-full bg-primary-start/5"></div>
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <span className="mb-2 inline-block rounded-tl-[8px] rounded-br-[8px] bg-primary-start/10 px-2 py-0.5 text-xs font-bold text-primary-start">
                      {currentSession?.code || `场次 ${sessionId || '--'}`}
                    </span>
                    <h2 className="text-4xl font-bold leading-tight text-text-main">
                      {currentSession?.title || '数字流量池'}
                    </h2>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-primary-start/40">
                    <Award size={24} />
                  </div>
                </div>
                <div className="mb-4 flex items-center text-sm text-text-sub">
                  <Clock size={12} className="mr-1" /> {sessionTimeSlot}
                </div>
                <div className="flex rounded-xl border border-border-light/50 bg-bg-base p-3">
                  <div className="flex-1 flex-col">
                    <span className="mb-1 text-s text-text-sub">预期收益率</span>
                    <span className="text-3xl font-bold text-primary-start">{currentSession?.roi || '5.5%'}</span>
                  </div>
                  <div className="mx-3 w-px bg-border-light"></div>
                  <div className="flex-1 flex-col">
                    <span className="mb-1 text-s text-text-sub">状态</span>
                    <span className={`inline-flex items-center text-sm font-bold ${
                      poolStatus === 'in_progress'
                        ? 'text-emerald-600'
                        : poolStatus === 'not_started'
                          ? 'text-orange-500'
                          : 'text-text-aux'
                    }`}>
                      <span className={`mr-1.5 inline-block h-2 w-2 rounded-full ${
                        poolStatus === 'in_progress'
                          ? 'bg-emerald-500'
                          : poolStatus === 'not_started'
                            ? 'bg-orange-400'
                            : 'bg-text-aux'
                      }`} />
                      {poolStatus === 'in_progress' ? '申购中' : poolStatus === 'not_started' ? '未开始' : '已结束'}
                    </span>
                  </div>
                </div>
                {poolStatus === 'not_started' && sessionTiming.remainingLabel ? (
                  <div className="mt-3 flex items-center rounded-xl bg-orange-50/70 px-3 py-2 text-sm text-orange-600">
                    <AlertCircle size={14} className="mr-2" />
                    距离开始还有 {sessionTiming.remainingLabel}
                  </div>
                ) : null}
                {poolStatus === 'ended' ? (
                  <div className="mt-3 flex items-center rounded-xl bg-gray-100/80 px-3 py-2 text-sm text-text-sub dark:bg-white/10 dark:text-white/65">
                    <AlertCircle size={14} className="mr-2" />
                    本场申购已结束，请关注下一场开放时间
                  </div>
                ) : null}
              </Card>
            )}
          </div>

          <div className="mb-3 flex items-center justify-between px-4">
            <div className="flex items-center">
              <div className="mr-2 h-3.5 w-1 rounded-full bg-primary-start"></div>
              <h3 className="text-xl font-bold text-text-main">资产申购列表</h3>
            </div>
            <div className="flex items-center space-x-2">
              <button
                className="flex items-center rounded-full border border-border-light px-2.5 py-1 text-s text-text-sub transition-colors active:bg-bg-card"
                onClick={() => goTo('reservations')}
              >
                <FileText size={12} className="mr-1" /> 申购记录
              </button>
              <div
                className={`rounded-full px-2.5 py-1 text-s font-medium ${
                  poolStatus === 'in_progress'
                    ? 'bg-emerald-50 text-emerald-600'
                    : poolStatus === 'not_started'
                      ? 'bg-orange-50 text-orange-500'
                      : 'bg-gray-100 text-text-sub dark:bg-white/10 dark:text-white/65'
                }`}
              >
                {poolStatus === 'in_progress' ? '进行中' : poolStatus === 'not_started' ? '即将开始' : '已结束'}
              </div>
            </div>
          </div>

          {renderList()}
        </div>
      </PullToRefreshContainer>
    </div>
  );
};
