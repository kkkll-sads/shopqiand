/**
 * BalanceRecharge - 余额充值页面
 * 已迁移: 使用 React Router 导航
 * 已重构: 拆分为多个子组件和 hooks
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Zap, Banknote, Wallet, Shield, X } from 'lucide-react';

import { LoadingSpinner, PaymentRedirect } from '@/components/common';
import { CompanyAccountItem, submitRechargeOrder, updateRechargeOrderRemark } from '@/services';
import { getStoredToken } from '@/services/client';
import { useNotification } from '@/context/NotificationContext';
import { isSuccess } from '@/utils/apiHelpers';
import { debugLog, errorLog } from '@/utils/logger';

import RechargeOrderList from './RechargeOrderList';
import RechargeOrderDetail from './RechargeOrderDetail';
import {
  AmountSelector,
  PaymentMethodCard,
  CustomAmountInput,
  MatchingView,
  MatchedView,
} from './components/recharge';
import { usePaymentMethods } from './hooks/usePaymentMethods';
import { useBalanceTransfer } from './hooks/useBalanceTransfer';
import { useAccountMatching } from './hooks/useAccountMatching';
import { useRechargeForm } from './hooks/useRechargeForm';

interface BalanceRechargeProps {
  initialAmount?: string;
}

const BalanceRecharge: React.FC<BalanceRechargeProps> = ({ initialAmount }) => {
  const navigate = useNavigate();
  const { showToast } = useNotification();

  // Common State
  const [amount, setAmount] = useState<string>(initialAmount || '');
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  // View State: 'input' | 'matching' | 'matched' | 'history' | 'detail'
  const [viewState, setViewState] = useState<'input' | 'matching' | 'matched' | 'history' | 'detail'>('input');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [matchedAccount, setMatchedAccount] = useState<CompanyAccountItem | null>(null);

  // Payment Methods
  const { allAccounts, availableMethods, loading } = usePaymentMethods();

  // Balance Transfer
  const {
    transferAmount,
    setTransferAmount,
    withdrawableBalance,
    transferring,
    handleTransfer,
  } = useBalanceTransfer();

  // Image Upload State
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Payment Browser State
  const [showPaymentBrowser, setShowPaymentBrowser] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

  // Confirmation Modal State (for bank card)
  const [lastFourDigits, setLastFourDigits] = useState<string>('');

  // Warning Details State
  const [showWarningDetails, setShowWarningDetails] = useState(false);

  // Account Matching
  const { startMatching } = useAccountMatching({
    amount,
    selectedMethod,
    allAccounts,
    onMatched: (account) => {
      setMatchedAccount(account);
      if (selectedMethod === 'bank_card') {
        setViewState('matched');
      }
    },
    onPaymentUrl: (url, orderId) => {
      setPaymentUrl(url);
      setPendingOrderId(orderId);
      setShowPaymentBrowser(true);
    },
    onError: () => {
      setViewState('input');
    },
  });

  // Recharge Form
  const { submitting, handleSubmitOrder } = useRechargeForm({
    amount,
    selectedMethod,
    matchedAccount,
    uploadedImage,
    lastFourDigits,
    onSuccess: () => {
      setAmount('');
      setSelectedMethod(null);
      setUploadedImage(null);
      setImagePreview(null);
      setMatchedAccount(null);
      setLastFourDigits('');
      setViewState('input');
      navigate(-1);
    },
  });

  // 当显示银行卡账户信息时，启用页面复制功能
  useEffect(() => {
    if (viewState === 'matched' && selectedMethod === 'bank_card') {
      document.body.setAttribute('data-allow-copy', 'true');
      debugLog('BalanceRecharge', '已启用复制功能');
    } else {
      document.body.setAttribute('data-allow-copy', 'false');
      debugLog('BalanceRecharge', '已禁用复制功能');
    }

    return () => {
      document.body.setAttribute('data-allow-copy', 'false');
    };
  }, [viewState, selectedMethod]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
      showToast('error', '格式错误', '只支持 JPG、PNG、GIF 格式');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('error', '文件过大', '图片大小不能超过 5MB');
      return;
    }

    setUploadedImage(file);

    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleImageRemove = () => {
    setUploadedImage(null);
    setImagePreview(null);
  };

  const handleReset = () => {
    setViewState('input');
    setMatchedAccount(null);
    setUploadedImage(null);
    setImagePreview(null);
  };

  // Handle navigation to detail
  const handleNavigateToDetail = (orderId: string) => {
    setSelectedOrderId(orderId);
    setViewState('detail');
  };

  // Render Functions
  const renderInputView = () => (
    <>
      {/* 1. Header */}
      <div className="bg-gradient-to-b from-red-100 to-gray-50 px-4 py-5 pt-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm text-gray-700"
            >
              <ChevronLeft size={20} />
            </button>
            <h1 className="text-xl font-bold text-gray-900">专项金申购通道</h1>
          </div>
          <button
            onClick={() => setViewState('history')}
            className="text-xs font-bold text-red-600 bg-white/50 px-3 py-1.5 rounded-full border border-red-100 flex items-center gap-1 hover:bg-white transition-colors"
          >
            <Banknote size={14} />
            充值记录
          </button>
        </div>

        <AmountSelector amount={amount} onAmountChange={setAmount} />

        {/* Transfer Section */}
        <div className="bg-white rounded-[24px] p-6 shadow-xl shadow-blue-100/50 mb-4 border border-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wallet className="text-blue-500" size={20} />
              <span className="text-sm font-bold text-gray-800">可提现余额划转</span>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">可提现余额</p>
              <p className="text-lg font-bold text-blue-600">¥{(withdrawableBalance ?? 0).toFixed(2)}</p>
            </div>
          </div>

          <CustomAmountInput
            amount={transferAmount}
            onAmountChange={setTransferAmount}
            label="划转金额"
            className="mb-4"
          />

          {/* Display Transfer Amount */}
          {transferAmount && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-sm text-blue-700 font-medium">
                划转金额：¥{Number(transferAmount).toFixed(2)}
              </p>
              <p className="text-xs text-blue-600 mt-1">备注：余额划转</p>
            </div>
          )}

          <button
            onClick={handleTransfer}
            disabled={!transferAmount || transferring}
            className={`w-full py-3 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 ${
              transferAmount && !transferring
                ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-200 active:scale-[0.98]'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
            }`}
          >
            {transferring ? (
              <>
                <LoadingSpinner className="w-5 h-5 border-white/20 border-t-white" />
                划转中...
              </>
            ) : (
              <>
                <Zap size={18} fill="currentColor" />
                立即划转到可用余额
              </>
            )}
          </button>

          <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
            <Shield size={12} />
            划转后资金可用于专项金申购
          </p>
        </div>
      </div>

      {/* 2. Payment Method Selection */}
      <div className="px-4 flex-1">
        <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-1 h-4 bg-red-600 rounded-full"></span>
          选择支付通道
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="md" className="text-red-500" />
          </div>
        ) : availableMethods.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 mb-6">
            {availableMethods.map((method) => (
              <PaymentMethodCard
                key={method.id}
                method={method}
                selected={selectedMethod === method.id}
                onSelect={setSelectedMethod}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400 text-sm bg-gray-50 rounded-xl">
            暂无可用支付通道
          </div>
        )}
      </div>

      {/* 3. Bottom Action */}
      <div className="px-4 py-5 pb-safe bg-white/80 backdrop-blur border-t border-gray-100">
        <button
          onClick={startMatching}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white font-bold text-lg shadow-lg shadow-red-200 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
        >
          <Zap size={20} fill="currentColor" />
          立即接入匹配 · Match
        </button>
        <div className="text-center mt-3 text-[10px] text-gray-400">
          安全加密通道 | 资金存管保障 | 24H 实时到账
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      {viewState === 'input' && renderInputView()}
      {viewState === 'matching' && <MatchingView />}
      {viewState === 'matched' && matchedAccount && (
        <MatchedView
          account={matchedAccount}
          amount={amount}
          selectedMethod={selectedMethod}
          imagePreview={imagePreview}
          uploadedImage={uploadedImage}
          lastFourDigits={lastFourDigits}
          submitting={submitting}
          onImageSelect={handleImageSelect}
          onImageRemove={handleImageRemove}
          onLastFourDigitsChange={setLastFourDigits}
          onSubmit={handleSubmitOrder}
          onReset={handleReset}
        />
      )}
      {viewState === 'history' && (
        <RechargeOrderList
          onBack={() => setViewState('input')}
          onOrderSelect={handleNavigateToDetail}
        />
      )}
      {viewState === 'detail' && (
        <RechargeOrderDetail
          orderId={selectedOrderId}
          onBack={() => setViewState('history')}
        />
      )}

      {/* 支付跳转组件 */}
      <PaymentRedirect
        isOpen={showPaymentBrowser}
        url={paymentUrl}
        title="支付收银台"
        amount={amount}
        orderNo={pendingOrderId || undefined}
        timeout={300}
        onClose={() => {
          setShowPaymentBrowser(false);
          setPaymentUrl('');
          setViewState('input');
        }}
        onSuccess={async () => {
          const remark = '用户确认支付成功';
          if (pendingOrderId) {
            try {
              const token = getStoredToken();
              await updateRechargeOrderRemark({
                order_id: pendingOrderId,
                user_remark: remark,
                token: token || undefined,
              });
            } catch (error) {
              errorLog('BalanceRecharge', 'Failed to update order remark', error);
            }
          }

          setShowPaymentBrowser(false);
          setPaymentUrl('');
          showToast('success', '支付状态已提交', '请等待系统确认');
          setViewState('history');
        }}
        onRefreshUrl={async () => {
          if (!selectedMethod || !matchedAccount) return null;

          try {
            const response = await submitRechargeOrder({
              company_account_id: matchedAccount.id,
              amount: Number(amount),
              payment_type: selectedMethod,
              payment_method: 'online',
            });

            if (isSuccess(response) && response.data?.pay_url) {
              setPendingOrderId(response.data.order_id || response.data.order_no || null);
              return response.data.pay_url;
            }
          } catch (error) {
            errorLog('BalanceRecharge', 'Failed to refresh payment URL', error);
          }
          return null;
        }}
      />
    </div>
  );
};

export default BalanceRecharge;
