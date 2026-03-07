export type ShopOrderPaymentType = 'money' | 'score' | 'combined';

export type ShopOrderAmount = number | string;

export type ShopOrderStatus = number | string;

export interface ShopOrderStep {
  key: string;
  label: string;
  time?: string;
  is_completed: boolean;
  is_current: boolean;
}

export interface ShopOrderPaymentSplitFields {
  pay_balance_available?: ShopOrderAmount;
  pay_balance_available_amount?: ShopOrderAmount;
  pay_pending_activation_gold?: ShopOrderAmount;
  pay_pending_activation_gold_amount?: ShopOrderAmount;
  pay_score?: ShopOrderAmount;
  pay_score_amount?: ShopOrderAmount;
  pay_ratio?: ShopOrderAmount | string | Record<string, unknown>;
  reservation_id?: number | string;
  freeze_amount?: ShopOrderAmount;
  freeze_total_amount?: ShopOrderAmount;
  freeze_balance_available?: ShopOrderAmount;
  freeze_balance_available_amount?: ShopOrderAmount;
  freeze_pending_activation_gold?: ShopOrderAmount;
  freeze_pending_activation_gold_amount?: ShopOrderAmount;
  freeze_score_amount?: ShopOrderAmount;
  refund_amount?: ShopOrderAmount;
  refund_total_amount?: ShopOrderAmount;
  refund_diff?: ShopOrderAmount;
  refund_balance_available?: ShopOrderAmount;
  refund_balance_available_amount?: ShopOrderAmount;
  refund_pending_activation_gold?: ShopOrderAmount;
  refund_pending_activation_gold_amount?: ShopOrderAmount;
  refund_score_amount?: ShopOrderAmount;
}

export interface ShopOrderItemDetail {
  id: number;
  shop_order_id: number;
  product_id: number;
  product_name: string;
  product_image: string;
  product_thumbnail?: string;
  sku_id?: number;
  price: number;
  score_price?: number;
  balance_available_amount?: ShopOrderAmount;
  subtotal: ShopOrderAmount;
  subtotal_score?: ShopOrderAmount;
  subtotal_balance_available?: ShopOrderAmount;
  quantity: number;
  [key: string]: unknown;
}

export interface ShopOrderItem extends ShopOrderPaymentSplitFields {
  id: number;
  order_no: string;
  total_amount: ShopOrderAmount;
  total_score: ShopOrderAmount;
  status: ShopOrderStatus;
  status_text: string;
  pay_type: ShopOrderPaymentType;
  pay_type_text?: string;
  createtime: number;
  create_time?: number;
  create_time_text?: string;
  pay_time?: number;
  pay_time_text?: string;
  ship_time?: number;
  ship_time_text?: string;
  complete_time?: number;
  complete_time_text?: string;
  shipping_no?: string;
  shipping_company?: string;
  shipping_status_text?: string;
  items: ShopOrderItemDetail[];
  product_image?: string;
  product_name?: string;
  thumbnail?: string;
  quantity?: number;
  is_commented?: number;
  [key: string]: unknown;
}

export interface ShopOrderDetail extends ShopOrderItem {
  score?: ShopOrderAmount;
  balance_available?: ShopOrderAmount;
  balance_amount?: ShopOrderAmount;
  score_amount?: ShopOrderAmount;
  product_type_text?: string;
  recipient_name?: string;
  recipient_phone?: string;
  recipient_address?: string;
  remark?: string;
  order_steps?: ShopOrderStep[];
}

export interface FetchShopOrderParams {
  page?: number;
  limit?: number;
  pay_type?: ShopOrderPaymentType;
  token?: string;
}

export interface ShopOrderListData {
  list: ShopOrderItem[];
  total: number;
}

export interface OrderActionParams {
  id: number | string;
  token?: string;
}

export interface ShopOrderStatistics {
  all_count: number;
  pending_count: number;
  paid_count: number;
  shipped_count: number;
  completed_count: number;
  cancelled_count: number;
  refunded_count: number;
}

export interface CreateOrderItem {
  product_id: number;
  quantity: number;
  sku_id?: number;
}

export interface CreateOrderParams {
  items: CreateOrderItem[];
  pay_type: ShopOrderPaymentType;
  address_id?: number | null;
  remark?: string;
  token?: string;
  is_physical?: boolean;
}

export interface BuyShopOrderParams {
  items: CreateOrderItem[];
  pay_type: ShopOrderPaymentType;
  address_id?: number | null;
  remark?: string;
  token?: string;
  is_physical?: boolean;
}

export interface GetOrderDetailParams {
  id: number | string;
  token?: string;
}

export interface CreateOrderResult extends ShopOrderPaymentSplitFields {
  id?: number;
  order_id?: number;
  order_no?: string;
  total_amount?: ShopOrderAmount;
  total_score?: ShopOrderAmount;
  status?: ShopOrderStatus;
  status_text?: string;
  pay_type?: ShopOrderPaymentType;
  pay_type_text?: string;
  balance_amount?: ShopOrderAmount;
  score_amount?: ShopOrderAmount;
  [key: string]: unknown;
}
