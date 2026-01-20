
import React, { useState, useMemo, useEffect, useCallback, useRef, TouchEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, LayoutGrid, List, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { LoadingSpinner, EmptyState, LazyImage, SkeletonProductGrid } from '../../../components/common';
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
import { useAppStore } from '../../stores/appStore';
import { errorLog } from '../../../utils/logger';

interface MarketProps {
  onProductSelect?: (product: Product) => void;
}

const PAGE_SIZE = 10;

const Market: React.FC<MarketProps> = ({ onProductSelect }) => {
  const navigate = useNavigate();
  const { setSelectedProduct } = useAppStore();
  const [activeFilter, setActiveFilter] = useState('comprehensive');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [categoryList, setCategoryList] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 滑动切换相关状态
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchMoveRef = useRef<{ x: number; y: number } | null>(null);
  const isSwipingRef = useRef(false);
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
    // 人民币价格 - 确保转换为数字
    price: Number(item.price) || 0,
    image: normalizeAssetUrl(item.thumbnail),
    category: item.category || '其他',
    productType: 'shop', // 标记为消费金商城商品
    // 消费金价格（整数）- 确保转换为数字
    score_price: Number(item.score_price) || 0,
    // 绿色能量和余额可用金额
    green_power_amount: Number(item.green_power_amount) || 0,
    balance_available_amount: Number(item.balance_available_amount) || 0,
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
        errorLog('Market', '加载商品分类失败', e);
      }
    };
    loadCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  // 根据筛选条件加载商品列表
  const loadProducts = useCallback(async (pageNum: number, append: boolean = false, category?: string) => {
    try {
      if (append) {
        loadMoreMachine.send(LoadingEvent.LOAD);
      } else {
        listMachine.send(LoadingEvent.LOAD);
      }
      setError(null);

      // 根据 activeFilter 选择不同的接口
      let listRes;
      const params: any = { page: pageNum, limit: PAGE_SIZE };
      // 如果有分类筛选，添加分类参数
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
      errorLog('Market', '加载商品列表失败', e);
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

  // 当筛选条件或分类变化时重新加载数据
  useEffect(() => {
    setPage(1);
    setProducts([]);
    loadProducts(1, false, selectedCategory);
  }, [activeFilter, selectedCategory, loadProducts]);

  // 滚动加载更多
  const handleScroll = useCallback(() => {
    if (!containerRef.current || loadingMore || !hasMore) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      loadProducts(page + 1, true, selectedCategory);
    }
  }, [loadingMore, hasMore, page, loadProducts, selectedCategory]);

  // 获取所有分类的 ID 列表（用于滑动切换）
  const categoryIds = useMemo(() => categories.map(c => c.id), [categories]);
  
  // 滑动切换分类处理
  const handleTouchStart = useCallback((e: TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    touchMoveRef.current = null;
    isSwipingRef.current = false;
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current) return;
    const touch = e.touches[0];
    touchMoveRef.current = { x: touch.clientX, y: touch.clientY };
    
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    
    // 如果水平滑动距离大于垂直滑动距离，标记为滑动切换
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 30) {
      isSwipingRef.current = true;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touchStartRef.current || !touchMoveRef.current || !isSwipingRef.current) {
      touchStartRef.current = null;
      touchMoveRef.current = null;
      isSwipingRef.current = false;
      return;
    }
    
    const deltaX = touchMoveRef.current.x - touchStartRef.current.x;
    const currentIndex = categoryIds.indexOf(selectedCategory);
    
    // 滑动距离大于 50px 时切换分类
    if (Math.abs(deltaX) > 50) {
      if (deltaX < 0 && currentIndex < categoryIds.length - 1) {
        // 向左滑动，切换到下一个分类
        setSelectedCategory(categoryIds[currentIndex + 1]);
      } else if (deltaX > 0 && currentIndex > 0) {
        // 向右滑动，切换到上一个分类
        setSelectedCategory(categoryIds[currentIndex - 1]);
      }
    }
    
    touchStartRef.current = null;
    touchMoveRef.current = null;
    isSwipingRef.current = false;
  }, [categoryIds, selectedCategory]);

  // Filtering Logic（分类筛选已在后端处理，前端只处理搜索和排序）
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Filter by Search Query
      if (!searchQuery) return true;
      const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.artist.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    }).sort((a, b) => {
      // Sort Logic
      if (activeFilter === 'price_asc') return a.price - b.price;
      if (activeFilter === 'price_desc') return b.price - a.price;
      return 0; // Default order
    });
  }, [products, searchQuery, activeFilter]);

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
    <div 
      ref={containerRef} 
      onScroll={handleScroll} 
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="h-[calc(100vh-60px)] overflow-y-auto bg-gray-100">
      {/* Header & Search - 简约白底 + 红色点缀 */}
      <div className="bg-white sticky top-0 z-20 shadow-sm/50">
        {/* 搜索栏 */}
        <div className="flex items-center gap-2.5 p-3 pb-2">
          <h1 className="font-bold text-lg text-gray-900 whitespace-nowrap tracking-wide">消费金商城</h1>
          <div className="flex-1 bg-gray-100/80 rounded-full flex items-center px-4 py-2 transition-all border border-transparent focus-within:bg-white focus-within:border-red-500 focus-within:shadow-sm focus-within:shadow-red-500/10">
            <Search size={16} className="text-gray-400 mr-2 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索商品"
              className="bg-transparent border-none outline-none text-sm flex-1 text-gray-700 placeholder-gray-400"
            />
          </div>
          <button className="bg-gradient-to-r from-red-600 to-red-500 text-white text-sm font-semibold px-4 py-2 rounded-full shadow-lg shadow-red-600/20 active:scale-95 transition-all whitespace-nowrap">
            搜索
          </button>
        </div>

        {/* Categories Icons - 分类入口（支持左右滑动切换） */}
        <div className="px-3 pb-2 relative">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1">
            {categories.map((cat, index) => (
              <div
                key={cat.id}
                className={`flex flex-col items-center px-3 py-2 cursor-pointer active:scale-95 transition-all rounded-2xl min-w-[64px] ${selectedCategory === cat.id
                    ? 'bg-red-50'
                    : 'bg-transparent'
                  }`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1.5 transition-colors ${selectedCategory === cat.id ? 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-md shadow-red-500/20' : 'bg-gray-100 text-gray-500'
                  }`}>
                  <cat.icon
                    size={20}
                    strokeWidth={selectedCategory === cat.id ? 2 : 1.5}
                  />
                </div>
                <span className={`text-[11px] font-medium whitespace-nowrap ${selectedCategory === cat.id ? 'text-red-600' : 'text-gray-600'
                  }`}>
                  {cat.label}
                </span>
              </div>
            ))}
          </div>
          {/* 滑动提示指示器 */}
          {categoryIds.length > 1 && (
            <div className="flex justify-center items-center gap-1 mt-1">
              {categoryIds.map((id, index) => (
                <div 
                  key={id} 
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    selectedCategory === id ? 'bg-red-500 w-3' : 'bg-gray-300'
                  }`} 
                />
              ))}
            </div>
          )}
        </div>

        {/* Filter Tabs - 筛选标签 */}
        <div className="flex bg-white border-t border-gray-100">
          {[
            { id: 'comprehensive', label: '综合' },
            { id: 'price', label: '价格' },
            { id: 'sales', label: '销量' },
            { id: 'new', label: '最新' }
          ].map((filter) => {
            const isActive = activeFilter === filter.id || (filter.id === 'price' && activeFilter.startsWith('price'));
            return (
              <button
                key={filter.id}
                onClick={() => handleFilterClick(filter.id)}
                className={`flex items-center justify-center flex-1 py-3 text-[13px] relative transition-all ${isActive ? 'text-red-600 font-bold' : 'text-gray-600 font-medium'
                  }`}
              >
                {filter.label}
                {filter.id === 'price' && (
                  <div className="flex flex-col ml-1 gap-[2px]">
                    <span className={`w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[4px] ${activeFilter === 'price_asc' ? 'border-b-red-600' : 'border-b-gray-300'}`}></span>
                    <span className={`w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[4px] ${activeFilter === 'price_desc' ? 'border-t-red-600' : 'border-t-gray-300'}`}></span>
                  </div>
                )}
                {/* 底部指示条 */}
                {isActive && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[3px] bg-red-600 rounded-full shadow-sm shadow-red-500/50" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Product Grid - 商品列表 */}
      <div className="p-2.5">
        {loading ? (
          <SkeletonProductGrid count={6} />
        ) : error ? (
          <div className="py-20">
            <EmptyState
              icon={<LayoutGrid size={48} className="text-gray-300" />}
              title="加载失败"
              description={error}
            />
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-2.5">
            {filteredProducts.map((product, index) => (
              <div
                key={product.id}
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-200 flex flex-col border border-transparent hover:border-red-100"
                onClick={() => {
                  if (onProductSelect) {
                    onProductSelect(product);
                  } else {
                    setSelectedProduct(product, 'market');
                    navigate(`/product/${product.id}`);
                  }
                }}
              >
                {/* 商品图片 */}
                <div className="aspect-square bg-gray-100 relative overflow-hidden">
                  <LazyImage
                    src={product.image}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                  {/* 热销标签 */}
                  {index < 3 && (
                    <div className="absolute top-0 left-0 bg-gradient-to-br from-red-600 to-red-500 text-white text-[10px] px-2 py-1 rounded-br-lg font-bold shadow-sm z-10">
                      Top {index + 1}
                    </div>
                  )}
                  {/* 新品标签 */}
                  {index >= 3 && index < 6 && activeFilter === 'new' && (
                    <div className="absolute top-2 left-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold shadow-sm">
                      ✨ 新品
                    </div>
                  )}
                </div>

                {/* 商品信息 */}
                <div className="p-3 flex flex-col flex-1">
                  {/* 标题 */}
                  <h3 className="text-[13px] text-gray-800 font-medium line-clamp-2 leading-snug mb-2">
                    {product.title}
                  </h3>

                  {/* 分类标签 */}
                  <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
                    {/* 树交所标签：红色 */}
                    <span className="text-[10px] text-white bg-gradient-to-r from-red-500 to-red-600 px-1.5 py-0.5 rounded font-medium leading-none">
                      树交所
                    </span>
                    {product.category && (
                      <span className="text-[10px] text-gray-500 bg-gray-100 px-1 py-0.5 rounded-[4px] font-medium leading-none">
                        {product.category}
                      </span>
                    )}
                    <span className="text-[10px] text-gray-400">
                      {((parseInt(product.id, 10) || index + 1) * 17 % 500) + 100}人已兑
                    </span>
                  </div>

                  {/* 价格区域 */}
                  <div className="mt-auto pt-2 border-t border-gray-50">
                    {/* 组合支付模式判断 */}
                    {(product.green_power_amount > 0 || product.balance_available_amount > 0) ? (
                      // 组合支付：消费金 + 可用余额
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          {product.green_power_amount > 0 && (
                            <span className="text-[11px] text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded font-medium">
                              {product.green_power_amount}消费金
                            </span>
                          )}
                          {product.green_power_amount > 0 && product.balance_available_amount > 0 && (
                            <span className="text-[10px] text-gray-400">+</span>
                          )}
                          {product.balance_available_amount > 0 && (
                            <span className="text-[11px] text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded font-medium">
                              ¥{product.balance_available_amount}
                            </span>
                          )}
                        </div>
                        {/* 如果也有现金价格，显示在下方 */}
                        {product.price > 0 && (
                          <div className="flex items-baseline">
                            <span className="text-gray-400 text-[10px] line-through">
                              ¥{product.price.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      // 纯现金或纯消费金模式
                      <div className="flex items-baseline gap-0.5 flex-wrap">
                        {/* 现金价格：仅在price > 0时显示 */}
                        {product.price > 0 && (
                          <>
                            <span className="text-red-600 text-xs font-bold font-[DINAlternate-Bold]">¥</span>
                            <span className="text-red-600 text-xl font-bold leading-none font-[DINAlternate-Bold] -ml-[1px]">
                              {product.price.toLocaleString()}
                            </span>
                          </>
                        )}
                        {/* 消费金价格：红色显示 */}
                        {product.score_price && product.score_price > 0 && (
                          <span className="text-[10px] text-red-600 border border-red-200 bg-red-50 px-1 py-[1px] rounded-[4px] ml-1 font-medium">
                            {product.score_price}消费金
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20">
            <EmptyState
              icon={<LayoutGrid size={48} className="text-gray-300" />}
              title="暂无相关商品"
              description="换个关键词试试吧"
            />
          </div>
        )}

        {/* 加载更多指示器 */}
        {loadingMore && (
          <div className="py-6 flex items-center justify-center text-gray-400 text-xs">
            <Loader2 size={16} className="animate-spin mr-2 text-red-500" />
            正在加载更多商品...
          </div>
        )}

        {/* 没有更多数据 */}
        {!loading && !hasMore && filteredProducts.length > 0 && (
          <div className="py-6 text-center text-gray-400 text-xs pb-20">
            <div className="inline-flex items-center gap-2">
              <div className="w-8 h-px bg-gray-200" />
              <span>已加载全部</span>
              <div className="w-8 h-px bg-gray-200" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Market;
