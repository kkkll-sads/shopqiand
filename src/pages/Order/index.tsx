/**
 * @file Order/index.tsx - 订单列表页面
 * @description 展示商城订单和藏品交易订单，支持状态切换、搜索、下拉刷新。
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { collectionTradeApi, shopOrderApi, type CollectionBuyOrder, type CollectionSellOrder, type ShopOrderListItem } from '../../api';
import { getErrorMessage } from '../../api/core/errors';
import { OfflineBanner } from '../../components/layout/OfflineBanner';
import { PullToRefreshContainer } from '../../components/ui/PullToRefreshContainer';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { CollectibleOrderDetail } from '../../features/order/components/CollectibleOrderDetail';
import { OrderHeader } from '../../features/order/components/OrderHeader';
import { OrderListContent } from '../../features/order/components/OrderListContent';
import { OrderStatusTabs } from '../../features/order/components/OrderStatusTabs';
import { OrderTypeSwitcher } from '../../features/order/components/OrderTypeSwitcher';
import { MALL_TAB_TO_STATUS, ORDER_TABS } from '../../features/order/constants';
import type { OrderType, SelectedOrder } from '../../features/order/types';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useRequest } from '../../hooks/useRequest';
import { useRouteScrollRestoration } from '../../hooks/useRouteScrollRestoration';
import { useSessionState } from '../../hooks/useSessionState';
import { copyToClipboard } from '../../lib/clipboard';
import { openCustomerServiceLink } from '../../lib/customerService';
import { useAppNavigate } from '../../lib/navigation';

export const OrderPage = () => {
  const location = useLocation();
  const { goTo, navigate } = useAppNavigate();
  const { showToast, showConfirm } = useFeedback();
  const { isOffline, refreshStatus } = useNetworkStatus();
  const [orderType, setOrderType] = useSessionState<OrderType>('order-page:type', 'mall');
  const [mallTab, setMallTab] = useSessionState('order-page:mall-tab', ORDER_TABS.mall[0]);
  const [collectibleTab, setCollectibleTab] = useSessionState(
    'order-page:collectible-tab',
    ORDER_TABS.collectible[0],
  );
  const [selectedOrder, setSelectedOrder] = useState<SelectedOrder | null>(null);
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const lastScrollTopRef = useRef(0);

  const validCollectibleTab = ORDER_TABS.collectible.includes(collectibleTab)
    ? collectibleTab
    : ORDER_TABS.collectible[0];

  const mallStatus = MALL_TAB_TO_STATUS[mallTab] ?? '';
  const isPendingPayTab = mallTab === '待付款';
  const isPendingShipTab = mallTab === '待发货';
  const isPendingConfirmTab = mallTab === '待收货';
  const emptyMallData = {
    list: [] as ShopOrderListItem[],
    total: 0,
    page: 1,
    limit: 10,
    balance_available: '',
    score: '',
  };

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
  const routeQuery = new URLSearchParams(location.search);
  const isFromTransferredCollection = routeQuery.get('from') === 'my_collection_transferred';

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const routeOrderType = query.get('order_type');
    const routeCollectibleTab = query.get('collectible_tab');
    const routeSellId = Number(query.get('sell_id') || 0);

    if (routeOrderType === 'collectible') {
      setOrderType('collectible');
    }

    if (routeCollectibleTab && ORDER_TABS.collectible.includes(routeCollectibleTab)) {
      setCollectibleTab(routeCollectibleTab);
    }

    if (routeSellId > 0) {
      setSelectedOrder({ type: 'sell', id: routeSellId });
    }
  }, [location.search, setCollectibleTab, setOrderType]);

  useRouteScrollRestoration({
    containerRef: scrollContainerRef,
    namespace: 'order-page',
    restoreDeps: [activeTab, emptyList, loading, moduleError, orderType],
    restoreWhen: !loading && !selectedOrder,
  });

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }

    lastScrollTopRef.current = container.scrollTop;

    const handleScroll = () => {
      const currentScrollTop = container.scrollTop;
      const delta = currentScrollTop - lastScrollTopRef.current;

      if (currentScrollTop <= 12) {
        setIsHeaderHidden(false);
      } else if (delta >= 10 && currentScrollTop > 72) {
        setIsHeaderHidden(true);
      } else if (delta <= -10) {
        setIsHeaderHidden(false);
      }

      lastScrollTopRef.current = currentScrollTop;
    };

    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    setIsHeaderHidden(false);
  }, [activeTab, orderType, selectedOrder]);

  const handleTabChange = (tab: string) => {
    if (orderType === 'mall') {
      setMallTab(tab);
      return;
    }
    setCollectibleTab(tab);
  };

  const handleCopy = async (text: string) => {
    const ok = await copyToClipboard(text);
    showToast({
      message: ok ? '订单号已复制' : '复制失败，请手动长按复制',
      type: ok ? 'success' : 'error',
    });
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

  const handleRefresh = useCallback(async () => {
    await Promise.allSettled([
      mallOrdersRequest.reload(),
      buyOrdersRequest.reload(),
      sellOrdersRequest.reload(),
    ]);
  }, [mallOrdersRequest, buyOrdersRequest, sellOrdersRequest]);

  const handleCollectibleDetailBack = useCallback(() => {
    if (isFromTransferredCollection) {
      navigate('/my-collection?tab=transferred', { replace: true });
      return;
    }

    setSelectedOrder(null);
  }, [isFromTransferredCollection, navigate]);

  const handleOpenSupport = useCallback(() => {
    void openCustomerServiceLink(({ duration, message, type }) => {
      showToast({ duration, message, type });
    });
  }, [showToast]);

  const handleCancelOrder = useCallback(
    async (orderId: number, cancelReason?: string) => {
      const confirmed = await showConfirm({
        title: '取消订单',
        message: '确定要取消这笔商城订单吗？',
        confirmText: '确认取消',
        cancelText: '再想想',
        danger: true,
      });
      if (!confirmed) return;

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
    [showConfirm, showToast, mallOrdersRequest],
  );

  const handleRefundOrder = useCallback(
    async (orderId: number) => {
      navigate(`/after-sales/apply/${orderId}`);
    },
    [navigate],
  );

  const handleCancelAfterSale = useCallback(
    async (orderId: number, afterSaleId?: number) => {
      const confirmed = await showConfirm({
        title: '取消申请',
        message: '确定要取消当前商城订单的售后申请吗？',
        confirmText: '确认取消',
        cancelText: '保留申请',
        danger: true,
      });
      if (!confirmed) return;

      try {
        await shopOrderApi.cancelAfterSale(
          afterSaleId ? { after_sale_id: afterSaleId } : { order_id: orderId },
        );
        showToast({ message: '售后申请已取消', type: 'success' });
        void mallOrdersRequest.reload();
      } catch (err) {
        showToast({ message: getErrorMessage(err) || '取消售后申请失败', type: 'error' });
      }
    },
    [showConfirm, showToast, mallOrdersRequest],
  );

  const handleConfirmOrder = useCallback(
    async (orderId: number) => {
      const confirmed = await showConfirm({
        title: '确认收货',
        message: '确定已经收到这笔商城订单的货物吗？',
        confirmText: '确认收货',
        cancelText: '暂不确认',
      });
      if (!confirmed) return;

      try {
        await shopOrderApi.confirm(orderId);
        showToast({ message: '确认收货成功', type: 'success' });
        void mallOrdersRequest.reload();
      } catch (err) {
        showToast({ message: getErrorMessage(err) || '确认收货失败', type: 'error' });
      }
    },
    [showConfirm, showToast, mallOrdersRequest],
  );

  return (
    <div className="flex-1 flex flex-col bg-bg-base relative overflow-hidden">
      {isOffline && <OfflineBanner onAction={refreshStatus} />}

      <OrderHeader hidden={isHeaderHidden} onSearch={() => goTo('search')} />
      <OrderTypeSwitcher orderType={orderType} onChange={setOrderType} />
      <OrderStatusTabs tabs={ORDER_TABS[orderType]} activeTab={activeTab} onChange={handleTabChange} />

      <PullToRefreshContainer onRefresh={handleRefresh} disabled={isOffline}>
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
          onOpenMallOrderDetail={(orderId) => (
            orderId != null ? navigate(`/order/detail/${orderId}`) : goTo('order_detail')
          )}
          onOpenCollectibleDetail={(order) => setSelectedOrder(order)}
          onOpenLogistics={(order) => navigate(`/logistics/${order.id}`)}
          onOpenCashier={(order) => {
            const cashierParams = new URLSearchParams({
              order_id: String(order.id),
              amount: String(order.total_amount),
              total_score: String(order.total_score),
              order_no: order.order_no,
              pay_type: order.pay_type,
              balance: mallOrdersRequest.data?.balance_available ?? '0',
              score_balance: mallOrdersRequest.data?.score ?? '0',
            });
            navigate(`/cashier?${cashierParams.toString()}`);
          }}
          onCancelMallOrder={handleCancelOrder}
          onCancelMallAfterSale={handleCancelAfterSale}
          onConfirmMallOrder={handleConfirmOrder}
          onReviewMallOrder={(orderId, productId) => navigate(`/order/${orderId}/review?product_id=${productId}`)}
          onRefundMallOrder={handleRefundOrder}
        />
      </div>
      </PullToRefreshContainer>

      {selectedOrder && (
        <CollectibleOrderDetail
          type={selectedOrder.type}
          id={selectedOrder.id}
          onBack={handleCollectibleDetailBack}
          onOpenHelp={handleOpenSupport}
        />
      )}
    </div>
  );
};
