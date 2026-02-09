import { STORAGE_KEYS } from '@/constants/storageKeys';
import type { MessageItem } from './types';
import { getMessageIconKey, resolveMessageIcon } from './types';

const CACHE_KEY = 'message_center_cache';
const CACHE_TIMESTAMP_KEY = 'message_center_cache_timestamp';
const CACHE_DURATION = 0;

type SerializedMessage = Omit<MessageItem, 'icon'> & { iconKey: string };

export function getReadMessageIds(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.READ_MESSAGE_IDS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveReadMessageIds(ids: string[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.READ_MESSAGE_IDS_KEY, JSON.stringify(ids));
  } catch {
    // ignore storage errors
  }
}

export function getNewsReadIds(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.READ_NEWS_IDS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveNewsReadIds(ids: string[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.READ_NEWS_IDS_KEY, JSON.stringify(ids));
  } catch {
    // ignore storage errors
  }
}

export function getCachedMessages(): MessageItem[] | null {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    const timestamp = sessionStorage.getItem(CACHE_TIMESTAMP_KEY);

    if (!cached || !timestamp) {
      return null;
    }

    const cacheAge = Date.now() - parseInt(timestamp, 10);
    if (cacheAge >= CACHE_DURATION) {
      return null;
    }

    const parsed: SerializedMessage[] = JSON.parse(cached);
    return parsed.map((item) => ({
      ...item,
      icon: resolveMessageIcon(item.iconKey),
    }));
  } catch {
    return null;
  }
}

export function setCachedMessages(messages: MessageItem[]) {
  try {
    const serializable: SerializedMessage[] = messages.map((message) => ({
      ...message,
      iconKey: getMessageIconKey(message.icon),
    }));

    sessionStorage.setItem(CACHE_KEY, JSON.stringify(serializable));
    sessionStorage.setItem(CACHE_TIMESTAMP_KEY, String(Date.now()));
  } catch {
    // ignore storage errors
  }
}

export function clearCachedMessages() {
  try {
    sessionStorage.removeItem(CACHE_KEY);
    sessionStorage.removeItem(CACHE_TIMESTAMP_KEY);
  } catch {
    // ignore storage errors
  }
}

export function syncCachedReadState(messages: MessageItem[]): MessageItem[] {
  const readIds = getReadMessageIds();
  const newsReadIds = getNewsReadIds();

  return messages.map((message) => {
    let isRead = message.isRead || readIds.includes(message.id);

    if ((message.type === 'notice' || message.type === 'activity') && message.sourceId) {
      if (newsReadIds.includes(String(message.sourceId))) {
        isRead = true;
      }
    }

    return isRead === message.isRead ? message : { ...message, isRead };
  });
}
