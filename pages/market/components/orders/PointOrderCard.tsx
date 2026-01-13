import React from 'react';
import { ShopOrderItem, ShopOrderItemDetail, normalizeAssetUrl } from '../../../../services/api';
import { ShopOrderPayStatus } from '../../../../constants/statusEnums';
import { Package, Gift } from 'lucide-react';

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
    
    // 判断时间戳是秒级还是毫秒级
    const timestampMs = ts < 10000000000 ? ts * 1000 : ts;
    const date = new Date(timestampMs);
    
    if (isNaN(date.getTime())) return '';
    
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  // 获取订单创建时间（适配 createtime 和 create_time）
  const orderTime = order.create_time || order.createtime || 0;

  // 获取订单项列表
  const items = order.items && order.items.length > 0 ? order.items : [];

  return (
    <div 
      className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
      style={{
        animation: `slideUp 0.4s ease-out ${index * 0.1}s both`
      }}
    >
      {/* 订单头部 - 带装饰条 */}
      <div className="relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#fedab0] to-[#ffd9a8]" />
        <div className="flex items-center justify-between p-4 pb-3 bg-gradient-to-b from-[#fedab0]/20 to-transparent">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#fedab0]" />
            <span className="text-sm text-gray-600">
              {formatDate(orderTime)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-[#fedab0]/40 px-3 py-1 rounded-full">
            <Package className="w-3.5 h-3.5 text-gray-700" />
            <span className="text-xs font-medium text-gray-700">
              {order.status_text || '未知状态'}
            </span>
          </div>
        </div>
      </div>

      {/* 商品信息 */}
      {items.length > 0 ? (
        <div className="space-y-0">
          {items.map((item) => (
            <div key={item.id} className="px-4 pb-4">
              <div className="flex gap-3">
                {/* 商品图片 - 只使用后端返回的图片 */}
                {(item.product_thumbnail || item.product_image) && (
                  <div className="relative w-24 h-24 flex-shrink-0">
                    <div className="w-full h-full bg-gradient-to-br from-[#fedab0]/30 to-[#ffd9a8]/20 rounded-xl overflow-hidden shadow-sm border border-[#fedab0]/40">
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
                    </div>
                  </div>
                )}

                {/* 商品详情 */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-relaxed line-clamp-2 mb-2 text-gray-800">
                    {item.product_name}
                  </p>
                  
                  {/* 积分标签和数量 */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="inline-flex items-center gap-1 bg-gradient-to-r from-[#fedab0]/60 to-[#ffd9a8]/50 px-2.5 py-1 rounded-lg">
                      <Gift className="w-3.5 h-3.5 text-gray-700" />
                      <span className="text-xs text-gray-700 font-medium">
                        消费金兑换
                      </span>
                    </div>
                    {item.quantity > 1 && (
                      <span className="text-xs text-gray-500">
                        x{item.quantity}
                      </span>
                    )}
                  </div>
                  
                  {/* 底部价格和按钮 */}
                  <div className="flex items-center justify-between">
                    <div className="text-red-500 font-bold text-base leading-none">
                      {item.price > 0 ? (
                        <>
                          <span className="text-xs">¥</span>{String(item.price)}
                          {item.score_price && item.score_price > 0 && (
                            <span className="text-sm">
                              +{item.score_price}消费金
                            </span>
                          )}
                        </>
                      ) : (
                        item.score_price && item.score_price > 0 && (
                          <span className="text-sm">
                            {item.score_price}消费金
                          </span>
                        )
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewDetail?.(order.id);
                      }}
                      className="h-8 text-xs px-4 rounded-full border-2 border-[#fedab0] text-gray-700 hover:bg-[#fedab0]/20 hover:border-[#fedab0] transition-all shadow-sm font-medium"
                    >
                      查看详情
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // 如果没有 items，显示备用信息
        <div className="px-4 pb-4">
          <div className="flex gap-3">
            {(order.product_image || order.thumbnail) && (
              <div className="relative w-24 h-24 flex-shrink-0">
                <div className="w-full h-full bg-gradient-to-br from-[#fedab0]/30 to-[#ffd9a8]/20 rounded-xl overflow-hidden shadow-sm border border-[#fedab0]/40">
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
            <div className="flex-1 min-w-0">
              <p className="text-sm leading-relaxed line-clamp-2 mb-2 text-gray-800">
                {order.product_name || '商品'}
              </p>
              <div className="text-red-500 font-bold text-base leading-none">
                {order.total_amount > 0 ? (
                  <>
                    <span className="text-xs">¥</span>{String(order.total_amount)}
                    {order.total_score && order.total_score > 0 && (
                      <span className="text-sm">
                        +{typeof order.total_score === 'string'
                          ? parseFloat(order.total_score)
                          : order.total_score}消费金
                      </span>
                    )}
                  </>
                ) : (
                  order.total_score && order.total_score > 0 && (
                    <span className="text-sm">
                      {typeof order.total_score === 'string'
                        ? parseFloat(order.total_score)
                        : order.total_score}消费金
                    </span>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 底部操作按钮（如果有需要） */}
      {(order.status === ShopOrderPayStatus.PAID || order.status === 1) && order.pay_type === 'score' && activeTab === 1 && onUrgeShip && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-100">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onUrgeShip(order.id);
            }}
            className="w-full py-2 rounded-full bg-gradient-to-r from-[#fedab0] to-[#ffd9a8] text-gray-700 text-sm font-medium shadow-sm hover:shadow-md transition-all active:scale-95"
          >
            催发货
          </button>
        </div>
      )}

      {/* 添加关键帧动画 */}
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
