export interface ShopOrderItemDetail {
  id: number;
  shop_order_id: number;
  product_id: number;
  product_name: string;
  product_image: string;
  product_thumbnail?: string;
  price: number;
  score_price?: number;
  subtotal: number;
  subtotal_score?: number;
  quantity: number;
  [key: string]: unknown;
}

export interface ShopOrderItem {
  id: number;
  order_no: string;
  total_amount: number | string;
  total_score: number | string;
  status: number;
  status_text: string;
  pay_type: string;
  createtime: number;
  create_time?: number;
  create_time_text?: string;
  pay_time?: number;
  pay_time_text?: string;
  ship_time?: number;
  ship_time_text?: string;
  shipping_no?: string;
  items: ShopOrderItemDetail[];
  product_image?: string;
  product_name?: string;
  thumbnail?: string;
  quantity?: number;
  is_commented?: number;
  [key: string]: unknown;
}

export interface FetchShopOrderParams {
  page?: number;
  limit?: number;
  pay_type?: string;
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
  pay_type: 'money' | 'score';
  address_id?: number | null;
  remark?: string;
  token?: string;
  is_physical?: boolean;
}

export interface BuyShopOrderParams {
  items: CreateOrderItem[];
  pay_type: 'money' | 'score';
  address_id?: number | null;
  remark?: string;
  token?: string;
  is_physical?: boolean;
}
