/**
 * 预约申购 API 模块
 * 接口：GET /api/collectionReservation/reservations
 * 需要请求头：ba-token, ba-user-token, batoken
 */
import { createApiHeaders } from '../core/headers';
import { http } from '../http';

/* ==================== 类型定义 ==================== */

/** 支付环节详细信息 */
export interface ReservationPaymentDetail {
  status: string;
  pay_type: string;
  pay_type_text: string;
  total_amount: number;
  balance_amount: number;
  pending_activation_gold_amount: number;
  green_power: number;
  mixed_payment_ratio: string;
  mixed_payment_source: string;
  is_mixed: boolean;
}

/** 撮合交易详情 */
export interface ReservationDealDetail {
  status: string;
  matched: boolean;
  match_order_id: number;
  match_order_no: string;
  order_status: string;
  match_time: string | null;
  product_id: number;
  item_title: string;
  item_image: string;
  item_price: number;
  actual_buy_price: number;
  refund_diff: number;
}

/** 预约记录项 */
export interface ReservationItem {
  id: number;
  session_id: number;
  zone_id: number;
  package_id: number;
  product_id: number;
  freeze_amount: number;
  freeze_balance_available: number;
  freeze_pending_activation_gold: number;
  mixed_payment_ratio: string;
  mixed_payment_source: string;
  power_used: number;
  base_hashrate_cost: number;
  extra_hashrate_cost: number;
  weight: number;
  status: number;
  status_text: string;
  match_order_id: number;
  match_time: string | null;
  create_time: string;
  update_time: string;
  session_title: string;
  session_start_time: string;
  session_end_time: string;
  zone_name: string;
  zone_min_price: number;
  zone_max_price: number;
  package_name: string;
  payment: ReservationPaymentDetail;
  refund: ReservationPaymentDetail;
  actual_payment: ReservationPaymentDetail;
  deal: ReservationDealDetail;
}

/** 列表分页响应 */
export interface ReservationListResponse {
  list: ReservationItem[];
  total: number;
}

/** 查询参数 */
export interface ReservationListQuery {
  /** 页码，默认 1 */
  page?: number;
  /** 每页数量，默认 10 */
  limit?: number;
  /** 状态筛选：0=待撮合, 1=已撮合, 2=已退款, -1=全部 */
  sstatus?: number;
  /** 兼容字段，建议使用 sstatus */
  status?: number;
  /** 场次 ID */
  session_id?: number;
  /** 价格分区 ID */
  zone_id?: number;
  /** 开始时间（Unix 时间戳） */
  start_time?: number;
  /** 结束时间（Unix 时间戳） */
  end_time?: number;
  /** 排序字段 */
  sort?: 'create_time' | 'weight' | 'freeze_amount';
  /** 排序方向 */
  order?: 'asc' | 'desc';
}

/* ==================== 预约预览 ==================== */

/** 预约预览请求参数 */
export interface ReservationPreviewParams {
  /** 场次 ID */
  session_id: number;
  /** 价格分区 ID */
  zone_id: number;
  /** 资产包 ID */
  package_id: number;
  /** 额外加注算力，默认 0 */
  extra_hashrate?: number;
  /** 申购数量，默认 1 */
  quantity?: number;
}

/** 支付明细 */
export interface ReservationPreviewPayment {
  /** 支付状态 */
  status: string;
  /** 支付类型: combined=混合支付 */
  pay_type: string;
  /** 支付类型文本 */
  pay_type_text: string;
  /** 总金额 */
  total_amount: number;
  /** 专项金（余额）支付金额 */
  balance_amount: number;
  /** 待激活确权金支付金额 */
  pending_activation_gold_amount: number;
  /** 绿色算力消耗 */
  green_power: number;
  /** 混合支付比例（如 "9:1"） */
  mixed_payment_ratio: string;
  /** 混合支付来源 */
  mixed_payment_source: string;
  /** 是否混合支付 */
  is_mixed: boolean;
}

/** 混合支付信息 */
export interface ReservationMixedPayment {
  /** 是否启用混合支付 */
  enabled: boolean;
  /** 是否可用 */
  available: boolean;
  /** 原因代码 */
  reason: string;
  /** 原因文本 */
  reason_text: string;
  /** 混合支付提示/切换原因 */
  notice: string;
  /** 混合支付比例（如 "9:1"） */
  ratio: string;
  /** 混合支付剩余次数 */
  remaining_times: number;
}

/** 预约预览响应 */
export interface ReservationPreviewResponse {
  /** 申购数量 */
  quantity: number;
  /** 场次 ID */
  session_id: number;
  /** 场次标题 */
  session_title: string;
  /** 分区 ID */
  zone_id: number;
  /** 分区名称 */
  zone_name: string;
  /** 资产包 ID */
  package_id: number;
  /** 资产包名称 */
  package_name: string;
  /** 权重 */
  weight: number;
  /** 额外加注算力 */
  extra_hashrate: number;
  /** 总冻结金额 */
  total_freeze_amount: number;
  /** 单笔冻结金额 */
  single_freeze_amount: number;
  /** 总算力消耗 */
  total_power_used: number;
  /** 单笔算力消耗 */
  single_power_used: number;
  /** 支付详情 */
  payment: ReservationPreviewPayment;
  /** 混合支付信息 */
  mixed_payment: ReservationMixedPayment;
  /** 预览说明 */
  message: string;
}

export type ReservationAgreementType = 'purchase_rules' | 'risk_notice';

export interface ReservationAgreementResponse {
  type: ReservationAgreementType;
  title: string;
  content: string;
  config_name?: string;
  tip?: string;
}

/* ==================== API ==================== */

export const reservationApi = {
  /**
   * 获取预约申购协议文案
   * GET /api/collectionReservation/agreement
   */
  async getAgreement(type: ReservationAgreementType, signal?: AbortSignal) {
    return http.get<ReservationAgreementResponse>(
      '/api/collectionReservation/agreement',
      {
        headers: createApiHeaders(),
        query: { type },
        signal,
      },
    );
  },

  /**
   * 预约记录详情
   * GET /api/collectionReservation/reservationDetail
   */
  async getDetail(id: number, signal?: AbortSignal) {
    const response = await http.get<ReservationItem>(
      '/api/collectionReservation/reservationDetail',
      {
        headers: createApiHeaders(),
        query: { id },
        signal,
      },
    );
    return response;
  },

  /**
   * 查询预约记录列表
   */
  async getList(query: ReservationListQuery = {}, signal?: AbortSignal) {
    const statusValue = query.sstatus ?? query.status ?? -1;

    const response = await http.get<ReservationListResponse>(
      '/api/collectionReservation/reservations',
      {
        headers: createApiHeaders(),
        query: {
          page: query.page ?? 1,
          limit: query.limit ?? 10,
          sstatus: statusValue,
          ...(query.session_id != null && { session_id: query.session_id }),
          ...(query.zone_id != null && { zone_id: query.zone_id }),
          ...(query.start_time != null && { start_time: query.start_time }),
          ...(query.end_time != null && { end_time: query.end_time }),
          sort: query.sort ?? 'create_time',
          order: query.order ?? 'desc',
        },
        signal,
      },
    );

    return response;
  },

  /**
   * 预约预览（确认前调用）
   * POST /api/collectionReservation/previewBidBuy
   */
  async previewBidBuy(params: ReservationPreviewParams, signal?: AbortSignal) {
    const response = await http.post<ReservationPreviewResponse>(
      '/api/collectionReservation/previewBidBuy',
      {
        session_id: params.session_id,
        zone_id: params.zone_id,
        package_id: params.package_id,
        extra_hashrate: params.extra_hashrate ?? 0,
        quantity: params.quantity ?? 1,
      },
      {
        headers: createApiHeaders(),
        signal,
      },
    );

    return response;
  },

  /**
   * 执行申购提交
   * POST /api/collectionReservation/bidBuy
   */
  async bidBuy(params: ReservationPreviewParams, signal?: AbortSignal) {
    const response = await http.post<{ message?: string }>(
      '/api/collectionReservation/bidBuy',
      {
        session_id: params.session_id,
        zone_id: params.zone_id,
        package_id: params.package_id,
        extra_hashrate: params.extra_hashrate ?? 0,
        quantity: params.quantity ?? 1,
      },
      {
        headers: createApiHeaders(),
        signal,
      },
    );
    return response;
  },
};
