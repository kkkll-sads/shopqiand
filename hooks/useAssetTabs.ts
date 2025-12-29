/**
 * useAssetTabs - 资产标签页数据管理 Hook
 *
 * 功能说明：
 * - 统一管理多个标签页的数据加载状态
 * - 支持数据缓存（标签切换不重新加载）
 * - 支持分页和加载更多
 * - 配置化标签页定义
 *
 * @author 树交所前端团队
 * @version 1.0.0
 * @created 2025-12-29
 */

import { useState, useCallback, useEffect } from 'react';
import { AUTH_TOKEN_KEY } from '../services/api';

/**
 * 标签页状态
 */
export interface TabState<T = any> {
  data: T[];           // 数据数组
  page: number;        // 当前页码
  hasMore: boolean;    // 是否有更多数据
  loading: boolean;    // 是否加载中
  error: string | null; // 错误信息
  initialized: boolean; // 是否已初始化
}

/**
 * API响应接口
 */
export interface ApiResponse<T = any> {
  code?: number;
  data?: T;
  msg?: string;
  message?: string;
}

/**
 * 标签页配置
 */
export interface TabConfig<T = any> {
  id: number;
  name: string;
  fetchData: (params: { page: number; limit: number; token: string }) => Promise<ApiResponse>;
  parseData: (response: ApiResponse) => {
    list: T[];
    hasMore: boolean;
    extra?: any;
  };
  handleExtra?: (extra: any) => void;
}

/**
 * Hook返回值
 */
export interface UseAssetTabsReturn<T = any> {
  activeTab: number;
  setActiveTab: (tab: number) => void;
  currentTabState: TabState<T>;
  isLoading: boolean;
  hasError: boolean;
  error: string | null;
  data: T[];
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
  tabs: TabConfig[];
}

/**
 * useAssetTabs Hook
 *
 * @param tabs - 标签页配置数组
 * @param initialTab - 初始激活的标签页索引
 * @returns Hook返回值
 *
 * @example
 * ```tsx
 * const tabs: TabConfig[] = [
 *   {
 *     id: 0,
 *     name: '专项金明细',
 *     fetchData: ({ page, token }) => getBalanceLog({ page, limit: 10, token }),
 *     parseData: (response) => ({
 *       list: extractData(response)?.list || [],
 *       hasMore: (extractData(response)?.list?.length || 0) >= 10,
 *     }),
 *   },
 * ];
 *
 * const { activeTab, data, isLoading, loadMore } = useAssetTabs(tabs);
 * ```
 */
export function useAssetTabs<T = any>(
  tabs: TabConfig[],
  initialTab: number = 0
): UseAssetTabsReturn<T> {
  const [activeTab, setActiveTab] = useState(initialTab);

  // 使用Map存储每个标签页的状态
  const [tabStates, setTabStates] = useState<Map<number, TabState<T>>>(
    () => new Map(tabs.map(tab => [tab.id, {
      data: [] as T[],
      page: 1,
      hasMore: false,
      loading: false,
      error: null,
      initialized: false,
    } as TabState<T>]))
  );

  // 获取当前标签页状态
  const currentTabState: TabState<T> = tabStates.get(activeTab) || ({
    data: [] as T[],
    page: 1,
    hasMore: false,
    loading: false,
    error: null,
    initialized: false,
  } as TabState<T>);

  /**
   * 更新指定标签页的状态
   */
  const updateTabState = useCallback((tabId: number, updates: Partial<TabState<T>>) => {
    setTabStates(prev => {
      const newMap = new Map<number, TabState<T>>(prev);
      const defaultState: TabState<T> = {
        data: [] as T[],
        page: 1,
        hasMore: false,
        loading: false,
        error: null,
        initialized: false,
      };
      const existing = newMap.get(tabId);
      let current: TabState<T>;
      if (existing) {
        current = existing;
      } else {
        current = defaultState;
      }
      newMap.set(tabId, { ...current, ...updates });
      return newMap;
    });
  }, []);

  /**
   * 加载标签页数据
   */
  const loadTab = useCallback(async (tabId: number, page: number = 1) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      updateTabState(tabId, { error: '请先登录', loading: false });
      return;
    }

    const tabConfig = tabs.find(t => t.id === tabId);
    if (!tabConfig) {
      updateTabState(tabId, { error: '标签页配置不存在', loading: false });
      return;
    }

    // 设置loading状态
    updateTabState(tabId, { loading: true, error: null });

    try {
      // 调用fetchData获取数据
      const response = await tabConfig.fetchData({ page, limit: 10, token });

      // 解析数据
      const { list, hasMore, extra } = tabConfig.parseData(response);

      // 合并数据（首页替换，加载更多追加）
      const currentState = tabStates.get(tabId);
      const newData = page === 1 ? list : [...(currentState?.data || []), ...list];

      // 更新状态
      updateTabState(tabId, {
        data: newData as T[],
        page,
        hasMore,
        loading: false,
        error: null,
        initialized: true,
      });

      // 处理额外数据（如寄售券数量）
      if (extra && tabConfig.handleExtra) {
        tabConfig.handleExtra(extra);
      }
    } catch (err: any) {
      updateTabState(tabId, {
        loading: false,
        error: err?.message || '加载失败',
      });
    }
  }, [tabs, tabStates, updateTabState]);

  /**
   * 切换标签页时，如果未初始化则加载数据
   */
  useEffect(() => {
    const state = tabStates.get(activeTab);
    if (!state?.initialized && !state?.loading) {
      loadTab(activeTab, 1);
    }
  }, [activeTab, tabStates, loadTab]);

  /**
   * 加载更多
   */
  const loadMore = useCallback(() => {
    const state = tabStates.get(activeTab);
    if (state && !state.loading && state.hasMore) {
      loadTab(activeTab, state.page + 1);
    }
  }, [activeTab, tabStates, loadTab]);

  /**
   * 刷新当前标签页（重新加载第1页）
   */
  const refresh = useCallback(() => {
    loadTab(activeTab, 1);
  }, [activeTab, loadTab]);

  return {
    activeTab,
    setActiveTab,
    currentTabState,
    isLoading: currentTabState.loading,
    hasError: !!currentTabState.error,
    error: currentTabState.error,
    data: currentTabState.data,
    hasMore: currentTabState.hasMore,
    loadMore,
    refresh,
    tabs,
  };
}

export default useAssetTabs;
