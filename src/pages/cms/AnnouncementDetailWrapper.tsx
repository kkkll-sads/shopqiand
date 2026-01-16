/**
 * AnnouncementDetail 公告详情页面包装�?
 */
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AnnouncementDetail from './AnnouncementDetail';

const AnnouncementDetailWrapper: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  return <AnnouncementDetail announcementId={id || ''} onBack={() => navigate(-1)} />;
};

export default AnnouncementDetailWrapper;
