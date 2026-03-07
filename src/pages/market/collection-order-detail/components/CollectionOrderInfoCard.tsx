import React from 'react';
import { Check, Copy, Receipt } from 'lucide-react';
import MixedPaymentBadge from '@/pages/market/components/MixedPaymentBadge';
import OrderPaymentDetailsSection from '@/pages/market/components/OrderPaymentDetailsSection';
import type { OrderPaymentSummary } from '@/pages/market/utils/orderPayment';
import type { CollectionOrderDetailData } from '@/services/collection/my-collection';

interface CollectionOrderInfoCardProps {
  order: CollectionOrderDetailData;
  paymentSummary: OrderPaymentSummary;
  copiedOrderNo: boolean;
  onCopyOrderNo: (text: string) => void;
  formatDateTime: (timestamp?: number) => string;
}

const CollectionOrderInfoCard: React.FC<CollectionOrderInfoCardProps> = ({
  order,
  paymentSummary,
  copiedOrderNo,
  onCopyOrderNo,
  formatDateTime,
}) => {
  const payTypeFallback =
    typeof order.pay_type_text === 'string' && order.pay_type_text.trim()
      ? order.pay_type_text
      : order.pay_type === 'money'
        ? '余额支付'
        : typeof order.pay_type === 'string'
          ? order.pay_type
          : null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mx-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 rounded flex items-center justify-center bg-gray-50 border border-gray-100">
          <Receipt className="w-3.5 h-3.5 text-gray-600" />
        </div>
        <h2 className="font-bold text-gray-900 text-sm">订单信息</h2>
      </div>

      <div className="space-y-0 text-[13px]">
        <div className="flex justify-between items-center py-2.5 border-t border-gray-50/50">
          <span className="text-gray-500 shrink-0">订单编号</span>
          <div className="flex items-center justify-end gap-1.5 min-w-0">
            <span className="text-gray-900 font-mono tracking-tight truncate">{order.order_no}</span>
            <button
              onClick={() => onCopyOrderNo(order.order_no)}
              className="p-1 hover:bg-gray-50 rounded text-gray-400 hover:text-gray-600 transition-colors active:scale-95 shrink-0"
              aria-label="复制订单号"
            >
              {copiedOrderNo ? (
                <Check className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center py-2.5 border-t border-gray-50/50">
          <span className="text-gray-500 shrink-0">支付方式</span>
          <MixedPaymentBadge
            type={typeof order.pay_type === 'string' ? order.pay_type : undefined}
            balanceAvailableAmount={paymentSummary.payBalanceAvailable}
            pendingActivationGoldAmount={paymentSummary.payPendingActivationGold}
            fallbackText={paymentSummary.payTypeLabel || payTypeFallback}
            size="sm"
          />
        </div>

        <OrderPaymentDetailsSection paymentSummary={paymentSummary} />

        <div className="flex justify-between items-center py-2.5 border-t border-gray-50/50">
          <span className="text-gray-500 shrink-0">创建时间</span>
          <span className="text-gray-900 font-mono text-[12px] text-right truncate">
            {order.create_time_text || formatDateTime(order.create_time)}
          </span>
        </div>

        {order.pay_time && order.pay_time > 0 ? (
          <div className="flex justify-between items-center py-2.5 border-t border-gray-50/50">
            <span className="text-gray-500 shrink-0">支付时间</span>
            <span className="text-gray-900 font-mono text-[12px] text-right truncate">
              {order.pay_time_text || formatDateTime(order.pay_time)}
            </span>
          </div>
        ) : null}

        {order.complete_time && order.complete_time > 0 ? (
          <div className="flex justify-between items-center py-2.5 border-t border-gray-50/50">
            <span className="text-gray-500 shrink-0">完成时间</span>
            <span className="text-gray-900 font-mono text-[12px] text-right truncate">
              {order.complete_time_text || formatDateTime(order.complete_time)}
            </span>
          </div>
        ) : null}

        {order.remark && (
          <div className="flex justify-between items-start py-2.5 border-t border-gray-50/50">
            <span className="text-gray-500 shrink-0 mt-0.5">备注</span>
            <span className="text-gray-900 text-right flex-1 ml-4 break-all leading-relaxed">
              {order.remark}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollectionOrderInfoCard;
