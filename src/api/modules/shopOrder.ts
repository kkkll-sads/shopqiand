/**
 * @file 商城订单 API
 * @description 商城订单相关接口
 */

import type { QueryParams } from '../core/query';
import { createApiHeaders, type ApiAuthOptions } from '../core/headers';
import { http } from '../http';

export interface ShopOrderConfirmOptions extends ApiAuthOptions {
  signal?: AbortSignal;
}

export interface ShopOrderPayOptions extends ApiAuthOptions {
  signal?: AbortSignal;
}

export interface ShopOrderAfterSaleInfo {
  id: number;
  order_id: number;
  order_no: string;
  type: string;
  status: '' | 'processing' | 'completed' | 'closed';
  status_text: string;
  reason: string;
  description: string;
  images: string[];
  admin_remark: string;
  close_reason: string;
  apply_time: number;
  receive_time: number;
  complete_time: number;
  close_time: number;
}

export interface ShopOrderAfterSaleResult {
  after_sale: ShopOrderAfterSaleInfo;
}

/** 商城订单支付请求参数 */
export interface ShopOrderPayPayload {
  /** 订单 ID */
  order_id: number;
  /** 使用可用金额支付的金额，不传则根据订单类型自动支付 */
  pay_money?: number;
  /** 使用消费金支付的金额，不传则根据订单类型自动支付 */
  pay_score?: number;
}

/** 商城订单支付响应数据 */
export interface ShopOrderPayResult {
  order_no: string;
  order_id: number;
  status: string;
  pay_money: number;
  pay_score: number;
}

interface ShopOrderPayRaw {
  order_no?: string;
  order_id?: number | string;
  status?: string;
  pay_money?: number | string;
  pay_score?: number | string;
}

function readNumber(value: number | string | undefined): number {
  const next = typeof value === 'string' ? Number(value) : value;
  return Number.isFinite(next) ? next : 0;
}

function readString(value: string | undefined): string {
  return typeof value === 'string' ? value.trim() : '';
}

/** 订单详情接口响应：订单结构与列表项相同，额外包含余额信息 */
export interface ShopOrderDetailResponse extends ShopOrderListItem {
  /** 用户可用余额 */
  balance_available: string;
  /** 用户消费金 */
  score: string;
}

export interface ShopOrderLogisticsTimelineItem {
  time: string;
  content: string;
  zone: string;
  is_latest: boolean;
}

export interface ShopOrderLogisticsResponse {
  order_id: number;
  order_no: string;
  shipping_company: string;
  shipping_company_code: string;
  shipping_no: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  requires_phone_suffix: boolean;
  receiver_phone_suffix: string;
  query_success: boolean;
  query_error_code: number;
  query_message: string;
  status: string;
  status_text: string;
  status_detail: string;
  status_detail_text: string;
  status_is_final: boolean;
  last_update_time: string;
  timeline: ShopOrderLogisticsTimelineItem[];
  provider: string;
}

/** 支付方式筛选 */
export type PendingPayType = 'money' | 'score' | 'combined';

/** 待付款订单列表响应（list 结构与 myOrders 相同） */
export interface PendingPayListResponse {
  list: ShopOrderListItem[];
  total?: number;
  page?: number;
  limit?: number;
  balance_available?: string;
  score?: string;
}

/** 已完成订单列表项（含 is_commented: 0=未评价, 1=已评价） */
export interface ShopOrderCompletedItem {
  is_commented: 0 | 1;
  [key: string]: unknown;
}

/** 已完成订单列表请求参数 */
export interface ShopOrderCompletedParams {
  /** 页码，默认 1 */
  page?: number;
  /** 每页数量，默认 10 */
  limit?: number;
  /** 支付方式筛选: money | score | combined */
  pay_type?: 'money' | 'score' | 'combined';
}

/** 已完成订单列表响应 data */
export interface ShopOrderCompletedResponse {
  list: ShopOrderCompletedItem[];
  balance_available: string;
  score: string;
}

/** 待确认收货订单列表 - 查询参数 */
export interface ShopOrderPendingConfirmQuery {
  /** 页码，默认 1 */
  page?: number;
  /** 每页数量，默认 10 */
  limit?: number;
  /** 支付方式筛选: money / score / combined */
  pay_type?: 'money' | 'score' | 'combined';
}

/** 待确认收货订单列表 - 单项（结构以实际接口为准） */
export interface ShopOrderPendingConfirmItem {
  [key: string]: unknown;
}

/** 待确认收货订单列表 - 响应 data */
export interface ShopOrderPendingConfirmResponse {
  /** 待确认收货订单列表 */
  list: ShopOrderPendingConfirmItem[];
  /** 用户可用余额 */
  balance_available: string;
  /** 用户消费金 */
  score: string;
}

/** 取消订单 - 响应 data */
export interface ShopOrderCancelResult {
  /** 订单号 */
  order_no: string;
  /** 订单 ID */
  order_id: number;
  /** 订单状态或审核状态 */
  status: string;
  /** 是否需要审核 */
  need_review: boolean;
  /** 审核记录 ID（need_review=true 时返回） */
  review_id?: number;
}

/** 我的订单列表 - 查询参数 */
export interface ShopOrderMyOrdersQuery {
  /** 页码，默认 1 */
  page?: number;
  /** 每页数量，默认 10 */
  limit?: number;
  /** 订单状态（与 Tab 对应，不传或空为全部） */
  status?: string;
}

/** 我的订单列表 - 订单商品项 */
export interface ShopOrderItemDetail {
  id: number;
  order_id: number;
  product_id: number;
  sku_id: number;
  flash_sale_product_id: number;
  product_name: string;
  product_thumbnail: string;
  /** 人民币单价 */
  price: number;
  /** 消费金单价 */
  score_price: number;
  quantity: number;
  /** 人民币小计 */
  subtotal: number;
  /** 消费金小计 */
  subtotal_score: number;
  create_time: number;
  is_physical: string;
  is_card_product: string;
}

/** 我的订单列表 - 单条订单 */
export interface ShopOrderListItem {
  id: number;
  order_no: string;
  user_id: number;
  /** 人民币总额 */
  total_amount: number;
  /** 消费金总额 */
  total_score: number;
  /** 支付方式：money / score / combined */
  pay_type: string;
  /** 订单状态：pending / paid / shipped / completed / cancelled / refunded */
  status: string;
  /** 收件人姓名 */
  recipient_name: string;
  /** 收件人电话 */
  recipient_phone: string;
  /** 收件人地址 */
  recipient_address: string;
  shipping_no: string;
  shipping_company: string;
  shipping_company_display?: string;
  shipping_company_raw?: string;
  shipping_company_code?: string;
  remark: string;
  source: string;
  admin_remark: string;
  pay_time: number;
  ship_time: number;
  complete_time: number;
  create_time: number;
  update_time: number;
  /** 订单包含的商品列表 */
  items: ShopOrderItemDetail[];
  /** 商品类型：physical / virtual */
  product_type: string;
  /** 商品类型中文 */
  product_type_text: string;
  /** 订单状态中文 */
  status_text: string;
  /** 支付方式中文 */
  pay_type_text: string;
  after_sale_id?: number;
  after_sale_status?: '' | 'processing' | 'completed' | 'closed';
  after_sale_status_text?: string;
  after_sale_info?: ShopOrderAfterSaleInfo;
  has_after_sale?: 0 | 1;
  can_cancel_after_sale?: 0 | 1;
  /** 是否已评价：0=未评价, 1=已评价 */
  is_commented?: 0 | 1;
}

/** 我的订单列表 - 响应 data */
export interface ShopOrderMyOrdersData {
  list: ShopOrderListItem[];
  total: number;
  page: number;
  limit: number;
  balance_available: string;
  score: string;
}

/** 创建订单请求参数 */
export interface ShopOrderCreatePayload {
  /** 商品列表（与 cart_ids 二选一，直接购买模式） */
  items?: Array<{
    /** 商品 ID */
    product_id: number;
    /** 购买数量 */
    quantity: number;
    /** SKU ID（多规格商品必填） */
    sku_id?: number;
    /** 秒杀商品 ID（秒杀时必填） */
    flash_sale_product_id?: number;
  }>;
  /** 购物车项 ID 数组（与 items 二选一，购物车下单模式） */
  cart_ids?: number[];
  /** 收货地址 ID（实物商品必填） */
  address_id: number;
  /** 订单备注（选填） */
  remark?: string;
}

/** 创建订单响应数据 */
export interface ShopOrderCreateResult {
  /** 订单 ID（拆单时为第一个子订单 ID） */
  order_id: number;
  /** 拆单时包含所有子订单 ID，单订单时为 undefined */
  order_ids?: number[];
  /** 订单号 */
  order_no: string;
  /** 应付人民币金额（合计） */
  total_amount: number;
  /** 应付消费金金额（合计） */
  total_score: number;
  /** 订单状态 */
  status: string;
  /** 支付方式：money=人民币 / score=消费金 / combined=混合 */
  pay_type: string;
  /** 用户可用余额 */
  balance_available: string;
  /** 用户消费金余额 */
  score: string;
}

export const shopOrderApi = {
  /**
   * 创建订单（结算）
   * POST /api/shopOrder/create
   * @param payload 创建订单参数
   */
  async create(
    payload: ShopOrderCreatePayload,
    options: ShopOrderPayOptions = {},
  ): Promise<ShopOrderCreateResult> {
    const body: Record<string, unknown> = {
      address_id: payload.address_id,
      ...(payload.remark != null && { remark: payload.remark }),
    };
    // 直接购买模式：传 items 数组
    if (payload.items != null && payload.items.length > 0) {
      body.items = payload.items;
    } else if (payload.cart_ids != null) {
      // 购物车下单模式
      body.cart_ids = payload.cart_ids;
    }
    const data = await http.post<
      {
        order_id?: number | string;
        order_ids?: (number | string)[];
        order_no?: string;
        total_amount?: number | string;
        total_score?: number | string;
        status?: string;
        pay_type?: string;
        balance_available?: string;
        score?: string;
      },
      typeof body
    >('/api/shopOrder/create', body, {
      headers: createApiHeaders(options),
      signal: options.signal,
    });

    const rawIds = Array.isArray(data?.order_ids) ? data.order_ids : undefined;
    const orderIds = rawIds
      ?.map((id) => readNumber(id as number))
      .filter((n) => n > 0);

    return {
      order_id: readNumber(data?.order_id ?? 0),
      order_ids: orderIds && orderIds.length > 1 ? orderIds : undefined,
      order_no: readString(data?.order_no ?? ''),
      total_amount: readNumber(data?.total_amount ?? 0),
      total_score: readNumber(data?.total_score ?? 0),
      status: readString(data?.status ?? ''),
      pay_type: readString(data?.pay_type ?? ''),
      balance_available: readString(data?.balance_available ?? '0'),
      score: readString(data?.score ?? '0'),
    };
  },

  /**
   * 待付款订单列表
   * GET /api/shopOrder/pendingPay
   * @param params 分页及支付方式筛选
   */
  pendingPay(
    params?: { page?: number; limit?: number; pay_type?: PendingPayType },
    signal?: AbortSignal,
  ) {
    const query = {
      page: params?.page ?? 1,
      limit: params?.limit ?? 10,
      ...(params?.pay_type && { pay_type: params.pay_type }),
    };
    return http.get<PendingPayListResponse>('/api/shopOrder/pendingPay', {
      query,
      signal,
    });
  },

  /**
   * 订单详情
   * GET /api/shopOrder/detail
   * @param id 订单 ID
   */
  detail(
    params: { id?: number; order_no?: string },
    signal?: AbortSignal,
  ): Promise<ShopOrderDetailResponse> {
    return http.get<ShopOrderDetailResponse>('/api/shopOrder/detail', {
      query: params,
      signal,
    });
  },

  /**
   * 订单物流详情
   * GET /api/shopOrder/logistics
   */
  logistics(
    params: { id?: number; order_no?: string },
    signal?: AbortSignal,
  ): Promise<ShopOrderLogisticsResponse> {
    return http.get<ShopOrderLogisticsResponse>('/api/shopOrder/logistics', {
      query: params,
      signal,
    });
  },

  /**
   * 确认收货
   * POST /api/shopOrder/confirm
   * @param id 订单 ID
   */
  confirm(id: number, options: ShopOrderConfirmOptions = {}): Promise<void> {
    return http.post<unknown, { id: number }>(
      '/api/shopOrder/confirm',
      { id },
      {
        headers: createApiHeaders(options),
        signal: options.signal,
      },
    ) as Promise<void>;
  },

  applyAfterSale(
    payload: { order_id: number; reason: string; description?: string; images?: string[] },
    options: ShopOrderConfirmOptions = {},
  ): Promise<ShopOrderAfterSaleResult> {
    return http.post<
      ShopOrderAfterSaleResult,
      { order_id: number; reason: string; description?: string; images?: string[] }
    >('/api/shopOrder/applyAfterSale', payload, {
      headers: createApiHeaders(options),
      signal: options.signal,
    });
  },

  cancelAfterSale(
    payload: { after_sale_id?: number; order_id?: number },
    options: ShopOrderConfirmOptions = {},
  ): Promise<ShopOrderAfterSaleResult> {
    return http.post<ShopOrderAfterSaleResult, { after_sale_id?: number; order_id?: number }>(
      '/api/shopOrder/cancelAfterSale',
      payload,
      {
        headers: createApiHeaders(options),
        signal: options.signal,
      },
    );
  },

  receiveAfterSale(
    payload: { after_sale_id?: number; order_id?: number },
    options: ShopOrderConfirmOptions = {},
  ): Promise<ShopOrderAfterSaleResult> {
    return http.post<ShopOrderAfterSaleResult, { after_sale_id?: number; order_id?: number }>(
      '/api/shopOrder/receiveAfterSale',
      payload,
      {
        headers: createApiHeaders(options),
        signal: options.signal,
      },
    );
  },

  /**
   * 待发货订单列表
   * GET /api/shopOrder/pendingShip
   * @param params 分页与支付方式筛选
   */
  pendingShip(
    params?: { page?: number; limit?: number; pay_type?: PendingPayType },
    signal?: AbortSignal,
  ) {
    const query = {
      page: params?.page ?? 1,
      limit: params?.limit ?? 10,
      ...(params?.pay_type && { pay_type: params.pay_type }),
    };
    return http.get<PendingPayListResponse>('/api/shopOrder/pendingShip', {
      query,
      signal,
    });
  },

  /**
   * 待确认收货订单列表
   * GET /api/shopOrder/pendingConfirm
   * @param params 分页与支付方式筛选
   */
  pendingConfirm(
    params?: { page?: number; limit?: number; pay_type?: PendingPayType },
    signal?: AbortSignal,
  ) {
    const query = {
      page: params?.page ?? 1,
      limit: params?.limit ?? 10,
      ...(params?.pay_type && { pay_type: params.pay_type }),
    };
    return http.get<PendingPayListResponse>('/api/shopOrder/pendingConfirm', {
      query,
      signal,
    });
  },

  /**
   * 商城订单支付
   * POST /api/shopOrder/pay
   * @param payload 支付参数
   */
  async pay(
    payload: ShopOrderPayPayload,
    options: ShopOrderPayOptions = {},
  ): Promise<ShopOrderPayResult> {
    const body: Record<string, number> = { order_id: payload.order_id };
    if (payload.pay_money != null) body.pay_money = payload.pay_money;
    if (payload.pay_score != null) body.pay_score = payload.pay_score;

    const data = await http.post<ShopOrderPayRaw, typeof body>(
      '/api/shopOrder/pay',
      body,
      {
        headers: createApiHeaders(options),
        signal: options.signal,
      },
    );

    return {
      order_no: readString(data?.order_no),
      order_id: readNumber(data?.order_id),
      status: readString(data?.status),
      pay_money: readNumber(data?.pay_money),
      pay_score: readNumber(data?.pay_score),
    };
  },

  /**
   * 我的订单列表（商城订单）
   * GET /api/shopOrder/myOrders
   * 请求头需携带 batoken（用户 Token）
   */
  myOrders(query: ShopOrderMyOrdersQuery = {}, signal?: AbortSignal) {
    return http.get<ShopOrderMyOrdersData>('/api/shopOrder/myOrders', {
      query: query as QueryParams,
      signal,
    });
  },

  /**
   * 已完成订单列表
   * GET /api/shopOrder/completed
   * @param params 分页与支付方式筛选
   */
  completed(
    params: ShopOrderCompletedParams = {},
    signal?: AbortSignal,
  ) {
    return http.get<ShopOrderCompletedResponse>('/api/shopOrder/completed', {
      query: {
        page: params.page ?? 1,
        limit: params.limit ?? 10,
        ...(params.pay_type && { pay_type: params.pay_type }),
      },
      signal,
    });
  },

  /**
   * 取消订单（商城订单取消）
   * POST /api/shopOrder/cancel
   * 请求头需携带 batoken（用户 Token）
   * cancel_reason 超过24小时必填
   */
  cancel(
    payload: { order_id: number; cancel_reason?: string },
    signal?: AbortSignal,
  ) {
    return http.post<ShopOrderCancelResult, { order_id: number; cancel_reason?: string }>(
      '/api/shopOrder/cancel',
      payload,
      { signal },
    );
  },

  /**
   * 删除待支付订单
   * POST /api/shopOrder/delete
   * @param orderId 订单 ID
   */
  async delete(
    orderId: number,
    options: ShopOrderPayOptions = {},
  ): Promise<{ order_id: number }> {
    const data = await http.post<{ order_id?: number | string }, { order_id: number }>(
      '/api/shopOrder/delete',
      { order_id: orderId },
      {
        headers: createApiHeaders(options),
        signal: options.signal,
      },
    );
    return {
      order_id: readNumber(data?.order_id ?? orderId),
    };
  },
};
