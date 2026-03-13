import { commonApi } from '../api';
import { getErrorMessage } from '../api/core/errors';

interface ToastOptions {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

type ShowToast = (options: ToastOptions) => void;

export async function openCustomerServiceLink(showToast: ShowToast): Promise<boolean> {
  try {
    const config = await commonApi.getChatConfig();
    const url = config.chatUrl || config.backupUrl;

    if (!url) {
      showToast({
        message: '暂未配置客服链接',
        type: 'warning',
      });
      return false;
    }

    const opened = window.open(url, '_blank', 'noopener,noreferrer');
    if (!opened) {
      showToast({
        message: '打开客服链接失败，请检查设备设置',
        type: 'error',
      });
      return false;
    }

    return true;
  } catch (error) {
    showToast({
      message: getErrorMessage(error),
      type: 'error',
    });
    return false;
  }
}
