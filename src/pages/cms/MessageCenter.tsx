import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, MessageSquare } from 'lucide-react';
import PageContainer from '@/layouts/PageContainer';
import { EmptyState } from '@/components/common';
import { useStateMachine } from '@/hooks/useStateMachine';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { getStoredToken } from '@/services/client';
import { LoadingEvent, LoadingState } from '@/types/states';
import { debugLog, errorLog } from '@/utils/logger';
import { loadMessagesBatch } from './message-center/loader';
import {
  clearCachedMessages,
  getCachedMessages,
  getNewsReadIds,
  getReadMessageIds,
  saveNewsReadIds,
  saveReadMessageIds,
  setCachedMessages,
  syncCachedReadState,
} from './message-center/storage';
import { formatMessageTime } from './message-center/time';
import type { MessageItem } from './message-center/types';

const MIN_EXPECTED_ITEMS = 3;

const MessageCenter: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

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

  const handleLoadMore = () => {
    if (loading || isLoadingMore || !hasMore) {
      return;
    }
    setIsLoadingMore(true);
    setPage((prev) => prev + 1);
  };

  const bottomRef = useInfiniteScroll(handleLoadMore, hasMore, loading || isLoadingMore);

  const loadMessages = async (pageNum: number, append: boolean = false) => {
    const token = getStoredToken();
    if (!token) {
      setError('请先登录');
      loadMachine.send(LoadingEvent.ERROR);
      return;
    }

    if (!append) {
      loadMachine.send(LoadingEvent.LOAD);
    }
    setError(null);

    try {
      const readIds = getReadMessageIds();
      const allMessages = await loadMessagesBatch({ pageNum, token, readIds });

      if (append) {
        setMessages((prev) => [...prev, ...allMessages]);
      } else {
        setMessages(allMessages);
        if (pageNum === 1) {
          setCachedMessages(allMessages);
        }
      }

      setHasMore(allMessages.length >= MIN_EXPECTED_ITEMS);
      loadMachine.send(LoadingEvent.SUCCESS);
    } catch (err: any) {
      setError(err?.msg || err?.message || '获取消息失败');
      loadMachine.send(LoadingEvent.ERROR);
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    const cachedMessages = getCachedMessages();
    if (cachedMessages) {
      debugLog('MessageCenter', '使用缓存数据');
      setMessages(syncCachedReadState(cachedMessages));
      loadMachine.send(LoadingEvent.SUCCESS);
      return;
    }

    loadMessages(1, false);
  }, []);

  useEffect(() => {
    if (page > 1) {
      loadMessages(page, true);
    }
  }, [page]);

  const handleRefresh = () => {
    clearCachedMessages();
    setMessages([]);
    setPage(1);
    setHasMore(true);
    setIsLoadingMore(false);
    loadMessages(1, false);
  };

  const unreadCount = messages.filter((message) => !message.isRead).length;
  const filteredMessages = activeTab === 'unread' ? messages.filter((message) => !message.isRead) : messages;

  const handleMarkAsRead = (id: string, message?: MessageItem) => {
    let updatedMessages = messages;

    if (messages.some((item) => item.id === id)) {
      updatedMessages = messages.map((item) => (item.id === id ? { ...item, isRead: true } : item));
    }

    const targetMessage = message || messages.find((item) => item.id === id);
    if (
      targetMessage &&
      (targetMessage.type === 'notice' || targetMessage.type === 'activity') &&
      targetMessage.sourceId
    ) {
      try {
        const newsReadIds = getNewsReadIds();
        const newsId = String(targetMessage.sourceId);
        if (!newsReadIds.includes(newsId)) {
          saveNewsReadIds([...newsReadIds, newsId]);
        }
      } catch (error) {
        errorLog('MessageCenter', '保存新闻已读状态失败', error);
      }
    }

    const readIds = getReadMessageIds();
    if (!readIds.includes(id)) {
      saveReadMessageIds([...readIds, id]);
    }

    setMessages(updatedMessages);
    setCachedMessages(updatedMessages);
  };

  const handleMarkAllAsRead = () => {
    const updatedMessages = messages.map((item) => ({ ...item, isRead: true }));

    const allIds = updatedMessages.map((item) => item.id);
    saveReadMessageIds(allIds);

    try {
      const newsReadIds = getNewsReadIds();
      const nextNewsReadIds = [...newsReadIds];

      updatedMessages.forEach((item) => {
        if ((item.type === 'notice' || item.type === 'activity') && item.sourceId) {
          const newsId = String(item.sourceId);
          if (!nextNewsReadIds.includes(newsId)) {
            nextNewsReadIds.push(newsId);
          }
        }
      });

      saveNewsReadIds(nextNewsReadIds);
    } catch (error) {
      errorLog('MessageCenter', '批量保存新闻已读状态失败', error);
    }

    setMessages(updatedMessages);
    setCachedMessages(updatedMessages);
  };

  const handleMessageClick = (message: MessageItem) => {
    handleMarkAsRead(message.id);

    switch (message.type) {
      case 'notice':
      case 'activity':
        if (message.sourceId) {
          navigate(`/news/${String(message.sourceId)}`);
        }
        break;
      case 'recharge':
        if (message.sourceId) {
          navigate(`/recharge-order/${String(message.sourceId)}`);
        }
        break;
      case 'withdraw':
        if (message.sourceId) {
          navigate(`/withdraw-order/${String(message.sourceId)}`);
        }
        break;
      case 'shop_order':
        if (message.sourceId) {
          navigate(`/order/${String(message.sourceId)}`);
        }
        break;
      default:
        break;
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
        {loading && hasMore && <div className="py-4 text-center text-xs text-gray-400">加载中...</div>}

      </div>
    </PageContainer>
  );
};

export default MessageCenter;
