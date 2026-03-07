import { useEffect, useRef, useState } from 'react';
import { OfflineBanner } from '../../components/layout/OfflineBanner';
import { ORDER_TABS } from '../../features/order/constants';
import { CollectibleOrderDetail } from '../../features/order/components/CollectibleOrderDetail';
import { OrderHeader } from '../../features/order/components/OrderHeader';
import { OrderListContent } from '../../features/order/components/OrderListContent';
import { OrderStatusTabs } from '../../features/order/components/OrderStatusTabs';
import { OrderTypeSwitcher } from '../../features/order/components/OrderTypeSwitcher';
import type { OrderType, SelectedOrder } from '../../features/order/types';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useRouteScrollRestoration } from '../../hooks/useRouteScrollRestoration';
import { useSessionState } from '../../hooks/useSessionState';
import { useAppNavigate } from '../../lib/navigation';

export const OrderPage = () => {
  const { goTo } = useAppNavigate();
  const { isOffline, refreshStatus } = useNetworkStatus();
  const [orderType, setOrderType] = useSessionState<OrderType>('order-page:type', 'mall');
  const [mallTab, setMallTab] = useSessionState('order-page:mall-tab', ORDER_TABS.mall[0]);
  const [collectibleTab, setCollectibleTab] = useSessionState(
    'order-page:collectible-tab',
    ORDER_TABS.collectible[0],
  );
  const [selectedOrder, setSelectedOrder] = useState<SelectedOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [moduleError, setModuleError] = useState(false);
  const [emptyList, setEmptyList] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setLoading(true);
    const timer = window.setTimeout(() => {
      setLoading(false);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [orderType, mallTab, collectibleTab]);

  const activeTab = orderType === 'mall' ? mallTab : collectibleTab;

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

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    window.alert('订单号已复制');
  };

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
          onRetry={() => setModuleError(false)}
          onOpenEmptyTarget={() => goTo(orderType === 'mall' ? 'store' : 'shield')}
          onCopy={handleCopy}
          onOpenMallOrderDetail={() => goTo('order_detail')}
          onOpenCollectibleDetail={id => setSelectedOrder({ type: 'collectible', id })}
          onOpenLogistics={() => goTo('logistics')}
          onOpenCashier={() => goTo('cashier')}
        />
      </div>

      {selectedOrder && (
        <CollectibleOrderDetail
          orderId={selectedOrder.id}
          onBack={() => setSelectedOrder(null)}
          onCopy={handleCopy}
          onOpenHelp={() => goTo('help_center')}
        />
      )}
    </div>
  );
};
