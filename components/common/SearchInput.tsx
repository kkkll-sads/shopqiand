import React, { useState, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  debounce?: number;
  className?: string;
  autoFocus?: boolean;
}

/**
 * SearchInput - 搜索输入框组件
 * 支持防抖搜索，清除按钮
 */
export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  onSearch,
  placeholder = '搜索...',
  debounce = 300,
  className = '',
  autoFocus = false,
}) => {
  const [localValue, setLocalValue] = useState(value);

  // 同步外部 value 变化
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // 防抖处理
  useEffect(() => {
    if (debounce <= 0) return;
    
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
        onSearch?.(localValue);
      }
    }, debounce);

    return () => clearTimeout(timer);
  }, [localValue, debounce]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    
    // 如果没有防抖，立即触发
    if (debounce <= 0) {
      onChange(newValue);
    }
  }, [debounce, onChange]);

  const handleClear = useCallback(() => {
    setLocalValue('');
    onChange('');
    onSearch?.('');
  }, [onChange, onSearch]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onChange(localValue);
      onSearch?.(localValue);
    }
  }, [localValue, onChange, onSearch]);

  return (
    <div className={`relative ${className}`}>
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
        <Search size={16} />
      </div>
      <input
        type="text"
        value={localValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full h-10 pl-9 pr-9 bg-gray-100 border border-transparent rounded-xl text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:bg-white focus:border-red-200 focus:ring-2 focus:ring-red-50"
      />
      {localValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default SearchInput;
