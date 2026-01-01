/**
 * 状态枚举常量
 * 用于替换代码中的魔法数字，提升可读性和可维护性
 *
 * @module statusEnums
 * @created 2025-12-29
 */

/**
 * 实名认证状态
 */
export enum RealNameStatus {
  /** 未认证 */
  NOT_VERIFIED = 0,
  /** 待审核 */
  PENDING = 1,
  /** 已认证 */
  VERIFIED = 2,
  /** 审核拒绝 */
  REJECTED = 3,
}

/**
 * 寄售状态
 */
export enum ConsignmentStatus {
  /** 未寄售 */
  NOT_CONSIGNED = 0,
  /** 寄售待审核 */
  PENDING = 1,
  /** 寄售中 */
  CONSIGNING = 2,
  /** 审核拒绝 */
  REJECTED = 3,
  /** 已售出 */
  SOLD = 4,
}

/**
 * 提货状态
 */
export enum DeliveryStatus {
  /** 未提货 */
  NOT_DELIVERED = 0,
  /** 已提货 */
  DELIVERED = 1,
}

/**
 * 充值订单状态
 */
export enum RechargeOrderStatus {
  /** 待审核 */
  PENDING = 0,
  /** 审核通过 */
  APPROVED = 1,
  /** 审核拒绝 */
  REJECTED = 2,
}

/**
 * 提现订单状态
 */
export enum WithdrawOrderStatus {
  /** 待审核 */
  PENDING = 0,
  /** 审核通过/已到账 */
  APPROVED = 1,
  /** 审核拒绝 */
  REJECTED = 2,
}

/**
 * 商城订单支付状态
 */
export enum ShopOrderPayStatus {
  /** 未支付 */
  UNPAID = 0,
  /** 已支付 */
  PAID = 1,
}

/**
 * 商城订单物流状态
 */
export enum ShopOrderShippingStatus {
  /** 未发货 */
  NOT_SHIPPED = 0,
  /** 已发货 */
  SHIPPED = 1,
  /** 已收货 */
  RECEIVED = 2,
}

/**
 * 预约状态
 */
export enum ReservationStatus {
  /** 待审核 */
  PENDING = 0,
  /** 审核通过 */
  APPROVED = 1,
  /** 审核拒绝 */
  REJECTED = 2,
  /** 已取消 */
  CANCELLED = 3,
}

/**
 * 数字藏品状态
 */
export enum CollectionStatus {
  /** 待铸造 */
  PENDING_MINT = 0,
  /** 已铸造 */
  MINTED = 1,
  /** 已转移 */
  TRANSFERRED = 2,
}

// 导出所有枚举，方便统一导入
export const StatusEnums = {
  RealNameStatus,
  ConsignmentStatus,
  DeliveryStatus,
  RechargeOrderStatus,
  WithdrawOrderStatus,
  ShopOrderPayStatus,
  ShopOrderShippingStatus,
  ReservationStatus,
  CollectionStatus,
} as const;

export default StatusEnums;
