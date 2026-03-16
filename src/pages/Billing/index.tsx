/**
 * @file Billing/index.tsx - 资产明细页面
 * @description 账户资金流水记录，支持按账户类型/收支方向/关键词筛选，
 *              分月分组展示，无限滚动加载，点击查看流水详情。
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from 'react'; // React 核心 Hook 和类型
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
import { useLocation, useNavigationType, useSearchParams } from 'react-router-dom';
import {
  accountApi,
  rechargeApi,
  type AccountLogFlowDirection,
  type AccountLogItem,
  type AccountLogList,
  type AccountLogType,
  type AccountLogViewMode,
  type AccountMoneyLogDetail,
  type RechargeOrderList,
  type RechargeOrderRecord,
  type WithdrawRecord,
  type WithdrawRecordList,
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

type BillingListResponse = AccountLogList | RechargeOrderList | WithdrawRecordList;

interface MergedLogChildrenState {
  error: string | null;
  items: AccountLogItem[];
  loaded: boolean;
  loading: boolean;
  mergeRowCount?: number;
  mergeScene?: string;
  total: number;
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

function maskAccountNumber(value: string | undefined) {
  const nextValue = value?.trim();
  if (!nextValue) {
    return '--';
  }

  if (nextValue.length <= 8) {
    return nextValue;
  }

  return `${nextValue.slice(0, 4)} **** ${nextValue.slice(-4)}`;
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
      return 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-300';
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
    return 'text-gray-900 dark:text-gray-100';
  }

  return 'text-gray-500 dark:text-gray-300';
}

function getLegacyBalanceAfterClassName(type: string | undefined, amount: number) {
  if (type === 'green_power') {
    return amount >= 0 ? 'text-emerald-500' : 'text-emerald-600';
  }

  return amount >= 0 ? 'text-red-500' : 'text-gray-600 dark:text-gray-300';
}

function getWithdrawStatusBadgeClassName(status: number) {
  switch (status) {
    case 0:
      return 'bg-amber-50 text-amber-600';
    case 1:
      return 'bg-blue-50 text-blue-600';
    case 2:
      return 'bg-red-50 text-red-600';
    case 3:
      return 'bg-emerald-50 text-emerald-600';
    case 4:
      return 'bg-rose-50 text-rose-600';
    default:
      return 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-300';
  }
}

function getWithdrawStatusCardClassName(status: number) {
  switch (status) {
    case 0:
      return 'from-amber-500 to-orange-500';
    case 1:
      return 'from-blue-500 to-sky-500';
    case 2:
      return 'from-red-500 to-rose-500';
    case 3:
      return 'from-emerald-500 to-green-500';
    case 4:
      return 'from-rose-500 to-pink-500';
    default:
      return 'from-gray-600 to-gray-700';
  }
}

function getWithdrawAccountTitle(record: WithdrawRecord) {
  return record.accountName || record.accountTypeText || '收款账户';
}

function getWithdrawAccountSubtitle(record: WithdrawRecord) {
  const parts = [record.bankName, maskAccountNumber(record.accountNumber)].filter(
    (part): part is string => Boolean(part && part !== '--'),
  );
  return parts.length ? parts.join(' · ') : '--';
}

function getRechargeRecordTypeLabel(recordType: string | undefined) {
  return recordType === 'transfer' ? '余额划转' : '充值订单';
}

function getRechargeRecordStatusText(record: RechargeOrderRecord) {
  return record.statusText || (record.recordType === 'transfer' ? '已到账' : '处理中');
}

function getRechargeRecordTitle(record: RechargeOrderRecord) {
  if (record.recordType === 'transfer') {
    return '余额划转到账';
  }

  return record.paymentTypeText || '充值订单';
}

function getRechargeRecordSubtitle(record: RechargeOrderRecord) {
  const parts =
    record.recordType === 'transfer'
      ? ['系统入账', record.createTimeText || '--']
      : [record.paymentTypeText, record.createTimeText || '--'];
  return parts.filter((part): part is string => Boolean(part)).join(' · ');
}

function getRechargeRecordStatusBadgeClassName(record: RechargeOrderRecord) {
  if (record.recordType === 'transfer') {
    return 'bg-emerald-50 text-emerald-600';
  }

  switch (record.status) {
    case 0:
      return 'bg-amber-50 text-amber-600';
    case 1:
      return 'bg-emerald-50 text-emerald-600';
    case 2:
      return 'bg-red-50 text-red-600';
    default:
      return 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-300';
  }
}

function getRechargeRecordStatusCardClassName(record: RechargeOrderRecord) {
  if (record.recordType === 'transfer') {
    return 'from-emerald-500 to-teal-500';
  }

  switch (record.status) {
    case 0:
      return 'from-amber-500 to-orange-500';
    case 1:
      return 'from-emerald-500 to-green-500';
    case 2:
      return 'from-red-500 to-rose-500';
    default:
      return 'from-gray-600 to-gray-700';
  }
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

function getBillingListHasMore(response: BillingListResponse) {
  return 'hasMore' in response ? response.hasMore : getNextHasMore(response);
}

function getMergedLogChildrenStateKey(item: Pick<AccountLogItem, 'accountType' | 'flowNo' | 'id'>) {
  return `${item.id}:${item.flowNo ?? ''}:${item.accountType ?? ''}`;
}

function canExpandMergedLogChildren(item: AccountLogItem) {
  return (item.mergeRowCount ?? 0) > 1;
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
  const location = useLocation();
  const navigationType = useNavigationType();
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const queryKeyRef = useRef('');
  const detailOpenRef = useRef(false);
  const [searchParams] = useSearchParams();
  const scene = resolveBillingScene(searchParams.get('scene'));
  const isRechargeScene = scene === 'recharge';
  const isWithdrawScene = scene === 'withdraw';
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
  const [rechargeItems, setRechargeItems] = useState<RechargeOrderRecord[]>([]);
  const [withdrawItems, setWithdrawItems] = useState<WithdrawRecord[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [paginationNotice, setPaginationNotice] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AccountLogItem | null>(null);
  const [selectedRechargeRecord, setSelectedRechargeRecord] = useState<RechargeOrderRecord | null>(null);
  const [selectedWithdrawRecord, setSelectedWithdrawRecord] = useState<WithdrawRecord | null>(null);
  const [expandedMergedLogMap, setExpandedMergedLogMap] = useState<Record<string, boolean>>({});
  const [mergedLogChildrenMap, setMergedLogChildrenMap] = useState<Record<string, MergedLogChildrenState>>({});

  const openLogDetail = useCallback((item: AccountLogItem) => {
    setSelectedLog(item);
    detailOpenRef.current = true;
    navigate(location.pathname + location.search, { state: { _billingDetail: true } });
  }, [navigate, location.pathname, location.search]);

  const openRechargeDetail = useCallback((item: RechargeOrderRecord) => {
    setSelectedRechargeRecord(item);
    detailOpenRef.current = true;
    navigate(location.pathname + location.search, { state: { _billingDetail: true } });
  }, [navigate, location.pathname, location.search]);

  const openWithdrawDetail = useCallback((item: WithdrawRecord) => {
    setSelectedWithdrawRecord(item);
    detailOpenRef.current = true;
    navigate(location.pathname + location.search, { state: { _billingDetail: true } });
  }, [navigate, location.pathname, location.search]);

  useEffect(() => {
    if (navigationType === 'POP' && detailOpenRef.current) {
      detailOpenRef.current = false;
      setSelectedLog(null);
      setSelectedRechargeRecord(null);
      setSelectedWithdrawRecord(null);
    }
  }, [location.key, navigationType]);

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
    if (selectedLog || selectedRechargeRecord || selectedWithdrawRecord) {
      setActiveDropdown(null);
      setCategorySearch('');
    }
  }, [selectedLog, selectedRechargeRecord, selectedWithdrawRecord]);

  const queryKey = `${scene}:${viewMode}:${category}:${flowFilter}:${rangeFilter}:${keyword}`;

  useEffect(() => {
    queryKeyRef.current = queryKey;
    setItems([]);
    setRechargeItems([]);
    setWithdrawItems([]);
    setExpandedMergedLogMap({});
    setMergedLogChildrenMap({});
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
  } = useRequest<BillingListResponse>(
    async (signal) => {
      const response = isWithdrawScene
        ? await rechargeApi.getMyWithdrawList(
            {
              limit: PAGE_SIZE,
              page: 1,
            },
            { signal },
          )
        : isRechargeScene
          ? await rechargeApi.getMyOrderList(
              {
                limit: PAGE_SIZE,
                page: 1,
              },
              { signal },
            )
        : await accountApi.getLogList(
            buildQueryParams(viewMode, selectedCategoryQuery, flowFilter, rangeFilter, keyword, 1),
            { signal },
          );

      if (isWithdrawScene) {
        setWithdrawItems(response.list as WithdrawRecord[]);
        setRechargeItems([]);
        setItems([]);
      } else if (isRechargeScene) {
        setRechargeItems(response.list as RechargeOrderRecord[]);
        setWithdrawItems([]);
        setItems([]);
      } else {
        setItems(response.list as AccountLogItem[]);
        setRechargeItems([]);
        setWithdrawItems([]);
      }
      setPage(response.currentPage);
      setHasMore(getBillingListHasMore(response));
      setLoadMoreError(null);
      setPaginationNotice(null);

      return response;
    },
    {
      deps: [
        category,
        flowFilter,
        isAuthenticated,
        isRechargeScene,
        isWithdrawScene,
        keyword,
        rangeFilter,
        selectedCategoryQuery.bizType,
        selectedCategoryQuery.type,
        viewMode,
      ],
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
      !isRechargeScene && !isWithdrawScene && selectedLog
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
      deps: [
        isAuthenticated,
        isRechargeScene,
        isWithdrawScene,
        selectedLog?.flowNo,
        selectedLog?.id,
        selectedLog?.mergeKey,
        selectedLog?.isMerged,
      ],
      keepPreviousData: false,
      manual: !isAuthenticated || isRechargeScene || isWithdrawScene || !selectedLog,
    },
  );

  useEffect(() => {
    if (!selectedLog || isRechargeScene || isWithdrawScene) {
      setSelectedDetail(undefined);
    }
  }, [isRechargeScene, isWithdrawScene, selectedLog, setSelectedDetail]);

  const loadMergedLogChildren = useCallback(async (item: AccountLogItem) => {
    const stateKey = getMergedLogChildrenStateKey(item);
    const requestKey = queryKeyRef.current;

    setMergedLogChildrenMap((current) => ({
      ...current,
      [stateKey]: {
        error: null,
        items: current[stateKey]?.items ?? [],
        loaded: current[stateKey]?.loaded ?? false,
        loading: true,
        mergeRowCount: current[stateKey]?.mergeRowCount,
        mergeScene: current[stateKey]?.mergeScene,
        total: current[stateKey]?.total ?? 0,
      },
    }));

    try {
      const response = await accountApi.getAllLogMergedItems({
        accountType: item.accountType,
        flowNo: item.flowNo,
        id: item.id,
      });

      if (queryKeyRef.current !== requestKey) {
        return;
      }

      setMergedLogChildrenMap((current) => ({
        ...current,
        [stateKey]: {
          error: null,
          items: response.list,
          loaded: true,
          loading: false,
          mergeRowCount: response.mergeRowCount,
          mergeScene: response.mergeScene,
          total: response.total,
        },
      }));
    } catch (error) {
      if (queryKeyRef.current !== requestKey) {
        return;
      }

      setMergedLogChildrenMap((current) => ({
        ...current,
        [stateKey]: {
          error: getErrorMessage(error),
          items: current[stateKey]?.items ?? [],
          loaded: current[stateKey]?.loaded ?? false,
          loading: false,
          mergeRowCount: current[stateKey]?.mergeRowCount,
          mergeScene: current[stateKey]?.mergeScene,
          total: current[stateKey]?.total ?? 0,
        },
      }));
    }
  }, []);

  const handleToggleMergedLogChildren = useCallback(
    (event: MouseEvent<HTMLButtonElement>, item: AccountLogItem) => {
      event.stopPropagation();

      const stateKey = getMergedLogChildrenStateKey(item);
      const nextExpanded = !Boolean(expandedMergedLogMap[stateKey]);

      setExpandedMergedLogMap((current) => ({
        ...current,
        [stateKey]: nextExpanded,
      }));

      if (!nextExpanded) {
        return;
      }

      const currentState = mergedLogChildrenMap[stateKey];
      if (!currentState || (!currentState.loaded && !currentState.loading)) {
        void loadMergedLogChildren(item);
      }
    },
    [expandedMergedLogMap, loadMergedLogChildren, mergedLogChildrenMap],
  );

  const handleLogCardKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>, item: AccountLogItem) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openLogDetail(item);
      }
    },
    [openLogDetail],
  );

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || !isAuthenticated) {
      return;
    }

    const requestKey = queryKeyRef.current;
    const nextPage = page + 1;

    setLoadingMore(true);
    setLoadMoreError(null);

    try {
      const response = isWithdrawScene
        ? await rechargeApi.getMyWithdrawList({
            limit: PAGE_SIZE,
            page: nextPage,
          })
        : isRechargeScene
          ? await rechargeApi.getMyOrderList({
              limit: PAGE_SIZE,
              page: nextPage,
            })
        : await accountApi.getLogList(
            buildQueryParams(viewMode, selectedCategoryQuery, flowFilter, rangeFilter, keyword, nextPage),
          );

      if (queryKeyRef.current !== requestKey) {
        return;
      }

      if (isWithdrawScene) {
        setWithdrawItems((current) => [...current, ...(response.list as WithdrawRecord[])]);
      } else if (isRechargeScene) {
        setRechargeItems((current) => [...current, ...(response.list as RechargeOrderRecord[])]);
      } else {
        setItems((current) => [...current, ...(response.list as AccountLogItem[])]);
      }
      setPage(response.currentPage);
      setHasMore(getBillingListHasMore(response));

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
  }, [
    category,
    flowFilter,
    hasMore,
    isAuthenticated,
    isRechargeScene,
    isWithdrawScene,
    keyword,
    loadingMore,
    page,
    rangeFilter,
    selectedCategoryQuery,
    viewMode,
  ]);

  useInfiniteScroll({
    disabled:
      Boolean(selectedLog) ||
      Boolean(selectedRechargeRecord) ||
      Boolean(selectedWithdrawRecord) ||
      isOffline ||
      Boolean(loadMoreError) ||
      Boolean(paginationNotice),
    hasMore,
    loading: loadingMore || listLoading,
    onLoadMore: loadMore,
    rootRef: scrollContainerRef,
    targetRef: loadMoreRef,
  });

  const logs = items;
  const rechargeLogs = rechargeItems;
  const withdrawLogs = withdrawItems;

  const detailBreakdownEntries = useMemo(() => {
    const source = {
      ...(selectedLog?.breakdown ?? {}),
      ...(selectedDetail?.breakdown ?? {}),
    } as Record<string, unknown>;

    return buildBreakdownEntries(Object.keys(source).length ? source : undefined);
  }, [selectedDetail?.breakdown, selectedLog?.breakdown]);

  useRouteScrollRestoration({
    containerRef: scrollContainerRef,
    enabled: isAuthenticated && !selectedLog && !selectedRechargeRecord && !selectedWithdrawRecord,
    namespace: `${sessionNamespace}:scroll`,
    restoreDeps: [
      category,
      flowFilter,
      keyword,
      isWithdrawScene ? withdrawLogs.length : isRechargeScene ? rechargeLogs.length : logs.length,
      listLoading,
      rangeFilter,
      viewMode,
    ],
    restoreWhen:
      isAuthenticated && !selectedLog && !selectedRechargeRecord && !selectedWithdrawRecord && !listLoading,
  });

  useViewScrollSnapshot({
    active: !selectedLog && !selectedRechargeRecord && !selectedWithdrawRecord,
    containerRef: scrollContainerRef,
    enabled: isAuthenticated,
  });

  const handleRefresh = () => {
    refreshStatus();

    if (!isRechargeScene && !isWithdrawScene && selectedLog) {
      return reloadDetail().catch(() => undefined) as Promise<unknown>;
    }

    return reloadList().catch(() => undefined) as Promise<unknown>;
  };

  const handleBack = () => {
    if (selectedLog || selectedRechargeRecord || selectedWithdrawRecord) {
      navigate(-1);
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
    <div className="shrink-0 bg-bg-card">
      <div className="relative flex items-center border-b border-border-light px-4 py-3 pt-safe">
        <button
          type="button"
          onClick={handleBack}
          className="absolute left-4 z-10 p-1 text-text-sub active:opacity-70"
          aria-label="返回"
        >
          <ArrowLeft size={20} />
        </button>
        {selectedRechargeRecord ? (
          <>
            <h1 className="w-full text-center text-lg font-bold text-text-main">{'充值详情'}</h1>
            {/* 
          <h1 className="w-full text-center text-lg font-bold text-text-main">充值详情</h1> 
            */}
          </>
        ) : null}
        {selectedWithdrawRecord ? (
          <h1 className="w-full text-center text-lg font-bold text-text-main">提现详情</h1>
        ) : null}
        <h1
          className={`w-full text-center text-lg font-bold text-text-main ${
            selectedRechargeRecord || selectedWithdrawRecord ? 'hidden' : ''
          }`}
        >
          {selectedLog ? '资金明细详情' : scene === 'all' ? '历史记录' : sceneConfig.title}
        </h1>
      </div>
    </div>
  );

  const renderFilters = () => {
    if (selectedLog || selectedRechargeRecord || selectedWithdrawRecord) {
      return null;
    }

    if (isRechargeScene || isWithdrawScene) {
      return (
        <div className="z-20 shrink-0 bg-bg-card">
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
        </div>
      );
    }

    return (
      <div className="z-20 shrink-0 bg-bg-card">
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
    const currentListLength = isWithdrawScene ? withdrawLogs.length : isRechargeScene ? rechargeLogs.length : logs.length;

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

    if (!hasMore && currentListLength > 5) {
      return <span className="text-xs text-gray-300">- 到底了 -</span>;
    }

    return hasMore ? <span className="text-xs text-gray-300">继续下滑加载</span> : null;
  };

  const renderRechargeList = () => {
    if (listLoading && !rechargeLogs.length) {
      return renderListSkeleton();
    }

    if (listError && !rechargeLogs.length) {
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

    if (!rechargeLogs.length) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <Receipt size={24} className="text-gray-300" />
          </div>
          <span className="text-xs text-gray-400">{sceneConfig.emptyMessage}</span>
        </div>
      );
    }

    return (
      <div className="space-y-3 p-3 pb-10">
        {rechargeLogs.map((item, index) => (
          <button
            key={`${item.id}-${item.orderNo ?? item.createTime ?? index}`}
            type="button"
            onClick={() => openRechargeDetail(item)}
            className="group w-full rounded-xl border border-gray-100 bg-white p-4 text-left shadow-sm transition-all active:scale-[0.99] active:bg-gray-50"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="mb-1.5 flex flex-wrap items-center gap-2">
                  <span className="inline-flex shrink-0 rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-600">
                    {getRechargeRecordTypeLabel(item.recordType)}
                  </span>
                  <span
                    className={`inline-flex shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${getRechargeRecordStatusBadgeClassName(item)}`}
                  >
                    {getRechargeRecordStatusText(item)}
                  </span>
                </div>
                <div className="truncate text-sm font-medium text-gray-800">{getRechargeRecordTitle(item)}</div>
                <div className="mt-1 text-xs text-gray-400">{getRechargeRecordSubtitle(item) || '--'}</div>
                <div className="mt-1 truncate text-xs text-gray-400">{item.orderNo || `记录 #${item.id}`}</div>
              </div>

              <div className="flex shrink-0 items-start gap-2">
                <div className="text-right">
                  <div className="text-base font-bold text-red-500">+{formatMoney(item.amount)}</div>
                  <div className="mt-1 text-xs text-gray-500">{item.createTimeText || '--'}</div>
                </div>
                <ChevronRight size={16} className="mt-0.5 text-gray-300" />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-gray-50 pt-2 text-[11px] text-gray-400">
              <span className="truncate">{item.paymentTypeText || '系统处理'}</span>
              <span className="truncate">{item.statusText || getRechargeRecordStatusText(item)}</span>
            </div>
          </button>
        ))}

        <div ref={loadMoreRef} className="flex min-h-[56px] items-center justify-center py-3">
          {renderLoadMore()}
        </div>
      </div>
    );
  };

  const renderWithdrawList = () => {
    if (listLoading && !withdrawLogs.length) {
      return renderListSkeleton();
    }

    if (listError && !withdrawLogs.length) {
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

    if (!withdrawLogs.length) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <Receipt size={24} className="text-gray-300" />
          </div>
          <span className="text-xs text-gray-400">{sceneConfig.emptyMessage}</span>
        </div>
      );
    }

    return (
      <div className="space-y-3 p-3 pb-10">
        {withdrawLogs.map((item, index) => (
          <button
            key={`${item.id}-${item.createTime ?? index}`}
            type="button"
            onClick={() => openWithdrawDetail(item)}
            className="group w-full rounded-xl border border-gray-100 bg-white p-4 text-left shadow-sm transition-all active:scale-[0.99] active:bg-gray-50"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="mb-1.5 flex flex-wrap items-center gap-2">
                  <span className="inline-flex shrink-0 rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-600">
                    {item.accountTypeText || '提现账户'}
                  </span>
                  <span
                    className={`inline-flex shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${getWithdrawStatusBadgeClassName(item.status)}`}
                  >
                    {item.statusText || '处理中'}
                  </span>
                </div>
                <div className="truncate text-sm font-medium text-gray-800">{getWithdrawAccountTitle(item)}</div>
                <div className="mt-1 text-xs text-gray-400">{getWithdrawAccountSubtitle(item)}</div>
                <div className="mt-1 text-xs text-gray-400">{item.createTimeText || '--'}</div>
              </div>

              <div className="flex shrink-0 items-start gap-2">
                <div className="text-right">
                  <div className="text-base font-bold text-gray-900">-{formatMoney(item.amount)}</div>
                  <div className="mt-1 text-xs text-gray-500">到账 {formatMoney(item.actualAmount)}</div>
                </div>
                <ChevronRight size={16} className="mt-0.5 text-gray-300" />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-gray-50 pt-2 text-[11px] text-gray-400">
              <span className="truncate">手续费 {formatMoney(item.fee)}</span>
              <span className="truncate">记录 #{item.id}</span>
            </div>
          </button>
        ))}

        <div ref={loadMoreRef} className="flex min-h-[56px] items-center justify-center py-3">
          {renderLoadMore()}
        </div>
      </div>
    );
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
          const mergedStateKey = getMergedLogChildrenStateKey(item);
          const mergedChildrenState = mergedLogChildrenMap[mergedStateKey];
          const mergedExpanded = Boolean(expandedMergedLogMap[mergedStateKey]);
          const mergedCount = mergedChildrenState?.total || item.mergeRowCount || 0;
          const showMergedToggle = canExpandMergedLogChildren(item);

          return (
            <div
              key={`${item.id}-${item.flowNo ?? item.createTime ?? index}`}
              role="button"
              tabIndex={0}
              onClick={() => openLogDetail(item)}
              onKeyDown={(event) => handleLogCardKeyDown(event, item)}
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
                    {item.isMerged || (item.mergeRowCount ?? 0) > 1 ? (
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

              {showMergedToggle ? (
                <div className="mt-2 border-t border-gray-50 pt-2" onClick={(event) => event.stopPropagation()}>
                  <button
                    type="button"
                    onClick={(event) => handleToggleMergedLogChildren(event, item)}
                    className="flex w-full items-center justify-between rounded-lg bg-gray-50/80 px-2.5 py-2 text-xs text-gray-600 active:bg-gray-100"
                  >
                    <span className="font-medium text-gray-700">
                      {mergedExpanded ? '收起合并流水子明细' : '展开合并流水子明细'}
                    </span>
                    <span className="flex items-center gap-1 text-gray-500">
                      {mergedCount > 0 ? `${mergedCount} 条` : '查看'}
                      <ChevronRight
                        size={14}
                        className={`transition-transform duration-200 ${mergedExpanded ? 'rotate-90' : ''}`}
                      />
                    </span>
                  </button>

                  {mergedExpanded ? (
                    <div className="mt-2 rounded-lg border border-gray-100 bg-white px-2.5 py-1.5">
                      {mergedChildrenState?.mergeScene ? (
                        <div className="mb-1 text-[11px] text-gray-400">场景：{mergedChildrenState.mergeScene}</div>
                      ) : null}

                      {mergedChildrenState?.loading ? (
                        <div className="flex items-center justify-center py-3 text-xs text-gray-400">
                          <Loader2 size={12} className="mr-1.5 animate-spin" />
                          加载子明细中...
                        </div>
                      ) : null}

                      {!mergedChildrenState?.loading && mergedChildrenState?.error ? (
                        <div className="flex items-center justify-between gap-2 py-2 text-xs text-red-500">
                          <span className="line-clamp-2">{mergedChildrenState.error}</span>
                          <button
                            type="button"
                            onClick={() => void loadMergedLogChildren(item)}
                            className="shrink-0 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-600 active:opacity-80"
                          >
                            重试
                          </button>
                        </div>
                      ) : null}

                      {!mergedChildrenState?.loading &&
                      !mergedChildrenState?.error &&
                      mergedChildrenState &&
                      mergedChildrenState.items.length === 0 ? (
                        <div className="py-3 text-center text-xs text-gray-400">暂无子明细</div>
                      ) : null}

                      {!mergedChildrenState?.loading &&
                      !mergedChildrenState?.error &&
                      mergedChildrenState &&
                      mergedChildrenState.items.length > 0 ? (
                        <div>
                          {mergedChildrenState.items.map((child, childIndex) => {
                            const childMemoText = child.memo?.trim();
                            const childBizLabel = formatBizTypeLabel(child.bizType);
                            const childTitleText = childMemoText || childBizLabel;
                            const childBeforeValueText = formatMoney(child.beforeValue);
                            const childAfterValueText = formatMoney(child.afterValue);

                            return (
                              <div
                                key={`${child.id}-${child.flowNo ?? child.createTime ?? childIndex}`}
                                className={`flex items-start justify-between gap-2 py-2 ${childIndex > 0 ? 'border-t border-gray-50' : ''}`}
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="truncate text-xs text-gray-700">{childTitleText}</div>
                                  <div className="mt-0.5 text-[11px] text-gray-400">{child.createTimeText || '--'}</div>
                                  <div className="mt-0.5 truncate text-[11px] text-gray-400">
                                    {child.flowNo || `记录 #${child.id}`}
                                  </div>
                                </div>

                                <div className="shrink-0 text-right">
                                  <div
                                    className={`text-xs font-semibold ${getLegacyListAmountClassName(child.accountType, child.amount)}`}
                                  >
                                    {formatSignedMoney(child.amount)}
                                  </div>
                                  <div className="mt-0.5 font-mono text-[11px] text-gray-400">
                                    <span>{childBeforeValueText}</span>
                                    <span className="mx-1 text-gray-300">→</span>
                                    <span className={getLegacyBalanceAfterClassName(child.accountType, child.amount)}>
                                      {childAfterValueText}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
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

  const renderRechargeDetail = () => {
    if (!selectedRechargeRecord) {
      return null;
    }

    const record = selectedRechargeRecord;
    const statusText = getRechargeRecordStatusText(record);
    const recordTypeText = getRechargeRecordTypeLabel(record.recordType);

    return (
      <div className="space-y-4 p-4 pb-10">
        <div
          className={`rounded-2xl bg-gradient-to-br ${getRechargeRecordStatusCardClassName(record)} p-6 text-white shadow-lg`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm opacity-85">{statusText}</div>
              <div className="mt-2 font-[DINAlternate-Bold,Roboto,sans-serif] text-4xl font-bold">
                +{formatMoney(record.amount)}
              </div>
              <div className="mt-2 text-xs opacity-80">{record.createTimeText || '--'}</div>
            </div>
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white">
              {recordTypeText}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-white/12 p-3 text-sm">
            <div>
              <div className="text-xs opacity-80">支付方式</div>
              <div className="mt-1 font-medium">{record.paymentTypeText || '系统处理'}</div>
            </div>
            <div>
              <div className="text-xs opacity-80">状态</div>
              <div className="mt-1 font-medium">{statusText}</div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
            <Receipt className="h-5 w-5 text-red-600" />
            <h2 className="text-base font-semibold text-gray-900">充值信息</h2>
          </div>

          <div className="space-y-1">
            {renderDetailInfoRow('记录类型', recordTypeText, {
              icon: Receipt,
            })}
            {renderDetailInfoRow('记录ID', String(record.id || '--'), {
              copyable: Boolean(record.id),
              fieldKey: 'recharge-id',
              icon: Hash,
              successMessage: '记录ID已复制',
            })}
            {record.orderNo
              ? renderDetailInfoRow('订单号', record.orderNo, {
                  copyable: true,
                  fieldKey: 'recharge-order-no',
                  successMessage: '订单号已复制',
                })
              : null}
            {renderDetailInfoRow('充值金额', formatMoney(record.amount))}
            {renderDetailInfoRow('支付方式', record.paymentTypeText || '系统处理')}
            {renderDetailInfoRow('状态', statusText, {
              icon: TrendingUp,
            })}
          </div>
        </div>

        {record.auditRemark ? (
          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
              <FileText className="h-5 w-5 text-red-600" />
              <h2 className="text-base font-semibold text-gray-900">审核备注</h2>
            </div>

            <div className="space-y-1">
              {renderDetailInfoRow('备注内容', record.auditRemark)}
            </div>
          </div>
        ) : null}

        {record.paymentScreenshot ? (
          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
              <Package className="h-5 w-5 text-red-600" />
              <h2 className="text-base font-semibold text-gray-900">付款凭证</h2>
            </div>
            <div className="overflow-hidden rounded-xl bg-gray-50">
              <img src={record.paymentScreenshot} alt="付款凭证" className="h-auto w-full object-cover" />
            </div>
          </div>
        ) : null}

        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
            <Calendar className="h-5 w-5 text-red-600" />
            <h2 className="text-base font-semibold text-gray-900">时间节点</h2>
          </div>

          <div className="space-y-1">
            {renderDetailInfoRow('创建时间', record.createTimeText || '--', {
              icon: Calendar,
            })}
            {record.auditTimeText ? renderDetailInfoRow('审核时间', record.auditTimeText) : null}
          </div>
        </div>
      </div>
    );
  };

  const renderWithdrawDetail = () => {
    if (!selectedWithdrawRecord) {
      return null;
    }

    const record = selectedWithdrawRecord;
    const accountTypeText = record.accountTypeText || '提现账户';
    const accountTitle = getWithdrawAccountTitle(record);
    const accountSubtitle = getWithdrawAccountSubtitle(record);

    return (
      <div className="space-y-4 p-4 pb-10">
        <div
          className={`rounded-2xl bg-gradient-to-br ${getWithdrawStatusCardClassName(record.status)} p-6 text-white shadow-lg`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm opacity-85">{record.statusText || '处理中'}</div>
              <div className="mt-2 font-[DINAlternate-Bold,Roboto,sans-serif] text-4xl font-bold">
                -{formatMoney(record.amount)}
              </div>
              <div className="mt-2 text-xs opacity-80">{record.createTimeText || '--'}</div>
            </div>
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white">
              {accountTypeText}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-white/12 p-3 text-sm">
            <div>
              <div className="text-xs opacity-80">到账金额</div>
              <div className="mt-1 font-medium">{formatMoney(record.actualAmount)}</div>
            </div>
            <div>
              <div className="text-xs opacity-80">手续费</div>
              <div className="mt-1 font-medium">{formatMoney(record.fee)}</div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
            <Receipt className="h-5 w-5 text-red-600" />
            <h2 className="text-base font-semibold text-gray-900">提现信息</h2>
          </div>

          <div className="space-y-1">
            {renderDetailInfoRow('记录ID', String(record.id || '--'), {
              copyable: Boolean(record.id),
              fieldKey: 'withdraw-id',
              icon: Hash,
              successMessage: '记录ID已复制',
            })}
            {renderDetailInfoRow('提现状态', record.statusText || '--', {
              icon: TrendingUp,
            })}
            {renderDetailInfoRow('提现金额', formatMoney(record.amount))}
            {renderDetailInfoRow('到账金额', formatMoney(record.actualAmount))}
            {renderDetailInfoRow('手续费', formatMoney(record.fee))}
            {renderDetailInfoRow('账户类型', accountTypeText, {
              icon: Receipt,
            })}
            {renderDetailInfoRow('账户名称', accountTitle)}
            {renderDetailInfoRow('账户号码', record.accountNumber, {
              copyable: Boolean(record.accountNumber),
              fieldKey: 'withdraw-account-number',
              successMessage: '账户号码已复制',
            })}
            {record.bankName
              ? renderDetailInfoRow('开户银行', record.bankName, {
                  icon: Package,
                })
              : null}
            {accountSubtitle !== '--' ? renderDetailInfoRow('账户摘要', accountSubtitle) : null}
          </div>
        </div>

        {record.auditReason || record.payReason || record.remark ? (
          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
              <FileText className="h-5 w-5 text-red-600" />
              <h2 className="text-base font-semibold text-gray-900">处理说明</h2>
            </div>

            <div className="space-y-1">
              {record.auditReason ? renderDetailInfoRow('审核原因', record.auditReason) : null}
              {record.payReason ? renderDetailInfoRow('打款原因', record.payReason) : null}
              {record.remark ? renderDetailInfoRow('备注', record.remark) : null}
            </div>
          </div>
        ) : null}

        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
            <Calendar className="h-5 w-5 text-red-600" />
            <h2 className="text-base font-semibold text-gray-900">时间节点</h2>
          </div>

          <div className="space-y-1">
            {renderDetailInfoRow('申请时间', record.createTimeText || '--', {
              icon: Calendar,
            })}
            {record.auditTimeText ? renderDetailInfoRow('审核时间', record.auditTimeText) : null}
            {record.payTimeText ? renderDetailInfoRow('打款时间', record.payTimeText) : null}
          </div>
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
      <div className="billing-dark-scope flex h-full flex-1 flex-col bg-bg-base">
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
    <div className="billing-dark-scope relative flex h-full flex-1 flex-col bg-bg-base">
      {isOffline ? (
        <OfflineBanner onAction={handleRefresh} className="absolute top-12 right-0 left-0 z-50" />
      ) : null}

      <div className="sticky top-0 z-30">
        {renderHeader()}
        {renderFilters()}
      </div>

      <PullToRefreshContainer onRefresh={handleRefresh} disabled={isOffline}>
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto no-scrollbar">
          {isRechargeScene
            ? selectedRechargeRecord
              ? renderRechargeDetail()
              : renderRechargeList()
            : isWithdrawScene
            ? selectedWithdrawRecord
              ? renderWithdrawDetail()
              : renderWithdrawList()
            : selectedLog
              ? renderDetail()
              : renderLogList()}
        </div>
      </PullToRefreshContainer>

      {detailLoading && selectedDetail ? (
        <div className="pointer-events-none absolute right-4 bottom-4 flex items-center rounded-full border border-border-light bg-bg-card/90 px-3 py-2 text-sm text-text-main shadow-sm">
          <Loader2 size={14} className="mr-2 animate-spin" />
          加载详情中...
        </div>
      ) : null}
    </div>
  );
}

export default BillingPage;
