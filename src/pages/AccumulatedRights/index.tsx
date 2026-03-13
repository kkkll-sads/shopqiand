import { useCallback, useMemo, useRef } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Award,
  Banknote,
  Box,
  Coins,
  Pickaxe,
  Receipt,
  ShieldCheck,
  TrendingUp,
  Wallet,
  Zap,
} from 'lucide-react';
import { accountApi } from '../../api';
import { getErrorMessage } from '../../api/core/errors';
import { WalletPageHeader } from '../../components/layout/WalletPageHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { PullToRefreshContainer } from '../../components/ui/PullToRefreshContainer';
import { Skeleton } from '../../components/ui/Skeleton';
import { useAuthSession } from '../../hooks/useAuthSession';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useRequest } from '../../hooks/useRequest';
import { useRouteScrollRestoration } from '../../hooks/useRouteScrollRestoration';
import { useAppNavigate } from '../../lib/navigation';

interface BalanceCardItem {
  description: string;
  icon: LucideIcon;
  iconBgClassName: string;
  iconTextClassName: string;
  label: string;
  value: string;
}

interface CollectionStatItem {
  label: string;
  value: string;
}

const FUND_NOTES = [
  '总资产为专项金、可提现、消费金、确权金与绿色算力等账户的汇总展示，仅用于总览核对。',
  '专项金主要用于申购、购买等场景，会优先参与订单支付扣减。',
  '可提现余额包含收益、分红和奖励等可提现资金，可在提现页面发起申请。',
  '确权金主要用于寄售等服务费场景，充值或划转后不可直接提现。',
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

function SectionTitle({
  accentClassName,
  title,
}: {
  accentClassName: string;
  title: string;
}) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className={`h-4 w-1 rounded-full ${accentClassName}`} />
      <h2 className="text-sm font-semibold text-text-main">{title}</h2>
    </div>
  );
}

function OverviewCard() {
  return (
    <div className="rounded-2xl border border-[#f1d5cb] bg-[#fff7f4] px-5 py-5">
      <div className="flex items-center gap-2 text-[#d9482e]">
        <ShieldCheck size={18} />
        <span className="text-sm font-medium">我的权益</span>
      </div>
      <div className="mt-3 text-2xl font-semibold text-text-main">资产全景</div>
      <p className="mt-2 text-sm leading-6 text-text-sub">
        按账户余额、累计收益、藏品价值和订单资金说明统一查看累计权益。
      </p>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6 px-4 py-4">
      <Skeleton className="h-32 rounded-2xl" />
      <div>
        <Skeleton className="mb-3 h-5 w-24 rounded-full" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
      <div>
        <Skeleton className="mb-3 h-5 w-24 rounded-full" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
      <div>
        <Skeleton className="mb-3 h-5 w-28 rounded-full" />
        <Skeleton className="h-36 rounded-xl" />
      </div>
      <Skeleton className="h-20 rounded-xl" />
      <Skeleton className="h-36 rounded-xl" />
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

    await reloadOverview().catch(() => undefined);
  }, [isAuthenticated, refreshStatus, reloadOverview]);

  const balanceItems = useMemo<BalanceCardItem[]>(
    () => [
      {
        description: '所有账户资产总和',
        icon: Award,
        iconBgClassName: 'bg-[#eef4ff]',
        iconTextClassName: 'text-[#3b82f6]',
        label: '总资产',
        value: formatMoney(accountOverview?.balance.totalAssets),
      },
      {
        description: '申购和购买时优先使用',
        icon: Wallet,
        iconBgClassName: 'bg-[#f3efff]',
        iconTextClassName: 'text-[#7c3aed]',
        label: '专项金余额',
        value: formatMoney(accountOverview?.balance.balanceAvailable),
      },
      {
        description: '可直接发起提现申请',
        icon: Banknote,
        iconBgClassName: 'bg-[#eefbf3]',
        iconTextClassName: 'text-[#16a34a]',
        label: '可提现余额',
        value: formatMoney(accountOverview?.balance.withdrawableMoney),
      },
      {
        description: '用于商城消费',
        icon: Coins,
        iconBgClassName: 'bg-[#fff7e7]',
        iconTextClassName: 'text-[#d97706]',
        label: '消费金',
        value: formatCount(accountOverview?.balance.score),
      },
      {
        description: '寄售等服务费场景使用',
        icon: ShieldCheck,
        iconBgClassName: 'bg-[#eff8ff]',
        iconTextClassName: 'text-[#0284c7]',
        label: '确权金',
        value: formatMoney(accountOverview?.balance.serviceFeeBalance),
      },
      {
        description: '绿色算力账户余额',
        icon: Zap,
        iconBgClassName: 'bg-[#f3faea]',
        iconTextClassName: 'text-[#65a30d]',
        label: '绿色算力',
        value: formatMoney(accountOverview?.balance.greenPower),
      },
    ],
    [accountOverview],
  );

  const collectionStats = useMemo<CollectionStatItem[]>(
    () => [
      { label: '藏品总数', value: formatCount(accountOverview?.collection.totalCount) },
      { label: '持有中', value: formatCount(accountOverview?.collection.holdingCount) },
      { label: '寄售中', value: formatCount(accountOverview?.collection.consignmentCount) },
      { label: '已售出', value: formatCount(accountOverview?.collection.soldCount) },
      { label: '矿机数量', value: formatCount(accountOverview?.collection.miningCount) },
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
      <div className="space-y-6 px-4 py-4 pb-8">
        <OverviewCard />

        <section>
          <SectionTitle accentClassName="bg-[#ef4444]" title="账户余额" />
          <div className="grid grid-cols-2 gap-3">
            {balanceItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-xl border border-[#ececec] bg-white p-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${item.iconBgClassName}`}>
                    <Icon size={18} className={item.iconTextClassName} />
                  </div>
                  <div className="mt-3 text-xs text-text-sub">{item.label}</div>
                  <div className={`mt-1 text-lg font-semibold ${item.iconTextClassName}`}>{item.value}</div>
                  <div className="mt-2 text-[11px] leading-5 text-text-aux">{item.description}</div>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <SectionTitle accentClassName="bg-[#f97316]" title="历史收益统计" />
          <div className="rounded-xl border border-[#f4d8c2] bg-[#fff8f1] p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="text-xs text-text-sub">累计可提现收益</div>
                <div className="mt-2 text-2xl font-semibold text-[#ea580c]">
                  {formatMoney(accountOverview.income.totalIncomeWithdrawable)}
                </div>
              </div>
              <div className="min-w-0 flex-1 text-right">
                <div className="text-xs text-text-sub">累计消费金收益</div>
                <div className="mt-2 text-2xl font-semibold text-[#d97706]">
                  {formatCount(accountOverview.income.totalIncomeScore)}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-[#ececec] bg-white p-4">
              <div className="flex items-center gap-2 text-sm text-text-main">
                <TrendingUp size={16} className="text-[#ea580c]" />
                <span>可提现收益</span>
              </div>
              <div className="mt-3 text-lg font-semibold text-[#ea580c]">
                {formatMoney(accountOverview.income.totalIncomeWithdrawable)}
              </div>
              <div className="mt-1 text-[11px] text-text-aux">当前接口返回的累计可提现金额汇总</div>
            </div>
            <div className="rounded-xl border border-[#ececec] bg-white p-4">
              <div className="flex items-center gap-2 text-sm text-text-main">
                <Coins size={16} className="text-[#d97706]" />
                <span>消费金收益</span>
              </div>
              <div className="mt-3 text-lg font-semibold text-[#d97706]">
                {formatCount(accountOverview.income.totalIncomeScore)}
              </div>
              <div className="mt-1 text-[11px] text-text-aux">当前接口返回的累计消费金收益汇总</div>
            </div>
          </div>
        </section>

        <section>
          <SectionTitle accentClassName="bg-[#8b5cf6]" title="藏品价值统计" />
          <div className="rounded-xl border border-[#ececec] bg-white p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs text-text-sub">藏品总价值</div>
                <div className="mt-2 text-2xl font-semibold text-text-main">
                  {formatMoney(accountOverview.collection.totalValue)}
                </div>
              </div>
              {accountOverview.collection.miningCount > 0 ? (
                <div className="rounded-full bg-[#fff7e7] px-3 py-1 text-xs font-medium text-[#b45309]">
                  矿机 {formatCount(accountOverview.collection.miningCount)} 台
                </div>
              ) : null}
            </div>

            <div className="mt-4 grid grid-cols-5 gap-2 text-center">
              {collectionStats.map((item) => (
                <div key={item.label}>
                  <div className="text-lg font-semibold text-text-main">{item.value}</div>
                  <div className="mt-1 text-[11px] leading-4 text-text-sub">{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          {accountOverview.collection.miningCount > 0 ? (
            <div className="mt-3 flex items-center justify-between rounded-xl border border-[#ececec] bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fff7e7]">
                  <Pickaxe size={18} className="text-[#d97706]" />
                </div>
                <div>
                  <div className="text-xs text-text-sub">矿机资产补充统计</div>
                  <div className="mt-1 text-sm font-medium text-text-main">
                    当前共持有 {formatCount(accountOverview.collection.miningCount)} 台矿机
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </section>

        <section>
          <button
            type="button"
            onClick={() => goTo('billing')}
            className="flex w-full items-center justify-between rounded-xl border border-[#f1d5cb] bg-[#fff7f4] p-4 text-left active:opacity-80"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#fbe3dc] text-[#d9482e]">
                <Receipt size={18} />
              </div>
              <div>
                <div className="text-base font-medium text-text-main">订单资金详情</div>
                <div className="mt-1 text-xs text-text-sub">查看订单相关的账户流水和资金变动记录</div>
              </div>
            </div>
            <TrendingUp size={18} className="text-[#d9482e]" />
          </button>
        </section>

        <section className="rounded-xl border border-[#ececec] bg-white p-4">
          <SectionTitle accentClassName="bg-[#ef4444]" title="资金说明" />
          <div className="space-y-3">
            {FUND_NOTES.map((item) => (
              <div key={item} className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ef4444]" />
                <p className="text-sm leading-6 text-text-sub">{item}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  };

  return (
    <div className="accumulated-rights-dark-scope flex flex-1 flex-col overflow-hidden bg-bg-base">
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
