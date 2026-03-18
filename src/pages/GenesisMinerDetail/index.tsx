import { Cpu, ShieldCheck, Workflow } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { PageHeader } from '../../components/layout/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Skeleton } from '../../components/ui/Skeleton';
import { useRequest } from '../../hooks/useRequest';
import { useAppNavigate } from '../../lib/navigation';
import { genesisNodeApi } from '../../api/modules/genesisNode';
import { resolveUploadUrl } from '../../api/modules/upload';
import { userCollectionApi } from '../../api/modules/userCollection';

function formatMoney(value: number): string {
  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    useGrouping: false,
  });
}

function MinerDetailSkeleton() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-[#f7f8fa]">
      <PageHeader title="权益节点详情" className="border-b border-border-light" />
      <div className="flex-1 overflow-y-auto p-4">
        <Skeleton className="h-[180px] rounded-[24px]" />
        <Skeleton className="mt-4 h-[190px] rounded-[20px]" />
        <Skeleton className="mt-4 h-[190px] rounded-[20px]" />
      </div>
    </div>
  );
}

export function GenesisMinerDetailPage() {
  const { recordId = '' } = useParams();
  const { goBackOr, goTo } = useAppNavigate();
  const orderId = Number(recordId);

  const orderRequest = useRequest(
    (signal) => genesisNodeApi.getOrderDetail(orderId, signal),
    {
      cacheKey: `genesis-node:order-detail:${orderId}`,
      deps: [orderId],
      keepPreviousData: false,
      manual: !Number.isInteger(orderId) || orderId <= 0,
    },
  );

  const userCollectionId = orderRequest.data?.userCollectionId ?? 0;
  const collectionRequest = useRequest(
    (signal) => userCollectionApi.detail(userCollectionId, signal),
    {
      cacheKey: `genesis-node:user-collection:${userCollectionId}`,
      deps: [userCollectionId],
      manual: userCollectionId <= 0,
    },
  );

  if ((orderRequest.loading && !orderRequest.data) || (!orderRequest.data && userCollectionId > 0 && collectionRequest.loading)) {
    return <MinerDetailSkeleton />;
  }

  if (orderRequest.error && !orderRequest.data) {
    return (
      <div className="flex min-h-full flex-1 flex-col bg-[#f7f8fa]">
        <PageHeader title="权益节点详情" onBack={() => goBackOr('my_genesis_nodes')} className="border-b border-border-light" />
        <ErrorState message={orderRequest.error.message || '权益节点详情加载失败'} onRetry={() => void orderRequest.reload()} />
      </div>
    );
  }

  const order = orderRequest.data;
  if (!order || order.status !== 1) {
    return (
      <div className="flex min-h-full flex-1 flex-col bg-[#f7f8fa]">
        <PageHeader title="权益节点详情" onBack={() => goBackOr('my_genesis_nodes')} className="border-b border-border-light" />
        <EmptyState message="未找到可查看的权益节点记录" actionText="返回我的创世节点" onAction={() => goTo('my_genesis_nodes')} />
      </div>
    );
  }

  const collection = collectionRequest.data;
  const heroImage = collection?.image ? resolveUploadUrl(String(collection.image)) : order.image;
  const assetCode = typeof collection?.asset_code === 'string' ? collection.asset_code : '';
  const contractNo = typeof collection?.contract_no === 'string' ? collection.contract_no : '';
  const rightsStatus = typeof collection?.rights_status === 'string' ? collection.rights_status : '已确权锁定';
  const miningStartTime = typeof collection?.mining_start_time === 'string' ? collection.mining_start_time : '';
  const lastDividendTime = typeof collection?.last_dividend_time === 'string' ? collection.last_dividend_time : '';

  return (
    <div className="flex min-h-full flex-1 flex-col bg-[#f7f8fa]">
      <PageHeader title="权益节点详情" onBack={() => goBackOr('my_genesis_nodes')} className="border-b border-border-light" />

      <div className="flex-1 overflow-y-auto p-4">
        <section className="rounded-[24px] bg-[#151515] p-5 text-white shadow-[0_20px_60px_rgba(15,23,42,0.18)]">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="text-[12px] tracking-[0.24em] text-white/60">创世节点权益</div>
              <div className="mt-2 text-[24px] font-black leading-tight">{collection?.title || order.title || '创世节点算力权益证'}</div>
              <div className="mt-2 text-[13px] leading-6 text-white/74">
                中签结果已直接转入权益节点详情页，不走寄售链路。
              </div>
            </div>
            {heroImage ? (
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[18px] bg-white/8">
                <img src={heroImage} alt={collection?.title || order.title} className="h-full w-full object-cover" />
              </div>
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-white/8">
                <Cpu size={28} className="text-[#f0c47c]" />
              </div>
            )}
          </div>
          <div className="mt-5 rounded-[18px] bg-white/8 px-4 py-3 text-[13px]">
            权益编号：<span className="font-bold">{assetCode || `GENESIS-${order.id}`}</span>
          </div>
        </section>

        <section className="mt-4 grid gap-3">
          <div className="rounded-[20px] bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-[13px] font-medium text-text-main">
              <ShieldCheck size={16} className="text-primary-start" />
              <span>权益节点信息</span>
            </div>
            <div className="mt-3 grid gap-2 rounded-[16px] bg-[#f7f8fa] p-3 text-[12px] text-text-main">
              <div className="flex items-center justify-between">
                <span className="text-text-sub">中签金额</span>
                <span className="font-medium">¥{formatMoney(order.amount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-sub">批次日期</span>
                <span className="font-medium">{order.activityDate || '--'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-sub">提交时间</span>
                <span className="font-medium">{order.createTime || '--'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-sub">结果回写</span>
                <span className="font-medium">{order.resultTime || '--'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-sub">确权状态</span>
                <span className="font-medium">{rightsStatus}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-sub">权益生效时间</span>
                <span className="font-medium">{miningStartTime || '--'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-sub">最近分红</span>
                <span className="font-medium">{lastDividendTime || '--'}</span>
              </div>
            </div>
          </div>

          <div className="rounded-[20px] bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-[13px] font-medium text-text-main">
              <Workflow size={16} className="text-primary-start" />
              <span>结果去向</span>
            </div>
            <div className="mt-3 space-y-3 text-[13px] leading-6 text-text-main">
              <div className="flex items-start gap-3">
                <span className="w-5 shrink-0 text-text-sub">01</span>
                <p>中签资格已直接转入权益节点，不经过寄售或普通商品详情。</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-5 shrink-0 text-text-sub">02</span>
                <p>该权益节点对应支付结构为混合支付 9:1，活动规则已锁定。</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-5 shrink-0 text-text-sub">03</span>
                <p>权益标题固定为“创世节点算力权益证”，当前不开放寄售入口。</p>
              </div>
              {contractNo ? (
                <div className="flex items-start gap-3">
                  <span className="w-5 shrink-0 text-text-sub">04</span>
                  <p>合约编号：{contractNo}</p>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <div className="mt-4 grid gap-3">
          {order.userCollectionId > 0 ? (
            <button
              type="button"
              onClick={() => goTo(`/my-collection/detail/${order.userCollectionId}`)}
              className="h-11 w-full rounded-full border border-border-main bg-white text-[14px] font-medium text-text-main shadow-sm"
            >
              查看权益详情
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => goTo('my_genesis_nodes')}
            className="h-11 w-full rounded-full bg-gradient-to-r from-primary-start to-primary-end text-[14px] font-medium text-white shadow-sm"
          >
            返回我的创世节点
          </button>
        </div>
      </div>
    </div>
  );
}

export default GenesisMinerDetailPage;
