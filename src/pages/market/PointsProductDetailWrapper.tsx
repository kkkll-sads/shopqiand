/**
 * PointsProductDetail 页面包装器
 */
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PointsProductDetail from '../../../pages/market/PointsProductDetail';
import { useAppStore } from '../../stores/appStore';
import type { Route } from '../../../router/routes';
import type { Product } from '../../../types';

// 路由映射
const routeToPath = (route: Route): string => {
  const mapping: Record<string, string | ((r: Route) => string)> = {
    'order-detail': (r) => `/order/${(r as any).orderId || ''}`,
    cashier: (r) => `/cashier/${(r as any).orderId || ''}`,
    'address-list': '/address',
  };

  const result = mapping[route.name];
  if (typeof result === 'function') return result(route);
  return result || '/';
};

const PointsProductDetailWrapper: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { selectedProduct } = useAppStore();

  // 如果没有选中的商品，尝试从 URL 获取 ID
  const product: Product | null =
    selectedProduct || (id ? ({ id: parseInt(id) } as Product) : null);

  const handleBack = () => {
    navigate(-1);
  };

  const handleNavigate = (route: Route) => {
    navigate(routeToPath(route));
  };

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>商品未找到</p>
      </div>
    );
  }

  return (
    <PointsProductDetail
      product={product}
      onBack={handleBack}
      onNavigate={handleNavigate}
    />
  );
};

export default PointsProductDetailWrapper;
