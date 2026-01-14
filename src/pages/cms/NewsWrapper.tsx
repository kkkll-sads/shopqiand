/**
 * News 页面包装器
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import News from '../../../pages/cms/News';
import { useAppStore } from '../../stores/appStore';
import type { NewsItem } from '../../../types';

const NewsWrapper: React.FC = () => {
  const navigate = useNavigate();
  const { markNewsRead } = useAppStore();

  const handleNewsSelect = (news: NewsItem) => {
    markNewsRead(news.id);
    navigate(`/news/${news.id}`);
  };

  return <News onBack={() => navigate(-1)} onNewsSelect={handleNewsSelect} />;
};

export default NewsWrapper;
