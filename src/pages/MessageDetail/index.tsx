import { useMemo } from 'react';
import { Clock3, ExternalLink, FileText } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { getErrorMessage } from '../../api/core/errors';
import { messageApi } from '../../api/modules/message';
import { PageHeader } from '../../components/layout/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { PullToRefreshContainer } from '../../components/ui/PullToRefreshContainer';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useRequest } from '../../hooks/useRequest';
import { useAppNavigate } from '../../lib/navigation';
import {
  resolveMessageActionText,
  resolveMessageSceneLabel,
  resolveMessageTargetPath,
  resolveMessageTitle,
} from '../../lib/messageCenter';

function hasHtmlMarkup(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

function renderContent(content: string) {
  if (!content.trim()) {
    return <EmptyState message="暂无消息内容" />;
  }

  if (hasHtmlMarkup(content)) {
    return (
      <div
        className="text-md leading-8 text-text-main [&_a]:break-all [&_a]:text-primary-start [&_img]:mx-auto [&_img]:my-4 [&_img]:max-w-full [&_p]:mb-4 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-5"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  return <div className="whitespace-pre-wrap text-md leading-8 text-text-main">{content}</div>;
}

function isExternalTarget(path: string) {
  return /^https?:\/\//i.test(path);
}

function MessageDetailSkeleton() {
  return (
    <div className="space-y-4 px-4 py-4">
      <div className="rounded-[28px] border border-border-light bg-bg-card p-5 shadow-soft">
        <div className="mb-3 h-5 w-20 animate-pulse rounded-full bg-border-light" />
        <div className="mb-3 h-8 w-4/5 animate-pulse rounded-2xl bg-border-light" />
        <div className="h-4 w-2/5 animate-pulse rounded-xl bg-border-light" />
      </div>
      <div className="rounded-[28px] border border-border-light bg-bg-card p-5 shadow-soft">
        {[0, 1, 2, 3, 4].map((item) => (
          <div key={item} className="mb-3 h-4 animate-pulse rounded-xl bg-border-light last:mb-0" />
        ))}
      </div>
    </div>
  );
}

export const MessageDetailPage = () => {
  const { messageKey: rawMessageKey = '' } = useParams();
  const messageKey = useMemo(() => {
    if (!rawMessageKey) {
      return '';
    }

    try {
      return decodeURIComponent(rawMessageKey);
    } catch {
      return rawMessageKey;
    }
  }, [rawMessageKey]);
  const { goBackOr, navigate } = useAppNavigate();
  const { isOffline } = useNetworkStatus();

  const {
    data: message,
    error,
    loading,
    reload,
  } = useRequest((signal) => messageApi.detail(messageKey, signal), {
    cacheKey: `message-center:detail:${messageKey}`,
    deps: [messageKey],
    keepPreviousData: false,
    manual: !messageKey,
  });

  const targetPath = message ? resolveMessageTargetPath(message) : null;
  const actionText = message ? resolveMessageActionText(message) : null;

  const handleRefresh = async () => {
    await reload().catch(() => undefined);
  };

  const handleOpenTarget = () => {
    if (!targetPath) {
      return;
    }

    if (isExternalTarget(targetPath)) {
      window.location.assign(targetPath);
      return;
    }

    navigate(targetPath);
  };

  const rightAction = useMemo(
    () =>
      message ? (
        <div className="flex items-center gap-1 rounded-full bg-bg-base px-3 py-1 text-xs text-text-aux">
          <FileText size={12} />
          <span>已读消息</span>
        </div>
      ) : null,
    [message],
  );

  const renderBody = () => {
    if (!messageKey) {
      return <EmptyState message="缺少消息编号" />;
    }

    if (loading && !message) {
      return <MessageDetailSkeleton />;
    }

    if (error) {
      return (
        <ErrorState
          message={getErrorMessage(error)}
          onRetry={() => void reload().catch(() => undefined)}
        />
      );
    }

    if (!message) {
      return <EmptyState message="消息不存在或已删除" />;
    }

    return (
      <div className="space-y-4 px-4 py-4 pb-8">
        <section className="relative overflow-hidden rounded-[28px] border border-border-light bg-bg-card shadow-[0_18px_44px_rgba(15,23,42,0.08)] dark:shadow-[0_18px_44px_rgba(0,0,0,0.22)]">
          <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top_right,rgba(255,106,92,0.18),transparent_48%),linear-gradient(135deg,rgba(255,247,237,0.9),rgba(255,255,255,0))] dark:bg-[radial-gradient(circle_at_top_right,rgba(239,68,68,0.18),transparent_48%),linear-gradient(135deg,rgba(127,29,29,0.22),rgba(15,23,42,0))]" />
          <div className="relative px-5 pb-6 pt-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary-start/10 px-3 py-1 text-s font-medium text-primary-start">
                {resolveMessageSceneLabel(message)}
              </span>
              {message.isBroadcast && (
                <span className="rounded-full bg-amber-50 px-3 py-1 text-s font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                  广播消息
                </span>
              )}
            </div>

            <h2 className="mt-4 text-4_5xl font-bold leading-9 text-text-main">
              {resolveMessageTitle(message)}
            </h2>

            <div className="mt-5 flex flex-wrap gap-3 text-s text-text-aux">
              <span className="inline-flex items-center gap-1">
                <Clock3 size={12} />
                <span>{message.createTime || '未设置发送时间'}</span>
              </span>
              <span className="rounded-full bg-bg-base px-3 py-1">
                {message.isRead ? '已读' : '未读'}
              </span>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-border-light bg-bg-card px-5 py-6 shadow-soft">
          {renderContent(message.content)}
        </section>

        {targetPath && actionText && (
          <div className="px-1">
            <button
              type="button"
              onClick={handleOpenTarget}
              className="flex h-[48px] w-full items-center justify-center gap-2 rounded-full gradient-primary-r text-base font-medium text-white shadow-sm active:opacity-90"
            >
              <span>{actionText}</span>
              <ExternalLink size={16} />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-bg-base">
      <PageHeader
        title="消息详情"
        onBack={() => goBackOr('message_center')}
        offline={isOffline}
        onRefresh={handleRefresh}
        rightAction={rightAction}
      />

      <PullToRefreshContainer onRefresh={handleRefresh} disabled={isOffline || loading}>
        <div className="flex-1 overflow-y-auto no-scrollbar">{renderBody()}</div>
      </PullToRefreshContainer>
    </div>
  );
};

export default MessageDetailPage;
