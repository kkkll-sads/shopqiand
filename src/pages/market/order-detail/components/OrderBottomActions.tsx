import React from 'react';
import { Star } from 'lucide-react';
import { ShopOrderItem } from '@/services';
import { ShopOrderPayStatus, ShopOrderShippingStatus } from '@/constants/statusEnums';

interface OrderBottomActionsProps {
  order: ShopOrderItem;
  onCancelOrder: (id: number) => void;
  onPayOrder: (id: number) => void;
  onConfirmReceipt: (id: number) => void;
  onGoReview: () => void;
  onBuyAgain: () => void;
}

const OrderBottomActions: React.FC<OrderBottomActionsProps> = ({
  order,
  onCancelOrder,
  onPayOrder,
  onConfirmReceipt,
  onGoReview,
  onBuyAgain,
}) => {
  const normalizedStatus = String(order.status);
  const isUnpaid =
    order.status === ShopOrderPayStatus.UNPAID ||
    order.status === 'pending' ||
    normalizedStatus === '0';
  const isPaid =
    order.status === ShopOrderPayStatus.PAID || order.status === 'paid' || normalizedStatus === '1';
  const isShipped =
    order.status === ShopOrderShippingStatus.SHIPPED ||
    order.status === 'shipped' ||
    normalizedStatus === '2';
  const isCompleted =
    order.status === ShopOrderShippingStatus.RECEIVED ||
    order.status === 'completed' ||
    normalizedStatus === '3';

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-100 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] max-w-[480px] mx-auto pb-safe z-[1000]">
      <div className="p-4 flex gap-3">
        {isUnpaid && (
          <>
            <button
              onClick={() => onCancelOrder(order.id)}
              className="flex-1 h-12 rounded-xl border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 font-semibold transition-all active:scale-[0.98]"
            >
              取消订单
            </button>
            <button
              onClick={() => onPayOrder(order.id)}
              className="flex-1 h-12 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-600 font-semibold shadow-lg shadow-red-500/30 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              立即支付
            </button>
          </>
        )}

        {isPaid && (
          <button
            onClick={() => onCancelOrder(order.id)}
            className="flex-1 h-12 rounded-xl border-2 border-red-200 bg-red-50 text-red-600 hover:border-red-300 hover:bg-red-100 font-semibold transition-all active:scale-[0.98]"
          >
            取消订单
          </button>
        )}

        {isShipped && (
          <>
            <button className="flex-1 h-12 rounded-xl border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 font-semibold transition-all active:scale-[0.98]">
              查看物流
            </button>
            <button
              onClick={() => onConfirmReceipt(order.id)}
              className="flex-1 h-12 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-600 font-semibold shadow-lg shadow-red-500/30 transition-all active:scale-[0.98]"
            >
              确认收货
            </button>
          </>
        )}

        {isCompleted && (
          <>
            {order.is_commented === 0 || order.is_commented === undefined ? (
              <button
                onClick={onGoReview}
                className="flex-1 h-12 rounded-xl border-2 border-red-200 bg-red-50 text-red-600 hover:border-red-300 hover:bg-red-100 font-semibold transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Star size={18} />
                去评价
              </button>
            ) : (
              <button
                disabled
                className="flex-1 h-12 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-400 font-semibold cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Star size={18} />
                已评价
              </button>
            )}
            <button
              onClick={onBuyAgain}
              className="flex-1 h-12 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-600 font-semibold shadow-lg shadow-red-500/30 transition-all active:scale-[0.98]"
            >
              再次购买
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default OrderBottomActions;
