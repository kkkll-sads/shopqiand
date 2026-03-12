import { useCallback } from 'react';
import { Box, Copy, Gem, ImageOff, ShieldCheck, Sparkles } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { getErrorMessage } from '../../api/core/errors';
import { type UserCollectionDetail, userCollectionApi } from '../../api';
import { OfflineBanner } from '../../components/layout/OfflineBanner';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { ErrorState } from '../../components/ui/ErrorState';
import { PullToRefreshContainer } from '../../components/ui/PullToRefreshContainer';
import { Skeleton } from '../../components/ui/Skeleton';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useRequest } from '../../hooks/useRequest';
import { copyToClipboard } from '../../lib/clipboard';
import { useAppNavigate } from '../../lib/navigation';
import { MyCollectionCertificateCard } from './components/MyCollectionCertificateCard';

function formatCurrency(value: number): string {
  return Number.isFinite(value) ? value.toFixed(2) : '0.00';
}

function formatFingerprintPreview(value: string): string {
  if (!value) {
    return '--';
  }

  if (value.length <= 18) {
    return value;
  }

  return `${value.slice(0, 10)}...${value.slice(-8)}`;
}

function getPageTitle(item?: UserCollectionDetail): string {
  if (!item) {
    return '数字资产持有凭证';
  }

  return item.title || '数字资产持有凭证';
}

function getFingerprint(item: UserCollectionDetail): string {
  const candidates = [item.hash, item.fingerprint, item.md5, item.tx_hash];
  return candidates.find((value) => typeof value === 'string' && value.trim()) || '';
}

function getStatusMeta(item: UserCollectionDetail) {
  if (item.consignment_status === 2 || item.status_text === '已售出') {
    return {
      label: '已售出',
      className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    };
  }

  if (item.consignment_status === 1 || item.status_text === '寄售中') {
    return {
      label: '寄售中',
      className: 'border-violet-200 bg-violet-50 text-violet-700',
    };
  }

  if (item.mining_status === 1) {
    return {
      label: '运行中',
      className: 'border-sky-200 bg-sky-50 text-sky-700',
    };
  }

  return {
    label: item.status_text || '持有中',
    className: 'border-amber-200 bg-amber-50 text-amber-700',
  };
}

function CertificateSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <div className="rounded-[28px] border border-[#ead8bc] bg-[#fff9ef] p-4 shadow-soft">
        <div className="flex gap-4">
          <Skeleton className="h-24 w-24 rounded-[22px]" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-16 rounded-2xl" />
              <Skeleton className="h-16 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
      <div className="rounded-[30px] border border-[#ead8bc] bg-[#fff8eb] p-6 shadow-soft">
        <Skeleton className="mx-auto h-12 w-12 rounded-full" />
        <Skeleton className="mx-auto mt-4 h-7 w-44" />
        <Skeleton className="mx-auto mt-2 h-4 w-32" />
        <Skeleton className="mt-6 h-40 rounded-[24px]" />
        <Skeleton className="mt-4 h-28 rounded-[24px]" />
        <Skeleton className="mt-4 h-36 rounded-[24px]" />
      </div>
    </div>
  );
}

export const MyCollectionDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const collectionId = Number(id);
  const { goBackOr } = useAppNavigate();
  const { isOffline, refreshStatus } = useNetworkStatus();
  const { showToast } = useFeedback();

  const request = useRequest(
    async (signal) => {
      if (!Number.isFinite(collectionId) || collectionId <= 0) {
        throw new Error('藏品凭证编号无效');
      }

      return userCollectionApi.detail(collectionId, signal);
    },
    {
      deps: [collectionId],
      keepPreviousData: false,
    },
  );

  const handleCopy = useCallback(async (text: string, successMessage = '已复制') => {
    if (!text) {
      showToast({ type: 'warning', message: '暂无可复制内容' });
      return;
    }

    const success = await copyToClipboard(text);
    if (success) {
      showToast({ type: 'success', message: successMessage });
      return;
    }

    showToast({ type: 'error', message: '复制失败，请稍后重试' });
  }, [showToast]);

  const item = request.data;
  const title = getPageTitle(item);
  const fingerprint = item ? getFingerprint(item) : '';
  const statusMeta = item ? getStatusMeta(item) : null;

  const renderContent = () => {
    if (request.loading && !item) {
      return <CertificateSkeleton />;
    }

    if (request.error && !item) {
      return (
        <ErrorState
          icon={<Box size={44} />}
          message={getErrorMessage(request.error)}
          onRetry={() => void request.reload()}
        />
      );
    }

    if (!item) {
      return (
        <ErrorState
          icon={<Box size={44} />}
          message="未找到对应的数字资产持有凭证"
          onRetry={() => void request.reload()}
        />
      );
    }

    return (
      <div className="space-y-4 p-4 pb-8">
        <Card className="overflow-hidden rounded-[28px] border border-[#ead8bc] bg-[linear-gradient(135deg,#fff8ec_0%,#fffef8_42%,#f4ede2_100%)] p-0 shadow-[0_12px_30px_rgba(121,85,38,0.12)]">
          <div className="relative overflow-hidden px-4 py-4">
            <div
              className="pointer-events-none absolute inset-0 opacity-80"
              style={{
                background:
                  'radial-gradient(circle at top right, rgba(255,255,255,0.8), transparent 28%), linear-gradient(135deg, rgba(236,218,188,0.6), transparent 46%)',
              }}
            />
            <div className="relative flex gap-4">
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-[22px] border border-white/70 bg-white shadow-[0_10px_20px_rgba(147,104,43,0.12)]">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={title}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[#b0895b]">
                    <ImageOff size={28} />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-2.5 py-1 text-[11px] tracking-[0.14em] text-[#9b7348]">
                      <Sparkles size={12} />
                      <span>链上凭证</span>
                    </div>
                    <h2 className="mt-3 line-clamp-2 text-[18px] font-semibold leading-7 text-[#3a2a22]">
                      {title}
                    </h2>
                  </div>

                  {statusMeta ? (
                    <div className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold ${statusMeta.className}`}>
                      {statusMeta.label}
                    </div>
                  ) : null}
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-[#8b6c4c]">
                  <span className="rounded-full border border-[#ead8bc] bg-white/80 px-2.5 py-1">
                    场次 {item.session_title || '--'}
                  </span>
                  <span className="rounded-full border border-[#ead8bc] bg-white/80 px-2.5 py-1">
                    编号 {item.asset_code || item.user_collection_id || '--'}
                  </span>
                </div>
              </div>
            </div>

            <div className="relative mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-[22px] border border-white/70 bg-white/85 px-3.5 py-3">
                <div className="text-[11px] tracking-[0.12em] text-[#9d8266]">买入价格</div>
                <div className="mt-1 text-[22px] font-bold text-[#3d2a20]">￥{formatCurrency(item.buy_price)}</div>
              </div>
              <div className="rounded-[22px] border border-white/70 bg-white/85 px-3.5 py-3">
                <div className="text-[11px] tracking-[0.12em] text-[#9d8266]">当前估值</div>
                <div className="mt-1 text-[22px] font-bold text-[#3d2a20]">￥{formatCurrency(item.market_price)}</div>
              </div>
            </div>
          </div>
        </Card>

        <MyCollectionCertificateCard item={item} title={title} onCopy={handleCopy} />

        <Card className="rounded-[28px] border border-[#e9dac6] bg-white/95 shadow-[0_12px_30px_rgba(94,68,31,0.08)]">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-[#f7ebd7] p-2.5 text-[#8b5b2b]">
              <ShieldCheck size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-semibold text-[#3f2d22]">凭证摘要</div>
              <div className="mt-3 space-y-2 text-[13px] leading-6 text-[#6d5545]">
                <div className="flex items-center justify-between gap-4">
                  <span>权益状态</span>
                  <span className="text-right text-[#3f2d22]">{item.rights_status || item.status_text || '--'}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>链上指纹</span>
                  <button
                    type="button"
                    onClick={() => void handleCopy(fingerprint, '链上指纹已复制')}
                    className="inline-flex min-w-0 items-center gap-1 rounded-full border border-[#ead6b8] bg-[#fff9ee] px-2.5 py-1 text-[12px] text-[#8a5c2b]"
                  >
                    <Copy size={12} />
                    <span className="truncate">{formatFingerprintPreview(fingerprint)}</span>
                  </button>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>存证时间</span>
                  <span className="text-right text-[#3f2d22]">{item.create_time_text || '--'}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>确权编号</span>
                  <button
                    type="button"
                    onClick={() => void handleCopy(item.asset_code, '确权编号已复制')}
                    className="inline-flex items-center gap-1 rounded-full border border-[#ead6b8] bg-[#fff9ee] px-2.5 py-1 text-[12px] text-[#8a5c2b]"
                  >
                    <Gem size={12} />
                    <span>{item.asset_code || '--'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-[linear-gradient(180deg,#f8f1e6_0%,#f7f4ed_52%,#f4efe6_100%)]">
      {isOffline && <OfflineBanner onAction={refreshStatus} />}

      <PageHeader
        title="数字资产持有凭证"
        onBack={() => goBackOr('my_collection')}
        className="bg-transparent"
        contentClassName="h-12 px-3 pt-safe backdrop-blur-sm"
        titleClassName="text-[17px] tracking-[0.08em]"
      />

      <PullToRefreshContainer onRefresh={() => request.reload()} disabled={isOffline}>
        <div className="flex-1 overflow-y-auto">
          {renderContent()}
        </div>
      </PullToRefreshContainer>
    </div>
  );
};
