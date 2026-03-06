import React, { useState, useEffect } from 'react';
import { ChevronLeft, Search as SearchIcon, LayoutGrid, List as ListIcon, Filter, ShoppingCart, X, WifiOff, RefreshCcw, FileX, ChevronDown, ChevronUp } from 'lucide-react';
import { Skeleton } from '../../components/ui/Skeleton';
import { useAppNavigate } from '../../lib/navigation';
import { PageHeader } from '../../components/layout/PageHeader';

export const SearchResultPage = () => {
  const { goTo, goBack } = useAppNavigate();

  const [isGrid, setIsGrid] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [moduleError, setModuleError] = useState(false);
  const [emptyResult, setEmptyResult] = useState(false);
  const [activeTab, setActiveTab] = useState('综合');

  const mockProducts = [
    { id: 1, title: 'Apple iPhone 15 Pro (A3104) 256GB 蓝色钛金属 支持移动联通电信5G 双卡双待手机', price: '7999.00', sold: '10万+', image: 'https://picsum.photos/seed/iphone/400/400', isSelf: true, freeShipping: true },
    { id: 2, title: '华为 HUAWEI Mate 60 Pro 12GB+512GB 雅川青 卫星通话 鸿蒙智能手机', price: '6999.00', sold: '5万+', image: 'https://picsum.photos/seed/mate60/400/400', isSelf: true, freeShipping: true },
    { id: 3, title: '小米14 徕卡光学镜头 光影猎人900 澎湃OS 12GB+256GB 黑色 5G手机', price: '3999.00', sold: '2万+', image: 'https://picsum.photos/seed/mi14/400/400', isSelf: true, freeShipping: true },
    { id: 4, title: '大疆 DJI Mini 4 Pro 迷你航拍机 航拍无人机 智能跟随 避障', price: '4788.00', sold: '1万+', image: 'https://picsum.photos/seed/dji/400/400', isSelf: false, freeShipping: true },
    { id: 5, title: '索尼（SONY）Alpha 7 IV 全画幅微单数码相机 单机身（A7M4/a74）', price: '16999.00', sold: '5000+', image: 'https://picsum.photos/seed/sony/400/400', isSelf: true, freeShipping: false },
    { id: 6, title: '任天堂（Nintendo）Switch NS掌上游戏机 续航增强版 红蓝主机', price: '1899.00', sold: '20万+', image: 'https://picsum.photos/seed/switch/400/400', isSelf: true, freeShipping: true },
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleBack = () => {
    goBack();
  };

  const goToSearch = () => {
    goTo('search');
  };

  const goToCategory = () => {
    goTo('category');
  };

  const goToProductDetail = () => {
    goTo('product_detail');
  };

  const renderHeader = () => (
    <div className="bg-white dark:bg-gray-900 z-40 relative shrink-0">
      {offline && (
        <div className="bg-red-50 text-primary-start px-4 py-2 flex items-center justify-between text-sm">
          <div className="flex items-center">
            <WifiOff size={14} className="mr-2" />
            <span>网络不稳定，请检查网络设置</span>
          </div>
          <button onClick={() => setOffline(false)} className="font-medium px-2 py-1 bg-white dark:bg-gray-900 rounded shadow-sm">刷新</button>
        </div>
      )}
      
      {/* Search Bar Row */}
      <div className="h-12 flex items-center px-3 pt-safe">
        <button onClick={handleBack} className="p-1 mr-1 text-text-main active:opacity-70">
          <ChevronLeft size={24} />
        </button>
        <div 
          className="flex-1 flex items-center bg-bg-base h-8 rounded-full px-3 border border-border-light cursor-text"
          onClick={goToSearch}
        >
          <SearchIcon size={16} className="text-text-aux mr-2 shrink-0" />
          <span className="text-base text-text-main flex-1 truncate">手机</span>
          <button className="p-1 -mr-1 text-text-aux active:opacity-70">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Filter Bar Row */}
      <div className="h-10 flex items-center px-3 border-b border-border-light text-base text-text-main">
        <div className="flex-1 flex items-center">
          {['综合', '销量'].map((tab) => (
            <div 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`mr-6 cursor-pointer ${activeTab === tab ? 'font-bold text-primary-start' : ''}`}
            >
              {tab}
            </div>
          ))}
          <div 
            onClick={() => setActiveTab('价格')}
            className={`mr-6 flex items-center cursor-pointer ${activeTab === '价格' ? 'font-bold text-primary-start' : ''}`}
          >
            价格
            <div className="flex flex-col ml-0.5">
              <ChevronUp size={8} className={`${activeTab === '价格' ? 'text-primary-start' : 'text-text-aux'} -mb-0.5`} />
              <ChevronDown size={8} className="text-text-aux" />
            </div>
          </div>
          <div 
            onClick={() => setActiveTab('新品')}
            className={`cursor-pointer ${activeTab === '新品' ? 'font-bold text-primary-start' : ''}`}
          >
            新品
          </div>
        </div>
        <div className="flex items-center pl-3 border-l border-border-light shrink-0">
          <button className="p-1 mr-2 active:opacity-70 text-text-main" onClick={() => setIsGrid(!isGrid)}>
            {isGrid ? <ListIcon size={16} /> : <LayoutGrid size={16} />}
          </button>
          <button className="flex items-center active:opacity-70 text-text-main" onClick={() => setIsDrawerOpen(true)}>
            <span className="mr-1">筛选</span>
            <Filter size={14} />
          </button>
        </div>
      </div>
    </div>
  );

  const renderSkeleton = () => {
    if (isGrid) {
      return (
        <div className="flex flex-wrap px-2 pt-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-[calc(50%-4px)] mb-2" style={{ marginRight: i % 2 === 0 ? '8px' : '0' }}>
              <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm pb-2">
                <Skeleton className="w-full aspect-square" />
                <div className="px-2 mt-2">
                  <Skeleton className="w-full h-4 mb-1" />
                  <Skeleton className="w-2/3 h-4 mb-2" />
                  <Skeleton className="w-1/3 h-3 mb-2" />
                  <div className="flex justify-between items-end">
                    <Skeleton className="w-1/2 h-5" />
                    <Skeleton className="w-6 h-6 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="px-2 pt-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm mb-2 flex p-2">
            <Skeleton className="w-[120px] h-[120px] rounded-lg shrink-0 mr-3" />
            <div className="flex-1 flex flex-col justify-between py-1">
              <div>
                <Skeleton className="w-full h-4 mb-1" />
                <Skeleton className="w-3/4 h-4 mb-2" />
                <Skeleton className="w-1/4 h-3" />
              </div>
              <div className="flex justify-between items-end">
                <Skeleton className="w-1/3 h-5" />
                <Skeleton className="w-7 h-7 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderContent = () => {
    if (moduleError) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <RefreshCcw size={32} className="text-text-aux mb-3" />
          <p className="text-md text-text-sub mb-4">加载失败，请检查网络</p>
          <button 
            onClick={() => { setLoading(true); setModuleError(false); }} 
            className="px-6 py-2 border border-border-light rounded-full text-base text-text-main bg-white dark:bg-gray-900 shadow-sm active:bg-bg-base"
          >
            重试
          </button>
        </div>
      );
    }

    if (emptyResult) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <FileX size={48} className="text-text-aux mb-4 opacity-50" strokeWidth={1.5} />
          <p className="text-lg font-medium text-text-main mb-1">没找到相关商品</p>
          <p className="text-base text-text-sub mb-6">换个词搜搜，或者去分类看看</p>
          <button 
            onClick={goToCategory}
            className="px-6 py-2 bg-white dark:bg-gray-900 border border-border-light rounded-full text-base text-text-main shadow-sm active:bg-bg-base"
          >
            去分类逛逛
          </button>
        </div>
      );
    }

    if (loading) {
      return renderSkeleton();
    }

    if (isGrid) {
      return (
        <div className="flex flex-wrap px-2 pt-2 pb-safe">
          {mockProducts.map((item, i) => (
            <div 
              key={item.id} 
              className="w-[calc(50%-4px)] mb-2 cursor-pointer active:opacity-90 transition-opacity" 
              style={{ marginRight: i % 2 === 0 ? '8px' : '0' }}
              onClick={goToProductDetail}
            >
              <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm pb-2 h-full flex flex-col">
                <img src={item.image} className="w-full aspect-square object-cover" referrerPolicy="no-referrer" alt={item.title} />
                <div className="px-2 mt-2 flex-1 flex flex-col">
                  <h3 className="text-base text-text-main font-medium line-clamp-2 leading-snug mb-1.5">
                    {item.isSelf && <span className="inline-block bg-primary-start text-white text-xs px-1 rounded-sm mr-1 leading-tight align-middle">自营</span>}
                    <span className="align-middle">{item.title}</span>
                  </h3>
                  <div className="mt-auto">
                    {item.freeShipping && <span className="inline-block border border-primary-start text-primary-start text-2xs px-1 rounded-sm mb-1.5">包邮</span>}
                    <div className="flex items-center justify-between mt-1">
                      <div>
                        <div className="text-primary-start font-bold leading-none mb-1">
                          <span className="text-xs">¥</span>
                          <span className="text-xl">{item.price.split('.')[0]}</span>
                          <span className="text-xs">.{item.price.split('.')[1]}</span>
                        </div>
                        <div className="text-xs text-text-aux leading-none">已售 {item.sold}</div>
                      </div>
                      <button 
                        className="w-6 h-6 bg-primary-start rounded-full flex items-center justify-center shrink-0 active:scale-95 transition-transform"
                        onClick={(e) => { e.stopPropagation(); /* Add to cart logic */ }}
                      >
                        <ShoppingCart size={12} className="text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="px-2 pt-2 pb-safe">
        {mockProducts.map((item) => (
          <div 
            key={item.id} 
            className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm mb-2 flex p-2 cursor-pointer active:opacity-90 transition-opacity"
            onClick={goToProductDetail}
          >
            <img src={item.image} className="w-[120px] h-[120px] rounded-lg object-cover shrink-0 mr-3" referrerPolicy="no-referrer" alt={item.title} />
            <div className="flex-1 flex flex-col justify-between py-1">
              <div>
                <h3 className="text-md text-text-main font-medium line-clamp-2 leading-snug mb-1.5">
                  {item.isSelf && <span className="inline-block bg-primary-start text-white text-xs px-1 rounded-sm mr-1 leading-tight align-middle">自营</span>}
                  <span className="align-middle">{item.title}</span>
                </h3>
                {item.freeShipping && <span className="inline-block border border-primary-start text-primary-start text-2xs px-1 rounded-sm mb-1.5">包邮</span>}
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-primary-start font-bold leading-none mb-1">
                    <span className="text-s">¥</span>
                    <span className="text-3xl">{item.price.split('.')[0]}</span>
                    <span className="text-s">.{item.price.split('.')[1]}</span>
                  </div>
                  <div className="text-s text-text-aux leading-none">已售 {item.sold}</div>
                </div>
                <button 
                  className="w-7 h-7 bg-primary-start rounded-full flex items-center justify-center shrink-0 active:scale-95 transition-transform"
                  onClick={(e) => { e.stopPropagation(); /* Add to cart logic */ }}
                >
                  <ShoppingCart size={14} className="text-white" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderDrawer = () => (
    <div className={`fixed inset-0 z-50 flex justify-end transition-opacity duration-300 ${isDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
      <div className="absolute inset-0 bg-black/40" onClick={() => setIsDrawerOpen(false)} />
      <div 
        className={`relative w-[85%] max-w-[320px] bg-bg-base h-full flex flex-col transition-transform duration-300 ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex-1 overflow-y-auto p-4 pt-safe">
          {/* Price Range */}
          <div className="mb-6">
            <h4 className="text-md font-bold text-text-main mb-3">价格区间</h4>
            <div className="flex items-center justify-between">
              <input type="number" placeholder="最低价" className="w-[45%] h-8 bg-bg-card rounded-full text-center text-sm text-text-main outline-none border border-transparent focus:border-primary-start/30" />
              <span className="text-text-aux">-</span>
              <input type="number" placeholder="最高价" className="w-[45%] h-8 bg-bg-card rounded-full text-center text-sm text-text-main outline-none border border-transparent focus:border-primary-start/30" />
            </div>
          </div>
          
          {/* Category */}
          <div className="mb-6">
            <h4 className="text-md font-bold text-text-main mb-3">分类</h4>
            <div className="flex flex-wrap mx-[-4px]">
              {['手机', '手机配件', '数码相机', '无人机'].map((cat, i) => (
                <button 
                  key={i} 
                  className={`w-[calc(33.33%-8px)] mx-[4px] mb-[8px] h-8 rounded-full text-sm truncate px-2 border transition-colors
                    ${i === 0 ? 'bg-primary-start/10 text-primary-start border-primary-start/30' : 'bg-bg-card text-text-main border-transparent active:bg-bg-base'}
                  `}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Brand */}
          <div className="mb-6">
            <h4 className="text-md font-bold text-text-main mb-3">品牌</h4>
            <div className="flex flex-wrap mx-[-4px]">
              {['Apple', '华为', '小米', '大疆', '索尼', '三星'].map((brand, i) => (
                <button 
                  key={i} 
                  className="w-[calc(33.33%-8px)] mx-[4px] mb-[8px] h-8 bg-bg-card rounded-full text-sm text-text-main truncate px-2 border border-transparent active:bg-primary-start/10 active:text-primary-start active:border-primary-start/30 transition-colors"
                >
                  {brand}
                </button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="mb-6">
            <h4 className="text-md font-bold text-text-main mb-3">选项</h4>
            <div className="flex flex-wrap mx-[-4px]">
              <button className="w-[calc(33.33%-8px)] mx-[4px] mb-[8px] h-8 bg-primary-start/10 border border-primary-start/30 text-primary-start rounded-full text-sm truncate px-2">
                仅看有货
              </button>
              <button className="w-[calc(33.33%-8px)] mx-[4px] mb-[8px] h-8 bg-bg-card rounded-full text-sm text-text-main truncate px-2 border border-transparent active:bg-bg-base">
                树交所发货
              </button>
            </div>
          </div>
        </div>
        
        {/* Bottom Buttons */}
        <div className="h-14 bg-white dark:bg-gray-900 border-t border-border-light flex items-center px-4 pb-safe shrink-0">
          <button 
            className="flex-1 h-10 rounded-full border border-border-light text-md text-text-main font-medium mr-3 active:bg-bg-base transition-colors" 
            onClick={() => setIsDrawerOpen(false)}
          >
            重置
          </button>
          <button 
            className="flex-1 h-10 rounded-full bg-gradient-to-r from-primary-start to-primary-end text-white text-md font-medium active:opacity-80 transition-opacity" 
            onClick={() => setIsDrawerOpen(false)}
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col bg-bg-base relative h-full overflow-hidden">
      

      {renderHeader()}
      
      <div className="flex-1 overflow-y-auto no-scrollbar relative">
        {renderContent()}
      </div>

      {renderDrawer()}
    </div>
  );
};
