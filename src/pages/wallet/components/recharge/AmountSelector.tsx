/**
 * AmountSelector - 金额选择器组件
 */
import React from 'react';
import { Wallet, Shield, X } from 'lucide-react';

interface AmountSelectorProps {
  amount: string;
  onAmountChange: (amount: string) => void;
}

const QUICK_AMOUNTS = [100, 500, 1000, 2000, 5000, 10000];

const AmountSelector: React.FC<AmountSelectorProps> = ({
  amount,
  onAmountChange,
}) => {
  return (
    <div className="bg-white rounded-[24px] p-6 shadow-xl shadow-red-100/50 mb-4 border border-white">
      <div className="flex items-center gap-2 mb-3">
        <Wallet className="text-red-600" size={20} />
        <span className="text-sm font-bold text-gray-800">申购金额</span>
      </div>
      <div className="flex items-center gap-1 pb-3 border-b-2 border-gray-100 focus-within:border-red-500 transition-colors">
        <span className="text-2xl font-bold text-gray-400">¥</span>
        <input
          type="number"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          placeholder="0"
          className="flex-1 w-full min-w-0 text-[36px] font-bold bg-transparent border-none focus:ring-0 outline-none p-0 placeholder-gray-200 text-gray-900 leading-tight"
          style={{ fontSize: '36px' }}
        />
        {amount && (
          <button
            onClick={() => onAmountChange('')}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Quick Amounts */}
      <div className="grid grid-cols-4 gap-2 mt-4">
        {QUICK_AMOUNTS.map((val) => (
          <button
            key={val}
            onClick={() => onAmountChange(String(val))}
            className={`py-2 rounded-lg text-sm font-bold transition-all ${
              amount === String(val)
                ? 'bg-red-50 text-red-600 border border-red-200 shadow-sm'
                : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-transparent'
            }`}
          >
            {val}
          </button>
        ))}
      </div>

      <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
        <Shield size={12} />
        资金由第三方银行全流程监管
      </p>
    </div>
  );
};

export default AmountSelector;
