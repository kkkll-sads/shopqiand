/**
 * @file Order/index.tsx - 订单列表页面
 * @description 展示商城订单和藏品交易订单，支持状态切换、搜索、下拉刷新。
 */

import { useCallback, useRef, useState } from 'react'; // React 核心 Hook
import { shopOrderApi, type ShopOrderListItem } from '../../api';
import { collectionTradeApi, type CollectionBuyOrder, type CollectionSellOrder } from '../../api';
import { getErrorMessage } from '../../api/core/errors';
import { OfflineBanner } from '../../components/layout/OfflineBanner';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { ORDER_TABS, MALL_TAB_TO_STATUS } from '../../features/order/constants';
import { CollectibleOrderDetail } from '../../features/order/components/CollectibleOrderDetail';
import { OrderHeader } from '../../features/order/components/OrderHeader';
import { OrderListContent } from '../../features/order/components/OrderListContent';
import { OrderStatusTabs } from '../../features/order/components/OrderStatusTabs';
import { OrderTypeSwitcher } from '../../features/order/components/OrderTypeSwitcher';
import type { OrderType, SelectedOrder } from '../../features/order/types';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useRequest } from '../../hooks/useRequest';
import { useRouteScrollRestoration } from '../../hooks/useRouteScrollRestoration';
import { useSessionState } from '../../hooks/useSessionState';
import { copyToClipboard } from '../../lib/clipboard';
import { useAppNavigate } from '../../lib/navigation';
import { openCustomerServiceLink } from '../../lib/customerService';

export const OrderPage = () => {
  const { goTo, navigate } = useAppNavigate();
  const { showToast } = useFeedback();
  const { isOffline, refreshStatus } = useNetworkStatus();
  const [orderType, setOrderType] = useSessionState<OrderType>('order-page:type', 'mall');
  const [mallTab, setMallTab] = useSessionState('order-page:mall-tab', ORDER_TABS.mall[0]);
  const [collectibleTab, setCollectibleTab] = useSessionState(
    'order-page:collectible-tab',
    ORDER_TABS.collectible[0],
  );
  const [selectedOrder, setSelectedOrder] = useState<SelectedOrder | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // 确保 collectibleTab 始终是有效的 Tab 名称（旧值可能已不存在）
  const validCollectibleTab = ORDER_TABS.collectible.includes(collectibleTab)
    ? collectibleTab
    : ORDER_TABS.collectible[0];

  /* ========== 商城订单数据 ========== */
  const mallStatus = MALL_TAB_TO_STATUS[mallTab] ?? '';
  const isPendingPayTab = mallTab === '待付款';
  const isPendingShipTab = mallTab === '待发货';
  const isPendingConfirmTab = mallTab === '待收货';
  const emptyMallData = { list: [] as ShopOrderListItem[], total: 0, page: 1, limit: 10, balance_available: '', score: '' };
  const mallOrdersRequest = useRequest(
    (signal) => {
      if (orderType !== 'mall') return Promise.resolve(emptyMallData);
      if (isPendingPayTab) return shopOrderApi.pendingPay({ page: 1, limit: 10 }, signal);
      if (isPendingShipTab) return shopOrderApi.pendingShip({ page: 1, limit: 10 }, signal);
      if (isPendingConfirmTab) return shopOrderApi.pendingConfirm({ page: 1, limit: 10 }, signal);
      return shopOrderApi.myOrders(
        { page: 1, limit: 10, ...(mallStatus ? { status: mallStatus } : {}) },
        signal,
      );
    },
    {
      deps: [orderType, mallTab, mallStatus, isPendingPayTab, isPendingShipTab, isPendingConfirmTab],
      initialData: emptyMallData,
    },
  );

  const mallOrders: ShopOrderListItem[] = mallOrdersRequest.data?.list ?? [];

  /* ========== 藏品买入订单数据 ========== */
  const isBuyTab = validCollectibleTab === '买入订单';
  const emptyBuyData = { list: [] as CollectionBuyOrder[], total: 0, page: 1, limit: 10 };
  const buyOrdersRequest = useRequest(
    (signal) => {
      if (orderType !== 'collectible' || !isBuyTab) return Promise.resolve(emptyBuyData);
      return collectionTradeApi.buyOrders({ page: 1, limit: 10 }, signal);
    },
    {
      deps: [orderType, validCollectibleTab, isBuyTab],
      initialData: emptyBuyData,
    },
  );

  /* ========== 藏品卖出订单数据 ========== */
  const isSellTab = validCollectibleTab === '卖出订单';
  const emptySellData = { list: [] as CollectionSellOrder[], total: 0, page: 1, limit: 10 };
  const sellOrdersRequest = useRequest(
    (signal) => {
      if (orderType !== 'collectible' || !isSellTab) return Promise.resolve(emptySellData);
      return collectionTradeApi.sellOrders({ page: 1, limit: 10 }, signal);
    },
    {
      deps: [orderType, validCollectibleTab, isSellTab],
      initialData: emptySellData,
    },
  );

  const buyOrders = buyOrdersRequest.data?.list ?? [];
  const sellOrders = sellOrdersRequest.data?.list ?? [];

  /* ========== 通用状态计算 ========== */
  const loading = orderType === 'mall'
    ? mallOrdersRequest.loading
    : isBuyTab
      ? buyOrdersRequest.loading
      : sellOrdersRequest.loading;

  const moduleError = orderType === 'mall'
    ? Boolean(mallOrdersRequest.error)
    : isBuyTab
      ? Boolean(buyOrdersRequest.error)
      : Boolean(sellOrdersRequest.error);

  const emptyList = orderType === 'mall'
    ? !mallOrdersRequest.loading && !mallOrdersRequest.error && mallOrders.length === 0
    : isBuyTab
      ? !buyOrdersRequest.loading && !buyOrdersRequest.error && buyOrders.length === 0
      : !sellOrdersRequest.loading && !sellOrdersRequest.error && sellOrders.length === 0;

  const activeTab = orderType === 'mall' ? mallTab : validCollectibleTab;

  useRouteScrollRestoration({
    containerRef: scrollContainerRef,
    namespace: 'order-page',
    restoreDeps: [activeTab, emptyList, loading, moduleError, orderType],
    restoreWhen: !loading && !selectedOrder,
  });

  const handleTabChange = (tab: string) => {
    if (orderType === 'mall') {
      setMallTab(tab);
      return;
    }
    setCollectibleTab(tab);
  };

  const handleCopy = async (text: string) => {
    const ok = await copyToClipboard(text);
    showToast({ message: ok ? '订单号已复制' : '复制失败，请手动长按复制', type: ok ? 'success' : 'error' });
  };

  const handleRetry = () => {
    if (orderType === 'mall') {
      void mallOrdersRequest.reload();
    } else if (isBuyTab) {
      void buyOrdersRequest.reload();
    } else {
      void sellOrdersRequest.reload();
    }
  };

  const handleOpenSupport = useCallback(() => {
    void openCustomerServiceLink(({ duration, message, type }) => {
      showToast({ duration, message, type });
    });
  }, [showToast]);

  const handleCancelOrder = useCallback(
    async (orderId: number, cancelReason?: string) => {
      if (!window.confirm('确定要取消该订单吗？')) return;
      try {
        const data = await shopOrderApi.cancel({ order_id: orderId, cancel_reason: cancelReason });
        if (data?.need_review) {
          showToast({ message: '取消申请已提交，请等待审核', type: 'success' });
        } else {
          showToast({ message: '订单已取消', type: 'success' });
        }
        void mallOrdersRequest.reload();
      } catch (err) {
        showToast({ message: getErrorMessage(err) || '取消订单失败', type: 'error' });
      }
    },
    [showToast, mallOrdersRequest]
  );

  const handleRefundOrder = useCallback(
    async (orderId: number) => {
      if (!window.confirm('确定要提交售后申请吗？')) return;
      try {
        await shopOrderApi.applyAfterSale({ order_id: orderId, reason: '买家申请退货' });
        showToast({ message: '售后申请已提交', type: 'success' });
        void mallOrdersRequest.reload();
      } catch (err) {
        showToast({ message: getErrorMessage(err) || '申请售后失败', type: 'error' });
      }
    },
    [showToast, mallOrdersRequest]
  );

  const handleCancelAfterSale = useCallback(
    async (orderId: number, afterSaleId?: number) => {
      if (!window.confirm('确定要取消当前售后申请吗？')) return;
      try {
        await shopOrderApi.cancelAfterSale(afterSaleId ? { after_sale_id: afterSaleId } : { order_id: orderId });
        showToast({ message: '售后申请已取消', type: 'success' });
        void mallOrdersRequest.reload();
      } catch (err) {
        showToast({ message: getErrorMessage(err) || '取消售后申请失败', type: 'error' });
      }
    },
    [showToast, mallOrdersRequest]
  );

  const handleConfirmOrder = useCallback(
    async (orderId: number) => {
      if (!window.confirm('确定已收到货物吗？')) return;
      try {
        await shopOrderApi.confirm(orderId);
        showToast({ message: '确认收货成功', type: 'success' });
        void mallOrdersRequest.reload();
      } catch (err) {
        showToast({ message: getErrorMessage(err) || '确认收货失败', type: 'error' });
      }
    },
    [showToast, mallOrdersRequest]
  );

  return (
    <div className="flex-1 flex flex-col bg-bg-base relative overflow-hidden">
      {isOffline && <OfflineBanner onAction={refreshStatus} />}

      <OrderHeader onSearch={() => goTo('search')} />
      <OrderTypeSwitcher orderType={orderType} onChange={setOrderType} />
      <OrderStatusTabs tabs={ORDER_TABS[orderType]} activeTab={activeTab} onChange={handleTabChange} />

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto no-scrollbar p-4 pb-4">
        <OrderListContent
          orderType={orderType}
          loading={loading}
          moduleError={moduleError}
          emptyList={emptyList}
          mallOrders={orderType === 'mall' ? mallOrders : undefined}
          buyOrders={orderType === 'collectible' ? buyOrders : undefined}
          sellOrders={orderType === 'collectible' ? sellOrders : undefined}
          collectibleTab={validCollectibleTab}
          onRetry={handleRetry}
          onOpenEmptyTarget={() => goTo(orderType === 'mall' ? 'store' : 'shield')}
          onCopy={handleCopy}
          onOpenMallOrderDetail={(orderId) => (orderId != null ? navigate(`/order/detail/${orderId}`) : goTo('order_detail'))}
          onOpenCollectibleDetail={order => setSelectedOrder(order)}
          onOpenLogistics={() => goTo('logistics')}
          onOpenCashier={() => goTo('cashier')}
          onCancelMallOrder={handleCancelOrder}
          onCancelMallAfterSale={handleCancelAfterSale}
          onConfirmMallOrder={handleConfirmOrder}
          onReviewMallOrder={(orderId, productId) => navigate(`/order/${orderId}/review?product_id=${productId}`)}
          onRefundMallOrder={handleRefundOrder}
        />
      </div>

      {selectedOrder && (
        <CollectibleOrderDetail
          type={selectedOrder.type}
          id={selectedOrder.id}
          onBack={() => setSelectedOrder(null)}
          onOpenHelp={handleOpenSupport}
        />
      )}
    </div>
  );
};
