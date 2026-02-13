import type { ApiResponse } from '../networking';
import { API_ENDPOINTS } from '../config';
import { authedFetch } from '../client';

export async function consignCollectionItem(params: {
  user_collection_id?: number | string;
  id?: number;
  price: number;
  token?: string;
}): Promise<
  ApiResponse<{
    coupon_used?: number;
    coupon_remaining?: number;
    waive_type?: string;
    rollback_reason?: string;
    [key: string]: any;
  }>
> {
  const payload = new FormData();
  payload.append('user_collection_id', String(params.user_collection_id || params.id));
  payload.append('price', String(params.price));

  return authedFetch(API_ENDPOINTS.collectionConsignment.consign, {
    method: 'POST',
    body: payload,
    token: params.token,
  });
}

/**
 * 取消寄售的参数接口
 */
export interface CancelConsignmentParams {
  consignment_id: number;
  token?: string;
}

/**
 * 取消寄售
 */
export async function cancelConsignment(params: CancelConsignmentParams): Promise<ApiResponse> {
  const payload = {
    consignment_id: Number(params.consignment_id),
  };

  return authedFetch(API_ENDPOINTS.collectionConsignment.cancelConsignment, {
    method: 'POST',
    body: JSON.stringify(payload),
    token: params.token,
  });
}

/**
 * 寄售商品基本信息接口
 */
export interface ConsignmentItem {
  id: number;
  consignment_id: number;
  session_id?: number | string;
  title: string;
  image: string;
  price: number;
  consignment_price?: number;
  stock?: number;
  sales?: number;
  [key: string]: any;
}

/**
 * 寄售商品列表返回数据接口
 */
export interface ConsignmentListData {
  list: ConsignmentItem[];
  total: number;
}

/**
 * 获取寄售商品列表
 */
export async function getConsignmentList(params: { page?: number; limit?: number } = {}): Promise<ApiResponse<ConsignmentListData>> {
  const search = new URLSearchParams();
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));

  return authedFetch<ConsignmentListData>(`${API_ENDPOINTS.collectionConsignment.consignmentList}?${search.toString()}`, {
    method: 'GET',
  });
}

/**
 * 寄售交易区列表项接口
 */
export interface TradeListItem {
  id: number;
  consignment_id: number;
  session_id?: number | string;
  title: string;
  image: string;
  price: number;
  consignment_price?: number;
  stock?: number;
  sales?: number;
  [key: string]: any;
}

/**
 * 寄售交易区列表返回数据接口
 */
export interface TradeListData {
  list: TradeListItem[];
  total: number;
}

/**
 * 寄售交易区列表查询参数接口
 */
export interface FetchTradeListParams {
  page?: number;
  limit?: number;
  session_id?: number;
  token?: string;
}

/**
 * 获取寄售交易区列表
 */
export async function getTradeList(params: FetchTradeListParams = {}): Promise<ApiResponse<TradeListData>> {
  const search = new URLSearchParams();
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  if (params.session_id) search.set('session_id', String(params.session_id));

  return authedFetch<TradeListData>(`${API_ENDPOINTS.collectionTrade.tradeList}?${search.toString()}`, {
    method: 'GET',
    token: params.token,
  });
}

/**
 * 我的寄售列表项接口
 */
export interface MyConsignmentItem {
  id?: number;
  consignment_id?: number;
  user_id?: number;
  user_collection_id?: number;
  item_id?: number;
  title?: string;
  image?: string;
  consignment_price: number | string;
  buy_price?: number | string;
  original_price?: number | string;
  sold_price?: number | string;
  service_fee?: number | string;
  total_cost?: number | string;
  consignment_status?: number;
  consignment_status_text?: string;
  user_collection_status?: number;
  order_id?: number;
  order_no?: string;
  create_time?: number | string;
  update_time?: number | string;
  sold_time?: number | string;
  create_time_text?: string;
  update_time_text?: string;
  sold_time_text?: string;
  session_id?: number | string;
  days_passed?: number;
  can_force_delivery?: boolean;
  remaining_days?: number;
  status_text: string;
  item_title: string;
  [key: string]: any;
}

/**
 * 我的寄售列表查询参数接口
 */
export interface FetchMyConsignmentListParams {
  page?: number;
  limit?: number;
  status?: number;
  token?: string;
}

/**
 * 我的寄售列表返回数据接口
 */
export interface MyConsignmentListData {
  list: MyConsignmentItem[];
  total: number;
  has_more?: boolean;
}

/**
 * 获取我的寄售列表
 */
export async function getMyConsignmentList(params: FetchMyConsignmentListParams = {}): Promise<ApiResponse<MyConsignmentListData>> {
  const search = new URLSearchParams();
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  if (params.status !== undefined && params.status !== 0) {
    let dbStatus = params.status;
    if (params.status === 4) {
      dbStatus = 0;
    }
    search.set('status', String(dbStatus));
  }

  const path = `${API_ENDPOINTS.collectionConsignment.myConsignmentList}?${search.toString()}`;
  return authedFetch<MyConsignmentListData>(path, { method: 'GET', token: params.token });
}

export interface ConsignmentDetailData {
  id?: number;
  consignment_id: number;
  user_id?: number;
  user_collection_id?: number;
  item_id?: number;
  title?: string;
  image?: string;
  images?: string[];
  description?: string;
  artist?: string;
  asset_code?: string;
  price?: number;
  consignment_price?: number | string;
  buy_price?: number | string;
  original_price?: number | string;
  sold_price?: number | string;
  service_fee?: number | string;
  status?: number;
  status_text?: string;
  consignment_status?: number;
  consignment_status_text?: string;
  user_collection_status?: number;
  order_id?: number;
  order_no?: string;
  flow_no?: string;
  money_log_id?: number;
  money_log_time?: number;
  money_log_time_text?: string;
  create_time?: number;
  update_time?: number;
  sold_time?: number;
  create_time_text?: string;
  update_time_text?: string;
  sold_time_text?: string;
  settle_status?: number;
  settle_status_text?: string;
  settle_rule?: string;
  principal_amount?: number | string;
  profit_amount?: number | string;
  payout_principal_withdrawable?: number | string;
  payout_principal_consume?: number | string;
  payout_profit_withdrawable?: number | string;
  payout_profit_consume?: number | string;
  payout_total_withdrawable?: number | string;
  payout_total_consume?: number | string;
  days_passed?: number;
  can_force_delivery?: boolean;
  remaining_days?: number;
  delivery_info?: {
    address?: string;
    receiver?: string;
    phone?: string;
    logistics_company?: string;
    tracking_no?: string;
    status_text?: string;
    update_time?: number;
    [key: string]: any;
  };
  [key: string]: any;
}

export async function getConsignmentDetail(params: {
  consignment_id: number;
  token?: string;
}): Promise<ApiResponse<ConsignmentDetailData>> {
  const path = `${API_ENDPOINTS.collectionConsignment.consignmentDetail}?consignment_id=${params.consignment_id}`;
  return authedFetch<ConsignmentDetailData>(path, { method: 'GET', token: params.token });
}

/**
 * 寄售解锁状态检查接口返回数据
 */
export interface ConsignmentCheckData {
  unlocked?: boolean;
  can_consign?: boolean;
  remaining_seconds?: number;
  remaining_text?: string;
  unlock_hours?: number;
  consignment_unlock_hours?: number;
  buy_price?: number;
  appreciation_rate?: number;
  is_old_asset_package?: boolean;
  [key: string]: any;
}

/**
 * 根据 consignmentCheck 返回的 buy_price、appreciation_rate 计算寄售价格
 */
export function computeConsignmentPrice(check: ConsignmentCheckData | null | undefined): number {
  if (!check) return 0;
  const buy = Number(check.buy_price ?? 0);
  const rate = Number(check.appreciation_rate ?? 0);
  if (buy <= 0) return 0;
  return buy * (1 + rate);
}

/**
 * 检查寄售解锁状态
 */
export async function getConsignmentCheck(params: {
  user_collection_id: number | string;
  token?: string;
}): Promise<ApiResponse<ConsignmentCheckData>> {
  const search = new URLSearchParams();
  search.set('user_collection_id', String(params.user_collection_id));
  const path = `${API_ENDPOINTS.collectionConsignment.consignmentCheck}?${search.toString()}`;
  return authedFetch<ConsignmentCheckData>(path, { method: 'GET', token: params.token });
}
