/**
 * ProductDetail 页面包装器
 * 已简化：直接渲染组件，导航由组件内部处理
 */
import React from 'react';
import { useParams } from 'react-router-dom';
import ProductDetail from './ProductDetail';
import { useAppStore } from '../../stores/appStore';
import type { Product } from '../../../types';

const ProductDetailWrapper: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { selectedProduct } = useAppStore();

  // 如果没有选中的商品，尝试从 URL 获取 ID
  const product: Product | null =
    selectedProduct || (id ? ({ id: parseInt(id) } as Product) : null);

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>商品未找到</p>
      </div>
    );
  }

  return <ProductDetail product={product} />;
};

export default ProductDetailWrapper;
