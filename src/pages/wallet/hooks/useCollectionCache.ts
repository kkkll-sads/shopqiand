/**
 * 藏品列表缓存管理 Hook
 * 处理列表状态的保存和恢复
 */
import React, { useRef, useEffect, useCallback } from 'react';
import { useAppStore, MARKET_CACHE_TTL } from '../../../stores/appStore';
import { MyCollectionItem } from '../../../../services/api';
import { debugLog } from '../../../../utils/logger';
import type { SortOrder } from '../../../../components/common';

export type CategoryTab = 'hold' | 'consign' | 'sold' | 'dividend';

export interface CollectionCacheState {
  myCollections: MyCollectionItem[];
  page: number;
  hasMore: boolean;
  activeTab: CategoryTab;
  selectedSession: string;
  selectedPriceZone: string;
  searchKeyword: string;
  sortField: string;
  sortOrder: SortOrder;
}

interface UseCollectionCacheOptions {
  scrollContainerRef: React.RefObject<HTMLDivElement>;
  onRestoreState: (state: Partial<CollectionCacheState>) => void;
  onLoadingComplete: () => void;
}

/**
 * 藏品列表缓存 Hook
 */
export function useCollectionCache(options: UseCollectionCacheOptions) {
  const { scrollContainerRef, onRestoreState, onLoadingComplete } = options;
  const { listCaches, setListCache } = useAppStore();

  // 缓存相关 refs
  const restoredFromCacheRef = useRef(false);
  const scrollTopRef = useRef(0);
  const stateRef = useRef<CollectionCacheState>({
    myCollections: [],
    page: 1,
    hasMore: false,
    activeTab: 'hold',
    selectedSession: 'all',
    selectedPriceZone: 'all',
    searchKeyword: '',
    sortField: 'create_time',
    sortOrder: 'desc',
  });

  // 检查并恢复缓存
  useEffect(() => {
    const cache = listCaches.myCollection;
    if (cache && Date.now() - cache.timestamp < MARKET_CACHE_TTL) {
      debugLog('useCollectionCache', '从缓存恢复状态', {
        dataCount: cache.data.length,
        page: cache.page,
        activeTab: cache.activeTab,
        scrollTop: cache.scrollTop,
      });

      // 恢复状态
      onRestoreState({
        myCollections: cache.data as MyCollectionItem[],
        page: cache.page,
        hasMore: cache.hasMore,
        activeTab: cache.activeTab as CategoryTab,
        selectedSession: cache.filters?.selectedSession,
        selectedPriceZone: cache.filters?.selectedPriceZone,
        searchKeyword: cache.filters?.searchKeyword,
        sortField: cache.filters?.sortField,
        sortOrder: cache.filters?.sortOrder as SortOrder,
      });

      // 标记已从缓存恢复
      restoredFromCacheRef.current = true;
      scrollTopRef.current = cache.scrollTop;

      // 通知加载完成
      onLoadingComplete();
    }
  }, []); // 仅在组件挂载时执行一次

  // 更新状态引用
  const updateStateRef = useCallback((state: Partial<CollectionCacheState>) => {
    stateRef.current = { ...stateRef.current, ...state };
  }, []);

  // 保存缓存
  useEffect(() => {
    const handleScrollForCache = () => {
      if (scrollContainerRef.current) {
        scrollTopRef.current = scrollContainerRef.current.scrollTop;
      }
    };

    const container = scrollContainerRef.current;
    container?.addEventListener('scroll', handleScrollForCache);

    return () => {
      container?.removeEventListener('scroll', handleScrollForCache);

      // 组件卸载时保存缓存
      const state = stateRef.current;
      if (state.myCollections.length > 0) {
        debugLog('useCollectionCache', '保存缓存状态', {
          dataCount: state.myCollections.length,
          page: state.page,
          activeTab: state.activeTab,
          scrollTop: scrollTopRef.current,
        });

        setListCache('myCollection', {
          data: state.myCollections,
          page: state.page,
          hasMore: state.hasMore,
          scrollTop: scrollTopRef.current,
          activeTab: state.activeTab,
          filters: {
            selectedSession: state.selectedSession,
            selectedPriceZone: state.selectedPriceZone,
            searchKeyword: state.searchKeyword,
            sortField: state.sortField,
            sortOrder: state.sortOrder,
          },
          timestamp: Date.now(),
        });
      }
    };
  }, [setListCache, scrollContainerRef]);

  // 恢复滚动位置
  const restoreScrollPosition = useCallback(
    (dataLength: number) => {
      if (restoredFromCacheRef.current && dataLength > 0 && scrollTopRef.current > 0) {
        const restoreScroll = () => {
          if (scrollContainerRef.current && scrollTopRef.current > 0) {
            const targetScroll = scrollTopRef.current;
            scrollContainerRef.current.scrollTo({ top: targetScroll, behavior: 'instant' });
            if (Math.abs(scrollContainerRef.current.scrollTop - targetScroll) > 10) {
              setTimeout(() => {
                if (scrollContainerRef.current) {
                  scrollContainerRef.current.scrollTo({ top: targetScroll, behavior: 'instant' });
                }
              }, 100);
            }
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
      }
    },
    [scrollContainerRef]
  );

  return {
    restoredFromCacheRef,
    updateStateRef,
    restoreScrollPosition,
    isRestoredFromCache: () => restoredFromCacheRef.current,
    clearRestoredFlag: () => {
      restoredFromCacheRef.current = false;
    },
  };
}
