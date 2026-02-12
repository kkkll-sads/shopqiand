import type { DialogItem, ToastItem, ToastType } from '@/context/NotificationContext';
import type { UploadState } from '../types';
import { MAX_CONTENT_LENGTH } from '../constants';

export type ShowToast = (
  type: ToastType,
  title: string,
  description?: string,
  duration?: number,
  action?: ToastItem['action'],
) => void;

export type ShowDialog = (item: DialogItem) => void;

interface ValidateReviewSubmissionParams {
  orderId: string | null;
  productId: string | null;
  rating: number;
  content: string;
  imageUploadStates: UploadState[];
  videoUploadState: UploadState | null;
  showToast: ShowToast;
  showDialog: ShowDialog;
  onConfirmSubmit: () => void;
}

export const validateReviewSubmission = ({
  orderId,
  productId,
  rating,
  content,
  imageUploadStates,
  videoUploadState,
  showToast,
  showDialog,
  onConfirmSubmit,
}: ValidateReviewSubmissionParams): boolean => {
  if (!orderId || !productId) {
    showToast('error', '参数错误', '缺少必要的订单或商品信息');
    return false;
  }

  if (rating < 1 || rating > 5) {
    showToast('warning', '请选择评分', '请选择1-5星的评分');
    return false;
  }

  if (!content.trim()) {
    showToast('warning', '请输入评价内容', '评价内容不能为空');
    return false;
  }

  if (content.trim().length > MAX_CONTENT_LENGTH) {
    showToast('warning', '内容过长', `评价内容不能超过${MAX_CONTENT_LENGTH}字`);
    return false;
  }

  const hasUploading =
    imageUploadStates.some((state) => state.uploading) || Boolean(videoUploadState?.uploading);
  if (hasUploading) {
    showToast('warning', '请稍候', '图片或视频正在上传中，请稍候再提交');
    return false;
  }

  const hasFailed = imageUploadStates.some((state) => state.error) || Boolean(videoUploadState?.error);
  if (hasFailed) {
    showDialog({
      title: '上传失败',
      description: '部分文件上传失败，是否继续提交评价？',
      confirmText: '继续提交',
      cancelText: '取消',
      onConfirm: onConfirmSubmit,
    });
    return false;
  }

  return true;
};
