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

  /* ---- 数据状态 ---- */
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [sessionData, setSessionData] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  /* ---- 首次加载 ---- */
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

    return () => window.clearInterval(timer);
  }, []);

  const currentSession = useMemo(() => {
    const fromList = sessionListData?.list?.find((session) => session.id === sessionId);
    return fromList || sessionData ? { ...fromList, ...sessionData } : null;
  }, [sessionId, sessionListData?.list, sessionData]);

  const sessionTiming = useMemo(
    () =>
      currentSession
        ? getCollectionSessionTiming(currentSession.start_time, currentSession.end_time, nowMs)
        : getCollectionSessionTiming('00:00', '23:59', nowMs),
    [currentSession, nowMs],
  );

  const poolStatus = sessionTiming.status;
  const sessionTimeSlot = currentSession
    ? `${currentSession.start_time || '--:--'} - ${currentSession.end_time || '--:--'}`
    : '00:00 - 21:00';

  /* ---- 加载更多 ---- */
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
      // 静默失败，用户可重试
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

  /* ---- 下拉刷新 ---- */
  const handleRefresh = useCallback(async () => {
    await reloadFirst().catch(() => undefined);
  }, [reloadFirst]);

  const handleImageError = (id: number) => {
    setImageError((prev) => ({ ...prev, [id]: true }));
  };

  /** 获取图片 URL */
  const getImageUrl = (item: CollectionItem) => {
    if (!item.image) return '';
    return resolveUploadUrl(item.image);
  };

  /* ---- 渲染骨架屏 ---- */
  const renderSkeleton = () => (
    <div className="px-4 space-y-3">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="p-3 flex">
          <Skeleton className="w-[100px] h-[100px] rounded-xl mr-3 shrink-0" />
          <div className="flex-1 flex flex-col justify-between py-1">
            <div>
              <Skeleton className="w-full h-4 mb-2" />
              <Skeleton className="w-2/3 h-4 mb-2" />
              <Skeleton className="w-1/3 h-3" />
            </div>
            <div className="flex justify-between items-end mt-2">
              <Skeleton className="w-20 h-5" />
              <Skeleton className="w-16 h-8 rounded-full" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  /* ---- 渲染列表 ---- */
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
      <div className="px-4 space-y-3">
        {items.map((item, index) => (
          <Card
            key={item.package_id ?? index}
            className={`p-3 flex transition-opacity border border-white/50 shadow-sm ${
              poolStatus === 'in_progress'
                ? 'active:opacity-90 cursor-pointer'
                : 'opacity-80 cursor-not-allowed'
            }`}
            onClick={() => {
              if (poolStatus === 'in_progress') {
                navigate(`/trading/detail/${sessionId}/items/${item.package_id}`);
              }
            }}
          >
            {/* 商品图片 */}
            <div className="w-[100px] h-[100px] rounded-xl bg-bg-base mr-3 shrink-0 overflow-hidden relative border border-border-light/50">
              {imageError[item.package_id] || !item.image ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-bg-card text-text-aux">
                  <ImageIcon size={20} className="mb-1 opacity-50" />
                  <span className="text-2xs">{item.image ? '加载失败' : '暂无图片'}</span>
                </div>
              ) : (
                <img
                  src={getImageUrl(item)}
                  alt={item.package_name}
                  className="w-full h-full object-cover"
                  onError={() => handleImageError(item.package_id)}
                  referrerPolicy="no-referrer"
                />
              )}
            </div>

            {/* 商品信息 */}
            <div className="flex-1 flex flex-col justify-between py-0.5">
              <div>
                <h4 className="text-lg font-bold text-text-main leading-snug line-clamp-2 mb-1.5">
                  {item.package_name}
                </h4>
                <div className="flex items-center space-x-1.5 mb-1.5 flex-wrap gap-y-1">
                  <span className="text-2xs text-primary-start border border-primary-start/30 px-1.5 py-0.5 rounded-sm bg-red-50/50">
                    官方自营
                  </span>
                  {currentSession?.is_mixed_pay_available === true && (
                    <span className="text-2xs text-orange-500 border border-orange-500/30 px-1.5 py-0.5 rounded-sm bg-orange-50/50">
                      支持混合支付
                    </span>
                  )}
                </div>
                </div>
              <div className="flex items-end justify-between mt-2">
                <div className="flex flex-col">
                  <span className="text-xs text-text-sub mb-0.5">申购区间</span>
                  <span className="text-xl font-bold text-primary-start leading-none">
                    ¥{item.zone_range}
                  </span>
                </div>
                <button
                  className={`h-[36px] px-5 rounded-2xl text-base font-medium text-white shadow-sm transition-opacity ${
                    poolStatus !== 'in_progress'
                      ? 'bg-border-light text-text-aux cursor-not-allowed'
                      : 'bg-gradient-to-r from-primary-start to-primary-end active:opacity-80'
                  }`}
                  disabled={poolStatus !== 'in_progress'}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (poolStatus === 'in_progress') {
                      navigate(`/trading/pre-order/${sessionId}?package_id=${item.package_id}`);
                    }
                  }}
                >
                  {poolStatus === 'not_started' ? '未开始' : poolStatus === 'ended' ? '本场已结束' : '申购'}
                </button>
              </div>
            </div>
          </Card>
        ))}

        {/* 加载更多触发器 */}
        <div ref={loadMoreRef} className="py-4 text-center text-sm text-gray-400">
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
    <div className="flex-1 flex flex-col bg-bg-base relative overflow-hidden">
      <PageHeader
        title="资产申购"
        onBack={goBack}
        rightAction={
          <button className="p-1 active:opacity-70 transition-opacity">
            <HelpCircle size={20} className="text-text-main" />
          </button>
        }
      />

      <PullToRefreshContainer onRefresh={handleRefresh}>
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto no-scrollbar pb-8 bg-gradient-to-b from-red-50/50 to-bg-base dark:from-bg-base dark:to-bg-base">
          {/* Top Pool Info Card */}
          <div className="px-4 mb-5 mt-4">
            {firstLoading && items.length === 0 ? (
              <Card className="p-4">
                <div className="flex justify-between mb-4">
                  <div>
                    <Skeleton className="w-16 h-5 rounded-full mb-2" />
                    <Skeleton className="w-32 h-6" />
                  </div>
                  <Skeleton className="w-10 h-10 rounded-full" />
                </div>
                <Skeleton className="w-24 h-4 mb-4" />
                <Skeleton className="w-full h-16 rounded-xl" />
              </Card>
            ) : (
              <Card className="p-4 relative overflow-hidden border border-white/50 shadow-sm">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-start/5 rounded-bl-full -z-10"></div>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="inline-block px-2 py-0.5 bg-primary-start/10 text-primary-start text-xs font-bold rounded-tl-[8px] rounded-br-[8px] mb-2">
                      {currentSession?.code || `场次 ${sessionId || '--'}`}
                    </span>
                    <h2 className="text-4xl font-bold text-text-main leading-tight">
                      {currentSession?.title || '数字流量池'}
                    </h2>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-primary-start/40">
                    <Award size={24} />
                  </div>
                </div>
                <div className="flex items-center text-sm text-text-sub mb-4">
                  <Clock size={12} className="mr-1" /> {sessionTimeSlot}
                </div>
                <div className="flex bg-bg-base rounded-xl p-3 border border-border-light/50">
                  <div className="flex-1 flex flex-col">
                    <span className="text-s text-text-sub mb-1">预期收益率</span>
                    <span className="text-3xl font-bold text-primary-start">{currentSession?.roi || '5.5%'}</span>
                  </div>
                  <div className="w-px bg-border-light mx-3"></div>
                  <div className="flex-1 flex flex-col">
                    <span className="text-s text-text-sub mb-1">本期额度</span>
                    <span className="text-3xl font-bold text-text-main">{currentSession?.quota || '200万'}</span>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* List Header */}
          <div className="px-4 mb-3 flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-1 h-3.5 bg-primary-start rounded-full mr-2"></div>
              <h3 className="text-xl font-bold text-text-main">资产申购列表</h3>
            </div>
            <div className="flex items-center space-x-2">
              <button
                className="px-2.5 py-1 border border-border-light rounded-full text-s text-text-sub flex items-center active:bg-bg-card transition-colors"
                onClick={() => goTo('reservations')}
              >
                <FileText size={12} className="mr-1" /> 申购记录
              </button>
              <div
                className={`px-2.5 py-1 rounded-full text-s font-medium text-white shadow-sm ${
                  poolStatus === 'ended'
                    ? 'bg-text-aux'
                    : 'bg-gradient-to-r from-primary-start to-primary-end'
                }`}
              >
                {poolStatus === 'not_started'
                  ? `距开始 ${sessionTiming.countdownText}`
                  : poolStatus === 'in_progress'
                    ? `距结束 ${sessionTiming.countdownText}`
                    : '本场结束'}
              </div>
            </div>
          </div>

          {/* Asset List */}
          {renderList()}
        </div>
      </PullToRefreshContainer>
    </div>
  );
};
