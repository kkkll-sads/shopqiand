import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  CircleAlert,
  Clock4,
  Copy,
  MapPin,
  PackageCheck,
  RefreshCcw,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import { shopOrderApi, type ShopOrderLogisticsResponse } from '../../api';
import { getErrorMessage } from '../../api/core/errors';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ErrorState } from '../../components/ui/ErrorState';
import { PullToRefreshContainer } from '../../components/ui/PullToRefreshContainer';
import { Skeleton } from '../../components/ui/Skeleton';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { copyToClipboard } from '../../lib/clipboard';
import { useAppNavigate } from '../../lib/navigation';

function getStatusStyle(data: ShopOrderLogisticsResponse | null) {
  if (!data) {
    return {
      accent: 'text-slate-600',
      chip: 'bg-slate-100 text-slate-700',
      panel: 'from-slate-50 via-white to-slate-100',
      border: 'border-slate-200/80',
    };
  }

  if (data.status_is_final) {
    return {
      accent: 'text-emerald-600',
      chip: 'bg-emerald-100 text-emerald-700',
      panel: 'from-emerald-50 via-white to-emerald-100',
      border: 'border-emerald-200/80',
    };
  }

  if (data.query_success) {
    return {
      accent: 'text-sky-600',
      chip: 'bg-sky-100 text-sky-700',
      panel: 'from-sky-50 via-white to-cyan-100',
      border: 'border-sky-200/80',
    };
  }

  return {
    accent: 'text-amber-600',
    chip: 'bg-amber-100 text-amber-700',
    panel: 'from-amber-50 via-white to-orange-100',
    border: 'border-amber-200/80',
  };
}

function StatusIcon({ data }: { data: ShopOrderLogisticsResponse | null }) {
  const className = `h-6 w-6 ${getStatusStyle(data).accent}`;

  if (!data) {
    return <Clock4 className={className} />;
  }
  if (data.status_is_final) {
    return <PackageCheck className={className} />;
  }
  if (data.query_success) {
    return <Truck className={className} />;
  }
  return <CircleAlert className={className} />;
}

function LogisticsSkeleton() {
  return (
    <div className="space-y-3 p-4">
      <Card className="overflow-hidden border border-border-light bg-white p-0">
        <div className="bg-gradient-to-br from-slate-50 via-white to-slate-100 p-5">
          <Skeleton className="mb-3 h-6 w-32" />
          <Skeleton className="mb-2 h-4 w-5/6" />
          <div className="flex gap-2">
            <Skeleton className="h-7 w-20 rounded-full" />
            <Skeleton className="h-7 w-28 rounded-full" />
          </div>
        </div>
      </Card>

      <Card className="border border-border-light bg-white">
        <Skeleton className="mb-3 h-5 w-24" />
        <Skeleton className="mb-2 h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </Card>

      <Card className="border border-border-light bg-white">
        <Skeleton className="mb-4 h-5 w-24" />
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="mb-5 flex last:mb-0">
            <div className="mr-3 flex w-5 flex-col items-center">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="mt-2 h-14 w-[2px]" />
            </div>
            <div className="flex-1">
              <Skeleton className="mb-2 h-4 w-full" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

export const LogisticsPage = () => {
  const { id } = useParams<{ id: string }>();
  const orderId = Number.parseInt(id || '0', 10);
  const { goBackOr } = useAppNavigate();
  const { showToast } = useFeedback();

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [data, setData] = useState<ShopOrderLogisticsResponse | null>(null);

  const fetchData = useCallback(
    async (options?: { keepData?: boolean; silent?: boolean }) => {
      const keepData = options?.keepData ?? false;
      const silent = options?.silent ?? false;

      if (orderId <= 0) {
        setErrorMessage('订单参数错误');
        setLoading(false);
        return;
      }

      if (!keepData) {
        setLoading(true);
      }

      try {
        const next = await shopOrderApi.logistics({ id: orderId });
        setData(next);
        setErrorMessage('');
      } catch (error) {
        const message = getErrorMessage(error) || '物流详情加载失败';
        setErrorMessage(message);
        if (!keepData) {
          setData(null);
        }
        if (silent) {
          showToast({ message, type: 'error' });
        }
      } finally {
        setLoading(false);
      }
    },
    [orderId, showToast],
  );

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleRefresh = useCallback(async () => {
    await fetchData({ keepData: true, silent: true });
  }, [fetchData]);

  const handleCopy = useCallback(
    async (text: string, label: string) => {
      if (!text) {
        return;
      }
      const ok = await copyToClipboard(text);
      showToast({
        message: ok ? `${label}已复制` : '复制失败，请稍后重试',
        type: ok ? 'success' : 'error',
      });
    },
    [showToast],
  );

  const styles = getStatusStyle(data);
  const showPageError = !loading && !data && errorMessage !== '';
  const timeline = data?.timeline ?? [];

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-bg-base">
      <PageHeader
        title="物流详情"
        onBack={() => goBackOr('order')}
        rightAction={
          <button
            type="button"
            onClick={() => void fetchData({ keepData: true, silent: true })}
            className="inline-flex h-9 items-center justify-center rounded-full border border-border-light bg-bg-card px-3 text-sm text-text-sub transition active:scale-[0.98]"
          >
            <RefreshCcw size={14} className="mr-1.5" />
            刷新
          </button>
        }
      />

      <PullToRefreshContainer className="flex-1" onRefresh={handleRefresh}>
        <div className="h-full overflow-y-auto px-0 pb-8">
          {loading && !data ? <LogisticsSkeleton /> : null}

          {showPageError ? <ErrorState message={errorMessage} onRetry={() => void fetchData()} /> : null}

          {!loading && data ? (
            <div className="space-y-3 p-4">
              <Card className={`overflow-hidden border bg-white p-0 shadow-soft ${styles.border}`}>
                <div className={`relative bg-gradient-to-br ${styles.panel} p-5`}>
                  <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/60 blur-2xl" />
                  <div className="relative z-[1]">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="mb-1 flex items-center gap-2">
                          <StatusIcon data={data} />
                          <h2 className="text-2xl font-bold text-text-main">{data.status_text || '待查询'}</h2>
                        </div>
                        <p className="text-sm leading-6 text-text-sub">
                          {data.query_message || '物流信息已更新'}
                        </p>
                      </div>
                      <div className={`rounded-full px-3 py-1 text-xs font-semibold ${styles.chip}`}>
                        {data.status_detail_text || '物流追踪'}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void handleCopy(data.shipping_no, '物流单号')}
                        className="inline-flex items-center rounded-full border border-white/70 bg-white/80 px-3 py-1.5 text-sm text-text-main shadow-sm transition active:scale-[0.98]"
                      >
                        <Copy size={14} className="mr-1.5" />
                        {data.shipping_no}
                      </button>
                      <div className="rounded-full border border-white/70 bg-white/70 px-3 py-1.5 text-sm text-text-sub">
                        {data.shipping_company}
                        {data.shipping_company_code ? ` · ${data.shipping_company_code}` : ''}
                      </div>
                      {data.status_is_final ? (
                        <div className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm text-emerald-700">
                          <ShieldCheck size={14} className="mr-1.5" />
                          轨迹已稳定
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="border border-border-light bg-white">
                <div className="mb-3 flex items-center gap-2">
                  <MapPin size={16} className="text-text-sub" />
                  <span className="text-sm font-semibold text-text-main">收货地址</span>
                </div>
                <div className="space-y-2">
                  <div className="text-base font-semibold text-text-main">
                    {data.recipient_name || '收货人'}
                    {data.recipient_phone ? (
                      <span className="ml-2 text-sm font-normal text-text-sub">{data.recipient_phone}</span>
                    ) : null}
                  </div>
                  <div className="text-sm leading-6 text-text-sub">{data.recipient_address || '暂无收货地址'}</div>
                </div>
              </Card>

              {!data.query_success || data.requires_phone_suffix ? (
                <Card className="border border-border-light bg-white">
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <CircleAlert size={18} className="mt-0.5 shrink-0 text-amber-500" />
                      <div>
                        <p className="text-sm font-semibold text-text-main">查询说明</p>
                        <p className="mt-1 text-sm leading-6 text-text-sub">
                          {data.query_message || '物流信息暂不可用，请稍后刷新重试。'}
                        </p>
                      </div>
                    </div>

                    {data.requires_phone_suffix ? (
                      <div className="rounded-2xl bg-bg-base px-3 py-3 text-sm leading-6 text-text-sub">
                        当前物流公司查询需要手机号后四位，系统已自动携带：
                        <span className="ml-1 font-semibold text-text-main">
                          {data.receiver_phone_suffix || '--'}
                        </span>
                      </div>
                    ) : null}

                    {!data.query_success ? (
                      <Button
                        variant="outline"
                        size="md"
                        fullWidth={false}
                        className="px-5"
                        leftIcon={<RefreshCcw size={16} />}
                        onClick={() => void fetchData({ keepData: true, silent: true })}
                      >
                        重新查询
                      </Button>
                    ) : null}
                  </div>
                </Card>
              ) : null}

              <Card className="border border-border-light bg-white">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-text-main">物流轨迹</h3>
                    <p className="mt-1 text-sm text-text-sub">
                      {data.last_update_time ? `最近更新：${data.last_update_time}` : '下拉可刷新最新轨迹'}
                    </p>
                  </div>
                  <div className="rounded-full bg-bg-base px-3 py-1 text-xs font-medium text-text-sub">
                    {timeline.length} 条
                  </div>
                </div>

                {timeline.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-border-light bg-bg-base px-5 py-12 text-center">
                    <Clock4 size={28} className="mx-auto mb-3 text-text-aux" />
                    <p className="text-base font-medium text-text-main">暂无物流轨迹</p>
                    <p className="mt-2 text-sm leading-6 text-text-sub">
                      可能刚发货、物流未回传，或该单号暂时查不到轨迹。
                    </p>
                  </div>
                ) : (
                  <div className="space-y-0">
                    {timeline.map((item, index) => {
                      const isLast = index === timeline.length - 1;
                      return (
                        <div key={`${item.time}-${index}`} className="relative flex gap-3 pb-6 last:pb-0">
                          <div className="relative flex w-5 shrink-0 justify-center">
                            <div
                              className={`relative z-[1] mt-1 h-3 w-3 rounded-full ${
                                item.is_latest ? 'bg-primary-start shadow-[0_0_0_4px_rgba(239,68,68,0.12)]' : 'bg-border-main/50'
                              }`}
                            />
                            {!isLast ? (
                              <div className="absolute top-4 h-[calc(100%-8px)] w-[2px] rounded-full bg-border-light" />
                            ) : null}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className={`text-sm leading-6 ${item.is_latest ? 'font-semibold text-text-main' : 'text-text-sub'}`}>
                              {item.content || '暂无物流说明'}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-aux">
                              <span>{item.time || '--'}</span>
                              {item.zone ? <span>{item.zone}</span> : null}
                              {item.is_latest ? <span className="text-primary-start">最新节点</span> : null}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>
          ) : null}
        </div>
      </PullToRefreshContainer>
    </div>
  );
};
