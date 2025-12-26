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

  useEffect(() => {
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
        const readIds = getReadMessageIds();
        const allMessages: MessageItem[] = [];

        // 1. 加载公告和动态
        try {
          const [announcementRes, dynamicRes] = await Promise.all([
            fetchAnnouncements({ page: 1, limit: 10, type: 'normal' }),
            fetchAnnouncements({ page: 1, limit: 10, type: 'important' }),
          ]);

          // 处理平台公告
          if (announcementRes.code === 1 && announcementRes.data?.list) {
            announcementRes.data.list.forEach((item: AnnouncementItem) => {
              const id = `announcement-${item.id}`;
              const timestamp = item.createtime ? new Date(item.createtime).getTime() : Date.now();
              allMessages.push({
                id,
                type: 'notice',
                title: '平台公告',
                content: item.title || '',
                time: item.createtime || '',
                timestamp,
                isRead: readIds.includes(id),
                icon: AlertCircle,
                color: 'text-red-600',
                bgColor: 'bg-red-50',
                sourceId: item.id,
              });
            });
          }

          // 处理平台动态
          if (dynamicRes.code === 1 && dynamicRes.data?.list) {
            dynamicRes.data.list.forEach((item: AnnouncementItem) => {
              const id = `dynamic-${item.id}`;
              const timestamp = item.createtime ? new Date(item.createtime).getTime() : Date.now();
              allMessages.push({
                id,
                type: 'activity',
                title: '平台动态',
                content: item.title || '',
                time: item.createtime || '',
                timestamp,
                isRead: readIds.includes(id),
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
          if (rechargeRes.code === 1 && rechargeRes.data?.list) {
            rechargeRes.data.list.forEach((item: RechargeOrderItem) => {
              const id = `recharge-${item.id}`;
              const timestamp = item.create_time ? item.create_time * 1000 : Date.now();

              // 只显示需要用户关注的状态（待审核、已通过、已拒绝）
              if (item.status === 0 || item.status === 1 || item.status === 2) {
                let content = '';
                if (item.status === 0) {
                  content = `您的充值订单 ${item.order_no} 待审核，金额：¥${item.amount}`;
                } else if (item.status === 1) {
                  content = `您的充值订单 ${item.order_no} 审核通过，金额：¥${item.amount}`;
                } else if (item.status === 2) {
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
          if (withdrawRes.code === 1 && withdrawRes.data?.list) {
            withdrawRes.data.list.forEach((item: WithdrawOrderItem) => {
              const id = `withdraw-${item.id}`;
              const timestamp = item.create_time ? item.create_time * 1000 : Date.now();

              // 只显示需要用户关注的状态
              if (item.status === 0 || item.status === 1 || item.status === 2) {
                let content = '';
                if (item.status === 0) {
                  content = `您的提现申请待审核，金额：¥${item.amount}`;
                } else if (item.status === 1) {
                  content = `您的提现申请已通过，金额：¥${item.amount}，已到账：¥${item.actual_amount}`;
                } else if (item.status === 2) {
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
          if (pendingPayRes.code === 1 && pendingPayRes.data?.list) {
            pendingPayRes.data.list.forEach((item: ShopOrderItem) => {
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
          if (pendingShipRes.code === 1 && pendingShipRes.data?.list) {
            pendingShipRes.data.list.forEach((item: ShopOrderItem) => {
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
          if (pendingConfirmRes.code === 1 && pendingConfirmRes.data?.list) {
            pendingConfirmRes.data.list.forEach((item: ShopOrderItem) => {
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
      } catch (err: any) {
        setError(err?.msg || err?.message || '获取消息失败');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

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

  const handleMarkAsRead = (id: string) => {
    setMessages(prev => {
      const updated = prev.map(msg => msg.id === id ? { ...msg, isRead: true } : msg);
      // 更新本地存储
      const readIds = getReadMessageIds();
      if (!readIds.includes(id)) {
        saveReadMessageIds([...readIds, id]);
      }
      return updated;
    });
  };

  const handleMarkAllAsRead = () => {
    setMessages(prev => {
      const updated = prev.map(msg => ({ ...msg, isRead: true }));
      // 更新本地存储
      const allIds = updated.map(msg => msg.id);
      saveReadMessageIds(allIds);
      return updated;
    });
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
            from: { name: 'message-center' },
            back: { name: 'message-center' },
          });
        }
        break;
      case 'recharge':
        onNavigate({ name: 'balance-recharge', source: 'asset-view', back: { name: 'message-center' } });
        break;
      case 'withdraw':
        onNavigate({ name: 'balance-withdraw', source: 'asset-view', back: { name: 'message-center' } });
        break;
      case 'shop_order':
        // 商城订单，跳转到订单列表（全部）
        onNavigate({
          name: 'order-list',
          kind: 'points',
          status: 0,
          back: { name: 'message-center' },
        });
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
            className="text-sm text-blue-600 active:opacity-70"
          >
            全部已读
          </button>
        ) : null
      }
    >
      <div className="p-4">
        {/* 统计卡片 */}
        <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl p-6 text-white shadow-lg mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare size={24} />
              <div className="text-sm opacity-90">我的消息</div>
            </div>
            <div className="text-4xl font-bold mb-2">{unreadCount}</div>
            <div className="text-sm opacity-80">
              {unreadCount > 0 ? '条未读消息' : '暂无未读消息'}
            </div>
          </div>
        </div>

        {/* 标签切换 */}
        <div className="flex bg-white rounded-xl p-1 mb-4 shadow-sm">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'all'
              ? 'bg-blue-100 text-blue-600'
              : 'text-gray-500'
              }`}
          >
            全部消息
          </button>
          <button
            onClick={() => setActiveTab('unread')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors relative ${activeTab === 'unread'
              ? 'bg-blue-100 text-blue-600'
              : 'text-gray-500'
              }`}
          >
            未读消息
            {unreadCount > 0 && (
              <span className="absolute top-1 right-4 w-2 h-2 bg-red-500 rounded-full"></span>
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
                className={`bg-white rounded-xl p-4 shadow-sm cursor-pointer active:bg-gray-50 transition-colors ${!message.isRead ? 'border-l-4 border-blue-500' : ''
                  }`}
                onClick={() => handleMessageClick(message)}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-full ${message.bgColor} flex items-center justify-center flex-shrink-0`}
                  >
                    <message.icon size={20} className={message.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <div className="text-sm font-medium text-gray-800">
                        {message.title}
                      </div>
                      {!message.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5"></div>
                      )}
                    </div>
                    <div className="text-xs text-gray-600 mb-2 line-clamp-2">
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

