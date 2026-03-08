export type OrderType = 'mall' | 'collectible';

export interface SelectedOrder {
  /** buy = 买入订单详情（id 为 order_id）; sell = 卖出订单详情（id 为 consignment_id） */
  type: 'buy' | 'sell';
  id: number;
}
