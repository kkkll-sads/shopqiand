
import React, { useState, useEffect } from 'react';
import { Wallet, Receipt, CreditCard, FileText, ShoppingBag, Package, ArrowRight, X, AlertCircle, CheckCircle, Leaf } from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer';
import { LoadingSpinner, EmptyState, LazyImage } from '../../components/common';
import { formatTime, formatAmount } from '../../utils/format';
import {
  getBalanceLog,
  getMyOrderList,
  getMyWithdrawList,
  getMyCollection,
  deliverCollectionItem,
  consignCollectionItem,
  fetchProfile,
  getServiceFeeLog,
  BalanceLogItem,
  RechargeOrderItem,
  WithdrawOrderItem,
  MyCollectionItem,
  ServiceFeeLogItem,
  AUTH_TOKEN_KEY,
  USER_INFO_KEY,
  normalizeAssetUrl,
} from '../../services/api';
import { getIntegralLog, IntegralLogItem } from '../../services/integral';
import { Product, UserInfo } from '../../types';
import { useNotification } from '../../context/NotificationContext';

interface AssetViewProps {
  onBack: () => void;
  onNavigate: (page: string) => void;
  onProductSelect?: (product: Product) => void;
  initialTab?: number; // 初始标签页索引
}

const AssetView: React.FC<AssetViewProps> = ({ onBack, onNavigate, onProductSelect, initialTab = 0 }) => {
  const [activeTab, setActiveTab] = useState<number>(initialTab);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [balanceLogs, setBalanceLogs] = useState<BalanceLogItem[]>([]);
  const [rechargeOrders, setRechargeOrders] = useState<RechargeOrderItem[]>([]);
  const [withdrawOrders, setWithdrawOrders] = useState<WithdrawOrderItem[]>([]);
  const [serviceFeeLogs, setServiceFeeLogs] = useState<ServiceFeeLogItem[]>([]);
  const [integralLogs, setIntegralLogs] = useState<IntegralLogItem[]>([]);
  const [incomeLogs, setIncomeLogs] = useState<BalanceLogItem[]>([]);  // 收益明细
  const [myCollections, setMyCollections] = useState<MyCollectionItem[]>([]);

  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);

  // 弹窗状态
  const [showActionModal, setShowActionModal] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<MyCollectionItem | null>(null);
  const [actionTab, setActionTab] = useState<'delivery' | 'consignment'>('delivery');

  // 用户信息
  const [userInfo, setUserInfo] = useState<UserInfo | null>(() => {
    try {
      const cached = localStorage.getItem(USER_INFO_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.warn('解析本地用户信息失败:', error);
      return null;
    }
  });

  // 寄售券数量
  const [consignmentTicketCount, setConsignmentTicketCount] = useState<number>(0);

  // 48小时倒计时
  const [countdown, setCountdown] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
  // 寄售价格
  const [consignPrice, setConsignPrice] = useState<string>('');
  // 操作错误提示
  const [actionError, setActionError] = useState<string | null>(null);
  // 操作提交状态
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // 检查是否满足48小时
  const check48Hours = (time: number): { passed: boolean; hoursLeft: number } => {
    if (!time) return { passed: true, hoursLeft: 0 };
    const now = Math.floor(Date.now() / 1000);
    const hoursPassed = (now - time) / 3600;
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
  const calculateCountdown = (time: number) => {
    if (!time) return null;
    const now = Math.floor(Date.now() / 1000);
    const elapsed = now - time;
    const totalSeconds = 48 * 3600 - elapsed;

    if (totalSeconds <= 0) {
      return null;
    }

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return { hours, minutes, seconds };
  };

  // 检查是否曾经寄售过
  const hasConsignedBefore = (item: MyCollectionItem): boolean => {
    const status = item.consignment_status;
    return typeof status === 'number' && status !== 0;
  };

  // 检查是否已经寄售成功（已售出）
  const hasConsignedSuccessfully = (item: MyCollectionItem): boolean => {
    return item.consignment_status === 4;
  };

  // 检查是否正在寄售中
  const isConsigning = (item: MyCollectionItem): boolean => {
    return item.consignment_status === 2 || item.consignment_status === 1;
  };

  // 检查是否已提货
  const isDelivered = (item: MyCollectionItem): boolean => {
    return item.delivery_status === 1;
  };

  // 获取藏品ID（兼容不同字段）
  const resolveCollectionId = (item: MyCollectionItem): number | string | undefined => {
    return item.user_collection_id || item.id;
  };

  // 更新倒计时
  useEffect(() => {
    if (!showActionModal || !selectedItem || actionTab !== 'consignment') {
      setCountdown(null);
      return;
    }

    const time = selectedItem.pay_time || selectedItem.buy_time || 0;
    const timeCheck = check48Hours(time);
    if (timeCheck.passed) {
      setCountdown(null);
      return;
    }

    const initialCountdown = calculateCountdown(time);
    setCountdown(initialCountdown);

    const interval = setInterval(() => {
      const newCountdown = calculateCountdown(time);
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

  const handleItemClick = (item: MyCollectionItem) => {
    setSelectedItem(item);
    if (isConsigning(item) || hasConsignedSuccessfully(item) || hasConsignedBefore(item)) {
      setActionTab('delivery');
    } else if (item.delivery_status === 0) {
      setActionTab('delivery');
    } else if (item.consignment_status === 0) {
      setActionTab('consignment');
    } else {
      setActionTab('delivery');
    }
    setActionError(null);
    setShowActionModal(true);
  };

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
      const timeCheck = check48Hours(selectedItem.pay_time || selectedItem.buy_time || 0);
      return timeCheck.passed;
    } else {
      const timeCheck = check48Hours(selectedItem.pay_time || selectedItem.buy_time || 0);
      const hasTicket = checkConsignmentTicket();
      return timeCheck.passed && hasTicket;
    }
  };


  const { showToast, showDialog } = useNotification();

  const handleConfirmAction = () => {
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

    if (actionTab === 'delivery') {
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

      const timeCheck = check48Hours(selectedItem.pay_time || selectedItem.buy_time || 0);
      if (!timeCheck.passed) {
        showToast('warning', '时间未到', `提货需要满足购买后48小时，还需等待 ${timeCheck.hoursLeft} 小时`);
        return;
      }

      const hasConsigned = hasConsignedBefore(selectedItem);
      const doDelivery = () => {
        setActionLoading(true);
        deliverCollectionItem({
          user_collection_id: collectionId,
          address_id: null,
          token,
        })
          .then((res) => {
            showToast('success', '提交成功', res.msg || '提货申请已提交');
            setShowActionModal(false);
            setSelectedItem(null);
            runLoad();
          })
          .catch((err: any) => {
            showToast('error', '提交失败', err?.msg || err?.message || '提货申请失败');
          })
          .finally(() => setActionLoading(false));
      };

      if (hasConsigned) {
        showDialog({
          title: '强制提货确认',
          description: '该藏品曾经寄售过，确定要强制提货吗？',
          confirmText: '确定提货',
          cancelText: '取消',
          onConfirm: doDelivery
        });
      } else {
        doDelivery();
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

      const timeCheck = check48Hours(selectedItem.pay_time || selectedItem.buy_time || 0);
      if (!timeCheck.passed) {
        showToast('warning', '时间未到', `寄售需要满足购买后48小时，还需等待 ${timeCheck.hoursLeft} 小时`);
        return;
      }

      const hasTicket = checkConsignmentTicket();
      if (!hasTicket) {
        showToast('warning', '缺少道具', '您没有寄售券，无法进行寄售');
        return;
      }

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
          showToast('success', '提交成功', res.msg || '寄售申请已提交');
          setShowActionModal(false);
          setSelectedItem(null);
          runLoad();
        })
        .catch((err: any) => {
          const msg = err?.msg || err?.message || '寄售申请失败';
          setActionError(msg);
        })
        .finally(() => setActionLoading(false));
    }
  };

  const tabs = ['专项金明细', '收益明细', '津贴明细', '确权金明细', '消费金明细', '我的藏品'];

  // Reset page when tab changes
  useEffect(() => {
    setPage(1);
    setBalanceLogs([]);
    setRechargeOrders([]);
    setWithdrawOrders([]);
    setServiceFeeLogs([]);
    setIntegralLogs([]);
    setIncomeLogs([]);
    setMyCollections([]);
  }, [activeTab]);

  useEffect(() => {
    loadData();
  }, [activeTab, page]);

  // 加载用户信息和寄售券数量
  useEffect(() => {
    const loadUserInfo = async () => {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) return;

      try {
        // 从本地存储读取用户信息
        const cached = localStorage.getItem(USER_INFO_KEY);
        if (cached) {
          try {
            const cachedUserInfo = JSON.parse(cached);
            setUserInfo(cachedUserInfo);
          } catch (e) {
            console.warn('解析本地用户信息失败:', e);
          }
        }

        // 获取最新的用户信息
        const response = await fetchProfile(token);
        if (response.code === 1 && response.data?.userInfo) {
          setUserInfo(response.data.userInfo);
          localStorage.setItem(USER_INFO_KEY, JSON.stringify(response.data.userInfo));
        }

        // 获取寄售券数量
        const collectionRes = await getMyCollection({ page: 1, limit: 1, token });
        if (collectionRes.code === 1 && collectionRes.data) {
          const count = collectionRes.data.consignment_coupon ?? 0;
          setConsignmentTicketCount(count);
        }
      } catch (err) {
        console.error('加载用户信息失败:', err);
      }
    };

    loadUserInfo();
  }, []);

  const loadData = async () => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      setError('请先登录');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (activeTab === 0) {
        // 余额明细
        const res = await getBalanceLog({ page, limit: 10, token });
        if (res.code === 1 && res.data) {
          if (page === 1) {
            setBalanceLogs(res.data.list || []);
          } else {
            setBalanceLogs(prev => [...prev, ...(res.data?.list || [])]);
          }
          setHasMore((res.data.list?.length || 0) >= 10);
        } else {
          setError(res.msg || '获取余额明细失败');
        }
      } else if (activeTab === 1) {
        // 收益明细 - 使用withdrawable_money类型
        const res = await getBalanceLog({ page, limit: 10, token });
        if (res.code === 1 && res.data) {
          if (page === 1) {
            setIncomeLogs(res.data.list || []);
          } else {
            setIncomeLogs(prev => [...prev, ...(res.data?.list || [])]);
          }
          setHasMore((res.data.list?.length || 0) >= 10);
        } else {
          setError(res.msg || '获取收益明细失败');
        }
      } else if (activeTab === 2) {
        // 拓展明细 (提现记录)
        const res = await getMyWithdrawList({ page, limit: 10, token });
        if (res.code === 1 && res.data) {
          if (page === 1) {
            setWithdrawOrders(res.data.data || []);
          } else {
            setWithdrawOrders(prev => [...prev, ...(res.data?.data || [])]);
          }
          setHasMore(res.data.has_more || false);
        } else {
          setError(res.msg || '获取拓展明细失败');
        }
      } else if (activeTab === 3) {
        // 服务费明细
        const res = await getServiceFeeLog({ page, limit: 10, token });
        if (res.code === 1 && res.data) {
          if (page === 1) {
            setServiceFeeLogs(res.data.list || []);
          } else {
            setServiceFeeLogs(prev => [...prev, ...(res.data?.list || [])]);
          }
          setHasMore((res.data.list?.length || 0) >= 10 && (res.data.current_page || 1) * 10 < (res.data.total || 0));
        } else {
          setError(res.msg || '获取服务费明细失败');
        }
      } else if (activeTab === 4) {
        // 消费金明细
        const res = await getIntegralLog({ limit: 10, token });
        if (res.code === 1 && res.data) {
          // 注意：这个API不支持分页，只返回最近10条
          setIntegralLogs(res.data.list || []);
          setHasMore(false); // 该API不支持分页
        } else {
          setError(res.msg || '获取消费金明细失败');
        }
      } else if (activeTab === 5) {
        // 我的藏品
        const res = await getMyCollection({ page, token });
        if (res.code === 1 && res.data) {
          const list = res.data.list || [];
          if (page === 1) {
            setMyCollections(list);
          } else {
            setMyCollections(prev => [...prev, ...list]);
          }
          setHasMore((list.length || 0) >= 10 && res.data.has_more !== false);
          if (typeof res.data.consignment_coupon === 'number') {
            setConsignmentTicketCount(res.data.consignment_coupon);
          }
        } else {
          setError(res.msg || '获取我的藏品失败');
        }
      }
    } catch (e: any) {
      setError(e?.message || '加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (idx: number) => {
    setActiveTab(idx);
  };

  const formatTime = (timestamp: number | string | null): string => {
    if (!timestamp) return '';
    const date = new Date(typeof timestamp === 'string' ? parseInt(timestamp) * 1000 : timestamp * 1000);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderBalanceLogItem = (item: BalanceLogItem) => (
    <div key={item.id} className="bg-white rounded-lg p-4 mb-3 shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-800 mb-1">{item.remark}</div>
          <div className="text-xs text-gray-500">{formatTime(item.create_time)}</div>
        </div>
        <div className={`text-lg font-bold font-[DINAlternate-Bold,Roboto,sans-serif] ${item.amount >= 0 ? 'text-[#FF6B00]' : 'text-gray-900'}`}>
          {item.amount >= 0 ? '+' : ''}{item.amount.toFixed(2)}
        </div>
      </div>
      <div className="text-xs text-gray-400">
        余额: {item.before_balance.toFixed(2)} → {item.after_balance.toFixed(2)}
      </div>
    </div>
  );

  const renderRechargeOrderItem = (item: RechargeOrderItem) => (
    <div key={item.id} className="bg-white rounded-lg p-4 mb-3 shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-800 mb-1">充值订单</div>
          <div className="text-xs text-gray-500">{item.order_no}</div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-[#FF6B00] font-[DINAlternate-Bold,Roboto,sans-serif]">+{item.amount}</div>
          <div className={`text-xs mt-1 ${item.status === 1 ? 'text-green-600' :
            item.status === 2 ? 'text-red-600' :
              'text-yellow-600'
            }`}>
            {item.status_text}
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          <div>支付方式: {item.payment_type_text}</div>
          <div className="mt-1">创建时间: {item.create_time_text}</div>
          {item.audit_time_text && (
            <div className="mt-1">审核时间: {item.audit_time_text}</div>
          )}
        </div>
      </div>
    </div>
  );

  const renderWithdrawOrderItem = (item: WithdrawOrderItem) => (
    <div key={item.id} className="bg-white rounded-lg p-4 mb-3 shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-800 mb-1">提现申请</div>
          <div className="text-xs text-gray-500">{item.account_type_text}</div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-gray-900 font-[DINAlternate-Bold,Roboto,sans-serif]">-{item.amount}</div>
          <div className={`text-xs mt-1 ${item.status === 1 ? 'text-green-600' :
            item.status === 2 ? 'text-red-600' :
              'text-yellow-600'
            }`}>
            {item.status_text}
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          <div>账户: {item.account_name}</div>
          <div className="mt-1">账号: {item.account_number}</div>
          <div className="mt-1">创建时间: {item.create_time_text}</div>
          {item.audit_time_text && (
            <div className="mt-1">审核时间: {item.audit_time_text}</div>
          )}
          {item.audit_reason && (
            <div className="mt-1 text-red-500">审核原因: {item.audit_reason}</div>
          )}
        </div>
      </div>
    </div>
  );

  const renderServiceFeeLogItem = (item: ServiceFeeLogItem) => (
    <div key={item.id} className="bg-white rounded-lg p-4 mb-3 shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-800 mb-1">{item.remark}</div>
          <div className="text-xs text-gray-500">{formatTime(item.create_time)}</div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-[#FF6B00] font-[DINAlternate-Bold,Roboto,sans-serif]">+{item.amount.toFixed(2)}</div>
        </div>
      </div>
      <div className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-100">
        服务费余额: {item.before_service_fee.toFixed(2)} → {item.after_service_fee.toFixed(2)}
      </div>
    </div>
  );

  const renderIntegralLogItem = (item: IntegralLogItem) => {
    const displayAmount = Math.abs(item.amount);
    const displayBefore = Math.abs(item.before_value);
    const displayAfter = Math.abs(item.after_value);

    return (
      <div key={item.id} className="bg-white rounded-lg p-4 mb-3 shadow-sm">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-800 mb-1">{item.remark || '消费金变动'}</div>
            <div className="text-xs text-gray-500">{formatTime(item.create_time)}</div>
          </div>
          <div className="text-right">
            <div className={`text-lg font-bold font-[DINAlternate-Bold,Roboto,sans-serif] ${item.amount >= 0 ? 'text-[#FF6B00]' : 'text-gray-900'}`}>
              {item.amount >= 0 ? '+' : ''}{displayAmount.toFixed(0)}
            </div>
          </div>
        </div>
        <div className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-100">
          消费金余额: {displayBefore.toFixed(0)} → {displayAfter.toFixed(0)}
        </div>
      </div>
    );
  };

  // ... (keeping other functions)

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
              src={normalizeAssetUrl(image) || undefined}
              alt={title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150';
              }}
            />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between mb-1">
              <div className="text-sm font-medium text-gray-800 flex-1">{title}</div>
              <ArrowRight size={16} className="text-gray-400 ml-2 flex-shrink-0" />
            </div>
            <div className="text-xs text-gray-500 mb-2">购买时间: {item.pay_time_text || item.buy_time_text}</div>
            <div className="text-sm font-bold text-gray-900 mb-2">¥ {item.price}</div>

            <div className="flex gap-2 flex-wrap">
              {/* 如果已售出，只显示"已售出"标签 */}
              {item.consignment_status === 4 ? (
                <div className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-600 border border-green-200">
                  已售出
                </div>
              ) : item.consignment_status === 2 ? (
                /* 如果正在寄售中，只显示"寄售中"标签 */
                <div className="text-xs px-2 py-1 rounded-full bg-orange-50 text-orange-600 border border-orange-200">
                  寄售中
                </div>
              ) : item.delivery_status === 1 ? (
                /* 如果已提货且未寄售，只显示"已提货"标签 */
                <div className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-600 border border-green-200">
                  ✓ 已提货
                </div>
              ) : hasConsignedBefore(item) ? (
                /* 如果曾经寄售过（需要强制提货），只显示"待提货"标签 */
                <div className="text-xs px-2 py-1 rounded-full bg-orange-50 text-orange-600 border border-orange-200">
                  待提货
                </div>
              ) : (
                /* 未提货且未寄售过，显示提货状态和寄售状态 */
                <>
                  <div className="text-xs px-2 py-1 rounded-full bg-orange-50 text-orange-600 border border-orange-200">
                    ○ 未提货
                  </div>
                  <div className={`text-xs px-2 py-1 rounded-full ${item.consignment_status === 0
                    ? 'bg-gray-50 text-gray-600 border border-gray-200'
                    : item.consignment_status === 1
                      ? 'bg-yellow-50 text-yellow-600 border border-yellow-200'
                      : item.consignment_status === 3
                        ? 'bg-red-50 text-red-600 border border-red-200'
                        : 'bg-green-50 text-green-600 border border-green-200'
                    }`}>
                    {item.consignment_status_text || '未寄售'}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (loading && page === 1) {
      return <LoadingSpinner text="加载中..." />;
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-red-400">
          <div className="w-16 h-16 mb-4 border-2 border-red-200 rounded-lg flex items-center justify-center">
            <FileText size={32} className="opacity-50" />
          </div>
          <span className="text-xs">{error}</span>
        </div>
      );
    }

    if (activeTab === 0) {
      // 余额明细
      if (balanceLogs.length === 0) {
        return (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <div className="w-16 h-16 mb-4 border-2 border-gray-200 rounded-lg flex items-center justify-center">
              <FileText size={32} className="opacity-50" />
            </div>
            <span className="text-xs">暂无数据</span>
          </div>
        );
      }
      return (
        <div>
          {balanceLogs.map(renderBalanceLogItem)}
          {hasMore && (
            <button
              onClick={() => setPage(prev => prev + 1)}
              disabled={loading}
              className="w-full py-2 text-sm text-orange-600 disabled:opacity-50"
            >
              {loading ? '加载中...' : '加载更多'}
            </button>
          )}
        </div>
      );
    } else if (activeTab === 1) {
      // 收益明细
      if (incomeLogs.length === 0) {
        return (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <div className="w-16 h-16 mb-4 border-2 border-gray-200 rounded-lg flex items-center justify-center">
              <FileText size={32} className="opacity-50" />
            </div>
            <span className="text-xs">暂无数据</span>
          </div>
        );
      }
      return (
        <div>
          {incomeLogs.map(renderBalanceLogItem)}
          {hasMore && (
            <button
              onClick={() => setPage(prev => prev + 1)}
              disabled={loading}
              className="w-full py-2 text-sm text-orange-600 disabled:opacity-50"
            >
              {loading ? '加载中...' : '加载更多'}
            </button>
          )}
        </div>
      );
    } else if (activeTab === 2) {
      // 拓展明细
      if (withdrawOrders.length === 0) {
        return (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <div className="w-16 h-16 mb-4 border-2 border-gray-200 rounded-lg flex items-center justify-center">
              <FileText size={32} className="opacity-50" />
            </div>
            <span className="text-xs">暂无数据</span>
          </div>
        );
      }
      return (
        <div>
          {withdrawOrders.map(renderWithdrawOrderItem)}
          {hasMore && (
            <button
              onClick={() => setPage(prev => prev + 1)}
              disabled={loading}
              className="w-full py-2 text-sm text-orange-600 disabled:opacity-50"
            >
              {loading ? '加载中...' : '加载更多'}
            </button>
          )}
        </div>
      );
    } else if (activeTab === 3) {
      // 服务费明细
      if (serviceFeeLogs.length === 0) {
        return (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <div className="w-16 h-16 mb-4 border-2 border-gray-200 rounded-lg flex items-center justify-center">
              <FileText size={32} className="opacity-50" />
            </div>
            <span className="text-xs">暂无数据</span>
          </div>
        );
      }
      return (
        <div>
          {serviceFeeLogs.map(renderServiceFeeLogItem)}
          {hasMore && (
            <button
              onClick={() => setPage(prev => prev + 1)}
              disabled={loading}
              className="w-full py-2 text-sm text-orange-600 disabled:opacity-50"
            >
              {loading ? '加载中...' : '加载更多'}
            </button>
          )}
        </div>
      );
    } else if (activeTab === 4) {
      // 消费金明细
      if (integralLogs.length === 0) {
        return (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <div className="w-16 h-16 mb-4 border-2 border-gray-200 rounded-lg flex items-center justify-center">
              <FileText size={32} className="opacity-50" />
            </div>
            <span className="text-xs">暂无数据</span>
          </div>
        );
      }
      return (
        <div>
          {integralLogs.map(renderIntegralLogItem)}
        </div>
      );
    } else {
      // 我的藏品（activeTab === 5）
      if (myCollections.length === 0) {
        return (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <div className="w-16 h-16 mb-4 border-2 border-gray-200 rounded-lg flex items-center justify-center">
              <ShoppingBag size={32} className="opacity-50" />
            </div>
            <span className="text-xs">暂无藏品</span>
          </div>
        );
      }
      return (
        <div>
          {myCollections.map(renderCollectionItem)}
          {hasMore && (
            <button
              onClick={() => setPage(prev => prev + 1)}
              disabled={loading}
              className="w-full py-2 text-sm text-orange-600 disabled:opacity-50"
            >
              {loading ? '加载中...' : '加载更多'}
            </button>
          )}
        </div>
      );
    }
  };
  return (
    <PageContainer
      title="数字资产总权益"
      onBack={onBack}
      rightAction={
        <button
          onClick={() => onNavigate('asset-history')}
          className="text-sm text-orange-600"
        >
          历史记录
        </button>
      }
    >
      <div className="p-2">
        {/* Asset Card - New 1+N Layout */}
        <div className="relative rounded-3xl shadow-xl mb-3 overflow-hidden text-white font-sans">
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#FF884D] to-[#FF5500] z-0">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-300 opacity-20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4"></div>
          </div>

          <div className="relative z-10 p-4">
            {/* Part 1: Core Asset (Supply Chain Special Fund) */}
            <div className="mb-6 text-center">
              <div className="flex items-center justify-center gap-1 opacity-90 text-sm font-medium mb-1">
                供应链专项金 (元)
              </div>
              <div className="text-4xl font-[DINAlternate-Bold,Roboto,sans-serif] font-bold tracking-tight drop-shadow-sm">
                {formatAmount(userInfo?.money)}
              </div>
            </div>

            {/* Divider */}
            <div className="w-full h-px bg-white/20 mb-5"></div>

            {/* Part 2: Liquidity Assets (Grid) */}
            <div className="grid grid-cols-3 gap-4 items-start relative">
              {/* Grid Divider Lines - Vertical */}
              <div className="absolute left-1/3 top-2 bottom-2 w-px bg-white/10"></div>
              <div className="absolute right-1/3 top-2 bottom-2 w-px bg-white/10"></div>

              {/* Dispatchable Income */}
              <div className="text-center">
                <div className="text-xs text-white/80 mb-1">可调度收益</div>
                <div className="text-lg font-bold font-[DINAlternate-Bold,Roboto,sans-serif]">
                  {formatAmount(userInfo?.withdrawable_money)}
                </div>
              </div>

              {/* Green Hashrate */}
              <div className="text-center" onClick={() => onNavigate('wallet:hashrate_exchange')}>
                <div className="text-xs text-white/80 mb-1 flex items-center justify-center gap-1">
                  绿色算力 <ArrowRight size={10} className="opacity-70" />
                </div>
                <div className="text-lg font-bold font-[DINAlternate-Bold,Roboto,sans-serif] text-[#E0F2F1] drop-shadow-[0_0_8px_rgba(0,255,0,0.3)]">
                  {userInfo?.green_power || 0} <span className="text-xs font-normal opacity-70">GHs</span>
                </div>
              </div>

              {/* Consumption Fund */}
              <div className="text-center">
                <div className="text-xs text-white/80 mb-1">消费金</div>
                <div className="text-lg font-bold font-[DINAlternate-Bold,Roboto,sans-serif]">
                  {userInfo?.score ?? 0}
                </div>
              </div>
            </div>

            {/* Footer: Minimized Service Fee */}
            <div className="mt-3 pt-2 flex justify-between text-xs text-white/95 border-t border-white/20 px-1 font-medium tracking-wide">
              <span>确权金: ¥{formatAmount(userInfo?.service_fee_balance)}</span>
              <span>待激活: ¥{formatAmount(userInfo?.pending_service_fee || 0)}</span>
            </div>
          </div>
        </div>

        {/* Actions - Capsule Design */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: '申购专项金', icon: Wallet, page: 'asset:balance-recharge', color: 'text-orange-600' },
            { label: '收益提现', icon: Receipt, page: 'asset:balance-withdraw', color: 'text-orange-600' },
            { label: '算力补充', icon: Leaf, page: 'wallet:hashrate_exchange', color: 'text-green-600' },
            { label: '确权金划转', icon: CreditCard, page: 'asset:service-recharge', color: 'text-purple-600' }
          ].map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onNavigate(item.page)}
              className="flex flex-col items-center group active:scale-95 transition-transform"
            >
              <div className="w-full aspect-[4/3] bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center mb-1.5 relative overflow-hidden group-hover:shadow-md transition-shadow">
                <div className={`mb-1 ${item.color}`}>
                  <item.icon size={22} />
                </div>
              </div>
              <span className="text-[11px] font-medium text-gray-600 leading-tight text-center">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Tabs - 可左右滑动 */}
        <div className="overflow-x-auto scrollbar-hide mb-4">
          <div className="flex gap-2 p-1 bg-gray-50 rounded-xl inline-flex min-w-full">
            {tabs.map((tab, idx) => (
              <button
                key={idx}
                onClick={() => handleTabChange(idx)}
                className={`
                  flex-shrink-0 px-4 py-2.5 text-xs font-medium rounded-lg 
                  transition-all duration-300 whitespace-nowrap
                  ${idx === activeTab
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-200 scale-105 border border-orange-400'
                    : 'bg-white text-gray-600 hover:text-orange-500 hover:bg-orange-50 border border-transparent'
                  }
                `}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {renderContent()}
      </div>

      {/* 操作弹窗 */}
      {showActionModal && selectedItem && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setShowActionModal(false)}
        >
          <div
            className="bg-white rounded-xl p-6 max-w-sm w-full relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 关闭按钮 */}
            <button
              type="button"
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600"
              onClick={() => setShowActionModal(false)}
            >
              <X size={20} />
            </button>

            {/* 藏品信息 */}
            <div className="flex gap-3 mb-4">
              <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={normalizeAssetUrl(selectedItem.image) || undefined}
                  alt={selectedItem.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150';
                  }}
                />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-800 mb-1">{selectedItem.title}</div>
                <div className="text-xs text-gray-500">购买时间: {selectedItem.pay_time_text || selectedItem.buy_time_text}</div>
                <div className="text-sm font-bold text-gray-900 mt-1">¥ {selectedItem.price}</div>
              </div>
            </div>

            {/* 标签切换 */}
            {(() => {
              // 如果正在寄售中、已寄售成功、已提货、或曾经寄售过，不显示任何标签
              if (isConsigning(selectedItem) ||
                hasConsignedSuccessfully(selectedItem) ||
                isDelivered(selectedItem) ||
                hasConsignedBefore(selectedItem)) {
                return null;
              }

              // 显示提货和寄售两个标签
              return (
                <div className="flex bg-gray-100 p-1 rounded-lg mb-4">
                  <button
                    onClick={() => setActionTab('delivery')}
                    className={`flex-1 py-2 text-xs rounded-md transition-colors ${actionTab === 'delivery'
                      ? 'bg-white text-orange-600 font-medium shadow-sm'
                      : 'text-gray-600'
                      }`}
                  >
                    提货
                  </button>
                  <button
                    onClick={() => setActionTab('consignment')}
                    className={`flex-1 py-2 text-xs rounded-md transition-colors ${actionTab === 'consignment'
                      ? 'bg-white text-orange-600 font-medium shadow-sm'
                      : 'text-gray-600'
                      }`}
                  >
                    寄售
                  </button>
                </div>
              );
            })()}

            {/* 检查信息显示 */}
            <div className="space-y-3 mb-4">
              {actionTab === 'delivery' ? (
                <>
                  {/* 寄售中检查（优先级最高） */}
                  {isConsigning(selectedItem) && (
                    <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                      <AlertCircle size={16} />
                      <span>该藏品正在寄售中，无法提货</span>
                    </div>
                  )}

                  {/* 已寄售成功检查 */}
                  {!isConsigning(selectedItem) && hasConsignedSuccessfully(selectedItem) && (
                    <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                      <AlertCircle size={16} />
                      <span>该藏品已经寄售成功（已售出），无法提货</span>
                    </div>
                  )}

                  {/* 已提货检查 */}
                  {!isConsigning(selectedItem) && !hasConsignedSuccessfully(selectedItem) && isDelivered(selectedItem) && (
                    <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                      <AlertCircle size={16} />
                      <span>该藏品已经提货，无法再次提货</span>
                    </div>
                  )}

                  {/* 48小时检查 */}
                  {!isConsigning(selectedItem) && !hasConsignedSuccessfully(selectedItem) && !isDelivered(selectedItem) && (() => {
                    const timeCheck = check48Hours(selectedItem.pay_time || selectedItem.buy_time || 0);
                    return timeCheck.passed ? (
                      <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                        <CheckCircle size={16} />
                        <span>已满足48小时提货条件</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
                        <AlertCircle size={16} />
                        <span>还需等待 {timeCheck.hoursLeft} 小时才能提货</span>
                      </div>
                    );
                  })()}

                  {/* 寄售历史检查 */}
                  {!isConsigning(selectedItem) && !hasConsignedSuccessfully(selectedItem) && !isDelivered(selectedItem) && hasConsignedBefore(selectedItem) && (
                    <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                      <AlertCircle size={16} />
                      <span>该藏品曾经寄售过，将执行强制提货</span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* 寄售中检查（优先级最高） */}
                  {isConsigning(selectedItem) && (
                    <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                      <AlertCircle size={16} />
                      <span>该藏品正在寄售中，无法再次寄售</span>
                    </div>
                  )}

                  {/* 已寄售成功检查 */}
                  {!isConsigning(selectedItem) && hasConsignedSuccessfully(selectedItem) && (
                    <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                      <AlertCircle size={16} />
                      <span>该藏品已经寄售成功（已售出），无法再次寄售</span>
                    </div>
                  )}

                  {/* 48小时倒计时 */}
                  {!isConsigning(selectedItem) && !hasConsignedSuccessfully(selectedItem) && (() => {
                    const timeCheck = check48Hours(selectedItem.pay_time || selectedItem.buy_time || 0);
                    if (timeCheck.passed) {
                      return (
                        <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                          <CheckCircle size={16} />
                          <span>已满足48小时寄售条件</span>
                        </div>
                      );
                    } else {
                      return (
                        <div className="bg-orange-50 px-3 py-2 rounded-lg">
                          <div className="flex items-center gap-2 text-xs text-orange-600 mb-1">
                            <AlertCircle size={16} />
                            <span>距离可寄售时间还有：</span>
                          </div>
                          {countdown ? (
                            <div className="text-sm font-bold text-orange-700 text-center">
                              {String(countdown.hours).padStart(2, '0')}:
                              {String(countdown.minutes).padStart(2, '0')}:
                              {String(countdown.seconds).padStart(2, '0')}
                            </div>
                          ) : (
                            <div className="text-xs text-orange-600 text-center">
                              计算中...
                            </div>
                          )}
                        </div>
                      );
                    }
                  })()}

                  {/* 寄售券数量显示 */}
                  {!isConsigning(selectedItem) && !hasConsignedSuccessfully(selectedItem) && (
                    <div className="bg-orange-50 px-3 py-2 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-orange-600">
                          <ShoppingBag size={16} />
                          <span>我的寄售券：</span>
                        </div>
                        <div className="text-sm font-bold text-orange-700">
                          {getConsignmentTicketCount()} 张
                        </div>
                      </div>
                      {getConsignmentTicketCount() === 0 && (
                        <div className="text-xs text-red-600 mt-1">
                          您没有寄售券，无法进行寄售
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>


            {actionError && (
              <div className="text-xs text-red-600 mb-2">{actionError}</div>
            )}

            {/* 确认按钮 */}
            <button
              onClick={handleConfirmAction}
              disabled={actionLoading || !canPerformAction()}
              className={`w-full py-3 rounded-lg text-sm font-medium transition-colors ${!actionLoading && canPerformAction()
                ? actionTab === 'delivery'
                  ? 'bg-orange-600 text-white active:bg-orange-700'
                  : 'bg-orange-600 text-white active:bg-orange-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
            >
              {actionLoading
                ? '提交中...'
                : actionTab === 'delivery'
                  ? '确认提货'
                  : '确认寄售'}
            </button>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export default AssetView;
