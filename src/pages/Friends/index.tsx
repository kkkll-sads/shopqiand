/**
 * @file Friends/index.tsx - 我的团队页面
 * @description 展示团队概览、一级/二级/今日推荐筛选、好友列表、推广名片。
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  ChevronLeft,
  Copy,
  QrCode,
  UserPlus,
  Users,
  ShieldCheck,
  ChevronRight,
  WifiOff,
  RefreshCcw,
  User,
  Info,
  XCircle,
  Loader2,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { PullToRefreshContainer } from '../../components/ui/PullToRefreshContainer';
import { Skeleton } from '../../components/ui/Skeleton';
import { useRouteScrollRestoration } from '../../hooks/useRouteScrollRestoration';
import { useSessionState } from '../../hooks/useSessionState';
import { useAppNavigate } from '../../lib/navigation';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { copyToClipboard } from '../../lib/clipboard';
import { teamApi, type TeamMember, type TeamOverviewData } from '../../api';

function isTodayRegister(registerTime: string | undefined): boolean {
  if (!registerTime) return false;
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '-');
  const regDate = registerTime.slice(0, 10);
  return regDate === today;
}

/**
 * FriendsPage - 我的团队页面
 */
export const FriendsPage = () => {
  const { goTo, goBack } = useAppNavigate();
  const { showToast } = useFeedback();

  const [loading, setLoading] = useState(true);
  const [moduleError, setModuleError] = useState(false);
  const [overview, setOverview] = useState<TeamOverviewData | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const [activeTab, setActiveTab] = useSessionState<'all' | 'level1' | 'level2' | 'today'>(
    'friends-page:tab',
    'all',
  );

  const activeLevel = activeTab === 'level1' ? 1 : activeTab === 'level2' ? 2 : undefined;
  const loadTodayOnly = activeTab === 'today';

  const loadData = useCallback(
    async (resetPage = true) => {
      if (resetPage) {
        setLoading(true);
        setPage(1);
      }
      setModuleError(false);

      try {
        const currentPage = resetPage ? 1 : page;
        const shouldLoadMembers = activeTab !== 'today' || currentPage === 1;

        const [overviewData, membersData] = await Promise.all([
          resetPage ? teamApi.getOverview() : Promise.resolve(overview),
          shouldLoadMembers
            ? teamApi.getMembers({ level: activeLevel, page: currentPage, page_size: 20 })
            : Promise.resolve({ list: [], total: 0, page: 1, page_size: 20 }),
        ]);

        if (overviewData) setOverview(overviewData);
        if (shouldLoadMembers) {
          const list = loadTodayOnly
            ? membersData.list.filter((m) => isTodayRegister(m.register_time))
            : membersData.list;
          setMembers(resetPage ? list : [...members, ...list]);
          setHasMore(membersData.list.length >= 20);
        }
      } catch {
        if (resetPage) setModuleError(true);
        else showToast({ message: '加载更多失败', type: 'error' });
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [activeTab, activeLevel, loadTodayOnly, page, overview, members, showToast],
  );

  useEffect(() => {
    void loadData(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    teamApi
      .getMembers({ level: activeLevel, page: nextPage, page_size: 20 })
      .then((data) => {
        const list =
          loadTodayOnly ? data.list.filter((m) => isTodayRegister(m.register_time)) : data.list;
        setMembers((prev) => [...prev, ...list]);
        setHasMore(data.list.length >= 20);
      })
      .catch(() => showToast({ message: '加载更多失败', type: 'error' }))
      .finally(() => setLoadingMore(false));
  };

  const handleCopy = useCallback(
    async (text: string) => {
      const ok = await copyToClipboard(text);
      showToast({ message: ok ? '已复制' : '复制失败，请稍后重试', type: ok ? 'success' : 'error' });
    },
    [showToast],
  );

  const handleRefresh = useCallback(async () => {
    await loadData(true);
  }, [loadData]);

  const displayMembers = loadTodayOnly ? members : members;

  useRouteScrollRestoration({
    containerRef: scrollContainerRef,
    namespace: `friends-page:${activeTab}`,
    restoreDeps: [activeTab, loading, displayMembers.length],
    restoreWhen: !loading && !moduleError,
  });

  const renderHeader = () => (
    <div className="sticky top-0 z-40 shrink-0 border-b border-border-light bg-white dark:bg-gray-900">
      <div className="flex h-12 items-center justify-between px-4">
        <button onClick={() => goBack()} className="-ml-1 p-1 text-text-main active:opacity-70">
          <ChevronLeft size={20} />
        </button>
        <span className="text-[17px] font-medium text-text-main">我的团队</span>
        <button
          onClick={() => goTo('/invite')}
          className="flex items-center gradient-primary-r rounded-full px-3 py-1.5 text-sm font-medium text-white shadow-sm active:opacity-80"
        >
          <UserPlus size={14} className="mr-1" /> 邀请
        </button>
      </div>
    </div>
  );

  const renderOverview = () => {
    if (loading || !overview) {
      return (
        <div className="relative overflow-hidden bg-gradient-to-br from-primary-start to-primary-end p-4 text-white">
          <Skeleton className="h-24 w-full rounded-xl bg-white/20" />
        </div>
      );
    }

    return (
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-start to-primary-end p-4 text-white">
        <div className="absolute -top-[20%] -right-[10%] h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-[20%] -left-[10%] h-32 w-32 rounded-full bg-white/10 blur-xl" />

        <div className="relative z-10">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <div className="mb-1 text-[13px] text-white/80">团队总人数 (人)</div>
              <div className="text-[32px] font-bold leading-none">{overview.team_total}</div>
            </div>
            <div className="text-right">
              <div className="mb-1 text-[13px] text-white/80">今日新增 (人)</div>
              <div className="text-[20px] font-bold leading-none">+{overview.today_register}</div>
            </div>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-white/10 p-3 backdrop-blur-sm">
              <div className="mb-1 text-[11px] text-white/80">直推交易用户</div>
              <div className="text-[16px] font-bold">
                {overview.level1_active_count ?? 0}
              </div>
            </div>
            <div className="rounded-xl bg-white/10 p-3 backdrop-blur-sm">
              <div className="mb-1 text-[11px] text-white/80">间推交易用户</div>
              <div className="text-[16px] font-bold">
                {overview.level2_active_count ?? 0}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-white/10 p-3 backdrop-blur-sm">
            <div className="flex items-center space-x-2">
              <span className="text-[12px] text-white/80">邀请码:</span>
              <span className="text-[14px] font-bold tracking-wider">{overview.invite_code}</span>
              <button
                type="button"
                onClick={() => handleCopy(overview.invite_code)}
                className="p-1 active:opacity-70"
              >
                <Copy size={14} className="text-white/80" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => goTo('/invite')}
              className="flex items-center space-x-1 rounded-full bg-white px-3 py-1.5 text-[12px] font-medium text-primary-start active:opacity-90"
            >
              <QrCode size={14} />
              <span>推广名片</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderTabs = () => {
    const tabs = [
      { id: 'all' as const, label: '全部' },
      { id: 'level1' as const, label: `直推(${overview?.level1_count ?? 0})` },
      { id: 'level2' as const, label: `间推(${overview?.level2_count ?? 0})` },
      { id: 'today' as const, label: '今日推荐' },
    ];

    return (
      <div className="sticky top-0 z-10 flex border-b border-border-light bg-white px-2 dark:bg-gray-900">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            role="tab"
            tabIndex={0}
            className={`relative flex-1 py-3 text-center text-[13px] font-medium transition-colors ${
              activeTab === tab.id ? 'text-primary-start' : 'text-text-sub'
            }`}
            onClick={() => setActiveTab(tab.id)}
            onKeyDown={(e) => e.key === 'Enter' && setActiveTab(tab.id)}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-1/2 h-[3px] w-6 -translate-x-1/2 rounded-t-full bg-primary-start" />
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderList = () => {
    if (loading) {
      return (
        <div className="space-y-3 p-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex items-center space-x-3 rounded-xl bg-white p-3 dark:bg-gray-900"
            >
              <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (displayMembers.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <Users size={48} className="mb-4 text-border-main" strokeWidth={1} />
          <p className="text-[14px] text-text-sub">暂无团队成员</p>
        </div>
      );
    }

    return (
      <div className="space-y-3 p-4">
        {displayMembers.map((member) => (
          <div
            key={member.id}
            role="button"
            tabIndex={0}
            className="flex cursor-pointer items-center space-x-3 rounded-xl bg-white p-3 shadow-sm transition-transform active:scale-[0.98] dark:bg-gray-900"
            onClick={() => goTo(`/friends/${member.id}`)}
            onKeyDown={(e) => e.key === 'Enter' && goTo(`/friends/${member.id}`)}
          >
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              {member.avatar ? (
                <>
                  <img
                    src={member.avatar}
                    alt=""
                    className="absolute inset-0 z-10 h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <User size={20} className="absolute z-0 text-text-aux" />
                </>
              ) : (
                <User size={20} className="text-text-aux" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center justify-between gap-2">
                <h3 className="min-w-0 flex-1 truncate pr-2 text-[15px] font-medium text-text-main">
                  {member.username && member.username !== '未实名'
                    ? member.username
                    : member.nickname || member.username}
                </h3>
                <div className="flex shrink-0 flex-wrap items-center gap-1">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] ${
                      member.level === 1
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20'
                        : 'bg-orange-50 text-orange-600 dark:bg-orange-900/20'
                    }`}
                  >
                    {member.level_text}
                  </span>
                  {member.user_level_text && (
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                      {member.user_level_text}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 truncate text-[12px] text-text-sub">
                {member.username && member.username !== '未实名' && (
                  <span className="flex shrink-0 items-center text-green-600">
                    <ShieldCheck size={10} className="mr-0.5" /> 已实名
                  </span>
                )}
                {member.username === '未实名' && (
                  <span className="shrink-0 text-gray-500">未实名</span>
                )}
                <span className="truncate">注册时间: {member.register_time}</span>
              </div>
            </div>
            <ChevronRight size={16} className="shrink-0 text-text-aux" />
          </div>
        ))}

        {hasMore && activeTab !== 'today' && (
          <div className="flex justify-center py-4">
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="flex items-center text-[13px] text-text-sub active:opacity-70 disabled:opacity-50"
            >
              {loadingMore && <Loader2 size={14} className="mr-1 animate-spin" />}
              {loadingMore ? '加载中...' : '加载更多'}
            </button>
          </div>
        )}
      </div>
    );
  };

  if (moduleError) {
    return (
      <div className="flex h-full flex-1 flex-col bg-bg-base">
        {renderHeader()}
        <div className="flex flex-1 flex-col items-center justify-center p-6">
          <RefreshCcw size={48} className="mb-4 text-text-aux" />
          <p className="mb-2 text-lg text-text-main">页面加载失败</p>
          <p className="mb-6 text-center text-base text-text-sub">请检查网络连接后重试</p>
          <button
            type="button"
            onClick={() => loadData(true)}
            className="rounded-full bg-gradient-to-r from-primary-start to-primary-end px-6 py-2 text-base font-medium text-white shadow-sm active:opacity-80"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-1 flex-col overflow-hidden bg-bg-base">
      {renderHeader()}

      <PullToRefreshContainer onRefresh={handleRefresh} disabled={loading}>
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto no-scrollbar pb-safe">
        {renderOverview()}
        {renderTabs()}
        {renderList()}

        {!loading && displayMembers.length > 0 && (
          <div className="mb-4 mt-6 flex justify-center">
            <button
              type="button"
              className="flex items-center text-sm text-text-aux active:text-text-main"
              onClick={() => setShowRulesModal(true)}
            >
              好友规则与有效口径说明 <Info size={12} className="ml-1" />
            </button>
          </div>
        )}
      </div>
      </PullToRefreshContainer>

      {showRulesModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowRulesModal(false)}
          />
          <Card className="relative z-10 flex w-full max-w-[320px] flex-col p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-text-main">好友规则说明</h3>
              <button
                type="button"
                onClick={() => setShowRulesModal(false)}
                className="text-text-aux active:text-text-main"
              >
                <XCircle size={20} />
              </button>
            </div>
            <div className="max-h-[60vh] space-y-4 overflow-y-auto text-base text-text-sub">
              <div>
                <h4 className="mb-1 font-medium text-text-main">1. 好友层级</h4>
                <p>一级直推：通过您的邀请码直接注册的用户。二级间推：您的一级好友邀请注册的用户。</p>
              </div>
              <div>
                <h4 className="mb-1 font-medium text-text-main">2. 邀请奖励</h4>
                <p>每成功邀请一名好友注册，您将获得相应奖励，具体以当前活动规则为准。</p>
              </div>
              <div>
                <h4 className="mb-1 font-medium text-text-main">3. 状态说明</h4>
                <p>
                  • <span className="text-green-600">已实名</span>：已完成身份认证，可正常参与平台活动。
                </p>
                <p>
                  • <span className="text-gray-600 dark:text-gray-400">未实名</span>：仅注册未认证，部分功能受限。
                </p>
              </div>
            </div>
            <button
              type="button"
              className="mt-6 w-full rounded-full bg-bg-base py-2.5 text-base font-medium text-text-main active:bg-border-light"
              onClick={() => setShowRulesModal(false)}
            >
              我知道了
            </button>
          </Card>
        </div>
      )}
    </div>
  );
};
