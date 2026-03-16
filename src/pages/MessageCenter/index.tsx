import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  BellRing,
  CheckCircle2,
  ChevronRight,
  Megaphone,
  PackageCheck,
  Sparkles,
  WalletCards,
} from 'lucide-react';
import { getErrorMessage } from '../../api/core/errors';
import {
  messageApi,
  type MessageCategory,
  type MessageItem,
  type MessageScope,
  type MessageSummary,
} from '../../api/modules/message';
import { OfflineBanner } from '../../components/layout/OfflineBanner';
import { PageHeader } from '../../components/layout/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { PullToRefreshContainer } from '../../components/ui/PullToRefreshContainer';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useRequest } from '../../hooks/useRequest';
import { useRouteScrollRestoration } from '../../hooks/useRouteScrollRestoration';
import { useSessionState } from '../../hooks/useSessionState';
import { useAppNavigate } from '../../lib/navigation';
import {
  getMessageDetailPath,
  resolveMessageSceneLabel,
  resolveMessageTargetPath,
  resolveMessageTitle,
} from '../../lib/messageCenter';

type MessageFilterCategory = 'all' | MessageCategory;

const EMPTY_SUMMARY: MessageSummary = {
  system: 0,
  order: 0,
  activity: 0,
  finance: 0,
  total: 0,
};

const scopeTabs: Array<{ id: MessageScope; label: string }> = [
  { id: 'all', label: '全部消息' },
  { id: 'unread', label: '仅看未读' },
];

const categoryTabs: Array<{ id: MessageFilterCategory; label: string }> = [
  { id: 'all', label: '全部' },
  { id: 'system', label: '系统' },
  { id: 'order', label: '订单' },
  { id: 'activity', label: '活动' },
  { id: 'finance', label: '资金' },
];

function getUnreadCount(summary: MessageSummary, category: MessageFilterCategory) {
  return category === 'all' ? summary.total : summary[category];
}

function getMessageIcon(message: MessageItem) {
  if (message.type === 'recharge') {
    return <ArrowDownCircle size={18} />;
  }

  if (message.type === 'withdraw') {
    return <ArrowUpCircle size={18} />;
  }

  if (message.type === 'shop_order' || message.category === 'order') {
    return <PackageCheck size={18} />;
  }

  if (message.type === 'notice') {
    return <Megaphone size={18} />;
  }

  if (message.category === 'activity') {
    return <Sparkles size={18} />;
  }

  if (message.category === 'finance') {
    return <WalletCards size={18} />;
  }

  return <BellRing size={18} />;
}

function getMessageTone(message: MessageItem) {
  if (message.type === 'recharge') {
    return 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20';
  }

  if (message.type === 'withdraw') {
    return 'bg-amber-50 text-amber-600 ring-1 ring-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20';
  }

  if (message.type === 'shop_order' || message.category === 'order') {
    return 'bg-sky-50 text-sky-600 ring-1 ring-sky-100 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/20';
  }

  if (message.type === 'notice') {
    return 'bg-violet-50 text-violet-600 ring-1 ring-violet-100 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/20';
  }

  if (message.category === 'activity') {
    return 'bg-fuchsia-50 text-fuchsia-600 ring-1 ring-fuchsia-100 dark:bg-fuchsia-500/10 dark:text-fuchsia-300 dark:ring-fuchsia-500/20';
  }

  return 'bg-rose-50 text-rose-600 ring-1 ring-rose-100 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20';
}

function buildPreview(message: MessageItem) {
  return message.content || '查看消息详情';
}

function buildEmptyMessage(scope: MessageScope, category: MessageFilterCategory) {
  if (scope === 'unread') {
    return category === 'all'
      ? '暂时没有未读消息'
      : `当前没有未读${categoryTabs.find((tab) => tab.id === category)?.label || ''}消息`;
  }

  if (category === 'all') {
    return '消息中心还是空的';
  }

  return `暂时没有${categoryTabs.find((tab) => tab.id === category)?.label || ''}消息`;
}

function isExternalTarget(path: string) {
  return /^https?:\/\//i.test(path);
}

export const MessageCenterPage = () => {
  const { goBack, navigate } = useAppNavigate();
  const { showToast } = useFeedback();
  const { isOffline } = useNetworkStatus();
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [activeScope, setActiveScope] = useSessionState<MessageScope>('message-center:scope', 'all');
  const [activeCategory, setActiveCategory] = useSessionState<MessageFilterCategory>(
    'message-center:category',
    'all',
  );
  const [pendingMessageKey, setPendingMessageKey] = useState<string | null>(null);
  const [markAllLoading, setMarkAllLoading] = useState(false);

  const {
    data: listData,
    error,
    loading,
    reload,
    setData: setListData,
  } = useRequest(
    (signal) =>
      messageApi.list(
        {
          scope: activeScope,
          category: activeCategory === 'all' ? undefined : activeCategory,
          page: 1,
          limit: 50,
        },
        signal,
      ),
    {
      cacheKey: `message-center:list:${activeScope}:${activeCategory}`,
      deps: [activeScope, activeCategory],
      keepPreviousData: false,
    },
  );

  const {
    data: unreadData,
    reload: reloadUnread,
    setData: setUnreadData,
  } = useRequest((signal) => messageApi.unreadCount(signal), {
    cacheKey: 'messages:unread',
  });

  const summary = unreadData ?? listData?.summary ?? EMPTY_SUMMARY;
  const messages = listData?.list ?? [];
  const hasUnreadVisible = messages.some((message) => !message.isRead);

  useRouteScrollRestoration({
    containerRef: scrollContainerRef,
    namespace: `message-center:${activeScope}:${activeCategory}`,
    restoreDeps: [activeScope, activeCategory, loading, messages.length],
    restoreWhen: !loading && !error,
  });

  const syncSummary = useCallback((nextSummary: MessageSummary | undefined) => {
    if (!nextSummary) {
      return;
    }

    setUnreadData(nextSummary);
    setListData((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        summary: nextSummary,
      };
    });
  }, [setListData, setUnreadData]);

  const markMessageReadLocally = useCallback((messageKey: string) => {
    setListData((current) => {
      if (!current) {
        return current;
      }

      const target = current.list.find((message) => message.messageKey === messageKey);
      if (!target || target.isRead) {
        return current;
      }

      if (activeScope === 'unread') {
        return {
          ...current,
          list: current.list.filter((message) => message.messageKey !== messageKey),
          total: Math.max(0, current.total - 1),
        };
      }

      return {
        ...current,
        list: current.list.map((message) =>
          message.messageKey === messageKey
            ? { ...message, isRead: true }
            : message,
        ),
      };
    });
  }, [activeScope, setListData]);

  const retry = useCallback(() => {
    void Promise.allSettled([reload(), reloadUnread()]);
  }, [reload, reloadUnread]);

  const handleRefresh = useCallback(async () => {
    await Promise.allSettled([reload(), reloadUnread()]);
  }, [reload, reloadUnread]);

  const handleMarkAllRead = useCallback(async () => {
    if (!hasUnreadVisible || markAllLoading) {
      return;
    }

    setMarkAllLoading(true);

    try {
      const result = await messageApi.markRead({
        category: activeCategory === 'all' ? undefined : activeCategory,
      });

      setListData((current) => {
        if (!current) {
          return current;
        }

        if (activeScope === 'unread') {
          return {
            ...current,
            list: [],
            total: 0,
            hasMore: false,
            summary: result.summary,
          };
        }

        return {
          ...current,
          list: current.list.map((message) => ({ ...message, isRead: true })),
          summary: result.summary,
        };
      });

      syncSummary(result.summary);
      showToast({ message: '已将当前筛选下消息标记为已读', type: 'success' });
    } catch (nextError) {
      showToast({ message: getErrorMessage(nextError) || '操作失败，请稍后重试', type: 'error' });
    } finally {
      setMarkAllLoading(false);
    }
  }, [activeCategory, activeScope, hasUnreadVisible, markAllLoading, setListData, showToast, syncSummary]);

  const handleMessageClick = useCallback(async (message: MessageItem) => {
    if (pendingMessageKey === message.messageKey) {
      return;
    }

    const targetPath = resolveMessageTargetPath(message);
    const detailPath = getMessageDetailPath(message.messageKey);
    const destination = targetPath ?? detailPath;

    if (!message.isRead) {
      setPendingMessageKey(message.messageKey);

      try {
        const result = await messageApi.markRead({ messageKey: message.messageKey });
        markMessageReadLocally(message.messageKey);
        syncSummary(result.summary);
      } catch (nextError) {
        showToast({ message: getErrorMessage(nextError) || '标记已读失败', type: 'error' });
        setPendingMessageKey(null);
        return;
      }
    }

    setPendingMessageKey(null);

    if (isExternalTarget(destination)) {
      window.location.assign(destination);
      return;
    }

    navigate(destination);
  }, [markMessageReadLocally, navigate, pendingMessageKey, showToast, syncSummary]);

  const categoryCards = useMemo(() => categoryTabs.map((tab) => ({
    ...tab,
    unread: getUnreadCount(summary, tab.id),
  })), [summary]);

  const renderSummary = () => (
    <div className="px-3 pt-3">
      <div className="overflow-hidden rounded-[28px] border border-orange-100 gradient-warm-br-light-dark-br-dark p-4 shadow-[0_10px_30px_rgba(244,63,94,0.08)] dark:border-white/10">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-orange-500 dark:text-orange-300">消息概览</p>
            <h2 className="mt-2 text-5_5xl font-semibold leading-none text-gray-900 dark:text-gray-100">
              {summary.total}
            </h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              未读消息按系统、订单、活动和资金四类自动聚合
            </p>
          </div>
          <div className="rounded-2xl bg-white/80 p-3 text-orange-500 shadow-sm ring-1 ring-orange-100 dark:bg-white/5 dark:text-orange-300 dark:ring-white/10">
            <BellRing size={20} />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {categoryTabs
            .filter((tab) => tab.id !== 'all')
            .map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategory(tab.id)}
                className={`rounded-2xl px-3 py-2 text-left transition-transform active:scale-[0.98] ${
                  activeCategory === tab.id
                    ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                    : 'bg-white/80 text-gray-700 ring-1 ring-black/5 dark:bg-white/5 dark:text-gray-200 dark:ring-white/10'
                }`}
              >
                <div className="text-xs opacity-70">{tab.label}</div>
                <div className="mt-1 text-lg font-semibold">{summary[tab.id]}</div>
              </button>
            ))}
        </div>
      </div>
    </div>
  );

  const renderScopeTabs = () => (
    <div className="px-3 pt-3">
      <div className="grid grid-cols-2 rounded-2xl bg-white p-1 shadow-sm ring-1 ring-black/5 dark:bg-gray-900 dark:ring-white/10">
        {scopeTabs.map((tab) => {
          const isActive = activeScope === tab.id;
          const unread = tab.id === 'unread' ? summary.total : 0;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveScope(tab.id)}
              className={`relative flex min-h-[44px] items-center justify-center gap-2 rounded-2xl px-3 text-sm font-medium transition-all active:scale-[0.98] ${
                isActive
                  ? 'bg-gray-900 text-white shadow-sm dark:bg-white dark:text-gray-900'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <span>{tab.label}</span>
              {unread > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-xs leading-none ${
                  isActive
                    ? 'bg-white/20 text-white dark:bg-gray-900/10 dark:text-gray-900'
                    : 'bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-300'
                }`}>
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderCategoryTabs = () => (
    <div className="px-3 pt-3">
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {categoryCards.map((tab) => {
          const isActive = activeCategory === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveCategory(tab.id)}
              className={`inline-flex min-h-[40px] shrink-0 items-center gap-2 rounded-full px-4 text-sm font-medium transition-all active:scale-[0.98] ${
                isActive
                  ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/20'
                  : 'bg-white text-gray-600 ring-1 ring-black/5 dark:bg-gray-900 dark:text-gray-300 dark:ring-white/10'
              }`}
            >
              <span>{tab.label}</span>
              {tab.unread > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-xs leading-none ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-300'
                }`}>
                  {tab.unread > 99 ? '99+' : tab.unread}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderSkeleton = () => (
    <div className="space-y-3 p-3">
      {[0, 1, 2, 3].map((item) => (
        <div
          key={item}
          className="rounded-[24px] bg-white p-4 shadow-sm ring-1 ring-black/5 animate-pulse dark:bg-gray-900 dark:ring-white/10"
        >
          <div className="flex items-start gap-3">
            <div className="h-11 w-11 shrink-0 rounded-2xl bg-gray-100 dark:bg-gray-800" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <div className="h-4 w-32 rounded-full bg-gray-100 dark:bg-gray-800" />
                <div className="h-3 w-20 rounded-full bg-gray-100 dark:bg-gray-800" />
              </div>
              <div className="mt-3 h-3 w-full rounded-full bg-gray-100 dark:bg-gray-800" />
              <div className="mt-2 h-3 w-3/4 rounded-full bg-gray-100 dark:bg-gray-800" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderMessageItem = (message: MessageItem) => {
    const title = resolveMessageTitle(message);
    const preview = buildPreview(message);
    const sceneLabel = resolveMessageSceneLabel(message);
    const isPending = pendingMessageKey === message.messageKey;

    return (
      <button
        key={message.messageKey}
        type="button"
        onClick={() => void handleMessageClick(message)}
        disabled={markAllLoading || isPending}
        className="block w-full rounded-[24px] bg-white p-4 text-left shadow-sm ring-1 ring-black/5 transition-all active:scale-[0.99] active:bg-gray-50 disabled:opacity-70 dark:bg-gray-900 dark:ring-white/10 dark:active:bg-gray-800"
      >
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${getMessageTone(message)}`}>
            {getMessageIcon(message)}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {!message.isRead && <span className="h-2 w-2 rounded-full bg-rose-500" />}
                  <h3 className={`truncate text-base font-semibold ${
                    message.isRead
                      ? 'text-gray-500 dark:text-gray-400'
                      : 'text-gray-900 dark:text-gray-100'
                  }`}>
                    {title}
                  </h3>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 dark:bg-white/10 dark:text-gray-300">
                    {sceneLabel}
                  </span>
                  {message.isBroadcast && (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
                      广播
                    </span>
                  )}
                </div>
              </div>

              <div className="shrink-0 text-right">
                <div className="text-xs text-gray-400 dark:text-gray-500">{message.createTime || '--'}</div>
              </div>
            </div>

            <div className="mt-3 flex items-end justify-between gap-3">
              <p className={`line-clamp-2 text-sm leading-6 ${
                message.isRead
                  ? 'text-gray-400 dark:text-gray-500'
                  : 'text-gray-600 dark:text-gray-300'
              }`}>
                {preview}
              </p>
              <div className="flex shrink-0 items-center text-xs font-medium text-rose-500 dark:text-rose-300">
                查看
                <ChevronRight size={14} />
              </div>
            </div>
          </div>
        </div>
      </button>
    );
  };

  const renderContent = () => {
    if (loading) {
      return renderSkeleton();
    }

    if (error) {
      return <ErrorState message={getErrorMessage(error)} onRetry={retry} />;
    }

    if (messages.length === 0) {
      return (
        <EmptyState
          icon={<BellRing size={48} />}
          message={buildEmptyMessage(activeScope, activeCategory)}
          actionText={activeScope === 'unread' || activeCategory !== 'all' ? '查看全部消息' : undefined}
          onAction={
            activeScope === 'unread' || activeCategory !== 'all'
              ? () => {
                  setActiveScope('all');
                  setActiveCategory('all');
                }
              : undefined
          }
        />
      );
    }

    return <div className="space-y-3 p-3 pb-safe">{messages.map(renderMessageItem)}</div>;
  };

  return (
    <div className="relative flex h-full flex-1 flex-col overflow-hidden bg-bg-base">
      {isOffline && (
        <OfflineBanner
          center
          message="网络连接已断开，请检查后重试"
          className="sticky top-0 z-50 bg-red-50 text-text-price dark:bg-red-500/14 dark:text-red-300"
        />
      )}

      <PageHeader
        title="消息中心"
        onBack={goBack}
        rightAction={
          hasUnreadVisible && !loading && !error ? (
            <button
              type="button"
              onClick={() => void handleMarkAllRead()}
              disabled={markAllLoading}
              className="inline-flex min-h-[32px] items-center gap-1 rounded-full px-2 py-1 text-sm text-text-sub transition-opacity active:opacity-70 disabled:opacity-50"
            >
              <CheckCircle2 size={14} />
              {markAllLoading ? '处理中' : '全部已读'}
            </button>
          ) : null
        }
        className="border-b border-border-light bg-bg-card"
        contentClassName="h-11 px-3"
        titleClassName="text-2xl font-medium text-text-main"
        backButtonClassName="text-text-main"
      />

      <PullToRefreshContainer
        className="relative flex-1 overflow-y-auto no-scrollbar"
        onRefresh={handleRefresh}
        disabled={isOffline || markAllLoading || pendingMessageKey !== null}
      >
        <div ref={scrollContainerRef} className="pb-safe">
          {renderSummary()}
          {renderScopeTabs()}
          {renderCategoryTabs()}
          {renderContent()}
        </div>
      </PullToRefreshContainer>
    </div>
  );
};
