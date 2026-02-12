import React from 'react';
import { Copy, Package } from 'lucide-react';
import { useNotification } from '@/context/NotificationContext';
import { CollectionOrderDetailData } from '@/services/collection/my-collection';
import { copyWithToast } from '@/utils/copyWithToast';

interface CollectionOrderHeroCardProps {
  order: CollectionOrderDetailData;
}

const CollectionOrderHeroCard: React.FC<CollectionOrderHeroCardProps> = ({ order }) => (
  <CollectionOrderHeroCardContent order={order} />
);

const CollectionOrderHeroCardContent: React.FC<CollectionOrderHeroCardProps> = ({ order }) => {
  const { showToast } = useNotification();

  const handleCopyOrderNo = async () => {
    await copyWithToast(order.order_no, showToast, {
      successDescription: '订单号已复制到剪贴板',
    });
  };

  return (
    <div className="relative z-10 mx-4 mt-2 p-5 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-gray-500 mb-1">订单状态</p>
          <p className="text-2xl font-black text-gray-900">{order.status_text}</p>
          <div className="text-xs text-gray-400 mt-2 font-mono flex items-start gap-1.5 min-w-0">
            <span className="min-w-0 break-all">订单号: {order.order_no}</span>
            <button
              type="button"
              className="p-0.5 rounded text-gray-400 active:bg-gray-100 shrink-0"
              onClick={() => {
                void handleCopyOrderNo();
              }}
              aria-label="复制订单号"
            >
              <Copy size={11} />
            </button>
          </div>
        </div>
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
          <Package size={32} className="text-white" />
        </div>
      </div>
    </div>
  );
};

export default CollectionOrderHeroCard;
