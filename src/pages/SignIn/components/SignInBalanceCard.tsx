import React from 'react';
import { CalendarCheck, History, Users } from 'lucide-react';

interface SignInBalanceCardProps {
  inviteCount: number;
  balance: number;
  hasSignedIn: boolean;
  onSignIn: () => void;
  onInvite: () => void;
}

const SignInBalanceCard: React.FC<SignInBalanceCardProps> = ({
  inviteCount,
  balance,
  hasSignedIn,
  onSignIn,
  onInvite,
}) => (
  <div className="relative overflow-hidden rounded-xl border border-border-light bg-bg-card p-6 text-center shadow-soft">
    <div className="absolute top-0 right-0 rounded-bl-lg bg-red-100 px-2 py-1 text-xs text-red-600 dark:bg-red-500/15 dark:text-red-300">
      已邀请 {inviteCount} 人
    </div>
    <div className="mb-2 text-sm text-text-sub">当前累计奖励 (元)</div>
    <div className="mb-6 text-4xl font-bold text-red-600 dark:text-red-300">{balance.toFixed(2)}</div>

    <div className="grid grid-cols-2 gap-4">
      <button
        onClick={onSignIn}
        className={`flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-sm transition-all ${
          hasSignedIn
            ? 'border border-red-200 bg-red-50 text-red-600 dark:border-red-500/25 dark:bg-red-500/12 dark:text-red-300'
            : 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md active:scale-95'
        }`}
      >
        {hasSignedIn ? <History size={18} /> : <CalendarCheck size={18} />}
        {hasSignedIn ? '签到记录' : '每日签到'}
      </button>
      <button
        onClick={onInvite}
        className="flex items-center justify-center gap-2 rounded-lg border border-red-100 bg-red-50 py-3 text-sm font-bold text-red-600 transition-all active:bg-red-100 dark:border-red-500/20 dark:bg-red-500/12 dark:text-red-300 dark:active:bg-red-500/18"
      >
        <Users size={18} />
        邀请好友
      </button>
    </div>
  </div>
);

export default SignInBalanceCard;
