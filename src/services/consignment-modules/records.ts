import type { ApiResponse } from '../networking';
import { API_ENDPOINTS } from '../config';
import { authedFetch } from '../client';

export interface PurchaseRecordItem {
  order_id: number;
  item_title: string;
  item_image: string;
  quantity: number;
  price: number | string;
  total_amount: number | string;
  pay_type_text: string;
  status_text: string;
  order_status_text?: string;
  pay_time: number;
  pay_time_text: string;
  [key: string]: any;
}

export async function getPurchaseRecords(params: {
  page?: number;
  limit?: number;
  token?: string;
} = {}): Promise<ApiResponse<{ list: PurchaseRecordItem[]; has_more?: boolean }>> {
  const search = new URLSearchParams();
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));

  const path = `${API_ENDPOINTS.collectionTrade.purchaseRecords}?${search.toString()}`;
  return authedFetch<{ list: PurchaseRecordItem[]; has_more?: boolean }>(path, { method: 'GET', token: params.token });
}

/**
 * 权益分割的参数接口
 */
export interface RightsDeliverParams {
  user_collection_id: number | string;
  token?: string;
}

/**
 * 权益分割的返回结果接口
 */
export interface RightsDeliverResult {
  code: number;
  message: string;
  data: object;
}

/**
 * 权益分割
 */
export async function rightsDeliver(params: RightsDeliverParams): Promise<ApiResponse<RightsDeliverResult>> {
  const payload: Record<string, any> = {
    user_collection_id: Number(params.user_collection_id),
  };

  return authedFetch<RightsDeliverResult>(API_ENDPOINTS.collectionTrade.rightsDeliver, {
    method: 'POST',
    body: JSON.stringify(payload),
    token: params.token,
  });
}
