import React, { useEffect, useRef, useState } from 'react';

interface BalanceWithdrawPasswordModalProps {
  open: boolean;
  amount: string;
  payPassword: string;
  submitting: boolean;
  hasError: boolean;
  errorMessage: string;
  onClose: () => void;
  onPasswordChange: (value: string) => void;
  onConfirm: () => void | Promise<void>;
}

const BalanceWithdrawPasswordModal: React.FC<BalanceWithdrawPasswordModalProps> = ({
  open,
  amount,
  payPassword,
  submitting,
  hasError,
  errorMessage,
  onClose,
  onPasswordChange,
  onConfirm,
}) => {
  const [confirmLocked, setConfirmLocked] = useState(false);
  const submittingRef = useRef(submitting);
  const busy = submitting || confirmLocked;

  useEffect(() => {
    submittingRef.current = submitting;
  }, [submitting]);

  useEffect(() => {
    if (!open || !submitting) {
      setConfirmLocked(false);
    }
  }, [open, submitting]);

  const handleConfirmClick = () => {
    if (busy) return;

    setConfirmLocked(true);
    try {
      const result = onConfirm();
      void Promise.resolve(result).finally(() => {
        // 若未进入 submitting（例如前端校验失败），立即解锁允许用户修正后重试。
        if (!submittingRef.current) {
          setConfirmLocked(false);
        }
      });
    } catch {
      setConfirmLocked(false);
    }
  };

  useEffect(() => {
    if (!open || busy) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, busy, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in"
      onClick={() => {
        if (!busy) onClose();
      }}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="withdraw-password-title"
        aria-describedby="withdraw-password-desc"
        className="bg-white w-full max-w-sm rounded-[24px] p-6 shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="text-center mb-6">
          <h3 id="withdraw-password-title" className="text-lg font-bold text-gray-900">安全验证</h3>
          <p id="withdraw-password-desc" className="text-xs text-gray-400 mt-1">请输入支付密码以确认操作</p>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 mb-6 text-center">
          <div className="text-xs text-gray-500 mb-1">本次提现金额</div>
          <div className="text-2xl font-black text-gray-900 font-[DINAlternate-Bold]">¥ {amount}</div>
        </div>

        <label htmlFor="withdraw-pay-password" className="sr-only">
          支付密码
        </label>
        <input
          id="withdraw-pay-password"
          type="password"
          autoFocus
          value={payPassword}
          onChange={(event) => onPasswordChange(event.target.value)}
          disabled={busy}
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-center text-lg tracking-[8px] font-bold outline-none focus:border-red-600 focus:bg-white transition-all mb-4"
          placeholder="••••••"
          maxLength={6}
        />

        {hasError && <div className="text-xs text-center text-red-500 mb-4">{errorMessage}</div>}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleConfirmClick}
            disabled={busy}
            className="flex-1 py-3 rounded-xl bg-gray-900 text-white font-bold text-sm shadow-lg shadow-gray-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {busy ? '提交中...' : '确认提交'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BalanceWithdrawPasswordModal;
