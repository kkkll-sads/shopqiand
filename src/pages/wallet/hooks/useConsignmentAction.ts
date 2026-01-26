/**
 * 寄售操作 Hook
 * 处理寄售、提货、批量寄售等操作
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import {
  rightsDeliver,
  consignCollectionItem,
  getConsignmentCheck,
  computeConsignmentPrice,
  fetchConsignmentCoupons,
  batchConsign,
  MyCollectionItem,
  BatchConsignableListData,
} from '@/services/api';
import { getStoredToken } from '@/services/client';
import { useNotification } from '@/context/NotificationContext';
import { ConsignmentStatus, DeliveryStatus } from '@/constants/statusEnums';
import { isSuccess, extractError, extractData } from '@/utils/apiHelpers';
import { debugLog, warnLog, errorLog } from '@/utils/logger';

interface UseConsignmentActionOptions {
  onActionStart: () => void;
  onActionSuccess: () => void;
  onActionError: () => void;
  onBatchStart: () => void;
  onBatchSuccess: () => void;
  onBatchError: () => void;
}

/**
 * 解析藏品 ID
 */
export function resolveCollectionId(item: MyCollectionItem | null | undefined): number | string | undefined {
  if (!item) return undefined;
  return (
    item.user_collection_id ??
    (item.original_record ? item.original_record.user_collection_id : undefined) ??
    (item.original_record ? item.original_record.order_id : undefined) ??
    (item.original_record ? item.original_record.id : undefined) ??
    item.id ??
    item.item_id
  );
}

/**
 * 检查是否满足48小时
 */
export function check48Hours(buyTime: number): { passed: boolean; hoursLeft: number } {
  const now = Math.floor(Date.now() / 1000);
  const hoursPassed = (now - buyTime) / 3600;
  const hoursLeft = 48 - hoursPassed;
  return {
    passed: hoursPassed >= 48,
    hoursLeft: Math.max(0, Math.ceil(hoursLeft)),
  };
}

/**
 * 检查是否曾经寄售过
 */
export function hasConsignedBefore(item: MyCollectionItem): boolean {
  const status = item.consignment_status;
  return typeof status === 'number' && status !== ConsignmentStatus.NOT_CONSIGNED;
}

/**
 * 检查是否已经寄售成功（已售出）
 */
export function hasConsignedSuccessfully(item: MyCollectionItem): boolean {
  return item.consignment_status === ConsignmentStatus.SOLD;
}

/**
 * 检查是否正在寄售中
 */
export function isConsigning(item: MyCollectionItem): boolean {
  return item.consignment_status === ConsignmentStatus.CONSIGNING;
}

/**
 * 检查是否已提货
 */
export function isDelivered(item: MyCollectionItem): boolean {
  return item.delivery_status === DeliveryStatus.DELIVERED;
}

/**
 * 格式化秒数为时分秒
 */
export function formatSeconds(secs: number): string {
  const hours = Math.floor(secs / 3600);
  const minutes = Math.floor((secs % 3600) / 60);
  const seconds = secs % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * 寄售操作 Hook
 */
export function useConsignmentAction(options: UseConsignmentActionOptions) {
  const { onActionStart, onActionSuccess, onActionError, onBatchStart, onBatchSuccess, onBatchError } = options;
  const { showToast, showDialog } = useNotification();

  // 使用 ref 存储回调函数，避免它们成为 useCallback 的依赖项导致无限循环
  const callbacksRef = useRef({
    onActionStart, onActionSuccess, onActionError,
    onBatchStart, onBatchSuccess, onBatchError
  });
  callbacksRef.current = {
    onActionStart, onActionSuccess, onActionError,
    onBatchStart, onBatchSuccess, onBatchError
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
      return;
    }

    const token = getStoredToken() || undefined;
    setCheckingCoupons(true);

    try {
      const [checkRes, couponRes] = await Promise.all([
        getConsignmentCheck({ user_collection_id: collectionId, token }),
        fetchConsignmentCoupons({ page: 1, limit: 100, status: 1, token }),
      ]);

      // 处理解锁状态
      const checkData = extractData(checkRes);
      setConsignmentCheckData(checkData ?? null);

      // 处理寄售券
      const coupons = couponRes.data?.list || [];
      const itemSessionId = item.session_id || item.original_record?.session_id;
      const itemZoneId = item.zone_id || item.original_record?.zone_id;

      debugLog('useConsignmentAction', 'Coupon matching', {
        totalCoupons: coupons.length,
        itemSessionId,
        itemZoneId,
      });

      if (itemSessionId && itemZoneId) {
        const matched = coupons.filter(
          (c) => String(c.session_id) === String(itemSessionId) && String(c.zone_id) === String(itemZoneId)
        );
        setAvailableCouponCount(matched.length);
      } else {
        const fallbackCount = couponRes.data?.available_count ?? coupons.length;
        warnLog('useConsignmentAction', 'Item missing session/zone info, using fallback', {
          fallbackCount,
        });
        setAvailableCouponCount(fallbackCount);
      }
    } catch (err) {
      errorLog('useConsignmentAction', 'Fetch data failed', err);
      setConsignmentCheckData(null);
      setAvailableCouponCount(0);
    } finally {
      setCheckingCoupons(false);
    }
  }, []);

  // 实时倒计时
  useEffect(() => {
    if (!consignmentCheckData) {
      setConsignmentRemaining(null);
      return;
    }

    let secs: number = 0;
    if (typeof consignmentCheckData.remaining_seconds !== 'undefined' && consignmentCheckData.remaining_seconds !== null) {
      secs = Number(consignmentCheckData.remaining_seconds) || 0;
    } else if (typeof consignmentCheckData.remaining_text === 'string') {
      const match = consignmentCheckData.remaining_text.match(/(\d{1,}):(\d{2}):(\d{2})/);
      if (match) {
        const h = Number(match[1]) || 0;
        const m = Number(match[2]) || 0;
        const s = Number(match[3]) || 0;
        secs = h * 3600 + m * 60 + s;
      }
    } else {
      setConsignmentRemaining(null);
      return;
    }

    setConsignmentRemaining(secs > 0 ? secs : 0);
    let mounted = true;
    const id = setInterval(() => {
      if (!mounted) return;
      secs = Math.max(0, secs - 1);
      setConsignmentRemaining(secs);
      if (secs <= 0) {
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
    (item: MyCollectionItem | null): boolean => {
      if (!item) return false;

      if (isConsigning(item) || hasConsignedSuccessfully(item)) {
        return false;
      }

      const collectionId = resolveCollectionId(item);
      if (collectionId === undefined || collectionId === null) {
        return false;
      }

      const timeCheck = check48Hours(item.pay_time || item.buy_time || 0);
      const hasTicket = availableCouponCount > 0;

      if (consignmentCheckData) {
        let unlocked = false;
        if (typeof consignmentCheckData.can_consign === 'boolean') {
          unlocked = consignmentCheckData.can_consign;
        } else if (typeof consignmentCheckData.unlocked === 'boolean') {
          unlocked = consignmentCheckData.unlocked;
        } else if (typeof consignmentCheckData.remaining_seconds === 'number') {
          unlocked = Number(consignmentCheckData.remaining_seconds) <= 0;
        } else if (typeof consignmentRemaining === 'number') {
          unlocked = consignmentRemaining <= 0;
        } else {
          unlocked = timeCheck.passed;
        }

        if (checkingCoupons) return false;
        return unlocked && hasTicket;
      }

      if (checkingCoupons) return false;
      return timeCheck.passed && hasTicket;
    },
    [availableCouponCount, consignmentCheckData, consignmentRemaining, checkingCoupons]
  );

  // 执行权益分割
  const handleDelivery = useCallback(
    async (item: MyCollectionItem, onSuccess: () => void) => {
      const token = getStoredToken();
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

      const doRightsDeliver = () => {
        callbacksRef.current.onActionStart();
        rightsDeliver({ user_collection_id: collectionId, token })
          .then((res) => {
            if (isSuccess(res)) {
              showToast('success', '操作成功', extractError(res, '权益分割已提交'));
              onSuccess();
              callbacksRef.current.onActionSuccess();
            } else {
              showToast('error', '操作失败', extractError(res, '权益分割失败'));
              callbacksRef.current.onActionError();
            }
          })
          .catch((err: any) => {
            showToast('error', '提交失败', extractError(err, '权益分割失败'));
            callbacksRef.current.onActionError();
          });
      };

      if (hasConsignedBefore(item)) {
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
    },
    [showToast, showDialog]
  );

  // 执行寄售
  const handleConsignment = useCallback(
    async (item: MyCollectionItem, onSuccess: () => void) => {
      const token = getStoredToken();
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

      // 检查解锁状态
      try {
        const checkRes: any = await getConsignmentCheck({ user_collection_id: collectionId, token });
        const cdata = checkRes?.data;
        if (cdata) {
          if (typeof cdata.unlocked === 'boolean' && !cdata.unlocked) {
            const hrsLeft = cdata.remaining_seconds ? Math.ceil(Number(cdata.remaining_seconds) / 3600) : 0;
            showToast('warning', '时间未到', `寄售需要满足购买后48小时，还需等待 ${hrsLeft} 小时`);
            return;
          } else if (typeof cdata.remaining_seconds === 'number' && Number(cdata.remaining_seconds) > 0) {
            const hrsLeft = Math.ceil(Number(cdata.remaining_seconds) / 3600);
            showToast('warning', '时间未到', `寄售需要满足购买后48小时，还需等待 ${hrsLeft} 小时`);
            return;
          }
        }
      } catch (err) {
        // 后端会最终校验
      }

      // 检查寄售券
      try {
        const couponRes = await fetchConsignmentCoupons({ page: 1, limit: 100, status: 1, token });
        const coupons = couponRes.data?.list || [];

        if (coupons.length === 0) {
          showToast('warning', '缺少道具', '您没有可用的寄售券，无法进行寄售');
          return;
        }

        const itemSessionId = item.session_id || item.original_record?.session_id;
        const itemZoneId = item.zone_id || item.original_record?.zone_id;

        if (itemSessionId && itemZoneId) {
          const matchedCoupon = coupons.find(
            (c) => String(c.session_id) === String(itemSessionId) && String(c.zone_id) === String(itemZoneId)
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

      // 计算寄售价格
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
      consignCollectionItem({ user_collection_id: collectionId, price: priceValue, token })
        .then((res) => {
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
          } else {
            showToast('error', '提交失败', extractError(res, '寄售申请失败'));
            callbacksRef.current.onActionError();
          }
        })
        .catch((err: any) => {
          setActionError(extractError(err, '寄售申请失败'));
          callbacksRef.current.onActionError();
        });
    },
    [showToast, consignmentCheckData]
  );

  // 批量寄售
  const handleBatchConsign = useCallback(
    async (batchData: BatchConsignableListData | null, onSuccess: () => void) => {
      if (!batchData || batchData.items.length === 0) {
        showToast('warning', '提示', '暂无可寄售的藏品');
        return;
      }

      const token = getStoredToken();
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
                .filter((r) => !r.success)
                .map((r) => `藏品ID ${r.user_collection_id}: ${r.message}`)
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
            });
          }
          callbacksRef.current.onBatchSuccess();
        } else {
          showToast('error', '', extractError(response, '批量寄售失败'));
          callbacksRef.current.onBatchError();
        }
      } catch (error) {
        errorLog('useConsignmentAction', '批量寄售错误', error);
        showToast('error', '批量寄售失败', '网络错误，请稍后重试');
        callbacksRef.current.onBatchError();
      }
    },
    [showToast, showDialog]
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
