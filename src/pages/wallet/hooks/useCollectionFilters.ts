/**
 * 藏品列表筛选排序 Hook
 */
import { useMemo, useCallback } from 'react';
import { MyCollectionItem } from '@/services';
import { ConsignmentStatus } from '@/constants/statusEnums';
import type { SortOrder } from '@/components/common';
import { debugLog } from '@/utils/logger';

export interface FilterState {
  selectedSession: string;
  selectedPriceZone: string;
  searchKeyword: string;
  sortField: string;
  sortOrder: SortOrder;
}

interface UseCollectionFiltersOptions {
  collections: MyCollectionItem[];
  activeTab: string;
  filters: FilterState;
}

/**
 * 藏品列表筛选排序 Hook
 */
export function useCollectionFilters(options: UseCollectionFiltersOptions) {
  const { collections, activeTab, filters } = options;
  const { selectedSession, selectedPriceZone, searchKeyword, sortField, sortOrder } = filters;

  // 动态生成场次选项
  const sessionOptions = useMemo(() => {
    const sessions = new Set<string>();
    collections.forEach((item) => {
      if (item.session_title) sessions.add(item.session_title);
    });
    return ['all', ...Array.from(sessions).sort()];
  }, [collections]);

  // 动态生成价格分区选项
  const priceZoneOptions = useMemo(() => {
    const zones = new Set<string>();
    collections.forEach((item) => {
      const zone = item.price_zone_text || item.priceZone || item.price_zone;
      if (zone) zones.add(String(zone));
    });
    return ['all', ...Array.from(zones).sort()];
  }, [collections]);

  // 排序选项
  const sortOptions = useMemo(
    () => [
      { value: 'create_time', label: '创建时间' },
      { value: 'price', label: '买入价格' },
      { value: 'market_price', label: '市场价' },
    ],
    []
  );

  // 应用筛选和排序
  const filteredCollections = useMemo(() => {
    debugLog('useCollectionFilters', '筛选条件', {
      count: collections.length,
      session: selectedSession,
      zone: selectedPriceZone,
      keyword: searchKeyword,
    });

    let filtered = collections.filter((item) => {
      // 场次筛选
      if (selectedSession !== 'all' && item.session_title !== selectedSession) {
        return false;
      }

      // 价格分区筛选
      if (selectedPriceZone !== 'all') {
        const zone = item.price_zone_text || item.priceZone || item.price_zone;
        if (String(zone) !== selectedPriceZone) {
          return false;
        }
      }

      // 关键词搜索
      if (searchKeyword.trim()) {
        const keyword = searchKeyword.toLowerCase();
        const title = (item.title || item.package_name || '').toLowerCase();
        const assetCode = (item.asset_code || '').toLowerCase();
        if (!title.includes(keyword) && !assetCode.includes(keyword)) {
          return false;
        }
      }

      return true;
    });

    // 排序
    filtered.sort((a, b) => {
      let aVal: number = 0;
      let bVal: number = 0;

      switch (sortField) {
        case 'create_time':
          aVal = a.create_time || a.pay_time || 0;
          bVal = b.create_time || b.pay_time || 0;
          break;
        case 'price':
          aVal = Number(a.buy_price) || Number(a.price) || 0;
          bVal = Number(b.buy_price) || Number(b.price) || 0;
          break;
        case 'market_price':
          aVal = Number(a.market_price) || Number(a.consignment_price) || 0;
          bVal = Number(b.market_price) || Number(b.consignment_price) || 0;
          break;
      }

      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    });

    debugLog('useCollectionFilters', 'filteredCollections长度', filtered.length);
    return filtered;
  }, [collections, selectedSession, selectedPriceZone, searchKeyword, sortField, sortOrder]);

  return {
    filteredCollections,
    sessionOptions,
    priceZoneOptions,
    sortOptions,
  };
}

/**
 * 去重集合项
 */
export function deduplicateCollections(collections: MyCollectionItem[]): MyCollectionItem[] {
  const seen = new Set<string>();
  return collections.filter((item) => {
    const uniqueKey = item.id || item.user_collection_id || item.item_id;
    if (seen.has(String(uniqueKey))) {
      return false;
    }
    seen.add(String(uniqueKey));
    return true;
  });
}
