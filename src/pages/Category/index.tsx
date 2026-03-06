import React, { useState, useEffect } from 'react';
import { ChevronLeft, Search, MessageCircle, ShoppingCart, WifiOff, RefreshCcw, FileX } from 'lucide-react';
import { Skeleton } from '../../components/ui/Skeleton';
import { useAppNavigate } from '../../lib/navigation';
import { PageHeader } from '../../components/layout/PageHeader';

export const CategoryPage = () => {
  const { goTo, goBack } = useAppNavigate();

  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [moduleError, setModuleError] = useState(false);
  const [emptyData, setEmptyData] = useState(false);
  const [activeCategory, setActiveCategory] = useState(1);

  const categories = [
    { id: 1, name: '推荐分类' },
    { id: 2, name: '手机数码' },
    { id: 3, name: '家用电器' },
    { id: 4, name: '电脑办公' },
    { id: 5, name: '美妆护肤' },
    { id: 6, name: '个人护理' },
    { id: 7, name: '食品生鲜' },
    { id: 8, name: '母婴童装' },
    { id: 9, name: '运动户外' },
    { id: 10, name: '家居家装' },
    { id: 11, name: '男装女装' },
    { id: 12, name: '鞋靴箱包' },
  ];

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [activeCategory]);

  const handleBack = () => {
    goBack();
  };

  const handleProductClick = () => {
    goTo('product_detail');
  };

  const renderHeader = () => (
    <div className="bg-white dark:bg-gray-900 z-40 relative border-b border-border-light">
      {offline && (
        <div className="bg-red-50 text-primary-start px-4 py-2 flex items-center justify-between text-sm">
          <div className="flex items-center">
            <WifiOff size={14} className="mr-2" />
            <span>网络不稳定，请检查网络设置</span>
          </div>
          <button onClick={() => setOffline(false)} className="font-medium px-2 py-1 bg-white dark:bg-gray-900 rounded shadow-sm">刷新</button>
        </div>
      )}
      <div className="h-12 flex items-center px-3 pt-safe">
        <button onClick={handleBack} className="p-1 mr-1 text-text-main active:opacity-70">
          <ChevronLeft size={24} />
        </button>
        <div className="flex-1 flex items-center bg-bg-base h-8 rounded-full px-3 mr-3">
          <Search size={16} className="text-text-aux mr-2" />
          <input 
            type="text" 
            placeholder="搜索商品/SKU" 
            className="bg-transparent border-none outline-none text-base text-text-main w-full placeholder:text-text-aux"
            readOnly
          />
        </div>
        <button className="p-1 text-text-main active:opacity-70">
          <MessageCircle size={22} />
        </button>
      </div>
    </div>
  );

  const renderLeftSidebar = () => (
    <div className="w-[86px] bg-bg-base h-full overflow-y-auto no-scrollbar pb-safe">
      {categories.map((cat) => {
        const isActive = activeCategory === cat.id;
        return (
          <div
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`h-[50px] flex items-center justify-center text-base relative cursor-pointer transition-colors ${
              isActive ? 'bg-white dark:bg-gray-900 text-primary-start font-bold' : 'text-text-main hover:bg-white dark:bg-gray-900/50'
            }`}
          >
            {isActive && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[4px] h-[16px] bg-gradient-to-b from-primary-start to-primary-end rounded-r-full"></div>
            )}
            {cat.name}
          </div>
        );
      })}
    </div>
  );

  const renderRightContent = () => {
    if (moduleError) {
      return (
        <div className="flex-1 bg-white dark:bg-gray-900 h-full flex flex-col items-center justify-center p-4">
          <RefreshCcw size={32} className="text-text-aux mb-3" />
          <p className="text-md text-text-sub mb-4">分类数据加载失败</p>
          <button 
            onClick={() => { setLoading(true); setModuleError(false); }} 
            className="px-6 py-2 border border-border-light rounded-full text-base text-text-main active:bg-bg-base"
          >
            重新加载
          </button>
        </div>
      );
    }

    if (emptyData) {
      return (
        <div className="flex-1 bg-white dark:bg-gray-900 h-full flex flex-col items-center justify-center p-4">
          <FileX size={40} className="text-text-aux mb-3 opacity-50" strokeWidth={1.5} />
          <p className="text-md text-text-sub">该分类下暂无内容</p>
        </div>
      );
    }

    return (
      <div className="flex-1 bg-white dark:bg-gray-900 h-full overflow-y-auto no-scrollbar p-3 pb-safe">
        {/* Subcategories */}
        <div className="mb-6">
          <h3 className="text-md font-bold text-text-main mb-3">常用分类</h3>
          <div className="bg-bg-card rounded-2xl p-3 shadow-sm border border-border-light">
            <div className="grid grid-cols-3 gap-y-4">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <Skeleton className="w-12 h-12 rounded-full mb-2" />
                    <Skeleton className="w-10 h-3" />
                  </div>
                ))
              ) : (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex flex-col items-center cursor-pointer active:opacity-70">
                    <img 
                      src={`https://picsum.photos/seed/subcat${activeCategory}${i}/100/100`} 
                      alt="Category" 
                      className="w-12 h-12 rounded-full object-cover mb-2 border border-border-light"
                      referrerPolicy="no-referrer"
                    />
                    <span className="text-s text-text-main">子分类 {i + 1}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Popular Products */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-md font-bold text-text-main">热门商品</h3>
            <div className="flex space-x-2">
              <span className="text-s text-text-sub bg-bg-base px-2 py-1 rounded-full">综合</span>
              <span className="text-s text-text-sub bg-bg-base px-2 py-1 rounded-full">销量</span>
              <span className="text-s text-text-sub bg-bg-base px-2 py-1 rounded-full">价格</span>
            </div>
          </div>
          
          <div className="space-y-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex bg-bg-card rounded-xl p-2 shadow-sm border border-border-light">
                  <Skeleton className="w-[88px] h-[88px] rounded-lg mr-3 shrink-0" />
                  <div className="flex-1 py-1 flex flex-col">
                    <Skeleton className="w-full h-4 mb-2" />
                    <Skeleton className="w-2/3 h-4 mb-auto" />
                    <div className="flex justify-between items-end mt-2">
                      <Skeleton className="w-16 h-5" />
                      <Skeleton className="w-6 h-6 rounded-full" />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              Array.from({ length: 6 }).map((_, i) => (
                <div 
                  key={i} 
                  className="flex bg-bg-card rounded-xl p-2 shadow-sm border border-border-light cursor-pointer active:opacity-70 transition-opacity"
                  onClick={handleProductClick}
                >
                  <img 
                    src={`https://picsum.photos/seed/catprod${activeCategory}${i}/200/200`} 
                    alt="Product" 
                    className="w-[88px] h-[88px] rounded-lg object-cover mr-3 shrink-0 border border-border-light"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 flex flex-col justify-between py-0.5">
                    <div>
                      <div className="text-base text-text-main line-clamp-2 leading-tight mb-1">
                        <span className="inline-block bg-primary-start text-white text-2xs px-1 rounded-sm mr-1 font-medium align-middle">自营</span>
                        <span className="align-middle">Apple iPhone 15 Pro 256GB 原色钛金属 移动联通电信5G双卡双待手机</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <span className="text-2xs text-primary-start border border-primary-start/30 rounded-sm px-1">包邮</span>
                        <span className="text-2xs text-text-sub border border-border-light rounded-sm px-1">98%好评</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-end mt-2">
                      <div className="text-xl font-bold text-primary-start leading-none">
                        <span className="text-s">¥</span>4999
                      </div>
                      <button 
                        className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center text-primary-start"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Add to cart logic
                        }}
                      >
                        <ShoppingCart size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-bg-base relative overflow-hidden">
      

      {renderHeader()}
      
      <div className="flex-1 flex overflow-hidden">
        {renderLeftSidebar()}
        {renderRightContent()}
      </div>
    </div>
  );
};
