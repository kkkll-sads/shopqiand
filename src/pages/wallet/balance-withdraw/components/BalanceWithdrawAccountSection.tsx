import React from 'react';
import { ChevronRight, CreditCard } from 'lucide-react';
import { getPaymentAccountTypeLabel, PaymentAccountItem } from '@/services';

interface BalanceWithdrawAccountSectionProps {
  selectedAccount: PaymentAccountItem | null;
  remark: string;
  onOpenAccountModal: () => void;
  onRemarkChange: (value: string) => void;
}

const BalanceWithdrawAccountSection: React.FC<BalanceWithdrawAccountSectionProps> = ({
  selectedAccount,
  remark,
  onOpenAccountModal,
  onRemarkChange,
}) => {
  const selectedAccountNumber = selectedAccount
    ? selectedAccount.account_number_display || selectedAccount.account || selectedAccount.account_number || ''
    : '';
  const selectedAccountTypeLabel = selectedAccount
    ? getPaymentAccountTypeLabel(selectedAccount.type, selectedAccount.type_text)
    : '';
  const maskedAccountNumber = selectedAccountNumber ? selectedAccountNumber.slice(-4) : '****';

  return (
    <>
      <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
        <span className="w-1 h-4 bg-red-600 rounded-full" />
        收款账户
      </h2>

      <button
        type="button"
        onClick={onOpenAccountModal}
        aria-label="打开收款账户选择"
        className="w-full bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between active:scale-[0.99] transition-transform cursor-pointer text-left"
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              selectedAccount ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-400'
            }`}
          >
            <CreditCard size={20} />
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900">
              {selectedAccount ? selectedAccount.account_name || '已选账户' : '选择收款账户'}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {selectedAccount
                ? `${selectedAccountTypeLabel} (${maskedAccountNumber})`
                : '点击选择绑定的银行卡/支付宝'}
            </div>
          </div>
        </div>
        <ChevronRight size={18} className="text-gray-300" />
      </button>

      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
        <div className="text-sm font-bold text-gray-900 w-16">备注</div>
        <input
          type="text"
          value={remark}
          onChange={(event) => onRemarkChange(event.target.value)}
          placeholder="请输入提现备注 (选填)"
          className="flex-1 text-sm text-gray-900 outline-none placeholder:text-gray-400"
        />
      </div>
    </>
  );
};

export default BalanceWithdrawAccountSection;
