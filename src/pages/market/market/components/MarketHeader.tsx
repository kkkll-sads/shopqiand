import React from 'react';
import { Search } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface MarketCategoryOption {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface MarketHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  categories: MarketCategoryOption[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
  activeFilter: string;
  onFilterClick: (filter: string) => void;
}

const FILTER_OPTIONS = [
  { id: 'comprehensive', label: '综合' },
  { id: 'price', label: '价格' },
  { id: 'sales', label: '销量' },
  { id: 'new', label: '最新' },
];

const MarketHeader: React.FC<MarketHeaderProps> = ({
  searchQuery,
  onSearchChange,
  categories,
  selectedCategory,
  onSelectCategory,
  activeFilter,
  onFilterClick,
}) => {
  return (
    <div className="bg-white sticky top-0 z-20 shadow-sm/50">
      <div className="flex items-center gap-2.5 p-3 pb-2">
        <h1 className="font-bold text-lg text-gray-900 whitespace-nowrap tracking-wide">消费金商城</h1>
        <div className="flex-1 bg-gray-100/80 rounded-full flex items-center px-4 py-2 transition-all border border-transparent focus-within:bg-white focus-within:border-red-500 focus-within:shadow-sm focus-within:shadow-red-500/10 min-w-0">
          <Search size={16} className="text-gray-400 mr-2 flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="搜索商品"
            className="bg-transparent border-none outline-none text-sm flex-1 text-gray-700 placeholder-gray-400 min-w-0"
          />
        </div>
        <button className="bg-gradient-to-r from-red-600 to-red-500 text-white text-sm font-semibold px-4 py-2 rounded-full shadow-lg shadow-red-600/20 active:scale-95 transition-all whitespace-nowrap flex-shrink-0">
          搜索
        </button>
      </div>

      <div className="px-3 pb-2 relative">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1">
          {categories.map((category) => (
            <div
              key={category.id}
              className={`flex flex-col items-center px-3 py-2 cursor-pointer active:scale-95 transition-all rounded-2xl min-w-[64px] ${
                selectedCategory === category.id ? 'bg-red-50' : 'bg-transparent'
              }`}
              onClick={() => onSelectCategory(category.id)}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center mb-1.5 transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-md shadow-red-500/20'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                <category.icon size={20} strokeWidth={selectedCategory === category.id ? 2 : 1.5} />
              </div>
              <span
                className={`text-[11px] font-medium whitespace-nowrap ${
                  selectedCategory === category.id ? 'text-red-600' : 'text-gray-600'
                }`}
              >
                {category.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex bg-white border-t border-gray-100">
        {FILTER_OPTIONS.map((filter) => {
          const isActive =
            activeFilter === filter.id || (filter.id === 'price' && activeFilter.startsWith('price'));
          return (
            <button
              key={filter.id}
              onClick={() => onFilterClick(filter.id)}
              className={`flex items-center justify-center flex-1 py-3 text-[13px] relative transition-all ${
                isActive ? 'text-red-600 font-bold' : 'text-gray-600 font-medium'
              }`}
            >
              {filter.label}
              {filter.id === 'price' && (
                <div className="flex flex-col ml-1 gap-[2px]">
                  <span
                    className={`w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[4px] ${
                      activeFilter === 'price_asc' ? 'border-b-red-600' : 'border-b-gray-300'
                    }`}
                  />
                  <span
                    className={`w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[4px] ${
                      activeFilter === 'price_desc' ? 'border-t-red-600' : 'border-t-gray-300'
                    }`}
                  />
                </div>
              )}
              {isActive && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[3px] bg-red-600 rounded-full shadow-sm shadow-red-500/50" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MarketHeader;
