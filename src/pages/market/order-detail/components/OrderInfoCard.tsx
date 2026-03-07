import React from 'react';
import { Calendar, Check, Copy, Gift } from 'lucide-react';
import type { ShopOrderDetail } from '@/services';
import MixedPaymentBadge from '@/pages/market/components/MixedPaymentBadge';
import OrderPaymentDetailsSection from '@/pages/market/components/OrderPaymentDetailsSection';
import type { OrderPaymentSummary } from '@/pages/market/utils/orderPayment';

interface OrderInfoCardProps {
  order: ShopOrderDetail;
  paymentSummary: OrderPaymentSummary;
  copiedOrderNo: boolean;
  onCopyOrderNo: (text: string) => void;
  formatDateTime: (timestamp: number) => string;
}

const OrderInfoCard: React.FC<OrderInfoCardProps> = ({
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
  const hasPayType = Boolean(payTypeFallback || order.pay_type || paymentSummary.payTypeLabel);

  return (
    <div className="bg-white mx-4 rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 rounded flex items-center justify-center bg-gray-50 border border-gray-100">
          <Calendar className="w-3.5 h-3.5 text-gray-600" />
        </div>
        <h2 className="font-bold text-gray-900 text-sm">订单信息</h2>
      </div>

      <div className="space-y-0 text-[13px]">
        <div className="flex justify-between items-center py-2.5 border-t border-gray-50/50">
          <span className="text-gray-500">订单编号</span>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-900 font-mono tracking-tight">{order.order_no || order.id}</span>
            <button
              onClick={() => onCopyOrderNo(order.order_no || String(order.id))}
              className="p-1 hover:bg-gray-50 rounded text-gray-400 hover:text-gray-600 transition-colors active:scale-95"
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

        {order.status_text && (
          <div className="flex justify-between items-center py-2.5 border-t border-gray-50/50">
            <span className="text-gray-500">订单状态</span>
            <span className="text-gray-900 font-medium">{order.status_text}</span>
          </div>
        )}

        {hasPayType && (
          <div className="flex justify-between items-center py-2.5 border-t border-gray-50/50">
            <span className="text-gray-500">支付方式</span>
            <div className="flex items-center gap-1.5">
              <Gift className="w-3.5 h-3.5 text-red-500" />
              <MixedPaymentBadge
                type={typeof order.pay_type === 'string' ? order.pay_type : undefined}
                balanceAvailableAmount={paymentSummary.payBalanceAvailable}
                pendingActivationGoldAmount={paymentSummary.payPendingActivationGold}
                fallbackText={paymentSummary.payTypeLabel || payTypeFallback}
                size="sm"
              />
            </div>
          </div>
        )}

        <OrderPaymentDetailsSection paymentSummary={paymentSummary} />

        {order.product_type_text && (
          <div className="flex justify-between items-center py-2.5 border-t border-gray-50/50">
            <span className="text-gray-500">商品类型</span>
            <span className="text-gray-900 font-medium">{order.product_type_text}</span>
          </div>
        )}

        {order.create_time > 0 && (
          <div className="flex justify-between items-center py-2.5 border-t border-gray-50/50">
            <span className="text-gray-500">下单时间</span>
            <span className="text-gray-900 font-mono text-[12px]">{formatDateTime(order.create_time)}</span>
          </div>
        )}

        {order.remark && (
          <div className="flex justify-between items-start py-2.5 border-t border-gray-50/50">
            <span className="text-gray-500 flex-shrink-0 mt-0.5">备注</span>
            <span className="text-gray-900 text-right max-w-[200px] leading-relaxed break-all">
              {order.remark}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderInfoCard;
