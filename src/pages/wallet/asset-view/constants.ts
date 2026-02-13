import { BALANCE_TYPE_OPTIONS } from '@/constants/balanceTypes';
import type { FilterOption } from '../components/asset/AssetFilterSheet';
import type { AssetFlowFilter, AssetTimeFilter } from './types';

export const HEADER_HEIGHT = 52;

export const DEFAULT_CATEGORY_FILTER = 'all';
export const DEFAULT_FLOW_FILTER: AssetFlowFilter = 'all';
export const DEFAULT_TIME_FILTER: AssetTimeFilter = 'all';

export const CATEGORY_OPTIONS: FilterOption[] = [...BALANCE_TYPE_OPTIONS];
export const FLOW_OPTIONS: FilterOption[] = [
  { label: '全部', value: 'all' },
  { label: '支出', value: 'out' },
  { label: '收入', value: 'in' },
];
export const TIME_OPTIONS: Array<FilterOption & { value: AssetTimeFilter }> = [
  { label: '全部时间', value: 'all' },
  { label: '今天', value: 'today' },
  { label: '近7天', value: '7days' },
  { label: '近30天', value: '30days' },
];
