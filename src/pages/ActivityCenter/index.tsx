/**
 * @file ActivityCenter/index.tsx - 活动中心页面
 * @description 展示当前可参与的奖励活动列表，支持查看活动详情、奖励信息，
 *              以及跳转到对应的活动落地页（首购、邀请、充值等）。
 */

// ======================== 依赖导入 ========================

import { ArrowUpRight, Gift, ImageOff, Sparkles } from 'lucide-react'; // 图标组件
import { useCallback, useRef } from 'react'; // React 核心 Hook
import {
  activityCenterApi, // 活动中心 API
  type ActivityCenterItem, // 活动项类型
  type ActivityCenterReward, // 活动奖励类型
} from '../../api';
import { getErrorMessage } from '../../api/core/errors'; // 统一错误信息提取
import { resolveUploadUrl } from '../../api/modules/upload'; // 上传文件 URL 解析
import { PageHeader } from '../../components/layout/PageHeader'; // 页面顶部导航栏
import { EmptyState } from '../../components/ui/EmptyState'; // 空状态提示组件
import { ErrorState } from '../../components/ui/ErrorState'; // 错误状态提示组件
import { useFeedback } from '../../components/ui/FeedbackProvider'; // 全局 Toast 反馈 Hook
import { PullToRefreshContainer } from '../../components/ui/PullToRefreshContainer'; // 下拉刷新容器
import { useNetworkStatus } from '../../hooks/useNetworkStatus'; // 网络状态检测 Hook
import { useRequest } from '../../hooks/useRequest'; // 通用异步请求 Hook
import { useRouteScrollRestoration } from '../../hooks/useRouteScrollRestoration'; // 滚动位置恢复 Hook
import { useAppNavigate } from '../../lib/navigation'; // 应用导航 Hook

// ======================== 常量 ========================

/** 旧版活动小程序路径到 Web 路由的映射表 */
const LEGACY_ACTIVITY_ROUTE_MAP: Record<string, string> = {
  '/pages/market/index': '/store',
  '/pages/recharge/index': '/recharge',
  '/pages/user/poster': '/invite',
};

// ======================== 工具函数 ========================

/**
 * 格式化数值：保留有效小数位，去除末尾多余零
 * @param value - 要格式化的数值
 * @returns 格式化后的字符串
 */
function formatValue(value: number): string {
  if (!Number.isFinite(value)) {
    return '0';
  }

  return value.toFixed(2).replace(/\.?0+$/, '');
}

/**
 * 格式化奖励信息为可读文本
 * @param reward - 奖励对象
 * @returns 格式化后的奖励文本，如 "消费金 100" 或 "50%"
 */
function formatReward(reward: ActivityCenterReward): string {
  const suffix = reward.type === 'power_rate' ? '%' : '';
  const value = formatValue(reward.value);

  if (!reward.name) {
    return `${value}${suffix}`;
  }

  return `${reward.name} ${value}${suffix}`.trim();
}

/**
 * 根据奖励类型返回对应的样式类名
 * @param type - 奖励类型（score=消费金, power=算力, power_rate=算力比率）
 * @returns Tailwind CSS 类名字符串
 */
function getRewardClassName(type: string): string {
  switch (type) {
    case 'score': // 消费金 - 琥珀色
      return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:border-amber-500/30';
    case 'power': // 算力 - 翠绿色
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-200 dark:border-emerald-500/30';
    case 'power_rate': // 算力比率 - 天蓝色
      return 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/15 dark:text-sky-200 dark:border-sky-500/30';
    default: // 默认样式
      return 'bg-bg-base text-text-sub border-border-light';
  }
}

/**
 * 解析活动项对应的跳转路由
 * 优先查找旧版路径映射，其次根据 key 匹配内置路由
 * @param item - 活动项数据
 * @returns 路由路径，无法解析时返回 null
 */
function resolveActivityTarget(item: ActivityCenterItem): string | null {
  if (LEGACY_ACTIVITY_ROUTE_MAP[item.app_path]) {
    return LEGACY_ACTIVITY_ROUTE_MAP[item.app_path];
  }

  switch (item.key) {
    case 'first_trade': // 首购 → 商城
      return '/store';
    case 'invite_reward': // 邀请奖励 → 邀请页
    case 'sub_trade': // 下线交易 → 邀请页
      return '/invite';
    case 'recharge': // 充值 → 充值页
      return '/recharge';
    default:
      return null;
  }
}

// ======================== 子组件 ========================

/**
 * ActivityCard - 单个活动卡片组件
 * 展示活动标题、描述、奖励标签、完成状态以及操作按钮
 */
function ActivityCard({
  item,
  onAction,
}: {
  item: ActivityCenterItem;
  onAction: (item: ActivityCenterItem) => void;
}) {
  const actionTarget = resolveActivityTarget(item); // 解析跳转目标
  const isDone = item.status === 1; // 是否已完成
  const isUnsupported = !isDone && actionTarget == null; // 是否暂未接入

  return (
    <article className="overflow-hidden rounded-[28px] border border-white/70 bg-white/95 shadow-[0_16px_40px_rgba(145,84,36,0.08)] backdrop-blur dark:border-gray-700/60 dark:bg-gray-900/95 dark:shadow-[0_20px_48px_rgba(0,0,0,0.28)]">
      <div className="relative overflow-hidden p-5">
        {/* 装饰性模糊背景光斑 */}
        <div className="absolute top-0 right-0 h-28 w-28 rounded-full bg-orange-200/20 blur-2xl dark:bg-orange-400/10" />
        <div className="flex items-start gap-4">
          {/* 活动图标 */}
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

          {/* 活动信息 */}
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-start justify-between gap-3">
              <div className="min-w-0">
                {/* 活动标题 */}
                <h2 className="text-lg font-semibold text-text-main">{item.title || '活动'}</h2>
                {/* 活动描述 */}
                <p className="mt-1 text-sm leading-6 text-text-sub">{item.desc || '暂无活动说明'}</p>
              </div>
              {/* 状态标签：已完成 / 待接入 / 进行中 */}
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

            {/* 奖励标签列表 */}
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

        {/* 操作区域 */}
        <div className="mt-5 flex items-center justify-between rounded-[22px] bg-[#fff8f3] px-4 py-3 dark:bg-orange-500/10">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-[#cc8a5d] dark:text-orange-200/80">Action</div>
            <div className="mt-1 text-sm font-medium text-[#7d4a28] dark:text-orange-100">
              {isUnsupported && !isDone ? '当前活动落地页暂未接入' : '按活动规则完成后自动发放奖励'}
            </div>
          </div>
          {/* 操作按钮：已完成灰色 / 待接入琥珀色 / 可参与渐变色 */}
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

/** 活动中心骨架屏：数据加载中时展示的占位 UI（3 个卡片骨架） */
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

// ======================== 页面组件 ========================

/**
 * ActivityCenterPage - 活动中心页面
 *
 * 功能概览：
 * 1. 顶部渐变横幅展示进行中/已完成活动数量统计
 * 2. 活动列表：展示每个活动的标题、描述、奖励标签和操作按钮
 * 3. 点击活动按钮跳转到对应的落地页（商城/邀请/充值等）
 * 4. 支持下拉刷新、骨架屏加载、错误/空状态提示
 */
export function ActivityCenterPage() {
  // ---------- 导航 & 状态 ----------
  const { goBackOr, navigate } = useAppNavigate(); // 页面导航
  const { isOffline, refreshStatus } = useNetworkStatus(); // 网络状态
  const { showToast } = useFeedback(); // Toast 提示
  const scrollContainerRef = useRef<HTMLDivElement | null>(null); // 滚动容器引用

  // ---------- 请求活动列表 ----------
  const {
    data, // 活动列表数据
    error, // 请求错误
    loading, // 是否加载中
    reload, // 重新请求
  } = useRequest((signal) => activityCenterApi.getList(signal), {
    cacheKey: 'activity-center:list', // 缓存键
  });

  /** 活动列表 */
  const activityList = data?.list ?? [];
  /** 进行中的活动数量 */
  const activeCount = activityList.filter((item) => item.status !== 1).length;
  /** 已完成的活动数量 */
  const completedCount = activityList.length - activeCount;

  // ---------- 滚动位置恢复 ----------
  useRouteScrollRestoration({
    containerRef: scrollContainerRef,
    namespace: 'activity-center-page',
    restoreDeps: [loading, activityList.length],
    restoreWhen: !loading && activityList.length > 0,
  });

  /** 下拉刷新处理 */
  const handleRefresh = useCallback(async () => {
    refreshStatus();
    await reload().catch(() => undefined);
  }, [refreshStatus, reload]);

  /**
   * 活动操作按钮点击处理
   * 已完成则忽略，无跳转目标则提示暂未接入，否则导航到目标页
   */
  const handleAction = useCallback(
    (item: ActivityCenterItem) => {
      // 已完成不做处理
      if (item.status === 1) {
        return;
      }

      // 解析跳转目标
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

  // ---------- 内容渲染函数 ----------
  const renderContent = () => {
    // 加载中且无缓存 → 骨架屏
    if (loading && activityList.length === 0) {
      return <ActivityCenterSkeleton />;
    }

    // 有错误且无缓存 → 错误提示
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

    // 无活动 → 空状态
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

    // 正常渲染活动卡片列表
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

  // ======================== JSX 渲染 ========================
  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-[#f8f1e8] dark:bg-gray-950">
      {/* 顶部导航栏：标题 + 活动总数标签 */}
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

      {/* 下拉刷新容器 */}
      <PullToRefreshContainer onRefresh={handleRefresh}>
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto no-scrollbar">

          {/* -------- 顶部统计横幅（深色渐变） -------- */}
          <div className="p-4 pb-3">
            <section className="relative overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,#20150f_0%,#8c4f25_48%,#ff8b42_100%)] p-5 text-white shadow-[0_20px_44px_rgba(140,79,37,0.28)]">
              {/* 装饰性模糊光斑 */}
              <div className="absolute -top-10 right-0 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-12 left-10 h-32 w-32 rounded-full bg-[#ffd2a3]/20 blur-3xl" />
              <div className="relative">
                {/* Activity Hub 标签 */}
                <div className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.26em] text-white/80">
                  Activity Hub
                </div>
                {/* 主标题 */}
                <h1 className="mt-4 text-[28px] font-semibold leading-tight">
                  统一查看当前奖励活动
                </h1>
                {/* 说明文字 */}
                <p className="mt-2 max-w-[280px] text-sm leading-6 text-white/78">
                  完成首购、邀请、充值等任务后，奖励按活动规则自动到账。
                </p>

                {/* 进行中 / 已完成 统计卡片 */}
                <div className="mt-6 grid grid-cols-2 gap-3">
                  {/* 进行中数量 */}
                  <div className="rounded-[22px] border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                    <div className="text-xs uppercase tracking-[0.2em] text-white/60">Ongoing</div>
                    <div className="mt-2 text-3xl font-semibold">{activeCount}</div>
                    <div className="mt-1 text-sm text-white/72">可继续参与</div>
                  </div>
                  {/* 已完成数量 */}
                  <div className="rounded-[22px] border border-white/10 bg-black/10 p-4 backdrop-blur-sm">
                    <div className="text-xs uppercase tracking-[0.2em] text-white/60">Done</div>
                    <div className="mt-2 text-3xl font-semibold">{completedCount}</div>
                    <div className="mt-1 text-sm text-white/72">已完成或达上限</div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* -------- 活动列表内容 -------- */}
          {renderContent()}
        </div>
      </PullToRefreshContainer>
    </div>
  );
}

export default ActivityCenterPage;
