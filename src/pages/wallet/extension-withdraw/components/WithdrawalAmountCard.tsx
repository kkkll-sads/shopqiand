import React from 'react';
import { formatAmount } from '@/utils/format';

interface WithdrawalAmountCardProps {
  amount: string;
  balance: string;
  onAmountChange: (value: string) => void;
  onSelectAll: () => void;
}

const WithdrawalAmountCard: React.FC<WithdrawalAmountCardProps> = ({
  amount,
  balance,
  onAmountChange,
  onSelectAll,
}) => (
  <div className="bg-white rounded-xl p-3 shadow-sm">
    <div className="flex items-center gap-2 mb-4">
      <span className="text-base text-gray-800 font-medium">提现金额</span>
    </div>

    <div className="flex items-center border-b border-gray-100 pb-4">
      <span className="text-3xl text-gray-800 mr-2">¥</span>
      <input
        type="number"
        placeholder=""
        className="flex-1 bg-transparent outline-none text-3xl text-gray-900"
        value={amount}
        onChange={(event) => onAmountChange(event.target.value)}
      />
      <button onClick={onSelectAll} className="ml-2 text-sm text-red-600 font-medium whitespace-nowrap">
        全部提现
      </button>
    </div>

    <div className="mt-3 text-sm">
      <span className="text-gray-500">可提现拓展服务费 </span>
      <span className="text-gray-800">¥ {formatAmount(balance)}</span>
    </div>
  </div>
);

export default WithdrawalAmountCard;
