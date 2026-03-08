import { createApiHeaders } from '../core/headers';
import { http } from '../http';

export interface AnnouncementItem {
  content: string;
  id: string;
  isPinned: boolean;
  summary: string;
  time: string;
  title: string;
}

/** 滚动公告列表项 */
export interface ScrollAnnouncementItem {
  /** 公告 ID */
  id: number;
  /** 公告标题 */
  title: string;
  /** 公告类型 */
  type: string;
  /** 是否已读（已登录时返回，未登录为 false） */
  is_read: boolean;
}

/** 滚动公告列表响应 */
export interface ScrollAnnouncementResponse {
  list: ScrollAnnouncementItem[];
}

/** 弹出公告列表项 */
export interface PopupAnnouncementItem {
  id: number;
  title: string;
  content: string;
  type: string;
  popup_delay: number;
  is_read: boolean;
}

/** 弹出公告列表响应 */
export interface PopupAnnouncementResponse {
  list: PopupAnnouncementItem[];
}

export const announcementApi = {
  /**
   * 获取公告列表（使用滚动公告接口）
   * GET /api/Announcement/scroll
   */
  async list(signal?: AbortSignal) {
    const response = await http.get<ScrollAnnouncementResponse>(
      '/api/Announcement/scroll',
      {
        headers: createApiHeaders(),
        signal,
      },
    );
    // 适配为 AnnouncementItem 格式
    const items: AnnouncementItem[] = (response?.list ?? []).map((item) => ({
      id: String(item.id),
      title: item.title,
      content: item.title,
      isPinned: false,
      summary: item.type || '',
      time: '',
    }));
    return items;
  },

  /**
   * 获取滚动公告列表
   * GET /api/Announcement/scroll
   */
  async getScrollList(signal?: AbortSignal) {
    const response = await http.get<ScrollAnnouncementResponse>(
      '/api/Announcement/scroll',
      {
        headers: createApiHeaders(),
        signal,
      },
    );
    return response;
  },

  /**
   * 获取弹出公告列表
   * GET /api/Announcement/popup
   */
  async getPopupList(signal?: AbortSignal) {
    const response = await http.get<PopupAnnouncementResponse>(
      '/api/Announcement/popup',
      {
        headers: createApiHeaders(),
        signal,
      },
    );
    return response;
  },
};
