

import React, { useEffect, useState } from 'react';
import { Plus, MapPin, Pencil, Trash2 } from 'lucide-react';
import SubPageLayout from '../../components/SubPageLayout';
import { LoadingSpinner, EmptyState, RegionPicker } from '../../components/common';
import { isValidPhone } from '../../utils/validation';
import {
  AUTH_TOKEN_KEY,
  AddressItem,
  deleteAddress,
  fetchAddressList,
  saveAddress,
} from '../../services/api';
import { useNotification } from '../../context/NotificationContext';

interface AddressListProps {
  onBack: () => void;
}

type AddressFormValues = {
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  address: string;
  /** 是否默认地址 */
  is_default: boolean;
};

const createInitialFormValues = (): AddressFormValues => ({
  name: '',
  phone: '',
  province: '',
  city: '',
  district: '',
  address: '',
  is_default: false,
});

const AddressList: React.FC<AddressListProps> = ({ onBack }) => {
  const { showToast, showDialog } = useNotification();
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list');
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [formValues, setFormValues] = useState<AddressFormValues>(() =>
    createInitialFormValues(),
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState<boolean>(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [showRegionPicker, setShowRegionPicker] = useState(false);

  const loadAddresses = async () => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY) || '';
    if (!token) {
      setError('未检测到登录信息，请重新登录后再查看地址列表');
      return;
    }

    setLoading(true);
    try {
      const res = await fetchAddressList(token);
      if (res.code === 1 && res.data?.list) {
        setAddresses(res.data.list);
        setError(null);
      } else {
        setError(res.msg || '获取地址列表失败');
      }
    } catch (e: any) {
      // 优先使用接口返回的错误消息
      setError(e?.msg || e?.response?.msg || e?.message || '获取地址列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const handleDelete = async (id?: number | string) => {
    if (id === undefined || id === null || id === '') return;

    showDialog({
      title: '删除地址',
      description: '确定要删除该收货地址吗？此操作无法撤销。',
      confirmText: '删除',
      cancelText: '取消',
      onConfirm: async () => {
        try {
          const res = await deleteAddress({ id });
          showToast('success', res?.msg || '删除成功');
          // 删除成功后刷新列表
          loadAddresses();
        } catch (e: any) {
          // 优先使用接口返回的错误消息
          const errorMsg = e?.msg || e?.response?.msg || e?.message || '删除收货地址失败';
          showToast('error', '删除失败', errorMsg);
        }
      }
    });
  };

  const handleSetDefault = async (addr: AddressItem) => {
    if (isDefault(addr)) return;

    setLoading(true);
    try {
      const res = await saveAddress({
        id: addr.id,
        name: addr.name,
        phone: addr.phone,
        province: addr.province,
        city: addr.city,
        district: addr.district,
        address: addr.address,
        is_default: 1,
      });

      if (res.code === 1) {
        await loadAddresses();
      } else {
        setError(res.msg || '设置默认地址失败');
      }
    } catch (e: any) {
      setError(e?.msg || e?.response?.msg || e?.message || '设置默认地址失败');
    } finally {
      setLoading(false);
    }
  };

  const handleFormInputChange = (
    field: keyof AddressFormValues,
    value: string | boolean,
  ) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setFormValues(createInitialFormValues());
    setFormError(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);
    setNotice(null);

    const { name, phone, province, city, district, address, is_default } =
      formValues;

    if (!name.trim()) return setFormError('请输入收货人姓名');
    if (!phone.trim()) return setFormError('请输入手机号');
    if (!province.trim() || !city.trim()) {
      return setFormError('请输入完整的省市信息');
    }
    if (!address.trim()) return setFormError('请输入详细地址');

    setFormLoading(true);
    try {
      const payloadId =
        mode === 'edit' && editingId !== null && editingId !== ''
          ? editingId
          : undefined;

      const res = await saveAddress({
        id: payloadId as any,
        name: name.trim(),
        phone: phone.trim(),
        province: province.trim(),
        city: city.trim(),
        district: district.trim(),
        address: address.trim(),
        is_default: is_default ? 1 : 0,
      });

      if (res.code === 1) {
        setNotice(mode === 'edit' ? '地址已更新' : '新增地址成功');
        resetForm();
        setMode('list');
        setEditingId(null);
        await loadAddresses();
      } else {
        setFormError(res.msg || '保存地址失败，请检查填写信息');
      }
    } catch (e: any) {
      // 优先使用接口返回的错误消息
      setFormError(e?.msg || e?.response?.msg || e?.message || '保存地址失败，请稍后重试');
    } finally {
      setFormLoading(false);
    }
  };

  const formatFullAddress = (addr: AddressItem) => {
    const parts = [
      addr.province,
      addr.city,
      addr.district,
      addr.address,
    ].filter(Boolean);
    return parts.join(' ');
  };

  const isDefault = (addr: AddressItem) =>
    ['1', 1, true, 'true'].includes(addr.is_default);

  return (
    <SubPageLayout
      title={
        mode === 'add'
          ? '新增收货地址'
          : mode === 'edit'
            ? '编辑收货地址'
            : '收货地址'
      }
      onBack={() => {
        if (mode === 'add' || mode === 'edit') {
          resetForm();
          setMode('list');
          setEditingId(null);
        } else {
          onBack();
        }
      }}
    >
      <div className="p-4 space-y-4 pb-24">
        {notice && mode === 'list' && (
          <div className="bg-green-50 text-green-600 text-xs px-3 py-2 rounded-lg">
            {notice}
          </div>
        )}

        {(mode === 'add' || mode === 'edit') && (
          <form
            className="bg-white rounded-2xl p-6 shadow-xl shadow-orange-100/50 space-y-4 border border-orange-50"
            onSubmit={handleSubmit}
          >
            <div className="text-base font-bold text-gray-900 mb-3">
              {mode === 'edit' ? '编辑收货地址' : '新增收货地址'}
            </div>

            <label className="text-sm text-gray-700 flex flex-col gap-2">
              <span className="font-medium">收货人姓名 <span className="text-red-500">*</span></span>
              <input
                className="border-2 border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition-all placeholder:text-gray-400"
                type="text"
                placeholder="请输入收货人姓名"
                value={formValues.name}
                onChange={(e) =>
                  handleFormInputChange('name', e.target.value)
                }
              />
            </label>

            <label className="text-sm text-gray-700 flex flex-col gap-2">
              <span className="font-medium">手机号 <span className="text-red-500">*</span></span>
              <input
                className="border-2 border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition-all placeholder:text-gray-400"
                type="tel"
                placeholder="请输入手机号"
                value={formValues.phone}
                onChange={(e) =>
                  handleFormInputChange('phone', e.target.value)
                }
              />
            </label>

            {/* 省市区选择 */}
            <div className="space-y-2">
              <span className="text-sm text-gray-700 font-medium">省份 / 城市 <span className="text-red-500">*</span></span>
              <div
                className="border-2 border-gray-200 rounded-xl px-4 py-4 flex items-center justify-between hover:border-orange-300 active:bg-orange-50/30 transition-all cursor-pointer bg-gray-50/50 focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-500"
                onClick={() => setShowRegionPicker(true)}
              >
                <div className="flex-1">
                  <div className={`text-sm ${formValues.province ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                    {formValues.province && formValues.city
                      ? `${formValues.province} ${formValues.city}`
                      : '点击选择省市'
                    }
                  </div>
                </div>
                <div className="text-orange-500">
                  <MapPin size={20} />
                </div>
              </div>
            </div>

            <label className="text-sm text-gray-700 flex flex-col gap-2">
              <span className="font-medium">区 / 县（选填）</span>
              <input
                className="border-2 border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition-all placeholder:text-gray-400"
                type="text"
                placeholder="如：西湖区"
                value={formValues.district}
                onChange={(e) =>
                  handleFormInputChange('district', e.target.value)
                }
              />
            </label>

            <label className="text-sm text-gray-700 flex flex-col gap-2">
              <span className="font-medium">详细地址 <span className="text-red-500">*</span></span>
              <textarea
                className="border-2 border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 resize-none min-h-[96px] focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition-all placeholder:text-gray-400"
                placeholder="街道、小区、楼栋、门牌号等"
                value={formValues.address}
                onChange={(e) =>
                  handleFormInputChange('address', e.target.value)
                }
              />
            </label>

            <label className="flex items-center justify-between text-xs text-gray-600 mt-1">
              <span className="mr-3">设为默认地址</span>
              <input
                type="checkbox"
                className="w-4 h-4 accent-orange-500"
                checked={formValues.is_default}
                onChange={(e) =>
                  handleFormInputChange('is_default', e.target.checked)
                }
              />
            </label>

            {formError && (
              <div className="bg-red-50 text-red-600 text-xs px-3 py-2 rounded-md">
                {formError}
              </div>
            )}

            <button
              type="submit"
              disabled={formLoading}
              className="w-full bg-gradient-to-r from-[#FF6B35] to-[#FF9F2E] text-white text-base font-bold py-3.5 rounded-xl shadow-lg shadow-orange-200 active:scale-[0.98] transition-transform disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {formLoading ? '提交中...' : '保存地址'}
            </button>
          </form>
        )}

        {mode === 'list' && (
          <>
            {error && (
              <div className="bg-red-50 text-red-600 text-xs px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            {loading && (
              <div className="text-center text-xs text-gray-400 py-4">
                正在加载收货地址...
              </div>
            )}

            {!loading && !addresses.length && !error && (
              <div className="text-center text-xs text-gray-400 py-8">
                暂无收货地址，请点击下方按钮新增
              </div>
            )}

            {addresses.map((addr) => (
              <div key={addr.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">{addr.name}</span>
                    <span className="text-gray-500 text-sm">{addr.phone}</span>
                    {isDefault(addr) && (
                      <span className="bg-red-50 text-red-500 text-[10px] px-2 py-0.5 rounded-full">默认</span>
                    )}
                  </div>
                  <button
                    className="text-gray-400 p-1"
                    onClick={() => {
                      setEditingId(addr.id ?? null);
                      setFormValues({
                        name: addr.name || '',
                        phone: addr.phone || '',
                        province: addr.province || '',
                        city: addr.city || '',
                        district: addr.district || '',
                        address: addr.address || '',
                        is_default: isDefault(addr),
                      });
                      setFormError(null);
                      setNotice(null);
                      setMode('edit');
                    }}
                  >
                    <Pencil size={16} />
                  </button>
                </div>
                <div className="flex items-start gap-2 text-sm text-gray-600 leading-relaxed pr-8 mb-3">
                  <MapPin size={14} className="mt-0.5 text-gray-400" />
                  <span>{formatFullAddress(addr)}</span>
                </div>
                <div className="border-t border-gray-50 pt-3 flex justify-between items-center">
                  <div
                    className="flex items-center gap-2 cursor-pointer active:opacity-60 transition-opacity"
                    onClick={() => handleSetDefault(addr)}
                  >
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${isDefault(addr)
                        ? 'border-red-500 bg-red-500'
                        : 'border-gray-300'
                        }`}
                    >
                      {isDefault(addr) && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                    </div>
                    <span className={`text-xs ${isDefault(addr) ? 'text-red-500 font-bold' : 'text-gray-500'}`}>
                      默认地址
                    </span>
                  </div>
                  <button
                    className="flex items-center gap-1 text-xs text-gray-500"
                    onClick={() => handleDelete(addr.id)}
                  >
                    <Trash2 size={14} />
                    删除
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {mode === 'list' && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 pb-safe max-w-md mx-auto">
          <button
            className="w-full bg-gradient-to-r from-[#FF6B35] to-[#FF9F2E] text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-lg shadow-orange-200"
            onClick={() => {
              resetForm();
              setNotice(null);
              setMode('add');
            }}
          >
            <Plus size={20} />
            新增收货地址
          </button>
        </div>
      )}
      <RegionPicker
        visible={showRegionPicker}
        onClose={() => setShowRegionPicker(false)}
        onConfirm={(province, city) => {
          handleFormInputChange('province', province);
          handleFormInputChange('city', city);
          setShowRegionPicker(false);
        }}
        initialProvince={formValues.province}
        initialCity={formValues.city}
      />
    </SubPageLayout>
  );
};

export default AddressList;
