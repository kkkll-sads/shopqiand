import React, { useCallback, useRef, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Edit, Trash2 } from 'lucide-react';
import { addressApi, type AddressItem } from '../../api/modules/address';
import { getErrorMessage } from '../../api/core/errors';
import { RegionPickerSheet } from '../../components/biz/RegionPickerSheet';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { useRouteScrollRestoration } from '../../hooks/useRouteScrollRestoration';
import { useAppNavigate } from '../../lib/navigation';

interface AddressForm {
  name: string;
  phone: string;
  region: string;
  detail: string;
  isDefault: boolean;
}

const emptyForm: AddressForm = {
  name: '',
  phone: '',
  region: '',
  detail: '',
  isDefault: false,
};

export const AddressPage = () => {
  const { goBack } = useAppNavigate();
  const { showConfirm, showToast } = useFeedback();

  const [view, setView] = useState<'list' | 'edit'>('list');
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [editingAddress, setEditingAddress] = useState<AddressItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(false);
  const [formData, setFormData] = useState<AddressForm>(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showRegionPicker, setShowRegionPicker] = useState(false);

  const listScrollContainerRef = useRef<HTMLDivElement>(null);
  const listScrollTopRef = useRef(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const list = await addressApi.list();
      setAddresses(list);
    } catch (err) {
      setError(true);
      showToast({ message: getErrorMessage(err) || '加载失败', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  React.useEffect(() => {
    if (view === 'list') {
      void fetchData();
    }
  }, [view, fetchData]);

  useRouteScrollRestoration({
    containerRef: listScrollContainerRef,
    enabled: view === 'list',
    namespace: 'address-page',
    restoreDeps: [addresses.length, error, loading, view],
    restoreWhen: view === 'list' && !loading && !error,
  });

  const handleBack = () => {
    if (view === 'edit') {
      setView('list');
      setEditingAddress(null);
      setFormData(emptyForm);
      setFormErrors({});
      setShowRegionPicker(false);
      return;
    }

    goBack();
  };

  const handleEdit = (address: AddressItem) => {
    listScrollTopRef.current = listScrollContainerRef.current?.scrollTop ?? 0;
    setEditingAddress(address);
    setFormData({
      name: address.name,
      phone: address.phone,
      region: address.region,
      detail: address.detail,
      isDefault: address.is_default,
    });
    setFormErrors({});
    setView('edit');
  };

  const handleAdd = () => {
    listScrollTopRef.current = listScrollContainerRef.current?.scrollTop ?? 0;
    setEditingAddress(null);
    setFormData({ ...emptyForm });
    setFormErrors({});
    setView('edit');
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = '收货人姓名不能为空';
    }

    if (!formData.phone.trim()) {
      errors.phone = '手机号不能为空';
    } else if (!/^1[3-9]\d{9}$/.test(formData.phone.trim())) {
      errors.phone = '手机号格式不正确';
    }

    if (!formData.region.trim()) {
      errors.region = '所在地区不能为空';
    }

    if (!formData.detail.trim()) {
      errors.detail = '详细地址不能为空';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || saving) {
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        region: formData.region.trim(),
        address: formData.detail.trim(),
        is_default: formData.isDefault,
      };

      if (editingAddress) {
        await addressApi.edit({
          id: editingAddress.id,
          ...payload,
        });
        showToast({ message: '修改成功', type: 'success' });
      } else {
        await addressApi.add(payload);
        showToast({ message: '添加成功', type: 'success' });
      }

      setView('list');
      setEditingAddress(null);
      setFormData(emptyForm);
      setShowRegionPicker(false);
    } catch (err) {
      showToast({ message: getErrorMessage(err) || '保存失败', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingAddress || deleting) {
      return;
    }

    const confirmed = await showConfirm({
      title: '删除地址',
      message: '确定要删除这条收货地址吗？',
      confirmText: '确认删除',
      cancelText: '取消',
      danger: true,
    });

    if (!confirmed) {
      return;
    }

    setDeleting(true);
    try {
      await addressApi.delete(editingAddress.id);
      showToast({ message: '删除成功', type: 'success' });
      setView('list');
      setEditingAddress(null);
      setFormData(emptyForm);
      setShowRegionPicker(false);
    } catch (err) {
      showToast({ message: getErrorMessage(err) || '删除失败', type: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const handleSetDefault = async (address: AddressItem) => {
    if (address.is_default) {
      return;
    }

    try {
      await addressApi.setDefault(address.id);
      showToast({ message: '已设为默认地址', type: 'success' });
      void fetchData();
    } catch (err) {
      showToast({ message: getErrorMessage(err) || '设置失败', type: 'error' });
    }
  };

  const renderHeader = (title: string) => (
    <div className="relative z-40 shrink-0 border-b border-border-light bg-white dark:bg-gray-900">
      <div className="flex h-12 items-center justify-between px-3 pt-safe">
        <div className="w-1/3">
          <button type="button" onClick={handleBack} className="p-1 -ml-1 text-text-main active:opacity-70">
            <ChevronLeft size={24} />
          </button>
        </div>
        <h1 className="w-1/3 text-center text-xl font-bold text-text-main">{title}</h1>
        <div className="w-1/3" />
      </div>
    </div>
  );

  const renderSkeleton = () => (
    <div className="space-y-3 p-4">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="flex items-center rounded-xl bg-white p-4 shadow-sm animate-pulse dark:bg-gray-900"
        >
          <div className="flex-1 space-y-3">
            <div className="flex items-center space-x-2">
              <div className="h-5 w-16 rounded bg-gray-100 dark:bg-gray-800" />
              <div className="h-5 w-24 rounded bg-gray-100 dark:bg-gray-800" />
            </div>
            <div className="h-4 w-full rounded bg-gray-100 dark:bg-gray-800" />
            <div className="h-4 w-2/3 rounded bg-gray-100 dark:bg-gray-800" />
          </div>
        </div>
      ))}
    </div>
  );

  const renderList = () => {
    if (loading) {
      return renderSkeleton();
    }

    if (error) {
      return <ErrorState onRetry={fetchData} message="加载失败" />;
    }

    return (
      <div className="relative flex h-full flex-1 flex-col">
        <div
          ref={listScrollContainerRef}
          className="flex-1 space-y-3 overflow-y-auto p-4 pb-24 no-scrollbar"
          onScroll={() => {
            listScrollTopRef.current = listScrollContainerRef.current?.scrollTop ?? 0;
          }}
        >
          {addresses.length === 0 ? (
            <EmptyState message="暂无收货地址" />
          ) : (
            addresses.map((address) => (
              <div
                key={address.id}
                className="flex items-center rounded-xl bg-white p-4 shadow-sm transition-colors active:bg-gray-50 dark:bg-gray-900 dark:active:bg-gray-800"
              >
                <div className="min-w-0 flex-1 pr-4">
                  <div className="mb-2 flex items-center">
                    <span className="mr-2 max-w-[100px] truncate text-xl font-bold text-text-main">
                      {address.name}
                    </span>
                    <span className="text-md font-medium text-text-sub">{address.phone}</span>
                    {address.is_default ? (
                      <span className="ml-2 shrink-0 rounded bg-red-50 px-1.5 py-0.5 text-xs font-medium text-primary-start dark:bg-red-500/10">
                        默认
                      </span>
                    ) : null}
                  </div>
                  <div className="line-clamp-2 text-base leading-relaxed text-text-main">
                    {address.region} {address.detail}
                  </div>
                  {!address.is_default ? (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(address)}
                      className="mt-2 flex items-center text-sm text-primary-start"
                    >
                      <Check size={14} className="mr-1" />
                      设为默认
                    </button>
                  ) : null}
                </div>
                <div className="h-8 w-px shrink-0 bg-border-light" />
                <button
                  type="button"
                  onClick={() => handleEdit(address)}
                  className="shrink-0 py-2 pl-4 text-text-sub active:text-text-main"
                >
                  <Edit size={18} />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 border-t border-border-light bg-white p-4 pb-safe dark:bg-gray-900">
          <button
            type="button"
            onClick={handleAdd}
            className="h-11 w-full rounded-full bg-gradient-to-r from-primary-start to-primary-end text-lg font-medium text-white shadow-sm active:opacity-80"
          >
            新增收货地址
          </button>
        </div>
      </div>
    );
  };

  const isFormValid =
    !!formData.name.trim() &&
    !!formData.phone.trim() &&
    /^1[3-9]\d{9}$/.test(formData.phone.trim()) &&
    !!formData.region.trim() &&
    !!formData.detail.trim();

  const renderEdit = () => (
    <div className="relative flex h-full flex-1 flex-col bg-bg-base">
      <div className="flex-1 overflow-y-auto pb-24 no-scrollbar">
        <div className="mt-2 bg-white px-4 dark:bg-gray-900">
          <div className="flex items-center border-b border-border-light py-4">
            <div className="w-20 shrink-0 text-lg text-text-main">收货人</div>
            <input
              type="text"
              placeholder="姓名"
              className="flex-1 bg-transparent text-lg text-text-main outline-none placeholder:text-text-aux"
              value={formData.name}
              onChange={(event) => {
                setFormData({ ...formData, name: event.target.value });
                if (formErrors.name) {
                  setFormErrors({ ...formErrors, name: '' });
                }
              }}
            />
          </div>
          {formErrors.name ? (
            <div className="pb-2 pt-1 text-s text-primary-start">{formErrors.name}</div>
          ) : null}

          <div className="flex items-center border-b border-border-light py-4">
            <div className="w-20 shrink-0 text-lg text-text-main">手机号</div>
            <input
              type="tel"
              placeholder="手机号"
              maxLength={11}
              className="flex-1 bg-transparent text-lg text-text-main outline-none placeholder:text-text-aux"
              value={formData.phone}
              onChange={(event) => {
                setFormData({ ...formData, phone: event.target.value.replace(/\D/g, '') });
                if (formErrors.phone) {
                  setFormErrors({ ...formErrors, phone: '' });
                }
              }}
            />
          </div>
          {formErrors.phone ? (
            <div className="pb-2 pt-1 text-s text-primary-start">{formErrors.phone}</div>
          ) : null}

          <button
            type="button"
            onClick={() => setShowRegionPicker(true)}
            className="flex w-full items-center border-b border-border-light py-4 text-left"
          >
            <div className="w-20 shrink-0 text-lg text-text-main">所在地区</div>
            <div className={`flex-1 text-lg ${formData.region ? 'text-text-main' : 'text-text-aux'}`}>
              {formData.region || '请选择省 / 市 / 区'}
            </div>
            <ChevronRight size={18} className="text-text-aux" />
          </button>
          {formErrors.region ? (
            <div className="pb-2 pt-1 text-s text-primary-start">{formErrors.region}</div>
          ) : null}

          <div className="flex items-start border-b border-border-light py-4">
            <div className="w-20 shrink-0 pt-0.5 text-lg text-text-main">详细地址</div>
            <textarea
              placeholder="小区楼栋 / 门牌号"
              className="h-16 flex-1 resize-none bg-transparent text-lg text-text-main outline-none placeholder:text-text-aux"
              value={formData.detail}
              onChange={(event) => {
                setFormData({ ...formData, detail: event.target.value });
                if (formErrors.detail) {
                  setFormErrors({ ...formErrors, detail: '' });
                }
              }}
            />
          </div>
          {formErrors.detail ? (
            <div className="pb-2 pt-1 text-s text-primary-start">{formErrors.detail}</div>
          ) : null}

          <div className="flex items-center justify-between py-4">
            <div className="text-lg text-text-main">设为默认收货地址</div>
            <button
              type="button"
              className={`relative h-6 w-12 rounded-full transition-colors ${
                formData.isDefault ? 'bg-primary-start' : 'bg-gray-200 dark:bg-gray-800'
              }`}
              onClick={() => setFormData({ ...formData, isDefault: !formData.isDefault })}
            >
              <div
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform dark:bg-gray-900 ${
                  formData.isDefault ? 'left-[26px]' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          {editingAddress ? (
            <div className="border-t border-border-light py-4">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-red-200 text-red-600 active:opacity-80 disabled:opacity-50 dark:border-red-900/50 dark:text-red-400"
              >
                <Trash2 size={18} />
                {deleting ? '删除中...' : '删除地址'}
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 border-t border-border-light bg-white p-4 pb-safe dark:bg-gray-900">
        <button
          type="button"
          onClick={handleSave}
          disabled={!isFormValid || saving}
          className={`h-11 w-full rounded-full text-lg font-medium shadow-sm transition-all ${
            isFormValid && !saving
              ? 'bg-gradient-to-r from-primary-start to-primary-end text-white active:opacity-80'
              : 'cursor-not-allowed bg-gray-200 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
          }`}
        >
          {saving ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="relative flex h-full flex-1 flex-col overflow-hidden bg-bg-base">
      {renderHeader(view === 'list' ? '地址管理' : editingAddress ? '编辑收货地址' : '新增收货地址')}
      {view === 'list' ? renderList() : renderEdit()}
      <RegionPickerSheet
        isOpen={showRegionPicker}
        value={formData.region}
        onCancel={() => setShowRegionPicker(false)}
        onConfirm={(region) => {
          setFormData((prev) => ({ ...prev, region }));
          if (formErrors.region) {
            setFormErrors((prev) => ({ ...prev, region: '' }));
          }
          setShowRegionPicker(false);
        }}
      />
    </div>
  );
};

export default AddressPage;
