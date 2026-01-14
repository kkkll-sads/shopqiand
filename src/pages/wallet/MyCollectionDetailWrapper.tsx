/**
 * MyCollectionDetail 藏品详情页面包装器
 */
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MyCollectionDetail from '../../../pages/wallet/MyCollectionDetail';
import { useAppStore } from '../../stores/appStore';
import type { Route } from '../../../router/routes';

const MyCollectionDetailWrapper: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { selectedCollectionItem } = useAppStore();

  const handleNavigate = (route: Route) => {
    if (route.name === 'order-detail') {
      navigate(`/order/${(route as any).orderId || ''}`);
    } else if (route.name === 'claim-detail') {
      navigate(`/claim-detail/${(route as any).id || ''}`);
    }
  };

  return (
    <MyCollectionDetail
      itemId={id || selectedCollectionItem?.id?.toString() || ''}
      item={selectedCollectionItem}
      onBack={() => navigate(-1)}
      onNavigate={handleNavigate}
    />
  );
};

export default MyCollectionDetailWrapper;
