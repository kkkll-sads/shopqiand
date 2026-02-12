/**
 * 寄售操作 Hook
 * 处理寄售、提货、批量寄售等操作
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { type BatchConsignableListData, type MyCollectionItem } from '@/services';
import { getStoredToken } from '@/services/client';
import { useNotification } from '@/context/NotificationContext';
import { errorLog } from '@/utils/logger';
import { fetchConsignmentGateData } from './use-consignment-action/data';
import {
  canPerformConsignmentForItem,
  getRemainingSeconds,
  resolveCollectionId,
  check48Hours,
  hasConsignedBefore,
  hasConsignedSuccessfully,
  isConsigning,
  isDelivered,
  formatSeconds,
} from './use-consignment-action/helpers';
import {
  executeBatchConsignAction,
  executeConsignmentAction,
  executeDeliveryAction,
  type ConsignmentActionCallbacks,
} from './use-consignment-action/actions';

interface UseConsignmentActionOptions {
  onActionStart: () => void;
  onActionSuccess: () => void;
  onActionError: () => void;
  onBatchStart: () => void;
  onBatchSuccess: () => void;
  onBatchError: () => void;
}

/**
 * 寄售操作 Hook
 */
export function useConsignmentAction(options: UseConsignmentActionOptions) {
  const { onActionStart, onActionSuccess, onActionError, onBatchStart, onBatchSuccess, onBatchError } = options;
  const { showToast, showDialog } = useNotification();

  // 使用 ref 存储回调函数，避免它们成为 useCallback 的依赖项导致无限循环
  const callbacksRef = useRef<ConsignmentActionCallbacks>({
    onActionStart,
    onActionSuccess,
    onActionError,
    onBatchStart,
    onBatchSuccess,
    onBatchError,
  });
  callbacksRef.current = {
    onActionStart,
    onActionSuccess,
    onActionError,
    onBatchStart,
    onBatchSuccess,
    onBatchError,
  };

  // 寄售检查数据
  const [consignmentCheckData, setConsignmentCheckData] = useState<any>(null);
  const [availableCouponCount, setAvailableCouponCount] = useState<number>(0);
  const [checkingCoupons, setCheckingCoupons] = useState<boolean>(false);
  const [consignmentRemaining, setConsignmentRemaining] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // 加载寄售检查数据
  const loadConsignmentCheck = useCallback(async (item: MyCollectionItem) => {
    const collectionId = resolveCollectionId(item);
    if (collectionId === undefined || collectionId === null) {
      setConsignmentCheckData(null);
      setAvailableCouponCount(0);
      return;
    }

    const token = getStoredToken() || undefined;
    setCheckingCoupons(true);

    try {
      const gateData = await fetchConsignmentGateData(item, token);
      if (!gateData) {
        setConsignmentCheckData(null);
        setAvailableCouponCount(0);
        return;
      }

      setConsignmentCheckData(gateData.checkData);
      setAvailableCouponCount(gateData.availableCouponCount);
    } catch (error) {
      errorLog('useConsignmentAction', 'Fetch data failed', error);
      setConsignmentCheckData(null);
      setAvailableCouponCount(0);
    } finally {
      setCheckingCoupons(false);
    }
  }, []);

  // 实时倒计时
  useEffect(() => {
    const initialSeconds = getRemainingSeconds(consignmentCheckData);
    if (initialSeconds === null) {
      setConsignmentRemaining(null);
      return;
    }

    let seconds = Math.max(0, initialSeconds);
    setConsignmentRemaining(seconds);

    let mounted = true;
    const id = setInterval(() => {
      if (!mounted) return;
      seconds = Math.max(0, seconds - 1);
      setConsignmentRemaining(seconds);
      if (seconds <= 0) {
        clearInterval(id);
      }
    }, 1000);

    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [consignmentCheckData]);

  // 检查是否可以执行寄售操作
  const canPerformConsignment = useCallback(
    (item: MyCollectionItem | null): boolean =>
      canPerformConsignmentForItem({
        item,
        availableCouponCount,
        checkingCoupons,
        consignmentCheckData,
        consignmentRemaining,
      }),
    [availableCouponCount, checkingCoupons, consignmentCheckData, consignmentRemaining],
  );

  // 执行权益分割
  const handleDelivery = useCallback(
    async (item: MyCollectionItem, onSuccess: () => void) => {
      await executeDeliveryAction({
        item,
        token: getStoredToken(),
        onSuccess,
        showToast,
        showDialog,
        callbacksRef,
      });
    },
    [showToast, showDialog],
  );

  // 执行寄售
  const handleConsignment = useCallback(
    async (item: MyCollectionItem, onSuccess: () => void) => {
      await executeConsignmentAction({
        item,
        token: getStoredToken(),
        consignmentCheckData,
        onSuccess,
        setActionError,
        showToast,
        callbacksRef,
      });
    },
    [consignmentCheckData, showToast],
  );

  // 批量寄售
  const handleBatchConsign = useCallback(
    async (batchData: BatchConsignableListData | null, onSuccess: () => void) => {
      await executeBatchConsignAction({
        batchData,
        token: getStoredToken(),
        onSuccess,
        showToast,
        showDialog,
        callbacksRef,
      });
    },
    [showToast, showDialog],
  );

  // 清除检查数据
  const clearConsignmentCheck = useCallback(() => {
    setConsignmentCheckData(null);
    setAvailableCouponCount(0);
    setActionError(null);
  }, []);

  return {
    // 状态
    consignmentCheckData,
    availableCouponCount,
    checkingCoupons,
    consignmentRemaining,
    actionError,
    // 方法
    loadConsignmentCheck,
    canPerformConsignment,
    handleDelivery,
    handleConsignment,
    handleBatchConsign,
    clearConsignmentCheck,
    setActionError,
  };
}

export {
  resolveCollectionId,
  check48Hours,
  hasConsignedBefore,
  hasConsignedSuccessfully,
  isConsigning,
  isDelivered,
  formatSeconds,
};
