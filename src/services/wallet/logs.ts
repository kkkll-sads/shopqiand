import type { ApiResponse } from '../networking';
import { API_ENDPOINTS } from '../config';
import { authedFetch } from '../client';

export interface BalanceLogItem {
  id: number;
  user_id: number;
  money: number;
  before: number;
  after: number;
  memo: string;
  createtime: number;
  create_time_text?: string;
  type?: string;
  amount?: number;
  before_balance?: number;
  after_balance?: number;
  remark?: string;
  create_time?: number;
  [key: string]: any;
}

export interface BalanceLogListData {
  list: BalanceLogItem[];
  total: number;
  per_page: number;
  current_page: number;
}

export interface GetBalanceLogParams {
  page?: number;
  limit?: number;
  token?: string;
}

export interface AllLogItem {
  id: number;
  amount: number | string;
  memo: string;
  createtime: number;
  create_time?: number;
  type: 'balance_available' | 'withdrawable_money' | 'service_fee_balance' | 'score' | string;
  account_type?: string;
  field_type?: string;
  biz_type?: string;
  flow_no?: string;
  breakdown?: Record<string, any> | null;
  before_value: number;
  after_value: number;
  remark?: string;
  [key: string]: any;
}

export interface AllLogListData {
  list: AllLogItem[];
  total: number;
  per_page: number;
  current_page: number;
}

export interface GetAllLogParams extends GetBalanceLogParams {
  type?: string;
  start_time?: string | number;
  end_time?: string | number;
  flow_direction?: 'in' | 'out' | 'all';
  biz_type?: string;
  keyword?: string;
}

export async function getAllLog(params: GetAllLogParams = {}): Promise<ApiResponse<AllLogListData>> {
  const search = new URLSearchParams();
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  if (params.type) search.set('type', params.type);
  if (params.start_time) search.set('start_time', String(params.start_time));
  if (params.end_time) search.set('end_time', String(params.end_time));
  if (params.flow_direction) search.set('flow_direction', params.flow_direction);
  if (params.biz_type != null && params.biz_type !== '') search.set('biz_type', params.biz_type);
  if (params.keyword != null && params.keyword.trim() !== '') search.set('keyword', params.keyword.trim());

  const path = `${API_ENDPOINTS.account.allLog}?${search.toString()}`;
  return authedFetch<AllLogListData>(path, {
    method: 'GET',
    token: params.token,
  });
}

export interface AllLogMergedItemsData {
  list: AllLogItem[];
  total: number;
  merge_scene?: string;
  merge_row_count?: number;
}

export interface GetAllLogMergedItemsParams {
  id: number | string;
  flow_no?: string;
  account_type?: string;
  token?: string;
}

export async function getAllLogMergedItems(
  params: GetAllLogMergedItemsParams
): Promise<ApiResponse<AllLogMergedItemsData>> {
  const search = new URLSearchParams();
  search.set('id', String(params.id));
  if (params.flow_no) search.set('flow_no', params.flow_no);
  if (params.account_type) search.set('account_type', params.account_type);

  const path = `${API_ENDPOINTS.account.allLogMergedItems}?${search.toString()}`;
  return authedFetch<AllLogMergedItemsData>(path, {
    method: 'GET',
    token: params.token,
  });
}

/**
 * 获取专项金/余额明细（已迁移：统一走 allLog）
 * 替代废弃接口 /Account/balance
 */
export async function getBalanceLog(
  params: GetBalanceLogParams = {}
): Promise<ApiResponse<BalanceLogListData>> {
  const response = await getAllLog({
    ...params,
    type: 'balance_available',
  });
  return response as unknown as ApiResponse<BalanceLogListData>;
}

export interface MoneyLogDetailData {
  id: number;
  flow_no: string;
  batch_no?: string;
  biz_type?: string;
  biz_id?: number;
  account_type?: string;
  amount: number;
  before_value: number;
  after_value: number;
  memo?: string;
  create_time: number;
  create_time_text?: string;
  title_snapshot?: string;
  image_snapshot?: string;
  user_collection_id?: number;
  item_id?: number;
  breakdown?: any;
  [key: string]: any;
}

export interface GetMoneyLogDetailParams {
  id?: number | string;
  flow_no?: string;
  token?: string;
}

export async function getMoneyLogDetail(
  params: GetMoneyLogDetailParams
): Promise<ApiResponse<MoneyLogDetailData>> {
  const search = new URLSearchParams();
  if (params.id !== undefined && params.id !== null) {
    search.set('id', String(params.id));
  }
  if (params.flow_no) {
    search.set('flow_no', params.flow_no);
  }

  const path = `${API_ENDPOINTS.account.moneyLogDetail}?${search.toString()}`;
  return authedFetch<MoneyLogDetailData>(path, {
    method: 'GET',
    token: params.token,
  });
}

export interface ServiceFeeLogItem {
  id: number;
  amount: number;
  before_service_fee: number;
  after_service_fee: number;
  remark: string;
  create_time: number;
}

export interface ServiceFeeLogListData {
  list: ServiceFeeLogItem[];
  total: number;
  per_page: number;
  current_page: number;
}

export interface GetServiceFeeLogParams {
  page?: number;
  limit?: number;
  token?: string;
}

/**
 * 获取服务费明细（已迁移：统一走 allLog）
 * 替代废弃接口 /Account/serviceFeeLog
 */
export async function getServiceFeeLog(
  params: GetServiceFeeLogParams = {}
): Promise<ApiResponse<ServiceFeeLogListData>> {
  const response = await getAllLog({
    ...params,
    type: 'service_fee_balance',
  });
  return response as unknown as ApiResponse<ServiceFeeLogListData>;
}
