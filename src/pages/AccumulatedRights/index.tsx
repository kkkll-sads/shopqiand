import { useCallback, useMemo, useRef } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Banknote,
  Box,
  Coins,
  ShieldCheck,
  TrendingUp,
  Wallet,
  Zap,
} from 'lucide-react';
import { accountApi } from '../../api/modules/account';
import { getErrorMessage } from '../../api/core/errors';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { PullToRefreshContainer } from '../../components/ui/PullToRefreshContainer';
import { Skeleton } from '../../components/ui/Skeleton';
import { useAuthSession } from '../../hooks/useAuthSession';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useRequest } from '../../hooks/useRequest';
import { useRouteScrollRestoration } from '../../hooks/useRouteScrollRestoration';
import { useAppNavigate } from '../../lib/navigation';

interface AssetMetric {
  label: string;
  value: string;
  icon: LucideIcon;
  iconBgClass: string;
  iconClassName: string;
}

interface CollectionMetric {
  label: string;
  value: string;
}

function formatMoney(value: number | string | undefined, fractionDigits = 2) {
  const nextValue = typeof value === 'string' ? Number(value) : value;
  if (typeof nextValue !== 'number' || !Number.isFinite(nextValue)) {
    return '--';
  }

  return nextValue.toLocaleString('zh-CN', {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
    useGrouping: false,
  });
}

function formatCount(value: number | string | undefined) {
  const nextValue = typeof value === 'string' ? Number(value) : value;
  if (typeof nextValue !== 'number' || !Number.isFinite(nextValue)) {
    return '--';
  }

  return nextValue.toLocaleString('zh-CN', {
    maximumFractionDigits: 0,
    useGrouping: false,
  });
}

function OverviewSkeleton() {
  return (
    <div className="space-y-4 px-4 py-4">
      <Skeleton className="h-52 rounded-[28px]" />
      <Skeleton className="h-64 rounded-[24px]" />
      <Skeleton className="h-56 rounded-[24px]" />
    </div>
  );
}

export const AccumulatedRightsPage = () => {
  const { goBackOr, goTo } = useAppNavigate();
  const { isAuthenticated } = useAuthSession();
  const { isOffline, refreshStatus } = useNetworkStatus();
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const {
    data: accountOverview,
    error,
    loading,
    reload,
  } = useRequest((signal) => accountApi.getAccountOverview({ signal }), {
    cacheKey: 'account:overview',
    deps: [isAuthenticated],
    manual: !isAuthenticated,
  });

  const hasBlockingError = isAuthenticated && !accountOverview && Boolean(error);

  useRouteScrollRestoration({
    containerRef: scrollContainerRef,
    enabled: isAuthenticated && !hasBlockingError,
    namespace: 'accumulated-rights-page',
    restoreDeps: [isAuthenticated, loading, hasBlockingError],
    restoreWhen: isAuthenticated && !loading && !hasBlockingError,
  });

  const handleRefresh = useCallback(async () => {
    refreshStatus();

    if (!isAuthenticated) {
      return;
    }

    await reload();
  }, [isAuthenticated, refreshStatus, reload]);

  const assetMetrics = useMemo<AssetMetric[]>(
    () => [
      {
        label: '专项金余额',
        value: formatMoney(accountOverview?.balance.balanceAvailable),
        icon: Wallet,
        iconBgClass: 'bg-rose-50 dark:bg-rose-500/15',
        iconClassName: 'text-rose-600 dark:text-rose-300',
      },
      {
        label: '可提现余额',
        value: formatMoney(accountOverview?.balance.withdrawableMoney),
        icon: Banknote,
        iconBgClass: 'bg-emerald-50 dark:bg-emerald-500/15',
        iconClassName: 'text-emerald-600 dark:text-emerald-300',
      },
      {
        label: '消费金',
        value: formatCount(accountOverview?.balance.score),
        icon: Coins,
        iconBgClass: 'bg-amber-50 dark:bg-amber-500/15',
        iconClassName: 'text-amber-600 dark:text-amber-300',
      },
      {
        label: '确权金',
        value: formatMoney(accountOverview?.balance.serviceFeeBalance),
        icon: ShieldCheck,
        iconBgClass: 'bg-sky-50 dark:bg-sky-500/15',
        iconClassName: 'text-sky-600 dark:text-sky-300',
      },
      {
        label: '算力',
        value: formatMoney(accountOverview?.balance.greenPower),
        icon: Zap,
        iconBgClass: 'bg-violet-50 dark:bg-violet-500/15',
        iconClassName: 'text-violet-600 dark:text-violet-300',
      },
    ],
    [accountOverview],
  );

  const collectionMetrics = useMemo<CollectionMetric[]>(
    () => [
      {
        label: '累计藏品数',
        value: formatCount(accountOverview?.collection.totalCount),
      },
      {
        label: '持有中',
        value: formatCount(accountOverview?.collection.holdingCount),
      },
      {
        label: '寄售中',
        value: formatCount(accountOverview?.collection.consignmentCount),
      },
      {
        label: '已售出',
        value: formatCount(accountOverview?.collection.soldCount),
      },
      {
        label: '矿机数',
        value: formatCount(accountOverview?.collection.miningCount),
      },
    ],
    [accountOverview],
  );

  const renderContent = () => {
    if (!isAuthenticated) {
      return (
        <EmptyState
          icon={<ShieldCheck size={44} />}
          message="登录后查看累计权益与账户总览"
          actionText="去登录"
          actionVariant="primary"
          onAction={() => goTo('login')}
        />
      );
    }

    if (loading && !accountOverview) {
      return <OverviewSkeleton />;
    }

    if (error && !accountOverview) {
      return (
        <ErrorState
          message={getErrorMessage(error)}
          onRetry={() => void handleRefresh()}
        />
      );
    }

    if (!accountOverview) {
      return (
        <EmptyState
          icon={<Box size={44} />}
          message="暂无累计权益数据"
        />
      );
    }

    return (
      <div className="space-y-4 px-4 py-4">
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-[#111827] via-[#7f1d1d] to-[#f97316] p-0 text-white shadow-[0_24px_60px_rgba(17,24,39,0.22)]">
          <div className="relative px-5 py-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.14),transparent_30%)]" />
            <div className="relative">
              <div className="flex items-center gap-2 text-sm text-white/75">
                <TrendingUp size={16} />
                <span>累计权益总览</span>
              </div>
              <div className="mt-4 flex items-end gap-2">
                <span className="text-[38px] font-semibold leading-none">
                  {formatMoney(accountOverview.balance.totalAssets)}
                </span>
                <span className="pb-1 text-sm text-white/80">总资产</span>
              </div>
              <p className="mt-2 text-xs leading-5 text-white/70">
                汇总专项金、可提现余额、消费金与确权金，算力单独展示。
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                  <div className="text-xs text-white/70">累计可提现收益</div>
                  <div className="mt-2 text-2xl font-semibold">
                    {formatMoney(accountOverview.income.totalIncomeWithdrawable)}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                  <div className="text-xs text-white/70">累计消费金收益</div>
                  <div className="mt-2 text-2xl font-semibold">
                    {formatCount(accountOverview.income.totalIncomeScore)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="border border-border-light bg-bg-card">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-text-main">账户权益</h2>
              <p className="mt-1 text-xs text-text-aux">当前账户各类资金与权益余额</p>
            </div>
            <div className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-500 dark:bg-red-500/12 dark:text-red-300">
              实时更新
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {assetMetrics.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className="rounded-2xl border border-border-light bg-bg-base p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-sub">{item.label}</span>
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-full ${item.iconBgClass}`}
                    >
                      <Icon size={18} className={item.iconClassName} />
                    </span>
                  </div>
                  <div className="mt-4 text-xl font-semibold text-text-main">{item.value}</div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="border border-border-light bg-bg-card">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-text-main">藏品资产</h2>
              <p className="mt-1 text-xs text-text-aux">累计藏品价值与当前持仓情况</p>
            </div>
            <div className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-600 dark:bg-amber-500/12 dark:text-amber-300">
              藏品统计
            </div>
          </div>

          <div className="mt-4 rounded-[24px] border border-border-light bg-bg-base p-5">
            <div className="text-sm text-text-sub">藏品总价值</div>
            <div className="mt-2 text-3xl font-semibold text-text-main">
              {formatMoney(accountOverview.collection.totalValue)}
            </div>
            <div className="mt-1 text-xs text-text-aux">
              覆盖持有、寄售、售出与矿机相关统计
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {collectionMetrics.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-border-light bg-bg-base p-4"
              >
                <div className="text-sm text-text-sub">{item.label}</div>
                <div className="mt-3 text-2xl font-semibold text-text-main">{item.value}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-bg-base">
      <PageHeader
        title="累计权益"
        onBack={() => goBackOr('user')}
        offline={isOffline}
        onRefresh={refreshStatus}
      />

      <PullToRefreshContainer
        onRefresh={handleRefresh}
        disabled={isOffline}
      >
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto no-scrollbar pb-6">
          {renderContent()}
        </div>
      </PullToRefreshContainer>
    </div>
  );
};

