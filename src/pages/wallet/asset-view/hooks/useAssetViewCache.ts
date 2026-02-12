import { useEffect, useRef } from 'react';
import { setScrollRestoreInProgress } from '@/components/common/ScrollToTop';
import { MARKET_CACHE_TTL, type ListPageCache } from '@/stores/appStore';
import { debugLog } from '@/utils/logger';
import {
  DEFAULT_CATEGORY_FILTER,
  DEFAULT_FLOW_FILTER,
  DEFAULT_TIME_FILTER,
  HEADER_HEIGHT,
} from '../constants';
import type {
  AssetFlowFilter,
  AssetTimeFilter,
  AssetViewPersistState,
} from '../types';
import { isAssetFlowFilter, isAssetTimeFilter } from '../utils';

interface UseAssetViewCacheParams {
  pathname: string;
  cache: ListPageCache | null | undefined;
  setListCache: (key: 'assetView', cache: ListPageCache) => void;
  tabsData: unknown[];
  activeTab: number;
  hasMore: boolean;
  filterCategory: string;
  filterFlow: AssetFlowFilter;
  filterTime: AssetTimeFilter;
  setFilterCategory: (value: string) => void;
  setFilterFlow: (value: AssetFlowFilter) => void;
  setFilterTime: (value: AssetTimeFilter) => void;
}

export function useAssetViewCache({
  pathname,
  cache,
  setListCache,
  tabsData,
  activeTab,
  hasMore,
  filterCategory,
  filterFlow,
  filterTime,
  setFilterCategory,
  setFilterFlow,
  setFilterTime,
}: UseAssetViewCacheParams) {
  const restoredFromCacheRef = useRef(false);
  const scrollTopRef = useRef(0);
  const stateRef = useRef<AssetViewPersistState>({
    tabsData: [],
    activeTab: 0,
    filterCategory: DEFAULT_CATEGORY_FILTER,
    filterFlow: DEFAULT_FLOW_FILTER,
    filterTime: DEFAULT_TIME_FILTER,
  });

  useEffect(() => {
    if (cache && Date.now() - cache.timestamp < MARKET_CACHE_TTL) {
      debugLog('AssetView', '从缓存恢复状态', {
        dataCount: cache.data.length,
        activeTab: cache.activeTab,
        scrollTop: cache.scrollTop,
      });

      const filters = cache.filters ?? {};
      if (typeof filters.filterCategory === 'string') {
        setFilterCategory(filters.filterCategory);
      }
      if (isAssetFlowFilter(filters.filterFlow)) {
        setFilterFlow(filters.filterFlow);
      }
      // 资产总权益页当前未提供时间筛选 UI，统一回落到默认值，
      // 避免历史缓存中的固定时间窗口导致旧流水无法加载。
      if (filters.filterTime === DEFAULT_TIME_FILTER) {
        setFilterTime(filters.filterTime);
      } else if (isAssetTimeFilter(filters.filterTime)) {
        setFilterTime(DEFAULT_TIME_FILTER);
      }

      restoredFromCacheRef.current = true;
      scrollTopRef.current = cache.scrollTop;
    }
  }, [cache, setFilterCategory, setFilterFlow, setFilterTime]);

  useEffect(() => {
    stateRef.current = {
      tabsData: tabsData || [],
      activeTab,
      filterCategory,
      filterFlow,
      filterTime,
    };
  }, [tabsData, activeTab, filterCategory, filterFlow, filterTime]);

  useEffect(() => {
    if (restoredFromCacheRef.current && tabsData.length > 0 && scrollTopRef.current > 0) {
      setScrollRestoreInProgress(pathname, true);

      let restoreAttempts = 0;
      const maxAttempts = 5;

      const restoreScroll = () => {
        if (scrollTopRef.current > 0) {
          const targetScroll = scrollTopRef.current + HEADER_HEIGHT;
          window.scrollTo({ top: targetScroll, behavior: 'instant' });

          const currentScroll = window.scrollY;
          const actualContentScroll = Math.max(0, currentScroll - HEADER_HEIGHT);
          const diff = Math.abs(actualContentScroll - scrollTopRef.current);

          if (diff < 10 || restoreAttempts >= maxAttempts) {
            if (diff < 10) {
              debugLog('AssetView', '滚动位置恢复成功', {
                target: scrollTopRef.current,
                actual: actualContentScroll,
                attempts: restoreAttempts + 1,
              });
            } else {
              debugLog('AssetView', '滚动位置恢复失败（达到最大尝试次数）', {
                target: scrollTopRef.current,
                actual: actualContentScroll,
                attempts: restoreAttempts + 1,
              });
            }

            setScrollRestoreInProgress(pathname, false);
            restoredFromCacheRef.current = false;
            return;
          }

          restoreAttempts += 1;
          if (restoreAttempts < maxAttempts) {
            setTimeout(restoreScroll, 100);
          } else {
            setScrollRestoreInProgress(pathname, false);
            restoredFromCacheRef.current = false;
          }
        } else {
          setScrollRestoreInProgress(pathname, false);
          restoredFromCacheRef.current = false;
        }
      };

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          restoreScroll();
          setTimeout(restoreScroll, 100);
          setTimeout(restoreScroll, 300);
        });
      });

      setTimeout(() => {
        setScrollRestoreInProgress(pathname, false);
        restoredFromCacheRef.current = false;
      }, 5000);
    }
  }, [tabsData.length, pathname]);

  useEffect(() => {
    const handleScrollForCache = () => {
      scrollTopRef.current = Math.max(0, window.scrollY - HEADER_HEIGHT);
    };

    window.addEventListener('scroll', handleScrollForCache);

    return () => {
      window.removeEventListener('scroll', handleScrollForCache);

      const state = stateRef.current;
      if (state.tabsData.length > 0) {
        debugLog('AssetView', '保存缓存状态', {
          dataCount: state.tabsData.length,
          activeTab: state.activeTab,
          scrollTop: scrollTopRef.current,
        });

        setListCache('assetView', {
          data: state.tabsData as unknown[],
          page: 1,
          hasMore,
          scrollTop: scrollTopRef.current,
          activeTab: String(state.activeTab),
          filters: {
            filterCategory: state.filterCategory,
            filterFlow: state.filterFlow,
            filterTime: state.filterTime,
          },
          timestamp: Date.now(),
        });
      }
    };
  }, [setListCache, hasMore]);
}
