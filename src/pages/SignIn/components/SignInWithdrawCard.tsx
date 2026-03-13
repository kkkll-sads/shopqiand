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
  <div className="rounded-xl border border-border-light bg-bg-card p-4 shadow-soft">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <Wallet size={18} className="text-orange-500" />
          <span className="text-sm font-bold text-text-main">可提现余额</span>
        </div>
        <div className="text-2xl font-bold text-text-main">
          ¥ {currentBalance.toFixed(2)}
        </div>
        {!canWithdraw && deficitAmount > 0 && (
          <div className="mt-1 text-xs text-text-aux">
            还差 <span className="font-medium text-red-500 dark:text-red-300">{deficitAmount.toFixed(2)}</span> 元可提现
          </div>
        )}
      </div>
      <button
        onClick={onWithdraw}
        disabled={!canWithdraw}
        className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
          canWithdraw
            ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow active:scale-95'
            : 'cursor-not-allowed bg-bg-base text-text-aux dark:bg-bg-hover'
        }`}
      >
        立即提现
      </button>
    </div>
  </div>
);

export default SignInWithdrawCard;
