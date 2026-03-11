/**
 * @file Logistics/index.tsx - 物流详情页面
 * @description 展示订单物流信息，包括物流轨迹、快递公司、运单号等。
 */

import React, { useState, useEffect } from 'react'; // React 核心 Hook
import { ChevronLeft, WifiOff, RefreshCcw, Copy, Package, MapPin, Phone, HeadphonesIcon, CheckCircle2, Truck } from 'lucide-react';
import { Skeleton } from '../../components/ui/Skeleton';
import { useAppNavigate } from '../../lib/navigation';
import { PageHeader } from '../../components/layout/PageHeader';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { copyToClipboard } from '../../lib/clipboard';
import { PullToRefreshContainer } from '../../components/ui/PullToRefreshContainer';

export const LogisticsPage = () => {
  const { goTo, goBack } = useAppNavigate();
  const { showToast } = useFeedback();

  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [moduleError, setModuleError] = useState(false);
  const [isEmpty, setIsEmpty] = useState(false);

  const logisticsInfo = {
    status: '已签收', // 运输中, 已签收
    company: '树交所物流',
    waybillNo: 'SJS1234567890123',
    phone: '950618'
  };

  const addressInfo = {
    name: '张三',
    phone: '138****1234',
    address: '广东省深圳市南山区科技园高新南九道 树交所大厦 10层'
  };

  const timelineData = [
    { id: 1, time: '2026-02-28 14:30:00', desc: '您的订单已由本人签收。感谢您在树交所购物，欢迎再次光临。', isLatest: true },
    { id: 2, time: '2026-02-28 09:15:00', desc: '【深圳市】南山科技园营业部派件员 正在为您派件，联系电话：13800138000。', isLatest: false },
    { id: 3, time: '2026-02-28 07:30:00', desc: '快件已到达【深圳市】南山科技园营业部。', isLatest: false },
    { id: 4, time: '2026-02-27 22:10:00', desc: '快件已发往【深圳市】南山科技园营业部。', isLatest: false },
    { id: 5, time: '2026-02-27 18:00:00', desc: '【广州市】广州转运中心已发出。', isLatest: false },
    { id: 6, time: '2026-02-27 14:20:00', desc: '包裹已由商家打包完成，等待快递揽收。', isLatest: false },
    { id: 7, time: '2026-02-27 10:00:00', desc: '您的订单已提交，等待系统确认。', isLatest: false }
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const handleBack = () => {
    goBack();
  };

  const handleRefresh = async () => {
    setModuleError(false);
    setLoading(true);
    await new Promise((resolve) => {
      window.setTimeout(() => {
        setLoading(false);
        resolve(undefined);
      }, 300);
    });
  };

  const handleCopy = async (text: string) => {
    const ok = await copyToClipboard(text);
    showToast({ message: ok ? '运单号已复制' : '复制失败，请稍后重试', type: ok ? 'success' : 'error' });
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
        <h1 className="text-xl font-bold text-text-main text-center w-1/3">物流详情</h1>
        <div className="w-1/3"></div>
      </div>
    </div>
  );

  const renderSkeleton = () => (
    <div className="p-3">
      {/* Info Card Skeleton */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 mb-3 shadow-sm">
        <div className="flex items-center mb-3">
          <Skeleton className="w-10 h-10 rounded-full mr-3" />
          <div>
            <Skeleton className="w-20 h-5 mb-1" />
            <Skeleton className="w-32 h-4" />
          </div>
        </div>
      </div>
      
      {/* Address Skeleton */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 mb-3 shadow-sm flex items-center">
        <Skeleton className="w-6 h-6 rounded-full mr-3 shrink-0" />
        <div className="flex-1">
          <Skeleton className="w-3/4 h-4 mb-1" />
          <Skeleton className="w-1/2 h-4" />
        </div>
      </div>

      {/* Timeline Skeleton */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 mb-3 shadow-sm">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex mb-6 last:mb-0">
            <div className="w-6 flex flex-col items-center mr-3">
              <Skeleton className="w-3 h-3 rounded-full mb-2" />
              <Skeleton className="w-0.5 h-12" />
            </div>
            <div className="flex-1">
              <Skeleton className="w-full h-4 mb-1" />
              <Skeleton className="w-2/3 h-4 mb-2" />
              <Skeleton className="w-24 h-3" />
            </div>
          </div>
        ))}
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

    if (isEmpty) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <Package size={48} className="text-border-light mb-4" />
          <p className="text-lg text-text-main font-medium mb-1">暂无物流信息</p>
          <p className="text-base text-text-sub">商家正快马加鞭为您准备商品，请耐心等待</p>
        </div>
      );
    }

    if (loading) {
      return renderSkeleton();
    }

    return (
      <div className="p-3 pb-24">
        {/* Top Info Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm mb-3 p-4 flex items-center">
          <div className="w-10 h-10 rounded-full bg-primary-start/10 flex items-center justify-center mr-3 shrink-0">
            {logisticsInfo.status === '已签收' ? (
              <CheckCircle2 size={20} className="text-primary-start" />
            ) : (
              <Truck size={20} className="text-primary-start" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center mb-1">
              <span className="text-xl font-bold text-text-main mr-2">{logisticsInfo.status}</span>
              <span className="text-base text-text-sub">{logisticsInfo.company}</span>
            </div>
            <div className="flex items-center text-sm text-text-sub">
              <span className="mr-2">运单号：{logisticsInfo.waybillNo}</span>
              <button onClick={() => handleCopy(logisticsInfo.waybillNo)} className="active:opacity-70 flex items-center text-text-main">
                <Copy size={12} className="mr-1" />
                复制
              </button>
            </div>
          </div>
        </div>

        {/* Address Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm mb-3 p-4 flex items-start">
          <MapPin size={16} className="text-text-main mt-0.5 mr-2 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-base text-text-main leading-snug mb-1">
              [收货地址] {addressInfo.address}
            </div>
            <div className="text-sm text-text-sub">
              {addressInfo.name} {addressInfo.phone}
            </div>
          </div>
        </div>

        {/* Timeline Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm mb-3 p-4">
          {timelineData.map((item, index) => {
            const isLast = index === timelineData.length - 1;
            return (
              <div key={item.id} className="flex relative">
                {/* Timeline Line & Dot */}
                <div className="w-8 flex flex-col items-center shrink-0 relative">
                  <div className={`w-3 h-3 rounded-full z-10 mt-1 ${item.isLatest ? 'bg-primary-start shadow-[0_0_0_4px_rgba(255,77,77,0.15)]' : 'bg-border-light'}`}></div>
                  {!isLast && (
                    <div className="absolute top-4 bottom-[-16px] w-[1px] bg-border-light left-1/2 -translate-x-1/2"></div>
                  )}
                </div>
                
                {/* Timeline Content */}
                <div className={`flex-1 pb-6 ${item.isLatest ? '' : 'opacity-70'}`}>
                  <div className={`text-md leading-snug mb-1 ${item.isLatest ? 'text-text-main font-medium' : 'text-text-sub'}`}>
                    {item.desc}
                  </div>
                  <div className={`text-sm ${item.isLatest ? 'text-text-main' : 'text-text-aux'}`}>
                    {item.time}
                  </div>
                </div>
              </div>
            );
          })}
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
      {!moduleError && !loading && !isEmpty && (
        <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-border-light px-4 py-2 z-40 pb-safe flex space-x-3">
          <button className="flex-1 h-10 rounded-full border border-border-light text-md font-medium text-text-main active:bg-bg-base flex items-center justify-center">
            <HeadphonesIcon size={16} className="mr-1.5 text-text-sub" />
            联系客服
          </button>
          <button className="flex-1 h-10 rounded-full border border-border-light text-md font-medium text-text-main active:bg-bg-base flex items-center justify-center">
            <Phone size={16} className="mr-1.5 text-text-sub" />
            联系快递
          </button>
        </div>
      )}
    </div>
  );
};

