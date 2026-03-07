import React from 'react';
import { Package } from 'lucide-react';
import { LazyImage } from '@/components/common';
import { formatAmount } from '@/utils/format';
import { normalizeAssetUrl, type ShopOrderDetail } from '@/services';
import PaymentSplitRows from '@/pages/market/components/PaymentSplitRows';
import {
  formatPaymentValue,
  getReservationPaymentLabel,
  type PaymentSplitRowData,
} from '@/pages/market/utils/reservationPayment';

interface OrderProductInfoCardProps {
  items?: ShopOrderDetail['items'];
  totalAmount: number | string;
  totalScore?: number | string;
  payBalanceAvailable?: number | string;
  payPendingActivationGold?: number | string;
}

const balanceAvailableLabel = getReservationPaymentLabel('balance_available') ?? '专项金';
const pendingActivationGoldLabel =
  getReservationPaymentLabel('pending_activation_gold') ?? '待激活确权金';

const renderPrice = (price?: number, pendingActivationGoldPrice?: number) => {
  if ((price || 0) > 0) {
    return (
      <>
        <span className="text-xs">¥</span>
        {formatAmount(price || 0)}
        {pendingActivationGoldPrice && pendingActivationGoldPrice > 0 && (
          <span className="text-sm">
            +{formatPaymentValue(pendingActivationGoldPrice)}
            {pendingActivationGoldLabel}
          </span>
        )}
      </>
    );
  }

  if (pendingActivationGoldPrice && pendingActivationGoldPrice > 0) {
    return (
      <span className="text-sm">
        {formatPaymentValue(pendingActivationGoldPrice)}
        {pendingActivationGoldLabel}
      </span>
    );
  }

  return null;
};

const parseAmountValue = (value: number | string | undefined) => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = typeof value === 'string' ? parseFloat(value) : value;
  return Number.isFinite(parsed) ? parsed : null;
};

const OrderProductInfoCard: React.FC<OrderProductInfoCardProps> = ({
  items,
  totalAmount,
  totalScore,
  payBalanceAvailable,
  payPendingActivationGold,
}) => {
  const safeItems = items || [];
  const explicitPayBalanceAvailable = parseAmountValue(payBalanceAvailable);
  const explicitPayPendingActivationGold = parseAmountValue(payPendingActivationGold);
  const fallbackPendingActivationGold = parseAmountValue(totalScore);
  const hasRealPaymentSplit = payBalanceAvailable !== undefined || payPendingActivationGold !== undefined;
  const totalAmountValue = Number(totalAmount) || 0;
  const displayBalanceAvailable = hasRealPaymentSplit ? (explicitPayBalanceAvailable ?? 0) : totalAmountValue;
  const displayPendingActivationGold = hasRealPaymentSplit
    ? (explicitPayPendingActivationGold ?? 0)
    : (fallbackPendingActivationGold ?? 0);
  const totalSplitRows: PaymentSplitRowData[] = [];

  if (displayBalanceAvailable > 0) {
    totalSplitRows.push({
      key: 'balance_available',
      label: balanceAvailableLabel,
      amountText: `¥${formatAmount(displayBalanceAvailable)}`,
      amountValue: displayBalanceAvailable,
      tone: 'balance_available',
    });
  }

  if (displayPendingActivationGold > 0) {
    totalSplitRows.push({
      key: 'pending_activation_gold',
      label: pendingActivationGoldLabel,
      amountText: formatPaymentValue(displayPendingActivationGold),
      amountValue: displayPendingActivationGold,
      tone: 'pending_activation_gold',
    });
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm mx-4 rounded-2xl shadow-lg shadow-gray-200/50 border border-white p-5 mb-4">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
          <Package className="w-4 h-4 text-purple-500" />
        </div>
        <h2 className="font-semibold text-gray-900 text-base">商品信息</h2>
      </div>

      {safeItems.map((item) => (
        <div
          key={item.id}
          className="flex gap-4 pb-5 mb-5 border-b border-gray-100 last:border-0 last:mb-0 last:pb-0"
        >
          <div className="w-24 h-24 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden border border-gray-100 shadow-sm">
            <LazyImage
              src={normalizeAssetUrl(item.product_thumbnail || item.product_image || '')}
              alt={item.product_name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <p className="text-sm leading-relaxed line-clamp-2 text-gray-900 mb-3 font-medium">
              {item.product_name}
            </p>
            <div className="flex items-end justify-between">
              <div className="text-red-500 font-bold text-base leading-none">
                {renderPrice(item.price, item.score_price)}
              </div>
              <span className="text-sm text-gray-500 bg-gray-50 px-2 py-1 rounded">x{item.quantity}</span>
            </div>
          </div>
        </div>
      ))}

      <div className="mt-5 pt-5 border-t-2 border-gray-100">
        <div className="flex items-center justify-between">
          <span className="text-base text-gray-600 font-medium">合计</span>
          <div className="text-red-500 font-bold text-base leading-none">
            {displayBalanceAvailable > 0 ? (
              <>
                <span className="text-xs">¥</span>
                {formatAmount(displayBalanceAvailable)}
                {displayPendingActivationGold > 0 && (
                  <span className="text-sm">
                    +{formatPaymentValue(displayPendingActivationGold)}
                    {pendingActivationGoldLabel}
                  </span>
                )}
              </>
            ) : (
              displayPendingActivationGold > 0 && (
                <span className="text-sm">
                  {formatPaymentValue(displayPendingActivationGold)}
                  {pendingActivationGoldLabel}
                </span>
              )
            )}
          </div>
        </div>
        {totalSplitRows.length > 1 && <PaymentSplitRows rows={totalSplitRows} compact className="mt-3" />}
      </div>
    </div>
  );
};

export default OrderProductInfoCard;
