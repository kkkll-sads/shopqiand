/**
 * AnnouncementDetail - 公告详情页面
 * 已迁移: 使用 React Router 导航
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock } from 'lucide-react';
import PageContainer from '../../../components/layout/PageContainer';
import { EmptyState } from '../../../components/common';
import { NewsItem } from '../../../types';

interface AnnouncementDetailProps {
  newsItem: NewsItem;
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

const AnnouncementDetail: React.FC<AnnouncementDetailProps> = ({ newsItem }) => {
  const navigate = useNavigate();

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
