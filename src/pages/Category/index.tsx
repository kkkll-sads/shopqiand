/**
 * @file Category/index.tsx - 商品分类页面
 * @description 左侧分类导航 + 右侧商品列表，支持无限滚动加载、下拉刷新、搜索跳转。
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'; // React 核心 Hook
import {
  ChevronLeft,
  MessageCircle,
  RefreshCcw,
  Search,
  ShoppingCart,
} from 'lucide-react';
import { shopProductApi, type ShopProductItem } from '../../api';
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
  getShopProductBadges,
  normalizeShopProductCategories,
  resolveShopProductImageUrl,
} from '../../features/shop-product/utils';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import { useCartCount } from '../../hooks/useCartCount';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useRequest } from '../../hooks/useRequest';
import { useRouteScrollRestoration } from '../../hooks/useRouteScrollRestoration';
import { useSessionState } from '../../hooks/useSessionState';
import { useAppNavigate } from '../../lib/navigation';

const EMPTY_CATEGORY_LIST = {
  list: [] as string[],
};

const EMPTY_PRODUCT_LIST = {
  limit: 20,
  list: [] as ShopProductItem[],
  page: 1,
  total: 0,
};

/** 合并商品列表（按 id 去重，新数据覆盖旧数据） */
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

/**
 * CategoryPage - 商品分类页面
 * 功能：左侧分类导航 → 右侧商品列表 → 无限滚动 → 点击跳转商品详情
 */
export const CategoryPage = () => {
  const { goBack, goTo } = useAppNavigate();
  const { isOffline, refreshStatus } = useNetworkStatus();
  const { cartCount } = useCartCount();
  const [activeCategory, setActiveCategory] = useSessionState('category-page:active-category', '全部');
  const [products, setProducts] = useState<ShopProductItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<Error | null>(null);

  const productListRef = useRef<HTMLDivElement | null>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null);
  const loadingMoreRef = useRef(false);
  const pageRef = useRef(1);
  const productsRef = useRef<ShopProductItem[]>([]);
  const queryVersionRef = useRef(0);

  const categoriesRequest = useRequest(
    (signal) => shopProductApi.categories(signal),
    {
      cacheKey: 'category:categories',
      initialData: EMPTY_CATEGORY_LIST,
    },
  );

  const categoryItems = useMemo(
    () => normalizeShopProductCategories(categoriesRequest.data?.list),
    [categoriesRequest.data],
  );

  useEffect(() => {
    if (categoryItems.length === 0) {
      return;
    }

    if (!activeCategory || !categoryItems.some((item) => item.name === activeCategory)) {
      setActiveCategory(categoryItems[0].name);
    }
  }, [activeCategory, categoryItems]);

  const fetchCategoryPage = useCallback(
    (nextPage: number, signal?: AbortSignal) => {
      return shopProductApi.list(
        {
          category: activeCategory === '全部' ? undefined : activeCategory,
          limit: 20,
          page: nextPage,
        },
        signal,
      );
    },
    [activeCategory],
  );

  const productsRequest = useRequest(
    (signal) => fetchCategoryPage(1, signal),
    {
      cacheKey: `category:products:${activeCategory ?? ''}`,
      deps: [activeCategory],
      initialData: EMPTY_PRODUCT_LIST,
      keepPreviousData: true,
    },
  );

  useEffect(() => {
    queryVersionRef.current += 1;
    productsRef.current = [];
    pageRef.current = 1;
    loadingMoreRef.current = false;
    setProducts([]);
    setPage(1);
    setHasMore(false);
    setLoadingMore(false);
    setLoadMoreError(null);
  }, [activeCategory]);

  useEffect(() => {
    const nextProducts = productsRequest.data?.list ?? [];
    productsRef.current = nextProducts;
    pageRef.current = 1;
    setProducts(nextProducts);
    setPage(1);
    setHasMore(nextProducts.length < (productsRequest.data?.total ?? 0));
    setLoadMoreError(null);
  }, [productsRequest.data]);

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || !hasMore) {
      return;
    }

    const version = queryVersionRef.current;
    const nextPage = pageRef.current + 1;

    loadingMoreRef.current = true;
    setLoadingMore(true);
    setLoadMoreError(null);

    try {
      const response = await fetchCategoryPage(nextPage);
      if (version !== queryVersionRef.current) {
        return;
      }

      const mergedProducts = mergeProducts(productsRef.current, response.list);
      productsRef.current = mergedProducts;
      pageRef.current = nextPage;
      setProducts(mergedProducts);
      setPage(nextPage);
      setHasMore(mergedProducts.length < response.total);
    } catch (error) {
      if (version === queryVersionRef.current) {
        setLoadMoreError(error instanceof Error ? error : new Error('加载更多失败'));
      }
    } finally {
      if (version === queryVersionRef.current) {
        loadingMoreRef.current = false;
        setLoadingMore(false);
      }
    }
  }, [activeCategory, fetchCategoryPage, hasMore]);

  useInfiniteScroll({
    disabled: !activeCategory || productsRequest.loading || Boolean(loadMoreError) || products.length === 0,
    hasMore,
    loading: loadingMore,
    onLoadMore: loadMore,
    rootRef: productListRef,
    targetRef: loadMoreTriggerRef,
  });

  const loadingCategories = categoriesRequest.loading && categoryItems.length === 0;
  const loadingProducts = Boolean(activeCategory) && productsRequest.loading && products.length === 0;
  const hasError =
    (!loadingCategories && categoriesRequest.error && categoryItems.length === 0) ||
    (!loadingProducts && productsRequest.error && products.length === 0);

  useRouteScrollRestoration({
    containerRef: productListRef,
    namespace: 'category-page',
    restoreDeps: [activeCategory, hasMore, products.length, productsRequest.loading],
    restoreWhen: !loadingProducts && !hasError,
  });

  const renderLoadMoreFooter = () => {
    if (products.length === 0) {
      return null;
    }

    return (
      <div ref={loadMoreTriggerRef} className="py-6 text-center text-sm text-text-sub">
        {loadingMore ? (
          <span className="inline-flex items-center">
            <RefreshCcw size={14} className="mr-2 animate-spin" />
            加载中...
          </span>
        ) : loadMoreError ? (
          <button
            type="button"
            className="rounded-full border border-border-light px-4 py-2 text-text-main"
            onClick={() => void loadMore()}
          >
            加载失败，点击重试
          </button>
        ) : hasMore ? (
          <span>继续下拉加载更多</span>
        ) : (
          <span>没有更多商品了</span>
        )}
      </div>
    );
  };

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-bg-base">
      {isOffline && <OfflineBanner onAction={refreshStatus} />}

      <div className="relative z-40 border-b border-border-light bg-white dark:bg-gray-900">
        <div className="flex h-12 items-center px-3 pt-safe">
          <button onClick={goBack} className="mr-1 p-1 text-text-main active:opacity-70">
            <ChevronLeft size={24} />
          </button>
          <button
            type="button"
            className="mr-3 flex h-8 flex-1 items-center rounded-full bg-bg-base px-3 text-left"
            onClick={() => goTo('search')}
          >
            <Search size={16} className="mr-2 text-text-aux" />
            <span className="text-base text-text-aux">搜索商品 / 分类</span>
          </button>
          <button
            type="button"
            className="mr-2 p-1 text-text-main active:opacity-70"
            onClick={() => goTo('message_center')}
          >
            <MessageCircle size={22} />
          </button>
          <button
            type="button"
            className="relative p-1 text-text-main active:opacity-70"
            onClick={() => goTo('cart')}
          >
            <CartCountBadge count={cartCount} />
            <ShoppingCart size={22} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="h-full w-[92px] overflow-y-auto bg-bg-base pb-safe">
          {loadingCategories
            ? Array.from({ length: 10 }).map((_, index) => (
                <div key={index} className="flex h-[52px] items-center justify-center px-3">
                  <Skeleton className="h-4 w-full" />
                </div>
              ))
            : categoryItems.map((category) => {
                const isActive = activeCategory === category.name;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setActiveCategory(category.name)}
                    className={`relative flex h-[52px] w-full items-center justify-center px-3 text-center text-sm ${
                      isActive
                        ? 'bg-white font-bold text-primary-start dark:bg-gray-900'
                        : 'text-text-main'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary-start" />
                    )}
                    <span className="line-clamp-2">{category.name}</span>
                  </button>
                );
              })}
        </div>

        <PullToRefreshContainer
          onRefresh={() => Promise.allSettled([categoriesRequest.reload(), productsRequest.reload()])}
          disabled={isOffline}
        >
        <div ref={productListRef} className="flex-1 overflow-y-auto bg-white p-3 pb-safe dark:bg-gray-900">
          {hasError ? (
            <ErrorState
              message="商品分类加载失败"
              onRetry={() => {
                void Promise.allSettled([categoriesRequest.reload(), productsRequest.reload()]);
              }}
            />
          ) : loadingProducts ? (
            <div className="space-y-3">
              <Card className="rounded-2xl border border-border-light p-4 shadow-sm">
                <Skeleton className="mb-3 h-5 w-28" />
                <Skeleton className="h-4 w-3/4" />
              </Card>
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="flex rounded-xl border border-border-light bg-bg-card p-2 shadow-sm"
                >
                  <Skeleton className="mr-3 h-[88px] w-[88px] shrink-0 rounded-lg" />
                  <div className="flex flex-1 flex-col justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                    <Skeleton className="h-5 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : !activeCategory ? (
            <EmptyState message="暂无可用分类" />
          ) : (
            <>
              <Card className="mb-4 rounded-2xl border border-border-light p-4 shadow-sm">
                <div className="mb-2 text-lg font-bold text-text-main">{activeCategory}</div>
                <div className="text-sm text-text-sub">
                  当前分类共 {productsRequest.data?.total ?? 0} 件商品。
                </div>
              </Card>

              {products.length === 0 ? (
                <EmptyState message="该分类下暂无商品" />
              ) : (
                <div className="space-y-3">
                  {products.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="flex w-full rounded-xl border border-border-light bg-bg-card p-2 text-left shadow-sm active:opacity-70"
                      onClick={() => goTo(buildShopProductPath(item.id))}
                    >
                      <img
                        src={resolveShopProductImageUrl(item.thumbnail)}
                        alt={item.name}
                        className="mr-3 h-[88px] w-[88px] shrink-0 rounded-lg border border-border-light object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex flex-1 flex-col justify-between">
                        <div>
                          <div className="mb-1 line-clamp-2 text-base leading-tight text-text-main">
                            {item.name}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {getShopProductBadges(item).map((badge) => (
                              <span
                                key={`${item.id}-${badge}`}
                                className={
                                  badge === '消费金'
                                    ? 'rounded-sm bg-amber-500 px-1 py-0.5 text-2xs font-medium text-white'
                                    : 'rounded-sm border border-primary-start/25 px-1 py-0.5 text-2xs text-primary-start'
                                }
                              >
                                {badge}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="mt-2 flex items-end justify-between">
                          <div className="min-w-0">
                            <ShopProductPriceDisplay product={item} />
                            <div className="mt-1 text-xs text-text-aux">
                              销量 {formatShopProductSales(item.sales)} · 库存 {item.stock}
                            </div>
                          </div>
                          <div className="text-xs text-text-sub">{item.category}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                  {renderLoadMoreFooter()}
                </div>
              )}
            </>
          )}
        </div>
        </PullToRefreshContainer>
      </div>
    </div>
  );
};
