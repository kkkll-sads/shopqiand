/**
 * useAssetActionModal - 资产操作弹窗状态机 Hook
 *
 * 功能说明：
 * - 管理提货/寄售弹窗的状态和业务逻辑
 * - 封装48小时检查、寄售券检查、倒计时等逻辑
 * - 提供清晰的状态转换和操作接口
 *
 * @author 树交所前端团队
 * @version 1.0.0
 * @created 2025-12-29
 */

import { useState, useEffect, useCallback } from 'react';
import { useStateMachine } from './useStateMachine';
import { useNotification } from '@/context/NotificationContext';
import {
  getConsignmentCheck,
  rightsDeliver,
  consignCollectionItem,
  computeConsignmentPrice,
  MyCollectionItem,
} from '@/services/api';
import { getStoredToken } from '@/services/client';
import { isSuccess, extractError } from '@/utils/apiHelpers';
import { ConsignmentStatus, DeliveryStatus } from '@/constants/statusEnums';

/**
 * 操作弹窗状态枚举
 */
export enum ActionModalState {
  CLOSED = 'closed',                      // 弹窗关闭
  OPEN_DELIVERY = 'open_delivery',        // 显示提货标签
  OPEN_CONSIGNMENT = 'open_consignment',  // 显示寄售标签
  SUBMITTING = 'submitting',              // 提交中（提货或寄售）
}

/**
 * 操作弹窗事件枚举
 */
export enum ActionModalEvent {
  OPEN_DELIVERY = 'OPEN_DELIVERY',
  OPEN_CONSIGNMENT = 'OPEN_CONSIGNMENT',
  SWITCH_TO_DELIVERY = 'SWITCH_TO_DELIVERY',
  SWITCH_TO_CONSIGNMENT = 'SWITCH_TO_CONSIGNMENT',
  SUBMIT = 'SUBMIT',
  SUBMIT_SUCCESS = 'SUBMIT_SUCCESS',
  SUBMIT_ERROR = 'SUBMIT_ERROR',
  CLOSE = 'CLOSE',
}

/**
 * 寄售检查结果
 */
interface ConsignmentCheckResult {
  unlocked: boolean;
  remainingSeconds: number | null;
  remainingText: string | null;
  canConsign: boolean;
}

/**
 * 提货检查结果
 */
interface DeliveryCheckResult {
  can48Hours: boolean;
  hoursLeft: number;
  isConsigning: boolean;
  hasConsignedBefore: boolean;
  isDelivered: boolean;
  hasConsignedSuccessfully: boolean;
}

/**
 * 操作弹窗上下文数据
 */
interface ActionModalContext {
  selectedItem: MyCollectionItem | null;
  actionType: 'delivery' | 'consignment' | null;
  error: string | null;
  consignmentCheckData: any | null;
  deliveryCheckResult: DeliveryCheckResult | null;
  countdown: { hours: number; minutes: number; seconds: number } | null;
  consignmentTicketCount: number;
}

/**
 * Hook返回值
 */
interface UseAssetActionModalReturn {
  // 状态
  state: ActionModalState;
  context: ActionModalContext;
  isOpen: boolean;
  isSubmitting: boolean;
  canSubmit: boolean;

  // 方法
  openDelivery: (item: MyCollectionItem) => void;
  openConsignment: (item: MyCollectionItem) => void;
  switchToDelivery: () => void;
  switchToConsignment: () => void;
  handleSubmit: () => void;
  close: () => void;

  // 检查结果
  deliveryCheckResult: DeliveryCheckResult | null;
  consignmentCheckResult: ConsignmentCheckResult | null;
}

/**
 * 状态转换配置
 */
const ACTION_MODAL_TRANSITIONS = {
  [ActionModalState.CLOSED]: {
    [ActionModalEvent.OPEN_DELIVERY]: ActionModalState.OPEN_DELIVERY,
    [ActionModalEvent.OPEN_CONSIGNMENT]: ActionModalState.OPEN_CONSIGNMENT,
  },
  [ActionModalState.OPEN_DELIVERY]: {
    [ActionModalEvent.SWITCH_TO_CONSIGNMENT]: ActionModalState.OPEN_CONSIGNMENT,
    [ActionModalEvent.SUBMIT]: ActionModalState.SUBMITTING,
    [ActionModalEvent.CLOSE]: ActionModalState.CLOSED,
  },
  [ActionModalState.OPEN_CONSIGNMENT]: {
    [ActionModalEvent.SWITCH_TO_DELIVERY]: ActionModalState.OPEN_DELIVERY,
    [ActionModalEvent.SUBMIT]: ActionModalState.SUBMITTING,
    [ActionModalEvent.CLOSE]: ActionModalState.CLOSED,
  },
  [ActionModalState.SUBMITTING]: {
    [ActionModalEvent.SUBMIT_SUCCESS]: ActionModalState.CLOSED,
    [ActionModalEvent.SUBMIT_ERROR]: ActionModalState.OPEN_DELIVERY, // 错误后返回原状态
    [ActionModalEvent.CLOSE]: ActionModalState.CLOSED,
  },
};

/**
 * useAssetActionModal Hook
 */
export function useAssetActionModal(
  consignmentTicketCount: number,
  onSuccess?: () => void
): UseAssetActionModalReturn {
  const { showToast, showDialog } = useNotification();

  const { state, context, send, setContext } = useStateMachine<
    ActionModalState,
    ActionModalEvent,
    ActionModalContext
  >({
    initial: ActionModalState.CLOSED,
    transitions: ACTION_MODAL_TRANSITIONS,
    context: {
      selectedItem: null,
      actionType: null,
      error: null,
      consignmentCheckData: null,
      deliveryCheckResult: null,
      countdown: null,
      consignmentTicketCount,
    },
  });

  // 更新寄售券数量
  useEffect(() => {
    setContext((prev) => ({ ...prev, consignmentTicketCount }));
  }, [consignmentTicketCount]);

  /**
   * 检查48小时是否已过
   */
  const check48Hours = useCallback(
    (time: number): { passed: boolean; hoursLeft: number } => {
      if (!time) return { passed: true, hoursLeft: 0 };
      const now = Math.floor(Date.now() / 1000);
      const hoursPassed = (now - time) / 3600;
      const hoursLeft = 48 - hoursPassed;
      return {
        passed: hoursPassed >= 48,
        hoursLeft: Math.max(0, Math.ceil(hoursLeft)),
      };
    },
    []
  );

  /**
   * 检查藏品状态
   */
  const checkItemStatus = useCallback(
    (item: MyCollectionItem) => {
      return {
        isConsigning:
          item.consignment_status === ConsignmentStatus.CONSIGNING ||
          item.consignment_status === ConsignmentStatus.PENDING,
        hasConsignedBefore:
          typeof item.consignment_status === 'number' &&
          item.consignment_status !== ConsignmentStatus.NOT_CONSIGNED,
        hasConsignedSuccessfully: item.consignment_status === ConsignmentStatus.SOLD,
        isDelivered: item.delivery_status === DeliveryStatus.DELIVERED,
      };
    },
    []
  );

  /**
   * 获取藏品ID
   */
  const resolveCollectionId = useCallback(
    (item: MyCollectionItem): number | string | undefined => {
      return item.user_collection_id || item.id;
    },
    []
  );

  /**
   * 打开提货弹窗
   */
  const openDelivery = useCallback(
    (item: MyCollectionItem) => {
      send(ActionModalEvent.OPEN_DELIVERY, { selectedItem: item, actionType: 'delivery' });
    },
    [send]
  );

  /**
   * 打开寄售弹窗
   */
  const openConsignment = useCallback(
    (item: MyCollectionItem) => {
      send(ActionModalEvent.OPEN_CONSIGNMENT, { selectedItem: item, actionType: 'consignment' });
    },
    [send]
  );

  /**
   * 切换到提货标签
   */
  const switchToDelivery = useCallback(() => {
    send(ActionModalEvent.SWITCH_TO_DELIVERY, { actionType: 'delivery' });
  }, [send]);

  /**
   * 切换到寄售标签
   */
  const switchToConsignment = useCallback(() => {
    send(ActionModalEvent.SWITCH_TO_CONSIGNMENT, { actionType: 'consignment' });
  }, [send]);

  /**
   * 关闭弹窗
   */
  const close = useCallback(() => {
    send(ActionModalEvent.CLOSE, {
      selectedItem: null,
      actionType: null,
      error: null,
      consignmentCheckData: null,
      deliveryCheckResult: null,
      countdown: null,
    });
  }, [send]);

  /**
   * 检查提货条件
   */
  const deliveryCheckResult: DeliveryCheckResult | null = context.selectedItem
    ? (() => {
        const itemStatus = checkItemStatus(context.selectedItem);
        const timeCheck = check48Hours(
          context.selectedItem.pay_time || context.selectedItem.buy_time || 0
        );

        return {
          ...itemStatus,
          ...timeCheck,
        };
      })()
    : null;

  /**
   * 检查寄售条件
   */
  const consignmentCheckResult: ConsignmentCheckResult | null = context.consignmentCheckData
    ? (() => {
        const data = context.consignmentCheckData;
        let unlocked = false;
        let remainingSeconds: number | null = null;
        let remainingText: string | null = null;

        // 解析后端返回的解锁状态
        if (typeof data.can_consign === 'boolean') {
          unlocked = data.can_consign;
        } else if (typeof data.unlocked === 'boolean') {
          unlocked = data.unlocked;
        } else if (typeof data.remaining_seconds === 'number') {
          unlocked = Number(data.remaining_seconds) <= 0;
          remainingSeconds = Number(data.remaining_seconds);
        }

        // 解析剩余时间文本
        if (typeof data.remaining_text === 'string') {
          remainingText = data.remaining_text;
          // 尝试从文本中解析秒数
          const match = data.remaining_text.match(/(\d{1,}):(\d{2}):(\d{2})/);
          if (match) {
            const h = Number(match[1]) || 0;
            const m = Number(match[2]) || 0;
            const s = Number(match[3]) || 0;
            remainingSeconds = h * 3600 + m * 60 + s;
          }
        } else if (typeof data.remaining_seconds === 'number') {
          remainingSeconds = Number(data.remaining_seconds);
        }

        return {
          unlocked,
          remainingSeconds,
          remainingText,
          canConsign: unlocked && consignmentTicketCount > 0,
        };
      })()
    : null;

  /**
   * 加载寄售检查数据
   */
  useEffect(() => {
    if (state !== ActionModalState.OPEN_CONSIGNMENT || !context.selectedItem) {
      setContext((prev) => ({ ...prev, consignmentCheckData: null }));
      return;
    }

    const collectionId = resolveCollectionId(context.selectedItem);
    if (collectionId === undefined || collectionId === null) {
      return;
    }

    let mounted = true;
    const token = getStoredToken() || undefined;

    getConsignmentCheck({ user_collection_id: collectionId, token })
      .then((res: any) => {
        if (!mounted) return;
        setContext((prev) => ({ ...prev, consignmentCheckData: res?.data ?? null }));
      })
      .catch(() => {
        if (!mounted) return;
        setContext((prev) => ({ ...prev, consignmentCheckData: null }));
      });

    return () => {
      mounted = false;
    };
  }, [state, context.selectedItem, resolveCollectionId, setContext]);

  /**
   * 实时倒计时
   */
  useEffect(() => {
    if (state !== ActionModalState.OPEN_CONSIGNMENT || !consignmentCheckResult) {
      setContext((prev) => ({ ...prev, countdown: null }));
      return;
    }

    let remainingSeconds = consignmentCheckResult.remainingSeconds;
    if (remainingSeconds === null || remainingSeconds <= 0) {
      setContext((prev) => ({ ...prev, countdown: null }));
      return;
    }

    // 计算初始倒计时
    const calculateCountdown = (secs: number) => {
      const hours = Math.floor(secs / 3600);
      const minutes = Math.floor((secs % 3600) / 60);
      const seconds = secs % 60;
      return { hours, minutes, seconds };
    };

    setContext((prev) => ({ ...prev, countdown: calculateCountdown(remainingSeconds!) }));

    let mounted = true;
    const interval = setInterval(() => {
      if (!mounted) return;
      remainingSeconds = Math.max(0, remainingSeconds! - 1);
      setContext((prev) => ({ ...prev, countdown: calculateCountdown(remainingSeconds!) }));

      if (remainingSeconds <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [state, consignmentCheckResult, setContext]);

  /**
   * 提交操作
   */
  const handleSubmit = useCallback(async () => {
    if (!context.selectedItem || state === ActionModalState.SUBMITTING) return;

    const token = getStoredToken();
    if (!token) {
      showToast('warning', '请登录', '请先登录后再进行操作');
      return;
    }

    const collectionId = resolveCollectionId(context.selectedItem);
    if (collectionId === undefined || collectionId === null) {
      showToast('error', '错误', '无法获取藏品ID，无法继续操作');
      return;
    }

    // 提货操作
    if (context.actionType === 'delivery') {
      const itemStatus = checkItemStatus(context.selectedItem);

      // 各种状态检查
      if (itemStatus.isConsigning) {
        showToast('warning', '提示', '该藏品正在寄售中，无法提货');
        return;
      }

      if (itemStatus.hasConsignedSuccessfully) {
        showToast('warning', '提示', '该藏品已经寄售成功（已售出），无法提货');
        return;
      }

      if (itemStatus.isDelivered) {
        showToast('warning', '提示', '该藏品已经提货，无法再次提货');
        return;
      }

      const timeCheck = check48Hours(
        context.selectedItem.pay_time || context.selectedItem.buy_time || 0
      );
      if (!timeCheck.passed) {
        showToast(
          'warning',
          '时间未到',
          `提货需要满足购买后48小时，还需等待 ${timeCheck.hoursLeft} 小时`
        );
        return;
      }

      const doRightsDeliver = async () => {
        send(ActionModalEvent.SUBMIT);

        try {
          const res = await rightsDeliver({
            user_collection_id: collectionId,
            token,
          });

          if (isSuccess(res) || res.code === 0 || res.data?.code === 0) {
            showToast(
              'success',
              '操作成功',
              res.msg || res.data?.message || res.message || '权益分割已提交'
            );
            send(ActionModalEvent.SUBMIT_SUCCESS);
            onSuccess?.();
          } else {
            const errorMsg = extractError(res, '权益分割失败');
            showToast('error', '操作失败', errorMsg);
            send(ActionModalEvent.SUBMIT_ERROR, { error: errorMsg });
          }
        } catch (err: any) {
          const errorMsg = err?.msg || err?.message || '权益分割失败';
          showToast('error', '提交失败', errorMsg);
          send(ActionModalEvent.SUBMIT_ERROR, { error: errorMsg });
        }
      };

      // 如果曾经寄售过，需要确认
      if (itemStatus.hasConsignedBefore) {
        showDialog({
          title: '强制权益分割确认',
          description: '该藏品曾经寄售过，确定要强制执行权益分割吗？',
          confirmText: '确定分割',
          cancelText: '取消',
          onConfirm: doRightsDeliver,
        });
      } else {
        doRightsDeliver();
      }
    }
    // 寄售操作
    else if (context.actionType === 'consignment') {
      const itemStatus = checkItemStatus(context.selectedItem);

      if (itemStatus.isConsigning) {
        showToast('warning', '提示', '该藏品正在寄售中，无法再次寄售');
        return;
      }

      if (itemStatus.hasConsignedSuccessfully) {
        showToast('warning', '提示', '该藏品已经寄售成功（已售出），无法再次寄售');
        return;
      }

      // 使用后端检查结果
      if (consignmentCheckResult && !consignmentCheckResult.unlocked) {
        const hrsLeft = consignmentCheckResult.remainingSeconds
          ? Math.ceil(consignmentCheckResult.remainingSeconds / 3600)
          : 0;
        showToast(
          'warning',
          '时间未到',
          `寄售需要满足购买后48小时，还需等待 ${hrsLeft} 小时`
        );
        return;
      }

      if (consignmentTicketCount === 0) {
        showToast('warning', '缺少道具', '您没有寄售券，无法进行寄售');
        return;
      }

      const check = context.consignmentCheckData || {};
      const priceValue = computeConsignmentPrice(check) || (() => {
        const buy = Number(check.buy_price ?? context.selectedItem?.buy_price ?? context.selectedItem?.price ?? 0);
        const rate = Number(check.appreciation_rate ?? 0);
        return buy > 0 ? buy * (1 + rate) : 0;
      })();
      if (Number.isNaN(priceValue) || priceValue <= 0) {
        showToast('error', '错误', '藏品价格无效，无法进行寄售');
        return;
      }

      send(ActionModalEvent.SUBMIT);

      try {
        const res = await consignCollectionItem({
          user_collection_id: collectionId,
          price: priceValue,
          token,
        });

        if (isSuccess(res)) {
          showToast('success', '提交成功', res.msg || '寄售申请已提交');
          send(ActionModalEvent.SUBMIT_SUCCESS);
          onSuccess?.();
        } else {
          const errorMsg = extractError(res, '寄售申请失败');
          showToast('error', '操作失败', errorMsg);
          send(ActionModalEvent.SUBMIT_ERROR, { error: errorMsg });
        }
      } catch (err: any) {
        const errorMsg = err?.msg || err?.message || '寄售申请失败';
        showToast('error', '提交失败', errorMsg);
        send(ActionModalEvent.SUBMIT_ERROR, { error: errorMsg });
      }
    }
  }, [
    context.selectedItem,
    context.actionType,
    state,
    consignmentTicketCount,
    consignmentCheckResult,
    send,
    showToast,
    showDialog,
    check48Hours,
    checkItemStatus,
    resolveCollectionId,
    onSuccess,
  ]);

  /**
   * 计算是否可以提交
   */
  const canSubmit =
    state !== ActionModalState.SUBMITTING &&
    context.selectedItem !== null &&
    ((context.actionType === 'delivery' &&
      deliveryCheckResult?.can48Hours &&
      !deliveryCheckResult.isConsigning &&
      !deliveryCheckResult.isDelivered &&
      !deliveryCheckResult.hasConsignedSuccessfully) ||
      (context.actionType === 'consignment' &&
        consignmentCheckResult?.canConsign === true));

  return {
    state,
    context,
    isOpen: state !== ActionModalState.CLOSED,
    isSubmitting: state === ActionModalState.SUBMITTING,
    canSubmit,
    openDelivery,
    openConsignment,
    switchToDelivery,
    switchToConsignment,
    handleSubmit,
    close,
    deliveryCheckResult,
    consignmentCheckResult,
  };
}

export default useAssetActionModal;
