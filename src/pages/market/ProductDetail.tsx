/**
 * ProductDetail - 商品详情页路由入口
 * 
 * 根据商品类型分发到对应的详情组件：
 * - 商城商品 (shop) -> ShopProductDetail（淘宝风格）
 * - 数字藏品 (collection) -> CollectionCertificate（证书风格）
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Product } from '@/types';
import { CollectionItemDetailData, ShopProductDetailData, fetchShopProductDetail } from '@/services/api';
import { LoadingSpinner } from '@/components/common';
import ShopProductDetail from './ShopProductDetail';
import CollectionCertificate from './CollectionCertificate';
import { extractData } from '@/utils/apiHelpers';

interface ProductDetailProps {
  product?: Product;
  /** 是否隐藏底部操作区域 */
  hideActions?: boolean;
  /** 预加载的详情数据 */
  initialData?: CollectionItemDetailData | ShopProductDetailData | null;
  /** 更新选中产品信息的回调 */
  onProductUpdate?: (updatedProduct: Product) => void;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ 
  product: propProduct, 
  hideActions = false, 
  initialData = null,
  onProductUpdate 
}) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(propProduct || null);
  const [loading, setLoading] = useState(!propProduct);
  const [error, setError] = useState<string | null>(null);

  // 从路由参数加载商品数据
  useEffect(() => {
    if (propProduct) {
      setProduct(propProduct);
      setLoading(false);
      return;
    }

    if (!id) {
      setError('商品ID未提供');
      setLoading(false);
      return;
    }

    const loadProduct = async () => {
      try {
        setLoading(true);
        const response = await fetchShopProductDetail(Number(id));
        const data = extractData(response);
        
        if (data) {
          // 将详情数据转换为 Product 对象
          const productData: Product = {
            id: Number(id),
            title: data.name || '',
            image: data.thumbnail || data.images?.[0] || '',
            price: String(data.price || 0),
            productType: 'shop',
            score_price: data.score_price || 0,
          };
          setProduct(productData);
          setError(null);
        } else {
          setError('商品未找到');
        }
      } catch (err: any) {
        setError(err?.message || '加载商品失败');
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id, propProduct]);

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
  const isShopProduct = product.productType === 'shop';

  if (isShopProduct) {
    return (
      <ShopProductDetail
        product={product}
        hideActions={hideActions}
        initialData={initialData as ShopProductDetailData | null}
      />
    );
  }

  return (
    <CollectionCertificate
      product={product}
      hideActions={hideActions}
      initialData={initialData as CollectionItemDetailData | null}
      onProductUpdate={onProductUpdate}
    />
  );
};

export default ProductDetail;
