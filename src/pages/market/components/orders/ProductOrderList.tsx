import React from 'react';
import { Copy, Package } from 'lucide-react';
import { useNotification } from '@/context/NotificationContext';
import { MyConsignmentItem, PurchaseRecordItem, normalizeAssetUrl } from '@/services';
import { copyWithToast } from '@/utils/copyWithToast';
import { buildOrderPaymentSummary } from '@/pages/market/utils/orderPayment';

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
        {purchaseRecords.map((record) => {
          const paymentSummary = buildOrderPaymentSummary(record);
          const showPaymentSummaryText = paymentSummary.shortSummary !== paymentSummary.payTypeLabel;

          return (
            <div
              key={record.order_id}
              className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 cursor-pointer active:bg-gray-50 transition-colors"
              onClick={() => {
                if (onViewOrderDetail && (record.order_id || record.order_no)) {
                  onViewOrderDetail(record.order_id, record.order_no);
                }
              }}
            >
              <div className="flex justify-between items-center mb-2.5">
                <span className="text-xs text-gray-400">
                  {record.pay_time_text || formatOrderDate(record.pay_time)}
                </span>
                <span className="text-xs font-medium text-blue-600">
                  {record.status_text || record.order_status_text || '未知状态'}
                </span>
              </div>

              <div className="flex gap-3">
                {record.item_image && (
                  <div className="w-14 h-14 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
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
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <h3 className="text-[13px] font-bold text-gray-800 mb-1 truncate leading-tight">
                      {record.item_title}
                    </h3>
                    <div className="text-[11px] text-gray-400 mb-1.5 flex flex-wrap gap-2">
                      <span>数量: {record.quantity}</span>
                      <span>单价: ¥{formatOrderPrice(record.price)}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-end gap-2">
                    <div className="text-sm font-bold text-gray-900 tabular-nums leading-none">
                      ¥ {formatOrderPrice(record.total_amount)}
                    </div>
                    <div className="flex flex-col items-end gap-1 min-w-0">
                      <div className="flex items-center justify-end gap-1.5 min-w-0 w-full">
                        {paymentSummary.paymentTagText && (
                          <span className="shrink-0 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                            {paymentSummary.paymentTagText}
                          </span>
                        )}
                        <span className="text-[11px] text-gray-500 truncate">{paymentSummary.payTypeLabel}</span>
                      </div>
                      {showPaymentSummaryText && (
                        <div className="text-[10px] text-gray-400 truncate w-full text-right">
                          {paymentSummary.shortSummary}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {record.order_no && (
                <div className="mt-3 pt-2.5 border-t border-gray-50 flex items-center justify-between text-[11px] text-gray-400">
                  <span className="truncate flex-1">订单号: {record.order_no}</span>
                  <button
                    type="button"
                    className="flex items-center gap-1 px-2 py-1 -mr-2 rounded active:bg-gray-50 text-gray-400 hover:text-gray-600 shrink-0 transition-colors"
                    onClick={(event) => {
                      event.stopPropagation();
                      void handleCopyOrderNo(record.order_no!);
                    }}
                    aria-label="复制订单号"
                  >
                    <Copy size={12} />
                    <span>复制</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {loading && (
          <div className="flex justify-center py-6">
            <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </>
    );
  }

  if (!consignmentOrders.length && !loading) return renderEmpty('暂无卖出订单');

  return (
    <>
      {consignmentOrders.map((order) => {
        const consignmentPrice = Number(order.consignment_price ?? 0);
        const soldPrice = Number(order.sold_price ?? 0);
        const displaySellPrice = consignmentPrice > 0 ? consignmentPrice : soldPrice;
        
        return (
          <div key={order.consignment_id} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-2.5">
              <span className="text-xs text-gray-400">
                {order.update_time_text || order.create_time_text || formatOrderDate(order.update_time || order.create_time)}
              </span>
              <span className="text-xs font-medium text-blue-600">
                {order.consignment_status_text || '已售出'}
              </span>
            </div>

            <div className="flex gap-3">
              {order.image && (
                <div className="w-14 h-14 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
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
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <h3 className="text-[13px] font-bold text-gray-800 mb-1 truncate leading-tight">
                    {order.title}
                  </h3>
                  <div className="text-[11px] text-gray-400 mb-1.5 flex flex-wrap gap-2">
                    <span>原价: ¥{formatOrderPrice(order.buy_price ?? order.original_price)}</span>
                    <span className="text-gray-500">寄售价: ¥{formatOrderPrice(displaySellPrice)}</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-end gap-2">
                  <div className="text-sm font-bold text-gray-900 tabular-nums leading-none">
                    ¥ {formatOrderPrice(displaySellPrice)}
                  </div>
                  <button
                    onClick={() => onViewConsignmentDetail(order.consignment_id)}
                    className="px-2.5 py-1 rounded-full border border-gray-200 text-[11px] font-medium text-gray-600 active:bg-gray-50 shrink-0"
                  >
                    详情
                  </button>
                </div>
              </div>
            </div>

            {order.order_no && (
              <div className="mt-3 pt-2.5 border-t border-gray-50 flex items-center justify-between text-[11px] text-gray-400">
                <span className="truncate flex-1">订单号: {order.order_no}</span>
                <button
                  type="button"
                  className="flex items-center gap-1 px-2 py-1 -mr-2 rounded active:bg-gray-50 text-gray-400 hover:text-gray-600 shrink-0 transition-colors"
                  onClick={() => {
                    void handleCopyOrderNo(order.order_no!);
                  }}
                  aria-label="复制订单号"
                >
                  <Copy size={12} />
                  <span>复制</span>
                </button>
              </div>
            )}
          </div>
        );
      })}
      {loading && (
        <div className="flex justify-center py-6">
          <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </>
  );
};

export default ProductOrderList;
