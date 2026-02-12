/**
 * 藏品相关状态
 */

/**
 * 藏品商品上架状态
 * ba_collection_item.status
 */
export enum ItemStatus {
  OFFLINE = '0',
  ONLINE = '1',
}

export const ItemStatusMap: Record<ItemStatus, string> = {
  [ItemStatus.OFFLINE]: '下架',
  [ItemStatus.ONLINE]: '上架',
}

/**
 * 用户藏品寄售状态
 * ba_user_collection.consignment_status
 */
export enum ConsignmentStatus {
  NONE = 0,
  SELLING = 1,
  SOLD = 2,
  FAILED = 3,
  // 旧名称别名（向后兼容）
  NOT_CONSIGNED = 0,
  PENDING = 1,
  CONSIGNING = 1,
  REJECTED = 3,
}

export const ConsignmentStatusMap: Record<ConsignmentStatus, string> = {
  [ConsignmentStatus.NONE]: '未寄售',
  [ConsignmentStatus.SELLING]: '寄售中',
  [ConsignmentStatus.SOLD]: '已售出',
  [ConsignmentStatus.FAILED]: '寄售失败',
}

/**
 * 寄售记录状态
 * ba_collection_consignment.status
 */
export enum ConsignmentRecordStatus {
  CANCELLED = 0,
  SELLING = 1,
  SOLD = 2,
  OFF_SHELF = 3,
}

export const ConsignmentRecordStatusMap: Record<ConsignmentRecordStatus, string> = {
  [ConsignmentRecordStatus.CANCELLED]: '已取消',
  [ConsignmentRecordStatus.SELLING]: '寄售中',
  [ConsignmentRecordStatus.SOLD]: '已售出',
  [ConsignmentRecordStatus.OFF_SHELF]: '流拍失败',
}

/**
 * 用户藏品共识验证节点状态
 * ba_user_collection.mining_status
 */
export enum MiningStatus {
  NORMAL = 0,
  MINING = 1,
}

export const MiningStatusMap: Record<MiningStatus, string> = {
  [MiningStatus.NORMAL]: '正常',
  [MiningStatus.MINING]: '共识验证节点',
}

/**
 * 用户藏品提货状态
 * ba_user_collection.delivery_status
 */
export enum DeliveryStatus {
  NOT_DELIVERED = 0,
  DELIVERED = 1,
}

export const DeliveryStatusMap: Record<DeliveryStatus, string> = {
  [DeliveryStatus.NOT_DELIVERED]: '未提货',
  [DeliveryStatus.DELIVERED]: '已提货',
}
