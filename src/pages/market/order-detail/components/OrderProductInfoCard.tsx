import React from 'react';
import { Package } from 'lucide-react';
import { LazyImage } from '@/components/common';
import { formatAmount } from '@/utils/format';
import { normalizeAssetUrl, ShopOrderItem } from '@/services';

interface OrderProductInfoCardProps {
  items?: ShopOrderItem['items'];
  totalAmount: number;
  totalScore?: number | string;
}

const renderPrice = (price?: number, scorePrice?: number) => {
  if ((price || 0) > 0) {
    return (
      <>
        <span className="text-xs">¥</span>
        {formatAmount(price || 0)}
        {scorePrice && scorePrice > 0 && <span className="text-sm">+{scorePrice}消费金</span>}
      </>
    );
  }

  if (scorePrice && scorePrice > 0) {
    return <span className="text-sm">{scorePrice}消费金</span>;
  }

  return null;
};

const formatScoreValue = (score: number | string | undefined) => {
  if (!score || Number(score) <= 0) return null;
  return typeof score === 'string' ? parseFloat(score) : score;
};

const OrderProductInfoCard: React.FC<OrderProductInfoCardProps> = ({
  items,
  totalAmount,
  totalScore,
}) => {
  const safeItems = items || [];
  const parsedTotalScore = formatScoreValue(totalScore);

  return (
    <div className="bg-white/80 backdrop-blur-sm mx-4 rounded-2xl shadow-lg shadow-gray-200/50 border border-white p-5 mb-4">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
          <Package className="w-4 h-4 text-purple-500" />
        </div>
        <h2 className="font-semibold text-gray-900 text-base">商品信息</h2>
      </div>

      {safeItems.map((item) => (
        <div
          key={item.id}
          className="flex gap-4 pb-5 mb-5 border-b border-gray-100 last:border-0 last:mb-0 last:pb-0"
        >
          <div className="w-24 h-24 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden border border-gray-100 shadow-sm">
            <LazyImage
              src={normalizeAssetUrl(item.product_thumbnail || '')}
              alt={item.product_name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <p className="text-sm leading-relaxed line-clamp-2 text-gray-900 mb-3 font-medium">
              {item.product_name}
            </p>
            <div className="flex items-end justify-between">
              <div className="text-red-500 font-bold text-base leading-none">
                {renderPrice(item.price, item.score_price)}
              </div>
              <span className="text-sm text-gray-500 bg-gray-50 px-2 py-1 rounded">x{item.quantity}</span>
            </div>
          </div>
        </div>
      ))}

      <div className="mt-5 pt-5 border-t-2 border-gray-100">
        <div className="flex items-center justify-between">
          <span className="text-base text-gray-600 font-medium">合计</span>
          <div className="text-red-500 font-bold text-base leading-none">
            {totalAmount > 0 ? (
              <>
                <span className="text-xs">¥</span>
                {formatAmount(totalAmount)}
                {parsedTotalScore !== null && <span className="text-sm">+{parsedTotalScore}消费金</span>}
              </>
            ) : (
              parsedTotalScore !== null && <span className="text-sm">{parsedTotalScore}消费金</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderProductInfoCard;
