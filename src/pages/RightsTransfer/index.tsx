/**
 * @file RightsTransfer/index.tsx - 确权转让页面
 * @description 用户将藏品确权转让给他人的操作页面。
 */

import React, { useState, useEffect } from 'react'; // React 核心 Hook
import { ChevronLeft, AlertCircle, ArrowRight, XCircle, ChevronDown, X, ShieldCheck, Eye, EyeOff, CheckCircle2, Info } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAppNavigate } from '../../lib/navigation';
import { PageHeader } from '../../components/layout/PageHeader';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { PullToRefreshContainer } from '../../components/ui/PullToRefreshContainer';

// Mock Data
const MOCK_DATA = {
  sourceAccount: {
    name: '确权金',
    available: 5000.00,
    frozen: 1000.00,
  },
  targetAccounts: [
    { id: 'withdrawable', name: '可提现余额', balance: 8800.00, feeRate: 0.02, desc: '可直接提现至银行卡', arrivalText: '预计2小时内到账' },
    { id: 'special', name: '专项金', balance: 10000.00, feeRate: 0, desc: '用于特定资产交易', arrivalText: '预计实时到账' },
    { id: 'consumption', name: '消费金', balance: 1200.00, feeRate: 0, desc: '用于商城消费，无手续费', arrivalText: '预计实时到账' },
  ],
  rules: {
    minAmount: 100,
  },
  conditions: [
    { id: 1, text: '完成实名认证', isMet: true },
    { id: 2, text: '历史交易次数 ≥ 5次', isMet: false },
  ]
};

export function RightsTransferPage() {
  const { goBack } = useAppNavigate();
  const { showToast } = useFeedback();
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [error, setError] = useState<string | null>(null);
  
  const [amount, setAmount] = useState('');
  const [selectedTargetId, setSelectedTargetId] = useState('withdrawable');
  const [showTargetSelector, setShowTargetSelector] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBalance, setShowBalance] = useState(true);

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
    showToast({ message: '跳转到划转记录', type: 'info' });
  };

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
  
  const unmetConditions = MOCK_DATA.conditions.filter(c => !c.isMet);
  const hasUnmetConditions = unmetConditions.length > 0;
  
  const isSubmitDisabled = 
    !amount || 
    numAmount <= 0 || 
    isAmountExceed || 
    isAmountTooLow || 
    hasUnmetConditions || 
    isSubmitting;

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
          <div className="h-32 bg-white dark:bg-gray-800 rounded-2xl animate-pulse" />
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
          <div className="flex-1 text-center font-medium text-2xl text-text-main">确权金划转</div>
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
        <div className="flex-1 text-center font-medium text-2xl text-text-main">确权金划转</div>
        <button onClick={handleGoHistory} className="text-md text-text-sub active:opacity-70 transition-opacity">
          划转记录
        </button>
      </div>

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
                <div className="text-base text-text-sub mb-1 flex items-center">
                  转出账户
                  <button onClick={() => setShowBalance(!showBalance)} className="ml-1.5 text-text-aux">
                    {showBalance ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                </div>
                <div className="text-xl font-bold text-text-main">{MOCK_DATA.sourceAccount.name}</div>
                <div className="text-sm text-text-sub mt-1">
                  可用: <span className="font-mono text-text-main">
                    {showBalance ? `¥${MOCK_DATA.sourceAccount.available.toFixed(2)}` : '****'}
                  </span>
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
                  余额: <span className="font-mono text-text-main">
                    {showBalance ? `¥${selectedTarget.balance.toFixed(2)}` : '****'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="pt-3 border-t border-border-light/50 flex items-center justify-between text-sm">
              <span className="text-text-sub">确权金冻结金额</span>
              <span className="font-mono text-text-main">
                {showBalance ? `¥${MOCK_DATA.sourceAccount.frozen.toFixed(2)}` : '****'}
              </span>
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
                <span className="text-text-main font-medium">{selectedTarget.arrivalText}</span>
              </div>
            </div>
          </Card>

          {/* Conditions Card */}
          <Card className="p-4">
            <h3 className="text-lg font-medium text-text-main mb-3 flex items-center">
              划转条件
              {hasUnmetConditions && <span className="ml-2 text-sm text-red-500 dark:text-red-300 font-normal">有未满足的条件</span>}
            </h3>
            <div className="space-y-3">
              {MOCK_DATA.conditions.map(condition => (
                <div key={condition.id} className="flex items-start">
                  {condition.isMet ? (
                    <CheckCircle2 size={16} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600 mr-2 mt-0.5 flex-shrink-0" />
                  )}
                  <span className={`text-base ${condition.isMet ? 'text-text-main' : 'text-text-sub'}`}>
                    {condition.text}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Risk Control Hint Card */}
          <Card className="p-3 bg-blue-50/50 dark:bg-blue-500/12 border border-blue-100 dark:border-blue-500/25">
            <div className="flex items-start">
              <Info size={16} className="text-blue-500 dark:text-blue-300 mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                为保障您的资金安全，大额划转或异常操作可能会触发风控审核，导致到账延迟。请确保本人操作，谨防诈骗。
              </div>
            </div>
          </Card>

        </div>
      </div>

      {/* Bottom Fixed Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-border-light px-4 py-3 pb-safe shadow-[0_-4px_16px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_16px_rgba(0,0,0,0.2)] z-20">
        <div className="flex items-center justify-between mb-3">
          <span className="text-md text-text-sub">实际到账</span>
          <span className="text-4xl font-bold text-brand-red font-mono">
            ¥{numAmount > 0 && !isAmountExceed && !isAmountTooLow ? actualArrival.toFixed(2) : '0.00'}
          </span>
        </div>
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
                    <div className="flex-1">
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
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ml-4 ${
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


