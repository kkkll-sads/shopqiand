/**
 * 用户相关状态
 */

/**
 * 实名认证状态
 * ba_user.real_name_status
 */
export enum RealNameStatus {
  NONE = 0,
  PENDING = 1,
  APPROVED = 2,
  REJECTED = 3,
}

export const RealNameStatusMap: Record<RealNameStatus, string> = {
  [RealNameStatus.NONE]: '未实名',
  [RealNameStatus.PENDING]: '待审核',
  [RealNameStatus.APPROVED]: '已通过',
  [RealNameStatus.REJECTED]: '已拒绝',
}

/**
 * 用户状态
 * ba_user.status
 */
export enum UserStatus {
  DISABLE = 'disable',
  ENABLE = 'enable',
}

export const UserStatusMap: Record<UserStatus, string> = {
  [UserStatus.DISABLE]: '禁用',
  [UserStatus.ENABLE]: '启用',
}
