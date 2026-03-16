import { Package, RotateCcw, ShieldCheck, Truck } from 'lucide-react';
import type { ShopProductDetail } from '../../../api/modules/shopProduct';
import { BottomSheet } from '../../../components/ui/BottomSheet';
import { buildShopProductServiceItems } from '../../shop-product/utils';

interface ProductServiceSheetProps {
  isOpen: boolean;
  onClose: () => void;
  product: ShopProductDetail | null;
}

function getServiceIcon(text: string) {
  if (text.includes('包邮') || text.includes('发货') || text.includes('配送')) return Truck;
  if (text.includes('退') || text.includes('换')) return RotateCcw;
  if (text.includes('质保') || text.includes('保修') || text.includes('保障')) return ShieldCheck;
  return Package;
}

export const ProductServiceSheet = ({
  isOpen,
  onClose,
  product,
}: ProductServiceSheetProps) => {
  const serviceItems = buildShopProductServiceItems(product);

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="服务说明"
      maxHeight="60vh"
      footer={
        <div className="p-4">
          <button
            type="button"
            className="gradient-primary-r w-full rounded-full py-3 text-base font-medium text-white active:opacity-90"
            onClick={onClose}
          >
            我知道了
          </button>
        </div>
      }
    >
      <div className="p-4">
        {serviceItems.length > 0 ? (
          <div className="space-y-4">
            {serviceItems.map((item) => {
              const Icon = getServiceIcon(item);
              return (
                <div key={item} className="flex items-start space-x-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-start/10">
                    <Icon size={16} className="text-primary-start" />
                  </div>
                  <div className="flex-1 pt-1">
                    <span className="text-base text-text-main">{item}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-border-light bg-bg-base px-4 py-6 text-center text-sm text-text-sub">
            暂无服务说明
          </div>
        )}
      </div>
    </BottomSheet>
  );
};
