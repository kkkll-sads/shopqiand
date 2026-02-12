/**
 * OrderListPage - 订单列表页面
 * 已重构: 拆分为多个子组件和 hooks
 */
import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageContainer from '@/layouts/PageContainer';
import {
  getConsignmentDetail,
  cancelConsignment,
  ConsignmentDetailData,
} from '@/services';
import { getStoredToken } from '@/services/client';
import { useNotification } from '@/context/NotificationContext';
import { extractData, extractError } from '@/utils/apiHelpers';
import { errorLog } from '@/utils/logger';
import { toString as formatCurrency } from '@/utils/currency';
import {
  OrderTabs,
  TransactionOrderList,
  ProductOrderList,
  PointDeliveryOrderList,
  ConsignmentDetailModal,
} from './components/orders';
import { useOrderList } from './hooks/useOrderList';
import { useOrderActions } from './hooks/useOrderActions';

type OrderCategory = 'product' | 'transaction' | 'delivery' | 'points';

const OrderListPage: React.FC = () => {
  const navigate = useNavigate();
  const { category: categoryParam, status } = useParams<{ category?: string; status?: string }>();
  
  const category = useMemo<OrderCategory>(() => {
    const value = categoryParam as OrderCategory;
    return value && ['product', 'transaction', 'delivery', 'points'].includes(value) ? value : 'product';
  }, [categoryParam]);
  
  const initialTab = useMemo(() => (status ? parseInt(status, 10) || 0 : 0), [status]);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [page, setPage] = useState(1);
  
  const [showConsignmentDetailModal, setShowConsignmentDetailModal] = useState(false);
  const [selectedConsignmentDetail, setSelectedConsignmentDetail] = useState<ConsignmentDetailData | null>(null);
  const [loadingConsignmentDetail, setLoadingConsignmentDetail] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const getPageConfig = () => {
    switch (category) {
      case 'product':
        return {
          title: '藏品订单',
          tabs: ['买入订单', '卖出订单']
        };
      case 'transaction':
        return {
          title: '交易订单',
          tabs: ['待寄售', '寄售中', '寄售失败']
        };
      case 'delivery':
        return {
          title: '提货订单',
          tabs: ['待发货', '待收货', '已签收']
        };
      case 'points':
        return {
          title: '消费金订单',
          tabs: ['待付款', '待发货', '待收货', '已完成']
        };
      default:
        return { title: '订单列表', tabs: [] };
    }
  };

  const config = getPageConfig();

  // Order List Hook
  const {
    orders,
    consignmentOrders,
    purchaseRecords,
    loading,
    hasMore,
    reload,
    setOrders,
  } = useOrderList({
    category,
    activeTab,
    page,
    onPageChange: setPage,
  });

  // Order Actions Hook
  const {
    handleConfirmReceipt,
    handlePayOrder,
    handleDeleteOrder,
  } = useOrderActions({
    category,
    activeTab,
    onReload: reload,
  });

  const { showToast, showDialog } = useNotification();

  // Navigate to Detail Page
  const handleViewDetail = (id: number) => {
    navigate(`/order/${String(id)}`);
  };

  // Navigate to Collection Order Detail
  const handleViewCollectionOrderDetail = (id?: number | string, orderNo?: string) => {
    if (id) {
      navigate(`/collection-order/${String(id)}`);
      return;
    }
    if (orderNo) {
      navigate(`/collection-order?orderNo=${encodeURIComponent(String(orderNo))}`);
    }
  };

  const handleViewConsignmentDetail = async (consignmentId: number) => {
    setLoadingConsignmentDetail(true);
    try {
      const token = getStoredToken() || '';
      const response = await getConsignmentDetail({ consignment_id: consignmentId, token });
      const data = extractData(response) as any;
      if (data) {
        setSelectedConsignmentDetail(data);
        setShowConsignmentDetailModal(true);
      } else {
        showToast('error', '获取失败', extractError(response, '获取寄售详情失败'));
      }
    } catch (error: any) {
      errorLog('OrderListPage', '获取寄售详情失败:', error);
      showToast('error', '获取失败', error.message || '获取寄售详情失败');
    } finally {
      setLoadingConsignmentDetail(false);
    }
  };

  const handleCancelConsignment = async (consignmentId: number) => {
    showDialog({
      title: '确认取消',
      description: '确定要取消此寄售吗？',
      confirmText: '确定取消',
      cancelText: '取消',
      onConfirm: async () => {
        try {
          const token = getStoredToken() || '';
          const response = await cancelConsignment({ consignment_id: consignmentId, token });
          if (extractData(response)) {
            reload();
            showToast('success', '取消成功', extractError(response, '取消成功'));
          } else {
            showToast('error', '取消失败', extractError(response, '取消寄售失败'));
          }
        } catch (error: any) {
          errorLog('OrderListPage', '取消寄售失败:', error);
          showToast('error', '取消失败', error.message || '取消寄售失败');
        }
      }
    });
  };

  // Format helpers
  const formatOrderDate = (date: number | string | undefined, includeTime: boolean = false): string => {
    if (!date) return '';
    let timestamp: number;
    if (typeof date === 'string') {
      const cleaned = date.trim().replace(/[^\d]/g, '');
      timestamp = parseInt(cleaned, 10);
      if (isNaN(timestamp)) {
        return date.trim();
      }
    } else {
      timestamp = date;
    }
    if (!timestamp || timestamp === 0) return '';
    const timestampMs = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
    const d = new Date(timestampMs);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    if (includeTime) {
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const seconds = String(d.getSeconds()).padStart(2, '0');
      return `${dateStr} ${hours}:${minutes}:${seconds}`.trim();
    }
    return dateStr.trim();
  };

  const formatOrderPrice = (price: number | string | undefined): string => {
    if (price === undefined || price === null) return '0.00';
    return formatCurrency(price, 2);
  };

  // Load more handler
  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  return (
    <PageContainer title={config.title} onBack={() => navigate(-1)}>
      <OrderTabs tabs={config.tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Order List */}
      <div className={`${category === 'product' ? 'p-3 space-y-3' : 'p-4 space-y-4'}`}>
        {category === 'transaction' ? (
          <TransactionOrderList
            orders={consignmentOrders}
            loading={loading}
            activeTab={activeTab}
            formatOrderDate={(date) => formatOrderDate(date)}
            formatOrderPrice={formatOrderPrice}
            onCancelConsignment={handleCancelConsignment}
          />
        ) : category === 'product' ? (
          <ProductOrderList
            activeTab={activeTab}
            purchaseRecords={purchaseRecords}
            consignmentOrders={consignmentOrders}
            loading={loading}
            formatOrderDate={(date) => formatOrderDate(date)}
            formatOrderPrice={formatOrderPrice}
            onViewConsignmentDetail={handleViewConsignmentDetail}
            onViewOrderDetail={handleViewCollectionOrderDetail}
          />
        ) : category === 'delivery' || category === 'points' ? (
          <PointDeliveryOrderList
            category={category}
            orders={orders}
            loading={loading}
            activeTab={activeTab}
            onViewDetail={handleViewDetail}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <p className="text-xs">暂无数据</p>
          </div>
        )}
      </div>

      <ConsignmentDetailModal
        visible={showConsignmentDetailModal}
        detail={selectedConsignmentDetail}
        onClose={() => setShowConsignmentDetailModal(false)}
        formatOrderPrice={formatOrderPrice}
      />
    </PageContainer>
  );
};

export default OrderListPage;
