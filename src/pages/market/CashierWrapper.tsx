/**
 * Cashier 页面包装器
 */
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Cashier from '../../../pages/market/Cashier';
import type { Route } from '../../../router/routes';

const CashierWrapper: React.FC = () => {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();

  const handleNavigate = (route: Route) => {
    if (route.name === 'order-detail') {
      navigate(`/order/${(route as any).orderId || ''}`, { replace: true });
    } else if (route.name === 'order-list') {
      navigate(`/orders/${(route as any).kind || 'product'}/${(route as any).status || 0}`, {
        replace: true,
      });
    }
  };

  return (
    <Cashier orderId={orderId || ''} onBack={() => navigate(-1)} onNavigate={handleNavigate} />
  );
};

export default CashierWrapper;
