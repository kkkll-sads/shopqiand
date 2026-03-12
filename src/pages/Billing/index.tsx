/**
 * @file Billing/index.tsx - 资产明细页面
 * @description 账户资金流水记录，支持按账户类型/收支方向/关键词筛选，
 *              分月分组展示，无限滚动加载，点击查看流水详情。
 */

import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'; // React 核心 Hook 和类型
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronRight,
  Clock3,
  Copy,
  FileText,
  Loader2,
  MoveRight,
  RefreshCcw,
  Search,
  Wallet,
  X,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import {
  accountApi,
  type AccountLogFlowDirection,
  type AccountLogItem,
  type AccountLogList,
  type AccountLogType,
  type AccountLogViewMode,
  type AccountMoneyLogDetail,
} from '../../api';
import { getErrorMessage } from '../../api/core/errors';
import { OfflineBanner } from '../../components/layout/OfflineBanner';
import { WalletPageHeader } from '../../components/layout/WalletPageHeader';
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
import { getBillingPath, getBillingSceneConfig, resolveBillingScene } from '../../lib/billing';
import { copyToClipboard } from '../../lib/clipboard';
import { useAppNavigate } from '../../lib/navigation';

/** 每页加载条数 */
const PAGE_SIZE = 20;

/** 收支方向筛选类型 */
type FlowFilter = 'all' | AccountLogFlowDirection;

type BillingCategorySection = 'quick' | 'account' | 'business';

interface BillingCategoryOption {
  key: string;
  label: string;
  section: BillingCategorySection;
}

/** 账户类型筛选选项（全部/供应链专项金/可调度收益/确权金/待激活确权金/消费金/绿色算力/静态收益） */
const ACCOUNT_TYPE_OPTIONS: Array<{ key: AccountLogType; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'balance_available', label: '供应链专项金' },
  { key: 'withdrawable_money', label: '可调度收益' },
  { key: 'service_fee_balance', label: '确权金' },
  { key: 'pending_activation_gold', label: '待激活确权金' },
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

/** 流水视图模式（合并流水 / 正常流水） */
const LOG_VIEW_MODE_OPTIONS: Array<{ key: AccountLogViewMode; label: string }> = [
  { key: 'merged', label: '合并流水' },
  { key: 'normal', label: '正常流水' },
];

/** 账户类型名称映射 */
const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  balance_available: '供应链专项金',
  green_power: '绿色算力',
  pending_activation_gold: '待激活确权金',
  score: '消费金',
  service_fee_balance: '确权金',
  static_income: '静态收益',
  withdrawable_money: '可调度收益',
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

const RECORD_CATEGORY_BIZ_TYPES = {
  consignment_record: { label: '寄售记录', bizType: 'matching_seller_income' },
  rights_record: { label: '确权记录', bizType: 'blind_box_reserve' },
  transfer_record: { label: '划转记录', bizType: 'balance_transfer' },
  recharge_record: { label: '充值记录', bizType: 'recharge' },
  service_fee_recharge_record: { label: '确权金充值', bizType: 'service_fee_recharge' },
  withdraw_record: { label: '提现记录', bizType: 'withdraw' },
  mining_dividend_record: { label: '矿机分红', bizType: 'mining_dividend' },
} as const;

type BillingRecordCategory = keyof typeof RECORD_CATEGORY_BIZ_TYPES;

const BILLING_CATEGORY_SECTION_LABELS: Record<BillingCategorySection, string> = {
  account: '按账户筛选',
  business: '按业务筛选',
  quick: '常用分类',
};

const ACCOUNT_CATEGORY_OPTIONS: BillingCategoryOption[] = ACCOUNT_TYPE_OPTIONS.filter((option) => option.key !== 'all').map(
  (option) => ({
    key: option.key,
    label: option.label,
    section: 'account',
  }),
);

const ALL_BILLING_CATEGORY_OPTIONS: BillingCategoryOption[] = [
  { key: 'all', label: '全部分类', section: 'quick' },
  ...Object.entries(RECORD_CATEGORY_BIZ_TYPES).map(([key, config]) => ({
    key,
    label: config.label,
    section: 'quick' as const,
  })),
  ...ACCOUNT_CATEGORY_OPTIONS,
  ...Object.entries(BIZ_TYPE_LABELS).map(([key, label]) => ({
    key,
    label,
    section: 'business' as const,
  })),
];

const ACCOUNT_CATEGORY_KEY_SET = new Set(ACCOUNT_CATEGORY_OPTIONS.map((option) => option.key));

function getBillingCategoryOptions(sceneBizType?: string): BillingCategoryOption[] {
  if (sceneBizType) {
    return [{ key: 'all', label: '全部账户', section: 'account' }, ...ACCOUNT_CATEGORY_OPTIONS];
  }

  return ALL_BILLING_CATEGORY_OPTIONS;
}

function resolveBillingCategoryQuery(category: string, sceneBizType?: string) {
  const query: { bizType?: string; type?: AccountLogType } = {};

  if (sceneBizType) {
    query.bizType = sceneBizType;
  }

  if (!category || category === 'all') {
    return query;
  }

  if (!sceneBizType && category in RECORD_CATEGORY_BIZ_TYPES) {
    query.bizType = RECORD_CATEGORY_BIZ_TYPES[category as BillingRecordCategory].bizType;
    return query;
  }

  if (!sceneBizType && category in BIZ_TYPE_LABELS) {
    query.bizType = category;
    return query;
  }

  if (ACCOUNT_CATEGORY_KEY_SET.has(category)) {
    query.type = category as AccountLogType;
  }

  return query;
}

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
    return 'text-primary-start';
  }

  return 'text-text-sub';
}

function getAccountTone(type: string | undefined) {
  switch (type) {
    case 'withdrawable_money':
      return {
        accentClassName: 'from-emerald-500/16 via-emerald-400/6 to-transparent',
        badgeClassName:
          'bg-emerald-500/12 text-emerald-700 ring-1 ring-emerald-500/12 dark:bg-emerald-500/16 dark:text-emerald-300',
        iconClassName:
          'bg-[linear-gradient(145deg,rgba(16,185,129,0.16),rgba(255,255,255,0.98))] text-emerald-600 shadow-[0_12px_30px_rgba(16,185,129,0.18)]',
      };
    case 'service_fee_balance':
      return {
        accentClassName: 'from-violet-500/18 via-fuchsia-500/6 to-transparent',
        badgeClassName:
          'bg-violet-500/12 text-violet-700 ring-1 ring-violet-500/12 dark:bg-violet-500/16 dark:text-violet-300',
        iconClassName:
          'bg-[linear-gradient(145deg,rgba(139,92,246,0.16),rgba(255,255,255,0.98))] text-violet-600 shadow-[0_12px_30px_rgba(139,92,246,0.2)]',
      };
    case 'score':
      return {
        accentClassName: 'from-sky-500/16 via-cyan-400/6 to-transparent',
        badgeClassName:
          'bg-sky-500/12 text-sky-700 ring-1 ring-sky-500/12 dark:bg-sky-500/16 dark:text-sky-300',
        iconClassName:
          'bg-[linear-gradient(145deg,rgba(14,165,233,0.15),rgba(255,255,255,0.98))] text-sky-600 shadow-[0_12px_30px_rgba(14,165,233,0.2)]',
      };
    case 'green_power':
      return {
        accentClassName: 'from-lime-500/20 via-emerald-400/6 to-transparent',
        badgeClassName:
          'bg-lime-500/14 text-lime-700 ring-1 ring-lime-500/14 dark:bg-lime-500/16 dark:text-lime-300',
        iconClassName:
          'bg-[linear-gradient(145deg,rgba(132,204,22,0.18),rgba(255,255,255,0.98))] text-lime-700 shadow-[0_12px_30px_rgba(132,204,22,0.2)]',
      };
    default:
      return {
        accentClassName: 'from-primary-start/18 via-primary-start/5 to-transparent',
        badgeClassName:
          'bg-primary-start/10 text-primary-start ring-1 ring-primary-start/10 dark:bg-primary-start/16 dark:text-red-300',
        iconClassName:
          'bg-[linear-gradient(145deg,rgba(233,59,59,0.15),rgba(255,255,255,0.98))] text-primary-start shadow-[0_12px_30px_rgba(233,59,59,0.18)]',
      };
  }
}

function getFlowMeta(amount: number) {
  if (amount > 0) {
    return {
      badgeClassName:
        'bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/12 dark:bg-emerald-500/16 dark:text-emerald-300',
      icon: ArrowDownLeft,
      label: '收入',
    };
  }

  if (amount < 0) {
    return {
      badgeClassName:
        'bg-primary-start/10 text-primary-start ring-1 ring-primary-start/12 dark:bg-primary-start/16 dark:text-red-300',
      icon: ArrowUpRight,
      label: '支出',
    };
  }

  return {
    badgeClassName:
      'bg-slate-500/10 text-slate-600 ring-1 ring-slate-500/12 dark:bg-slate-500/16 dark:text-slate-300',
    icon: MoveRight,
    label: '平账',
  };
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
  viewMode: AccountLogViewMode,
  categoryQuery: { bizType?: string; type?: AccountLogType },
  flowFilter: FlowFilter,
  keyword: string,
  page: number,
) {
  return {
    bizType: categoryQuery.bizType,
    endTime: undefined,
    flowDirection: flowFilter === 'all' ? undefined : flowFilter,
    keyword: keyword || undefined,
    limit: PAGE_SIZE,
    page,
    startTime: undefined,
    type: categoryQuery.type,
    viewMode,
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
  const { goBack, goTo, navigate } = useAppNavigate();
  const { isAuthenticated } = useAuthSession();
  const { isOffline, refreshStatus } = useNetworkStatus();
  const { showToast } = useFeedback();
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const queryKeyRef = useRef('');
  const [searchParams] = useSearchParams();
  const scene = resolveBillingScene(searchParams.get('scene'));
  const sceneConfig = getBillingSceneConfig(scene);
  const sessionNamespace = scene === 'all' ? 'billing-page' : `billing-page:${scene}`;

  const [category, setCategory] = useSessionState<string>(
    `${sessionNamespace}:category`,
    'all',
  );
  const [viewMode, setViewMode] = useSessionState<AccountLogViewMode>(
    `${sessionNamespace}:view-mode`,
    'merged',
  );
  const [flowFilter, setFlowFilter] = useSessionState<FlowFilter>(
    `${sessionNamespace}:flow-filter`,
    'all',
  );
  const [draftKeyword, setDraftKeyword] = useState('');
  const [keyword, setKeyword] = useSessionState(`${sessionNamespace}:keyword`, '');
  const [items, setItems] = useState<AccountLogItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [paginationNotice, setPaginationNotice] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AccountLogItem | null>(null);
  const [categoryPanelOpen, setCategoryPanelOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const categoryOptions = useMemo(() => getBillingCategoryOptions(sceneConfig.bizType), [sceneConfig.bizType]);
  const selectedCategoryQuery = useMemo(
    () => resolveBillingCategoryQuery(category, sceneConfig.bizType),
    [category, sceneConfig.bizType],
  );
  const selectedCategoryLabel = useMemo(
    () => categoryOptions.find((option) => option.key === category)?.label ?? categoryOptions[0]?.label ?? '全部分类',
    [category, categoryOptions],
  );
  const filteredCategoryOptions = useMemo(() => {
    const keyword = categorySearch.trim().toLowerCase();
    if (!keyword) {
      return categoryOptions;
    }

    return categoryOptions.filter(
      (option) => option.label.toLowerCase().includes(keyword) || option.key.toLowerCase().includes(keyword),
    );
  }, [categoryOptions, categorySearch]);
  const groupedCategoryOptions = useMemo(() => {
    const groups = new Map<BillingCategorySection, BillingCategoryOption[]>();
    filteredCategoryOptions.forEach((option) => {
      const current = groups.get(option.section) ?? [];
      current.push(option);
      groups.set(option.section, current);
    });

    return Array.from(groups.entries()).map(([section, options]) => ({
      options,
      section,
    }));
  }, [filteredCategoryOptions]);

  useEffect(() => {
    setDraftKeyword(keyword);
  }, [keyword]);

  useEffect(() => {
    if (!categoryOptions.some((option) => option.key === category)) {
      setCategory('all');
    }
  }, [category, categoryOptions, setCategory]);

  const queryKey = `${scene}:${viewMode}:${category}:${flowFilter}:${keyword}`;

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
      const response = await accountApi.getLogList(
        buildQueryParams(viewMode, selectedCategoryQuery, flowFilter, keyword, 1),
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
      deps: [category, flowFilter, isAuthenticated, keyword, selectedCategoryQuery.bizType, selectedCategoryQuery.type, viewMode],
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
            {
              flowNo: selectedLog.flowNo,
              id: selectedLog.id,
              mergeKey: selectedLog.mergeKey,
              viewMode: selectedLog.isMerged ? 'merged' : 'normal',
            },
            { signal },
          )
        : Promise.resolve(undefined),
    {
      deps: [isAuthenticated, selectedLog?.flowNo, selectedLog?.id, selectedLog?.mergeKey, selectedLog?.isMerged],
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
      const response = await accountApi.getLogList(
        buildQueryParams(viewMode, selectedCategoryQuery, flowFilter, keyword, nextPage),
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
  }, [category, flowFilter, hasMore, isAuthenticated, keyword, loadingMore, page, selectedCategoryQuery, viewMode]);

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
    namespace: `${sessionNamespace}:scroll`,
    restoreDeps: [category, flowFilter, keyword, logs.length, listLoading, viewMode],
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

  const closeCategoryPanel = () => {
    setCategoryPanelOpen(false);
    setCategorySearch('');
  };

  const handleCategorySelect = (nextCategory: string) => {
    setCategory(nextCategory);
    closeCategoryPanel();
  };

  const renderHeader = () => (
    <WalletPageHeader
      title={selectedLog ? '明细详情' : sceneConfig.title}
      onBack={handleBack}
      action={
        selectedLog
          ? undefined
          : scene === 'all'
            ? {
                icon: Wallet,
                label: '去充值',
                onClick: () => goTo('recharge'),
              }
            : {
                icon: FileText,
                label: '全部明细',
                onClick: () => navigate(getBillingPath('all')),
              }
      }
    />
  );

  const renderFilters = () => {
    if (selectedLog) {
      return null;
    }

    return (
      <div className="z-10 shrink-0 border-b border-border-light bg-bg-card px-4 pb-4 pt-2">
        {scene !== 'all' ? (
          <div className="mb-4 rounded-2xl border border-primary-start/12 bg-primary-start/[0.05] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-text-main">{sceneConfig.title}</div>
                <div className="mt-1 text-xs leading-5 text-text-sub">{sceneConfig.intro}</div>
              </div>
              <button
                type="button"
                onClick={() => navigate(getBillingPath('all'))}
                className="shrink-0 rounded-full bg-bg-card px-3 py-1.5 text-xs font-medium text-primary-start shadow-soft active:opacity-70"
              >
                查看全部
              </button>
            </div>
          </div>
        ) : null}

        <form onSubmit={handleSearchSubmit} className="flex h-auto shrink-0 gap-2">
          <div className="relative flex h-11 flex-1 items-center overflow-hidden">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-aux"
            />
            <input
              value={draftKeyword}
              onChange={(event) => setDraftKeyword(event.target.value)}
              placeholder="搜索备注或业务说明"
                className="h-11 w-full rounded-2xl border border-border-light bg-bg-base pl-10 pr-10 text-lg text-text-main outline-none placeholder:text-text-aux"
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

        <div className="mt-3 flex min-w-0 gap-2 overflow-x-auto overflow-y-hidden no-scrollbar overscroll-x-contain">
          {LOG_VIEW_MODE_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setViewMode(option.key)}
              className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === option.key
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'bg-bg-base text-text-sub'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="relative mt-3">
          {categoryPanelOpen ? (
            <button
              type="button"
              aria-label="关闭分类面板"
              onClick={closeCategoryPanel}
              className="fixed inset-0 z-20 bg-black/20 backdrop-blur-[1px]"
            />
          ) : null}

          <button
            type="button"
            onClick={() => setCategoryPanelOpen((current) => !current)}
            className="relative z-30 flex w-full items-center justify-between rounded-[22px] border border-border-light bg-bg-card px-4 py-3 text-left shadow-soft transition-all active:scale-[0.99]"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex rounded-full bg-primary-start/[0.08] px-2.5 py-1 text-xs font-medium text-primary-start">
                  分类
                </span>
                <span className="truncate text-sm font-semibold text-text-main">{selectedCategoryLabel}</span>
              </div>
              <div className="mt-1 text-xs text-text-aux">
                {sceneConfig.bizType ? '当前场景下按账户类型细分' : '常用分类、账户分类和业务分类'}
              </div>
            </div>
            <ChevronRight
              size={18}
              className={`shrink-0 text-text-aux transition-transform duration-200 ${
                categoryPanelOpen ? 'rotate-90' : 'rotate-0'
              }`}
            />
          </button>

          {categoryPanelOpen ? (
            <div className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-[26px] border border-border-light bg-bg-card shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
              <div className="border-b border-border-light px-4 py-4">
                <div className="text-sm font-semibold text-text-main">选择分类</div>
                <div className="mt-1 text-xs text-text-aux">支持搜索账户名称和业务类型</div>
                <div className="relative mt-3 flex h-10 items-center overflow-hidden rounded-2xl border border-border-light bg-bg-base">
                  <Search size={15} className="pointer-events-none absolute left-3 text-text-aux" />
                  <input
                    value={categorySearch}
                    onChange={(event) => setCategorySearch(event.target.value)}
                    placeholder="搜索分类"
                    className="h-full w-full bg-transparent pl-9 pr-9 text-sm text-text-main outline-none placeholder:text-text-aux"
                  />
                  {categorySearch ? (
                    <button
                      type="button"
                      onClick={() => setCategorySearch('')}
                      className="absolute right-3 text-text-aux"
                      aria-label="清空分类搜索"
                    >
                      <X size={14} />
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="max-h-[58vh] overflow-y-auto px-2 py-3">
                {groupedCategoryOptions.length ? (
                  groupedCategoryOptions.map((group) => (
                    <div key={group.section} className="pb-3 last:pb-0">
                      <div className="px-3 pb-2 text-[11px] font-medium tracking-[0.04em] text-text-aux">
                        {BILLING_CATEGORY_SECTION_LABELS[group.section]}
                      </div>
                      <div className="space-y-1">
                        {group.options.map((option) => {
                          const active = category === option.key;

                          return (
                            <button
                              key={option.key}
                              type="button"
                              onClick={() => handleCategorySelect(option.key)}
                              className={`flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left text-sm transition-colors ${
                                active
                                  ? 'bg-primary-start/[0.08] text-primary-start'
                                  : 'text-text-main active:bg-bg-base'
                              }`}
                            >
                              <span className="pr-3 font-medium">{option.label}</span>
                              {active ? <span className="text-xs font-semibold">已选</span> : null}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-8 text-center text-sm text-text-aux">没有匹配的分类</div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-3 flex min-w-0 gap-2 overflow-x-auto overflow-y-hidden no-scrollbar overscroll-x-contain">
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

        <div className="mt-3 text-xs text-text-aux">
          当前为 {viewMode === 'merged' ? '合并流水' : '正常流水'} · {selectedCategoryLabel} · 共 {total} 条记录
        </div>
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
      return (
        <button
          type="button"
          onClick={() => void loadMore()}
          className="rounded-full border border-border-light bg-bg-card px-6 py-2 text-sm text-text-main active:opacity-70"
        >
          加载更多
        </button>
      );
    }

    return <span className="text-text-aux">已加载全部</span>;
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
          message={keyword ? '没有找到匹配的资金记录' : sceneConfig.emptyMessage}
        />
      );
    }

    return (
      <div className="space-y-7 px-4 pb-10 pt-5">
        {groupedLogs.map((group) => (
          <div key={group.label} className="space-y-3">
            <div className="flex items-center gap-3 px-1">
              <div className="text-base font-bold tracking-[0.01em] text-text-main">{group.label}</div>
              <div className="h-px flex-1 bg-gradient-to-r from-primary-start/14 via-primary-start/6 to-transparent" />
            </div>

            <div className="space-y-3">
              {group.rows.map((item, index) => {
                const accountLabel = formatAccountTypeLabel(item.accountType);
                const tone = getAccountTone(item.accountType);
                const flowMeta = getFlowMeta(item.amount);
                const FlowIcon = flowMeta.icon;
                const beforeValueText = formatMoney(item.beforeValue);
                const afterValueText = formatMoney(item.afterValue);
                const bizLabel = formatBizTypeLabel(item.bizType);
                const memoText = item.memo?.trim();
                const titleText = memoText || bizLabel;
                const subtitleText = memoText && memoText !== bizLabel ? bizLabel : undefined;
                const detailReference =
                  item.isMerged && item.mergeKey
                    ? `合并键 ${item.mergeKey}`
                    : item.flowNo || `记录 #${item.id}`;

                return (
                  <button
                    key={`${item.id}-${item.flowNo ?? item.createTime ?? index}`}
                    type="button"
                    onClick={() => setSelectedLog(item)}
                    className="group w-full rounded-2xl border border-border-light/80 bg-bg-card px-4 py-3.5 text-left shadow-[0_8px_22px_rgba(15,23,42,0.05)] transition-all duration-200 active:scale-[0.99] active:bg-bg-base/55 active:shadow-[0_4px_12px_rgba(15,23,42,0.06)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${tone.badgeClassName}`}>
                            {accountLabel}
                          </span>
                          {item.isMerged ? (
                            <span className="inline-flex items-center rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700 ring-1 ring-amber-500/12 dark:bg-amber-500/16 dark:text-amber-300">
                              {item.mergeRowCount && item.mergeRowCount > 1
                                ? `合并 ${item.mergeRowCount} 笔`
                                : '合并流水'}
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-2 line-clamp-1 text-[15px] font-semibold text-text-main">
                          {titleText}
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-aux">
                          {subtitleText ? <span className="line-clamp-1">{subtitleText}</span> : null}
                          <span className="inline-flex items-center gap-1">
                            <Clock3 size={12} />
                            <span>{item.createTimeText || '--'}</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-start gap-2">
                        <div className="text-right">
                          <div
                            className={`text-lg font-bold tracking-[-0.02em] font-[DINAlternate-Bold,Roboto,sans-serif] ${getAmountClassName(item.amount)}`}
                          >
                            {formatSignedMoney(item.amount)}
                          </div>
                          <div
                            className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${flowMeta.badgeClassName}`}
                          >
                            <FlowIcon size={11} />
                            <span>{flowMeta.label}</span>
                          </div>
                        </div>

                        <div className="pt-0.5 text-text-disabled transition-transform duration-200 group-active:translate-x-0.5">
                          <ChevronRight size={16} />
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 border-t border-border-light/70 pt-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="min-w-0 flex-1 truncate text-[11px] text-text-aux">{detailReference}</div>
                        <div className="inline-flex max-w-full items-center gap-2 rounded-full bg-bg-base px-3 py-1.5 text-xs text-text-sub">
                          <span className="shrink-0 text-text-aux">变动前</span>
                          <span className="truncate font-medium text-text-main">{beforeValueText}</span>
                          <MoveRight size={12} className="shrink-0 text-text-disabled" />
                          <span className="shrink-0 text-text-aux">变动后</span>
                          <span className={`truncate font-medium ${getAmountClassName(item.amount)}`}>
                            {afterValueText}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <div
          ref={loadMoreRef}
          className="flex min-h-[80px] flex-col items-center justify-center gap-2 py-6"
        >
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
    const userCollectionId = detail?.userCollectionId;
    const itemId = detail?.itemId;
    const hasUserCollectionId = typeof userCollectionId === 'number' ? userCollectionId > 0 : Boolean(userCollectionId);
    const hasItemId = typeof itemId === 'number' ? itemId > 0 : Boolean(itemId);
    const hasAssetSnapshot = Boolean(titleSnapshot || hasUserCollectionId || hasItemId);
    const beforeValueText = formatMoney(detail?.beforeValue);
    const afterValueText = formatMoney(detail?.afterValue);

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
            <div className="mt-5 grid w-full grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border-light bg-bg-base px-4 py-3 text-left">
                <div className="text-xs text-text-aux">变动前金额</div>
                <div className="mt-1 text-base font-semibold text-text-main">{beforeValueText}</div>
              </div>
              <div className="rounded-2xl border border-border-light bg-bg-base px-4 py-3 text-left">
                <div className="text-xs text-text-aux">变动后金额</div>
                <div className="mt-1 text-base font-semibold text-text-main">{afterValueText}</div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {renderDetailRow('流水模式', (detail?.isMerged ?? selectedLog.isMerged) ? '合并流水' : '正常流水')}
            {renderDetailRow('账户类型', formatAccountTypeLabel(detail?.accountType || selectedLog.accountType))}
            {renderDetailRow('业务类型', formatBizTypeLabel(detail?.bizType || selectedLog.bizType))}
            {renderDetailRow('创建时间', detail?.createTimeText || selectedLog.createTimeText)}
            {renderDetailRow('备注说明', detail?.memo || selectedLog.memo)}
            {(detail?.mergeRowCount ?? selectedLog.mergeRowCount) ? (
              renderDetailRow('合并笔数', `${detail?.mergeRowCount ?? selectedLog.mergeRowCount} 笔`)
            ) : null}
            {(detail?.mergeKey || selectedLog.mergeKey) ? (
              renderDetailRow('合并键', detail?.mergeKey || selectedLog.mergeKey, {
                copyable: true,
                successMessage: '合并键已复制',
              })
            ) : null}
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

        {hasAssetSnapshot ? (
          <Card className="p-4">
            <div className="mb-3 text-sm font-medium text-text-main">关联资产</div>
            <div className="space-y-2">
              <div className="break-all text-sm font-medium text-text-main">{titleSnapshot || '未命名资产'}</div>
              <div className="text-sm text-text-sub">
                藏品 ID：{userCollectionId ?? '--'} / 商品 ID：{itemId ?? '--'}
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
