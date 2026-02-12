/**
 * BalanceRecharge - 余额充值页面
 * 已迁移: 使用 React Router 导航
 * 已重构: 拆分为多个子组件和 hooks
 */
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { PaymentRedirect } from '@/components/common';
import { submitRechargeOrder, updateRechargeOrderRemark } from '@/services';
import { getStoredToken } from '@/services/client';
import { useNotification } from '@/context/NotificationContext';
import { isSuccess } from '@/utils/apiHelpers';
import { debugLog, errorLog } from '@/utils/logger';

import RechargeOrderList from './RechargeOrderList';
import RechargeOrderDetail from './RechargeOrderDetail';
import { MatchingView, MatchedView } from './components/recharge';
import { usePaymentMethods } from './hooks/usePaymentMethods';
import { useBalanceTransfer } from './hooks/useBalanceTransfer';
import { useAccountMatching } from './hooks/useAccountMatching';
import { useRechargeForm } from './hooks/useRechargeForm';
import RechargeInputView from './balance-recharge/RechargeInputView';
import { useBalanceRechargeState } from './balance-recharge/useBalanceRechargeState';
import type { BalanceRechargeProps } from './balance-recharge/types';

const BalanceRecharge: React.FC<BalanceRechargeProps> = ({ initialAmount }) => {
  const navigate = useNavigate();
  const { showToast } = useNotification();

  const {
    amount,
    setAmount,
    selectedMethod,
    setSelectedMethod,
    viewState,
    setViewState,
    selectedOrderId,
    matchedAccount,
    setMatchedAccount,
    uploadedImage,
    imagePreview,
    showPaymentBrowser,
    paymentUrl,
    pendingOrderId,
    lastFourDigits,
    setLastFourDigits,
    handleImageSelect,
    handleImageRemove,
    resetMatchedFlow,
    resetAfterSubmit,
    navigateToDetail,
    openPaymentBrowser,
    hidePaymentBrowser,
    closePaymentBrowserToInput,
  } = useBalanceRechargeState({ initialAmount, showToast });

  const { allAccounts, availableMethods, loading } = usePaymentMethods();

  const {
    transferAmount,
    setTransferAmount,
    withdrawableBalance,
    transferring,
    handleTransfer,
  } = useBalanceTransfer();

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
      openPaymentBrowser(url, orderId);
    },
    onError: () => {
      setViewState('input');
    },
  });

  const { submitting, handleSubmitOrder } = useRechargeForm({
    amount,
    selectedMethod,
    matchedAccount,
    uploadedImage,
    lastFourDigits,
    onSuccess: () => {
      resetAfterSubmit();
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      {viewState === 'input' && (
        <RechargeInputView
          amount={amount}
          onAmountChange={setAmount}
          onBack={() => navigate(-1)}
          onShowHistory={() => setViewState('history')}
          transferAmount={transferAmount}
          onTransferAmountChange={setTransferAmount}
          withdrawableBalance={withdrawableBalance}
          transferring={transferring}
          onTransfer={handleTransfer}
          loading={loading}
          availableMethods={availableMethods}
          selectedMethod={selectedMethod}
          onSelectMethod={setSelectedMethod}
          onStartMatching={startMatching}
        />
      )}

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
          onReset={resetMatchedFlow}
        />
      )}

      {viewState === 'history' && (
        <RechargeOrderList onBack={() => setViewState('input')} onOrderSelect={navigateToDetail} />
      )}

      {viewState === 'detail' && (
        <RechargeOrderDetail orderId={selectedOrderId} onBack={() => setViewState('history')} />
      )}

      <PaymentRedirect
        isOpen={showPaymentBrowser}
        url={paymentUrl}
        title="支付收银台"
        amount={amount}
        orderNo={pendingOrderId || undefined}
        timeout={300}
        onClose={closePaymentBrowserToInput}
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

          hidePaymentBrowser();
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
              const nextOrderId = response.data.order_id ?? response.data.order_no ?? null;
              openPaymentBrowser(String(response.data.pay_url), nextOrderId === null ? null : String(nextOrderId));
              return String(response.data.pay_url);
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
