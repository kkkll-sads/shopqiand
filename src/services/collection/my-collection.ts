import type { ApiResponse } from '../networking';
import { API_ENDPOINTS } from '../config';
import { authedFetch, getStoredToken } from '../client';

export interface MyCollectionItem {
  id: number; // 鐢ㄦ埛钘忓搧ID
  unique_id: string; // 鍞竴鏍囪瘑ID
  title: string; // 钘忓搧鏍囬
  image: string; // 钘忓搧鍥剧墖
  asset_code: string; // 纭潈缂栧彿
  hash: string; // 钘忓搧鍞竴鍝堝笇鏍囪瘑
  md5?: string; // MD5鎸囩汗 (鍏煎鏃х増)
  fingerprint?: string; // 鎸囩汗(鍚孧D5) (鍏煎鏃х増)
  price: number; // 涔板叆浠锋牸
  buy_price?: number | string; // 涔板叆鎴愭湰浠凤紙浼樺厛浣跨敤锛?
  market_price: number; // 褰撳墠甯傚満浠?
  transaction_count: number; // 浜ゆ槗娆℃暟
  fail_count: number; // 娴佹媿娆℃暟
  consignment_status: number; // 瀵勫敭鐘舵€? 0=鏈瘎鍞? 1=瀵勫敭涓? 2=宸插敭鍑?
  /** 澧炲€兼瘮渚嬶紝濡?0.05 琛ㄧず 5%锛堟潵鑷?userCollection/detail 鎺ュ彛锛?*/
  appreciation_rate?: number;
  /** 鏄惁鏃ц祫浜у寘锛堟潵鑷?userCollection/detail 鎺ュ彛锛?*/
  is_old_asset_package?: boolean;

  // New API Fields
  session_id?: number; // 鍦烘ID
  session_title?: string; // 鍦烘鏍囬
  session_start_time?: string; // 鍦烘寮€濮嬫椂闂?
  session_end_time?: string; // 鍦烘缁撴潫鏃堕棿
  zone_id?: number; // 浠锋牸鍖洪棿ID
  price_zone?: string; // 浠锋牸鍒嗗尯鍚嶇О (濡?'1K鍖?)
  price_zone_text?: string; // 浠锋牸鍒嗗尯鏄剧ず鏂囨湰 (鍏煎鏃х増)
  price_zone_calc?: number; // 鏄惁鐢卞悗绔绠楀厹搴?(0=鏁版嵁搴撳€?1=璁＄畻鍊?
  mining_status?: number; // 鐭挎満鐘舵€侊細0=鍚?1=鏄?
  mining_start_time?: string; // 鐭挎満鍚姩鏃堕棿

  // Specially for status=sold
  consignment_id?: number;
  consignment_status_text?: string;
  sold_price?: number;
  service_fee?: number;
  service_fee_paid_at_apply?: number | boolean;
  settle_status?: number;
  settle_time?: number;
  sold_time?: number;

  // Settlement Snapshot
  settle_rule?: string;
  is_legacy_snapshot?: number;
  legacy_unlock_price_snapshot?: number;

  principal_amount?: number;
  profit_amount?: number;

  payout_principal_withdrawable?: number;
  payout_principal_consume?: number;
  payout_profit_withdrawable?: number;
  payout_profit_consume?: number;
  payout_total_withdrawable?: number;
  payout_total_consume?: number;

  [key: string]: any;
}

/**
 * 閫氳繃纭潈缂栧彿鎴朚D5鎸囩汗鏌ヨ钘忓搧
 * API: GET /api/collectionTrade/queryByCode
 */
export interface QueryByCodeParams {
  code: string;
}

export interface CollectionHolder {
  user_id: number;
  username: string;
  nickname: string;
  mobile: string; // 鑴辨晱鍚庣殑鎵嬫満鍙?
}

export interface CollectionItemDetail {
  id: number;
  session_id: number;
  title: string;
  image: string;
  price: number;
  issue_price: number;
  asset_code: string;
  fingerprint: string;
  status: string;
  description: string;
  core_enterprise: string;
  farmer_info: string;
  zone_id: number;
  holder: CollectionHolder | null;
  [key: string]: any;
}

export async function queryCollectionByCode(
  params: QueryByCodeParams
): Promise<ApiResponse<CollectionItemDetail>> {
  const search = new URLSearchParams();
  search.set('code', params.code);

  const path = `${API_ENDPOINTS.collectionTrade.queryByCode}?${search.toString()}`;
  return authedFetch<CollectionItemDetail>(path, { method: 'GET' });
}

/**
 * 钘忓搧璁㈠崟鏄庣粏椤规帴鍙?
 */
export interface CollectionOrderItemDetail {
  id: number;
  item_id: number;
  item_title: string;
  item_image: string;
  price: number;
  quantity: number;
  subtotal: number;
  [key: string]: any;
}

/**
 * 钘忓搧璁㈠崟璇︽儏鏁版嵁鎺ュ彛
 * API: GET /api/collectionTrade/orderDetail
 */
export interface CollectionOrderPaymentSplitFields {
  pay_balance_available?: number | string;
  pay_balance_available_amount?: number | string;
  pay_pending_activation_gold?: number | string;
  pay_pending_activation_gold_amount?: number | string;
  pay_score?: number | string;
  pay_score_amount?: number | string;
  pay_ratio?: number | string | Record<string, unknown>;
  reservation_id?: number | string;
  freeze_amount?: number | string;
  freeze_total_amount?: number | string;
  freeze_balance_available?: number | string;
  freeze_balance_available_amount?: number | string;
  freeze_pending_activation_gold?: number | string;
  freeze_pending_activation_gold_amount?: number | string;
  freeze_score_amount?: number | string;
  refund_amount?: number | string;
  refund_total_amount?: number | string;
  refund_diff?: number | string;
  refund_balance_available?: number | string;
  refund_balance_available_amount?: number | string;
  refund_pending_activation_gold?: number | string;
  refund_pending_activation_gold_amount?: number | string;
  refund_score_amount?: number | string;
}

export interface CollectionOrderDetailData extends CollectionOrderPaymentSplitFields {
  id: number;
  order_no: string;
  user_id: number;
  total_amount: number;
  pay_type: string;
  pay_type_text?: string;
  status: string;
  status_text: string;
  pay_time?: number;
  pay_time_text?: string;
  complete_time?: number;
  complete_time_text?: string;
  create_time: number;
  create_time_text?: string;
  remark?: string;
  items: CollectionOrderItemDetail[];
  [key: string]: any;
}

/**
 * 鑾峰彇钘忓搧璁㈠崟璇︽儏鐨勫弬鏁版帴鍙?
 */
export interface GetCollectionOrderDetailParams {
  id?: number | string;
  order_no?: string;
  token?: string;
}

/**
 * 鑾峰彇钘忓搧璁㈠崟璇︽儏
 * API: GET /api/collectionTrade/orderDetail
 */
export async function getCollectionOrderDetail(
  params: GetCollectionOrderDetailParams
): Promise<ApiResponse<CollectionOrderDetailData>> {
  const token = params.token ?? getStoredToken();
  const search = new URLSearchParams();

  if (params.id !== undefined && params.id !== null) {
    search.set('id', String(params.id));
  }
  if (params.order_no) {
    search.set('order_no', params.order_no);
  }

  const path = `${API_ENDPOINTS.collectionTrade.orderDetail}?${search.toString()}`;
  return authedFetch<CollectionOrderDetailData>(path, {
    method: 'GET',
    token,
  });
}

/**
 * 鑾峰彇鎴戠殑钘忓搧
 * API: GET /api/collectionTrade/myCollection
 */
export async function getMyCollection(
  params: {
    page?: number;
    limit?: number;
    status?: string;
    session_id?: number | string;
    zone_id?: number | string;
    keyword?: string;
    sort?: 'create_time' | 'price' | 'market_price';
    order?: 'asc' | 'desc';
    token?: string;
  } = {}
): Promise<ApiResponse<{ list: MyCollectionItem[]; total: number; has_more?: boolean; consignment_coupon?: number }>> {
  const token = params.token || getStoredToken();
  const search = new URLSearchParams();
  search.set('page', String(params.page || 1));
  search.set('limit', String(params.limit || 10));

  if (params.status) {
    search.set('status', params.status);
  } else {
    search.set('status', 'holding');
  }
  if (params.session_id != null) search.set('session_id', String(params.session_id));
  if (params.zone_id != null) search.set('zone_id', String(params.zone_id));
  if (params.keyword != null && params.keyword.trim()) search.set('keyword', params.keyword.trim());
  if (params.sort) search.set('sort', params.sort);
  if (params.order) search.set('order', params.order);

  const path = `${API_ENDPOINTS.collectionTrade.myCollection}?${search.toString()}`;
  return authedFetch<{ list: MyCollectionItem[]; total: number; has_more?: boolean; consignment_coupon?: number }>(
    path,
    {
      method: 'GET',
      token,
    }
  );
}
