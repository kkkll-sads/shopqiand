import React from 'react';
import { Package } from 'lucide-react';
import { MyConsignmentItem, PurchaseRecordItem, normalizeAssetUrl } from '@/services/api';

interface ProductOrderListProps {
  activeTab: number;
  purchaseRecords: PurchaseRecordItem[];
  consignmentOrders: MyConsignmentItem[];
  loading: boolean;
  formatOrderDate: (date: number | string | undefined) => string;
  formatOrderPrice: (price: number | string | undefined) => string;
  onViewConsignmentDetail: (consignmentId: number) => void;
}

const ProductOrderList: React.FC<ProductOrderListProps> = ({
  activeTab,
  purchaseRecords,
  consignmentOrders,
  loading,
  formatOrderDate,
  formatOrderPrice,
  onViewConsignmentDetail,
}) => {
  const renderEmpty = (text: string) => (
    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
      <Package size={48} className="mb-2 opacity-20" />
      <p className="text-xs">{text}</p>
    </div>
  );

  if (activeTab === 0) {
    if (!purchaseRecords.length && !loading) return renderEmpty('暂无买入订单');
    return (
      <>
        {purchaseRecords.map((record) => (
          <div key={record.order_id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-50">
            <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-50">
              <span className="text-xs text-gray-500">
                {record.pay_time_text || formatOrderDate(record.pay_time)}
              </span>
              <span className="text-xs font-medium text-blue-600">
                {record.status_text || record.order_status_text || '未知状态'}
              </span>
            </div>

            <div className="flex gap-3">
              {record.item_image && (
                <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={normalizeAssetUrl(record.item_image)}
                    alt={record.item_title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-800 mb-1">
                  {record.item_title}
                </h3>
                <div className="text-xs text-gray-400 mb-2">
                  数量: {record.quantity} | 单价: ¥{formatOrderPrice(record.price)}
                </div>
                <div className="flex justify-between items-end">
                  <div className="text-sm font-bold text-gray-900">
                    ¥ {formatOrderPrice(record.total_amount)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {record.pay_type_text || '余额支付'}
                  </div>
                </div>
                {record.order_no && (
                  <div className="text-xs text-gray-400 mt-1">
                    订单号: {record.order_no}
                  </div>
                )}
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
  }

  // 卖出订单
  if (!consignmentOrders.length && !loading) return renderEmpty('暂无卖出订单');

  return (
    <>
      {consignmentOrders.map((order) => (
        <div key={order.consignment_id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-50">
          <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-50">
            <span className="text-xs text-gray-500">
              {order.update_time_text || order.create_time_text || formatOrderDate(order.update_time || order.create_time)}
            </span>
            <span className="text-xs font-medium text-blue-600">
              {order.consignment_status_text || '已售出'}
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
                原价: ¥{formatOrderPrice(order.original_price)} | 寄售价: ¥{formatOrderPrice(order.consignment_price)}
              </div>
              <div className="flex justify-between items-end">
                <div className="text-sm font-bold text-gray-900">
                  ¥ {formatOrderPrice(order.consignment_price)}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onViewConsignmentDetail(order.consignment_id)}
                    className="px-3 py-1 rounded-full border border-gray-200 text-xs text-gray-600 active:bg-gray-50"
                  >
                    查看寄售详情
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

export default ProductOrderList;

