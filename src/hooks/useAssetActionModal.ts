/**
 * useAssetActionModal - 资产操作弹窗状态机 Hook
 */
import { useEffect, useCallback } from 'react';
import { useStateMachine } from './useStateMachine';
import { useNotification } from '@/context/NotificationContext';
import {
  getConsignmentCheck,
} from '@/services';
import type { MyCollectionItem } from '@/services';
import { getStoredToken } from '@/services/client';
import {
  ActionModalState,
  ActionModalEvent,
  type ActionModalContext,
  type UseAssetActionModalReturn,
} from './asset-action-modal/types';
import { ACTION_MODAL_TRANSITIONS } from './asset-action-modal/stateMachine';
import {
  resolveCollectionId,
  buildDeliveryCheckResult,
  buildConsignmentCheckResult,
  calculateCountdown,
} from './asset-action-modal/helpers';
import {
  submitConsignmentAction,
  submitDeliveryAction,
} from './asset-action-modal/actions';

export { ActionModalState, ActionModalEvent } from './asset-action-modal/types';
export type {
  ConsignmentCheckResult,
  DeliveryCheckResult,
  ActionModalContext,
  UseAssetActionModalReturn,
} from './asset-action-modal/types';

type ConsignmentCheckResponse = {
  data?: ActionModalContext['consignmentCheckData'];
};

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

  useEffect(() => {
    setContext((prev) => ({ ...prev, consignmentTicketCount }));
  }, [consignmentTicketCount, setContext]);

  const openDelivery = useCallback(
    (item: MyCollectionItem) => {
      send(ActionModalEvent.OPEN_DELIVERY, { selectedItem: item, actionType: 'delivery' });
    },
    [send]
  );

  const openConsignment = useCallback(
    (item: MyCollectionItem) => {
      send(ActionModalEvent.OPEN_CONSIGNMENT, { selectedItem: item, actionType: 'consignment' });
    },
    [send]
  );

  const switchToDelivery = useCallback(() => {
    send(ActionModalEvent.SWITCH_TO_DELIVERY, { actionType: 'delivery' });
  }, [send]);

  const switchToConsignment = useCallback(() => {
    send(ActionModalEvent.SWITCH_TO_CONSIGNMENT, { actionType: 'consignment' });
  }, [send]);

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

  const deliveryCheckResult = context.selectedItem ? buildDeliveryCheckResult(context.selectedItem) : null;

  const consignmentCheckResult = context.consignmentCheckData
    ? buildConsignmentCheckResult(context.consignmentCheckData, consignmentTicketCount)
    : null;

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
      .then((res: ConsignmentCheckResponse) => {
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
  }, [state, context.selectedItem, setContext]);

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

    if (context.actionType === 'delivery') {
      await submitDeliveryAction({
        selectedItem: context.selectedItem,
        collectionId,
        token,
        send,
        showToast,
        showDialog,
        onSuccess,
      });
    } else if (context.actionType === 'consignment') {
      await submitConsignmentAction({
        selectedItem: context.selectedItem,
        collectionId,
        token,
        send,
        showToast,
        onSuccess,
        consignmentTicketCount,
        consignmentCheckResult,
        consignmentCheckData: context.consignmentCheckData,
      });
    }
  }, [
    context.selectedItem,
    context.actionType,
    context.consignmentCheckData,
    state,
    consignmentTicketCount,
    consignmentCheckResult,
    send,
    showToast,
    showDialog,
    onSuccess,
  ]);

  const canSubmit =
    state !== ActionModalState.SUBMITTING &&
    context.selectedItem !== null &&
    ((context.actionType === 'delivery' &&
      deliveryCheckResult?.can48Hours &&
      !deliveryCheckResult.isConsigning &&
      !deliveryCheckResult.isDelivered &&
      !deliveryCheckResult.hasConsignedSuccessfully) ||
      (context.actionType === 'consignment' && consignmentCheckResult?.canConsign === true));

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
