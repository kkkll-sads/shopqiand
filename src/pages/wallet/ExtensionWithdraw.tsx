/**
 * ExtensionWithdraw - 拓展提现页面
 * 已迁移: 使用 React Router 导航
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, X, ChevronRight } from 'lucide-react';
import PageContainer from '../../../components/layout/PageContainer';
import {
  fetchProfile,
  fetchPaymentAccountList,
  submitStaticIncomeWithdraw,
  PaymentAccountItem,
} from '../../../services/api';
import { getStoredToken } from '../../../services/client';
import { UserInfo } from '../../../types';

import { formatAmount } from '../../../utils/format';
import { useNotification } from '../../../context/NotificationContext';
import { useAuthStore } from '../../stores/authStore';
import { isSuccess, extractError } from '../../../utils/apiHelpers';
import { useErrorHandler } from '../../../hooks/useErrorHandler';
import { useStateMachine } from '../../../hooks/useStateMachine';
import { FormEvent, FormState, LoadingEvent, LoadingState } from '../../../types/states';
import { errorLog } from '../../../utils/logger';

const ExtensionWithdraw: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useNotification();

  // ✅ 使用统一错误处理Hook（加载错误 - Toast模式）
  const { handleError: handleLoadError } = useErrorHandler({ showToast: true, persist: false });

  // ✅ 使用统一错误处理Hook（表单验证错误 - 持久化显示）
  const {
    errorMessage: submitErrorMessageMessage,
    hasError: hasSubmitError,
    handleError: handleSubmitError,
    clearError: clearSubmitError
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

  // 可提现余额
  const balance = userInfo?.static_income || '0';

  // 加载用户信息
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
      } catch (err) {
        errorLog('ExtensionWithdraw', '获取用户信息失败', err);
      }
    };

    loadUserInfo();
  }, []);

  // 加载收款账户列表
  useEffect(() => {
    const loadAccounts = async () => {
      const token = getStoredToken();
      if (!token) return;

      accountsMachine.send(LoadingEvent.LOAD);
      try {
        const res = await fetchPaymentAccountList(token);
        if (isSuccess(res) && res.data?.list) {
          setAccounts(res.data.list || []);
          // 默认选择第一个账户或默认账户
          if (res.data.list.length > 0) {
            const defaultAccount = res.data.list.find((acc: PaymentAccountItem) => Number(acc.is_default) === 1);
            setSelectedAccount(defaultAccount || res.data.list[0]);
          }
          accountsMachine.send(LoadingEvent.SUCCESS);
        } else {
          // ✅ 使用统一错误处理
          handleLoadError(res, {
            toastTitle: '加载失败',
            customMessage: '获取收款账户信息失败'
          });
          accountsMachine.send(LoadingEvent.ERROR);
        }
      } catch (e: any) {
        // ✅ 使用统一错误处理
        handleLoadError(e, {
          toastTitle: '加载失败',
          customMessage: '获取收款账户信息失败'
        });
        accountsMachine.send(LoadingEvent.ERROR);
      } finally {
        // 状态机已处理成功/失败
      }
    };

    loadAccounts();
  }, []);

  const handleSelectAll = () => {
    const staticIncome = parseFloat(balance);
    if (staticIncome > 0) {
      setAmount(staticIncome.toFixed(2));
      clearSubmitError(); // ✅ 使用统一错误清除
    }
  };

  const handleWithdrawClick = () => {
    const withdrawAmount = Number(amount);
    // ✅ 验证错误使用persist显示
    if (!amount || withdrawAmount <= 0) {
      return handleSubmitError('请输入有效的提现金额', { persist: true, showToast: false });
    }

    const staticIncome = Number(balance);
    if (withdrawAmount > staticIncome) {
      return handleSubmitError('提现金额不能超过可提现拓展服务费', { persist: true, showToast: false });
    }

    if (!selectedAccount || !selectedAccount.id) {
      return handleSubmitError('请选择收款账户', { persist: true, showToast: false });
    }

    clearSubmitError(); // ✅ 验证通过，清除错误
    setShowPasswordModal(true);
  };

  const handleConfirmWithdraw = async () => {
    // ✅ 验证错误使用persist显示
    if (!payPassword) {
      return handleSubmitError('请输入支付密码', { persist: true, showToast: false });
    }
    if (!/^\d{6}$/.test(payPassword)) {
      return handleSubmitError('支付密码必须为6位数字', { persist: true, showToast: false });
    }

    submitMachine.send(FormEvent.SUBMIT);
    clearSubmitError(); // ✅ 提交前清除错误

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

        // 更新用户信息
        const updatedResponse = await fetchProfile(token);
        if (isSuccess(updatedResponse) && updatedResponse.data?.userInfo) {
          setUserInfo(updatedResponse.data.userInfo);
          useAuthStore.getState().updateUser(updatedResponse.data.userInfo);
        }
        submitMachine.send(FormEvent.SUBMIT_SUCCESS);
      } else {
        // ✅ 使用统一错误处理
        handleSubmitError(response, {
          persist: true,
          showToast: false,
          customMessage: '提交提现申请失败',
          context: { amount, accountId: selectedAccount?.id }
        });
        submitMachine.send(FormEvent.SUBMIT_ERROR);
      }
    } catch (err: any) {
      // ✅ 使用统一错误处理
      handleSubmitError(err, {
        persist: true,
        showToast: false,
        customMessage: '提交提现申请失败，请稍后重试',
        context: { amount, accountId: selectedAccount?.id }
      });
      submitMachine.send(FormEvent.SUBMIT_ERROR);
    } finally {
      // 状态机已处理成功/失败
    }
  };

  return (
    <PageContainer title="拓展提现" onBack={() => navigate(-1)}>
      <div className="p-3 space-y-3">
        {/* 选择收款账户 */}
        <div
          className="bg-white rounded-xl p-3 shadow-sm flex justify-between items-center cursor-pointer active:bg-gray-50"
          onClick={() => setShowAccountModal(true)}
        >
          <span className="text-base text-gray-800">
            {selectedAccount
              ? `${selectedAccount.account_name || selectedAccount.type_text || '账户'} - ${selectedAccount.account?.slice(-4) || ''}`
              : '选择收款账户'}
          </span>
          <ChevronRight size={20} className="text-gray-400" />
        </div>

        {/* 提现金额 */}
        <div className="bg-white rounded-xl p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-base text-gray-800 font-medium">提现金额</span>
          </div>

          <div className="flex items-center border-b border-gray-100 pb-4">
            <span className="text-3xl text-gray-800 mr-2">¥</span>
            <input
              type="number"
              placeholder=""
              className="flex-1 bg-transparent outline-none text-3xl text-gray-900"
              value={amount}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '') {
                  setAmount('');
                  clearSubmitError();
                  return;
                }
                if (!isNaN(parseFloat(val)) && parseFloat(val) >= 0) {
                  const numVal = parseFloat(val);
                  const numBal = parseFloat(balance);
                  if (numVal > numBal) {
                    setAmount(balance);
                  } else {
                    setAmount(val);
                  }
                  clearSubmitError();
                }
              }}
            />
            <button
              onClick={handleSelectAll}
              className="ml-2 text-sm text-red-600 font-medium whitespace-nowrap"
            >
              全部提现
            </button>
          </div>

          <div className="mt-3 text-sm">
            <span className="text-gray-500">可提现拓展服务费 </span>
            <span className="text-gray-800">¥ {formatAmount(balance)}</span>
          </div>
        </div>

        {hasSubmitError && (
          <div className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded">
            {submitErrorMessageMessage}
          </div>
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

      {/* 收款账户选择弹窗 */}
      {showAccountModal && (
        <div
          className="fixed inset-0 z-20 bg-black/70 flex items-end justify-center"
          onClick={() => setShowAccountModal(false)}
        >
          <div
            className="bg-white rounded-t-2xl w-full max-h-[70vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <span className="font-bold text-gray-900">选择收款账户</span>
              <button onClick={() => setShowAccountModal(false)}>
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            {loadingAccounts && (
              <div className="text-center py-8 text-gray-500 text-sm">加载中...</div>
            )}

            {/* ✅ 加载错误使用Toast模式，不需要显示持久化错误 */}

            {!loadingAccounts && accounts.length === 0 && (
              <div className="text-center py-8 space-y-3">
                <div className="text-gray-400 text-sm">暂无绑定的收款账户</div>
                <button
                  className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg"
                  onClick={() => {
                    setShowAccountModal(false);
                    navigate('/card-management');
                  }}
                >
                  去添加收款账户
                </button>
              </div>
            )}

            {!loadingAccounts && accounts.length > 0 && (
              <div className="p-4 space-y-3">
                {accounts.map((item) => {
                  const isSelected = selectedAccount?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      className={`border rounded-lg p-3 cursor-pointer transition-colors ${isSelected ? 'border-red-500 bg-red-50' : 'border-gray-100 bg-gray-50'
                        }`}
                      onClick={() => {
                        setSelectedAccount(item);
                        setShowAccountModal(false);
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-800">
                          {item.account_name || item.type_text}
                        </span>
                        <span className="text-xs text-red-600">{item.type_text}</span>
                      </div>
                      <div className="text-xs text-gray-600">{item.account}</div>
                    </div>
                  );
                })}

                <button
                  className="w-full text-center text-sm text-red-600 py-2"
                  onClick={() => {
                    setShowAccountModal(false);
                    navigate('/card-management');
                  }}
                >
                  管理账户
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 支付密码弹窗 */}
      {showPasswordModal && (
        <div
          className="fixed inset-0 z-20 bg-black/70 flex items-center justify-center p-4"
          onClick={() => {
            setShowPasswordModal(false);
            setPayPassword('');
          }}
        >
          <div
            className="bg-white rounded-xl p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <span className="font-bold text-lg text-gray-900">输入支付密码</span>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPayPassword('');
                }}
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="mb-4">
              <div className="text-sm text-gray-500 mb-2">提现金额</div>
              <div className="text-2xl font-bold text-gray-900">¥ {amount}</div>
            </div>

            <div className="mb-4">
              <div className="text-sm text-gray-500 mb-2">备注 (可选)</div>
              <input
                type="text"
                placeholder="请输入备注信息"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 bg-gray-50 text-base outline-none focus:border-red-500"
              />
            </div>

            <input
              type="password"
              placeholder="请输入支付密码"
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-base outline-none focus:border-red-500 mb-4"
              value={payPassword}
              onChange={(e) => {
                setPayPassword(e.target.value);
                clearSubmitError();
              }}
              autoFocus
            />

            {hasSubmitError && (
              <div className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded mb-4">
                {submitErrorMessageMessage}
              </div>
            )}

            <button
              className={`w-full rounded-lg py-3 text-base font-medium ${submitting
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-red-600 text-white active:bg-red-700'
                }`}
              onClick={handleConfirmWithdraw}
              disabled={submitting}
            >
              {submitting ? '提交中...' : '确认提现'}
            </button>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export default ExtensionWithdraw;
