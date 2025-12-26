import React, { useState, useEffect } from 'react';
import SubPageLayout from '../../components/SubPageLayout';
import { LoadingSpinner, EmptyState, LazyImage } from '../../components/common';
import { formatTime, formatAmount } from '../../utils/format';
import { Order } from '../../types';
import {
  fetchPendingPayOrders,
  fetchPendingShipOrders,
  fetchPendingConfirmOrders,
  fetchCompletedOrders,
  confirmOrder,
  payOrder,
  deleteOrder,
  getDeliveryList,
  getMyConsignmentList,
  getConsignmentDetail,
  cancelConsignment,
  getPurchaseRecords,
  ShopOrderItem,
  ShopOrderItemDetail,
  MyConsignmentItem,
  PurchaseRecordItem,
  ConsignmentDetailData,
  AUTH_TOKEN_KEY,
  normalizeAssetUrl,
} from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { Route } from '../../router/routes';
import OrderTabs from './components/orders/OrderTabs';
import TransactionOrderList from './components/orders/TransactionOrderList';
import ProductOrderList from './components/orders/ProductOrderList';
import PointDeliveryOrderList from './components/orders/PointDeliveryOrderList';
import ConsignmentDetailModal from './components/orders/ConsignmentDetailModal';

interface OrderListPageProps {
  category: 'product' | 'transaction' | 'delivery' | 'points';
  initialTab: number;
  onBack: () => void;
  onNavigate: (route: Route) => void;
}

const OrderListPage: React.FC<OrderListPageProps> = ({ category, initialTab, onBack, onNavigate }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [orders, setOrders] = useState<ShopOrderItem[]>([]);
  const [consignmentOrders, setConsignmentOrders] = useState<MyConsignmentItem[]>([]);
  const [purchaseRecords, setPurchaseRecords] = useState<PurchaseRecordItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  // const [showDetailModal, setShowDetailModal] = useState(false); // Deprecated
  // const [selectedOrder, setSelectedOrder] = useState<ShopOrderItem | null>(null); // Deprecated
  const [selectedConsignmentOrder, setSelectedConsignmentOrder] = useState<MyConsignmentItem | null>(null);
  // const [loadingDetail, setLoadingDetail] = useState(false); // Deprecated
  const [showConsignmentDetailModal, setShowConsignmentDetailModal] = useState(false);
  const [selectedConsignmentDetail, setSelectedConsignmentDetail] = useState<ConsignmentDetailData | null>(null);
  const [loadingConsignmentDetail, setLoadingConsignmentDetail] = useState(false);

  const getPageConfig = () => {
    switch (category) {
      case 'product':
        return {
          title: '商品订单',
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

  // ... (fetch logic remains same)

  // Navigate to Detail Page instead of Modal
  const handleViewDetail = (id: number) => {
    const backRoute: Route = { name: 'order-list', kind: category, status: activeTab };
    onNavigate({ name: 'order-detail', orderId: String(id), back: backRoute });
  };

  // ... (other handlers)

  // Fetch orders for points category
  useEffect(() => {
    if (category === 'points') {
      const loadOrders = async () => {
        setLoading(true);
        try {
          const token = localStorage.getItem(AUTH_TOKEN_KEY) || '';
          let response;

          switch (activeTab) {
            case 0: // 待付款
              response = await fetchPendingPayOrders({ page: 1, limit: 10, token });
              break;
            case 1: // 待发货
              response = await fetchPendingShipOrders({ page: 1, limit: 10, token });
              break;
            case 2: // 待收货
              response = await fetchPendingConfirmOrders({ page: 1, limit: 10, token });
              break;
            case 3: // 已完成
              response = await fetchCompletedOrders({ page: 1, limit: 10, token });
              break;
            default:
              response = { code: 1, data: { list: [], total: 0, page: 1, limit: 10 } };
          }

          if (response.code === 1 && response.data) {
            const newOrders = response.data.list || [];
            setOrders(newOrders);
            setHasMore(newOrders.length >= 10);
            setPage(1);
          }
        } catch (error) {
          console.error('加载订单失败:', error);
        } finally {
          setLoading(false);
        }
      };

      setPage(1);
      setOrders([]);
      loadOrders();
    }
  }, [category, activeTab]);

  // Fetch orders for delivery category
  useEffect(() => {
    if (category === 'delivery') {
      const loadOrders = async () => {
        setLoading(true);
        try {
          const token = localStorage.getItem(AUTH_TOKEN_KEY) || '';
          let status: 'paid' | 'shipped' | 'completed' | undefined;

          switch (activeTab) {
            case 0: // 待发货
              status = 'paid';
              break;
            case 1: // 待收货
              status = 'shipped';
              break;
            case 2: // 已签收
              status = 'completed';
              break;
            default:
              status = undefined;
          }

          const response = await getDeliveryList({ page: 1, limit: 10, status, token });

          if (response.code === 1 && response.data) {
            const newOrders = response.data.list || [];
            setOrders(newOrders);
            setHasMore(newOrders.length >= 10);
            setPage(1);
          }
        } catch (error) {
          console.error('加载提货订单失败:', error);
        } finally {
          setLoading(false);
        }
      };

      setPage(1);
      setOrders([]);
      loadOrders();
    }
  }, [category, activeTab]);

  // Fetch orders for transaction category (consignment)
  useEffect(() => {
    if (category === 'transaction') {
      const loadConsignmentOrders = async () => {
        setLoading(true);
        try {
          const token = localStorage.getItem(AUTH_TOKEN_KEY) || '';
          let status: number | undefined;

          switch (activeTab) {
            case 0: // 待寄售 - 显示全部状态
              status = 0;
              break;
            case 1: // 寄售中
              status = 1;
              break;
            case 2: // 寄售失败 - 对应已取消
              status = 3;
              break;
            default:
              status = 0;
          }

          const response = await getMyConsignmentList({ page: 1, limit: 10, status, token });

          if (response.code === 1 && response.data) {
            const newOrders = response.data.list || [];
            setConsignmentOrders(newOrders);
            setHasMore(response.data.has_more || false);
            setPage(1);
          }
        } catch (error) {
          console.error('加载寄售订单失败:', error);
        } finally {
          setLoading(false);
        }
      };

      setPage(1);
      setConsignmentOrders([]);
      loadConsignmentOrders();
    }
  }, [category, activeTab]);

  // Fetch orders for product category (purchase records)
  useEffect(() => {
    if (category === 'product') {
      const loadPurchaseRecords = async () => {
        setLoading(true);
        try {
          const token = localStorage.getItem(AUTH_TOKEN_KEY) || '';

          if (activeTab === 0) {
            // 买入订单 - 使用购买记录接口
            const response = await getPurchaseRecords({ page: 1, limit: 10, token });

            if (response.code === 1 && response.data) {
              const newRecords = response.data.list || [];
              setPurchaseRecords(newRecords);
              setHasMore(response.data.has_more || false);
              setPage(1);
            }
          } else if (activeTab === 1) {
            // 卖出订单 - 使用我的寄售列表（状态为已售出）
            const response = await getMyConsignmentList({ page: 1, limit: 10, status: 2, token });

            if (response.code === 1 && response.data) {
              const newConsignments = response.data.list || [];
              setConsignmentOrders(newConsignments);
              setHasMore(response.data.has_more || false);
              setPage(1);
            } else {
              setConsignmentOrders([]);
              setHasMore(false);
              setPage(1);
            }
          }
        } catch (error) {
          console.error('加载购买记录失败:', error);
        } finally {
          setLoading(false);
        }
      };

      setPage(1);
      setPurchaseRecords([]);
      loadPurchaseRecords();
    }
  }, [category, activeTab]);


  const { showToast, showDialog } = useNotification();

  // ... (keeping other hooks)

  const handleConfirmReceipt = async (orderId: number | string) => {
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY) || '';
      const response = await confirmOrder({ id: orderId, token });

      if (response.code === 1) {
        // Refresh orders after confirmation
        setPage(1);
        setOrders([]);

        // Reload orders
        setLoading(true);
        try {
          let reloadResponse;
          if (category === 'delivery') {
            let status: 'paid' | 'shipped' | 'completed' | undefined;
            switch (activeTab) {
              case 0:
                status = 'paid';
                break;
              case 1:
                status = 'shipped';
                break;
              case 2:
                status = 'completed';
                break;
            }
            reloadResponse = await getDeliveryList({ page: 1, limit: 10, status, token });
          } else {
            switch (activeTab) {
              case 0:
                reloadResponse = await fetchPendingPayOrders({ page: 1, limit: 10, token });
                break;
              case 1:
                reloadResponse = await fetchPendingShipOrders({ page: 1, limit: 10, token });
                break;
              case 2:
                reloadResponse = await fetchPendingConfirmOrders({ page: 1, limit: 10, token });
                break;
              case 3:
                reloadResponse = await fetchCompletedOrders({ page: 1, limit: 10, token });
                break;
              default:
                reloadResponse = { code: 1, data: { list: [], total: 0, page: 1, limit: 10 } };
            }
          }

          if (reloadResponse.code === 1 && reloadResponse.data) {
            setOrders(reloadResponse.data.list || []);
          }
        } catch (error) {
          console.error('重新加载订单失败:', error);
        } finally {
          setLoading(false);
        }
      } else {
        showToast('error', '操作失败', response.msg || '确认收货失败');
      }
    } catch (error: any) {
      console.error('确认收货失败:', error);
      showToast('error', '操作失败', error.message || '确认收货失败');
    }
  };

  const formatOrderDate = (date: number | string | undefined, includeTime: boolean = false): string => {
    if (!date) return '';

    let timestamp: number;
    if (typeof date === 'string') {
      // 如果是字符串，先清理，只取数字部分
      const cleaned = date.trim().replace(/[^\d]/g, '');
      timestamp = parseInt(cleaned, 10);
      if (isNaN(timestamp)) {
        // 如果解析失败，尝试直接使用（可能是已经格式化的日期字符串）
        return date.trim();
      }
    } else {
      timestamp = date;
    }

    if (!timestamp || timestamp === 0) return '';

    // 判断时间戳是秒级还是毫秒级
    // 如果时间戳小于 10000000000，认为是秒级，需要乘以1000
    // 否则认为是毫秒级
    const timestampMs = timestamp < 10000000000 ? timestamp * 1000 : timestamp;

    const d = new Date(timestampMs);

    // 检查日期是否有效
    if (isNaN(d.getTime())) return '';

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    if (includeTime) {
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const seconds = String(d.getSeconds()).padStart(2, '0');
      const timeStr = `${hours}:${minutes}:${seconds}`;
      return `${dateStr} ${timeStr}`.trim();
    }
    return dateStr.trim();
  };

  const formatOrderPrice = (price: number | string | undefined): string => {
    if (price === undefined || price === null) return '0.00';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return numPrice.toFixed(2);
  };

  // Get first item from order items array
  const getFirstItem = (order: ShopOrderItem): ShopOrderItemDetail | null => {
    if (order.items && order.items.length > 0) {
      return order.items[0];
    }
    return null;
  };

  const getOrderImage = (order: ShopOrderItem): string => {
    const firstItem = getFirstItem(order);
    if (firstItem?.product_thumbnail) {
      return normalizeAssetUrl(firstItem.product_thumbnail);
    }
    return order.product_image || order.thumbnail || '';
  };

  const getOrderName = (order: ShopOrderItem): string => {
    const firstItem = getFirstItem(order);
    if (firstItem?.product_name) {
      return firstItem.product_name;
    }
    return order.product_name || '商品';
  };

  const getOrderQuantity = (order: ShopOrderItem): number => {
    const firstItem = getFirstItem(order);
    if (firstItem?.quantity) {
      return firstItem.quantity;
    }
    return order.quantity || 1;
  };

  const getOrderStatus = (order: ShopOrderItem): string => {
    return order.status_text || '未知状态';
  };

  const getOrderPrice = (order: ShopOrderItem): { amount: number; score: number; isScore: boolean } => {
    const firstItem = getFirstItem(order);
    const isScore = order.pay_type === 'score';

    if (isScore) {
      // For score orders, show score
      const totalScore = order.total_score
        ? (typeof order.total_score === 'string' ? parseFloat(order.total_score) : order.total_score)
        : (firstItem?.subtotal_score || firstItem?.score_price || 0);
      return { amount: 0, score: totalScore, isScore: true };
    } else {
      // For money orders, show amount
      const totalAmount = order.total_amount
        ? (typeof order.total_amount === 'string' ? parseFloat(order.total_amount) : order.total_amount)
        : (firstItem?.subtotal || firstItem?.price || 0);
      return { amount: totalAmount, score: 0, isScore: false };
    }
  };

  const handlePayOrder = async (orderId: number | string) => {
    showDialog({
      title: '确认支付',
      description: '确定要支付此订单吗？',
      confirmText: '确定支付',
      cancelText: '取消',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem(AUTH_TOKEN_KEY) || '';
          const response = await payOrder({ id: orderId, token });

          if (response.code === 1) {
            // Refresh orders after payment
            setPage(1);
            setOrders([]);

            // Reload orders
            setLoading(true);
            try {
              let reloadResponse;
              if (category === 'delivery') {
                let status: 'paid' | 'shipped' | 'completed' | undefined;
                switch (activeTab) {
                  case 0:
                    status = 'paid';
                    break;
                  case 1:
                    status = 'shipped';
                    break;
                  case 2:
                    status = 'completed';
                    break;
                }
                reloadResponse = await getDeliveryList({ page: 1, limit: 10, status, token });
              } else {
                switch (activeTab) {
                  case 0:
                    reloadResponse = await fetchPendingPayOrders({ page: 1, limit: 10, token });
                    break;
                  case 1:
                    reloadResponse = await fetchPendingShipOrders({ page: 1, limit: 10, token });
                    break;
                  case 2:
                    reloadResponse = await fetchPendingConfirmOrders({ page: 1, limit: 10, token });
                    break;
                  case 3:
                    reloadResponse = await fetchCompletedOrders({ page: 1, limit: 10, token });
                    break;
                  default:
                    reloadResponse = { code: 1, data: { list: [], total: 0, page: 1, limit: 10 } };
                }
              }

              if (reloadResponse.code === 1 && reloadResponse.data) {
                setOrders(reloadResponse.data.list || []);
              }
              showToast('success', response.msg || '支付成功');
            } catch (error) {
              console.error('重新加载订单失败:', error);
            } finally {
              setLoading(false);
            }
          } else {
            showToast('error', '支付失败', response.msg || '支付失败');
          }
        } catch (error: any) {
          console.error('支付订单失败:', error);
          showToast('error', '支付失败', error.message || '支付失败');
        }
      }
    });
  };

  const handleDeleteOrder = async (orderId: number | string) => {
    showDialog({
      title: '确认删除',
      description: '确定要删除此订单吗？删除后无法恢复。',
      confirmText: '确定删除',
      confirmColor: '#FF6B6B',
      cancelText: '取消',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem(AUTH_TOKEN_KEY) || '';
          const response = await deleteOrder({ id: orderId, token });

          if (response.code === 1) {
            // Refresh orders after deletion
            setPage(1);
            setOrders([]);

            // Reload orders
            setLoading(true);
            try {
              let reloadResponse;
              if (category === 'delivery') {
                let status: 'paid' | 'shipped' | 'completed' | undefined;
                switch (activeTab) {
                  case 0:
                    status = 'paid';
                    break;
                  case 1:
                    status = 'shipped';
                    break;
                  case 2:
                    status = 'completed';
                    break;
                }
                reloadResponse = await getDeliveryList({ page: 1, limit: 10, status, token });
              } else {
                switch (activeTab) {
                  case 0:
                    reloadResponse = await fetchPendingPayOrders({ page: 1, limit: 10, token });
                    break;
                  case 1:
                    reloadResponse = await fetchPendingShipOrders({ page: 1, limit: 10, token });
                    break;
                  case 2:
                    reloadResponse = await fetchPendingConfirmOrders({ page: 1, limit: 10, token });
                    break;
                  case 3:
                    reloadResponse = await fetchCompletedOrders({ page: 1, limit: 10, token });
                    break;
                  default:
                    reloadResponse = { code: 1, data: { list: [], total: 0, page: 1, limit: 10 } };
                }
              }

              if (reloadResponse.code === 1 && reloadResponse.data) {
                setOrders(reloadResponse.data.list || []);
              }
              showToast('success', response.msg || '删除成功');
            } catch (error) {
              console.error('重新加载订单失败:', error);
            } finally {
              setLoading(false);
            }
          } else {
            showToast('error', '删除失败', response.msg || '删除失败');
          }
        } catch (error: any) {
          console.error('删除订单失败:', error);
          showToast('error', '删除失败', error.message || '删除失败');
        }
      }
    });
  };



  const handleViewConsignmentDetail = async (consignmentId: number) => {
    setLoadingConsignmentDetail(true);
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY) || '';
      const response = await getConsignmentDetail({ consignment_id: consignmentId, token });

      if (response.code === 1 && response.data) {
        setSelectedConsignmentDetail(response.data);
        setShowConsignmentDetailModal(true);
      } else {
        showToast('error', '获取失败', response.msg || '获取寄售详情失败');
      }
    } catch (error: any) {
      console.error('获取寄售详情失败:', error);
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
          const token = localStorage.getItem(AUTH_TOKEN_KEY) || '';
          const response = await cancelConsignment({ consignment_id: consignmentId, token });

          if (response.code === 1) {
            // Refresh consignment orders after cancellation
            setPage(1);
            setConsignmentOrders([]);

            // Reload orders
            setLoading(true);
            try {
              let status: number | undefined;
              switch (activeTab) {
                case 0:
                  status = 0;
                  break;
                case 1:
                  status = 1;
                  break;
                case 2:
                  status = 3;
                  break;
                default:
                  status = 0;
              }
              const reloadResponse = await getMyConsignmentList({ page: 1, limit: 10, status, token });

              if (reloadResponse.code === 1 && reloadResponse.data) {
                setConsignmentOrders(reloadResponse.data.list || []);
              }
              showToast('success', response.msg || '取消成功');
            } catch (error) {
              console.error('重新加载寄售订单失败:', error);
            } finally {
              setLoading(false);
            }
          } else {
            showToast('error', '取消失败', response.msg || '取消寄售失败');
          }
        } catch (error: any) {
          console.error('取消寄售失败:', error);
          showToast('error', '取消失败', error.message || '取消寄售失败');
        }
      }
    });
  };

  // All categories now use real API data
  // No more mock data needed

  return (
    <SubPageLayout title={config.title} onBack={onBack}>
      <OrderTabs tabs={config.tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Order List */}
      <div className="p-4 space-y-4">
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
          />
        ) : category === 'points' || category === 'delivery' ? (
          <PointDeliveryOrderList
            category={category}
            orders={orders}
            loading={loading}
            activeTab={activeTab}
            formatOrderDate={(date) => formatOrderDate(date)}
            formatOrderPrice={formatOrderPrice}
            getOrderStatus={getOrderStatus}
            getOrderImage={getOrderImage}
            getOrderName={getOrderName}
            getOrderQuantity={getOrderQuantity}
            getOrderPrice={getOrderPrice}
            onDelete={handleDeleteOrder}
            onConfirmReceipt={handleConfirmReceipt}
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
    </SubPageLayout>
  );
};

export default OrderListPage;