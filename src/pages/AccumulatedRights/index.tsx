import { useCallback, useMemo, useRef } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Banknote,
  Box,
  Coins,
  FileText,
  Layers3,
  ShieldCheck,
  TrendingUp,
  Wallet,
  Zap,
} from 'lucide-react';
import { accountApi } from '../../api';
import { getErrorMessage } from '../../api/core/errors';
import { WalletPageHeader } from '../../components/layout/WalletPageHeader';
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

interface MetricCardItem {
  description: string;
  icon: LucideIcon;
  iconClassName: string;
  label: string;
  value: string;
}

interface QuickActionItem {
  icon: LucideIcon;
  id: string;
  label: string;
  onClick: () => void;
}

const FUND_NOTES = [
  '总资产为专项金、可提现、消费金、确权金等账户的汇总展示。',
  '专项金主要用于申购和购买资产，可提现收益可发起提现申请。',
  '确权金主要用于寄售等服务费场景，服务费充值后不可直接提现。',
  '待激活金来自账户资料接口，方便统一查看当前可转化资金规模。',
] as const;

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
      <Skeleton className="h-44 rounded-[28px]" />
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((item) => (
          <Skeleton key={item} className="h-24 rounded-[24px]" />
        ))}
      </div>
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
    error: overviewError,
    loading: overviewLoading,
    reload: reloadOverview,
  } = useRequest((signal) => accountApi.getAccountOverview({ signal }), {
    cacheKey: 'accumulated-rights:overview',
    deps: [isAuthenticated],
    manual: !isAuthenticated,
  });

  const {
    data: profile,
    reload: reloadProfile,
  } = useRequest((signal) => accountApi.getProfile({ signal }), {
    cacheKey: 'accumulated-rights:profile',
    deps: [isAuthenticated],
    manual: !isAuthenticated,
  });

  const hasBlockingError = isAuthenticated && !accountOverview && Boolean(overviewError);

  useRouteScrollRestoration({
    containerRef: scrollContainerRef,
    enabled: isAuthenticated && !hasBlockingError,
    namespace: 'accumulated-rights-page',
    restoreDeps: [isAuthenticated, overviewLoading, hasBlockingError],
    restoreWhen: isAuthenticated && !overviewLoading && !hasBlockingError,
  });

  const handleRefresh = useCallback(async () => {
    refreshStatus();

    if (!isAuthenticated) {
      return;
    }

    await Promise.allSettled([reloadOverview(), reloadProfile()]);
  }, [isAuthenticated, refreshStatus, reloadOverview, reloadProfile]);

  const balanceMetrics = useMemo<MetricCardItem[]>(
    () => [
      {
        description: '申购、购买等场景使用',
        icon: Wallet,
        iconClassName: 'bg-rose-50 text-rose-600',
        label: '专项金余额',
        value: formatMoney(accountOverview?.balance.balanceAvailable),
      },
      {
        description: '可直接发起提现申请',
        icon: Banknote,
        iconClassName: 'bg-emerald-50 text-emerald-600',
        label: '可提现余额',
        value: formatMoney(accountOverview?.balance.withdrawableMoney),
      },
      {
        description: '从资料接口补齐展示',
        icon: Layers3,
        iconClassName: 'bg-amber-50 text-amber-600',
        label: '待激活金',
        value: formatMoney(profile?.userInfo?.pendingActivationGold),
      },
      {
        description: '用于商城消费',
        icon: Coins,
        iconClassName: 'bg-sky-50 text-sky-600',
        label: '消费金',
        value: formatCount(accountOverview?.balance.score),
      },
      {
        description: '用于寄售等服务费场景',
        icon: ShieldCheck,
        iconClassName: 'bg-violet-50 text-violet-600',
        label: '确权金',
        value: formatMoney(accountOverview?.balance.serviceFeeBalance),
      },
      {
        description: '绿色算力余额',
        icon: Zap,
        iconClassName: 'bg-lime-50 text-lime-600',
        label: '绿色算力',
        value: formatMoney(accountOverview?.balance.greenPower),
      },
    ],
    [accountOverview, profile?.userInfo?.pendingActivationGold],
  );

  const quickActions = useMemo<QuickActionItem[]>(
    () => [
      {
        icon: FileText,
        id: 'billing',
        label: '资产明细',
        onClick: () => goTo('billing'),
      },
      {
        icon: Wallet,
        id: 'recharge',
        label: '专项金充值',
        onClick: () => goTo('recharge'),
      },
      {
        icon: Banknote,
        id: 'withdraw',
        label: '收益提现',
        onClick: () => goTo('withdraw'),
      },
      {
        icon: ShieldCheck,
        id: 'service-fee',
        label: '服务费充值',
        onClick: () => goTo('service_fee_recharge'),
      },
    ],
    [goTo],
  );

  const collectionStats = useMemo(
    () => [
      { label: '累计藏品数', value: formatCount(accountOverview?.collection.totalCount) },
      { label: '持有中', value: formatCount(accountOverview?.collection.holdingCount) },
      { label: '寄售中', value: formatCount(accountOverview?.collection.consignmentCount) },
      { label: '已售出', value: formatCount(accountOverview?.collection.soldCount) },
      { label: '矿机数', value: formatCount(accountOverview?.collection.miningCount) },
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

    if (overviewLoading && !accountOverview) {
      return <OverviewSkeleton />;
    }

    if (overviewError && !accountOverview) {
      return (
        <ErrorState
          message={getErrorMessage(overviewError)}
          onRetry={() => void handleRefresh()}
        />
      );
    }

    if (!accountOverview) {
      return <EmptyState icon={<Box size={44} />} message="暂无累计权益数据" />;
    }

    return (
      <div className="space-y-4 px-4 py-4 pb-8">
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-[#1f2937] via-[#8a2d36] to-[#f97316] p-0 text-white shadow-[0_24px_56px_rgba(17,24,39,0.2)]">
          <div className="relative px-5 py-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.12),transparent_30%)]" />
            <div className="relative">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm text-white/80">
                  <TrendingUp size={16} />
                  <span>累计权益总览</span>
                </div>
                <button
                  type="button"
                  onClick={() => goTo('billing')}
                  className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm active:opacity-80"
                >
                  查看资产明细
                </button>
              </div>

              <div className="mt-5 text-sm text-white/70">总资产</div>
              <div className="mt-2 text-[38px] font-semibold leading-none">
                {formatMoney(accountOverview.balance.totalAssets)}
              </div>
              <div className="mt-3 text-xs leading-5 text-white/70">
                汇总专项金、可提现、消费金、确权金与待激活金，方便统一核对账户资金。
              </div>

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

        <Card className="border border-border-light/80 p-4">
          <div className="mb-3 text-base font-semibold text-text-main">常用功能</div>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.onClick}
                  className="flex items-center rounded-2xl border border-border-light bg-bg-base px-4 py-3 text-left transition-colors active:bg-bg-hover"
                >
                  <span className="mr-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-bg-card text-primary-start shadow-soft">
                    <Icon size={18} />
                  </span>
                  <span className="text-sm font-medium text-text-main">{item.label}</span>
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="border border-border-light/80 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-text-main">账户余额</h2>
              <p className="mt-1 text-xs text-text-aux">账户资金、待激活金和算力统一查看</p>
            </div>
            <div className="rounded-full bg-primary-start/[0.08] px-3 py-1 text-xs font-medium text-primary-start">
              已对齐功能区
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {balanceMetrics.map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.label} className="rounded-2xl border border-border-light bg-bg-base p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm text-text-sub">{item.label}</div>
                    <span className={`flex h-9 w-9 items-center justify-center rounded-full ${item.iconClassName}`}>
                      <Icon size={18} />
                    </span>
                  </div>
                  <div className="mt-4 text-xl font-semibold text-text-main">{item.value}</div>
                  <div className="mt-2 text-xs leading-5 text-text-aux">{item.description}</div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="border border-border-light/80 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-text-main">收益概览</h2>
              <p className="mt-1 text-xs text-text-aux">当前接口返回的累计收益汇总</p>
            </div>
            <button
              type="button"
              onClick={() => goTo('withdraw')}
              className="rounded-full bg-bg-base px-3 py-1.5 text-xs font-medium text-primary-start active:opacity-80"
            >
              去提现
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-border-light bg-bg-base p-4">
              <div className="text-sm text-text-sub">累计可提现收益</div>
              <div className="mt-3 text-2xl font-semibold text-text-main">
                {formatMoney(accountOverview.income.totalIncomeWithdrawable)}
              </div>
            </div>
            <div className="rounded-2xl border border-border-light bg-bg-base p-4">
              <div className="text-sm text-text-sub">累计消费金收益</div>
              <div className="mt-3 text-2xl font-semibold text-text-main">
                {formatCount(accountOverview.income.totalIncomeScore)}
              </div>
            </div>
          </div>
        </Card>

        <Card className="border border-border-light/80 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-text-main">藏品资产</h2>
              <p className="mt-1 text-xs text-text-aux">持有、寄售、售出和矿机数量汇总</p>
            </div>
            <div className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
              藏品统计
            </div>
          </div>

          <div className="mt-4 rounded-[24px] border border-border-light bg-bg-base p-5">
            <div className="text-sm text-text-sub">藏品总价值</div>
            <div className="mt-2 text-3xl font-semibold text-text-main">
              {formatMoney(accountOverview.collection.totalValue)}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {collectionStats.map((item) => (
              <div key={item.label} className="rounded-2xl border border-border-light bg-bg-base p-4">
                <div className="text-sm text-text-sub">{item.label}</div>
                <div className="mt-3 text-2xl font-semibold text-text-main">{item.value}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="border border-border-light/80 p-4">
          <div className="text-base font-semibold text-text-main">资金说明</div>
          <div className="mt-4 space-y-3">
            {FUND_NOTES.map((item) => (
              <div key={item} className="flex items-start gap-3">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary-start" />
                <p className="text-sm leading-6 text-text-sub">{item}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-bg-base">
      <WalletPageHeader
        title="累计权益"
        onBack={() => goBackOr('user')}
        offline={isOffline}
        onRefresh={refreshStatus}
      />

      <PullToRefreshContainer onRefresh={handleRefresh} disabled={isOffline}>
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto no-scrollbar pb-6">
          {renderContent()}
        </div>
      </PullToRefreshContainer>
    </div>
  );
};

export default AccumulatedRightsPage;
