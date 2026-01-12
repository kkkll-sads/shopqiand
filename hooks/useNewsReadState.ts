import { useCallback, useState } from 'react';
import { NewsItem } from '../types';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { readJSON, writeJSON } from '../utils/storageAccess';

/**
 * useNewsReadState - 统一管理资讯列表与已读状态
 * - 读取/写入本地已读 ID
 * - 提供标记单条/全部已读的便捷方法
 */
export function useNewsReadState(initialNews: NewsItem[] = []) {
  const [newsList, setNewsList] = useState<NewsItem[]>(initialNews);

  const getStoredReadIds = () => readJSON<string[]>(STORAGE_KEYS.READ_NEWS_IDS_KEY, []) || [];
  const saveStoredReadIds = (ids: string[]) => writeJSON(STORAGE_KEYS.READ_NEWS_IDS_KEY, ids);

  const markAllRead = useCallback(() => {
    const allIds = newsList.map((n) => n.id);
    const current = getStoredReadIds();
    const merged = Array.from(new Set([...current, ...allIds]));
    saveStoredReadIds(merged);
    setNewsList((prev) => prev.map((item) => ({ ...item, isUnread: false })));
  }, [newsList]);

  const markReadById = useCallback((id: string) => {
    setNewsList((prev) => prev.map((item) => (item.id === id ? { ...item, isUnread: false } : item)));
    const current = getStoredReadIds();
    if (!current.includes(id)) {
      saveStoredReadIds([...current, id]);
    }
  }, []);

  const initWith = useCallback((list: NewsItem[]) => {
    const readIds = getStoredReadIds();
    const next = list.map((item) => ({
      ...item,
      isUnread: item.isUnread ?? !readIds.includes(item.id),
    }));
    setNewsList(next);
  }, []);

  const refreshReadStatus = useCallback(() => {
    const readIds = getStoredReadIds();
    setNewsList((prev) => prev.map((item) => ({
      ...item,
      isUnread: item.isUnread && !readIds.includes(item.id),
    })));
  }, []);

  return {
    newsList,
    setNewsList,
    initWith,
    markAllRead,
    markReadById,
    refreshReadStatus,
  };
}

export default useNewsReadState;
