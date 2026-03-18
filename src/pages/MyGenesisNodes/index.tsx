import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Cpu } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Skeleton } from '../../components/ui/Skeleton';
import { useRequest } from '../../hooks/useRequest';
import { useAppNavigate } from '../../lib/navigation';
import { genesisNodeApi, type GenesisNodeOrderStatusFilter } from '../../api/modules/genesisNode';
import { getGenesisStatusLabel, getGenesisStatusTone } from '../../features/node-purchase/genesis';

type RecordTab = GenesisNodeOrderStatusFilter;

const TABS: Array<{ id: RecordTab; label: string }> = [
  { id: 'pending', label: '待开奖' },
  { id: 'won', label: '已中签' },
  { id: 'lost', label: '未中签' },
];

function formatMoney(value: number): string {
  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    useGrouping: false,
  });
}

function getEmptyMessage(tab: RecordTab): string {
  if (tab === 'won') {
    return '暂无已中签记录';
  }

  if (tab === 'lost') {
    return '暂无未中签记录';
  }

  return '暂无待开奖记录';
}

function RecordsSkeleton() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-[#f7f8fa]">
      <PageHeader title="我的创世节点" className="border-b border-border-light" />
      <div className="sticky top-12 z-10 flex border-b border-border-light bg-white px-2">
        {TABS.map((tab) => (
          <div key={tab.id} className="flex-1 py-3 text-center">
            <Skeleton className="mx-auto h-4 w-16 rounded-full" />
          </div>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-[176px] rounded-[20px]" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function MyGenesisNodesPage() {
  const { goBackOr, goTo } = useAppNavigate();
  const [activeTab, setActiveTab] = useState<RecordTab>('pending');

  const ordersRequest = useRequest(
    (signal) => genesisNodeApi.getOrders({ page: 1, limit: 50, status: activeTab }, signal),
    {
      cacheKey: `genesis-node:orders:${activeTab}`,
      deps: [activeTab],
      keepPreviousData: true,
    },
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      void ordersRequest.reload().catch(() => undefined);
    }, 10000);

    return () => window.clearInterval(timer);
  }, [ordersRequest]);

  const filteredRecords = ordersRequest.data?.list ?? [];
  const loading = ordersRequest.loading && !ordersRequest.data;

  const noticeText = useMemo(() => {
    if (activeTab === 'won') {
      return '已中签条目可直接查看权益节点详情。';
    }

    if (activeTab === 'lost') {
      return '未中签条目不再走寄售路径，仅展示退款去向。';
    }

    return '待开奖条目会在开奖结果回写后自动更新状态。';
  }, [activeTab]);

  if (loading) {
    return <RecordsSkeleton />;
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-[#f7f8fa]">
      <PageHeader title="我的创世节点" onBack={() => goBackOr('genesis_node_activity')} className="border-b border-border-light" />

      <div className="sticky top-12 z-10 flex border-b border-border-light bg-white px-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex-1 py-3 text-center text-[14px] font-medium ${activeTab === tab.id ? 'text-primary-start' : 'text-text-sub'}`}
          >
            {tab.label}
            {activeTab === tab.id ? (
              <div className="absolute bottom-0 left-1/2 h-[3px] w-7 -translate-x-1/2 rounded-t-full bg-primary-start" />
            ) : null}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {ordersRequest.error && !ordersRequest.data ? (
          <ErrorState message={ordersRequest.error.message || '记录加载失败，请稍后重试'} onRetry={() => void ordersRequest.reload()} />
        ) : filteredRecords.length === 0 ? (
          <EmptyState message={getEmptyMessage(activeTab)} actionText="返回活动页" onAction={() => goTo('genesis_node_activity')} />
        ) : (
          <div className="space-y-3">
            {filteredRecords.map((record) => {
              const won = record.status === 1;
              const statusTone = getGenesisStatusTone(record);
              const statusLabel = getGenesisStatusLabel(record);

              return (
                <article
                  key={record.id}
                  className={`rounded-[20px] bg-white p-4 shadow-sm ${won ? 'cursor-pointer' : ''}`}
                  onClick={() => {
                    if (won) {
                      goTo(`/node-purchase/genesis/miner/${record.id}`);
                    }
                  }}
                  role={won ? 'button' : undefined}
                  tabIndex={won ? 0 : -1}
                  onKeyDown={(event) => {
                    if (!won) {
                      return;
                    }

                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      goTo(`/node-purchase/genesis/miner/${record.id}`);
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[12px] tracking-[0.18em] text-text-sub">申购金额</div>
                      <div className="mt-2 text-[30px] font-black leading-none text-text-main">¥{formatMoney(record.amount)}</div>
                    </div>
                    <div className={`rounded-full px-3 py-1 text-[12px] font-medium ${statusTone}`}>
                      {statusLabel}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 rounded-[16px] bg-[#f7f8fa] p-3 text-[12px] text-text-main">
                    <div className="flex items-center justify-between">
                      <span className="text-text-sub">批次日期</span>
                      <span className="font-medium">{record.activityDate || '--'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-sub">提交时间</span>
                      <span className="font-medium">{record.createTime || '--'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-sub">支付方式</span>
                      <span className="font-medium">{record.payment?.payTypeText || '混合支付'} 9:1</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-sub">结果去向</span>
                      <span className="font-medium">
                        {won
                          ? '已转入权益节点'
                          : record.frontendStatusText === '已退回'
                            ? '已退回'
                            : record.frontendStatusText || '待开奖'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-border-light pt-4 text-[12px] text-text-sub">
                    <div>
                      {won
                        ? '中签结果已直转权益节点，不走寄售路径。'
                        : activeTab === 'lost'
                          ? '本次未中签，前端已直接标记为已退回。'
                          : '等待系统统一开奖回写。'}
                    </div>
                    {won ? (
                      <div className="inline-flex items-center font-medium text-primary-start">
                        查看权益节点 <ChevronRight size={15} className="ml-1" />
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="mt-4 rounded-[20px] border border-dashed border-border-light bg-white px-4 py-4 text-[12px] text-text-sub">
          <div className="flex items-center gap-2 text-text-main">
            <Cpu size={14} className="text-primary-start" />
            <span className="font-medium">记录说明</span>
          </div>
          <div className="mt-2 leading-6">
            {noticeText}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MyGenesisNodesPage;
