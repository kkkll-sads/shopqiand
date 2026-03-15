import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Shield } from 'lucide-react';
import { useLocation, useParams } from 'react-router-dom';
import {
  accountApi,
  collectionConsignmentApi,
  collectionTradeApi,
  computeConsignmentPrice,
  getConsignFailureMessage,
  type CollectionConsignmentCheckData,
  type ConsignmentEquityCard,
  type MyCollectionItem,
  userApi,
} from '../../api';
import { type UserCollectionDetail, userCollectionApi } from '../../api/modules/userCollection';
import { getErrorMessage } from '../../api/core/errors';
import { OfflineBanner } from '../../components/layout/OfflineBanner';
import { PullToRefreshContainer } from '../../components/ui/PullToRefreshContainer';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useRequest } from '../../hooks/useRequest';
import { copyToClipboard } from '../../lib/clipboard';
import { useAppNavigate } from '../../lib/navigation';
import { MyCollectionBottomActions } from './components/MyCollectionBottomActions';
import { ConsignmentEquityCardSelectSheet } from './components/ConsignmentEquityCardSelectSheet';
import { MyCollectionCertificateCard } from './components/MyCollectionCertificateCard';
import { MyCollectionConsignmentModal } from './components/MyCollectionConsignmentModal';
import { MyCollectionDetailHeader } from './components/MyCollectionDetailHeader';

interface MyCollectionDetailPageData {
  detail: UserCollectionDetail;
  profile?: Awaited<ReturnType<typeof accountApi.getProfile>>;
  realNameStatus?: Awaited<ReturnType<typeof userApi.getRealNameStatus>>;
}

type CollectionRetrySource = {
  fail_count?: number;
  free_attempts_remaining?: number;
  free_consign_attempts?: number;
} | null | undefined;

const CHECK_AVAILABLE_COUPON_KEYS = [
  'available_coupon_count',
  'available_consignment_coupon_count',
  'consignment_coupon',
  'consignment_coupon_count',
  'coupon_balance',
  'coupon_remaining',
  'coupon_count',
];

const CHECK_SERVICE_FEE_BALANCE_KEYS = [
  'service_fee_balance',
  'available_service_fee_balance',
  'confirm_fee_balance',
  'available_confirm_fee_balance',
];

function formatCurrency(value: number): string {
  return Number.isFinite(value)
    ? value.toLocaleString('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: false,
      })
    : '0.00';
}

function getCollectionTitle(item?: UserCollectionDetail): string {
  if (!item) {
    return '未命名藏品';
  }

  const rawName = typeof item.name === 'string' ? item.name : '';
  const rawItemTitle = typeof item.item_title === 'string' ? item.item_title : '';
  return item.title || rawName || rawItemTitle || '未命名藏品';
}

function isRealNameApproved(status: number | undefined): boolean {
  return status === 2;
}

function isSoldItem(item: UserCollectionDetail): boolean {
  const statusText = `${item.status_text || ''}${item.consignment_status_text || ''}`;
  return item.consignment_status === 2 || statusText.includes('已售出');
}

function isConsigningItem(item: UserCollectionDetail): boolean {
  const statusText = `${item.status_text || ''}${item.consignment_status_text || ''}`;
  return item.consignment_status === 1 || statusText.includes('寄售中');
}

function isMiningItem(item: UserCollectionDetail): boolean {
  return item.mining_status === 1;
}

function getCountdownSeed(checkData: CollectionConsignmentCheckData | null): number | null {
  if (!checkData || typeof checkData.remaining_seconds !== 'number') {
    return null;
  }

  return Math.max(0, Math.floor(checkData.remaining_seconds));
}

function readNumber(value: unknown, fallback = 0): number {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : fallback;
}

function readStringValue(value: unknown, fallback = ''): string {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  return fallback;
}

function readBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value === 1;
  }

  if (typeof value === 'string') {
    const normalizedValue = value.trim().toLowerCase();
    return normalizedValue === '1' || normalizedValue === 'true' || normalizedValue === 'yes';
  }

  return false;
}

function readWaiveType(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function hasFieldValue(source: Record<string, unknown> | null | undefined, keys: string[]): boolean {
  if (!source) {
    return false;
  }

  return keys.some((key) => {
    const value = source[key];
    if (typeof value === 'string') {
      return value.trim().length > 0;
    }

    if (typeof value === 'number') {
      return Number.isFinite(value);
    }

    return value != null;
  });
}

function getSourceFailCount(source: CollectionRetrySource): number {
  return Math.max(0, readNumber(source?.fail_count));
}

function getSourceFreeAttemptCount(source: CollectionRetrySource): number {
  return Math.max(
    readNumber(source?.free_attempts_remaining),
    readNumber(source?.free_consign_attempts),
  );
}

function getFreeAttemptCount(
  checkData: CollectionConsignmentCheckData | null,
  item?: CollectionRetrySource,
  sourceItem?: CollectionRetrySource,
): number {
  return Math.max(
    readNumber(checkData?.free_attempts_remaining),
    readNumber(checkData?.free_consign_attempts),
    getSourceFreeAttemptCount(item),
    getSourceFreeAttemptCount(sourceItem),
  );
}

function isFreeResendConsignment(
  checkData: CollectionConsignmentCheckData | null,
  item?: CollectionRetrySource,
  sourceItem?: CollectionRetrySource,
): boolean {
  const waiveType = readWaiveType(checkData?.waive_type);
  if (waiveType === 'free_attempt' || waiveType === 'system_resend') {
    return true;
  }

  if (readBoolean(checkData?.is_free_resend)) {
    return true;
  }

  if (getFreeAttemptCount(checkData, item, sourceItem) > 0) {
    return true;
  }

  return Math.max(
    readNumber(checkData?.fail_count),
    getSourceFailCount(item),
    getSourceFailCount(sourceItem),
  ) > 0;
}

function getFreeResendDescription(
  checkData: CollectionConsignmentCheckData | null,
  item?: CollectionRetrySource,
  sourceItem?: CollectionRetrySource,
): string {
  const waiveType = readWaiveType(checkData?.waive_type);

  if (waiveType === 'system_resend') {
    return '本次寄售属于系统赠送重发，不消耗寄售券，也不收取服务费。';
  }

  if (isFreeResendConsignment(checkData, item, sourceItem)) {
    return '当前藏品已有流拍记录，本次寄售免寄售券、免服务费。';
  }

  return '';
}

export const MyCollectionDetailPage = () => {
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const collectionId = Number(id);
  const { goBackOr, goTo, navigate } = useAppNavigate();
  const { hideLoading, showConfirm, showLoading, showToast } = useFeedback();
  const { isOffline, refreshStatus } = useNetworkStatus();
  const [consignmentModalOpen, setConsignmentModalOpen] = useState(false);
  const [consignmentCheckData, setConsignmentCheckData] = useState<CollectionConsignmentCheckData | null>(null);
  const [consignmentCheckLoading, setConsignmentCheckLoading] = useState(false);
  const [consignmentCheckError, setConsignmentCheckError] = useState<string | null>(null);
  const [consignmentSubmitError, setConsignmentSubmitError] = useState<string | null>(null);
  const [consignmentSubmitting, setConsignmentSubmitting] = useState(false);
  const [nodeSubmitting, setNodeSubmitting] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);
  const [selectedEquityCardId, setSelectedEquityCardId] = useState<number | null>(null);
  const [equityCardSelectSheetOpen, setEquityCardSelectSheetOpen] = useState(false);

  const pageRequest = useRequest<MyCollectionDetailPageData>(
    async (signal) => {
      if (!Number.isFinite(collectionId) || collectionId <= 0) {
        throw new Error('藏品证书编号无效');
      }

      const detail = await userCollectionApi.detail(collectionId, signal);
      const [profileResult, realNameResult] = await Promise.allSettled([
        accountApi.getProfile({ signal }),
        userApi.getRealNameStatus({ signal }),
      ]);

      return {
        detail,
        profile: profileResult.status === 'fulfilled' ? profileResult.value : undefined,
        realNameStatus: realNameResult.status === 'fulfilled' ? realNameResult.value : undefined,
      };
    },
    {
      deps: [collectionId],
      keepPreviousData: false,
    },
  );

  const item = pageRequest.data?.detail;
  const sourceItem = (location.state as { item?: MyCollectionItem } | null)?.item;
  const consignmentId =
    (item && 'consignment_id' in item && typeof item.consignment_id === 'number' && item.consignment_id > 0
      ? item.consignment_id
      : null) ?? (sourceItem?.consignment_id && sourceItem.consignment_id > 0 ? sourceItem.consignment_id : null);

  /** 列表已含 order_no、flow_no 时无需再请求 */
  const hasConsignmentFromList =
    sourceItem && (sourceItem.order_no || sourceItem.flow_no);

  const consignmentDetailRequest = useRequest(
    async (signal) => {
      if (hasConsignmentFromList || !consignmentId || !item || !isSoldItem(item)) {
        return null;
      }
      return collectionConsignmentApi.consignmentDetail(consignmentId, signal);
    },
    {
      deps: [consignmentId, hasConsignmentFromList, item],
      initialData: null,
    },
  );

  /** 优先用列表数据，否则用 API 结果 */
  const consignmentDetail = useMemo(() => {
    if (sourceItem && (sourceItem.order_no || sourceItem.flow_no)) {
      return {
        buy_price: sourceItem.buy_price ?? 0,
        order_no: sourceItem.order_no ?? '',
        flow_no: sourceItem.flow_no ?? '',
      };
    }
    const api = consignmentDetailRequest.data;
    if (!api || (!api.order_no && !api.flow_no)) return null;
    return { ...api };
  }, [sourceItem, consignmentDetailRequest.data]);
  const profile = pageRequest.data?.profile;
  const realNameStatus = pageRequest.data?.realNameStatus;
  const userInfo = profile?.userInfo;
  const title = getCollectionTitle(item);
  const resolvedCollectionId = item?.user_collection_id || item?.id || collectionId;
  const currentValuation = useMemo(() => {
    if (!item) {
      return '0.00';
    }

    const sourcePrice = item.market_price > 0 ? item.market_price : item.buy_price;
    return formatCurrency(sourcePrice);
  }, [item]);
  const consignmentPrice = useMemo(() => {
    if (consignmentCheckData) {
      return computeConsignmentPrice(consignmentCheckData);
    }

    if (!item) {
      return 0;
    }

    return Number((item.market_price > 0 ? item.market_price : item.buy_price).toFixed(2));
  }, [consignmentCheckData, item]);
  const freeAttemptCount = useMemo(
    () => getFreeAttemptCount(consignmentCheckData, item, sourceItem),
    [consignmentCheckData, item, sourceItem],
  );
  const failCount = useMemo(
    () => Math.max(readNumber(consignmentCheckData?.fail_count), getSourceFailCount(item), getSourceFailCount(sourceItem)),
    [consignmentCheckData?.fail_count, item, sourceItem],
  );
  const isFreeResend = useMemo(
    () => isFreeResendConsignment(consignmentCheckData, item, sourceItem),
    [consignmentCheckData, item, sourceItem],
  );
  const freeResendDescription = useMemo(() => {
    if (freeAttemptCount <= 0 && failCount <= 0 && !readBoolean(consignmentCheckData?.is_free_resend)) {
      const waiveType = readWaiveType(consignmentCheckData?.waive_type);
      if (waiveType !== 'free_attempt' && waiveType !== 'system_resend') {
        return '';
      }
    }

    return getFreeResendDescription(consignmentCheckData, item, sourceItem);
  }, [consignmentCheckData, failCount, freeAttemptCount, item, sourceItem]);
  const availableConsignmentCouponCount = useMemo(() => {
    if (hasFieldValue(consignmentCheckData, CHECK_AVAILABLE_COUPON_KEYS)) {
      return Math.max(0, readNumber(consignmentCheckData?.available_coupon_count));
    }

    return Math.max(0, userInfo?.consignmentCoupon ?? 0);
  }, [consignmentCheckData, userInfo?.consignmentCoupon]);
  const requiredConsignmentCouponCount = useMemo(() => {
    if (isFreeResend) {
      return 0;
    }

    return Math.max(1, readNumber(consignmentCheckData?.required_coupon_count, 1));
  }, [consignmentCheckData?.required_coupon_count, isFreeResend]);
  const baseFee = useMemo(
    () => (isFreeResend ? 0 : readNumber(consignmentCheckData?.original_service_fee ?? consignmentCheckData?.base_fee)),
    [consignmentCheckData?.original_service_fee, consignmentCheckData?.base_fee, isFreeResend],
  );
  const globalMinFee = useMemo(
    () => (isFreeResend ? 0 : readNumber(consignmentCheckData?.global_min_fee)),
    [consignmentCheckData?.global_min_fee, isFreeResend],
  );
  const availableEquityCards = useMemo(
    () => consignmentCheckData?.available_equity_cards ?? [],
    [consignmentCheckData?.available_equity_cards],
  );
  const { consignmentServiceFee, membershipDeduction } = useMemo(() => {
    if (isFreeResend) {
      return { consignmentServiceFee: 0, membershipDeduction: 0 };
    }

    if (baseFee <= 0) {
      const fallbackFee =
        consignmentCheckData?.service_fee > 0
          ? Number(consignmentCheckData.service_fee.toFixed(2))
          : Number((consignmentPrice * (consignmentCheckData?.service_fee_rate || 0.03)).toFixed(2));
      return {
        consignmentServiceFee: fallbackFee,
        membershipDeduction: readNumber(consignmentCheckData?.membership_deduction),
      };
    }

    if (selectedEquityCardId == null) {
      return {
        consignmentServiceFee: baseFee,
        membershipDeduction: 0,
      };
    }

    const card = availableEquityCards.find((c: { id: number; actual_deduct_amount: number }) => c.id === selectedEquityCardId);
    if (!card) {
      return {
        consignmentServiceFee: baseFee,
        membershipDeduction: 0,
      };
    }

    const deductAmount = card.actual_deduct_amount;
    const finalFee = Math.max(globalMinFee, Number((baseFee - deductAmount).toFixed(2)));
    return {
      consignmentServiceFee: finalFee,
      membershipDeduction: Number((baseFee - finalFee).toFixed(2)),
    };
  }, [
    availableEquityCards,
    baseFee,
    consignmentCheckData?.membership_deduction,
    consignmentCheckData?.service_fee,
    consignmentCheckData?.service_fee_rate,
    consignmentPrice,
    globalMinFee,
    isFreeResend,
    selectedEquityCardId,
  ]);
  const originalServiceFee = baseFee;
  const serviceFeeBalance = useMemo(() => {
    if (hasFieldValue(consignmentCheckData, CHECK_SERVICE_FEE_BALANCE_KEYS)) {
      return readStringValue(consignmentCheckData?.service_fee_balance, '0.00');
    }

    return userInfo?.serviceFeeBalance ?? '0.00';
  }, [consignmentCheckData, userInfo?.serviceFeeBalance]);
  const serviceFeeBalanceValue = useMemo(
    () => Math.max(0, readNumber(serviceFeeBalance)),
    [serviceFeeBalance],
  );
  const hasInsufficientServiceFee = useMemo(
    () => !isFreeResend && consignmentServiceFee > 0 && serviceFeeBalanceValue < consignmentServiceFee,
    [consignmentServiceFee, isFreeResend, serviceFeeBalanceValue],
  );
  const showBottomActions = Boolean(
    item && !isSoldItem(item) && !isConsigningItem(item) && !isMiningItem(item),
  );

  useEffect(() => {
    if (!consignmentModalOpen) {
      setCountdownSeconds(null);
      return;
    }

    const nextCountdown = getCountdownSeed(consignmentCheckData);
    setCountdownSeconds(nextCountdown);

    if (typeof nextCountdown !== 'number' || nextCountdown <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setCountdownSeconds((current) => {
        if (typeof current !== 'number' || current <= 1) {
          window.clearInterval(timer);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [consignmentCheckData, consignmentModalOpen]);

  useEffect(() => {
    if (!consignmentModalOpen || !consignmentCheckData) {
      return;
    }

    const recommended = consignmentCheckData.recommended_equity_card_id;
    if (recommended != null && recommended > 0) {
      const cards = consignmentCheckData.available_equity_cards ?? [];
      const exists = cards.some((c: { id: number }) => c.id === recommended);
      if (exists) {
        setSelectedEquityCardId(recommended);
        return;
      }
    }

    setSelectedEquityCardId(null);
  }, [consignmentCheckData, consignmentModalOpen]);

  const handleCopy = useCallback(async (text: string, successMessage = '已复制') => {
    if (!text) {
      showToast({ type: 'warning', message: '暂无可复制内容' });
      return;
    }

    const success = await copyToClipboard(text);
    showToast({
      message: success ? successMessage : '复制失败，请稍后重试',
      type: success ? 'success' : 'error',
    });
  }, [showToast]);

  const handleSearchHash = useCallback((hash: string) => {
    if (!hash) {
      showToast({ type: 'warning', message: '暂无可查询的链上指纹' });
      return;
    }

    navigate(`/search?code=${encodeURIComponent(hash)}`);
  }, [navigate, showToast]);

  const ensureRealNameVerified = useCallback(() => {
    if (isRealNameApproved(realNameStatus?.realNameStatus)) {
      return true;
    }

    showToast({ type: 'warning', message: '请先完成实名认证' });
    goTo('real_name_auth');
    return false;
  }, [goTo, realNameStatus?.realNameStatus, showToast]);

  const loadConsignmentCheck = useCallback(async () => {
    if (!Number.isFinite(resolvedCollectionId) || resolvedCollectionId <= 0) {
      setConsignmentCheckError('无法获取藏品 ID');
      return;
    }

    setConsignmentCheckLoading(true);
    setConsignmentCheckError(null);

    try {
      const [checkResult, profileResult] = await Promise.allSettled([
        collectionConsignmentApi.consignmentCheck(resolvedCollectionId),
        accountApi.getProfile(),
      ]);

      if (checkResult.status !== 'fulfilled') {
        throw checkResult.reason;
      }

      setConsignmentCheckData(checkResult.value);
      if (profileResult.status === 'fulfilled') {
        pageRequest.setData((current) => (current ? { ...current, profile: profileResult.value } : current));
      }
      setConsignmentSubmitError(null);
    } catch (error) {
      setConsignmentCheckError(getErrorMessage(error));
      setConsignmentCheckData(null);
    } finally {
      setConsignmentCheckLoading(false);
    }
  }, [pageRequest, resolvedCollectionId]);

  const handleRefresh = useCallback(async () => {
    refreshStatus();
    await Promise.allSettled([
      pageRequest.reload(),
      consignmentModalOpen ? loadConsignmentCheck() : Promise.resolve(undefined),
      item && isSoldItem(item) && consignmentId && !hasConsignmentFromList ? consignmentDetailRequest.reload() : Promise.resolve(undefined),
    ]);
  }, [
    consignmentDetailRequest,
    consignmentId,
    consignmentModalOpen,
    hasConsignmentFromList,
    item,
    loadConsignmentCheck,
    pageRequest,
    refreshStatus,
  ]);

  const handleOpenConsignment = useCallback(async () => {
    if (!item || consignmentCheckLoading) {
      return;
    }

    if (!ensureRealNameVerified()) {
      return;
    }

    setConsignmentModalOpen(true);
    setConsignmentSubmitError(null);
    await loadConsignmentCheck();
  }, [consignmentCheckLoading, ensureRealNameVerified, item, loadConsignmentCheck]);

  const handleCloseConsignment = useCallback(() => {
    if (consignmentSubmitting) {
      return;
    }

    setConsignmentModalOpen(false);
    setEquityCardSelectSheetOpen(false);
    setSelectedEquityCardId(null);
    setConsignmentSubmitError(null);
  }, [consignmentSubmitting]);

  const handleOpenEquityCardSelect = useCallback(() => {
    setEquityCardSelectSheetOpen(true);
  }, []);

  const handleEquityCardConfirm = useCallback((cardId: number | null) => {
    setSelectedEquityCardId(cardId);
    setEquityCardSelectSheetOpen(false);
  }, []);

  const handleUpgradeNode = useCallback(async () => {
    if (!item || nodeSubmitting) {
      return;
    }

    if (!ensureRealNameVerified()) {
      return;
    }

    const confirmed = await showConfirm({
      title: '升级为权益节点',
      message: '升级后将参与权益节点运行，当前藏品将不再支持寄售。确认继续吗？',
      confirmText: '确认升级',
      cancelText: '取消',
    });

    if (!confirmed) {
      return;
    }

    setNodeSubmitting(true);
    showLoading({ message: '权益节点升级中...' });

    try {
      await collectionTradeApi.toMining(resolvedCollectionId);
      pageRequest.setData((current) => (
        current
          ? {
              ...current,
              detail: {
                ...current.detail,
                mining_status: 1,
                status_text: '权益节点运行中',
              },
            }
          : current
      ));
      showToast({ type: 'success', message: '已升级为权益节点' });
      window.setTimeout(() => {
        goBackOr('my_collection');
      }, 700);
    } catch (error) {
      showToast({ type: 'error', message: getErrorMessage(error) });
    } finally {
      hideLoading();
      setNodeSubmitting(false);
    }
  }, [
    ensureRealNameVerified,
    goBackOr,
    hideLoading,
    item,
    nodeSubmitting,
    pageRequest,
    resolvedCollectionId,
    showConfirm,
    showLoading,
    showToast,
  ]);

  const handleSubmitConsignment = useCallback(async () => {
    if (!item || consignmentSubmitting) {
      return;
    }

    if (!ensureRealNameVerified()) {
      return;
    }

    if (!consignmentCheckData) {
      setConsignmentSubmitError('暂未获取到寄售校验结果');
      return;
    }

    const isUnlocked =
      consignmentCheckData.unlocked || (typeof countdownSeconds === 'number' && countdownSeconds <= 0);

    if (!isUnlocked) {
      setConsignmentSubmitError('当前资产尚未到可寄售时间');
      return;
    }

    if (!isFreeResend && hasInsufficientServiceFee) {
      setConsignmentSubmitError(
        `当前确权金不足，本次寄售需要 ${formatCurrency(consignmentServiceFee)} 元，当前余额 ${formatCurrency(serviceFeeBalance)} 元`,
      );
      return;
    }

    if (!isFreeResend && availableConsignmentCouponCount < requiredConsignmentCouponCount) {
      setConsignmentSubmitError('当前账户没有可用寄售券');
      return;
    }

    setConsignmentSubmitting(true);
    setConsignmentSubmitError(null);

    try {
      const result = await collectionConsignmentApi.consign({
        user_collection_id: resolvedCollectionId,
        price: consignmentPrice,
        equity_card_id: selectedEquityCardId ?? undefined,
      });
      const failureMessage = getConsignFailureMessage(result);
      if (failureMessage) {
        throw new Error(failureMessage);
      }
      const waivedThisConsignment =
        isFreeResend
        || result.is_free_resend
        || readWaiveType(result.waive_type) === 'free_attempt'
        || readWaiveType(result.waive_type) === 'system_resend';

      pageRequest.setData((current) => (
        current
          ? {
              ...current,
              detail: {
                ...current.detail,
                consignment_status: 1,
                consignment_status_text: '寄售中',
                status_text: '寄售中',
              },
              profile: current.profile
                ? {
                    ...current.profile,
                    userInfo: current.profile.userInfo
                      ? {
                          ...current.profile.userInfo,
                          consignmentCoupon: result.coupon_remaining > 0
                            ? result.coupon_remaining
                            : Math.max(
                                0,
                                current.profile.userInfo.consignmentCoupon - result.coupon_used,
                              ),
                          serviceFeeBalance: result.service_fee_balance
                            ? formatCurrency(Number(result.service_fee_balance))
                            : formatCurrency(
                                Math.max(
                                  0,
                                  readNumber(current.profile.userInfo.serviceFeeBalance) - result.service_fee,
                                ),
                              ),
                        }
                      : current.profile.userInfo,
                  }
                : current.profile,
            }
          : current
      ));

      showToast({
        type: 'success',
        message: waivedThisConsignment
          ? '寄售申请已提交，本次免寄售券、免服务费'
          : '寄售申请已提交',
      });
      setConsignmentModalOpen(false);
      window.setTimeout(() => {
        goBackOr('my_collection');
      }, 700);
    } catch (error) {
      setConsignmentSubmitError(getErrorMessage(error));
      showToast({ type: 'error', message: getErrorMessage(error) });
    } finally {
      setConsignmentSubmitting(false);
    }
  }, [
    availableConsignmentCouponCount,
    consignmentCheckData,
    consignmentPrice,
    consignmentServiceFee,
    consignmentSubmitting,
    countdownSeconds,
    ensureRealNameVerified,
    goBackOr,
    hasInsufficientServiceFee,
    isFreeResend,
    item,
    pageRequest,
    requiredConsignmentCouponCount,
    resolvedCollectionId,
    serviceFeeBalance,
    selectedEquityCardId,
    showToast,
  ]);

  const renderContent = () => {
    if (pageRequest.loading && !item) {
      return (
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 size={28} className="animate-spin text-[#8c6136]" />
        </div>
      );
    }

    if (pageRequest.error && !item) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center text-gray-400">
          <Shield size={48} className="opacity-20" />
          <div className="max-w-[280px] text-sm leading-6 text-gray-500">
            {getErrorMessage(pageRequest.error)}
          </div>
          <button
            type="button"
            onClick={() => void pageRequest.reload()}
            className="font-bold text-amber-600"
          >
            重新加载
          </button>
        </div>
      );
    }

    if (!item) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center text-gray-400">
          <Shield size={48} className="opacity-20" />
          <div>无法加载藏品信息</div>
          <button
            type="button"
            onClick={() => goBackOr('my_collection')}
            className="font-bold text-amber-600"
          >
            返回
          </button>
        </div>
      );
    }

    return (
      <MyCollectionCertificateCard
        item={item}
        title={title}
        onCopy={handleCopy}
        onSearchHash={handleSearchHash}
        consignmentDetail={consignmentDetail ?? null}
      />
    );
  };

  return (
    <div
      className="collection-certificate-dark-scope relative flex h-full flex-1 flex-col overflow-hidden bg-[#FDFBF7] text-gray-900"
      style={{ paddingBottom: showBottomActions ? 'calc(env(safe-area-inset-bottom) + 5.75rem)' : undefined }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 20%, rgba(120,87,46,0.08), transparent 30%), repeating-linear-gradient(0deg, rgba(120,87,46,0.04) 0 1px, transparent 1px 24px), repeating-linear-gradient(90deg, rgba(120,87,46,0.02) 0 1px, transparent 1px 24px)',
        }}
      />

      <MyCollectionDetailHeader onBack={() => goBackOr('my_collection')} />

      {isOffline ? (
        <OfflineBanner onAction={handleRefresh} className="relative z-30 border-b border-red-100" />
      ) : null}

      <PullToRefreshContainer
        className="flex-1 overflow-y-auto"
        onRefresh={handleRefresh}
        disabled={isOffline}
      >
        <div className={showBottomActions ? 'pb-28' : 'pb-6'}>
          {renderContent()}
        </div>
      </PullToRefreshContainer>

      {item && showBottomActions ? (
        <MyCollectionBottomActions
          currentValuation={currentValuation}
          nodeLoading={nodeSubmitting}
          consignmentLoading={consignmentCheckLoading && !consignmentModalOpen}
          onUpgradeNode={() => void handleUpgradeNode()}
          onConsignment={() => void handleOpenConsignment()}
        />
      ) : null}

      {item ? (
        <>
          <MyCollectionConsignmentModal
            isOpen={consignmentModalOpen}
            item={item}
            checkData={consignmentCheckData}
            checkError={consignmentCheckError}
            checkLoading={consignmentCheckLoading}
            availableConsignmentCouponCount={availableConsignmentCouponCount}
            availableEquityCards={availableEquityCards}
            consignmentPrice={consignmentPrice}
            countdownSeconds={countdownSeconds}
            freeResendDescription={freeResendDescription}
            isFreeResend={isFreeResend}
            isSubmitting={consignmentSubmitting}
            onClose={handleCloseConsignment}
            onCopy={handleCopy}
            onOpenCardSelect={handleOpenEquityCardSelect}
            onOpenVoucherCenter={() => {
              setConsignmentModalOpen(false);
              goTo('consignment_voucher');
            }}
            onRetry={() => void loadConsignmentCheck()}
            requiredConsignmentCouponCount={requiredConsignmentCouponCount}
            selectedEquityCardId={selectedEquityCardId}
            onSubmit={() => void handleSubmitConsignment()}
            serviceFee={consignmentServiceFee}
            serviceFeeBalance={serviceFeeBalance}
            originalServiceFee={originalServiceFee}
            membershipDeduction={membershipDeduction}
            submitError={consignmentSubmitError}
          />
          <ConsignmentEquityCardSelectSheet
            cards={availableEquityCards}
            isOpen={equityCardSelectSheetOpen}
            recommendedId={consignmentCheckData?.recommended_equity_card_id ?? null}
            selectedId={selectedEquityCardId}
            onClose={() => setEquityCardSelectSheetOpen(false)}
            onConfirm={handleEquityCardConfirm}
          />
        </>
      ) : null}
    </div>
  );
};

export default MyCollectionDetailPage;
