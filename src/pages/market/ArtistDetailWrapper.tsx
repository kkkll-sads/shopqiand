/**
 * ArtistDetail 艺术家详情页面包装器
 */
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ArtistDetail from '../../../pages/market/ArtistDetail';
import { useAppStore } from '../../stores/appStore';
import type { Route } from '../../../router/routes';
import type { Product } from '../../../types';

const ArtistDetailWrapper: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { setSelectedProduct } = useAppStore();

  const handleNavigate = (route: Route) => {
    if (route.name === 'artist-works-showcase') {
      navigate(`/artist-works/${(route as any).artistId || ''}`);
    }
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product, 'artist');
    navigate(`/product/${product.id}`);
  };

  return (
    <ArtistDetail
      artistId={id || ''}
      onBack={() => navigate(-1)}
      onNavigate={handleNavigate}
      onProductSelect={handleProductSelect}
    />
  );
};

export default ArtistDetailWrapper;
