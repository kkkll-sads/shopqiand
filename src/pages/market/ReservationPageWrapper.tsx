/**
 * ReservationPage 预约页面包装器
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import ReservationPage from '../../../pages/market/ReservationPage';
import type { Route } from '../../../router/routes';

const ReservationPageWrapper: React.FC = () => {
  const navigate = useNavigate();

  const handleNavigate = (route: Route) => {
    if (route.name === 'reservation-record') {
      navigate('/reservation-record');
    } else if (route.name === 'order-detail') {
      navigate(`/order/${(route as any).orderId || ''}`);
    } else if (route.name === 'cashier') {
      navigate(`/cashier/${(route as any).orderId || ''}`);
    } else if (route.name === 'product-detail') {
      navigate(`/product/${(route as any).id || ''}`);
    }
  };

  return <ReservationPage onBack={() => navigate(-1)} onNavigate={handleNavigate} />;
};

export default ReservationPageWrapper;
