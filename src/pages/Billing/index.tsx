import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  FileText,
  Loader2,
} from 'lucide-react';
import { accountApi, type AccountLogItem, type AccountMoneyLogDetail } from '../../api';
import { getErrorMessage } from '../../api/core/errors';
import { OfflineBanner } from '../../components/layout/OfflineBanner';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { Skeleton } from '../../components/ui/Skeleton';
import { useAuthSession } from '../../hooks/useAuthSession';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useRequest } from '../../hooks/useRequest';
import { useRouteScrollRestoration } from '../../hooks/useRouteScrollRestoration';
import { useSessionState } from '../../hooks/useSessionState';
import { useViewScrollSnapshot } from '../../hooks/useViewScrollSnapshot';
import { useAppNavigate } from '../../lib/navigation';

type BillingFilterKey = 'all' | 'income' | 'expense' | 'score';

const FILTER_OPTIONS: Array<{ key: BillingFilterKey; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'income', label: '收入' },
  { key: 'expense', label: '支出' },
  { key: 'score', label: '消费金' },
];

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  balance_available: '可用余额',
  green_power: '绿色算力',
  pending_activation_gold: '待激活确权金',
  score: '消费金',
  service_fee_balance: '服务费余额',
  static_income: '静态收益',
  withdrawable_money: '可提现收益',
};

const BIZ_TYPE_LABELS: Record<string, string> = {
  consignment_income: '寄售收益',
  matching_buy: '匹配购买',
  recharge: '充值',
  register_reward: '注册奖励',
  score_exchange: '消费金兑换',
  sign_in: '签到奖励',
  transfer: '余额划转',
  withdraw: '提现',
};

function formatMoney(value: number | string | undefined, fractionDigits = 2) {
  const nextValue = typeof value === 'string' ? Number(value) : value;
  if (typeof nextValue !== 'number' || !Number.isFinite(nextValue)) {
    return '--';
  }

  return nextValue.toLocaleString('zh-CN', {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  });
}

function formatSignedMoney(value: number) {
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${formatMoney(value)}`;
}

function formatAccountTypeLabel(type: string | undefined) {
  if (!type) {
    return '账户资金';
  }

  return ACCOUNT_TYPE_LABELS[type] || type;
}

function formatBizTypeLabel(type: string | undefined) {
  if (!type) {
    return '资金明细';
  }

  return BIZ_TYPE_LABELS[type] || type;
}

function getAmountClassName(amount: number) {
  if (amount > 0) {
    return 'text-green-600';
  }

  if (amount < 0) {
    return 'text-text-main';
  }

  return 'text-text-sub';
}

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

function buildBreakdownEntries(detail: AccountMoneyLogDetail) {
  if (!detail.breakdown) {
    return [];
  }

  return Object.entries(detail.breakdown)
    .filter(([, value]) => value !== null && value !== undefined && value !== '')
    .map(([key, value]) => ({
      key,
      label: ACCOUNT_TYPE_LABELS[key] || key.replace(/_/g, ' '),
      value:
        typeof value === 'number'
          ? formatMoney(value)
          : typeof value === 'string'
            ? value
            : JSON.stringify(value),
    }));
}

function buildFilterParams(filter: BillingFilterKey) {
  switch (filter) {
    case 'income':
      return { flowDirection: 'in' as const };
    case 'expense':
      return { flowDirection: 'out' as const };
    case 'score':
      return { type: 'score' as const };
    default:
      return {};
  }
}

export const BillingPage = () => {
  const { goBack, goTo } = useAppNavigate();
  const { isAuthenticated } = useAuthSession();
  const { isOffline, refreshStatus } = useNetworkStatus();
  const { showToast } = useFeedback();
  const [activeFilter, setActiveFilter] = useSessionState<BillingFilterKey>('billing-page:filter', 'all');
  const [selectedLog, setSelectedLog] = useState<AccountLogItem | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const {
    data: logList,
    error: logListError,
    loading: logListLoading,
    reload: reloadLogList,
  } = useRequest(
    (signal) => accountApi.getAllLog({ ...buildFilterParams(activeFilter), limit: 50, page: 1 }, { signal }),
    {
      deps: [activeFilter, isAuthenticated],
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
            },
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

  const logs = logList?.list ?? [];
  const groupedLogs = useMemo(() => {
    const groups = new Map<string, AccountLogItem[]>();

    logs.forEach((item) => {
      const label = getMonthLabel(item);
      const group = groups.get(label) ?? [];
      group.push(item);
      groups.set(label, group);
    });

    return Array.from(groups.entries()).map(([label, items]) => ({
      label,
      items,
    }));
  }, [logs]);
  const detailBreakdownEntries = useMemo(
    () => (selectedDetail ? buildBreakdownEntries(selectedDetail) : []),
    [selectedDetail],
  );

  useRouteScrollRestoration({
    containerRef: scrollContainerRef,
    enabled: isAuthenticated && !selectedLog,
    namespace: 'billing-page',
    restoreDeps: [activeFilter, isAuthenticated, logListLoading, logs.length],
    restoreWhen: isAuthenticated && !selectedLog && !logListLoading,
  });

  useViewScrollSnapshot({
    active: !selectedLog,
    containerRef: scrollContainerRef,
    enabled: isAuthenticated,
  });

  const handleReload = () => {
    refreshStatus();
    if (selectedLog) {
      void reloadDetail().catch(() => undefined);
      return;
    }

    void reloadLogList().catch(() => undefined);
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

    try {
      await navigator.clipboard.writeText(nextValue);
      showToast({ message: successMessage, type: 'success' });
    } catch {
      showToast({ message: '复制失败，请稍后重试', type: 'error' });
    }
  };

  const renderHeader = () => (
    <div className="sticky top-0 z-40 bg-bg-base/90 backdrop-blur-md">
      <div className="flex h-12 items-center justify-between px-4">
        <button onClick={handleBack} className="p-1 -ml-1 text-text-main active:opacity-70">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-2xl font-medium text-text-main">{selectedLog ? '账单详情' : '账单明细'}</h1>
        <button
          type="button"
          className="flex items-center text-sm text-text-sub active:opacity-70"
          onClick={() => goTo('recharge')}
        >
          <FileText size={16} className="mr-1" />
          充值
        </button>
      </div>
    </div>
  );

  const renderTabs = () => {
    if (selectedLog) {
      return null;
    }

    return (
      <div className="sticky top-12 z-30 flex border-b border-border-light bg-bg-card px-2">
        {FILTER_OPTIONS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setActiveFilter(item.key)}
            className={`relative flex-1 py-3 text-sm font-medium transition-colors ${
              activeFilter === item.key ? 'text-primary-start' : 'text-text-sub'
            }`}
          >
            {item.label}
            {activeFilter === item.key ? (
              <span className="absolute bottom-0 left-1/2 h-[3px] w-8 -translate-x-1/2 rounded-t-full bg-primary-start" />
            ) : null}
          </button>
        ))}
      </div>
    );
  };

  const renderListSkeleton = () => (
    <div className="space-y-6 p-4">
      {[1, 2].map((group) => (
        <div key={group} className="space-y-3">
          <Skeleton className="h-5 w-24" />
          <Card className="space-y-4 p-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex items-center justify-between">
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

  const renderLogList = () => {
    if (logListLoading) {
      return renderListSkeleton();
    }

    if (logListError && !logs.length) {
      return <ErrorState message={getErrorMessage(logListError)} onRetry={reloadLogList} />;
    }

    if (!logs.length) {
      return <EmptyState message="暂无账单记录" />;
    }

    return (
      <div className="space-y-6 p-4 pb-10">
        {groupedLogs.map((group) => (
          <div key={group.label}>
            <div className="mb-3 ml-1 text-md font-bold text-text-main">{group.label}</div>
            <Card className="overflow-hidden p-0">
              {group.items.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedLog(item)}
                  className={`flex w-full items-center justify-between px-4 py-3 text-left transition-colors active:bg-bg-base ${
                    index < group.items.length - 1 ? 'border-b border-border-light' : ''
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-md font-medium text-text-main">
                      {formatBizTypeLabel(item.bizType)}
                    </div>
                    <div className="mt-1 truncate text-sm text-text-sub">
                      {item.remark || item.memo || formatAccountTypeLabel(item.accountType)}
                    </div>
                    <div className="mt-1 truncate text-xs text-text-aux">
                      {item.createTimeText || item.flowNo || `记录 #${item.id}`}
                    </div>
                  </div>
                  <div className="ml-3 flex shrink-0 items-center">
                    <div className="mr-2 text-right">
                      <div className={`text-md font-semibold ${getAmountClassName(item.amount)}`}>
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
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </Card>
        </div>
      );
    }

    if (detailError && !selectedDetail) {
      return <ErrorState message={getErrorMessage(detailError)} onRetry={reloadDetail} />;
    }

    if (!selectedDetail) {
      return null;
    }

    return (
      <div className="space-y-4 p-4 pb-10">
        <Card className="p-6">
          <div className="mb-6 flex flex-col items-center">
            <div className="mb-2 text-sm text-text-sub">{formatBizTypeLabel(selectedDetail.bizType)}</div>
            <div className={`text-6xl font-bold ${getAmountClassName(selectedDetail.amount)}`}>
              {formatSignedMoney(selectedDetail.amount)}
            </div>
            <div className="mt-2 text-sm text-text-aux">
              {formatAccountTypeLabel(selectedDetail.accountType)}
            </div>
          </div>

          <div className="space-y-4">
            {renderDetailRow('账户类型', formatAccountTypeLabel(selectedDetail.accountType))}
            {renderDetailRow('业务类型', formatBizTypeLabel(selectedDetail.bizType))}
            {renderDetailRow('创建时间', selectedDetail.createTimeText)}
            {renderDetailRow('变动前金额', formatMoney(selectedDetail.beforeValue))}
            {renderDetailRow('变动后金额', formatMoney(selectedDetail.afterValue))}
            {renderDetailRow('备注说明', selectedDetail.memo)}
            {renderDetailRow('流水号', selectedDetail.flowNo, {
              copyable: true,
              successMessage: '流水号已复制',
            })}
            {renderDetailRow('批次号', selectedDetail.batchNo, {
              copyable: true,
              successMessage: '批次号已复制',
            })}
            {renderDetailRow('业务ID', selectedDetail.bizId)}
          </div>
        </Card>

        {selectedDetail.titleSnapshot || selectedDetail.imageSnapshot ? (
          <Card className="overflow-hidden p-0">
            <div className="border-b border-border-light px-4 py-3 text-md font-medium text-text-main">
              关联资产
            </div>
            <div className="flex items-center p-4">
              {selectedDetail.imageSnapshot ? (
                <img
                  src={selectedDetail.imageSnapshot}
                  alt={selectedDetail.titleSnapshot || '关联资产'}
                  className="mr-3 h-14 w-14 rounded-2xl object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : null}
              <div className="min-w-0">
                <div className="truncate text-md font-medium text-text-main">
                  {selectedDetail.titleSnapshot || '未命名资产'}
                </div>
                <div className="mt-1 text-sm text-text-sub">
                  藏品 ID：{selectedDetail.userCollectionId ?? '--'} / 商品 ID：{selectedDetail.itemId ?? '--'}
                </div>
              </div>
            </div>
          </Card>
        ) : null}

        {detailBreakdownEntries.length ? (
          <Card className="p-4">
            <div className="mb-3 text-md font-medium text-text-main">资金结构</div>
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
      <div className="flex h-full flex-1 flex-col bg-red-50/30">
        {renderHeader()}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto no-scrollbar px-4">
          <EmptyState
            message="登录后查看账单明细"
            actionText="去登录"
            actionVariant="primary"
            onAction={() => goTo('login')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-1 flex-col bg-red-50/30">
      {isOffline && <OfflineBanner onAction={handleReload} className="absolute top-12 right-0 left-0 z-50" />}

      {renderHeader()}
      {renderTabs()}

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto no-scrollbar">
        {selectedLog ? renderDetail() : renderLogList()}
      </div>

      {detailLoading && selectedDetail ? (
        <div className="pointer-events-none absolute right-4 bottom-4 flex items-center rounded-full bg-gray-900/85 px-3 py-2 text-sm text-white shadow-sm">
          <Loader2 size={14} className="mr-2 animate-spin" />
          加载详情中
        </div>
      ) : null}
    </div>
  );
};
