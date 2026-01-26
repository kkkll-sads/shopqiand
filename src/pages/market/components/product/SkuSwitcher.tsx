/**
 * SkuSwitcher - SKU图片切换器组件（京东风格）
 * 
 * 在商品主图下方显示可滚动的SKU缩略图列表
 */
import React from 'react';
import { Sku, SkuSpec } from '@/services/shop';

interface SkuSwitcherProps {
  skuSpecs: SkuSpec[];
  skus: Sku[];
  selectedSkuId?: number;
  onSkuSelect: (sku: Sku | null, specValueIds: Record<number, number>) => void;
}

const SkuSwitcher: React.FC<SkuSwitcherProps> = ({
  skuSpecs,
  skus,
  selectedSkuId,
  onSkuSelect,
}) => {
  // 获取有图片的SKU列表（用于展示）
  const skusWithImages = skus.filter(sku => sku.image);
  
  // 如果没有SKU图片，尝试从规格值中获取图片
  const firstSpec = skuSpecs[0];
  const specValuesWithImages = firstSpec?.values.filter(v => v.image) || [];
  
  // 决定显示哪种模式
  const hasSkuImages = skusWithImages.length > 0;
  const hasSpecImages = specValuesWithImages.length > 0;
  
  if (!hasSkuImages && !hasSpecImages) {
    return null;
  }

  // 根据规格值ID找到对应的SKU
  const findSkuBySpecValueId = (specId: number, valueId: number): Sku | null => {
    return skus.find(sku => {
      const ids = String(sku.spec_value_ids).split(',').map(Number);
      const specIndex = skuSpecs.findIndex(s => s.id === specId);
      return specIndex >= 0 && ids[specIndex] === valueId && sku.stock > 0;
    }) || null;
  };

  // 处理SKU选择
  const handleSkuClick = (sku: Sku) => {
    const specValueIds: Record<number, number> = {};
    const ids = String(sku.spec_value_ids).split(',').map(Number);
    skuSpecs.forEach((spec, index) => {
      if (ids[index] !== undefined) {
        specValueIds[spec.id] = ids[index];
      }
    });
    onSkuSelect(sku, specValueIds);
  };

  // 处理规格值图片点击
  const handleSpecValueClick = (specId: number, valueId: number) => {
    const sku = findSkuBySpecValueId(specId, valueId);
    const specValueIds: Record<number, number> = { [specId]: valueId };
    onSkuSelect(sku, specValueIds);
  };

  // SKU图片模式
  if (hasSkuImages) {
    return (
      <div className="bg-white">
        <div 
          className="flex gap-2 px-3 py-2.5 overflow-x-auto"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {skusWithImages.map((sku) => {
            const isSelected = selectedSkuId === sku.id;
            const isAvailable = sku.stock > 0;
            
            return (
              <div
                key={sku.id}
                onClick={() => isAvailable && handleSkuClick(sku)}
                className={`relative flex-shrink-0 cursor-pointer transition-all ${
                  !isAvailable ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {/* 图片容器 */}
                <div 
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    isSelected 
                      ? 'border-red-500 shadow-md shadow-red-500/20' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img 
                    src={sku.image} 
                    alt={sku.spec_value_names}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* 规格名称 */}
                <div className={`mt-1 text-center text-[10px] leading-tight max-w-16 truncate ${
                  isSelected ? 'text-red-600 font-medium' : 'text-gray-600'
                }`}>
                  {sku.spec_value_names.split(' / ')[0]}
                </div>
                
                {/* 选中标记 */}
                {isSelected && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
          
          {/* 显示总数 */}
          {skus.length > skusWithImages.length && (
            <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
              <span className="text-[10px] text-gray-500 text-center leading-tight">
                共{skus.length}款
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 规格值图片模式（如颜色规格带图片）
  if (hasSpecImages && firstSpec) {
    return (
      <div className="bg-white">
        <div 
          className="flex gap-2 px-3 py-2.5 overflow-x-auto"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {firstSpec.values.map((specValue) => {
            const hasImage = !!specValue.image;
            if (!hasImage) return null;
            
            // 找到包含此规格值的任一SKU来判断是否可选
            const relatedSku = skus.find(sku => {
              const ids = String(sku.spec_value_ids).split(',').map(Number);
              return ids[0] === specValue.id && sku.stock > 0;
            });
            const isAvailable = !!relatedSku;
            
            return (
              <div
                key={specValue.id}
                onClick={() => isAvailable && handleSpecValueClick(firstSpec.id, specValue.id)}
                className={`relative flex-shrink-0 cursor-pointer transition-all ${
                  !isAvailable ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-gray-300 transition-all">
                  <img 
                    src={specValue.image} 
                    alt={specValue.value}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="mt-1 text-center text-[10px] text-gray-600 max-w-16 truncate">
                  {specValue.value}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
};

export default SkuSwitcher;
