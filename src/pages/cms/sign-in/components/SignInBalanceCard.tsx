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
}) => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-lg text-center relative overflow-hidden">
      <div className="absolute top-0 right-0 bg-red-100 text-red-600 text-xs px-2 py-1 rounded-bl-lg">
        已邀请 {inviteCount} 人
      </div>
      <div className="text-gray-500 text-sm mb-2">当前累计奖励 (元)</div>
      <div className="text-4xl font-bold text-red-600 mb-6">{balance.toFixed(2)}</div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={onSignIn}
          className={`flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-sm transition-all ${
            hasSignedIn
              ? 'bg-red-50 text-red-600 border border-red-200'
              : 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md active:scale-95'
          }`}
        >
          {hasSignedIn ? <History size={18} /> : <CalendarCheck size={18} />}
          {hasSignedIn ? '签到记录' : '每日签到'}
        </button>
        <button
          onClick={onInvite}
          className="flex items-center justify-center gap-2 bg-red-50 text-red-600 py-3 rounded-lg font-bold text-sm border border-red-100 active:bg-red-100 transition-all"
        >
          <Users size={18} />
          邀请好友
        </button>
      </div>
    </div>
  );
};

export default SignInBalanceCard;
