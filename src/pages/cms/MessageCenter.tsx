import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, MessageSquare } from 'lucide-react';
import PageContainer from '@/layouts/PageContainer';
import { EmptyState } from '@/components/common';
import { useStateMachine } from '@/hooks/useStateMachine';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { getStoredToken } from '@/services/client';
import { LoadingEvent, LoadingState } from '@/types/states';
import { debugLog } from '@/utils/logger';
import { extractData } from '@/utils/apiHelpers';
import { useNotification } from '@/context/NotificationContext';
import { useAppStore } from '@/stores/appStore';
import { loadMessagesBatch } from './message-center/loader';
import { formatMessageTime } from './message-center/time';
import type { MessageItem } from './message-center/types';
import { markMessageCenterRead, type MessageCenterSummary } from '@/services';

const DEFAULT_SUMMARY: MessageCenterSummary = {
  system: 0,
  order: 0,
  activity: 0,
  finance: 0,
  total: 0,
};

const MessageCenter: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useNotification();
  const setExtraUnreadCount = useAppStore((state) => state.setExtraUnreadCount);

  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [summary, setSummary] = useState<MessageCenterSummary>(DEFAULT_SUMMARY);

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
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const applySummary = (nextSummary?: MessageCenterSummary | null) => {
    const safeSummary = nextSummary || DEFAULT_SUMMARY;
    setSummary(safeSummary);
    setExtraUnreadCount(safeSummary.total || 0);
  };

  const loadMessages = async (pageNum: number, scope: 'all' | 'unread', append = false) => {
    const token = getStoredToken();
    if (!token) {
      setError('请先登录');
      applySummary(DEFAULT_SUMMARY);
      loadMachine.send(LoadingEvent.ERROR);
      return;
    }

    if (!append) {
      loadMachine.send(LoadingEvent.LOAD);
    }
    setError(null);

    try {
      const result = await loadMessagesBatch({ pageNum, scope });

      setMessages((prev) => (append ? [...prev, ...result.list] : result.list));
      setHasMore(result.hasMore);
      applySummary(result.summary);
      loadMachine.send(LoadingEvent.SUCCESS);
    } catch (err: any) {
      setError(err?.msg || err?.message || '获取消息失败');
      setHasMore(false);
      loadMachine.send(LoadingEvent.ERROR);
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    debugLog('MessageCenter', `load tab: ${activeTab}`);
    setMessages([]);
    setPage(1);
    setHasMore(true);
    setIsLoadingMore(false);
    loadMessages(1, activeTab, false);
  }, [activeTab]);

  useEffect(() => {
    if (page > 1) {
      loadMessages(page, activeTab, true);
    }
  }, [page]);

  const handleLoadMore = () => {
    if (loading || isLoadingMore || !hasMore) {
      return;
    }

    setIsLoadingMore(true);
    setPage((prev) => prev + 1);
  };

  const bottomRef = useInfiniteScroll(handleLoadMore, hasMore, loading || isLoadingMore);

  const unreadCount = summary.total || 0;

  const markSingleMessageAsRead = async (message: MessageItem): Promise<boolean> => {
    if (message.isRead) {
      return true;
    }

    try {
      const response = await markMessageCenterRead({ messageKey: message.id });
      const data = extractData(response) as { count: number; summary: MessageCenterSummary } | null;
      applySummary(data?.summary || DEFAULT_SUMMARY);

      if (activeTab === 'unread') {
        setMessages((prev) => prev.filter((item) => item.id !== message.id));
      } else {
        setMessages((prev) => prev.map((item) => (item.id === message.id ? { ...item, isRead: true } : item)));
      }

      return true;
    } catch (err: any) {
      showToast('error', '操作失败', err?.message || '标记已读失败');
      return false;
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount <= 0) {
      return;
    }

    try {
      const response = await markMessageCenterRead();
      const data = extractData(response) as { count: number; summary: MessageCenterSummary } | null;
      applySummary(data?.summary || DEFAULT_SUMMARY);

      if (activeTab === 'unread') {
        setMessages([]);
        setHasMore(false);
      } else {
        setMessages((prev) => prev.map((item) => ({ ...item, isRead: true })));
      }

      showToast('success', '操作成功', '已全部标记为已读');
    } catch (err: any) {
      showToast('error', '操作失败', err?.message || '全部已读失败');
    }
  };

  const resolveActionPath = (message: MessageItem): string => {
    if (message.actionPath) {
      return message.actionPath;
    }

    switch (message.type) {
      case 'notice':
      case 'activity':
        return message.sourceId ? `/news/${String(message.sourceId)}` : '';
      case 'recharge':
        return message.sourceId ? `/recharge-order/${String(message.sourceId)}` : '';
      case 'withdraw':
        return message.sourceId ? `/withdraw-order/${String(message.sourceId)}` : '';
      case 'shop_order':
      case 'order':
        return message.sourceId ? `/order/${String(message.sourceId)}` : '';
      default:
        return '';
    }
  };

  const handleMessageClick = async (message: MessageItem) => {
    const marked = await markSingleMessageAsRead(message);
    if (!marked) {
      return;
    }

    const actionPath = resolveActionPath(message);
    if (actionPath) {
      navigate(actionPath);
    }
  };

  return (
    <PageContainer
      title="消息中心"
      onBack={() => navigate(-1)}
      rightAction={
        unreadCount > 0 ? (
          <button onClick={handleMarkAllAsRead} className="text-sm text-gray-600 active:opacity-70 font-medium">
            全部已读
          </button>
        ) : null
      }
    >
      <div className="p-4">
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-lg mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-red-300 opacity-20 rounded-full translate-y-1/2 -translate-x-1/4 blur-xl"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare size={24} className="opacity-90" />
              <div className="text-sm opacity-90 font-medium">我的消息</div>
            </div>
            <div className="text-4xl font-bold mb-2 font-[DINAlternate-Bold,Roboto,sans-serif]">{unreadCount}</div>
            <div className="text-sm opacity-80">{unreadCount > 0 ? '条未读消息' : '暂无未读消息'}</div>
          </div>
        </div>

        <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'all' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-600'
            }`}
          >
            全部消息
          </button>
          <button
            onClick={() => setActiveTab('unread')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all relative ${
              activeTab === 'unread' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-600'
            }`}
          >
            未读消息
            {unreadCount > 0 && <span className="absolute top-1.5 right-4 w-2 h-2 bg-red-500 rounded-full"></span>}
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="skeleton w-10 h-10 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-24 rounded" />
                    <div className="skeleton h-3 w-full rounded" />
                    <div className="skeleton h-3 w-3/4 rounded" />
                    <div className="skeleton h-3 w-20 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <EmptyState icon={<FileText size={48} className="text-gray-300" />} title="加载失败" description={error} />
        ) : messages.length === 0 ? (
          <EmptyState
            icon={<MessageSquare size={48} className="text-gray-300" />}
            title={activeTab === 'unread' ? '暂无未读消息' : '暂无消息'}
            description={activeTab === 'unread' ? '您已阅读所有消息' : '暂时没有新的消息'}
          />
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`bg-white rounded-xl p-4 shadow-sm cursor-pointer active:bg-gray-50 transition-colors relative overflow-hidden ${
                  !message.isRead ? 'bg-red-50/30' : ''
                }`}
                onClick={() => handleMessageClick(message)}
              >
                {!message.isRead && <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>}
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full ${message.bgColor} flex items-center justify-center flex-shrink-0`}>
                    {React.createElement(message.icon, { size: 20, className: message.color })}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <div className={`text-sm font-medium ${!message.isRead ? 'text-gray-900 font-bold' : 'text-gray-700'}`}>
                        {message.title}
                      </div>
                      {!message.isRead && <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 mt-1.5"></div>}
                    </div>
                    <div className="text-xs text-gray-600 mb-2 line-clamp-2 leading-relaxed">{message.content}</div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-400">{formatMessageTime(message.time)}</div>
                      {message.isRead && <div className="text-xs text-gray-400">已读</div>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div ref={bottomRef} className="h-4" />
        {isLoadingMore && hasMore && <div className="py-4 text-center text-xs text-gray-400">加载中...</div>}
      </div>
    </PageContainer>
  );
};

export default MessageCenter;
