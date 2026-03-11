import { useCallback, useEffect, useMemo, useState } from 'react';
import { Clock3, PackageCheck, Slash, RefreshCw } from 'lucide-react';
import { shopOrderApi, type ShopOrderListItem } from '../../api/modules/shopOrder';
import { getErrorMessage } from '../../api/core/errors';
import { PageHeader } from '../../components/layout/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { useRequest } from '../../hooks/useRequest';
import { useAppNavigate } from '../../lib/navigation';
import { resolveShopProductImageUrl } from '../../features/shop-product/utils';

type AfterSaleTab = 'all' | 'processing' | 'completed' | 'closed';

const STATUS_META: Record<Exclude<AfterSaleTab, 'all'>, { label: string; icon: typeof Clock3; color: string; bg: string }> = {
  processing: {
    label: '处理中',
    icon: Clock3,
    color: 'text-amber-600',
    bg: 'bg-amber-50 border-amber-100',
  },
  completed: {
    label: '已完成',
    icon: PackageCheck,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 border-emerald-100',
  },
  closed: {
    label: '已关闭',
    icon: Slash,
    color: 'text-slate-500',
    bg: 'bg-slate-100 border-slate-200',
  },
};

function formatTime(timestamp?: number): string {
  if (!timestamp) return '--';
  const date = new Date(timestamp * 1000);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function getOrderSummary(order: ShopOrderListItem): string {
  const first = order.items?.[0];
  if (!first) return '商品信息待补充';
  const extraCount = Math.max((order.items?.length ?? 1) - 1, 0);
  return extraCount > 0 ? `${first.product_name} 等${extraCount + 1}件商品` : first.product_name;
}

export const AfterSalesPage = () => {
  const { goBack, navigate } = useAppNavigate();
  const { showToast, showLoading, hideLoading } = useFeedback();
  const [activeTab, setActiveTab] = useState<AfterSaleTab>('all');
  const [selectedId, setSelectedId] = useState<number>(0);

  const request = useRequest(
    (signal) => shopOrderApi.myOrders({ page: 1, limit: 100 }, signal),
    { initialData: { list: [], total: 0, page: 1, limit: 100, balance_available: '0', score: '0' } },
  );

  const afterSaleOrders = useMemo(
    () =>
      (request.data?.list ?? []).filter((order) => {
        return Number(order.after_sale_id ?? 0) > 0 && Boolean(order.after_sale_status);
      }),
    [request.data],
  );

  const stats = useMemo(() => {
    return afterSaleOrders.reduce(
      (acc, order) => {
        const status = order.after_sale_status;
        if (status === 'processing') acc.processing += 1;
        if (status === 'completed') acc.completed += 1;
        if (status === 'closed') acc.closed += 1;
        acc.all += 1;
        return acc;
      },
      { all: 0, processing: 0, completed: 0, closed: 0 },
    );
  }, [afterSaleOrders]);

  const filteredOrders = useMemo(() => {
    if (activeTab === 'all') return afterSaleOrders;
    return afterSaleOrders.filter((order) => order.after_sale_status === activeTab);
  }, [activeTab, afterSaleOrders]);

  useEffect(() => {
    if (filteredOrders.length === 0) {
      setSelectedId(0);
      return;
    }
    const exists = filteredOrders.some((order) => order.id === selectedId);
    if (!exists) {
      setSelectedId(filteredOrders[0].id);
    }
  }, [filteredOrders, selectedId]);

  const selectedOrder = useMemo(
    () => filteredOrders.find((order) => order.id === selectedId) ?? filteredOrders[0] ?? null,
    [filteredOrders, selectedId],
  );

  const handleCancelAfterSale = useCallback(
    async (order: ShopOrderListItem) => {
      if (!order.after_sale_id) return;
      if (!window.confirm('确定要取消当前售后申请吗？')) return;
      showLoading('取消售后申请中...');
      try {
        await shopOrderApi.cancelAfterSale({ after_sale_id: order.after_sale_id });
        showToast({ message: '售后申请已取消', type: 'success' });
        await request.reload();
      } catch (error) {
        showToast({ message: getErrorMessage(error) || '取消售后申请失败', type: 'error' });
      } finally {
        hideLoading();
      }
    },
    [hideLoading, request, showLoading, showToast],
  );

  const tabItems: Array<{ key: AfterSaleTab; label: string; count: number }> = [
    { key: 'all', label: '全部', count: stats.all },
    { key: 'processing', label: '处理中', count: stats.processing },
    { key: 'completed', label: '已完成', count: stats.completed },
    { key: 'closed', label: '已关闭', count: stats.closed },
  ];

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-[#f6f7fb]">
      <PageHeader
        title="售后服务"
        onBack={goBack}
        rightAction={
          <button type="button" onClick={() => void request.reload()} className="p-1 text-text-main active:opacity-70">
            <RefreshCw size={18} />
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <div className="mt-4 rounded-[24px] bg-gradient-to-r from-[#1f2937] via-[#334155] to-[#475569] p-4 text-white shadow-[0_16px_40px_rgba(15,23,42,0.18)]">
          <div className="text-sm text-white/70">售后概览</div>
          <div className="mt-2 text-3xl font-semibold">{stats.all}</div>
          <div className="mt-1 text-sm text-white/75">当前账号已提交的售后申请总数</div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-white/10 px-2 py-3 backdrop-blur-sm">
              <div className="text-lg font-semibold">{stats.processing}</div>
              <div className="mt-1 text-xs text-white/70">处理中</div>
            </div>
            <div className="rounded-2xl bg-white/10 px-2 py-3 backdrop-blur-sm">
              <div className="text-lg font-semibold">{stats.completed}</div>
              <div className="mt-1 text-xs text-white/70">已完成</div>
            </div>
            <div className="rounded-2xl bg-white/10 px-2 py-3 backdrop-blur-sm">
              <div className="text-lg font-semibold">{stats.closed}</div>
              <div className="mt-1 text-xs text-white/70">已关闭</div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {tabItems.map((tab) => {
            const active = tab.key === activeTab;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                  active
                    ? 'bg-[#111827] text-white shadow-sm'
                    : 'bg-white text-text-sub shadow-[0_4px_16px_rgba(15,23,42,0.06)]'
                }`}
              >
                {tab.label} {tab.count}
              </button>
            );
          })}
        </div>

        {request.loading ? (
          <div className="mt-4 space-y-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-28 animate-pulse rounded-[24px] bg-white" />
            ))}
          </div>
        ) : request.error ? (
          <div className="mt-6 rounded-[24px] bg-white p-4">
            <ErrorState onRetry={() => void request.reload()} />
          </div>
        ) : filteredOrders.length === 0 ? (
          <EmptyState
            message={afterSaleOrders.length === 0 ? '暂无售后记录' : '该状态下暂无售后记录'}
            actionText="查看全部订单"
            onAction={() => navigate('/order')}
          />
        ) : (
          <div className="mt-4 space-y-3">
            {filteredOrders.map((order) => {
              const statusKey = (order.after_sale_status || 'closed') as Exclude<AfterSaleTab, 'all'>;
              const statusMeta = STATUS_META[statusKey] ?? STATUS_META.closed;
              const StatusIcon = statusMeta.icon;
              const selected = selectedOrder?.id === order.id;
              const firstItem = order.items?.[0];
              const afterSale = order.after_sale_info;

              return (
                <div
                  key={order.id}
                  className={`overflow-hidden rounded-[24px] border bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition ${
                    selected ? 'border-[#111827]' : 'border-transparent'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedId(order.id)}
                    className="w-full p-4 text-left"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-xs text-text-aux">售后单 #{order.after_sale_id}</div>
                        <div className="mt-1 truncate text-base font-semibold text-text-main">{getOrderSummary(order)}</div>
                        <div className="mt-2 text-xs text-text-aux">订单号 {order.order_no}</div>
                      </div>
                      <div className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${statusMeta.bg} ${statusMeta.color}`}>
                        <StatusIcon size={14} />
                        {order.after_sale_status_text || statusMeta.label}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      <img
                        src={resolveShopProductImageUrl(firstItem?.product_thumbnail)}
                        alt={firstItem?.product_name || '商品图片'}
                        className="h-16 w-16 rounded-2xl bg-[#f4f5f7] object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="line-clamp-2 text-sm text-text-main">{firstItem?.product_name || '商品信息待补充'}</div>
                        <div className="mt-2 text-xs text-text-aux">申请时间 {formatTime(afterSale?.apply_time)}</div>
                      </div>
                    </div>
                  </button>

                  {selected && (
                    <div className="border-t border-[#eef0f3] bg-[#fbfcfe] px-4 py-4">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-2xl bg-white p-3">
                          <div className="text-xs text-text-aux">售后状态</div>
                          <div className="mt-2 font-medium text-text-main">{order.after_sale_status_text || statusMeta.label}</div>
                        </div>
                        <div className="rounded-2xl bg-white p-3">
                          <div className="text-xs text-text-aux">售后原因</div>
                          <div className="mt-2 font-medium text-text-main">{afterSale?.reason || '-'}</div>
                        </div>
                        <div className="col-span-2 rounded-2xl bg-white p-3">
                          <div className="text-xs text-text-aux">问题描述</div>
                          <div className="mt-2 whitespace-pre-wrap break-words text-text-main">
                            {afterSale?.description || '买家申请售后'}
                          </div>
                        </div>
                        <div className="rounded-2xl bg-white p-3">
                          <div className="text-xs text-text-aux">申请时间</div>
                          <div className="mt-2 font-medium text-text-main">{formatTime(afterSale?.apply_time)}</div>
                        </div>
                        <div className="rounded-2xl bg-white p-3">
                          <div className="text-xs text-text-aux">处理结果</div>
                          <div className="mt-2 font-medium text-text-main">
                            {afterSale?.close_reason || afterSale?.admin_remark || '平台处理中'}
                          </div>
                        </div>
                      </div>

                      {afterSale?.images?.length ? (
                        <div className="mt-3">
                          <div className="mb-2 text-xs text-text-aux">凭证图片</div>
                          <div className="grid grid-cols-3 gap-2">
                            {afterSale.images.map((image, index) => (
                              <img
                                key={`${order.id}-${index}`}
                                src={image}
                                alt={`售后凭证${index + 1}`}
                                className="h-24 w-full rounded-2xl bg-[#f4f5f7] object-cover"
                              />
                            ))}
                          </div>
                        </div>
                      ) : null}

                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/order/detail/${order.id}`)}
                          className="flex-1 rounded-full border border-[#dbe0e7] bg-white px-4 py-3 text-sm font-medium text-text-main active:opacity-80"
                        >
                          查看订单
                        </button>
                        {order.after_sale_status === 'processing' && order.can_cancel_after_sale === 1 ? (
                          <button
                            type="button"
                            onClick={() => void handleCancelAfterSale(order)}
                            className="flex-1 rounded-full bg-[#111827] px-4 py-3 text-sm font-medium text-white active:opacity-80"
                          >
                            取消申请
                          </button>
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AfterSalesPage;
