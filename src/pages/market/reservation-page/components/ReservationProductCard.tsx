import React from 'react';
import { Copy } from 'lucide-react';
import { useNotification } from '@/context/NotificationContext';
import { copyWithToast } from '@/utils/copyWithToast';
import type { Product } from '@/types';

interface ReservationProductCardProps {
  product: Product;
}

const ReservationProductCard: React.FC<ReservationProductCardProps> = ({ product }) => {
  const { showToast } = useNotification();
  const assetCode = `37-DATA-2025-${String(product.id).padStart(4, '0')}`;

  const handleCopyAssetCode = async () => {
    await copyWithToast(assetCode, showToast, {
      successDescription: '确权编号已复制到剪贴板',
    });
  };

  return (
    <div className="bg-white p-5 rounded-2xl shadow-lg border border-gray-100 flex gap-4 relative overflow-hidden">
      <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-red-50 opacity-30"></div>
      <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-red-50 rounded-xl overflow-hidden shrink-0 relative z-10 shadow-sm">
        <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 relative z-10">
        <h2 className="text-lg font-bold text-gray-900 line-clamp-2 mb-2">{product.title}</h2>
        <div className="text-xs text-gray-400 font-mono mb-3 inline-flex items-center gap-1.5">
          <span>确权编号: {assetCode}</span>
          <button
            type="button"
            className="p-0.5 rounded text-gray-400 active:bg-gray-100"
            onClick={() => {
              void handleCopyAssetCode();
            }}
            aria-label="复制确权编号"
          >
            <Copy size={11} />
          </button>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-xs text-gray-500">起购价</span>
          <span className="text-2xl font-bold text-red-600 font-mono">
            ¥{(product as any).priceZone || product.price}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ReservationProductCard;
