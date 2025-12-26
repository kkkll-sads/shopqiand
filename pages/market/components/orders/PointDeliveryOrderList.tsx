import React from 'react';
import { Package } from 'lucide-react';
import { ShopOrderItem } from '../../../services/api';

interface PointDeliveryOrderListProps {
  category: 'points' | 'delivery';
  orders: ShopOrderItem[];
  loading: boolean;
  activeTab: number;
  formatOrderDate: (date: number | string | undefined) => string;
  formatOrderPrice: (price: number | string | undefined) => string;
  getOrderStatus: (order: ShopOrderItem) => string;
  getOrderImage: (order: ShopOrderItem) => string;
  getOrderName: (order: ShopOrderItem) => string;
  getOrderQuantity: (order: ShopOrderItem) => number;
  getOrderPrice: (order: ShopOrderItem) => { amount: number; score: number; isScore: boolean };
  onDelete: (orderId: number | string) => void;
  onConfirmReceipt: (orderId: number | string) => void;
  onViewDetail: (orderId: number) => void;
}

const PointDeliveryOrderList: React.FC<PointDeliveryOrderListProps> = ({
  category,
  orders,
  loading,
  activeTab,
  formatOrderDate,
  formatOrderPrice,
  getOrderStatus,
  getOrderImage,
  getOrderName,
  getOrderQuantity,
  getOrderPrice,
  onDelete,
  onConfirmReceipt,
  onViewDetail,
}) => {
  if (!orders.length && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <Package size={48} className="mb-2 opacity-20" />
        <p className="text-xs">暂无订单数据</p>
      </div>
    );
  }

  return (
    <>
      {orders.map((order) => (
        <div key={order.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-50">
          <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-50">
            <span className="text-xs text-gray-500">
              {formatOrderDate(order.create_time)}
            </span>
            <span className="text-xs font-medium text-blue-600">
              {getOrderStatus(order)}
            </span>
          </div>

          <div className="flex gap-3">
            {getOrderImage(order) && (
              <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={getOrderImage(order)}
                  alt={getOrderName(order)}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-800 mb-1">
                {getOrderName(order)}
              </h3>
              <div className="text-xs text-gray-400 mb-2">
                数量: {getOrderQuantity(order)}
              </div>
              <div className="flex justify-between items-end">
                <div className="text-sm font-bold text-gray-900">
                  {(() => {
                    const priceInfo = getOrderPrice(order);
                    return priceInfo.isScore
                      ? `${priceInfo.score} 消费金`
                      : `¥ ${formatOrderPrice(priceInfo.amount)}`;
                  })()}
                </div>
                <div className="flex gap-2">
                  {activeTab === 0 && category === 'points' && (
                    <button
                      onClick={() => onDelete(order.id)}
                      className="px-3 py-1 rounded-full border border-red-300 text-red-600 text-xs active:bg-red-50"
                    >
                      删除订单
                    </button>
                  )}
                  {(activeTab === 2 && category === 'points') || (activeTab === 1 && category === 'delivery') ? (
                    <button
                      onClick={() => onConfirmReceipt(order.id)}
                      className="px-3 py-1 rounded-full bg-blue-600 text-white text-xs active:bg-blue-700"
                    >
                      确认收货
                    </button>
                  ) : null}
                  <button
                    onClick={() => onViewDetail(Number(order.id))}
                    className="px-3 py-1 rounded-full border border-gray-200 text-xs text-gray-600 active:bg-gray-50"
                  >
                    查看详情
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {loading && (
        <div className="flex justify-center py-8">
          <p className="text-xs text-gray-400">加载中...</p>
        </div>
      )}
    </>
  );
};

export default PointDeliveryOrderList;

