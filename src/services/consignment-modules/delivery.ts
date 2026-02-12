import type { ApiResponse } from '../networking';
import { API_ENDPOINTS } from '../config';
import { authedFetch } from '../client';
import type { ShopOrderItem } from '../shop';

/**
 * 申请提货的参数接口
 */
export interface DeliverParams {
  user_collection_id: number | string;
  address_id: number;
  token?: string;
}

/**
 * 申请提货
 */
export async function deliverCollectionItem(params: DeliverParams): Promise<ApiResponse> {
  const payload = {
    user_collection_id: Number(params.user_collection_id),
    address_id: Number(params.address_id),
  };

  return authedFetch(API_ENDPOINTS.collectionConsignment.deliver, {
    method: 'POST',
    body: JSON.stringify(payload),
    token: params.token,
  });
}

/**
 * 提货订单状态枚举
 */
export type DeliveryStatus = 'paid' | 'shipped' | 'completed';

/**
 * 藏品提货列表查询参数接口
 */
export interface FetchDeliveryListParams {
  page?: number;
  limit?: number;
  status?: DeliveryStatus;
  token?: string;
}

/**
 * 提货订单列表返回数据接口
 */
export interface DeliveryListData {
  list: ShopOrderItem[];
  total: number;
  has_more?: boolean;
}

/**
 * 获取藏品提货列表
 */
export async function getDeliveryList(params: FetchDeliveryListParams = {}): Promise<ApiResponse<DeliveryListData>> {
  const search = new URLSearchParams();
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  if (params.status) search.set('status', params.status);

  const path = `${API_ENDPOINTS.collectionTrade.deliveryList}?${search.toString()}`;
  return authedFetch<DeliveryListData>(path, { method: 'GET', token: params.token });
}
