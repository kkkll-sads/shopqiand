import React, { useState, useEffect } from 'react';
import { MessageSquare, FileText, Bell, CheckCircle, AlertCircle, Info, Package, Truck, Wallet, Receipt } from 'lucide-react';
import SubPageLayout from '../../components/SubPageLayout';
import { LoadingSpinner, EmptyState } from '../../components/common';
import { formatDateShort } from '../../utils/format';
import {
  fetchAnnouncements,
  AnnouncementItem,
  getMyOrderList,
  getMyWithdrawList,
  fetchPendingPayOrders,
  fetchPendingShipOrders,
  fetchPendingConfirmOrders,
  RechargeOrderItem,
  WithdrawOrderItem,
  ShopOrderItem,
} from '../../services/api';
import { AUTH_TOKEN_KEY, STORAGE_KEYS } from '../../constants/storageKeys';
import { Route } from '../../router/routes';
// ✅ 引入统一 API 处理工具
import { extractData } from '../../utils/apiHelpers';
// ✅ 引入枚举常量替换魔法数字
import { RechargeOrderStatus, WithdrawOrderStatus } from '../../constants/statusEnums';

interface MessageCenterProps {
  onBack: () => void;
  onNavigate: (route: Route) => void;
}

interface MessageItem {
  id: string;
  type: 'system' | 'order' | 'activity' | 'notice' | 'recharge' | 'withdraw' | 'shop_order';
  title: string;
  content: string;
  time: string;
  timestamp: number; // 用于排序
  isRead: boolean;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  sourceId?: string | number; // 原始数据ID，用于跳转
}

const MessageCenter: React.FC<MessageCenterProps> = ({ onBack, onNavigate }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

  // 缓存键
  const CACHE_KEY = 'message_center_cache';
  const CACHE_TIMESTAMP_KEY = 'message_center_cache_timestamp';
  const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存有效期

  // 从本地存储读取已读消息ID列表
  const getReadMessageIds = (): string[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.READ_MESSAGE_IDS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  // 保存已读消息ID到本地存储
  const saveReadMessageIds = (ids: string[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.READ_MESSAGE_IDS_KEY, JSON.stringify(ids));
    } catch {
      // 忽略存储错误
    }
  };

  // Icon映射表
  const iconMap: Record<string, React.ElementType> = {
    AlertCircle,
    Info,
    Wallet,
    Receipt,
    Package,
    CheckCircle,
    Truck,
  };

  // 从缓存读取消息
  const getCachedMessages = (): MessageItem[] | null => {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      const timestamp = sessionStorage.getItem(CACHE_TIMESTAMP_KEY);

      if (cached && timestamp) {
        const cacheAge = Date.now() - parseInt(timestamp);
        if (cacheAge < CACHE_DURATION) {
          const parsed = JSON.parse(cached);
          // 恢复icon组件
          return parsed.map((msg: any) => ({
            ...msg,
            icon: iconMap[msg.iconName] || Info,
          }));
        }
      }
    } catch {
      // 缓存读取失败，返回null
    }
    return null;
  };

  // 保存消息到缓存
  const setCachedMessages = (msgs: MessageItem[]) => {
    try {
      // 将icon组件转换为字符串名称以便序列化
      const serializable = msgs.map(msg => {
        const iconName = Object.keys(iconMap).find(key => iconMap[key] === msg.icon) || 'Info';
        return {
          ...msg,
          iconName,
          icon: undefined, // 移除不可序列化的函数
        };
      });
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(serializable));
      sessionStorage.setItem(CACHE_TIMESTAMP_KEY, String(Date.now()));
    } catch {
      // 忽略缓存错误
    }
  };

  // 清除缓存
  const clearCache = () => {
    try {
      sessionStorage.removeItem(CACHE_KEY);
      sessionStorage.removeItem(CACHE_TIMESTAMP_KEY);
    } catch {
      // 忽略错误
    }
  };

  useEffect(() => {
    const loadData = async () => {
      // 先检查缓存
      // 先检查缓存
      const cachedMessages = getCachedMessages();
      if (cachedMessages) {
        console.log('[MessageCenter] 使用缓存数据');

        // 即使使用缓存，也要同步最新的已读状态
        const readMsgIds = getReadMessageIds();

        // 读取全局的新闻已读状态
        let newsReadIds: string[] = [];
        try {
          const storedNewsReadIds = localStorage.getItem(STORAGE_KEYS.READ_NEWS_IDS_KEY);
          newsReadIds = storedNewsReadIds ? JSON.parse(storedNewsReadIds) : [];
        } catch { }

        const syncedMessages = cachedMessages.map(msg => {
          let isRead = msg.isRead;

          // 检查普通消息已读
          if (readMsgIds.includes(msg.id)) {
            isRead = true;
          }

          // 检查新闻/公告已读
          if ((msg.type === 'notice' || msg.type === 'activity') && msg.sourceId) {
            if (newsReadIds.includes(String(msg.sourceId))) {
              isRead = true;
            }
          }

          return { ...msg, isRead };
        });

        setMessages(syncedMessages);
        setLoading(false);
        return;
      }

      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) {
        setError('请先登录');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const readIds = getReadMessageIds();
        const allMessages: MessageItem[] = [];

        // 1. 加载公告和动态
        try {
          const [announcementRes, dynamicRes] = await Promise.all([
            fetchAnnouncements({ page: 1, limit: 10, type: 'normal' }),
            fetchAnnouncements({ page: 1, limit: 10, type: 'important' }),
          ]);

          // 读取全局的新闻已读状态
          const storedNewsReadIds = localStorage.getItem(STORAGE_KEYS.READ_NEWS_IDS_KEY);
          const newsReadIds: string[] = storedNewsReadIds ? JSON.parse(storedNewsReadIds) : [];

          // 处理平台公告
          // ✅ 使用统一判断
          const announcementData = extractData(announcementRes) as any;
          const announcementList = announcementData?.data || announcementData?.list || [];
          if (announcementList.length > 0) {
            announcementList.forEach((item: AnnouncementItem) => {
              const id = `announcement-${item.id}`;
              const timestamp = item.createtime ? new Date(item.createtime).getTime() : Date.now();
              // 优先使用全局的新闻已读状态判断
              const isRead = newsReadIds.includes(String(item.id));

              allMessages.push({
                id,
                type: 'notice',
                title: '平台公告',
                content: item.title || '',
                time: item.createtime || '',
                timestamp,
                isRead: isRead,
                icon: AlertCircle,
                color: 'text-red-600',
                bgColor: 'bg-red-50',
                sourceId: item.id,
              });
            });
          }

          // 处理平台动态
          // ✅ 使用统一判断
          const dynamicData = extractData(dynamicRes) as any;
          const dynamicList = dynamicData?.data || dynamicData?.list || [];
          if (dynamicList.length > 0) {
            dynamicList.forEach((item: AnnouncementItem) => {
              const id = `dynamic-${item.id}`;
              const timestamp = item.createtime ? new Date(item.createtime).getTime() : Date.now();
              // 优先使用全局的新闻已读状态判断
              const isRead = newsReadIds.includes(String(item.id));

              allMessages.push({
                id,
                type: 'activity',
                title: '平台动态',
                content: item.title || '',
                time: item.createtime || '',
                timestamp,
                isRead: isRead,
                icon: Info,
                color: 'text-orange-600',
                bgColor: 'bg-orange-50',
                sourceId: item.id,
              });
            });
          }
        } catch (err) {
          console.error('加载公告失败:', err);
        }

        // 2. 加载充值订单（最近的状态变更）
        try {
          const rechargeRes = await getMyOrderList({ page: 1, limit: 5, token });
          // ✅ 使用统一判断
          const rechargeData = extractData(rechargeRes) as any;
          // Fix: API returns data in 'data' property, not 'list'
          const rechargeList = rechargeData?.data || rechargeData?.list || [];
          if (rechargeList.length > 0) {
            rechargeList.forEach((item: RechargeOrderItem) => {
              const id = `recharge-${item.id}`;
              const timestamp = item.create_time ? item.create_time * 1000 : Date.now();

              // 只显示需要用户关注的状态（待审核、已通过、已拒绝）
              if (item.status === RechargeOrderStatus.PENDING || item.status === RechargeOrderStatus.APPROVED || item.status === RechargeOrderStatus.REJECTED) {
                let content = '';
                if (item.status === RechargeOrderStatus.PENDING) {
                  content = `您的充值订单 ${item.order_no} 待审核，金额：¥${item.amount}`;
                } else if (item.status === RechargeOrderStatus.APPROVED) {
                  content = `您的充值订单 ${item.order_no} 审核通过，金额：¥${item.amount}`;
                } else if (item.status === RechargeOrderStatus.REJECTED) {
                  content = `您的充值订单 ${item.order_no} 审核未通过`;
                }

                allMessages.push({
                  id,
                  type: 'recharge',
                  title: '充值通知',
                  content,
                  time: item.create_time_text || '',
                  timestamp,
                  isRead: readIds.includes(id),
                  icon: Wallet,
                  color: 'text-blue-600',
                  bgColor: 'bg-blue-50',
                  sourceId: item.id,
                });
              }
            });
          }
        } catch (err) {
          console.error('加载充值订单失败:', err);
        }

        // 3. 加载提现记录（最近的状态变更）
        try {
          const withdrawRes = await getMyWithdrawList({ page: 1, limit: 5, token });
          // ✅ 使用统一判断
          const withdrawData = extractData(withdrawRes) as any;
          const withdrawList = withdrawData?.data || withdrawData?.list || [];
          if (withdrawList.length > 0) {
            withdrawList.forEach((item: WithdrawOrderItem) => {
              const id = `withdraw-${item.id}`;
              const timestamp = item.create_time ? item.create_time * 1000 : Date.now();

              // 只显示需要用户关注的状态
              if (item.status === WithdrawOrderStatus.PENDING || item.status === WithdrawOrderStatus.APPROVED || item.status === WithdrawOrderStatus.REJECTED) {
                let content = '';
                if (item.status === WithdrawOrderStatus.PENDING) {
                  content = `您的提现申请待审核，金额：¥${item.amount}`;
                } else if (item.status === WithdrawOrderStatus.APPROVED) {
                  content = `您的提现申请已通过，金额：¥${item.amount}，已到账：¥${item.actual_amount}`;
                } else if (item.status === WithdrawOrderStatus.REJECTED) {
                  content = `您的提现申请未通过${item.audit_reason ? `：${item.audit_reason}` : ''}`;
                }

                allMessages.push({
                  id,
                  type: 'withdraw',
                  title: '提现通知',
                  content,
                  time: item.create_time_text || '',
                  timestamp,
                  isRead: readIds.includes(id),
                  icon: Receipt,
                  color: 'text-green-600',
                  bgColor: 'bg-green-50',
                  sourceId: item.id,
                });
              }
            });
          }
        } catch (err) {
          console.error('加载提现记录失败:', err);
        }

        // 4. 加载消费金商城订单（待付款、待发货、待确认收货）
        try {
          const [pendingPayRes, pendingShipRes, pendingConfirmRes] = await Promise.all([
            fetchPendingPayOrders({ page: 1, limit: 3, token }),
            fetchPendingShipOrders({ page: 1, limit: 3, token }),
            fetchPendingConfirmOrders({ page: 1, limit: 3, token }),
          ]);

          // 待付款订单
          // ✅ 使用统一判断
          const pendingPayData = extractData(pendingPayRes);
          if (pendingPayData?.list) {
            pendingPayData.list.forEach((item: ShopOrderItem) => {
              const id = `shop-order-pay-${item.id}`;
              const timestamp = item.create_time ? (typeof item.create_time === 'string' ? parseInt(item.create_time) * 1000 : item.create_time * 1000) : Date.now();
              allMessages.push({
                id,
                type: 'shop_order',
                title: '订单提醒',
                content: `您有订单 ${item.order_no || item.id} 待付款，请及时支付`,
                time: item.create_time_text || '',
                timestamp,
                isRead: readIds.includes(id),
                icon: Package,
                color: 'text-yellow-600',
                bgColor: 'bg-yellow-50',
                sourceId: item.id,
              });
            });
          }

          // 待发货订单
          // ✅ 使用统一判断
          const pendingShipData = extractData(pendingShipRes);
          if (pendingShipData?.list) {
            pendingShipData.list.forEach((item: ShopOrderItem) => {
              const id = `shop-order-ship-${item.id}`;
              const timestamp = item.pay_time ? (typeof item.pay_time === 'string' ? parseInt(item.pay_time) * 1000 : item.pay_time * 1000) : Date.now();
              allMessages.push({
                id,
                type: 'shop_order',
                title: '订单通知',
                content: `您的订单 ${item.order_no || item.id} 已付款，等待商家发货`,
                time: item.pay_time_text || item.create_time_text || '',
                timestamp,
                isRead: readIds.includes(id),
                icon: CheckCircle,
                color: 'text-blue-600',
                bgColor: 'bg-blue-50',
                sourceId: item.id,
              });
            });
          }

          // 待确认收货订单
          // ✅ 使用统一判断
          const pendingConfirmData = extractData(pendingConfirmRes);
          if (pendingConfirmData?.list) {
            pendingConfirmData.list.forEach((item: ShopOrderItem) => {
              const id = `shop-order-confirm-${item.id}`;
              const timestamp = item.ship_time ? (typeof item.ship_time === 'string' ? parseInt(item.ship_time) * 1000 : item.ship_time * 1000) : Date.now();
              allMessages.push({
                id,
                type: 'shop_order',
                title: '订单通知',
                content: `您的订单 ${item.order_no || item.id} 已发货${item.shipping_no ? `，物流单号：${item.shipping_no}` : ''}，请及时确认收货`,
                time: item.ship_time_text || item.create_time_text || '',
                timestamp,
                isRead: readIds.includes(id),
                icon: Truck,
                color: 'text-green-600',
                bgColor: 'bg-green-50',
                sourceId: item.id,
              });
            });
          }
        } catch (err) {
          console.error('加载商城订单失败:', err);
        }

        // 按时间戳降序排序（最新的在前）
        allMessages.sort((a, b) => b.timestamp - a.timestamp);

        setMessages(allMessages);
        // 保存到缓存
        setCachedMessages(allMessages);
      } catch (err: any) {
        setError(err?.msg || err?.message || '获取消息失败');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // 手动刷新功能
  const handleRefresh = () => {
    clearCache();
    setMessages([]);
    setLoading(true);
    // 触发重新加载
    window.location.reload();
  };

  const formatTime = (timeStr: string | number) => {
    try {
      let date: Date;
      if (typeof timeStr === 'number') {
        // Unix时间戳（秒）
        date = new Date(timeStr * 1000);
      } else if (timeStr.includes('T') || timeStr.includes('-')) {
        // ISO格式字符串
        date = new Date(timeStr);
      } else {
        // 其他格式，尝试直接解析
        date = new Date(timeStr);
      }

      if (isNaN(date.getTime())) {
        return timeStr.toString();
      }

      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (minutes < 1) return '刚刚';
      if (minutes < 60) return `${minutes}分钟前`;
      if (hours < 24) return `${hours}小时前`;
      if (days < 7) return `${days}天前`;
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return typeof timeStr === 'string' ? timeStr : String(timeStr);
    }
  };

  const unreadCount = messages.filter(m => !m.isRead).length;

  const filteredMessages = activeTab === 'unread'
    ? messages.filter(m => !m.isRead)
    : messages;

  const handleMarkAsRead = (id: string, message?: MessageItem) => {
    // 1. 同步更新状态和缓存
    let updatedMessages = messages;

    // 如果消息已经在列表里，直接更新
    if (messages.some(m => m.id === id)) {
      updatedMessages = messages.map(msg => msg.id === id ? { ...msg, isRead: true } : msg);
    }

    // 2. 更新 localStorage (新闻/公告)
    const targetMsg = message || messages.find(m => m.id === id);
    if (targetMsg && (targetMsg.type === 'notice' || targetMsg.type === 'activity') && targetMsg.sourceId) {
      try {
        const storedNewsReadIds = localStorage.getItem(STORAGE_KEYS.READ_NEWS_IDS_KEY);
        const currentNewsIds: string[] = storedNewsReadIds ? JSON.parse(storedNewsReadIds) : [];
        const newsId = String(targetMsg.sourceId);

        if (!currentNewsIds.includes(newsId)) {
          const newIds = [...currentNewsIds, newsId];
          localStorage.setItem(STORAGE_KEYS.READ_NEWS_IDS_KEY, JSON.stringify(newIds));
        }
      } catch (e) {
        console.error('保存新闻已读状态失败', e);
      }
    }

    // 3. 更新 localStorage (普通消息)
    const readIds = getReadMessageIds();
    if (!readIds.includes(id)) {
      saveReadMessageIds([...readIds, id]);
    }

    // 4. 更新状态和缓存
    setMessages(updatedMessages);
    setCachedMessages(updatedMessages);
  };

  const handleMarkAllAsRead = () => {
    const updatedMessages = messages.map(msg => ({ ...msg, isRead: true }));

    // 1. 更新普通消息已读列表
    const allIds = updatedMessages.map(msg => msg.id);
    saveReadMessageIds(allIds);

    // 2. 更新全局新闻已读列表
    try {
      const storedNewsReadIds = localStorage.getItem(STORAGE_KEYS.READ_NEWS_IDS_KEY);
      const currentNewsIds: string[] = storedNewsReadIds ? JSON.parse(storedNewsReadIds) : [];

      const newNewsIds = [...currentNewsIds];
      updatedMessages.forEach(msg => {
        if ((msg.type === 'notice' || msg.type === 'activity') && msg.sourceId) {
          const newsId = String(msg.sourceId);
          if (!newNewsIds.includes(newsId)) {
            newNewsIds.push(newsId);
          }
        }
      });

      localStorage.setItem(STORAGE_KEYS.READ_NEWS_IDS_KEY, JSON.stringify(newNewsIds));
    } catch (e) {
      console.error('批量保存新闻已读状态失败', e);
    }

    // 3. 更新状态和缓存
    setMessages(updatedMessages);
    setCachedMessages(updatedMessages);
  };

  const handleMessageClick = (message: MessageItem) => {
    handleMarkAsRead(message.id);

    // 根据消息类型跳转
    switch (message.type) {
      case 'notice':
      case 'activity':
        if (message.sourceId) {
          onNavigate({
            name: 'news-detail',
            id: String(message.sourceId),
            back: { name: 'message-center' },
          });
        }
        break;
      case 'recharge':
        if (message.sourceId) {
          onNavigate({
            name: 'recharge-order-detail',
            orderId: String(message.sourceId),
            back: { name: 'message-center' }
          });
        }
        break;
      case 'withdraw':
        onNavigate({
          name: 'balance-withdraw',
          source: 'asset-view',
          back: { name: 'service-center:message' }
        });
        break;
      case 'shop_order':
        // 商城订单，跳转到订单详情页
        if (message.sourceId) {
          onNavigate({
            name: 'order-detail',
            orderId: String(message.sourceId),
            back: { name: 'message-center' }
          });
        }
        break;
      default:
        // 默认行为
        break;
    }
  };

  return (
    <SubPageLayout
      title="消息中心"
      onBack={onBack}
      rightAction={
        unreadCount > 0 ? (
          <button
            onClick={handleMarkAllAsRead}
            className="text-sm text-gray-600 active:opacity-70 font-medium"
          >
            全部已读
          </button>
        ) : null
      }
    >
      <div className="p-4">
        {/* 统计卡片 */}
        <div className="bg-gradient-to-br from-[#FF884D] to-[#FF5500] rounded-2xl p-6 text-white shadow-lg mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-300 opacity-20 rounded-full translate-y-1/2 -translate-x-1/4 blur-xl"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare size={24} className="opacity-90" />
              <div className="text-sm opacity-90 font-medium">我的消息</div>
            </div>
            <div className="text-4xl font-bold mb-2 font-[DINAlternate-Bold,Roboto,sans-serif]">{unreadCount}</div>
            <div className="text-sm opacity-80">
              {unreadCount > 0 ? '条未读消息' : '暂无未读消息'}
            </div>
          </div>
        </div>

        {/* 标签切换 */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'all'
              ? 'bg-white text-orange-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-600'
              }`}
          >
            全部消息
          </button>
          <button
            onClick={() => setActiveTab('unread')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all relative ${activeTab === 'unread'
              ? 'bg-white text-orange-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-600'
              }`}
          >
            未读消息
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-4 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>
        </div>

        {/* 消息列表 */}
        {loading ? (
          <LoadingSpinner text="加载消息中..." />
        ) : error ? (
          <EmptyState
            icon={<FileText size={48} className="text-gray-300" />}
            title="加载失败"
            description={error}
          />
        ) : filteredMessages.length === 0 ? (
          <EmptyState
            icon={<MessageSquare size={48} className="text-gray-300" />}
            title={activeTab === 'unread' ? '暂无未读消息' : '暂无消息'}
            description={activeTab === 'unread' ? '您已阅读所有消息' : '暂时没有新的消息'}
          />
        ) : (
          <div className="space-y-3">
            {filteredMessages.map((message) => (
              <div
                key={message.id}
                className={`bg-white rounded-xl p-4 shadow-sm cursor-pointer active:bg-gray-50 transition-colors relative overflow-hidden ${!message.isRead ? 'bg-orange-50/30' : ''
                  }`}
                onClick={() => handleMessageClick(message)}
              >
                {!message.isRead && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
                )}
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-full ${message.bgColor} flex items-center justify-center flex-shrink-0`}
                  >
                    {React.createElement(message.icon, { size: 20, className: message.color })}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <div className={`text-sm font-medium ${!message.isRead ? 'text-gray-900 font-bold' : 'text-gray-700'}`}>
                        {message.title}
                      </div>
                      {!message.isRead && (
                        <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 mt-1.5"></div>
                      )}
                    </div>
                    <div className="text-xs text-gray-600 mb-2 line-clamp-2 leading-relaxed">
                      {message.content}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-400">
                        {formatTime(message.time)}
                      </div>
                      {message.isRead && (
                        <div className="text-xs text-gray-400">已读</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SubPageLayout>
  );
};

export default MessageCenter;

