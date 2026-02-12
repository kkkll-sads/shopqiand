import React from 'react';
import { Banknote, ChevronLeft, Wallet } from 'lucide-react';

interface BalanceWithdrawHeaderCardProps {
  loadingBalance: boolean;
  balance: string;
  amount: string;
  feeRate: number;
  onBack: () => void;
  onOpenOrders: () => void;
  onAmountChange: (value: string) => void;
  onFillAll: () => void;
}

const BalanceWithdrawHeaderCard: React.FC<BalanceWithdrawHeaderCardProps> = ({
  loadingBalance,
  balance,
  amount,
  feeRate,
  onBack,
  onOpenOrders,
  onAmountChange,
  onFillAll,
}) => {
  const parsedAmount = Number.parseFloat(amount);
  const safeAmount = Number.isFinite(parsedAmount) && parsedAmount > 0 ? parsedAmount : 0;
  const estimatedArrival = (safeAmount * (1 - feeRate)).toFixed(2);

  return (
    <div className="bg-gradient-to-b from-red-100 to-gray-50 p-5 pt-4">
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="返回上一页"
          className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm text-gray-700"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-gray-900">收益提现</h1>
      </div>
      <button
        type="button"
        onClick={onOpenOrders}
        className="text-xs font-bold text-red-600 bg-white/50 px-3 py-1.5 rounded-full border border-red-100 flex items-center gap-1 hover:bg-white transition-colors"
      >
        <Banknote size={14} />
        提现记录
      </button>
    </div>

    <div className="bg-white rounded-[24px] p-6 shadow-xl shadow-red-100/50 mb-6 border border-red-50 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-bl-[100px] -z-0 opacity-50" />

      <div className="relative z-10">
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm font-bold text-gray-400 tracking-wide flex items-center gap-2">
            <Wallet size={14} />
            提现金额
          </div>
          <div className="text-xs text-gray-400">可提现: {loadingBalance ? '...' : balance}</div>
        </div>

        <div className="flex items-center gap-1 pb-3 border-b-2 border-gray-100 focus-within:border-red-500 transition-colors">
          <span className="text-2xl font-bold text-gray-400">¥</span>
          <input
            type="number"
            value={amount}
            onChange={(event) => onAmountChange(event.target.value)}
            placeholder="0"
            inputMode="decimal"
            min="0"
            className="flex-1 text-[36px] font-bold text-gray-900 bg-transparent outline-none placeholder:text-gray-200 font-[DINAlternate-Bold] leading-tight"
            style={{ fontSize: '36px' }}
          />
          <button
            type="button"
            onClick={onFillAll}
            className="text-xs font-bold text-red-600 px-3 py-1.5 bg-red-50 rounded-lg whitespace-nowrap"
          >
            全部
          </button>
        </div>

        <div className="mt-4 flex justify-between text-xs">
          <span className="text-gray-400">预计到账</span>
          <span className="text-gray-900 font-bold">
            ¥ {estimatedArrival}
          </span>
        </div>
      </div>
    </div>
  </div>
  );
};

export default BalanceWithdrawHeaderCard;
