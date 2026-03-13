import { createApiHeaders } from '../core/headers';
import { http } from '../http';

interface AnnouncementRecordRaw {
  id?: number | string;
  title?: string;
  content?: string;
  type?: string;
  type_text?: string;
  sort?: number | string;
  is_read?: boolean | number | string;
  createtime?: number | string;
  updatetime?: number | string;
}

interface AnnouncementListResponseRaw {
  list?: AnnouncementRecordRaw[];
}

interface AnnouncementDetailResponseRaw {
  announcement?: AnnouncementRecordRaw;
}

export interface AnnouncementItem {
  content: string;
  id: string;
  isPinned: boolean;
  isRead: boolean;
  sortOrder: number;
  summary: string;
  time: string;
  timestamp: number;
  title: string;
  type: string;
  typeText: string;
}

export interface ScrollAnnouncementItem {
  id: number;
  title: string;
  type: string;
  is_read: boolean;
}

export interface ScrollAnnouncementResponse {
  list: ScrollAnnouncementItem[];
}

export interface PopupAnnouncementItem {
  id: number;
  title: string;
  content: string;
  type: string;
  popup_delay: number;
  is_read: boolean;
}

export interface PopupAnnouncementResponse {
  list: PopupAnnouncementItem[];
}

function readNumber(value: unknown, fallback = 0): number {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : fallback;
}

function readString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback;
}

function readBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  if (typeof value === 'string') {
    const normalizedValue = value.trim().toLowerCase();
    if (normalizedValue === '1' || normalizedValue === 'true') {
      return true;
    }
    if (normalizedValue === '0' || normalizedValue === 'false') {
      return false;
    }
  }

  return fallback;
}

function readTimestamp(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value < 10000000000 ? value * 1000 : value;
  }

  if (typeof value === 'string') {
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      return 0;
    }

    const numericValue = Number(trimmedValue);
    if (Number.isFinite(numericValue)) {
      return numericValue < 10000000000 ? numericValue * 1000 : numericValue;
    }

    const parsedValue = Date.parse(trimmedValue.replace(/-/g, '/'));
    return Number.isFinite(parsedValue) ? parsedValue : 0;
  }

  return 0;
}

function formatTimestamp(value: unknown): string {
  const timestamp = readTimestamp(value);
  if (!timestamp) {
    return readString(value);
  }

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return readString(value);
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function stripHtml(value: string): string {
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|tr|section|article|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function resolveTypeText(type: string, typeText: string): string {
  if (typeText) {
    return typeText;
  }

  if (type === 'important') {
    return '平台动态';
  }

  return '平台公告';
}

function normalizeAnnouncement(item: AnnouncementRecordRaw): AnnouncementItem {
  const content = readString(item.content);
  const timestamp = readTimestamp(item.createtime) || readTimestamp(item.updatetime);
  const type = readString(item.type, 'normal');
  const typeText = resolveTypeText(type, readString(item.type_text));
  const sortOrder = readNumber(item.sort);
  const summary = stripHtml(content);

  return {
    content,
    id: String(readNumber(item.id)),
    isPinned: sortOrder > 0,
    isRead: readBoolean(item.is_read),
    sortOrder,
    summary: summary || typeText,
    time: formatTimestamp(item.createtime || item.updatetime),
    timestamp,
    title: readString(item.title),
    type,
    typeText,
  };
}

export const announcementApi = {
  async list(signal?: AbortSignal): Promise<AnnouncementItem[]> {
    const response = await http.get<AnnouncementListResponseRaw>('/api/Announcement/index', {
      headers: createApiHeaders(),
      query: {
        limit: 100,
        page: 1,
        type: 'normal',
      },
      signal,
    });

    return Array.isArray(response?.list) ? response.list.map(normalizeAnnouncement) : [];
  },

  async detail(id: string | number, signal?: AbortSignal): Promise<AnnouncementItem> {
    const response = await http.get<AnnouncementDetailResponseRaw>('/api/Announcement/detail', {
      headers: createApiHeaders(),
      query: { id },
      signal,
    });

    if (!response?.announcement) {
      throw new Error('公告不存在或已删除');
    }

    return normalizeAnnouncement(response.announcement);
  },

  async getScrollList(signal?: AbortSignal) {
    return http.get<ScrollAnnouncementResponse>('/api/Announcement/scroll', {
      headers: createApiHeaders(),
      signal,
    });
  },

  async getPopupList(signal?: AbortSignal) {
    return http.get<PopupAnnouncementResponse>('/api/Announcement/popup', {
      headers: createApiHeaders(),
      signal,
    });
  },
};
