/**
 * OrderActionButton - 订单操作按钮组件
 * 支持 loading 状态防止重复点击
 */
import React, { useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { ShopOrderItem } from '@/services';

interface OrderActionButtonProps {
  order: ShopOrderItem;
  category: 'product' | 'transaction' | 'delivery' | 'points';
  activeTab: number;
  onPay?: (orderId: number | string) => void | Promise<void>;
  onConfirm?: (orderId: number | string) => void | Promise<void>;
  onDelete?: (orderId: number | string) => void | Promise<void>;
  onViewDetail?: (orderId: number | string) => void;
}

const OrderActionButton: React.FC<OrderActionButtonProps> = ({
  order,
  category,
  activeTab,
  onPay,
  onConfirm,
  onDelete,
  onViewDetail,
}) => {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const handleAsyncAction = useCallback(async (actionKey: string, action: () => void | Promise<void>) => {
    if (loadingAction) return; // 有操作进行中，忽略
    setLoadingAction(actionKey);
    try {
      await action();
    } finally {
      setLoadingAction(null);
    }
  }, [loadingAction]);

  // 根据订单状态和分类决定显示什么按钮
  const getActionButtons = () => {
    const buttons: React.ReactNode[] = [];
    const isLoading = loadingAction !== null;

    if (category === 'delivery' || category === 'points') {
      if (activeTab === 0 && order.status === 'paid') {
        // 待发货 - 查看详情
        if (onViewDetail) {
          buttons.push(
            <button
              key="view"
              onClick={() => onViewDetail(order.id)}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              查看详情
            </button>
          );
        }
      } else if (activeTab === 1 && order.status === 'shipped') {
        // 待收货 - 确认收货
        if (onConfirm) {
          buttons.push(
            <button
              key="confirm"
              onClick={() => handleAsyncAction('confirm', () => onConfirm(order.id))}
              disabled={isLoading}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center gap-1"
            >
              {loadingAction === 'confirm' && <Loader2 size={14} className="animate-spin" />}
              确认收货
            </button>
          );
        }
      }
    } else if (category === 'product') {
      // 产品订单操作逻辑
      if (order.status === 'unpaid' && onPay) {
        buttons.push(
          <button
            key="pay"
            onClick={() => handleAsyncAction('pay', () => onPay(order.id))}
            disabled={isLoading}
            className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-1"
          >
            {loadingAction === 'pay' && <Loader2 size={14} className="animate-spin" />}
            立即支付
          </button>
        );
      }
    }

    // 已完成的订单可以删除
    if ((order.status === 'completed' || order.status === 'cancelled') && onDelete) {
      buttons.push(
        <button
          key="delete"
          onClick={() => handleAsyncAction('delete', () => onDelete(order.id))}
          disabled={isLoading}
          className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center gap-1"
        >
          {loadingAction === 'delete' && <Loader2 size={14} className="animate-spin" />}
          删除
        </button>
      );
    }

    return buttons;
  };

  const buttons = getActionButtons();

  if (buttons.length === 0) {
    return null;
  }

  return (
    <div className="flex gap-2 mt-2">
      {buttons}
    </div>
  );
};

export default OrderActionButton;
