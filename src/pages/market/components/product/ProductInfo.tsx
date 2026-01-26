/**
 * ProductInfo - 商品信息区组件
 */
import React from 'react';
import { Shield, Truck } from 'lucide-react';

interface ProductInfoProps {
  title: string;
  price: number;
  maxPrice?: number;
  showPriceRange?: boolean;
  scorePrice?: number;
  salesCount?: number;
}

const ProductInfo: React.FC<ProductInfoProps> = ({
  title,
  price,
  maxPrice,
  showPriceRange,
  scorePrice,
  salesCount,
}) => {
  return (
    <>
      {/* 价格促销区 */}
      <div className="bg-white px-3 py-2.5">
        {/* 价格行 */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline flex-wrap">
            {/* 现金价格：支持价格区间显示 */}
            {price > 0 && (
              <>
                <span className="text-red-600 text-lg font-bold font-[DINAlternate-Bold] mr-1">¥</span>
                <span className="text-red-600 text-3xl font-bold font-[DINAlternate-Bold]">{price}</span>
                {showPriceRange && maxPrice && (
                  <>
                    <span className="text-red-600 text-lg mx-1">-</span>
                    <span className="text-red-600 text-lg font-bold font-[DINAlternate-Bold] mr-1">¥</span>
                    <span className="text-red-600 text-3xl font-bold font-[DINAlternate-Bold]">{maxPrice}</span>
                  </>
                )}
              </>
            )}
            {/* 消费金价格 */}
            {scorePrice && scorePrice > 0 && (
              <span className="text-red-600 text-sm font-bold ml-1 bg-red-50 px-1.5 py-0.5 rounded-md border border-red-100">
                {price > 0 ? '+' : ''}{scorePrice}消费金
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <span className="bg-gradient-to-r from-red-600 to-red-500 text-white text-[10px] px-2 py-0.5 rounded font-bold shadow-sm shadow-red-500/30">
              热销
            </span>
          </div>
        </div>

        {/* 保障标签行 */}
        <div className="flex items-center gap-2 mt-2">
          <span className="flex items-center gap-0.5 text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
            <Shield size={10} />
            正品保障
          </span>
          <span className="flex items-center gap-0.5 text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
            <Truck size={10} />
            极速发货
          </span>
          <span className="text-gray-500 text-xs ml-auto">
            已售{salesCount && salesCount > 0 ? `${salesCount}+` : '0'}
          </span>
        </div>
      </div>

      {/* 商品标题区 */}
      <div className="bg-white px-3 py-2 border-t border-gray-50">
        <div className="flex items-start gap-1.5">
          <span className="flex-shrink-0 bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-[4px] font-bold leading-none mt-1">
            自营
          </span>
          <span className="flex-shrink-0 bg-gradient-to-r from-red-500 to-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-[4px] font-bold leading-none mt-1">
            树交所
          </span>
          <h1 className="text-[15px] font-bold text-gray-900 leading-snug line-clamp-2">
            {title}
          </h1>
        </div>

        {/* 标签行 */}
        <div className="flex items-center gap-1.5 mt-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          <span className="text-[10px] text-blue-600 border border-blue-200 px-1.5 py-0.5 rounded flex-shrink-0">
            买贵双倍赔
          </span>
          <span className="text-[10px] text-blue-600 border border-blue-200 px-1.5 py-0.5 rounded flex-shrink-0">
            7天价保
          </span>
          <span className="text-[10px] text-green-600 border border-green-200 px-1.5 py-0.5 rounded flex-shrink-0">
            品质保障
          </span>
        </div>
      </div>
    </>
  );
};

export default ProductInfo;
