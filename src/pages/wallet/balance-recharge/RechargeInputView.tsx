import React from 'react';
import { ChevronLeft, Zap, Banknote, Wallet, Shield } from 'lucide-react';
import { LoadingSpinner } from '@/components/common';
import {
  AmountSelector,
  PaymentMethodCard,
  CustomAmountInput,
} from '../components/recharge';
import type { PaymentMethod } from '../hooks/usePaymentMethods';

interface RechargeInputViewProps {
  amount: string;
  onAmountChange: (value: string) => void;
  onBack: () => void;
  onShowHistory: () => void;
  transferAmount: string;
  onTransferAmountChange: (value: string) => void;
  withdrawableBalance: number;
  transferring: boolean;
  onTransfer: () => void;
  loading: boolean;
  availableMethods: PaymentMethod[];
  selectedMethod: string | null;
  onSelectMethod: (value: string | null) => void;
  onStartMatching: () => void;
}

const RechargeInputView: React.FC<RechargeInputViewProps> = ({
  amount,
  onAmountChange,
  onBack,
  onShowHistory,
  transferAmount,
  onTransferAmountChange,
  withdrawableBalance,
  transferring,
  onTransfer,
  loading,
  availableMethods,
  selectedMethod,
  onSelectMethod,
  onStartMatching,
}) => (
  <>
    <div className="bg-gradient-to-b from-red-100 to-gray-50 px-4 py-5 pt-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm text-gray-700"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-gray-900">专项金申购通道</h1>
        </div>
        <button
          onClick={onShowHistory}
          className="text-xs font-bold text-red-600 bg-white/50 px-3 py-1.5 rounded-full border border-red-100 flex items-center gap-1 hover:bg-white transition-colors"
        >
          <Banknote size={14} />
          充值记录
        </button>
      </div>

      <AmountSelector amount={amount} onAmountChange={onAmountChange} />

      <div className="bg-white rounded-[24px] p-6 shadow-xl shadow-blue-100/50 mb-4 border border-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Wallet className="text-blue-500" size={20} />
            <span className="text-sm font-bold text-gray-800">可提现余额划转</span>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">可提现余额</p>
            <p className="text-lg font-bold text-blue-600">¥{(withdrawableBalance ?? 0).toFixed(2)}</p>
          </div>
        </div>

        <CustomAmountInput
          amount={transferAmount}
          onAmountChange={onTransferAmountChange}
          label="划转金额"
          className="mb-4"
        />

        {transferAmount && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
            <p className="text-sm text-blue-700 font-medium">划转金额：¥{Number(transferAmount).toFixed(2)}</p>
            <p className="text-xs text-blue-600 mt-1">备注：余额划转</p>
          </div>
        )}

        <button
          onClick={onTransfer}
          disabled={!transferAmount || transferring}
          className={`w-full py-3 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 ${
            transferAmount && !transferring
              ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-200 active:scale-[0.98]'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
          }`}
        >
          {transferring ? (
            <>
              <LoadingSpinner className="w-5 h-5 border-white/20 border-t-white" />
              划转中...
            </>
          ) : (
            <>
              <Zap size={18} fill="currentColor" />
              立即划转到可用余额
            </>
          )}
        </button>

        <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
          <Shield size={12} />
          划转后资金可用于专项金申购
        </p>
      </div>
    </div>

    <div className="px-4 flex-1">
      <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
        <span className="w-1 h-4 bg-red-600 rounded-full"></span>
        选择支付通道
      </h2>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="md" className="text-red-500" />
        </div>
      ) : availableMethods.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 mb-6">
          {availableMethods.map((method) => (
            <PaymentMethodCard
              key={method.id}
              method={method}
              selected={selectedMethod === method.id}
              onSelect={onSelectMethod}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400 text-sm bg-gray-50 rounded-xl">暂无可用支付通道</div>
      )}
    </div>

    <div className="px-4 py-5 pb-safe bg-white/80 backdrop-blur border-t border-gray-100">
      <button
        onClick={onStartMatching}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white font-bold text-lg shadow-lg shadow-red-200 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
      >
        <Zap size={20} fill="currentColor" />
        立即接入匹配 · Match
      </button>
      <div className="text-center mt-3 text-[10px] text-gray-400">安全加密通道 | 资金存管保障 | 24H 实时到账</div>
    </div>
  </>
);

export default RechargeInputView;
