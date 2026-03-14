import { useCallback, useEffect, useState } from 'react';
import {
  ChevronLeft,
  Copy,
  HeadphonesIcon,
  MapPin,
  Package,
  RefreshCcw,
  CheckCircle2,
  Truck,
  WifiOff,
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import {
  shopOrderApi,
  type ShopOrderLogisticsResponse,
  type ShopOrderLogisticsTimelineItem,
} from '../../api';
import { getErrorMessage } from '../../api/core/errors';
import { PullToRefreshContainer } from '../../components/ui/PullToRefreshContainer';
import { Skeleton } from '../../components/ui/Skeleton';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { copyToClipboard } from '../../lib/clipboard';
import { openCustomerServiceLink } from '../../lib/customerService';
import { useAppNavigate } from '../../lib/navigation';

function maskPhone(value: string | undefined) {
  const nextValue = value?.trim();
  if (!nextValue) return '--';
  const digits = nextValue.replace(/\D/g, '');
  if (digits.length < 7) return digits;
  return `${digits.slice(0, 3)}****${digits.slice(-4)}`;
}

function readText(value: string | undefined, fallback = '--') {
  const nextValue = value?.trim();
  return nextValue || fallback;
}

export const LogisticsPage = () => {
  const { id } = useParams<{ id: string }>();
  const orderId = Number.parseInt(id || '0', 10);
  const { goBackOr } = useAppNavigate();
  const { showToast } = useFeedback();
  const { isOffline, refreshStatus } = useNetworkStatus();

  const [loading, setLoading] = useState(true);
  const [moduleError, setModuleError] = useState(false);
  const [data, setData] = useState<ShopOrderLogisticsResponse | null>(null);

  const isEmpty = !loading && !moduleError && (!data || (data.timeline?.length ?? 0) === 0);

  const fetchData = useCallback(
    async (options?: { keepData?: boolean }) => {
      const keepData = options?.keepData ?? false;

      if (orderId <= 0) {
        setModuleError(true);
        setLoading(false);
        return;
      }

      if (!keepData) setLoading(true);

      try {
        const next = await shopOrderApi.logistics({ id: orderId });
        setData(next);
        setModuleError(false);
      } catch (error) {
        setModuleError(true);
        if (!keepData) setData(null);
        showToast({ message: getErrorMessage(error) || '物流详情加载失败', type: 'error' });
      } finally {
        setLoading(false);
      }
    },
    [orderId, showToast],
  );

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleBack = () => goBackOr('order');

  const handleCopy = useCallback(
    async (text: string) => {
      const ok = await copyToClipboard(text);
      showToast({
        message: ok ? '运单号已复制' : '复制失败',
        type: ok ? 'success' : 'error',
      });
    },
    [showToast],
  );

  const handleRefresh = useCallback(() => {
    refreshStatus();
    void fetchData({ keepData: true });
  }, [fetchData, refreshStatus]);

  const handleRetry = useCallback(() => {
    setModuleError(false);
    setLoading(true);
    void fetchData();
  }, [fetchData]);

  const handleCustomerService = useCallback(() => {
    void openCustomerServiceLink(showToast);
  }, [showToast]);

  const statusText = data?.status_is_final ? '已签收' : data?.query_success ? '运输中' : readText(data?.status_text, '待更新');
  const timeline = data?.timeline ?? [];

  const renderHeader = () => (
    <div className="relative z-40 shrink-0 border-b border-border-light bg-white dark:bg-gray-900">
      {isOffline && (
        <div className="flex items-center justify-between bg-red-50 px-4 py-2 text-[12px] text-primary-start dark:bg-red-500/15 dark:text-red-300">
          <div className="flex items-center">
            <WifiOff size={14} className="mr-2" />
            <span>网络不稳定，请检查网络设置</span>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            className="rounded bg-white px-2 py-1 font-medium shadow-sm active:opacity-80 dark:bg-gray-900"
          >
            刷新
          </button>
        </div>
      )}
      <div className="flex h-12 items-center justify-between px-3 pt-safe">
        <div className="flex w-1/3 items-center">
          <button
            type="button"
            onClick={handleBack}
            className="-ml-1 p-1 text-text-main active:opacity-70"
          >
            <ChevronLeft size={24} />
          </button>
        </div>
        <h1 className="w-1/3 text-center text-[16px] font-bold text-text-main">物流详情</h1>
        <div className="w-1/3" />
      </div>
    </div>
  );

  const renderSkeleton = () => (
    <div className="p-3">
      <div className="mb-3 rounded-[16px] bg-white p-4 shadow-sm dark:bg-gray-900">
        <div className="mb-3 flex items-center">
          <Skeleton className="mr-3 h-10 w-10 rounded-full" />
          <div>
            <Skeleton className="mb-1 h-5 w-20" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>
      <div className="mb-3 flex items-center rounded-[16px] bg-white p-4 shadow-sm dark:bg-gray-900">
        <Skeleton className="mr-3 h-6 w-6 shrink-0 rounded-full" />
        <div className="flex-1">
          <Skeleton className="mb-1 h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <div className="mb-3 rounded-[16px] bg-white p-4 shadow-sm dark:bg-gray-900">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="mb-6 flex last:mb-0">
            <div className="mr-3 flex w-6 flex-col items-center">
              <Skeleton className="mb-2 h-3 w-3 rounded-full" />
              <Skeleton className="h-12 w-0.5" />
            </div>
            <div className="flex-1">
              <Skeleton className="mb-1 h-4 w-full" />
              <Skeleton className="mb-2 h-4 w-2/3" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    if (moduleError) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center p-4">
          <RefreshCcw size={32} className="mb-3 text-text-aux" />
          <p className="mb-4 text-[14px] text-text-sub">加载失败，请检查网络</p>
          <button
            type="button"
            onClick={handleRetry}
            className="rounded-full border border-border-light bg-white px-6 py-2 text-[13px] text-text-main shadow-sm active:bg-bg-base dark:bg-gray-900"
          >
            重试
          </button>
        </div>
      );
    }

    if (isEmpty) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center p-4">
          <Package size={48} className="mb-4 text-border-light" />
          <p className="mb-1 text-[15px] font-medium text-text-main">暂无物流信息</p>
          <p className="text-[13px] text-text-sub">商家正快马加鞭为您准备商品，请耐心等待</p>
        </div>
      );
    }

    if (loading && !data) {
      return renderSkeleton();
    }

    return (
      <div className="p-3 pb-24">
        {/* Top Info Card */}
        <div className="mb-3 flex items-center rounded-[16px] bg-white p-4 shadow-sm dark:bg-gray-900">
          <div className="mr-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-start/10">
            {data?.status_is_final ? (
              <CheckCircle2 size={20} className="text-primary-start" />
            ) : (
              <Truck size={20} className="text-primary-start" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center">
              <span className="mr-2 text-[16px] font-bold text-text-main">{statusText}</span>
              <span className="text-[13px] text-text-sub">
                {readText(data?.shipping_company, '树交所物流')}
              </span>
            </div>
            <div className="flex items-center text-[12px] text-text-sub">
              <span className="mr-2">运单号：{readText(data?.shipping_no)}</span>
              <button
                type="button"
                onClick={() => void handleCopy(data?.shipping_no ?? '')}
                className="flex items-center text-text-main active:opacity-70"
              >
                <Copy size={12} className="mr-1" />
                复制
              </button>
            </div>
          </div>
        </div>

        {/* Address Card */}
        <div className="mb-3 flex items-start rounded-[16px] bg-white p-4 shadow-sm dark:bg-gray-900">
          <MapPin size={16} className="mr-2 mt-0.5 shrink-0 text-text-main" />
          <div className="min-w-0 flex-1">
            <div className="mb-1 text-[13px] leading-snug text-text-main">
              [收货地址] {readText(data?.recipient_address)}
            </div>
            <div className="text-[12px] text-text-sub">
              {readText(data?.recipient_name)} {maskPhone(data?.recipient_phone)}
            </div>
          </div>
        </div>

        {/* Timeline Card */}
        <div className="rounded-[16px] bg-white p-4 shadow-sm dark:bg-gray-900">
          {timeline.map((item: ShopOrderLogisticsTimelineItem, index: number) => {
            const isLast = index === timeline.length - 1;
            const isLatest = item.is_latest ?? false;

            return (
              <div key={`${item.time}-${index}`} className="flex">
                <div className="relative flex w-8 shrink-0 flex-col items-center">
                  <div
                    className={`z-10 mt-1 h-3 w-3 rounded-full ${
                      isLatest
                        ? 'bg-primary-start shadow-[0_0_0_4px_rgba(255,77,77,0.15)]'
                        : 'bg-border-light'
                    }`}
                  />
                  {!isLast && (
                    <div className="absolute left-1/2 top-4 h-[calc(100%+16px)] w-[1px] -translate-x-1/2 bg-border-light" />
                  )}
                </div>
                <div className={`flex-1 pb-6 ${isLatest ? '' : 'opacity-70'}`}>
                  <div
                    className={`mb-1 text-[14px] leading-snug ${
                      isLatest ? 'font-medium text-text-main' : 'text-text-sub'
                    }`}
                  >
                    {readText(item.content)}
                  </div>
                  <div className={`text-[12px] ${isLatest ? 'text-text-main' : 'text-text-aux'}`}>
                    {readText(item.time)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="relative flex h-full flex-1 flex-col overflow-hidden bg-bg-base">
      {renderHeader()}

      <PullToRefreshContainer
        className="relative flex-1 overflow-y-auto no-scrollbar"
        onRefresh={() => void fetchData({ keepData: true })}
        disabled={isOffline}
      >
        {renderContent()}
      </PullToRefreshContainer>

      {!moduleError && !loading && !isEmpty && (
        <div className="absolute bottom-0 left-0 right-0 z-40 border-t border-border-light bg-white px-4 py-2 pb-safe dark:bg-gray-900">
          <button
            type="button"
            className="flex w-full items-center justify-center rounded-full border border-border-light text-[14px] font-medium text-text-main active:bg-bg-base"
            onClick={handleCustomerService}
          >
            <HeadphonesIcon size={16} className="mr-1.5 text-text-sub" />
            联系客服
          </button>
        </div>
      )}
    </div>
  );
};
