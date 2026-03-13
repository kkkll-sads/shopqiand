import { http } from '../http';

export type MessageCategory = 'system' | 'order' | 'activity' | 'finance';
export type MessageTab = MessageCategory;
export type MessageScope = 'all' | 'unread';
export type MessageType =
  | 'system'
  | 'order'
  | 'activity'
  | 'notice'
  | 'recharge'
  | 'withdraw'
  | 'shop_order';

export interface MessageItem {
  id: string;
  messageKey: string;
  sourceType: string;
  sourceId: number;
  category: MessageCategory;
  type: MessageType;
  scene: string;
  title: string;
  content: string;
  actionPath: string;
  bizType: string;
  bizId: number;
  isBroadcast: boolean;
  isRead: boolean;
  createTime: string;
  timestamp: number;
}

export interface MessageSummary {
  system: number;
  order: number;
  activity: number;
  finance: number;
  total: number;
}

export interface MessageListResponse {
  list: MessageItem[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  summary: MessageSummary;
}

export type MessageDetailResponse = MessageItem;

export interface MarkReadResult {
  count: number;
  summary: MessageSummary;
}

interface RawMessageItem {
  id?: string;
  message_key?: string;
  source_type?: string;
  source_id?: number | string;
  category?: string;
  type?: string;
  scene?: string;
  title?: string;
  content?: string;
  action_path?: string;
  biz_type?: string;
  biz_id?: number | string;
  is_broadcast?: boolean | number;
  is_read?: boolean | number;
  create_time?: number | string;
  create_time_text?: string;
}

interface RawMessageListResponse {
  list?: RawMessageItem[];
  total?: number | string;
  page?: number | string;
  limit?: number | string;
  has_more?: boolean;
  summary?: Partial<MessageSummary>;
}

interface RawMarkReadResult {
  count?: number | string;
  summary?: Partial<MessageSummary>;
}

const EMPTY_SUMMARY: MessageSummary = {
  system: 0,
  order: 0,
  activity: 0,
  finance: 0,
  total: 0,
};

function toNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function toBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  return value === 1 || value === '1';
}

function normalizeCategory(value: string | undefined): MessageCategory {
  if (value === 'system' || value === 'order' || value === 'activity' || value === 'finance') {
    return value;
  }

  return 'system';
}

function normalizeType(value: string | undefined, fallback: MessageCategory): MessageType {
  if (
    value === 'system' ||
    value === 'order' ||
    value === 'activity' ||
    value === 'notice' ||
    value === 'recharge' ||
    value === 'withdraw' ||
    value === 'shop_order'
  ) {
    return value;
  }

  if (fallback === 'finance') {
    return 'system';
  }

  return fallback;
}

function normalizeSummary(summary?: Partial<MessageSummary>): MessageSummary {
  return {
    system: toNumber(summary?.system),
    order: toNumber(summary?.order),
    activity: toNumber(summary?.activity),
    finance: toNumber(summary?.finance),
    total: toNumber(summary?.total),
  };
}

function normalizeMessage(raw: RawMessageItem): MessageItem {
  const category = normalizeCategory(raw.category);
  const messageKey = String(raw.message_key || raw.id || '').trim();
  const timestamp = toNumber(raw.create_time);

  return {
    id: messageKey,
    messageKey,
    sourceType: String(raw.source_type || '').trim(),
    sourceId: toNumber(raw.source_id),
    category,
    type: normalizeType(raw.type, category),
    scene: String(raw.scene || '').trim(),
    title: String(raw.title || '').trim(),
    content: String(raw.content || '').trim(),
    actionPath: String(raw.action_path || '').trim(),
    bizType: String(raw.biz_type || '').trim(),
    bizId: toNumber(raw.biz_id),
    isBroadcast: toBoolean(raw.is_broadcast),
    isRead: toBoolean(raw.is_read),
    createTime: String(raw.create_time_text || '').trim(),
    timestamp,
  };
}

function normalizeListResponse(raw: RawMessageListResponse): MessageListResponse {
  return {
    list: Array.isArray(raw.list) ? raw.list.map(normalizeMessage) : [],
    total: toNumber(raw.total),
    page: Math.max(1, toNumber(raw.page) || 1),
    limit: Math.max(1, toNumber(raw.limit) || 20),
    hasMore: Boolean(raw.has_more),
    summary: normalizeSummary(raw.summary),
  };
}

function normalizeMarkReadResult(raw: RawMarkReadResult | undefined): MarkReadResult {
  return {
    count: toNumber(raw?.count),
    summary: raw?.summary ? normalizeSummary(raw.summary) : EMPTY_SUMMARY,
  };
}

export const messageApi = {
  list(
    params: {
      category?: MessageCategory;
      scope?: MessageScope;
      page?: number;
      limit?: number;
    } = {},
    signal?: AbortSignal,
  ) {
    return http.get<RawMessageListResponse>('/api/messageCenter/list', {
      query: {
        ...(params.category && { category: params.category }),
        ...(params.scope && { scope: params.scope }),
        page: params.page ?? 1,
        limit: params.limit ?? 20,
      },
      signal,
    }).then(normalizeListResponse);
  },

  detail(messageKey: string, signal?: AbortSignal) {
    return http.get<RawMessageItem>('/api/messageCenter/detail', {
      query: { message_key: messageKey },
      signal,
    }).then(normalizeMessage);
  },

  unreadCount(signal?: AbortSignal) {
    return http.get<Partial<MessageSummary>>('/api/messageCenter/unreadCount', {
      signal,
    }).then(normalizeSummary);
  },

  markRead(
    params: { messageKey?: string; category?: MessageCategory } = {},
    signal?: AbortSignal,
  ) {
    return http.post<RawMarkReadResult, Record<string, string>>(
      '/api/messageCenter/markRead',
      {
        ...(params.messageKey ? { message_key: params.messageKey } : {}),
        ...(params.category ? { category: params.category } : {}),
      },
      { signal },
    ).then(normalizeMarkReadResult);
  },
};
