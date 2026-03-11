/**
 * @file AccumulatedRights/index.tsx - 累计权益页面
 * @description 展示用户的账户总资产概览，包括各类资金余额（专项金、可提现、消费金、确权金、算力）
 *              以及藏品资产统计（持有、寄售、售出、矿机数等）。
 */

// ======================== 依赖导入 ========================

import { useCallback, useMemo, useRef } from 'react'; // React 核心 Hook
import type { LucideIcon } from 'lucide-react'; // 图标组件类型定义
import {
  Banknote, // 钞票图标 - 用于可提现余额
  Box, // 盒子图标 - 用于空状态
  Coins, // 硬币图标 - 用于消费金
  ShieldCheck, // 盾牌图标 - 用于确权金 & 未登录状态
  TrendingUp, // 趋势图标 - 用于权益总览标题
  Wallet, // 钱包图标 - 用于专项金余额
  Zap, // 闪电图标 - 用于算力
} from 'lucide-react';
import { accountApi } from '../../api/modules/account'; // 账户相关 API
import { getErrorMessage } from '../../api/core/errors'; // 统一错误信息提取
import { PageHeader } from '../../components/layout/PageHeader'; // 页面顶部导航栏
import { Card } from '../../components/ui/Card'; // 通用卡片组件
import { EmptyState } from '../../components/ui/EmptyState'; // 空状态提示组件
import { ErrorState } from '../../components/ui/ErrorState'; // 错误状态提示组件
import { PullToRefreshContainer } from '../../components/ui/PullToRefreshContainer'; // 下拉刷新容器
import { Skeleton } from '../../components/ui/Skeleton'; // 骨架屏组件
import { useAuthSession } from '../../hooks/useAuthSession'; // 登录态 Hook
import { useNetworkStatus } from '../../hooks/useNetworkStatus'; // 网络状态检测 Hook
import { useRequest } from '../../hooks/useRequest'; // 通用异步请求 Hook
import { useRouteScrollRestoration } from '../../hooks/useRouteScrollRestoration'; // 路由滚动位置恢复 Hook
import { useAppNavigate } from '../../lib/navigation'; // 应用导航 Hook

// ======================== 类型定义 ========================

/** 资产指标项：用于"账户权益"卡片中的单个指标 */
interface AssetMetric {
  label: string; // 指标名称
  value: string; // 格式化后的值
  icon: LucideIcon; // 图标组件
  iconBgClass: string; // 图标背景样式类
  iconClassName: string; // 图标颜色样式类
}

/** 藏品指标项：用于"藏品资产"卡片中的单个指标 */
interface CollectionMetric {
  label: string; // 指标名称
  value: string; // 格式化后的值
}

// ======================== 工具函数 ========================

/**
 * 格式化金额数值
 * @param value - 原始值（数字或字符串）
 * @param fractionDigits - 小数位数，默认 2 位
 * @returns 格式化后的字符串，无效值返回 '--'
 */
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

/**
 * 格式化计数数值（整数）
 * @param value - 原始值（数字或字符串）
 * @returns 格式化后的字符串，无效值返回 '--'
 */
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

// ======================== 子组件 ========================

/** 加载骨架屏：页面数据加载中时展示的占位 UI */
function OverviewSkeleton() {
  return (
    <div className="space-y-4 px-4 py-4">
      <Skeleton className="h-52 rounded-[28px]" />
      <Skeleton className="h-64 rounded-[24px]" />
      <Skeleton className="h-56 rounded-[24px]" />
    </div>
  );
}

// ======================== 页面组件 ========================

/**
 * AccumulatedRightsPage - 累计权益页面
 *
 * 功能概览：
 * 1. 顶部深色渐变卡片展示总资产、累计可提现收益、累计消费金收益
 * 2. 账户权益卡片：以 2 列网格展示各类资金余额（专项金、可提现、消费金、确权金、算力）
 * 3. 藏品资产卡片：展示藏品总价值及各分类数量（持有、寄售、售出、矿机）
 * 4. 支持下拉刷新、骨架屏加载、错误/空状态提示、滚动位置恢复
 */
export const AccumulatedRightsPage = () => {
  // ---------- 导航 & 状态 ----------
  const { goBackOr, goTo } = useAppNavigate(); // 页面导航（返回/跳转）
  const { isAuthenticated } = useAuthSession(); // 是否已登录
  const { isOffline, refreshStatus } = useNetworkStatus(); // 网络离线状态 & 刷新方法
  const scrollContainerRef = useRef<HTMLDivElement | null>(null); // 滚动容器引用（用于滚动恢复）

  // ---------- 请求账户总览数据 ----------
  const {
    data: accountOverview, // 账户总览数据
    error, // 请求错误
    loading, // 是否加载中
    reload, // 重新请求方法
  } = useRequest((signal) => accountApi.getAccountOverview({ signal }), {
    cacheKey: 'account:overview', // 缓存键
    deps: [isAuthenticated], // 依赖登录状态
    manual: !isAuthenticated, // 未登录时不自动请求
  });

  /** 是否存在阻断性错误（已登录但无数据且有错误） */
  const hasBlockingError = isAuthenticated && !accountOverview && Boolean(error);

  // ---------- 滚动位置恢复 ----------
  useRouteScrollRestoration({
    containerRef: scrollContainerRef,
    enabled: isAuthenticated && !hasBlockingError,
    namespace: 'accumulated-rights-page',
    restoreDeps: [isAuthenticated, loading, hasBlockingError],
    restoreWhen: isAuthenticated && !loading && !hasBlockingError,
  });

  /**
   * 下拉刷新处理
   * 同时刷新网络状态和账户数据
   */
  const handleRefresh = useCallback(async () => {
    refreshStatus();

    if (!isAuthenticated) {
      return;
    }

    await reload();
  }, [isAuthenticated, refreshStatus, reload]);

  // ---------- 资产指标数据（Memo 缓存） ----------
  /** 账户权益 - 5 项资金指标配置 */
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

  /** 藏品资产 - 5 项藏品指标配置 */
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

  // ---------- 内容渲染函数 ----------
  /**
   * 根据当前状态渲染页面主体内容
   * 优先级：未登录提示 > 加载骨架屏 > 错误提示 > 空状态 > 正常内容
   */
  const renderContent = () => {
    // 未登录 → 引导登录
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

    // 加载中且无缓存数据 → 骨架屏
    if (loading && !accountOverview) {
      return <OverviewSkeleton />;
    }

    // 有错误且无缓存数据 → 错误提示（可重试）
    if (error && !accountOverview) {
      return (
        <ErrorState
          message={getErrorMessage(error)}
          onRetry={() => void handleRefresh()}
        />
      );
    }

    // 无数据 → 空状态
    if (!accountOverview) {
      return (
        <EmptyState
          icon={<Box size={44} />}
          message="暂无累计权益数据"
        />
      );
    }

    // ======== 正常内容渲染 ========
    return (
      <div className="space-y-4 px-4 py-4">

        {/* -------- 顶部总资产卡片（深色渐变背景） -------- */}
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-[#111827] via-[#7f1d1d] to-[#f97316] p-0 text-white shadow-[0_24px_60px_rgba(17,24,39,0.22)]">
          <div className="relative px-5 py-6">
            {/* 装饰性径向渐变背景 */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.14),transparent_30%)]" />
            <div className="relative">
              {/* 标题 */}
              <div className="flex items-center gap-2 text-sm text-white/75">
                <TrendingUp size={16} />
                <span>累计权益总览</span>
              </div>
              {/* 总资产金额 */}
              <div className="mt-4 flex items-end gap-2">
                <span className="text-[38px] font-semibold leading-none">
                  {formatMoney(accountOverview.balance.totalAssets)}
                </span>
                <span className="pb-1 text-sm text-white/80">总资产</span>
              </div>
              {/* 说明文字 */}
              <p className="mt-2 text-xs leading-5 text-white/70">
                汇总专项金、可提现余额、消费金与确权金，算力单独展示。
              </p>

              {/* 收益统计双列卡片 */}
              <div className="mt-6 grid grid-cols-2 gap-3">
                {/* 累计可提现收益 */}
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                  <div className="text-xs text-white/70">累计可提现收益</div>
                  <div className="mt-2 text-2xl font-semibold">
                    {formatMoney(accountOverview.income.totalIncomeWithdrawable)}
                  </div>
                </div>
                {/* 累计消费金收益 */}
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

        {/* -------- 账户权益卡片 -------- */}
        <Card className="border border-border-light bg-bg-card">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-text-main">账户权益</h2>
              <p className="mt-1 text-xs text-text-aux">当前账户各类资金与权益余额</p>
            </div>
            {/* 实时更新标签 */}
            <div className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-500 dark:bg-red-500/12 dark:text-red-300">
              实时更新
            </div>
          </div>

          {/* 资产指标网格（2 列） */}
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

        {/* -------- 藏品资产卡片 -------- */}
        <Card className="border border-border-light bg-bg-card">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-text-main">藏品资产</h2>
              <p className="mt-1 text-xs text-text-aux">累计藏品价值与当前持仓情况</p>
            </div>
            {/* 藏品统计标签 */}
            <div className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-600 dark:bg-amber-500/12 dark:text-amber-300">
              藏品统计
            </div>
          </div>

          {/* 藏品总价值 */}
          <div className="mt-4 rounded-[24px] border border-border-light bg-bg-base p-5">
            <div className="text-sm text-text-sub">藏品总价值</div>
            <div className="mt-2 text-3xl font-semibold text-text-main">
              {formatMoney(accountOverview.collection.totalValue)}
            </div>
            <div className="mt-1 text-xs text-text-aux">
              覆盖持有、寄售、售出与矿机相关统计
            </div>
          </div>

          {/* 藏品分类指标网格（2 列） */}
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

  // ======================== JSX 渲染 ========================
  return (
    // 页面容器：全屏布局
    <div className="flex flex-1 flex-col overflow-hidden bg-bg-base">
      {/* 顶部导航栏 */}
      <PageHeader
        title="累计权益"
        onBack={() => goBackOr('user')}
        offline={isOffline}
        onRefresh={refreshStatus}
      />

      {/* 下拉刷新容器 */}
      <PullToRefreshContainer
        onRefresh={handleRefresh}
        disabled={isOffline}
      >
        {/* 可滚动内容区域 */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto no-scrollbar pb-6">
          {renderContent()}
        </div>
      </PullToRefreshContainer>
    </div>
  );
};
