import React from 'react';
import { Copy } from 'lucide-react';
import { LazyImage } from '@/components/common';
import { useNotification } from '@/context/NotificationContext';
import { copyWithToast } from '@/utils/copyWithToast';

interface ReviewProductCardProps {
  productImage: string;
  productName: string;
  orderId: string;
}

const ReviewProductCard: React.FC<ReviewProductCardProps> = ({
  productImage,
  productName,
  orderId,
}) => {
  const { showToast } = useNotification();

  const handleCopyOrderNo = async () => {
    await copyWithToast(orderId, showToast, {
      successDescription: '订单号已复制到剪贴板',
    });
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
          <LazyImage src={productImage} alt={productName} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm text-gray-900 font-medium line-clamp-2 leading-snug">{productName}</h3>
          <div className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
            <span>订单号: {orderId}</span>
            <button
              type="button"
              className="p-0.5 rounded text-gray-400 active:bg-gray-100"
              onClick={() => {
                void handleCopyOrderNo();
              }}
              aria-label="复制订单号"
            >
              <Copy size={11} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewProductCard;
