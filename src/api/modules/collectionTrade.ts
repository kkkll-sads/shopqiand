/**
 * 藏品交易订单 API 模块
 * 买入订单：GET /api/collectionTrade/buyOrders
 * 卖出订单：GET /api/collectionTrade/sellOrders
 */
import { http } from '../http';

/* ==================== 类型定义 ==================== */

/** 买入订单列表项 */
export interface CollectionBuyOrder {
  /** 订单号 */
  order_no: string;
  /** 订单 ID */
  order_id: number;
  /** 用户藏品 ID */
  user_collection_id: number;
  /** 藏品标题 */
  item_title: string;
  /** 藏品图片 URL */
  image: string;
  /** 买入价格（实际支付金额） */
  buy_price: number;
  /** 支付方式文字：专项金支付 / 混合支付 / 消费金支付 */
  pay_type_text: string;
  /** 专项金支付金额 */
  pay_balance_available: number;
  /** 待激活金支付金额 */
  pay_pending_activation_gold: number;
  /** 状态文字：待寄售 / 寄售中 / 已售出 */
  status_text: string;
  /** 购买时间 (Y-m-d H:i:s) */
  buy_time: string;
}

/** 买入订单列表响应 data */
export interface CollectionBuyOrdersResponse {
  list: CollectionBuyOrder[];
  total: number;
  page: number;
  limit: number;
}

/** 卖出订单列表项 */
export interface CollectionSellOrder {
  /** 关联的买入订单号 */
  order_no: string;
  /** 关联的买入订单 ID（用于查询 orderDetail） */
  order_id: number;
  /** 寄售记录 ID */
  consignment_id: number;
  /** 用户藏品 ID */
  user_collection_id: number;
  /** 藏品标题 */
  item_title: string;
  /** 藏品图片 URL */
  image: string;
  /** 原始购入价格 */
  buy_price: number;
  /** 寄售价（成交价） */
  sold_price: number;
  /** 状态文字：已售出 */
  status_text: string;
  /** 售出时间 (Y-m-d H:i:s) */
  sold_time: string;
}

/** 卖出订单列表响应 data */
export interface CollectionSellOrdersResponse {
  list: CollectionSellOrder[];
  total: number;
  page: number;
  limit: number;
}

/** 订单详情 - 商品明细项（旧结构，保留兼容） */
export interface CollectionOrderDetailItem {
  id: number;
  order_id?: number;
  item_id: number;
  item_title: string;
  item_image: string;
  price: number;
  quantity: number;
  subtotal: number;
  create_time?: number;
}

/** 订单详情响应（旧结构，保留兼容） */
export interface CollectionOrderDetailResponse {
  id: number;
  order_no: string;
  user_id: number;
  total_amount: number;
  pay_type: string;
  pay_type_text: string;
  status: string;
  status_text: string;
  remark: string | null;
  reservation_id: number;
  pay_balance_available: number;
  pay_pending_activation_gold: number;
  pay_ratio: string;
  freeze_amount: number;
  freeze_balance_available: number;
  freeze_pending_activation_gold: number;
  refund_diff: number;
  refund_balance_available: number;
  refund_pending_activation_gold: number;
  pay_time: number;
  pay_time_text: string;
  complete_time: number;
  complete_time_text: string;
  create_time: number;
  create_time_text: string;
  update_time?: number;
  items: CollectionOrderDetailItem[];
}

/** 买入订单详情 GET /api/collectionTrade/buyOrderDetail */
export interface CollectionBuyOrderDetail {
  /** 订单 ID */
  order_id: number;
  /** 订单号 */
  order_no: string;
  /** 藏品标题 */
  item_title: string;
  /** 藏品图片 */
  image: string;
  /** 买入价格（专项金部分） */
  buy_price: number;
  /** 订单总金额 */
  total_amount: number;
  /** 支付方式文本 */
  pay_type_text: string;
  /** 专项金支付金额 */
  pay_balance_available: number;
  /** 待激活确权金支付金额 */
  pay_pending_activation_gold: number;
  /** 混合支付比例 */
  pay_ratio: string;
  /** 寄售状态文本：待寄售/寄售中/已售出/矿机运行中 */
  status_text: string;
  /** 订单状态：pending/paid/completed/cancelled/refunded */
  order_status: string;
  /** 订单状态文本 */
  order_status_text: string;
  /** 用户藏品 ID */
  user_collection_id: number;
  /** 矿机状态：0=未开启 1=运行中 */
  mining_status: number;
  /** 购买时间 */
  buy_time: string;
  /** 下单时间 */
  create_time: string;
}

/** 卖出订单详情 GET /api/collectionTrade/sellOrderDetail */
export interface CollectionSellOrderDetail {
  /** 寄售记录 ID */
  consignment_id: number;
  /** 原买入订单 ID */
  order_id: number;
  /** 原买入订单号 */
  order_no: string;
  /** 藏品标题 */
  item_title: string;
  /** 藏品图片 */
  image: string;
  /** 原始购入价格 */
  buy_price: number;
  /** 成交价格 */
  sold_price: number;
  /** 挂单价格 */
  consign_price: number;
  /** 收益金额 */
  profit_amount: number;
  /** 手续费 */
  service_fee: number;
  /** 状态文本 */
  status_text: string;
  /** 挂单时间 */
  consign_time: string;
  /** 成交时间 */
  sold_time: string;
  /** 结算状态：0=未结算 1=已结算 */
  settle_status: number;
  /** 结算时间 */
  settle_time: string;
  /** 结算到可提现金额 */
  payout_total_withdrawable: number;
  /** 结算到消费金金额 */
  payout_total_consume: number;
}

/* ==================== API 实例 ==================== */

export const collectionTradeApi = {
  /**
   * 买入订单列表
   * GET /api/collectionTrade/buyOrders
   */
  buyOrders(
    params?: { page?: number; limit?: number },
    signal?: AbortSignal,
  ) {
    return http.get<CollectionBuyOrdersResponse>('/api/collectionTrade/buyOrders', {
      query: { page: params?.page ?? 1, limit: params?.limit ?? 10 },
      signal,
    });
  },

  /**
   * 卖出订单列表
   * GET /api/collectionTrade/sellOrders
   */
  sellOrders(
    params?: { page?: number; limit?: number },
    signal?: AbortSignal,
  ) {
    return http.get<CollectionSellOrdersResponse>('/api/collectionTrade/sellOrders', {
      query: { page: params?.page ?? 1, limit: params?.limit ?? 10 },
      signal,
    });
  },

  /**
   * 订单详情（旧接口，保留兼容）
   * GET /api/collectionTrade/orderDetail
   */
  detail(id: number, signal?: AbortSignal) {
    return http.get<CollectionOrderDetailResponse>('/api/collectionTrade/orderDetail', {
      query: { id },
      signal,
    });
  },

  /**
   * 买入订单详情
   * GET /api/collectionTrade/buyOrderDetail
   */
  buyOrderDetail(params: { id?: number; order_no?: string }, signal?: AbortSignal) {
    return http.get<CollectionBuyOrderDetail>('/api/collectionTrade/buyOrderDetail', {
      query: params,
      signal,
    });
  },

  /**
   * 卖出订单详情
   * GET /api/collectionTrade/sellOrderDetail
   * @param id 寄售记录 ID (consignment_id)
   */
  sellOrderDetail(params: { id: number }, signal?: AbortSignal) {
    return http.get<CollectionSellOrderDetail>('/api/collectionTrade/sellOrderDetail', {
      query: params,
      signal,
    });
  },
};

