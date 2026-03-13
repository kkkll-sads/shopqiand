/**
 * @file SearchResult/index.tsx - 搜索结果页面
 * @description 展示商品搜索结果列表，支持排序、筛选、无限滚动加载。
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'; // React 核心 Hook
import {
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Filter,
  Image as ImageIcon,
  LayoutGrid,
  List as ListIcon,
  RefreshCcw,
  Search as SearchIcon,
  ShoppingCart,
  X,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { shopProductApi, type ShopProductItem } from '../../api';
import { OfflineBanner } from '../../components/layout/OfflineBanner';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { PullToRefreshContainer } from '../../components/ui/PullToRefreshContainer';
import { Skeleton } from '../../components/ui/Skeleton';
import { ShopProductPriceDisplay } from '../../features/shop-product/components/ShopProductPriceDisplay';
import {
  buildShopProductPath,
  formatShopProductSales,
  getShopProductBadges,
  normalizeShopProductCategories,
  resolveShopProductImageUrl,
} from '../../features/shop-product/utils';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useRequest } from '../../hooks/useRequest';
import { useRouteScrollRestoration } from '../../hooks/useRouteScrollRestoration';
import { useSessionState } from '../../hooks/useSessionState';
import { useAppNavigate } from '../../lib/navigation';

const EMPTY_CATEGORY_LIST = {
  list: [] as string[],
};

const EMPTY_PRODUCT_LIST = {
  limit: 30,
  list: [] as ShopProductItem[],
  page: 1,
  total: 0,
};

type SearchSortMode = 'default' | 'latest' | 'price' | 'sales';

/** 商城统一用 score_price 作为余额/消费金；排序时优先使用 score_price（与购物车/结算一致，后端为分则 /100） */
function getComparablePrice(product: ShopProductItem) {
  const scorePrice = product.score_price;
  if (scorePrice != null && Number.isFinite(scorePrice) && scorePrice > 0) {
    return scorePrice / 100;
  }
  return Number(
    product.price ??
      product.green_power_amount ??
      product.balance_available_amount ??
      0,
  );
}

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

export const SearchResultPage = () => {
  const [searchParams] = useSearchParams();
  const { goBack, goTo } = useAppNavigate();
  const { isOffline, refreshStatus } = useNetworkStatus();

  const keyword = searchParams.get('keyword')?.trim() ?? '';
  const sessionKeyPrefix = keyword ? `search-result:${keyword}` : 'search-result:empty';

  const [isGrid, setIsGrid] = useSessionState(`${sessionKeyPrefix}:is-grid`, true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [sortMode, setSortMode] = useSessionState<SearchSortMode>(
    `${sessionKeyPrefix}:sort-mode`,
    'default',
  );
  const [priceOrder, setPriceOrder] = useSessionState<'asc' | 'desc'>(
    `${sessionKeyPrefix}:price-order`,
    'asc',
  );
  const [selectedCategory, setSelectedCategory] = useSessionState(
    `${sessionKeyPrefix}:selected-category`,
    '',
  );
  const [minPrice, setMinPrice] = useSessionState(`${sessionKeyPrefix}:min-price`, '');
  const [maxPrice, setMaxPrice] = useSessionState(`${sessionKeyPrefix}:max-price`, '');
  const [products, setProducts] = useState<ShopProductItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<Error | null>(null);

  const listContainerRef = useRef<HTMLDivElement | null>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null);
  const loadingMoreRef = useRef(false);
  const pageRef = useRef(1);
  const productsRef = useRef<ShopProductItem[]>([]);
  const queryVersionRef = useRef(0);

  const categoriesRequest = useRequest(
    (signal) => shopProductApi.categories(signal),
    {
      cacheKey: 'search-result:categories',
      initialData: EMPTY_CATEGORY_LIST,
    },
  );

  const fetchProductPage = useCallback(
    (nextPage: number, signal?: AbortSignal) => {
      if (!keyword) {
        return Promise.resolve(EMPTY_PRODUCT_LIST);
      }

      const query = {
        category: selectedCategory || undefined,
        keyword,
        limit: 30,
        page: nextPage,
        price_order: sortMode === 'price' ? priceOrder : undefined,
      };

      if (sortMode === 'sales') {
        return shopProductApi.sales(query, signal);
      }

      if (sortMode === 'latest') {
        return shopProductApi.latest(query, signal);
      }

      return shopProductApi.list(query, signal);
    },
    [keyword, priceOrder, selectedCategory, sortMode],
  );

  const queryKey = `${keyword}::${selectedCategory ?? ''}::${sortMode}::${priceOrder}`;

  const resultRequest = useRequest(
    (signal) => fetchProductPage(1, signal),
    {
      cacheKey: `search-result:list:${queryKey}`,
      deps: [keyword, selectedCategory, sortMode, priceOrder],
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
  }, [queryKey]);

  const prevDataRef = useRef<typeof resultRequest.data>(undefined);
  useEffect(() => {
    const data = resultRequest.data;
    if (data === prevDataRef.current) return;
    prevDataRef.current = data;

    const nextProducts = data?.list ?? [];
    productsRef.current = nextProducts;
    pageRef.current = 1;
    setProducts(nextProducts);
    setPage(1);
    setHasMore(nextProducts.length < (data?.total ?? 0));
    setLoadMoreError(null);
  }, [resultRequest.data]);

  const categories = useMemo(
    () => normalizeShopProductCategories(categoriesRequest.data?.list),
    [categoriesRequest.data],
  );

  const visibleProducts = useMemo(() => {
    const minValue = minPrice ? Number(minPrice) : undefined;
    const maxValue = maxPrice ? Number(maxPrice) : undefined;

    return products.filter((item) => {
      const price = getComparablePrice(item);

      if (Number.isFinite(minValue) && typeof minValue === 'number' && price < minValue) {
        return false;
      }

      if (Number.isFinite(maxValue) && typeof maxValue === 'number' && price > maxValue) {
        return false;
      }

      return true;
    });
  }, [maxPrice, minPrice, products]);

  const loadMore = useCallback(async () => {
    if (!keyword || loadingMoreRef.current || !hasMore) {
      return;
    }

    const version = queryVersionRef.current;
    const nextPage = pageRef.current + 1;

    loadingMoreRef.current = true;
    setLoadingMore(true);
    setLoadMoreError(null);

    try {
      const response = await fetchProductPage(nextPage);
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
  }, [fetchProductPage, hasMore, keyword]);

  useInfiniteScroll({
    disabled:
      !keyword ||
      resultRequest.loading ||
      Boolean(loadMoreError) ||
      visibleProducts.length === 0,
    hasMore,
    loading: loadingMore,
    onLoadMore: loadMore,
    rootRef: listContainerRef,
    targetRef: loadMoreTriggerRef,
  });

  useRouteScrollRestoration({
    containerRef: listContainerRef,
    namespace: 'search-result-page',
    restoreDeps: [hasMore, keyword, resultRequest.loading, visibleProducts.length],
    restoreWhen: !resultRequest.loading && Boolean(keyword),
  });

  useEffect(() => {
    if (
      !keyword ||
      resultRequest.loading ||
      loadingMore ||
      !hasMore ||
      loadMoreError ||
      products.length === 0 ||
      visibleProducts.length > 0
    ) {
      return;
    }

    void loadMore();
  }, [
    hasMore,
    keyword,
    loadMore,
    loadMoreError,
    loadingMore,
    products.length,
    resultRequest.loading,
    visibleProducts.length,
  ]);

  const handlePriceSortClick = () => {
    setSortMode('price');
    setPriceOrder((previous) => (sortMode === 'price' && previous === 'asc' ? 'desc' : 'asc'));
  };

  const resetFilters = () => {
    setSelectedCategory('');
    setMinPrice('');
    setMaxPrice('');
  };

  const handleRefresh = useCallback(async () => {
    refreshStatus();
    queryVersionRef.current += 1;
    productsRef.current = [];
    pageRef.current = 1;
    loadingMoreRef.current = false;
    setProducts([]);
    setPage(1);
    setHasMore(false);
    setLoadingMore(false);
    setLoadMoreError(null);
    await Promise.allSettled([categoriesRequest.reload(), resultRequest.reload()]);
  }, [categoriesRequest, refreshStatus, resultRequest]);

  const renderSkeleton = () => {
    if (isGrid) {
      return (
        <div className="flex flex-wrap px-2 pt-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="mb-2 w-[calc(50%-4px)]"
              style={{ marginRight: index % 2 === 0 ? '8px' : '0' }}
            >
              <div className="overflow-hidden rounded-2xl bg-white pb-2 shadow-sm dark:bg-gray-900">
                <Skeleton className="aspect-square w-full" />
                <div className="mt-2 px-2">
                  <Skeleton className="mb-2 h-4 w-full" />
                  <Skeleton className="mb-3 h-4 w-2/3" />
                  <Skeleton className="h-5 w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="px-2 pt-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="mb-2 flex overflow-hidden rounded-2xl bg-white p-2 shadow-sm dark:bg-gray-900"
          >
            <Skeleton className="mr-3 h-[120px] w-[120px] shrink-0 rounded-lg" />
            <div className="flex flex-1 flex-col justify-between py-1">
              <div>
                <Skeleton className="mb-2 h-4 w-full" />
                <Skeleton className="mb-2 h-4 w-3/4" />
                <Skeleton className="h-3 w-1/3" />
              </div>
              <Skeleton className="h-5 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderLoadMoreFooter = () => {
    if (visibleProducts.length === 0) {
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

  const renderProducts = () => {
    if (!keyword) {
      return (
        <EmptyState message="请输入关键词后再搜索" actionText="去搜索" onAction={() => goTo('search')} />
      );
    }

    if (resultRequest.loading && products.length === 0) {
      return renderSkeleton();
    }

    if (resultRequest.error && products.length === 0) {
      return (
        <ErrorState
          message="商品搜索失败"
          onRetry={() => void resultRequest.reload().catch(() => undefined)}
        />
      );
    }

    if (visibleProducts.length === 0) {
      return (
        <EmptyState
          message="没有找到匹配的商品"
          actionText="去分类看看"
          onAction={() => goTo('category')}
        />
      );
    }

    if (isGrid) {
      return (
        <div className="flex flex-wrap px-2 pt-2 pb-safe">
          {visibleProducts.map((item, index) => {
            const imageUrl = resolveShopProductImageUrl(item.thumbnail);
            return (
            <button
              key={item.id}
              type="button"
              className="mb-2 w-[calc(50%-4px)] text-left active:opacity-90"
              style={{ marginRight: index % 2 === 0 ? '8px' : '0' }}
              onClick={() => goTo(buildShopProductPath(item.id))}
            >
              <div className="flex h-full flex-col overflow-hidden rounded-2xl bg-white pb-2 shadow-sm dark:bg-gray-900">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={item.name}
                    className="aspect-square w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="aspect-square w-full flex items-center justify-center bg-bg-base text-text-aux">
                    <ImageIcon size={40} className="opacity-50" />
                  </div>
                )}
                <div className="mt-2 flex flex-1 flex-col px-2">
                  <h3 className="mb-1.5 line-clamp-2 text-base font-medium leading-snug text-text-main">
                    {item.name}
                  </h3>
                  <div className="mb-2 flex flex-wrap gap-1">
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
                  <div className="mt-auto">
                    <ShopProductPriceDisplay product={item} />
                    <div className="mt-1 text-xs text-text-aux">销量 {formatShopProductSales(item.sales)}</div>
                  </div>
                </div>
              </div>
            </button>
            );
          })}
          <div className="w-full">{renderLoadMoreFooter()}</div>
        </div>
      );
    }

    return (
      <div className="px-2 pt-2 pb-safe">
        {visibleProducts.map((item) => {
          const imageUrl = resolveShopProductImageUrl(item.thumbnail);
          return (
          <button
            key={item.id}
            type="button"
            className="mb-2 flex w-full overflow-hidden rounded-2xl bg-white p-2 text-left shadow-sm active:opacity-90 dark:bg-gray-900"
            onClick={() => goTo(buildShopProductPath(item.id))}
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={item.name}
                className="mr-3 h-[120px] w-[120px] shrink-0 rounded-lg object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="mr-3 h-[120px] w-[120px] shrink-0 rounded-lg flex items-center justify-center bg-bg-base text-text-aux">
                <ImageIcon size={32} className="opacity-50" />
              </div>
            )}
            <div className="flex flex-1 flex-col justify-between py-1">
              <div>
                <h3 className="mb-1.5 line-clamp-2 text-md font-medium leading-snug text-text-main">
                  {item.name}
                </h3>
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
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <ShopProductPriceDisplay product={item} />
                  <div className="mt-1 text-xs text-text-aux">
                    销量 {formatShopProductSales(item.sales)} · {item.category}
                  </div>
                </div>
                <span className="rounded-full bg-red-50 px-2 py-1 text-xs text-primary-start">
                  查看详情
                </span>
              </div>
            </div>
          </button>
          );
        })}
        {renderLoadMoreFooter()}
      </div>
    );
  };

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-bg-base">
      {isOffline && <OfflineBanner onAction={refreshStatus} />}

      <div className="relative z-40 shrink-0 bg-white dark:bg-gray-900">
        <div className="flex h-12 items-center px-3 pt-safe">
          <button onClick={goBack} className="mr-1 p-1 text-text-main active:opacity-70">
            <ChevronLeft size={24} />
          </button>
          <button
            type="button"
            className="flex h-8 flex-1 items-center rounded-full border border-border-light bg-bg-base px-3 text-left"
            onClick={() => goTo('search')}
          >
            <SearchIcon size={16} className="mr-2 shrink-0 text-text-aux" />
            <span className="flex-1 truncate text-base text-text-main">{keyword || '搜索商品'}</span>
            {keyword && (
              <span className="p-1 text-text-aux">
                <X size={14} />
              </span>
            )}
          </button>
        </div>

        <div className="flex h-10 items-center border-b border-border-light px-3 text-base text-text-main">
          <div className="flex flex-1 items-center">
            <button
              type="button"
              onClick={() => setSortMode('default')}
              className={`mr-6 ${sortMode === 'default' ? 'font-bold text-primary-start' : ''}`}
            >
              综合
            </button>
            <button
              type="button"
              onClick={() => setSortMode('sales')}
              className={`mr-6 ${sortMode === 'sales' ? 'font-bold text-primary-start' : ''}`}
            >
              销量
            </button>
            <button
              type="button"
              onClick={handlePriceSortClick}
              className={`mr-6 flex items-center ${
                sortMode === 'price' ? 'font-bold text-primary-start' : ''
              }`}
            >
              价格
              <div className="ml-0.5 flex flex-col">
                <ChevronUp
                  size={8}
                  className={`-mb-0.5 ${
                    sortMode === 'price' && priceOrder === 'asc'
                      ? 'text-primary-start'
                      : 'text-text-aux'
                  }`}
                />
                <ChevronDown
                  size={8}
                  className={
                    sortMode === 'price' && priceOrder === 'desc'
                      ? 'text-primary-start'
                      : 'text-text-aux'
                  }
                />
              </div>
            </button>
            <button
              type="button"
              onClick={() => setSortMode('latest')}
              className={sortMode === 'latest' ? 'font-bold text-primary-start' : ''}
            >
              新品
            </button>
          </div>
          <div className="flex shrink-0 items-center border-l border-border-light pl-3">
            <button
              type="button"
              className="mr-2 p-1 text-text-main active:opacity-70"
              onClick={() => setIsGrid((previous) => !previous)}
            >
              {isGrid ? <ListIcon size={16} /> : <LayoutGrid size={16} />}
            </button>
            <button
              type="button"
              className="flex items-center text-text-main active:opacity-70"
              onClick={() => setIsDrawerOpen(true)}
            >
              <span className="mr-1">筛选</span>
              <Filter size={14} />
            </button>
          </div>
        </div>
      </div>

      <div ref={listContainerRef} className="flex-1 overflow-y-auto">
        {renderProducts()}
      </div>

      <div
        className={`fixed inset-0 z-50 flex justify-end transition-opacity duration-300 ${
          isDrawerOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <div className="absolute inset-0 bg-black/40" onClick={() => setIsDrawerOpen(false)} />
        <div
          className={`relative flex h-full w-[85%] max-w-[320px] flex-col bg-bg-base transition-transform duration-300 ${
            isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex-1 overflow-y-auto p-4 pt-safe">
            <div className="mb-6">
              <h4 className="mb-3 text-md font-bold text-text-main">价格区间</h4>
              <div className="flex items-center justify-between">
                <input
                  type="number"
                  value={minPrice}
                  onChange={(event) => setMinPrice(event.target.value)}
                  placeholder="最低价"
                  className="h-8 w-[45%] rounded-full border border-transparent bg-bg-card px-4 text-lg text-text-main outline-none focus:border-primary-start/30"
                />
                <span className="text-text-aux">-</span>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(event) => setMaxPrice(event.target.value)}
                  placeholder="最高价"
                  className="h-8 w-[45%] rounded-full border border-transparent bg-bg-card px-4 text-lg text-text-main outline-none focus:border-primary-start/30"
                />
              </div>
            </div>

            <div className="mb-6">
              <h4 className="mb-3 text-md font-bold text-text-main">分类</h4>
              {categoriesRequest.loading ? (
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <Skeleton key={index} className="h-8 w-20 rounded-full" />
                  ))}
                </div>
              ) : (
                <div className="mx-[-4px] flex flex-wrap">
                  {categories.map((category) => {
                    const isActive = selectedCategory === category.name;
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() =>
                          setSelectedCategory((previous) =>
                            previous === category.name ? '' : category.name,
                          )
                        }
                        className={`mx-[4px] mb-[8px] h-8 w-[calc(33.33%-8px)] truncate rounded-full border px-2 text-sm ${
                          isActive
                            ? 'border-primary-start/30 bg-primary-start/10 text-primary-start'
                            : 'border-transparent bg-bg-card text-text-main'
                        }`}
                      >
                        {category.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 border-t border-border-light p-4">
            <button
              type="button"
              className="rounded-full border border-border-light bg-white px-4 py-2 text-base text-text-main dark:bg-gray-900"
              onClick={resetFilters}
            >
              重置
            </button>
            <button
              type="button"
              className="rounded-full bg-primary-start px-4 py-2 text-base text-white"
              onClick={() => setIsDrawerOpen(false)}
            >
              完成
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

