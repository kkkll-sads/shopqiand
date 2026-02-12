import type { ApiResponse } from '../networking';
import { API_ENDPOINTS } from '../config';
import { authedFetch } from '../client';

/**
 * 寄售券项目接口
 * 对应后端表结构: ba_user_consignment_coupon
 */
export interface ConsignmentCouponItem {
  id: number;
  user_id: number;
  session_id: number;
  zone_id: number;
  price_zone: string;
  expire_time: number;
  status: number;
  create_time: number;
  update_time: number;
  [key: string]: any;
}

/**
 * 寄售券列表返回数据接口
 */
export interface ConsignmentCouponListData {
  list: ConsignmentCouponItem[];
  total: number;
  available_count: number;
  has_more?: boolean;
}

/**
 * 获取用户寄售券列表
 */
export async function fetchConsignmentCoupons(params: {
  page?: number;
  limit?: number;
  status?: number;
  token?: string;
} = {}): Promise<ApiResponse<ConsignmentCouponListData>> {
  const search = new URLSearchParams();
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  if (params.status !== undefined) search.set('status', String(params.status));

  const path = `${API_ENDPOINTS.user.consignmentCoupons}?${search.toString()}`;
  return authedFetch<ConsignmentCouponListData>(path, { method: 'GET', token: params.token });
}
