import React from 'react';
import {
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { useNotification } from '@/context/NotificationContext';
import { ReservationStatus } from '@/constants/statusEnums';
import type { ReservationDetailData } from '@/services/collection/trade';
import { copyWithToast } from '@/utils/copyWithToast';
import { formatTime } from '@/utils/format';
import MixedPaymentBadge from '@/pages/market/components/MixedPaymentBadge';
import PaymentSplitRows from '@/pages/market/components/PaymentSplitRows';
import {
  formatPaymentValue,
  getReservationPaymentLabel,
  getReservationPaymentSummary,
  type ReservationPaymentSplit,
} from '@/pages/market/utils/reservationPayment';
import { getReservationStatusConfig } from './statusConfig';

interface ReservationDetailBodyProps {
  record: ReservationDetailData;
  onGoCollection: () => void;
}

interface PaymentSummaryPanelProps {
  title: string;
  split: ReservationPaymentSplit;
  className?: string;
  titleClassName?: string;
  valueClassName?: string;
}

const TEXT = {
  statusLabel: '\u9884\u7EA6\u72B6\u6001',
  reservationId: '\u9884\u7EA6\u7F16\u53F7',
  reservationIdCopied: '\u9884\u7EA6\u7F16\u53F7\u5DF2\u590D\u5236\u5230\u526A\u8D34\u677F',
  sessionInfo: '\u573A\u6B21\u4FE1\u606F',
  sessionName: '\u573A\u6B21\u540D\u79F0',
  sessionTime: '\u65F6\u95F4\u6BB5',
  zoneName: '\u4EF7\u683C\u5206\u533A',
  zoneRange: '\u5206\u533A\u8303\u56F4',
  paymentInfo: '\u652F\u4ED8\u4FE1\u606F',
  originalFreeze: '\u539F\u51BB\u7ED3',
  actualPayment: '\u5B9E\u9645\u652F\u4ED8',
  refundReturn: '\u9000\u6B3E\u8FD4\u8FD8',
  extraBet: '\u989D\u5916\u52A0\u6CE8',
  refundedDiff: '\u5DF2\u9000\u8FD8\u5DEE\u4EF7',
  refundSplit: '\u9000\u6B3E\u62C6\u5206',
  refundBack: '\u539F\u8DEF\u9000\u56DE',
  wonItem: '\u4E2D\u7B7E\u85CF\u54C1',
  orderId: '\u8BA2\u5355\u7F16\u53F7',
  orderIdCopied: '\u8BA2\u5355\u7F16\u53F7\u5DF2\u590D\u5236\u5230\u526A\u8D34\u677F',
  rewardHint: '\u606D\u559C\u83B7\u5F97\u8BE5\u85CF\u54C1',
  timeline: '\u65F6\u95F4\u7EBF',
  submitTime: '\u63D0\u4EA4\u65F6\u95F4',
  matchTime: '\u64AE\u5408\u65F6\u95F4',
  updateTime: '\u66F4\u65B0\u65F6\u95F4',
  viewCollection: '\u53BB\u6301\u4ED3\u67E5\u770B',
};
const MONEY_SYMBOL = '\u00A5';

const cx = (...classNames: Array<string | false | null | undefined>) =>
  classNames.filter(Boolean).join(' ');

const formatDateTime = (value?: number | string) => {
  if (!value) {
    return '-';
  }

  if (typeof value === 'number') {
    return formatTime(value);
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return '-';
  }

  return /^\d+$/.test(trimmedValue) ? formatTime(Number(trimmedValue)) : trimmedValue;
};

const PaymentSummaryPanel: React.FC<PaymentSummaryPanelProps> = ({
  title,
  split,
  className,
  titleClassName,
  valueClassName,
}) => {
  if (!split.hasValue) {
    return null;
  }

  return (
    <div className={cx('rounded-xl border px-3.5 py-3', className)}>
      <div className={cx('mb-3 text-sm font-medium', titleClassName)}>{title}</div>
      {split.rows.length ? (
        <PaymentSplitRows rows={split.rows} />
      ) : (
        <div className={cx('text-base font-bold', valueClassName)}>{split.totalText}</div>
      )}
    </div>
  );
};

const ReservationDetailBody: React.FC<ReservationDetailBodyProps> = ({
  record,
  onGoCollection,
}) => {
  const { showToast } = useNotification();
  const statusConfig = getReservationStatusConfig(record);
  const StatusIcon = statusConfig.icon;
  const pendingActivationGoldLabel =
    getReservationPaymentLabel('pending_activation_gold') ?? '\u5F85\u6FC0\u6D3B\u786E\u6743\u91D1';
  const paymentSummary = getReservationPaymentSummary(record);
  const refundDiff = Number(record.refund_diff ?? 0);
  const showApprovedRefund =
    record.status === ReservationStatus.APPROVED &&
    (refundDiff > 0 || paymentSummary.refund.hasValue);

  const handleCopy = async (value: string, description: string) => {
    await copyWithToast(value, showToast, {
      successDescription: description,
    });
  };

  return (
    <>
      <div className="mx-4 mt-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${statusConfig.gradient} shadow-md`}
            >
              <StatusIcon size={24} className="text-white" />
            </div>
            <div>
              <p className="mb-0.5 text-xs text-gray-500">{TEXT.statusLabel}</p>
              <p className="text-lg font-bold text-gray-900">{statusConfig.label}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-400">{TEXT.reservationId}</p>
            <div className="flex items-center justify-end gap-1.5">
              <p className="text-sm font-mono text-gray-600">#{record.id}</p>
              <button
                type="button"
                className="rounded-md p-1 text-gray-400 active:bg-gray-100"
                onClick={() => {
                  void handleCopy(String(record.id), TEXT.reservationIdCopied);
                }}
                aria-label={TEXT.reservationId}
              >
                <Copy size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100">
              <Calendar size={14} className="text-orange-600" />
            </div>
            {TEXT.sessionInfo}
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between border-b border-gray-50 py-2">
              <span className="text-gray-500">{TEXT.sessionName}</span>
              <span className="font-bold text-gray-900">{record.session_title || '-'}</span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-50 py-2">
              <span className="text-gray-500">{TEXT.sessionTime}</span>
              <span className="font-medium text-gray-700">
                {record.session_start_time} - {record.session_end_time}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-50 py-2">
              <span className="text-gray-500">{TEXT.zoneName}</span>
              <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text font-bold text-transparent">
                {record.zone_name || '-'}
              </span>
            </div>
            {record.zone_min_price !== undefined && record.zone_max_price !== undefined && (
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-500">{TEXT.zoneRange}</span>
                <span className="font-mono font-medium text-gray-700">
                  {MONEY_SYMBOL}
                  {record.zone_min_price} - {MONEY_SYMBOL}
                  {record.zone_max_price}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-start justify-between gap-3">
            <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-100">
                <Wallet size={14} className="text-green-600" />
              </div>
              {TEXT.paymentInfo}
            </h3>
            <MixedPaymentBadge
              type={record.pay_type}
              fallbackText={paymentSummary.payTypeLabel ?? record.pay_type_text}
              balanceAvailableAmount={paymentSummary.freeze.balanceAvailableAmount}
              pendingActivationGoldAmount={paymentSummary.freeze.pendingActivationGoldAmount}
              size="sm"
            />
          </div>

          <div className="space-y-3">
            <PaymentSummaryPanel
              title={TEXT.originalFreeze}
              split={paymentSummary.freeze}
              className="border-gray-100 bg-gray-50"
              titleClassName="text-gray-600"
              valueClassName="text-gray-900"
            />

            {record.extra_hashrate_cost !== undefined && Number(record.extra_hashrate_cost) > 0 && (
              <div className="flex items-center justify-between rounded-xl border border-amber-100 bg-amber-50 px-3.5 py-3 text-sm">
                <span className="font-medium text-amber-700">
                  {`${TEXT.extraBet}${pendingActivationGoldLabel}`}
                </span>
                <span className="text-base font-bold text-amber-700">
                  +{formatPaymentValue(record.extra_hashrate_cost, { prefix: MONEY_SYMBOL })}
                </span>
              </div>
            )}

            {record.status === ReservationStatus.APPROVED && (
              <PaymentSummaryPanel
                title={TEXT.actualPayment}
                split={paymentSummary.actual}
                className="border-emerald-100 bg-emerald-50"
                titleClassName="text-emerald-700"
                valueClassName="text-emerald-700"
              />
            )}

            {showApprovedRefund && (
              <div className="rounded-xl border border-green-100 bg-gradient-to-r from-emerald-50 to-green-50 p-4">
                {refundDiff > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-emerald-700">
                      <CheckCircle2 size={16} />
                      <span className="font-medium">{TEXT.refundedDiff}</span>
                    </span>
                    <span className="text-lg font-bold font-mono text-emerald-600">
                      +{formatPaymentValue(refundDiff, { prefix: MONEY_SYMBOL })}
                    </span>
                  </div>
                )}

                {paymentSummary.refund.hasValue && (
                  <div className={cx(refundDiff > 0 && 'mt-3 border-t border-green-100 pt-3')}>
                    <div className="mb-3 text-sm font-medium text-green-700">
                      {TEXT.refundSplit}
                    </div>
                    {paymentSummary.refund.rows.length ? (
                      <PaymentSplitRows rows={paymentSummary.refund.rows} />
                    ) : (
                      <div className="text-sm font-medium text-green-700">
                        {TEXT.refundBack} {paymentSummary.refund.totalText}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {record.status === ReservationStatus.REFUNDED && (
              <PaymentSummaryPanel
                title={TEXT.refundReturn}
                split={paymentSummary.refund}
                className="border-green-100 bg-green-50"
                titleClassName="text-green-700"
                valueClassName="text-green-700"
              />
            )}
          </div>
        </div>

        {record.status === ReservationStatus.APPROVED && record.item_title && (
          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100">
                <Award size={14} className="text-orange-600" />
              </div>
              {TEXT.wonItem}
            </h3>
            <div className="flex items-center gap-3 rounded-lg border border-orange-100 bg-orange-50 p-3">
              {record.item_image && (
                <img
                  src={record.item_image}
                  alt={record.item_title}
                  className="h-20 w-20 rounded-xl object-cover shadow-lg"
                />
              )}
              <div className="flex-1">
                <div className="mb-1 font-bold text-gray-900">{record.item_title}</div>
                {record.match_order_id && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <span>
                      {TEXT.orderId}: #{record.match_order_id}
                    </span>
                    <button
                      type="button"
                      className="rounded p-0.5 text-gray-400 active:bg-gray-100"
                      onClick={() => {
                        void handleCopy(String(record.match_order_id), TEXT.orderIdCopied);
                      }}
                      aria-label={TEXT.orderId}
                    >
                      <Copy size={11} />
                    </button>
                  </div>
                )}
                <div className="mt-2 flex items-center gap-1 text-xs text-orange-600">
                  <Sparkles size={12} />
                  <span>{TEXT.rewardHint}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100">
              <Clock size={14} className="text-gray-600" />
            </div>
            {TEXT.timeline}
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between border-b border-gray-50 py-2">
              <span className="text-gray-500">{TEXT.submitTime}</span>
              <span className="font-medium text-gray-700">{formatDateTime(record.create_time)}</span>
            </div>
            {record.match_time && (
              <div className="flex items-center justify-between border-b border-gray-50 py-2">
                <span className="text-gray-500">{TEXT.matchTime}</span>
                <span className="font-medium text-gray-700">{formatDateTime(record.match_time)}</span>
              </div>
            )}
            {record.update_time && (
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-500">{TEXT.updateTime}</span>
                <span className="font-medium text-gray-700">{formatDateTime(record.update_time)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {record.status === ReservationStatus.APPROVED && (
        <div className="fixed bottom-0 left-0 right-0 border-t border-gray-100 bg-white p-4 pb-safe">
          <button
            onClick={onGoCollection}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 py-3.5 font-bold text-white shadow-lg shadow-red-200 transition-all active:scale-[0.98]"
          >
            <Award size={18} />
            {TEXT.viewCollection}
          </button>
        </div>
      )}
    </>
  );
};

export default ReservationDetailBody;
