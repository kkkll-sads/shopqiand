/**
 * @file Store/index.tsx - 商城页面
 * @description 商城首页，展示商品列表、分类筛选、搜索、无限滚动加载。
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Award,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  Flame,
  Gift,
  Grid,
  MapPin,
  MessageSquare,
  RefreshCcw,
  Search,
  ShoppingCart,
  Ticket,
  Zap,
} from 'lucide-react';
import { flashSaleApi, shopProductApi, type FlashSaleProduct, type ShopProductItem } from '../../api';
import { resolveUploadUrl } from '../../api/modules/upload';
import { OfflineBanner } from '../../components/layout/OfflineBanner';
import { Card } from '../../components/ui/Card';
import { CartCountBadge } from '../../components/ui/CartCountBadge';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Skeleton } from '../../components/ui/Skeleton';
import { PullToRefreshContainer } from '../../components/ui/PullToRefreshContainer';
import { ShopProductPriceDisplay } from '../../features/shop-product/components/ShopProductPriceDisplay';
import {
  buildShopProductPath,
  formatShopProductSales,
  resolveShopProductImageUrl,
} from '../../features/shop-product/utils';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import { useCartCount } from '../../hooks/useCartCount';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useRequest } from '../../hooks/useRequest';
import { useRouteScrollRestoration } from '../../hooks/useRouteScrollRestoration';
import { useAppNavigate } from '../../lib/navigation';

const KING_KONG_ITEMS = [
  { icon: Grid, label: '全部分类', target: 'category' },
  { icon: Zap, label: '限时秒杀', target: 'flash_sale' },
  { icon: Ticket, label: '领券中心', target: 'coupon' },
  { icon: Gift, label: '新人专享', target: 'store' },
  { icon: Flame, label: '热卖排行', target: 'store' },
  { icon: Award, label: '品牌闪购', target: 'store' },
  { icon: FileText, label: '我的订单', target: 'order' },
  { icon: MapPin, label: '地址', target: 'address' },
];

const FLASH_SALE_LIST_INITIAL_DATA = {
  limit: 6,
  list: [] as FlashSaleProduct[],
  activity: null,
  page: 1,
  total: 0,
};

const LATEST_LIST_INITIAL_DATA = {
  limit: 10,
  list: [] as ShopProductItem[],
  page: 1,
  total: 0,
};

function mergeProducts(previous: ShopProductItem[], next: ShopProductItem[]) {
  const productMap = new Map<number, ShopProductItem>();

  for (const item of previous) {
    productMap.set(item.id, item);
  }

  for (const item of next) {
    productMap.set(item.id, item);
  }

  return Array.from(productMap.values());
}

function formatCountdown(seconds: number) {
  if (seconds <= 0) {
    return '00:00:00';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(
    remainingSeconds,
  ).padStart(2, '0')}`;
}

function HorizontalProductSkeleton() {
  return (
    <div className="flex min-w-0 space-x-3 overflow-x-auto overflow-y-hidden pb-2 no-scrollbar overscroll-x-contain">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="w-[100px] shrink-0 space-y-2">
          <Skeleton className="aspect-square w-full rounded-xl" />
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}

function GridProductSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-xl border border-[#ececec] bg-white"
        >
          <Skeleton className="aspect-square w-full rounded-none" />
          <div className="space-y-2 p-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="mt-3 h-5 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export const StorePage = () => {
  const { goTo } = useAppNavigate();
  const { isOffline, refreshStatus } = useNetworkStatus();
  const { cartCount } = useCartCount();

  const [latestProducts, setLatestProducts] = useState<ShopProductItem[]>([]);
  const [flashSaleCountdown, setFlashSaleCountdown] = useState(0);
  const [hasMoreLatest, setHasMoreLatest] = useState(false);
  const [loadingMoreLatest, setLoadingMoreLatest] = useState(false);
  const [loadMoreLatestError, setLoadMoreLatestError] = useState<Error | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const latestLoadMoreTriggerRef = useRef<HTMLDivElement | null>(null);
  const latestPageRef = useRef(1);
  const latestProductsRef = useRef<ShopProductItem[]>([]);
  const latestLoadingMoreRef = useRef(false);

  const flashSaleRequest = useRequest(
    (signal) => flashSaleApi.getProducts({ limit: 6, page: 1 }, signal),
    {
      cacheKey: 'store:flash-sale',
      initialData: FLASH_SALE_LIST_INITIAL_DATA,
    },
  );

  const hotSaleRequest = useRequest(
    (signal) => shopProductApi.sales({ limit: 6, page: 1 }, signal),
    {
      cacheKey: 'store:hot-sale',
      initialData: LATEST_LIST_INITIAL_DATA,
    },
  );

  const latestRequest = useRequest(
    (signal) => shopProductApi.latest({ limit: 10, page: 1 }, signal),
    {
      cacheKey: 'store:latest',
      initialData: LATEST_LIST_INITIAL_DATA,
    },
  );

  useEffect(() => {
    const nextProducts = latestRequest.data?.list ?? [];
    latestProductsRef.current = nextProducts;
    latestPageRef.current = 1;
    latestLoadingMoreRef.current = false;
    setLatestProducts(nextProducts);
    setHasMoreLatest(nextProducts.length < (latestRequest.data?.total ?? 0));
    setLoadingMoreLatest(false);
    setLoadMoreLatestError(null);
  }, [latestRequest.data]);

  useEffect(() => {
    const activity = flashSaleRequest.data?.activity;
    if (!activity) {
      setFlashSaleCountdown(0);
      return;
    }

    const updateCountdown = () => {
      const now = Math.floor(Date.now() / 1000);
      setFlashSaleCountdown(Math.max(activity.end_time - now, 0));
    };

    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);

    return () => window.clearInterval(timer);
  }, [flashSaleRequest.data?.activity]);

  const loadMoreLatest = useCallback(async () => {
    if (latestLoadingMoreRef.current || !hasMoreLatest) {
      return;
    }

    const nextPage = latestPageRef.current + 1;

    latestLoadingMoreRef.current = true;
    setLoadingMoreLatest(true);
    setLoadMoreLatestError(null);

    try {
      const response = await shopProductApi.latest({
        limit: latestRequest.data?.limit ?? LATEST_LIST_INITIAL_DATA.limit,
        page: nextPage,
      });

      const mergedProducts = mergeProducts(latestProductsRef.current, response.list);
      latestProductsRef.current = mergedProducts;
      latestPageRef.current = nextPage;
      setLatestProducts(mergedProducts);
      setHasMoreLatest(mergedProducts.length < response.total);
    } catch (error) {
      setLoadMoreLatestError(
        error instanceof Error ? error : new Error('精选商品加载更多失败'),
      );
    } finally {
      latestLoadingMoreRef.current = false;
      setLoadingMoreLatest(false);
    }
  }, [hasMoreLatest, latestRequest.data?.limit]);

  useInfiniteScroll({
    disabled:
      latestRequest.loading ||
      latestProducts.length === 0 ||
      Boolean(loadMoreLatestError),
    hasMore: hasMoreLatest,
    loading: loadingMoreLatest,
    onLoadMore: loadMoreLatest,
    rootRef: scrollContainerRef,
    targetRef: latestLoadMoreTriggerRef,
  });

  const flashSaleProducts = flashSaleRequest.data?.list ?? [];
  const flashSaleActivity = flashSaleRequest.data?.activity;
  const hotSaleProducts = hotSaleRequest.data?.list ?? [];

  useRouteScrollRestoration({
    containerRef: scrollContainerRef,
    namespace: 'store-page',
    restoreDeps: [
      flashSaleRequest.loading,
      hotSaleRequest.loading,
      latestRequest.loading,
      flashSaleProducts.length,
      hotSaleProducts.length,
      latestProducts.length,
      hasMoreLatest,
    ],
    restoreWhen: !flashSaleRequest.loading && !hotSaleRequest.loading && !latestRequest.loading,
  });

  const isLoading = flashSaleRequest.loading || latestRequest.loading;
  const hasBlockingError =
    !isLoading &&
    flashSaleProducts.length === 0 &&
    latestProducts.length === 0 &&
    Boolean(flashSaleRequest.error || latestRequest.error);
  const isEmpty =
    !isLoading &&
    !hasBlockingError &&
    flashSaleProducts.length === 0 &&
    latestProducts.length === 0;

  const reloadAll = () => {
    latestProductsRef.current = [];
    latestPageRef.current = 1;
    latestLoadingMoreRef.current = false;
    setLatestProducts([]);
    setHasMoreLatest(false);
    setLoadingMoreLatest(false);
    setLoadMoreLatestError(null);
    return Promise.allSettled([
      flashSaleRequest.reload(),
      hotSaleRequest.reload(),
      latestRequest.reload(),
    ]);
  };

  const serviceHighlights = useMemo(
    () => ['自营保障', '极速发货', '售后无忧'],
    [],
  );

  const renderLatestFooter = () => {
    if (latestProducts.length === 0) {
      return null;
    }

    return (
      <div ref={latestLoadMoreTriggerRef} className="py-6 text-center text-sm text-text-sub">
        {loadingMoreLatest ? (
          <span className="inline-flex items-center">
            <RefreshCcw size={14} className="mr-2 animate-spin" />
            加载中...
          </span>
        ) : loadMoreLatestError ? (
          <button
            type="button"
            className="rounded-full border border-border-light px-4 py-2 text-text-main"
            onClick={() => void loadMoreLatest()}
          >
            加载失败，点击重试
          </button>
        ) : hasMoreLatest ? (
          <span>继续下拉加载更多商品</span>
        ) : (
          <span>没有更多商品了</span>
        )}
      </div>
    );
  };

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-bg-base">
      {isOffline && <OfflineBanner onAction={refreshStatus} />}

      <div className="sticky top-0 z-40 flex items-center space-x-3 border-b border-border-light bg-bg-base/95 px-4 py-2 backdrop-blur">
        <div className="shrink-0">
          <div className="rounded bg-primary-start px-1.5 py-0.5 text-center text-xs font-bold leading-none text-white">
            树交所
            <br />
            自营
          </div>
        </div>
        <button
          type="button"
          className="flex h-8 flex-1 items-center rounded-full border border-border-light bg-bg-card px-3 text-left shadow-sm"
          onClick={() => goTo('search')}
        >
          <Search size={14} className="mr-2 shrink-0 text-text-aux" />
          <span className="truncate text-sm text-text-aux">搜索商品 / SKU / 关键词</span>
        </button>
        <div className="flex shrink-0 items-center space-x-1">
          <button
            type="button"
            className="relative flex h-8 w-8 items-center justify-center text-text-main active:opacity-70"
            onClick={() => goTo('cart')}
          >
            <CartCountBadge count={cartCount} />
            <ShoppingCart size={20} />
          </button>
          <button
            type="button"
            className="relative flex h-8 w-8 items-center justify-center text-text-main active:opacity-70"
            onClick={() => goTo('message_center')}
          >
            <MessageSquare size={20} />
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full border border-bg-base bg-primary-start" />
          </button>
        </div>
      </div>

      <PullToRefreshContainer onRefresh={reloadAll} disabled={isOffline}>
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto pb-4">
        <div className="grid grid-cols-4 gap-y-4 px-4 pb-1 pt-4">
          {KING_KONG_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                className="flex flex-col items-center active:opacity-70"
                onClick={() => goTo(item.target)}
              >
                <div className="mb-1.5 flex h-10 w-10 items-center justify-center rounded-xl bg-bg-card text-text-main shadow-sm">
                  <Icon size={20} strokeWidth={1.5} />
                </div>
                <span className="text-sm text-text-main">{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="px-4 pb-4">
          {isLoading ? (
            <Skeleton className="h-[100px] w-full rounded-2xl" />
          ) : (
            <div className="relative flex h-[100px] items-center justify-between overflow-hidden rounded-2xl gradient-primary-r p-4 shadow-soft">
              <div className="absolute -right-6 -top-8 h-24 w-24 rounded-full bg-white/10" />
              <div className="absolute right-10 top-8 h-12 w-12 rounded-full bg-white/10" />
              <div className="relative z-10">
                <h2 className="mb-1 text-4xl font-bold text-white">自营精选</h2>
                <p className="text-sm text-white/90">官方保障 · 极速发货</p>
              </div>
              <button
                type="button"
                className="relative z-10 rounded-full border border-white/20 bg-bg-card px-3 py-1.5 text-sm font-bold text-primary-start shadow-sm dark:bg-black/20 dark:text-white"
                onClick={() => goTo('category')}
              >
                去逛逛
              </button>
            </div>
          )}
        </div>

        <div className="mb-3 flex items-center justify-between px-4 text-s text-text-sub">
          {serviceHighlights.map((item) => (
            <span key={item} className="flex items-center">
              <CheckCircle2 size={12} className="mr-1 text-primary-start" />
              {item}
            </span>
          ))}
        </div>

        <div className="mb-4 px-4">
          {isLoading ? (
            <Skeleton className="h-[70px] w-full rounded-xl" />
          ) : (
            <div className="flex items-center rounded-xl border border-border-light bg-bg-card p-3 shadow-soft">
              <div className="flex flex-1 items-center border-r border-dashed border-border-light pr-3">
                <div className="mr-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-start/10 text-primary-start">
                  <Ticket size={22} />
                </div>
                <div>
                  <div className="text-base font-bold text-text-main">领券中心</div>
                  <div className="text-xs text-text-aux">下单前先看看当前可用优惠和活动权益</div>
                </div>
              </div>
              <div className="pl-3">
                <button
                  type="button"
                  className="rounded-full bg-primary-start px-3 py-1.5 text-sm font-medium text-white"
                  onClick={() => goTo('coupon')}
                >
                  立即查看
                </button>
              </div>
            </div>
          )}
        </div>

        {hasBlockingError ? (
          <ErrorState message="商城商品加载失败" onRetry={reloadAll} />
        ) : isEmpty ? (
          <EmptyState message="暂无商品数据" actionText="刷新" onAction={reloadAll} />
        ) : (
          <>
            <div className="mb-4 px-4">
              {flashSaleActivity ? (
                <>
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center">
                      <h3 className="mr-2 text-xl font-bold text-text-main">限时秒杀</h3>
                      <div className="flex items-center space-x-1 text-xs font-mono">
                        {flashSaleCountdown > 0 ? (
                          <>
                            <span className="rounded bg-primary-start px-1.5 py-0.5 text-white">
                              进行中
                            </span>
                            <span className="inline-flex items-center font-bold text-primary-start">
                              <Clock3 size={12} className="mr-1" />
                              {formatCountdown(flashSaleCountdown)}
                            </span>
                          </>
                        ) : (
                          <span className="rounded bg-primary-start px-1.5 py-0.5 text-white">
                            限量抢购
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="flex items-center text-sm text-text-aux"
                      onClick={() => goTo('flash_sale')}
                    >
                      更多
                      <ChevronRight size={12} />
                    </button>
                  </div>

                  {flashSaleRequest.loading ? (
                    <HorizontalProductSkeleton />
                  ) : flashSaleProducts.length === 0 ? (
                    <Card className="rounded-xl border border-border-light p-6">
                      <EmptyState message="当前没有秒杀商品" />
                    </Card>
                  ) : (
                    <div className="flex min-w-0 space-x-3 overflow-x-auto overflow-y-hidden pb-2 no-scrollbar overscroll-x-contain">
                      {flashSaleProducts.map((item) => (
                        <button
                          key={item.flash_sale_product_id}
                          type="button"
                          className="flex w-[112px] shrink-0 flex-col rounded-xl border border-[#ececec] bg-white p-2 text-left active:opacity-70"
                          onClick={() => goTo(buildShopProductPath(item.product_id))}
                        >
                          <div className="mb-2 aspect-square overflow-hidden rounded-lg border border-[#f0f0f0] bg-[#f7f7f7]">
                            <img
                              src={resolveUploadUrl(item.thumbnail)}
                              alt={item.product_name}
                              className="h-full w-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="mb-1 line-clamp-2 min-h-[36px] text-[13px] leading-[18px] text-text-main">{item.product_name}</div>
                          <div className="mb-1 text-lg font-semibold leading-none text-primary-start">
                            ¥{item.flash_price}
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="line-clamp-1 text-xs text-text-aux">
                              {item.limit_per_user > 0 ? `限购${item.limit_per_user}件` : '秒杀专享价'}
                            </span>
                            <span className="shrink-0 text-xs text-text-aux line-through">
                              ¥{item.original_price}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center">
                      <h3 className="mr-2 text-xl font-bold text-text-main">热卖排行</h3>
                      <div className="flex items-center space-x-1 text-xs font-mono">
                        <span className="rounded bg-rose-500 px-1.5 py-0.5 text-white">
                          🔥 爆款推荐
                        </span>
                      </div>
                    </div>
                  </div>

                  {hotSaleRequest.loading ? (
                    <HorizontalProductSkeleton />
                  ) : hotSaleProducts.length === 0 ? (
                    <Card className="rounded-xl border border-border-light p-6">
                      <EmptyState message="当前没有热卖商品" />
                    </Card>
                  ) : (
                    <div className="flex min-w-0 space-x-3 overflow-x-auto overflow-y-hidden pb-2 no-scrollbar overscroll-x-contain">
                      {hotSaleProducts.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className="flex w-[112px] shrink-0 flex-col rounded-xl border border-[#ececec] bg-white p-2 text-left active:opacity-70"
                          onClick={() => goTo(buildShopProductPath(item.id))}
                        >
                          <div className="mb-2 aspect-square overflow-hidden rounded-lg border border-[#f0f0f0] bg-[#f7f7f7]">
                            <img
                              src={resolveShopProductImageUrl(item.thumbnail)}
                              alt={item.name}
                              className="h-full w-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="mb-1 line-clamp-2 min-h-[36px] text-[13px] leading-[18px] text-text-main">{item.name}</div>
                          <ShopProductPriceDisplay
                            className="mb-1"
                            product={item}
                            size="narrow"
                          />
                          <div className="flex items-center justify-between gap-2">
                            <span className="line-clamp-1 text-xs text-text-aux whitespace-nowrap">
                              已售{formatShopProductSales(item.sales)}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="px-4">
              <h3 className="mb-3 flex items-center justify-center text-xl font-bold text-text-main">
                <span className="mr-2 h-px w-4 bg-border-light" />
                今日精选
                <span className="ml-2 h-px w-4 bg-border-light" />
              </h3>

              {latestRequest.loading && latestProducts.length === 0 ? (
                <GridProductSkeleton />
              ) : latestRequest.error && latestProducts.length === 0 ? (
                <Card className="rounded-xl border border-border-light p-6">
                  <ErrorState
                    message="精选商品加载失败"
                    onRetry={() => void latestRequest.reload().catch(() => undefined)}
                  />
                </Card>
              ) : latestProducts.length === 0 ? (
                <Card className="rounded-xl border border-border-light p-6">
                  <EmptyState
                    message="暂无精选商品"
                    actionText="刷新"
                    onAction={() => void latestRequest.reload().catch(() => undefined)}
                  />
                </Card>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    {latestProducts.map((item) => (
                      <div
                        key={item.id}
                        role="button"
                        tabIndex={0}
                        className="flex cursor-pointer flex-col overflow-hidden rounded-xl border border-[#ececec] bg-white text-left active:opacity-70"
                        onClick={() => goTo(buildShopProductPath(item.id))}
                      >
                        <div className="relative">
                          <img
                            src={resolveShopProductImageUrl(item.thumbnail)}
                            alt={item.name}
                            className="aspect-square w-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          {(item.purchase_type === 'score' || item.purchase_type === 'both') && (
                            <span className={`absolute bottom-3 left-3 rounded-md px-1.5 py-0.5 text-[10px] font-medium leading-none text-white ${
                              item.purchase_type === 'score' ? 'bg-amber-500' : 'bg-primary-start'
                            }`}>
                              {item.purchase_type === 'score' ? '消费金' : '混合支付'}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-1 flex-col p-3">
                          <div className="mb-2 line-clamp-2 text-[14px] leading-[20px] text-text-main">
                            {item.name}
                          </div>
                          <div className="mt-auto flex items-end justify-between gap-3">
                            <div className="min-w-0">
                              <ShopProductPriceDisplay product={item} />
                              <span className="mt-1 inline-block text-xs text-text-aux whitespace-nowrap">
                                已售{formatShopProductSales(item.sales)}
                              </span>
                            </div>
                            <button
                              type="button"
                              aria-label={`查看 ${item.name} 购物车入口`}
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f5f5f5] text-text-main active:bg-[#ececec]"
                              onClick={(event) => {
                                event.stopPropagation();
                                goTo('cart');
                              }}
                            >
                              <ShoppingCart size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {renderLatestFooter()}
                </>
              )}
            </div>
          </>
        )}
      </div>
      </PullToRefreshContainer>
    </div>
  );
};

