import React from 'react';
import { Wallet } from 'lucide-react';

interface SignInWithdrawCardProps {
  currentBalance: number;
  canWithdraw: boolean;
  deficitAmount: number;
  onWithdraw: () => void;
}

const SignInWithdrawCard: React.FC<SignInWithdrawCardProps> = ({
  currentBalance,
  canWithdraw,
  deficitAmount,
  onWithdraw,
}) => {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 font-bold text-gray-800">
          <Wallet className="text-red-500" size={20} />
          <span>提现申请</span>
        </div>
        <span className="text-xs text-gray-400">T+1 到账</span>
      </div>

      <div className="bg-gradient-to-br from-red-50 to-red-50/50 rounded-xl p-5 mb-4 relative overflow-hidden border border-red-100">
        <div className="absolute -right-3 -top-3 opacity-5 transform rotate-12">
          <Wallet size={80} className="text-red-500" />
        </div>
        <div className="flex items-center gap-1 text-gray-500 text-sm mb-2 relative z-10">
          <Wallet size={14} />
          <span>当前余额</span>
        </div>
        <div className="relative z-10 flex items-baseline">
          <span className="text-3xl font-bold text-gray-900 mr-1">{currentBalance.toFixed(2)}</span>
          <span className="text-sm font-normal text-gray-500">元</span>
        </div>
      </div>

      <button
        onClick={canWithdraw ? onWithdraw : undefined}
        disabled={!canWithdraw}
        className={`w-full py-3 rounded-lg font-bold text-sm transition-all shadow-sm ${
          canWithdraw
            ? 'bg-gradient-to-r from-red-500 to-red-600 text-white active:scale-[0.98] active:opacity-90'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
      >
        {canWithdraw ? '申请提现' : `余额不足10元，还差 ${deficitAmount.toFixed(2)} 元`}
      </button>
    </div>
  );
};

export default SignInWithdrawCard;
