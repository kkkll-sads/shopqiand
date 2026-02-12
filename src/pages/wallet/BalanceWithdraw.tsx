/**
 * BalanceWithdraw - 余额提现页面
 * 已迁移: 使用 React Router 导航
 */
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import {
  fetchPaymentAccountList,
  isPaymentAccountType,
  normalizePaymentAccountType,
  PaymentAccountItem,
  submitWithdraw,
  fetchProfile,
} from '@/services';
import { getStoredToken } from '@/services/client';
import { useNotification } from '@/context/NotificationContext';
import { isSuccess } from '@/utils/apiHelpers';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useStateMachine } from '@/hooks/useStateMachine';
import { FormEvent, FormState, LoadingEvent, LoadingState } from '@/types/states';
import BalanceWithdrawAccountModal from './balance-withdraw/components/BalanceWithdrawAccountModal';
import BalanceWithdrawAccountSection from './balance-withdraw/components/BalanceWithdrawAccountSection';
import BalanceWithdrawHeaderCard from './balance-withdraw/components/BalanceWithdrawHeaderCard';
import BalanceWithdrawPasswordModal from './balance-withdraw/components/BalanceWithdrawPasswordModal';

const BalanceWithdraw: React.FC = () => {
  const parseValidAmount = (value: string): number | null => {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const navigate = useNavigate();
  const { showToast } = useNotification();

  const { handleError: handleLoadError } = useErrorHandler({ showToast: true, persist: false });

  const {
    errorMessage: submitErrorMessage,
    hasError: hasSubmitError,
    handleError: handleSubmitError,
    clearError: clearSubmitError,
  } = useErrorHandler();

  const [accounts, setAccounts] = useState<PaymentAccountItem[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<PaymentAccountItem | null>(null);
  const [showAccountModal, setShowAccountModal] = useState<boolean>(false);
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [amount, setAmount] = useState<string>('');
  const [payPassword, setPayPassword] = useState<string>('');
  const [remark, setRemark] = useState<string>('');
  const [balance, setBalance] = useState<string>('0.00');
  const submitLockRef = useRef(false);

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

  const balanceMachine = useStateMachine<LoadingState, LoadingEvent>({
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

  const loadingBalance = balanceMachine.state === LoadingState.LOADING;
  const submitting = submitMachine.state === FormState.SUBMITTING;

  const feeRate = 0.01;

  useEffect(() => {
    void loadAccounts();
    void loadBalance();
  }, []);

  const loadAccounts = async () => {
    const token = getStoredToken();
    if (!token) return;

    accountsMachine.send(LoadingEvent.LOAD);
    try {
      const response = await fetchPaymentAccountList(token);
      if (isSuccess(response) && response.data?.list) {
        const supportedAccounts = (response.data.list || []).filter((item) =>
          isPaymentAccountType(String(item.type))
        );
        setAccounts(supportedAccounts);
        setSelectedAccount((currentSelected) => {
          if (currentSelected) {
            const matchedCurrent = supportedAccounts.find(
              (acc: PaymentAccountItem) => acc.id === currentSelected.id
            );
            if (matchedCurrent) return matchedCurrent;
          }
          const defaultAcc = supportedAccounts.find(
            (acc: PaymentAccountItem) => Number(acc.is_default) === 1
          );
          return defaultAcc || supportedAccounts[0] || null;
        });
        accountsMachine.send(LoadingEvent.SUCCESS);
      } else {
        handleLoadError(response, {
          toastTitle: '加载失败',
          customMessage: '获取提现账户失败',
          context: { page: 'BalanceWithdraw' },
        });
        accountsMachine.send(LoadingEvent.ERROR);
      }
    } catch (error) {
      handleLoadError(error, {
        toastTitle: '加载失败',
        customMessage: '获取提现账户失败',
        context: { page: 'BalanceWithdraw' },
      });
      accountsMachine.send(LoadingEvent.ERROR);
    }
  };

  const loadBalance = async () => {
    const token = getStoredToken();
    if (!token) return;

    balanceMachine.send(LoadingEvent.LOAD);
    try {
      const response = await fetchProfile(token);
      if (isSuccess(response) && response.data?.userInfo) {
        const userInfo = response.data.userInfo;
        const balanceNum = Number(userInfo.withdrawable_money);
        setBalance(Number.isFinite(balanceNum) ? balanceNum.toFixed(2) : '0.00');
        balanceMachine.send(LoadingEvent.SUCCESS);
      } else {
        handleLoadError(response, {
          toastTitle: '加载失败',
          customMessage: '获取余额失败',
          context: { page: 'BalanceWithdraw' },
        });
        balanceMachine.send(LoadingEvent.ERROR);
      }
    } catch (error) {
      handleLoadError(error, {
        toastTitle: '加载失败',
        customMessage: '获取余额失败',
        context: { page: 'BalanceWithdraw' },
      });
      balanceMachine.send(LoadingEvent.ERROR);
    }
  };

  const handleAmountChange = (value: string) => {
    const amountNum = parseValidAmount(value);
    const balanceNum = parseValidAmount(balance) ?? 0;
    if (amountNum !== null && amountNum > balanceNum) {
      setAmount(balance);
    } else {
      setAmount(value);
    }
    clearSubmitError();
  };

  const handleWithdrawClick = () => {
    const amountNum = parseValidAmount(amount);
    const balanceNum = parseValidAmount(balance) ?? 0;

    if (amountNum === null || amountNum <= 0) {
      return handleSubmitError('请输入有效的提现金额', { persist: true, showToast: false });
    }
    if (amountNum > balanceNum) {
      return handleSubmitError('提现金额不能超过可提现余额', { persist: true, showToast: false });
    }
    if (!selectedAccount) {
      return handleSubmitError('请选择提现账户', { persist: true, showToast: false });
    }

    if (normalizePaymentAccountType(selectedAccount.type) === 'bank_card' && amountNum < 100) {
      return handleSubmitError('银行卡提现金额不得低于 100 元，建议使用支付宝提现', {
        persist: true,
        showToast: false,
      });
    }

    clearSubmitError();
    setShowPasswordModal(true);
  };

  const handleConfirmWithdraw = async () => {
    if (submitting || submitLockRef.current) return;

    if (!payPassword) {
      return handleSubmitError('请输入支付密码', { persist: true, showToast: false });
    }
    if (!/^\d{6}$/.test(payPassword)) {
      return handleSubmitError('支付密码必须为6位数字', { persist: true, showToast: false });
    }

    submitLockRef.current = true;
    submitMachine.send(FormEvent.SUBMIT);
    clearSubmitError();

    try {
      const amountNum = parseValidAmount(amount);
      if (amountNum === null || amountNum <= 0) {
        handleSubmitError('请输入有效的提现金额', { persist: true, showToast: false });
        submitMachine.send(FormEvent.SUBMIT_ERROR);
        return;
      }

      const response = await submitWithdraw({
        amount: amountNum,
        payment_account_id: selectedAccount!.id,
        pay_password: payPassword,
        remark,
      });
      if (isSuccess(response)) {
        showToast('success', '提交成功', response.msg || '提现申请提交成功');
        setAmount('');
        setPayPassword('');
        setSelectedAccount(null);
        setShowPasswordModal(false);
        void loadBalance();
        submitMachine.send(FormEvent.SUBMIT_SUCCESS);
      } else {
        handleSubmitError(response, {
          persist: true,
          showToast: false,
          customMessage: '提现申请提交失败',
          context: { amount, accountId: selectedAccount?.id },
        });
        submitMachine.send(FormEvent.SUBMIT_ERROR);
      }
    } catch (error: unknown) {
      handleSubmitError(error, {
        persist: true,
        showToast: false,
        customMessage: '提现申请提交失败',
        context: { amount, accountId: selectedAccount?.id },
      });
      submitMachine.send(FormEvent.SUBMIT_ERROR);
    } finally {
      submitLockRef.current = false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900 pb-safe">
      <BalanceWithdrawHeaderCard
        loadingBalance={loadingBalance}
        balance={balance}
        amount={amount}
        feeRate={feeRate}
        onBack={() => navigate(-1)}
        onOpenOrders={() => navigate('/withdraw-orders')}
        onAmountChange={handleAmountChange}
        onFillAll={() => setAmount(balance)}
      />

      <div className="px-5 flex-1 space-y-4">
        <BalanceWithdrawAccountSection
          selectedAccount={selectedAccount}
          remark={remark}
          onOpenAccountModal={() => setShowAccountModal(true)}
          onRemarkChange={setRemark}
        />

        {hasSubmitError && (
          <div className="bg-red-50 p-3 rounded-xl flex items-start gap-2">
            <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
            <span className="text-xs text-red-600 font-medium">{submitErrorMessage}</span>
          </div>
        )}
      </div>

      <div className="p-5 pb-safe bg-white/80 backdrop-blur border-t border-gray-100">
        <button
          onClick={handleWithdrawClick}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white font-bold text-lg shadow-lg shadow-red-200 active:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none"
          disabled={submitting}
        >
          {submitting ? '处理中...' : '确认提现资金'}
        </button>
        <div className="text-center mt-3 text-[10px] text-gray-400">资金提现 T+1 到账 | 每日限额 ¥50,000</div>
      </div>

      <BalanceWithdrawAccountModal
        open={showAccountModal}
        accounts={accounts}
        selectedAccount={selectedAccount}
        onClose={() => setShowAccountModal(false)}
        onSelect={setSelectedAccount}
        onAddAccount={() => navigate('/card-management')}
      />

      <BalanceWithdrawPasswordModal
        open={showPasswordModal}
        amount={amount}
        payPassword={payPassword}
        submitting={submitting}
        hasError={hasSubmitError}
        errorMessage={submitErrorMessage}
        onClose={() => setShowPasswordModal(false)}
        onPasswordChange={(value) => {
          setPayPassword(value);
          clearSubmitError();
        }}
        onConfirm={handleConfirmWithdraw}
      />
    </div>
  );
};

export default BalanceWithdraw;
