import React, { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight, CreditCard, Wallet, AlertCircle } from 'lucide-react';
import {
  fetchPaymentAccountList,
  PaymentAccountItem,
  submitWithdraw,
  fetchProfile,
} from '../../services/api';
import { getStoredToken } from '../../services/client';
import { Route } from '../../router/routes';

import { useNotification } from '../../context/NotificationContext';
import { isSuccess, extractError } from '../../utils/apiHelpers';

interface BalanceWithdrawProps {
  onBack: () => void;
  onNavigate?: (route: Route) => void;
}

const BalanceWithdraw: React.FC<BalanceWithdrawProps> = ({ onBack, onNavigate }) => {
  const { showToast } = useNotification();
  const [accounts, setAccounts] = useState<PaymentAccountItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<PaymentAccountItem | null>(null);
  const [showAccountModal, setShowAccountModal] = useState<boolean>(false);
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [amount, setAmount] = useState<string>('');
  const [payPassword, setPayPassword] = useState<string>('');
  const [remark, setRemark] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>('0.00');

  const [loadingBalance, setLoadingBalance] = useState<boolean>(false);

  // 费率
  const feeRate = 0.01; // 1%
  const serviceFee = amount ? (parseFloat(amount) * feeRate).toFixed(2) : '0';

  useEffect(() => {
    loadAccounts();
    loadBalance();
  }, []);

  const loadAccounts = async () => {
    const token = getStoredToken();
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetchPaymentAccountList(token);
      if (isSuccess(res) && res.data?.list) {
        setAccounts(res.data.list || []);
        const defaultAcc = res.data.list.find((acc: PaymentAccountItem) => Number(acc.is_default) === 1);
        if (defaultAcc) setSelectedAccount(defaultAcc);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadBalance = async () => {
    const token = getStoredToken();
    if (!token) return;
    setLoadingBalance(true);
    try {
      const response = await fetchProfile(token);
      if (isSuccess(response) && response.data?.userInfo) {
        const userInfo = response.data.userInfo;
        setBalance(parseFloat(userInfo.withdrawable_money || '0').toFixed(2));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBalance(false);
    }
  };

  const handleWithdrawClick = () => {
    if (!amount || parseFloat(amount) <= 0) {
      setSubmitError('请输入有效的提现金额');
      return;
    }
    if (parseFloat(amount) > parseFloat(balance)) {
      setSubmitError('提现金额不能超过可提现余额');
      return;
    }
    if (!selectedAccount) {
      setSubmitError('请选择提现账户');
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
    try {
      const res = await submitWithdraw({
        amount: parseFloat(amount),
        payment_account_id: selectedAccount!.id,
        pay_password: payPassword,
        remark: remark
      });
      if (isSuccess(res)) {
        showToast('success', '提交成功', res.msg || '提现申请提交成功');
        setAmount('');
        setPayPassword('');
        setSelectedAccount(null);
        setShowPasswordModal(false);
        loadBalance();
      } else {
        setSubmitError(extractError(res, '提交失败'));
      }
    } catch (e: any) {
      setSubmitError(e?.message || '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900 pb-safe">
      {/* Header */}
      <div className="bg-gradient-to-b from-orange-100 to-gray-50 p-5 pt-4">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm text-gray-700">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-gray-900">收益提现</h1>
          <div className="ml-auto text-xs text-orange-600 font-medium bg-white/50 px-3 py-1 rounded-full backdrop-blur-sm border border-orange-100/50">
            费率 {feeRate * 100}%
          </div>
        </div>

        {/* Amount Card */}
        <div className="bg-white rounded-[24px] p-6 shadow-xl shadow-orange-100/50 mb-6 border border-orange-50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-bl-[100px] -z-0 opacity-50"></div>

          <div className="relative z-10">
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm font-bold text-gray-400 tracking-wide flex items-center gap-2">
                <Wallet size={14} />
                提现金额
              </div>
              <div className="text-xs text-gray-400">
                可提现: {loadingBalance ? '...' : balance}
              </div>
            </div>

            <div className="flex items-baseline gap-2 border-b-2 border-orange-50 pb-2 focus-within:border-orange-500 transition-colors">
              <span className="text-3xl font-bold text-gray-900">¥</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => {
                  const val = e.target.value;
                  if (parseFloat(val) > parseFloat(balance)) {
                    setAmount(balance);
                  } else {
                    setAmount(val);
                  }
                  setSubmitError(null);
                }}
                placeholder="0.00"
                className="flex-1 text-4xl font-black text-gray-900 bg-transparent outline-none placeholder:text-gray-200 font-[DINAlternate-Bold]"
              />
              <button
                onClick={() => setAmount(balance)}
                className="text-xs font-bold text-orange-600 px-2 py-1 bg-orange-50 rounded-md"
              >
                全部
              </button>
            </div>

            <div className="mt-4 flex justify-between text-xs">
              <span className="text-gray-400">预计到账</span>
              <span className="text-gray-900 font-bold">
                ¥ {amount ? (parseFloat(amount) * (1 - feeRate)).toFixed(2) : '0.00'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Account Selection */}
      <div className="px-5 flex-1 space-y-4">
        <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <span className="w-1 h-4 bg-orange-500 rounded-full"></span>
          收款账户
        </h2>

        <div
          onClick={() => setShowAccountModal(true)}
          className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between active:scale-[0.99] transition-transform cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedAccount ? 'bg-orange-50 text-orange-600' : 'bg-gray-100 text-gray-400'}`}>
              <CreditCard size={20} />
            </div>
            <div>
              <div className="text-sm font-bold text-gray-900">
                {selectedAccount ? (selectedAccount.account_name || '已选账户') : '选择收款账户'}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {selectedAccount ? `${selectedAccount.type_text} (${selectedAccount.account?.slice(-4) || '****'})` : '点击选择绑定的银行卡/支付宝'}
              </div>
            </div>
          </div>
          <ChevronRight size={18} className="text-gray-300" />
        </div>

        {/* Remark Input */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="text-sm font-bold text-gray-900 w-16">备注</div>
          <input
            type="text"
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            placeholder="请输入提现备注 (选填)"
            className="flex-1 text-sm text-gray-900 outline-none placeholder:text-gray-400"
          />
        </div>

        {submitError && (
          <div className="bg-red-50 p-3 rounded-xl flex items-start gap-2">
            <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
            <span className="text-xs text-red-600 font-medium">{submitError}</span>
          </div>
        )}
      </div>

      {/* Bottom Action */}
      <div className="p-5 safe-area-bottom bg-white/80 backdrop-blur border-t border-gray-100">
        <button
          onClick={handleWithdrawClick}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FF9F2E] text-white font-bold text-lg shadow-lg shadow-orange-200 active:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none"
          disabled={submitting}
        >
          {submitting ? '处理中...' : '确认提现资金'}
        </button>
        <div className="text-center mt-3 text-[10px] text-gray-400">
          资金提现 T+1 到账 | 每日限额 ¥50,000
        </div>
      </div>

      {/* Account Modal */}
      {showAccountModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center animate-in fade-in" onClick={() => setShowAccountModal(false)}>
          <div className="bg-white w-full rounded-t-[32px] p-6 pb-safe animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">选择收款账户</h3>
              <button onClick={() => setShowAccountModal(false)} className="p-2 bg-gray-100 rounded-full text-gray-500">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {accounts.map(acc => (
                <div
                  key={acc.id}
                  onClick={() => { setSelectedAccount(acc); setShowAccountModal(false); }}
                  className={`p-4 rounded-xl border flex items-center gap-4 transition-all ${selectedAccount?.id === acc.id
                    ? 'border-orange-500 bg-orange-50/50 shadow-sm'
                    : 'border-gray-100 bg-white'
                    }`}
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-xs">
                    {acc.type === 'alipay' ? '支' : acc.type === 'wechat' ? '微' : '银'}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-gray-900 flex items-center gap-2">
                      {acc.account_name}
                      {acc.is_default === 1 && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded">默认</span>}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{acc.type_text} • {acc.account}</div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedAccount?.id === acc.id ? 'border-orange-500 bg-orange-500' : 'border-gray-300'}`}>
                    {selectedAccount?.id === acc.id && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                </div>
              ))}

              <button
                onClick={() => { setShowAccountModal(false); onNavigate?.('card-management'); }}
                className="w-full py-3 rounded-xl border border-dashed border-gray-300 text-gray-500 text-sm font-medium hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                + 添加新账户
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in" onClick={() => setShowPasswordModal(false)}>
          <div className="bg-white w-full max-w-sm rounded-[24px] p-6 shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">安全验证</h3>
              <p className="text-xs text-gray-400 mt-1">请输入支付密码以确认操作</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-center">
              <div className="text-xs text-gray-500 mb-1">本次提现金额</div>
              <div className="text-2xl font-black text-gray-900 font-[DINAlternate-Bold]">¥ {amount}</div>
            </div>

            <input
              type="password"
              autoFocus
              value={payPassword}
              onChange={(e) => { setPayPassword(e.target.value); setSubmitError(null); }}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-center text-lg tracking-[8px] font-bold outline-none focus:border-orange-500 focus:bg-white transition-all mb-4"
              placeholder="••••••"
              maxLength={6}
            />

            {submitError && (
              <div className="text-xs text-center text-red-500 mb-4">{submitError}</div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setShowPasswordModal(false)} className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-bold text-sm">取消</button>
              <button onClick={handleConfirmWithdraw} className="flex-1 py-3 rounded-xl bg-gray-900 text-white font-bold text-sm shadow-lg shadow-gray-200">确认提交</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BalanceWithdraw;
