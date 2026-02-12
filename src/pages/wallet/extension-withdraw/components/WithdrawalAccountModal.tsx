import React from 'react';
import { X } from 'lucide-react';
import { PaymentAccountItem } from '@/services';

interface WithdrawalAccountModalProps {
  open: boolean;
  loading: boolean;
  accounts: PaymentAccountItem[];
  selectedAccount: PaymentAccountItem | null;
  onClose: () => void;
  onSelectAccount: (account: PaymentAccountItem) => void;
  onNavigateCardManagement: () => void;
}

const WithdrawalAccountModal: React.FC<WithdrawalAccountModalProps> = ({
  open,
  loading,
  accounts,
  selectedAccount,
  onClose,
  onSelectAccount,
  onNavigateCardManagement,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-20 bg-black/70 flex items-end justify-center" onClick={onClose}>
      <div
        className="bg-white rounded-t-2xl w-full max-h-[70vh] overflow-y-auto"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <span className="font-bold text-gray-900">选择收款账户</span>
          <button onClick={onClose}>
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {loading && <div className="text-center py-8 text-gray-500 text-sm">加载中...</div>}

        {!loading && accounts.length === 0 && (
          <div className="text-center py-8 space-y-3">
            <div className="text-gray-400 text-sm">暂无绑定的收款账户</div>
            <button
              className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg"
              onClick={() => {
                onClose();
                onNavigateCardManagement();
              }}
            >
              去添加收款账户
            </button>
          </div>
        )}

        {!loading && accounts.length > 0 && (
          <div className="p-4 space-y-3">
            {accounts.map((item) => {
              const isSelected = selectedAccount?.id === item.id;
              return (
                <div
                  key={item.id}
                  className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                    isSelected ? 'border-red-500 bg-red-50' : 'border-gray-100 bg-gray-50'
                  }`}
                  onClick={() => {
                    onSelectAccount(item);
                    onClose();
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-800">
                      {item.account_name || item.type_text}
                    </span>
                    <span className="text-xs text-red-600">{item.type_text}</span>
                  </div>
                  <div className="text-xs text-gray-600">{item.account}</div>
                </div>
              );
            })}

            <button
              className="w-full text-center text-sm text-red-600 py-2"
              onClick={() => {
                onClose();
                onNavigateCardManagement();
              }}
            >
              管理账户
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WithdrawalAccountModal;
