/**
 * @file Transfer/index.tsx - 转账页面
 * @description 用户转账页面，支持向其他用户进行余额转账。
 */

import React, { useState, useEffect } from 'react'; // React 核心 Hook
import { AlertCircle, ArrowDownRight, ArrowRight, CheckCircle2, ChevronDown, FileText, Info, ShieldCheck, X, XCircle } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAppNavigate } from '../../lib/navigation';
import { WalletPageHeader } from '../../components/layout/WalletPageHeader';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { PullToRefreshContainer } from '../../components/ui/PullToRefreshContainer';
import { getBillingPath } from '../../lib/billing';

// Mock Data
const MOCK_DATA = {
  sourceAccount: {
    name: '专项金',
    available: 10000.00,
    frozen: 2500.00,
  },
  targetAccounts: [
    { id: 'confirmation', name: '确权金', balance: 500.00, feeRate: 0.01, desc: '用于资产确权' },
    { id: 'consumption', name: '消费金', balance: 1200.00, feeRate: 0, desc: '用于商城消费，无手续费' },
    { id: 'withdrawable', name: '可提现余额', balance: 8800.00, feeRate: 0.02, desc: '可直接提现至银行卡' },
  ],
  rules: {
    minAmount: 100,
    dailyLimit: 50000,
    dailyCountLimit: 5,
    remainingCount: 3,
    arrivalText: '预计实时到账'
  }
};

export function TransferPage() {
  const { goBack, goTo } = useAppNavigate();
  const { showToast } = useFeedback();
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [error, setError] = useState<string | null>(null);
  
  const [amount, setAmount] = useState('');
  const [selectedTargetId, setSelectedTargetId] = useState('consumption');
  const [showTargetSelector, setShowTargetSelector] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearTimeout(timer);
    };
  }, []);

  const handleGoBack = () => {
    goBack();
  };

  const handleRefresh = async () => {
    setError(null);
    setIsLoading(true);

    await new Promise((resolve) => {
      window.setTimeout(() => {
        setIsLoading(false);
        resolve(undefined);
      }, 300);
    });
  };

  const handleGoHistory = () => {
    goTo(getBillingPath('transfer'));
  };

  const renderHeader = () => (
    <WalletPageHeader
      title="专项金划转"
      onBack={handleGoBack}
      action={{
        icon: FileText,
        label: '划转记录',
        onClick: handleGoHistory,
      }}
    />
  );

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) {
      setAmount(val);
    }
  };

  const handleSelectAll = () => {
    setAmount(MOCK_DATA.sourceAccount.available.toString());
  };

  const handleSubmit = () => {
    if (isSubmitDisabled) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      showToast({ message: `成功划转 ¥${amount} 至 ${selectedTarget?.name}`, type: 'success' });
      setAmount('');
      handleGoBack();
    }, 300);
  };

  const selectedTarget = MOCK_DATA.targetAccounts.find(t => t.id === selectedTargetId) || MOCK_DATA.targetAccounts[0];
  const numAmount = Number(amount);
  
  const fee = numAmount * selectedTarget.feeRate;
  const actualArrival = numAmount - fee;

  const isAmountExceed = numAmount > MOCK_DATA.sourceAccount.available;
  const isAmountTooLow = numAmount > 0 && numAmount < MOCK_DATA.rules.minAmount;
  const isNoCount = MOCK_DATA.rules.remainingCount <= 0;
  
  const isSubmitDisabled = 
    !amount || 
    numAmount <= 0 || 
    isAmountExceed || 
    isAmountTooLow || 
    isNoCount || 
    isSubmitting;

  if (isLoading) {
    return (
      <div className="h-full flex flex-col bg-bg-hover dark:bg-gray-900">
        {renderHeader()}
        <div className="p-4 space-y-4">
          <div className="h-32 bg-white dark:bg-gray-800 rounded-2xl animate-pulse" />
          <div className="h-48 bg-white dark:bg-gray-800 rounded-2xl animate-pulse" />
          <div className="h-32 bg-white dark:bg-gray-800 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col bg-bg-hover dark:bg-gray-900">
        {renderHeader()}
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
      {renderHeader()}

      {isOffline && (
        <div className="bg-orange-50 text-orange-500 text-base px-4 py-2 flex items-center dark:bg-orange-500/15 dark:text-orange-300">
          <AlertCircle size={14} className="mr-1.5 flex-shrink-0" />
          <span>当前网络不可用，请检查网络设置</span>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pb-[100px]">
        <div className="p-4 space-y-3">
          
          {/* Account Overview Card */}
          <Card className="p-4 bg-gradient-to-br from-red-50 to-white dark:from-gray-900 dark:to-gray-900 border-none relative overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-24 bg-red-100 dark:bg-transparent rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
            
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="flex-1">
                <div className="text-base text-text-sub mb-1">转出账户</div>
                <div className="text-xl font-bold text-text-main">{MOCK_DATA.sourceAccount.name}</div>
                <div className="text-sm text-text-sub mt-1">
                  可用: <span className="font-mono text-text-main">¥{MOCK_DATA.sourceAccount.available.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="px-4 flex flex-col items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-900 shadow-sm flex items-center justify-center text-brand-red dark:text-red-300">
                  <ArrowRight size={16} />
                </div>
              </div>

              <div className="flex-1 text-right">
                <div className="text-base text-text-sub mb-1">转入账户</div>
                <div 
                  className="text-xl font-bold text-text-main flex items-center justify-end cursor-pointer active:opacity-70"
                  onClick={() => setShowTargetSelector(true)}
                >
                  {selectedTarget.name}
                  <ChevronDown size={16} className="ml-1 text-text-sub" />
                </div>
                <div className="text-sm text-text-sub mt-1">
                  余额: <span className="font-mono text-text-main">¥{selectedTarget.balance.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <div className="pt-3 border-t border-border-light/50 flex items-center justify-between text-sm">
              <span className="text-text-sub">专项金冻结金额</span>
              <span className="font-mono text-text-main">¥{MOCK_DATA.sourceAccount.frozen.toFixed(2)}</span>
            </div>
          </Card>

          {/* Transfer Amount Card */}
          <Card className="p-4">
            <h3 className="text-lg font-medium text-text-main mb-4">划转金额</h3>
            
            <div className={`flex items-center border-b pb-2 mb-3 transition-colors ${isAmountExceed ? 'border-red-500' : 'border-border-light'}`}>
              <span className="text-5xl font-medium text-text-main mr-2">¥</span>
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={handleAmountChange}
                placeholder="请输入划转金额"
                className="flex-1 min-w-0 text-6xl font-bold text-text-main bg-transparent outline-none placeholder:text-gray-300 dark:placeholder:text-gray-600 font-mono"
              />
              {amount && (
                <button 
                  onClick={() => setAmount('')}
                  className="p-1 text-gray-300 hover:text-gray-400 dark:text-gray-600 dark:hover:text-gray-500 mr-2 shrink-0"
                >
                  <XCircle size={20} />
                </button>
              )}
              <button 
                onClick={handleSelectAll}
                className="text-md font-medium text-brand-red active:opacity-70 pl-3 border-l border-border-light whitespace-nowrap shrink-0"
              >
                全部
              </button>
            </div>

            {/* Error Messages */}
            {isAmountExceed && (
              <div className="text-sm text-red-500 mb-3 flex items-center">
                <AlertCircle size={12} className="mr-1" />
                输入金额超过可用余额
              </div>
            )}
            {isAmountTooLow && (
              <div className="text-sm text-red-500 mb-3 flex items-center">
                <AlertCircle size={12} className="mr-1" />
                最低划转金额为 ¥{MOCK_DATA.rules.minAmount}
              </div>
            )}

            {/* Rules */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-sub">手续费率</span>
                <span className="text-text-main font-medium">{selectedTarget.feeRate * 100}%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-sub">到账时间</span>
                <span className="text-text-main font-medium">{MOCK_DATA.rules.arrivalText}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-sub">今日剩余次数</span>
                <span className={`font-medium ${isNoCount ? 'text-red-500' : 'text-text-main'}`}>
                  {MOCK_DATA.rules.remainingCount} / {MOCK_DATA.rules.dailyCountLimit}
                </span>
              </div>
            </div>
          </Card>

          {/* Confirmation Info Card */}
          {numAmount > 0 && !isAmountExceed && !isAmountTooLow && (
            <Card className="p-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <h3 className="text-lg font-medium text-text-main mb-3">确认信息</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-base">
                  <span className="text-text-sub">划转金额</span>
                  <span className="text-text-main font-mono">¥{numAmount.toFixed(2)}</span>
                </div>
                {fee > 0 && (
                  <div className="flex items-center justify-between text-base">
                    <span className="text-text-sub">手续费</span>
                    <span className="text-orange-500 font-mono">-¥{fee.toFixed(2)}</span>
                  </div>
                )}
                <div className="pt-3 border-t border-border-light flex items-center justify-between">
                  <span className="text-md font-medium text-text-main">实际到账</span>
                  <span className="text-3xl font-bold text-brand-red font-mono">¥{actualArrival.toFixed(2)}</span>
                </div>
              </div>
            </Card>
          )}

          {/* Security Hint */}
          <div className="flex items-start px-2 py-1 mt-2">
            <ShieldCheck size={14} className="text-green-500 mr-1.5 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-text-sub leading-relaxed">
              资金划转操作不可逆，请仔细核对转入账户及金额。如遇问题请联系客服。
            </span>
          </div>

        </div>
      </div>

      {/* Bottom Fixed Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-border-light px-4 py-3 pb-safe shadow-[0_-4px_16px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_16px_rgba(0,0,0,0.2)] z-20">
        <Button 
          className={`w-full h-12 rounded-full font-medium text-xl ${
            isSubmitDisabled 
              ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500' 
              : 'bg-gradient-to-r from-brand-start to-brand-end text-white shadow-md shadow-red-500/20 active:scale-[0.98]'
          }`}
          disabled={isSubmitDisabled}
          onClick={handleSubmit}
        >
          {isSubmitting ? '处理中...' : '确认划转'}
        </Button>
      </div>

      {/* Target Account Selector Modal */}
      {showTargetSelector && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setShowTargetSelector(false)}
          />
          <div className="bg-white dark:bg-gray-800 rounded-t-2xl relative z-10 animate-in slide-in-from-bottom-full duration-300 pb-safe">
            <div className="flex items-center justify-between p-4 border-b border-border-light">
              <h3 className="text-xl font-medium text-text-main">选择转入账户</h3>
              <button 
                onClick={() => setShowTargetSelector(false)}
                className="p-1 text-text-sub hover:text-text-main"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-2 max-h-[60vh] overflow-y-auto">
              {MOCK_DATA.targetAccounts.map((account) => {
                const isSelected = selectedTargetId === account.id;
                return (
                  <div 
                    key={account.id}
                    onClick={() => {
                      setSelectedTargetId(account.id);
                      setShowTargetSelector(false);
                    }}
                    className={`p-4 mb-2 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected 
                        ? 'bg-red-50 dark:bg-red-500/12 border border-brand-red/30 dark:border-red-500/30' 
                        : 'bg-white dark:bg-gray-900 border border-transparent active:bg-gray-50 dark:active:bg-gray-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center mb-1">
                        <span className="text-lg font-medium text-text-main mr-2">{account.name}</span>
                        {account.feeRate === 0 && (
                          <span className="text-xs bg-green-100 text-green-600 px-1.5 py-0.5 rounded-sm dark:bg-green-500/15 dark:text-green-300">免手续费</span>
                        )}
                      </div>
                      <div className="text-sm text-text-sub mb-1">{account.desc}</div>
                      <div className="text-sm text-text-sub">
                        当前余额: <span className="font-mono text-text-main">¥{account.balance.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      isSelected 
                        ? 'border-brand-red bg-brand-red' 
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {isSelected && <CheckCircle2 size={14} className="text-white" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


