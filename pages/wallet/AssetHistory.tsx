
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Filter, ChevronDown, Calendar, Wallet, Check, X, FileText } from 'lucide-react';
import {
  getAllLog,
  AllLogItem,
  AUTH_TOKEN_KEY,
} from '../../services/api';
import { isSuccess, extractData } from '../../utils/apiHelpers';

interface AssetHistoryProps {
  onBack: () => void;
}

// 筛选配置
const FILTER_CATEGORIES = [
  { label: '全部', value: 'all' },
  { label: '供应链专项金', value: 'balance_available' },
  { label: '可调度收益', value: 'withdrawable_money' },
  { label: '确权金', value: 'service_fee_balance' },
  { label: '消费金', value: 'score' },
  { label: '绿色积分', value: 'green_power' },
];

const FILTER_FLOW = [
  { label: '全部收支', value: 'all' },
  { label: '收入', value: 'in' },
  { label: '支出', value: 'out' },
];

const FILTER_TIME = [
  { label: '全部时间', value: 'all' },
  { label: '今天', value: 'today' },
  { label: '近7天', value: '7days' },
  { label: '近30天', value: '30days' },
];

const AssetHistory: React.FC<AssetHistoryProps> = ({ onBack }) => {
  // 筛选状态
  const [filters, setFilters] = useState({
    category: 'all',
    flow: 'all',
    time: 'all',
  });

  // UI状态
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null); // 'category', 'flow', 'time'
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 数据状态
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [allLogs, setAllLogs] = useState<AllLogItem[]>([]);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);

  // 关闭下拉菜单点击外部
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    if (fieldType === 'green_power' || type === 'green_power') return '绿色积分';
    const labels: Record<string, string> = {
      balance_available: '供应链专项金',
      withdrawable_money: '可调度收益',
      service_fee_balance: '确权金',
      score: '消费金',
      all: '资金'
    };
    return labels[type] || type;
  };

  const toggleDropdown = (name: string) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  const handleFilterSelect = (key: 'category' | 'flow' | 'time', value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setActiveDropdown(null);
  };

  // 渲染下拉菜单通用组件
  const renderDropdownMenu = (
    options: { label: string; value: string }[],
    currentValue: string,
    onSelect: (val: string) => void
  ) => (
    <div className="absolute top-full left-0 mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-20 max-h-64 overflow-y-auto">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onSelect(opt.value)}
          className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between ${currentValue === opt.value ? 'text-orange-600 bg-orange-50' : 'text-gray-700 hover:bg-gray-50'
            }`}
        >
          <span>{opt.label}</span>
          {currentValue === opt.value && <Check size={16} />}
        </button>
      ))}
    </div>
  );

  const getFilterLabel = (options: { label: string; value: string }[], value: string) => {
    return options.find(o => o.value === value)?.label || options[0].label;
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
          <span className="text-xs text-gray-400">
            余额: {Number(item.after_value || item.after_balance).toFixed(isScore ? 0 : 2)}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white sticky top-0 z-30 border-b border-gray-100">
        <div className="px-4 py-3 flex items-center relative">
          <button onClick={onBack} className="absolute left-4 p-1 z-10 text-gray-600">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-gray-800 w-full text-center">历史记录</h1>
        </div>

        {/* Filter Bar */}
        <div className="px-2 py-2 flex gap-2" ref={dropdownRef}>
          {/* Category Filter */}
          <div className="relative flex-1">
            <button
              onClick={() => toggleDropdown('category')}
              className={`w-full flex items-center justify-center gap-1 py-2 text-xs font-medium rounded-lg transition-colors ${activeDropdown === 'category' ? 'bg-orange-50 text-orange-600' : 'bg-gray-50 text-gray-600'
                }`}
            >
              <span className="truncate max-w-[4em]">{getFilterLabel(FILTER_CATEGORIES, filters.category)}</span>
              <ChevronDown size={14} className={`transition-transform ${activeDropdown === 'category' ? 'rotate-180' : ''}`} />
            </button>
            {activeDropdown === 'category' && renderDropdownMenu(FILTER_CATEGORIES, filters.category, (val) => handleFilterSelect('category', val))}
          </div>

          {/* Flow Filter */}
          <div className="relative flex-1">
            <button
              onClick={() => toggleDropdown('flow')}
              className={`w-full flex items-center justify-center gap-1 py-2 text-xs font-medium rounded-lg transition-colors ${activeDropdown === 'flow' ? 'bg-orange-50 text-orange-600' : 'bg-gray-50 text-gray-600'
                }`}
            >
              <span className="truncate">{getFilterLabel(FILTER_FLOW, filters.flow)}</span>
              <ChevronDown size={14} className={`transition-transform ${activeDropdown === 'flow' ? 'rotate-180' : ''}`} />
            </button>
            {activeDropdown === 'flow' && renderDropdownMenu(FILTER_FLOW, filters.flow, (val) => handleFilterSelect('flow', val))}
          </div>

          {/* Time Filter */}
          <div className="relative flex-1">
            <button
              onClick={() => toggleDropdown('time')}
              className={`w-full flex items-center justify-center gap-1 py-2 text-xs font-medium rounded-lg transition-colors ${activeDropdown === 'time' ? 'bg-orange-50 text-orange-600' : 'bg-gray-50 text-gray-600'
                }`}
            >
              <span className="truncate">{getFilterLabel(FILTER_TIME, filters.time)}</span>
              <ChevronDown size={14} className={`transition-transform ${activeDropdown === 'time' ? 'rotate-180' : ''}`} />
            </button>
            {activeDropdown === 'time' && renderDropdownMenu(FILTER_TIME, filters.time, (val) => handleFilterSelect('time', val))}
          </div>
        </div>
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
            <img src="https://via.placeholder.com/100?text=NoData" alt="" className="w-24 h-24 mb-4 opacity-20 hidden" />
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
