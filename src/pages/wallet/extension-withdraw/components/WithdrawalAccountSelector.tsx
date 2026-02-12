import React from 'react';
import { ChevronRight } from 'lucide-react';
import { PaymentAccountItem } from '@/services';

interface WithdrawalAccountSelectorProps {
  selectedAccount: PaymentAccountItem | null;
  onOpen: () => void;
}

const WithdrawalAccountSelector: React.FC<WithdrawalAccountSelectorProps> = ({
  selectedAccount,
  onOpen,
}) => (
  <div
    className="bg-white rounded-xl p-3 shadow-sm flex justify-between items-center cursor-pointer active:bg-gray-50"
    onClick={onOpen}
  >
    <span className="text-base text-gray-800">
      {selectedAccount
        ? `${selectedAccount.account_name || selectedAccount.type_text || '账户'} - ${
            selectedAccount.account?.slice(-4) || ''
          }`
        : '选择收款账户'}
    </span>
    <ChevronRight size={20} className="text-gray-400" />
  </div>
);

export default WithdrawalAccountSelector;
