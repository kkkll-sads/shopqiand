import React from 'react';
import type { Sku, SkuSpec } from '@/services/shop';
import { getSpecValueInfo } from './utils';

interface SkuSpecSelectorProps {
  skuSpecs: SkuSpec[];
  normalizedSkus: Sku[];
  selectedValueIds: Record<number, number>;
  onSelectSkuValue: (specId: number, valueId: number) => void;
  isValueSelectable: (specId: number, valueId: number) => boolean;
}

const SkuSpecSelector: React.FC<SkuSpecSelectorProps> = ({
  skuSpecs,
  normalizedSkus,
  selectedValueIds,
  onSelectSkuValue,
  isValueSelectable,
}) => {
  return (
    <div className="px-4 py-3 border-t border-gray-100 max-h-[320px] overflow-y-auto">
      {skuSpecs.map((spec, specIndex) => {
        const hasSpecImages = spec.values.some((item) => item.image);
        const hasSkuImages = specIndex === 0 && normalizedSkus.some((sku) => sku.image);
        const showGridMode = hasSpecImages || hasSkuImages;

        return (
          <div key={spec.id} className="mb-4 last:mb-0">
            <div className="text-sm text-gray-700 mb-2 font-medium">{spec.name}</div>

            {showGridMode ? (
              <div className="grid grid-cols-3 gap-2">
                {spec.values.map((value) => {
                  const isSelected = selectedValueIds[spec.id] === value.id;
                  const selectable = isValueSelectable(spec.id, value.id);
                  const { minPrice, maxPrice, image, isScorePrice } = getSpecValueInfo({
                    normalizedSkus,
                    spec,
                    specIndex,
                    valueId: value.id,
                  });

                  return (
                    <button
                      key={value.id}
                      onClick={() => selectable && onSelectSkuValue(spec.id, value.id)}
                      disabled={!selectable}
                      className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                        isSelected
                          ? 'border-red-500 bg-red-50'
                          : selectable
                            ? 'border-gray-200 hover:border-gray-300 active:scale-[0.98]'
                            : 'border-gray-100 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      {image && (
                        <div className="aspect-square bg-gray-100">
                          <img src={image} alt={value.value} className="w-full h-full object-cover" />
                        </div>
                      )}

                      <div className="p-2 text-center">
                        <div className={`text-xs font-medium truncate ${isSelected ? 'text-red-600' : 'text-gray-700'}`}>
                          {value.value}
                        </div>
                        {minPrice !== null && (
                          <div className={`text-xs mt-0.5 ${isSelected ? 'text-red-500' : 'text-gray-500'}`}>
                            {isScorePrice
                              ? minPrice === maxPrice
                                ? `${minPrice}消费金`
                                : `${minPrice}-${maxPrice}`
                              : minPrice === maxPrice
                                ? `¥${minPrice}`
                                : `¥${minPrice}-${maxPrice}`}
                          </div>
                        )}
                      </div>

                      {isSelected && (
                        <div className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}

                      {!selectable && (
                        <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                          <span className="text-[10px] text-gray-400">无货</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {spec.values.map((value) => {
                  const isSelected = selectedValueIds[spec.id] === value.id;
                  const selectable = isValueSelectable(spec.id, value.id);

                  return (
                    <button
                      key={value.id}
                      onClick={() => selectable && onSelectSkuValue(spec.id, value.id)}
                      disabled={!selectable}
                      className={`relative px-4 py-1.5 rounded-full text-sm border transition-all ${
                        isSelected
                          ? 'border-red-500 bg-red-50 text-red-500'
                          : selectable
                            ? 'border-gray-200 text-gray-700 hover:border-gray-300 active:scale-95'
                            : 'border-gray-100 text-gray-300 cursor-not-allowed bg-gray-50'
                      }`}
                    >
                      {value.value}
                      {!selectable && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className="w-full h-[1px] bg-gray-300 transform rotate-[-20deg]" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SkuSpecSelector;
