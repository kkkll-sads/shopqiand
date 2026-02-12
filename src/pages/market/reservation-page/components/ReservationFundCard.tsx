import React from 'react';
import { Wallet, AlertCircle, Info } from 'lucide-react';

interface ReservationFundCardProps {
  userInfoLoading: boolean;
  frozenAmount: number;
  accountBalance: number;
  isFundSufficient: boolean;
}

const ReservationFundCard: React.FC<ReservationFundCardProps> = ({
  userInfoLoading,
  frozenAmount,
  accountBalance,
  isFundSufficient,
}) => {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-lg border border-gray-100">
      <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
          <Wallet size={18} className="text-blue-600 fill-blue-600" />
        </div>
        <span>资金冻结</span>
      </h3>

      <div className="flex justify-between text-sm text-gray-600 mb-2">
        <span>需冻结专项金（该场次最高价）</span>
        <span className="font-mono font-bold">¥{frozenAmount.toLocaleString()}</span>
      </div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-gray-500">当前专项金余额</span>
        {userInfoLoading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
            <span className="text-sm text-gray-500">加载中...</span>
          </div>
        ) : (
          <span className={`font-mono font-bold ${isFundSufficient ? 'text-gray-900' : 'text-red-500'}`}>
            ¥{accountBalance.toLocaleString()}
          </span>
        )}
      </div>

      <div className="mt-3 p-2 bg-blue-50 rounded-lg border border-blue-100">
        <div className="flex items-start gap-2">
          <Info size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 leading-relaxed">
            预约时将冻结该场次的最高金额，撮合成功后若实际藏品金额低于冻结金额，将自动退还差价
          </p>
        </div>
      </div>

      {!userInfoLoading && !isFundSufficient && (
        <div className="text-xs text-red-500 flex items-center gap-1 mt-2">
          <AlertCircle size={12} />
          余额不足，请充值
        </div>
      )}
    </div>
  );
};

export default ReservationFundCard;
