import { useMemo } from 'react';
import { Clock3, Eye, Sparkles } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { announcementApi } from '../../api';
import { getErrorMessage } from '../../api/core/errors';
import { PageHeader } from '../../components/layout/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { PullToRefreshContainer } from '../../components/ui/PullToRefreshContainer';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useRequest } from '../../hooks/useRequest';
import { useAppNavigate } from '../../lib/navigation';

function hasHtmlMarkup(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

function renderContent(content: string) {
  if (!content.trim()) {
    return <EmptyState message="暂无公告内容" />;
  }

  if (hasHtmlMarkup(content)) {
    return (
      <div
        className="text-[15px] leading-8 text-text-main [&_a]:break-all [&_a]:text-primary-start [&_img]:mx-auto [&_img]:my-4 [&_img]:max-w-full [&_p]:mb-4 [&_table]:w-full [&_td]:border [&_td]:border-border-light [&_td]:p-2 [&_th]:border [&_th]:border-border-light [&_th]:bg-bg-base [&_th]:p-2 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-5"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  return <div className="whitespace-pre-wrap text-[15px] leading-8 text-text-main">{content}</div>;
}

function AnnouncementDetailSkeleton() {
  return (
    <div className="space-y-4 px-4 py-4">
      <div className="rounded-[28px] bg-white p-5 shadow-soft">
        <div className="mb-3 h-5 w-20 animate-pulse rounded-full bg-border-light" />
        <div className="mb-3 h-8 w-4/5 animate-pulse rounded-2xl bg-border-light" />
        <div className="h-4 w-2/5 animate-pulse rounded-xl bg-border-light" />
      </div>
      <div className="rounded-[28px] bg-white p-5 shadow-soft">
        {[0, 1, 2, 3, 4].map((item) => (
          <div key={item} className="mb-3 h-4 animate-pulse rounded-xl bg-border-light last:mb-0" />
        ))}
      </div>
    </div>
  );
}

export const AnnouncementDetailPage = () => {
  const { id = '' } = useParams();
  const { goBackOr } = useAppNavigate();
  const { isOffline } = useNetworkStatus();

  const {
    data: announcement,
    error,
    loading,
    reload,
  } = useRequest((signal) => announcementApi.detail(id, signal), {
    cacheKey: `announcement:detail:${id}`,
    deps: [id],
    keepPreviousData: false,
    manual: !id,
  });

  const rightAction = useMemo(
    () =>
      announcement ? (
        <div className="flex items-center gap-1 rounded-full bg-bg-base px-3 py-1 text-[11px] text-text-aux">
          <Eye size={12} />
          <span>{announcement.isRead ? '已读' : '公告'}</span>
        </div>
      ) : null,
    [announcement],
  );

  const handleRefresh = async () => {
    await reload().catch(() => undefined);
  };

  const renderBody = () => {
    if (!id) {
      return <EmptyState message="缺少公告编号" />;
    }

    if (loading && !announcement) {
      return <AnnouncementDetailSkeleton />;
    }

    if (error) {
      return <ErrorState message={getErrorMessage(error)} onRetry={() => void reload().catch(() => undefined)} />;
    }

    if (!announcement) {
      return <EmptyState message="公告不存在或已删除" />;
    }

    return (
      <div className="space-y-4 px-4 py-4 pb-8">
        <section className="relative overflow-hidden rounded-[28px] border border-white/60 bg-white shadow-[0_18px_44px_rgba(15,23,42,0.08)]">
          <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top_right,rgba(255,106,92,0.18),transparent_48%),linear-gradient(135deg,rgba(255,247,237,0.9),rgba(255,255,255,0))]" />
          <div className="relative px-5 pb-6 pt-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#fff0ec] px-3 py-1 text-[12px] font-medium text-[#d94f33]">
                {announcement.typeText}
              </span>
              {announcement.isPinned && (
                <span className="rounded-full bg-[#fff6dd] px-3 py-1 text-[12px] font-medium text-[#b7791f]">
                  置顶
                </span>
              )}
              <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 text-[12px] text-text-aux backdrop-blur">
                <Sparkles size={12} />
                <span>平台通知</span>
              </span>
            </div>

            <h2 className="mt-4 text-[24px] font-bold leading-9 text-text-main">{announcement.title}</h2>

            <div className="mt-5 flex flex-wrap gap-3 text-[12px] text-text-aux">
              <span className="inline-flex items-center gap-1">
                <Clock3 size={12} />
                <span>{announcement.time || '未设置发布时间'}</span>
              </span>
              <span className="rounded-full bg-bg-base px-3 py-1">{announcement.isRead ? '已读公告' : '待阅读'}</span>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] bg-white px-5 py-6 shadow-soft">
          {renderContent(announcement.content)}
        </section>
      </div>
    );
  };

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-bg-base">
      <PageHeader
        title="公告详情"
        onBack={() => goBackOr('announcement')}
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
