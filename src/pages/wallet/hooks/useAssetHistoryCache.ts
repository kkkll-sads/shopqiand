import { useEffect, useRef } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { AllLogItem } from '@/services';
import { MARKET_CACHE_TTL } from '@/stores/appStore';
import type { ListPageCache } from '@/stores/appStore';
import { debugLog } from '@/utils/logger';
import {
  DEFAULT_ASSET_HISTORY_FILTERS,
  type AssetHistoryFilters,
  type AssetHistoryStateSnapshot,
} from './assetHistoryTypes';

interface UseAssetHistoryCacheParams {
  cache: ListPageCache<AllLogItem> | null | undefined;
  setListCache: (key: 'assetHistory', cache: ListPageCache<AllLogItem>) => void;
  allLogs: AllLogItem[];
  page: number;
  hasMore: boolean;
  filters: AssetHistoryFilters;
  searchKeyword: string;
  setAllLogs: Dispatch<SetStateAction<AllLogItem[]>>;
  setPage: Dispatch<SetStateAction<number>>;
  setHasMore: Dispatch<SetStateAction<boolean>>;
  setFilters: Dispatch<SetStateAction<AssetHistoryFilters>>;
  setSearchKeyword: Dispatch<SetStateAction<string>>;
}

interface UseAssetHistoryCacheResult {
  restoredFromCacheRef: MutableRefObject<boolean>;
}

export function useAssetHistoryCache({
  cache,
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
}: UseAssetHistoryCacheParams): UseAssetHistoryCacheResult {
  const restoredFromCacheRef = useRef(false);
  const scrollTopRef = useRef(0);
  const stateRef = useRef<AssetHistoryStateSnapshot>({
    allLogs: [],
    page: 1,
    hasMore: false,
    filters: DEFAULT_ASSET_HISTORY_FILTERS,
    searchKeyword: '',
  });

  useEffect(() => {
    if (!cache || Date.now() - cache.timestamp >= MARKET_CACHE_TTL) {
      return;
    }

    debugLog('AssetHistory', '从缓存恢复状态', {
      dataCount: cache.data.length,
      page: cache.page,
      scrollTop: cache.scrollTop,
    });

    setAllLogs(cache.data as AllLogItem[]);
    setPage(cache.page);
    setHasMore(cache.hasMore);

    const cacheFilters = cache.filters as
      | Partial<AssetHistoryFilters & { searchKeyword: string }>
      | undefined;
    if (cacheFilters) {
      setFilters({
        category: cacheFilters.category || DEFAULT_ASSET_HISTORY_FILTERS.category,
        flow: cacheFilters.flow || DEFAULT_ASSET_HISTORY_FILTERS.flow,
        time: cacheFilters.time || DEFAULT_ASSET_HISTORY_FILTERS.time,
      });
      if (cacheFilters.searchKeyword) {
        setSearchKeyword(cacheFilters.searchKeyword);
      }
    }

    restoredFromCacheRef.current = true;
    scrollTopRef.current = cache.scrollTop;
  }, []);

  useEffect(() => {
    if (!restoredFromCacheRef.current || allLogs.length === 0 || scrollTopRef.current <= 0) {
      return;
    }

    const restoreScroll = () => {
      if (scrollTopRef.current <= 0) {
        return;
      }

      const targetScroll = scrollTopRef.current;
      window.scrollTo({ top: targetScroll, behavior: 'auto' });
      if (Math.abs(window.scrollY - targetScroll) > 10) {
        setTimeout(() => {
          window.scrollTo({ top: targetScroll, behavior: 'auto' });
        }, 100);
      }
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        restoreScroll();
        setTimeout(restoreScroll, 100);
        setTimeout(restoreScroll, 300);
      });
    });

    restoredFromCacheRef.current = false;
  }, [allLogs.length]);

  useEffect(() => {
    stateRef.current = {
      allLogs,
      page,
      hasMore,
      filters,
      searchKeyword,
    };
  }, [allLogs, page, hasMore, filters, searchKeyword]);

  useEffect(() => {
    const handleScrollForCache = () => {
      scrollTopRef.current = window.scrollY;
    };

    window.addEventListener('scroll', handleScrollForCache);

    return () => {
      window.removeEventListener('scroll', handleScrollForCache);

      const state = stateRef.current;
      if (state.allLogs.length === 0) {
        return;
      }

      debugLog('AssetHistory', '保存缓存状态', {
        dataCount: state.allLogs.length,
        page: state.page,
        scrollTop: scrollTopRef.current,
      });

      setListCache('assetHistory', {
        data: state.allLogs,
        page: state.page,
        hasMore: state.hasMore,
        scrollTop: scrollTopRef.current,
        filters: {
          ...state.filters,
          searchKeyword: state.searchKeyword,
        },
        timestamp: Date.now(),
      });
    };
  }, [setListCache]);

  return { restoredFromCacheRef };
}
