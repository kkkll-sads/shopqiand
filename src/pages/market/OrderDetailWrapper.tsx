/**
 * OrderDetail 页面包装器
 */
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import OrderDetail from '../../../pages/market/OrderDetail';
import type { Route } from '../../../router/routes';

const OrderDetailWrapper: React.FC = () => {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();

  const handleNavigate = (route: Route) => {
    if (route.name === 'cashier') {
      navigate(`/cashier/${(route as any).orderId || ''}`);
    } else if (route.name === 'order-list') {
      navigate(`/orders/${(route as any).kind || 'product'}/${(route as any).status || 0}`);
    }
  };

  return (
    <OrderDetail orderId={orderId || ''} onBack={() => navigate(-1)} onNavigate={handleNavigate} />
  );
};

export default OrderDetailWrapper;
