/**
 * AssetHistory - 资产历史记录页面
 * 已迁移: 使用 React Router 导航
 */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Filter, FileText, ChevronRight } from 'lucide-react';
import { FilterBar } from '../../../components/FilterBar';
import { SearchInput } from '../../../components/common';
import {
  getAllLog,
  AllLogItem,
} from '../../../services/api';
import { getStoredToken } from '../../../services/client';
import { isSuccess, extractData } from '../../../utils/apiHelpers';
import { BALANCE_TYPE_OPTIONS, getBalanceTypeLabel } from '../../../constants/balanceTypes';
import { useStateMachine } from '../../../hooks/useStateMachine';
import { LoadingEvent, LoadingState } from '../../../types/states';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import { errorLog, debugLog } from '../../../utils/logger';
import { useAppStore, MARKET_CACHE_TTL } from '../../stores/appStore';

const AssetHistory: React.FC = () => {
  const navigate = useNavigate();
  const { listCaches, setListCache } = useAppStore();
  
  // 缓存相关 refs
  const restoredFromCacheRef = useRef(false);
  const scrollTopRef = useRef(0);
  
  // 筛选状态
  const [filters, setFilters] = useState({
    category: 'all',
    flow: 'all',
    time: 'all',
  });
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  const categoryOptions = [...BALANCE_TYPE_OPTIONS];

  const setCategory = (v: string) => setFilters(prev => ({ ...prev, category: v }));
  const setFlow = (v: string) => setFilters(prev => ({ ...prev, flow: v }));
  const setRange = (v: string) => setFilters(prev => ({ ...prev, time: v }));

  // 数据状态
  const [error, setError] = useState<string | null>(null);
  const [allLogs, setAllLogs] = useState<AllLogItem[]>([]);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const loadMachine = useStateMachine<LoadingState, LoadingEvent>({
    initial: LoadingState.IDLE,
    transitions: {
      [LoadingState.IDLE]: { [LoadingEvent.LOAD]: LoadingState.LOADING },
      [LoadingState.LOADING]: {
        [LoadingEvent.SUCCESS]: LoadingState.SUCCESS,
        [LoadingEvent.ERROR]: LoadingState.ERROR,
      },
      [LoadingState.SUCCESS]: {
        [LoadingEvent.LOAD]: LoadingState.LOADING,
        [LoadingEvent.RETRY]: LoadingState.LOADING,
      },
      [LoadingState.ERROR]: {
        [LoadingEvent.LOAD]: LoadingState.LOADING,
        [LoadingEvent.RETRY]: LoadingState.LOADING,
      },
    },
  });
  const loading = loadMachine.state === LoadingState.LOADING;

  // ========================================
  // 缓存恢复逻辑：组件挂载时检查并恢复缓存
  // ========================================
  useEffect(() => {
    const cache = listCaches.assetHistory;
    if (cache && Date.now() - cache.timestamp < MARKET_CACHE_TTL) {
      debugLog('AssetHistory', '从缓存恢复状态', {
        dataCount: cache.data.length,
        page: cache.page,
        scrollTop: cache.scrollTop
      });
      
      // 恢复状态
      setAllLogs(cache.data as AllLogItem[]);
      setPage(cache.page);
      setHasMore(cache.hasMore);
      if (cache.filters) {
        setFilters({
          category: cache.filters.category || 'all',
          flow: cache.filters.flow || 'all',
          time: cache.filters.time || 'all'
        });
        if (cache.filters.searchKeyword) setSearchKeyword(cache.filters.searchKeyword);
      }
      
      // 标记已从缓存恢复
      restoredFromCacheRef.current = true;
      
      // 恢复滚动位置（需要等待渲染完成）
      requestAnimationFrame(() => {
        if (cache.scrollTop > 0) {
          window.scrollTo({ top: cache.scrollTop, behavior: 'instant' });
        }
      });
      
      // 设置状态机为成功状态
      loadMachine.send(LoadingEvent.LOAD);
      loadMachine.send(LoadingEvent.SUCCESS);
    }
  }, []); // 仅在组件挂载时执行一次

  // ========================================
  // 缓存保存逻辑：组件卸载时保存状态
  // ========================================
  useEffect(() => {
    // 更新滚动位置 ref
    const handleScrollForCache = () => {
      scrollTopRef.current = window.scrollY;
    };
    
    window.addEventListener('scroll', handleScrollForCache);
    
    return () => {
      window.removeEventListener('scroll', handleScrollForCache);
      
      // 组件卸载时保存缓存（仅在有数据时保存）
      if (allLogs.length > 0) {
        debugLog('AssetHistory', '保存缓存状态', {
          dataCount: allLogs.length,
          page,
          scrollTop: scrollTopRef.current
        });
        
        setListCache('assetHistory', {
          data: allLogs,
          page,
          hasMore,
          scrollTop: scrollTopRef.current,
          filters: { ...filters, searchKeyword },
          timestamp: Date.now()
        });
      }
    };
  }, [allLogs, page, hasMore, filters, searchKeyword, setListCache]);

  // 重置并加载数据
  useEffect(() => {
    // 如果是从缓存恢复的，跳过首次加载
    if (restoredFromCacheRef.current) {
      restoredFromCacheRef.current = false;
      debugLog('AssetHistory', '跳过首次加载（从缓存恢复）');
      return;
    }
    setPage(1);
    setAllLogs([]);
    setHasMore(false);
    loadData(1, true);
  }, [filters, searchKeyword]);

  // 加载更多
  const handleLoadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
      loadData(page + 1);
    }
  };

  const bottomRef = useInfiniteScroll(handleLoadMore, hasMore, loading);

  const loadData = async (pageNum: number, isRefresh = false) => {
    const token = getStoredToken();
    if (!token) {
      setError('请先登录');
      loadMachine.send(LoadingEvent.ERROR);
      return;
    }

    loadMachine.send(LoadingEvent.LOAD);
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
        type: filters.category === 'all' ? undefined : filters.category,
        flow_direction: filters.flow as 'in' | 'out' | 'all',
        start_time: startTime,
        end_time: endTime,
        keyword: searchKeyword.trim() || undefined,
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
        loadMachine.send(LoadingEvent.SUCCESS);
      } else {
        if (isRefresh) setError(res.msg || '获取明细失败');
        loadMachine.send(LoadingEvent.ERROR);
      }
    } catch (e: any) {
      errorLog('AssetHistory', '加载失败', e);
      if (isRefresh) setError(e?.message || '加载数据失败');
      loadMachine.send(LoadingEvent.ERROR);
    } finally {
      // 状态机已处理成功/失败
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

  const handleItemClick = (item: AllLogItem) => {
    navigate(`/money-log/${item.id}`, {
      state: { flowNo: item.flow_no }
    });
  };

  // 获取类型标签的颜色样式
  const getTypeTagStyle = (type: string, fieldType?: string): string => {
    const typeToCheck = fieldType || type;
    if (typeToCheck === 'green_power' || typeToCheck === '绿色能量' || typeToCheck === '算力') {
      return 'bg-emerald-50 text-emerald-600';
    }
    if (typeToCheck === 'balance_available' || typeToCheck === 'balance' || typeToCheck === '余额') {
      return 'bg-blue-50 text-blue-600';
    }
    if (typeToCheck === 'withdrawable_money' || typeToCheck === '可提现余额') {
      return 'bg-indigo-50 text-indigo-600';
    }
    if (typeToCheck === 'service_fee_balance' || typeToCheck === '服务费') {
      return 'bg-amber-50 text-amber-600';
    }
    if (typeToCheck === 'score' || typeToCheck === '积分' || typeToCheck === '消费金') {
      return 'bg-purple-50 text-purple-600';
    }
    return 'bg-gray-100 text-gray-500';
  };

  const renderLogItem = (item: AllLogItem) => {
    const isGreenPower = item.field_type === 'green_power' || item.type === 'green_power';
    const isScore = item.type === 'score';
    // 检查是否为签到记录
    const isSignRecord = item.sign_record_id !== undefined || item.activity_name !== undefined;
    const amountVal = Number(item.amount);

    // Determine direction based on balance change if available, otherwise fallback to amount sign
    let isPositive = amountVal > 0;
    if (item.before_value !== undefined && item.after_value !== undefined) {
      isPositive = Number(item.after_value) > Number(item.before_value);
    } else if (item.before_balance !== undefined && item.after_balance !== undefined) {
      // Fallback for some API responses that use 'balance' instead of 'value'
      isPositive = Number(item.after_balance) > Number(item.before_balance);
    } else if (item.flow_direction) {
      // Fallback to explicit flow direction if available
      isPositive = item.flow_direction === 'in';
    }

    const typeLabel = getTypeLabel(item.type, item.field_type);
    const typeTagStyle = getTypeTagStyle(item.type, item.field_type);

    return (
      <div
        key={`log-${item.id}`}
        className="bg-white rounded-xl p-4 mb-3 border border-gray-100 shadow-sm relative cursor-pointer active:bg-gray-50 active:scale-[0.99] transition-all"
        onClick={() => handleItemClick(item)}
      >
        <div className="flex justify-between items-start mb-2">
          {/* 左侧：标题与标签 */}
          <div className="flex-1 pr-4 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              {/* Type Category Tag - 统一颜色方案 */}
              <span className={`text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 font-medium ${typeTagStyle}`}>
                {typeLabel}
              </span>
              <span className="text-sm text-gray-700 font-medium truncate">
                {isSignRecord ? item.activity_name || '签到奖励' : (item.memo || item.remark || '资金变动')}
              </span>
            </div>
            <div className="text-xs text-gray-400">
              {isSignRecord ? item.sign_date || formatTime(item.createtime || item.create_time) : formatTime(item.createtime || item.create_time)}
            </div>
          </div>

          {/* 右侧：金额和箭头 */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="text-right">
              <div className={`text-base font-bold font-[DINAlternate-Bold,Roboto,sans-serif] ${
                isGreenPower ? (isPositive ? 'text-emerald-500' : 'text-emerald-600') :
                isPositive ? 'text-red-600' : 'text-gray-900'
              }`}>
                {isPositive ? '+' : ''}{Math.abs(amountVal).toFixed(2)}
                <span className="text-xs font-normal ml-0.5 text-gray-400">
                  {isGreenPower ? '算力' : isScore ? '' : '元'}
                </span>
              </div>
            </div>
            <ChevronRight size={16} className="text-gray-300" />
          </div>
        </div>

        {/* 底部：余额变化 */}
        <div className="mt-2 pt-2 border-t border-gray-50 flex justify-end">
          <span className="text-xs text-gray-400 flex items-center font-mono">
            {Number(item.before_value).toFixed(2)}
            <span className="mx-1.5 text-gray-300">→</span>
            <span className={isPositive ? (isGreenPower ? 'text-emerald-500' : 'text-red-500') : 'text-gray-600'}>
              {Number(item.after_value || item.after_balance).toFixed(2)}
            </span>
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
          <button onClick={() => navigate(-1)} className="absolute left-4 p-1 z-10 text-gray-600">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-gray-800 w-full text-center">历史记录</h1>
        </div>

        {/* 搜索框 */}
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

            {/* sentinel for infinite scroll */}
            <div ref={bottomRef} className="h-4" />

            {loading && hasMore && (
              <div className="text-center py-4 text-xs text-gray-400">
                加载中...
              </div>
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
