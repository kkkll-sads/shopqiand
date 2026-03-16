/**
 * @file AccumulatedRights/index.tsx
 * @description 累计权益页面，展示可提现收益、消费金收益、藏品资产及近7日收支。
 */

import { useCallback, useMemo, useRef } from 'react';
import {
  BarChart3,
  Box,
  CalendarDays,
  Gift,
  Pickaxe,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { accountApi } from '../../api';
import { getErrorMessage } from '../../api/core/errors';
import type { AccountOverview } from '../../api/modules/account';
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

function formatMoney(value: number | string | undefined, fractionDigits = 2) {
  const nextValue = typeof value === 'string' ? Number(value) : value;
  if (typeof nextValue !== 'number' || !Number.isFinite(nextValue)) {
    return '0.00';
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
    return '0';
  }
  return nextValue.toLocaleString('zh-CN', {
    maximumFractionDigits: 0,
    useGrouping: false,
  });
}

const INCOME_ITEMS: Array<{
  key: keyof Pick<
    NonNullable<AccountOverview['income']>,
    'consignmentIncome' | 'miningDividend' | 'friendCommission' | 'signIn' | 'registerReward' | 'other'
  >;
  label: string;
  icon: typeof TrendingUp;
  iconClass: string;
}> = [
  { key: 'consignmentIncome', label: '寄售收益', icon: TrendingUp, iconClass: 'text-blue-500' },
  { key: 'miningDividend', label: '矿机分红', icon: Pickaxe, iconClass: 'text-orange-500' },
  { key: 'friendCommission', label: '好友分润', icon: Users, iconClass: 'text-green-500' },
  { key: 'signIn', label: '签到奖励', icon: CalendarDays, iconClass: 'text-purple-500' },
  { key: 'registerReward', label: '注册奖励', icon: Gift, iconClass: 'text-red-500' },
  { key: 'other', label: '其他收益', icon: Wallet, iconClass: 'text-gray-500' },
];

function OverviewSkeleton() {
  return (
    <div className="flex-1 bg-bg-base flex flex-col">
      <div className="h-12 flex items-center px-4 bg-bg-card border-b border-border-main">
        <Skeleton className="w-6 h-6 rounded-full" />
        <Skeleton className="w-24 h-5 mx-auto" />
      </div>
      <div className="p-4 space-y-4">
        <Skeleton className="w-full h-36 rounded-2xl" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="w-full h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="w-full h-48 rounded-2xl" />
        <Skeleton className="w-full h-56 rounded-2xl" />
      </div>
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
    if (!isAuthenticated) return;
    await reloadOverview().catch(() => undefined);
  }, [isAuthenticated, refreshStatus, reloadOverview]);

  const dailyBreakdown = useMemo(() => {
    return accountOverview?.dailyBreakdown ?? [];
  }, [accountOverview?.dailyBreakdown]);

  const renderContent = () => {
    if (!isAuthenticated) {
      return (
        <EmptyState
          icon={<Box size={44} />}
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
      <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto no-scrollbar pb-safe">
        {/* Top Banner */}
        <div className="bg-gradient-to-br from-primary-start to-primary-end px-6 py-8 text-white relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
          <div className="relative z-10">
            <div className="text-base text-white/80 mb-1">累计可提现收益 (元)</div>
            <div className="text-[36px] font-bold leading-none mb-4">
              {formatMoney(accountOverview.income.totalIncomeWithdrawable)}
            </div>
            <div className="flex items-center space-x-6">
              <div>
                <div className="text-s text-white/70 mb-0.5">累计消费金收益</div>
                <div className="text-lg font-medium">
                  {formatCount(accountOverview.income.totalIncomeScore)}
                </div>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div>
                <div className="text-s text-white/70 mb-0.5">当前总资产 (元)</div>
                <div className="text-lg font-medium">
                  {formatMoney(accountOverview.balance.totalAssets)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Income Breakdown */}
          <div>
            <h3 className="text-md font-bold text-text-main mb-3 flex items-center">
              <BarChart3 size={16} className="mr-1.5 text-primary-start" /> 收益构成
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {INCOME_ITEMS.map((item) => {
                const data = accountOverview.income?.[item.key];
                const Icon = item.icon;
                return (
                  <Card
                    key={item.key}
                    className="p-3 shadow-sm border-none bg-bg-card dark:bg-bg-card"
                  >
                    <div className="flex items-center mb-2">
                      <div className="w-6 h-6 rounded-full bg-bg-base flex items-center justify-center mr-2">
                        <Icon size={14} className={item.iconClass} />
                      </div>
                      <span className="text-sm font-medium text-text-main">{item.label}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-s">
                        <span className="text-text-sub">可提现</span>
                        <span className="font-medium text-text-main">
                          ¥{data ? formatMoney(data.withdrawableIncome) : '0.00'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-s">
                        <span className="text-text-sub">消费金</span>
                        <span className="font-medium text-orange-500">
                          {data ? formatCount(data.scoreIncome) : '0'}
                        </span>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Collection Stats */}
          <Card className="p-4 shadow-sm border-none bg-bg-card dark:bg-bg-card">
            <h3 className="text-md font-bold text-text-main mb-4 flex items-center">
              <Box size={16} className="mr-1.5 text-primary-start" /> 藏品资产统计
            </h3>
            <div className="flex justify-between items-center mb-5 pb-4 border-b border-border-main">
              <div className="text-center flex-1 border-r border-border-main">
                <div className="text-s text-text-sub mb-1">藏品总价值</div>
                <div className="text-2xl font-bold text-text-main">
                  ¥{formatMoney(accountOverview.collection.totalValue)}
                </div>
              </div>
              <div className="text-center flex-1">
                <div className="text-s text-text-sub mb-1">藏品总数</div>
                <div className="text-2xl font-bold text-text-main">
                  {formatCount(accountOverview.collection.totalCount)}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-y-4 text-center">
              <div>
                <div className="text-s text-text-sub mb-1">持有中</div>
                <div className="text-md font-medium text-text-main">
                  {formatCount(accountOverview.collection.holdingCount)}
                </div>
              </div>
              <div>
                <div className="text-s text-text-sub mb-1">寄售中</div>
                <div className="text-md font-medium text-text-main">
                  {formatCount(accountOverview.collection.consignmentCount)}
                </div>
              </div>
              <div>
                <div className="text-s text-text-sub mb-1">已售出</div>
                <div className="text-md font-medium text-text-main">
                  {formatCount(accountOverview.collection.soldCount)}
                </div>
              </div>
              <div>
                <div className="text-s text-text-sub mb-1">矿机数量</div>
                <div className="text-md font-medium text-text-main">
                  {formatCount(accountOverview.collection.miningCount)}
                </div>
              </div>
              <div>
                <div className="text-s text-text-sub mb-1">矿机价值</div>
                <div className="text-md font-medium text-text-main">
                  ¥{formatMoney(accountOverview.collection.miningValue)}
                </div>
              </div>
              <div>
                <div className="text-s text-text-sub mb-1">平均价格</div>
                <div className="text-md font-medium text-text-main">
                  ¥{formatMoney(accountOverview.collection.avgPrice)}
                </div>
              </div>
            </div>
          </Card>

          {/* 7 Days Trend */}
          {dailyBreakdown.length > 0 && (
            <Card className="p-4 shadow-sm border-none bg-bg-card dark:bg-bg-card">
              <h3 className="text-md font-bold text-text-main mb-4 flex items-center">
                <TrendingUp size={16} className="mr-1.5 text-primary-start" /> 近7日收支
              </h3>
              <div className="space-y-3">
                {dailyBreakdown.map((day, idx) => {
                  const net = day.net ?? '0.00';
                  const netVal = parseFloat(net);
                  const isPositive = netVal > 0;
                  const isNegative = netVal < 0;
                  return (
                    <div
                      key={day.date ?? idx}
                      className="flex justify-between items-center py-2 border-b border-border-main last:border-0 last:pb-0"
                    >
                      <div className="text-sm text-text-sub">{day.date ?? '--'}</div>
                      <div className="flex items-center space-x-4 text-s">
                        <div className="text-right">
                          <div className="text-text-sub">收入</div>
                          <div className="text-green-500 font-medium">
                            +{(day.incomeTotal ?? '0.00')}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-text-sub">支出</div>
                          <div className="text-text-main font-medium">
                            -{(day.expenseTotal ?? '0.00')}
                          </div>
                        </div>
                        <div className="text-right w-16">
                          <div className="text-text-sub">净收益</div>
                          <div
                            className={`font-bold ${
                              isPositive
                                ? 'text-primary-start'
                                : isNegative
                                  ? 'text-red-500'
                                  : 'text-text-main'
                            }`}
                          >
                            {isPositive ? '+' : ''}
                            {net}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
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
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          {renderContent()}
        </div>
      </PullToRefreshContainer>
    </div>
  );
};

export default AccumulatedRightsPage;
