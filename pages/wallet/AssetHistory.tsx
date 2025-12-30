
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Filter, FileText } from 'lucide-react';
import { FilterBar } from '../../components/FilterBar';
import {
  getAllLog,
  AllLogItem,
  AUTH_TOKEN_KEY,
} from '../../services/api';
import { isSuccess, extractData } from '../../utils/apiHelpers';
import { BALANCE_TYPE_OPTIONS, getBalanceTypeLabel } from '../../constants/balanceTypes';

interface AssetHistoryProps {
  onBack: () => void;
}

const AssetHistory: React.FC<AssetHistoryProps> = ({ onBack }) => {
  // 筛选状态
  const [filters, setFilters] = useState({
    category: 'all',
    flow: 'all',
    time: 'all',
  });

  const categoryOptions = [...BALANCE_TYPE_OPTIONS];

  const setCategory = (v: string) => setFilters(prev => ({ ...prev, category: v }));
  const setFlow = (v: string) => setFilters(prev => ({ ...prev, flow: v }));
  const setRange = (v: string) => setFilters(prev => ({ ...prev, time: v }));

  // 数据状态
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [allLogs, setAllLogs] = useState<AllLogItem[]>([]);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);

  // 重置并加载数据
  useEffect(() => {
    setPage(1);
    setAllLogs([]);
    setHasMore(false);
    loadData(1, true);
  }, [filters]);

  // 加载更多
  const handleLoadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
      loadData(page + 1);
    }
  };

  const loadData = async (pageNum: number, isRefresh = false) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      setError('请先登录');
      return;
    }

    setLoading(true);
    if (isRefresh) setError(null);

    try {
      // 构建时间参数
      let startTime: number | undefined;
      let endTime: number | undefined;
      const now = Math.floor(Date.now() / 1000);

      switch (filters.time) {
        case 'today':
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          startTime = Math.floor(today.getTime() / 1000);
          endTime = now;
          break;
        case '7days':
          startTime = now - 7 * 24 * 3600;
          endTime = now;
          break;
        case '30days':
          startTime = now - 30 * 24 * 3600;
          endTime = now;
          break;
      }

      const res = await getAllLog({
        page: pageNum,
        limit: 10,
        type: filters.category,
        flow_direction: filters.flow as 'in' | 'out' | 'all',
        start_time: startTime,
        end_time: endTime,
        token
      });

      const data = extractData(res);
      if (data) {
        if (pageNum === 1) {
          setAllLogs(data.list || []);
        } else {
          setAllLogs(prev => [...prev, ...(data.list || [])]);
        }
        setHasMore((data.list?.length || 0) >= 10 && (data.current_page || 1) * 10 < (data.total || 0));
      } else {
        if (isRefresh) setError(res.msg || '获取明细失败');
      }
    } catch (e: any) {
      console.error('[AssetHistory] 加载失败:', e);
      if (isRefresh) setError(e?.message || '加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: number | string | null): string => {
    if (!timestamp) return '';
    const date = new Date(typeof timestamp === 'string' ? parseInt(timestamp) * 1000 : timestamp * 1000);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeLabel = (type: string, fieldType?: string): string => {
    // Use field_type if available for more precise identification
    const typeToUse = fieldType || type;
    return getBalanceTypeLabel(typeToUse);
  };

  const renderLogItem = (item: AllLogItem) => {
    const isGreenPower = item.field_type === 'green_power' || item.type === 'green_power';
    const isScore = item.type === 'score';
    const amountVal = Number(item.amount);
    const isPositive = amountVal > 0;
    const typeLabel = getTypeLabel(item.type, item.field_type);

    return (
      <div key={`log-${item.id}`} className="bg-white rounded-xl p-4 mb-3 border border-gray-100 shadow-sm relative">
        <div className="flex justify-between items-start mb-2">
          {/* 左侧：标题与标签 */}
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 mb-1.5">
              {/* Type Category Tag */}
              <span className={`text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 ${item.type === 'balance_available' ? 'bg-orange-50 text-orange-600' :
                item.type === 'withdrawable_money' ? 'bg-blue-50 text-blue-600' :
                  item.type === 'service_fee_balance' ? 'bg-purple-50 text-purple-600' :
                    item.type === 'score' ? 'bg-yellow-50 text-yellow-600' :
                      'bg-gray-100 text-gray-500'
                }`}>
                {typeLabel}
              </span>
              <span className="text-sm text-gray-700 font-medium truncate">
                {item.memo || item.remark || '资金变动'}
              </span>
            </div>
            <div className="text-xs text-gray-400">
              {formatTime(item.createtime || item.create_time)}
            </div>
          </div>

          {/* 右侧：金额 */}
          <div className="text-right flex-shrink-0">
            <div className={`text-base font-bold font-[DINAlternate-Bold,Roboto,sans-serif] ${isPositive ? 'text-[#FF6B00]' : 'text-gray-900'}`}>
              {isPositive ? '+' : ''}{Math.abs(amountVal).toFixed(isScore ? 0 : 2)}
              <span className="text-xs font-normal ml-0.5 text-gray-400">
                {isGreenPower ? '算力' : isScore ? '' : '元'}
              </span>
            </div>
          </div>
        </div>

        {/* 底部：余额 */}
        <div className="mt-2 pt-2 border-t border-gray-50 flex justify-end">
          <span className="text-xs text-gray-400 flex items-center">
            余额: {Number(item.before_value).toFixed(isScore ? 0 : 2)}
            <span className="mx-1">→</span>
            {Number(item.after_value || item.after_balance).toFixed(isScore ? 0 : 2)}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white sticky top-0 z-30">
        <div className="px-4 py-3 flex items-center relative border-b border-gray-100">
          <button onClick={onBack} className="absolute left-4 p-1 z-10 text-gray-600">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-gray-800 w-full text-center">历史记录</h1>
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

      {/* Content List */}
      <div className="flex-1 p-3">
        {loading && page === 1 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="animate-spin mb-2"><Filter size={24} className="opacity-20" /></div>
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
            {allLogs.map(renderLogItem)}

            {hasMore && (
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="w-full py-3 text-xs text-gray-400 text-center disabled:opacity-50"
              >
                {loading ? '加载中...' : '点击加载更多'}
              </button>
            )}

            {!hasMore && allLogs.length > 5 && (
              <div className="text-center py-4 text-xs text-gray-300">
                - 到底了 -
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetHistory;
