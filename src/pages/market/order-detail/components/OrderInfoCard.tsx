import React from 'react';
import { Calendar, Gift, Copy, Check } from 'lucide-react';
import { ShopOrderItem } from '@/services';

interface OrderInfoCardProps {
  order: ShopOrderItem;
  copiedOrderNo: boolean;
  onCopyOrderNo: (text: string) => void;
  formatDateTime: (timestamp: number) => string;
}

const OrderInfoCard: React.FC<OrderInfoCardProps> = ({
  order,
  copiedOrderNo,
  onCopyOrderNo,
  formatDateTime,
}) => {
  return (
    <div className="bg-white/80 backdrop-blur-sm mx-4 rounded-2xl shadow-lg shadow-gray-200/50 border border-white p-5 mb-4">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
          <Calendar className="w-4 h-4 text-green-500" />
        </div>
        <h2 className="font-semibold text-gray-900 text-base">订单信息</h2>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center py-2">
          <span className="text-sm text-gray-500">订单编号</span>
          <div className="flex items-center gap-2">
            <span className="text-gray-900 text-xs font-mono">{order.order_no || order.id}</span>
            <button
              onClick={() => onCopyOrderNo(order.order_no || String(order.id))}
              className="p-1.5 hover:bg-gray-50 rounded-lg transition-colors active:scale-95"
              aria-label="复制订单号"
            >
              {copiedOrderNo ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4 text-gray-400" />
              )}
            </button>
          </div>
        </div>

        {order.status_text && (
          <div className="flex justify-between items-center py-2 border-t border-gray-50 pt-4">
            <span className="text-sm text-gray-500">订单状态</span>
            <span className="text-sm text-gray-900 font-medium">{order.status_text}</span>
          </div>
        )}

        {order.pay_type_text && (
          <div className="flex justify-between items-center py-2 border-t border-gray-50 pt-4">
            <span className="text-sm text-gray-500">支付方式</span>
            <div className="flex items-center gap-1.5">
              <Gift className="w-4 h-4 text-red-500" />
              <span className="text-sm text-gray-900 font-medium">{order.pay_type_text}</span>
            </div>
          </div>
        )}

        {order.product_type_text && (
          <div className="flex justify-between items-center py-2 border-t border-gray-50 pt-4">
            <span className="text-sm text-gray-500">商品类型</span>
            <span className="text-sm text-gray-900 font-medium">{order.product_type_text}</span>
          </div>
        )}

        {order.create_time > 0 && (
          <div className="flex justify-between items-center py-2 border-t border-gray-50 pt-4">
            <span className="text-sm text-gray-500">下单时间</span>
            <span className="text-sm text-gray-900">{formatDateTime(order.create_time)}</span>
          </div>
        )}

        {order.remark && (
          <div className="flex justify-between items-start py-2 pt-4 border-t border-gray-100">
            <span className="text-sm text-gray-500 flex-shrink-0">备注</span>
            <span className="text-sm text-gray-900 text-right max-w-[200px] leading-relaxed">
              {order.remark}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderInfoCard;
