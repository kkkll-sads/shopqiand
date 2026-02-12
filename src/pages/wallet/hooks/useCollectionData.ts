/**
 * 藏品列表数据加载 Hook
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import {
  getMyCollection,
  fetchProfile,
  getBatchConsignableList,
  MyCollectionItem,
  BatchConsignableListData,
} from '@/services';
import { getStoredToken } from '@/services/client';
import { useAuthStore } from '@/stores/authStore';
import { UserInfo } from '@/types';
import { ConsignmentStatus, DeliveryStatus } from '@/constants/statusEnums';
import { isSuccess, extractError } from '@/utils/apiHelpers';
import { debugLog, errorLog } from '@/utils/logger';
import { deduplicateCollections } from './useCollectionFilters';

export type CategoryTab = 'hold' | 'consign' | 'sold' | 'dividend';

interface UseCollectionDataOptions {
  activeTab: CategoryTab;
  page: number;
  onLoadStart: () => void;
  onLoadSuccess: () => void;
  onLoadError: () => void;
}

/**
 * 藏品列表数据加载 Hook
 */
export function useCollectionData(options: UseCollectionDataOptions) {
  const { activeTab, page, onLoadStart, onLoadSuccess, onLoadError } = options;

  // 使用 ref 存储回调函数，避免它们成为 useCallback 的依赖项导致无限循环
  const callbacksRef = useRef({ onLoadStart, onLoadSuccess, onLoadError });
  callbacksRef.current = { onLoadStart, onLoadSuccess, onLoadError };

  const [error, setError] = useState<string | null>(null);
  const [myCollections, setMyCollections] = useState<MyCollectionItem[]>([]);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [consignmentTicketCount, setConsignmentTicketCount] = useState<number>(0);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [batchConsignableData, setBatchConsignableData] = useState<BatchConsignableListData | null>(null);

  const syncConsignmentCoupon = useCallback((coupon?: number) => {
    if (typeof coupon === 'number') {
      setConsignmentTicketCount(coupon);
    }
  }, []);

  // 加载用户信息
  const loadUserInfo = useCallback(async () => {
    const token = getStoredToken();
    if (!token) return;

    try {
      const cachedUserInfo = useAuthStore.getState().user;
      if (cachedUserInfo) {
        setUserInfo(cachedUserInfo);
      }

      const response = await fetchProfile(token);
      if (isSuccess(response) && response.data?.userInfo) {
        setUserInfo(response.data.userInfo);
        useAuthStore.getState().updateUser(response.data.userInfo);
      }
    } catch (err) {
      errorLog('useCollectionData', '加载用户信息失败', err);
    }
  }, []);

  // 加载批量寄售数据
  const loadBatchConsignableList = useCallback(async () => {
    const token = getStoredToken();
    if (!token) return;

    try {
      const response = await getBatchConsignableList(token);
      if (isSuccess(response) && response.data) {
        setBatchConsignableData(response.data);
      }
    } catch (error) {
      errorLog('useCollectionData', '获取批量寄售列表失败', error);
    }
  }, []);

  // 加载藏品数据
  const loadData = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setError('请先登录');
      callbacksRef.current.onLoadError();
      return;
    }

    callbacksRef.current.onLoadStart();
    setError(null);

    let hasError = false;
    try {
      if (activeTab === 'hold') {
        const res = await getMyCollection({ page, token, status: 'holding' });
        if (isSuccess(res) && res.data) {
          const list = res.data.list || [];
          const filteredList = list.filter((item) => {
            const dStatus = Number(item.delivery_status) || 0;
            const cStatus = Number(item.consignment_status) || 0;
            return dStatus === DeliveryStatus.NOT_DELIVERED && cStatus === 0;
          });

          debugLog('useCollectionData', 'API返回数据', {
            count: list.length,
            filtered: filteredList.length,
            activeTab,
          });

          if (page === 1) {
            const deduplicated = deduplicateCollections(filteredList);
            debugLog('useCollectionData', '去重后数据', { count: deduplicated.length });
            setMyCollections(deduplicated);
          } else {
            setMyCollections((prev) => {
              const combined = deduplicateCollections([...prev, ...filteredList]);
              debugLog('useCollectionData', '合并去重后数据', { count: combined.length });
              return combined;
            });
          }
          setHasMore(list.length >= 10 && res.data.has_more !== false);
          syncConsignmentCoupon(res.data.consignment_coupon);
        } else {
          setError(extractError(res, '获取我的藏品失败'));
          hasError = true;
        }
      } else if (activeTab === 'dividend') {
        const res = await getMyCollection({ page, token, status: 'mining' });
        if (isSuccess(res) && res.data) {
          const list = res.data.list || [];
          if (page === 1) {
            setMyCollections(deduplicateCollections(list));
          } else {
            setMyCollections((prev) => deduplicateCollections([...prev, ...list]));
          }
          setHasMore(list.length >= 10 && res.data.has_more !== false);
          syncConsignmentCoupon(res.data.consignment_coupon);
        } else {
          setError(extractError(res, '获取权益节点列表失败'));
          hasError = true;
        }
      } else if (activeTab === 'sold') {
        const res = await getMyCollection({ page, token, status: 'sold' });
        if (isSuccess(res) && res.data) {
          const list = res.data.list || [];
          if (page === 1) {
            setMyCollections(deduplicateCollections(list));
          } else {
            setMyCollections((prev) => deduplicateCollections([...prev, ...list]));
          }
          setHasMore(list.length >= 10 && res.data.has_more !== false);
        } else {
          setError(extractError(res, '获取已售出列表失败'));
          hasError = true;
        }
      } else if (activeTab === 'consign') {
        const res = await getMyCollection({ page, token, status: 'consigned' });
        if (isSuccess(res) && res.data) {
          const list = res.data.list || [];
          const filteredList = list.filter((item) => {
            if (item.status_text) {
              return item.status_text.includes('寄售中') || item.status_text === '寄售中';
            }
            const cStatus = Number(item.consignment_status) || 0;
            return cStatus === ConsignmentStatus.CONSIGNING || cStatus === ConsignmentStatus.PENDING;
          });

          if (page === 1) {
            setMyCollections(deduplicateCollections(filteredList));
          } else {
            setMyCollections((prev) => deduplicateCollections([...prev, ...filteredList]));
          }
          setHasMore(list.length >= 10 && res.data.has_more !== false);
          syncConsignmentCoupon(res.data.consignment_coupon);
        } else {
          setError(extractError(res, '获取寄售列表失败'));
          hasError = true;
        }
      }

      if (hasError) {
        callbacksRef.current.onLoadError();
      } else {
        callbacksRef.current.onLoadSuccess();
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : '加载数据失败');
      callbacksRef.current.onLoadError();
    }
  }, [activeTab, page, syncConsignmentCoupon]);

  // 重置列表
  const resetCollections = useCallback(() => {
    setMyCollections([]);
  }, []);

  // 直接设置藏品列表（用于缓存恢复）
  const setCollections = useCallback((collections: MyCollectionItem[]) => {
    setMyCollections(collections);
  }, []);

  // 直接设置 hasMore（用于缓存恢复）
  const setHasMoreState = useCallback((value: boolean) => {
    setHasMore(value);
  }, []);

  // 刷新批量寄售数据
  const refreshBatchConsignableData = useCallback(async () => {
    await loadBatchConsignableList();
  }, [loadBatchConsignableList]);

  return {
    // 数据
    myCollections,
    error,
    hasMore,
    consignmentTicketCount,
    userInfo,
    batchConsignableData,
    // 方法
    loadData,
    loadUserInfo,
    loadBatchConsignableList,
    resetCollections,
    setCollections,
    setHasMoreState,
    refreshBatchConsignableData,
    setBatchConsignableData,
  };
}
