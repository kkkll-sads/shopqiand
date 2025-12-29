import React, { useState, useEffect } from 'react';
import { Loader2, X, ChevronRight } from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer';
import {
  fetchProfile,
  fetchPaymentAccountList,
  submitStaticIncomeWithdraw,
  PaymentAccountItem,
} from '../../services/api';
import { getStoredToken } from '../../services/client';
import { Route } from '../../router/routes';
import { UserInfo } from '../../types';

import { formatAmount } from '../../utils/format';
import { useNotification } from '../../context/NotificationContext';
import { USER_INFO_KEY, AUTH_TOKEN_KEY } from '../../constants/storageKeys';
import { isSuccess, extractError } from '../../utils/apiHelpers';

interface ExtensionWithdrawProps {
  onBack: () => void;
  onNavigate?: (route: Route) => void;
}

const ExtensionWithdraw: React.FC<ExtensionWithdrawProps> = ({ onBack, onNavigate }) => {
  const { showToast } = useNotification();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(() => {
    try {
      const cached = localStorage.getItem(USER_INFO_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.warn('解析本地用户信息失败:', error);
      return null;
    }
  });

  const [accounts, setAccounts] = useState<PaymentAccountItem[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<PaymentAccountItem | null>(null);
  const [showAccountModal, setShowAccountModal] = useState<boolean>(false);
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [amount, setAmount] = useState<string>('');
  const [payPassword, setPayPassword] = useState<string>('');
  const [remark, setRemark] = useState<string>('');
  const [loadingAccounts, setLoadingAccounts] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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
          localStorage.setItem('cat_user_info', JSON.stringify(response.data.userInfo));
        }
      } catch (err) {
        console.error('获取用户信息失败:', err);
      }
    };

    loadUserInfo();
  }, []);

  // 加载收款账户列表
  useEffect(() => {
    const loadAccounts = async () => {
      const token = getStoredToken();
      if (!token) return;

      setLoadingAccounts(true);
      setError(null);
      try {
        const res = await fetchPaymentAccountList(token);
        if (isSuccess(res) && res.data?.list) {
          setAccounts(res.data.list || []);
          // 默认选择第一个账户或默认账户
          if (res.data.list.length > 0) {
            const defaultAccount = res.data.list.find((acc: PaymentAccountItem) => Number(acc.is_default) === 1);
            setSelectedAccount(defaultAccount || res.data.list[0]);
          }
        } else {
          setError(extractError(res, '获取收款账户信息失败'));
        }
      } catch (e: any) {
        setError(e?.message || '获取收款账户信息失败');
      } finally {
        setLoadingAccounts(false);
      }
    };

    loadAccounts();
  }, []);

  const handleSelectAll = () => {
    const staticIncome = parseFloat(balance);
    if (staticIncome > 0) {
      setAmount(staticIncome.toFixed(2));
      setSubmitError(null);
    }
  };

  const handleWithdrawClick = () => {
    const withdrawAmount = Number(amount);
    if (!amount || withdrawAmount <= 0) {
      setSubmitError('请输入有效的提现金额');
      return;
    }

    const staticIncome = Number(balance);
    if (withdrawAmount > staticIncome) {
      setSubmitError('提现金额不能超过可提现拓展服务费');
      return;
    }

    if (!selectedAccount || !selectedAccount.id) {
      setSubmitError('请选择收款账户');
      return;
    }

    setSubmitError(null);
    setShowPasswordModal(true);
  };

  const handleConfirmWithdraw = async () => {
    if (!payPassword) {
      setSubmitError('请输入支付密码');
      return;
    }
    if (!/^\d{6}$/.test(payPassword)) {
      setSubmitError('支付密码必须为6位数字');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      setSubmitError('未找到用户登录信息，请先登录');
      setSubmitting(false);
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
          localStorage.setItem(USER_INFO_KEY, JSON.stringify(updatedResponse.data.userInfo));
        }
      } else {
        setSubmitError(extractError(response, '提交提现申请失败'));
      }
    } catch (err: any) {
      console.error('提交提现申请失败:', err);
      setSubmitError(err?.message || '提交提现申请失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageContainer title="拓展提现" onBack={onBack}>
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
                  setSubmitError(null);
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
                  setSubmitError(null);
                }
              }}
            />
            <button
              onClick={handleSelectAll}
              className="ml-2 text-sm text-orange-600 font-medium whitespace-nowrap"
            >
              全部提现
            </button>
          </div>

          <div className="mt-3 text-sm">
            <span className="text-gray-500">可提现拓展服务费 </span>
            <span className="text-gray-800">¥ {formatAmount(balance)}</span>
          </div>
        </div>

        {submitError && (
          <div className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded">
            {submitError}
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
          className="w-full bg-orange-600 text-white rounded-full py-3.5 text-base font-medium active:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

            {error && (
              <div className="text-xs text-red-500 bg-red-50 px-4 py-2 m-4 rounded">
                {error}
              </div>
            )}

            {!loadingAccounts && !error && accounts.length === 0 && (
              <div className="text-center py-8 space-y-3">
                <div className="text-gray-400 text-sm">暂无绑定的收款账户</div>
                {onNavigate && (
                  <button
                    className="text-sm text-orange-600 bg-orange-50 px-4 py-2 rounded-lg"
                    onClick={() => {
                      setShowAccountModal(false);
                      onNavigate('card-management');
                    }}
                  >
                    去添加收款账户
                  </button>
                )}
              </div>
            )}

            {!loadingAccounts && !error && accounts.length > 0 && (
              <div className="p-4 space-y-3">
                {accounts.map((item) => {
                  const isSelected = selectedAccount?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      className={`border rounded-lg p-3 cursor-pointer transition-colors ${isSelected ? 'border-orange-500 bg-orange-50' : 'border-gray-100 bg-gray-50'
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
                        <span className="text-xs text-orange-600">{item.type_text}</span>
                      </div>
                      <div className="text-xs text-gray-600">{item.account}</div>
                    </div>
                  );
                })}

                {onNavigate && (
                  <button
                    className="w-full text-center text-sm text-orange-600 py-2"
                    onClick={() => {
                      setShowAccountModal(false);
                      onNavigate('card-management');
                    }}
                  >
                    管理账户
                  </button>
                )}
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
                className="w-full border rounded-lg px-3 py-2 bg-gray-50 text-base outline-none focus:border-orange-500"
              />
            </div>

            <input
              type="password"
              placeholder="请输入支付密码"
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-base outline-none focus:border-orange-500 mb-4"
              value={payPassword}
              onChange={(e) => {
                setPayPassword(e.target.value);
                setSubmitError(null);
              }}
              autoFocus
            />

            {submitError && (
              <div className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded mb-4">
                {submitError}
              </div>
            )}

            <button
              className={`w-full rounded-lg py-3 text-base font-medium ${submitting
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-orange-500 text-white active:bg-orange-600'
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
