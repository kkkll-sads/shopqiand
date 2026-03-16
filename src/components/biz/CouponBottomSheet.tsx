import React, { useEffect, useState } from 'react';
import { RefreshCcw, Ticket, X } from 'lucide-react';
import { BottomSheet } from '../ui/BottomSheet';
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
            threshold: '满1000可用',
            title: '手机数码品类券',
            validity: '2023.10.24-2023.11.11',
            scope: '仅可购买指定手机数码商品',
            status: 'available',
          },
          {
            id: '2',
            amount: 50,
            threshold: '满200可用',
            title: '全品类通用券',
            validity: '2023.10.24-2023.10.31',
            scope: '全平台自营商品可用',
            status: 'received',
          },
          {
            id: '3',
            amount: 10,
            threshold: '无门槛',
            title: '新用户专享券',
            validity: '领取后7天内有效',
            scope: '全平台商品可用',
            status: 'available',
          },
          {
            id: '4',
            amount: 100,
            threshold: '满1000可用',
            title: '家电品类券',
            validity: '2023.10.24-2023.11.11',
            scope: '仅可购买指定家电商品',
            status: 'available',
          },
        ]);
      }
      setLoading(false);
    }, 800);
  };

  const handleReceive = (id: string) => {
    setCoupons((prev) => prev.map((coupon) => (
      coupon.id === id ? { ...coupon, status: 'received' } : coupon
    )));
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="领取优惠券"
      maxHeight="75vh"
      zIndex={100}
      className="bg-bg-hover dark:bg-bg-base"
      headerLeft={null}
      headerRight={
        <button
          onClick={onClose}
          className="rounded-full p-2 text-text-aux transition-colors active:bg-bg-hover dark:text-text-sub dark:active:bg-[#2A2A2A]"
        >
          <X size={20} />
        </button>
      }
      footer={
        <div className="border-border-light bg-white p-3 dark:bg-bg-card dark:border-border-light">
          <button
            onClick={onClose}
            className="flex h-[44px] w-full items-center justify-center rounded-3xl bg-gradient-to-r from-brand-start to-brand-end text-lg font-medium text-white shadow-[0_4px_12px_rgba(226,35,26,0.2)] active:opacity-80"
          >
            完成
          </button>
        </div>
      }
    >
      <div className="bg-bg-hover dark:bg-bg-base">
        <div className="flex space-x-2 overflow-x-auto border-b border-border-light bg-white px-4 py-2 text-xs no-scrollbar dark:border-border-light dark:bg-bg-card">
          <span className="flex shrink-0 items-center text-text-aux">Demo:</span>
          <button
            onClick={() => setDemoState('normal')}
            className={`rounded border px-2 py-1 ${
              demoState === 'normal'
                ? 'border-[#E2231A] bg-brand-start text-white'
                : 'border-[#CCCCCC] text-text-main dark:border-[#666666] dark:text-text-main'
            }`}
          >
            Normal
          </button>
          <button
            onClick={() => setDemoState('empty')}
            className={`rounded border px-2 py-1 ${
              demoState === 'empty'
                ? 'border-[#E2231A] bg-brand-start text-white'
                : 'border-[#CCCCCC] text-text-main dark:border-[#666666] dark:text-text-main'
            }`}
          >
            Empty
          </button>
          <button
            onClick={() => setDemoState('error')}
            className={`rounded border px-2 py-1 ${
              demoState === 'error'
                ? 'border-[#E2231A] bg-brand-start text-white'
                : 'border-[#CCCCCC] text-text-main dark:border-[#666666] dark:text-text-main'
            }`}
          >
            Error
          </button>
        </div>

        <div className="relative min-h-[320px] p-4">
          {error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
              <RefreshCcw size={48} className="mb-4 text-text-aux dark:text-text-sub" />
              <p className="mb-4 text-md text-text-sub dark:text-text-aux">加载失败，请稍后再试</p>
              <button
                onClick={fetchCoupons}
                className="rounded-full border border-[#CCCCCC] px-6 py-2 text-base text-text-main active:bg-bg-hover dark:border-[#666666] dark:text-text-main dark:active:bg-[#2A2A2A]"
              >
                重新加载
              </button>
            </div>
          ) : isEmpty ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
              <Ticket size={64} className="mb-4 text-text-aux opacity-50 dark:text-text-sub" strokeWidth={1.5} />
              <p className="text-md text-text-sub dark:text-text-aux">暂无可领取的优惠券</p>
            </div>
          ) : loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex h-[100px] overflow-hidden rounded-xl bg-white shadow-sm dark:bg-bg-card">
                  <div className="flex w-[110px] shrink-0 flex-col items-center justify-center bg-[#FFF3F3] dark:bg-[#3A1E1E]">
                    <Skeleton className="mb-2 h-8 w-16 bg-white/50 dark:bg-black/20" />
                    <Skeleton className="h-3 w-12 bg-white/50 dark:bg-black/20" />
                  </div>
                  <div className="flex flex-1 flex-col justify-between p-3">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <div className="flex items-end justify-between">
                      <Skeleton className="h-3 w-2/3" />
                      <Skeleton className="h-6 w-14 rounded-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3 pb-4">
              {coupons.map((coupon) => (
                <div key={coupon.id} className="relative flex overflow-hidden rounded-xl bg-white shadow-sm dark:bg-bg-card">
                  <div className={`relative flex w-[110px] shrink-0 flex-col items-center justify-center ${coupon.status === 'received' ? 'bg-bg-hover dark:bg-bg-hover' : 'bg-[#FFF3F3] dark:bg-[#3A1E1E]'}`}>
                    <div className={`flex items-baseline ${coupon.status === 'received' ? 'text-text-aux dark:text-text-sub' : 'text-brand-start dark:text-brand-start'}`}>
                      <span className="text-md font-bold">¥</span>
                      <span className="ml-0.5 text-6xl font-bold leading-none tracking-tight">{coupon.amount}</span>
                    </div>
                    <span className={`mt-1 text-s ${coupon.status === 'received' ? 'text-text-aux dark:text-text-sub' : 'text-brand-start dark:text-brand-start'}`}>
                      {coupon.threshold}
                    </span>

                    <div className="absolute bottom-2 right-0 top-2 w-px border-r border-dashed border-[#CCCCCC] opacity-50 dark:border-[#666666]" />
                    <div className="absolute -right-1.5 -top-1.5 h-3 w-3 rounded-full bg-bg-hover dark:bg-bg-base" />
                    <div className="absolute -bottom-1.5 -right-1.5 h-3 w-3 rounded-full bg-bg-hover dark:bg-bg-base" />
                  </div>

                  <div className="relative flex flex-1 flex-col justify-between p-3">
                    {coupon.status === 'received' ? (
                      <div className="absolute right-0 top-0 h-12 w-12 overflow-hidden">
                        <div className="absolute -right-3 top-2 rotate-45 bg-[#CCCCCC] px-4 py-0.5 text-2xs text-white dark:bg-[#666666]">
                          已领取
                        </div>
                      </div>
                    ) : null}

                    <div>
                      <div className="mb-1 flex items-start pr-6">
                        <span className={`mr-1 mt-0.5 shrink-0 rounded px-1 py-0.5 text-xs ${coupon.status === 'received' ? 'bg-bg-hover text-text-aux dark:bg-bg-hover dark:text-text-sub' : 'bg-brand-start text-white'}`}>
                          优惠券
                        </span>
                        <h4 className={`line-clamp-1 text-md font-bold ${coupon.status === 'received' ? 'text-text-aux dark:text-text-sub' : 'text-text-main dark:text-text-main'}`}>
                          {coupon.title}
                        </h4>
                      </div>
                      <p className="mb-2 line-clamp-1 text-s text-text-aux dark:text-text-sub">
                        {coupon.scope}
                      </p>
                    </div>

                    <div className="flex items-end justify-between">
                      <span className="text-xs text-text-aux dark:text-text-sub">{coupon.validity}</span>
                      {coupon.status === 'available' ? (
                        <button
                          onClick={() => handleReceive(coupon.id)}
                          className="flex h-[24px] w-[60px] items-center justify-center rounded-full bg-gradient-to-r from-brand-start to-brand-end text-sm font-medium text-white shadow-[0_2px_8px_rgba(226,35,26,0.2)] active:opacity-80"
                        >
                          领取
                        </button>
                      ) : (
                        <button className="flex h-[24px] w-[60px] items-center justify-center rounded-full border border-[#CCCCCC] bg-transparent text-sm font-medium text-text-aux dark:border-[#666666] dark:text-text-sub">
                          去使用
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-center py-4 text-sm text-text-aux dark:text-text-sub">
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-[#CCCCCC] border-t-transparent dark:border-[#666666]" />
                加载更多...
              </div>
            </div>
          )}
        </div>
      </div>
    </BottomSheet>
  );
};
