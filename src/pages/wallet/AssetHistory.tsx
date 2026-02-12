/**
 * AssetHistory - 资产历史记录页面
 * 已迁移: 使用 React Router 导航
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Filter, FileText } from 'lucide-react';
import { FilterBar } from '@/components/common/FilterBar';
import { SearchInput } from '@/components/common';
import type { AllLogItem } from '@/services';
import AssetHistoryLogCard from './components/asset/AssetHistoryLogCard';
import { useAssetHistoryData } from './hooks/useAssetHistoryData';

const AssetHistory: React.FC = () => {
  const navigate = useNavigate();
  const {
    filters,
    searchKeyword,
    categoryOptions,
    error,
    allLogs,
    page,
    hasMore,
    loading,
    expandedRows,
    setSearchKeyword,
    setCategory,
    setFlow,
    setRange,
    toggleExpandedRow,
    bottomRef,
  } = useAssetHistoryData();

  const handleItemClick = (item: AllLogItem) => {
    const flowNoQuery = item.flow_no ? `?flowNo=${encodeURIComponent(item.flow_no)}` : '';
    navigate(`/money-log/${item.id}${flowNoQuery}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white sticky top-0 z-30">
        <div className="px-4 py-3 flex items-center relative border-b border-gray-100">
          <button onClick={() => navigate(-1)} className="absolute left-4 p-1 z-10 text-gray-600">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-gray-800 w-full text-center">历史记录</h1>
        </div>

        <div className="px-4 py-2 border-b border-gray-100 bg-gray-50/50">
          <SearchInput
            value={searchKeyword}
            onChange={setSearchKeyword}
            placeholder="搜索备注、活动名称..."
            debounce={300}
          />
        </div>

        <FilterBar
          category={filters.category}
          setCategory={setCategory}
          flow={filters.flow}
          setFlow={setFlow}
          range={filters.time}
          setRange={setRange}
          categoryOptions={categoryOptions}
        />
      </header>

      <div className="flex-1 p-3">
        {loading && page === 1 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="animate-spin mb-2">
              <Filter size={24} className="opacity-20" />
            </div>
            <span className="text-xs">加载中...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-red-400">
            <span className="text-xs">{error}</span>
          </div>
        ) : allLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <FileText size={24} className="text-gray-300" />
            </div>
            <span className="text-xs text-gray-400">暂无相关记录</span>
          </div>
        ) : (
          <div className="space-y-3 pb-safe">
            {allLogs.map((item) => (
              <AssetHistoryLogCard
                key={`log-${item.id}`}
                item={item}
                expanded={Boolean(expandedRows[item.id])}
                onToggleExpand={toggleExpandedRow}
                onOpenDetail={handleItemClick}
              />
            ))}

            <div ref={bottomRef} className="h-4" />

            {loading && hasMore && <div className="text-center py-4 text-xs text-gray-400">加载中...</div>}

            {!hasMore && allLogs.length > 5 && (
              <div className="text-center py-4 text-xs text-gray-300">- 到底了 -</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetHistory;
