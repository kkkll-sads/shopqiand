import React, { useState, useEffect } from 'react';
import { ChevronLeft, WifiOff, AlertCircle, MapPin, Truck, ChevronRight, Copy, CheckCircle2, Package } from 'lucide-react';
import { useAppNavigate } from '../../lib/navigation';
import { PageHeader } from '../../components/layout/PageHeader';
import { ErrorState } from '../../components/ui/ErrorState';

export const OrderDetailPage = () => {
  const { goBackOr } = useAppNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [offline, setOffline] = useState(!navigator.onLine);
  const [empty, setEmpty] = useState(false); // Not really used for order detail unless not found

  const mockOrder = {
    id: '28394018239',
    status: 'shipped', // pending_payment, processing, shipped, completed, cancelled
    statusText: '卖家已发货',
    statusDesc: '您的订单已由京东物流揽收，正在运往目的地',
    createTime: '2023-10-25 10:00:00',
    payTime: '2023-10-25 10:05:00',
    shipTime: '2023-10-25 14:30:00',
    address: {
      name: '张三',
      phone: '138****1234',
      detail: '北京市朝阳区建国路88号SOHO现代城A座1001室'
    },
    logistics: {
      company: '京东物流',
      trackingNo: 'JDVA1234567890',
      latestStatus: '【北京市】您的快件已到达【北京朝阳营业部】，准备分配派件员',
      time: '2023-10-26 08:30:00'
    },
    products: [
      {
        id: 'p1',
        title: 'Apple iPhone 15 Pro (A3104) 256GB 蓝色钛金属 支持移动联通电信5G 双卡双待手机',
        image: 'https://picsum.photos/seed/iphone/200/200',
        price: '7999.00',
        quantity: 1,
        sku: '蓝色钛金属, 256GB',
        isSelfOperated: true
      }
    ],
    fees: {
      total: '7999.00',
      shipping: '0.00',
      discount: '-100.00',
      actualPay: '7899.00'
    }
  };

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

  const fetchData = () => {
    setLoading(true);
    setError(false);
    setTimeout(() => {
      setLoading(false);
    }, 300);
  };

  const handleBack = () => {
    goBackOr('order');
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('订单号已复制');
  };

  const renderHeader = () => (
    <div className="bg-white dark:bg-gray-900 z-40 relative shrink-0 border-b border-gray-100 dark:border-gray-800">
      <div className="h-11 flex items-center justify-between px-3">
        <div className="flex items-center w-1/3">
          <button onClick={handleBack} className="p-1 -ml-1 text-gray-900 dark:text-gray-100 active:opacity-70">
            <ChevronLeft size={24} />
          </button>
        </div>
        <h1 className="text-2xl font-medium text-gray-900 dark:text-gray-100 text-center w-1/3">订单详情</h1>
        <div className="w-1/3"></div>
      </div>
    </div>
  );

  const renderSkeleton = () => (
    <div className="p-3 space-y-3">
      <div className="bg-white dark:bg-gray-900 rounded-xl p-4 animate-pulse h-24"></div>
      <div className="bg-white dark:bg-gray-900 rounded-xl p-4 animate-pulse h-20"></div>
      <div className="bg-white dark:bg-gray-900 rounded-xl p-4 animate-pulse h-32"></div>
      <div className="bg-white dark:bg-gray-900 rounded-xl p-4 animate-pulse h-40"></div>
    </div>
  );

  const renderError = () => (
    <ErrorState onRetry={fetchData} />
  );

  const renderContent = () => {
    if (loading) return renderSkeleton();
    if (error) return renderError();

    return (
      <div className="p-3 space-y-3 pb-24">
        {/* Status Card */}
        <div className="bg-gradient-to-r from-brand-start to-brand-end rounded-xl p-4 text-white shadow-sm">
          <div className="flex items-center mb-2">
            <Package size={24} className="mr-2" />
            <h2 className="text-3xl font-bold">{mockOrder.statusText}</h2>
          </div>
          <p className="text-base opacity-90 mb-4">{mockOrder.statusDesc}</p>
          
          {/* Progress Bar (Simplified) */}
          <div className="flex items-center justify-between relative px-2">
            <div className="absolute top-1/2 left-4 right-4 h-[2px] bg-white dark:bg-gray-900/30 -translate-y-1/2 z-0"></div>
            <div className="absolute top-1/2 left-4 w-2/3 h-[2px] bg-white dark:bg-gray-900 -translate-y-1/2 z-0"></div>
            
            <div className="flex flex-col items-center z-10 relative">
              <div className="w-4 h-4 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center mb-1">
                <div className="w-2 h-2 rounded-full bg-brand-start"></div>
              </div>
              <span className="text-xs opacity-90">已下单</span>
            </div>
            <div className="flex flex-col items-center z-10 relative">
              <div className="w-4 h-4 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center mb-1">
                <div className="w-2 h-2 rounded-full bg-brand-start"></div>
              </div>
              <span className="text-xs opacity-90">已付款</span>
            </div>
            <div className="flex flex-col items-center z-10 relative">
              <div className="w-4 h-4 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center mb-1">
                <div className="w-2 h-2 rounded-full bg-brand-start"></div>
              </div>
              <span className="text-xs opacity-90">已发货</span>
            </div>
            <div className="flex flex-col items-center z-10 relative">
              <div className="w-4 h-4 rounded-full bg-white dark:bg-gray-900/30 flex items-center justify-center mb-1">
              </div>
              <span className="text-xs opacity-60">交易完成</span>
            </div>
          </div>
        </div>

        {/* Logistics Entry */}
        {mockOrder.logistics && (
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 flex items-center active:bg-gray-50 dark:bg-gray-800 cursor-pointer" onClick={() => alert('查看物流详情')}>
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mr-3 shrink-0">
              <Truck size={16} />
            </div>
            <div className="flex-1 min-w-0 pr-2">
              <p className="text-md text-text-main line-clamp-2 leading-snug mb-1">{mockOrder.logistics.latestStatus}</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">{mockOrder.logistics.time}</p>
            </div>
            <ChevronRight size={16} className="text-gray-400 dark:text-gray-500 shrink-0" />
          </div>
        )}

        {/* Address Card */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 flex items-start">
          <div className="w-8 h-8 rounded-full bg-red-50 text-text-price flex items-center justify-center mr-3 shrink-0 mt-0.5">
            <MapPin size={16} />
          </div>
          <div className="flex-1">
            <div className="flex items-center mb-1">
              <span className="text-lg font-bold text-text-main mr-2">{mockOrder.address.name}</span>
              <span className="text-md text-gray-500 dark:text-gray-400">{mockOrder.address.phone}</span>
            </div>
            <p className="text-base text-text-main leading-relaxed">{mockOrder.address.detail}</p>
          </div>
        </div>

        {/* Product List */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4">
          <div className="flex items-center mb-3 pb-3 border-b border-gray-50 dark:border-gray-800">
            <span className="text-md font-bold text-text-main">京东自营</span>
            <ChevronRight size={14} className="text-gray-400 dark:text-gray-500 ml-1" />
          </div>
          
          {mockOrder.products.map(product => (
            <div key={product.id} className="flex py-2">
              <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-lg shrink-0 mr-3 overflow-hidden">
                <img src={product.image} alt={product.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div className="flex-1 flex flex-col min-w-0">
                <div className="text-md text-text-main line-clamp-2 leading-snug mb-1">
                  {product.isSelfOperated && (
                    <span className="inline-block bg-brand-start text-white text-xs px-1 rounded-sm mr-1.5 align-middle leading-tight font-normal">自营</span>
                  )}
                  <span className="align-middle">{product.title}</span>
                </div>
                <div className="text-sm text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 px-1.5 py-0.5 rounded inline-block self-start mb-auto">
                  {product.sku}
                </div>
                <div className="flex justify-between items-center mt-2">
                  <div className="text-md font-bold text-text-main">¥{product.price}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">x{product.quantity}</div>
                </div>
              </div>
            </div>
          ))}
          
          <div className="mt-4 pt-3 border-t border-gray-50 dark:border-gray-800 flex justify-end space-x-2">
            <button className="px-4 py-1.5 rounded-full border border-gray-300 dark:border-gray-600 text-base text-text-main" onClick={() => alert('申请售后')}>
              申请售后
            </button>
            <button className="px-4 py-1.5 rounded-full border border-gray-300 dark:border-gray-600 text-base text-text-main" onClick={() => alert('加入购物车')}>
              再次购买
            </button>
          </div>
        </div>

        {/* Order Info & Fees */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4">
          <h3 className="text-md font-bold text-text-main mb-3">订单信息</h3>
          <div className="space-y-2 text-base">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">订单编号</span>
              <div className="flex items-center text-text-main">
                {mockOrder.id}
                <button onClick={() => handleCopy(mockOrder.id)} className="ml-2 text-gray-400 dark:text-gray-500 active:text-gray-600 dark:text-gray-400">
                  <Copy size={12} />
                </button>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">下单时间</span>
              <span className="text-text-main">{mockOrder.createTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">支付方式</span>
              <span className="text-text-main">在线支付</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-800 space-y-2 text-base">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">商品总额</span>
              <span className="text-text-main">¥{mockOrder.fees.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">运费</span>
              <span className="text-text-main">¥{mockOrder.fees.shipping}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">优惠金额</span>
              <span className="text-text-price">{mockOrder.fees.discount}</span>
            </div>
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-50 dark:border-gray-800">
              <span className="text-md font-bold text-text-main">实付款</span>
              <span className="text-xl font-bold text-text-price">¥{mockOrder.fees.actualPay}</span>
            </div>
          </div>
        </div>
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
      
      <div className="flex-1 overflow-y-auto no-scrollbar relative">
        {renderContent()}
      </div>

      {/* Bottom Action Bar */}
      {!loading && !error && (
        <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 px-4 py-3 pb-safe flex justify-end items-center space-x-3 z-40">
          <button className="px-5 py-1.5 rounded-full border border-gray-300 dark:border-gray-600 text-md text-text-main active:bg-gray-50 dark:bg-gray-800">
            取消订单
          </button>
          <button className="px-5 py-1.5 rounded-full border border-[#f2270c] text-md text-text-price active:bg-red-50">
            确认收货
          </button>
        </div>
      )}
    </div>
  );
};
