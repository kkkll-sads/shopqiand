/**
 * ReservationRecordPage 预约记录页面包装器
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import ReservationRecordPage from '../../../pages/market/ReservationRecordPage';
import { useAppStore } from '../../stores/appStore';
import type { Route } from '../../../router/routes';
import type { Product } from '../../../types';

const ReservationRecordPageWrapper: React.FC = () => {
  const navigate = useNavigate();
  const { setSelectedProduct } = useAppStore();

  const handleNavigate = (route: Route) => {
    if (route.name === 'order-detail') {
      navigate(`/order/${(route as any).orderId || ''}`);
    }
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product, 'reservation-record');
    navigate(`/product/${product.id}`);
  };

  return (
    <ReservationRecordPage
      onBack={() => navigate(-1)}
      onNavigate={handleNavigate}
      onProductSelect={handleProductSelect}
    />
  );
};

export default ReservationRecordPageWrapper;
