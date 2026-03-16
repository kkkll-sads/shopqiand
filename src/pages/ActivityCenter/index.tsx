import { useCallback, useRef } from 'react';
import { ArrowUpRight, Gift, ImageOff, Sparkles } from 'lucide-react';
import {
  activityCenterApi,
  type ActivityCenterItem,
  type ActivityCenterReward,
} from '../../api';
import { getErrorMessage } from '../../api/core/errors';
import { resolveUploadUrl } from '../../api/modules/upload';
import { PageHeader } from '../../components/layout/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { PullToRefreshContainer } from '../../components/ui/PullToRefreshContainer';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useRequest } from '../../hooks/useRequest';
import { useRouteScrollRestoration } from '../../hooks/useRouteScrollRestoration';
import { resolveLegacyAppPath, useAppNavigate } from '../../lib/navigation';

const ACTIVITY_KEY_ROUTE_MAP: Record<string, string> = {
  first_trade: '/store',
  invite_reward: '/invite',
  sub_trade: '/invite',
  recharge: '/recharge',
  questionnaire: '/questionnaire',
};

function formatValue(value: number) {
  if (!Number.isFinite(value)) {
    return '0';
  }

  return value.toFixed(2).replace(/\.?0+$/, '');
}

function formatReward(reward: ActivityCenterReward) {
  const suffix = reward.type === 'power_rate' ? '%' : '';
  const value = formatValue(reward.value);

  if (!reward.name) {
    return `${value}${suffix}`;
  }

  return `${reward.name} ${value}${suffix}`.trim();
}

function getRewardClassName(type: string) {
  switch (type) {
    case 'score':
      return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-200';
    case 'power':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-200';
    case 'power_rate':
      return 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-200';
    default:
      return 'border-border-light bg-bg-base text-text-sub';
  }
}

function resolveActivityTarget(item: ActivityCenterItem) {
  return resolveLegacyAppPath(item.app_path) ?? ACTIVITY_KEY_ROUTE_MAP[item.key] ?? null;
}

function ActivityCard({
  item,
  onAction,
}: {
  item: ActivityCenterItem;
  onAction: (item: ActivityCenterItem) => void;
}) {
  const actionTarget = resolveActivityTarget(item);
  const isDone = item.status === 1;
  const isUnsupported = !isDone && !actionTarget;

  return (
    <article className="overflow-hidden rounded-[28px] border border-white/70 bg-white/95 shadow-[0_16px_40px_rgba(145,84,36,0.08)] backdrop-blur dark:border-gray-700/60 dark:bg-gray-900/95 dark:shadow-[0_20px_48px_rgba(0,0,0,0.28)]">
      <div className="relative overflow-hidden p-5">
        <div className="absolute top-0 right-0 h-28 w-28 rounded-full bg-orange-200/20 blur-2xl dark:bg-orange-400/10" />

        <div className="flex items-start gap-4">
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[22px] bg-[#fff1e7] text-[#d16a30] shadow-inner dark:bg-orange-500/15 dark:text-orange-300">
            {item.icon ? (
              <img
                src={resolveUploadUrl(item.icon)}
                alt={item.title}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
                onError={(event) => {
                  event.currentTarget.style.display = 'none';
                }}
              />
            ) : null}
            <Gift size={24} className="absolute" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-text-main">{item.title || '活动'}</h2>
                <p className="mt-1 text-sm leading-6 text-text-sub">{item.desc || '暂无活动说明'}</p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                  isDone
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200'
                    : isUnsupported
                      ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200'
                      : 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-200'
                }`}
              >
                {isDone ? '已完成' : isUnsupported ? '待接入' : '进行中'}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {item.rewards.length > 0 ? (
                item.rewards.map((reward, index) => (
                  <span
                    key={`${item.key}-${reward.type}-${index}`}
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getRewardClassName(reward.type)}`}
                  >
                    {formatReward(reward)}
                  </span>
                ))
              ) : (
                <span className="inline-flex rounded-full border border-border-light bg-bg-base px-3 py-1 text-xs text-text-sub">
                  奖励待公布
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between rounded-[22px] bg-[#fff8f3] px-4 py-3 dark:bg-orange-500/10">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-[#cc8a5d] dark:text-orange-200/80">Action</div>
            <div className="mt-1 text-sm font-medium text-[#7d4a28] dark:text-orange-100">
              {isUnsupported && !isDone ? '当前活动落地页暂未接入' : '按活动规则完成后自动发放奖励'}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onAction(item)}
            disabled={isDone}
            className={`inline-flex h-11 min-w-[112px] items-center justify-center rounded-full px-5 text-sm font-medium transition ${
              isDone
                ? 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                : isUnsupported
                  ? 'border border-amber-300 bg-white text-amber-700 active:bg-amber-50'
                  : 'bg-gradient-to-r from-[#ff7a30] via-[#ff5b3d] to-[#e73c3c] text-white shadow-[0_10px_22px_rgba(231,60,60,0.25)] active:scale-[0.98]'
            }`}
          >
            {isDone ? item.btn_text || '已完成' : isUnsupported ? '暂未开放' : item.btn_text || '立即前往'}
            {!isDone && !isUnsupported ? <ArrowUpRight size={16} className="ml-1.5" /> : null}
          </button>
        </div>
      </div>
    </article>
  );
}

function ActivityCenterSkeleton() {
  return (
    <div className="space-y-4 px-4 pb-8">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="overflow-hidden rounded-[28px] border border-white/70 bg-white/95 p-5 shadow-[0_16px_40px_rgba(145,84,36,0.08)] dark:border-gray-700/60 dark:bg-gray-900/95 dark:shadow-[0_20px_48px_rgba(0,0,0,0.28)]"
        >
          <div className="flex gap-4">
            <div className="h-16 w-16 shrink-0 animate-pulse rounded-[22px] bg-orange-100 dark:bg-orange-500/15" />
            <div className="flex-1 space-y-3">
              <div className="h-5 w-40 animate-pulse rounded-full bg-orange-100 dark:bg-orange-500/15" />
              <div className="h-4 w-full animate-pulse rounded-full bg-orange-50 dark:bg-gray-800" />
              <div className="h-4 w-2/3 animate-pulse rounded-full bg-orange-50 dark:bg-gray-800" />
              <div className="flex gap-2">
                <div className="h-7 w-24 animate-pulse rounded-full bg-orange-100 dark:bg-orange-500/15" />
                <div className="h-7 w-20 animate-pulse rounded-full bg-orange-50 dark:bg-gray-800" />
              </div>
            </div>
          </div>
          <div className="mt-5 h-16 animate-pulse rounded-[22px] bg-orange-50 dark:bg-orange-500/10" />
        </div>
      ))}
    </div>
  );
}

export function ActivityCenterPage() {
  const { goBackOr, navigate } = useAppNavigate();
  const { isOffline, refreshStatus } = useNetworkStatus();
  const { showToast } = useFeedback();
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const {
    data,
    error,
    loading,
    reload,
  } = useRequest((signal) => activityCenterApi.getList(signal), {
    cacheKey: 'activity-center:list',
  });

  const activityList = data?.list ?? [];
  const activeCount = activityList.filter((item) => item.status !== 1).length;
  const completedCount = activityList.length - activeCount;

  useRouteScrollRestoration({
    containerRef: scrollContainerRef,
    namespace: 'activity-center-page',
    restoreDeps: [loading, activityList.length],
    restoreWhen: !loading && activityList.length > 0,
  });

  const handleRefresh = useCallback(async () => {
    refreshStatus();
    await reload().catch(() => undefined);
  }, [refreshStatus, reload]);

  const handleAction = useCallback(
    (item: ActivityCenterItem) => {
      if (item.status === 1) {
        return;
      }

      const target = resolveActivityTarget(item);
      if (!target) {
        showToast({
          message: '当前活动页面暂未接入',
          type: 'warning',
        });
        return;
      }

      navigate(target);
    },
    [navigate, showToast],
  );

  const renderContent = () => {
    if (loading && activityList.length === 0) {
      return <ActivityCenterSkeleton />;
    }

    if (error && activityList.length === 0) {
      return (
        <ErrorState
          message={getErrorMessage(error)}
          onRetry={() => {
            void reload().catch(() => undefined);
          }}
        />
      );
    }

    if (activityList.length === 0) {
      return (
        <EmptyState
          icon={<ImageOff size={44} />}
          message="暂无可参与活动"
          actionText="重新加载"
          onAction={() => {
            void reload().catch(() => undefined);
          }}
        />
      );
    }

    return (
      <div className="space-y-4 px-4 pb-8">
        {activityList.map((item) => (
          <div key={item.key || item.title}>
            <ActivityCard item={item} onAction={handleAction} />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-[#f8f1e8] dark:bg-gray-950">
      <PageHeader
        title="活动中心"
        onBack={() => goBackOr('user')}
        offline={isOffline}
        onRefresh={() => {
          void handleRefresh();
        }}
        rightAction={
          <div className="inline-flex items-center rounded-full border border-[#ffd4b3] bg-white/80 px-3 py-1 text-xs font-medium text-[#b86633] dark:border-orange-500/30 dark:bg-gray-900/80 dark:text-orange-200">
            <Sparkles size={14} className="mr-1.5" />
            {activityList.length || 0} 项活动
          </div>
        }
      />

      <PullToRefreshContainer onRefresh={handleRefresh}>
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto no-scrollbar">
          <div className="p-4 pb-3">
            <section className="relative overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,#20150f_0%,#8c4f25_48%,#ff8b42_100%)] p-5 text-white shadow-[0_20px_44px_rgba(140,79,37,0.28)]">
              <div className="absolute -top-10 right-0 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-12 left-10 h-32 w-32 rounded-full bg-[#ffd2a3]/20 blur-3xl" />
              <div className="relative">
                <div className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.26em] text-white/80">
                  Activity Hub
                </div>
                <h1 className="mt-4 text-5_5xl font-semibold leading-tight">统一查看当前奖励活动</h1>
                <p className="mt-2 max-w-[280px] text-sm leading-6 text-white/78">
                  完成首购、邀请、问卷、充值等任务后，奖励按活动规则自动到账。
                </p>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-[22px] border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                    <div className="text-xs uppercase tracking-[0.2em] text-white/60">Ongoing</div>
                    <div className="mt-2 text-3xl font-semibold">{activeCount}</div>
                    <div className="mt-1 text-sm text-white/72">可继续参与</div>
                  </div>
                  <div className="rounded-[22px] border border-white/10 bg-black/10 p-4 backdrop-blur-sm">
                    <div className="text-xs uppercase tracking-[0.2em] text-white/60">Done</div>
                    <div className="mt-2 text-3xl font-semibold">{completedCount}</div>
                    <div className="mt-1 text-sm text-white/72">已完成或达上限</div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {renderContent()}
        </div>
      </PullToRefreshContainer>
    </div>
  );
}

export default ActivityCenterPage;
