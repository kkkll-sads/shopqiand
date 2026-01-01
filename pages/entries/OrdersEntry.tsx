import React from 'react';
import Orders from '../market/Orders';
import { Route } from '../../router/routes';

interface OrdersEntryProps {
  onNavigate: (route: Route) => void;
}

const OrdersEntry: React.FC<OrdersEntryProps> = ({ onNavigate }) => {
  return <Orders onNavigate={onNavigate} />;
};

export default OrdersEntry;

