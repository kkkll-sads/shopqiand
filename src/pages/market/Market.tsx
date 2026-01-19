
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, LayoutGrid, List, Loader2 } from 'lucide-react';
import { LoadingSpinner, EmptyState, LazyImage } from '../../../components/common';
import { Product } from '../../../types';
import {
  fetchShopProducts,
  fetchShopProductsBySales,
  fetchShopProductsByLatest,
  fetchShopProductCategories,
  normalizeAssetUrl,
  ShopProductItem,
} from '../../../services/api';
import { useStateMachine } from '../../../hooks/useStateMachine';
import { LoadingEvent, LoadingState } from '../../../types/states';

interface MarketProps {
  onProductSelect?: (product: Product) => void;
}

const PAGE_SIZE = 10;

const Market: React.FC<MarketProps> = ({ onProductSelect }) => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('comprehensive');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [categoryList, setCategoryList] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
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

  // Categories Configuration（含“全部”+后端分类）
  const categories = useMemo(
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
    [categoryList],
  );

  const adaptShopProduct = (item: ShopProductItem): Product => ({
    id: String(item.id),
    title: item.name,
    // 暂无艺术家字段，用分类占位，避免界面空白
    artist: item.category || '消费金商品',
    // 人民币价格
    price: item.price || 0,
    image: normalizeAssetUrl(item.thumbnail),
    category: item.category || '其他',
    productType: 'shop', // 标记为消费金商城商品
    // 消费金价格（整数）
    score_price: item.score_price,
  });

  // 加载分类列表（只在首次加载时执行）
  useEffect(() => {
    let isMounted = true;
    const loadCategories = async () => {
      try {
        const categoriesRes = await fetchShopProductCategories();
        if (isMounted) {
          setCategoryList(categoriesRes.data?.list ?? []);
        }
      } catch (e: any) {
        console.error('加载商品分类失败:', e);
      }
    };
    loadCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  // 根据筛选条件加载商品列表
  const loadProducts = useCallback(async (pageNum: number, append: boolean = false) => {
    try {
      if (append) {
        loadMoreMachine.send(LoadingEvent.LOAD);
      } else {
        listMachine.send(LoadingEvent.LOAD);
      }
      setError(null);

      // 根据 activeFilter 选择不同的接口
      let listRes;
      if (activeFilter === 'sales') {
        listRes = await fetchShopProductsBySales({ page: pageNum, limit: PAGE_SIZE });
      } else if (activeFilter === 'new') {
        listRes = await fetchShopProductsByLatest({ page: pageNum, limit: PAGE_SIZE });
      } else {
        listRes = await fetchShopProducts({ page: pageNum, limit: PAGE_SIZE });
      }

      const remoteList = listRes.data?.list ?? [];
      const total = listRes.data?.total || 0;
      const newProducts = remoteList.map(adaptShopProduct);

      if (append) {
        setProducts(prev => [...prev, ...newProducts]);
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
    } catch (e: any) {
      console.error('加载商品列表失败:', e);
      setError(e?.msg || e?.response?.msg || e?.message || '加载商品失败，请稍后重试');
      if (append) {
        loadMoreMachine.send(LoadingEvent.ERROR);
      } else {
        listMachine.send(LoadingEvent.ERROR);
      }
    } finally {
      // 状态机已处理成功/失败
    }
  }, [activeFilter]);

  useEffect(() => {
    setPage(1);
    setProducts([]);
    loadProducts(1, false);
  }, [activeFilter, loadProducts]);

  // 滚动加载更多
  const handleScroll = useCallback(() => {
    if (!containerRef.current || loadingMore || !hasMore) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      loadProducts(page + 1, true);
    }
  }, [loadingMore, hasMore, page, loadProducts]);

  // Filtering Logic
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Filter by Search Query
      const matchesSearch = product.title.includes(searchQuery) ||
        product.artist.includes(searchQuery);

      // Filter by Category
      // Note: existing mock data mostly has 'painting'.
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;

      return matchesSearch && matchesCategory;
    }).sort((a, b) => {
      // Sort Logic
      if (activeFilter === 'price_asc') return a.price - b.price;
      if (activeFilter === 'price_desc') return b.price - a.price;
      return 0; // Default order
    });
  }, [products, searchQuery, selectedCategory, activeFilter]);

  const handleFilterClick = (filter: string) => {
    if (filter === 'price') {
      // Toggle price sort（价格排序在前端处理，不需要重新加载数据）
      setActiveFilter(prev => prev === 'price_asc' ? 'price_desc' : 'price_asc');
    } else if (filter === 'sales') {
      // 销量排序：切换到销量筛选，会触发 useEffect 重新加载数据
      setActiveFilter('sales');
    } else if (filter === 'new') {
      // 最新排序：切换到最新筛选，会触发 useEffect 重新加载数据
      setActiveFilter('new');
    } else {
      // 综合排序：切换到综合筛选，会触发 useEffect 重新加载数据
      setActiveFilter('comprehensive');
    }
  };

  return (
    <div ref={containerRef} onScroll={handleScroll} className="h-[calc(100vh-60px)] overflow-y-auto bg-gray-50">
      {/* Header & Search */}
      <div className="bg-white p-3 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <h1 className="font-bold text-lg text-gray-800 whitespace-nowrap">消费金兑换</h1>
          <div className="flex-1 bg-gray-100 rounded-full flex items-center px-3 py-1.5 border border-gray-100 focus-within:border-orange-200 transition-colors">
            <Search size={16} className="text-gray-400 mr-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="请输入您要搜索的商品名称"
              className="bg-transparent border-none outline-none text-xs flex-1 text-gray-700 placeholder-gray-400"
            />
          </div>
          <button className="bg-orange-600 text-white text-xs px-4 py-1.5 rounded-full shadow-sm shadow-orange-200 active:bg-orange-700">
            搜索
          </button>
        </div>

        {/* Categories Icons */}
        <div className="grid grid-cols-4 gap-2 mb-2">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex flex-col items-center py-2 cursor-pointer active:opacity-60"
              onClick={() => setSelectedCategory(cat.id)}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-1 border transition-colors ${selectedCategory === cat.id ? 'border-orange-500 text-orange-500 bg-orange-50' : 'border-gray-200 text-gray-400'}`}>
                <cat.icon size={20} />
              </div>
              <span className={`text-[10px] ${selectedCategory === cat.id ? 'text-orange-600 font-bold' : 'text-gray-500'}`}>
                {cat.label}
              </span>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="flex justify-between text-sm border-t border-gray-100 pt-3">
          {[
            { id: 'comprehensive', label: '综合' },
            { id: 'price', label: '价格' },
            { id: 'sales', label: '销量' },
            { id: 'new', label: '最新' }
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => handleFilterClick(filter.id)}
              className={`flex items-center justify-center flex-1 py-1 ${(activeFilter === filter.id || (filter.id === 'price' && activeFilter.startsWith('price')))
                ? 'text-orange-600 font-bold'
                : 'text-gray-500'
                }`}
            >
              {filter.label}
              {filter.id === 'price' && (
                <div className="flex flex-col ml-1 -space-y-1">
                  <span className={`w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[4px] ${activeFilter === 'price_asc' ? 'border-b-orange-600' : 'border-b-gray-300'}`}></span>
                  <span className={`w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[4px] ${activeFilter === 'price_desc' ? 'border-t-orange-600' : 'border-t-gray-300'}`}></span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="p-3">
        {loading ? (
          <LoadingSpinner text="商品加载中..." />
        ) : error ? (
          <EmptyState
            icon={<LayoutGrid size={48} className="text-gray-300" />}
            title="加载失败"
            description={error}
          />
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {filteredProducts.map((product, index) => (
              <div
                key={product.id}
                className="bg-white rounded-xl overflow-hidden shadow-sm active:scale-[0.98] transition-all duration-200 flex flex-col"
                onClick={() => {
                  if (onProductSelect) {
                    onProductSelect(product);
                  } else {
                    navigate(`/points-product/${product.id}`);
                  }
                }}
              >
                {/* 商品图片 */}
                <div className="aspect-square bg-gray-50 relative overflow-hidden">
                  <LazyImage 
                    src={product.image} 
                    alt={product.title} 
                    className="w-full h-full object-cover" 
                  />
                  {/* 热销标签 */}
                  {index < 3 && (
                    <div className="absolute top-0 left-0 bg-gradient-to-r from-red-500 to-orange-500 text-white text-[10px] px-2 py-0.5 rounded-br-lg font-medium">
                      热销
                    </div>
                  )}
                </div>

                {/* 商品信息 */}
                <div className="p-2.5 flex flex-col flex-1">
                  {/* 标题带标签 */}
                  <div className="flex items-start gap-1 mb-1.5">
                    <span className="flex-shrink-0 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[9px] px-1 py-0.5 rounded font-bold">
                      树交所
                    </span>
                    <span className="text-[13px] text-gray-800 font-medium line-clamp-2 leading-[1.3]">
                      {product.title}
                    </span>
                  </div>

                  {/* 分类标签 */}
                  <div className="flex items-center gap-1 mb-2">
                    <span className="text-[10px] text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100">
                      {product.category || '精选'}
                    </span>
                    {product.artist && product.artist !== '消费金商品' && (
                      <span className="text-[10px] text-gray-400 truncate">
                        {product.artist}
                      </span>
                    )}
                  </div>

                  {/* 价格区域 */}
                  <div className="mt-auto">
                    <div className="flex items-baseline gap-1">
                      <span className="text-red-500 text-[10px] font-bold">¥</span>
                      <span className="text-red-500 text-lg font-bold leading-none">
                        {product.price > 0 ? product.price.toLocaleString() : '0'}
                      </span>
                      {product.score_price && product.score_price > 0 && (
                        <span className="text-orange-500 text-[11px] font-medium">
                          +{product.score_price}消费金
                        </span>
                      )}
                    </div>
                    
                    {/* 促销信息 */}
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
                        兑换价
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {((parseInt(product.id, 10) || index + 1) * 17 % 500) + 100}人付款
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<LayoutGrid size={48} className="text-gray-300" />}
            title="暂无相关商品"
            description="换个关键词试试吧"
          />
        )}

        {/* 加载更多指示器 */}
        {loadingMore && (
          <div className="py-4 flex items-center justify-center text-gray-400 text-xs">
            <Loader2 size={16} className="animate-spin mr-2" />
            加载中...
          </div>
        )}

        {/* 没有更多数据 */}
        {!loading && !hasMore && filteredProducts.length > 0 && (
          <div className="py-4 text-center text-gray-400 text-xs pb-20">
            已加载全部
          </div>
        )}
      </div>
    </div>
  );
};

export default Market;
