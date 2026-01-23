/**
 * AnnouncementDetail 公告详情页面包装器
 * 负责从 store 或 API 加载数据并传递给 AnnouncementDetail 组件
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppStore } from '../../stores/appStore';
import { fetchAnnouncements, AnnouncementItem } from '../../../services/api';
import { isSuccess, extractData } from '../../../utils/apiHelpers';
import { LoadingSpinner, EmptyState } from '../../../components/common';
import { errorLog } from '../../../utils/logger';
import { NewsItem } from '../../../types';
import AnnouncementDetail from './AnnouncementDetail';

const AnnouncementDetailWrapper: React.FC = () => {
  const navigate = useNavigate();
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
        errorLog('AnnouncementDetailWrapper', '加载公告详情失败', err);
        setError('加载失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    loadAnnouncement();
  }, [id, newsList]);

  // 加载中
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  // 错误状态
  if (error || !newsItem) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
        <EmptyState title={error || '公告不存在'} />
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          返回
        </button>
      </div>
    );
  }

  // 正常渲染
  return <AnnouncementDetail newsItem={newsItem} />;
};

export default AnnouncementDetailWrapper;
