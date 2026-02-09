import React from 'react';
import BottomSheet from '@/components/common/BottomSheet';

export interface FilterOption {
  label: string;
  value: string;
}

interface AssetFilterSheetProps {
  visible: boolean;
  onClose: () => void;
  categoryOptions: FilterOption[];
  flowOptions: FilterOption[];
  tempFilterCategory: string;
  tempFilterFlow: string;
  onTempFilterCategoryChange: (value: string) => void;
  onTempFilterFlowChange: (value: string) => void;
  onConfirm: () => void;
}

const AssetFilterSheet: React.FC<AssetFilterSheetProps> = ({
  visible,
  onClose,
  categoryOptions,
  flowOptions,
  tempFilterCategory,
  tempFilterFlow,
  onTempFilterCategoryChange,
  onTempFilterFlowChange,
  onConfirm,
}) => {
  return (
    <BottomSheet visible={visible} title="选择筛选项" onClose={onClose}>
      <div className="p-4 space-y-6 pb-safe">
        <div>
          <div className="text-sm font-medium text-gray-700 mb-3">收支类型</div>
          <div className="grid grid-cols-3 gap-2">
            {flowOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onTempFilterFlowChange(option.value)}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  tempFilterFlow === option.value
                    ? 'bg-green-50 text-green-600 border-2 border-green-500'
                    : 'bg-gray-50 text-gray-600 border-2 border-transparent active:bg-gray-100'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-sm font-medium text-gray-700 mb-3">交易类型</div>
          <div className="grid grid-cols-3 gap-2">
            {categoryOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onTempFilterCategoryChange(option.value)}
                className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  tempFilterCategory === option.value
                    ? 'bg-green-50 text-green-600 border-2 border-green-500'
                    : 'bg-gray-50 text-gray-600 border-2 border-transparent active:bg-gray-100'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium active:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl bg-green-500 text-white font-medium active:bg-green-600 transition-colors"
          >
            确定
          </button>
        </div>
      </div>
    </BottomSheet>
  );
};

export default AssetFilterSheet;
