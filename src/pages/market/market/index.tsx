import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, LayoutGrid, List } from 'lucide-react';
import type { Product } from '@/types';
import {
  fetchShopProducts,
  fetchShopProductsBySales,
  fetchShopProductsByLatest,
  fetchShopProductCategories,
  normalizeAssetUrl,
  type FetchShopProductsParams,
  type ShopProductItem,
} from '@/services';
import { useStateMachine } from '@/hooks/useStateMachine';
import { LoadingEvent, LoadingState } from '@/types/states';
import { useAppStore, MARKET_CACHE_TTL } from '@/stores/appStore';
import { errorLog, debugLog } from '@/utils/logger';
import MarketHeader, { type MarketCategoryOption } from './components/MarketHeader';
import MarketProductGrid from './components/MarketProductGrid';

interface MarketProps {
  onProductSelect?: (product: Product) => void;
}

const PAGE_SIZE = 10;

interface ErrorWithMessage {
  msg?: string;
  message?: string;
  response?: {
    msg?: string;
  };
}

const extractErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error !== 'object' || error === null) return fallback;
  const err = error as ErrorWithMessage;
  return err.msg || err.response?.msg || err.message || fallback;
};

const Market: React.FC<MarketProps> = ({ onProductSelect }) => {
  const navigate = useNavigate();
  const { setSelectedProduct, marketCache, setMarketCache } = useAppStore();

  const [activeFilter, setActiveFilter] = useState('comprehensive');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [categoryList, setCategoryList] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const restoredFromCacheRef = useRef(false);
  const scrollTopRef = useRef(0);

  const listMachine = useStateMachine<LoadingState, LoadingEvent>({
    initial: LoadingState.IDLE,
    transitions: {
      [LoadingState.IDLE]: { [LoadingEvent.LOAD]: LoadingState.LOADING },
      [LoadingState.LOADING]: {
        [LoadingEvent.SUCCESS]: LoadingState.SUCCESS,
        [LoadingEvent.ERROR]: LoadingState.ERROR,
      },
      [LoadingState.SUCCESS]: {
        [LoadingEvent.LOAD]: LoadingState.LOADING,
        [LoadingEvent.RETRY]: LoadingState.LOADING,
      },
      [LoadingState.ERROR]: {
        [LoadingEvent.LOAD]: LoadingState.LOADING,
        [LoadingEvent.RETRY]: LoadingState.LOADING,
      },
    },
  });

  const loadMoreMachine = useStateMachine<LoadingState, LoadingEvent>({
    initial: LoadingState.IDLE,
    transitions: {
      [LoadingState.IDLE]: { [LoadingEvent.LOAD]: LoadingState.LOADING },
      [LoadingState.LOADING]: {
        [LoadingEvent.SUCCESS]: LoadingState.SUCCESS,
        [LoadingEvent.ERROR]: LoadingState.ERROR,
      },
      [LoadingState.SUCCESS]: {
        [LoadingEvent.LOAD]: LoadingState.LOADING,
        [LoadingEvent.RETRY]: LoadingState.LOADING,
      },
      [LoadingState.ERROR]: {
        [LoadingEvent.LOAD]: LoadingState.LOADING,
        [LoadingEvent.RETRY]: LoadingState.LOADING,
      },
    },
  });

  const loading = listMachine.state === LoadingState.LOADING;
  const loadingMore = loadMoreMachine.state === LoadingState.LOADING;

  useEffect(() => {
    if (marketCache && Date.now() - marketCache.timestamp < MARKET_CACHE_TTL) {
      debugLog('Market', '从缓存恢复状态', {
        productsCount: marketCache.products.length,
        page: marketCache.page,
        scrollTop: marketCache.scrollTop,
        cacheAge: Math.round((Date.now() - marketCache.timestamp) / 1000) + 's',
      });

      setProducts(marketCache.products);
      setPage(marketCache.page);
      setHasMore(marketCache.hasMore);
      setActiveFilter(marketCache.activeFilter);
      setSelectedCategory(marketCache.selectedCategory);
      setSearchQuery(marketCache.searchQuery);
      if (marketCache.categoryList.length > 0) {
        setCategoryList(marketCache.categoryList);
      }

      restoredFromCacheRef.current = true;

      requestAnimationFrame(() => {
        if (containerRef.current && marketCache.scrollTop > 0) {
          containerRef.current.scrollTo({ top: marketCache.scrollTop, behavior: 'instant' });
        }
      });

      listMachine.send(LoadingEvent.LOAD);
      listMachine.send(LoadingEvent.SUCCESS);
    }
  }, []);

  useEffect(() => {
    const handleScrollForCache = () => {
      if (containerRef.current) {
        scrollTopRef.current = containerRef.current.scrollTop;
      }
    };

    const container = containerRef.current;
    container?.addEventListener('scroll', handleScrollForCache);

    return () => {
      container?.removeEventListener('scroll', handleScrollForCache);

      if (products.length > 0) {
        debugLog('Market', '保存缓存状态', {
          productsCount: products.length,
          page,
          scrollTop: scrollTopRef.current,
        });

        setMarketCache({
          products,
          page,
          hasMore,
          scrollTop: scrollTopRef.current,
          activeFilter,
          selectedCategory,
          searchQuery,
          categoryList,
          timestamp: Date.now(),
        });
      }
    };
  }, [products, page, hasMore, activeFilter, selectedCategory, searchQuery, categoryList, setMarketCache]);

  const categories = useMemo<MarketCategoryOption[]>(
    () => [
      { id: 'all', label: '全部商品', icon: LayoutGrid },
      ...categoryList.map((name) => ({
        id: name,
        label: name,
        icon:
          name === '数码产品' || name === '数码配件'
            ? Filter
            : name === '优惠券'
              ? List
              : LayoutGrid,
      })),
    ],
    [categoryList]
  );

  const adaptShopProduct = (item: ShopProductItem): Product => ({
    id: String(item.id),
    title: item.name,
    artist: item.category || '消费金商品',
    price: Number(item.price) || 0,
    image: normalizeAssetUrl(item.thumbnail),
    category: item.category || '其他',
    productType: 'shop',
    score_price: item.score_price ? Number(item.score_price) : 0,
    green_power_amount: item.green_power_amount ? Number(item.green_power_amount) : 0,
    balance_available_amount: item.balance_available_amount ? Number(item.balance_available_amount) : 0,
    sales: Number(item.sales) || 0,
  });

  useEffect(() => {
    let isMounted = true;

    const loadCategories = async () => {
      try {
        const categoriesRes = await fetchShopProductCategories();
        if (isMounted) {
          setCategoryList(categoriesRes.data?.list ?? []);
        }
      } catch (e: unknown) {
        errorLog('Market', '加载商品分类失败', e);
      }
    };

    loadCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  const loadProducts = useCallback(
    async (pageNum: number, append = false, category?: string) => {
      try {
        if (append) {
          loadMoreMachine.send(LoadingEvent.LOAD);
        } else {
          listMachine.send(LoadingEvent.LOAD);
        }
        setError(null);

        let listRes;
        const params: FetchShopProductsParams = { page: pageNum, limit: PAGE_SIZE };
        if (category && category !== 'all') {
          params.category = category;
        }

        if (activeFilter === 'sales') {
          listRes = await fetchShopProductsBySales(params);
        } else if (activeFilter === 'new') {
          listRes = await fetchShopProductsByLatest(params);
        } else {
          listRes = await fetchShopProducts(params);
        }

        const remoteList = listRes.data?.list ?? [];
        const total = listRes.data?.total || 0;
        const newProducts = remoteList.map(adaptShopProduct);

        if (append) {
          setProducts((prev) => [...prev, ...newProducts]);
        } else {
          setProducts(newProducts);
        }
        setPage(pageNum);
        setHasMore(pageNum * PAGE_SIZE < total);

        if (append) {
          loadMoreMachine.send(LoadingEvent.SUCCESS);
        } else {
          listMachine.send(LoadingEvent.SUCCESS);
        }
      } catch (e: unknown) {
        errorLog('Market', '加载商品列表失败', e);
        setError(extractErrorMessage(e, '加载商品失败，请稍后重试'));
        if (append) {
          loadMoreMachine.send(LoadingEvent.ERROR);
        } else {
          listMachine.send(LoadingEvent.ERROR);
        }
      }
    },
    [activeFilter]
  );

  useEffect(() => {
    if (restoredFromCacheRef.current) {
      restoredFromCacheRef.current = false;
      debugLog('Market', '跳过首次加载（从缓存恢复）');
      return;
    }

    setPage(1);
    setProducts([]);
    loadProducts(1, false, selectedCategory);
  }, [activeFilter, selectedCategory, loadProducts]);

  const handleScroll = useCallback(() => {
    if (!containerRef.current || loadingMore || !hasMore) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      loadProducts(page + 1, true, selectedCategory);
    }
  }, [loadingMore, hasMore, page, loadProducts, selectedCategory]);

  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        if (!searchQuery) return true;
        return (
          product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.artist.toLowerCase().includes(searchQuery.toLowerCase())
        );
      })
      .sort((a, b) => {
        if (activeFilter === 'price_asc') return a.price - b.price;
        if (activeFilter === 'price_desc') return b.price - a.price;
        return 0;
      });
  }, [products, searchQuery, activeFilter]);

  const handleFilterClick = (filter: string) => {
    if (filter === 'price') {
      setActiveFilter((prev) => (prev === 'price_asc' ? 'price_desc' : 'price_asc'));
    } else if (filter === 'sales') {
      setActiveFilter('sales');
    } else if (filter === 'new') {
      setActiveFilter('new');
    } else {
      setActiveFilter('comprehensive');
    }
  };

  const handleProductSelect = (product: Product) => {
    if (onProductSelect) {
      onProductSelect(product);
      return;
    }

    setSelectedProduct(product, 'market');
    navigate(`/product/${product.id}`);
  };

  return (
    <div ref={containerRef} onScroll={handleScroll} className="h-[calc(100vh-60px)] overflow-y-auto bg-gray-100">
      <MarketHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        activeFilter={activeFilter}
        onFilterClick={handleFilterClick}
      />

      <MarketProductGrid
        loading={loading}
        error={error}
        products={filteredProducts}
        activeFilter={activeFilter}
        loadingMore={loadingMore}
        hasMore={hasMore}
        onSelectProduct={handleProductSelect}
      />
    </div>
  );
};

export default Market;
