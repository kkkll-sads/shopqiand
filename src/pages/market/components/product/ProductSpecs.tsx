/**
 * ProductSpecs - 规格选择入口组件
 */
import React from 'react';
import { ChevronRight } from 'lucide-react';

interface ProductSpecsProps {
  selectedSpecs: Record<string, string>;
  quantity: number;
  hasSelectableSpecs: boolean;
  onOpen: () => void;
}

const ProductSpecs: React.FC<ProductSpecsProps> = ({
  selectedSpecs,
  quantity,
  hasSelectableSpecs,
  onOpen,
}) => {
  return (
    <div
      className="bg-white mt-1.5 px-3 py-3 active:bg-gray-50 cursor-pointer"
      onClick={onOpen}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-sm">已选</span>
          <span className="text-gray-800 text-sm font-medium">
            {Object.keys(selectedSpecs).length > 0
              ? `${Object.values(selectedSpecs).join('，')}，${quantity}件`
              : hasSelectableSpecs
                ? '请选择规格'
                : `${quantity}件`}
          </span>
        </div>
        <ChevronRight size={14} className="text-gray-400" />
      </div>
    </div>
  );
};

export default ProductSpecs;
