/**
 * useOrderList - 订单列表逻辑 Hook
 */
import { useState, useEffect, useCallback, useRef, type Dispatch, type SetStateAction } from 'react';
import {
  fetchPendingPayOrders,
  fetchPendingShipOrders,
  fetchPendingConfirmOrders,
  fetchCompletedOrders,
  getDeliveryList,
  getMyConsignmentList,
  getMyCollection,
  getPurchaseRecords,
  type DeliveryListData,
  type MyConsignmentListData,
  ShopOrderItem,
  MyConsignmentItem,
  PurchaseRecordItem,
  MyCollectionItem,
} from '@/services';
import { getStoredToken } from '@/services/client';
import { extractData } from '@/utils/apiHelpers';
import { errorLog } from '@/utils/logger';

type OrderCategory = 'product' | 'transaction' | 'delivery' | 'points';

interface UseOrderListParams {
  category: OrderCategory;
  activeTab: number;
  page: number;
  onPageChange: (page: number) => void;
}

export function useOrderList({ category, activeTab, page, onPageChange }: UseOrderListParams) {
  const [orders, setOrders] = useState<ShopOrderItem[]>([]);
  const [consignmentOrders, setConsignmentOrders] = useState<MyConsignmentItem[]>([]);
  const [purchaseRecords, setPurchaseRecords] = useState<PurchaseRecordItem[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  // 使用 ref 追踪加载状态，避免重复请求
  const loadingRef = useRef(false);
  const lastRequestRef = useRef({ category: '', activeTab: -1, page: -1 });

  const mergeListByPage = useCallback(
    <T>(targetSetter: Dispatch<SetStateAction<T[]>>, list: T[]) => {
      if (page === 1) {
        targetSetter(list);
      } else {
        targetSetter((prev) => [...prev, ...list]);
      }
    },
    [page]
  );

  // Load orders for points category (消费金订单)
  // 使用 shopOrder 接口，pay_type=score
  // tabs: ['待付款', '待发货', '待收货', '已完成']
  useEffect(() => {
    if (category !== 'points') return;

    // 防止重复请求
    const requestKey = `${category}-${activeTab}-${page}`;
    const lastKey = `${lastRequestRef.current.category}-${lastRequestRef.current.activeTab}-${lastRequestRef.current.page}`;
    if (loadingRef.current && requestKey === lastKey) return;

    const loadOrders = async () => {
      loadingRef.current = true;
      lastRequestRef.current = { category, activeTab, page };
      setLoading(true);

      try {
        const token = getStoredToken() || '';
        const params = { page, limit: 10, pay_type: 'score' as const, token };

        let response;
        switch (activeTab) {
          case 0: // 待付款
            response = await fetchPendingPayOrders(params);
            break;
          case 1: // 待发货
            response = await fetchPendingShipOrders(params);
            break;
          case 2: // 待收货
            response = await fetchPendingConfirmOrders(params);
            break;
          case 3: // 已完成
            response = await fetchCompletedOrders(params);
            break;
          default:
            response = await fetchPendingPayOrders(params);
        }

        const data = extractData<{
          list: ShopOrderItem[];
          total: number;
        }>(response);
        if (data) {
          const newOrders = data.list || [];
          mergeListByPage(setOrders, newOrders);
          setHasMore(newOrders.length >= 10);
        }
      } catch (error) {
        errorLog('useOrderList', '加载消费金订单失败:', error);
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    };

    if (page === 1) {
      setOrders([]);
    }
    loadOrders();
  }, [category, activeTab, page, mergeListByPage]);

  // Load orders for delivery category (提货订单)
  useEffect(() => {
    if (category !== 'delivery') return;

    // 防止重复请求
    const requestKey = `${category}-${activeTab}-${page}`;
    const lastKey = `${lastRequestRef.current.category}-${lastRequestRef.current.activeTab}-${lastRequestRef.current.page}`;
    if (loadingRef.current && requestKey === lastKey) return;

    const loadOrders = async () => {
      loadingRef.current = true;
      lastRequestRef.current = { category, activeTab, page };
      setLoading(true);

      try {
        const token = getStoredToken() || '';

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
          default:
            status = undefined;
        }

        const response = await getDeliveryList({ page, limit: 10, status, token });
        const data = extractData<DeliveryListData>(response);
        if (data) {
          const newOrders = data.list || [];
          mergeListByPage(setOrders, newOrders);
          setHasMore(newOrders.length >= 10);
        }
      } catch (error) {
        errorLog('useOrderList', '加载提货订单失败:', error);
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    };

    if (page === 1) {
      setOrders([]);
    }
    loadOrders();
  }, [category, activeTab, page, mergeListByPage]);

  // Load orders for transaction category
  useEffect(() => {
    if (category !== 'transaction') return;

    // 防止重复请求
    const requestKey = `${category}-${activeTab}-${page}`;
    const lastKey = `${lastRequestRef.current.category}-${lastRequestRef.current.activeTab}-${lastRequestRef.current.page}`;
    if (loadingRef.current && requestKey === lastKey) return;

    const loadConsignmentOrders = async () => {
      loadingRef.current = true;
      lastRequestRef.current = { category, activeTab, page };
      setLoading(true);

      try {
        const token = getStoredToken() || '';
        let status: string;

        switch (activeTab) {
          case 0:
            status = 'holding';
            break;
          case 1:
            status = 'consigned';
            break;
          case 2:
            status = 'failed';
            break;
          default:
            status = 'holding';
        }

        const response = await getMyCollection({ page, limit: 10, status, token });
        const data = extractData<{
          list: MyCollectionItem[];
          total: number;
          has_more?: boolean;
          consignment_coupon?: number;
        }>(response);
        if (data) {
          let newOrders = data.list || [];

          // 待寄售标签：排除共识验证节点的藏品
          if (activeTab === 0) {
            newOrders = newOrders.filter((item: MyCollectionItem) =>
              Number(item.mining_status) !== 1
            );
          }

          // 转换 MyCollectionItem 为 MyConsignmentItem 兼容格式
          const convertedOrders: MyConsignmentItem[] = newOrders.map((item: MyCollectionItem) => ({
            ...item,
            id: item.id,
            item_id: item.id,
            item_title: item.title,
            item_image: item.image,
            consignment_price: Number(item.market_price ?? item.price ?? 0),
            status_text: item.consignment_status_text || '持有中',
          }));

          mergeListByPage(setConsignmentOrders, convertedOrders);
          setHasMore(data.has_more || false);
        }
      } catch (error) {
        errorLog('useOrderList', '加载交易订单失败:', error);
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    };

    if (page === 1) {
      setConsignmentOrders([]);
    }
    loadConsignmentOrders();
  }, [category, activeTab, page, mergeListByPage]);

  // Load orders for product category
  useEffect(() => {
    if (category !== 'product') return;

    // 防止重复请求
    const requestKey = `${category}-${activeTab}-${page}`;
    const lastKey = `${lastRequestRef.current.category}-${lastRequestRef.current.activeTab}-${lastRequestRef.current.page}`;
    if (loadingRef.current && requestKey === lastKey) return;

    const loadPurchaseRecords = async () => {
      loadingRef.current = true;
      lastRequestRef.current = { category, activeTab, page };
      setLoading(true);

      try {
        const token = getStoredToken() || '';

        if (activeTab === 0) {
          // 买入订单 - 使用购买记录接口
          const response = await getPurchaseRecords({ page, limit: 10, token });
          const data = extractData<{
            list: PurchaseRecordItem[];
            has_more?: boolean;
          }>(response);
          if (data) {
            const newRecords = data.list || [];
            mergeListByPage(setPurchaseRecords, newRecords);
            setHasMore(data.has_more || false);
          }
        } else if (activeTab === 1) {
          // 卖出订单 - 使用我的寄售列表（状态为已售出）
          const response = await getMyConsignmentList({ page, limit: 10, status: 2, token });
          const data = extractData<MyConsignmentListData>(response);
          if (data) {
            const newConsignments = data.list || [];
            mergeListByPage(setConsignmentOrders, newConsignments);
            setHasMore(data.has_more || false);
          } else {
            setConsignmentOrders([]);
            setHasMore(false);
          }
        }
      } catch (error) {
        errorLog('useOrderList', '加载购买记录失败:', error);
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    };

    if (page === 1) {
      setPurchaseRecords([]);
      setConsignmentOrders([]);
    }
    loadPurchaseRecords();
  }, [category, activeTab, page, mergeListByPage]);

  const reload = useCallback(() => {
    // 重置追踪状态，允许重新加载
    loadingRef.current = false;
    lastRequestRef.current = { category: '', activeTab: -1, page: -1 };
    onPageChange(1);
  }, [onPageChange]);

  return {
    orders,
    consignmentOrders,
    purchaseRecords,
    loading,
    hasMore,
    reload,
    setOrders,
    setConsignmentOrders,
  };
}
