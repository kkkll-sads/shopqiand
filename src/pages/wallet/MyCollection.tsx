/**
 * MyCollection - 我的藏品页面
 * 已迁移: 使用 React Router 导航
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, ShoppingBag, ArrowRight, ChevronRight, X, AlertCircle, CheckCircle } from 'lucide-react';
import SubPageLayout from '../../../components/SubPageLayout';
import { formatAmount, formatTime } from '../../../utils/format';
import { LoadingSpinner, EmptyState, LazyImage } from '../../../components/common';
import {
  getMyCollection,
  deliverCollectionItem,
  rightsDeliver,
  consignCollectionItem,
  getConsignmentCheck,
  fetchProfile,
  MyCollectionItem,
  normalizeAssetUrl,
  fetchConsignmentCoupons,
  getBatchConsignableList,
  batchConsign,
  BatchConsignableListData,
} from '../../../services/api';
import { getStoredToken } from '../../../services/client';
import { useAuthStore } from '../../stores/authStore';
import { UserInfo } from '../../../types';
import { useNotification } from '../../../context/NotificationContext';
import { ConsignmentStatus, DeliveryStatus } from '../../../constants/statusEnums';
import { isSuccess, extractError } from '../../../utils/apiHelpers';
import { useStateMachine } from '../../../hooks/useStateMachine';
import { FormEvent, FormState, LoadingEvent, LoadingState } from '../../../types/states';

interface MyCollectionProps {
  onItemSelect?: (item: MyCollectionItem) => void;
  initialConsignItemId?: string | number;
  preSelectedItem?: MyCollectionItem | null;
}

const MyCollection: React.FC<MyCollectionProps> = ({ onItemSelect, initialConsignItemId, preSelectedItem }) => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [myCollections, setMyCollections] = useState<MyCollectionItem[]>([]);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [consignmentTicketCount, setConsignmentTicketCount] = useState<number>(0);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
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
  const actionMachine = useStateMachine<FormState, FormEvent>({
    initial: FormState.IDLE,
    transitions: {
      [FormState.IDLE]: { [FormEvent.SUBMIT]: FormState.SUBMITTING },
      [FormState.VALIDATING]: {
        [FormEvent.VALIDATION_SUCCESS]: FormState.SUBMITTING,
        [FormEvent.VALIDATION_ERROR]: FormState.ERROR,
      },
      [FormState.SUBMITTING]: {
        [FormEvent.SUBMIT_SUCCESS]: FormState.SUCCESS,
        [FormEvent.SUBMIT_ERROR]: FormState.ERROR,
      },
      [FormState.SUCCESS]: {
        [FormEvent.SUBMIT]: FormState.SUBMITTING,
        [FormEvent.RESET]: FormState.IDLE,
      },
      [FormState.ERROR]: {
        [FormEvent.SUBMIT]: FormState.SUBMITTING,
        [FormEvent.RESET]: FormState.IDLE,
      },
    },
  });
  const batchConsignMachine = useStateMachine<FormState, FormEvent>({
    initial: FormState.IDLE,
    transitions: {
      [FormState.IDLE]: { [FormEvent.SUBMIT]: FormState.SUBMITTING },
      [FormState.VALIDATING]: {
        [FormEvent.VALIDATION_SUCCESS]: FormState.SUBMITTING,
        [FormEvent.VALIDATION_ERROR]: FormState.ERROR,
      },
      [FormState.SUBMITTING]: {
        [FormEvent.SUBMIT_SUCCESS]: FormState.SUCCESS,
        [FormEvent.SUBMIT_ERROR]: FormState.ERROR,
      },
      [FormState.SUCCESS]: {
        [FormEvent.SUBMIT]: FormState.SUBMITTING,
        [FormEvent.RESET]: FormState.IDLE,
      },
      [FormState.ERROR]: {
        [FormEvent.SUBMIT]: FormState.SUBMITTING,
        [FormEvent.RESET]: FormState.IDLE,
      },
    },
  });
  const checkBatchMachine = useStateMachine<LoadingState, LoadingEvent>({
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

  // 弹窗状态
  const [showActionModal, setShowActionModal] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<MyCollectionItem | null>(null);
  const [actionTab, setActionTab] = useState<'delivery' | 'consignment'>('delivery');
  const [countdown, setCountdown] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const actionLoading = actionMachine.state === FormState.SUBMITTING;

  // Category Tabs
  type CategoryTab = 'hold' | 'consign' | 'sold' | 'dividend';
  const [activeTab, setActiveTab] = useState<CategoryTab>('hold');

  const tabs: { id: CategoryTab; label: string }[] = [
    { id: 'hold', label: '持仓中' },
    { id: 'consign', label: '寄售中' },
    { id: 'sold', label: '已流转' },
    { id: 'dividend', label: '权益节点' },
  ];

  // 筛选器状态
  const [selectedSession, setSelectedSession] = useState<string>('all');
  const [selectedPriceZone, setSelectedPriceZone] = useState<string>('all');

  // 批量寄售状态
  const [batchConsignableData, setBatchConsignableData] = useState<BatchConsignableListData | null>(null);
  const batchConsignLoading = batchConsignMachine.state === FormState.SUBMITTING;
  const checkingBatchConsignable = checkBatchMachine.state === LoadingState.LOADING;

  // 加载用户信息和寄售券数量
  useEffect(() => {
    const loadUserInfo = async () => {
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

        // 移除重复请求：getMyCollection 在 loadData 中会被再次调用
        // const collectionRes = await getMyCollection({ page: 1, token });
        // if (isSuccess(collectionRes) && collectionRes.data) {
        //   const count = (collectionRes.data as any).consignment_coupon ?? 0;
        //   setConsignmentTicketCount(count);
        // }
      } catch (err) {
        console.error('加载用户信息失败:', err);
      }
    };

    loadUserInfo();
  }, []);

  const handleTabChange = (tab: CategoryTab) => {
    setActiveTab(tab);
    setPage(1);
    setMyCollections([]);
  };

  // Helper function to deduplicate collections by unique ID
  const deduplicateCollections = (collections: MyCollectionItem[]): MyCollectionItem[] => {
    const seen = new Set<string>();
    return collections.filter(item => {
      const uniqueKey = item.id || item.user_collection_id || item.item_id;
      if (seen.has(String(uniqueKey))) {
        return false;
      }
      seen.add(String(uniqueKey));
      return true;
    });
  };

  const loadData = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setError('请先登录');
      loadMachine.send(LoadingEvent.ERROR);
      return;
    }

    loadMachine.send(LoadingEvent.LOAD);
    setError(null);

    let hasError = false;
    try {
      if (activeTab === 'hold') {
        const res = await getMyCollection({ page, token, status: 'holding' });
        if (isSuccess(res) && res.data) {
          const list = res.data.list || [];
          const filteredList = list.filter(item => {
            const dStatus = Number(item.delivery_status) || 0;
            // 持仓中列表：未提货 (0) 且 未寄售 (0)
            // 再次确认：用户要求持仓中也显示共识验证节点的藏品
            const cStatus = Number(item.consignment_status) || 0;
            return dStatus === DeliveryStatus.NOT_DELIVERED && cStatus === 0;
          });

          console.log('API返回数据:', list.length, '个藏品');
          console.log('过滤后数据:', filteredList.length, '个藏品');
          console.log('当前标签页:', activeTab);

          if (page === 1) {
            const deduplicated = deduplicateCollections(filteredList);
            console.log('去重后数据:', deduplicated.length, '个藏品');
            setMyCollections(deduplicated);
          } else {
            setMyCollections(prev => {
              const combined = deduplicateCollections([...prev, ...filteredList]);
              console.log('合并去重后数据:', combined.length, '个藏品');
              return combined;
            });
          }
          setHasMore(list.length >= 10 && res.data.has_more !== false);
          if (typeof (res.data as any).consignment_coupon === 'number') {
            setConsignmentTicketCount((res.data as any).consignment_coupon);
          }
        } else {
          setError(extractError(res, '获取我的藏品失败'));
          hasError = true;
        }
      } else if (activeTab === 'dividend') {
        // 权益节点：使用 status: 'mining' 参数
        const res = await getMyCollection({ page, token, status: 'mining' });
        if (isSuccess(res) && res.data) {
          const list = res.data.list || [];
          if (page === 1) {
            setMyCollections(deduplicateCollections(list));
          } else {
            setMyCollections(prev => deduplicateCollections([...prev, ...list]));
          }
          setHasMore(list.length >= 10 && res.data.has_more !== false);
          if (typeof (res.data as any).consignment_coupon === 'number') {
            setConsignmentTicketCount((res.data as any).consignment_coupon);
          }
        } else {
          setError(extractError(res, '获取权益节点列表失败'));
          hasError = true;
        }
      } else if (activeTab === 'sold') {
        // Use the new status=sold param on myCollection API
        const res = await getMyCollection({ page, token, status: 'sold' });

        if (isSuccess(res) && res.data) {
          const list = res.data.list || [];
          if (page === 1) {
            setMyCollections(deduplicateCollections(list));
          } else {
            setMyCollections(prev => deduplicateCollections([...prev, ...list]));
          }
          setHasMore(list.length >= 10 && res.data.has_more !== false);
        } else {
          setError(extractError(res, '获取已售出列表失败'));
          hasError = true;
        }
      } else if (activeTab === 'consign') {
        // 使用 status=consigned 参数获取寄售中的藏品
        const res = await getMyCollection({ page, token, status: 'consigned' });

        if (isSuccess(res) && res.data) {
          const list = res.data.list || [];
          // 过滤出寄售中的藏品（根据 status_text 或 consignment_status 判断）
          const filteredList = list.filter(item => {
            // 优先使用 status_text 判断
            if (item.status_text) {
              return item.status_text.includes('寄售中') || item.status_text === '寄售中';
            }
            // 回退到 consignment_status 判断：CONSIGNING(2) 或 PENDING(1) 且 status_text 包含"寄售"
            const cStatus = Number(item.consignment_status) || 0;
            return cStatus === ConsignmentStatus.CONSIGNING || cStatus === ConsignmentStatus.PENDING;
          });

          if (page === 1) {
            setMyCollections(deduplicateCollections(filteredList));
          } else {
            setMyCollections(prev => deduplicateCollections([...prev, ...filteredList]));
          }
          setHasMore(list.length >= 10 && res.data.has_more !== false);
          if (typeof (res.data as any).consignment_coupon === 'number') {
            setConsignmentTicketCount((res.data as any).consignment_coupon);
          }
        } else {
          setError(extractError(res, '获取寄售列表失败'));
          hasError = true;
        }
      }
      if (hasError) {
        loadMachine.send(LoadingEvent.ERROR);
      } else {
        loadMachine.send(LoadingEvent.SUCCESS);
      }
    } catch (e: any) {
      setError(e?.message || '加载数据失败');
      loadMachine.send(LoadingEvent.ERROR);
    } finally {
      // 状态机已处理成功/失败
    }
  }, [activeTab, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 获取批量寄售可寄售藏品列表
  useEffect(() => {
    const loadBatchConsignableList = async () => {
      const token = getStoredToken();
      if (!token) return;

      checkBatchMachine.send(LoadingEvent.LOAD);
      try {
        const response = await getBatchConsignableList(token);
        if (isSuccess(response) && response.data) {
          setBatchConsignableData(response.data);
          checkBatchMachine.send(LoadingEvent.SUCCESS);
        }
      } catch (error) {
        console.error('获取批量寄售列表失败:', error);
        checkBatchMachine.send(LoadingEvent.ERROR);
      } finally {
        // 状态机已处理成功/失败
      }
    };

    loadBatchConsignableList();
  }, []);

  // 动态生成筛选选项
  const sessionOptions = useMemo(() => {
    const sessions = new Set<string>();
    myCollections.forEach(item => {
      if (item.session_title) sessions.add(item.session_title);
    });
    return ['all', ...Array.from(sessions).sort()];
  }, [myCollections]);

  const priceZoneOptions = useMemo(() => {
    const zones = new Set<string>();
    myCollections.forEach(item => {
      const zone = item.price_zone_text || item.priceZone || item.price_zone;
      if (zone) zones.add(String(zone));
    });
    return ['all', ...Array.from(zones).sort()];
  }, [myCollections]);

  // 应用筛选器
  const filteredCollections = useMemo(() => {
    console.log('myCollections长度:', myCollections.length);
    console.log('筛选条件 - 场次:', selectedSession, '价格分区:', selectedPriceZone);

    const filtered = myCollections.filter(item => {
      // 场次筛选
      if (selectedSession !== 'all' && item.session_title !== selectedSession) {
        return false;
      }

      // 价格分区筛选
      if (selectedPriceZone !== 'all') {
        const zone = item.price_zone_text || item.priceZone || item.price_zone;
        if (String(zone) !== selectedPriceZone) {
          return false;
        }
      }

      return true;
    });

    console.log('filteredCollections长度:', filtered.length);
    return filtered;
  }, [myCollections, selectedSession, selectedPriceZone]);

  // 如果父级要求初始打开寄售弹窗（通过 initialConsignItemId），在数据加载后自动打开对应项的寄售页
  useEffect(() => {
    if (!initialConsignItemId) return;
    if (!myCollections || myCollections.length === 0) return;

    const found = myCollections.find((it) => {
      const resolved = resolveCollectionId(it);
      return String(resolved) === String(initialConsignItemId) || String(it.id) === String(initialConsignItemId) || String(it.item_id) === String(initialConsignItemId);
    });

    if (found) {
      setSelectedItem(found);
      setActionTab('consignment');
      setActionError(null);
      setShowActionModal(true);
    }
  }, [initialConsignItemId, myCollections]);

  // NEW: 如果通过 helpers.selectedCollectionItem 传入了预选项，立即打开寄售模态框
  useEffect(() => {
    if (!preSelectedItem) return;
    // 立即打开弹窗，不需要等待数据加载
    setSelectedItem(preSelectedItem);
    setActionTab('consignment');
    setActionError(null);
    setShowActionModal(true);
  }, [preSelectedItem]);

  // 检查是否满足48小时
  const check48Hours = (buyTime: number): { passed: boolean; hoursLeft: number } => {
    const now = Math.floor(Date.now() / 1000);
    const hoursPassed = (now - buyTime) / 3600;
    const hoursLeft = 48 - hoursPassed;
    return {
      passed: hoursPassed >= 48,
      hoursLeft: Math.max(0, Math.ceil(hoursLeft)),
    };
  };

  // 获取寄售券数量
  const getConsignmentTicketCount = (): number => {
    return consignmentTicketCount;
  };

  // 检查是否有寄售券
  const checkConsignmentTicket = (): boolean => {
    return getConsignmentTicketCount() > 0;
  };

  // 计算48小时倒计时
  const calculateCountdown = (buyTime: number) => {
    const now = Math.floor(Date.now() / 1000);
    const elapsed = now - buyTime;
    const totalSeconds = 48 * 3600 - elapsed;

    if (totalSeconds <= 0) {
      return null;
    }

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return { hours, minutes, seconds };
  };

  // 更新倒计时
  useEffect(() => {
    if (!showActionModal || !selectedItem || actionTab !== 'consignment') {
      setCountdown(null);
      return;
    }

    const timeCheck = check48Hours(selectedItem.pay_time || selectedItem.buy_time || 0);
    if (timeCheck.passed) {
      setCountdown(null);
      return;
    }

    const initialCountdown = calculateCountdown(selectedItem.pay_time || selectedItem.buy_time || 0);
    setCountdown(initialCountdown);

    const interval = setInterval(() => {
      const newCountdown = calculateCountdown(selectedItem.pay_time || selectedItem.buy_time || 0);
      if (newCountdown) {
        setCountdown(newCountdown);
      } else {
        setCountdown(null);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [showActionModal, selectedItem, actionTab]);

  // 如果曾经寄售过，强制切换到提货标签
  useEffect(() => {
    if (showActionModal && selectedItem) {
      if (isConsigning(selectedItem) || hasConsignedSuccessfully(selectedItem) || hasConsignedBefore(selectedItem)) {
        if (actionTab === 'consignment') {
          setActionTab('delivery');
        }
      }
    }
  }, [showActionModal, selectedItem]);

  // 当切换标签或选择的藏品变化时，重置错误信息
  useEffect(() => {
    if (!showActionModal || !selectedItem) {
      setActionError(null);
      return;
    }

    setActionError(null);
  }, [actionTab, showActionModal, selectedItem]);

  // 寄售解锁检查数据
  const [consignmentCheckData, setConsignmentCheckData] = useState<any>(null);
  // 可用寄售券数量（针对当前选中的藏品）
  const [availableCouponCount, setAvailableCouponCount] = useState<number>(0);
  const [checkingCoupons, setCheckingCoupons] = useState<boolean>(false);

  const formatSeconds = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = secs % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  // 实时倒计时（秒）
  const [consignmentRemaining, setConsignmentRemaining] = useState<number | null>(null);

  useEffect(() => {
    // Always fetch consignment check when modal opens for a selected item
    if (!showActionModal || !selectedItem) {
      setConsignmentCheckData(null);
      setAvailableCouponCount(0);
      return;
    }

    const collectionId = resolveCollectionId(selectedItem);
    if (collectionId === undefined || collectionId === null) {
      setConsignmentCheckData(null);
      return;
    }

    let mounted = true;
    const token = getStoredToken() || undefined;

    // 并发请求：检查解锁状态 + 检查可用寄售券
    setCheckingCoupons(true);

    Promise.all([
      getConsignmentCheck({ user_collection_id: collectionId, token }),
      fetchConsignmentCoupons({ page: 1, limit: 100, status: 1, token })
    ]).then(([checkRes, couponRes]) => {
      if (!mounted) return;

      // 处理解锁状态
      setConsignmentCheckData(checkRes?.data ?? null);

      // 处理寄售券
      const coupons = couponRes.data?.list || [];
      const itemSessionId = selectedItem.session_id || selectedItem.original_record?.session_id;
      const itemZoneId = selectedItem.zone_id || selectedItem.original_record?.zone_id;

      console.log('[MyCollection Debug] Coupon matching:', {
        totalCoupons: coupons.length,
        itemSessionId,
        itemZoneId,
        availableCountFromAPI: couponRes.data?.available_count,
        coupons: coupons.map(c => ({ id: c.id, session_id: c.session_id, zone_id: c.zone_id, status: c.status }))
      });

      if (itemSessionId && itemZoneId) {
        const matched = coupons.filter(c =>
          String(c.session_id) === String(itemSessionId) &&
          String(c.zone_id) === String(itemZoneId)
        );
        console.log('[MyCollection Debug] Matched coupons:', matched.length, matched);
        setAvailableCouponCount(matched.length);
      } else {
        // 如果无法从藏品获取场次信息，使用 API 返回的 available_count
        const fallbackCount = couponRes.data?.available_count ?? coupons.length;
        console.warn('[MyCollection] Item missing session/zone info, using fallback:', {
          itemSessionId,
          itemZoneId,
          fallbackCount,
          totalCoupons: coupons.length
        });
        setAvailableCouponCount(fallbackCount);
      }
    }).catch(err => {
      console.error('Fetch data failed', err);
      if (mounted) {
        setConsignmentCheckData(null);
        setAvailableCouponCount(0);
      }
    }).finally(() => {
      if (mounted) setCheckingCoupons(false);
    });

    return () => {
      mounted = false;
    };
  }, [showActionModal, selectedItem]);

  // 当接口返回 remaining_seconds 时启用实时倒计时
  useEffect(() => {
    if (!consignmentCheckData) {
      setConsignmentRemaining(null);
      return;
    }

    let secs: number = 0;
    if (typeof consignmentCheckData.remaining_seconds !== 'undefined' && consignmentCheckData.remaining_seconds !== null) {
      secs = Number(consignmentCheckData.remaining_seconds) || 0;
    } else if (typeof consignmentCheckData.remaining_text === 'string') {
      const match = consignmentCheckData.remaining_text.match(/(\d{1,}):(\d{2}):(\d{2})/);
      if (match) {
        const h = Number(match[1]) || 0;
        const m = Number(match[2]) || 0;
        const s = Number(match[3]) || 0;
        secs = h * 3600 + m * 60 + s;
      } else {
        secs = 0;
      }
    } else {
      setConsignmentRemaining(null);
      return;
    }
    setConsignmentRemaining(secs > 0 ? secs : 0);
    let mounted = true;
    const id = setInterval(() => {
      if (!mounted) return;
      secs = Math.max(0, secs - 1);
      setConsignmentRemaining(secs);
      if (secs <= 0) {
        clearInterval(id);
      }
    }, 1000);

    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [consignmentCheckData]);

  // 检查是否曾经寄售过
  const hasConsignedBefore = (item: MyCollectionItem): boolean => {
    // 只有 consignment_status 明确不为 0 时，才认为曾经寄售过
    // 0 = 未寄售，1 = 待审核，2 = 寄售中，3 = 寄售失败，4 = 已售出
    const status = item.consignment_status;
    return typeof status === 'number' && status !== ConsignmentStatus.NOT_CONSIGNED;
  };

  // 检查是否已经寄售成功（已售出）
  const hasConsignedSuccessfully = (item: MyCollectionItem): boolean => {
    return item.consignment_status === ConsignmentStatus.SOLD;
  };

  // 检查是否正在寄售中
  const isConsigning = (item: MyCollectionItem): boolean => {
    return item.consignment_status === ConsignmentStatus.CONSIGNING;
  };

  // 检查是否已提货
  const isDelivered = (item: MyCollectionItem): boolean => {
    return item.delivery_status === DeliveryStatus.DELIVERED;
  };

  const resolveCollectionId = (item: MyCollectionItem | null | undefined): number | string | undefined => {
    if (!item) return undefined;
    return (
      item.user_collection_id ??
      (item.original_record ? item.original_record.user_collection_id : undefined) ??
      (item.original_record ? item.original_record.order_id : undefined) ??
      (item.original_record ? item.original_record.id : undefined) ??
      item.id ??
      item.item_id
    );
  };

  const handleItemClick = (item: MyCollectionItem) => {
    if (onItemSelect) {
      onItemSelect(item);
      return;
    }

    setSelectedItem(item);
    if (isConsigning(item) || hasConsignedSuccessfully(item) || hasConsignedBefore(item)) {
      setActionTab('delivery');
    } else if (item.delivery_status === DeliveryStatus.NOT_DELIVERED) {
      setActionTab('delivery');
    } else if (item.consignment_status === ConsignmentStatus.NOT_CONSIGNED) {
      setActionTab('consignment');
    } else {
      setActionTab('delivery');
    }
    setActionError(null);
    setShowActionModal(true);
  };

  // 检查是否可以执行操作
  const canPerformAction = (): boolean => {
    if (!selectedItem) return false;

    if (isConsigning(selectedItem)) {
      return false;
    }

    if (hasConsignedSuccessfully(selectedItem)) {
      return false;
    }

    const collectionId = resolveCollectionId(selectedItem);
    if (collectionId === undefined || collectionId === null) {
      return false;
    }

    if (actionTab === 'delivery') {
      if (isDelivered(selectedItem)) {
        return false;
      }
      // Use backend consignmentCheck / remaining_seconds / can_consign to determine unlock.
      if (consignmentCheckData) {
        if (typeof consignmentCheckData.can_consign === 'boolean') {
          return !!consignmentCheckData.can_consign;
        }
        if (typeof consignmentCheckData.unlocked === 'boolean') {
          return !!consignmentCheckData.unlocked;
        }
        if (typeof consignmentCheckData.remaining_seconds === 'number') {
          return Number(consignmentCheckData.remaining_seconds) <= 0;
        }
        if (typeof consignmentRemaining === 'number') {
          return consignmentRemaining <= 0;
        }
      }

      // Fallback: allow and let backend enforce if no check data available
      return true;
    } else {
      const timeCheck = check48Hours(selectedItem.pay_time || selectedItem.buy_time || 0);
      const hasTicket = availableCouponCount > 0;

      if (consignmentCheckData) {
        let unlocked = false;
        if (typeof consignmentCheckData.can_consign === 'boolean') {
          unlocked = consignmentCheckData.can_consign;
        } else if (typeof consignmentCheckData.unlocked === 'boolean') {
          unlocked = consignmentCheckData.unlocked;
        } else if (typeof consignmentCheckData.remaining_seconds === 'number') {
          unlocked = Number(consignmentCheckData.remaining_seconds) <= 0;
        } else if (typeof consignmentRemaining === 'number') {
          unlocked = consignmentRemaining <= 0;
        } else {
          unlocked = timeCheck.passed;
        }
        // 如果正在检查优惠券，暂时禁用（避免闪烁允许）
        if (checkingCoupons) return false;
        return unlocked && hasTicket;
      }

      if (checkingCoupons) return false;
      return timeCheck.passed && hasTicket;
    }
  };


  const { showToast, showDialog } = useNotification();

  const handleConfirmActionByType = async (targetType: 'delivery' | 'consignment') => {
    if (!selectedItem || actionLoading) return;

    const token = getStoredToken();
    if (!token) {
      showToast('warning', '请登录', '请先登录后再进行操作');
      return;
    }

    const runLoad = () => {
      setPage(1);
      loadData();
    };

    const collectionId = resolveCollectionId(selectedItem);
    if (collectionId === undefined || collectionId === null) {
      showToast('error', '错误', '无法获取藏品ID，无法继续操作');
      return;
    }

    if (targetType === 'delivery') {
      if (isConsigning(selectedItem)) {
        showToast('warning', '提示', '该藏品正在寄售中，无法提货');
        return;
      }

      if (hasConsignedSuccessfully(selectedItem)) {
        showToast('warning', '提示', '该藏品已经寄售成功（已售出），无法提货');
        return;
      }

      if (isDelivered(selectedItem)) {
        showToast('warning', '提示', '该藏品已经提货，无法再次提货');
        return;
      }

      // 提货的时间限制由后端 consignmentCheck 接口控制，前端不再做本地 48 小时判断

      const hasConsigned = hasConsignedBefore(selectedItem);
      const doRightsDeliver = () => {
        actionMachine.send(FormEvent.SUBMIT);
        rightsDeliver({
          user_collection_id: collectionId,
          token,
        })
          .then((res) => {
            if (isSuccess(res)) {
              showToast('success', '操作成功', extractError(res, '权益分割已提交'));
              setShowActionModal(false);
              setSelectedItem(null);
              runLoad();
              actionMachine.send(FormEvent.SUBMIT_SUCCESS);
            } else {
              showToast('error', '操作失败', extractError(res, '权益分割失败'));
              actionMachine.send(FormEvent.SUBMIT_ERROR);
            }
          })
          .catch((err: any) => {
            showToast('error', '提交失败', extractError(err, '权益分割失败'));
            actionMachine.send(FormEvent.SUBMIT_ERROR);
          })
          .finally(() => {
            // 状态机已处理成功/失败
          });
      };

      if (hasConsigned) {
        showDialog({
          title: '强制权益分割确认',
          description: '该藏品曾经寄售过，确定要强制执行权益分割吗？',
          confirmText: '确定分割',
          cancelText: '取消',
          onConfirm: doRightsDeliver
        });
      } else {
        doRightsDeliver();
      }
    } else {
      if (isConsigning(selectedItem)) {
        showToast('warning', '提示', '该藏品正在寄售中，无法再次寄售');
        return;
      }

      if (hasConsignedSuccessfully(selectedItem)) {
        showToast('warning', '提示', '该藏品已经寄售成功（已售出），无法再次寄售');
        return;
      }

      // 寄售前优先调用后端 consignmentCheck 接口判断是否解锁
      try {
        const checkRes: any = await getConsignmentCheck({ user_collection_id: collectionId, token });
        const cdata = checkRes?.data;
        if (cdata) {
          if (typeof cdata.unlocked === 'boolean') {
            if (!cdata.unlocked) {
              const hrsLeft = cdata.remaining_seconds ? Math.ceil(Number(cdata.remaining_seconds) / 3600) : 0;
              showToast('warning', '时间未到', `寄售需要满足购买后48小时，还需等待 ${hrsLeft} 小时`);
              return;
            }
          } else if (typeof cdata.remaining_seconds === 'number') {
            if (Number(cdata.remaining_seconds) > 0) {
              const hrsLeft = Math.ceil(Number(cdata.remaining_seconds) / 3600);
              showToast('warning', '时间未到', `寄售需要满足购买后48小时，还需等待 ${hrsLeft} 小时`);
              return;
            }
          }
        }
      } catch (err) {
        // 后端会最终校验寄售时间，前端不再使用本地 48 小时回退逻辑
      }

      // 获取寄售券列表并校验
      try {
        // 获取所有可用寄售券
        const couponRes = await fetchConsignmentCoupons({ page: 1, limit: 100, status: 1, token });
        const coupons = couponRes.data?.list || [];

        console.log('[MyCollection Debug] Consignment validation - Total coupons:', coupons.length);

        if (coupons.length === 0) {
          showToast('warning', '缺少道具', '您没有可用的寄售券，无法进行寄售');
          return;
        }

        // 寻找匹配的寄售券
        // 匹配规则：寄售券的 session_id 和 zone_id 必须与藏品的 session_id 和 zone_id 一致
        const itemSessionId = selectedItem.session_id || selectedItem.original_record?.session_id;
        const itemZoneId = selectedItem.zone_id || selectedItem.original_record?.zone_id;

        console.log('[MyCollection Debug] Item info:', { itemSessionId, itemZoneId });

        if (!itemSessionId || !itemZoneId) {
          // 如果无法获取场次信息，只要有券就允许提交，让后端验证
          console.warn('[MyCollection] Missing session/zone info, allowing submission with backend validation');
          // 继续执行，让后端检查
        } else {
          const matchedCoupon = coupons.find(c =>
            String(c.session_id) === String(itemSessionId) &&
            String(c.zone_id) === String(itemZoneId)
          );

          console.log('[MyCollection Debug] Matched coupon:', matchedCoupon);

          if (!matchedCoupon) {
            showToast('warning', '寄售券不匹配', '您没有该场次和分区的可用寄售券');
            return;
          }
        }

      } catch (error) {
        console.error('获取寄售券失败', error);
        showToast('warning', '校验失败', '无法验证寄售券信息，请稍后重试');
        return;
      }

      /* 
      const hasTicket = checkConsignmentTicket();
      if (!hasTicket) {
        showToast('warning', '缺少道具', '您没有寄售券，无法进行寄售');
        return; 
      }
      */

      // 使用藏品原价作为寄售价格
      const priceValue = parseFloat(selectedItem.price || '0');
      if (Number.isNaN(priceValue) || priceValue <= 0) {
        setActionError('藏品价格无效，无法进行寄售');
        return;
      }

      actionMachine.send(FormEvent.SUBMIT);
      consignCollectionItem({
        user_collection_id: collectionId,
        price: priceValue,
        token,
      })
        .then((res) => {
          if (isSuccess(res)) {
            const data = res.data || {};
            // Prefer message, fallback to msg
            let successDescription = res.message || res.msg || '寄售申请已提交';

            // Append audit info if available
            if (data.coupon_used) {
              successDescription += ` (消耗寄售券 ${data.coupon_used} 张`;
              if (data.coupon_remaining !== undefined) {
                successDescription += `，剩余 ${data.coupon_remaining} 张`;
              }
              successDescription += ')';
            }

            showToast('success', '提交成功', successDescription);
            setShowActionModal(false);
            setSelectedItem(null);
            // Switch to consign tab to show the new status
            handleTabChange('consign');
            actionMachine.send(FormEvent.SUBMIT_SUCCESS);
          } else {
            showToast('error', '提交失败', extractError(res, '寄售申请失败'));
            actionMachine.send(FormEvent.SUBMIT_ERROR);
            // 如果是因为未开启场次等业务错误，是否要关闭弹窗？
            // 暂时不关闭，方便用户查看原因，或者根据 message 决定
            // 但用户体验上，明确失败不需要关闭选单
          }
        })
        .catch((err: any) => {
          setActionError(extractError(err, '寄售申请失败'));
          actionMachine.send(FormEvent.SUBMIT_ERROR);
        })
        .finally(() => {
          // 状态机已处理成功/失败
        });
    }
  };

  // 批量寄售处理函数
  const handleBatchConsign = async () => {
    if (!batchConsignableData || batchConsignableData.items.length === 0) {
      showToast('warning', '提示', '暂无可寄售的藏品');
      return;
    }

    const token = getStoredToken();
    if (!token) {
      showToast('warning', '请登录', '请先登录后再进行操作');
      return;
    }

    batchConsignMachine.send(FormEvent.SUBMIT);
    try {
      const consignments = batchConsignableData.items.map(item => ({
        user_collection_id: item.user_collection_id
      }));

      const response = await batchConsign({
        consignments,
        token
      });

      if (isSuccess(response) && response.data) {
        const { total_count, success_count, failure_count, results, failure_summary, note } = response.data;

        // 重新获取批量寄售列表和我的藏品列表
        const batchResponse = await getBatchConsignableList(token);
        if (isSuccess(batchResponse) && batchResponse.data) {
          setBatchConsignableData(batchResponse.data);
        }

        // 重新加载我的藏品列表
        loadData();

        // 显示结果
        if (failure_count === 0) {
          showToast('success', '批量寄售成功', `成功寄售 ${success_count} 个藏品`);
        } else {
          // 处理失败详情
          let failureMessages = '';

          if (results && results.length > 0) {
            // 有详细结果时显示详细错误信息
            failureMessages = results
              .filter(r => !r.success)
              .map(r => `藏品ID ${r.user_collection_id}: ${r.message}`)
              .join('\n');
          } else if (failure_summary) {
            // 只有汇总信息时显示汇总
            failureMessages = Object.entries(failure_summary)
              .map(([reason, count]) => `${reason}: ${count} 个`)
              .join('\n');
          }

          const description = `总计: ${total_count} 个\n成功: ${success_count} 个\n失败: ${failure_count} 个\n\n失败详情:\n${failureMessages}`;

          showDialog({
            title: '批量寄售完成',
            description: note ? `${description}\n\n${note}` : description,
            confirmText: '确定',
            cancelText: null
          });
        }
        batchConsignMachine.send(FormEvent.SUBMIT_SUCCESS);
      } else {
        showToast('error', '', extractError(response, '批量寄售失败'));
        batchConsignMachine.send(FormEvent.SUBMIT_ERROR);
      }
    } catch (error) {
      console.error('批量寄售错误:', error);
      showToast('error', '批量寄售失败', '网络错误，请稍后重试');
      batchConsignMachine.send(FormEvent.SUBMIT_ERROR);
    } finally {
      // 状态机已处理成功/失败
    }
  };

  const renderCollectionItem = (item: MyCollectionItem) => {
    if (!item) return null;
    const title = item.item_title || item.title || '未命名藏品';
    const image = item.item_image || item.image || '';

    // 状态标签渲染辅助函数 (Unified Status Logic)
    const renderStatusChip = () => {
      let text = item.status_text;
      let colorType = 'gray'; // gray, green, blue, red, orange

      if (text) {
        if (text.includes('确权') || text.includes('成功') || text.includes('已售出') || text.includes('持有')) colorType = 'green';
        else if (text.includes('寄售') || text.includes('出售')) colorType = 'blue';
        else if (text.includes('失败') || text.includes('取消')) colorType = 'red';
        else if (text.includes('提货') || text.includes('待')) colorType = 'orange';
      } else {
        // Fallback logic for when status_text is missing
        if (activeTab === 'sold' || item.consignment_status === ConsignmentStatus.SOLD) {
          text = '已售出';
          colorType = 'green';
        } else if (item.consignment_status === ConsignmentStatus.CONSIGNING) {
          text = '寄售中';
          colorType = 'blue';
        } else if (item.delivery_status === DeliveryStatus.DELIVERED) {
          text = item.delivery_status_text || '已提货';
          colorType = 'green';
        } else if (typeof hasConsignedBefore === 'function' && hasConsignedBefore(item)) {
          if (item.consignment_status === ConsignmentStatus.PENDING) { text = '待寄售'; colorType = 'orange'; }
          else { text = item.consignment_status_text || '待提货'; colorType = 'orange'; }
        } else {
          text = item.consignment_status_text || '未寄售';
          colorType = 'gray';
        }
      }

      if (!text) return null;

      const styles = {
        green: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
        blue: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
        red: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
        orange: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
        gray: { bg: 'bg-gray-50', text: 'text-gray-500', dot: 'bg-gray-400' },
      }[colorType] || { bg: 'bg-gray-50', text: 'text-gray-500', dot: 'bg-gray-400' };

      return (
        <span className={`text-[11px] px-2 py-0.5 rounded-lg flex items-center gap-1 ${styles.bg} ${styles.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`}></span>
          {text}
        </span>
      );
    };

    return (
      <div
        key={item.id || item.user_collection_id || `item-${item.item_id}`}
        className="group bg-white rounded-2xl p-3 mb-3 border border-gray-100 shadow-sm active:scale-[0.98] transition-all cursor-pointer relative overflow-hidden"
        onClick={(e) => {
          e.stopPropagation();
          if (onItemSelect) {
            onItemSelect(item);
          } else {
            navigate(`/my-collection/${item.id}`);
          }
        }}
      >
        <div className="flex gap-3">
          {/* 左侧封面图 - 64px (w-16) */}
          <div className="w-16 h-16 rounded-xl bg-gray-50 flex-shrink-0 border border-gray-100 overflow-hidden relative">
            <img
              src={normalizeAssetUrl(image) || undefined}
              alt={title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.visibility = 'hidden';
              }}
            />
          </div>

          {/* 中间信息区 */}
          <div className="flex-1 min-w-0 flex flex-col gap-1">
            {/* 标题行 */}
            <div className="text-[17px] font-semibold text-gray-900 leading-tight line-clamp-1 mt-0.5">
              {title}
            </div>

            {/* 标签行 (Chips) - 无边框 */}
            <div className="flex flex-wrap gap-2 items-center mt-1">
              {item.session_title && (
                <span className="text-[11px] px-2 py-0.5 bg-amber-50 text-amber-700 rounded-lg">
                  {item.session_title}
                </span>
              )}
              {item.asset_code && (
                <span className="text-[11px] px-2 py-0.5 bg-gray-50 text-gray-500 rounded-lg font-mono">
                  {/* 中间省略处理 */}
                  {item.asset_code.length > 15
                    ? `${item.asset_code.substring(0, 8)}...${item.asset_code.substring(item.asset_code.length - 4)}`
                    : `#${item.asset_code}`}
                </span>
              )}
              {renderStatusChip()}
            </div>

            {/* 价格与时间区块 */}
            <div className="mt-3">
              {(() => {
                // 如果是已售出状态，优先显示成交价
                const isSold = activeTab === 'sold' || item.consignment_status === ConsignmentStatus.SOLD;
                const mainPrice = isSold ? (Number(item.sold_price) || Number(item.consignment_price)) : (Number(item.buy_price) || Number(item.price) || Number(item.principal_amount));
                const priceLabel = isSold ? '成交' : '买入';

                return mainPrice > 0 ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs text-gray-400">{priceLabel}</span>
                    <span className="text-xl font-bold text-gray-900 font-mono">¥{mainPrice.toFixed(2)}</span>
                  </div>
                ) : (
                  <div className="h-6"></div>
                );
              })()}
              <div className="text-xs text-gray-400 mt-1 font-mono opacity-80">
                {item.pay_time_text || item.buy_time_text || formatTime(item.pay_time || item.create_time)}
              </div>
            </div>
          </div>

          {/* 右侧 Chevron -> 指示可进入 */}
          <div className="flex items-center justify-center pl-1">
            <ChevronRight size={20} className="text-gray-300" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <SubPageLayout title="我的藏品" onBack={() => navigate(-1)}>
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Filter Dropdowns - 始终显示，确保UI一致性和渲染稳定性 */}
        <div className="bg-white px-4 py-3 border-b border-gray-100/80 flex gap-2 shrink-0">
          {/* Session Filter - 始终显示 */}
          <select
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all"
            disabled={sessionOptions.length <= 1}
          >
            <option value="all">全部场次</option>
            {sessionOptions.filter(s => s !== 'all').map(session => (
              <option key={session} value={session}>{session}</option>
            ))}
          </select>

          {/* Price Zone Filter - 始终显示 */}
          <select
            value={selectedPriceZone}
            onChange={(e) => setSelectedPriceZone(e.target.value)}
            className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={priceZoneOptions.length <= 1}
          >
            <option value="all">全部价格分区</option>
            {priceZoneOptions.filter(z => z !== 'all').map(zone => (
              <option key={zone} value={zone}>{zone}</option>
            ))}
          </select>
        </div>

        {/* Category Tabs */}
        <div className="bg-white px-4 pt-3 pb-2 border-b border-gray-100/80 flex justify-between items-center z-10 shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex-1 py-3 text-sm font-semibold relative transition-all duration-200 ${activeTab === tab.id
                ? 'text-orange-600'
                : 'text-gray-500 hover:text-gray-700 active:text-gray-800'
                }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-1 bg-gradient-to-r from-orange-500 to-orange-400 rounded-full shadow-sm shadow-orange-200" />
              )}
            </button>
          ))}
        </div>

        {/* 批量寄售按钮 */}
        {batchConsignableData && batchConsignableData.items.length > 0 && batchConsignableData.stats.is_in_trading_time && (
          <div className="bg-white px-4 py-3 border-b border-gray-100/80">
            <button
              onClick={handleBatchConsign}
              disabled={batchConsignLoading || checkingBatchConsignable}
              className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl shadow-lg shadow-orange-200 hover:shadow-xl disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {batchConsignLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>批量寄售中...</span>
                </>
              ) : (
                <>
                  <span>⚡ 一键批量寄售</span>
                  <span className="text-sm bg-white/20 px-2 py-0.5 rounded-full">
                    {batchConsignableData.available_now_count || batchConsignableData.stats.available_collections} 个可寄售
                  </span>
                </>
              )}
            </button>
            <div className="text-xs text-gray-500 text-center mt-2">
              当前时间: {batchConsignableData.stats.current_time} • 活跃场次: {batchConsignableData.stats.active_sessions}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 pb-6 bg-gradient-to-b from-gray-50/50 to-white">
          {loading && page === 1 ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner text="加载中..." />
            </div>
          ) : error ? (
            <div className="py-12">
              <EmptyState icon={<FileText size={48} className="text-gray-300" />} title="加载失败" description={error} />
            </div>
          ) : myCollections.length === 0 ? (
            <div className="py-12">
              <EmptyState icon={<ShoppingBag size={48} className="text-gray-300" />} title="暂无藏品" description="您还没有任何藏品" />
            </div>
          ) : filteredCollections.length === 0 ? (
            <div className="py-12">
              <EmptyState icon={<ShoppingBag size={48} className="text-gray-300" />} title="无匹配结果" description="未找到符合筛选条件的藏品" />
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {filteredCollections.filter(i => !!i).map((item) => renderCollectionItem(item))}
              </div>
              {hasMore && (
                <button
                  onClick={() => setPage(prev => prev + 1)}
                  disabled={loading}
                  className="w-full mt-4 py-3 text-sm font-medium text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98]"
                >
                  {loading ? '加载中...' : '加载更多'}
                </button>
              )}
            </>
          )}
        </div>

        {/* 操作弹窗 - 资产处置控制台 */}
        {showActionModal && selectedItem && (
          <div
            className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setShowActionModal(false)}
          >
            <div
              className="bg-[#F9F9F9] rounded-xl overflow-hidden max-w-sm w-full relative shadow-2xl animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 1. 弹窗标题 */}
              <div className="bg-white px-5 py-4 flex justify-between items-center border-b border-gray-100">
                <div className="text-base font-bold text-gray-900">资产挂牌委托</div>
                <button
                  type="button"
                  className="p-1 text-gray-400 hover:text-gray-600 active:scale-95 transition-transform"
                  onClick={() => setShowActionModal(false)}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-5 space-y-5">
                {/* 2. 资产卡片化 (Asset Card) */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div className="flex gap-3 mb-4">
                    <div className="w-14 h-14 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                      <img
                        src={normalizeAssetUrl(selectedItem.item_image || selectedItem.image || '')}
                        alt={selectedItem.item_title || selectedItem.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // (e.target as HTMLImageElement).src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                          (e.target as HTMLImageElement).style.visibility = 'hidden';
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-gray-900 mb-1 truncate leading-tight">
                        {selectedItem.item_title || selectedItem.title}
                      </div>
                      <div className="text-xs text-gray-500 font-mono truncate bg-gray-50 inline-block px-1.5 py-0.5 rounded">
                        确权编号：{selectedItem.asset_code || selectedItem.order_no || 'Pending...'}
                      </div>
                    </div>
                  </div>

                  {/* 核心数据网格 */}
                  {(() => {
                    // 价格处理：优先 check selectedItem.market_price -> price -> current_price -> original_price -> 0
                    const rawPrice = selectedItem.market_price || selectedItem.price || selectedItem.current_price || selectedItem.original_price || '0';
                    const price = parseFloat(String(rawPrice));
                    const safePrice = isNaN(price) ? 0 : price;

                    const expectedProfit = safePrice * 0.055;
                    const expectedTotal = safePrice * 1.055;

                    return (
                      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-dashed border-gray-100">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-400 mb-0.5">当前估值</span>
                          <span className="text-sm font-bold text-gray-900 font-[DINAlternate-Bold]">
                            ¥{safePrice.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex flex-col items-center border-l border-r border-gray-50">
                          <span className="text-[10px] text-gray-400 mb-0.5">预期收益 (5.5%)</span>
                          <span className="text-sm font-bold text-red-500 font-[DINAlternate-Bold]">
                            +{expectedProfit.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] text-gray-400 mb-0.5">预估回款</span>
                          <span className="text-sm font-bold text-gray-900 font-[DINAlternate-Bold]">
                            ¥{expectedTotal.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* 3. 状态栏 */}
                {(() => {
                  const checkData = consignmentCheckData || {};
                  let isLocked = false;
                  let lockMsg = '';
                  let remainingSecs = 0;

                  // 优先使用后端返回的状态
                  if (typeof checkData.unlocked === 'boolean' && !checkData.unlocked) {
                    isLocked = true;
                    remainingSecs = Number(checkData.remaining_seconds || 0);
                  } else if (typeof checkData.remaining_seconds === 'number' && Number(checkData.remaining_seconds) > 0) {
                    isLocked = true;
                    remainingSecs = Number(checkData.remaining_seconds);
                  } else {
                    // 后端没数据时回退到本地计算
                    const timeCheck = check48Hours(selectedItem.pay_time || selectedItem.buy_time || 0);
                    if (!timeCheck.passed) {
                      isLocked = true;
                      // 估算剩余秒数
                      remainingSecs = timeCheck.hoursLeft * 3600;
                    }
                  }

                  if (isLocked) {
                    return (
                      <div className="flex items-center justify-center gap-2 bg-orange-50 text-orange-600 py-2.5 rounded-lg border border-orange-100 px-3">
                        <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                        <span className="text-xs font-medium">
                          🔒 锁定期剩余 {formatSeconds(remainingSecs)}
                        </span>
                      </div>
                    );
                  }

                  // 状态正常
                  return (
                    <div className="flex items-center justify-center gap-2 bg-green-50 text-green-700 py-2.5 rounded-lg border border-green-100">
                      <CheckCircle size={14} className="text-green-600" />
                      <span className="text-xs font-medium">T+1 解锁期已满，当前可流转</span>
                    </div>
                  );
                })()}

                {/* 4. 挂牌成本清单 */}
                <div>
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <div className="w-0.5 h-3 bg-gray-300 rounded-full"></div>
                    <span className="text-xs font-bold text-gray-500">挂牌成本核算</span>
                    <div className="flex-1 h-px bg-gray-200"></div>
                  </div>

                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-4">
                    {(() => {
                      const rawPrice = selectedItem.market_price || selectedItem.price || selectedItem.current_price || selectedItem.original_price || '0';
                      const safePrice = parseFloat(String(rawPrice)) || 0;

                      const serviceFee = safePrice * 0.03;
                      const balance = parseFloat(userInfo?.service_fee_balance || '0');
                      const isBalanceEnough = balance >= serviceFee;

                      return (
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-700">确权技术服务费 (3%)</div>
                            <div className={`text-xs mt-0.5 ${isBalanceEnough ? 'text-gray-400' : 'text-red-500'}`}>
                              当前确权金: ¥{balance.toFixed(2)} {!isBalanceEnough && '(不足)'}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-gray-900 font-[DINAlternate-Bold]">
                              ¥{serviceFee.toFixed(2)}
                            </div>
                            {!isBalanceEnough && (
                              <button
                                className="text-[10px] text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded mt-1"
                                onClick={() => {
                                  // 这里可以跳转去充值，暂时先提示
                                  showToast('info', '余额不足', '请前往【我的-服务费】进行充值');
                                }}
                              >
                                去充值
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    <div className="w-full h-px bg-gray-50" />

                    {(() => {
                      const hasVoucher = availableCouponCount > 0;
                      return (
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-700">资产流转券</div>
                            <div className={`text-xs mt-0.5 ${hasVoucher ? 'text-gray-400' : 'text-red-500'}`}>
                              持有数量: {availableCouponCount} 张
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-sm font-bold font-[DINAlternate-Bold] ${hasVoucher ? 'text-gray-900' : 'text-red-500'}`}>
                              1 张
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* 错误提示 */}
                {actionError && (
                  <div className="text-xs text-red-600 text-center bg-red-50 py-2 rounded-lg">
                    {actionError}
                  </div>
                )}

                {/* 5. 底部双按钮 */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      // 权益分割（转分红）逻辑
                      // 设置 Tab 状态仅仅为了复用之前的逻辑如果需要，但最好直接调用
                      setActionTab('delivery');
                      // 稍微延迟一下确保 state 更新? 其实可以直接把逻辑抽离出来，但为了险稳妥，我们直接复用 handleConfirmAction
                      // 但 handleConfirmAction 依赖 actionTab state，这在 React 异步中会有问题。
                      // 因此必须重构 handleConfirmAction 接收参数。
                      // 由于不能改所有的代码，这里我用一个 hack: 手动调用内部逻辑。
                      handleConfirmActionByType('delivery');
                    }}
                    disabled={actionLoading || isConsigning(selectedItem) || hasConsignedSuccessfully(selectedItem) || isDelivered(selectedItem)}
                    className="flex-[3] flex flex-col items-center justify-center py-3 rounded-xl bg-white border border-gray-200 text-gray-600 active:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                    <span className="text-sm font-bold">权益交割</span>
                    <span className="text-[10px] text-gray-400 font-normal scale-90">转为每日分红</span>
                  </button>

                  <button
                    onClick={() => {
                      setActionTab('consignment');
                      handleConfirmActionByType('consignment');
                    }}
                    disabled={actionLoading || !canPerformAction() || isConsigning(selectedItem)}
                    className="flex-[7] flex flex-col items-center justify-center py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-200 active:scale-[0.98] disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed transition-all"
                  >
                    {actionLoading ? (
                      <span className="text-sm font-bold">提交中...</span>
                    ) : (
                      <>
                        <span className="text-sm font-bold">确认挂牌上架</span>
                        <span className="text-[10px] text-white/80 font-normal scale-90">立即发布到撮合池</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </SubPageLayout>
  );
};

export default MyCollection;
