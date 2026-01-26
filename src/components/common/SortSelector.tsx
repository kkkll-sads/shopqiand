import React, { useState, useRef, useEffect } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Check } from 'lucide-react';

export interface SortOption {
  value: string;
  label: string;
}

export type SortOrder = 'asc' | 'desc';

interface SortSelectorProps {
  sortField: string;
  sortOrder: SortOrder;
  options: SortOption[];
  onSortChange: (field: string, order: SortOrder) => void;
  className?: string;
  defaultOrder?: SortOrder;
}

/**
 * SortSelector - 排序选择器组件
 * 支持选择排序字段和排序方向
 */
export const SortSelector: React.FC<SortSelectorProps> = ({
  sortField,
  sortOrder,
  options,
  onSortChange,
  className = '',
  defaultOrder = 'desc',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selectedOption = options.find(opt => opt.value === sortField);

  // 计算下拉面板位置
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [isOpen]);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectField = (field: string) => {
    if (field === sortField) {
      // 同一字段切换排序方向
      onSortChange(field, sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // 新字段使用默认排序方向
      onSortChange(field, defaultOrder);
    }
    setIsOpen(false);
  };

  const toggleOrder = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSortChange(sortField, sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const OrderIcon = sortOrder === 'asc' ? ArrowUp : ArrowDown;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* 触发按钮 */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium
          border transition-all whitespace-nowrap
          ${isOpen 
            ? 'bg-red-50 border-red-200 text-red-600' 
            : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
          }
        `}
      >
        <ArrowUpDown size={14} className="text-gray-400" />
        <span className="max-w-[80px] truncate">{selectedOption?.label || '排序'}</span>
        <button
          type="button"
          onClick={toggleOrder}
          className="p-0.5 rounded hover:bg-gray-100 transition-colors"
        >
          <OrderIcon size={12} className={sortOrder === 'desc' ? 'text-red-500' : 'text-blue-500'} />
        </button>
      </button>

      {/* 下拉面板 */}
      {isOpen && (
        <>
          {/* 遮罩层 */}
          <div 
            className="fixed inset-0 bg-black/30 z-[9998]"
            onClick={() => setIsOpen(false)}
          />
          
          {/* 下拉内容 - 使用 fixed 定位避免被父容器裁剪 */}
          <div 
            className="fixed bg-white rounded-xl shadow-xl border border-gray-100 z-[9999] overflow-hidden"
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
              minWidth: `${Math.max(position.width, 140)}px`,
            }}
          >
            {/* 选项列表 */}
            <div className="py-1">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelectField(option.value)}
                  className={`
                    w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors
                    ${option.value === sortField 
                      ? 'bg-red-50 text-red-600 font-medium' 
                      : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <span>{option.label}</span>
                  <div className="flex items-center gap-1">
                    {option.value === sortField && (
                      <>
                        <OrderIcon size={14} className={sortOrder === 'desc' ? 'text-red-500' : 'text-blue-500'} />
                        <Check size={14} className="text-red-500" />
                      </>
                    )}
                  </div>
                </button>
              ))}
            </div>
            
            {/* 排序方向提示 */}
            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>当前排序</span>
                <span className="flex items-center gap-1">
                  {sortOrder === 'desc' ? (
                    <>
                      <ArrowDown size={12} /> 降序
                    </>
                  ) : (
                    <>
                      <ArrowUp size={12} /> 升序
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SortSelector;
