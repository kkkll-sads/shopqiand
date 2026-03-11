/**
 * @file Billing/index.tsx - 资产明细页面
 * @description 账户资金流水记录，支持按账户类型/收支方向/关键词筛选，
 *              分月分组展示，无限滚动加载，点击查看流水详情。
 */

import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'; // React 核心 Hook 和类型
import {
  ChevronRight,
  Copy,
  Loader2,
  RefreshCcw,
  Search,
  Wallet,
  X,
} from 'lucide-react';
import {
  accountApi,
  type AccountLogFlowDirection,
  type AccountLogItem,
  type AccountLogList,
  type AccountLogType,
  type AccountMoneyLogDetail,
} from '../../api';
import { getErrorMessage } from '../../api/core/errors';
import { OfflineBanner } from '../../components/layout/OfflineBanner';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { PullToRefreshContainer } from '../../components/ui/PullToRefreshContainer';
import { Skeleton } from '../../components/ui/Skeleton';
import { useAuthSession } from '../../hooks/useAuthSession';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useRequest } from '../../hooks/useRequest';
import { useRouteScrollRestoration } from '../../hooks/useRouteScrollRestoration';
import { useSessionState } from '../../hooks/useSessionState';
import { useViewScrollSnapshot } from '../../hooks/useViewScrollSnapshot';
import { copyToClipboard } from '../../lib/clipboard';
import { useAppNavigate } from '../../lib/navigation';

/** 每页加载条数 */
const PAGE_SIZE = 20;

/** 收支方向筛选类型 */
type FlowFilter = 'all' | AccountLogFlowDirection;

/** 账户类型筛选选项（全部/专项金/可提现/确权金/待激活金/消费金/绿色算力/静态收益） */
const ACCOUNT_TYPE_OPTIONS: Array<{ key: AccountLogType; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'balance_available', label: '专项金' },
  { key: 'withdrawable_money', label: '可提现' },
  { key: 'service_fee_balance', label: '确权金' },
  { key: 'pending_activation_gold', label: '待激活金' },
  { key: 'score', label: '消费金' },
  { key: 'green_power', label: '绿色算力' },
  { key: 'static_income', label: '静态收益' },
];

/** 收支方向筛选选项（全部/收入/支出） */
const FLOW_OPTIONS: Array<{ key: FlowFilter; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'in', label: '收入' },
  { key: 'out', label: '支出' },
];

/** 账户类型名称映射 */
const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  balance_available: '专项金',
  green_power: '绿色算力',
  pending_activation_gold: '待激活确权金',
  score: '消费金',
  service_fee_balance: '确权金',
  static_income: '静态收益',
  withdrawable_money: '可提现收益',
};

/** 业务类型名称映射（流水类型的中文显示名） */
const BIZ_TYPE_LABELS: Record<string, string> = {
  balance_transfer: '余额划转',
  blind_box_diff_refund: '差价退款',
  blind_box_refund: '未中签退款',
  blind_box_reserve: '确权申请',
  consign_apply_fee: '寄售申请费',
  consign_buy: '寄售购买',
  consign_settle: '寄售结算',
  consign_settle_score: '寄售消费金结算',
  consignment_income: '寄售收益',
  first_trade_reward: '首单奖励',
  growth_rights_unlock: '成长权益解锁',
  matching_buy: '匹配购买',
  matching_commission: '撮合佣金',
  matching_fail_refund: '失败返还',
  matching_refund: '撮合退款',
  matching_seller_income: '寄售结算',
  membership_card_buy: '卡包购买',
  mining_dividend: '矿机分红',
  mixed_payment_cancel_compensation: '混合支付补偿',
  mixed_payment_cancel_power_refund: '混合支付算力退款',
  mixed_payment_cancel_refund: '混合支付退款',
  old_assets_unlock: '老资产解锁',
  questionnaire_reward: '问卷奖励',
  recharge: '充值',
  recharge_reward: '充值奖励',
  register_reward: '注册奖励',
  reservation_refund: '预约退款',
  rights_declaration_reward: '确权奖励',
  score_exchange: '消费金兑换',
  score_exchange_green_power: '消费金兑换算力',
  service_fee_recharge: '确权金充值',
  shop_order: '商城订单',
  shop_order_cancel_review: '商城订单取消退款',
  shop_order_pay: '商城订单支付',
  sign_in: '签到奖励',
  subordinate_first_trade_reward: '下级首单奖励',
  transfer: '余额划转',
  withdraw: '提现',
  withdraw_reject: '提现驳回退款',
};

/** 明细拆分字段名称映射 */
const BREAKDOWN_LABELS: Record<string, string> = {
  consume_amount: '消费金分配',
  income_amount: '收益分配',
  principal_amount: '本金分配',
};

/** 格式化金额数值 */
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

/** 格式化带符号的金额（+/-） */
function formatSignedMoney(value: number) {
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${formatMoney(value)}`;
}

/** 格式化账户类型标签 */
function formatAccountTypeLabel(type: string | undefined) {
  if (!type) {
    return '账户资金';
  }

  return ACCOUNT_TYPE_LABELS[type] || type;
}

/** 格式化业务类型标签 */
function formatBizTypeLabel(type: string | undefined) {
  if (!type) {
    return '资产明细';
  }

  return BIZ_TYPE_LABELS[type] || type;
}

/** 根据金额正负返回对应的样式类名 */
function getAmountClassName(amount: number) {
  if (amount > 0) {
    return 'text-green-600';
  }

  if (amount < 0) {
    return 'text-text-main';
  }

  return 'text-text-sub';
}

/** 从流水记录提取月份标签（用于分组显示） */
function getMonthLabel(item: AccountLogItem) {
  const timestamp = item.createTime;
  if (typeof timestamp === 'number' && Number.isFinite(timestamp) && timestamp > 0) {
    const date = new Date(timestamp > 1_000_000_000_000 ? timestamp : timestamp * 1000);
    if (!Number.isNaN(date.getTime())) {
      return `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, '0')}月`;
    }
  }

  const text = item.createTimeText?.trim();
  const matched = text?.match(/(\d{4})[-/.年](\d{1,2})/);
  if (matched) {
    return `${matched[1]}年${matched[2].padStart(2, '0')}月`;
  }

  return '最近';
}

/** 构建查询参数 */
function buildQueryParams(
  accountType: AccountLogType,
  flowFilter: FlowFilter,
  keyword: string,
  page: number,
) {
  return {
    bizType: undefined,
    endTime: undefined,
    flowDirection: flowFilter === 'all' ? undefined : flowFilter,
    keyword: keyword || undefined,
    limit: PAGE_SIZE,
    page,
    startTime: undefined,
    type: accountType === 'all' ? undefined : accountType,
  };
}

/** 构建明细拆分条目（用于详情页展示） */
function buildBreakdownEntries(breakdown: Record<string, unknown> | undefined) {
  if (!breakdown) {
    return [];
  }

  const entries: Array<{ key: string; label: string; value: string }> = [];
  const mergeParts =
    breakdown.merge_parts && typeof breakdown.merge_parts === 'object' && !Array.isArray(breakdown.merge_parts)
      ? (breakdown.merge_parts as Record<string, unknown>)
      : undefined;

  if (mergeParts) {
    Object.entries(mergeParts).forEach(([key, value]) => {
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        return;
      }

      entries.push({
        key: `merge_parts:${key}`,
        label: formatAccountTypeLabel(key),
        value: formatSignedMoney(value),
      });
    });
  }

  Object.entries(breakdown).forEach(([key, value]) => {
    if (value == null || value === '' || key === 'merge_parts' || key === 'merge_scene') {
      return;
    }

    if (key === 'merge_row_count') {
      const count = Number(value);
      if (Number.isFinite(count)) {
        entries.push({
          key,
          label: '合并流水',
          value: `${count} 笔`,
        });
      }
      return;
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      entries.push({
        key,
        label: BREAKDOWN_LABELS[key] || formatAccountTypeLabel(key),
        value: formatMoney(value),
      });
      return;
    }

    if (typeof value === 'string') {
      const nextValue = value.trim();
      if (!nextValue) {
        return;
      }

      entries.push({
        key,
        label: BREAKDOWN_LABELS[key] || formatAccountTypeLabel(key),
        value: nextValue,
      });
      return;
    }

    entries.push({
      key,
      label: BREAKDOWN_LABELS[key] || key.replace(/_/g, ' '),
      value: JSON.stringify(value),
    });
  });

  return entries;
}

/** 判断是否还有更多数据 */
function getNextHasMore(response: AccountLogList) {
  if (response.list.length === 0) {
    return false;
  }

  return response.currentPage * response.perPage < response.total;
}

/**
 * BillingPage - 资产明细页面
 * 功能：账户类型/收支方向/关键词筛选 → 分月分组流水列表 → 无限滚动 → 点击查看详情
 */
export function BillingPage() {
  const { goBack, goTo } = useAppNavigate();
  const { isAuthenticated } = useAuthSession();
  const { isOffline, refreshStatus } = useNetworkStatus();
  const { showToast } = useFeedback();
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const queryKeyRef = useRef('');

  const [accountType, setAccountType] = useSessionState<AccountLogType>(
    'billing-page:account-type',
    'all',
  );
  const [flowFilter, setFlowFilter] = useSessionState<FlowFilter>(
    'billing-page:flow-filter',
    'all',
  );
  const [draftKeyword, setDraftKeyword] = useState('');
  const [keyword, setKeyword] = useSessionState('billing-page:keyword', '');
  const [items, setItems] = useState<AccountLogItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [paginationNotice, setPaginationNotice] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AccountLogItem | null>(null);

  useEffect(() => {
    setDraftKeyword(keyword);
  }, [keyword]);

  const queryKey = `${accountType}:${flowFilter}:${keyword}`;

  useEffect(() => {
    queryKeyRef.current = queryKey;
    setItems([]);
    setPage(1);
    setHasMore(false);
    setLoadMoreError(null);
    setPaginationNotice(null);
  }, [queryKey]);

  const {
    data: firstPage,
    error: listError,
    loading: listLoading,
    reload: reloadList,
  } = useRequest(
    async (signal) => {
      const response = await accountApi.getAllLog(
        buildQueryParams(accountType, flowFilter, keyword, 1),
        { signal },
      );

      setItems(response.list);
      setPage(response.currentPage);
      setHasMore(getNextHasMore(response));
      setLoadMoreError(null);
      setPaginationNotice(null);

      return response;
    },
    {
      deps: [accountType, flowFilter, keyword, isAuthenticated],
      keepPreviousData: false,
      manual: !isAuthenticated,
    },
  );

  const {
    data: selectedDetail,
    error: detailError,
    loading: detailLoading,
    reload: reloadDetail,
    setData: setSelectedDetail,
  } = useRequest<AccountMoneyLogDetail | undefined>(
    (signal) =>
      selectedLog
        ? accountApi.getMoneyLogDetail(
            { flowNo: selectedLog.flowNo, id: selectedLog.id },
            { signal },
          )
        : Promise.resolve(undefined),
    {
      deps: [isAuthenticated, selectedLog?.flowNo, selectedLog?.id],
      keepPreviousData: false,
      manual: !isAuthenticated || !selectedLog,
    },
  );

  useEffect(() => {
    if (!selectedLog) {
      setSelectedDetail(undefined);
    }
  }, [selectedLog, setSelectedDetail]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || !isAuthenticated) {
      return;
    }

    const requestKey = queryKeyRef.current;
    const nextPage = page + 1;

    setLoadingMore(true);
    setLoadMoreError(null);

    try {
      const response = await accountApi.getAllLog(
        buildQueryParams(accountType, flowFilter, keyword, nextPage),
      );

      if (queryKeyRef.current !== requestKey) {
        return;
      }

      setItems((current) => [...current, ...response.list]);
      setPage(response.currentPage);
      setHasMore(getNextHasMore(response));

      if (response.list.length === 0) {
        setPaginationNotice('分页接口返回空页，已停止继续加载');
      }
    } catch (error) {
      if (queryKeyRef.current !== requestKey) {
        return;
      }

      setLoadMoreError(getErrorMessage(error));
    } finally {
      if (queryKeyRef.current === requestKey) {
        setLoadingMore(false);
      }
    }
  }, [accountType, flowFilter, hasMore, isAuthenticated, keyword, loadingMore, page]);

  useInfiniteScroll({
    disabled: Boolean(selectedLog) || isOffline || Boolean(loadMoreError) || Boolean(paginationNotice),
    hasMore,
    loading: loadingMore || listLoading,
    onLoadMore: loadMore,
    rootRef: scrollContainerRef,
    targetRef: loadMoreRef,
  });

  const logs = items;
  const total = firstPage?.total ?? items.length;
  const groupedLogs = useMemo(() => {
    const groups = new Map<string, AccountLogItem[]>();

    logs.forEach((item) => {
      const label = getMonthLabel(item);
      const group = groups.get(label) ?? [];
      group.push(item);
      groups.set(label, group);
    });

    return Array.from(groups.entries()).map(([label, rows]) => ({
      label,
      rows,
    }));
  }, [logs]);

  const detailBreakdownEntries = useMemo(() => {
    const source = {
      ...(selectedLog?.breakdown ?? {}),
      ...(selectedDetail?.breakdown ?? {}),
    } as Record<string, unknown>;

    return buildBreakdownEntries(Object.keys(source).length ? source : undefined);
  }, [selectedDetail?.breakdown, selectedLog?.breakdown]);

  useRouteScrollRestoration({
    containerRef: scrollContainerRef,
    enabled: isAuthenticated && !selectedLog,
    namespace: 'billing-page',
    restoreDeps: [accountType, flowFilter, keyword, logs.length, listLoading],
    restoreWhen: isAuthenticated && !selectedLog && !listLoading,
  });

  useViewScrollSnapshot({
    active: !selectedLog,
    containerRef: scrollContainerRef,
    enabled: isAuthenticated,
  });

  const handleRefresh = () => {
    refreshStatus();

    if (selectedLog) {
      return reloadDetail().catch(() => undefined) as Promise<unknown>;
    }

    return reloadList().catch(() => undefined) as Promise<unknown>;
  };

  const handleBack = () => {
    if (selectedLog) {
      setSelectedLog(null);
      return;
    }

    goBack();
  };

  const handleCopy = async (text: string | undefined, successMessage = '已复制') => {
    const nextValue = text?.trim();
    if (!nextValue) {
      return;
    }

    const ok = await copyToClipboard(nextValue);
    showToast({
      message: ok ? successMessage : '复制失败，请稍后重试',
      type: ok ? 'success' : 'error',
    });
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setKeyword(draftKeyword.trim());
  };

  const handleClearKeyword = () => {
    setDraftKeyword('');
    setKeyword('');
  };

  const renderHeader = () => (
    <PageHeader
      title={selectedLog ? '明细详情' : '资产明细'}
      onBack={handleBack}
      rightAction={
        !selectedLog ? (
          <button
            type="button"
            className="flex items-center text-sm text-text-sub active:opacity-70"
            onClick={() => goTo('recharge')}
          >
            <Wallet size={16} className="mr-1" />
            充值
          </button>
        ) : null
      }
    />
  );

  const renderFilters = () => {
    if (selectedLog) {
      return null;
    }

    return (
      <div className="shrink-0 border-b border-border-light bg-bg-card px-4 pb-4 pt-2">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-aux"
            />
            <input
              value={draftKeyword}
              onChange={(event) => setDraftKeyword(event.target.value)}
              placeholder="搜索备注或业务说明"
              className="h-11 w-full rounded-2xl border border-border-light bg-bg-base pl-10 pr-10 text-sm text-text-main outline-none placeholder:text-text-aux"
            />
            {draftKeyword ? (
              <button
                type="button"
                onClick={handleClearKeyword}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-aux"
                aria-label="清空搜索"
              >
                <X size={16} />
              </button>
            ) : null}
          </div>
          <button
            type="submit"
            className="h-11 shrink-0 whitespace-nowrap rounded-2xl bg-primary-start px-4 text-sm font-medium text-white"
          >
            搜索
          </button>
        </form>

        <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
          {ACCOUNT_TYPE_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setAccountType(option.key)}
              className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                accountType === option.key
                  ? 'bg-primary-start text-white'
                  : 'bg-bg-base text-text-sub'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
          {FLOW_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setFlowFilter(option.key)}
              className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                flowFilter === option.key
                  ? 'bg-red-50 text-primary-start ring-1 ring-primary-start/20 dark:bg-red-500/12 dark:text-red-300'
                  : 'bg-bg-base text-text-sub'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="mt-3 text-xs text-text-aux">共 {total} 条记录</div>
      </div>
    );
  };

  const renderListSkeleton = () => (
    <div className="space-y-6 p-4">
      {[1, 2].map((group) => (
        <div key={group} className="space-y-3">
          <Skeleton className="h-5 w-24" />
          <Card className="space-y-4 p-4">
            {[1, 2, 3].map((row) => (
              <div key={row} className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-40" />
                </div>
                <div className="space-y-2 text-right">
                  <Skeleton className="ml-auto h-4 w-16" />
                  <Skeleton className="ml-auto h-3 w-12" />
                </div>
              </div>
            ))}
          </Card>
        </div>
      ))}
    </div>
  );

  const renderLoadMore = () => {
    if (paginationNotice) {
      return <span className="text-amber-600">{paginationNotice}</span>;
    }

    if (loadingMore) {
      return (
        <span className="inline-flex items-center">
          <RefreshCcw size={14} className="mr-2 animate-spin" />
          加载中...
        </span>
      );
    }

    if (loadMoreError) {
      return (
        <button
          type="button"
          className="rounded-full border border-border-light px-4 py-2 text-text-main"
          onClick={() => void loadMore()}
        >
          加载失败，点击重试
        </button>
      );
    }

    if (hasMore) {
      return <span>继续下拉加载更多</span>;
    }

    if (logs.length > PAGE_SIZE) {
      return <span>没有更多了</span>;
    }

    return null;
  };

  const renderLogList = () => {
    if (listLoading && !logs.length) {
      return renderListSkeleton();
    }

    if (listError && !logs.length) {
      return (
        <ErrorState
          message={getErrorMessage(listError)}
          onRetry={() => void reloadList().catch(() => undefined)}
        />
      );
    }

    if (!logs.length) {
      return (
        <EmptyState
          message={keyword ? '没有找到匹配的资产记录' : '暂无资产明细记录'}
        />
      );
    }

    return (
      <div className="space-y-6 px-4 pb-10 pt-6">
        {groupedLogs.map((group) => (
          <div key={group.label}>
            <div className="mb-3 ml-1 text-base font-bold text-text-main">{group.label}</div>
            <Card className="overflow-hidden p-0">
              {group.rows.map((item, index) => (
                <button
                  key={`${item.id}-${item.flowNo ?? item.createTime ?? index}`}
                  type="button"
                  onClick={() => setSelectedLog(item)}
                  className={`flex w-full items-center justify-between px-4 py-3 text-left transition-colors active:bg-bg-base ${
                    index < group.rows.length - 1 ? 'border-b border-border-light' : ''
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-text-main">
                      {formatBizTypeLabel(item.bizType)}
                    </div>
                    <div className="mt-1 line-clamp-2 text-sm text-text-sub">
                      {item.memo || formatAccountTypeLabel(item.accountType)}
                    </div>
                    <div className="mt-1 truncate text-xs text-text-aux">
                      {item.createTimeText || item.flowNo || `记录 #${item.id}`}
                    </div>
                  </div>
                  <div className="ml-3 flex shrink-0 items-center">
                    <div className="mr-2 text-right">
                      <div className={`text-sm font-semibold ${getAmountClassName(item.amount)}`}>
                        {formatSignedMoney(item.amount)}
                      </div>
                      <div className="mt-1 text-xs text-text-aux">
                        {formatAccountTypeLabel(item.accountType)}
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-text-aux" />
                  </div>
                </button>
              ))}
            </Card>
          </div>
        ))}

        <div ref={loadMoreRef} className="py-4 text-center text-sm text-text-aux">
          {renderLoadMore()}
        </div>
      </div>
    );
  };

  const renderDetailRow = (
    label: string,
    value: string | undefined,
    options: { copyable?: boolean; successMessage?: string } = {},
  ) => {
    const content = value?.trim() || '--';

    return (
      <div className="flex items-start justify-between gap-4">
        <span className="shrink-0 text-sm text-text-sub">{label}</span>
        <div className="flex min-w-0 items-center text-right">
          <span className="break-all text-sm text-text-main">{content}</span>
          {options.copyable && content !== '--' ? (
            <button
              type="button"
              onClick={() => void handleCopy(content, options.successMessage)}
              className="ml-2 shrink-0 text-text-aux active:opacity-70"
            >
              <Copy size={14} />
            </button>
          ) : null}
        </div>
      </div>
    );
  };

  const renderDetail = () => {
    if (detailLoading && !selectedDetail) {
      return (
        <div className="space-y-4 p-4">
          <Card className="space-y-4 p-6">
            <div className="flex flex-col items-center">
              <Skeleton className="mb-2 h-4 w-20" />
              <Skeleton className="h-10 w-36" />
            </div>
            {[1, 2, 3, 4].map((row) => (
              <Skeleton key={row} className="h-4 w-full" />
            ))}
          </Card>
        </div>
      );
    }

    if (detailError && !selectedDetail) {
      return (
        <ErrorState
          message={getErrorMessage(detailError)}
          onRetry={() => void reloadDetail().catch(() => undefined)}
        />
      );
    }

    if (!selectedLog) {
      return null;
    }

    const detail = selectedDetail;
    const titleSnapshot = detail?.titleSnapshot || selectedLog.titleSnapshot;
    const imageSnapshot = detail?.imageSnapshot || selectedLog.imageSnapshot;
    const userCollectionId = detail?.userCollectionId;
    const itemId = detail?.itemId;

    return (
      <div className="space-y-4 p-4 pb-10">
        <Card className="p-6">
          <div className="mb-6 flex flex-col items-center">
            <div className="mb-2 text-sm text-text-sub">
              {formatBizTypeLabel(detail?.bizType || selectedLog.bizType)}
            </div>
            <div className={`text-4xl font-bold ${getAmountClassName(detail?.amount ?? selectedLog.amount)}`}>
              {formatSignedMoney(detail?.amount ?? selectedLog.amount)}
            </div>
            <div className="mt-2 text-sm text-text-aux">
              {formatAccountTypeLabel(detail?.accountType || selectedLog.accountType)}
            </div>
          </div>

          <div className="space-y-4">
            {renderDetailRow('账户类型', formatAccountTypeLabel(detail?.accountType || selectedLog.accountType))}
            {renderDetailRow('业务类型', formatBizTypeLabel(detail?.bizType || selectedLog.bizType))}
            {renderDetailRow('创建时间', detail?.createTimeText || selectedLog.createTimeText)}
            {renderDetailRow('变动前金额', formatMoney(detail?.beforeValue))}
            {renderDetailRow('变动后金额', formatMoney(detail?.afterValue))}
            {renderDetailRow('备注说明', detail?.memo || selectedLog.memo)}
            {renderDetailRow('流水号', detail?.flowNo || selectedLog.flowNo, {
              copyable: true,
              successMessage: '流水号已复制',
            })}
            {renderDetailRow('批次号', detail?.batchNo || selectedLog.batchNo, {
              copyable: true,
              successMessage: '批次号已复制',
            })}
            {renderDetailRow('业务ID', detail?.bizId || selectedLog.bizId)}
          </div>
        </Card>

        {titleSnapshot || imageSnapshot ? (
          <Card className="overflow-hidden p-0">
            <div className="border-b border-border-light px-4 py-3 text-sm font-medium text-text-main">
              关联资产
            </div>
            <div className="flex items-center p-4">
              {imageSnapshot ? (
                <img
                  src={imageSnapshot}
                  alt={titleSnapshot || '关联资产'}
                  className="mr-3 h-14 w-14 rounded-2xl object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : null}
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-text-main">
                  {titleSnapshot || '未命名资产'}
                </div>
                <div className="mt-1 text-sm text-text-sub">
                  藏品 ID：{userCollectionId ?? '--'} / 商品 ID：{itemId ?? '--'}
                </div>
              </div>
            </div>
          </Card>
        ) : null}

        {detailBreakdownEntries.length ? (
          <Card className="p-4">
            <div className="mb-3 text-sm font-medium text-text-main">资金结构</div>
            <div className="space-y-3">
              {detailBreakdownEntries.map((entry) => (
                <div key={entry.key} className="flex items-center justify-between gap-4">
                  <span className="text-sm text-text-sub">{entry.label}</span>
                  <span className="break-all text-right text-sm text-text-main">{entry.value}</span>
                </div>
              ))}
            </div>
          </Card>
        ) : null}
      </div>
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="flex h-full flex-1 flex-col bg-bg-base">
        {renderHeader()}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto no-scrollbar px-4">
          <EmptyState
            message="登录后查看资产明细"
            actionText="去登录"
            actionVariant="primary"
            onAction={() => goTo('login')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-1 flex-col bg-bg-base">
      {isOffline ? (
        <OfflineBanner onAction={handleRefresh} className="absolute top-12 right-0 left-0 z-50" />
      ) : null}

      {renderHeader()}
      {renderFilters()}

      <PullToRefreshContainer onRefresh={handleRefresh} disabled={isOffline}>
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto no-scrollbar">
          {selectedLog ? renderDetail() : renderLogList()}
        </div>
      </PullToRefreshContainer>

      {detailLoading && selectedDetail ? (
        <div className="pointer-events-none absolute right-4 bottom-4 flex items-center rounded-full bg-gray-900/85 px-3 py-2 text-sm text-white shadow-sm">
          <Loader2 size={14} className="mr-2 animate-spin" />
          加载详情中...
        </div>
      ) : null}
    </div>
  );
}

export default BillingPage;
