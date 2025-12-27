import React, { useState, useEffect } from 'react';
import { Loader2, ChevronLeft, CreditCard, Wallet, AlertCircle, ShieldCheck } from 'lucide-react';
import { rechargeServiceFee, fetchProfile, AUTH_TOKEN_KEY, USER_INFO_KEY } from '../../services/api';
import { UserInfo } from '../../types';
import { formatAmount } from '../../utils/format';

interface ServiceRechargeProps {
  onBack: () => void;
}

const ServiceRecharge: React.FC<ServiceRechargeProps> = ({ onBack }) => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [payType, setPayType] = useState<'money' | 'withdraw'>('money');
  const [amount, setAmount] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) return;
    try {
      const response = await fetchProfile(token);
      if (response.code === 1 && response.data?.userInfo) {
        setUserInfo(response.data.userInfo);
        localStorage.setItem(USER_INFO_KEY, JSON.stringify(response.data.userInfo));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRecharge = async () => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) return;
    setLoading(true);
    try {
      const response = await rechargeServiceFee({
        amount: Number(amount),
        source: payType === 'withdraw' ? 'withdrawable_money' : 'balance_available',
        token,
      });

      if (response.code === 1) {
        setSuccess('划转成功');
        setAmount('');
        setShowConfirmModal(false);
        loadUserInfo();
        setTimeout(() => {
          setSuccess(null);
          onBack();
        }, 1000);
      } else {
        setError(response.msg || '划转失败');
        setShowConfirmModal(false);
      }
    } catch (err: any) {
      setError(err?.msg || '划转失败');
      setShowConfirmModal(false);
    } finally {
      setLoading(false);
    }
  };

  const currentBalance = payType === 'money'
    ? Number(userInfo?.money || 0)
    : Number(userInfo?.withdrawable_money || 0);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900 pb-safe">
      {/* Header */}
      <div className="bg-gradient-to-b from-orange-100 to-gray-50 p-5 pt-4">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm text-gray-700">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-gray-900">确权金划转</h1>
          <div className="ml-auto text-xs text-orange-600 font-medium bg-white/50 px-3 py-1 rounded-full backdrop-blur-sm border border-orange-100/50 flex items-center gap-1">
            <ShieldCheck size={12} fill="currentColor" className="text-orange-500" />
            安全存管中
          </div>
        </div>

        {/* Amount Card */}
        <div className="bg-white rounded-[24px] p-6 shadow-xl shadow-orange-100/50 mb-6 border border-orange-50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-bl-[100px] -z-0 opacity-50"></div>

          <div className="relative z-10">
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm font-bold text-gray-400 tracking-wide flex items-center gap-2">
                <CreditCard size={14} />
                划转金额
              </div>
              <div className="text-xs text-gray-400">
                服务费余额: <span className="text-gray-900 font-bold">{formatAmount(userInfo?.service_fee_balance)}</span>
              </div>
            </div>

            <div className="flex items-baseline gap-2 border-b-2 border-orange-50 pb-2 focus-within:border-orange-500 transition-colors">
              <span className="text-3xl font-bold text-gray-900">¥</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError(null);
                }}
                placeholder="0.00"
                className="flex-1 text-4xl font-black text-gray-900 bg-transparent outline-none placeholder:text-gray-200 font-[DINAlternate-Bold]"
              />
            </div>
            {error && <div className="text-xs text-red-500 mt-2">{error}</div>}
          </div>
        </div>
      </div>

      {/* Payment Method */}
      <div className="px-5 flex-1 space-y-4">
        <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <span className="w-1 h-4 bg-orange-500 rounded-full"></span>
          划转来源
        </h2>

        <div className="grid grid-cols-1 gap-3">
          <div
            onClick={() => setPayType('money')}
            className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${payType === 'money' ? 'bg-orange-50 border-orange-500 shadow-sm' : 'bg-white border-gray-100 hover:bg-gray-50'
              }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${payType === 'money' ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'}`}>
                <Wallet size={20} />
              </div>
              <div>
                <div className="font-bold text-gray-900">专项金支付</div>
                <div className="text-xs text-gray-500 mt-0.5">可用: ¥ {formatAmount(userInfo?.money)}</div>
              </div>
            </div>
            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${payType === 'money' ? 'border-orange-500 bg-orange-500' : 'border-gray-300'}`}>
              {payType === 'money' && <div className="w-2 h-2 bg-white rounded-full" />}
            </div>
          </div>

          <div
            onClick={() => setPayType('withdraw')}
            className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${payType === 'withdraw' ? 'bg-orange-50 border-orange-500 shadow-sm' : 'bg-white border-gray-100 hover:bg-gray-50'
              }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${payType === 'withdraw' ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'}`}>
                <CreditCard size={20} />
              </div>
              <div>
                <div className="font-bold text-gray-900">提现余额支付</div>
                <div className="text-xs text-gray-500 mt-0.5">可用: ¥ {formatAmount(userInfo?.withdrawable_money)}</div>
              </div>
            </div>
            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${payType === 'withdraw' ? 'border-orange-500 bg-orange-500' : 'border-gray-300'}`}>
              {payType === 'withdraw' && <div className="w-2 h-2 bg-white rounded-full" />}
            </div>
          </div>
        </div>

        {/* Tip */}
        <div className="bg-orange-50 p-3 rounded-xl flex items-start gap-2">
          <AlertCircle size={16} className="text-orange-500 shrink-0 mt-0.5" />
          <p className="text-xs text-orange-600 leading-tight">
            服务费仅用于订单寄售时使用，无法提现和转出，请按需充值。
          </p>
        </div>
      </div>

      {/* Bottom Action */}
      <div className="p-5 safe-area-bottom bg-white/80 backdrop-blur border-t border-gray-100">
        <button
          onClick={() => {
            const val = Number(amount);
            if (!amount || val <= 0) {
              setError('请输入有效金额');
              return;
            }
            if (val > currentBalance) {
              setError('余额不足');
              return;
            }
            setShowConfirmModal(true);
          }}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FF9F2E] text-white font-bold text-lg shadow-lg shadow-orange-200 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
          disabled={loading}
        >
          {loading ? '处理中...' : '确认划转'}
        </button>
      </div>

      {/* Confirm Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in" onClick={() => setShowConfirmModal(false)}>
          <div className="bg-white w-full max-w-sm rounded-[24px] p-6 shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">确认划转</h3>

            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-center">
              <div className="text-xs text-gray-500 mb-1">划转金额</div>
              <div className="text-2xl font-black text-gray-900 font-[DINAlternate-Bold]">¥ {amount}</div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-bold text-sm">取消</button>
              <button
                onClick={handleRecharge}
                className="flex-1 py-3 rounded-xl bg-orange-600 text-white font-bold text-sm shadow-lg shadow-orange-200"
                disabled={loading}
              >
                {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : '确定'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceRecharge;
