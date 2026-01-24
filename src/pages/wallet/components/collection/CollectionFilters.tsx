/**
 * 藏品筛选器组件
 */
import React from 'react';
import { SearchInput, SortSelector } from '../../../../../components/common';
import type { SortOrder } from '../../../../../components/common';

interface SortOption {
  value: string;
  label: string;
}

interface CollectionFiltersProps {
  // 搜索
  searchKeyword: string;
  onSearchChange: (value: string) => void;
  // 场次筛选
  selectedSession: string;
  sessionOptions: string[];
  onSessionChange: (value: string) => void;
  // 价格分区筛选
  selectedPriceZone: string;
  priceZoneOptions: string[];
  onPriceZoneChange: (value: string) => void;
  // 排序
  sortField: string;
  sortOrder: SortOrder;
  sortOptions: SortOption[];
  onSortChange: (field: string, order: SortOrder) => void;
}

export const CollectionFilters: React.FC<CollectionFiltersProps> = ({
  searchKeyword,
  onSearchChange,
  selectedSession,
  sessionOptions,
  onSessionChange,
  selectedPriceZone,
  priceZoneOptions,
  onPriceZoneChange,
  sortField,
  sortOrder,
  sortOptions,
  onSortChange,
}) => {
  return (
    <>
      {/* 搜索框 */}
      <div className="px-4 py-2 border-b border-gray-100/50 bg-gray-50/50">
        <SearchInput
          value={searchKeyword}
          onChange={onSearchChange}
          placeholder="搜索藏品名称、编号..."
          debounce={300}
        />
      </div>

      {/* 筛选下拉框 */}
      <div className="px-4 py-2.5 border-b border-gray-100/50 flex gap-2 bg-gray-50/80 overflow-x-auto">
        {/* 场次筛选 */}
        <div className="flex-shrink-0 relative">
          <select
            value={selectedSession}
            onChange={(e) => onSessionChange(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 transition-all appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed pr-6"
            disabled={sessionOptions.length <= 1}
          >
            <option value="all">全部场次</option>
            {sessionOptions
              .filter((s) => s !== 'all')
              .map((session) => (
                <option key={session} value={session}>
                  {session}
                </option>
              ))}
          </select>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-[10px]">
            ▾
          </div>
        </div>

        {/* 价格分区筛选 */}
        <div className="flex-shrink-0 relative">
          <select
            value={selectedPriceZone}
            onChange={(e) => onPriceZoneChange(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 transition-all appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed pr-6"
            disabled={priceZoneOptions.length <= 1}
          >
            <option value="all">全部分区</option>
            {priceZoneOptions
              .filter((z) => z !== 'all')
              .map((zone) => (
                <option key={zone} value={zone}>
                  {zone}元区
                </option>
              ))}
          </select>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-[10px]">
            ▾
          </div>
        </div>

        {/* 排序选择器 */}
        <SortSelector
          sortField={sortField}
          sortOrder={sortOrder}
          options={sortOptions}
          onSortChange={onSortChange}
        />
      </div>
    </>
  );
};

export default CollectionFilters;
