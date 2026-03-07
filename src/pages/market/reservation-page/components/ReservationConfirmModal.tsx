import React from 'react';
import { Shield } from 'lucide-react';
import type { ReservationPaymentSummary } from '@/services';

interface ReservationConfirmModalProps {
  visible: boolean;
  loading: boolean;
  baseHashrate: number;
  extraHashrate: number;
  totalRequiredHashrate: number;
  quantity: number;
  frozenAmount: number;
  paymentSummary: ReservationPaymentSummary;
  paymentPreviewError: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

const TEXT = {
  title: '确认提交预约',
  hashrate: '消耗算力',
  quantity: '预约数量',
  totalFreeze: '冻结总额',
  payType: '支付方式',
  ratio: '冻结比例',
  cancel: '取消',
  confirm: '确认提交',
  specialFund: '专项金',
  pendingActivationGold: '待激活确权金',
  buildHashrateText: (base: number, extra: number) =>
    `基础 ${base} + 加注 ${extra}`,
} as const;

/** 信息行 */
const InfoRow: React.FC<{
  label: string;
  value: React.ReactNode;
  sub?: string;
  highlight?: boolean;
}> = ({ label, value, sub, highlight }) => (
  <div className="flex items-start justify-between py-2.5">
    <span className="text-[13px] text-gray-500">{label}</span>
    <div className="text-right">
      <span className={`text-[13px] font-bold tabular-nums ${highlight ? 'text-red-600' : 'text-gray-900'}`}>
        {value}
      </span>
      {sub && <div className="text-[10px] text-gray-400 mt-0.5">{sub}</div>}
    </div>
  </div>
);

const ReservationConfirmModal: React.FC<ReservationConfirmModalProps> = ({
  visible,
  loading,
  baseHashrate,
  extraHashrate,
  totalRequiredHashrate,
  quantity,
  frozenAmount,
  paymentSummary,
  paymentPreviewError,
  onClose,
  onConfirm,
}) => {
  if (!visible) return null;

  const displayFreezeAmount = paymentSummary.freezeAmount || frozenAmount;
  const hasSpecialFund = paymentSummary.specialFundFreezeAmount > 0;
  const hasPendingGold = paymentSummary.pendingActivationGoldFreezeAmount > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative z-10 w-full max-w-sm bg-white rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden">
        {/* 头部 */}
        <div className="px-5 pt-5 pb-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
            <Shield size={18} className="text-red-500" />
          </div>
          <h3 className="text-base font-bold text-gray-900">{TEXT.title}</h3>
        </div>

        {/* 内容区 */}
        <div className="px-5 divide-y divide-gray-50">
          <InfoRow
            label={TEXT.hashrate}
            value={totalRequiredHashrate.toFixed(0)}
            sub={TEXT.buildHashrateText(baseHashrate, extraHashrate)}
          />
          <InfoRow label={TEXT.quantity} value={`${quantity} 份`} />
          <InfoRow label={TEXT.totalFreeze} value={`¥${displayFreezeAmount.toLocaleString()}`} highlight />

          {/* 支付方式 */}
          <div className="py-2.5 flex items-center justify-between">
            <span className="text-[13px] text-gray-500">{TEXT.payType}</span>
            <span
              className={`text-[11px] font-medium rounded px-2 py-0.5 ${
                paymentSummary.isMixedPayment
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {paymentSummary.payTypeText}
            </span>
          </div>

          {/* 冻结拆分明细 — 仅在有值时展示 */}
          {(hasSpecialFund || hasPendingGold) && (
            <div className="py-2.5 space-y-1.5">
              {hasSpecialFund && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">{TEXT.specialFund}</span>
                  <span className="font-bold text-gray-800 tabular-nums">
                    ¥{paymentSummary.specialFundFreezeAmount.toLocaleString()}
                  </span>
                </div>
              )}
              {hasPendingGold && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">{TEXT.pendingActivationGold}</span>
                  <span className="font-bold text-gray-800 tabular-nums">
                    {paymentSummary.pendingActivationGoldFreezeAmount.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 冻结比例 */}
          <InfoRow label={TEXT.ratio} value={paymentSummary.ratioText} />
        </div>

        {/* 按钮区 */}
        <div className="px-5 pt-4 pb-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 active:bg-gray-50 transition-colors"
          >
            {TEXT.cancel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 h-11 flex items-center justify-center rounded-xl bg-red-500 text-sm font-bold text-white active:bg-red-600 transition-colors disabled:opacity-60"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              TEXT.confirm
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReservationConfirmModal;
