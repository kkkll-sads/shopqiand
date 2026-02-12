/**
 * 撮合/预约/场次相关状态
 */

/**
 * 撮合池状态
 * ba_collection_matching_pool.status
 */
export enum MatchingStatus {
  PENDING = 'pending',
  MATCHED = 'matched',
  CANCELLED = 'cancelled',
}

export const MatchingStatusMap: Record<MatchingStatus, string> = {
  [MatchingStatus.PENDING]: '待撮合',
  [MatchingStatus.MATCHED]: '已撮合',
  [MatchingStatus.CANCELLED]: '已取消',
}

/**
 * 盲盒预约状态
 * ba_trade_reservations.status
 */
export enum ReservationStatus {
  PENDING = 0,
  MATCHED = 1,
  FAILED = 2,
  CANCELLED = 3,
  // 旧名称别名（向后兼容）
  APPROVED = 1,
  REFUNDED = 2,
}

export const ReservationStatusMap: Record<ReservationStatus, string> = {
  [ReservationStatus.PENDING]: '待撮合',
  [ReservationStatus.MATCHED]: '已中签',
  [ReservationStatus.FAILED]: '未中签',
  [ReservationStatus.CANCELLED]: '已取消',
}

/**
 * 场次状态
 * ba_collection_session.status
 */
export enum SessionStatus {
  OFFLINE = '0',
  ONLINE = '1',
}

export const SessionStatusMap: Record<SessionStatus, string> = {
  [SessionStatus.OFFLINE]: '下架',
  [SessionStatus.ONLINE]: '上架',
}
