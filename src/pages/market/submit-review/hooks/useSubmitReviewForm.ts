import { useCallback, useState } from 'react';
import type { ChangeEvent, RefObject } from 'react';
import { useNotification } from '@/context/NotificationContext';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useStateMachine } from '@/hooks/useStateMachine';
import { FormEvent, FormState } from '@/types/states';
import { submitReview, type SubmitReviewParams } from '@/services/shop';
import { extractError, isSuccess } from '@/utils/apiHelpers';
import { errorLog } from '@/utils/logger';
import type { UploadState } from '../types';
import { useReviewUploads } from './reviewUploads';
import { validateReviewSubmission } from './reviewValidation';

interface UseSubmitReviewFormParams {
  orderId: string | null;
  productId: string | null;
  onSubmitSuccess: (orderId: string) => void;
}

interface UseSubmitReviewFormResult {
  rating: number;
  content: string;
  isAnonymous: boolean;
  imageUploadStates: UploadState[];
  videoUploadState: UploadState | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  videoInputRef: RefObject<HTMLInputElement | null>;
  errorMessage: string;
  hasError: boolean;
  submitting: boolean;
  setRating: (value: number) => void;
  setContent: (value: string) => void;
  setIsAnonymous: (value: boolean) => void;
  handleImageSelect: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleRemoveImage: (index: number) => void;
  handleVideoSelect: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleRemoveVideo: () => void;
  handleSubmit: () => void;
}

export function useSubmitReviewForm({
  orderId,
  productId,
  onSubmitSuccess,
}: UseSubmitReviewFormParams): UseSubmitReviewFormResult {
  const { showToast, showDialog } = useNotification();

  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  const {
    imageUploadStates,
    videoUploadState,
    fileInputRef,
    videoInputRef,
    handleImageSelect,
    handleRemoveImage,
    handleVideoSelect,
    handleRemoveVideo,
  } = useReviewUploads({ showToast });

  const { errorMessage, hasError, clearError } = useErrorHandler();
  const { handleError: handleSubmitError } = useErrorHandler({ showToast: true, persist: false });

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
        [FormEvent.RESET]: FormState.IDLE,
      },
      [FormState.ERROR]: {
        [FormEvent.SUBMIT]: FormState.SUBMITTING,
        [FormEvent.RESET]: FormState.IDLE,
      },
    },
  });

  const submitting = submitMachine.state === FormState.SUBMITTING;

  const doSubmit = useCallback(async () => {
    if (!orderId || !productId) return;

    try {
      submitMachine.send(FormEvent.SUBMIT);
      clearError();

      const uploadedImages = imageUploadStates
        .filter((item) => item.uploaded && item.url)
        .map((item) => item.url!);

      const params: SubmitReviewParams = {
        order_id: Number(orderId),
        product_id: Number(productId),
        rating,
        content: content.trim(),
        images: uploadedImages.length > 0 ? uploadedImages : undefined,
        video: videoUploadState?.uploaded && videoUploadState.url ? videoUploadState.url : undefined,
        is_anonymous: isAnonymous,
      };

      const response = await submitReview(params);

      if (isSuccess(response)) {
        submitMachine.send(FormEvent.SUBMIT_SUCCESS);
        showToast('success', '评价提交成功', '感谢您的评价！');
        onSubmitSuccess(orderId);
      } else {
        handleSubmitError(response, {
          toastTitle: '提交失败',
          customMessage: extractError(response, '评价提交失败'),
          context: { orderId, productId },
        });
        submitMachine.send(FormEvent.SUBMIT_ERROR);
      }
    } catch (error: any) {
      errorLog('SubmitReview', '提交评价失败', error);
      handleSubmitError(error, {
        toastTitle: '提交失败',
        customMessage: '网络错误，请重试',
        context: { orderId, productId },
      });
      submitMachine.send(FormEvent.SUBMIT_ERROR);
    }
  }, [
    orderId,
    productId,
    submitMachine,
    clearError,
    imageUploadStates,
    rating,
    content,
    videoUploadState,
    isAnonymous,
    showToast,
    onSubmitSuccess,
    handleSubmitError,
  ]);

  const handleSubmit = useCallback(() => {
    const canSubmit = validateReviewSubmission({
      orderId,
      productId,
      rating,
      content,
      imageUploadStates,
      videoUploadState,
      showToast,
      showDialog,
      onConfirmSubmit: () => {
        void doSubmit();
      },
    });

    if (canSubmit) {
      void doSubmit();
    }
  }, [
    orderId,
    productId,
    rating,
    content,
    imageUploadStates,
    videoUploadState,
    showToast,
    showDialog,
    doSubmit,
  ]);

  return {
    rating,
    content,
    isAnonymous,
    imageUploadStates,
    videoUploadState,
    fileInputRef,
    videoInputRef,
    errorMessage,
    hasError,
    submitting,
    setRating,
    setContent,
    setIsAnonymous,
    handleImageSelect,
    handleRemoveImage,
    handleVideoSelect,
    handleRemoveVideo,
    handleSubmit,
  };
}
