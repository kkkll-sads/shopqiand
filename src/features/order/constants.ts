import type { OrderType } from './types';

export const ORDER_TABS: Record<OrderType, string[]> = {
  mall: ['全部', '待付款', '待发货', '待收货', '已完成'],
  collectible: ['买入订单', '卖出订单'],
};

/** 商城订单 Tab 文案 -> 接口 status 参数（不传或 全部 表示全部） */
export const MALL_TAB_TO_STATUS: Record<string, string> = {
  '全部': '',
  '待付款': 'unpaid',
  '待发货': 'pending_ship',
  '待收货': 'pending_receive',
  '已完成': 'completed',
};
