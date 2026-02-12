/**
 * ExtensionWithdraw - 拓展提现页面
 * 已迁移: 使用 React Router 导航
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '@/layouts/PageContainer';
import {
  fetchProfile,
  fetchPaymentAccountList,
  submitStaticIncomeWithdraw,
  PaymentAccountItem,
} from '@/services';
import { getStoredToken } from '@/services/client';
import { UserInfo } from '@/types';
import { useNotification } from '@/context/NotificationContext';
import { useAuthStore } from '@/stores/authStore';
import { isSuccess } from '@/utils/apiHelpers';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useStateMachine } from '@/hooks/useStateMachine';
import { FormEvent, FormState, LoadingEvent, LoadingState } from '@/types/states';
import { errorLog } from '@/utils/logger';
import WithdrawalAccountModal from './extension-withdraw/components/WithdrawalAccountModal';
import WithdrawalAccountSelector from './extension-withdraw/components/WithdrawalAccountSelector';
import WithdrawalAmountCard from './extension-withdraw/components/WithdrawalAmountCard';
import WithdrawalPasswordModal from './extension-withdraw/components/WithdrawalPasswordModal';

const ExtensionWithdraw: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useNotification();

  const { handleError: handleLoadError } = useErrorHandler({ showToast: true, persist: false });

  const {
    errorMessage: submitErrorMessageMessage,
    hasError: hasSubmitError,
    handleError: handleSubmitError,
    clearError: clearSubmitError,
  } = useErrorHandler();

  const storedUser = useAuthStore((state) => state.user);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(storedUser);

  const [accounts, setAccounts] = useState<PaymentAccountItem[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<PaymentAccountItem | null>(null);
  const [showAccountModal, setShowAccountModal] = useState<boolean>(false);
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [amount, setAmount] = useState<string>('');
  const [payPassword, setPayPassword] = useState<string>('');
  const [remark, setRemark] = useState<string>('');

  const accountsMachine = useStateMachine<LoadingState, LoadingEvent>({
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

  const submitMachine = useStateMachine<FormState, FormEvent>({
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

  const loadingAccounts = accountsMachine.state === LoadingState.LOADING;
  const submitting = submitMachine.state === FormState.SUBMITTING;

  const balance = userInfo?.static_income || '0';

  useEffect(() => {
    const loadUserInfo = async () => {
      const token = getStoredToken();
      if (!token) return;

      try {
        const response = await fetchProfile(token);
        if (isSuccess(response) && response.data?.userInfo) {
          setUserInfo(response.data.userInfo);
          useAuthStore.getState().updateUser(response.data.userInfo);
        }
      } catch (error) {
        errorLog('ExtensionWithdraw', '获取用户信息失败', error);
      }
    };

    loadUserInfo();
  }, []);

  useEffect(() => {
    const loadAccounts = async () => {
      const token = getStoredToken();
      if (!token) return;

      accountsMachine.send(LoadingEvent.LOAD);
      try {
        const response = await fetchPaymentAccountList(token);
        if (isSuccess(response) && response.data?.list) {
          setAccounts(response.data.list || []);
          if (response.data.list.length > 0) {
            const defaultAccount = response.data.list.find(
              (item: PaymentAccountItem) => Number(item.is_default) === 1
            );
            setSelectedAccount(defaultAccount || response.data.list[0]);
          }
          accountsMachine.send(LoadingEvent.SUCCESS);
        } else {
          handleLoadError(response, {
            toastTitle: '加载失败',
            customMessage: '获取收款账户信息失败',
          });
          accountsMachine.send(LoadingEvent.ERROR);
        }
      } catch (error: any) {
        handleLoadError(error, {
          toastTitle: '加载失败',
          customMessage: '获取收款账户信息失败',
        });
        accountsMachine.send(LoadingEvent.ERROR);
      }
    };

    loadAccounts();
  }, []);

  const handleAmountChange = (value: string) => {
    if (value === '') {
      setAmount('');
      clearSubmitError();
      return;
    }

    if (!isNaN(parseFloat(value)) && parseFloat(value) >= 0) {
      const numVal = parseFloat(value);
      const numBal = parseFloat(balance);
      if (numVal > numBal) {
        setAmount(balance);
      } else {
        setAmount(value);
      }
      clearSubmitError();
    }
  };

  const handleSelectAll = () => {
    const staticIncome = parseFloat(balance);
    if (staticIncome > 0) {
      setAmount(staticIncome.toFixed(2));
      clearSubmitError();
    }
  };

  const handleWithdrawClick = () => {
    const withdrawAmount = Number(amount);

    if (!amount || withdrawAmount <= 0) {
      return handleSubmitError('请输入有效的提现金额', { persist: true, showToast: false });
    }

    const staticIncome = Number(balance);
    if (withdrawAmount > staticIncome) {
      return handleSubmitError('提现金额不能超过可提现拓展服务费', {
        persist: true,
        showToast: false,
      });
    }

    if (!selectedAccount || !selectedAccount.id) {
      return handleSubmitError('请选择收款账户', { persist: true, showToast: false });
    }

    clearSubmitError();
    setShowPasswordModal(true);
  };

  const handleClosePasswordModal = () => {
    setShowPasswordModal(false);
    setPayPassword('');
  };

  const handleConfirmWithdraw = async () => {
    if (!payPassword) {
      return handleSubmitError('请输入支付密码', { persist: true, showToast: false });
    }
    if (!/^\d{6}$/.test(payPassword)) {
      return handleSubmitError('支付密码必须为6位数字', { persist: true, showToast: false });
    }

    submitMachine.send(FormEvent.SUBMIT);
    clearSubmitError();

    const token = getStoredToken();
    if (!token) {
      handleSubmitError('未找到用户登录信息，请先登录', { persist: true, showToast: false });
      submitMachine.send(FormEvent.SUBMIT_ERROR);
      return;
    }

    try {
      const response = await submitStaticIncomeWithdraw({
        amount: Number(amount),
        payment_account_id: Number(selectedAccount!.id),
        pay_password: payPassword,
        remark: remark || undefined,
        token,
      });

      if (isSuccess(response)) {
        showToast('success', '提交成功', response.msg || '提现申请已提交，请等待审核');
        setAmount('');
        setPayPassword('');
        setRemark('');
        setShowPasswordModal(false);

        const updatedResponse = await fetchProfile(token);
        if (isSuccess(updatedResponse) && updatedResponse.data?.userInfo) {
          setUserInfo(updatedResponse.data.userInfo);
          useAuthStore.getState().updateUser(updatedResponse.data.userInfo);
        }
        submitMachine.send(FormEvent.SUBMIT_SUCCESS);
      } else {
        handleSubmitError(response, {
          persist: true,
          showToast: false,
          customMessage: '提交提现申请失败',
          context: { amount, accountId: selectedAccount?.id },
        });
        submitMachine.send(FormEvent.SUBMIT_ERROR);
      }
    } catch (error: any) {
      handleSubmitError(error, {
        persist: true,
        showToast: false,
        customMessage: '提交提现申请失败，请稍后重试',
        context: { amount, accountId: selectedAccount?.id },
      });
      submitMachine.send(FormEvent.SUBMIT_ERROR);
    }
  };

  return (
    <PageContainer title="拓展提现" onBack={() => navigate(-1)}>
      <div className="p-3 space-y-3">
        <WithdrawalAccountSelector
          selectedAccount={selectedAccount}
          onOpen={() => setShowAccountModal(true)}
        />

        <WithdrawalAmountCard
          amount={amount}
          balance={balance}
          onAmountChange={handleAmountChange}
          onSelectAll={handleSelectAll}
        />

        {hasSubmitError && (
          <div className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded">{submitErrorMessageMessage}</div>
        )}

        <div className="px-1">
          <p className="text-xs text-gray-400 leading-relaxed">
            拓展收益按平台规则结算后方可申请提现，具体结算周期以公告为准。为保障资金安全，平台可能会对部分高频或大额提现订单进行人工核实。
          </p>
        </div>

        <button
          onClick={handleWithdrawClick}
          disabled={submitting}
          className="w-full bg-red-600 text-white rounded-full py-3.5 text-base font-medium active:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? '提交中...' : '提现'}
        </button>
      </div>

      <WithdrawalAccountModal
        open={showAccountModal}
        loading={loadingAccounts}
        accounts={accounts}
        selectedAccount={selectedAccount}
        onClose={() => setShowAccountModal(false)}
        onSelectAccount={setSelectedAccount}
        onNavigateCardManagement={() => navigate('/card-management')}
      />

      <WithdrawalPasswordModal
        open={showPasswordModal}
        amount={amount}
        payPassword={payPassword}
        remark={remark}
        submitting={submitting}
        hasError={hasSubmitError}
        errorMessage={submitErrorMessageMessage}
        onClose={handleClosePasswordModal}
        onPayPasswordChange={(value) => {
          setPayPassword(value);
          clearSubmitError();
        }}
        onRemarkChange={setRemark}
        onConfirm={handleConfirmWithdraw}
      />
    </PageContainer>
  );
};

export default ExtensionWithdraw;
