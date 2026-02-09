import React from 'react';
import { Package, ArrowRight } from 'lucide-react';
import { normalizeAssetUrl } from '@/services';
import { formatAmount, formatTime } from '@/utils/format';

interface TransactionOrderListProps {
  orders: any[];
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
        <p className="text-xs">暂无交易订单</p>
      </div>
    );
  }

  // 获取状态文本
  const getStatusText = (order: any): string => {
    return order.status_text || order.consignment_status_text || '持有中';
  };

  // 获取状态样式
  const getStatusStyle = (statusText: string): string => {
    if (statusText.includes('寄售') || statusText.includes('出售')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    } else if (statusText.includes('确权') || statusText.includes('成功') || statusText.includes('已售出')) {
      return 'bg-green-50 text-green-700 border-green-200';
    } else if (statusText.includes('失败') || statusText.includes('取消') || statusText.includes('流拍')) {
      return 'bg-red-50 text-red-700 border-red-200';
    } else if (statusText.includes('提货') || statusText.includes('待')) {
      return 'bg-orange-50 text-orange-700 border-orange-200';
    }
    return 'bg-gray-50 text-gray-700 border-gray-200';
  };

  // 获取订单 ID
  const getOrderId = (order: any): number => {
    return order.id || order.consignment_id || order.user_collection_id || 0;
  };

  return (
    <>
      {orders.map((item: any) => {
        const title = item.item_title || item.title || '未命名藏品';
        const image = item.item_image || item.image || '';
        const statusText = getStatusText(item);

        return (
          <div
            key={getOrderId(item)}
            className="bg-white rounded-xl p-5 mb-4 shadow-sm hover:shadow-md border border-gray-100 cursor-pointer active:scale-[0.98] transition-all duration-200"
          >
            <div className="flex gap-4">
              {/* 图片 */}
              <div className="w-24 h-24 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden flex-shrink-0 border border-gray-200/50 shadow-inner">
                <img
                  src={normalizeAssetUrl(image) || undefined}
                  alt={title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.visibility = 'hidden';
                  }}
                />
              </div>

              {/* 内容 */}
              <div className="flex-1 min-w-0">
                {/* 标题和箭头 */}
                <div className="flex items-start justify-between mb-2">
                  <div className="text-base font-semibold text-gray-900 flex-1 line-clamp-2 leading-snug pr-2">{title}</div>
                  <ArrowRight size={18} className="text-gray-400 flex-shrink-0 mt-0.5" strokeWidth={2} />
                </div>

                {/* 确权编号 - 与我的藏品样式一致 */}
                {item.asset_code && (
                  <div className="flex flex-wrap gap-2 items-center mb-2">
                    <span className="text-[11px] px-2 py-0.5 bg-gray-50 text-gray-500 rounded-lg font-mono">
                      {item.asset_code.length > 15
                        ? `${item.asset_code.substring(0, 8)}...${item.asset_code.substring(item.asset_code.length - 4)}`
                        : item.asset_code}
                    </span>
                  </div>
                )}

                {/* 价格和时间 */}
                <div className="flex items-baseline justify-between mb-3">
                  <div className="text-lg font-bold text-red-600 font-[DINAlternate-Bold]">¥ {formatAmount(item.buy_price || item.price || 0)}</div>
                  <div className="text-xs text-gray-500">{item.create_time_text || formatTime(item.create_time)}</div>
                </div>

                {/* 状态标签 */}
                <div className="flex gap-2 flex-wrap items-center">
                  <div className={`text-xs font-medium px-3 py-1.5 rounded-full border-2 shadow-sm ${getStatusStyle(statusText)}`}>
                    {statusText}
                  </div>

                  {/* 流拍次数 */}
                  {item.fail_count !== undefined && Number(item.fail_count) > 0 && (
                    <div className="text-xs text-red-500 flex items-center">
                      流拍: {item.fail_count}次
                    </div>
                  )}
                </div>

                {/* 寄售中可取消 */}
                {activeTab === 1 && statusText.includes('寄售中') && (
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCancelConsignment(getOrderId(item));
                      }}
                      className="px-3 py-1.5 rounded-full border border-red-400 text-red-600 text-xs font-medium active:bg-red-50 hover:bg-red-50 transition-colors"
                    >
                      取消寄售
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {loading && (
        <div className="flex justify-center py-8">
          <p className="text-xs text-gray-400">加载中...</p>
        </div>
      )}
    </>
  );
};

export default TransactionOrderList;
