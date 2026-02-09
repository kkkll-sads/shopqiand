/**
 * 藏品列表缓存管理 Hook
 * 处理列表状态的保存和恢复
 */
import React, { useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppStore, MARKET_CACHE_TTL } from '@/stores/appStore';
import { MyCollectionItem } from '@/services';
import { debugLog } from '@/utils/logger';
import { setScrollRestoreInProgress } from '@/components/common/ScrollToTop';
import type { SortOrder } from '@/components/common';

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
  const location = useLocation();

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
        const container = scrollContainerRef.current;
        if (!container) return;

        // 设置标记，防止 ScrollToTop 重置滚动
        setScrollRestoreInProgress(location.pathname, true);
        
        // 标记容器，防止 ScrollToTop 重置
        container.setAttribute('data-scroll-restore', 'true');

        let restoreAttempts = 0;
        const maxAttempts = 5;

        const restoreScroll = () => {
          if (!container || !scrollTopRef.current) return;

          const targetScroll = scrollTopRef.current;
          container.scrollTo({ top: targetScroll, behavior: 'instant' });
          
          const currentScroll = container.scrollTop;
          const diff = Math.abs(currentScroll - targetScroll);

          // 如果恢复成功（误差小于 10px）或达到最大尝试次数
          if (diff < 10 || restoreAttempts >= maxAttempts) {
            if (diff < 10) {
              debugLog('useCollectionCache', '滚动位置恢复成功', {
                target: targetScroll,
                actual: currentScroll,
                attempts: restoreAttempts + 1,
              });
            } else {
              debugLog('useCollectionCache', '滚动位置恢复失败（达到最大尝试次数）', {
                target: targetScroll,
                actual: currentScroll,
                attempts: restoreAttempts + 1,
              });
            }
            
            // 清除标记
            setScrollRestoreInProgress(location.pathname, false);
            container.removeAttribute('data-scroll-restore');
            restoredFromCacheRef.current = false;
            return;
          }

          // 如果未成功，继续尝试
          restoreAttempts++;
          if (restoreAttempts < maxAttempts) {
            setTimeout(restoreScroll, 100);
          } else {
            // 达到最大尝试次数，清除标记
            setScrollRestoreInProgress(location.pathname, false);
            container.removeAttribute('data-scroll-restore');
            restoredFromCacheRef.current = false;
          }
        };

        // 使用 ResizeObserver 确保容器大小已确定
        const resizeObserver = new ResizeObserver(() => {
          if (container.scrollHeight >= scrollTopRef.current) {
            resizeObserver.disconnect();
            // 使用多次 rAF + setTimeout 确保 DOM 完全渲染
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                restoreScroll();
                setTimeout(restoreScroll, 100);
                setTimeout(restoreScroll, 300);
              });
            });
          }
        });

        resizeObserver.observe(container);

        // 如果容器已经有足够的高度，直接开始恢复
        if (container.scrollHeight >= scrollTopRef.current) {
          resizeObserver.disconnect();
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              restoreScroll();
              setTimeout(restoreScroll, 100);
              setTimeout(restoreScroll, 300);
            });
          });
        }

        // 超时保护：5秒后强制清除标记
        setTimeout(() => {
          resizeObserver.disconnect();
          setScrollRestoreInProgress(location.pathname, false);
          if (container) {
            container.removeAttribute('data-scroll-restore');
          }
          restoredFromCacheRef.current = false;
        }, 5000);
      }
    },
    [scrollContainerRef, location.pathname]
  );

  // 使用 useCallback 确保函数引用稳定
  const isRestoredFromCache = useCallback(() => restoredFromCacheRef.current, []);
  const clearRestoredFlag = useCallback(() => {
    restoredFromCacheRef.current = false;
  }, []);

  return {
    restoredFromCacheRef,
    updateStateRef,
    restoreScrollPosition,
    isRestoredFromCache,
    clearRestoredFlag,
  };
}
