import { useCallback, useState } from 'react';
import { submitRightsDeclaration } from '@/services/rightsDeclaration';
import { getStoredToken } from '@/services/client';
import { ClaimFormState, ClaimFormValidation } from './useClaimForm';
import { isSuccess, extractError } from '@/utils/apiHelpers';
import { errorLog } from '@/utils/logger';

type ReviewStats = {
  pending_count: number;
  approved_count: number;
  isLoading: boolean;
};

type UseClaimSubmitParams = {
  form: ClaimFormState;
  validateForm: () => ClaimFormValidation;
  reviewStats: ReviewStats;
  resetForm: () => void;
  resetUploads: () => void;
  loadHistory: (token?: string) => Promise<void>;
  loadReviewStats: (token?: string) => Promise<void>;
  onNavigateHistory?: () => void;
  showToast: (type: string, title: string, message?: string) => void;
};

export const useClaimSubmit = ({
  form,
  validateForm,
  reviewStats,
  resetForm,
  resetUploads,
  loadHistory,
  loadReviewStats,
  onNavigateHistory,
  showToast,
}: UseClaimSubmitParams) => {
  const [submitting, setSubmitting] = useState(false);

  const submit = useCallback(async () => {
    const validation = validateForm();
    if (!validation.validAmount) return;
    if (!validation.hasImages) {
      showToast('warning', '缺少凭证', '请上传凭证截图');
      return;
    }

    if (!reviewStats.isLoading && reviewStats.pending_count > 0) {
      showToast('info', '已有审核中记录', '请等待审核完成后再提交新的申请');
      onNavigateHistory?.();
      return;
    }

    if (reviewStats.isLoading) {
      showToast('info', '数据加载中', '正在检查审核状态，请稍后再试');
      return;
    }

    const token = getStoredToken();
    if (!token) {
      showToast('error', '登录过期', '请重新登录');
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitRightsDeclaration(
        {
          voucher_type: form.voucher_type,
          amount: parseFloat(form.amount),
          images: form.images,
          remark: form.remark,
        },
        token,
      );

      if (isSuccess(res)) {
        showToast('success', '提交成功', '确权申报提交成功，请等待管理员审核');
        resetForm();
        resetUploads();
        await Promise.all([loadHistory(token), loadReviewStats(token)]);
      } else {
        showToast('error', '提交失败', extractError(res, '提交失败，请重试'));
      }
    } catch (error: any) {
      errorLog('useClaimSubmit', '提交申报失败', error);
      const message = error?.message || error?.msg || '网络错误，请重试';
      showToast('error', '提交失败', message);
    } finally {
      setSubmitting(false);
    }
  }, [
    form.amount,
    form.images,
    form.remark,
    form.voucher_type,
    loadHistory,
    loadReviewStats,
    onNavigateHistory,
    resetForm,
    resetUploads,
    reviewStats.isLoading,
    reviewStats.pending_count,
    showToast,
    validateForm,
  ]);

  return {
    submitting,
    submit,
  };
};

export default useClaimSubmit;
