import { http } from '../http';

export type MessageCategory = 'system' | 'order' | 'activity';

/** 保留旧别名兼容 */
export type MessageTab = MessageCategory;

export interface MessageItem {
  id: number;
  category: MessageCategory;
  category_text: string;
  title: string;
  content: string;
  biz_type: string;
  biz_id: number;
  is_read: 0 | 1;
  create_time: string;
}

export interface MessageListResponse {
  list: MessageItem[];
  total: number;
  page: number;
  limit: number;
}

export interface MessageDetailResponse {
  id: number;
  category: string;
  category_text: string;
  title: string;
  content: string;
  biz_type: string;
  biz_id: number;
  is_read: 0 | 1;
  create_time: string;
}

export interface UnreadCountResponse {
  total: number;
  system: number;
  order: number;
  activity: number;
}

export interface MarkReadResult {
  count?: number;
}

export const messageApi = {
  list(
    params: { category?: MessageCategory; page?: number; limit?: number } = {},
    signal?: AbortSignal,
  ) {
    return http.get<MessageListResponse>('/api/messageCenter/list', {
      query: {
        ...(params.category && { category: params.category }),
        page: params.page ?? 1,
        limit: params.limit ?? 20,
      },
      signal,
    });
  },

  detail(id: number, signal?: AbortSignal) {
    return http.get<MessageDetailResponse>('/api/messageCenter/detail', {
      query: { id },
      signal,
    });
  },

  unreadCount(signal?: AbortSignal) {
    return http.get<UnreadCountResponse>('/api/messageCenter/unreadCount', { signal });
  },

  markRead(params: { id?: number; category?: MessageCategory } = {}, signal?: AbortSignal) {
    return http.post<MarkReadResult, typeof params>(
      '/api/messageCenter/markRead',
      params,
      { signal },
    );
  },
};
