/**
 * @file 预约申购工具函数
 * @description 格式化预约记录的状态、时间等显示逻辑。
 */

import type { ReservationItem } from '../../api';

/** 状态配置（颜色 + 文案） */
const STATUS_CONFIG: Record<number, { text: string; bg: string; color: string }> = {
  0: { text: '待撮合', bg: 'bg-orange-50 dark:bg-orange-900/20', color: 'text-orange-600 dark:text-orange-400' },
  1: { text: '已撮合', bg: 'bg-green-50 dark:bg-green-900/20', color: 'text-green-600 dark:text-green-400' },
  2: { text: '已退款', bg: 'bg-gray-100 dark:bg-gray-800', color: 'text-gray-500 dark:text-gray-400' },
};

/** 获取状态样式配置 */
export function getReservationStatusConfig(status: number) {
  return STATUS_CONFIG[status] ?? { text: `状态${status}`, bg: 'bg-gray-100', color: 'text-gray-500' };
}

export function formatReservationTime(item: ReservationItem): string {
  if (item.create_time) {
    if (typeof item.create_time === 'string') {
      return item.create_time;
    }
  }

  // Fallback
  return '--';
}

/** 格式化金额 */
export function formatReservationAmount(value: number | undefined | null): string {
  if (value == null || !Number.isFinite(value)) return '--';
  return `¥${value}`;
}
