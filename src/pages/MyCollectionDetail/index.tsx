import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Shield } from 'lucide-react';
import { useParams } from 'react-router-dom';
import {
  accountApi,
  collectionConsignmentApi,
  collectionTradeApi,
  computeConsignmentPrice,
  type CollectionConsignmentCheckData,
  type UserCollectionDetail,
  userApi,
  userCollectionApi,
} from '../../api';
import { getErrorMessage } from '../../api/core/errors';
import { OfflineBanner } from '../../components/layout/OfflineBanner';
import { PullToRefreshContainer } from '../../components/ui/PullToRefreshContainer';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useRequest } from '../../hooks/useRequest';
import { copyToClipboard } from '../../lib/clipboard';
import { useAppNavigate } from '../../lib/navigation';
import { MyCollectionBottomActions } from './components/MyCollectionBottomActions';
import { MyCollectionCertificateCard } from './components/MyCollectionCertificateCard';
import { MyCollectionConsignmentModal } from './components/MyCollectionConsignmentModal';
import { MyCollectionDetailHeader } from './components/MyCollectionDetailHeader';

interface MyCollectionDetailPageData {
  detail: UserCollectionDetail;
  profile?: Awaited<ReturnType<typeof accountApi.getProfile>>;
  realNameStatus?: Awaited<ReturnType<typeof userApi.getRealNameStatus>>;
}

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

export const MyCollectionDetailPage = () => {
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
  const profile = pageRequest.data?.profile;
  const realNameStatus = pageRequest.data?.realNameStatus;
  const userInfo = profile?.userInfo;
  const title = getCollectionTitle(item);
  const resolvedCollectionId = item?.user_collection_id || item?.id || collectionId;
  const consignmentCouponCount = userInfo?.consignmentCoupon ?? 0;
  const serviceFeeBalance = userInfo?.serviceFeeBalance ?? '0.00';
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
      const response = await collectionConsignmentApi.consignmentCheck(resolvedCollectionId);
      setConsignmentCheckData(response);
      setConsignmentSubmitError(null);
    } catch (error) {
      setConsignmentCheckError(getErrorMessage(error));
      setConsignmentCheckData(null);
    } finally {
      setConsignmentCheckLoading(false);
    }
  }, [resolvedCollectionId]);

  const handleRefresh = useCallback(async () => {
    refreshStatus();
    await Promise.allSettled([
      pageRequest.reload(),
      consignmentModalOpen ? loadConsignmentCheck() : Promise.resolve(undefined),
    ]);
  }, [consignmentModalOpen, loadConsignmentCheck, pageRequest, refreshStatus]);

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
    setConsignmentSubmitError(null);
  }, [consignmentSubmitting]);

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

    if (consignmentCouponCount <= 0) {
      setConsignmentSubmitError('当前账户没有可用寄售券');
      return;
    }

    setConsignmentSubmitting(true);
    setConsignmentSubmitError(null);

    try {
      await collectionConsignmentApi.consign({
        user_collection_id: resolvedCollectionId,
        price: consignmentPrice,
      });

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
                          consignmentCoupon: Math.max(0, current.profile.userInfo.consignmentCoupon - 1),
                        }
                      : current.profile.userInfo,
                  }
                : current.profile,
            }
          : current
      ));

      showToast({ type: 'success', message: '寄售申请已提交' });
      setConsignmentModalOpen(false);
      window.setTimeout(() => {
        goBackOr('my_collection');
      }, 700);
    } catch (error) {
      setConsignmentSubmitError(getErrorMessage(error));
    } finally {
      setConsignmentSubmitting(false);
    }
  }, [
    consignmentCheckData,
    consignmentCouponCount,
    consignmentPrice,
    consignmentSubmitting,
    countdownSeconds,
    ensureRealNameVerified,
    goBackOr,
    item,
    pageRequest,
    resolvedCollectionId,
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
      />
    );
  };

  return (
    <div
      className="relative flex h-full flex-1 flex-col overflow-hidden bg-[#FDFBF7] text-gray-900"
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
        <MyCollectionConsignmentModal
          isOpen={consignmentModalOpen}
          item={item}
          checkData={consignmentCheckData}
          checkError={consignmentCheckError}
          checkLoading={consignmentCheckLoading}
          consignmentCouponCount={consignmentCouponCount}
          consignmentPrice={consignmentPrice}
          countdownSeconds={countdownSeconds}
          isSubmitting={consignmentSubmitting}
          onClose={handleCloseConsignment}
          onCopy={handleCopy}
          onOpenVoucherCenter={() => {
            setConsignmentModalOpen(false);
            goTo('consignment_voucher');
          }}
          onRetry={() => void loadConsignmentCheck()}
          onSubmit={() => void handleSubmitConsignment()}
          serviceFeeBalance={serviceFeeBalance}
          submitError={consignmentSubmitError}
        />
      ) : null}
    </div>
  );
};

export default MyCollectionDetailPage;
