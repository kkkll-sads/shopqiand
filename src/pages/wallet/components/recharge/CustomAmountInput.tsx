/**
 * CustomAmountInput - 自定义金额输入组件
 */
import React from 'react';
import { Wallet, Shield, X } from 'lucide-react';

interface CustomAmountInputProps {
  amount: string;
  onAmountChange: (amount: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

const CustomAmountInput: React.FC<CustomAmountInputProps> = ({
  amount,
  onAmountChange,
  label = '金额',
  placeholder = '0',
  className = '',
}) => {
  return (
    <div className={`bg-white rounded-[24px] p-6 shadow-xl shadow-blue-100/50 mb-4 border border-white ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Wallet className="text-blue-500" size={20} />
        <span className="text-sm font-bold text-gray-800">{label}</span>
      </div>
      <div className="flex items-center gap-1 pb-3 border-b-2 border-gray-100 focus-within:border-blue-500 transition-colors">
        <span className="text-2xl font-bold text-gray-400">¥</span>
        <input
          type="number"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          placeholder={placeholder}
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
      <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
        <Shield size={12} />
        安全加密通道
      </p>
    </div>
  );
};

export default CustomAmountInput;
