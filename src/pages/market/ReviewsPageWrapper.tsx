/**
 * ReviewsPage 包装器组件
 * 用于 React Router 懒加载
 */
import React from 'react';
import ReviewsPage from './ReviewsPage';

const ReviewsPageWrapper: React.FC = () => {
  return <ReviewsPage />;
};

export default ReviewsPageWrapper;
