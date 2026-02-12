/**
 * AddressList - 收货地址页面
 * 已迁移: 使用 React Router 导航
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '@/layouts/PageContainer';
import { RegionPicker } from '@/components/common';
import {
  type AddressItem,
  deleteAddress,
  fetchAddressList,
  saveAddress,
} from '@/services';
import { getStoredToken } from '@/services/client';
import { useNotification } from '@/context/NotificationContext';
import { isSuccess } from '@/utils/apiHelpers';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useStateMachine } from '@/hooks/useStateMachine';
import { FormEvent, FormState, LoadingEvent, LoadingState } from '@/types/states';
import AddressForm from './components/AddressForm';
import AddressListContent from './components/AddressListContent';
import AddAddressBar from './components/AddAddressBar';
import {
  type AddressPageMode,
  type AddressFormValues,
  createInitialFormValues,
} from './types';
import { isDefaultAddress } from './helpers';

const AddressList: React.FC = () => {
  const navigate = useNavigate();
  const { showToast, showDialog } = useNotification();

  const {
    errorMessage: listErrorMessage,
    hasError: hasListError,
    handleError: handleListError,
    clearError: clearListError,
  } = useErrorHandler();

  const {
    errorMessage: formErrorMessage,
    hasError: hasFormError,
    handleError: handleFormError,
    clearError: clearFormError,
  } = useErrorHandler();

  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [mode, setMode] = useState<AddressPageMode>('list');
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [formValues, setFormValues] = useState<AddressFormValues>(() => createInitialFormValues());
  const [notice, setNotice] = useState<string | null>(null);
  const [showRegionPicker, setShowRegionPicker] = useState(false);

  const loadMachine = useStateMachine<LoadingState, LoadingEvent>({
    initial: LoadingState.IDLE,
    transitions: {
      [LoadingState.IDLE]: { [LoadingEvent.LOAD]: LoadingState.LOADING },
      [LoadingState.LOADING]: {
        [LoadingEvent.SUCCESS]: LoadingState.SUCCESS,
        [LoadingEvent.ERROR]: LoadingState.ERROR,
      },
      [LoadingState.SUCCESS]: {
        [LoadingEvent.LOAD]: LoadingState.LOADING,
        [LoadingEvent.RETRY]: LoadingState.LOADING,
      },
      [LoadingState.ERROR]: {
        [LoadingEvent.LOAD]: LoadingState.LOADING,
        [LoadingEvent.RETRY]: LoadingState.LOADING,
      },
    },
  });

  const formMachine = useStateMachine<FormState, FormEvent>({
    initial: FormState.IDLE,
    transitions: {
      [FormState.IDLE]: { [FormEvent.SUBMIT]: FormState.SUBMITTING },
      [FormState.VALIDATING]: {
        [FormEvent.VALIDATION_SUCCESS]: FormState.SUBMITTING,
        [FormEvent.VALIDATION_ERROR]: FormState.ERROR,
      },
      [FormState.SUBMITTING]: {
        [FormEvent.SUBMIT_SUCCESS]: FormState.SUCCESS,
        [FormEvent.SUBMIT_ERROR]: FormState.ERROR,
      },
      [FormState.SUCCESS]: {
        [FormEvent.SUBMIT]: FormState.SUBMITTING,
        [FormEvent.RESET]: FormState.IDLE,
      },
      [FormState.ERROR]: {
        [FormEvent.SUBMIT]: FormState.SUBMITTING,
        [FormEvent.RESET]: FormState.IDLE,
      },
    },
  });

  const loading = loadMachine.state === LoadingState.LOADING;
  const formLoading = formMachine.state === FormState.SUBMITTING;

  const loadAddresses = async () => {
    const token = getStoredToken() || '';
    if (!token) {
      handleListError('未检测到登录信息，请重新登录后再查看地址列表', {
        persist: true,
        showToast: false,
      });
      loadMachine.send(LoadingEvent.ERROR);
      return;
    }

    loadMachine.send(LoadingEvent.LOAD);
    try {
      const response = await fetchAddressList(token);
      if (isSuccess(response) && response.data?.list) {
        setAddresses(response.data.list);
        clearListError();
        loadMachine.send(LoadingEvent.SUCCESS);
      } else {
        handleListError(response, { persist: true, showToast: false });
        loadMachine.send(LoadingEvent.ERROR);
      }
    } catch (error) {
      handleListError(error, {
        persist: true,
        showToast: false,
        customMessage: '获取地址列表失败',
      });
      loadMachine.send(LoadingEvent.ERROR);
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
          const response = await deleteAddress({ id });
          showToast('success', response?.msg || '删除成功');
          loadAddresses();
        } catch (error) {
          handleListError(error, {
            toastTitle: '删除失败',
            customMessage: '删除收货地址失败',
            context: { addressId: id },
          });
        }
      },
    });
  };

  const handleSetDefault = async (address: AddressItem) => {
    if (isDefaultAddress(address)) return;

    loadMachine.send(LoadingEvent.LOAD);
    try {
      const response = await saveAddress({
        id: address.id,
        name: address.name,
        phone: address.phone,
        province: address.province,
        city: address.city,
        district: address.district,
        address: address.address,
        is_default: 1,
      });

      if (isSuccess(response)) {
        await loadAddresses();
        loadMachine.send(LoadingEvent.SUCCESS);
      } else {
        handleListError(response, {
          persist: true,
          customMessage: '设置默认地址失败',
        });
        loadMachine.send(LoadingEvent.ERROR);
      }
    } catch (error) {
      handleListError(error, {
        persist: true,
        customMessage: '设置默认地址失败',
      });
      loadMachine.send(LoadingEvent.ERROR);
    }
  };

  const handleFormInputChange = (field: keyof AddressFormValues, value: string | boolean) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setFormValues(createInitialFormValues());
    clearFormError();
  };

  const handleEdit = (address: AddressItem) => {
    setEditingId(address.id ?? null);
    setFormValues({
      name: address.name || '',
      phone: address.phone || '',
      province: address.province || '',
      city: address.city || '',
      district: address.district || '',
      address: address.address || '',
      is_default: isDefaultAddress(address),
    });
    clearFormError();
    setNotice(null);
    setMode('edit');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    clearFormError();
    setNotice(null);

    const { name, phone, province, city, district, address, is_default } = formValues;

    if (!name.trim()) return handleFormError('请输入收货人姓名', { persist: true, showToast: false });
    if (!phone.trim()) return handleFormError('请输入手机号', { persist: true, showToast: false });
    if (!province.trim() || !city.trim()) {
      return handleFormError('请输入完整的省市信息', { persist: true, showToast: false });
    }
    if (!address.trim()) return handleFormError('请输入详细地址', { persist: true, showToast: false });

    formMachine.send(FormEvent.SUBMIT);
    try {
      const payloadId =
        mode === 'edit' && editingId !== null && editingId !== '' ? editingId : undefined;

      const response = await saveAddress({
        id: payloadId as any,
        name: name.trim(),
        phone: phone.trim(),
        province: province.trim(),
        city: city.trim(),
        district: district.trim(),
        address: address.trim(),
        is_default: is_default ? 1 : 0,
      });

      if (isSuccess(response)) {
        setNotice(mode === 'edit' ? '地址已更新' : '新增地址成功');
        resetForm();
        setMode('list');
        setEditingId(null);
        await loadAddresses();
        formMachine.send(FormEvent.SUBMIT_SUCCESS);
      } else {
        handleFormError(response, {
          persist: true,
          showToast: false,
          customMessage: '保存地址失败，请检查填写信息',
        });
        formMachine.send(FormEvent.SUBMIT_ERROR);
      }
    } catch (error) {
      handleFormError(error, {
        persist: true,
        showToast: false,
        customMessage: '保存地址失败，请稍后重试',
      });
      formMachine.send(FormEvent.SUBMIT_ERROR);
    }
  };

  return (
    <PageContainer
      title={mode === 'add' ? '新增收货地址' : mode === 'edit' ? '编辑收货地址' : '收货地址'}
      onBack={() => {
        if (mode === 'add' || mode === 'edit') {
          resetForm();
          setMode('list');
          setEditingId(null);
        } else {
          navigate(-1);
        }
      }}
    >
      <div className="p-4 space-y-4 pb-24">
        {notice && mode === 'list' && (
          <div className="bg-green-50 text-green-600 text-xs px-3 py-2 rounded-lg">{notice}</div>
        )}

        {(mode === 'add' || mode === 'edit') && (
          <AddressForm
            formValues={formValues}
            formLoading={formLoading}
            hasFormError={hasFormError}
            formErrorMessage={formErrorMessage}
            onSubmit={handleSubmit}
            onInputChange={handleFormInputChange}
            onOpenRegionPicker={() => setShowRegionPicker(true)}
          />
        )}

        {mode === 'list' && (
          <AddressListContent
            loading={loading}
            hasListError={hasListError}
            listErrorMessage={listErrorMessage}
            addresses={addresses}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onSetDefault={handleSetDefault}
          />
        )}
      </div>

      {mode === 'list' && (
        <AddAddressBar
          onAdd={() => {
            resetForm();
            setNotice(null);
            setMode('add');
          }}
        />
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
    </PageContainer>
  );
};

export default AddressList;
