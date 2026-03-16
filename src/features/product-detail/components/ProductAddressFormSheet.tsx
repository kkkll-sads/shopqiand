import { ChevronRight, Trash2, X } from 'lucide-react';
import { BottomSheet } from '../../../components/ui/BottomSheet';
import { Button } from '../../../components/ui/Button';

export interface ProductAddressFormValue {
  name: string;
  phone: string;
  region: string;
  detail: string;
  isDefault: boolean;
}

interface ProductAddressFormSheetProps {
  editingAddressName?: string;
  errors: Partial<Record<keyof ProductAddressFormValue, string>>;
  isOpen: boolean;
  isEditing?: boolean;
  isDeleting?: boolean;
  isSaving: boolean;
  onChange: (patch: Partial<ProductAddressFormValue>) => void;
  onClose: () => void;
  onDelete?: () => void;
  onOpenRegionPicker: () => void;
  onSubmit: () => void;
  value: ProductAddressFormValue;
}

export const ProductAddressFormSheet = ({
  editingAddressName,
  errors,
  isOpen,
  isEditing = false,
  isDeleting = false,
  isSaving,
  onChange,
  onClose,
  onDelete,
  onOpenRegionPicker,
  onSubmit,
  value,
}: ProductAddressFormSheetProps) => {
  const isFormValid =
    value.name.trim() &&
    /^1[3-9]\d{9}$/.test(value.phone.trim()) &&
    value.region.trim() &&
    value.detail.trim();

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      zIndex={70}
      title={isEditing ? '编辑收货地址' : '新增收货地址'}
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
          <Button className="w-full rounded-full" disabled={!isFormValid || isSaving} onClick={onSubmit}>
            {isSaving ? '保存中...' : isEditing ? '保存修改' : '保存并使用'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4 px-4 py-4">
        <div className="rounded-xl bg-bg-base px-3 py-2 text-sm text-text-sub">
          {isEditing ? `正在修改 ${editingAddressName || '当前'} 地址信息` : '下单前先补充收货信息'}
        </div>

        <div>
          <div className="mb-2 text-sm font-medium text-text-main">收货人</div>
          <input
            type="text"
            placeholder="名字"
            value={value.name}
            onChange={(event) => onChange({ name: event.target.value })}
            className="h-11 w-full rounded-2xl border border-border-light bg-bg-base px-4 text-lg text-text-main outline-none placeholder:text-text-aux"
          />
          {errors.name ? <div className="mt-1 text-xs text-primary-start">{errors.name}</div> : null}
        </div>

        <div>
          <div className="mb-2 text-sm font-medium text-text-main">手机号</div>
          <input
            type="tel"
            placeholder="手机号"
            maxLength={11}
            value={value.phone}
            onChange={(event) => onChange({ phone: event.target.value.replace(/\D/g, '') })}
            className="h-11 w-full rounded-2xl border border-border-light bg-bg-base px-4 text-lg text-text-main outline-none placeholder:text-text-aux"
          />
          {errors.phone ? <div className="mt-1 text-xs text-primary-start">{errors.phone}</div> : null}
        </div>

        <div>
          <div className="mb-2 text-sm font-medium text-text-main">所在地区</div>
          <button
            type="button"
            onClick={onOpenRegionPicker}
            className="flex h-11 w-full items-center rounded-2xl border border-border-light bg-bg-base px-4 text-left"
          >
            <div className={`flex-1 text-base ${value.region ? 'text-text-main' : 'text-text-aux'}`}>
              {value.region || '请选择省 / 市 / 区'}
            </div>
            <ChevronRight size={18} className="text-text-aux" />
          </button>
          {errors.region ? <div className="mt-1 text-xs text-primary-start">{errors.region}</div> : null}
        </div>

        <div>
          <div className="mb-2 text-sm font-medium text-text-main">详细地址</div>
          <textarea
            placeholder="小区楼栋 / 门牌号"
            value={value.detail}
            onChange={(event) => onChange({ detail: event.target.value })}
            className="h-20 w-full resize-none rounded-2xl border border-border-light bg-bg-base px-4 py-3 text-lg text-text-main outline-none placeholder:text-text-aux"
          />
          {errors.detail ? <div className="mt-1 text-xs text-primary-start">{errors.detail}</div> : null}
        </div>

        <button
          type="button"
          onClick={() => onChange({ isDefault: !value.isDefault })}
          className="flex w-full items-center justify-between rounded-2xl border border-border-light bg-bg-base px-4 py-3"
        >
          <div>
            <div className="text-sm font-medium text-text-main">设为默认地址</div>
            <div className="mt-1 text-xs text-text-sub">后续下单自动带出</div>
          </div>
          <div
            className={`relative h-6 w-12 rounded-full transition-colors ${
              value.isDefault ? 'bg-primary-start' : 'bg-gray-200 dark:bg-gray-800'
            }`}
          >
            <div
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform dark:bg-gray-900 ${
                value.isDefault ? 'left-[26px]' : 'left-0.5'
              }`}
            />
          </div>
        </button>

        {isEditing && onDelete ? (
          <Button
            variant="outline"
            className="rounded-full border-red-200 text-red-600 dark:border-red-900/50 dark:text-red-400"
            disabled={isDeleting}
            leftIcon={<Trash2 size={16} />}
            onClick={onDelete}
          >
            {isDeleting ? '删除中...' : '删除地址'}
          </Button>
        ) : null}
      </div>
    </BottomSheet>
  );
};
