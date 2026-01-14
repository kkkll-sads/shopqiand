/**
 * OrderListPage 页面包装器
 */
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import OrderListPage from '../../../pages/market/OrderListPage';
import type { Route } from '../../../router/routes';

const OrderListPageWrapper: React.FC = () => {
  const navigate = useNavigate();
  const { category, status } = useParams<{ category: string; status: string }>();

  const handleNavigate = (route: Route) => {
    if (route.name === 'order-detail') {
      navigate(`/order/${(route as any).orderId || ''}`);
    } else if (route.name === 'cashier') {
      navigate(`/cashier/${(route as any).orderId || ''}`);
    }
  };

  return (
    <OrderListPage
      kind={(category as any) || 'product'}
      initialStatus={status ? parseInt(status) : 0}
      onBack={() => navigate(-1)}
      onNavigate={handleNavigate}
    />
  );
};

export default OrderListPageWrapper;
