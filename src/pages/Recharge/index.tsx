import React, { useState, useEffect } from 'react';
import { ChevronLeft, Eye, EyeOff, XCircle, ShieldCheck, AlertCircle, CheckCircle2, Wallet, CreditCard, Smartphone, Info } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAppNavigate } from '../../lib/navigation';
import { PageHeader } from '../../components/layout/PageHeader';

// Mock Data
const MOCK_DATA = {
  balance: {
    total: 12500.00,
    available: 10000.00,
    frozen: 2500.00,
  },
  paymentMethods: [
    { id: 'bank_card', name: '工商银行储蓄卡 (8888)', icon: CreditCard, desc: '单笔限额50,000元', color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'alipay', name: '支付宝', icon: Smartphone, desc: '推荐使用', color: 'text-blue-400', bg: 'bg-blue-50' },
    { id: 'wechat', name: '微信支付', icon: Smartphone, desc: '亿万用户的选择', color: 'text-green-500', bg: 'bg-green-50' },
  ],
  rules: {
    minAmount: 100,
    maxAmount: 50000,
    arrivalText: '预计2小时内到账'
  }
};

const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000];

export function RechargePage() {
  const { goBack } = useAppNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [error, setError] = useState<string | null>(null);
  
  const [showBalance, setShowBalance] = useState(true);
  const [amount, setAmount] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('bank_card');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearTimeout(timer);
    };
  }, []);

  const handleGoBack = () => {
    goBack();
  };

  const handleGoHistory = () => {
    // Navigate to recharge history (placeholder)
    alert('跳转到充值记录');
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Only allow numbers and one decimal point
    if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) {
      setAmount(val);
    }
  };

  const handleSubmit = () => {
    if (!amount || Number(amount) <= 0) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      alert(`成功充值 ¥${amount}`);
      setAmount('');
      handleGoBack();
    }, 1500);
  };

  const numAmount = Number(amount);
  const isSubmitDisabled = !amount || numAmount <= 0 || numAmount < MOCK_DATA.rules.minAmount || numAmount > MOCK_DATA.rules.maxAmount || isSubmitting;

  if (isLoading) {
    return (
      <div className="h-full flex flex-col bg-bg-hover dark:bg-gray-900">
        <div className="h-12 flex items-center px-4 bg-white dark:bg-gray-800">
          <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="flex-1 flex justify-center">
            <div className="w-24 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
          <div className="w-6 h-6" />
        </div>
        <div className="p-4 space-y-4">
          <div className="h-32 bg-white dark:bg-gray-800 rounded-2xl animate-pulse" />
          <div className="h-48 bg-white dark:bg-gray-800 rounded-2xl animate-pulse" />
          <div className="h-64 bg-white dark:bg-gray-800 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col bg-bg-hover dark:bg-gray-900">
        <div className="h-12 flex items-center px-4 bg-white dark:bg-gray-800">
          <button onClick={handleGoBack} className="p-1 -ml-1 text-text-main">
            <ChevronLeft size={24} />
          </button>
          <div className="flex-1 text-center font-medium text-2xl text-text-main">专项金充值</div>
          <div className="w-6" />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <AlertCircle size={48} className="text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-text-main mb-2">加载失败</h3>
          <p className="text-text-sub mb-6">{error}</p>
          <Button onClick={() => window.location.reload()} className="w-32">重试</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-bg-hover dark:bg-gray-900 relative">
      {/* Header */}
      <div className="h-12 flex items-center px-4 bg-white dark:bg-gray-800 sticky top-0 z-10">
        <button onClick={handleGoBack} className="p-1 -ml-1 text-text-main active:opacity-70 transition-opacity">
          <ChevronLeft size={24} />
        </button>
        <div className="flex-1 text-center font-medium text-2xl text-text-main">专项金充值</div>
        <button onClick={handleGoHistory} className="text-md text-text-sub active:opacity-70 transition-opacity">
          充值记录
        </button>
      </div>

      {isOffline && (
        <div className="bg-orange-50 dark:bg-orange-500/10 text-orange-500 text-base px-4 py-2 flex items-center">
          <AlertCircle size={14} className="mr-1.5 flex-shrink-0" />
          <span>当前网络不可用，请检查网络设置</span>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pb-[100px]">
        <div className="p-4 space-y-3">
          
          {/* Balance Overview Card */}
          <Card className="p-4 bg-gradient-to-br from-red-50 to-white dark:from-bg-box dark:to-bg-box border-none">
            <div className="flex items-center justify-between mb-2">
              <span className="text-base text-text-sub flex items-center">
                当前专项金余额 (元)
                <button 
                  onClick={() => setShowBalance(!showBalance)}
                  className="ml-1.5 p-1 text-text-sub hover:text-text-main transition-colors"
                >
                  {showBalance ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
              </span>
            </div>
            <div className="text-7xl font-bold text-text-main mb-4 font-mono tracking-tight">
              {showBalance ? MOCK_DATA.balance.total.toFixed(2) : '****'}
            </div>
            <div className="flex items-center space-x-6 text-base">
              <div>
                <span className="text-text-sub mr-1.5">可用</span>
                <span className="text-text-main font-medium font-mono">
                  {showBalance ? MOCK_DATA.balance.available.toFixed(2) : '****'}
                </span>
              </div>
              <div>
                <span className="text-text-sub mr-1.5">冻结</span>
                <span className="text-text-main font-medium font-mono">
                  {showBalance ? MOCK_DATA.balance.frozen.toFixed(2) : '****'}
                </span>
              </div>
            </div>
          </Card>

          {/* Recharge Amount Card */}
          <Card className="p-4">
            <h3 className="text-lg font-medium text-text-main mb-4">充值金额</h3>
            
            <div className="flex items-center border-b border-border-light pb-2 mb-4">
              <span className="text-5xl font-medium text-text-main mr-2">¥</span>
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={handleAmountChange}
                placeholder="请输入充值金额"
                className="flex-1 text-6xl font-bold text-text-main bg-transparent outline-none placeholder:text-gray-300 dark:placeholder:text-gray-600 font-mono"
              />
              {amount && (
                <button 
                  onClick={() => setAmount('')}
                  className="p-1 text-gray-300 hover:text-gray-400 dark:text-gray-600 dark:hover:text-gray-500"
                >
                  <XCircle size={20} />
                </button>
              )}
            </div>

            {/* Quick Amounts */}
            <div className="flex overflow-x-auto no-scrollbar -mx-4 px-4 mb-4 space-x-2">
              {QUICK_AMOUNTS.map((val) => (
                <button
                  key={val}
                  onClick={() => setAmount(val.toString())}
                  className={`flex-shrink-0 px-4 py-1.5 rounded-full text-base font-medium transition-colors border ${
                    amount === val.toString()
                      ? 'bg-red-50 dark:bg-red-500/10 text-brand-red border-brand-red'
                      : 'bg-gray-50 dark:bg-gray-800 text-text-main border-transparent hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>

            {/* Hints */}
            <div className="text-sm text-text-sub flex items-start">
              <Info size={14} className="mr-1 mt-0.5 flex-shrink-0" />
              <span>
                最低充值 ¥{MOCK_DATA.rules.minAmount}，单笔限额 ¥{MOCK_DATA.rules.maxAmount.toLocaleString()}。{MOCK_DATA.rules.arrivalText}。
              </span>
            </div>
          </Card>

          {/* Payment Methods Card */}
          <Card className="p-4">
            <h3 className="text-lg font-medium text-text-main mb-3">支付方式</h3>
            {MOCK_DATA.paymentMethods.length === 0 ? (
              <div className="py-6 text-center text-text-sub text-base">
                暂无可用支付方式
              </div>
            ) : (
              <div className="space-y-4">
                {MOCK_DATA.paymentMethods.map((method) => {
                  const Icon = method.icon;
                  const isSelected = selectedPayment === method.id;
                  return (
                    <div 
                      key={method.id}
                      onClick={() => setSelectedPayment(method.id)}
                      className="flex items-center justify-between cursor-pointer group"
                    >
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${method.bg} ${method.color}`}>
                          <Icon size={18} />
                        </div>
                        <div>
                          <div className="text-md font-medium text-text-main">{method.name}</div>
                          <div className="text-sm text-text-sub mt-0.5">{method.desc}</div>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                        isSelected 
                          ? 'border-brand-red bg-brand-red' 
                          : 'border-gray-300 dark:border-gray-600 group-hover:border-brand-red/50'
                      }`}>
                        {isSelected && <CheckCircle2 size={14} className="text-white" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Security Hint */}
          <div className="flex items-start px-2 py-1">
            <ShieldCheck size={14} className="text-green-500 mr-1.5 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-text-sub leading-relaxed">
              为保障您的资金安全，请确认是本人操作。谨防各类诈骗，平台不会以任何理由要求您私下转账。
            </span>
          </div>

        </div>
      </div>

      {/* Bottom Fixed Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-border-light px-4 py-3 pb-safe shadow-[0_-4px_16px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_16px_rgba(0,0,0,0.2)]">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-text-sub mb-0.5">应付金额</div>
            <div className="text-4xl font-bold text-brand-red font-mono">
              <span className="text-md mr-0.5">¥</span>
              {numAmount > 0 ? numAmount.toFixed(2) : '0.00'}
            </div>
          </div>
          <Button 
            className={`w-[140px] h-12 rounded-full font-medium text-lg ${
              isSubmitDisabled 
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500' 
                : 'bg-gradient-to-r from-brand-start to-brand-end text-white shadow-md shadow-red-500/20 active:scale-[0.98]'
            }`}
            disabled={isSubmitDisabled}
            onClick={handleSubmit}
          >
            {isSubmitting ? '处理中...' : '确认充值'}
          </Button>
        </div>
      </div>
    </div>
  );
}
