/**
 * useRechargeForm - 充值表单逻辑 Hook
 */
import { useState, useCallback } from 'react';
import { CompanyAccountItem, submitRechargeOrder } from '@/services';
import { useNotification } from '@/context/NotificationContext';
import { isSuccess } from '@/utils/apiHelpers';
import { errorLog } from '@/utils/logger';

interface UseRechargeFormParams {
  amount: string;
  selectedMethod: string | null;
  matchedAccount: CompanyAccountItem | null;
  uploadedImage: File | null;
  lastFourDigits: string;
  onSuccess?: () => void;
}

export function useRechargeForm({
  amount,
  selectedMethod,
  matchedAccount,
  uploadedImage,
  lastFourDigits,
  onSuccess,
}: UseRechargeFormParams) {
  const { showToast } = useNotification();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitOrder = useCallback(async () => {
    if (!uploadedImage) {
      showToast('warning', '请上传截图', '请先上传付款截图');
      return;
    }

    if (!matchedAccount) {
      showToast('error', '系统错误', '未找到匹配账户');
      return;
    }

    // Validate last four digits for bank card payments
    if (selectedMethod === 'bank_card' && lastFourDigits.length !== 4) {
      showToast('warning', '请输入卡号', '请输入付款银行卡后四位号码');
      return;
    }

    setSubmitting(true);
    try {
      const response = await submitRechargeOrder({
        company_account_id: matchedAccount.id,
        amount: Number(amount),
        payment_screenshot: uploadedImage,
        payment_type: selectedMethod || undefined,
        card_last_four: selectedMethod === 'bank_card' ? lastFourDigits : undefined,
      });

      if (isSuccess(response)) {
        showToast('success', '提交成功', `订单号: ${response.data?.order_no || response.data?.order_id || '已生成'}`);
        onSuccess?.();
      } else {
        showToast('error', '提交失败', '充值订单提交失败，请重试');
      }
    } catch (error: any) {
      errorLog('useRechargeForm', '提交充值订单失败', error);
      showToast('error', '提交失败', '网络错误，请重试');
    } finally {
      setSubmitting(false);
    }
  }, [amount, selectedMethod, matchedAccount, uploadedImage, lastFourDigits, showToast, onSuccess]);

  return {
    submitting,
    handleSubmitOrder,
  };
}
