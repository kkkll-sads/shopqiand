import React from 'react';
import { CreditCard, Trash2, Edit2 } from 'lucide-react';
import {
  getPaymentAccountTypeLabel,
  normalizePaymentAccountType,
  type PaymentAccountItem,
} from '@/services';

interface AccountListItemProps {
  item: PaymentAccountItem;
  onEdit: (item: PaymentAccountItem) => void;
  onDelete: (item: PaymentAccountItem) => void;
}

const AccountListItem: React.FC<AccountListItemProps> = ({ item, onEdit, onDelete }) => {
  const accountType = normalizePaymentAccountType(item.type);
  const typeText = getPaymentAccountTypeLabel(item.type, item.type_text);
  const account = item.account_number_display || item.account || item.account_number || '';
  const bankName = item.bank_name || '';
  const branch = item.bank_branch || '';
  const holder = item.account_name || '';
  const isDefault = Number(item.is_default) === 1;
  return (
    <div className="bg-white rounded-lg px-4 py-3 shadow-sm border border-gray-100 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center text-red-600">
          {accountType === 'alipay' ? '支' : <CreditCard size={18} strokeWidth={1.7} />}
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900">{typeText}</span>
            {isDefault && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">
                默认
              </span>
            )}
          </div>
          {account && <span className="text-xs text-gray-700 mt-0.5 break-all">{account}</span>}
          {(bankName || branch || holder) && (
            <span className="text-[11px] text-gray-400 mt-0.5">
              {[bankName, branch, holder].filter(Boolean).join(' · ')}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className="p-1.5 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 active:opacity-80"
          onClick={() => onEdit(item)}
        >
          <Edit2 size={18} />
        </button>
        <button
          type="button"
          className="p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 active:opacity-80"
          onClick={() => onDelete(item)}
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};

export default AccountListItem;
