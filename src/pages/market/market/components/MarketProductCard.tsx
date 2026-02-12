import React from 'react';
import { LazyImage } from '@/components/common';
import type { Product } from '@/types';

interface MarketProductCardProps {
  product: Product;
  index: number;
  activeFilter: string;
  onSelect: (product: Product) => void;
}

const MarketProductCard: React.FC<MarketProductCardProps> = ({
  product,
  index,
  activeFilter,
  onSelect,
}) => {
  return (
    <div
      className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-200 flex flex-col border border-transparent hover:border-red-100"
      onClick={() => onSelect(product)}
    >
      <div className="aspect-square bg-gray-100 relative overflow-hidden">
        <LazyImage src={product.image} alt={product.title} className="w-full h-full object-cover" />
        {index < 3 && (
          <div className="absolute top-0 left-0 bg-gradient-to-br from-red-600 to-red-500 text-white text-[10px] px-2 py-1 rounded-br-lg font-bold shadow-sm z-10">
            Top {index + 1}
          </div>
        )}
        {index >= 3 && index < 6 && activeFilter === 'new' && (
          <div className="absolute top-2 left-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold shadow-sm">
            ✨ 新品
          </div>
        )}
      </div>

      <div className="p-3 flex flex-col flex-1">
        <h3 className="text-[13px] text-gray-800 font-medium line-clamp-2 leading-snug mb-2">{product.title}</h3>

        <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
          <span className="text-[10px] text-white bg-gradient-to-r from-red-500 to-red-600 px-1.5 py-0.5 rounded font-medium leading-none">
            树交所
          </span>
          {product.category && (
            <span className="text-[10px] text-gray-500 bg-gray-100 px-1 py-0.5 rounded-[4px] font-medium leading-none">
              {product.category}
            </span>
          )}
          <span className="text-[10px] text-gray-400">已售 {product.sales || 0}</span>
        </div>

        <div className="mt-auto pt-2 border-t border-gray-50">
          {(product.green_power_amount && product.green_power_amount > 0) ||
          (product.balance_available_amount && product.balance_available_amount > 0) ? (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                {product.green_power_amount && product.green_power_amount > 0 && (
                  <span className="text-[11px] text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded font-medium">
                    {product.green_power_amount}消费金
                  </span>
                )}
                {product.green_power_amount &&
                  product.green_power_amount > 0 &&
                  product.balance_available_amount &&
                  product.balance_available_amount > 0 && <span className="text-[10px] text-gray-400">+</span>}
                {product.balance_available_amount && product.balance_available_amount > 0 && (
                  <span className="text-[11px] text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded font-medium">
                    ¥{product.balance_available_amount}
                  </span>
                )}
              </div>
              {product.price > 0 && (
                <div className="flex items-baseline">
                  <span className="text-gray-400 text-[10px] line-through">¥{product.price.toLocaleString()}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-baseline gap-0.5 flex-wrap">
              {product.price > 0 && (
                <>
                  <span className="text-red-600 text-sm font-bold font-[DINAlternate-Bold] mr-0.5">¥</span>
                  <span className="text-red-600 text-xl font-bold leading-none font-[DINAlternate-Bold]">
                    {product.price.toLocaleString()}
                  </span>
                </>
              )}
              {product.score_price > 0 && (
                <span className="text-[10px] text-red-600 border border-red-200 bg-red-50 px-1 py-[1px] rounded-[4px] ml-1 font-medium">
                  {product.score_price}消费金
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketProductCard;
