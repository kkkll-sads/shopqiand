import React, { useState, useEffect } from 'react';
import { ChevronLeft, WifiOff, RefreshCcw, Copy, CheckCircle2, Circle, Wallet, CreditCard, ShieldCheck, AlertCircle } from 'lucide-react';
import { Skeleton } from '../../components/ui/Skeleton';
import { useAppNavigate } from '../../lib/navigation';
import { PageHeader } from '../../components/layout/PageHeader';

const WeChatIcon = () => (
  <div className="w-6 h-6 rounded-full bg-[#09B83E] flex items-center justify-center shrink-0">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
    </svg>
  </div>
);

const AlipayIcon = () => (
  <div className="w-6 h-6 rounded-full bg-[#1677FF] flex items-center justify-center shrink-0">
    <span className="text-white text-sm font-bold font-serif">支</span>
  </div>
);

export const CashierPage = () => {
  const { goTo, goBack } = useAppNavigate();

  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [moduleError, setModuleError] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('balance');
  const [timeLeft, setTimeLeft] = useState(29 * 60 + 59);
  const [showFailureModal, setShowFailureModal] = useState(false);

  const paymentMethods = [
    { id: 'balance', name: '树交所余额', desc: '可用余额 ¥10000.00', icon: Wallet, color: 'text-primary-start', bg: 'bg-primary-start/10' },
    { id: 'bank', name: '招商银行 储蓄卡 (1234)', desc: '单笔限额 ¥50000.00', icon: CreditCard, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'wechat', name: '微信支付', desc: '亿万用户的选择', customIcon: WeChatIcon },
    { id: 'alipay', name: '支付宝', desc: '安全快捷', customIcon: AlipayIcon },
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (timeLeft <= 0 || loading || moduleError) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, loading, moduleError]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleBack = () => {
    goBack();
  };

  const handleCopy = () => {
    // In a real app, use navigator.clipboard.writeText
    alert('订单号已复制');
  };

  const handlePay = () => {
    // Simulate payment success/failure randomly or just go to result page
    goTo('payment_result');
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
        <h1 className="text-xl font-bold text-text-main text-center w-1/3">收银台</h1>
        <div className="w-1/3"></div>
      </div>
    </div>
  );

  const renderSkeleton = () => (
    <div className="p-3">
      {/* Amount Skeleton */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 mb-3 shadow-sm flex flex-col items-center">
        <Skeleton className="w-16 h-4 mb-3" />
        <Skeleton className="w-32 h-10 mb-4" />
        <Skeleton className="w-48 h-6 rounded-full" />
      </div>
      
      {/* Methods Skeleton */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-2 mb-3 shadow-sm">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-center p-3">
            <Skeleton className="w-6 h-6 rounded-full mr-3 shrink-0" />
            <div className="flex-1">
              <Skeleton className="w-24 h-4 mb-1" />
              <Skeleton className="w-32 h-3" />
            </div>
            <Skeleton className="w-5 h-5 rounded-full shrink-0" />
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

    if (loading) {
      return renderSkeleton();
    }

    return (
      <div className="p-3 pb-24">
        {/* Countdown */}
        <div className="flex justify-center mb-3">
          <div className="bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-sm font-medium flex items-center">
            支付剩余时间 {formatTime(timeLeft)}
          </div>
        </div>

        {/* Amount Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm mb-3 p-6 flex flex-col items-center">
          <span className="text-base text-text-sub mb-2">应付金额</span>
          <div className="text-primary-start font-bold mb-4 flex items-baseline">
            <span className="text-3xl mr-0.5">¥</span>
            <span className="text-7xl leading-none">7939</span>
            <span className="text-3xl">.00</span>
          </div>
          <div className="flex items-center text-sm text-text-sub bg-bg-base px-3 py-1.5 rounded-full">
            <span className="mr-2">订单号：1234567890123456</span>
            <button onClick={handleCopy} className="active:opacity-70 flex items-center text-text-main font-medium">
              <Copy size={12} className="mr-1" />
              复制
            </button>
          </div>
        </div>

        {/* Payment Methods Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm mb-4 overflow-hidden">
          {paymentMethods.map((method, index) => (
            <div 
              key={method.id} 
              className={`flex items-center p-4 active:bg-bg-base transition-colors cursor-pointer ${index !== paymentMethods.length - 1 ? 'border-b border-border-light/50' : ''}`}
              onClick={() => setSelectedMethod(method.id)}
            >
              {method.customIcon ? (
                <method.customIcon />
              ) : (
                <div className={`w-6 h-6 rounded-full ${method.bg} flex items-center justify-center shrink-0`}>
                  <method.icon size={14} className={method.color} />
                </div>
              )}
              
              <div className="flex-1 ml-3 min-w-0">
                <div className="text-md text-text-main font-medium truncate">{method.name}</div>
                <div className="text-sm text-text-sub truncate mt-0.5">{method.desc}</div>
              </div>

              <div className="ml-3 shrink-0">
                {selectedMethod === method.id ? (
                  <CheckCircle2 size={20} className="text-primary-start fill-primary-start/10" />
                ) : (
                  <Circle size={20} className="text-text-aux" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Security Hint */}
        <div className="flex items-center justify-center text-text-sub text-s">
          <ShieldCheck size={12} className="mr-1" />
          <span>支付安全由树交所及合作机构保障</span>
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
        <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-border-light px-4 py-3 z-40 pb-safe">
          <button 
            onClick={handlePay}
            className="w-full h-11 rounded-full bg-gradient-to-r from-primary-start to-primary-end text-white text-lg font-medium shadow-sm active:opacity-80 flex items-center justify-center"
          >
            确认支付 ¥7939.00
          </button>
        </div>
      )}

      {/* Payment Failure Modal */}
      {showFailureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-10">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full overflow-hidden flex flex-col items-center pt-6 pb-5 px-5 animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3">
              <AlertCircle size={24} className="text-primary-start" />
            </div>
            <h3 className="text-xl font-bold text-text-main mb-2">支付失败</h3>
            <p className="text-base text-text-sub text-center mb-6 leading-relaxed">
              您的银行卡余额不足或已被限制交易，请更换支付方式或稍后重试。
            </p>
            <div className="w-full flex space-x-3">
              <button 
                onClick={() => setShowFailureModal(false)}
                className="flex-1 h-10 rounded-full border border-border-light text-md font-medium text-text-main active:bg-bg-base"
              >
                更换方式
              </button>
              <button 
                onClick={() => {
                  setShowFailureModal(false);
                  // retry logic
                }}
                className="flex-1 h-10 rounded-full bg-gradient-to-r from-primary-start to-primary-end text-md font-medium text-white active:opacity-80 shadow-sm"
              >
                重新支付
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
