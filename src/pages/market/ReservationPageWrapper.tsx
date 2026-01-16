/**
 * ReservationPage 预约页面包装�?
 * 已简�? 直接渲染组件，导航由组件内部处理
 */
import React from 'react';
import ReservationPage from './ReservationPage';
import { useAppStore } from '../../stores/appStore';

const ReservationPageWrapper: React.FC = () => {
  const { selectedProduct } = useAppStore();

  // 需要一�?product 对象，从 store 获取
  const product = selectedProduct || { id: 0, title: '', image: '' };

  return <ReservationPage product={product} />;
};

export default ReservationPageWrapper;
