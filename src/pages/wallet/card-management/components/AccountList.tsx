import React from 'react';
import { CreditCard } from 'lucide-react';
import { LoadingSpinner } from '@/components/common';
import type { PaymentAccountItem } from '@/services';
import AccountListItem from './AccountListItem';

interface AccountListProps {
  loading: boolean;
  hasListError: boolean;
  listErrorMessage: string;
  accounts: PaymentAccountItem[];
  onEdit: (item: PaymentAccountItem) => void;
  onDelete: (item: PaymentAccountItem) => void;
}

const getItemKey = (item: PaymentAccountItem) => {
  const id = item.id === null || item.id === undefined ? '' : String(item.id);
  const account = item.account_number_display || item.account || item.account_number || '';
  const typeText = item.type_text || item.type || '卡号';
  return id || `${typeText}-${account}`;
};

const AccountList: React.FC<AccountListProps> = ({
  loading,
  hasListError,
  listErrorMessage,
  accounts,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="p-4 space-y-3 pb-24">
      {loading && <LoadingSpinner text="加载中..." />}

      {!loading && hasListError && (
        <div className="bg-red-50 text-red-600 text-xs px-3 py-2 rounded-md">{listErrorMessage}</div>
      )}

      {!loading && !hasListError && accounts.length === 0 && (
        <div className="mt-12 flex flex-col items-center text-gray-400 text-sm">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
            <CreditCard size={26} className="text-gray-300" />
          </div>
          <div>没有任何账户</div>
        </div>
      )}

      {!loading &&
        !hasListError &&
        accounts.length > 0 &&
        accounts.map((item) => (
          <AccountListItem key={getItemKey(item)} item={item} onEdit={onEdit} onDelete={onDelete} />
        ))}
    </div>
  );
};

export default AccountList;
