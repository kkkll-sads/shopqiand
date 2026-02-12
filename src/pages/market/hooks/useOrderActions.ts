/**
 * useOrderActions - 订单操作逻辑 Hook
 */
import { useCallback } from 'react';
import {
  confirmOrder,
  payOrder,
  deleteOrder,
} from '@/services';
import { getStoredToken } from '@/services/client';
import { useNotification } from '@/context/NotificationContext';
import { isSuccess, extractError, extractErrorFromException } from '@/utils/apiHelpers';
import { errorLog } from '@/utils/logger';

type OrderCategory = 'product' | 'transaction' | 'delivery' | 'points';

interface UseOrderActionsParams {
  category: OrderCategory;
  activeTab: number;
  onReload: () => void;
}

export function useOrderActions({ category, activeTab, onReload }: UseOrderActionsParams) {
  const { showToast, showDialog } = useNotification();

  const handleConfirmReceipt = useCallback(async (orderId: number | string) => {
    try {
      const token = getStoredToken() || '';
      const response = await confirmOrder({ id: orderId, token });

      if (isSuccess(response)) {
        onReload();
        showToast('success', '操作成功', extractError(response, '确认收货成功'));
      } else {
        showToast('error', '操作失败', extractError(response, '确认收货失败'));
      }
    } catch (error: unknown) {
      errorLog('useOrderActions', '确认收货失败:', error);
      showToast('error', '操作失败', extractErrorFromException(error, '确认收货失败'));
    }
  }, [onReload, showToast]);

  const handlePayOrder = useCallback(async (orderId: number | string) => {
    showDialog({
      title: '确认支付',
      description: '确定要支付此订单吗？',
      confirmText: '确定支付',
      cancelText: '取消',
      onConfirm: async () => {
        try {
          const token = getStoredToken() || '';
          const response = await payOrder({ id: orderId, token });

          if (isSuccess(response)) {
            onReload();
            showToast('success', '支付成功', extractError(response, '支付成功'));
          } else {
            showToast('error', '支付失败', extractError(response, '支付失败'));
          }
        } catch (error: unknown) {
          errorLog('useOrderActions', '支付订单失败:', error);
          showToast('error', '支付失败', extractErrorFromException(error, '支付失败'));
        }
      }
    });
  }, [onReload, showToast, showDialog]);

  const handleDeleteOrder = useCallback(async (orderId: number | string) => {
    showDialog({
      title: '确认删除',
      description: '确定要删除此订单吗？删除后无法恢复。',
      confirmText: '确定删除',
      confirmColor: '#FF6B6B',
      cancelText: '取消',
      onConfirm: async () => {
        try {
          const token = getStoredToken() || '';
          const response = await deleteOrder({ id: orderId, token });

          if (isSuccess(response)) {
            onReload();
            showToast('success', '删除成功', extractError(response, '删除成功'));
          } else {
            showToast('error', '删除失败', extractError(response, '删除失败'));
          }
        } catch (error: unknown) {
          errorLog('useOrderActions', '删除订单失败:', error);
          showToast('error', '删除失败', extractErrorFromException(error, '删除失败'));
        }
      }
    });
  }, [onReload, showToast, showDialog]);

  return {
    handleConfirmReceipt,
    handlePayOrder,
    handleDeleteOrder,
  };
}
