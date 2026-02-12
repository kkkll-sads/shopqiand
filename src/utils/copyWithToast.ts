import type { ToastItem, ToastType } from '@/context/NotificationContext';
import { copyToClipboard } from './clipboard';

type ShowToast = (
  type: ToastType,
  title: string,
  description?: string,
  duration?: number,
  action?: ToastItem['action'],
) => void;

interface CopyWithToastOptions {
  successTitle?: string;
  successDescription?: string;
  errorTitle?: string;
  errorDescription?: string;
}

export const copyWithToast = async (
  text: string,
  showToast: ShowToast,
  options: CopyWithToastOptions = {},
): Promise<boolean> => {
  const {
    successTitle = '复制成功',
    successDescription,
    errorTitle = '复制失败',
    errorDescription = '请手动复制',
  } = options;

  if (!text) {
    showToast(errorTitle === '复制失败' ? 'warning' : 'error', errorTitle, errorDescription);
    return false;
  }

  const success = await copyToClipboard(text);
  if (success) {
    showToast('success', successTitle, successDescription);
    return true;
  }

  showToast('error', errorTitle, errorDescription);
  return false;
};
