import { useCallback, useEffect, useState } from 'react';
import { BALANCE_TYPE_OPTIONS } from '@/constants/balanceTypes';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { getAllLog, type AllLogItem } from '@/services';
import { getStoredToken } from '@/services/client';
import { useAppStore } from '@/stores/appStore';
import type { ListPageCache } from '@/stores/appStore';
import { extractData } from '@/utils/apiHelpers';
import { debugLog, errorLog } from '@/utils/logger';
import {
  DEFAULT_ASSET_HISTORY_FILTERS,
  type AssetHistoryFilters,
} from './assetHistoryTypes';
import { useAssetHistoryCache } from './useAssetHistoryCache';

const PAGE_SIZE = 10;

const buildTimeRange = (time: string): { startTime?: number; endTime?: number } => {
  const now = Math.floor(Date.now() / 1000);

  switch (time) {
    case 'today': {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return {
        startTime: Math.floor(today.getTime() / 1000),
        endTime: now,
      };
    }
    case '7days':
      return {
        startTime: now - 7 * 24 * 3600,
        endTime: now,
      };
    case '30days':
      return {
        startTime: now - 30 * 24 * 3600,
        endTime: now,
      };
    default:
      return {};
  }
};

interface UseAssetHistoryDataResult {
  filters: AssetHistoryFilters;
  searchKeyword: string;
  categoryOptions: Array<{ label: string; value: string }>;
  error: string | null;
  allLogs: AllLogItem[];
  page: number;
  hasMore: boolean;
  loading: boolean;
  expandedRows: Record<number, boolean>;
  setSearchKeyword: (value: string) => void;
  setCategory: (value: string) => void;
  setFlow: (value: string) => void;
  setRange: (value: string) => void;
  toggleExpandedRow: (logId: number) => void;
  bottomRef: (node: HTMLElement | null) => void;
}

export function useAssetHistoryData(): UseAssetHistoryDataResult {
  const { listCaches, setListCache } = useAppStore();

  const [filters, setFilters] = useState<AssetHistoryFilters>(DEFAULT_ASSET_HISTORY_FILTERS);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [allLogs, setAllLogs] = useState<AllLogItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});

  const categoryOptions = BALANCE_TYPE_OPTIONS.map((item) => ({
    label: item.label,
    value: item.value,
  }));

  const { restoredFromCacheRef } = useAssetHistoryCache({
    cache: listCaches.assetHistory as ListPageCache<AllLogItem> | null | undefined,
    setListCache,
    allLogs,
    page,
    hasMore,
    filters,
    searchKeyword,
    setAllLogs,
    setPage,
    setHasMore,
    setFilters,
    setSearchKeyword,
  });

  const loadData = useCallback(
    async (pageNum: number, isRefresh = false) => {
      const token = getStoredToken();
      if (!token) {
        setError('请先登录');
        return;
      }

      setLoading(true);
      if (isRefresh) {
        setError(null);
      }

      try {
        const { startTime, endTime } = buildTimeRange(filters.time);

        const response = await getAllLog({
          page: pageNum,
          limit: PAGE_SIZE,
          type: filters.category === 'all' ? undefined : filters.category,
          flow_direction: filters.flow as 'in' | 'out' | 'all',
          start_time: startTime,
          end_time: endTime,
          keyword: searchKeyword.trim() || undefined,
          token,
        });

        const data = extractData(response);
        if (data) {
          if (pageNum === 1) {
            setAllLogs(data.list || []);
          } else {
            setAllLogs((prev) => [...prev, ...(data.list || [])]);
          }

          setHasMore(
            (data.list?.length || 0) >= PAGE_SIZE &&
              (data.current_page || 1) * PAGE_SIZE < (data.total || 0),
          );
          return;
        }

        if (isRefresh) {
          setError(response.msg || '获取明细失败');
        }
      } catch (error: any) {
        errorLog('AssetHistory', '加载失败', error);
        if (isRefresh) {
          setError(error?.message || '加载数据失败');
        }
      } finally {
        setLoading(false);
      }
    },
    [filters, searchKeyword],
  );

  useEffect(() => {
    if (restoredFromCacheRef.current) {
      restoredFromCacheRef.current = false;
      debugLog('AssetHistory', '跳过首次加载（从缓存恢复）');
      return;
    }

    setPage(1);
    setAllLogs([]);
    setHasMore(false);
    void loadData(1, true);
  }, [filters, searchKeyword, loadData]);

  const handleLoadMore = useCallback(() => {
    if (loading || !hasMore) {
      return;
    }

    const nextPage = page + 1;
    setPage(nextPage);
    void loadData(nextPage);
  }, [loading, hasMore, page, loadData]);

  const setCategory = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, category: value }));
  }, []);

  const setFlow = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, flow: value }));
  }, []);

  const setRange = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, time: value }));
  }, []);

  const toggleExpandedRow = useCallback((logId: number) => {
    setExpandedRows((prev) => ({
      ...prev,
      [logId]: !prev[logId],
    }));
  }, []);

  const bottomRef = useInfiniteScroll(handleLoadMore, hasMore, loading);

  return {
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
  };
}
