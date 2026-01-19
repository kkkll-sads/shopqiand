/**
 * ProductDetail 页面包装器
 * 
 * 处理两种场景：
 * 1. 从列表页点击进入 - 使用 selectedProduct
 * 2. 页面刷新 - 根据 URL id 加载商品数据
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ProductDetail from './ProductDetail';
import { useAppStore } from '../../stores/appStore';
import { fetchShopProductDetail } from '../../../services/api';
import { isSuccess, extractData } from '../../../utils/apiHelpers';
import { LoadingSpinner } from '../../../components/common';
import type { Product } from '../../../types';

const ProductDetailWrapper: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedProduct } = useAppStore();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedProduct, setLoadedProduct] = useState<Product | null>(null);

  // 如果有选中的商品直接使用，否则需要加载
  const needsLoading = !selectedProduct && id;

  useEffect(() => {
    if (!needsLoading) return;

    const loadProduct = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // 尝试加载商品详情
        const response = await fetchShopProductDetail(id!);
        
        if (isSuccess(response)) {
          const data = extractData(response);
          if (data) {
            // 构建 Product 对象
            const product: Product = {
              id: id!,
              title: data.name || '商品详情',
              image: data.thumbnail || '',
              price: Number(data.price) || 0,
              productType: 'shop', // 商城商品
              score_price: data.score_price,
              category: data.category || '',
            };
            setLoadedProduct(product);
          } else {
            setError('商品数据加载失败');
          }
        } else {
          setError('商品不存在或已下架');
        }
      } catch (err) {
        console.error('加载商品失败:', err);
        setError('网络错误，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id, needsLoading]);

  // 优先使用 selectedProduct，其次使用加载的数据
  const product = selectedProduct || loadedProduct;

  // 加载中
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
        <p className="text-gray-500 mb-4">{error}</p>
        <button 
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg"
        >
          返回
        </button>
      </div>
    );
  }

  // 没有商品数据
  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
        <p className="text-gray-500 mb-4">商品未找到</p>
        <button 
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg"
        >
          返回
        </button>
      </div>
    );
  }

  return <ProductDetail product={product} />;
};

export default ProductDetailWrapper;
