/**
 * CardManagement - 银行卡管理页面
 * 已迁移: 使用 React Router 导航
 */
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '@/layouts/PageContainer';
import { BankPicker } from '@/components/common';
import {
  PaymentAccountItem,
  fetchPaymentAccountList,
  addPaymentAccount,
  deletePaymentAccount,
  editPaymentAccount,
  isPaymentAccountType,
  normalizePaymentAccountType,
  setDefaultPaymentAccount,
} from '@/services';
import { getStoredToken } from '@/services/client';
import { isSuccess, extractData } from '@/utils/apiHelpers';
import { isValidEmail, isValidPhone } from '@/utils/validation';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useNotification } from '@/context/NotificationContext';
import { useStateMachine } from '@/hooks/useStateMachine';
import { FormEvent, FormState, LoadingEvent, LoadingState } from '@/types/states';
import AccountForm from './card-management/components/AccountForm';
import AccountList from './card-management/components/AccountList';
import AddAccountBar from './card-management/components/AddAccountBar';
import {
  type CardManagementMode,
  type PaymentAccountFormValues,
  createInitialFormValues,
} from './card-management/types';

const CardManagement: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useNotification();

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

  const loading = loadMachine.state === LoadingState.LOADING;
  const [accounts, setAccounts] = useState<PaymentAccountItem[]>([]);
  const [mode, setMode] = useState<CardManagementMode>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingWasDefault, setEditingWasDefault] = useState<boolean>(false);
  const [formValues, setFormValues] = useState<PaymentAccountFormValues>(() => createInitialFormValues());
  const formMachine = useStateMachine<FormState, FormEvent>({
    initial: FormState.IDLE,
    transitions: {
      [FormState.IDLE]: { [FormEvent.SUBMIT]: FormState.SUBMITTING },
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
      [FormState.VALIDATING]: {},
    },
  });

  const formLoading = formMachine.state === FormState.SUBMITTING;
  const [notice, setNotice] = useState<string | null>(null);
  const [showBankPicker, setShowBankPicker] = useState(false);

  const loadAccounts = useCallback(async () => {
    const token = getStoredToken() || '';
    if (!token) {
      handleListError('未检测到登录信息，请重新登录后重试', {
        persist: true,
        showToast: false,
      });
      setAccounts([]);
      loadMachine.send(LoadingEvent.ERROR);
      return;
    }

    loadMachine.send(LoadingEvent.LOAD);
    try {
      const timeoutMs = 10000;
      const response = await Promise.race([
        fetchPaymentAccountList(token),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('加载超时，请稍后重试')), timeoutMs)
        ),
      ]);

      const data = extractData(response);
      if (data) {
        const supportedAccounts = (data.list || []).filter((item) =>
          isPaymentAccountType(String(item.type))
        );
        setAccounts(supportedAccounts);
        clearListError();
        loadMachine.send(LoadingEvent.SUCCESS);
      } else {
        handleListError(response, {
          persist: true,
          showToast: false,
          customMessage: '获取卡号列表失败',
        });
        loadMachine.send(LoadingEvent.ERROR);
      }
    } catch (error: any) {
      handleListError(error, {
        persist: true,
        showToast: false,
        customMessage: '获取卡号列表失败',
      });
      loadMachine.send(LoadingEvent.ERROR);
    }
  }, [handleListError, clearListError]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const handleFormInputChange = (
    field: keyof PaymentAccountFormValues,
    value: string | File | null | boolean
  ) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setFormValues(createInitialFormValues());
    clearFormError();
  };

  const handleEditItem = (item: PaymentAccountItem) => {
    const rawId = item.id ?? '';
    const id = rawId === null || rawId === undefined ? '' : String(rawId);
    if (!id) {
      showToast('error', '操作失败', '该账户缺少 ID，无法编辑');
      return;
    }

    const bankName = item.bank_name || '';
    const branch = item.bank_branch || '';
    const holder = item.account_name || '';
    const accountCandidates = [item.account_number, item.account, item.account_number_display]
      .map((value) => (typeof value === 'string' ? value.trim() : ''))
      .filter(Boolean);
    const account = accountCandidates.find((value) => !value.includes('*')) || accountCandidates[0] || '';
    const isDefault = Number(item.is_default) === 1;

    setEditingId(id);
    setEditingWasDefault(isDefault);
    setFormValues({
      type: normalizePaymentAccountType(item.type),
      bank_name: bankName,
      account_name: holder,
      account_number: account,
      bank_branch: branch,
      screenshot: null,
      is_default: isDefault,
    });
    clearFormError();
    setNotice(null);
    setMode('edit');
  };

  const handleDeleteItem = async (item: PaymentAccountItem) => {
    const rawId = item.id ?? '';
    const id = rawId === null || rawId === undefined ? '' : String(rawId);

    if (!id) {
      showToast('error', '操作失败', '该账户缺少 ID，无法删除');
      return;
    }

    if (!window.confirm('确定要删除该账户吗？')) {
      return;
    }

    try {
      const response = await deletePaymentAccount({ id });
      if (isSuccess(response)) {
        showToast('success', '删除成功', response?.msg || '账户已删除');
        await loadAccounts();
      } else {
        handleListError(response, {
          toastTitle: '删除失败',
          customMessage: '删除账户失败，请稍后重试',
          context: { accountId: id },
        });
      }
    } catch (error: any) {
      handleListError(error, {
        toastTitle: '删除失败',
        customMessage: '删除账户失败，请稍后重试',
        context: { accountId: id },
      });
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    clearFormError();
    setNotice(null);

    const {
      type,
      bank_name,
      account_name,
      account_number,
      bank_branch,
      screenshot,
      is_default,
    } = formValues;
    const trimmedAccountName = account_name.trim();
    const trimmedAccountNumber = account_number.trim();
    const trimmedBankName = bank_name.trim();
    const trimmedBankBranch = bank_branch.trim();

    if (!type) return handleFormError('请选择账户类型', { persist: true, showToast: false });
    if (!trimmedAccountName) return handleFormError('请输入账户名称', { persist: true, showToast: false });
    if (!trimmedAccountNumber) return handleFormError('请输入账号/卡号', { persist: true, showToast: false });
    if (type === 'bank_card' && !trimmedBankName) {
      return handleFormError('请选择或输入银行名称', { persist: true, showToast: false });
    }
    if (type === 'alipay') {
      const phoneValidation = isValidPhone(trimmedAccountNumber);
      const emailValidation = isValidEmail(trimmedAccountNumber);
      if (!phoneValidation.valid && !emailValidation.valid) {
        return handleFormError('支付宝账号仅支持手机号或邮箱格式', {
          persist: true,
          showToast: false,
        });
      }
    }

    formMachine.send(FormEvent.SUBMIT);
    try {
      if (mode === 'edit') {
        if (!editingId) {
          handleFormError('缺少要编辑的账户 ID', { persist: true, showToast: false });
          formMachine.send(FormEvent.SUBMIT_ERROR);
          return;
        }

        const response = await editPaymentAccount({
          id: editingId,
          bank_name: trimmedBankName,
          account_name: trimmedAccountName,
          account_number: trimmedAccountNumber,
          bank_branch: trimmedBankBranch,
          screenshot: screenshot ?? undefined,
        });

        if (isSuccess(response)) {
          if (is_default && !editingWasDefault) {
            await setDefaultPaymentAccount({ id: editingId });
          }
          setNotice('账户信息已更新');
          resetForm();
          setMode('list');
          setEditingId(null);
          setEditingWasDefault(false);
          await loadAccounts();
          formMachine.send(FormEvent.SUBMIT_SUCCESS);
        } else {
          handleFormError(response, {
            persist: true,
            showToast: false,
            customMessage: '保存失败，请检查填写信息',
          });
          formMachine.send(FormEvent.SUBMIT_ERROR);
        }
      } else {
        const response = await addPaymentAccount({
          type,
          account_type: 'personal',
          bank_name: trimmedBankName,
          account_name: trimmedAccountName,
          account_number: trimmedAccountNumber,
          bank_branch: trimmedBankBranch,
          screenshot: screenshot ?? undefined,
        });

        if (isSuccess(response)) {
          setNotice(response?.msg || '新增账户成功');
          resetForm();
          setMode('list');
          await loadAccounts();
          formMachine.send(FormEvent.SUBMIT_SUCCESS);
        } else {
          handleFormError(response, {
            persist: true,
            showToast: false,
            customMessage: '新增账户失败，请检查填写信息',
          });
          formMachine.send(FormEvent.SUBMIT_ERROR);
        }
      }
    } catch (error: any) {
      handleFormError(error, {
        persist: true,
        showToast: false,
        customMessage: '提交失败，请稍后重试',
      });
      formMachine.send(FormEvent.SUBMIT_ERROR);
    }
  };

  return (
    <PageContainer
      title={mode === 'add' ? '新增账户' : mode === 'edit' ? '编辑账户' : '提现账户'}
      onBack={() => {
        if (mode === 'add' || mode === 'edit') {
          resetForm();
          setMode('list');
          setEditingId(null);
          setEditingWasDefault(false);
        } else {
          navigate(-1);
        }
      }}
    >
      {notice && mode === 'list' && (
        <div className="bg-green-50 text-green-600 text-xs px-3 py-2 m-4 rounded-lg">{notice}</div>
      )}

      <BankPicker
        visible={showBankPicker}
        onClose={() => setShowBankPicker(false)}
        onConfirm={(bank) => {
          handleFormInputChange('bank_name', bank);
          setShowBankPicker(false);
        }}
        initialBank={formValues.bank_name}
      />

      {(mode === 'add' || mode === 'edit') && (
        <AccountForm
          mode={mode}
          formValues={formValues}
          formLoading={formLoading}
          hasFormError={hasFormError}
          formErrorMessage={formErrorMessage}
          onSubmit={handleSubmit}
          onInputChange={handleFormInputChange}
          onOpenBankPicker={() => setShowBankPicker(true)}
        />
      )}

      {mode === 'list' && (
        <AccountList
          loading={loading}
          hasListError={hasListError}
          listErrorMessage={listErrorMessage}
          accounts={accounts}
          onEdit={handleEditItem}
          onDelete={handleDeleteItem}
        />
      )}

      {mode === 'list' &&
        <AddAccountBar
          onAdd={() => {
            setMode('add');
            setNotice(null);
          }}
        />}
    </PageContainer>
  );
};

export default CardManagement;
