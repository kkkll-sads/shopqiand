import React from 'react';
import { X } from 'lucide-react';

interface WithdrawalPasswordModalProps {
  open: boolean;
  amount: string;
  payPassword: string;
  remark: string;
  submitting: boolean;
  hasError: boolean;
  errorMessage: string;
  onClose: () => void;
  onPayPasswordChange: (value: string) => void;
  onRemarkChange: (value: string) => void;
  onConfirm: () => void;
}

const WithdrawalPasswordModal: React.FC<WithdrawalPasswordModalProps> = ({
  open,
  amount,
  payPassword,
  remark,
  submitting,
  hasError,
  errorMessage,
  onClose,
  onPayPasswordChange,
  onRemarkChange,
  onConfirm,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-20 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 w-full max-w-sm" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <span className="font-bold text-lg text-gray-900">输入支付密码</span>
          <button onClick={onClose}>
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="mb-4">
          <div className="text-sm text-gray-500 mb-2">提现金额</div>
          <div className="text-2xl font-bold text-gray-900">¥ {amount}</div>
        </div>

        <div className="mb-4">
          <div className="text-sm text-gray-500 mb-2">备注 (可选)</div>
          <input
            type="text"
            placeholder="请输入备注信息"
            value={remark}
            onChange={(event) => onRemarkChange(event.target.value)}
            className="w-full border rounded-lg px-3 py-2 bg-gray-50 text-base outline-none focus:border-red-500"
          />
        </div>

        <input
          type="password"
          placeholder="请输入支付密码"
          className="w-full border border-gray-200 rounded-lg px-4 py-3 text-base outline-none focus:border-red-500 mb-4"
          value={payPassword}
          onChange={(event) => onPayPasswordChange(event.target.value)}
          autoFocus
        />

        {hasError && (
          <div className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded mb-4">{errorMessage}</div>
        )}

        <button
          className={`w-full rounded-lg py-3 text-base font-medium ${
            submitting
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
              : 'bg-red-600 text-white active:bg-red-700'
          }`}
          onClick={onConfirm}
          disabled={submitting}
        >
          {submitting ? '提交中...' : '确认提现'}
        </button>
      </div>
    </div>
  );
};

export default WithdrawalPasswordModal;
