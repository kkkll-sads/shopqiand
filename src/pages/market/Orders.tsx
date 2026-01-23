/**
 * Orders - 订单中心页面
 * 
 * 使用 Card 组件优化样式
 * 
 * @author 树交所前端团队
 * @version 2.0.0
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Truck, Coins, Clock, Package, XCircle, CheckCircle, ArrowRightLeft } from 'lucide-react';

/**
 * 订单区块属性接口
 */
interface OrderSectionProps {
  title: string;
  items: {
    icon: React.ElementType;
    label: string;
    actionKey: string;
  }[];
  onItemClick: (key: string) => void;
}

/**
 * 订单区块组件
 */
const OrderSection: React.FC<OrderSectionProps> = ({ title, items, onItemClick }) => (
  <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
    <div className="flex items-center mb-4 border-l-4 border-red-600 pl-2">
      <h3 className="font-bold text-gray-800 text-sm">{title}</h3>
    </div>
    <div className={`grid grid-cols-${items.length > 4 ? 4 : items.length} gap-4`}>
      {items.map((item, index) => (
        <div
          key={index}
          className="flex flex-col items-center cursor-pointer active:opacity-70"
          onClick={() => onItemClick(item.actionKey)}
        >
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mb-2">
            <item.icon size={20} className="text-red-500" />
          </div>
          <span className="text-xs text-gray-600">{item.label}</span>
        </div>
      ))}
    </div>
  </div>
);

/**
 * Orders 订单中心页面组件
 */
const Orders: React.FC = () => {
  const navigate = useNavigate();

  /**
   * 处理导航
   */
  const handleNav = (key: string) => {
    // key 格式: "product:0" / "transaction:1" 等
    const [category, status] = key.split(':');
    navigate(`/orders/${category}/${status || 0}`);
  };

  return (
    <div className="pb-24 min-h-screen bg-gray-50">
      <header className="bg-white px-4 py-3 flex items-center justify-center sticky top-0 z-10 shadow-sm">
        <h1 className="text-lg font-bold text-gray-800">订单中心</h1>
      </header>

      <div className="p-4 space-y-4">
        {/* 藏品订单 */}
        <OrderSection
          title="藏品订单"
          onItemClick={handleNav}
          items={[
            { icon: ShoppingCart, label: '买入订单', actionKey: 'product:0' },
            { icon: ArrowRightLeft, label: '卖出订单', actionKey: 'product:1' }
          ]}
        />

        {/* 提货订单 */}
        <OrderSection
          title="提货订单"
          onItemClick={handleNav}
          items={[
            { icon: Package, label: '待发货', actionKey: 'delivery:0' },
            { icon: Truck, label: '待收货', actionKey: 'delivery:1' },
            { icon: CheckCircle, label: '已签收', actionKey: 'delivery:2' }
          ]}
        />

        {/* 消费金订单 */}
        <OrderSection
          title="消费金订单"
          onItemClick={handleNav}
          items={[
            { icon: Coins, label: '待付款', actionKey: 'points:0' },
            { icon: Package, label: '待发货', actionKey: 'points:1' },
            { icon: Truck, label: '待收货', actionKey: 'points:2' },
            { icon: CheckCircle, label: '已完成', actionKey: 'points:3' }
          ]}
        />
      </div>
    </div>
  );
};

export default Orders;