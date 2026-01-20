import React from 'react';
import { ShopOrderItem, ShopOrderItemDetail, normalizeAssetUrl } from '../../../../../services/api';
import { ShopOrderPayStatus } from '../../../../../constants/statusEnums';
import { Package, Gift, ChevronRight, Sparkles, Clock, Truck, CheckCircle } from 'lucide-react';

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

  // 状态配置
  const getStatusConfig = () => {
    const status = order.status;
    if (status === ShopOrderPayStatus.UNPAID || status === 0) {
      return { icon: Clock, color: 'text-amber-600', bg: 'from-amber-50 to-orange-50', border: 'border-amber-200' };
    }
    if (status === ShopOrderPayStatus.PAID || status === 1) {
      return { icon: Package, color: 'text-blue-600', bg: 'from-blue-50 to-cyan-50', border: 'border-blue-200' };
    }
    if (status === 2) {
      return { icon: Truck, color: 'text-purple-600', bg: 'from-purple-50 to-pink-50', border: 'border-purple-200' };
    }
    if (status === 3) {
      return { icon: CheckCircle, color: 'text-emerald-600', bg: 'from-emerald-50 to-green-50', border: 'border-emerald-200' };
    }
    return { icon: Package, color: 'text-gray-600', bg: 'from-gray-50 to-slate-50', border: 'border-gray-200' };
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  return (
    <div 
      className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-white/50"
      style={{
        animation: `slideUp 0.4s ease-out ${index * 0.08}s both`
      }}
    >
      {/* 订单头部 */}
      <div className={`relative bg-gradient-to-r ${statusConfig.bg} p-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm ${statusConfig.border} border`}>
              <StatusIcon size={16} className={statusConfig.color} />
            </div>
            <div>
              <span className={`text-sm font-bold ${statusConfig.color}`}>
                {order.status_text || '未知状态'}
              </span>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {formatDate(orderTime)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/50 shadow-sm">
            <Sparkles size={12} className="text-amber-500" />
            <span className="text-xs font-medium text-gray-700">消费金兑换</span>
          </div>
        </div>
      </div>

      {/* 商品信息 */}
      {items.length > 0 ? (
        <div className="space-y-0">
          {items.map((item, idx) => (
            <div 
              key={item.id} 
              className={`px-4 py-4 ${idx > 0 ? 'border-t border-gray-100' : ''}`}
              onClick={() => onViewDetail?.(order.id)}
            >
              <div className="flex gap-4">
                {/* 商品图片 */}
                {(item.product_thumbnail || item.product_image) && (
                  <div className="relative w-24 h-24 flex-shrink-0 group">
                    <div className="w-full h-full rounded-xl overflow-hidden shadow-lg border border-gray-100 bg-gradient-to-br from-gray-50 to-slate-50">
                      <img
                        src={item.product_thumbnail 
                          ? (item.product_thumbnail.startsWith('//') 
                              ? `https:${item.product_thumbnail}` 
                              : normalizeAssetUrl(item.product_thumbnail))
                          : normalizeAssetUrl(item.product_image || '')}
                        alt={item.product_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                    {item.quantity > 1 && (
                      <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-gradient-to-br from-rose-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-[10px] font-bold text-white">×{item.quantity}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* 商品详情 */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <p className="text-sm font-medium leading-relaxed line-clamp-2 text-gray-800 group-hover:text-gray-900">
                      {item.product_name}
                    </p>
                  </div>
                  
                  {/* 价格和操作 */}
                  <div className="flex items-end justify-between mt-3">
                    <div>
                      {item.price > 0 ? (
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-black text-rose-500">¥{item.price}</span>
                          {item.score_price && item.score_price > 0 && (
                            <span className="text-sm font-bold text-amber-500">+{item.score_price}消费金</span>
                          )}
                        </div>
                      ) : (
                        item.score_price && item.score_price > 0 && (
                          <div className="flex items-center gap-1">
                            <Sparkles size={14} className="text-amber-500" />
                            <span className="text-lg font-black text-amber-500">{item.score_price}</span>
                            <span className="text-sm text-gray-500">消费金</span>
                          </div>
                        )
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewDetail?.(order.id);
                      }}
                      className="flex items-center gap-1 px-4 py-2 rounded-full bg-gradient-to-r from-gray-100 to-gray-50 hover:from-gray-200 hover:to-gray-100 text-gray-700 text-xs font-medium transition-all active:scale-95 border border-gray-200"
                    >
                      详情
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // 备用显示
        <div className="px-4 py-4">
          <div className="flex gap-4">
            {(order.product_image || order.thumbnail) && (
              <div className="relative w-24 h-24 flex-shrink-0">
                <div className="w-full h-full rounded-xl overflow-hidden shadow-lg border border-gray-100">
                  <img
                    src={normalizeAssetUrl(order.product_image || order.thumbnail || '')}
                    alt={order.product_name || '商品'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <p className="text-sm font-medium line-clamp-2 text-gray-800">
                {order.product_name || '商品'}
              </p>
              <div>
                {order.total_amount > 0 ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-black text-rose-500">¥{order.total_amount}</span>
                    {order.total_score && Number(order.total_score) > 0 && (
                      <span className="text-sm font-bold text-amber-500">
                        +{typeof order.total_score === 'string' ? parseFloat(order.total_score) : order.total_score}消费金
                      </span>
                    )}
                  </div>
                ) : (
                  order.total_score && Number(order.total_score) > 0 && (
                    <div className="flex items-center gap-1">
                      <Sparkles size={14} className="text-amber-500" />
                      <span className="text-lg font-black text-amber-500">
                        {typeof order.total_score === 'string' ? parseFloat(order.total_score) : order.total_score}
                      </span>
                      <span className="text-sm text-gray-500">消费金</span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 底部操作按钮 */}
      {(order.status === ShopOrderPayStatus.PAID || order.status === 1) && order.pay_type === 'score' && activeTab === 1 && onUrgeShip && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-100">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onUrgeShip(order.id);
            }}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold shadow-lg shadow-amber-500/30 hover:shadow-xl transition-all active:scale-[0.98]"
          >
            催发货
          </button>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
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
