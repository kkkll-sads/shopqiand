import React from 'react';
import { ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import type { ReservationItem } from '@/services';
import { ReservationStatus } from '@/constants/statusEnums';
import { formatTime } from '@/utils/format';
import MixedPaymentBadge from '@/pages/market/components/MixedPaymentBadge';
import {
  formatPaymentValue,
  getReservationPaymentSummary,
  getReservationRefundInlineText,
  getReservationSplitInlineText,
} from '@/pages/market/utils/reservationPayment';
import ReservationRecordStatusBadge from './ReservationRecordStatusBadge';

interface ReservationRecordCardProps {
  record: ReservationItem;
  onClickDetail: (record: ReservationItem) => void;
  onGoCollection: () => void;
}

const TEXT = {
  defaultTitle: '\u76F2\u76D2\u9884\u7EA6',
  zonePrefix: '\u5206\u533A',
  sessionLabel: '\u573A\u6B21',
  freeze: '\u51BB\u7ED3',
  actual: '\u5B9E\u9645\u652F\u4ED8',
  refund: '\u9000\u6B3E\u8FD4\u8FD8',
  refundedDiff: '\u5DF2\u9000\u8FD8\u5DEE\u4EF7',
  pendingMatchPrefix: '\u9884\u8BA1',
  pendingMatchSuffix: '\u7ED3\u675F\u64AE\u5408',
  matchTime: '\u64AE\u5408:',
  refundedPrefix: '\u672A\u4E2D\u7B7E\uFF0C',
  refundedSuffix: '\u5DF2\u539F\u8DEF\u9000\u56DE',
  refundedFallback: '\u672A\u4E2D\u7B7E\uFF0C\u51BB\u7ED3\u5DF2\u9000\u56DE',
  goCollection: '\u53BB\u6301\u4ED3',
};
const MONEY = '\u00A5';

const fmtDT = (value?: number | string) => {
  if (!value) return '';
  if (typeof value === 'number') return formatTime(value, 'MM-DD HH:mm');
  const v = value.trim();
  if (!v) return '';
  return /^\d+$/.test(v) ? formatTime(Number(v), 'MM-DD HH:mm') : v;
};

/** 支付行：label ¥amount（拆分明细） */
const PayRow: React.FC<{
  label: string;
  total: string;
  split?: string;
  labelCls?: string;
  valueCls?: string;
  splitCls?: string;
}> = ({ label, total, split, labelCls = 'text-gray-500', valueCls = 'text-gray-900', splitCls = 'text-gray-400' }) => (
  <div className="flex items-start justify-between gap-3 leading-5">
    <span className={`text-xs flex-shrink-0 mt-0.5 ${labelCls}`}>{label}</span>
    <div className="text-right min-w-0 flex flex-col items-end flex-1">
      <span className={`text-sm font-bold tabular-nums truncate max-w-full ${valueCls}`}>{total}</span>
      {split && (
        <div className={`text-[10px] leading-tight truncate max-w-full ${splitCls}`}>
          {split}
        </div>
      )}
    </div>
  </div>
);

const ReservationRecordCard: React.FC<ReservationRecordCardProps> = ({
  record,
  onClickDetail,
  onGoCollection,
}) => {
  const paymentSummary = getReservationPaymentSummary(record);
  const refundDiff = Number(record.refund_diff ?? 0);
  const showApprovedRefund =
    record.status === ReservationStatus.APPROVED &&
    (refundDiff > 0 || paymentSummary.refund.hasValue);
  const refundedText = getReservationRefundInlineText(paymentSummary.refund);

  const freezeSplit = getReservationSplitInlineText(paymentSummary.freeze);
  const actualSplit = getReservationSplitInlineText(paymentSummary.actual);

  // 底部状态描述
  let footerInfo = '';
  if (record.status === ReservationStatus.PENDING && record.session_end_time) {
    footerInfo = `${TEXT.pendingMatchPrefix} ${record.session_end_time} ${TEXT.pendingMatchSuffix}`;
  } else if (record.status === ReservationStatus.APPROVED) {
    const mt = fmtDT(record.match_time);
    if (mt) footerInfo = `${TEXT.matchTime} ${mt}`;
  } else if (record.status === ReservationStatus.REFUNDED) {
    footerInfo = refundedText
      ? `${TEXT.refundedPrefix}${refundedText}${TEXT.refundedSuffix}`
      : TEXT.refundedFallback;
  }

  return (
    <div
      className="cursor-pointer rounded-xl border border-gray-100 bg-white shadow-sm transition-colors active:bg-gray-50 overflow-hidden"
      onClick={() => onClickDetail(record)}
    >
      {/* ── 头部 ── */}
      <div className="px-3.5 pt-3 pb-2.5">
        <div className="flex items-start justify-between gap-2.5">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[13px] font-bold text-gray-900 truncate max-w-full">
                {record.session_title || TEXT.defaultTitle}
              </h3>
              <span className="rounded bg-red-50 border border-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-600 whitespace-nowrap shrink-0">
                {record.zone_name || `${TEXT.zonePrefix}${record.zone_id}`}
              </span>
              <MixedPaymentBadge
                type={record.pay_type}
                fallbackText={paymentSummary.payTypeLabel ?? record.pay_type_text}
                balanceAvailableAmount={paymentSummary.freeze.balanceAvailableAmount}
                pendingActivationGoldAmount={paymentSummary.freeze.pendingActivationGoldAmount}
                size="sm"
              />
            </div>
            {(record.session_start_time || record.session_end_time) && (
              <div className="mt-1.5 flex items-center gap-1 text-[11px] text-gray-400">
                <Clock size={11} className="flex-shrink-0" />
                <span className="truncate">
                  {TEXT.sessionLabel}: {record.session_start_time || '--:--'} - {record.session_end_time || '--:--'}
                </span>
              </div>
            )}
          </div>
          <ReservationRecordStatusBadge status={record.status} statusText={record.status_text} />
        </div>
      </div>

      {/* ── 支付明细 ── */}
      <div className="mx-3.5 mb-2.5 flex flex-col gap-1.5 bg-gray-50/80 rounded-lg p-2.5">
        {paymentSummary.freeze.hasValue && (
          <PayRow label={TEXT.freeze} total={paymentSummary.freeze.totalText} split={freezeSplit} />
        )}
        {record.status === ReservationStatus.APPROVED && paymentSummary.actual.hasValue && (
          <PayRow
            label={TEXT.actual}
            total={paymentSummary.actual.totalText}
            split={actualSplit}
            labelCls="text-emerald-600"
            valueCls="text-emerald-600"
            splitCls="text-emerald-500/80"
          />
        )}
        {record.status === ReservationStatus.REFUNDED && paymentSummary.refund.hasValue && (
          <PayRow
            label={TEXT.refund}
            total={paymentSummary.refund.totalText}
            labelCls="text-gray-500"
            valueCls="text-gray-700"
            splitCls="text-gray-400"
          />
        )}
      </div>

      {/* ── 差价退还 ── */}
      {showApprovedRefund && refundDiff > 0 && (
        <div className="mx-3.5 mb-2.5 flex items-center justify-between rounded-lg border border-green-100/50 bg-green-50/80 px-2.5 py-1.5 text-[11px] text-green-700">
          <span className="flex items-center gap-1 font-medium whitespace-nowrap">
            <CheckCircle2 size={12} className="flex-shrink-0 shrink-0" />
            {TEXT.refundedDiff}
          </span>
          <span className="font-bold tabular-nums truncate pl-2">
            +{formatPaymentValue(refundDiff, { prefix: MONEY })}
          </span>
        </div>
      )}

      {/* ── 底栏 ── */}
      <div className="flex items-center justify-between border-t border-gray-50 px-3.5 py-2">
        <span className="text-[10px] text-gray-400 truncate flex-1 leading-tight">
          <span className="whitespace-nowrap">{fmtDT(record.create_time) || record.create_time_str}</span>
          {footerInfo && <span className="text-gray-300 mx-1">·</span>}
          <span className="truncate">{footerInfo}</span>
        </span>
        
        {record.status === ReservationStatus.APPROVED && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onGoCollection();
            }}
            className="ml-3 flex items-center gap-1 flex-shrink-0 rounded-full bg-red-500 py-1 pl-2.5 pr-2 text-[10px] font-medium text-white shadow-sm active:scale-95 transition-transform"
          >
            {TEXT.goCollection}
            <ArrowRight size={10} />
          </button>
        )}
      </div>
    </div>
  );
};

export default ReservationRecordCard;
