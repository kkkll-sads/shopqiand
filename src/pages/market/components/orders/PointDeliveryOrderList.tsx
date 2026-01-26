import React from 'react';
import { Package } from 'lucide-react';
import { ShopOrderItem, ShopOrderItemDetail } from '@/services/api';
import PointOrderCard from './PointOrderCard';
import { useNotification } from '@/context/NotificationContext';
import { debugLog } from '@/utils/logger';

interface PointDeliveryOrderListProps {
  category: 'points' | 'delivery';
  orders: ShopOrderItem[];
  loading: boolean;
  activeTab: number;
  onViewDetail: (orderId: number) => void;
}

const PointDeliveryOrderList: React.FC<PointDeliveryOrderListProps> = ({
  category,
  orders,
  loading,
  activeTab,
  onViewDetail,
}) => {
  const { showToast } = useNotification();

  if (!orders.length && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <Package size={48} className="mb-2 opacity-20" />
        <p className="text-xs">暂无订单数据</p>
      </div>
    );
  }

  // 处理查看商品详情（跳转到订单详情页）
  const handleViewProduct = (item: ShopOrderItemDetail) => {
    // 如果有订单ID，跳转到订单详情
    if (item.shop_order_id) {
      onViewDetail(item.shop_order_id);
    }
  };

  // 处理催发货（目前只是占位，可以根据实际需求实现）
  const handleUrgeShip = (orderId: number) => {
    // TODO: 实现催发货功能（如果需要API调用，可以在这里添加）
    debugLog('PointDeliveryOrderList', '催发货', orderId);
    showToast('success', '已提醒商家', '已提醒商家尽快发货，请耐心等待');
  };

  return (
    <>
      {orders.map((order, index) => (
        <PointOrderCard
          key={order.id}
          order={order}
          activeTab={activeTab}
          onViewProduct={handleViewProduct}
          onViewDetail={onViewDetail}
          onUrgeShip={category === 'points' ? handleUrgeShip : undefined}
          index={index}
        />
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

