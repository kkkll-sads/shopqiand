import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import SubPageLayout from '../../../components/SubPageLayout';
import { LoadingSpinner, EmptyState, LazyImage } from '../../../components/common';
import { formatTime, formatAmount } from '../../../utils/format';
import { Order } from '../../../types';
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
  getMyCollection,
  ShopOrderItem,
  ShopOrderItemDetail,
  MyConsignmentItem,
  PurchaseRecordItem,
  ConsignmentDetailData,
  MyCollectionItem,
  normalizeAssetUrl,
} from '../../../services/api';
import { getStoredToken } from '../../../services/client';
import { useNotification } from '../../../context/NotificationContext';
// ✅ 引入统一 API 处理工具
import { isSuccess, extractData, extractError } from '../../../utils/apiHelpers';
import { useStateMachine } from '../../../hooks/useStateMachine';
import { LoadingEvent, LoadingState } from '../../../types/states';
import OrderTabs from './components/orders/OrderTabs';
import TransactionOrderList from './components/orders/TransactionOrderList';
import ProductOrderList from './components/orders/ProductOrderList';
import PointDeliveryOrderList from './components/orders/PointDeliveryOrderList';
import ConsignmentDetailModal from './components/orders/ConsignmentDetailModal';

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
  const [orders, setOrders] = useState<ShopOrderItem[]>([]);
  const [consignmentOrders, setConsignmentOrders] = useState<MyConsignmentItem[]>([]);
  const [purchaseRecords, setPurchaseRecords] = useState<PurchaseRecordItem[]>([]);
  const loadMachine = useStateMachine<LoadingState, LoadingEvent>({
    initial: LoadingState.IDLE,
    transitions: {
      [LoadingState.IDLE]: { [LoadingEvent.LOAD]: LoadingState.LOADING },
      [LoadingState.LOADING]: {
        [LoadingEvent.SUCCESS]: LoadingState.SUCCESS,
        [LoadingEvent.ERROR]: LoadingState.ERROR,
      },
      [LoadingState.SUCCESS]: {
        [LoadingEvent.LOAD]: LoadingState.LOADING,
        [LoadingEvent.RETRY]: LoadingState.LOADING,
      },
      [LoadingState.ERROR]: {
        [LoadingEvent.LOAD]: LoadingState.LOADING,
        [LoadingEvent.RETRY]: LoadingState.LOADING,
      },
    },
  });
  const loading = loadMachine.state === LoadingState.LOADING;
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  // const [showDetailModal, setShowDetailModal] = useState(false); // Deprecated
  // const [selectedOrder, setSelectedOrder] = useState<ShopOrderItem | null>(null); // Deprecated
  const [selectedConsignmentOrder, setSelectedConsignmentOrder] = useState<MyConsignmentItem | null>(null);
  // const [loadingDetail, setLoadingDetail] = useState(false); // Deprecated
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

  const handleBack = () => {
    navigate(-1);
  };

  // ... (fetch logic remains same)

  // Navigate to Detail Page instead of Modal
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

  // ... (other handlers)

  // Fetch orders for points category
  useEffect(() => {
    if (category === 'points') {
      const loadOrders = async () => {
        loadMachine.send(LoadingEvent.LOAD);
        try {
          const token = getStoredToken() || '';
          let response;

          switch (activeTab) {
            case 0: // 待付款
              response = await fetchPendingPayOrders({ page: 1, limit: 10, pay_type: 'score', token });
              break;
            case 1: // 待发货
              response = await fetchPendingShipOrders({ page: 1, limit: 10, pay_type: 'score', token });
              break;
            case 2: // 待收货
              response = await fetchPendingConfirmOrders({ page: 1, limit: 10, pay_type: 'score', token });
              break;
            case 3: // 已完成
              response = await fetchCompletedOrders({ page: 1, limit: 10, pay_type: 'score', token });
              break;
            default:
              response = { code: 1, data: { list: [], total: 0, page: 1, limit: 10 } };
          }

          // ✅ 使用统一判断
          const data = extractData(response) as any;
          if (data) {
            const newOrders = data.list || [];
            setOrders(newOrders);
            setHasMore(newOrders.length >= 10);
            setPage(1);
            loadMachine.send(LoadingEvent.SUCCESS);
          } else {
            loadMachine.send(LoadingEvent.ERROR);
          }
        } catch (error) {
          console.error('加载订单失败:', error);
          loadMachine.send(LoadingEvent.ERROR);
        } finally {
          // 状态机已处理成功/失败
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
        loadMachine.send(LoadingEvent.LOAD);
        try {
          const token = getStoredToken() || '';
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

          // ✅ 使用统一判断
          const data = extractData(response) as any;
          if (data) {
            const newOrders = data.list || [];
            setOrders(newOrders);
            setHasMore(newOrders.length >= 10);
            setPage(1);
            loadMachine.send(LoadingEvent.SUCCESS);
          } else {
            loadMachine.send(LoadingEvent.ERROR);
          }
        } catch (error) {
          console.error('加载提货订单失败:', error);
          loadMachine.send(LoadingEvent.ERROR);
        } finally {
          // 状态机已处理成功/失败
        }
      };

      setPage(1);
      setOrders([]);
      loadOrders();
    }
  }, [category, activeTab]);

  // Fetch orders for transaction category (using myCollection API)
  useEffect(() => {
    if (category === 'transaction') {
      const loadConsignmentOrders = async () => {
        loadMachine.send(LoadingEvent.LOAD);
        try {
          const token = getStoredToken() || '';
          let status: string;

          switch (activeTab) {
            case 0: // 待寄售
              status = 'holding';
              break;
            case 1: // 寄售中
              status = 'consigned';
              break;
            case 2: // 寄售失败
              status = 'failed';
              break;
            default:
              status = 'holding';
          }

          const response = await getMyCollection({ page: 1, limit: 10, status, token });

          // ✅ 使用统一判断
          const data = extractData(response) as any;
          if (data) {
            let newOrders = data.list || [];

            // 待寄售标签：排除共识验证节点的藏品（mining_status === 1）
            if (activeTab === 0) {
              newOrders = newOrders.filter((item: MyCollectionItem) =>
                Number(item.mining_status) !== 1
              );
            }

            // 转换 MyCollectionItem 为 MyConsignmentItem 兼容格式
            const convertedOrders = newOrders.map((item: MyCollectionItem) => ({
              id: item.id,
              item_id: item.id,
              item_title: item.title,
              item_image: item.image,
              price: item.price,
              market_price: item.market_price,
              consignment_status: item.consignment_status,
              consignment_status_text: item.consignment_status_text,
              asset_code: item.asset_code,
              sold_price: item.sold_price,
              service_fee: item.service_fee,
              fail_count: item.fail_count,
              ...item,
            }));
            setConsignmentOrders(convertedOrders as any);
            setHasMore(data.has_more || false);
            setPage(1);
            loadMachine.send(LoadingEvent.SUCCESS);
          } else {
            loadMachine.send(LoadingEvent.ERROR);
          }
        } catch (error) {
          console.error('加载交易订单失败:', error);
          loadMachine.send(LoadingEvent.ERROR);
        } finally {
          // 状态机已处理成功/失败
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
        loadMachine.send(LoadingEvent.LOAD);
        try {
          const token = getStoredToken() || '';

          if (activeTab === 0) {
            // 买入订单 - 使用购买记录接口
            const response = await getPurchaseRecords({ page: 1, limit: 10, token });

            // ✅ 使用统一判断
            const data = extractData(response) as any;
            if (data) {
              const newRecords = data.list || [];
              setPurchaseRecords(newRecords);
              setHasMore(data.has_more || false);
              setPage(1);
              loadMachine.send(LoadingEvent.SUCCESS);
            } else {
              loadMachine.send(LoadingEvent.ERROR);
            }
          } else if (activeTab === 1) {
            // 卖出订单 - 使用我的寄售列表（状态为已售出）
            const response = await getMyConsignmentList({ page: 1, limit: 10, status: 2, token });

            // ✅ 使用统一判断
            const data = extractData(response) as any;
            if (data) {
              const newConsignments = data.list || [];
              setConsignmentOrders(newConsignments);
              setHasMore(data.has_more || false);
              setPage(1);
              loadMachine.send(LoadingEvent.SUCCESS);
            } else {
              setConsignmentOrders([]);
              setHasMore(false);
              setPage(1);
              loadMachine.send(LoadingEvent.ERROR);
            }
          }
        } catch (error) {
          console.error('加载购买记录失败:', error);
          loadMachine.send(LoadingEvent.ERROR);
        } finally {
          // 状态机已处理成功/失败
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
      const token = getStoredToken() || '';
      const response = await confirmOrder({ id: orderId, token });

      // ✅ 使用统一判断
      if (isSuccess(response)) {
        // Refresh orders after confirmation
        setPage(1);
        setOrders([]);

        // Reload orders
        loadMachine.send(LoadingEvent.LOAD);
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

          // ✅ 使用统一判断
          const reloadData = extractData(reloadResponse) as any;
          if (reloadData) {
            setOrders(reloadData.list || []);
            loadMachine.send(LoadingEvent.SUCCESS);
          } else {
            loadMachine.send(LoadingEvent.ERROR);
          }
        } catch (error) {
          console.error('重新加载订单失败:', error);
          loadMachine.send(LoadingEvent.ERROR);
        } finally {
          // 状态机已处理成功/失败
        }
      } else {
        showToast('error', '操作失败', extractError(response, '确认收货失败'));
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
          const token = getStoredToken() || '';
          const response = await payOrder({ id: orderId, token });

          // ✅ 使用统一判断
          if (isSuccess(response)) {
            // Refresh orders after payment
            setPage(1);
            setOrders([]);

            // Reload orders
            loadMachine.send(LoadingEvent.LOAD);
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

              // ✅ 使用统一判断
              const reloadData = extractData(reloadResponse) as any;
              if (reloadData) {
                setOrders(reloadData.list || []);
                loadMachine.send(LoadingEvent.SUCCESS);
              } else {
                loadMachine.send(LoadingEvent.ERROR);
              }
              showToast('success', extractError(response, '支付成功'));
            } catch (error) {
              console.error('重新加载订单失败:', error);
              loadMachine.send(LoadingEvent.ERROR);
            } finally {
              // 状态机已处理成功/失败
            }
          } else {
            showToast('error', '支付失败', extractError(response, '支付失败'));
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
          const token = getStoredToken() || '';
          const response = await deleteOrder({ id: orderId, token });

          // ✅ 使用统一判断
          if (isSuccess(response)) {
            // Refresh orders after deletion
            setPage(1);
            setOrders([]);

            // Reload orders
            loadMachine.send(LoadingEvent.LOAD);
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

              // ✅ 使用统一判断
              const reloadData = extractData(reloadResponse) as any;
              if (reloadData) {
                setOrders(reloadData.list || []);
                loadMachine.send(LoadingEvent.SUCCESS);
              } else {
                loadMachine.send(LoadingEvent.ERROR);
              }
              showToast('success', extractError(response, '删除成功'));
            } catch (error) {
              console.error('重新加载订单失败:', error);
              loadMachine.send(LoadingEvent.ERROR);
            } finally {
              // 状态机已处理成功/失败
            }
          } else {
            showToast('error', '删除失败', extractError(response, '删除失败'));
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
      const token = getStoredToken() || '';
      const response = await getConsignmentDetail({ consignment_id: consignmentId, token });

      // ✅ 使用统一判断
      const data = extractData(response) as any;
      if (data) {
        setSelectedConsignmentDetail(data);
        setShowConsignmentDetailModal(true);
      } else {
        showToast('error', '获取失败', extractError(response, '获取寄售详情失败'));
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
          const token = getStoredToken() || '';
          const response = await cancelConsignment({ consignment_id: consignmentId, token });

          // ✅ 使用统一判断
          if (isSuccess(response)) {
            // Refresh consignment orders after cancellation
            setPage(1);
            setConsignmentOrders([]);

            // Reload orders
            loadMachine.send(LoadingEvent.LOAD);
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

              // ✅ 使用统一判断
              const reloadData = extractData(reloadResponse) as any;
              if (reloadData) {
                setConsignmentOrders(reloadData.list || []);
                loadMachine.send(LoadingEvent.SUCCESS);
              } else {
                loadMachine.send(LoadingEvent.ERROR);
              }
              showToast('success', extractError(response, '取消成功'));
            } catch (error) {
              console.error('重新加载寄售订单失败:', error);
              loadMachine.send(LoadingEvent.ERROR);
            } finally {
              // 状态机已处理成功/失败
            }
          } else {
            showToast('error', '取消失败', extractError(response, '取消寄售失败'));
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

  // 为消费金订单使用特殊的布局
  if (category === 'points') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50/30 to-gray-50 max-w-[480px] mx-auto">
        {/* 顶部导航栏 - 使用浅橙色渐变 */}
        <header className="bg-gradient-to-r from-[#fedab0] to-[#ffd9a8] text-gray-800 shadow-md sticky top-0 z-10">
          <div className="flex items-center h-14 px-4">
            <button
              className="p-2 -ml-2 hover:bg-white/30 rounded-full transition-colors"
              aria-label="返回"
            onClick={handleBack}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="flex-1 text-center pr-9 font-medium">消费金订单</h1>
          </div>

          {/* 标签页 - 优化样式 */}
          <div className="flex bg-white/20 backdrop-blur-sm">
            {config.tabs.map((tab, index) => (
              <button
                key={index}
                onClick={() => setActiveTab(index)}
                className={`flex-1 py-3.5 text-sm relative transition-all ${activeTab === index
                  ? 'text-gray-800 font-medium'
                  : 'text-gray-600'
                  }`}
              >
                {tab}
                {activeTab === index && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-white rounded-t-full shadow-md" />
                )}
              </button>
            ))}
          </div>
        </header>

        {/* 订单列表 */}
        <div className="p-3 pb-4 space-y-3">
          <PointDeliveryOrderList
            category={category}
            orders={orders}
            loading={loading}
            activeTab={activeTab}
            onViewDetail={handleViewDetail}
          />
        </div>
      </div>
    );
  }

  return (
    <SubPageLayout title={config.title} onBack={handleBack}>
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
            onViewOrderDetail={handleViewCollectionOrderDetail}
          />
        ) : category === 'delivery' ? (
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
    </SubPageLayout>
  );
};

export default OrderListPage;