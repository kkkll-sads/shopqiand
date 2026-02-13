import { useEffect, useMemo } from 'react';
import { getAllLog } from '@/services';
import { resolveAllLogCategoryQuery } from '@/constants/balanceTypes';
import { useAssetTabs, type TabConfig } from '@/hooks/useAssetTabs';
import { extractData } from '@/utils/apiHelpers';
import type { AssetFlowFilter, AssetTimeFilter } from '../types';
import { resolveTimeRange } from '../utils';

interface UseAssetViewTabsParams {
  initialTab: number;
  filterCategory: string;
  filterFlow: AssetFlowFilter;
  filterTime: AssetTimeFilter;
}

export function useAssetViewTabs({
  initialTab,
  filterCategory,
  filterFlow,
  filterTime,
}: UseAssetViewTabsParams) {
  const tabConfigs = useMemo<TabConfig[]>(
    () => [
      {
        id: 0,
        name: '资金明细',
        fetchData: async ({ page, limit, token }) => {
          const { startTime, endTime } = resolveTimeRange(filterTime);
          const categoryQuery = resolveAllLogCategoryQuery(filterCategory);
          return getAllLog({
            page,
            limit,
            type: categoryQuery.type,
            biz_type: categoryQuery.biz_type,
            flow_direction: filterFlow,
            start_time: startTime,
            end_time: endTime,
            token,
          });
        },
        parseData: (response) => {
          const data = extractData(response) as { list?: unknown[] } | null;
          const list = Array.isArray(data?.list) ? data.list : [];
          return {
            list,
            hasMore: list.length >= 10,
          };
        },
      },
    ],
    [filterCategory, filterFlow, filterTime]
  );

  const tabs = useAssetTabs(tabConfigs, initialTab);

  useEffect(() => {
    if (tabs.activeTab === 0) {
      tabs.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterCategory, filterFlow, filterTime]);

  useEffect(() => {
    const validTabIds = tabConfigs.map((tab) => tab.id);
    if (!validTabIds.includes(tabs.activeTab) && tabConfigs.length > 0) {
      tabs.setActiveTab(tabConfigs[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabConfigs]);

  return tabs;
}
