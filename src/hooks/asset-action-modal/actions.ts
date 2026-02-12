import {
  consignCollectionItem,
  computeConsignmentPrice,
  rightsDeliver,
  type MyCollectionItem,
} from '@/services';
import { extractError, isSuccess } from '@/utils/apiHelpers';
import {
  check48Hours,
  checkItemStatus,
} from './helpers';
import {
  ActionModalEvent,
  type ActionModalContext,
  type ConsignmentCheckResult,
} from './types';

type ShowToast = (type: 'success' | 'error' | 'warning', title: string, message?: string) => void;
type ShowDialog = (options: {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
}) => void;

type SendEvent = (event: ActionModalEvent, payload?: Partial<ActionModalContext>) => void;

interface DeliveryActionParams {
  selectedItem: MyCollectionItem;
  collectionId: number | string;
  token: string;
  send: SendEvent;
  showToast: ShowToast;
  showDialog: ShowDialog;
  onSuccess?: () => void;
}

interface ConsignmentActionParams {
  selectedItem: MyCollectionItem;
  collectionId: number | string;
  token: string;
  send: SendEvent;
  showToast: ShowToast;
  onSuccess?: () => void;
  consignmentTicketCount: number;
  consignmentCheckResult: ConsignmentCheckResult | null;
  consignmentCheckData: any;
}

export async function submitDeliveryAction({
  selectedItem,
  collectionId,
  token,
  send,
  showToast,
  showDialog,
  onSuccess,
}: DeliveryActionParams): Promise<void> {
  const itemStatus = checkItemStatus(selectedItem);

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

  const timeCheck = check48Hours(selectedItem.pay_time || selectedItem.buy_time || 0);
  if (!timeCheck.passed) {
    if (timeCheck.hasValidBuyTime) {
      showToast('warning', '时间未到', `提货需要满足购买后48小时，还需等待 ${Math.max(1, timeCheck.hoursLeft)} 小时`);
    } else {
      showToast('warning', '时间未到', '提货需要满足购买后48小时，请稍后重试');
    }
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
        showToast('success', '操作成功', res.msg || res.data?.message || res.message || '权益分割已提交');
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

  if (itemStatus.hasConsignedBefore) {
    showDialog({
      title: '强制权益分割确认',
      description: '该藏品曾经寄售过，确定要强制执行权益分割吗？',
      confirmText: '确定分割',
      cancelText: '取消',
      onConfirm: () => {
        void doRightsDeliver();
      },
    });
    return;
  }

  await doRightsDeliver();
}

export async function submitConsignmentAction({
  selectedItem,
  collectionId,
  token,
  send,
  showToast,
  onSuccess,
  consignmentTicketCount,
  consignmentCheckResult,
  consignmentCheckData,
}: ConsignmentActionParams): Promise<void> {
  const itemStatus = checkItemStatus(selectedItem);

  if (itemStatus.isConsigning) {
    showToast('warning', '提示', '该藏品正在寄售中，无法再次寄售');
    return;
  }

  if (itemStatus.hasConsignedSuccessfully) {
    showToast('warning', '提示', '该藏品已经寄售成功（已售出），无法再次寄售');
    return;
  }

  if (consignmentCheckResult && !consignmentCheckResult.unlocked) {
    const timeCheck = check48Hours(selectedItem.pay_time || selectedItem.buy_time || 0);
    const hasRemaining = typeof consignmentCheckResult.remainingSeconds === 'number' && consignmentCheckResult.remainingSeconds > 0;

    if (hasRemaining || timeCheck.hasValidBuyTime) {
      const hrsLeft = hasRemaining
        ? Math.ceil((consignmentCheckResult.remainingSeconds as number) / 3600)
        : Math.max(1, timeCheck.hoursLeft);
      showToast('warning', '时间未到', `寄售需要满足购买后48小时，还需等待 ${hrsLeft} 小时`);
    } else {
      showToast('warning', '时间未到', '寄售需要满足购买后48小时，请稍后重试');
    }
    return;
  }

  if (consignmentTicketCount === 0) {
    showToast('warning', '缺少道具', '您没有寄售券，无法进行寄售');
    return;
  }

  const check = consignmentCheckData || {};
  const priceValue =
    computeConsignmentPrice(check) ||
    (() => {
      const buy = Number(check.buy_price ?? selectedItem?.buy_price ?? selectedItem?.price ?? 0);
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
