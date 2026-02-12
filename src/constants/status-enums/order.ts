/**
 * 订单相关状态
 */

/**
 * 藏品订单状态
 * ba_collection_order.status
 */
export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export const OrderStatusMap: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: '待支付',
  [OrderStatus.PAID]: '已支付',
  [OrderStatus.COMPLETED]: '已完成',
  [OrderStatus.CANCELLED]: '已取消',
  [OrderStatus.REFUNDED]: '已退款',
}

/**
 * 商城订单状态
 * ba_shop_order.status
 */
export enum ShopOrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  SHIPPED = 'shipped',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export const ShopOrderStatusMap: Record<ShopOrderStatus, string> = {
  [ShopOrderStatus.PENDING]: '待支付',
  [ShopOrderStatus.PAID]: '待发货',
  [ShopOrderStatus.SHIPPED]: '待确认收货',
  [ShopOrderStatus.COMPLETED]: '已完成',
  [ShopOrderStatus.CANCELLED]: '已取消',
  [ShopOrderStatus.REFUNDED]: '已退款',
}

/**
 * 支付方式
 * ba_collection_order.pay_type, ba_shop_order.pay_type
 */
export enum PayType {
  MONEY = 'money',
  SCORE = 'score',
}

export const PayTypeMap: Record<PayType, string> = {
  [PayType.MONEY]: '余额支付',
  [PayType.SCORE]: '消费金支付',
}

// ============================================================
// 充值/提现订单状态（保留旧枚举兼容）
// ============================================================

/**
 * 充值订单状态
 */
export enum RechargeOrderStatus {
  PENDING = 0,
  APPROVED = 1,
  REJECTED = 2,
}

/**
 * 提现订单状态
 */
export enum WithdrawOrderStatus {
  PENDING = 0,
  APPROVED = 1,
  REJECTED = 2,
}

/**
 * 商城订单支付状态
 */
export enum ShopOrderPayStatus {
  UNPAID = 0,
  PAID = 1,
}

/**
 * 商城订单物流状态
 */
export enum ShopOrderShippingStatus {
  NOT_SHIPPED = 0,
  SHIPPED = 1,
  RECEIVED = 2,
}
