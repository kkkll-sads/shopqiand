import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, WifiOff, AlertCircle, ShoppingCart, CheckCircle2, Circle, Trash2, HeartOff, RefreshCcw } from 'lucide-react';
import { useAppNavigate } from '../../lib/navigation';
import { PageHeader } from '../../components/layout/PageHeader';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { useRouteScrollRestoration } from '../../hooks/useRouteScrollRestoration';

export const FavoritesPage = () => {
  const { goTo, goBack } = useAppNavigate();
  const { showToast } = useFeedback();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [offline, setOffline] = useState(!navigator.onLine);
  const [empty, setEmpty] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Mock Data
  const [products, setProducts] = useState([
    { id: 'p1', title: 'Apple iPhone 15 Pro (A3104) 256GB 蓝色钛金属 支持移动联通电信5G 双卡双待手机', price: '7999.00', isSelfOperated: true, image: 'https://picsum.photos/seed/fav_p1/200/200' },
    { id: 'p2', title: '索尼（SONY）WH-1000XM5 头戴式无线降噪耳机 蓝牙5.2 铂金银', price: '2499.00', isSelfOperated: true, image: 'https://picsum.photos/seed/fav_p2/200/200' },
    { id: 'p3', title: '任天堂（Nintendo）Switch OLED版 掌上游戏机 白色 日版', price: '2199.00', isSelfOperated: false, image: 'https://picsum.photos/seed/fav_p3/200/200' },
    { id: 'p4', title: '大疆 DJI Mini 4 Pro 迷你航拍机 航拍无人机 智能跟随 避障 遥控飞机', price: '4788.00', isSelfOperated: true, image: 'https://picsum.photos/seed/fav_p4/200/200' },
  ]);

  useEffect(() => {
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    fetchData();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useRouteScrollRestoration({
    containerRef: scrollContainerRef,
    namespace: 'favorites-page',
    restoreDeps: [empty, error, loading, products.length],
    restoreWhen: !loading && !error && !empty,
  });

  const fetchData = () => {
    setLoading(true);
    setError(false);
    setIsEditing(false);
    setSelectedIds([]);
    setTimeout(() => {
      setLoading(false);
    }, 300);
  };

  const handleBack = () => {
    goBack();
  };

  const toggleEdit = () => {
    setIsEditing(!isEditing);
    setSelectedIds([]);
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(itemId => itemId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === products.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map(item => item.id));
    }
  };

  const handleDelete = () => {
    if (selectedIds.length === 0) return;
    const newProducts = products.filter(p => !selectedIds.includes(p.id));
    setProducts(newProducts);
    setSelectedIds([]);
    setIsEditing(false);
    if (newProducts.length === 0) {
      setEmpty(true);
    }
  };

  const isAllSelected = products.length > 0 && selectedIds.length === products.length;

  const renderHeader = () => (
    <div className="bg-white dark:bg-gray-900 z-40 relative shrink-0 border-b border-gray-100 dark:border-gray-800">
      <div className="h-11 flex items-center justify-between px-3">
        <div className="flex items-center w-1/3">
          <button onClick={handleBack} className="p-1 -ml-1 text-gray-900 dark:text-gray-100 active:opacity-70">
            <ChevronLeft size={24} />
          </button>
        </div>
        <h1 className="text-2xl font-medium text-gray-900 dark:text-gray-100 text-center w-1/3">我的收藏</h1>
        <div className="w-1/3 flex justify-end">
          {(!empty && !loading && !error) && (
            <button onClick={toggleEdit} className="text-md text-gray-600 dark:text-gray-400 px-2 py-1 active:opacity-70">
              {isEditing ? '完成' : '编辑'}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const renderSkeleton = () => (
    <div className="p-3 space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white dark:bg-gray-900 rounded-xl p-3 flex animate-pulse">
          <div className="w-28 h-28 bg-gray-200 dark:bg-gray-800 rounded-lg shrink-0 mr-3"></div>
          <div className="flex-1 flex flex-col py-1 justify-between">
            <div className="space-y-2">
              <div className="w-full h-4 bg-gray-200 dark:bg-gray-800 rounded"></div>
              <div className="w-3/4 h-4 bg-gray-200 dark:bg-gray-800 rounded"></div>
            </div>
            <div className="flex justify-between items-end">
              <div className="w-16 h-5 bg-gray-200 dark:bg-gray-800 rounded"></div>
              <div className="w-7 h-7 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderError = () => (
    <ErrorState onRetry={fetchData} />
  );

  const renderEmpty = () => (
    <EmptyState message="暂无收藏"
      actionText="去逛逛"
      onAction={() => goTo('home')} />
  );

  const renderContent = () => {
    if (loading) return renderSkeleton();
    if (error) return renderError();
    if (empty) return renderEmpty();

    return (
      <div className="p-3 space-y-3 pb-24">
        {products.map((item) => (
          <div 
            key={item.id} 
            className="bg-white dark:bg-gray-900 rounded-xl p-3 flex items-center relative overflow-hidden"
            onClick={() => isEditing && toggleSelect(item.id)}
          >
            {/* Edit Checkbox */}
            {isEditing && (
              <div className="pr-3 shrink-0">
                {selectedIds.includes(item.id) ? (
                  <CheckCircle2 size={20} className="text-text-price fill-current text-white bg-brand-start rounded-full" />
                ) : (
                  <Circle size={20} className="text-gray-300 dark:text-gray-600" />
                )}
              </div>
            )}

            {/* Image */}
            <div className="w-28 h-28 bg-gray-50 dark:bg-gray-800 rounded-lg shrink-0 mr-3 overflow-hidden relative">
              <img src={item.image} alt={item.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>

            {/* Details */}
            <div className="flex-1 flex flex-col h-28 py-0.5 justify-between min-w-0">
              <div className="text-md text-gray-900 dark:text-gray-100 line-clamp-2 leading-snug font-medium">
                <span className="align-middle">{item.title}</span>
              </div>
              
              <div className="flex justify-between items-end mt-2">
                <div className="text-3xl font-bold text-text-price leading-none">
                  <span className="text-sm mr-0.5">¥</span>{item.price.split('.')[0]}
                  <span className="text-sm">.{item.price.split('.')[1]}</span>
                </div>
                
                {!isEditing && (
                  <button 
                    className="w-7 h-7 rounded-full bg-brand-start flex items-center justify-center text-white active:opacity-80 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      showToast({ message: '已加入购物车', type: 'success' });
                    }}
                  >
                    <ShoppingCart size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-bg-hover dark:bg-gray-950 relative h-full overflow-hidden">
      {/* Offline Banner */}
      {offline && (
        <div className="bg-[#ffe4e4] text-text-price text-sm py-2 px-4 flex items-center justify-center sticky top-0 z-50">
          <WifiOff size={14} className="mr-2" />
          网络连接已断开，请检查网络设置
        </div>
      )}

      

      {renderHeader()}
      
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto no-scrollbar relative">
        {renderContent()}
      </div>

      {/* Edit Bottom Bar */}
      {isEditing && !loading && !error && !empty && (
        <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 px-4 py-3 pb-safe flex justify-between items-center z-40">
          <div 
            className="flex items-center cursor-pointer active:opacity-70"
            onClick={toggleSelectAll}
          >
            {isAllSelected ? (
              <CheckCircle2 size={20} className="text-text-price fill-current text-white bg-brand-start rounded-full mr-2" />
            ) : (
              <Circle size={20} className="text-gray-300 dark:text-gray-600 mr-2" />
            )}
            <span className="text-md text-gray-900 dark:text-gray-100">全选</span>
          </div>
          <button 
            className={`h-[36px] px-6 rounded-full text-md font-medium transition-all flex items-center ${
              selectedIds.length > 0 
                ? 'bg-gradient-to-r from-brand-start to-brand-end text-white active:opacity-80' 
                : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            }`}
            disabled={selectedIds.length === 0}
            onClick={handleDelete}
          >
            取消收藏 {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}
          </button>
        </div>
      )}
    </div>
  );
};
