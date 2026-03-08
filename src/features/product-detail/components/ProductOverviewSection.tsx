import { ChevronRight, ShieldCheck } from 'lucide-react';
import type { ShopProductDetail } from '../../../api/modules/shopProduct';
import { Badge } from '../../../components/ui/Badge';
import { Card } from '../../../components/ui/Card';
import { Skeleton } from '../../../components/ui/Skeleton';
import type { SkuMode } from '../types';
import {
  buildShopProductDescription,
  buildShopProductServiceItems,
  getShopProductBadges,
  getShopProductPrimaryPrice,
  resolveShopProductImageUrl,
} from '../../shop-product/utils';

interface ProductOverviewSectionProps {
  loading: boolean;
  onOpenServiceDescription: () => void;
  onOpenSku: (mode: SkuMode) => void;
  product: ShopProductDetail | null;
  quantity: number;
  selectedSummary: string;
}

export const ProductOverviewSection = ({
  loading,
  onOpenServiceDescription,
  onOpenSku,
  product,
  quantity,
  selectedSummary,
}: ProductOverviewSectionProps) => {
  const gallery = product
    ? [product.thumbnail, ...(product.images ?? [])]
        .map((image) => resolveShopProductImageUrl(image))
        .filter(Boolean)
        .filter((image, index, source) => source.indexOf(image) === index)
    : [];

  const serviceItems = buildShopProductServiceItems(product);

  return (
    <>
      {loading ? (
        <Skeleton className="aspect-square w-full" />
      ) : (
        <div className="relative aspect-square w-full bg-white dark:bg-gray-900">
          <img
            src={gallery[0]}
            alt={product?.name || '商品'}
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute bottom-4 right-4 rounded-full bg-black/40 px-2 py-1 text-s text-white backdrop-blur-sm">
            1 / {gallery.length || 1}
          </div>
        </div>
      )}

      {loading ? (
        <Card className="m-4 space-y-3 p-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </Card>
      ) : (
        <Card className="mx-4 mt-4 rounded-t-[16px] rounded-b-none border-b border-border-light p-4 shadow-none">
          <div className="mb-2 flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold leading-tight text-primary-start">
                {product ? getShopProductPrimaryPrice(product) : '价格待定'}
              </div>
            </div>
            <div className="text-sm text-text-sub">库存 {product?.stock ?? 0}</div>
          </div>

          <div className="mb-3 flex flex-wrap gap-1.5">
            {(product ? getShopProductBadges(product) : []).map((badge) => (
              <Badge key={badge} variant={badge === '消费金' ? 'score' : 'primary'}>
                {badge}
              </Badge>
            ))}
            {product?.category && (
              <Badge variant="default" className="rounded-full">
                {product.category}
              </Badge>
            )}
          </div>
        </Card>
      )}

      {loading ? (
        <Card className="mx-4 mb-4 space-y-2 rounded-t-none p-4">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="mt-2 h-4 w-1/2" />
        </Card>
      ) : (
        <Card className="mx-4 mb-4 rounded-t-none p-4 shadow-soft">
          <h1 className="mb-2 line-clamp-2 text-xl font-bold leading-snug text-text-main">
            {product?.name || '商品详情'}
          </h1>
          {buildShopProductDescription(product) && (
            <p className="mb-3 text-base text-text-sub">
              {buildShopProductDescription(product)}
            </p>
          )}
          <div className="flex items-center space-x-4 text-s text-text-aux">
            <span>销量 {product?.sales ?? 0}</span>
            <span>库存 {product?.stock ?? 0}</span>
            <span>{product?.is_physical === '1' ? '实物商品' : '虚拟商品'}</span>
          </div>
        </Card>
      )}

      {loading ? (
        <Card className="m-4 flex items-center justify-between p-4">
          <div className="flex w-full items-center space-x-4">
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-4 w-4" />
        </Card>
      ) : (
        <Card
          className="m-4 flex cursor-pointer items-center justify-between p-4 transition-colors active:bg-bg-base"
          onClick={() => onOpenSku('select')}
        >
          <div className="flex items-center">
            <span className="w-12 shrink-0 text-base font-bold text-text-main">已选</span>
            <span className="line-clamp-1 text-base text-text-main">
              {selectedSummary || `x${quantity}`}
            </span>
          </div>
          <ChevronRight size={16} className="shrink-0 text-text-aux" />
        </Card>
      )}

      {loading ? (
        <Card className="m-4 space-y-4 p-4">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-full" />
          </div>
          <div className="flex items-center space-x-4">
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-full" />
          </div>
        </Card>
      ) : (
        <Card
          className="m-4 cursor-pointer p-4 transition-colors active:bg-bg-base"
          onClick={onOpenServiceDescription}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start">
              <span className="mt-0.5 w-12 shrink-0 text-base font-bold text-text-main">服务</span>
              <div className="flex flex-wrap gap-x-3 gap-y-2">
                {serviceItems.map((item) => (
                  <span key={item} className="flex items-center text-sm text-text-sub">
                    <ShieldCheck size={12} className="mr-1 text-primary-start" />
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <ChevronRight size={16} className="mt-0.5 shrink-0 text-text-aux" />
          </div>
        </Card>
      )}
    </>
  );
};
