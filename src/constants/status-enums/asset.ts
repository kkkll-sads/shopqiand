/**
 * 寄售券/资产包/豁免/结算相关状态
 */

/**
 * 寄售券状态
 * ba_user_consignment_coupon.status
 */
export enum CouponStatus {
  USED = 0,
  AVAILABLE = 1,
  EXPIRED = 2,
}

export const CouponStatusMap: Record<CouponStatus, string> = {
  [CouponStatus.USED]: '已使用',
  [CouponStatus.AVAILABLE]: '可用',
  [CouponStatus.EXPIRED]: '已过期',
}

/**
 * 资产包状态
 * ba_asset_package.status
 */
export enum AssetPackageStatus {
  DISABLED = 0,
  ENABLED = 1,
}

export const AssetPackageStatusMap: Record<AssetPackageStatus, string> = {
  [AssetPackageStatus.DISABLED]: '关闭',
  [AssetPackageStatus.ENABLED]: '开启',
}

/**
 * 寄售券豁免类型
 * ba_collection_consignment.waive_type
 */
export enum WaiveType {
  NONE = 'none',
  SYSTEM_RESEND = 'system_resend',
  FREE_ATTEMPT = 'free_attempt',
}

export const WaiveTypeMap: Record<WaiveType, string> = {
  [WaiveType.NONE]: '正常扣券',
  [WaiveType.SYSTEM_RESEND]: '系统重发',
  [WaiveType.FREE_ATTEMPT]: '免费次数',
}

/**
 * 寄售结算状态
 * ba_collection_consignment.settle_status
 */
export enum SettleStatus {
  UNSETTLED = 0,
  SETTLED = 1,
}

export const SettleStatusMap: Record<SettleStatus, string> = {
  [SettleStatus.UNSETTLED]: '未结算',
  [SettleStatus.SETTLED]: '已结算',
}
