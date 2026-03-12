import { useCallback, useEffect, useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Building2,
  CircleAlert,
  Clock3,
  Copy,
  MapPin,
  PackageCheck,
  RefreshCcw,
  ScanLine,
  Truck,
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import {
  shopOrderApi,
  type ShopOrderLogisticsResponse,
  type ShopOrderLogisticsTimelineItem,
} from '../../api';
import { getErrorMessage } from '../../api/core/errors';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { ErrorState } from '../../components/ui/ErrorState';
import { PullToRefreshContainer } from '../../components/ui/PullToRefreshContainer';
import { Skeleton } from '../../components/ui/Skeleton';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { copyToClipboard } from '../../lib/clipboard';
import { useAppNavigate } from '../../lib/navigation';

type StatusUI = {
  badge: string;
  iconWrap: string;
  latestCard: string;
  latestDot: string;
  line: string;
  note: string;
};

function readText(value: string | undefined, fallback = '--') {
  const nextValue = value?.trim();
  return nextValue ? nextValue : fallback;
}

function maskPhone(value: string | undefined) {
  const nextValue = value?.trim();
  if (!nextValue) {
    return '';
  }

  const digits = nextValue.replace(/\s+/g, '');
  if (digits.length < 7) {
    return digits;
  }

  return `${digits.slice(0, 3)}****${digits.slice(-4)}`;
}

function splitDateTime(value: string | undefined) {
  const nextValue = value?.trim();
  if (!nextValue) {
    return { date: '--', time: '--', full: '--' };
  }

  const normalized = nextValue.replace('T', ' ').replace(/\//g, '-');
  const parts = normalized.split(/\s+/);

  return {
    date: parts[0] || nextValue,
    time: parts[1] || '--',
    full: nextValue,
  };
}

function getLatestTimelineItem(timeline: ShopOrderLogisticsTimelineItem[]) {
  return timeline.find((item) => item.is_latest) ?? timeline[0] ?? null;
}

function getStatusUI(data: ShopOrderLogisticsResponse | null): StatusUI {
  if (!data) {
    return {
      badge: 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-slate-200',
      iconWrap: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200',
      latestCard: 'border-slate-200 bg-slate-50 dark:border-slate-700/60 dark:bg-slate-900/72',
      latestDot: 'bg-slate-400',
      line: 'bg-slate-200 dark:bg-slate-700',
      note: 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700/60 dark:bg-slate-900/72 dark:text-slate-200',
    };
  }

  if (data.status_is_final) {
    return {
      badge: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/12 dark:text-emerald-200',
      iconWrap: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/12 dark:text-emerald-200',
      latestCard: 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/25 dark:bg-emerald-500/10',
      latestDot: 'bg-emerald-500',
      line: 'bg-emerald-200 dark:bg-emerald-500/30',
      note: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-200',
    };
  }

  if (data.query_success) {
    return {
      badge: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/25 dark:bg-sky-500/12 dark:text-sky-200',
      iconWrap: 'bg-sky-50 text-sky-600 dark:bg-sky-500/12 dark:text-sky-200',
      latestCard: 'border-sky-200 bg-sky-50 dark:border-sky-500/25 dark:bg-sky-500/10',
      latestDot: 'bg-sky-500',
      line: 'bg-sky-200 dark:bg-sky-500/30',
      note: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/25 dark:bg-sky-500/10 dark:text-sky-200',
    };
  }

  return {
    badge: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/12 dark:text-amber-200',
    iconWrap: 'bg-amber-50 text-amber-600 dark:bg-amber-500/12 dark:text-amber-200',
    latestCard: 'border-amber-200 bg-amber-50 dark:border-amber-500/25 dark:bg-amber-500/10',
    latestDot: 'bg-amber-500',
    line: 'bg-amber-200 dark:bg-amber-500/30',
    note: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200',
  };
}

function getHeroCopy(data: ShopOrderLogisticsResponse | null, latestItem: ShopOrderLogisticsTimelineItem | null) {
  if (!data) {
    return '物流信息加载中';
  }
  if (latestItem?.content) {
    return latestItem.content;
  }
  if (data.query_message) {
    return data.query_message;
  }
  if (data.status_is_final) {
    return '包裹已完成签收，建议及时核对商品是否完好。';
  }
  if (data.query_success) {
    return '包裹正在运输途中，物流轨迹会持续同步更新。';
  }
  return '物流公司暂未回传完整轨迹，请稍后下拉刷新重试。';
}

function getProgressLabel(data: ShopOrderLogisticsResponse | null) {
  if (!data) {
    return '待更新';
  }
  if (data.status_is_final) {
    return '已签收';
  }
  if (data.query_success) {
    return '运输中';
  }
  return '待回传';
}

function StatusIcon({
  data,
  className = '',
}: {
  data: ShopOrderLogisticsResponse | null;
  className?: string;
}) {
  const mergedClassName = `h-6 w-6 ${className}`.trim();

  if (!data) {
    return <Clock3 className={mergedClassName} />;
  }
  if (data.status_is_final) {
    return <PackageCheck className={mergedClassName} />;
  }
  if (data.query_success) {
    return <Truck className={mergedClassName} />;
  }
  return <CircleAlert className={mergedClassName} />;
}

function LogisticsSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <Card className="border border-border-light/70 bg-white/95 p-5 shadow-[0_18px_36px_-28px_rgba(15,23,42,0.22)] dark:border-white/8 dark:bg-slate-900/80">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="mt-4 h-8 w-40" />
        <Skeleton className="mt-3 h-4 w-5/6" />
        <Skeleton className="mt-5 h-9 w-32 rounded-full" />
      </Card>

      <Card className="border border-border-light/70 bg-white/95 p-4 shadow-[0_18px_36px_-28px_rgba(15,23,42,0.18)] dark:border-white/8 dark:bg-slate-900/80">
        <Skeleton className="h-6 w-24" />
        <div className="mt-4 space-y-3">
          <Skeleton className="h-[78px] rounded-[18px]" />
          <Skeleton className="h-[78px] rounded-[18px]" />
        </div>
      </Card>

      <Card className="border border-border-light/70 bg-white/95 p-4 shadow-[0_18px_36px_-28px_rgba(15,23,42,0.18)] dark:border-white/8 dark:bg-slate-900/80">
        <Skeleton className="h-6 w-24" />
        <div className="mt-4 space-y-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="flex gap-3">
              <Skeleton className="mt-1 h-3.5 w-3.5 rounded-full" />
              <Skeleton className="h-[88px] flex-1 rounded-[18px]" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function SectionTitle({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div>
      <div className="text-lg font-semibold tracking-[-0.02em] text-text-main dark:text-white">{title}</div>
      {description ? <div className="mt-1 text-sm text-text-sub dark:text-slate-300/84">{description}</div> : null}
    </div>
  );
}

function DetailField({
  icon: Icon,
  label,
  value,
  subValue,
  onCopy,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  subValue?: string;
  onCopy?: () => void;
}) {
  return (
    <div className="rounded-[18px] border border-border-light/70 bg-bg-base/72 px-4 py-3.5 dark:border-white/8 dark:bg-white/[0.03]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-text-main shadow-[0_10px_20px_-18px_rgba(15,23,42,0.35)] dark:bg-slate-800 dark:text-slate-100">
            <Icon size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-text-sub dark:text-slate-300">{label}</div>
            <div className="mt-1 break-all text-[15px] font-semibold leading-6 text-text-main dark:text-white">{value}</div>
            {subValue ? <div className="mt-1 text-sm text-text-sub dark:text-slate-300/84">{subValue}</div> : null}
          </div>
        </div>

        {onCopy ? (
          <button
            type="button"
            onClick={onCopy}
            className="inline-flex shrink-0 items-center rounded-full border border-border-light bg-white px-3 py-1.5 text-xs font-medium text-text-sub transition-transform duration-200 active:scale-[0.98] dark:border-white/10 dark:bg-slate-800 dark:text-slate-200"
          >
            <Copy size={12} className="mr-1.5" />
            复制
          </button>
        ) : null}
      </div>
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

  const timeline = data?.timeline ?? [];
  const latestItem = useMemo(() => getLatestTimelineItem(timeline), [timeline]);
  const statusUI = useMemo(() => getStatusUI(data), [data]);
  const progressLabel = getProgressLabel(data);
  const heroCopy = getHeroCopy(data, latestItem);
  const lastUpdate = splitDateTime(data?.last_update_time || latestItem?.time);
  const recipientPhone = maskPhone(data?.recipient_phone);
  const showPageError = !loading && !data && errorMessage !== '';

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-[#f6f4ef] dark:bg-[#0b1220]">
      <PageHeader
        title="物流详情"
        onBack={() => goBackOr('order')}
        className="border-b border-border-light bg-white/95 backdrop-blur-sm dark:border-white/8 dark:bg-slate-950/88"
        titleClassName="tracking-[-0.03em]"
        rightAction={
          <button
            type="button"
            onClick={() => void fetchData({ keepData: true, silent: true })}
            className="inline-flex h-9 items-center justify-center rounded-full border border-border-light bg-white px-3 text-sm font-medium text-text-sub shadow-sm transition-transform duration-200 active:scale-[0.98] dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-200"
          >
            <RefreshCcw size={14} className="mr-1.5" />
            刷新
          </button>
        }
      />

      <PullToRefreshContainer className="flex-1" onRefresh={handleRefresh}>
        <div className="h-full overflow-y-auto pb-8">
          {loading && !data ? <LogisticsSkeleton /> : null}
          {showPageError ? <ErrorState message={errorMessage} onRetry={() => void fetchData()} /> : null}

          {!loading && data ? (
            <div className="space-y-4 p-4">
              <section className="overflow-hidden rounded-[28px] border border-border-light bg-white p-5 shadow-[0_18px_36px_-28px_rgba(15,23,42,0.22)] dark:border-white/8 dark:bg-slate-900/88">
                <div className="flex items-start gap-3">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${statusUI.iconWrap}`}>
                    <StatusIcon data={data} className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${statusUI.badge}`}>
                      {progressLabel}
                    </div>
                    <h2 className="mt-3 text-[24px] font-semibold leading-tight tracking-[-0.03em] text-text-main dark:text-white">
                      {readText(data.status_text, '物流待更新')}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-text-sub dark:text-slate-300/88">{heroCopy}</p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full border border-border-light bg-bg-base px-3 py-1.5 text-xs font-medium text-text-sub dark:border-white/8 dark:bg-white/[0.04] dark:text-slate-200">
                        {readText(data.shipping_company, '待分配物流公司')}
                      </span>
                      {lastUpdate.full !== '--' ? (
                        <span className="rounded-full border border-border-light bg-bg-base px-3 py-1.5 text-xs font-medium text-text-sub dark:border-white/8 dark:bg-white/[0.04] dark:text-slate-200">
                          {lastUpdate.full}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => void handleCopy(data.shipping_no, '运单号')}
                    className="inline-flex items-center rounded-full border border-border-light bg-bg-base px-3 py-2 text-sm font-medium text-text-main transition-transform duration-200 active:scale-[0.98] dark:border-white/8 dark:bg-white/[0.04] dark:text-white"
                  >
                    <Copy size={14} className="mr-1.5" />
                    复制运单号
                  </button>
                </div>
              </section>

              <Card className="border border-border-light/70 bg-white/96 p-4 shadow-[0_18px_36px_-28px_rgba(15,23,42,0.18)] dark:border-white/8 dark:bg-slate-900/80">
                <SectionTitle title="物流信息" />
                <div className="mt-4 grid gap-3">
                  <DetailField
                    icon={ScanLine}
                    label="运单号"
                    value={readText(data.shipping_no)}
                    subValue={data.status_detail_text || undefined}
                    onCopy={() => void handleCopy(data.shipping_no, '运单号')}
                  />
                  <DetailField
                    icon={Building2}
                    label="物流公司"
                    value={readText(data.shipping_company, '待分配物流公司')}
                  />
                </div>
              </Card>

              <Card className="border border-border-light/70 bg-white/96 p-4 shadow-[0_18px_36px_-28px_rgba(15,23,42,0.18)] dark:border-white/8 dark:bg-slate-900/80">
                <SectionTitle title="收货信息" />
                <div className="mt-4 rounded-[20px] border border-border-light/70 bg-bg-base/72 p-4 dark:border-white/8 dark:bg-white/[0.03]">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 dark:bg-rose-500/10 dark:text-rose-300">
                      <MapPin size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-semibold text-text-main dark:text-white">
                          {readText(data.recipient_name, '收货人')}
                        </span>
                        {recipientPhone ? (
                          <span className="rounded-full border border-border-light bg-white px-2.5 py-1 text-xs font-medium text-text-sub dark:border-white/10 dark:bg-slate-800 dark:text-slate-200">
                            {recipientPhone}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-3 text-sm leading-6 text-text-sub dark:text-slate-300/88">
                        {readText(data.recipient_address, '暂无收货地址')}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {!data.query_success ? (
                <Card className={`border p-4 shadow-[0_18px_36px_-28px_rgba(15,23,42,0.18)] ${statusUI.note}`}>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/75 dark:bg-white/10">
                      <CircleAlert size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <SectionTitle title="查询说明" />
                      <p className="mt-2 text-sm leading-6 text-text-sub dark:text-slate-200/88">
                        {readText(data.query_message, '物流信息暂不可用，请稍后刷新重试。')}
                      </p>
                      <button
                        type="button"
                        onClick={() => void fetchData({ keepData: true, silent: true })}
                        className="mt-4 inline-flex items-center rounded-full border border-current/15 bg-white/75 px-4 py-2 text-sm font-medium text-text-main transition-transform duration-200 active:scale-[0.98] dark:bg-white/8 dark:text-white"
                      >
                        <RefreshCcw size={15} className="mr-1.5" />
                        重新查询
                      </button>
                    </div>
                  </div>
                </Card>
              ) : null}

              <Card className="border border-border-light/70 bg-white/96 p-4 shadow-[0_18px_36px_-28px_rgba(15,23,42,0.18)] dark:border-white/8 dark:bg-slate-900/80">
                <SectionTitle
                  title="物流轨迹"
                  description={lastUpdate.full !== '--' ? `最近更新 ${lastUpdate.full}` : '下拉可刷新最新轨迹'}
                />

                <div className="mt-4">
                  {timeline.length === 0 ? (
                    <div className="rounded-[22px] border border-dashed border-border-light px-5 py-12 text-center dark:border-white/8">
                      <Clock3 size={30} className="mx-auto mb-3 text-text-aux dark:text-slate-400" />
                      <p className="text-base font-semibold text-text-main dark:text-white">暂无物流轨迹</p>
                      <p className="mt-2 text-sm leading-6 text-text-sub dark:text-slate-300/84">
                        可能刚发货、物流尚未回传，或该运单号暂时查不到轨迹，请稍后下拉刷新。
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {timeline.map((item, index) => {
                        const timeParts = splitDateTime(item.time);
                        const isLast = index === timeline.length - 1;

                        return (
                          <div key={`${item.time}-${index}`} className="relative flex gap-3">
                            <div className="relative flex w-5 shrink-0 justify-center">
                              <div
                                className={`relative z-[1] mt-1 h-3.5 w-3.5 rounded-full ${
                                  item.is_latest ? statusUI.latestDot : 'bg-slate-300 dark:bg-slate-600'
                                }`}
                              />
                              {!isLast ? (
                                <div
                                  className={`absolute top-5 h-[calc(100%+8px)] w-[2px] rounded-full ${
                                    item.is_latest ? statusUI.line : 'bg-border-light dark:bg-slate-700'
                                  }`}
                                />
                              ) : null}
                            </div>

                            <div
                              className={`min-w-0 flex-1 rounded-[18px] border px-4 py-3.5 ${
                                item.is_latest
                                  ? statusUI.latestCard
                                  : 'border-border-light/70 bg-white dark:border-white/8 dark:bg-white/[0.03]'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <p className="min-w-0 flex-1 text-[15px] leading-7 text-text-main dark:text-white">
                                  {readText(item.content, '暂无物流说明')}
                                </p>
                                {item.is_latest ? (
                                  <span className="shrink-0 rounded-full bg-text-main px-2.5 py-1 text-[10px] font-semibold text-white dark:bg-white dark:text-slate-900">
                                    最新
                                  </span>
                                ) : null}
                              </div>

                              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-text-sub dark:text-slate-300">
                                <span className="rounded-full bg-bg-base px-2.5 py-1 font-medium dark:bg-slate-800 dark:text-slate-200">
                                  {timeParts.date}
                                </span>
                                {timeParts.time !== '--' ? <span>{timeParts.time}</span> : null}
                                {item.zone ? (
                                  <span className="rounded-full border border-border-light bg-white px-2.5 py-1 font-medium dark:border-white/8 dark:bg-slate-800 dark:text-slate-200">
                                    {item.zone}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          ) : null}
        </div>
      </PullToRefreshContainer>
    </div>
  );
};
