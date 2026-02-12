import type { AllLogItem } from '@/services';

export interface AssetHistoryFilters {
  category: string;
  flow: string;
  time: string;
}

export interface AssetHistoryStateSnapshot {
  allLogs: AllLogItem[];
  page: number;
  hasMore: boolean;
  filters: AssetHistoryFilters;
  searchKeyword: string;
}

export const DEFAULT_ASSET_HISTORY_FILTERS: AssetHistoryFilters = {
  category: 'all',
  flow: 'all',
  time: 'all',
};
