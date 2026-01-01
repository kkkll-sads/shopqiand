import React, { useState, useEffect } from 'react';
import { FileText, ShoppingBag, ArrowRight, X, AlertCircle, CheckCircle } from 'lucide-react';
import SubPageLayout from '../../components/SubPageLayout';
import { formatAmount, formatTime } from '../../utils/format';
import { LoadingSpinner, EmptyState, LazyImage } from '../../components/common';
import {
  getMyCollection,
  deliverCollectionItem,
  rightsDeliver,
  consignCollectionItem,
  getConsignmentCheck,
  fetchProfile,
  MyCollectionItem,
  AUTH_TOKEN_KEY,
  USER_INFO_KEY,
  normalizeAssetUrl,
  fetchConsignmentCoupons,
  getMyConsignmentList,
} from '../../services/api';

import { UserInfo } from '../../types';
import { useNotification } from '../../context/NotificationContext';
import { ConsignmentStatus, DeliveryStatus } from '../../constants/statusEnums';
import { isSuccess, extractError } from '../../utils/apiHelpers';

interface MyCollectionProps {
  onBack: () => void;
  onItemSelect?: (item: MyCollectionItem) => void;
  initialConsignItemId?: string | number;
  preSelectedItem?: MyCollectionItem | null;
}

const MyCollection: React.FC<MyCollectionProps> = ({ onBack, onItemSelect, initialConsignItemId, preSelectedItem }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [myCollections, setMyCollections] = useState<MyCollectionItem[]>([]);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [consignmentTicketCount, setConsignmentTicketCount] = useState<number>(0);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  // 弹窗状态
  const [showActionModal, setShowActionModal] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<MyCollectionItem | null>(null);
  const [actionTab, setActionTab] = useState<'delivery' | 'consignment'>('delivery');
  const [countdown, setCountdown] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Category Tabs
  type CategoryTab = 'hold' | 'consign' | 'sold' | 'dividend';
  const [activeTab, setActiveTab] = useState<CategoryTab>('hold');

  const tabs: { id: CategoryTab; label: string }[] = [
    { id: 'hold', label: '待售' },
    { id: 'consign', label: '挂单' },
    { id: 'sold', label: '已卖出' },
    { id: 'dividend', label: '已转分红' },
  ];

  // 加载用户信息和寄售券数量
  useEffect(() => {
    const loadUserInfo = async () => {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) return;

      try {
        const cached = localStorage.getItem(USER_INFO_KEY);
        if (cached) {
          try {
            const cachedUserInfo = JSON.parse(cached);
            setUserInfo(cachedUserInfo);
          } catch (e) {
            console.warn('解析本地用户信息失败:', e);
          }
        }

        const response = await fetchProfile(token);
        if (isSuccess(response) && response.data?.userInfo) {
          setUserInfo(response.data.userInfo);
          localStorage.setItem(USER_INFO_KEY, JSON.stringify(response.data.userInfo));
        }

        // 移除重复请求：getMyCollection 在 loadData 中会被再次调用
        // const collectionRes = await getMyCollection({ page: 1, token });
        // if (collectionRes.code === 1 && collectionRes.data) {
        //   const count = (collectionRes.data as any).consignment_coupon ?? 0;
        //   setConsignmentTicketCount(count);
        // }
      } catch (err) {
        console.error('加载用户信息失败:', err);
      }
    };

    loadUserInfo();
  }, []);

  useEffect(() => {
    loadData();
  }, [page, activeTab]);

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

  const handleTabChange = (tab: CategoryTab) => {
    setActiveTab(tab);
    setPage(1);
    setMyCollections([]);
  };

  const loadData = async () => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      setError('请先登录');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (activeTab === 'hold' || activeTab === 'dividend') {
        const res = await getMyCollection({ page, token });
        if (isSuccess(res) && res.data) {
          const list = res.data.list || [];
          const filteredList = list.filter(item => {
            const dStatus = Number(item.delivery_status) || 0;
            if (activeTab === 'hold') {
              // 待售列表：未提货 (0) 且 未寄售 (0)
              // 注意：consignment_status 可能为 undefined/null，视为 0
              const cStatus = Number(item.consignment_status) || 0;
              return dStatus === DeliveryStatus.NOT_DELIVERED && cStatus === 0;
            } else {
              return dStatus === DeliveryStatus.DELIVERED;
            }
          });

          if (page === 1) {
            setMyCollections(filteredList);
          } else {
            setMyCollections(prev => [...prev, ...filteredList]);
          }
          setHasMore(list.length >= 10 && res.data.has_more !== false);
          if (typeof (res.data as any).consignment_coupon === 'number') {
            setConsignmentTicketCount((res.data as any).consignment_coupon);
          }
        } else {
          setError(extractError(res, '获取我的藏品失败'));
        }
      } else if (activeTab === 'sold') {
        // Use the new status=sold param on myCollection API
        const res = await getMyCollection({ page, token, status: 'sold' });

        if (isSuccess(res) && res.data) {
          const list = res.data.list || [];
          if (page === 1) {
            setMyCollections(list);
          } else {
            setMyCollections(prev => [...prev, ...list]);
          }
          setHasMore(list.length >= 10 && res.data.has_more !== false);
        } else {
          setError(extractError(res, '获取已售出列表失败'));
        }
      } else {
        // consign tab (still uses myConsignmentList for specifically Consignment focused view, OR could strictly use myCollection? 
        // User doc says myCollection supports 'consigned'. But existing getMyConsignmentList might have specific fields.
        // Let's keep consign tab as is for now unless user requested change there too.
        // Wait, user doc for myCollection says: status: consigned=寄售中. 
        // But MyCollection.tsx uses `getMyConsignmentList` which maps to `myConsignmentList` endpoint.
        // Let's stick to existing logic for Consign tab to minimize risk, only change Sold tab as requested.

        const res = await getMyConsignmentList({
          page,
          token,
          status: 1 // 1=consigning
        });

        if (isSuccess(res) && res.data) {
          const list = res.data.list || [];
          // Map MyConsignmentItem to MyCollectionItem structure for UI compatibility
          const mappedList: MyCollectionItem[] = list.map(item => ({
            id: item.id,
            item_id: (item as any).item_id || 0,
            user_collection_id: (item as any).user_collection_id || 0,
            item_title: item.item_title,
            item_image: (item as any).image || (item as any).item_image || '',
            price: String(item.consignment_price),
            status_text: item.status_text,
            consignment_status: ConsignmentStatus.CONSIGNING,
            delivery_status: DeliveryStatus.NOT_DELIVERED,
          } as any)) as MyCollectionItem[];

          if (page === 1) {
            setMyCollections(mappedList);
          } else {
            setMyCollections(prev => [...prev, ...mappedList]);
          }
          setHasMore(list.length >= 10 && res.data.has_more !== false);
        } else {
          setError(extractError(res, '获取寄售列表失败'));
        }
      }
    } catch (e: any) {
      setError(e?.message || '加载数据失败');
    } finally {
      setLoading(false);
    }
  };

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
    const token = localStorage.getItem(AUTH_TOKEN_KEY) || undefined;

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

      if (itemSessionId && itemZoneId) {
        const matched = coupons.filter(c =>
          String(c.session_id) === String(itemSessionId) &&
          String(c.zone_id) === String(itemZoneId)
        );
        setAvailableCouponCount(matched.length);
      } else {
        // 如果无法从藏品获取场次信息，默认显示所有可用券，或尝试从 API 获取详情
        // 这里做宽松处理：显示所有券，但在提交时可能会校验失败（如果不匹配）
        // 这样至少能显示出"有券"，避免 UI 显示为 0 误导用户
        setAvailableCouponCount(coupons.length);
        console.warn('[MyCollection] Item missing session/zone info, showing all coupons:', { itemSessionId, itemZoneId, total: coupons.length });
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

  const resolveCollectionId = (item: MyCollectionItem): number | string | undefined => {
    return (
      item.user_collection_id ??
      item.original_record?.user_collection_id ??
      item.original_record?.order_id ??
      item.original_record?.id ??
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

    const token = localStorage.getItem(AUTH_TOKEN_KEY);
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
        setActionLoading(true);
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
            } else {
              showToast('error', '操作失败', extractError(res, '权益分割失败'));
            }
          })
          .catch((err: any) => {
            showToast('error', '提交失败', extractError(err, '权益分割失败'));
          })
          .finally(() => setActionLoading(false));
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

        if (coupons.length === 0) {
          showToast('warning', '缺少道具', '您没有可用的寄售券，无法进行寄售');
          return;
        }

        // 寻找匹配的寄售券
        // 匹配规则：寄售券的 session_id 和 zone_id 必须与藏品的 session_id 和 zone_id 一致
        // 注意：MyCollectionItem 可能没有直接的 session_id/zone_id，需要尝试从 original_record 或直接属性获取
        const itemSessionId = selectedItem.session_id || selectedItem.original_record?.session_id;
        const itemZoneId = selectedItem.zone_id || selectedItem.original_record?.zone_id;

        // 如果藏品缺失场次或分区信息，可能无法精确匹配，这里暂定如果 coupons 有值且无法匹配字段则提示异常或放行(视严格程度)
        // 鉴于业务逻辑严谨性，若缺失信息应提示
        if (!itemSessionId || !itemZoneId) {
          // 尝试宽松匹配或是提示数据异常。假设有了 fetchConsignmentCoupons 就必须匹配
          // 如果旧数据没有 session_id, 暂时只检查数量? 不，需求是"使用新的寄售卷即可逻辑"，暗示需要匹配
          // 但如果前端拿不到 item 的 session_id，就无法匹配。
          // 我们可以仅检查 coupons.length > 0 作为兜底，或者警告。
          // 现阶段代码中 MyCollectionItem 定义里没有 session_id。
          // 假设后端返回的数据里带了。如果不带，逻辑会阻断。
          // 为了稳妥，如果拿不到 itemSessionId，先只判断有没有券。
          const hasAnyCoupon = coupons.length > 0;
          if (!hasAnyCoupon) {
            showToast('warning', '缺少道具', '您没有可用的寄售券');
            return;
          }
        } else {
          const matchedCoupon = coupons.find(c =>
            String(c.session_id) === String(itemSessionId) &&
            String(c.zone_id) === String(itemZoneId)
          );

          if (!matchedCoupon) {
            showToast('warning', '寄售券不匹配', '您没有该场次和分区的可用寄售券');
            return;
          }
        }

      } catch (error) {
        console.error('获取寄售券失败', error);
        // 降级处理：如果不强制校验接口，可以忽略错误；但为了严谨应提示
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

      setActionLoading(true);
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
          } else {
            showToast('error', '提交失败', extractError(res, '寄售申请失败'));
            // 如果是因为未开启场次等业务错误，是否要关闭弹窗？
            // 暂时不关闭，方便用户查看原因，或者根据 message 决定
            // 但用户体验上，明确失败不需要关闭选单
          }
        })
        .catch((err: any) => {
          setActionError(extractError(err, '寄售申请失败'));
        })
        .finally(() => setActionLoading(false));
    }
  };

  const renderCollectionItem = (item: MyCollectionItem) => {
    // 兼容后端返回字段 item_title/item_image
    const title = item.item_title || item.title || '未命名藏品';
    const image = item.item_image || item.image || '';

    return (
      <div
        key={item.id}
        className="bg-white rounded-lg p-4 mb-3 shadow-sm cursor-pointer active:bg-gray-50 transition-colors"
        onClick={() => handleItemClick(item)}
      >
        <div className="flex gap-3">
          <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
            <img
              src={normalizeAssetUrl(image)}
              alt={title}
              className="w-full h-full object-cover"
              onError={(e) => {
                // (e.target as HTMLImageElement).src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                (e.target as HTMLImageElement).style.visibility = 'hidden';
              }}
            />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between mb-1">
              <div className="text-sm font-medium text-gray-800 flex-1">{title}</div>
              <ArrowRight size={16} className="text-gray-400 ml-2 flex-shrink-0" />
            </div>
            {item.order_no && (
              <div className="text-xs text-gray-400 mb-1">订单号: {item.order_no}</div>
            )}
            {item.asset_code && (
              <div className="text-xs text-gray-400 mb-1 truncate" title={item.asset_code}>
                确权编号: {item.asset_code}
              </div>
            )}
            {item.fingerprint && (
              <div className="text-xs text-gray-400 mb-1 truncate" title={item.fingerprint}>
                存证指纹: {item.fingerprint.length > 20 ? `${item.fingerprint.substring(0, 10)}...${item.fingerprint.substring(item.fingerprint.length - 10)}` : item.fingerprint}
              </div>
            )}
            <div className="text-xs text-gray-500 mb-2">购买时间: {item.pay_time_text || item.buy_time_text}</div>
            <div className="text-sm font-bold text-gray-900 mb-2">¥ {item.price}</div>

            <div className="flex gap-2 flex-wrap">
              {/* 优先使用 status_text 字段显示状态 */}
              {item.status_text ? (
                <div className={`text-xs px-2 py-1 rounded-full border ${item.status_text.includes('寄售') || item.status_text.includes('出售')
                  ? 'bg-blue-50 text-blue-600 border-blue-200'
                  : item.status_text.includes('确权') || item.status_text.includes('成功') || item.status_text.includes('已售出')
                    ? 'bg-green-50 text-green-600 border-green-200'
                    : item.status_text.includes('失败') || item.status_text.includes('取消')
                      ? 'bg-red-50 text-red-600 border-red-200'
                      : item.status_text.includes('提货') || item.status_text.includes('待')
                        ? 'bg-orange-50 text-orange-600 border-orange-200'
                        : 'bg-gray-50 text-gray-600 border-gray-200'
                  }`}>
                  {item.status_text}
                </div>
              ) : activeTab === 'sold' || item.consignment_status === ConsignmentStatus.SOLD ? (
                // Specially for Sold Items (from myCollection endpoint)
                // Display sold price, time, and settlement status
                <div className="flex flex-col w-full gap-1 mt-1">
                  <div className="flex justify-between items-center bg-green-50 px-2 py-1.5 rounded-lg border border-green-100">
                    <span className="text-xs font-medium text-green-700">已售出</span>
                    <span className="text-sm font-bold text-green-700 font-[DINAlternate-Bold]">
                      成交 ¥{formatAmount(item.sold_price || item.consignment_price || 0, { prefix: '', thousandSeparator: false })}
                    </span>
                  </div>

                  {item.sold_time && (
                    <div className="flex justify-between text-xs text-gray-400 px-1">
                      <span>成交时间</span>
                      <span>{formatTime(item.sold_time)}</span>
                    </div>
                  )}

                  {/* Settlement Info if available */}
                  {item.settle_status !== undefined && (
                    <div className="flex justify-between text-xs px-1 mt-1 pt-1 border-t border-gray-100 border-dashed">
                      <span className="text-gray-400">结算状态</span>
                      <span className={`${(Number(item.settle_status) === 1 || Number(item.settle_status) === 0) ? 'text-green-600 font-medium' : 'text-orange-500'}`}>
                        {(Number(item.settle_status) === 1 || Number(item.settle_status) === 0) ? '已结算' : '待结算'}
                      </span>
                    </div>
                  )}

                  {/* Show Payout Snapshot if available (Profit) */}
                  {(item.payout_profit_consume || item.payout_profit_withdrawable) ? (
                    <div className="flex justify-between text-xs px-1">
                      <span className="text-gray-400">利润收益</span>
                      <span className="text-red-500 font-medium">
                        +{formatAmount((Number(item.payout_profit_consume) + Number(item.payout_profit_withdrawable)), { prefix: '¥' })}
                      </span>
                    </div>
                  ) : null}
                </div>
              ) : (
                /* 回退到原有的逻辑（如果没有 status_text 字段且不是新版已售出） */
                item.consignment_status === ConsignmentStatus.SOLD ? (
                  <div className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-600 border border-green-200">
                    已售出
                  </div>
                ) : item.consignment_status === ConsignmentStatus.CONSIGNING ? (
                  <div className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                    寄售中
                  </div>
                ) : item.delivery_status === DeliveryStatus.DELIVERED ? (
                  // 已提货：显示提货订单状态（待发货/待收货/已签收）
                  <div className={`text-xs px-2 py-1 rounded-full ${item.delivery_status_text === '待发货'
                    ? 'bg-blue-50 text-blue-600 border border-blue-200'
                    : item.delivery_status_text === '待收货'
                      ? 'bg-yellow-50 text-yellow-600 border border-yellow-200'
                      : item.delivery_status_text === '已签收'
                        ? 'bg-green-50 text-green-600 border border-green-200'
                        : 'bg-green-50 text-green-600 border border-green-200'
                    }`}>
                    {item.delivery_status_text || '已提货'}
                  </div>
                ) : hasConsignedBefore(item) ? (
                  // 待提货：显示"待提货"和"待寄售"标签
                  <>
                    <div className="text-xs px-2 py-1 rounded-full bg-orange-50 text-orange-600 border border-orange-200">
                      待提货
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full ${item.consignment_status === ConsignmentStatus.NOT_CONSIGNED
                      ? 'bg-gray-50 text-gray-600 border border-gray-200'
                      : item.consignment_status === ConsignmentStatus.PENDING
                        ? 'bg-yellow-50 text-yellow-600 border border-yellow-200'
                        : item.consignment_status === ConsignmentStatus.REJECTED
                          ? 'bg-red-50 text-red-600 border border-red-200'
                          : 'bg-green-50 text-green-600 border border-green-200'
                      }`}>
                      {item.consignment_status_text || '待寄售'}
                    </div>
                  </>
                ) : (
                  // 未提货：显示"未提货"和寄售状态
                  <>
                    <div className="text-xs px-2 py-1 rounded-full bg-orange-50 text-orange-600 border border-orange-200">
                      ○ 未提货
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full ${item.consignment_status === ConsignmentStatus.NOT_CONSIGNED
                      ? 'bg-gray-50 text-gray-600 border border-gray-200'
                      : item.consignment_status === ConsignmentStatus.PENDING
                        ? 'bg-yellow-50 text-yellow-600 border border-yellow-200'
                        : item.consignment_status === ConsignmentStatus.REJECTED
                          ? 'bg-red-50 text-red-600 border border-red-200'
                          : 'bg-green-50 text-green-600 border border-green-200'
                      }`}>
                      {item.consignment_status_text || '未寄售'}
                    </div>
                  </>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <SubPageLayout title="我的藏品" onBack={onBack}>
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Category Tabs */}
        <div className="bg-white px-4 pt-2 pb-0 border-b border-gray-100 flex justify-between items-center z-10 shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex-1 py-3 text-sm font-medium relative transition-colors ${activeTab === tab.id ? 'text-orange-600' : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-orange-600 rounded-full" />
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading && page === 1 ? (
            <LoadingSpinner text="加载中..." />
          ) : error ? (
            <EmptyState icon={<FileText size={48} className="text-gray-300" />} title="加载失败" description={error} />
          ) : myCollections.length === 0 ? (
            <EmptyState icon={<ShoppingBag size={48} className="text-gray-300" />} title="暂无藏品" description="您还没有任何藏品" />
          ) : (
            <>
              {myCollections.map(renderCollectionItem)}
              {hasMore && (
                <button
                  onClick={() => setPage(prev => prev + 1)}
                  disabled={loading}
                  className="w-full py-2 text-sm text-blue-600 disabled:opacity-50"
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
