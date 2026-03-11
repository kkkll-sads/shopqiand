/**
 * @file RightsHistory/index.tsx - 确权记录页面
 * @description 展示用户的确权操作历史记录列表。
 */

import { useRef, useState } from 'react'; // React 核心 Hook
import { FileText } from 'lucide-react';
import { rightsDeclarationApi, type RightsDeclarationStatus } from '../../api';
import { getErrorMessage } from '../../api/core/errors';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { PullToRefreshContainer } from '../../components/ui/PullToRefreshContainer';
import { useRouteScrollRestoration } from '../../hooks/useRouteScrollRestoration';
import { useRequest } from '../../hooks/useRequest';
import { useAppNavigate } from '../../lib/navigation';

const VOUCHER_TYPES: Record<string, string> = {
  other: '其他',
  screenshot: '截图凭证',
  transfer_record: '转账记录',
};

const STATUS_MAP: Record<
  RightsDeclarationStatus,
  { bg: string; color: string; text: string }
> = {
  approved: { text: '已通过', color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-500/10' },
  cancelled: { text: '已取消', color: 'text-gray-500 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-500/10' },
  pending: { text: '审核中', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10' },
  rejected: { text: '已驳回', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10' },
};

type HistoryFilter = 'all' | RightsDeclarationStatus;

const FILTER_OPTIONS: Array<{ label: string; value: HistoryFilter }> = [
  { label: '全部', value: 'all' },
  { label: '审核中', value: 'pending' },
  { label: '已通过', value: 'approved' },
  { label: '已驳回', value: 'rejected' },
  { label: '已取消', value: 'cancelled' },
];

function HistorySkeleton() {
  return (
    <div className="space-y-3 p-4">
      {[1, 2, 3].map((item) => (
        <Card
          key={item}
          className="h-28 animate-pulse rounded-2xl bg-white dark:bg-bg-card"
        />
      ))}
    </div>
  );
}

export function RightsHistoryPage() {
  const { goBack } = useAppNavigate();
  const [statusFilter, setStatusFilter] = useState<HistoryFilter>('all');
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const {
    data,
    error,
    loading,
    reload,
  } = useRequest(
    (signal) =>
      rightsDeclarationApi.getList(
        {
          limit: 50,
          status: statusFilter === 'all' ? undefined : statusFilter,
        },
        { signal },
      ),
    {
      cacheKey: `rights-declaration:list:${statusFilter}`,
      deps: [statusFilter],
    },
  );

  useRouteScrollRestoration({
    containerRef: scrollContainerRef,
    namespace: 'rights-history-page',
    restoreDeps: [loading, statusFilter, data?.list.length ?? 0],
    restoreWhen: !loading,
  });

  const history = data?.list ?? [];

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-[#FDFBFB] dark:bg-bg-base">
      <PageHeader
        title="确权记录"
        onBack={goBack}
        className="border-b border-border-light bg-white/95 shadow-sm backdrop-blur-md dark:bg-bg-card/90"
        contentClassName="h-12 px-4"
      />

      <div className="border-b border-border-light bg-white px-4 py-3 dark:bg-bg-card">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {FILTER_OPTIONS.map((option) => {
            const active = statusFilter === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setStatusFilter(option.value)}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-gradient-to-r from-brand-start to-brand-end text-white shadow-sm'
                    : 'bg-gray-100 text-text-sub dark:bg-gray-800 dark:text-text-sub'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <PullToRefreshContainer
        className="flex-1 overflow-y-auto"
        onRefresh={async () => {
          await reload().catch(() => undefined);
        }}
      >
        <div ref={scrollContainerRef} className="pb-8">
          {loading && !data ? <HistorySkeleton /> : null}

          {!loading && error && !data ? (
            <ErrorState
              message={getErrorMessage(error)}
              onRetry={() => {
                void reload().catch(() => undefined);
              }}
            />
          ) : null}

          {!loading && !error && history.length === 0 ? (
            <EmptyState icon={<FileText size={48} />} message="暂无确权记录" />
          ) : null}

          {!loading && history.length > 0 ? (
            <div className="space-y-3 p-4">
            {history.map((record) => {
              const statusInfo = STATUS_MAP[record.status];
              return (
                <Card
                  key={record.id}
                  className="rounded-2xl border border-border-light bg-white p-4 shadow-sm dark:bg-bg-card"
                >
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div>
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-lg font-bold text-text-main">
                          {record.voucherTypeText || VOUCHER_TYPES[record.voucherType]}
                        </span>
                        <span className={`rounded px-1.5 py-0.5 text-xs ${statusInfo.bg} ${statusInfo.color}`}>
                          {record.statusText || statusInfo.text}
                        </span>
                      </div>
                      <div className="text-sm text-text-sub">{record.createTimeText}</div>
                      {record.reviewTimeText ? (
                        <div className="mt-1 text-xs text-text-aux">审核时间 {record.reviewTimeText}</div>
                      ) : null}
                    </div>
                    <div
                      className={`text-3xl font-bold ${
                        record.status === 'rejected' || record.status === 'cancelled'
                          ? 'text-text-main'
                          : 'text-red-500'
                      }`}
                    >
                      ¥{record.amount.toLocaleString('zh-CN', { useGrouping: false })}
                    </div>
                  </div>

                  {record.reviewRemark ? (
                    <div className="mt-3 rounded-lg border-t border-border-light bg-gray-50 p-2 pt-3 text-base text-text-sub dark:bg-gray-800/50">
                      {record.reviewRemark}
                    </div>
                  ) : null}
                </Card>
              );
            })}
            </div>
          ) : null}
        </div>
      </PullToRefreshContainer>
    </div>
  );
}

