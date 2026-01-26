/**
 * useAnnouncementDetail - 公告详情数据加载 Hook
 */
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAppStore } from '@/stores/appStore';
import { fetchAnnouncements, AnnouncementItem } from '@/services/api';
import { isSuccess } from '@/utils/apiHelpers';
import { errorLog } from '@/utils/logger';
import { NewsItem } from '@/types';

interface UseAnnouncementDetailResult {
  newsItem: NewsItem | null;
  loading: boolean;
  error: string | null;
}

/**
 * 公告详情数据加载 Hook
 */
export function useAnnouncementDetail(): UseAnnouncementDetailResult {
  const { id } = useParams<{ id: string }>();
  const newsList = useAppStore((state) => state.newsList);
  
  const [newsItem, setNewsItem] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('缺少公告ID');
      setLoading(false);
      return;
    }

    // 首先尝试从 store 中查找
    const foundItem = newsList.find((item) => item.id === id);
    if (foundItem) {
      setNewsItem(foundItem);
      setLoading(false);
      return;
    }

    // 如果 store 中没有，从 API 加载
    const loadAnnouncement = async () => {
      try {
        setLoading(true);
        setError(null);

        // 尝试加载所有类型的公告，然后查找对应的项
        const [normalResponse, importantResponse] = await Promise.all([
          fetchAnnouncements({ page: 1, limit: 100, type: 'normal' }),
          fetchAnnouncements({ page: 1, limit: 100, type: 'important' }),
        ]);

        let foundAnnouncement: AnnouncementItem | null = null;

        // 从 normal 类型中查找
        if (isSuccess(normalResponse) && normalResponse.data?.list) {
          foundAnnouncement = normalResponse.data.list.find(
            (item) => String(item.id) === id
          ) || null;
        }

        // 如果还没找到，从 important 类型中查找
        if (!foundAnnouncement && isSuccess(importantResponse) && importantResponse.data?.list) {
          foundAnnouncement = importantResponse.data.list.find(
            (item) => String(item.id) === id
          ) || null;
        }

        if (foundAnnouncement) {
          // 转换为 NewsItem 格式
          const newsItem: NewsItem = {
            id: String(foundAnnouncement.id),
            title: foundAnnouncement.title,
            date: foundAnnouncement.createtime || '',
            isUnread: false,
            type: foundAnnouncement.type === 'important' ? 'dynamic' : 'announcement',
            content: foundAnnouncement.content,
          };
          setNewsItem(newsItem);
        } else {
          setError('公告不存在或已删除');
        }
      } catch (err) {
        errorLog('useAnnouncementDetail', '加载公告详情失败', err);
        setError('加载失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    loadAnnouncement();
  }, [id, newsList]);

  return {
    newsItem,
    loading,
    error,
  };
}
