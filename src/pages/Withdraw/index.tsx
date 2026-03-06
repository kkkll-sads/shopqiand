import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, FileText, Landmark, Wallet, 
  ChevronRight, XCircle, ShieldCheck, Info, 
  WifiOff, RefreshCcw, CheckCircle2, AlertCircle
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { useAppNavigate } from '../../lib/navigation';
import { PageHeader } from '../../components/layout/PageHeader';

export const WithdrawPage = () => {
  const { goTo, goBack } = useAppNavigate();

  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [moduleError, setModuleError] = useState(false);
  
  const [amount, setAmount] = useState('');
  const [selectedMethodId, setSelectedMethodId] = useState('bank_card_1');
  const [showMethodModal, setShowMethodModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);

  // Mock Data
  const withdrawableBalance = 12500.00;
  const withdrawingAmount = 500.00;
  const minWithdrawAmount = 10;
  const feeRate = 0.001; // 0.1%
  const minFee = 0.1;

  const methods = [
    { id: 'bank_card_1', name: '工商银行', type: 'bank', account: '**** **** **** 8888', icon: Landmark, color: 'text-blue-600' },
    { id: 'alipay_1', name: '支付宝', type: 'alipay', account: '138****8888', icon: Wallet, color: 'text-blue-500' },
  ];

  const selectedMethod = methods.find(m => m.id === selectedMethodId) || methods[0];

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleGoBack = () => {
    goBack();
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setAmount(value);
    }
  };

  const handleWithdrawAll = () => {
    setAmount(withdrawableBalance.toString());
  };

  const numAmount = parseFloat(amount) || 0;
  let fee = 0;
  if (numAmount > 0) {
    fee = Math.max(numAmount * feeRate, minFee);
  }
  const actualArrival = Math.max(0, numAmount - fee);

  const isAmountValid = numAmount >= minWithdrawAmount && numAmount <= withdrawableBalance;
  const isSubmitDisabled = !isAmountValid || loading || offline || moduleError;

  const renderHeader = () => (
    <div className="sticky top-0 z-40 bg-bg-base/90 backdrop-blur-md">
      <div className="flex items-center justify-between px-4 h-12">
        <button onClick={handleGoBack} className="p-1 -ml-1 active:opacity-70 text-text-main">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-2xl font-medium text-text-main">收益提现</h1>
        <button 
          className="p-1 -mr-1 active:opacity-70 text-text-main"
          onClick={() => alert('提现记录')}
        >
          <FileText size={20} />
        </button>
      </div>
    </div>
  );

  if (moduleError) {
    return (
      <div className="flex-1 flex flex-col bg-bg-base h-full">
        {renderHeader()}
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <RefreshCcw size={48} className="text-text-aux mb-4" />
          <p className="text-lg text-text-main mb-2">页面加载失败</p>
          <p className="text-base text-text-sub mb-6 text-center">请检查网络连接后重试</p>
          <button 
            onClick={() => {
              setLoading(true);
              setModuleError(false);
              setTimeout(() => setLoading(false), 1000);
            }}
            className="px-6 py-2 bg-gradient-to-r from-primary-start to-primary-end text-white rounded-full text-md font-medium shadow-sm active:opacity-80"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-red-50/30 relative h-full">
      {offline && (
        <div className="bg-red-50 text-primary-start px-4 py-2 flex items-center justify-between text-sm z-50 absolute top-12 left-0 right-0">
          <div className="flex items-center">
            <WifiOff size={14} className="mr-2" />
            <span>网络不稳定，请检查网络设置</span>
          </div>
          <button onClick={() => setOffline(false)} className="font-medium px-2 py-1 bg-white dark:bg-gray-900 rounded shadow-sm">刷新</button>
        </div>
      )}

      {renderHeader()}

      <div className="flex-1 overflow-y-auto no-scrollbar pb-[100px]">
        <div className="px-4 py-4 space-y-3">
          
          {/* Balance Overview */}
          <Card className="p-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-primary-start/5 to-transparent rounded-bl-full pointer-events-none"></div>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="w-24 h-4" />
                <Skeleton className="w-32 h-8" />
                <Skeleton className="w-48 h-3" />
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-base text-text-sub">可提现余额 (元)</span>
                  <button 
                    className="text-sm text-text-aux flex items-center active:opacity-70"
                    onClick={() => setShowRulesModal(true)}
                  >
                    提现规则 <Info size={12} className="ml-1" />
                  </button>
                </div>
                <div className="text-7xl font-bold text-primary-start mb-2 tracking-tight">
                  {withdrawableBalance.toFixed(2)}
                </div>
                {withdrawingAmount > 0 && (
                  <div className="text-sm text-text-sub flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mr-1.5"></span>
                    提现中金额：{withdrawingAmount.toFixed(2)} 元
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Receiving Method */}
          <Card className="p-0 overflow-hidden">
            {loading ? (
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center">
                  <Skeleton className="w-8 h-8 rounded-full mr-3" />
                  <div className="space-y-1.5">
                    <Skeleton className="w-20 h-4" />
                    <Skeleton className="w-32 h-3" />
                  </div>
                </div>
                <Skeleton className="w-4 h-4" />
              </div>
            ) : (
              <div 
                className="p-4 flex items-center justify-between cursor-pointer active:bg-bg-base transition-colors"
                onClick={() => setShowMethodModal(true)}
              >
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full bg-bg-base flex items-center justify-center mr-3 ${selectedMethod.color}`}>
                    <selectedMethod.icon size={18} />
                  </div>
                  <div>
                    <div className="text-lg font-medium text-text-main mb-0.5">{selectedMethod.name}</div>
                    <div className="text-sm text-text-sub">{selectedMethod.account}</div>
                  </div>
                </div>
                <div className="flex items-center text-text-aux">
                  <span className="text-sm mr-1">更换</span>
                  <ChevronRight size={16} />
                </div>
              </div>
            )}
          </Card>

          {/* Withdrawal Amount */}
          <Card className="p-4">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="w-20 h-4" />
                <Skeleton className="w-full h-12" />
                <Skeleton className="w-48 h-3" />
              </div>
            ) : (
              <>
                <div className="text-md font-medium text-text-main mb-3">提现金额</div>
                <div className="flex items-center border-b border-border-light pb-2 mb-3">
                  <span className="text-5xl font-medium text-text-main mr-2 shrink-0">¥</span>
                  <input
                    type="text"
                    value={amount}
                    onChange={handleAmountChange}
                    placeholder={`最低提现 ${minWithdrawAmount} 元`}
                    className="flex-1 text-6xl font-bold text-text-main bg-transparent outline-none placeholder:text-xl placeholder:font-normal placeholder:text-text-aux min-w-0"
                  />
                  {amount && (
                    <button 
                      onClick={() => setAmount('')}
                      className="p-1 text-text-aux active:text-text-sub shrink-0"
                    >
                      <XCircle size={16} />
                    </button>
                  )}
                  <div className="w-px h-4 bg-border-light mx-3 shrink-0"></div>
                  <button 
                    onClick={handleWithdrawAll}
                    className="text-md font-medium text-primary-start active:opacity-70 shrink-0 whitespace-nowrap"
                  >
                    全部
                  </button>
                </div>
                
                {/* Error/Hint Message */}
                <div className="min-h-[18px]">
                  {numAmount > withdrawableBalance ? (
                    <div className="text-sm text-primary-start flex items-center">
                      <AlertCircle size={12} className="mr-1" /> 输入金额超过可提现余额
                    </div>
                  ) : numAmount > 0 && numAmount < minWithdrawAmount ? (
                    <div className="text-sm text-primary-start flex items-center">
                      <AlertCircle size={12} className="mr-1" /> 最低提现金额为 {minWithdrawAmount} 元
                    </div>
                  ) : numAmount > 0 ? (
                    <div className="text-sm text-text-sub flex items-center justify-between">
                      <span>额外扣除手续费 ¥{fee.toFixed(2)}</span>
                      <span className="text-text-main">预计 <span className="font-medium">T+1</span> 到账</span>
                    </div>
                  ) : (
                    <div className="text-sm text-text-aux">
                      提现手续费 {feeRate * 100}%，最低 ¥{minFee}
                    </div>
                  )}
                </div>
              </>
            )}
          </Card>

          {/* Security Verification Hint */}
          {!loading && (
            <div className="flex items-start px-1 mt-4">
              <ShieldCheck size={14} className="text-green-500 mr-1.5 mt-0.5 shrink-0" />
              <p className="text-s text-text-sub leading-relaxed">
                为保障您的资金安全，提现操作可能需要进行短信验证或支付密码校验。请确保本人操作，谨防诈骗。
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Fixed Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-bg-card border-t border-border-light pb-safe z-40">
        <div className="max-w-[390px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-s text-text-sub mb-0.5">实际到账</span>
            <div className="flex items-baseline text-primary-start">
              <span className="text-md font-medium mr-0.5">¥</span>
              <span className="text-4xl font-bold">{actualArrival.toFixed(2)}</span>
            </div>
          </div>
          <button
            disabled={isSubmitDisabled}
            onClick={() => alert('提现请求已提交')}
            className={`w-[160px] h-[44px] rounded-full text-lg font-medium transition-all shadow-sm ${
              isSubmitDisabled 
                ? 'bg-bg-base text-text-aux border border-border-light shadow-none' 
                : 'bg-gradient-to-r from-primary-start to-primary-end text-white active:opacity-80'
            }`}
          >
            确认提现
          </button>
        </div>
      </div>

      {/* Method Selection Modal */}
      {showMethodModal && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowMethodModal(false)}></div>
          <div className="bg-bg-card rounded-t-[20px] w-full max-w-[390px] mx-auto relative z-10 flex flex-col max-h-[70vh] animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between p-4 border-b border-border-light">
              <h3 className="text-xl font-bold text-text-main">选择收款方式</h3>
              <button onClick={() => setShowMethodModal(false)} className="p-1 text-text-aux active:text-text-main">
                <XCircle size={20} />
              </button>
            </div>
            <div className="overflow-y-auto no-scrollbar p-2">
              {methods.map((method) => (
                <div 
                  key={method.id}
                  className="flex items-center justify-between p-3 rounded-xl active:bg-bg-base transition-colors cursor-pointer mb-1"
                  onClick={() => {
                    setSelectedMethodId(method.id);
                    setShowMethodModal(false);
                  }}
                >
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full bg-bg-base flex items-center justify-center mr-3 ${method.color}`}>
                      <method.icon size={18} />
                    </div>
                    <div>
                      <div className="text-lg font-medium text-text-main mb-0.5">{method.name}</div>
                      <div className="text-sm text-text-sub">{method.account}</div>
                    </div>
                  </div>
                  {selectedMethodId === method.id && (
                    <CheckCircle2 size={20} className="text-primary-start" />
                  )}
                </div>
              ))}
              <div 
                className="flex items-center justify-center p-4 mt-2 border border-dashed border-border-light rounded-xl text-text-sub text-md active:bg-bg-base cursor-pointer"
                onClick={() => alert('添加新收款方式')}
              >
                + 添加新收款方式
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rules Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowRulesModal(false)}></div>
          <Card className="w-full max-w-[320px] relative z-10 p-6 flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-text-main">提现规则说明</h3>
              <button onClick={() => setShowRulesModal(false)} className="text-text-aux active:text-text-main">
                <XCircle size={20} />
              </button>
            </div>
            <div className="space-y-4 text-base text-text-sub max-h-[60vh] overflow-y-auto no-scrollbar">
              <div>
                <h4 className="font-medium text-text-main mb-1">1. 提现额度</h4>
                <p>单笔最低提现金额为 {minWithdrawAmount} 元，单日最高提现限额为 50,000 元。</p>
              </div>
              <div>
                <h4 className="font-medium text-text-main mb-1">2. 提现手续费</h4>
                <p>提现将收取 {feeRate * 100}% 的手续费，单笔最低收取 {minFee} 元。手续费将从您的提现金额中额外扣除。</p>
              </div>
              <div>
                <h4 className="font-medium text-text-main mb-1">3. 到账时间</h4>
                <p>正常情况下，提现申请将在 T+1 个工作日内处理并打款至您的收款账户。节假日顺延。</p>
              </div>
              <div>
                <h4 className="font-medium text-text-main mb-1">4. 异常处理</h4>
                <p>如遇银行系统维护或网络异常，到账时间可能会有所延迟。如超过 3 个工作日未到账，请联系客服。</p>
              </div>
            </div>
            <button 
              className="w-full mt-6 py-2.5 bg-bg-base text-text-main rounded-full text-md font-medium active:bg-border-light transition-colors"
              onClick={() => setShowRulesModal(false)}
            >
              我知道了
            </button>
          </Card>
        </div>
      )}
    </div>
  );
};
