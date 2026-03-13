import { ShieldCheck } from 'lucide-react';
import type { ShopProductDetail } from '../../../api/modules/shopProduct';
import { Skeleton } from '../../../components/ui/Skeleton';
import {
  buildShopProductDescription,
  buildShopProductServiceItems,
  buildShopProductSpecs,
  getShopProductPurchaseTag,
  resolveShopProductImageUrl,
} from '../../shop-product/utils';
import { PRODUCT_DETAIL_TABS } from '../constants';
import type { ProductDetailTab } from '../types';

interface ProductTabsSectionProps {
  activeTab: ProductDetailTab;
  loading: boolean;
  onChange: (tab: ProductDetailTab) => void;
  product: ShopProductDetail | null;
}

export const ProductTabsSection = ({
  activeTab,
  loading,
  onChange,
  product,
}: ProductTabsSectionProps) => {
  const specs = buildShopProductSpecs(product);
  const serviceItems = buildShopProductServiceItems(product);
  const description = buildShopProductDescription(product);
  const detailImages = (product?.detail_images ?? []).filter(Boolean);
  const parameterRows =
    specs.length > 0
      ? specs
      : [
          { name: '商品分类', value: product?.category || '--' },
          { name: '购买方式', value: product ? getShopProductPurchaseTag(product) : '--' },
          { name: '库存', value: String(product?.stock ?? 0) },
          { name: '销量', value: String(product?.sales ?? 0) },
          { name: '商品类型', value: product?.is_physical === '1' ? '实体商品' : '虚拟商品' },
        ];

  return (
    <div className="mt-2 bg-white pb-4">
      <div className="sticky top-12 z-30 flex border-b border-[#f0f0f0] bg-white">
        {PRODUCT_DETAIL_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`relative flex-1 py-3 text-sm font-medium ${
              activeTab === tab.id ? 'text-primary-start' : 'text-text-main'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-primary-start" />
            )}
          </button>
        ))}
      </div>

      <div className="p-4">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        ) : activeTab === 'details' ? (
          <div className="space-y-4">
            {description ? (
              <div className="rounded-xl border border-[#ececec] bg-[#fafafa] px-4 py-4 text-sm leading-7 text-text-sub">
                {description}
              </div>
            ) : null}

            {detailImages.length > 0 ? (
              <div className="overflow-hidden rounded-xl border border-[#ececec] bg-white">
                {detailImages.map((image) => (
                  <img
                    key={image}
                    src={resolveShopProductImageUrl(image)}
                    alt={product?.name || '商品详情'}
                    className="w-full"
                    referrerPolicy="no-referrer"
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-[#ececec] bg-[#fafafa] px-4 py-6 text-center text-sm text-text-sub">
                暂无图文详情
              </div>
            )}
          </div>
        ) : activeTab === 'params' ? (
          <div className="overflow-hidden rounded-xl border border-[#ececec]">
            {parameterRows.map((item, index) => (
              <div
                key={`${item.name}-${index}`}
                className={`flex min-h-[44px] text-sm ${
                  index < parameterRows.length - 1 ? 'border-b border-[#f0f0f0]' : ''
                }`}
              >
                <div className="flex w-[112px] shrink-0 items-center bg-[#fafafa] px-4 text-text-sub">
                  {item.name}
                </div>
                <div className="flex flex-1 items-center px-4 text-text-main">{item.value}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {serviceItems.map((item, index) => (
              <div key={item} className="rounded-xl border border-[#ececec] bg-[#fafafa] px-4 py-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-[#fff3ef] p-2 text-primary-start">
                    <ShieldCheck size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-text-main">售后保障 {index + 1}</div>
                    <p className="mt-1 text-sm leading-6 text-text-sub">{item}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
