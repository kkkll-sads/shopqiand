/**
 * @file 限时秒杀页
 * @description 展示当前秒杀活动信息与商品列表，支持倒计时、分页、下拉刷新。
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Zap, Image as ImageIcon, RefreshCcw, Clock, ShoppingCart } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../components/layout/PageHeader';
import { PullToRefreshContainer } from '../../components/ui/PullToRefreshContainer';
import { useAppNavigate } from '../../lib/navigation';
import { useRequest } from '../../hooks/useRequest';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import { useRouteScrollRestoration } from '../../hooks/useRouteScrollRestoration';
import { flashSaleApi, type FlashSaleProduct, type FlashSaleActivity } from '../../api';
import { resolveUploadUrl } from '../../api/modules/upload';

const PAGE_SIZE = 10;

/** 格式化倒计时 */
function formatCountdown(seconds: number): string {
  if (seconds <= 0) return '00:00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** 计算折扣百分比 */
function calcDiscount(flashPrice: number, originalPrice: number): string {
  if (!originalPrice || originalPrice <= 0) return '';
  const discount = (flashPrice / originalPrice) * 10;
  return discount.toFixed(1) + '折';
}

export const FlashSalePage = () => {
  const { goTo, goBack, navigate } = useAppNavigate();

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const [items, setItems] = useState<FlashSaleProduct[]>([]);
  const [activity, setActivity] = useState<FlashSaleActivity | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [imageError, setImageError] = useState<Record<number, boolean>>({});
  const [countdown, setCountdown] = useState(0);

  /* ---- 请求秒杀商品列表（自动附带活动信息） ---- */
  const {
    error: firstError,
    loading: firstLoading,
    reload: reloadFirst,
  } = useRequest(
    async (signal) => {
      const res = await flashSaleApi.getProducts({ page: 1, limit: PAGE_SIZE }, signal);
      const list = res?.list ?? [];
      setItems(list);
      setPage(1);
      setHasMore(list.length >= PAGE_SIZE);
      if (res?.activity) {
        setActivity(res.activity);
      }
      return res;
    },
    { cacheKey: 'flash-sale:products' },
  );

  /* ---- 倒计时 ---- */
  useEffect(() => {
    if (!activity) return;
    const updateCountdown = () => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = activity.end_time - now;
      setCountdown(remaining > 0 ? remaining : 0);
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [activity]);

  /* ---- 加载更多 ---- */
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const res = await flashSaleApi.getProducts({
        activity_id: activity?.id,
        page: nextPage,
        limit: PAGE_SIZE,
      });
      const list = res?.list ?? [];
      setItems((prev) => [...prev, ...list]);
      setPage(nextPage);
      setHasMore(list.length >= PAGE_SIZE);
    } catch {
      // 静默
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, page, activity]);

  useInfiniteScroll({
    hasMore,
    loading: loadingMore,
    onLoadMore: loadMore,
    rootRef: scrollContainerRef,
    targetRef: loadMoreRef,
  });

  useRouteScrollRestoration({
    containerRef: scrollContainerRef,
    namespace: 'flash-sale',
    restoreDeps: [firstLoading, items.length],
    restoreWhen: !firstLoading && items.length > 0,
  });

  const handleRefresh = useCallback(async () => {
    await reloadFirst().catch(() => undefined);
  }, [reloadFirst]);

  const handleImageError = (id: number) => {
    setImageError((prev) => ({ ...prev, [id]: true }));
  };

  /* ---- 渲染活动信息栏 ---- */
  const renderActivityBanner = () => {
    if (firstLoading && !activity) {
      return (
        <div className="mx-4 mt-4 mb-3">
          <Skeleton className="w-full h-20 rounded-2xl" />
        </div>
      );
    }

    if (!activity) return null;

    const isActive = countdown > 0;

    return (
      <div className="mx-4 mt-4 mb-3">
        <div className={`rounded-2xl px-4 py-4 relative overflow-hidden ${isActive ? 'bg-gradient-to-r from-[#FF4142] to-[#FF6B2B]' : 'bg-gray-400'}`}>
          <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full border-4 border-white/10"></div>
          <div className="absolute right-8 bottom-[-20px] w-20 h-20 rounded-full bg-white/10 blur-xl"></div>

          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="flex items-center mb-1">
                <Zap size={18} className="text-yellow-300 mr-1.5" fill="currentColor" />
                <h2 className="text-white text-xl font-bold">{activity.name}</h2>
              </div>
              <p className="text-white/80 text-sm">
                {isActive ? '正在进行中' : '活动已结束'}
              </p>
            </div>
            <div className="text-right">
              <div className="text-white/70 text-xs mb-1">
                {isActive ? '距结束' : '已结束'}
              </div>
              {isActive && (
                <div className="flex items-center space-x-1">
                  {formatCountdown(countdown).split(':').map((seg, i) => (
                    <React.Fragment key={i}>
                      {i > 0 && <span className="text-white/60 text-lg font-bold">:</span>}
                      <span className="bg-white/20 backdrop-blur-sm text-white font-mono font-bold text-lg px-2 py-0.5 rounded-lg min-w-[36px] text-center">
                        {seg}
                      </span>
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ---- 渲染骨架屏 ---- */
  const renderSkeleton = () => (
    <div className="grid grid-cols-2 gap-3 px-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="overflow-hidden">
          <Skeleton className="w-full aspect-square rounded-none" />
          <div className="p-3 space-y-2">
            <Skeleton className="w-full h-4" />
            <Skeleton className="w-1/2 h-5" />
            <Skeleton className="w-full h-8 rounded-full" />
          </div>
        </Card>
      ))}
    </div>
  );

  /* ---- 渲染列表 ---- */
  const renderList = () => {
    if (firstLoading && items.length === 0) return renderSkeleton();

    if (firstError && items.length === 0) {
      return <ErrorState message="加载失败，请检查网络" onRetry={reloadFirst} />;
    }

    if (items.length === 0) {
      return (
        <EmptyState
          message="暂无秒杀商品"
          actionText="看看商城"
          onAction={() => goTo('store')}
        />
      );
    }

    return (
      <>
        <div className="grid grid-cols-2 gap-3 px-4">
          {items.map((item, index) => {
            const discount = calcDiscount(item.flash_price, item.original_price);
            const soldOut = item.stock <= 0;

            return (
              <Card
                key={`flash-sale-item-${item.flash_sale_product_id || item.product_id || 0}-${index}`}
                className={`overflow-hidden border border-white/50 shadow-sm transition-opacity cursor-pointer ${soldOut ? 'opacity-60' : 'active:opacity-90'}`}
                onClick={() => {
                  if (!soldOut) {
                    navigate(`/product/${item.product_id}`);
                  }
                }}
              >
                {/* 商品图片 */}
                <div className="w-full aspect-square bg-bg-base relative overflow-hidden">
                  {imageError[item.flash_sale_product_id] || !item.thumbnail ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-bg-card text-text-aux">
                      <ImageIcon size={24} className="mb-1 opacity-50" />
                      <span className="text-2xs">暂无图片</span>
                    </div>
                  ) : (
                    <img
                      src={resolveUploadUrl(item.thumbnail)}
                      alt={item.product_name}
                      className="w-full h-full object-cover"
                      onError={() => handleImageError(item.flash_sale_product_id)}
                      referrerPolicy="no-referrer"
                    />
                  )}
                  {/* 折扣标签 */}
                  {discount && (
                    <div className="absolute top-2 left-2 bg-[#FF4142] text-white text-2xs px-1.5 py-0.5 rounded-sm font-bold">
                      {discount}
                    </div>
                  )}
                  {/* 限购标签 */}
                  {item.limit_per_user > 0 && (
                    <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white text-2xs px-1.5 py-0.5 rounded-sm">
                      限购{item.limit_per_user}件
                    </div>
                  )}
                  {/* 售罄遮罩 */}
                  {soldOut && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white font-bold text-lg">已抢光</span>
                    </div>
                  )}
                </div>

                {/* 商品信息 */}
                <div className="p-3">
                  <h4 className="text-base font-medium text-text-main leading-snug line-clamp-2 mb-2">
                    {item.product_name}
                  </h4>
                  {/* 价格 */}
                  <div className="flex items-end space-x-2 mb-2">
                    <span className="text-lg font-bold text-[#FF4142]">
                      ¥{item.flash_price}
                    </span>
                    <span className="text-xs text-text-aux line-through mb-0.5">
                      ¥{item.original_price}
                    </span>
                  </div>
                  {/* 抢购按钮 */}
                  <button
                    className={`w-full h-8 rounded-full text-sm font-medium flex items-center justify-center transition-all ${
                      soldOut
                        ? 'bg-gray-200 dark:bg-gray-800 text-text-aux cursor-not-allowed'
                        : 'bg-gradient-to-r from-[#FF4142] to-[#FF6B2B] text-white active:opacity-80'
                    }`}
                    disabled={soldOut}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!soldOut) {
                        navigate(`/product/${item.product_id}`);
                      }
                    }}
                  >
                    {soldOut ? '已抢光' : (
                      <>
                        <ShoppingCart size={14} className="mr-1" />
                        立即抢购
                      </>
                    )}
                  </button>
                </div>
              </Card>
            );
          })}
        </div>

        {/* 加载更多 */}
        <div ref={loadMoreRef} className="py-4 text-center text-sm text-gray-400">
          {loadingMore ? (
            <span className="inline-flex items-center">
              <RefreshCcw size={14} className="mr-2 animate-spin" />
              加载中...
            </span>
          ) : hasMore ? (
            <span>上拉加载更多</span>
          ) : items.length > PAGE_SIZE ? (
            <span>没有更多了</span>
          ) : null}
        </div>
      </>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-bg-base relative overflow-hidden">
      <PageHeader
        title="限时秒杀"
        onBack={goBack}
        rightAction={
          <div className="flex items-center">
            <Zap size={16} className="text-[#FF4142] mr-1" fill="currentColor" />
            <span className="text-sm text-[#FF4142] font-medium">FLASH</span>
          </div>
        }
      />

      <PullToRefreshContainer onRefresh={handleRefresh}>
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto no-scrollbar pb-8">
          {renderActivityBanner()}
          {renderList()}
        </div>
      </PullToRefreshContainer>
    </div>
  );
};
