import React, { useState, useEffect, useRef } from 'react';
import { X, RefreshCcw, Ticket } from 'lucide-react';
import { Skeleton } from '../ui/Skeleton';

interface Coupon {
  id: string;
  amount: number;
  threshold: string;
  title: string;
  validity: string;
  scope: string;
  status: 'available' | 'received';
}

interface CouponBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CouponBottomSheet: React.FC<CouponBottomSheetProps> = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isEmpty, setIsEmpty] = useState(false);
  
  // For demo purposes
  const [demoState, setDemoState] = useState<'normal' | 'empty' | 'error'>('normal');

  useEffect(() => {
    if (isOpen) {
      fetchCoupons();
    }
  }, [isOpen, demoState]);

  const fetchCoupons = () => {
    setLoading(true);
    setError(false);
    setIsEmpty(false);

    setTimeout(() => {
      if (demoState === 'error') {
        setError(true);
      } else if (demoState === 'empty') {
        setIsEmpty(true);
        setCoupons([]);
      } else {
        setCoupons([
          {
            id: '1',
            amount: 200,
            threshold: '满3000可用',
            title: '手机数码品类券',
            validity: '2023.10.24-2023.11.11',
            scope: '仅可购买指定手机数码商品',
            status: 'available'
          },
          {
            id: '2',
            amount: 50,
            threshold: '满500可用',
            title: '全品类通用券',
            validity: '2023.10.24-2023.10.31',
            scope: '全平台自营商品可用',
            status: 'received'
          },
          {
            id: '3',
            amount: 10,
            threshold: '无门槛',
            title: '新用户专享券',
            validity: '领取后3天内有效',
            scope: '全平台商品可用',
            status: 'available'
          },
          {
            id: '4',
            amount: 100,
            threshold: '满1000可用',
            title: '家电品类券',
            validity: '2023.10.24-2023.11.11',
            scope: '仅可购买指定家电商品',
            status: 'available'
          }
        ]);
      }
      setLoading(false);
    }, 800);
  };

  const handleReceive = (id: string) => {
    setCoupons(prev => prev.map(c => c.id === id ? { ...c, status: 'received' } : c));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      <div className="bg-bg-hover dark:bg-bg-base rounded-t-[16px] w-full h-[75vh] flex flex-col relative z-10 animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="h-14 flex items-center justify-center relative bg-white dark:bg-bg-card rounded-t-[16px] shrink-0">
          <h3 className="text-xl font-bold text-text-main dark:text-text-main">领取优惠券</h3>
          <button 
            onClick={onClose}
            className="absolute right-4 p-2 text-text-aux dark:text-text-sub active:bg-bg-hover dark:active:bg-[#2A2A2A] rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Demo Controls (Hidden in production) */}
        <div className="px-4 py-2 flex space-x-2 overflow-x-auto no-scrollbar bg-white dark:bg-bg-card border-b border-border-light dark:border-border-light text-xs shrink-0">
          <span className="text-text-aux flex items-center shrink-0">Demo:</span>
          <button onClick={() => setDemoState('normal')} className={`px-2 py-1 rounded border ${demoState === 'normal' ? 'bg-brand-start text-white border-[#E2231A]' : 'border-[#CCCCCC] dark:border-[#666666] text-text-main dark:text-text-main'}`}>Normal</button>
          <button onClick={() => setDemoState('empty')} className={`px-2 py-1 rounded border ${demoState === 'empty' ? 'bg-brand-start text-white border-[#E2231A]' : 'border-[#CCCCCC] dark:border-[#666666] text-text-main dark:text-text-main'}`}>Empty</button>
          <button onClick={() => setDemoState('error')} className={`px-2 py-1 rounded border ${demoState === 'error' ? 'bg-brand-start text-white border-[#E2231A]' : 'border-[#CCCCCC] dark:border-[#666666] text-text-main dark:text-text-main'}`}>Error</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 relative">
          {error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <RefreshCcw size={48} className="text-text-aux dark:text-text-sub mb-4" />
              <p className="text-md text-text-sub dark:text-text-aux mb-4">加载失败，请稍后再试</p>
              <button 
                onClick={fetchCoupons}
                className="px-6 py-2 border border-[#CCCCCC] dark:border-[#666666] rounded-full text-base text-text-main dark:text-text-main active:bg-bg-hover dark:active:bg-[#2A2A2A]"
              >
                重新加载
              </button>
            </div>
          ) : isEmpty ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Ticket size={64} className="text-text-aux dark:text-text-sub mb-4 opacity-50" strokeWidth={1.5} />
              <p className="text-md text-text-sub dark:text-text-aux">暂无可领取的优惠券</p>
            </div>
          ) : loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white dark:bg-bg-card rounded-xl h-[100px] flex overflow-hidden shadow-sm">
                  <div className="w-[110px] bg-[#FFF3F3] dark:bg-[#3A1E1E] flex flex-col items-center justify-center shrink-0">
                    <Skeleton className="w-16 h-8 mb-2 bg-white/50 dark:bg-black/20" />
                    <Skeleton className="w-12 h-3 bg-white/50 dark:bg-black/20" />
                  </div>
                  <div className="flex-1 p-3 flex flex-col justify-between">
                    <Skeleton className="w-3/4 h-4" />
                    <Skeleton className="w-1/2 h-3" />
                    <div className="flex justify-between items-end">
                      <Skeleton className="w-2/3 h-3" />
                      <Skeleton className="w-14 h-6 rounded-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3 pb-4">
              {coupons.map(coupon => (
                <div key={coupon.id} className="bg-white dark:bg-bg-card rounded-xl flex overflow-hidden shadow-sm relative">
                  {/* Left Side: Amount & Threshold */}
                  <div className={`w-[110px] flex flex-col items-center justify-center shrink-0 relative ${coupon.status === 'received' ? 'bg-bg-hover dark:bg-bg-hover' : 'bg-[#FFF3F3] dark:bg-[#3A1E1E]'}`}>
                    <div className={`flex items-baseline ${coupon.status === 'received' ? 'text-text-aux dark:text-text-sub' : 'text-brand-start dark:text-brand-start'}`}>
                      <span className="text-md font-bold">¥</span>
                      <span className="text-6xl font-bold leading-none tracking-tight ml-0.5">{coupon.amount}</span>
                    </div>
                    <span className={`text-s mt-1 ${coupon.status === 'received' ? 'text-text-aux dark:text-text-sub' : 'text-brand-start dark:text-brand-start'}`}>
                      {coupon.threshold}
                    </span>
                    
                    {/* Dashed line separator */}
                    <div className="absolute right-0 top-2 bottom-2 w-px border-r border-dashed border-[#CCCCCC] dark:border-[#666666] opacity-50"></div>
                    
                    {/* Top/Bottom cutouts */}
                    <div className="absolute -right-1.5 -top-1.5 w-3 h-3 rounded-full bg-bg-hover dark:bg-bg-base"></div>
                    <div className="absolute -right-1.5 -bottom-1.5 w-3 h-3 rounded-full bg-bg-hover dark:bg-bg-base"></div>
                  </div>
                  
                  {/* Right Side: Details & Action */}
                  <div className="flex-1 p-3 flex flex-col justify-between relative">
                    {coupon.status === 'received' && (
                      <div className="absolute top-0 right-0 w-12 h-12 overflow-hidden">
                        <div className="absolute top-2 -right-3 bg-[#CCCCCC] dark:bg-[#666666] text-white text-2xs py-0.5 px-4 rotate-45">
                          已领取
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <div className="flex items-start mb-1 pr-6">
                        <span className={`text-xs px-1 py-0.5 rounded mr-1 shrink-0 mt-0.5 ${coupon.status === 'received' ? 'bg-bg-hover text-text-aux dark:bg-bg-hover dark:text-text-sub' : 'bg-brand-start text-white'}`}>
                          优惠券
                        </span>
                        <h4 className={`text-md font-bold line-clamp-1 ${coupon.status === 'received' ? 'text-text-aux dark:text-text-sub' : 'text-text-main dark:text-text-main'}`}>
                          {coupon.title}
                        </h4>
                      </div>
                      <p className="text-s text-text-aux dark:text-text-sub line-clamp-1 mb-2">
                        {coupon.scope}
                      </p>
                    </div>
                    
                    <div className="flex items-end justify-between">
                      <span className="text-xs text-text-aux dark:text-text-sub">
                        {coupon.validity}
                      </span>
                      {coupon.status === 'available' ? (
                        <button 
                          onClick={() => handleReceive(coupon.id)}
                          className="w-[60px] h-[24px] rounded-full bg-gradient-to-r from-brand-start to-brand-end text-white text-sm font-medium active:opacity-80 flex items-center justify-center shadow-[0_2px_8px_rgba(226,35,26,0.2)]"
                        >
                          领取
                        </button>
                      ) : (
                        <button 
                          className="w-[60px] h-[24px] rounded-full bg-transparent border border-[#CCCCCC] dark:border-[#666666] text-text-aux dark:text-text-sub text-sm font-medium flex items-center justify-center"
                        >
                          去使用
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Lazy Loading Indicator */}
              <div className="py-4 flex justify-center items-center text-sm text-text-aux dark:text-text-sub">
                <span className="w-4 h-4 border-2 border-[#CCCCCC] dark:border-[#666666] border-t-transparent rounded-full animate-spin mr-2"></span>
                加载更多...
              </div>
            </div>
          )}
        </div>

        {/* Bottom Action */}
        <div className="p-3 pb-safe bg-white dark:bg-bg-card border-t border-border-light dark:border-border-light shrink-0">
          <button 
            onClick={onClose}
            className="w-full h-[44px] rounded-3xl bg-gradient-to-r from-brand-start to-brand-end text-white font-medium text-lg active:opacity-80 flex items-center justify-center shadow-[0_4px_12px_rgba(226,35,26,0.2)]"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};
