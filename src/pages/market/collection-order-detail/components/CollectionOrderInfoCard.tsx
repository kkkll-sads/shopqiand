import React from 'react';
import { Check, Copy, Receipt } from 'lucide-react';
import { CollectionOrderDetailData } from '@/services/collection/my-collection';

interface CollectionOrderInfoCardProps {
  order: CollectionOrderDetailData;
  copiedOrderNo: boolean;
  onCopyOrderNo: (text: string) => void;
  formatDateTime: (timestamp?: number) => string;
}

const CollectionOrderInfoCard: React.FC<CollectionOrderInfoCardProps> = ({
  order,
  copiedOrderNo,
  onCopyOrderNo,
  formatDateTime,
}) => (
  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-white/50 mx-4">
    <div className="flex items-center gap-2.5 mb-5">
      <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
        <Receipt className="w-4 h-4 text-green-600" />
      </div>
      <h2 className="font-semibold text-gray-900 text-base">订单信息</h2>
    </div>

    <div className="space-y-4">
      <div className="flex justify-between items-start gap-3 py-2">
        <span className="text-sm text-gray-500 shrink-0">订单编号</span>
        <div className="min-w-0 flex items-start justify-end gap-2">
          <span className="min-w-0 text-right text-gray-900 text-xs font-mono break-all">{order.order_no}</span>
          <button
            onClick={() => onCopyOrderNo(order.order_no)}
            className="p-1.5 hover:bg-gray-50 rounded-lg transition-colors active:scale-95 shrink-0"
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

      <div className="flex justify-between items-start gap-3 py-2">
        <span className="text-sm text-gray-500 shrink-0">支付方式</span>
        <span className="min-w-0 text-sm text-gray-900 text-right break-all">
          {order.pay_type_text || order.pay_type}
        </span>
      </div>

      <div className="flex justify-between items-start gap-3 py-2">
        <span className="text-sm text-gray-500 shrink-0">创建时间</span>
        <span className="min-w-0 text-sm text-gray-900 text-right break-all">
          {order.create_time_text || formatDateTime(order.create_time)}
        </span>
      </div>

      {order.pay_time && order.pay_time > 0 && (
        <div className="flex justify-between items-start gap-3 py-2">
          <span className="text-sm text-gray-500 shrink-0">支付时间</span>
          <span className="min-w-0 text-sm text-gray-900 text-right break-all">
            {order.pay_time_text || formatDateTime(order.pay_time)}
          </span>
        </div>
      )}

      {order.complete_time && order.complete_time > 0 && (
        <div className="flex justify-between items-start gap-3 py-2">
          <span className="text-sm text-gray-500 shrink-0">完成时间</span>
          <span className="min-w-0 text-sm text-gray-900 text-right break-all">
            {order.complete_time_text || formatDateTime(order.complete_time)}
          </span>
        </div>
      )}

      {order.remark && (
        <div className="flex justify-between items-start py-2">
          <span className="text-sm text-gray-500">备注</span>
          <span className="text-sm text-gray-900 text-right flex-1 ml-4 break-all">{order.remark}</span>
        </div>
      )}
    </div>
  </div>
);

export default CollectionOrderInfoCard;
