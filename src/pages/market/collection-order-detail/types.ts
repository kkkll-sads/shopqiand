import { CollectionOrderDetailData } from '@/services/collection/my-collection';

export interface OrderStepItem {
  key: string;
  label: string;
  time?: number;
  active: boolean;
}

export type OrderActionType = 'matching' | 'pay' | 'ship' | 'receive';

export const buildOrderSteps = (order: CollectionOrderDetailData): OrderStepItem[] => [
  { key: 'created', label: '订单创建', time: order.create_time, active: true },
  {
    key: 'paid',
    label: '支付成功',
    time: order.pay_time,
    active: (order.pay_time || 0) > 0,
  },
  {
    key: 'completed',
    label: '交易完成',
    time: order.complete_time,
    active: (order.complete_time || 0) > 0,
  },
];

export const resolveOrderAction = (statusText: string): OrderActionType | null => {
  const statusLower = (statusText || '').toLowerCase();

  if (
    statusLower.includes('寄售中') ||
    statusLower.includes('撮合中') ||
    statusLower.includes('匹配中')
  ) {
    return 'matching';
  }
  if (statusLower.includes('待支付')) {
    return 'pay';
  }
  if (statusLower.includes('待发货')) {
    return 'ship';
  }
  if (statusLower.includes('待收货')) {
    return 'receive';
  }

  return null;
};

export const getOrderActionLabel = (action: OrderActionType): string => {
  switch (action) {
    case 'matching':
      return '撮合中';
    case 'pay':
      return '立即支付';
    case 'ship':
      return '查看发货';
    case 'receive':
      return '确认收货';
    default:
      return '';
  }
};
