import React from 'react';
import { ShopOrderItem, ShopOrderItemDetail, normalizeAssetUrl } from '@/services';
import { ShopOrderPayStatus } from '@/constants/statusEnums';
import { Package, ChevronRight, Sparkles, Clock, Truck, CheckCircle } from 'lucide-react';
import { buildOrderPaymentSummary } from '@/pages/market/utils/orderPayment';

interface PointOrderCardProps {
  order: ShopOrderItem;
  onViewProduct?: (item: ShopOrderItemDetail) => void;
  onViewDetail?: (orderId: number) => void;
  onUrgeShip?: (orderId: number) => void;
  activeTab: number;
  index?: number;
}

const PointOrderCard: React.FC<PointOrderCardProps> = ({
  order,
  onViewProduct,
  onViewDetail,
  onUrgeShip,
  activeTab,
  index = 0
}) => {
  const formatDate = (timestamp: number | string | undefined) => {
    if (!timestamp) return '';

    let ts: number;
    if (typeof timestamp === 'string') {
      const cleaned = timestamp.trim().replace(/[^\d]/g, '');
      ts = parseInt(cleaned, 10);
      if (isNaN(ts)) return timestamp;
    } else {
      ts = timestamp;
    }

    if (!ts || ts === 0) return '';
    const timestampMs = ts < 10000000000 ? ts * 1000 : ts;
    const date = new Date(timestampMs);
    if (isNaN(date.getTime())) return '';

    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const orderTime = order.create_time || order.createtime || 0;
  const items = order.items && order.items.length > 0 ? order.items : [];
  const paymentSummary = buildOrderPaymentSummary(order);
  const showMixedPaymentSummary = paymentSummary.isMixed && Boolean(paymentSummary.shortSummary);

  const getStatusConfig = () => {
    const status = order.status;
    if (status === ShopOrderPayStatus.UNPAID || status === 0) {
      return { icon: Clock, color: 'text-red-500', bg: 'bg-red-50' };
    }
    if (status === ShopOrderPayStatus.PAID || status === 1) {
      return { icon: Package, color: 'text-blue-500', bg: 'bg-blue-50' };
    }
    if (status === 2) {
      return { icon: Truck, color: 'text-purple-500', bg: 'bg-purple-50' };
    }
    if (status === 3) {
      return { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50' };
    }
    return { icon: Package, color: 'text-gray-500', bg: 'bg-gray-50' };
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden active:bg-gray-50 transition-colors"
      style={{
        animation: index < 10 ? `slideUp 0.3s ease-out ${index * 0.03}s both` : undefined
      }}
      onClick={() => onViewDetail?.(order.id)}
    >
      <div className={`px-3 py-2.5 flex items-center justify-between border-b border-gray-50`}>
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded flex items-center justify-center ${statusConfig.bg}`}>
            <StatusIcon size={14} className={statusConfig.color} />
          </div>
          <div className="flex flex-col">
            <span className={`text-[13px] font-bold ${statusConfig.color}`}>
              {order.status_text || '未知状态'}
            </span>
            <span className="text-[10px] text-gray-400">
              {formatDate(orderTime)}
            </span>
          </div>
        </div>
        
        <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border ${
          paymentSummary.isMixed
            ? 'bg-amber-50 text-amber-700 border-amber-100'
            : 'bg-gray-50 text-gray-600 border-gray-100'
        }`}>
          <Sparkles size={10} className={paymentSummary.isMixed ? 'text-amber-500' : 'text-gray-400'} />
          <span className="text-[10px] font-medium leading-tight">
            {paymentSummary.paymentTagText || '消费金兑换'}
          </span>
        </div>
      </div>

      {items.length > 0 ? (
        <div className="divide-y divide-gray-50">
          {items.map((item) => (
            <div key={item.id} className="px-3 py-3 flex gap-3">
              {(item.product_thumbnail || item.product_image) && (
                <div className="relative w-16 h-16 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
                  <img
                    src={item.product_thumbnail
                      ? (item.product_thumbnail.startsWith('//')
                        ? `https:${item.product_thumbnail}`
                        : normalizeAssetUrl(item.product_thumbnail))
                      : normalizeAssetUrl(item.product_image || '')}
                    alt={item.product_name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  {item.quantity > 1 && (
                    <div className="absolute bottom-0 right-0 bg-black/60 text-white text-[10px] px-1.5 py-px rounded-tl-lg font-medium tracking-wider">
                      x{item.quantity}
                    </div>
                  )}
                </div>
              )}

              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <p className="text-sm font-medium leading-tight line-clamp-2 text-gray-800">
                  {item.product_name}
                </p>

                <div className="flex items-end justify-between mt-1">
                  <div>
                    {item.price > 0 ? (
                      <div className="flex items-baseline gap-1">
                        <span className="text-base font-bold text-red-600 tabular-nums leading-none">¥{item.price}</span>
                        {item.score_price && item.score_price > 0 && (
                          <span className="text-[11px] font-medium text-amber-500 tabular-nums">+{item.score_price}消费金</span>
                        )}
                      </div>
                    ) : (
                      item.score_price && item.score_price > 0 && (
                        <div className="flex items-baseline gap-0.5 text-amber-500">
                          <span className="text-base font-bold tabular-nums leading-none">{item.score_price}</span>
                          <span className="text-[11px] font-medium">消费金</span>
                        </div>
                      )
                    )}
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewDetail?.(order.id);
                    }}
                    className="flex items-center text-gray-400 hover:text-gray-600 active:scale-95 transition-all p-1 -mr-1"
                  >
                    <span className="text-[11px] mr-0.5">详情</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-3 py-3 flex gap-3">
          {(order.product_image || order.thumbnail) && (
            <div className="relative w-16 h-16 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
              <img
                src={normalizeAssetUrl(order.product_image || order.thumbnail || '')}
                alt={order.product_name || '商品'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <p className="text-sm font-medium line-clamp-2 text-gray-800 leading-tight">
              {order.product_name || '商品'}
            </p>
            <div>
              {order.total_amount > 0 ? (
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-base font-bold text-red-600 tabular-nums leading-none">¥{order.total_amount}</span>
                  {order.total_score && Number(order.total_score) > 0 && (
                    <span className="text-[11px] font-medium text-amber-500 tabular-nums">
                      +{typeof order.total_score === 'string' ? parseFloat(order.total_score) : order.total_score}消费金
                    </span>
                  )}
                </div>
              ) : (
                order.total_score && Number(order.total_score) > 0 && (
                  <div className="flex items-baseline gap-0.5 text-amber-500 mt-1">
                    <span className="text-base font-bold tabular-nums leading-none">
                      {typeof order.total_score === 'string' ? parseFloat(order.total_score) : order.total_score}
                    </span>
                    <span className="text-[11px] font-medium">消费金</span>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {showMixedPaymentSummary && (
        <div className="px-3 pb-2 pt-1 border-t border-gray-50/50">
          <div className="rounded border border-amber-100/50 bg-amber-50/50 px-2 py-1.5 text-[10px] text-amber-700 truncate w-full">
            支付摘要: {paymentSummary.shortSummary}
          </div>
        </div>
      )}

      {(order.status === ShopOrderPayStatus.PAID || order.status === 1) && order.pay_type === 'score' && activeTab === 1 && onUrgeShip && (
        <div className="px-3 py-2.5 border-t border-gray-50 flex justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUrgeShip(order.id);
            }}
            className="px-4 py-1.5 rounded-full bg-red-50 text-red-600 border border-red-100 text-xs font-semibold hover:bg-red-100 active:scale-95 transition-all"
          >
            催发货
          </button>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default PointOrderCard;
