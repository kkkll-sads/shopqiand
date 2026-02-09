import type { ApiResponse } from '../networking';
import { API_ENDPOINTS } from '../config';
import { authedFetch, getStoredToken } from '../client';

export interface MyCollectionItem {
  id: number; // 用户藏品ID
  unique_id: string; // 唯一标识ID
  title: string; // 藏品标题
  image: string; // 藏品图片
  asset_code: string; // 确权编号
  hash: string; // 藏品唯一哈希标识
  md5?: string; // MD5指纹 (兼容旧版)
  fingerprint?: string; // 指纹(同MD5) (兼容旧版)
  price: number; // 买入价格
  buy_price?: number | string; // 买入成本价（优先使用）
  market_price: number; // 当前市场价
  transaction_count: number; // 交易次数
  fail_count: number; // 流拍次数
  consignment_status: number; // 寄售状态: 0=未寄售, 1=寄售中, 2=已售出
  /** 增值比例，如 0.05 表示 5%（来自 userCollection/detail 接口） */
  appreciation_rate?: number;
  /** 是否旧资产包（来自 userCollection/detail 接口） */
  is_old_asset_package?: boolean;

  // New API Fields
  session_id?: number; // 场次ID
  session_title?: string; // 场次标题
  session_start_time?: string; // 场次开始时间
  session_end_time?: string; // 场次结束时间
  zone_id?: number; // 价格区间ID
  price_zone?: string; // 价格分区名称 (如 '1K区')
  price_zone_text?: string; // 价格分区显示文本 (兼容旧版)
  price_zone_calc?: number; // 是否由后端计算兜底 (0=数据库值/1=计算值)
  mining_status?: number; // 矿机状态：0=否,1=是
  mining_start_time?: string; // 矿机启动时间

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
 * 通过确权编号或MD5指纹查询藏品
 * API: GET /api/collectionTrade/queryByCode
 */
export interface QueryByCodeParams {
  code: string;
}

export interface CollectionHolder {
  user_id: number;
  username: string;
  nickname: string;
  mobile: string; // 脱敏后的手机号
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
 * 藏品订单明细项接口
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
 * 藏品订单详情数据接口
 * API: GET /api/collectionTrade/orderDetail
 */
export interface CollectionOrderDetailData {
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
 * 获取藏品订单详情的参数接口
 */
export interface GetCollectionOrderDetailParams {
  id?: number | string;
  order_no?: string;
  token?: string;
}

/**
 * 获取藏品订单详情
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
 * 获取我的藏品
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

// 兼容旧名称
export const fetchMyCollectionList = getMyCollection;
