import React from 'react';
import type { PaymentSplitRowData, PaymentSplitRowTone } from '@/pages/market/utils/reservationPayment';

interface PaymentSplitRowsProps {
  rows: PaymentSplitRowData[];
  compact?: boolean;
  className?: string;
}

const cx = (...classNames: Array<string | false | null | undefined>) =>
  classNames.filter(Boolean).join(' ');

const TONE_STYLES: Record<
  PaymentSplitRowTone,
  { row: string; label: string; value: string }
> = {
  balance_available: {
    row: 'border-rose-100 bg-rose-50/80',
    label: 'text-rose-700',
    value: 'text-rose-700',
  },
  pending_activation_gold: {
    row: 'border-amber-100 bg-amber-50/80',
    label: 'text-amber-700',
    value: 'text-amber-700',
  },
  neutral: {
    row: 'border-gray-100 bg-gray-50',
    label: 'text-gray-500',
    value: 'text-gray-900',
  },
};

const PaymentSplitRows: React.FC<PaymentSplitRowsProps> = ({
  rows,
  compact = false,
  className,
}) => {
  if (!rows.length) {
    return null;
  }

  return (
    <div className={cx(compact ? 'space-y-2' : 'space-y-3', className)}>
      {rows.map((row) => {
        const tone = row.tone ?? 'neutral';
        const toneStyle = TONE_STYLES[tone];

        return (
          <div
            key={row.key}
            className={cx(
              'flex items-center justify-between border',
              compact ? 'rounded-lg px-3 py-2' : 'rounded-xl px-3.5 py-3',
              toneStyle.row,
            )}
          >
            <span className={cx(compact ? 'text-xs' : 'text-sm', 'font-medium', toneStyle.label)}>
              {row.label}
            </span>
            <span className={cx(compact ? 'text-sm' : 'text-base', 'font-bold', toneStyle.value)}>
              {row.amountText}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default PaymentSplitRows;