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
}) => (
  <div className="bg-white rounded-xl p-4 shadow-sm">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <Wallet size={18} className="text-orange-500" />
          <span className="text-sm font-bold text-gray-800">可提现余额</span>
        </div>
        <div className="text-2xl font-bold text-gray-900">
          ¥ {currentBalance.toFixed(2)}
        </div>
        {!canWithdraw && deficitAmount > 0 && (
          <div className="text-xs text-gray-400 mt-1">
            还差 <span className="text-red-500 font-medium">{deficitAmount.toFixed(2)}</span> 元可提现
          </div>
        )}
      </div>
      <button
        onClick={onWithdraw}
        disabled={!canWithdraw}
        className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
          canWithdraw
            ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow active:scale-95'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
      >
        立即提现
      </button>
    </div>
  </div>
);

export default SignInWithdrawCard;
