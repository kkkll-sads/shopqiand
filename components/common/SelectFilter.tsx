import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface SelectFilterProps {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  showSearch?: boolean;
}

/**
 * SelectFilter - 下拉选择筛选组件
 * 带有搜索功能的下拉选择器
 */
export const SelectFilter: React.FC<SelectFilterProps> = ({
  label,
  value,
  options,
  onChange,
  placeholder = '请选择',
  className = '',
  showSearch = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

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
        setSearchKeyword('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const filteredOptions = showSearch && searchKeyword
    ? options.filter(opt => opt.label.toLowerCase().includes(searchKeyword.toLowerCase()))
    : options;

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchKeyword('');
  };

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
        <span className="text-gray-400 text-xs">{label}</span>
        <span className="max-w-[80px] truncate">{selectedOption?.label || placeholder}</span>
        <ChevronDown 
          size={14} 
          className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* 下拉面板 */}
      {isOpen && (
        <>
          {/* 遮罩层 */}
          <div 
            className="fixed inset-0 bg-black/30 z-[9998]"
            onClick={() => {
              setIsOpen(false);
              setSearchKeyword('');
            }}
          />
          
          {/* 下拉内容 - 使用 fixed 定位避免被父容器裁剪 */}
          <div 
            className="fixed bg-white rounded-xl shadow-xl border border-gray-100 z-[9999] overflow-hidden"
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
              minWidth: `${Math.max(position.width, 160)}px`,
              maxWidth: '280px',
            }}
          >
            {/* 搜索框 */}
            {showSearch && (
              <div className="p-2 border-b border-gray-100">
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="搜索..."
                  autoFocus
                  className="w-full h-8 px-3 bg-gray-50 rounded-lg text-sm outline-none focus:bg-white focus:ring-2 focus:ring-red-50"
                />
              </div>
            )}
            
            {/* 选项列表 */}
            <div className="max-h-[240px] overflow-y-auto py-1">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-400 text-center">无匹配项</div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`
                      w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors
                      ${option.value === value 
                        ? 'bg-red-50 text-red-600 font-medium' 
                        : 'text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    <div className="flex items-center gap-2">
                      {option.icon && <span className="text-gray-400">{option.icon}</span>}
                      <span>{option.label}</span>
                    </div>
                    {option.value === value && <Check size={16} className="text-red-500" />}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SelectFilter;
