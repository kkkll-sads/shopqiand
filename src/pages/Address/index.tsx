import React, { useCallback, useRef, useState } from 'react';
import { ChevronLeft, WifiOff, Edit, Trash2, Check } from 'lucide-react';
import { addressApi, type AddressItem } from '../../api/modules/address';
import { getErrorMessage } from '../../api/core/errors';
import { useAppNavigate } from '../../lib/navigation';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { useRouteScrollRestoration } from '../../hooks/useRouteScrollRestoration';

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
  const { showToast } = useFeedback();

  const [view, setView] = useState<'list' | 'edit'>('list');
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [editingAddress, setEditingAddress] = useState<AddressItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(false);
  const [formData, setFormData] = useState<AddressForm>(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

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
      fetchData();
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
    } else {
      goBack();
    }
  };

  const handleEdit = (addr: AddressItem) => {
    listScrollTopRef.current = listScrollContainerRef.current?.scrollTop ?? 0;
    setEditingAddress(addr);
    setFormData({
      name: addr.name,
      phone: addr.phone,
      region: addr.region,
      detail: addr.detail,
      isDefault: addr.is_default,
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

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = '收货人姓名不能为空';
    if (!formData.phone.trim()) {
      errors.phone = '手机号不能为空';
    } else if (!/^1[3-9]\d{9}$/.test(formData.phone.trim())) {
      errors.phone = '手机号格式不正确';
    }
    if (!formData.detail.trim()) errors.detail = '详细地址不能为空';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || saving) return;

    setSaving(true);
    try {
      if (editingAddress) {
        await addressApi.edit({
          id: editingAddress.id,
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          region: formData.region.trim(),
          address: formData.detail.trim(),
          is_default: formData.isDefault,
        });
        showToast({ message: '修改成功', type: 'success' });
      } else {
        await addressApi.add({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          region: formData.region.trim(),
          address: formData.detail.trim(),
          is_default: formData.isDefault,
        });
        showToast({ message: '添加成功', type: 'success' });
      }
      setView('list');
      setEditingAddress(null);
      setFormData(emptyForm);
    } catch (err) {
      showToast({ message: getErrorMessage(err) || '保存失败', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingAddress || deleting) return;
    if (!window.confirm('确定删除该地址吗？')) return;

    setDeleting(true);
    try {
      await addressApi.delete(editingAddress.id);
      showToast({ message: '删除成功', type: 'success' });
      setView('list');
      setEditingAddress(null);
      setFormData(emptyForm);
    } catch (err) {
      showToast({ message: getErrorMessage(err) || '删除失败', type: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const handleSetDefault = async (addr: AddressItem) => {
    if (addr.is_default) return;
    try {
      await addressApi.setDefault(addr.id);
      showToast({ message: '已设为默认地址', type: 'success' });
      fetchData();
    } catch (err) {
      showToast({ message: getErrorMessage(err) || '设置失败', type: 'error' });
    }
  };

  const renderHeader = (title: string) => (
    <div className="bg-white dark:bg-gray-900 z-40 relative shrink-0 border-b border-border-light">
      <div className="h-12 flex items-center justify-between px-3 pt-safe">
        <div className="w-1/3">
          <button onClick={handleBack} className="p-1 -ml-1 text-text-main active:opacity-70">
            <ChevronLeft size={24} />
          </button>
        </div>
        <h1 className="text-xl font-bold text-text-main text-center w-1/3">{title}</h1>
        <div className="w-1/3" />
      </div>
    </div>
  );

  const renderSkeleton = () => (
    <div className="p-4 space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white dark:bg-gray-900 rounded-xl p-4 flex items-center shadow-sm animate-pulse">
          <div className="flex-1 space-y-3">
            <div className="flex items-center space-x-2">
              <div className="h-5 bg-gray-100 dark:bg-gray-800 rounded w-16" />
              <div className="h-5 bg-gray-100 dark:bg-gray-800 rounded w-24" />
            </div>
            <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-full" />
            <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );

  const renderList = () => {
    if (loading) return renderSkeleton();
    if (error) return <ErrorState onRetry={fetchData} message="加载失败" />;

    return (
      <div className="flex-1 flex flex-col relative h-full">
        <div
          ref={listScrollContainerRef}
          className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3 pb-24"
          onScroll={() => {
            listScrollTopRef.current = listScrollContainerRef.current?.scrollTop ?? 0;
          }}
        >
          {addresses.length === 0 ? (
            <EmptyState message="暂无收货地址" />
          ) : (
            addresses.map((addr) => (
              <div
                key={addr.id}
                className="bg-white dark:bg-gray-900 rounded-xl p-4 flex items-center shadow-sm active:bg-gray-50 dark:bg-gray-800 transition-colors"
              >
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center mb-2">
                    <span className="text-xl font-bold text-text-main mr-2 truncate max-w-[100px]">
                      {addr.name}
                    </span>
                    <span className="text-md text-text-sub font-medium">{addr.phone}</span>
                    {addr.is_default && (
                      <span className="ml-2 px-1.5 py-0.5 rounded text-xs font-medium bg-red-50 text-primary-start shrink-0">
                        默认
                      </span>
                    )}
                  </div>
                  <div className="text-base text-text-main leading-relaxed line-clamp-2">
                    {addr.region} {addr.detail}
                  </div>
                  {!addr.is_default && (
                    <button
                      onClick={() => handleSetDefault(addr)}
                      className="mt-2 text-sm text-primary-start flex items-center"
                    >
                      <Check size={14} className="mr-1" />
                      设为默认
                    </button>
                  )}
                </div>
                <div className="w-px h-8 bg-border-light shrink-0" />
                <button
                  onClick={() => handleEdit(addr)}
                  className="pl-4 py-2 text-text-sub active:text-text-main shrink-0"
                >
                  <Edit size={18} />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-900 border-t border-border-light pb-safe">
          <button
            onClick={handleAdd}
            className="w-full h-11 rounded-full bg-gradient-to-r from-primary-start to-primary-end text-white text-lg font-medium shadow-sm active:opacity-80"
          >
            新增收货地址
          </button>
        </div>
      </div>
    );
  };

  const isFormValid =
    formData.name.trim() &&
    formData.phone.trim() &&
    /^1[3-9]\d{9}$/.test(formData.phone.trim()) &&
    formData.detail.trim();

  const renderEdit = () => (
    <div className="flex-1 flex flex-col relative h-full bg-bg-base">
      <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
        <div className="bg-white dark:bg-gray-900 mt-2 px-4">
          <div className="flex items-center py-4 border-b border-border-light">
            <div className="w-20 text-lg text-text-main shrink-0">收货人</div>
            <input
              type="text"
              placeholder="名字"
              className="flex-1 text-lg text-text-main placeholder:text-text-aux outline-none bg-transparent"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
              }}
            />
          </div>
          {formErrors.name && (
            <div className="text-s text-primary-start pt-1 pb-2">{formErrors.name}</div>
          )}

          <div className="flex items-center py-4 border-b border-border-light">
            <div className="w-20 text-lg text-text-main shrink-0">手机号码</div>
            <input
              type="tel"
              placeholder="手机号"
              maxLength={11}
              className="flex-1 text-lg text-text-main placeholder:text-text-aux outline-none bg-transparent"
              value={formData.phone}
              onChange={(e) => {
                setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') });
                if (formErrors.phone) setFormErrors({ ...formErrors, phone: '' });
              }}
            />
          </div>
          {formErrors.phone && (
            <div className="text-s text-primary-start pt-1 pb-2">{formErrors.phone}</div>
          )}

          <div className="flex items-center py-4 border-b border-border-light">
            <div className="w-20 text-lg text-text-main shrink-0">所在地区</div>
            <input
              type="text"
              placeholder="省市区县、乡镇等"
              className="flex-1 text-lg text-text-main placeholder:text-text-aux outline-none bg-transparent"
              value={formData.region}
              onChange={(e) => {
                setFormData({ ...formData, region: e.target.value });
                if (formErrors.region) setFormErrors({ ...formErrors, region: '' });
              }}
            />
          </div>
          {formErrors.region && (
            <div className="text-s text-primary-start pt-1 pb-2">{formErrors.region}</div>
          )}

          <div className="flex items-start py-4 border-b border-border-light">
            <div className="w-20 text-lg text-text-main shrink-0 pt-0.5">详细地址</div>
            <textarea
              placeholder="小区楼栋/乡村名称"
              className="flex-1 text-lg text-text-main placeholder:text-text-aux outline-none bg-transparent resize-none h-16"
              value={formData.detail}
              onChange={(e) => {
                setFormData({ ...formData, detail: e.target.value });
                if (formErrors.detail) setFormErrors({ ...formErrors, detail: '' });
              }}
            />
          </div>
          {formErrors.detail && (
            <div className="text-s text-primary-start pt-1 pb-2">{formErrors.detail}</div>
          )}

          <div className="flex items-center justify-between py-4">
            <div className="text-lg text-text-main">设为默认收货地址</div>
            <button
              type="button"
              className={`w-12 h-6 rounded-full transition-colors relative ${
                formData.isDefault ? 'bg-primary-start' : 'bg-gray-200 dark:bg-gray-800'
              }`}
              onClick={() => setFormData({ ...formData, isDefault: !formData.isDefault })}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white dark:bg-gray-900 shadow-sm transition-transform ${
                  formData.isDefault ? 'left-[26px]' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          {editingAddress && (
            <div className="py-4 border-t border-border-light">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="w-full h-11 rounded-full border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 flex items-center justify-center gap-2 active:opacity-80 disabled:opacity-50"
              >
                <Trash2 size={18} />
                {deleting ? '删除中...' : '删除地址'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-900 border-t border-border-light pb-safe">
        <button
          onClick={handleSave}
          disabled={!isFormValid || saving}
          className={`w-full h-11 rounded-full text-lg font-medium shadow-sm transition-all ${
            isFormValid && !saving
              ? 'bg-gradient-to-r from-primary-start to-primary-end text-white active:opacity-80'
              : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
          }`}
        >
          {saving ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col bg-bg-base relative h-full overflow-hidden">
      {renderHeader(view === 'list' ? '地址管理' : editingAddress ? '编辑收货地址' : '新增收货地址')}
      {view === 'list' ? renderList() : renderEdit()}
    </div>
  );
};
