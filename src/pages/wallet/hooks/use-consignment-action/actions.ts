import type { MutableRefObject } from 'react';
import {
  rightsDeliver,
  consignCollectionItem,
  getConsignmentCheck,
  computeConsignmentPrice,
  batchConsign,
  type MyCollectionItem,
  type BatchConsignableListData,
} from '@/services';
import { isSuccess, extractError } from '@/utils/apiHelpers';
import { errorLog } from '@/utils/logger';
import {
  check48Hours,
  hasConsignedBefore,
  hasConsignedSuccessfully,
  getRemainingSeconds,
  isConsigning,
  isDelivered,
  resolveCollectionId,
} from './helpers';
import { fetchAllAvailableConsignmentCoupons } from './data';

type ToastType = 'success' | 'info' | 'warning' | 'error';
type ShowToastFn = (type: ToastType, title: string, description?: string) => void;
type ShowDialogFn = (options: any) => void;

export interface ConsignmentActionCallbacks {
  onActionStart: () => void;
  onActionSuccess: () => void;
  onActionError: () => void;
  onBatchStart: () => void;
  onBatchSuccess: () => void;
  onBatchError: () => void;
}

interface DeliveryActionParams {
  item: MyCollectionItem;
  token?: string;
  onSuccess: () => void;
  showToast: ShowToastFn;
  showDialog: ShowDialogFn;
  callbacksRef: MutableRefObject<ConsignmentActionCallbacks>;
}

/**
 * 执行权益分割
 */
export async function executeDeliveryAction(params: DeliveryActionParams): Promise<void> {
  const { item, token, onSuccess, showToast, showDialog, callbacksRef } = params;
  if (!token) {
    showToast('warning', '请登录', '请先登录后再进行操作');
    return;
  }

  if (isConsigning(item)) {
    showToast('warning', '提示', '该藏品正在寄售中，无法提货');
    return;
  }

  if (hasConsignedSuccessfully(item)) {
    showToast('warning', '提示', '该藏品已经寄售成功（已售出），无法提货');
    return;
  }

  if (isDelivered(item)) {
    showToast('warning', '提示', '该藏品已经提货，无法再次提货');
    return;
  }

  const collectionId = resolveCollectionId(item);
  if (collectionId === undefined || collectionId === null) {
    showToast('error', '错误', '无法获取藏品ID，无法继续操作');
    return;
  }

  const doRightsDeliver = async () => {
    callbacksRef.current.onActionStart();
    try {
      const res = await rightsDeliver({ user_collection_id: collectionId, token });
      if (isSuccess(res)) {
        showToast('success', '操作成功', extractError(res, '权益分割已提交'));
        onSuccess();
        callbacksRef.current.onActionSuccess();
      } else {
        showToast('error', '操作失败', extractError(res, '权益分割失败'));
        callbacksRef.current.onActionError();
      }
    } catch (err) {
      showToast('error', '提交失败', extractError(err, '权益分割失败'));
      callbacksRef.current.onActionError();
    }
  };

  if (hasConsignedBefore(item)) {
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

interface ConsignActionParams {
  item: MyCollectionItem;
  token?: string;
  consignmentCheckData: any;
  onSuccess: () => void;
  setActionError: (value: string | null) => void;
  showToast: ShowToastFn;
  callbacksRef: MutableRefObject<ConsignmentActionCallbacks>;
}

/**
 * 执行单个藏品寄售
 */
export async function executeConsignmentAction(params: ConsignActionParams): Promise<void> {
  const { item, token, consignmentCheckData, onSuccess, setActionError, showToast, callbacksRef } = params;

  if (!token) {
    showToast('warning', '请登录', '请先登录后再进行操作');
    return;
  }

  if (isConsigning(item)) {
    showToast('warning', '提示', '该藏品正在寄售中，无法再次寄售');
    return;
  }

  if (hasConsignedSuccessfully(item)) {
    showToast('warning', '提示', '该藏品已经寄售成功（已售出），无法再次寄售');
    return;
  }

  const collectionId = resolveCollectionId(item);
  if (collectionId === undefined || collectionId === null) {
    showToast('error', '错误', '无法获取藏品ID，无法继续操作');
    return;
  }

  try {
    const checkRes: any = await getConsignmentCheck({ user_collection_id: collectionId, token });
    const checkData = checkRes?.data;
    if (checkData) {
      const remainingSeconds = getRemainingSeconds(checkData);
      const hasRemainingSeconds = typeof remainingSeconds === 'number' && remainingSeconds > 0;
      const hasExplicitLock =
        (typeof checkData.unlocked === 'boolean' && !checkData.unlocked) ||
        (typeof checkData.can_consign === 'boolean' && !checkData.can_consign);
      const timeCheck = check48Hours(item.pay_time || item.buy_time || 0);

      if (hasExplicitLock || hasRemainingSeconds) {
        if (hasRemainingSeconds || timeCheck.hasValidBuyTime) {
          const hoursLeft = hasRemainingSeconds
            ? Math.ceil((remainingSeconds as number) / 3600)
            : Math.max(1, timeCheck.hoursLeft);
          showToast('warning', '时间未到', `寄售需要满足购买后48小时，还需等待 ${hoursLeft} 小时`);
        } else {
          showToast('warning', '时间未到', '寄售需要满足购买后48小时，请稍后重试');
        }
        return;
      }
    }
  } catch {
    // 后端会最终校验
  }

  try {
    const coupons = await fetchAllAvailableConsignmentCoupons(token);

    if (coupons.length === 0) {
      showToast('warning', '缺少道具', '您没有可用的寄售券，无法进行寄售');
      return;
    }

    const itemSessionId = item.session_id || item.original_record?.session_id;
    const itemZoneId = item.zone_id || item.original_record?.zone_id;

    if (itemSessionId && itemZoneId) {
      const matchedCoupon = coupons.find(
        (coupon) => String(coupon.session_id) === String(itemSessionId) && String(coupon.zone_id) === String(itemZoneId),
      );
      if (!matchedCoupon) {
        showToast('warning', '寄售券不匹配', '您没有该场次和分区的可用寄售券');
        return;
      }
    }
  } catch (error) {
    errorLog('useConsignmentAction', '获取寄售券失败', error);
    showToast('warning', '校验失败', '无法验证寄售券信息，请稍后重试');
    return;
  }

  const priceValue =
    computeConsignmentPrice(consignmentCheckData) ||
    (() => {
      const check = consignmentCheckData || {};
      const buy = Number(check.buy_price ?? item.buy_price ?? item.price ?? 0);
      const rate = Number(check.appreciation_rate ?? 0);
      return buy > 0 ? buy * (1 + rate) : 0;
    })();

  if (Number.isNaN(priceValue) || priceValue <= 0) {
    setActionError('藏品价格无效，无法进行寄售');
    return;
  }

  callbacksRef.current.onActionStart();
  try {
    const res = await consignCollectionItem({ user_collection_id: collectionId, price: priceValue, token });
    if (isSuccess(res)) {
      const data = res.data || {};
      let successDescription = res.message || res.msg || '寄售申请已提交';

      if (data.coupon_used) {
        successDescription += ` (消耗寄售券 ${data.coupon_used} 张`;
        if (data.coupon_remaining !== undefined) {
          successDescription += `，剩余 ${data.coupon_remaining} 张`;
        }
        successDescription += ')';
      }

      showToast('success', '提交成功', successDescription);
      onSuccess();
      callbacksRef.current.onActionSuccess();
      return;
    }

    showToast('error', '提交失败', extractError(res, '寄售申请失败'));
    callbacksRef.current.onActionError();
  } catch (error) {
    setActionError(extractError(error, '寄售申请失败'));
    callbacksRef.current.onActionError();
  }
}

interface BatchConsignActionParams {
  batchData: BatchConsignableListData | null;
  token?: string;
  onSuccess: () => void;
  showToast: ShowToastFn;
  showDialog: ShowDialogFn;
  callbacksRef: MutableRefObject<ConsignmentActionCallbacks>;
}

/**
 * 执行批量寄售
 */
export async function executeBatchConsignAction(params: BatchConsignActionParams): Promise<void> {
  const { batchData, token, onSuccess, showToast, showDialog, callbacksRef } = params;

  if (!batchData || batchData.items.length === 0) {
    showToast('warning', '提示', '暂无可寄售的藏品');
    return;
  }

  if (!token) {
    showToast('warning', '请登录', '请先登录后再进行操作');
    return;
  }

  callbacksRef.current.onBatchStart();
  try {
    const consignments = batchData.items.map((item) => ({
      user_collection_id: item.user_collection_id,
    }));

    const response = await batchConsign({ consignments, token });
    if (isSuccess(response) && response.data) {
      const { total_count, success_count, failure_count, results, failure_summary, note } = response.data;

      onSuccess();

      if (failure_count === 0) {
        showToast('success', '批量寄售成功', `成功寄售 ${success_count} 个藏品`);
      } else {
        let failureMessages = '';

        if (results && results.length > 0) {
          failureMessages = results
            .filter((result) => !result.success)
            .map((result) => `藏品ID ${result.user_collection_id}: ${result.message}`)
            .join('\n');
        } else if (failure_summary) {
          failureMessages = Object.entries(failure_summary)
            .map(([reason, count]) => `${reason}: ${count} 个`)
            .join('\n');
        }

        const description = `总计: ${total_count} 个\n成功: ${success_count} 个\n失败: ${failure_count} 个\n\n失败详情:\n${failureMessages}`;

        showDialog({
          title: '批量寄售完成',
          description: note ? `${description}\n\n${note}` : description,
          confirmText: '确定',
          cancelText: null,
          onConfirm: () => {},
        });
      }
      callbacksRef.current.onBatchSuccess();
      return;
    }

    showToast('error', '', extractError(response, '批量寄售失败'));
    callbacksRef.current.onBatchError();
  } catch (error) {
    errorLog('useConsignmentAction', '批量寄售错误', error);
    showToast('error', '批量寄售失败', '网络错误，请稍后重试');
    callbacksRef.current.onBatchError();
  }
}
