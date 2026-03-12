import {
  fetchMessageCenterList,
  type MessageCenterApiItem,
  type MessageCenterListData,
  type MessageCenterSummary,
} from '@/services';
import { extractData } from '@/utils/apiHelpers';
import { messageIconMap, type MessageItem } from './types';

function resolveMessageStyle(item: MessageCenterApiItem): Pick<MessageItem, 'icon' | 'color' | 'bgColor'> {
  if (item.type === 'notice') {
    return {
      icon: messageIconMap.AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    };
  }

  if (item.type === 'activity') {
    return {
      icon: messageIconMap.Info,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    };
  }

  if (item.type === 'recharge') {
    return {
      icon: messageIconMap.Wallet,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    };
  }

  if (item.type === 'withdraw') {
    return {
      icon: messageIconMap.Receipt,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    };
  }

  if (item.type === 'shop_order') {
    if (item.scene === 'pending_ship') {
      return {
        icon: messageIconMap.CheckCircle,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
      };
    }

    if (item.scene === 'pending_confirm') {
      return {
        icon: messageIconMap.Truck,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
      };
    }

    return {
      icon: messageIconMap.Package,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    };
  }

  if (item.type === 'order') {
    return {
      icon: messageIconMap.Package,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    };
  }

  return {
    icon: messageIconMap.Info,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
  };
}

function resolveMessageTitle(item: MessageCenterApiItem): string {
  if (item.source_type === 'manual' && item.title) {
    return item.title;
  }

  if (item.type === 'notice') {
    return '平台公告';
  }

  if (item.type === 'activity') {
    return item.scene === 'dynamic' ? '平台动态' : '活动消息';
  }

  if (item.type === 'recharge') {
    return '充值通知';
  }

  if (item.type === 'withdraw') {
    return '提现通知';
  }

  if (item.type === 'shop_order') {
    return item.scene === 'pending_pay' ? '订单提醒' : '订单通知';
  }

  if (item.type === 'order') {
    return '订单消息';
  }

  if (item.type === 'system') {
    return '系统消息';
  }

  return item.title || '消息通知';
}

export function mapMessageCenterItem(item: MessageCenterApiItem): MessageItem {
  const style = resolveMessageStyle(item);

  return {
    id: item.message_key || item.id,
    type: item.type,
    title: resolveMessageTitle(item),
    content: item.content || '',
    time: item.create_time_text || '',
    timestamp: (item.sort_time || item.create_time || 0) * 1000,
    isRead: Boolean(item.is_read),
    icon: style.icon,
    color: style.color,
    bgColor: style.bgColor,
    scene: item.scene,
    actionPath: item.action_path,
    sourceType: item.source_type,
    sourceId: item.source_id,
  };
}

export interface MessageBatchResult {
  list: MessageItem[];
  total: number;
  hasMore: boolean;
  summary: MessageCenterSummary;
}

export async function loadMessagesBatch(params: {
  pageNum: number;
  scope: 'all' | 'unread';
}): Promise<MessageBatchResult> {
  const response = await fetchMessageCenterList({
    page: params.pageNum,
    limit: 10,
    scope: params.scope,
  });

  const data = (extractData(response) as MessageCenterListData | null) ?? null;
  if (!data) {
    throw new Error(response.msg || response.message || '获取消息失败');
  }

  return {
    list: (data.list || []).map(mapMessageCenterItem),
    total: data.total || 0,
    hasMore: Boolean(data.has_more),
    summary: data.summary || {
      system: 0,
      order: 0,
      activity: 0,
      finance: 0,
      total: 0,
    },
  };
}
