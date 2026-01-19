/**
 * ProductDetail - 商品详情页路由入口
 * 
 * 根据商品类型分发到对应的详情组件：
 * - 商城商品 (shop) -> ShopProductDetail（淘宝风格）
 * - 数字藏品 (collection) -> CollectionCertificate（证书风格）
 */
import React from 'react';
import { Product } from '../../../types';
import { CollectionItemDetailData, ShopProductDetailData } from '../../../services/api';
import ShopProductDetail from './ShopProductDetail';
import CollectionCertificate from './CollectionCertificate';

interface ProductDetailProps {
  product: Product;
  /** 是否隐藏底部操作区域 */
  hideActions?: boolean;
  /** 预加载的详情数据 */
  initialData?: CollectionItemDetailData | ShopProductDetailData | null;
  /** 更新选中产品信息的回调 */
  onProductUpdate?: (updatedProduct: Product) => void;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ 
  product, 
  hideActions = false, 
  initialData = null,
  onProductUpdate 
}) => {
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
