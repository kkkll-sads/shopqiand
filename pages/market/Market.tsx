
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Search, Filter, LayoutGrid, List, Loader2 } from 'lucide-react';
import { LoadingSpinner, EmptyState, LazyImage } from '../../components/common';
import { Product } from '../../types';
import {
  fetchShopProducts,
  fetchShopProductsBySales,
  fetchShopProductsByLatest,
  fetchShopProductCategories,
  normalizeAssetUrl,
  ShopProductItem,
} from '../../services/api';

interface MarketProps {
  onProductSelect?: (product: Product) => void;
}

const PAGE_SIZE = 10;

// 格式化价格显示，支持组合支付
const formatPriceDisplay = (product: Product) => {
  const { originalPrice = 0, scorePrice = 0, supportedPayTypes = [] } = product;

  // 如果支持组合支付(mixed)，显示组合格式（都要消耗）
  if (supportedPayTypes?.includes('mixed') && originalPrice > 0 && scorePrice > 0) {
    return (
      <div className="flex items-baseline mb-2">
        <span className="text-base text-orange-600 font-medium">¥{originalPrice}</span>
        <span className="text-base text-orange-600 font-medium mx-1">+</span>
        <span className="text-base text-orange-600 font-mono font-bold">{scorePrice}</span>
        <span className="text-base text-orange-600 font-medium">消费金</span>
      </div>
    );
  }

  // 如果只支持消费金，显示消费金价格
  if (supportedPayTypes?.includes('score') && !supportedPayTypes?.includes('money') || (originalPrice === 0 && scorePrice > 0)) {
    return (
      <div className="flex items-baseline mb-2">
        <span className="text-base text-orange-600 font-mono font-bold">{scorePrice}</span>
        <span className="text-base text-orange-600 font-medium">消费金</span>
      </div>
    );
  }

  // 如果只支持现金，显示现金价格
  if (supportedPayTypes?.includes('money') && !supportedPayTypes?.includes('score') || (scorePrice === 0 && originalPrice > 0)) {
    return (
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-lg text-orange-600 font-mono font-bold">¥{originalPrice}</span>

      </div>
    );
  }

  // 默认显示消费金价格（向后兼容）
  return (
    <div className="flex items-baseline gap-1 mb-2">
      <span className="text-lg text-orange-600 font-mono font-bold">{product.price}</span>
      <span className="text-lg text-orange-600 font-medium">消费金</span>
    </div>
  );
};

const Market: React.FC<MarketProps> = ({ onProductSelect }) => {
  const [activeFilter, setActiveFilter] = useState('comprehensive');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categoryList, setCategoryList] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showComprehensiveMenu, setShowComprehensiveMenu] = useState(false);

  // Categories Configuration（含“全部”+后端分类）
  const categories = useMemo(
    () => [
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
    // 使用消费金价格为主，若没有则退回现金价
    price: item.score_price || item.price || 0,
    image: normalizeAssetUrl(item.thumbnail),
    category: item.category || '其他',
    productType: 'shop', // 标记为消费金商城商品
    // 添加新的字段用于价格显示
    originalPrice: item.price,
    scorePrice: item.score_price,
    paymentDesc: item.payment_desc,
    supportedPayTypes: item.supported_pay_types,
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
        setLoadingMore(true);
      } else {
        setLoading(true);
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
    } catch (e: any) {
      console.error('加载商品列表失败:', e);
      setError(e?.msg || e?.response?.msg || e?.message || '加载商品失败，请稍后重试');
    } finally {
      setLoading(false);
      setLoadingMore(false);
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
      setShowComprehensiveMenu(false);
    } else if (filter === 'new') {
      // 最新排序：切换到最新筛选，会触发 useEffect 重新加载数据
      setActiveFilter('new');
      setShowComprehensiveMenu(false);
    } else {
      // 综合排序：切换到综合筛选，会触发 useEffect 重新加载数据
      setActiveFilter('comprehensive');
      setShowComprehensiveMenu((s) => !s);
    }
  };

  return (
    <div ref={containerRef} onScroll={handleScroll} className="h-[calc(100vh-60px)] overflow-y-auto bg-gray-50">
      {/* Header & Search */}
      <div className="bg-white p-3 sticky top-0 z-20 shadow-sm relative">
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
          {/* 综合 下拉菜单（含分类） */}
        {showComprehensiveMenu && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setShowComprehensiveMenu(false)} />
            <div className="absolute left-0 right-0 top-full mt-1 px-3 z-30">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div>
                  <div>
                    <button
                      className={`w-full text-left px-4 py-3 ${selectedCategory === 'all' ? 'text-orange-600' : 'text-gray-600'}`}
                      onClick={() => { setSelectedCategory('all'); setShowComprehensiveMenu(false); }}
                    >
                      全部商品
                    </button>
                    {categoryList.map((cat) => (
                      <button
                        key={cat}
                        className={`w-full text-left px-4 py-3 ${selectedCategory === cat ? 'text-orange-600' : 'text-gray-600'}`}
                        onClick={() => { setSelectedCategory(cat); setShowComprehensiveMenu(false); }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}


        

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
              {filter.id === 'comprehensive' && (
                <svg className={`ml-2 w-3 h-3 inline-block ${activeFilter === 'comprehensive' ? 'text-orange-600' : 'text-gray-400'}`} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              {filter.id === 'price' && (
                <div className="flex flex-col ml-1 -space-y-1">
                  <span className={`w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[4px] ${activeFilter === 'price_asc' ? 'border-b-orange-600' : 'border-b-gray-300'}`}></span>
                  <span className={`w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[4px] ${activeFilter === 'price_desc' ? 'border-t-orange-600' : 'border-t-gray-300'}`}></span>
                </div>
              )}
            </button>
          ))}
        </div>
        {/* (Dropdown removed - categories shown inline above) */}
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
          <div className="grid grid-cols-2 gap-3">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg overflow-hidden shadow-sm active:scale-[0.98] transition-transform flex flex-col"
                onClick={() => onProductSelect && onProductSelect(product)}
              >
                <div className="aspect-square bg-gray-100 relative">
                  <LazyImage src={product.image} alt={product.title} className="w-full h-full object-cover" />
                </div>
                <div className="p-2.5 flex flex-col flex-1 justify-between">
                  <div className="mb-2">
                    <div className="text-sm text-gray-800 font-medium line-clamp-2 h-10 mb-1 leading-5">
                      {product.title}
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <span className="bg-gray-100 text-gray-400 px-1 rounded text-[10px] mr-1 flex-shrink-0">
                        艺术家
                      </span>
                      <span className="truncate">{product.artist}</span>
                    </div>
                  </div>
                  {formatPriceDisplay(product)}
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
