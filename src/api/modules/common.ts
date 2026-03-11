import { createApiHeaders } from '../core/headers';
import { http } from '../http';

export type CommonPageType = 'user_agreement' | 'privacy_policy' | 'about_us';

export interface CommonPageData {
  title?: string;
  content?: unknown;
  update_time?: string;
}

interface ChatConfigResponse {
  channel_id?: string | number | null;
  chat_url?: string | null;
  chat_backup_url?: string | null;
  widget_script_url?: string | null;
}

export interface ChatConfigData {
  channelId: string;
  chatUrl: string;
  backupUrl: string;
}

function normalizeChatConfig(data: ChatConfigResponse | null | undefined): ChatConfigData {
  return {
    channelId: String(data?.channel_id ?? '').trim(),
    chatUrl: String(data?.chat_url ?? '').trim(),
    backupUrl: String(data?.chat_backup_url ?? '').trim(),
  };
}

export const commonApi = {
  async getPage(
    params: { type: CommonPageType },
    signal?: AbortSignal,
  ): Promise<CommonPageData> {
    return http.get<CommonPageData>('/api/Common/page', {
      headers: createApiHeaders(),
      query: params,
      signal,
      useMock: false,
    });
  },

  async getChatConfig(signal?: AbortSignal): Promise<ChatConfigData> {
    const response = await http.get<ChatConfigResponse>('/api/Common/chatConfig', {
      headers: createApiHeaders(),
      signal,
      useMock: false,
    });

    return normalizeChatConfig(response);
  },
};
