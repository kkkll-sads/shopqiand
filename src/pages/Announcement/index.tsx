import { useMemo, useRef } from 'react';
import { ArrowRight, BellRing, Clock3 } from 'lucide-react';
import { announcementApi } from '../../api';
import { getErrorMessage } from '../../api/core/errors';
import { PageHeader } from '../../components/layout/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { PullToRefreshContainer } from '../../components/ui/PullToRefreshContainer';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useRequest } from '../../hooks/useRequest';
import { useRouteScrollRestoration } from '../../hooks/useRouteScrollRestoration';
import { useAppNavigate } from '../../lib/navigation';

function AnnouncementSkeleton() {
  return (
    <div className="space-y-4 px-4 py-4">
      <div className="rounded-[28px] border border-border-light bg-bg-card p-5 shadow-soft">
        <div className="mb-3 h-6 w-32 animate-pulse rounded-2xl bg-border-light" />
        <div className="mb-3 h-8 w-4/5 animate-pulse rounded-2xl bg-border-light" />
        <div className="h-4 w-2/5 animate-pulse rounded-xl bg-border-light" />
      </div>
      {[0, 1, 2].map((item) => (
        <div key={item} className="rounded-[28px] border border-border-light bg-bg-card p-5 shadow-soft">
          <div className="mb-4 h-5 w-20 animate-pulse rounded-full bg-border-light" />
          <div className="mb-3 h-6 w-4/5 animate-pulse rounded-2xl bg-border-light" />
          <div className="mb-3 h-4 w-2/5 animate-pulse rounded-xl bg-border-light" />
          <div className="mb-2 h-4 animate-pulse rounded-xl bg-border-light" />
          <div className="h-4 w-11/12 animate-pulse rounded-xl bg-border-light" />
        </div>
      ))}
    </div>
  );
}

export const AnnouncementPage = () => {
  const { goBackOr, navigate } = useAppNavigate();
  const { isOffline } = useNetworkStatus();
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const {
    data: announcements = [],
    error,
    loading,
    reload,
  } = useRequest((signal) => announcementApi.list(signal), {
    cacheKey: 'announcement:list',
  });

  const sortedAnnouncements = useMemo(
    () =>
      [...announcements].sort((left, right) => {
        if (left.isPinned !== right.isPinned) {
          return Number(right.isPinned) - Number(left.isPinned);
        }

        if (left.sortOrder !== right.sortOrder) {
          return right.sortOrder - left.sortOrder;
        }

        return right.timestamp - left.timestamp;
      }),
    [announcements],
  );

  useRouteScrollRestoration({
    containerRef: scrollContainerRef,
    namespace: 'announcement-page',
    restoreDeps: [loading, sortedAnnouncements.length],
    restoreWhen: !loading && !error,
  });

  const handleRefresh = async () => {
    await reload().catch(() => undefined);
  };

  const renderBody = () => {
    if (loading && sortedAnnouncements.length === 0) {
      return <AnnouncementSkeleton />;
    }

    if (error) {
      return <ErrorState message={getErrorMessage(error)} onRetry={() => void reload().catch(() => undefined)} />;
    }

    if (sortedAnnouncements.length === 0) {
      return <EmptyState message="暂无公告" />;
    }

    return (
      <div className="space-y-4 px-4 py-4 pb-8">
        <section className="relative overflow-hidden rounded-[28px] border border-border-light bg-bg-card shadow-[0_18px_44px_rgba(15,23,42,0.08)] dark:shadow-[0_18px_44px_rgba(0,0,0,0.22)]">
          <div className="absolute inset-y-0 right-0 w-32 bg-[radial-gradient(circle_at_center,rgba(255,106,92,0.18),transparent_70%)] dark:bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.18),transparent_70%)]" />
          <div className="relative flex items-start justify-between gap-4 px-5 py-5">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary-start/10 px-3 py-1 text-s font-medium text-primary-start">
                <BellRing size={13} />
                <span>公告中心</span>
              </div>
              <h2 className="mt-3 text-4xl font-bold text-text-main">查看平台最新通知与规则说明</h2>
              <p className="mt-2 text-sm leading-6 text-text-sub">
                当前共 {sortedAnnouncements.length} 条公告，点击卡片可进入详情页查看完整内容。
              </p>
            </div>
          </div>
        </section>

        {sortedAnnouncements.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => navigate(`/announcement/${item.id}`)}
            className="group block w-full rounded-[28px] border border-border-light bg-bg-card px-5 py-5 text-left shadow-[0_16px_36px_rgba(15,23,42,0.06)] transition-transform active:scale-[0.99] dark:shadow-[0_16px_36px_rgba(0,0,0,0.18)]"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary-start/10 px-3 py-1 text-s font-medium text-primary-start">
                {item.typeText}
              </span>
              {item.isPinned && (
                <span className="rounded-full bg-amber-50 px-3 py-1 text-s font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                  置顶
                </span>
              )}
              {item.isRead && (
                <span className="rounded-full bg-bg-base px-3 py-1 text-s text-text-aux">已读</span>
              )}
            </div>

            <h3 className="mt-4 line-clamp-2 text-2xl font-semibold leading-8 text-text-main">
              {item.title}
            </h3>

            <div className="mt-3 inline-flex items-center gap-1 text-s text-text-aux">
              <Clock3 size={12} />
              <span>{item.time || '未设置发布时间'}</span>
            </div>

            <p className="mt-4 line-clamp-3 text-base leading-7 text-text-sub">
              {item.summary || '点击查看公告详情'}
            </p>

            <div className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-primary-start">
              <span>查看详情</span>
              <ArrowRight size={14} className="transition-transform group-active:translate-x-0.5" />
            </div>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-bg-base">
      <PageHeader title="公告中心" onBack={() => goBackOr('home')} offline={isOffline} onRefresh={handleRefresh} />

      <PullToRefreshContainer onRefresh={handleRefresh} disabled={isOffline || loading}>
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto no-scrollbar">
          {renderBody()}
        </div>
      </PullToRefreshContainer>
    </div>
  );
};
