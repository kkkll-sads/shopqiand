import React from 'react';
import PaymentSplitRows from '@/pages/market/components/PaymentSplitRows';
import type { OrderPaymentSummary } from '@/pages/market/utils/orderPayment';

interface OrderPaymentDetailsSectionProps {
  paymentSummary: OrderPaymentSummary;
  className?: string;
}

const cx = (...classNames: Array<string | false | null | undefined>) =>
  classNames.filter(Boolean).join(' ');

interface SummaryBlockProps {
  title: string;
  totalText?: string;
  highlight?: boolean;
  rows: OrderPaymentSummary['paymentRows'];
}

const SummaryBlock: React.FC<SummaryBlockProps> = ({
  title,
  totalText,
  highlight = false,
  rows,
}) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs font-medium text-gray-500">{title}</span>
      <span className={cx('text-sm font-semibold', highlight ? 'text-emerald-600' : 'text-gray-900')}>
        {totalText ?? '-'}
      </span>
    </div>
    {rows.length > 0 && <PaymentSplitRows rows={rows} compact />}
  </div>
);

const OrderPaymentDetailsSection: React.FC<OrderPaymentDetailsSectionProps> = ({
  paymentSummary,
  className,
}) => {
  const hasPaymentRows = paymentSummary.paymentRows.length > 0;
  const showReservationSummary = Boolean(paymentSummary.reservationId);

  if (!hasPaymentRows && !paymentSummary.payRatioText && !showReservationSummary) {
    return null;
  }

  return (
    <div className={cx('border-t border-gray-50 pt-4 space-y-3', className)}>
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm text-gray-500">支付明细</span>
        {paymentSummary.payRatioText && (
          <span className="text-right text-xs leading-5 text-gray-400">{paymentSummary.payRatioText}</span>
        )}
      </div>

      {hasPaymentRows && <PaymentSplitRows rows={paymentSummary.paymentRows} compact />}

      {showReservationSummary && (
        <div className="space-y-3 rounded-xl border border-orange-100 bg-orange-50/50 p-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-orange-700">预约资金摘要</span>
            <span className="text-[11px] text-orange-600">记录 #{paymentSummary.reservationId}</span>
          </div>

          <SummaryBlock
            title="冻结金额"
            totalText={paymentSummary.freezeTotalText}
            rows={paymentSummary.freezeRows}
          />

          <SummaryBlock
            title="退款金额"
            totalText={paymentSummary.refundTotalText}
            rows={paymentSummary.refundRows}
            highlight
          />
        </div>
      )}
    </div>
  );
};

export default OrderPaymentDetailsSection;
