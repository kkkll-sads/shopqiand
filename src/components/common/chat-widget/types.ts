export type WidgetLoadState = 'idle' | 'loading' | 'ready' | 'failed';

export interface ChatWidgetConfig {
  channelId: string;
  useCustomButton?: boolean;
  autoOpen?: number;
  userInfo?: {
    userName?: string;
    email?: string;
    pid?: string;
    phone?: string;
    groupId?: string;
    adminId?: string;
    params?: string;
  };
  onStatusChange?: (status: 'opened' | 'closed') => void;
  onReady?: () => void;
}

export interface ChatWidgetProps {
  useCustomButton?: boolean;
  autoOpen?: number;
  onStatusChange?: (status: 'opened' | 'closed') => void;
}

declare global {
  interface Window {
    CHAT_BASE_URL?: string;
    CHAT_BACKUP_BASE_URL?: string;
    CHAT_BASE_URLS?: string[];
    CHAT_CHANNEL_ID?: string;
    CHAT_WIDGET_SCRIPT_URL?: string;
    ChatWidget?: {
      init: (config: ChatWidgetConfig) => void;
      open: () => void;
      close: () => void;
      toggle: () => void;
      getStatus: () => 'uninitialized' | 'loading' | 'opened' | 'closed';
      isOpen: () => boolean;
    };
  }
}
