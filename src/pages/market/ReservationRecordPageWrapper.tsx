/**
 * ReservationRecordPage 预约记录页面包装�?
 * 已简�? 直接渲染组件，导航由组件内部处理
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import ReservationRecordPage from './ReservationRecordPage';
import { useAppStore } from '../../stores/appStore';
import type { Product } from '../../../types';

const ReservationRecordPageWrapper: React.FC = () => {
  const navigate = useNavigate();
  const { setSelectedProduct } = useAppStore();

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product, 'reservation-record');
    navigate(`/product/${product.id}`);
  };

  return <ReservationRecordPage onProductSelect={handleProductSelect} />;
};

export default ReservationRecordPageWrapper;
