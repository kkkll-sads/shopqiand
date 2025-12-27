import React from 'react';
import { Package } from 'lucide-react';
import { MyConsignmentItem, normalizeAssetUrl } from '@/services/api';

interface TransactionOrderListProps {
  orders: MyConsignmentItem[];
  loading: boolean;
  activeTab: number;
  formatOrderDate: (date: number | string | undefined) => string;
  formatOrderPrice: (price: number | string | undefined) => string;
  onCancelConsignment: (consignmentId: number) => void;
}

const TransactionOrderList: React.FC<TransactionOrderListProps> = ({
  orders,
  loading,
  activeTab,
  formatOrderDate,
  formatOrderPrice,
  onCancelConsignment,
}) => {
  if (!orders.length && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <Package size={48} className="mb-2 opacity-20" />
        <p className="text-xs">暂无寄售订单</p>
      </div>
    );
  }

  return (
    <>
      {orders.map((order) => (
        <div key={order.consignment_id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-50">
          <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-50">
            <span className="text-xs text-gray-500">
              {order.create_time_text || formatOrderDate(order.create_time)}
            </span>
            <span className="text-xs font-medium text-orange-600">
              {order.consignment_status_text || '未知状态'}
            </span>
          </div>

          <div className="flex gap-3">
            {order.image && (
              <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={normalizeAssetUrl(order.image)}
                  alt={order.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-800 mb-1">
                {order.title}
              </h3>
              <div className="text-xs text-gray-400 mb-2">
                原价: ¥{formatOrderPrice(order.original_price)}
              </div>
              
              {/* 费用明细 */}
              <div className="bg-gray-50 rounded-lg p-2 mb-2 text-xs space-y-1">
                <div className="flex justify-between text-gray-600">
                  <span>寄售价格：</span>
                  <span>¥{formatOrderPrice(order.consignment_price)}</span>
                </div>
                {order.service_fee !== undefined && Number(order.service_fee) > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>服务费：</span>
                    <span>¥{formatOrderPrice(order.service_fee)}</span>
                  </div>
                )}
                {order.total_cost !== undefined && Number(order.total_cost) > 0 && (
                  <>
                    <div className="border-t border-gray-200 my-1"></div>
                    <div className="flex justify-between text-gray-900 font-bold">
                      <span>实际成本：</span>
                      <span>¥{formatOrderPrice(order.total_cost)}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-between items-end">
                <div className="text-sm font-bold text-gray-900">
                  寄售价 ¥{formatOrderPrice(order.consignment_price)}
                </div>
                <div className="flex gap-2">
                  {activeTab === 1 && order.consignment_status === 1 && (
                    <button
                      onClick={() => onCancelConsignment(order.consignment_id)}
                      className="px-3 py-1 rounded-full border border-red-300 text-red-600 text-xs active:bg-red-50"
                    >
                      取消寄售
                    </button>
                  )}
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

export default TransactionOrderList;

