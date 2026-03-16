import { useEffect, useRef } from 'react';
import { CreditCard, X } from 'lucide-react';

interface RechargeBankCardConfirmModalProps {
  open: boolean;
  lastFourDigits: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  submitting: boolean;
}

export function RechargeBankCardConfirmModal({
  open,
  lastFourDigits,
  onChange,
  onClose,
  onConfirm,
  submitting,
}: RechargeBankCardConfirmModalProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [open]);

  if (!open) {
    return null;
  }

  const disabled = submitting || lastFourDigits.length !== 4;

  return (
    <div className="recharge-dark-scope fixed inset-0 z-[140] flex items-center justify-center px-5">
      <button
        type="button"
        aria-label="关闭银行卡尾号确认弹窗"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
        disabled={submitting}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="recharge-bank-card-confirm-title"
        className="relative z-10 w-full max-w-[360px] overflow-hidden rounded-[28px] bg-bg-card shadow-[0_20px_60px_rgba(15,23,42,0.25)] dark:shadow-[0_24px_64px_rgba(0,0,0,0.45)]"
      >
        <div className="relative overflow-hidden px-5 pb-5 pt-6">
          <div className="pointer-events-none absolute right-0 top-0 h-28 w-28 rounded-bl-full bg-gradient-to-bl from-red-100 to-transparent dark:from-red-500/20" />

          <div className="relative">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                  <CreditCard size={22} />
                </div>
                <div>
                  <h3 id="recharge-bank-card-confirm-title" className="text-lg font-semibold text-gray-900">
                    确认提交
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">请输入付款银行卡后四位号码</p>
                </div>
              </div>

              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors active:bg-gray-100"
                onClick={onClose}
                disabled={submitting}
              >
                <X size={18} />
              </button>
            </div>

            <div className="rounded-3xl border border-red-100 bg-gradient-to-br from-red-50 to-white p-4 dark:border-red-500/30 dark:from-red-500/10 dark:to-bg-card">
              <label htmlFor="recharge-bank-card-last-four" className="text-sm font-medium text-gray-700">
                银行卡尾号
              </label>
              <input
                id="recharge-bank-card-last-four"
                ref={inputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                maxLength={4}
                value={lastFourDigits}
                onChange={(event) => {
                  onChange(event.target.value.replace(/\D/g, '').slice(0, 4));
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !disabled) {
                    event.preventDefault();
                    onConfirm();
                  }
                }}
                placeholder="请输入 4 位数字"
                className="mt-3 h-14 w-full rounded-2xl border border-red-200 bg-white px-4 text-center font-mono text-2xl font-semibold tracking-[0.45em] text-gray-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
              />
              <p className="mt-3 text-xs leading-5 text-gray-500">
                为确保资金核验准确，请填写本次付款银行卡的后四位号码。
              </p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                className="h-12 rounded-2xl bg-gray-100 text-sm font-medium text-gray-600 transition-colors active:bg-gray-200"
                onClick={onClose}
                disabled={submitting}
              >
                取消
              </button>
              <button
                type="button"
                className={`h-12 rounded-2xl text-sm font-semibold text-white transition-all ${
                  disabled
                    ? 'cursor-not-allowed bg-gray-300 shadow-none'
                    : 'bg-gradient-to-r from-red-600 to-red-500 shadow-lg shadow-red-200 active:scale-[0.98]'
                }`}
                onClick={onConfirm}
                disabled={disabled}
              >
                {submitting ? '提交中...' : '确定'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
