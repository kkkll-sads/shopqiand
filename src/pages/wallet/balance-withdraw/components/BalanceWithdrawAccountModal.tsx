import React from 'react';
import { X } from 'lucide-react';
import {
  getPaymentAccountTypeLabel,
  normalizePaymentAccountType,
  PaymentAccountItem,
} from '@/services';

interface BalanceWithdrawAccountModalProps {
  open: boolean;
  accounts: PaymentAccountItem[];
  selectedAccount: PaymentAccountItem | null;
  onClose: () => void;
  onSelect: (account: PaymentAccountItem) => void;
  onAddAccount: () => void;
}

const BalanceWithdrawAccountModal: React.FC<BalanceWithdrawAccountModalProps> = ({
  open,
  accounts,
  selectedAccount,
  onClose,
  onSelect,
  onAddAccount,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center animate-in fade-in"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="withdraw-account-modal-title"
        className="bg-white w-full rounded-t-[32px] p-6 pb-safe animate-in slide-in-from-bottom duration-300"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 id="withdraw-account-modal-title" className="text-lg font-bold text-gray-900">选择收款账户</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭收款账户弹窗"
            className="p-2 bg-gray-100 rounded-full text-gray-500"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {accounts.map((acc) => (
            <button
              type="button"
              key={acc.id}
              onClick={() => {
                onSelect(acc);
                onClose();
              }}
              className={`w-full p-4 rounded-xl border flex items-center gap-4 transition-all text-left ${
                selectedAccount?.id === acc.id ? 'border-red-600 bg-red-50/50 shadow-sm' : 'border-gray-100 bg-white'
              }`}
              aria-pressed={selectedAccount?.id === acc.id}
            >
              {(() => {
                const accountType = normalizePaymentAccountType(acc.type);
                const typeMark = accountType === 'alipay' ? '支' : '银';
                return (
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-xs">
                    {typeMark}
                  </div>
                );
              })()}
              <div className="flex-1">
                <div className="font-bold text-gray-900 flex items-center gap-2">
                  {acc.account_name || getPaymentAccountTypeLabel(acc.type, acc.type_text)}
                  {acc.is_default === 1 && (
                    <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded">默认</span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {getPaymentAccountTypeLabel(acc.type, acc.type_text)}
                  {(acc.account_number_display || acc.account || acc.account_number) &&
                    ` • ${acc.account_number_display || acc.account || acc.account_number}`}
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                  selectedAccount?.id === acc.id ? 'border-red-600 bg-red-600' : 'border-gray-300'
                }`}
              >
                {selectedAccount?.id === acc.id && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
            </button>
          ))}

          <button
            type="button"
            onClick={() => {
              onClose();
              onAddAccount();
            }}
            className="w-full py-3 rounded-xl border border-dashed border-gray-300 text-gray-500 text-sm font-medium hover:bg-gray-50 flex items-center justify-center gap-2"
          >
            + 添加新账户
          </button>
        </div>
      </div>
    </div>
  );
};

export default BalanceWithdrawAccountModal;
