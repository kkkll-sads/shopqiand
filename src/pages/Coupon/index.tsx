/**
 * @file Coupon/index.tsx - 优惠券页面
 * @description 展示可领取/已领取/已过期的优惠券列表，支持领取、使用、查看详情。
 */

import React, { useEffect, useRef, useState } from 'react'; // React 核心 Hook
import { ChevronLeft, WifiOff, AlertCircle, Info, X, Ticket } from 'lucide-react';
import { useAppNavigate } from '../../lib/navigation';
import { PageHeader } from '../../components/layout/PageHeader';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { PullToRefreshContainer } from '../../components/ui/PullToRefreshContainer';
import { useRouteScrollRestoration } from '../../hooks/useRouteScrollRestoration';
import { useSessionState } from '../../hooks/useSessionState';

/** 优惠券数据结构 */
interface Coupon {
  id: string;
  type: 'discount' | 'amount';
  value: number;
  threshold: number;
  title: string;
  scope: string;
  validUntil: string;
  status: 'available' | 'received' | 'expired';
  unusableReason?: string;
  rules: string[];
}

const MOCK_COUPONS: Coupon[] = [
  {
    id: '1',
    type: 'amount',
    value: 50,
    threshold: 399,
    title: '全品类通用满减券',
    scope: '仅限自营商品使用',
    validUntil: '2026.03.15 23:59',
    status: 'available',
    rules: ['1. 本券仅限购买京东自营实物商品使用。', '2. 不可与其他优惠叠加使用。', '3. 运费不计入满减金额。']
  },
  {
    id: '2',
    type: 'discount',
    value: 8.8,
    threshold: 100,
    title: '数码家电专享折扣券',
    scope: '限部分数码家电商品',
    validUntil: '2026.03.10 23:59',
    status: 'available',
    rules: ['1. 最高抵扣100元。', '2. 仅限指定数码家电商品可用。']
  },
  {
    id: '3',
    type: 'amount',
    value: 100,
    threshold: 999,
    title: '手机通讯满减券',
    scope: '限手机通讯类目',
    validUntil: '2026.03.01 23:59',
    status: 'received',
    rules: ['1. 仅限手机类目商品使用。', '2. 苹果品牌商品不可用。']
  },
  {
    id: '4',
    type: 'amount',
    value: 20,
    threshold: 99,
    title: '生鲜水果通用券',
    scope: '限生鲜水果类目',
    validUntil: '2026.02.20 23:59',
    status: 'expired',
    rules: ['1. 仅限生鲜水果类目商品使用。']
  }
];

/**
 * CouponPage - 优惠券页面
 * 功能：Tab 切换（可领取/已领取/已过期） → 券列表 → 点击查看详情弹窗
 */
export const CouponPage = () => {
  const { goTo, goBack } = useAppNavigate();

  const [activeTab, setActiveTab] = useSessionState<'available' | 'received' | 'expired'>(
    'coupon:tab',
    'available',
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [offline, setOffline] = useState(false);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  useRouteScrollRestoration({
    containerRef: scrollContainerRef,
    enabled: !selectedCoupon,
    namespace: `coupon:${activeTab}`,
    restoreDeps: [activeTab, coupons.length, error, loading],
    restoreWhen: !loading && !error && !selectedCoupon,
  });

  const fetchData = () => {
    setLoading(true);
    setError(false);
    
    // Simulate network request
    setTimeout(() => {
      {
        setCoupons(MOCK_COUPONS.filter(c => c.status === activeTab));
      }
      setLoading(false);
    }, 300);
  };

  const handleBack = () => {
    goBack();
  };

  const renderHeader = () => (
    <div className="bg-white dark:bg-gray-900 z-40 relative shrink-0">
      {offline && (
        <div className="bg-red-50 text-primary-start px-4 py-2 flex items-center justify-between text-sm dark:bg-red-900/30 dark:text-red-300">
          <div className="flex items-center">
            <WifiOff size={14} className="mr-2" />
            <span>网络不稳定，请检查网络设置</span>
          </div>
          <button onClick={() => setOffline(false)} className="rounded px-2 py-1 font-medium shadow-sm bg-white dark:bg-gray-800 dark:text-gray-100">刷新</button>
        </div>
      )}
      <div className="h-12 flex items-center justify-between px-3 pt-safe">
        <div className="flex items-center w-1/3">
          <button onClick={handleBack} className="p-1 -ml-1 text-text-main active:opacity-70">
            <ChevronLeft size={24} />
          </button>
        </div>
        <h1 className="text-2xl font-bold text-text-main text-center w-1/3">优惠券</h1>
        <div className="w-1/3"></div>
      </div>
      
      {/* Tabs */}
      <div className="flex px-4 h-11 relative border-b border-border-light">
        {[
          { id: 'available', label: '可领取' },
          { id: 'received', label: '已领取' },
          { id: 'expired', label: '已过期' }
        ].map((tab) => (
          <button
            key={tab.id}
            className={`flex-1 flex justify-center items-center text-md font-medium transition-colors relative ${
              activeTab === tab.id ? 'text-primary-start' : 'text-text-sub'
            }`}
            onClick={() => setActiveTab(tab.id as any)}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary-start rounded-full"></div>
            )}
          </button>
        ))}
      </div>
    </div>
  );

  const renderSkeleton = () => (
    <div className="p-4 space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white dark:bg-gray-900 rounded-xl h-[100px] flex overflow-hidden shadow-sm animate-pulse">
          <div className="w-[104px] bg-gray-100 dark:bg-gray-800"></div>
          <div className="w-0 border-l border-dashed border-border-light relative">
            <div className="absolute top-[-6px] left-[-6px] w-3 h-3 rounded-full bg-bg-base"></div>
            <div className="absolute bottom-[-6px] left-[-6px] w-3 h-3 rounded-full bg-bg-base"></div>
          </div>
          <div className="flex-1 p-3 flex flex-col justify-between">
            <div>
              <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2"></div>
            </div>
            <div className="flex justify-between items-end">
              <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/3"></div>
              <div className="h-6 bg-gray-100 dark:bg-gray-800 rounded-full w-[64px]"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderEmpty = () => (
    <EmptyState message="暂无相关优惠券"
      actionText="去商城逛逛"
      onAction={() => goTo('home')} />
  );

  const renderError = () => (
    <ErrorState onRetry={fetchData} />
  );

  const renderContent = () => {
    if (loading) return renderSkeleton();
    if (error) return renderError();
    if (coupons.length === 0) return renderEmpty();

    return (
      <div className="p-4 space-y-3 pb-safe">
        {coupons.map((coupon) => (
          <div key={coupon.id} className="bg-white dark:bg-gray-900 rounded-xl flex relative overflow-hidden shadow-sm">
            {/* Left: Amount */}
            <div className={`w-[104px] flex flex-col items-center justify-center p-3 shrink-0 ${
              coupon.status === 'expired' ? 'bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500' : 'bg-red-50 text-primary-start dark:bg-red-500/12 dark:text-red-300'
            }`}>
              <div className="flex items-baseline">
                {coupon.type === 'discount' ? (
                  <>
                    <span className="text-7xl font-bold leading-none tracking-tighter">{coupon.value}</span>
                    <span className="text-md font-bold ml-0.5">折</span>
                  </>
                ) : (
                  <>
                    <span className="text-md font-bold mr-0.5">¥</span>
                    <span className="text-7xl font-bold leading-none tracking-tighter">{coupon.value}</span>
                  </>
                )}
              </div>
              <div className="text-s mt-1 font-medium">满{coupon.threshold}可用</div>
            </div>
            
            {/* Dashed separator */}
            <div className="w-0 border-l border-dashed border-border-light relative shrink-0">
              <div className="absolute top-[-6px] left-[-6px] w-3 h-3 rounded-full bg-bg-base"></div>
              <div className="absolute bottom-[-6px] left-[-6px] w-3 h-3 rounded-full bg-bg-base"></div>
            </div>

            {/* Right: Info & Action */}
            <div className="flex-1 p-3 flex flex-col justify-between bg-white dark:bg-gray-900 min-w-0">
              <div>
                <div className="flex items-start mb-1">
                  <span className={`text-xs px-1 rounded mr-1.5 mt-0.5 shrink-0 ${
                    coupon.status === 'expired' ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400' : 'bg-primary-start text-white dark:bg-red-500/85'
                  }`}>
                    {coupon.type === 'discount' ? '折扣' : '满减'}
                  </span>
                  <span className={`text-md font-bold leading-tight line-clamp-2 ${
                    coupon.status === 'expired' ? 'text-text-aux' : 'text-text-main'
                  }`}>
                    {coupon.title}
                  </span>
                </div>
                <div className="text-s text-text-sub mt-1 truncate">{coupon.scope}</div>
              </div>
              
              <div className="flex items-end justify-between mt-2">
                <div 
                  className="flex items-center text-xs text-text-aux active:opacity-70 py-1 pr-2"
                  onClick={() => setSelectedCoupon(coupon)}
                >
                  <span>{coupon.validUntil}</span>
                  <Info size={12} className="ml-1 shrink-0" />
                </div>
                
                {coupon.status === 'available' && (
                  <button className="w-[64px] h-[26px] shrink-0 rounded-full bg-gradient-to-r from-primary-start to-primary-end text-white text-sm font-medium shadow-sm active:opacity-80">
                    领取
                  </button>
                )}
                {coupon.status === 'received' && (
                  <button 
                    onClick={() => goTo('store')}
                    className="w-[64px] h-[26px] shrink-0 rounded-full border border-primary-start text-primary-start text-sm font-medium active:bg-red-50 dark:border-red-400 dark:text-red-300 dark:active:bg-red-500/12"
                  >
                    去使用
                  </button>
                )}
                {coupon.status === 'expired' && (
                  <div className="w-[64px] h-[26px] shrink-0 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 text-sm font-medium flex items-center justify-center">
                    已过期
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderDetailModal = () => {
    if (!selectedCoupon) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={() => setSelectedCoupon(null)}
        ></div>
        <div className="bg-white dark:bg-gray-900 w-full sm:w-[350px] rounded-t-[20px] sm:rounded-2xl relative z-10 flex flex-col max-h-[80vh] animate-slide-up sm:animate-fade-in">
          <div className="flex items-center justify-between p-4 border-b border-border-light shrink-0">
            <h3 className="text-xl font-bold text-text-main">优惠券详情</h3>
            <button onClick={() => setSelectedCoupon(null)} className="p-1 text-text-aux active:text-text-main">
              <X size={20} />
            </button>
          </div>
          
          <div className="p-4 overflow-y-auto no-scrollbar">
            <div className="mb-6">
              <div className="text-md font-bold text-text-main mb-2">使用规则</div>
              <div className="space-y-1.5">
                {selectedCoupon.rules.map((rule, idx) => (
                  <div key={idx} className="text-base text-text-sub leading-relaxed">
                    {rule}
                  </div>
                ))}
              </div>
            </div>
            
            {selectedCoupon.unusableReason && (
              <div className="mb-6">
                <div className="text-md font-bold text-text-main mb-2">不可用原因</div>
                <div className="text-base text-primary-start leading-relaxed bg-red-50 p-3 rounded-lg dark:bg-red-500/12 dark:text-red-300">
                  {selectedCoupon.unusableReason}
                </div>
              </div>
            )}
            
            <div>
              <div className="text-md font-bold text-text-main mb-2">有效期</div>
              <div className="text-base text-text-sub">
                {selectedCoupon.validUntil}
              </div>
            </div>
          </div>
          
          <div className="p-4 border-t border-border-light shrink-0 pb-safe">
            <button 
              onClick={() => setSelectedCoupon(null)}
              className="w-full h-11 rounded-full bg-bg-card border border-border-main text-text-main text-lg font-medium active:bg-gray-50 dark:bg-gray-800 dark:active:bg-gray-700"
            >
              我知道了
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-bg-base relative h-full overflow-hidden">
      

      {renderHeader()}
      
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto no-scrollbar">
        {renderContent()}
      </div>

      {renderDetailModal()}
    </div>
  );
};


