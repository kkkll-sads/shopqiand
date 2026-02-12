export type AssetFlowFilter = 'all' | 'in' | 'out';
export type AssetTimeFilter = 'all' | 'today' | '7days' | '30days';

export interface AssetViewFilters {
  filterCategory: string;
  filterFlow: AssetFlowFilter;
  filterTime: AssetTimeFilter;
}

export interface AssetViewPersistState extends AssetViewFilters {
  tabsData: unknown[];
  activeTab: number;
}
