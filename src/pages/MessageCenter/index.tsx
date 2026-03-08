import { useCallback, useMemo, useRef } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { getErrorMessage } from '../../api/core/errors';
import { messageApi, type MessageCategory, type MessageItem } from '../../api/modules/message';
import { OfflineBanner } from '../../components/layout/OfflineBanner';
import { PageHeader } from '../../components/layout/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useRequest } from '../../hooks/useRequest';
import { useRouteScrollRestoration } from '../../hooks/useRouteScrollRestoration';
import { useSessionState } from '../../hooks/useSessionState';
import { useAppNavigate } from '../../lib/navigation';

const tabs: Array<{ id: MessageCategory; label: string }> = [
  { id: 'system', label: '系统通知' },
  { id: 'order', label: '订单通知' },
  { id: 'activity', label: '活动通知' },
];

export const MessageCenterPage = () => {
  const { goBack } = useAppNavigate();
  const { showToast } = useFeedback();
  const [activeTab, setActiveTab] = useSessionState<MessageCategory>('message-center:tab', 'system');
  const { isOffline } = useNetworkStatus();
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const {
    data: listData,
    error,
    loading,
    reload,
    setData,
  } = useRequest(
    (signal) => messageApi.list({ category: activeTab, page: 1, limit: 50 }, signal),
    {
      cacheKey: `messages:${activeTab}`,
      deps: [activeTab],
      keepPreviousData: false,
    },
  );

  const {
    data: unreadData,
    reload: reloadUnread,
  } = useRequest(
    (signal) => messageApi.unreadCount(signal),
    { cacheKey: 'messages:unread' },
  );

  const messages = listData?.list ?? [];

  const hasUnread = useMemo(() => messages.some((m) => m.is_read === 0), [messages]);

  const tabUnread = useMemo(() => ({
    system: unreadData?.system ?? 0,
    order: unreadData?.order ?? 0,
    activity: unreadData?.activity ?? 0,
  }), [unreadData]);

  useRouteScrollRestoration({
    containerRef: scrollContainerRef,
    namespace: `message-center:${activeTab}`,
    restoreDeps: [activeTab, loading, messages.length],
    restoreWhen: !loading && !error,
  });

  const retry = () => {
    void reload().catch(() => undefined);
  };

  const markAllAsRead = useCallback(async () => {
    try {
      await messageApi.markRead({ category: activeTab });
      setData((current) =>
        current
          ? { ...current, list: current.list.map((item) => ({ ...item, is_read: 1 as const })) }
          : current,
      );
      void reloadUnread().catch(() => undefined);
      showToast({ message: '已全部标记为已读', type: 'success' });
    } catch (err) {
      showToast({ message: getErrorMessage(err) || '操作失败', type: 'error' });
    }
  }, [activeTab, setData, reloadUnread, showToast]);

  const markAsRead = useCallback(async (message: MessageItem) => {
    if (message.is_read === 1) return;
    try {
      await messageApi.markRead({ id: message.id });
      setData((current) =>
        current
          ? { ...current, list: current.list.map((item) => item.id === message.id ? { ...item, is_read: 1 as const } : item) }
          : current,
      );
      void reloadUnread().catch(() => undefined);
    } catch {
      // silent
    }
  }, [setData, reloadUnread]);

  const renderTabs = () => (
    <div className="flex shrink-0 border-b border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`relative flex-1 py-3 text-md font-medium transition-colors ${
            activeTab === tab.id ? 'text-text-price' : 'text-gray-600 dark:text-gray-400'
          }`}
          onClick={() => setActiveTab(tab.id)}
        >
          <span className="relative inline-flex items-center">
            {tab.label}
            {tabUnread[tab.id] > 0 && (
              <span className="absolute -top-1.5 -right-5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1 leading-none">
                {tabUnread[tab.id] > 99 ? '99+' : tabUnread[tab.id]}
              </span>
            )}
          </span>
          {activeTab === tab.id && (
            <div className="absolute bottom-0 left-1/2 h-[3px] w-8 -translate-x-1/2 rounded-t-full bg-brand-start" />
          )}
        </button>
      ))}
    </div>
  );

  const renderSkeleton = () => (
    <div className="space-y-3 p-3">
      {[1, 2, 3].map((item) => (
        <div key={item} className="animate-pulse rounded-xl bg-white p-4 dark:bg-gray-900">
          <div className="mb-3 flex items-center justify-between">
            <div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-800" />
            <div className="h-3 w-16 rounded bg-gray-200 dark:bg-gray-800" />
          </div>
          <div className="mb-2 h-3 w-full rounded bg-gray-200 dark:bg-gray-800" />
          <div className="h-3 w-3/4 rounded bg-gray-200 dark:bg-gray-800" />
        </div>
      ))}
    </div>
  );

  const renderMessageItem = (message: MessageItem) => (
    <button
      key={message.id}
      type="button"
      className="block w-full rounded-xl bg-white p-4 text-left transition-colors active:bg-gray-50 dark:bg-gray-900 dark:active:bg-gray-800"
      onClick={() => markAsRead(message)}
    >
      <div className="mb-2 flex items-start justify-between">
        <div className="flex min-w-0 flex-1 items-center pr-4">
          {message.is_read === 0 && (
            <div className="mr-2 h-2 w-2 shrink-0 rounded-full bg-red-500" />
          )}
          <h3
            className={`truncate text-lg font-medium ${
              message.is_read === 1
                ? 'text-gray-500 dark:text-gray-400'
                : 'text-gray-900 dark:text-gray-100'
            }`}
          >
            {message.title}
          </h3>
        </div>
        <span className="mt-0.5 shrink-0 text-sm text-gray-400 dark:text-gray-500">
          {message.create_time}
        </span>
      </div>
      <p
        className={`line-clamp-2 text-base leading-relaxed ${
          message.is_read === 1
            ? 'text-gray-400 dark:text-gray-500'
            : 'text-gray-600 dark:text-gray-300'
        }`}
      >
        {message.content}
      </p>
    </button>
  );

  const renderContent = () => {
    if (loading) return renderSkeleton();
    if (error) return <ErrorState message={getErrorMessage(error)} onRetry={retry} />;
    if (messages.length === 0) return <EmptyState message="暂无消息" />;
    return <div className="space-y-3 p-3 pb-safe">{messages.map(renderMessageItem)}</div>;
  };

  return (
    <div className="relative flex h-full flex-1 flex-col overflow-hidden bg-bg-hover dark:bg-gray-950">
      {isOffline && (
        <OfflineBanner
          center
          message="网络连接已断开，请检查网络设置"
          className="sticky top-0 z-50 bg-[#ffe4e4] text-text-price"
        />
      )}

      <PageHeader
        title="消息中心"
        onBack={goBack}
        rightAction={
          hasUnread && !loading && !error ? (
            <button
              type="button"
              onClick={markAllAsRead}
              className="flex items-center px-2 py-1 text-md text-gray-600 active:opacity-70 dark:text-gray-400"
            >
              <CheckCircle2 size={14} className="mr-1" />
              全部已读
            </button>
          ) : null
        }
        className="border-b border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900"
        contentClassName="h-11 px-3"
        titleClassName="text-2xl font-medium text-gray-900 dark:text-gray-100"
        backButtonClassName="text-gray-900 dark:text-gray-100"
      />
      {renderTabs()}

      <div ref={scrollContainerRef} className="relative flex-1 overflow-y-auto no-scrollbar">
        {renderContent()}
      </div>
    </div>
  );
};
