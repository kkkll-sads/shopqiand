import React, { useState, useEffect } from 'react';
import { ChevronLeft, CheckCircle2, Circle, Minus, Plus, Trash2, Heart, Store, ChevronRight, WifiOff, RefreshCcw, ShoppingCart, ChevronDown } from 'lucide-react';
import { Skeleton } from '../../components/ui/Skeleton';
import { useAppNavigate } from '../../lib/navigation';
import { PageHeader } from '../../components/layout/PageHeader';

interface CartItem {
  id: string;
  title: string;
  sku: string;
  price: number;
  quantity: number;
  image: string;
}

interface CartStore {
  storeId: string;
  storeName: string;
  isSelf: boolean;
  promotion?: { text: string; action: string };
  items: CartItem[];
}

export const CartPage = () => {
  const { goTo, goBack } = useAppNavigate();

  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [moduleError, setModuleError] = useState(false);
  const [emptyResult, setEmptyResult] = useState(false);

  const [cartData, setCartData] = useState<CartStore[]>([
    {
      storeId: 's1',
      storeName: '树交所自营',
      isSelf: true,
      promotion: { text: '满299减50', action: '去凑单' },
      items: [
        { id: 'p1', title: 'Apple iPhone 15 Pro (A3104) 256GB 蓝色钛金属 支持移动联通电信5G 双卡双待手机', sku: '蓝色钛金属, 256GB', price: 7999.00, quantity: 1, image: 'https://picsum.photos/seed/iphone/200/200' },
        { id: 'p2', title: '华为 HUAWEI Mate 60 Pro 12GB+512GB 雅川青 卫星通话 鸿蒙智能手机', sku: '雅川青, 12GB+512GB', price: 6999.00, quantity: 1, image: 'https://picsum.photos/seed/mate60/200/200' }
      ]
    },
    {
      storeId: 's2',
      storeName: '大疆官方旗舰店',
      isSelf: false,
      items: [
        { id: 'p3', title: '大疆 DJI Mini 4 Pro 迷你航拍机 航拍无人机 智能跟随 避障', sku: '标准版', price: 4788.00, quantity: 1, image: 'https://picsum.photos/seed/dji/200/200' }
      ]
    }
  ]);

  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set(['p1', 'p2', 'p3']));

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleBack = () => {
    goBack();
  };

  const goToStore = () => {
    goTo('store');
  };

  const toggleItemSelection = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const toggleStoreSelection = (storeId: string) => {
    const store = cartData.find(s => s.storeId === storeId);
    if (!store) return;
    
    const storeItemIds = store.items.map(item => item.id);
    const allSelected = storeItemIds.every(id => selectedItems.has(id));
    
    const newSelected = new Set(selectedItems);
    if (allSelected) {
      storeItemIds.forEach(id => newSelected.delete(id));
    } else {
      storeItemIds.forEach(id => newSelected.add(id));
    }
    setSelectedItems(newSelected);
  };

  const toggleAllSelection = () => {
    const allItemIds = cartData.flatMap(store => store.items.map(item => item.id));
    if (selectedItems.size === allItemIds.length && allItemIds.length > 0) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(allItemIds));
    }
  };

  const updateQuantity = (storeId: string, itemId: string, delta: number) => {
    setCartData(prev => prev.map(store => {
      if (store.storeId !== storeId) return store;
      return {
        ...store,
        items: store.items.map(item => {
          if (item.id !== itemId) return item;
          const newQuantity = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQuantity };
        })
      };
    }));
  };

  const handleDeleteSelected = () => {
    setCartData(prev => {
      const newData = prev.map(store => ({
        ...store,
        items: store.items.filter(item => !selectedItems.has(item.id))
      })).filter(store => store.items.length > 0);
      
      if (newData.length === 0) {
        setEmptyResult(true);
      }
      return newData;
    });
    setSelectedItems(new Set());
    setIsEditMode(false);
  };

  const allItemIds = cartData.flatMap(store => store.items.map(item => item.id));
  const isAllSelected = selectedItems.size === allItemIds.length && allItemIds.length > 0;

  const calculateTotal = () => {
    let total = 0;
    cartData.forEach(store => {
      store.items.forEach(item => {
        if (selectedItems.has(item.id)) {
          total += item.price * item.quantity;
        }
      });
    });
    return total;
  };

  const renderHeader = () => (
    <div className="bg-white dark:bg-gray-900 z-40 relative shrink-0 border-b border-border-light">
      {offline && (
        <div className="bg-red-50 text-primary-start px-4 py-2 flex items-center justify-between text-sm">
          <div className="flex items-center">
            <WifiOff size={14} className="mr-2" />
            <span>网络不稳定，请检查网络设置</span>
          </div>
          <button onClick={() => setOffline(false)} className="font-medium px-2 py-1 bg-white dark:bg-gray-900 rounded shadow-sm">刷新</button>
        </div>
      )}
      <div className="h-12 flex items-center justify-between px-3 pt-safe">
        <div className="flex items-center w-1/3">
          <button onClick={handleBack} className="p-1 -ml-1 text-text-main active:opacity-70">
            <ChevronLeft size={24} />
          </button>
        </div>
        <h1 className="text-xl font-bold text-text-main text-center w-1/3">购物车</h1>
        <div className="flex items-center justify-end w-1/3">
          {!emptyResult && !moduleError && (
            <button 
              onClick={() => setIsEditMode(!isEditMode)}
              className="text-md text-text-main active:opacity-70 px-2"
            >
              {isEditMode ? '完成' : '编辑'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
  const renderSkeleton = () => (
    <div className="p-3">
      {[1, 2].map(i => (
        <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl p-3 mb-3 shadow-sm">
          <div className="flex items-center mb-3">
            <Skeleton className="w-5 h-5 rounded-full mr-2" />
            <Skeleton className="w-24 h-5 rounded" />
          </div>
          <div className="flex">
            <Skeleton className="w-5 h-5 rounded-full mr-2 mt-8 shrink-0" />
            <Skeleton className="w-[100px] h-[100px] rounded-lg mr-3 shrink-0" />
            <div className="flex-1 flex flex-col justify-between py-1">
              <div>
                <Skeleton className="w-full h-4 mb-1" />
                <Skeleton className="w-3/4 h-4 mb-2" />
                <Skeleton className="w-1/2 h-4 rounded-full" />
              </div>
              <div className="flex justify-between items-end">
                <Skeleton className="w-1/3 h-5" />
                <Skeleton className="w-20 h-6 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

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

    if (emptyResult || cartData.length === 0) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="w-24 h-24 bg-bg-card rounded-full flex items-center justify-center mb-4">
            <ShoppingCart size={40} className="text-text-aux opacity-50" />
          </div>
          <p className="text-lg font-medium text-text-main mb-1">购物车空空的</p>
          <p className="text-base text-text-sub mb-6">去看看心仪的商品吧~</p>
          <button 
            onClick={goToStore}
            className="px-8 py-2 bg-gradient-to-r from-primary-start to-primary-end rounded-full text-md font-medium text-white shadow-sm active:opacity-80"
          >
            去逛逛
          </button>
        </div>
      );
    }

    if (loading) {
      return renderSkeleton();
    }

    return (
      <div className="p-3 pb-32">
        {cartData.map(store => {
          const storeItemIds = store.items.map(item => item.id);
          const isStoreSelected = storeItemIds.length > 0 && storeItemIds.every(id => selectedItems.has(id));

          return (
            <div key={store.storeId} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm mb-3 overflow-hidden">
              {/* Store Header */}
              <div className="flex items-center px-3 py-3 border-b border-border-light/50">
                <button 
                  onClick={() => toggleStoreSelection(store.storeId)}
                  className="mr-2 active:scale-95 transition-transform"
                >
                  {isStoreSelected ? (
                    <CheckCircle2 size={20} className="text-primary-start fill-primary-start/10" />
                  ) : (
                    <Circle size={20} className="text-text-aux" />
                  )}
                </button>
                <Store size={16} className="text-text-main mr-1.5" />
                <span className="text-md font-bold text-text-main mr-1">{store.storeName}</span>
                <ChevronRight size={14} className="text-text-aux" />
              </div>

              {/* Promotion Banner */}
              {store.promotion && (
                <div className="flex items-center justify-between px-3 py-2 bg-red-50/50">
                  <div className="flex items-center">
                    <span className="bg-primary-start text-white text-xs px-1 rounded-sm mr-2">满减</span>
                    <span className="text-sm text-text-main">{store.promotion.text}</span>
                  </div>
                  <button className="text-sm text-primary-start flex items-center active:opacity-70">
                    {store.promotion.action} <ChevronRight size={12} />
                  </button>
                </div>
              )}

              {/* Product Items */}
              <div className="px-3">
                {store.items.map((item, index) => {
                  const isSelected = selectedItems.has(item.id);
                  return (
                    <div key={item.id} className={`flex py-4 ${index !== store.items.length - 1 ? 'border-b border-border-light/50' : ''}`}>
                      <div className="flex items-center mr-2 shrink-0">
                        <button 
                          onClick={() => toggleItemSelection(item.id)}
                          className="active:scale-95 transition-transform"
                        >
                          {isSelected ? (
                            <CheckCircle2 size={20} className="text-primary-start fill-primary-start/10" />
                          ) : (
                            <Circle size={20} className="text-text-aux" />
                          )}
                        </button>
                      </div>
                      
                      <img src={item.image} alt={item.title} className="w-[90px] h-[90px] rounded-lg object-cover shrink-0 mr-3 border border-border-light/50" referrerPolicy="no-referrer" />
                      
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div>
                          <h3 className="text-base text-text-main font-medium line-clamp-2 leading-snug mb-1">
                            {store.isSelf && <span className="inline-block bg-primary-start text-white text-xs px-1 rounded-sm mr-1 leading-tight align-middle">自营</span>}
                            <span className="align-middle">{item.title}</span>
                          </h3>
                          <div className="inline-flex items-center bg-bg-base px-2 py-0.5 rounded mb-2 max-w-full">
                            <span className="text-s text-text-sub truncate">{item.sku}</span>
                            <ChevronDown size={10} className="text-text-aux ml-1 shrink-0" />
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="text-primary-start font-bold leading-none">
                            <span className="text-s">¥</span>
                            <span className="text-xl">{item.price.toFixed(2).split('.')[0]}</span>
                            <span className="text-s">.{item.price.toFixed(2).split('.')[1]}</span>
                          </div>
                          
                          {isEditMode ? (
                            <div className="flex items-center space-x-3">
                              <button className="text-sm text-text-main flex flex-col items-center active:opacity-70">
                                <Heart size={16} className="mb-0.5" />
                                移入收藏
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center border border-border-light rounded overflow-hidden h-6">
                              <button 
                                className="w-6 h-full flex items-center justify-center bg-bg-base text-text-main active:bg-border-light disabled:opacity-30"
                                onClick={() => updateQuantity(store.storeId, item.id, -1)}
                                disabled={item.quantity <= 1}
                              >
                                <Minus size={12} />
                              </button>
                              <div className="w-8 h-full flex items-center justify-center text-sm font-medium border-x border-border-light bg-bg-base">
                                {item.quantity}
                              </div>
                              <button 
                                className="w-6 h-full flex items-center justify-center bg-bg-base text-text-main active:bg-border-light"
                                onClick={() => updateQuantity(store.storeId, item.id, 1)}
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderBottomBar = () => {
    if (emptyResult || cartData.length === 0 || moduleError) return null;

    return (
      <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-border-light px-3 h-14 flex items-center justify-between z-40 pb-safe">
        <div className="flex items-center h-full">
          <button 
            onClick={toggleAllSelection}
            className="flex items-center mr-4 active:opacity-70"
          >
            {isAllSelected ? (
              <CheckCircle2 size={20} className="text-primary-start fill-primary-start/10 mr-1.5" />
            ) : (
              <Circle size={20} className="text-text-aux mr-1.5" />
            )}
            <span className="text-base text-text-main">全选</span>
          </button>
        </div>

        {isEditMode ? (
          <div className="flex items-center space-x-2">
            <button className="px-4 h-8 rounded-full border border-border-light text-base text-text-main font-medium active:bg-bg-base">
              移入收藏
            </button>
            <button 
              onClick={handleDeleteSelected}
              disabled={selectedItems.size === 0}
              className="px-4 h-8 rounded-full border border-primary-start text-primary-start text-base font-medium active:bg-red-50 disabled:opacity-50 disabled:border-border-light disabled:text-text-aux"
            >
              删除
            </button>
          </div>
        ) : (
          <div className="flex items-center">
            <div className="flex flex-col items-end mr-3">
              <div className="flex items-baseline">
                <span className="text-sm text-text-main mr-1">合计:</span>
                <span className="text-primary-start font-bold">
                  <span className="text-sm">¥</span>
                  <span className="text-3xl">{calculateTotal().toFixed(2).split('.')[0]}</span>
                  <span className="text-sm">.{calculateTotal().toFixed(2).split('.')[1]}</span>
                </span>
              </div>
              <span className="text-xs text-text-aux">已优惠 ¥50.00</span>
            </div>
            <button 
              disabled={selectedItems.size === 0}
              onClick={() => goTo('checkout')}
              className="h-10 px-6 rounded-full bg-gradient-to-r from-primary-start to-primary-end text-white text-md font-medium shadow-sm active:opacity-80 disabled:opacity-50 disabled:from-text-aux disabled:to-text-sub"
            >
              去结算({selectedItems.size})
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-bg-base relative h-full overflow-hidden">
      

      {renderHeader()}
      
      <div className="flex-1 overflow-y-auto no-scrollbar relative">
        {renderContent()}
      </div>

      {renderBottomBar()}
    </div>
  );
};
