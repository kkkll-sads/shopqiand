import { useCallback, useEffect, useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Building2,
  CircleAlert,
  Clock3,
  Copy,
  Hash,
  MapPin,
  PackageCheck,
  RefreshCcw,
  ScanLine,
  ShieldCheck,
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

type LogisticsTone = {
  hero: string;
  chip: string;
  iconWrap: string;
  accent: string;
  statsCard: string;
  fieldCard: string;
  latestCard: string;
  latestDot: string;
  line: string;
  note: string;
  outline: string;
};

function readText(value: string | undefined, fallback = '--') {
  const nextValue = value?.trim();
  return nextValue ? nextValue : fallback;
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

function getStatusTone(data: ShopOrderLogisticsResponse | null): LogisticsTone {
  if (!data) {
    return {
      hero: 'from-slate-900 via-slate-800 to-slate-700',
      chip: 'border-white/18 bg-white/12 text-white/90',
      iconWrap: 'bg-white/12 text-white shadow-[0_10px_30px_-16px_rgba(15,23,42,0.7)]',
      accent: 'text-slate-600 dark:text-slate-300',
      statsCard: 'border-white/16 bg-white/12 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]',
      fieldCard: 'border-slate-200/70 bg-white/88 dark:border-slate-700/60 dark:bg-slate-900/76',
      latestCard: 'border-slate-200/80 bg-slate-50/90 dark:border-slate-700/60 dark:bg-slate-900/82',
      latestDot: 'bg-slate-500 shadow-[0_0_0_6px_rgba(148,163,184,0.18)]',
      line: 'bg-gradient-to-b from-slate-300 via-slate-200 to-slate-100 dark:from-slate-600 dark:via-slate-700 dark:to-slate-800',
      note: 'border-slate-200/80 bg-slate-50/90 text-slate-700 dark:border-slate-700/60 dark:bg-slate-900/80 dark:text-slate-200',
      outline: 'border-slate-200/80 dark:border-slate-700/60',
    };
  }

  if (data.status_is_final) {
    return {
      hero: 'from-[#0f766e] via-[#059669] to-[#22c55e]',
      chip: 'border-white/18 bg-white/12 text-white',
      iconWrap: 'bg-white/14 text-white shadow-[0_18px_40px_-20px_rgba(5,150,105,0.8)]',
      accent: 'text-emerald-600 dark:text-emerald-300',
      statsCard: 'border-white/18 bg-white/12 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]',
      fieldCard: 'border-emerald-100/80 bg-white/90 dark:border-emerald-500/20 dark:bg-slate-900/76',
      latestCard: 'border-emerald-200/80 bg-emerald-50/90 dark:border-emerald-500/20 dark:bg-emerald-500/10',
      latestDot: 'bg-emerald-500 shadow-[0_0_0_6px_rgba(16,185,129,0.18)]',
      line: 'bg-gradient-to-b from-emerald-300 via-emerald-200 to-emerald-100 dark:from-emerald-500/50 dark:via-emerald-500/25 dark:to-slate-800',
      note: 'border-emerald-200/80 bg-emerald-50/90 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200',
      outline: 'border-emerald-200/80 dark:border-emerald-500/20',
    };
  }

  if (data.query_success) {
    return {
      hero: 'from-[#0f172a] via-[#1d4ed8] to-[#0ea5e9]',
      chip: 'border-white/18 bg-white/12 text-white',
      iconWrap: 'bg-white/14 text-white shadow-[0_18px_40px_-20px_rgba(14,165,233,0.8)]',
      accent: 'text-sky-600 dark:text-sky-300',
      statsCard: 'border-white/18 bg-white/12 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]',
      fieldCard: 'border-sky-100/80 bg-white/90 dark:border-sky-500/20 dark:bg-slate-900/76',
      latestCard: 'border-sky-200/80 bg-sky-50/90 dark:border-sky-500/20 dark:bg-sky-500/10',
      latestDot: 'bg-sky-500 shadow-[0_0_0_6px_rgba(14,165,233,0.18)]',
      line: 'bg-gradient-to-b from-sky-300 via-sky-200 to-sky-100 dark:from-sky-500/50 dark:via-sky-500/25 dark:to-slate-800',
      note: 'border-sky-200/80 bg-sky-50/90 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-200',
      outline: 'border-sky-200/80 dark:border-sky-500/20',
    };
  }

  return {
    hero: 'from-[#7c2d12] via-[#b45309] to-[#f59e0b]',
    chip: 'border-white/18 bg-white/12 text-white',
    iconWrap: 'bg-white/14 text-white shadow-[0_18px_40px_-20px_rgba(245,158,11,0.78)]',
    accent: 'text-amber-600 dark:text-amber-300',
    statsCard: 'border-white/18 bg-white/12 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]',
    fieldCard: 'border-amber-100/80 bg-white/90 dark:border-amber-500/20 dark:bg-slate-900/76',
    latestCard: 'border-amber-200/80 bg-amber-50/90 dark:border-amber-500/20 dark:bg-amber-500/10',
    latestDot: 'bg-amber-500 shadow-[0_0_0_6px_rgba(245,158,11,0.18)]',
    line: 'bg-gradient-to-b from-amber-300 via-amber-200 to-amber-100 dark:from-amber-500/50 dark:via-amber-500/25 dark:to-slate-800',
    note: 'border-amber-200/80 bg-amber-50/90 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200',
    outline: 'border-amber-200/80 dark:border-amber-500/20',
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
    return '包裹已完成签收，建议及时核对商品完整性。';
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
      <div className="overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-5">
        <Skeleton className="h-6 w-24 bg-white/15" />
        <Skeleton className="mt-4 h-8 w-40 bg-white/20" />
        <Skeleton className="mt-3 h-4 w-5/6 bg-white/15" />
        <div className="mt-5 grid grid-cols-3 gap-2">
          {[1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-20 rounded-[22px] bg-white/12" />
          ))}
        </div>
      </div>

      <Card className="overflow-hidden border border-border-light/70 bg-white/90 p-0 dark:bg-slate-900/80">
        <div className="border-b border-border-light/70 px-4 py-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-2 h-6 w-36" />
        </div>
        <div className="space-y-3 p-4">
          {[1, 2, 3, 4].map((item) => (
            <Skeleton key={item} className="h-[76px] rounded-[22px]" />
          ))}
        </div>
      </Card>

      <Card className="overflow-hidden border border-border-light/70 bg-white/90 p-0 dark:bg-slate-900/80">
        <div className="border-b border-border-light/70 px-4 py-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="mt-2 h-6 w-32" />
        </div>
        <div className="space-y-4 p-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="flex gap-3">
              <div className="flex w-5 justify-center">
                <Skeleton className="mt-1 h-3.5 w-3.5 rounded-full" />
              </div>
              <Skeleton className="h-24 flex-1 rounded-[22px]" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function MetricCard({
  label,
  value,
  subValue,
  className,
}: {
  label: string;
  value: string;
  subValue?: string;
  className: string;
}) {
  return (
    <div className={`rounded-[22px] border px-3 py-3.5 backdrop-blur ${className}`}>
      <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/62">{label}</div>
      <div className="mt-2 text-base font-semibold leading-tight text-white">{value}</div>
      {subValue ? <div className="mt-1 text-xs text-white/68">{subValue}</div> : null}
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
    <div className="rounded-[22px] border border-border-light/70 bg-bg-base/70 px-4 py-3.5 dark:border-white/8 dark:bg-white/[0.03]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-text-main shadow-[0_8px_20px_-16px_rgba(15,23,42,0.35)] dark:bg-slate-800 dark:text-slate-100">
            <Icon size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium uppercase tracking-[0.18em] text-text-aux">{label}</div>
            <div className="mt-1 break-all text-[15px] font-semibold leading-6 text-text-main">{value}</div>
            {subValue ? <div className="mt-1 text-sm text-text-sub">{subValue}</div> : null}
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
  const tone = useMemo(() => getStatusTone(data), [data]);
  const progressLabel = getProgressLabel(data);
  const heroCopy = getHeroCopy(data, latestItem);
  const lastUpdate = splitDateTime(data?.last_update_time || latestItem?.time);
  const latestUpdate = splitDateTime(latestItem?.time || data?.last_update_time);
  const providerLabel = readText(data?.provider, '平台物流通道');
  const companyCodeLabel = readText(data?.shipping_company_code, '未提供').toUpperCase();
  const showPageError = !loading && !data && errorMessage !== '';

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-[linear-gradient(180deg,_#eef6ff_0%,_#f8fafc_32%,_#fffaf5_100%)] dark:bg-[linear-gradient(180deg,_#020617_0%,_#0f172a_42%,_#111827_100%)]">
      <PageHeader
        title="物流详情"
        onBack={() => goBackOr('order')}
        className="border-b border-white/60 bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/70 dark:border-white/8 dark:bg-slate-950/76"
        titleClassName="tracking-[-0.03em]"
        rightAction={
          <button
            type="button"
            onClick={() => void fetchData({ keepData: true, silent: true })}
            className="inline-flex h-9 items-center justify-center rounded-full border border-border-light/70 bg-white/90 px-3 text-sm font-medium text-text-sub shadow-sm transition-transform duration-200 active:scale-[0.98] dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-200"
          >
            <RefreshCcw size={14} className="mr-1.5" />
            刷新
          </button>
        }
      />

      <PullToRefreshContainer className="flex-1" onRefresh={handleRefresh}>
        <div className="h-full overflow-y-auto pb-10">
          {loading && !data ? <LogisticsSkeleton /> : null}
          {showPageError ? <ErrorState message={errorMessage} onRetry={() => void fetchData()} /> : null}

          {!loading && data ? (
            <div className="space-y-4 p-4">
              <section
                className={`relative overflow-hidden rounded-[30px] bg-gradient-to-br ${tone.hero} p-5 text-white shadow-[0_28px_64px_-32px_rgba(15,23,42,0.6)]`}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_34%)]" />
                <div className="absolute -right-16 top-0 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -left-12 bottom-0 h-28 w-28 rounded-full bg-black/10 blur-2xl" />

                <div className="relative z-[1]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${tone.chip}`}>
                        <StatusIcon data={data} className="mr-1.5 h-4 w-4 text-white" />
                        {progressLabel}
                      </div>
                      <h2 className="mt-3 text-[30px] font-semibold leading-tight tracking-[-0.04em]">
                        {readText(data.status_text, '物流待更新')}
                      </h2>
                      <p className="mt-2 max-w-[28rem] text-sm leading-6 text-white/78">{heroCopy}</p>
                    </div>

                    <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[22px] ${tone.iconWrap}`}>
                      <StatusIcon data={data} className="h-7 w-7 text-white" />
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-2">
                    <MetricCard
                      label="最近更新"
                      value={lastUpdate.time !== '--' ? lastUpdate.time : lastUpdate.date}
                      subValue={lastUpdate.time !== '--' ? lastUpdate.date : undefined}
                      className={tone.statsCard}
                    />
                    <MetricCard
                      label="物流节点"
                      value={`${timeline.length}`}
                      subValue={timeline.length > 0 ? '持续同步' : '等待回传'}
                      className={tone.statsCard}
                    />
                    <MetricCard
                      label="物流来源"
                      value={providerLabel}
                      subValue={companyCodeLabel}
                      className={tone.statsCard}
                    />
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void handleCopy(data.shipping_no, '运单号')}
                      className="inline-flex items-center rounded-full border border-white/16 bg-white/12 px-3 py-2 text-sm font-medium text-white transition-transform duration-200 active:scale-[0.98]"
                    >
                      <Copy size={14} className="mr-1.5" />
                      复制运单号
                    </button>
                    <div className="rounded-full border border-white/16 bg-white/10 px-3 py-2 text-sm text-white/82">
                      {readText(data.shipping_company, '待分配物流公司')}
                    </div>
                    {data.status_is_final ? (
                      <div className="inline-flex items-center rounded-full border border-white/16 bg-white/10 px-3 py-2 text-sm text-white/86">
                        <ShieldCheck size={14} className="mr-1.5" />
                        已完成签收
                      </div>
                    ) : null}
                  </div>
                </div>
              </section>

              <Card
                className={`overflow-hidden border p-0 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.22)] ${tone.fieldCard}`}
              >
                <div className="border-b border-border-light/70 px-4 py-4 dark:border-white/8">
                  <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-text-aux">Parcel</div>
                  <div className="mt-1 text-lg font-semibold tracking-[-0.02em] text-text-main">包裹信息</div>
                </div>

                <div className="grid gap-3 p-4">
                  <DetailField
                    icon={ScanLine}
                    label="运单号"
                    value={readText(data.shipping_no)}
                    subValue={data.status_detail_text || '物流单号已同步'}
                    onCopy={() => void handleCopy(data.shipping_no, '运单号')}
                  />
                  <DetailField
                    icon={Building2}
                    label="物流公司"
                    value={readText(data.shipping_company, '待分配物流公司')}
                    subValue={data.shipping_company_code ? `快递编码 ${companyCodeLabel}` : undefined}
                  />
                  <DetailField
                    icon={Hash}
                    label="订单编号"
                    value={readText(data.order_no)}
                    subValue={`订单 ID ${data.order_id}`}
                    onCopy={() => void handleCopy(data.order_no, '订单编号')}
                  />
                  <DetailField
                    icon={Truck}
                    label="查询来源"
                    value={providerLabel}
                    subValue={data.query_success ? '轨迹同步正常' : '等待物流回传'}
                  />
                </div>
              </Card>

              <Card
                className={`overflow-hidden border p-0 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.2)] ${tone.fieldCard}`}
              >
                <div className="border-b border-border-light/70 px-4 py-4 dark:border-white/8">
                  <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-text-aux">Address</div>
                  <div className="mt-1 text-lg font-semibold tracking-[-0.02em] text-text-main">收货信息</div>
                </div>

                <div className="p-4">
                  <div className="rounded-[24px] border border-border-light/70 bg-bg-base/72 p-4 dark:border-white/8 dark:bg-white/[0.03]">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] bg-rose-50 text-rose-500 shadow-[0_12px_24px_-16px_rgba(244,63,94,0.5)] dark:bg-rose-500/10 dark:text-rose-300">
                        <MapPin size={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
                          <span className="text-base font-semibold text-text-main">
                            {readText(data.recipient_name, '收货人')}
                          </span>
                          {data.recipient_phone ? (
                            <span className="rounded-full border border-border-light bg-white px-2.5 py-1 text-xs font-medium text-text-sub dark:border-white/10 dark:bg-slate-800 dark:text-slate-200">
                              {data.recipient_phone}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-3 text-sm leading-6 text-text-sub">
                          {readText(data.recipient_address, '暂无收货地址')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {!data.query_success || data.requires_phone_suffix ? (
                <Card className={`border shadow-[0_18px_40px_-28px_rgba(15,23,42,0.18)] ${tone.note}`}>
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/70 ${tone.accent} dark:bg-white/10`}>
                      <CircleAlert size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold text-text-main dark:text-white">查询说明</p>
                        {!data.query_success && data.query_error_code ? (
                          <span className="rounded-full border border-current/15 bg-white/60 px-2.5 py-1 text-[11px] font-medium dark:bg-white/8">
                            错误码 {data.query_error_code}
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-2 text-sm leading-6 text-text-sub dark:text-slate-200/88">
                        {readText(data.query_message, '物流信息暂不可用，请稍后刷新重试。')}
                      </p>

                      {data.requires_phone_suffix ? (
                        <div className="mt-3 rounded-2xl border border-current/10 bg-white/70 px-3 py-3 text-sm leading-6 text-text-sub dark:bg-white/6 dark:text-slate-200/88">
                          当前物流公司查询需要手机号后四位，系统已自动携带：
                          <span className="ml-1 font-semibold text-text-main dark:text-white">
                            {readText(data.receiver_phone_suffix)}
                          </span>
                        </div>
                      ) : null}

                      {!data.query_success ? (
                        <button
                          type="button"
                          onClick={() => void fetchData({ keepData: true, silent: true })}
                          className="mt-4 inline-flex items-center rounded-full border border-current/15 bg-white/70 px-4 py-2 text-sm font-medium text-text-main transition-transform duration-200 active:scale-[0.98] dark:bg-white/8 dark:text-white"
                        >
                          <RefreshCcw size={15} className="mr-1.5" />
                          重新查询
                        </button>
                      ) : null}
                    </div>
                  </div>
                </Card>
              ) : null}

              <Card
                className={`overflow-hidden border p-0 shadow-[0_20px_44px_-30px_rgba(15,23,42,0.22)] ${tone.fieldCard}`}
              >
                <div className="border-b border-border-light/70 px-4 py-4 dark:border-white/8">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-text-aux">Timeline</div>
                      <div className="mt-1 text-lg font-semibold tracking-[-0.02em] text-text-main">物流轨迹</div>
                      <div className="mt-1 text-sm text-text-sub">
                        {lastUpdate.full !== '--' ? `最近更新 ${lastUpdate.full}` : '下拉可刷新最新轨迹'}
                      </div>
                    </div>
                    <div className="rounded-full border border-border-light bg-bg-base px-3 py-1.5 text-xs font-medium text-text-sub dark:border-white/8 dark:bg-white/[0.03] dark:text-slate-200">
                      共 {timeline.length} 条
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  {latestItem ? (
                    <div className={`mb-4 rounded-[24px] border p-4 ${tone.latestCard}`}>
                      <div className="flex items-start gap-3">
                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] bg-white shadow-sm ${tone.accent} dark:bg-slate-950/60`}>
                          <StatusIcon data={data} className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-text-main shadow-sm dark:bg-slate-900 dark:text-white">
                              最新动态
                            </span>
                            {latestItem.zone ? (
                              <span className="rounded-full border border-border-light bg-white/70 px-2.5 py-1 text-[11px] font-medium text-text-sub dark:border-white/10 dark:bg-white/6 dark:text-slate-200">
                                {latestItem.zone}
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-3 text-[15px] font-semibold leading-7 text-text-main dark:text-white">
                            {readText(latestItem.content, '暂无物流说明')}
                          </p>
                          <div className="mt-2 text-sm text-text-sub dark:text-slate-200/84">
                            {latestUpdate.full !== '--' ? latestUpdate.full : '等待物流公司回传最新轨迹'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {timeline.length === 0 ? (
                    <div className={`rounded-[26px] border border-dashed px-5 py-12 text-center ${tone.outline}`}>
                      <Clock3 size={30} className={`mx-auto mb-3 ${tone.accent}`} />
                      <p className="text-base font-semibold text-text-main dark:text-white">暂无物流轨迹</p>
                      <p className="mt-2 text-sm leading-6 text-text-sub dark:text-slate-200/84">
                        可能刚发货、物流尚未回传，或该运单号暂时查不到轨迹，请稍后下拉刷新。
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-0">
                      {timeline.map((item, index) => {
                        const timeParts = splitDateTime(item.time);
                        const isLast = index === timeline.length - 1;

                        return (
                          <div key={`${item.time}-${index}`} className="relative flex gap-3 pb-5 last:pb-0">
                            <div className="relative flex w-6 shrink-0 justify-center">
                              <div
                                className={`relative z-[1] mt-1 h-3.5 w-3.5 rounded-full ${
                                  item.is_latest ? tone.latestDot : 'bg-slate-300 dark:bg-slate-600'
                                }`}
                              />
                              {!isLast ? (
                                <div
                                  className={`absolute top-5 h-[calc(100%-4px)] w-[2px] rounded-full ${
                                    item.is_latest ? tone.line : 'bg-border-light dark:bg-slate-700'
                                  }`}
                                />
                              ) : null}
                            </div>

                            <div
                              className={`min-w-0 flex-1 rounded-[24px] border p-4 shadow-[0_18px_36px_-30px_rgba(15,23,42,0.2)] ${
                                item.is_latest
                                  ? tone.latestCard
                                  : 'border-border-light/70 bg-white/80 dark:border-white/8 dark:bg-white/[0.03]'
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

                              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-text-aux dark:text-slate-300">
                                <span className="rounded-full bg-bg-base px-2.5 py-1 font-medium text-text-sub dark:bg-slate-800 dark:text-slate-200">
                                  {timeParts.date}
                                </span>
                                <span>{timeParts.time}</span>
                                {item.zone ? (
                                  <span className="rounded-full border border-border-light bg-white px-2.5 py-1 font-medium text-text-sub dark:border-white/8 dark:bg-slate-800 dark:text-slate-200">
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
