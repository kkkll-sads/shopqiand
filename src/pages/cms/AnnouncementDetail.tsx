/**
 * AnnouncementDetail - 公告详情页面
 * 已迁移: 使用 React Router 导航
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock } from 'lucide-react';
import PageContainer from '@/layouts/PageContainer';
import { EmptyState, LoadingSpinner } from '@/components/common';
import { NewsItem } from '@/types';
import { useAnnouncementDetail } from './hooks/useAnnouncementDetail';

interface AnnouncementDetailProps {
  newsItem?: NewsItem;
}

/**
 * 格式化时间戳为可读日期
 */
const formatTimestamp = (date: string | number | undefined): string => {
  if (!date) return '';

  // 如果已经是格式化好的日期字符串（包含"-"或"/"），直接返回
  if (typeof date === 'string' && (date.includes('-') || date.includes('/'))) {
    return date;
  }

  // 数字时间戳处理
  let timestamp: number;
  if (typeof date === 'string') {
    timestamp = parseInt(date, 10);
    if (isNaN(timestamp)) return date;
  } else {
    timestamp = date;
  }

  // Unix时间戳是秒，JavaScript Date需要毫秒
  const timeMs = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
  const d = new Date(timeMs);

  if (isNaN(d.getTime())) return String(date);

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

const AnnouncementDetail: React.FC<AnnouncementDetailProps> = ({ newsItem: propNewsItem }) => {
  const navigate = useNavigate();
  const { newsItem: hookNewsItem, loading, error } = useAnnouncementDetail();
  
  // 优先使用传入的 newsItem，其次使用 hook 加载的数据
  const newsItem = propNewsItem || hookNewsItem;

  // 加载中
  if (loading) {
    return (
      <PageContainer title="公告详情" onBack={() => navigate(-1)}>
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <LoadingSpinner />
        </div>
      </PageContainer>
    );
  }

  // 错误状态
  if (error || !newsItem) {
    return (
      <PageContainer title="公告详情" onBack={() => navigate(-1)}>
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
          <EmptyState title={error || '公告不存在'} />
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            返回
          </button>
        </div>
      </PageContainer>
    );
  }

  /**
   * 渲染内容（将换行符转换为段落）
   */
  const renderContent = (content?: string) => {
    if (!content) return <EmptyState title="暂无内容" />;

    return (
      <div className="whitespace-pre-wrap leading-relaxed text-justify">
        {content}
      </div>
    );
  };

  // 根据类型显示不同的标题
  const pageTitle = newsItem.type === 'announcement' ? '公告详情' : '资讯详情';

  return (
    <PageContainer title={pageTitle} onBack={() => navigate(-1)}>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        {/* 标题 */}
        <h2 className="text-lg font-bold text-gray-900 mb-3 leading-snug">
          {newsItem.title}
        </h2>

        {/* 发布时间 */}
        <div className="flex items-center text-gray-400 text-xs mb-6 pb-4 border-b border-gray-50">
          <Clock size={12} className="mr-1.5" />
          <span>发布时间：{formatTimestamp(newsItem.date)}</span>
        </div>

        {/* 内容 */}
        <div className="text-gray-700 text-sm">
          {renderContent(newsItem.content)}
        </div>
      </div>
    </PageContainer>
  );
};

export default AnnouncementDetail;
