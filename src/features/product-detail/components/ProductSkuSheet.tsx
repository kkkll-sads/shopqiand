import { ChevronRight, MapPin, Minus, Plus, X } from 'lucide-react';
import type { AddressItem } from '../../../api/modules/address';
import type { ShopProductDetail } from '../../../api/modules/shopProduct';
import { Button } from '../../../components/ui/Button';
import type { ShopProductOptionGroup } from '../../shop-product/utils';
import {
  buildShopProductSelectedSummary,
  getShopProductPrimaryPrice,
  resolveShopProductImageUrl,
} from '../../shop-product/utils';
import type { SkuMode } from '../types';

interface ProductSkuSheetProps {
  addresses: AddressItem[];
  isOpen: boolean;
  mode: SkuMode;
  onAddToCart: () => void;
  onClose: () => void;
  onConfirm: () => void;
  onDecreaseQuantity: () => void;
  onIncreaseQuantity: () => void;
  onManageAddress: () => void;
  onSelectOption: (groupName: string, option: string) => void;
  optionGroups: ShopProductOptionGroup[];
  product: ShopProductDetail | null;
  quantity: number;
  selectedAddress: AddressItem | null;
  setSelectedAddress: (address: AddressItem) => void;
  selectedOptions: Record<string, string>;
}

export const ProductSkuSheet = ({
  addresses,
  isOpen,
  mode,
  onAddToCart,
  onClose,
  onConfirm,
  onDecreaseQuantity,
  onIncreaseQuantity,
  onManageAddress,
  onSelectOption,
  optionGroups,
  product,
  quantity,
  selectedAddress,
  setSelectedAddress,
  selectedOptions,
}: ProductSkuSheetProps) => {
  if (!isOpen || !product) {
    return null;
  }

  const otherAddresses = selectedAddress
    ? addresses.filter((address) => address.id !== selectedAddress.id)
    : addresses;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex max-h-[80vh] w-full flex-col rounded-t-[24px] bg-white dark:bg-gray-900">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-text-sub active:bg-bg-base"
        >
          <X size={20} />
        </button>

        <div className="flex space-x-4 border-b border-border-light p-4">
          <img
            src={resolveShopProductImageUrl(product.thumbnail)}
            alt={product.name}
            className="-mt-8 h-24 w-24 rounded-lg border border-border-light bg-white object-cover shadow-sm dark:bg-gray-900"
            referrerPolicy="no-referrer"
          />
          <div className="flex flex-col justify-end pb-1">
            <div className="mb-1 text-xl font-bold text-primary-start">
              {getShopProductPrimaryPrice(product)}
            </div>
            <span className="mb-1 text-sm text-text-sub">库存 {product.stock}</span>
            <span className="line-clamp-1 text-sm text-text-main">
              已选 {buildShopProductSelectedSummary(optionGroups, selectedOptions, quantity)}
            </span>
          </div>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-4">
          {mode !== 'cart' ? (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-md font-bold text-text-main">收货地址</h4>
                <button
                  type="button"
                  onClick={onManageAddress}
                  className="inline-flex items-center text-sm text-primary-start active:opacity-70"
                >
                  {selectedAddress ? '管理地址' : '新增地址'}
                  <ChevronRight size={14} className="ml-0.5" />
                </button>
              </div>

              {selectedAddress ? (
                <div className="rounded-2xl border border-primary-start/15 bg-gradient-to-r from-red-50 to-white p-3 shadow-[0_8px_24px_rgba(242,39,28,0.06)] dark:from-red-500/10 dark:to-gray-900">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="inline-flex rounded-full bg-primary-start px-2 py-0.5 text-xs font-medium text-white">当前收货地址</span>
                    {selectedAddress.is_default ? (
                      <span className="rounded-full border border-primary-start/20 bg-white px-2 py-0.5 text-xs text-primary-start dark:bg-gray-900">默认</span>
                    ) : null}
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-start/10 text-primary-start">
                      <MapPin size={15} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-text-main">{selectedAddress.name}</span>
                        <span className="text-sm text-text-main">{selectedAddress.phone}</span>
                      </div>
                      <div className="mt-1 text-sm leading-5 text-text-sub">
                        {selectedAddress.region} {selectedAddress.detail}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onManageAddress}
                  className="flex w-full items-center justify-between rounded-2xl border border-dashed border-border-light bg-bg-base p-4 text-left active:bg-bg-hover"
                >
                  <div>
                    <div className="text-sm font-medium text-text-main">请选择收货地址</div>
                    <div className="mt-1 text-sm text-text-sub">下单前需要先选择地址</div>
                  </div>
                  <ChevronRight size={16} className="text-text-aux" />
                </button>
              )}

              {otherAddresses.length > 0 ? (
                <div className="mt-3">
                  <div className="mb-2 text-xs font-medium tracking-wide text-text-aux">切换地址</div>
                  <div className="space-y-2">
                    {otherAddresses.map((address) => (
                      <button
                        key={address.id}
                        type="button"
                        onClick={() => setSelectedAddress(address)}
                        className="w-full rounded-2xl border border-border-light bg-white p-3 text-left transition-colors active:bg-bg-hover dark:bg-gray-900"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-text-main">{address.name}</span>
                          <span className="text-sm text-text-main">{address.phone}</span>
                          {address.is_default ? (
                            <span className="rounded bg-bg-base px-1.5 py-0.5 text-[11px] text-text-sub">默认</span>
                          ) : null}
                        </div>
                        <div className="mt-1 text-sm text-text-sub">
                          {address.region} {address.detail}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {optionGroups.length > 0 ? (
            optionGroups.map((group) => (
              <div key={group.name}>
                <h4 className="mb-3 text-md font-bold text-text-main">{group.name}</h4>
                <div className="flex flex-wrap gap-3">
                  {group.options.map((option) => (
                    <button
                      key={option}
                      onClick={() => onSelectOption(group.name, option)}
                      className={`rounded-full border px-4 py-1.5 text-base ${
                        selectedOptions[group.name] === option
                          ? 'border-primary-start bg-red-50 font-medium text-primary-start'
                          : 'border-transparent bg-bg-base text-text-main'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-xl bg-bg-base p-4 text-sm text-text-sub">
              当前商品暂无可选规格，直接选择数量即可。
            </div>
          )}

          <div className="flex items-center justify-between pb-4 pt-2">
            <h4 className="text-md font-bold text-text-main">数量</h4>
            <div className="flex items-center rounded-full border border-border-light bg-bg-base">
              <button
                className="flex h-8 w-8 items-center justify-center text-text-main disabled:text-text-aux"
                onClick={onDecreaseQuantity}
                disabled={quantity <= 1}
              >
                <Minus size={14} />
              </button>
              <div className="flex h-8 w-10 items-center justify-center border-x border-border-light bg-white text-base font-medium text-text-main dark:bg-gray-900">
                {quantity}
              </div>
              <button
                className="flex h-8 w-8 items-center justify-center text-text-main"
                onClick={onIncreaseQuantity}
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-border-light bg-white p-2 pb-safe dark:bg-gray-900">
          {mode === 'select' ? (
            <div className="flex space-x-2 px-2">
              <Button
                variant="outline"
                className="flex-1 rounded-full border-primary-start text-primary-start"
                onClick={onAddToCart}
              >
                加入购物车
              </Button>
              <Button className="flex-1 rounded-full" onClick={onConfirm}>
                立即购买
              </Button>
            </div>
          ) : (
            <div className="px-2">
              <Button
                className="w-full rounded-full"
                onClick={mode === 'cart' ? onAddToCart : onConfirm}
              >
                {mode === 'cart' ? '加入购物车' : '确认'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
