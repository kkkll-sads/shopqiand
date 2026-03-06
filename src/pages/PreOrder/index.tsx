import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, HelpCircle, WifiOff, Clock, Award, Image as ImageIcon, Check, ChevronRight, X, AlertCircle } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { useAppNavigate } from '../../lib/navigation';
import { PageHeader } from '../../components/layout/PageHeader';

export const PreOrderPage = () => {
  const { goTo, goBack } = useAppNavigate();

  // Demo States
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [poolStatus, setPoolStatus] = useState<'not_started' | 'in_progress' | 'ended'>('in_progress');
  const [imageError, setImageError] = useState(false);

  // Form States
  const [hashrate, setHashrate] = useState<number | string>(5);
  const [quantity, setQuantity] = useState<number | string>(1);
  const [amount, setAmount] = useState<number | string>(500);
  const [agreed, setAgreed] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  // Constants (Mock Data)
  const AVAILABLE_HASHRATE = 150;
  const HASHRATE_PER_SHARE = 10;
  const MAX_QUANTITY = 50;
  const MIN_AMOUNT = 500;
  const MAX_AMOUNT = 10000;
  const AMOUNT_STEP = 100;
  const FEE_RATE = 0.005; // 0.5%

  // Picker Options
  const amountOptions = Array.from(
    { length: (MAX_AMOUNT - MIN_AMOUNT) / AMOUNT_STEP + 1 },
    (_, i) => MIN_AMOUNT + i * AMOUNT_STEP
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleBack = () => {
    goBack();
  };

  // Validation
  const numHashrate = typeof hashrate === 'number' ? hashrate : parseInt(hashrate || '0', 10);
  const numQuantity = typeof quantity === 'number' ? quantity : parseInt(quantity || '0', 10);
  const numAmount = typeof amount === 'number' ? amount : parseInt(amount || '0', 10);

  const hashrateError = numHashrate * numQuantity > AVAILABLE_HASHRATE;
  const quantityError = numQuantity > MAX_QUANTITY || numQuantity < 1;
  const amountError = numAmount < MIN_AMOUNT || numAmount > MAX_AMOUNT || numAmount % AMOUNT_STEP !== 0;

  const canSubmit = !hashrateError && !quantityError && !amountError && agreed && poolStatus === 'in_progress';

  // Calculations
  const subtotal = numAmount * numQuantity;
  const totalHashrate = numHashrate * numQuantity;
  const totalPayable = subtotal;

  const handleAmountBlur = () => {
    let val = typeof amount === 'number' ? amount : parseInt(amount || '0', 10);
    val = Math.round(val / 100) * 100;
    if (val < MIN_AMOUNT) val = MIN_AMOUNT;
    if (val > MAX_AMOUNT) val = MAX_AMOUNT;
    setAmount(val);
  };

  const renderSkeleton = () => (
    <div className="px-4 space-y-4 pb-24">
      <Card className="p-4">
        <div className="flex justify-between mb-4">
          <div>
            <Skeleton className="w-16 h-5 rounded-full mb-2" />
            <Skeleton className="w-32 h-6" />
          </div>
          <Skeleton className="w-12 h-12 rounded-lg" />
        </div>
        <Skeleton className="w-full h-16 rounded-xl" />
      </Card>
      
      <Card className="p-4 space-y-4">
        <Skeleton className="w-24 h-5" />
        <Skeleton className="w-full h-12 rounded-lg" />
      </Card>

      <Card className="p-4 space-y-4">
        <Skeleton className="w-24 h-5" />
        <Skeleton className="w-full h-12 rounded-lg" />
      </Card>

      <Card className="p-4 space-y-4">
        <Skeleton className="w-24 h-5" />
        <Skeleton className="w-full h-12 rounded-lg" />
      </Card>
    </div>
  );

  // Stepper Component
  const Stepper = ({ value, onChange, min = 1, max = 9999, disableMinus = false }: { value: number | string, onChange: (v: number | string) => void, min?: number, max?: number, disableMinus?: boolean }) => {
    const numVal = typeof value === 'number' ? value : parseInt(value || '0', 10);
    
    const handleMinus = () => {
      if (disableMinus) return;
      if (numVal > min) onChange(numVal - 1);
    };
    
    const handlePlus = () => {
      if (numVal < max) onChange(numVal + 1);
    };

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value.replace(/[^\d]/g, '');
      onChange(val === '' ? '' : parseInt(val, 10));
    };

    const handleBlur = () => {
      if (value === '' || numVal < min) onChange(min);
      else if (numVal > max) onChange(max);
    };

    return (
      <div className="flex items-center border border-border-light rounded-lg overflow-hidden h-9">
        <button 
          onClick={handleMinus}
          disabled={disableMinus || numVal <= min}
          className="w-9 h-full flex items-center justify-center bg-bg-base text-text-main disabled:text-text-aux active:bg-border-light transition-colors"
        >
          -
        </button>
        <div className="w-px h-full bg-border-light"></div>
        <input 
          type="text" 
          value={value}
          onChange={handleInput}
          onBlur={handleBlur}
          className="w-14 h-full text-center text-md font-medium text-text-main bg-white dark:bg-gray-900 outline-none"
        />
        <div className="w-px h-full bg-border-light"></div>
        <button 
          onClick={handlePlus}
          disabled={numVal >= max}
          className="w-9 h-full flex items-center justify-center bg-bg-base text-text-main disabled:text-text-aux active:bg-border-light transition-colors"
        >
          +
        </button>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-bg-base relative overflow-hidden">
      {/* Offline Banner */}
      {offline && (
        <div className="bg-red-50 text-primary-start px-4 py-2 flex items-center justify-between text-sm z-50 absolute top-0 left-0 right-0">
          <div className="flex items-center">
            <WifiOff size={14} className="mr-2" />
            <span>网络不稳定，请检查网络设置</span>
          </div>
          <button onClick={() => setOffline(false)} className="font-medium px-2 py-1 bg-white dark:bg-gray-900 rounded shadow-sm">刷新</button>
        </div>
      )}

      

      {/* Top Navigation */}
      <div className="px-4 pt-12 pb-4 flex items-center justify-between sticky top-0 z-40 bg-gradient-to-b from-red-50 to-red-50/95 dark:from-bg-box dark:to-bg-box">
        <button onClick={handleBack} className="w-8 h-8 rounded-full bg-white dark:bg-gray-900/80 flex items-center justify-center shadow-sm active:opacity-70 transition-opacity">
          <ChevronLeft size={20} className="text-text-main" />
        </button>
        <h1 className="text-2xl font-bold text-text-main">预约申购</h1>
        <button className="w-8 h-8 flex items-center justify-center active:opacity-70 transition-opacity">
          <HelpCircle size={20} className="text-text-main" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-32 bg-gradient-to-b from-red-50/50 to-bg-base dark:from-bg-base dark:to-bg-base">
        {loading ? (
          renderSkeleton()
        ) : poolStatus === 'ended' ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="w-20 h-20 bg-bg-card rounded-full flex items-center justify-center mb-4 border border-border-light shadow-sm">
              <Clock size={32} className="text-text-aux opacity-50" />
            </div>
            <p className="text-xl font-medium text-text-main mb-2">本场已结束</p>
            <p className="text-base text-text-sub mb-6">当前资产包不可预约申购</p>
            <button 
              onClick={handleBack} 
              className="px-8 py-2.5 border border-primary-start text-primary-start rounded-full text-md font-medium active:bg-red-50 transition-colors"
            >
              返回交易场次
            </button>
          </div>
        ) : (
          <div className="px-4 space-y-4">
            {/* Status Banner for Not Started */}
            {poolStatus === 'not_started' && (
              <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 flex items-center text-orange-600 text-base">
                <Clock size={16} className="mr-2" />
                <span>距开始还有 03:24:00，您可以先填写预约信息</span>
              </div>
            )}

            {/* Asset Summary Card */}
            <Card className="p-4 relative overflow-hidden border border-white/50 shadow-sm">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-start/5 rounded-bl-full -z-10"></div>
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1 pr-4">
                  <span className="inline-block px-2 py-0.5 bg-primary-start/10 text-primary-start text-xs font-bold rounded-tl-[8px] rounded-br-[8px] mb-2">Pool-C</span>
                  <h2 className="text-3xl font-bold text-text-main leading-tight mb-1">共识验证节点 - 高级算力包</h2>
                  <div className="flex items-center text-sm text-text-sub">
                    <Clock size={12} className="mr-1" /> 00:00 - 21:00
                  </div>
                </div>
                <div className="w-14 h-14 rounded-lg bg-bg-base overflow-hidden border border-border-light shrink-0">
                  {imageError ? (
                    <div className="w-full h-full flex items-center justify-center text-text-aux">
                      <ImageIcon size={20} className="opacity-50" />
                    </div>
                  ) : (
                    <img 
                      src="https://picsum.photos/seed/asset1/100/100" 
                      alt="Asset" 
                      className="w-full h-full object-cover"
                      onError={() => setImageError(true)}
                      referrerPolicy="no-referrer"
                    />
                  )}
                </div>
              </div>
              <div className="flex bg-bg-base rounded-xl p-3 border border-border-light/50">
                <div className="flex-1 flex flex-col">
                  <span className="text-s text-text-sub mb-1">预期收益率</span>
                  <span className="text-xl font-bold text-primary-start">5.5%</span>
                </div>
                <div className="w-px bg-border-light mx-3"></div>
                <div className="flex-1 flex flex-col">
                  <span className="text-s text-text-sub mb-1">本期额度</span>
                  <span className="text-xl font-bold text-text-main">200万</span>
                </div>
              </div>
            </Card>

            {/* Hashrate Card */}
            <Card className="p-4 border border-white/50 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-bold text-text-main">算力</h3>
                <Stepper value={hashrate} onChange={setHashrate} min={5} max={999} disableMinus={true} />
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-sub">每份消耗算力: {HASHRATE_PER_SHARE}</span>
                <span className="text-text-sub">当前可用: <span className="text-text-main font-medium">{AVAILABLE_HASHRATE}</span></span>
              </div>
              {hashrateError && (
                <div className="mt-3 pt-3 border-t border-border-light flex justify-between items-center">
                  <span className="text-sm text-primary-start flex items-center">
                    <AlertCircle size={12} className="mr-1" /> 算力不足
                  </span>
                  <button className="text-sm text-blue-500 font-medium">去补充算力 &gt;</button>
                </div>
              )}
            </Card>

            {/* Quantity Card */}
            <Card className="p-4 border border-white/50 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-bold text-text-main">份数</h3>
                <Stepper value={quantity} onChange={setQuantity} min={1} max={MAX_QUANTITY} />
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-sub">最小1份</span>
                <span className="text-text-sub">剩余可申购: <span className="text-text-main font-medium">{MAX_QUANTITY}</span> 份</span>
              </div>
              {quantityError && (
                <div className="mt-2 text-sm text-primary-start flex items-center">
                  <AlertCircle size={12} className="mr-1" /> 份数超出限制
                </div>
              )}
            </Card>

            {/* Amount Card */}
            <Card className="p-4 border border-white/50 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-text-main">金额 <span className="text-s font-normal text-text-sub ml-1">(每档100递增)</span></h3>
                <div className="text-3xl font-bold text-primary-start">
                  ¥{numAmount.toLocaleString()}
                </div>
              </div>
              
              <div className="flex items-center space-x-3 mb-3">
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-main font-medium">¥</span>
                  <input 
                    type="number" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    onBlur={handleAmountBlur}
                    className="w-full h-11 bg-bg-base border border-border-light rounded-lg pl-7 pr-3 text-lg font-medium text-text-main outline-none focus:border-primary-start transition-colors"
                    placeholder="输入金额"
                  />
                </div>
                <button 
                  onClick={() => setShowPicker(true)}
                  className="h-11 px-4 bg-red-50 text-primary-start rounded-lg text-base font-medium flex items-center active:bg-red-100 transition-colors"
                >
                  选择金额 <ChevronRight size={14} className="ml-1" />
                </button>
              </div>
              
              <div className="text-sm text-text-sub">
                可选范围 ¥{MIN_AMOUNT.toLocaleString()} ~ ¥{MAX_AMOUNT.toLocaleString()}，步进{AMOUNT_STEP}
              </div>
              
              {amountError && (
                <div className="mt-2 text-sm text-primary-start flex items-center">
                  <AlertCircle size={12} className="mr-1" /> 
                  {numAmount < MIN_AMOUNT || numAmount > MAX_AMOUNT 
                    ? '金额超出可选范围' 
                    : '金额必须为100的倍数'}
                </div>
              )}
            </Card>

            {/* Summary Card */}
            <Card className="p-4 border border-white/50 shadow-sm">
              <div className="space-y-3">
                <div className="flex justify-between text-base">
                  <span className="text-text-sub">小计 ({numQuantity}份)</span>
                  <span className="text-text-main font-medium">¥{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-base">
                  <span className="text-text-sub">消耗算力</span>
                  <span className="text-text-main font-medium">{totalHashrate}</span>
                </div>
                <div className="w-full h-px bg-border-light my-1"></div>
                <div className="flex justify-between items-center">
                  <span className="text-md font-bold text-text-main">应付金额</span>
                  <span className="text-3xl font-bold text-primary-start">¥{totalPayable.toLocaleString()}</span>
                </div>
                <div className="text-s text-text-sub text-right">
                  提交后将冻结对应金额
                </div>
              </div>
            </Card>

            {/* Agreement */}
            <div className="flex items-start px-2 mt-6 mb-4">
              <button 
                onClick={() => setAgreed(!agreed)}
                className="mt-0.5 mr-2 shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors"
                style={{
                  borderColor: agreed ? '#F2271C' : '#D1D5DB',
                  backgroundColor: agreed ? '#F2271C' : 'transparent'
                }}
              >
                {agreed && <Check size={12} className="text-white" />}
              </button>
              <div className="text-sm text-text-sub leading-snug">
                我已阅读并同意 <span className="text-blue-500">《预约申购规则》</span> <span className="text-blue-500">《风险提示书》</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Fixed Bar */}
      {!loading && poolStatus !== 'ended' && (
        <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-border-light px-4 py-3 pb-safe flex items-center justify-between z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <div className="flex flex-col">
            <span className="text-s text-text-sub mb-0.5">冻结总额</span>
            <div className="flex items-baseline text-primary-start">
              <span className="text-md font-bold mr-0.5">¥</span>
              <span className="text-4xl font-bold leading-none">{totalPayable.toLocaleString()}</span>
            </div>
          </div>
          <button 
            disabled={!canSubmit}
            className={`h-[48px] px-8 rounded-full text-lg font-bold text-white shadow-sm transition-all ${canSubmit ? 'bg-gradient-to-r from-primary-start to-primary-end active:opacity-80' : 'bg-border-light text-text-aux cursor-not-allowed'}`}
          >
            确认预约
          </button>
        </div>
      )}

      {/* Picker Bottom Sheet */}
      {showPicker && (
        <>
          <div 
            className="absolute inset-0 bg-black/50 z-50 transition-opacity"
            onClick={() => setShowPicker(false)}
          ></div>
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-[20px] z-50 flex flex-col animate-slide-up">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-light">
              <button onClick={() => setShowPicker(false)} className="text-md text-text-sub px-2 py-1">取消</button>
              <h3 className="text-xl font-bold text-text-main">选择金额</h3>
              <button 
                onClick={() => setShowPicker(false)} 
                className="text-md text-primary-start font-medium px-2 py-1"
              >
                确定
              </button>
            </div>
            
            <div className="h-[240px] overflow-y-auto no-scrollbar py-2 relative">
              {/* Highlight overlay for picker */}
              <div className="absolute top-1/2 left-0 right-0 h-10 -translate-y-1/2 bg-bg-base/50 border-y border-border-light pointer-events-none"></div>
              
              <div className="space-y-0 px-4">
                {/* Empty space for scrolling padding */}
                <div className="h-[100px]"></div>
                {amountOptions.map(opt => (
                  <div 
                    key={opt}
                    onClick={() => setAmount(opt)}
                    className={`h-10 flex items-center justify-center text-xl transition-colors cursor-pointer ${numAmount === opt ? 'text-primary-start font-bold' : 'text-text-main'}`}
                  >
                    ¥ {opt.toLocaleString()}
                  </div>
                ))}
                <div className="h-[100px]"></div>
              </div>
            </div>
          </div>
        </>
      )}

      <style>{`
        .pb-safe { padding-bottom: max(env(safe-area-inset-bottom), 12px); }
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
};
