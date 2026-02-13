import React from 'react';
import { Copy, Package } from 'lucide-react';
import { useNotification } from '@/context/NotificationContext';
import { MyConsignmentItem, PurchaseRecordItem, normalizeAssetUrl } from '@/services';
import { copyWithToast } from '@/utils/copyWithToast';

interface ProductOrderListProps {
  activeTab: number;
  purchaseRecords: PurchaseRecordItem[];
  consignmentOrders: MyConsignmentItem[];
  loading: boolean;
  formatOrderDate: (date: number | string | undefined) => string;
  formatOrderPrice: (price: number | string | undefined) => string;
  onViewConsignmentDetail: (consignmentId: number) => void;
  onViewOrderDetail?: (id?: number | string, orderNo?: string) => void;
}

const ProductOrderList: React.FC<ProductOrderListProps> = ({
  activeTab,
  purchaseRecords,
  consignmentOrders,
  loading,
  formatOrderDate,
  formatOrderPrice,
  onViewConsignmentDetail,
  onViewOrderDetail,
}) => {
  const { showToast } = useNotification();

  const handleCopyOrderNo = async (text: string) => {
    await copyWithToast(text, showToast, {
      successDescription: '订单号已复制到剪贴板',
    });
  };

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
          <div
            key={record.order_id}
            className="bg-white rounded-xl p-3 shadow-sm border border-gray-50 cursor-pointer active:bg-gray-50 transition-colors"
            onClick={() => {
              if (onViewOrderDetail && (record.order_id || record.order_no)) {
                onViewOrderDetail(record.order_id, record.order_no);
              }
            }}
          >
            <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-50">
              <span className="text-xs text-gray-500">
                {record.pay_time_text || formatOrderDate(record.pay_time)}
              </span>
              <span className="text-xs font-medium text-blue-600">
                {record.status_text || record.order_status_text || '未知状态'}
              </span>
            </div>

            <div className="flex gap-2.5">
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
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-800 mb-0.5 truncate">
                  {record.item_title}
                </h3>
                <div className="text-xs text-gray-400 mb-1.5">
                  数量: {record.quantity} | 单价: ¥{formatOrderPrice(record.price)}
                </div>
                <div className="flex justify-between items-end gap-2">
                  <div className="text-sm font-bold text-gray-900">
                    ¥ {formatOrderPrice(record.total_amount)}
                  </div>
                  <div className="text-xs text-gray-500 text-right break-all max-w-[55%]">
                    {record.pay_type_text || '余额支付'}
                  </div>
                </div>
                {record.order_no && (
                  <div className="text-xs text-gray-400 mt-0.5 flex items-center justify-between gap-2 min-w-0">
                    <span className="truncate flex-1 min-w-0">订单号: {record.order_no}</span>
                    <button
                      type="button"
                      className="p-1 rounded text-gray-400 active:bg-gray-100 flex-shrink-0"
                      onClick={(event) => {
                        event.stopPropagation();
                        void handleCopyOrderNo(record.order_no!);
                      }}
                      aria-label="复制订单号"
                    >
                      <Copy size={12} />
                    </button>
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
        <div key={order.consignment_id} className="bg-white rounded-xl p-3 shadow-sm border border-gray-50">
          {(() => {
            const consignmentPrice = Number(order.consignment_price ?? 0);
            const soldPrice = Number(order.sold_price ?? 0);
            const displaySellPrice = consignmentPrice > 0 ? consignmentPrice : soldPrice;
            return (
              <>
          <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-50">
            <span className="text-xs text-gray-500">
              {order.update_time_text || order.create_time_text || formatOrderDate(order.update_time || order.create_time)}
            </span>
            <span className="text-xs font-medium text-blue-600">
              {order.consignment_status_text || '已售出'}
            </span>
          </div>

          <div className="flex gap-2.5">
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
              <h3 className="text-sm font-medium text-gray-800 mb-0.5">
                {order.title}
              </h3>
              <div className="text-xs text-gray-400 mb-1.5">
                原价: ¥{formatOrderPrice(order.buy_price ?? order.original_price)} | 寄售价: ¥{formatOrderPrice(displaySellPrice)}
              </div>
              <div className="flex justify-between items-end">
                <div className="text-sm font-bold text-gray-900">
                  ¥ {formatOrderPrice(displaySellPrice)}
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
              {order.order_no && (
                <div className="text-xs text-gray-400 mt-0.5 flex items-center justify-between gap-2 min-w-0">
                  <span className="truncate flex-1 min-w-0">订单号: {order.order_no}</span>
                  <button
                    type="button"
                    className="p-1 rounded text-gray-400 active:bg-gray-100 flex-shrink-0"
                    onClick={() => {
                      void handleCopyOrderNo(order.order_no!);
                    }}
                    aria-label="复制订单号"
                  >
                    <Copy size={12} />
                  </button>
                </div>
              )}
            </div>
          </div>
              </>
            );
          })()}
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
