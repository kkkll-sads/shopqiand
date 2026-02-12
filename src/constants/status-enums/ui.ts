import { ConsignmentStatus } from './collection'
import { RechargeOrderStatus, WithdrawOrderStatus } from './order'

/**
 * 工具方法
 */
export function getStatusText<T extends string | number>(
  map: Record<T, string>,
  value: T,
  defaultValue: string = '未知',
): string {
  return map[value] ?? defaultValue
}

/**
 * 状态UI配置类型
 */
export interface OrderStatusUIConfig {
  text: string
  color: string
  bgColor: string
  iconName: 'clock' | 'check-circle' | 'x-circle' | 'alert-triangle'
}

/**
 * 充值订单状态UI配置
 */
export function getRechargeOrderStatusConfig(status: number): OrderStatusUIConfig {
  const configs: Record<number, OrderStatusUIConfig> = {
    [RechargeOrderStatus.PENDING]: {
      text: '待审核',
      color: 'text-orange-600',
      bgColor: 'bg-gradient-to-r from-orange-400 to-orange-500',
      iconName: 'clock',
    },
    [RechargeOrderStatus.APPROVED]: {
      text: '已通过',
      color: 'text-green-600',
      bgColor: 'bg-gradient-to-r from-green-400 to-green-500',
      iconName: 'check-circle',
    },
    [RechargeOrderStatus.REJECTED]: {
      text: '已拒绝',
      color: 'text-red-600',
      bgColor: 'bg-gradient-to-r from-red-400 to-red-500',
      iconName: 'x-circle',
    },
  }
  return configs[status] ?? configs[RechargeOrderStatus.PENDING]
}

/**
 * 提现订单状态UI配置
 */
export function getWithdrawOrderStatusConfig(status: number): OrderStatusUIConfig {
  const configs: Record<number, OrderStatusUIConfig> = {
    [WithdrawOrderStatus.PENDING]: {
      text: '待审核',
      color: 'text-orange-600',
      bgColor: 'bg-gradient-to-r from-orange-400 to-orange-500',
      iconName: 'clock',
    },
    [WithdrawOrderStatus.APPROVED]: {
      text: '已通过',
      color: 'text-green-600',
      bgColor: 'bg-gradient-to-r from-green-400 to-green-500',
      iconName: 'check-circle',
    },
    [WithdrawOrderStatus.REJECTED]: {
      text: '已拒绝',
      color: 'text-red-600',
      bgColor: 'bg-gradient-to-r from-red-400 to-red-500',
      iconName: 'x-circle',
    },
    3: {
      text: '已打款',
      color: 'text-blue-600',
      bgColor: 'bg-gradient-to-r from-blue-400 to-blue-500',
      iconName: 'check-circle',
    },
    4: {
      text: '打款失败',
      color: 'text-gray-600',
      bgColor: 'bg-gradient-to-r from-gray-400 to-gray-500',
      iconName: 'alert-triangle',
    },
  }
  return configs[status] ?? configs[WithdrawOrderStatus.PENDING]
}

/**
 * 列表项状态颜色（用于订单列表等场景）
 */
export function getOrderListStatusColor(status: number, type: 'recharge' | 'withdraw' = 'recharge'): string {
  if (status === 1) return 'text-green-600 bg-green-50 border-green-100'
  if (status === 2) return 'text-red-600 bg-red-50 border-red-100'
  if (type === 'withdraw' && status === 3) return 'text-blue-600 bg-blue-50 border-blue-100'
  if (type === 'withdraw' && status === 4) return 'text-gray-600 bg-gray-50 border-gray-100'
  return 'text-orange-600 bg-orange-50 border-orange-100'
}

/**
 * 藏品寄售状态UI配置
 */
export function getConsignmentStatusUIConfig(consignmentStatus: number): {
  text: string
  gradient: string
  bg: string
  border: string
  textColor: string
} {
  if (consignmentStatus === ConsignmentStatus.SOLD) {
    return {
      text: '已售出',
      gradient: 'from-emerald-500 to-green-500',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      textColor: 'text-emerald-600',
    }
  }

  if (consignmentStatus === ConsignmentStatus.SELLING) {
    return {
      text: '寄售中',
      gradient: 'from-amber-500 to-red-500',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      textColor: 'text-amber-600',
    }
  }

  return {
    text: '持有中',
    gradient: 'from-gray-400 to-gray-500',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    textColor: 'text-gray-600',
  }
}
