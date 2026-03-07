import React from 'react';
import {
  getReservationPaymentLabel,
  resolveReservationPaymentType,
  type ReservationPaymentType,
} from '@/pages/market/utils/reservationPayment';

interface MixedPaymentBadgeProps {
  type?: string | null;
  balanceAvailableAmount?: unknown;
  pendingActivationGoldAmount?: unknown;
  scoreAmount?: unknown;
  greenPowerAmount?: unknown;
  fallbackText?: string | null;
  size?: 'sm' | 'md';
  className?: string;
}

const BADGE_SIZE_STYLES = {
  sm: 'px-2.5 py-1 text-[11px]',
  md: 'px-3 py-1.5 text-xs',
};

const BADGE_TONE_STYLES: Record<ReservationPaymentType | 'neutral', string> = {
  balance_available: 'border-rose-200 bg-rose-50 text-rose-700',
  pending_activation_gold: 'border-amber-200 bg-amber-50 text-amber-700',
  mixed: 'border-orange-200 bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-sm shadow-orange-100',
  neutral: 'border-gray-200 bg-gray-50 text-gray-600',
};

const cx = (...classNames: Array<string | false | null | undefined>) =>
  classNames.filter(Boolean).join(' ');

const MixedPaymentBadge: React.FC<MixedPaymentBadgeProps> = ({
  type,
  balanceAvailableAmount,
  pendingActivationGoldAmount,
  scoreAmount,
  greenPowerAmount,
  fallbackText,
  size = 'md',
  className,
}) => {
  const resolvedType = resolveReservationPaymentType({
    type,
    balanceAvailableAmount,
    pendingActivationGoldAmount,
    scoreAmount,
    greenPowerAmount,
  });
  const label = getReservationPaymentLabel(type, fallbackText);

  if (!label) {
    return null;
  }

  const tone = resolvedType ?? 'neutral';

  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full border font-semibold whitespace-nowrap',
        BADGE_SIZE_STYLES[size],
        BADGE_TONE_STYLES[tone],
        className,
      )}
    >
      {label}
    </span>
  );
};

export default MixedPaymentBadge;