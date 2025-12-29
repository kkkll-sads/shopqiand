

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
import { isSuccess, extractError } from '../../utils/apiHelpers';

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
      if (isSuccess(res) && res.data?.list) {
        setAddresses(res.data.list);
        setError(null);
      } else {
        setError(extractError(res, '获取地址列表失败'));
      }
    } catch (e: any) {
      setError(e?.message || '获取地址列表失败');
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

      if (isSuccess(res)) {
        await loadAddresses();
      } else {
        setError(extractError(res, '设置默认地址失败'));
      }
    } catch (e: any) {
      setError(e?.message || '设置默认地址失败');
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

      if (isSuccess(res)) {
        setNotice(mode === 'edit' ? '地址已更新' : '新增地址成功');
        resetForm();
        setMode('list');
        setEditingId(null);
        await loadAddresses();
      } else {
        setFormError(extractError(res, '保存地址失败，请检查填写信息'));
      }
    } catch (e: any) {
      setFormError(e?.message || '保存地址失败，请稍后重试');
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
            className="bg-white mt-2 px-4"
            onSubmit={handleSubmit}
          >
            <div className="py-4 border-b border-gray-100">
              <span className="block text-sm text-gray-500 mb-1">收货人姓名 <span className="text-red-500">*</span></span>
              <input
                className="w-full text-base text-gray-900 outline-none placeholder:text-gray-300 bg-transparent font-medium"
                type="text"
                placeholder="请输入收货人姓名"
                value={formValues.name}
                onChange={(e) =>
                  handleFormInputChange('name', e.target.value)
                }
              />
            </div>

            <div className="py-4 border-b border-gray-100">
              <span className="block text-sm text-gray-500 mb-1">手机号 <span className="text-red-500">*</span></span>
              <input
                className="w-full text-base text-gray-900 outline-none placeholder:text-gray-300 bg-transparent font-medium"
                type="tel"
                placeholder="请输入手机号"
                value={formValues.phone}
                onChange={(e) =>
                  handleFormInputChange('phone', e.target.value)
                }
              />
            </div>

            {/* 省市区选择 */}
            <div className="py-4 border-b border-gray-100" onClick={() => setShowRegionPicker(true)}>
              <span className="block text-sm text-gray-500 mb-1">所在地区 <span className="text-red-500">*</span></span>
              <div className="flex items-center justify-between">
                <div className={`text-base font-medium ${formValues.province ? 'text-gray-900' : 'text-gray-300'}`}>
                  {formValues.province && formValues.city
                    ? `${formValues.province} ${formValues.city} ${formValues.district || ''}`
                    : '点击选择省市区'
                  }
                </div>
                <MapPin size={18} className="text-gray-400" />
              </div>
            </div>

            <div className="py-4 border-b border-gray-100">
              <span className="block text-sm text-gray-500 mb-1">详细地址 <span className="text-red-500">*</span></span>
              <textarea
                className="w-full text-base text-gray-900 outline-none placeholder:text-gray-300 bg-transparent font-medium resize-none min-h-[80px]"
                placeholder="街道、小区、楼栋、门牌号等"
                value={formValues.address}
                onChange={(e) =>
                  handleFormInputChange('address', e.target.value)
                }
              />
            </div>

            <label className="flex items-center justify-between py-4">
              <span className="text-base text-gray-800">设为默认地址</span>
              <div className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={formValues.is_default}
                  onChange={(e) =>
                    handleFormInputChange('is_default', e.target.checked)
                  }
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
              </div>
            </label>

            {formError && (
              <div className="bg-red-50 text-red-600 text-xs px-3 py-2 rounded-md mb-4">
                {formError}
              </div>
            )}

            <button
              type="submit"
              disabled={formLoading}
              className="w-full bg-gradient-to-r from-[#FF6B35] to-[#FF9F2E] text-white text-base font-bold py-3.5 rounded-full shadow-lg shadow-orange-200 active:scale-[0.98] transition-transform disabled:opacity-60 disabled:cursor-not-allowed mt-4 mb-8"
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
        onConfirm={(province, city, district) => {
          handleFormInputChange('province', province);
          handleFormInputChange('city', city);
          handleFormInputChange('district', district || '');
          setShowRegionPicker(false);
        }}
        initialProvince={formValues.province}
        initialCity={formValues.city}
        initialDistrict={formValues.district}
      />
    </SubPageLayout>
  );
};

export default AddressList;
