/**
 * @file Billing/index.tsx - 资产明细页面
 * @description 账户资金流水记录，支持按账户类型/收支方向/关键词筛选，
 *              分月分组展示，无限滚动加载，点击查看流水详情。
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'; // React 核心 Hook 和类型
import {
  ArrowLeft,
  Calendar,
  Check,
  ChevronRight,
  Copy,
  FileText,
  Hash,
  Loader2,
  Package,
  Receipt,
  Search,
  TrendingDown,
  TrendingUp,
  X,
  type LucideIcon,
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
import { EmptyState } from '../../components/ui/EmptyState';
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
type RangeFilter = 'all' | 'today' | '7days' | '30days';

type BillingCategorySection = 'quick' | 'account' | 'business';
type BillingFilterDropdown = 'category' | 'flow' | 'range';

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

const RANGE_OPTIONS: Array<{ key: RangeFilter; label: string }> = [
  { key: 'all', label: '全部时间' },
  { key: 'today', label: '今天' },
  { key: '7days', label: '近7天' },
  { key: '30days', label: '近30天' },
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

function getLegacyAccountTagClassName(type: string | undefined) {
  switch (type) {
    case 'green_power':
      return 'bg-emerald-50 text-emerald-600';
    case 'balance_available':
      return 'bg-blue-50 text-blue-600';
    case 'withdrawable_money':
      return 'bg-indigo-50 text-indigo-600';
    case 'service_fee_balance':
      return 'bg-amber-50 text-amber-600';
    case 'score':
      return 'bg-purple-50 text-purple-600';
    case 'pending_activation_gold':
      return 'bg-orange-50 text-orange-600';
    default:
      return 'bg-gray-100 text-gray-500';
  }
}

function getLegacyListAmountClassName(type: string | undefined, amount: number) {
  if (type === 'green_power') {
    return amount >= 0 ? 'text-emerald-500' : 'text-emerald-600';
  }

  if (amount > 0) {
    return 'text-red-600';
  }

  if (amount < 0) {
    return 'text-gray-900';
  }

  return 'text-gray-500';
}

function getLegacyBalanceAfterClassName(type: string | undefined, amount: number) {
  if (type === 'green_power') {
    return amount >= 0 ? 'text-emerald-500' : 'text-emerald-600';
  }

  return amount >= 0 ? 'text-red-500' : 'text-gray-600';
}

/** 构建查询参数 */
function buildTimeRange(range: RangeFilter): { endTime?: number; startTime?: number } {
  const now = Math.floor(Date.now() / 1000);

  switch (range) {
    case 'today': {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return {
        endTime: now,
        startTime: Math.floor(today.getTime() / 1000),
      };
    }
    case '7days':
      return {
        endTime: now,
        startTime: now - 7 * 24 * 3600,
      };
    case '30days':
      return {
        endTime: now,
        startTime: now - 30 * 24 * 3600,
      };
    default:
      return {};
  }
}

function buildQueryParams(
  viewMode: AccountLogViewMode,
  categoryQuery: { bizType?: string; type?: AccountLogType },
  flowFilter: FlowFilter,
  rangeFilter: RangeFilter,
  keyword: string,
  page: number,
) {
  const timeRange = buildTimeRange(rangeFilter);

  return {
    bizType: categoryQuery.bizType,
    endTime: timeRange.endTime,
    flowDirection: flowFilter === 'all' ? undefined : flowFilter,
    keyword: keyword || undefined,
    limit: PAGE_SIZE,
    page,
    startTime: timeRange.startTime,
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
  const [viewMode] = useSessionState<AccountLogViewMode>(
    `${sessionNamespace}:view-mode`,
    'merged',
  );
  const [flowFilter, setFlowFilter] = useSessionState<FlowFilter>(
    `${sessionNamespace}:flow-filter`,
    'all',
  );
  const [rangeFilter, setRangeFilter] = useSessionState<RangeFilter>(
    `${sessionNamespace}:range-filter`,
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
  const [copiedDetailField, setCopiedDetailField] = useState<string | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<BillingFilterDropdown | null>(null);
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
  const selectedFlowLabel = useMemo(
    () => FLOW_OPTIONS.find((option) => option.key === flowFilter)?.label ?? '全部',
    [flowFilter],
  );
  const selectedRangeLabel = useMemo(
    () => RANGE_OPTIONS.find((option) => option.key === rangeFilter)?.label ?? '全部时间',
    [rangeFilter],
  );
  const currentDropdownOptions = useMemo(() => {
    if (activeDropdown === 'category') {
      return categoryOptions;
    }

    if (activeDropdown === 'flow') {
      return FLOW_OPTIONS.map((option) => ({
        key: option.key,
        label: option.label,
        section: 'quick' as const,
      }));
    }

    if (activeDropdown === 'range') {
      return RANGE_OPTIONS.map((option) => ({
        key: option.key,
        label: option.label,
        section: 'quick' as const,
      }));
    }

    return [];
  }, [activeDropdown, categoryOptions]);
  const filteredDropdownOptions = useMemo(() => {
    if (activeDropdown !== 'category') {
      return currentDropdownOptions;
    }

    const keyword = categorySearch.trim().toLowerCase();
    if (!keyword) {
      return currentDropdownOptions;
    }

    return currentDropdownOptions.filter(
      (option) => option.label.toLowerCase().includes(keyword) || option.key.toLowerCase().includes(keyword),
    );
  }, [activeDropdown, categorySearch, currentDropdownOptions]);
  const groupedCategoryOptions = useMemo(() => {
    const groups = new Map<BillingCategorySection, BillingCategoryOption[]>();
    filteredDropdownOptions.forEach((option) => {
      const current = groups.get(option.section) ?? [];
      current.push(option);
      groups.set(option.section, current);
    });

    return Array.from(groups.entries()).map(([section, options]) => ({
      options,
      section,
    }));
  }, [filteredDropdownOptions]);
  const activeDropdownValue = useMemo(() => {
    if (activeDropdown === 'category') {
      return category;
    }

    if (activeDropdown === 'flow') {
      return flowFilter;
    }

    if (activeDropdown === 'range') {
      return rangeFilter;
    }

    return '';
  }, [activeDropdown, category, flowFilter, rangeFilter]);

  useEffect(() => {
    setDraftKeyword(keyword);
  }, [keyword]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const nextKeyword = draftKeyword.trim();
      if (nextKeyword !== keyword) {
        setKeyword(nextKeyword);
      }
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [draftKeyword, keyword, setKeyword]);

  useEffect(() => {
    if (!categoryOptions.some((option) => option.key === category)) {
      setCategory('all');
    }
  }, [category, categoryOptions, setCategory]);

  useEffect(() => {
    if (selectedLog) {
      setActiveDropdown(null);
      setCategorySearch('');
    }
  }, [selectedLog]);

  const queryKey = `${scene}:${viewMode}:${category}:${flowFilter}:${rangeFilter}:${keyword}`;

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
        buildQueryParams(viewMode, selectedCategoryQuery, flowFilter, rangeFilter, keyword, 1),
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
      deps: [category, flowFilter, isAuthenticated, keyword, rangeFilter, selectedCategoryQuery.bizType, selectedCategoryQuery.type, viewMode],
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
        buildQueryParams(viewMode, selectedCategoryQuery, flowFilter, rangeFilter, keyword, nextPage),
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
  }, [category, flowFilter, hasMore, isAuthenticated, keyword, loadingMore, page, rangeFilter, selectedCategoryQuery, viewMode]);

  useInfiniteScroll({
    disabled: Boolean(selectedLog) || isOffline || Boolean(loadMoreError) || Boolean(paginationNotice),
    hasMore,
    loading: loadingMore || listLoading,
    onLoadMore: loadMore,
    rootRef: scrollContainerRef,
    targetRef: loadMoreRef,
  });

  const logs = items;

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
    restoreDeps: [category, flowFilter, keyword, logs.length, listLoading, rangeFilter, viewMode],
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
      return false;
    }

    const ok = await copyToClipboard(nextValue);
    showToast({
      message: ok ? successMessage : '复制失败，请稍后重试',
      type: ok ? 'success' : 'error',
    });
    return ok;
  };

  const handleDetailFieldCopy = async (fieldKey: string, text: string | undefined, successMessage = '已复制') => {
    const ok = await handleCopy(text, successMessage);
    if (!ok) {
      return;
    }

    setCopiedDetailField(fieldKey);
    window.setTimeout(() => {
      setCopiedDetailField((current) => (current === fieldKey ? null : current));
    }, 2000);
  };

  const handleClearKeyword = () => {
    setDraftKeyword('');
    setKeyword('');
  };

  const closeDropdownPanel = () => {
    setActiveDropdown(null);
    setCategorySearch('');
  };

  const toggleDropdown = (nextDropdown: BillingFilterDropdown) => {
    setActiveDropdown((current) => {
      if (current === nextDropdown) {
        setCategorySearch('');
        return null;
      }

      if (nextDropdown !== 'category') {
        setCategorySearch('');
      }

      return nextDropdown;
    });
  };

  const handleFilterSelect = (value: string) => {
    if (activeDropdown === 'category') {
      setCategory(value);
    } else if (activeDropdown === 'flow') {
      setFlowFilter(value as FlowFilter);
    } else if (activeDropdown === 'range') {
      setRangeFilter(value as RangeFilter);
    }

    closeDropdownPanel();
  };

  const renderHeader = () => (
    <div className="shrink-0 bg-white">
      <div className="relative flex items-center border-b border-gray-100 px-4 py-3 pt-safe">
        <button
          type="button"
          onClick={handleBack}
          className="absolute left-4 z-10 p-1 text-gray-600 active:opacity-70"
          aria-label="返回"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="w-full text-center text-lg font-bold text-gray-800">
          {selectedLog ? '资金明细详情' : scene === 'all' ? '历史记录' : sceneConfig.title}
        </h1>
      </div>
    </div>
  );

  const renderFilters = () => {
    if (selectedLog) {
      return null;
    }

    return (
      <div className="z-20 shrink-0 bg-white">
        {scene !== 'all' ? (
          <div className="border-b border-gray-100 bg-gray-50/70 px-4 py-3">
            <div className="flex items-start justify-between gap-3 rounded-xl border border-gray-100 bg-white px-3.5 py-3">
              <div>
                <div className="text-sm font-medium text-gray-800">{sceneConfig.title}</div>
                <div className="mt-1 text-xs leading-5 text-gray-500">{sceneConfig.intro}</div>
              </div>
              <button
                type="button"
                onClick={() => navigate(getBillingPath('all'))}
                className="shrink-0 rounded-full bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 active:opacity-70"
              >
                查看全部
              </button>
            </div>
          </div>
        ) : null}

        <div className="border-b border-gray-100 bg-gray-50/60 px-4 py-2">
          <div className="relative flex h-10 items-center overflow-hidden rounded-xl border border-gray-100 bg-white">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={draftKeyword}
              onChange={(event) => setDraftKeyword(event.target.value)}
              placeholder="搜索备注、业务说明..."
              className="h-full w-full bg-transparent pl-10 pr-10 text-sm text-gray-700 outline-none placeholder:text-gray-400"
            />
            {draftKeyword ? (
              <button
                type="button"
                onClick={handleClearKeyword}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                aria-label="清空搜索"
              >
                <X size={16} />
              </button>
            ) : null}
          </div>
        </div>

        <div className="relative">
          {activeDropdown ? (
            <button
              type="button"
              aria-label="关闭筛选面板"
              onClick={closeDropdownPanel}
              className="fixed inset-0 z-20 bg-black/45"
            />
          ) : null}

          <div className="relative z-30 border-b border-gray-100 bg-white px-3 py-2">
            <div className="flex gap-2 overflow-x-auto scrollbar-none">
              {[
                { key: 'category' as const, label: '分类', value: selectedCategoryLabel },
                { key: 'flow' as const, label: '收支', value: selectedFlowLabel },
                { key: 'range' as const, label: '时间', value: selectedRangeLabel },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => toggleDropdown(item.key)}
                  className={`flex shrink-0 items-center gap-1 rounded-full border px-3 py-2 text-sm transition-all ${
                    activeDropdown === item.key
                      ? 'border-red-200 bg-red-50 text-red-600'
                      : 'border-gray-200 bg-white text-gray-600'
                  }`}
                >
                  <span className="text-gray-400">{item.label}</span>
                  <span className="max-w-[7rem] truncate font-medium text-current">{item.value}</span>
                  <span
                    className={`text-[10px] text-current transition-transform duration-200 ${
                      activeDropdown === item.key ? 'rotate-180' : ''
                    }`}
                  >
                    ▾
                  </span>
                </button>
              ))}
            </div>
          </div>

          {activeDropdown ? (
            <div className="absolute inset-x-0 top-full z-30 rounded-b-[22px] bg-white px-4 pb-4 pt-3 shadow-[0_10px_30px_rgba(0,0,0,0.12)]">
              {activeDropdown === 'category' ? (
                <div className="pb-3">
                  <div className="relative flex h-10 items-center overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
                    <Search size={15} className="pointer-events-none absolute left-3 text-gray-400" />
                    <input
                      value={categorySearch}
                      onChange={(event) => setCategorySearch(event.target.value)}
                      placeholder="搜索分类"
                      className="h-full w-full bg-transparent pl-9 pr-9 text-sm text-gray-700 outline-none placeholder:text-gray-400"
                    />
                    {categorySearch ? (
                      <button
                        type="button"
                        onClick={() => setCategorySearch('')}
                        className="absolute right-3 text-gray-400"
                        aria-label="清空分类搜索"
                      >
                        <X size={14} />
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {activeDropdown === 'category' ? (
                groupedCategoryOptions.length ? (
                  <div className="max-h-[55vh] overflow-y-auto">
                    {groupedCategoryOptions.map((group) => (
                      <div key={group.section} className="pb-3 last:pb-0">
                        <div className="px-1 pb-2 text-[11px] text-gray-400">
                          {BILLING_CATEGORY_SECTION_LABELS[group.section]}
                        </div>
                        <div className="space-y-1">
                          {group.options.map((option) => {
                            const active = activeDropdownValue === option.key;

                            return (
                              <button
                                key={option.key}
                                type="button"
                                onClick={() => handleFilterSelect(option.key)}
                                className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm transition-all ${
                                  active
                                    ? 'bg-red-50 font-medium text-red-600'
                                    : 'text-gray-700 active:bg-gray-50'
                                }`}
                              >
                                <span className="pr-3">{option.label}</span>
                                {active ? <span className="text-xs font-semibold">✓</span> : null}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-sm text-gray-400">没有匹配的分类</div>
                )
              ) : (
                <div className="space-y-1">
                  {currentDropdownOptions.map((option) => {
                    const active = activeDropdownValue === option.key;

                    return (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => handleFilterSelect(option.key)}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm transition-all ${
                          active ? 'bg-red-50 font-medium text-red-600' : 'text-gray-700 active:bg-gray-50'
                        }`}
                      >
                        <span>{option.label}</span>
                        {active ? <span className="text-xs font-semibold">✓</span> : null}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  const renderListSkeleton = () => (
    <div className="space-y-3 p-3">
      {[1, 2, 3].map((row) => (
        <div key={row} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-14 rounded-md" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-28" />
            </div>
            <div className="space-y-2 text-right">
              <Skeleton className="ml-auto h-5 w-20" />
              <Skeleton className="ml-auto h-4 w-4 rounded-full" />
            </div>
          </div>
          <div className="mt-3 border-t border-gray-100 pt-3">
            <Skeleton className="ml-auto h-4 w-32 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );

  const renderLoadMore = () => {
    if (paginationNotice) {
      return <span className="text-xs text-amber-500">{paginationNotice}</span>;
    }

    if (loadMoreError) {
      return (
        <button
          type="button"
          className="text-xs text-red-500 underline-offset-2 active:opacity-70"
          onClick={() => void loadMore()}
        >
          加载失败，点此重试
        </button>
      );
    }

    if (loadingMore) {
      return <span className="text-xs text-gray-400">加载中...</span>;
    }

    if (!hasMore && logs.length > 5) {
      return <span className="text-xs text-gray-300">- 到底了 -</span>;
    }

    return hasMore ? <span className="text-xs text-gray-300">继续下滑加载</span> : null;
  };

  const renderLogList = () => {
    if (listLoading && !logs.length) {
      return renderListSkeleton();
    }

    if (listError && !logs.length) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-red-400">
          <span className="text-xs">{getErrorMessage(listError)}</span>
          <button
            type="button"
            onClick={() => void reloadList().catch(() => undefined)}
            className="mt-3 rounded-full bg-red-50 px-4 py-2 text-xs font-medium text-red-600 active:opacity-80"
          >
            重新加载
          </button>
        </div>
      );
    }

    if (!logs.length) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <FileText size={24} className="text-gray-300" />
          </div>
          <span className="text-xs text-gray-400">
            {keyword ? '没有找到匹配的资金记录' : sceneConfig.emptyMessage}
          </span>
        </div>
      );
    }

    return (
      <div className="space-y-3 p-3 pb-10">
        {logs.map((item, index) => {
          const accountLabel = formatAccountTypeLabel(item.accountType);
          const beforeValueText = formatMoney(item.beforeValue);
          const afterValueText = formatMoney(item.afterValue);
          const bizLabel = formatBizTypeLabel(item.bizType);
          const memoText = item.memo?.trim();
          const titleText = memoText || bizLabel;
          const subtitleText = memoText && memoText !== bizLabel ? bizLabel : undefined;

          return (
            <button
              key={`${item.id}-${item.flowNo ?? item.createTime ?? index}`}
              type="button"
              onClick={() => setSelectedLog(item)}
              className="group w-full rounded-xl border border-gray-100 bg-white p-4 text-left shadow-sm transition-all active:scale-[0.99] active:bg-gray-50"
            >
              <div className="mb-2 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 pr-4">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${getLegacyAccountTagClassName(item.accountType)}`}
                    >
                      {accountLabel}
                    </span>
                    {item.isMerged ? (
                      <span className="inline-flex shrink-0 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-600">
                        {item.mergeRowCount && item.mergeRowCount > 1 ? `已合并 ${item.mergeRowCount} 笔` : '合并流水'}
                      </span>
                    ) : null}
                    <span className="min-w-0 truncate text-sm font-medium text-gray-700">{titleText}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
                    {subtitleText ? <span className="line-clamp-1">{subtitleText}</span> : null}
                    <span>{item.createTimeText || '--'}</span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <div className="text-right">
                    <div
                      className={`text-base font-bold font-[DINAlternate-Bold,Roboto,sans-serif] ${getLegacyListAmountClassName(item.accountType, item.amount)}`}
                    >
                      {formatSignedMoney(item.amount)}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-300" />
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between gap-3 border-t border-gray-50 pt-2">
                <div className="truncate text-[11px] text-gray-400">
                  {item.isMerged && item.mergeKey ? `合并键 ${item.mergeKey}` : item.flowNo || `记录 #${item.id}`}
                </div>
                <div className="flex items-center font-mono text-xs text-gray-400">
                  <span>{beforeValueText}</span>
                  <span className="mx-1.5 text-gray-300">→</span>
                  <span className={getLegacyBalanceAfterClassName(item.accountType, item.amount)}>{afterValueText}</span>
                </div>
              </div>
            </button>
          );
        })}

        <div ref={loadMoreRef} className="flex min-h-[56px] items-center justify-center py-3">
          {renderLoadMore()}
        </div>
      </div>
    );
  };

  const renderDetailInfoRow = (
    label: string,
    value: string | undefined,
    options: {
      copyable?: boolean;
      fieldKey?: string;
      icon?: LucideIcon;
      successMessage?: string;
    } = {},
  ) => {
    const content = value?.trim() || '-';
    const Icon = options.icon;
    const canCopy = Boolean(options.copyable && content !== '-');
    const copied = options.fieldKey ? copiedDetailField === options.fieldKey : false;

    return (
      <div className="flex items-start justify-between gap-4 py-2">
        <div className="flex items-center gap-2 text-gray-600">
          {Icon ? <Icon className="h-4 w-4 text-gray-400" /> : null}
          <span className="text-sm">{label}</span>
        </div>
        <div className="flex max-w-[62%] items-center gap-1.5">
          <span className={`break-all text-right text-sm text-gray-900 ${canCopy ? 'font-mono' : ''}`}>
            {content}
          </span>
          {canCopy && options.fieldKey ? (
            <button
              type="button"
              onClick={() => void handleDetailFieldCopy(options.fieldKey!, content, options.successMessage)}
              className="rounded-md p-1 text-gray-400 active:bg-gray-100"
              aria-label={`复制${label}`}
            >
              {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
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
          <div className="rounded-2xl bg-gradient-to-br from-gray-200 to-gray-300 p-6">
            <div className="flex flex-col items-center">
              <Skeleton className="mb-3 h-4 w-20 bg-white/50" />
              <Skeleton className="h-10 w-40 bg-white/60" />
            </div>
          </div>
          {[1, 2, 3].map((card) => (
            <div key={card} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <Skeleton className="mb-4 h-5 w-24" />
              {[1, 2, 3].map((row) => (
                <Skeleton key={row} className="mb-3 h-4 w-full" />
              ))}
            </div>
          ))}
        </div>
      );
    }

    if (detailError && !selectedDetail) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-red-400">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-lg border-2 border-red-200">
            <FileText size={32} className="opacity-50" />
          </div>
          <span className="text-xs">{getErrorMessage(detailError)}</span>
          <button
            type="button"
            onClick={() => void reloadDetail().catch(() => undefined)}
            className="mt-3 rounded-full bg-red-50 px-4 py-2 text-xs font-medium text-red-600 active:opacity-80"
          >
            重新加载
          </button>
        </div>
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
    const imageSnapshot = detail?.imageSnapshot || selectedLog.imageSnapshot;
    const amountValue = detail?.amount ?? selectedLog.amount;
    const accountType = detail?.accountType || selectedLog.accountType;
    const isPositive = amountValue > 0;
    const amountUnit = accountType === 'green_power' ? '算力' : accountType === 'score' ? '' : '元';
    const amountClassName =
      accountType === 'green_power'
        ? 'from-emerald-500 to-emerald-600'
        : isPositive
          ? 'from-green-500 to-green-600'
          : 'from-gray-600 to-gray-700';

    return (
      <div className="space-y-4 p-4 pb-10">
        <div className={`rounded-2xl bg-gradient-to-br ${amountClassName} p-6 text-white shadow-lg`}>
          <div className="mb-4 text-center">
            <div className="mb-2 text-sm opacity-90">变动金额</div>
            <div className="font-[DINAlternate-Bold,Roboto,sans-serif] text-4xl font-bold">
              {amountValue > 0 ? '+' : ''}
              {Math.abs(amountValue).toFixed(2)}
              {amountUnit ? ` ${amountUnit}` : ''}
            </div>
          </div>
          <div className="flex items-center justify-between text-sm opacity-90">
            <span>变动前: {beforeValueText}</span>
            <span className="text-lg">→</span>
            <span>变动后: {afterValueText}</span>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
            <Receipt className="h-5 w-5 text-red-600" />
            <h2 className="text-base font-semibold text-gray-900">基本信息</h2>
          </div>

          <div className="space-y-1">
            {renderDetailInfoRow('流水号', detail?.flowNo || selectedLog.flowNo, {
              copyable: true,
              fieldKey: 'flow-no',
              icon: Hash,
              successMessage: '流水号已复制',
            })}
            {(detail?.batchNo || selectedLog.batchNo) ? (
              renderDetailInfoRow('批次号', detail?.batchNo || selectedLog.batchNo, {
                copyable: true,
                fieldKey: 'batch-no',
                icon: Package,
                successMessage: '批次号已复制',
              })
            ) : null}
            {renderDetailInfoRow('账户类型', formatAccountTypeLabel(accountType), {
              icon: TrendingUp,
            })}
            {(detail?.bizType || selectedLog.bizType) ? (
              renderDetailInfoRow('业务类型', formatBizTypeLabel(detail?.bizType || selectedLog.bizType))
            ) : null}
            {(detail?.bizId || selectedLog.bizId) ? renderDetailInfoRow('业务ID', detail?.bizId || selectedLog.bizId) : null}
            {renderDetailInfoRow('创建时间', detail?.createTimeText || selectedLog.createTimeText, {
              icon: Calendar,
            })}
            {renderDetailInfoRow('流水模式', (detail?.isMerged ?? selectedLog.isMerged) ? '合并流水' : '正常流水')}
            {(detail?.mergeRowCount ?? selectedLog.mergeRowCount) ? (
              renderDetailInfoRow('合并笔数', `${detail?.mergeRowCount ?? selectedLog.mergeRowCount} 笔`)
            ) : null}
            {(detail?.mergeKey || selectedLog.mergeKey) ? (
              renderDetailInfoRow('合并键', detail?.mergeKey || selectedLog.mergeKey, {
                copyable: true,
                fieldKey: 'merge-key',
                successMessage: '合并键已复制',
              })
            ) : null}
          </div>
        </div>

        {(detail?.memo || selectedLog.memo) ? (
          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5 text-red-600" />
              <h2 className="text-base font-semibold text-gray-900">备注说明</h2>
            </div>
            <p className="text-sm leading-relaxed text-gray-700">{detail?.memo || selectedLog.memo}</p>
          </div>
        ) : null}

        {hasAssetSnapshot ? (
          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Package className="h-5 w-5 text-red-600" />
              <h2 className="text-base font-semibold text-gray-900">商品信息</h2>
            </div>
            <div className="flex gap-3">
              {imageSnapshot ? (
                <div className="h-16 w-16 overflow-hidden rounded-lg bg-gray-100">
                  <img src={imageSnapshot} alt={titleSnapshot || '商品图片'} className="h-full w-full object-cover" />
                </div>
              ) : null}
              <div className="flex min-w-0 flex-1 flex-col justify-center">
                {titleSnapshot ? <p className="text-sm text-gray-700">{titleSnapshot}</p> : null}
                <div className="mt-1 text-xs text-gray-500">
                  藏品 ID：{userCollectionId ?? '--'} / 商品 ID：{itemId ?? '--'}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {detailBreakdownEntries.length ? (
          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              <h2 className="text-base font-semibold text-gray-900">详细信息</h2>
            </div>
            <div className="space-y-2">
              {detailBreakdownEntries.map((entry) => (
                <div key={entry.key} className="flex items-center justify-between gap-4 py-1.5 text-sm">
                  <span className="text-gray-600">{entry.label}</span>
                  <span className="max-w-[65%] break-all text-right font-medium text-gray-900">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="flex h-full flex-1 flex-col bg-gray-50">
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
    <div className="relative flex h-full flex-1 flex-col bg-gray-50">
      {isOffline ? (
        <OfflineBanner onAction={handleRefresh} className="absolute top-12 right-0 left-0 z-50" />
      ) : null}

      <div className="sticky top-0 z-30">
        {renderHeader()}
        {renderFilters()}
      </div>

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
