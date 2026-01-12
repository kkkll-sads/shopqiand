/**
 * 前后端统一映射字典
 * 
 * 此文件定义了前后端共同使用的所有映射关系，包括：
 * - API 响应码
 * - 业务状态值
 * - 状态文本映射
 * - 其他通用常量
 * 
 * @module apiMappings
 * @created 2025-01-02
 */

// ============================================================================
// API 响应码定义
// ============================================================================

/**
 * API 响应码
 * 用于判断 API 请求是否成功
 */
export enum ApiResponseCode {
  /** 成功 */
  SUCCESS = 1,
  /** 成功（部分接口使用 0 表示成功） */
  SUCCESS_ALT = 0,
  /** 需要登录 */
  NEED_LOGIN = 303,
  /** 业务失败（具体错误信息在 msg 字段） */
  BUSINESS_ERROR = -1,
}

/**
 * API 响应码文本映射
 */
export const API_RESPONSE_CODE_LABELS: Record<number, string> = {
  [ApiResponseCode.SUCCESS]: '成功',
  [ApiResponseCode.SUCCESS_ALT]: '成功',
  [ApiResponseCode.NEED_LOGIN]: '需要登录',
  [ApiResponseCode.BUSINESS_ERROR]: '业务错误',
} as const;

/**
 * 判断 API 响应码是否成功
 * @param code API 响应码
 * @returns 是否成功
 */
export function isApiSuccess(code?: number): boolean {
  return code === ApiResponseCode.SUCCESS || code === ApiResponseCode.SUCCESS_ALT;
}

// 注意：完整的 API 响应判断请使用 utils/apiHelpers 中的 isSuccess 函数
// 此函数仅用于判断响应码

// ============================================================================
// 业务状态枚举（引用已有的枚举）
// ============================================================================

export {
  RealNameStatus,
  ConsignmentStatus,
  DeliveryStatus,
  RechargeOrderStatus,
  WithdrawOrderStatus,
  ShopOrderPayStatus,
  ShopOrderShippingStatus,
  ReservationStatus,
} from './statusEnums';

// ============================================================================
// 状态文本映射
// ============================================================================

/**
 * 实名认证状态文本映射
 */
export const REAL_NAME_STATUS_LABELS: Record<number, string> = {
  0: '未认证',
  1: '待审核',
  2: '已认证',
  3: '审核拒绝',
} as const;

/**
 * 寄售状态文本映射
 */
export const CONSIGNMENT_STATUS_LABELS: Record<number, string> = {
  0: '未寄售',
  1: '待审核',
  2: '寄售中',
  3: '审核拒绝',
  4: '已售出',
} as const;

/**
 * 提货状态文本映射
 */
export const DELIVERY_STATUS_LABELS: Record<number, string> = {
  0: '未提货',
  1: '已提货',
} as const;

/**
 * 充值订单状态文本映射
 */
export const RECHARGE_ORDER_STATUS_LABELS: Record<number, string> = {
  0: '待审核',
  1: '审核通过',
  2: '审核拒绝',
} as const;

/**
 * 提现订单状态文本映射
 */
export const WITHDRAW_ORDER_STATUS_LABELS: Record<number, string> = {
  0: '待审核',
  1: '审核通过',
  2: '审核拒绝',
} as const;

/**
 * 商城订单支付状态文本映射
 */
export const SHOP_ORDER_PAY_STATUS_LABELS: Record<number, string> = {
  0: '未支付',
  1: '已支付',
} as const;

/**
 * 商城订单物流状态文本映射
 */
export const SHOP_ORDER_SHIPPING_STATUS_LABELS: Record<number, string> = {
  0: '未发货',
  1: '已发货',
  2: '已收货',
} as const;

/**
 * 预约状态文本映射（盲盒申购）
 */
export const RESERVATION_STATUS_LABELS: Record<number, string> = {
  0: '待撮合',
  1: '已撮合',
  2: '已退款',
} as const;

/**
 * 数字藏品状态文本映射
 */
export const COLLECTION_STATUS_LABELS: Record<number, string> = {
  0: '待铸造',
  1: '已铸造',
  2: '已转移',
} as const;

/**
 * 代理商审核状态文本映射
 */
export const AGENT_REVIEW_STATUS_LABELS: Record<number, string> = {
  [-1]: '未申请',
  0: '待审核',
  1: '已通过',
  2: '已拒绝',
} as const;

/**
 * 旧资产解锁状态文本映射
 */
export const OLD_ASSETS_UNLOCK_STATUS_LABELS: Record<number, string> = {
  0: '未解锁',
  1: '已解锁',
} as const;

// ============================================================================
// 支付方式映射
// ============================================================================

/**
 * 支付方式枚举
 */
export enum PayType {
  /** 余额支付 */
  BALANCE = 'balance',
  /** 支付宝 */
  ALIPAY = 'alipay',
  /** 微信支付 */
  WECHAT = 'wechat',
  /** 银行卡 */
  BANK_CARD = 'bank_card',
}

/**
 * 支付方式文本映射
 */
export const PAY_TYPE_LABELS: Record<string, string> = {
  [PayType.BALANCE]: '余额支付',
  [PayType.ALIPAY]: '支付宝',
  [PayType.WECHAT]: '微信支付',
  [PayType.BANK_CARD]: '银行卡',
  // 同时支持字符串键访问（向后兼容）
  balance: '余额支付',
  alipay: '支付宝',
  wechat: '微信支付',
  bank_card: '银行卡',
};

// ============================================================================
// 账户类型映射
// ============================================================================

/**
 * 支付账户类型枚举
 */
export enum PaymentAccountType {
  /** 银行卡 */
  BANK_CARD = 1,
  /** 支付宝 */
  ALIPAY = 2,
}

/**
 * 支付账户类型文本映射
 */
export const PAYMENT_ACCOUNT_TYPE_LABELS: Record<number, string> = {
  [PaymentAccountType.BANK_CARD]: '银行卡',
  [PaymentAccountType.ALIPAY]: '支付宝',
} as const;

// ============================================================================
// 用户类型映射
// ============================================================================

/**
 * 用户类型枚举
 */
export enum UserType {
  /** 普通用户 */
  NORMAL = 1,
  /** 代理商 */
  AGENT = 2,
}

/**
 * 用户类型文本映射
 */
export const USER_TYPE_LABELS: Record<number, string> = {
  [UserType.NORMAL]: '普通用户',
  [UserType.AGENT]: '代理商',
} as const;

// ============================================================================
// 业务类型映射（用于资金明细）
// ============================================================================

/**
 * 业务类型文本映射（用于资金明细）
 */
export const BIZ_TYPE_LABELS: Record<string, string> = {
  recharge: '充值',
  withdraw: '提现',
  payment: '支付',
  refund: '退款',
  reward: '奖励',
  exchange: '兑换',
  consignment: '寄售',
  consignment_sale: '寄售出售',
  consignment_fee: '寄售手续费',
  consignment_price: '寄售价格',
  service_fee: '服务费',
  service_fee_rate: '服务费率',
  delivery: '提货',
  sign_in: '签到奖励',
  invite: '邀请奖励',
  unlock_assets: '解锁资产',
} as const;

// ============================================================================
// 账户类型映射（用于资金明细）
// ============================================================================

/**
 * 账户类型文本映射（用于资金明细）
 */
export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  balance_available: '供应链专项金',
  withdrawable_money: '可调度收益',
  service_fee_balance: '确权金',
  green_power: '绿色算力',
  score: '消费金',
  pending_activation_gold: '待激活确权金',
  /** @deprecated 已废弃，兼容旧版本，实际对应 withdrawable_money */
  money: '可调度收益',
} as const;

// ============================================================================
// 通用工具函数
// ============================================================================

/**
 * 获取状态文本（通用函数）
 * @param status 状态值
 * @param labels 状态文本映射对象
 * @param defaultLabel 默认文本
 * @returns 状态文本
 */
export function getStatusLabel(
  status: number | string | undefined | null,
  labels: Record<number | string, string>,
  defaultLabel: string = '未知'
): string {
  if (status === undefined || status === null) {
    return defaultLabel;
  }
  return labels[status] || defaultLabel;
}

/**
 * 获取支付方式文本
 * @param payType 支付方式
 * @returns 支付方式文本
 */
export function getPayTypeLabel(payType: string | undefined | null): string {
  return getStatusLabel(payType, PAY_TYPE_LABELS, '未知支付方式');
}

/**
 * 获取账户类型文本
 * @param accountType 账户类型
 * @returns 账户类型文本
 */
export function getAccountTypeLabel(accountType: string | undefined | null): string {
  return getStatusLabel(accountType, ACCOUNT_TYPE_LABELS, '未知账户');
}

/**
 * 获取业务类型文本
 * @param bizType 业务类型
 * @returns 业务类型文本
 */
export function getBizTypeLabel(bizType: string | undefined | null): string {
  return getStatusLabel(bizType, BIZ_TYPE_LABELS, '未知业务');
}

// ============================================================================
// 默认导出（包含所有映射）
// ============================================================================

/**
 * 统一的映射字典对象
 * 包含所有前后端共用的映射关系
 */
export const ApiMappings = {
  // API 响应码
  ApiResponseCode,
  API_RESPONSE_CODE_LABELS,
  isApiSuccess, // 注意：判断完整响应请使用 utils/apiHelpers.isSuccess
  
  // 状态文本映射
  REAL_NAME_STATUS_LABELS,
  CONSIGNMENT_STATUS_LABELS,
  DELIVERY_STATUS_LABELS,
  RECHARGE_ORDER_STATUS_LABELS,
  WITHDRAW_ORDER_STATUS_LABELS,
  SHOP_ORDER_PAY_STATUS_LABELS,
  SHOP_ORDER_SHIPPING_STATUS_LABELS,
  RESERVATION_STATUS_LABELS,
  COLLECTION_STATUS_LABELS,
  AGENT_REVIEW_STATUS_LABELS,
  OLD_ASSETS_UNLOCK_STATUS_LABELS,
  
  // 支付方式
  PayType,
  PAY_TYPE_LABELS,
  
  // 账户类型
  PaymentAccountType,
  PAYMENT_ACCOUNT_TYPE_LABELS,
  
  // 用户类型
  UserType,
  USER_TYPE_LABELS,
  
  // 业务类型
  BIZ_TYPE_LABELS,
  ACCOUNT_TYPE_LABELS,
  
  // 工具函数
  getStatusLabel,
  getPayTypeLabel,
  getAccountTypeLabel,
  getBizTypeLabel,
} as const;

export default ApiMappings;

