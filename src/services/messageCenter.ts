import { authedFetch } from './client';
import type { ApiResponse } from './networking';

const MESSAGE_CENTER_ENDPOINTS = {
  list: '/messageCenter/list',
  detail: '/messageCenter/detail',
  markRead: '/messageCenter/markRead',
  unreadCount: '/messageCenter/unreadCount',
} as const;

export type MessageCenterCategory = 'system' | 'order' | 'activity' | 'finance';
export type MessageCenterScope = 'all' | 'unread';
export type MessageCenterType =
  | 'system'
  | 'order'
  | 'activity'
  | 'notice'
  | 'recharge'
  | 'withdraw'
  | 'shop_order';

export interface MessageCenterSummary {
  system: number;
  order: number;
  activity: number;
  finance: number;
  total: number;
}

export interface MessageCenterApiItem {
  id: string;
  message_key: string;
  source_type: string;
  source_id: number;
  category: MessageCenterCategory;
  type: MessageCenterType;
  scene: string;
  title: string;
  content: string;
  action_path: string;
  biz_type: string;
  biz_id: number;
  is_broadcast: number;
  is_read: boolean;
  create_time: number;
  create_time_text: string;
  sort_time: number;
}

export interface MessageCenterListData {
  list: MessageCenterApiItem[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
  summary: MessageCenterSummary;
}

export async function fetchMessageCenterList(params: {
  page?: number;
  limit?: number;
  scope?: MessageCenterScope;
  category?: MessageCenterCategory;
  token?: string;
} = {}): Promise<ApiResponse<MessageCenterListData>> {
  const search = new URLSearchParams();
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  if (params.scope) search.set('scope', params.scope);
  if (params.category) search.set('category', params.category);

  const path = `${MESSAGE_CENTER_ENDPOINTS.list}?${search.toString()}`;
  return authedFetch<MessageCenterListData>(path, {
    method: 'GET',
    token: params.token,
  });
}

export async function fetchMessageCenterDetail(
  messageKey: string,
  token?: string
): Promise<ApiResponse<MessageCenterApiItem>> {
  const search = new URLSearchParams({ message_key: messageKey });

  return authedFetch<MessageCenterApiItem>(
    `${MESSAGE_CENTER_ENDPOINTS.detail}?${search.toString()}`,
    {
      method: 'GET',
      token,
    }
  );
}

export async function markMessageCenterRead(params: {
  messageKey?: string;
  category?: MessageCenterCategory;
  token?: string;
} = {}): Promise<ApiResponse<{ count: number; summary: MessageCenterSummary }>> {
  const payload = new FormData();
  if (params.messageKey) {
    payload.append('message_key', params.messageKey);
  }
  if (params.category) {
    payload.append('category', params.category);
  }

  return authedFetch<{ count: number; summary: MessageCenterSummary }>(MESSAGE_CENTER_ENDPOINTS.markRead, {
    method: 'POST',
    body: payload,
    token: params.token,
  });
}

export async function fetchMessageCenterUnreadCount(
  token?: string
): Promise<ApiResponse<MessageCenterSummary>> {
  return authedFetch<MessageCenterSummary>(MESSAGE_CENTER_ENDPOINTS.unreadCount, {
    method: 'GET',
    token,
  });
}
