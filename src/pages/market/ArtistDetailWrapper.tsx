/**
 * ArtistDetail 艺术家详情页面包装器
 * 已简�? 直接渲染组件，导航由组件内部处理
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import ArtistDetail from './ArtistDetail';
import { useAppStore } from '../../stores/appStore';
import type { Product } from '../../../types';

const ArtistDetailWrapper: React.FC = () => {
  const navigate = useNavigate();
  const { setSelectedProduct } = useAppStore();

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product, 'artist');
    navigate(`/product/${product.id}`);
  };

  return <ArtistDetail onProductSelect={handleProductSelect} />;
};

export default ArtistDetailWrapper;
