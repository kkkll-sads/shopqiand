import React, { useState, useEffect } from 'react';
import { ChevronLeft, MapPin, ChevronRight, Store, Plus, WifiOff, RefreshCcw, CheckCircle2, Circle } from 'lucide-react';
import { Skeleton } from '../../components/ui/Skeleton';
import { useAppNavigate } from '../../lib/navigation';
import { PageHeader } from '../../components/layout/PageHeader';

export const CheckoutPage = () => {
  const { goTo, goBack } = useAppNavigate();

  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [moduleError, setModuleError] = useState(false);
  const [noAddress, setNoAddress] = useState(false);
  const [usePoints, setUsePoints] = useState(false);

  const mockAddress = {
    name: '张三',
    phone: '138****1234',
    address: '广东省深圳市南山区科技园高新南九道 树交所大厦 10层',
    isDefault: true
  };

  const mockProducts = [
    { 
      id: 'p1', 
      title: 'Apple iPhone 15 Pro (A3104) 256GB 蓝色钛金属 支持移动联通电信5G 双卡双待手机', 
      sku: '蓝色钛金属, 256GB', 
      price: 7999.00, 
      quantity: 1, 
      image: 'https://picsum.photos/seed/iphone/200/200' 
    }
  ];

  const productTotal = mockProducts.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = 0;
  const discount = 50;
  const pointsDeduction = usePoints ? 10 : 0;
  const finalTotal = productTotal + shippingFee - discount - pointsDeduction;

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleBack = () => {
    goBack();
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
        <h1 className="text-xl font-bold text-text-main text-center w-1/3">确认订单</h1>
        <div className="w-1/3"></div>
      </div>
    </div>
  );

  const renderSkeleton = () => (
    <div className="p-3">
      {/* Address Skeleton */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 mb-3 shadow-sm">
        <div className="flex items-center mb-2">
          <Skeleton className="w-16 h-5 mr-2" />
          <Skeleton className="w-24 h-5" />
        </div>
        <Skeleton className="w-full h-4 mb-1" />
        <Skeleton className="w-2/3 h-4" />
      </div>
      
      {/* Product Skeleton */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 mb-3 shadow-sm">
        <div className="flex items-center mb-4">
          <Skeleton className="w-5 h-5 rounded-full mr-2" />
          <Skeleton className="w-24 h-5 rounded" />
        </div>
        <div className="flex">
          <Skeleton className="w-[80px] h-[80px] rounded-lg mr-3 shrink-0" />
          <div className="flex-1">
            <Skeleton className="w-full h-4 mb-1" />
            <Skeleton className="w-3/4 h-4 mb-2" />
            <div className="flex justify-between mt-4">
              <Skeleton className="w-16 h-5" />
              <Skeleton className="w-8 h-5" />
            </div>
          </div>
        </div>
      </div>
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

    if (loading) {
      return renderSkeleton();
    }

    return (
      <div className="p-3 pb-24">
        {/* Address Card */}
        <div 
          className="bg-white dark:bg-gray-900 rounded-2xl p-4 mb-3 shadow-sm active:bg-bg-base transition-colors relative overflow-hidden cursor-pointer"
          onClick={() => goTo('address')}
        >
          {/* Decorative border bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0Ij48cGF0aCBkPSJNMCAwaDIwbDIwIDRIMHoiIGZpbGw9IiNGRjRkNGQiIG9wYWNpdHk9IjAuOCIvPjxwYXRoIGQ9Ik0yMCAwaDIwbDIwIDRIMjB6IiBmaWxsPSIjNGQ4OGZmIiBvcGFjaXR5PSIwLjgiLz48L3N2Zz4=')] bg-repeat-x opacity-50"></div>
          
          <div className="flex items-center justify-between">
            {noAddress ? (
              <div className="flex items-center py-2">
                <div className="w-8 h-8 rounded-full bg-primary-start/10 flex items-center justify-center mr-3">
                  <Plus size={16} className="text-primary-start" />
                </div>
                <span className="text-lg font-medium text-text-main">新增收货地址</span>
              </div>
            ) : (
              <div className="flex-1 pr-4">
                <div className="flex items-center mb-1.5">
                  <span className="text-xl font-bold text-text-main mr-2">{mockAddress.name}</span>
                  <span className="text-md text-text-main font-medium">{mockAddress.phone}</span>
                  {mockAddress.isDefault && (
                    <span className="ml-2 px-1.5 py-0.5 bg-primary-start text-white text-xs rounded leading-none">默认</span>
                  )}
                </div>
                <div className="flex items-start">
                  <MapPin size={14} className="text-primary-start mt-0.5 mr-1 shrink-0" />
                  <span className="text-base text-text-sub leading-snug line-clamp-2">{mockAddress.address}</span>
                </div>
              </div>
            )}
            <ChevronRight size={16} className="text-text-aux shrink-0" />
          </div>
        </div>

        {/* Product List Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm mb-3 overflow-hidden">
          <div className="flex items-center px-4 py-3 border-b border-border-light/50">
            <Store size={16} className="text-text-main mr-1.5" />
            <span className="text-md font-bold text-text-main">树交所自营</span>
          </div>
          
          <div className="p-4">
            {mockProducts.map(item => (
              <div key={item.id} className="flex mb-4 last:mb-0">
                <img src={item.image} alt={item.title} className="w-[80px] h-[80px] rounded-lg object-cover shrink-0 mr-3 border border-border-light/50" referrerPolicy="no-referrer" />
                <div className="flex-1 flex flex-col min-w-0">
                  <h3 className="text-base text-text-main font-medium line-clamp-2 leading-snug mb-1">
                    {item.title}
                  </h3>
                  <div className="text-s text-text-sub bg-bg-base px-1.5 py-0.5 rounded self-start mb-2 truncate max-w-full">
                    {item.sku}
                  </div>
                  <div className="flex items-center justify-between mt-auto">
                    <div className="text-primary-start font-bold leading-none">
                      <span className="text-s">¥</span>
                      <span className="text-xl">{item.price.toFixed(2).split('.')[0]}</span>
                      <span className="text-s">.{item.price.toFixed(2).split('.')[1]}</span>
                    </div>
                    <span className="text-sm text-text-main font-medium">x{item.quantity}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Delivery & Service */}
          <div className="px-4 py-3 bg-bg-base/50 border-t border-border-light/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-base text-text-main font-medium">配送服务</span>
              <div className="flex items-center text-base text-text-main">
                <span>树交所快递</span>
                <ChevronRight size={14} className="text-text-aux ml-1" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-sub">预计明天(03月01日)送达</span>
              <span className="text-sm text-text-sub">免运费</span>
            </div>
          </div>
        </div>

        {/* Discount Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm mb-3 px-4 py-1">
          <div className="flex items-center justify-between py-3 border-b border-border-light/50">
            <span className="text-md text-text-main">优惠券</span>
            <div className="flex items-center">
              <span className="text-base text-primary-start font-medium">-¥50.00</span>
              <ChevronRight size={14} className="text-text-aux ml-1" />
            </div>
          </div>
          <div className="flex items-center justify-between py-3">
            <div className="flex flex-col">
              <span className="text-md text-text-main">京豆/余额</span>
              <span className="text-s text-text-sub mt-0.5">可用1000京豆抵扣¥10.00</span>
            </div>
            <button 
              onClick={() => setUsePoints(!usePoints)}
              className={`w-10 h-6 rounded-full flex items-center transition-colors px-0.5 ${usePoints ? 'bg-primary-start' : 'bg-border-light'}`}
            >
              <div className={`w-5 h-5 bg-white dark:bg-gray-900 rounded-full shadow-sm transition-transform ${usePoints ? 'translate-x-4' : 'translate-x-0'}`}></div>
            </button>
          </div>
        </div>

        {/* Invoice & Message Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm mb-3 px-4 py-1">
          <div className="flex items-center justify-between py-3 border-b border-border-light/50">
            <span className="text-md text-text-main">发票</span>
            <div className="flex items-center">
              <span className="text-base text-text-sub">电子普通发票-个人</span>
              <ChevronRight size={14} className="text-text-aux ml-1" />
            </div>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-md text-text-main shrink-0 mr-4">订单备注</span>
            <input 
              type="text" 
              placeholder="选填，建议留言前先与商家沟通确认" 
              className="flex-1 text-right text-base text-text-main outline-none placeholder:text-text-aux"
            />
          </div>
        </div>

        {/* Amount Summary Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm mb-3 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-base text-text-sub">商品总价</span>
            <span className="text-base text-text-main">¥{productTotal.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-base text-text-sub">运费</span>
            <span className="text-base text-text-main">+ ¥{shippingFee.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-base text-text-sub">优惠</span>
            <span className="text-base text-primary-start">- ¥{discount.toFixed(2)}</span>
          </div>
          {usePoints && (
            <div className="flex items-center justify-between mb-2">
              <span className="text-base text-text-sub">京豆抵扣</span>
              <span className="text-base text-primary-start">- ¥{pointsDeduction.toFixed(2)}</span>
            </div>
          )}
          <div className="flex items-center justify-end pt-3 mt-1 border-t border-border-light/50">
            <span className="text-md text-text-main font-bold mr-2">应付金额:</span>
            <span className="text-primary-start font-bold">
              <span className="text-sm">¥</span>
              <span className="text-3xl">{finalTotal.toFixed(2).split('.')[0]}</span>
              <span className="text-sm">.{finalTotal.toFixed(2).split('.')[1]}</span>
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-bg-base relative h-full overflow-hidden">
      

      {renderHeader()}
      
      <div className="flex-1 overflow-y-auto no-scrollbar relative">
        {renderContent()}
      </div>

      {/* Bottom Fixed Bar */}
      {!moduleError && (
        <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-border-light px-4 h-14 flex items-center justify-between z-40 pb-safe">
          <div className="flex items-baseline">
            <span className="text-base text-text-main font-bold mr-1">应付:</span>
            <span className="text-primary-start font-bold">
              <span className="text-md">¥</span>
              <span className="text-4xl">{finalTotal.toFixed(2).split('.')[0]}</span>
              <span className="text-md">.{finalTotal.toFixed(2).split('.')[1]}</span>
            </span>
          </div>
          <button 
            onClick={() => goTo('cashier')}
            className="h-10 px-8 rounded-full bg-gradient-to-r from-primary-start to-primary-end text-white text-md font-medium shadow-sm active:opacity-80"
          >
            提交订单
          </button>
        </div>
      )}
    </div>
  );
};
