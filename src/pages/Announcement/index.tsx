/**
 * @file Announcement/index.tsx - 公告中心页面
 * @description 展示系统公告列表（支持置顶、按时间排序），点击查看公告详情，支持下拉刷新。
 */

import { useMemo, useRef, useState } from 'react'; // React 核心 Hook
import { announcementApi, type AnnouncementItem } from '../../api';
import { getErrorMessage } from '../../api/core/errors';
import { OfflineBanner } from '../../components/layout/OfflineBanner';
import { PageHeader } from '../../components/layout/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { PullToRefreshContainer } from '../../components/ui/PullToRefreshContainer';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useRequest } from '../../hooks/useRequest';
import { useRouteScrollRestoration } from '../../hooks/useRouteScrollRestoration';
import { useViewScrollSnapshot } from '../../hooks/useViewScrollSnapshot';
import { useAppNavigate } from '../../lib/navigation';

/**
 * AnnouncementPage - 公告中心页面
 * 功能：公告列表（置顶优先、时间倒序） → 点击查看详情 → 下拉刷新
 */
export const AnnouncementPage = () => {
  const { goBack } = useAppNavigate();
  const { isOffline } = useNetworkStatus();
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementItem | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const {
    data: announcements = [],
    error,
    loading,
    reload,
  } = useRequest((signal) => announcementApi.list(signal), {
    cacheKey: 'announcement:list',
  });

  /** 排序后的公告列表：置顶优先，同级别按时间倒序 */
  const sortedAnnouncements = useMemo(() => {
    return [...announcements].sort((left, right) => {
      if (left.isPinned !== right.isPinned) {
        return Number(right.isPinned) - Number(left.isPinned);
      }

      return right.time.localeCompare(left.time);
    });
  }, [announcements]);

  /** 重试加载 */
  const retry = () => {
    void reload().catch(() => undefined);
  };

  useRouteScrollRestoration({
    containerRef: scrollContainerRef,
    enabled: !selectedAnnouncement,
    namespace: 'announcement-page',
    restoreDeps: [loading, sortedAnnouncements.length],
    restoreWhen: !selectedAnnouncement && !loading && !error,
  });

  useViewScrollSnapshot({
    active: !selectedAnnouncement,
    containerRef: scrollContainerRef,
  });

  /** 返回处理：详情视图返回列表，列表视图返回上一页 */
  const handleBack = () => {
    if (selectedAnnouncement) {
      setSelectedAnnouncement(null);
      return;
    }

    goBack();
  };

  /** 渲染加载骨架屏 */
  const renderSkeleton = () => (
    <div className="space-y-3 p-3">
      {[1, 2, 3].map((item) => (
        <div key={item} className="animate-pulse rounded-xl bg-white p-4 dark:bg-gray-900">
          <div className="mb-3 h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-800" />
          <div className="mb-3 h-3 w-1/4 rounded bg-gray-200 dark:bg-gray-800" />
          <div className="mb-2 h-3 w-full rounded bg-gray-200 dark:bg-gray-800" />
          <div className="h-3 w-2/3 rounded bg-gray-200 dark:bg-gray-800" />
        </div>
      ))}
    </div>
  );

  /** 渲染公告列表（加载中 / 错误 / 空状态 / 正常列表） */
  const renderList = () => {
    if (loading) {
      return renderSkeleton();
    }

    if (error) {
      return <ErrorState message={getErrorMessage(error)} onRetry={retry} />;
    }

    if (sortedAnnouncements.length === 0) {
      return <EmptyState message="暂无公告" />;
    }

    return (
      <div className="space-y-3 p-3 pb-safe">
        {sortedAnnouncements.map((item) => (
          <button
            key={item.id}
            type="button"
            className="block w-full rounded-xl bg-white p-4 text-left transition-colors active:bg-gray-50 dark:bg-gray-900 dark:active:bg-gray-800"
            onClick={() => setSelectedAnnouncement(item)}
          >
            <div className="mb-2 flex items-start">
              {item.isPinned && (
                <span className="mt-0.5 mr-2 shrink-0 rounded-sm bg-[#ffe4e4] px-1.5 py-0.5 text-xs font-medium text-text-price">
                  置顶
                </span>
              )}
              <h3 className="line-clamp-2 text-lg font-medium leading-snug text-gray-900 dark:text-gray-100">
                {item.title}
              </h3>
            </div>
            <div className="mb-2 text-sm text-gray-400 dark:text-gray-500">{item.time}</div>
            <p className="line-clamp-2 text-base leading-relaxed text-gray-600 dark:text-gray-400">
              {item.summary}
            </p>
          </button>
        ))}
      </div>
    );
  };

  /** 渲染公告详情视图 */
  const renderDetail = () => {
    if (!selectedAnnouncement) {
      return null;
    }

    return (
      <div className="relative flex h-full flex-1 flex-col bg-white dark:bg-gray-900">
        <div className="flex-1 overflow-y-auto p-5 pb-24">
          <h2 className="mb-3 text-4xl font-bold leading-snug text-gray-900 dark:text-gray-100">
            {selectedAnnouncement.title}
          </h2>
          <div className="mb-6 border-b border-gray-100 pb-4 text-base text-gray-400 dark:border-gray-800 dark:text-gray-500">
            发布时间：{selectedAnnouncement.time}
          </div>
          <div className="whitespace-pre-wrap text-lg leading-loose text-gray-700 dark:text-gray-300">
            {selectedAnnouncement.content}
          </div>
        </div>
        <div className="absolute right-0 bottom-0 left-0 z-40 border-t border-gray-100 bg-white px-4 py-3 pb-safe dark:border-gray-800 dark:bg-gray-900">
          <button
            type="button"
            onClick={() => setSelectedAnnouncement(null)}
            className="h-[40px] w-full rounded-full bg-gradient-to-r from-brand-start to-brand-end text-lg font-medium text-white transition-opacity active:opacity-80"
          >
            我知道了
          </button>
        </div>
      </div>
    );
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
        title={selectedAnnouncement ? '公告详情' : '公告中心'}
        onBack={handleBack}
        className="border-b border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900"
        contentClassName="h-11 px-3"
        titleClassName="text-2xl font-medium text-gray-900 dark:text-gray-100"
        backButtonClassName="text-gray-900 dark:text-gray-100"
      />

      <PullToRefreshContainer
        className="relative flex-1 overflow-y-auto no-scrollbar"
        onRefresh={async () => {
          await reload().catch(() => undefined);
        }}
        disabled={isOffline || Boolean(selectedAnnouncement)}
      >
        <div ref={scrollContainerRef}>
          {selectedAnnouncement ? renderDetail() : renderList()}
        </div>
      </PullToRefreshContainer>
    </div>
  );
};




