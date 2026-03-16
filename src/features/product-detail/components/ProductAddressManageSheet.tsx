import { Check, ChevronRight, Edit3, MapPin, Plus, X } from 'lucide-react';
import type { AddressItem } from '../../../api/modules/address';
import { BottomSheet } from '../../../components/ui/BottomSheet';
import { Button } from '../../../components/ui/Button';

interface ProductAddressManageSheetProps {
  addresses: AddressItem[];
  isOpen: boolean;
  isSettingDefault?: boolean;
  onAdd: () => void;
  onClose: () => void;
  onEdit: (address: AddressItem) => void;
  onSelect: (address: AddressItem) => void;
  onSetDefault: (address: AddressItem) => void;
  selectedAddress: AddressItem | null;
}

export const ProductAddressManageSheet = ({
  addresses,
  isOpen,
  isSettingDefault = false,
  onAdd,
  onClose,
  onEdit,
  onSelect,
  onSetDefault,
  selectedAddress,
}: ProductAddressManageSheetProps) => {
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="管理地址"
      zIndex={65}
      headerLeft={null}
      headerRight={
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-1 text-text-sub active:bg-bg-base"
        >
          <X size={20} />
        </button>
      }
      footer={
        <div className="bg-white p-4 dark:bg-gray-900">
          <Button className="rounded-full" leftIcon={<Plus size={16} />} onClick={onAdd}>
            新增收货地址
          </Button>
        </div>
      }
    >
      <div className="space-y-3 px-4 py-4">
        <div className="rounded-xl bg-bg-base px-3 py-2 text-sm text-text-sub">
          当前页可直接切换、新增和编辑收货地址
        </div>

        {addresses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border-light bg-bg-base px-4 py-8 text-center">
            <div className="text-base font-medium text-text-main">暂无收货地址</div>
            <div className="mt-2 text-sm text-text-sub">先新增一个地址再继续下单</div>
          </div>
        ) : (
          addresses.map((address) => {
            const isSelected = selectedAddress?.id === address.id;
            return (
              <div
                key={address.id}
                className={`rounded-2xl border p-4 transition-colors ${
                  isSelected
                    ? 'border-primary-start bg-red-50/70 dark:bg-red-500/10'
                    : 'border-border-light bg-white dark:bg-gray-900'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => onSelect(address)}
                    className="flex min-w-0 flex-1 items-start gap-3 text-left"
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-start/10 text-primary-start">
                      <MapPin size={15} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-text-main">{address.name}</span>
                        <span className="text-sm text-text-main">{address.phone}</span>
                        {address.is_default ? (
                          <span className="rounded-full border border-primary-start/20 bg-white px-2 py-0.5 text-xs text-primary-start dark:bg-gray-900">
                            默认
                          </span>
                        ) : null}
                        {isSelected ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary-start px-2 py-0.5 text-xs text-white">
                            <Check size={12} />
                            当前使用
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-1 text-sm leading-5 text-text-sub">
                        {address.region} {address.detail}
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onEdit(address)}
                    className="shrink-0 rounded-full border border-border-light p-2 text-text-sub active:bg-bg-base"
                  >
                    <Edit3 size={16} />
                  </button>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <button
                    type="button"
                    disabled={address.is_default || isSettingDefault}
                    onClick={() => onSetDefault(address)}
                    className={`text-sm ${
                      address.is_default
                        ? 'text-text-aux'
                        : 'text-primary-start active:opacity-70'
                    }`}
                  >
                    {address.is_default ? '已是默认地址' : isSettingDefault ? '设置中...' : '设为默认'}
                  </button>
                  {!isSelected ? (
                    <button
                      type="button"
                      onClick={() => onSelect(address)}
                      className="inline-flex items-center text-sm text-text-sub active:opacity-70"
                    >
                      切换到此地址
                      <ChevronRight size={14} className="ml-0.5" />
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>
    </BottomSheet>
  );
};
