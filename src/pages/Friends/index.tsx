/**
 * @file Friends/index.tsx - 我的好友页面
 * @description 展示用户团队好友列表，支持一级/二级筛选、搜索、加载更多、复制邀请码。
 */

import React, { useRef, useState, useCallback, useEffect } from 'react'; // React 核心 Hook
import {
  ChevronLeft, Search, Copy, QrCode, UserPlus,
  Users, ShieldCheck, ShieldAlert, ChevronRight,
  WifiOff, RefreshCcw, User, Info, XCircle,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { useRouteScrollRestoration } from '../../hooks/useRouteScrollRestoration';
import { useSessionState } from '../../hooks/useSessionState';
import { useAppNavigate } from '../../lib/navigation';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { copyToClipboard } from '../../lib/clipboard';
import { teamApi, type TeamMember, type TeamOverviewData } from '../../api';

const FILTERS = [
  { id: 'all', label: '全部', level: 0 },
  { id: 'level1', label: '一级直推', level: 1 },
  { id: 'level2', label: '二级间推', level: 2 },
];

/**
 * FriendsPage - 我的好友页面
 * 功能：统计概览 → 搜索/筛选 → 好友列表 → 加载更多 → 邀请好友
 */
export const FriendsPage = () => {
  const { goTo, goBack } = useAppNavigate();
  const { showToast } = useFeedback();

  const [loading, setLoading] = useState(true);
  const [moduleError, setModuleError] = useState(false);
  const [overview, setOverview] = useState<TeamOverviewData | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [searchQuery, setSearchQuery] = useSessionState('friends-page:search', '');
  const [activeFilter, setActiveFilter] = useSessionState('friends-page:filter', 'all');
  const [showRulesModal, setShowRulesModal] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const activeLevel = FILTERS.find(f => f.id === activeFilter)?.level ?? 0;

  const loadData = useCallback(async (resetPage = true) => {
    if (resetPage) {
      setLoading(true);
      setPage(1);
    }
    setModuleError(false);

    try {
      const currentPage = resetPage ? 1 : page;

      const [overviewData, membersData] = await Promise.all([
        resetPage ? teamApi.getOverview() : Promise.resolve(overview),
        teamApi.getMembers({ level: activeLevel || undefined, page: currentPage, page_size: 20 }),
      ]);

      if (overviewData) setOverview(overviewData);
      setMembers(resetPage ? membersData.list : [...members, ...membersData.list]);
      setTotal(membersData.total);
      setHasMore(membersData.list.length >= 20);
    } catch {
      if (resetPage) setModuleError(true);
      else showToast('加载更多失败');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [activeLevel, page, overview, members, showToast]);

  useEffect(() => {
    void loadData(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter]);

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    teamApi.getMembers({ level: activeLevel || undefined, page: nextPage, page_size: 20 })
      .then(data => {
        setMembers(prev => [...prev, ...data.list]);
        setHasMore(data.list.length >= 20);
      })
      .catch(() => showToast('加载更多失败'))
      .finally(() => setLoadingMore(false));
  };

  const handleCopy = async (text: string) => {
    const ok = await copyToClipboard(text);
    showToast({ message: ok ? '已复制' : '复制失败，请稍后重试', type: ok ? 'success' : 'error' });
  };

  const filteredMembers = searchQuery
    ? members.filter(m =>
        m.nickname.includes(searchQuery) ||
        m.mobile.includes(searchQuery) ||
        String(m.id).includes(searchQuery))
    : members;

  useRouteScrollRestoration({
    containerRef: scrollContainerRef,
    namespace: `friends-page:${activeFilter}`,
    restoreDeps: [activeFilter, loading, searchQuery, filteredMembers.length],
    restoreWhen: !loading && !moduleError,
  });

  const renderHeader = () => (
    <div className="sticky top-0 z-40 bg-bg-base/90 backdrop-blur-md">
      <div className="flex items-center justify-between px-4 h-12">
        <button onClick={() => goBack()} className="p-1 -ml-1 active:opacity-70 text-text-main">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-2xl font-medium text-text-main">我的好友</h1>
        <button
          className="bg-gradient-to-r from-primary-start to-primary-end text-white text-sm font-medium px-3 py-1.5 rounded-full shadow-sm active:opacity-80 flex items-center"
          onClick={() => goTo('/invite')}
        >
          <UserPlus size={14} className="mr-1" /> 邀请
        </button>
      </div>
    </div>
  );

  if (moduleError) {
    return (
      <div className="flex-1 flex flex-col bg-bg-base h-full">
        {renderHeader()}
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <RefreshCcw size={48} className="text-text-aux mb-4" />
          <p className="text-lg text-text-main mb-2">页面加载失败</p>
          <p className="text-base text-text-sub mb-6 text-center">请检查网络连接后重试</p>
          <button
            onClick={() => loadData(true)}
            className="px-6 py-2 bg-gradient-to-r from-primary-start to-primary-end text-white rounded-full text-md font-medium shadow-sm active:opacity-80"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-red-50/30 relative h-full">
      {renderHeader()}

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto no-scrollbar pb-6">
        <div className="px-4 py-4">

          {/* Stats Overview */}
          <Card className="p-4 mb-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary-start/5 to-transparent rounded-bl-full pointer-events-none" />
            {loading ? (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <Skeleton className="w-16 h-10" />
                  <Skeleton className="w-16 h-10" />
                  <Skeleton className="w-16 h-10" />
                </div>
                <Skeleton className="w-full h-14 rounded-xl" />
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4 px-2">
                  <div className="flex flex-col items-center">
                    <span className="text-sm text-text-sub mb-1">好友总数</span>
                    <span className="text-4xl font-bold text-text-main">{overview?.team_total ?? 0}</span>
                  </div>
                  <div className="w-px h-8 bg-border-light" />
                  <div className="flex flex-col items-center">
                    <span className="text-sm text-text-sub mb-1">今日新增</span>
                    <span className="text-4xl font-bold text-primary-start">+{overview?.today_register ?? 0}</span>
                  </div>
                  <div className="w-px h-8 bg-border-light" />
                  <div className="flex flex-col items-center">
                    <span className="text-sm text-text-sub mb-1">一级直推</span>
                    <span className="text-4xl font-bold text-text-main">{overview?.level1_count ?? 0}</span>
                  </div>
                </div>
                {overview?.invite_code && (
                  <div className="bg-bg-base/80 rounded-xl p-3 flex items-center justify-between border border-border-light/50">
                    <div>
                      <div className="text-s text-text-sub mb-0.5">我的专属邀请码</div>
                      <div className="text-xl font-bold text-text-main tracking-wider">{overview.invite_code}</div>
                    </div>
                    <div className="flex items-center">
                      <button
                        className="flex items-center justify-center w-8 h-8 rounded-full bg-white dark:bg-gray-900 shadow-sm mr-2 text-text-main active:opacity-70 border border-border-light/50"
                        onClick={() => {
                          if (overview?.qrcode_url) window.open(overview.qrcode_url, '_blank');
                        }}
                      >
                        <QrCode size={14} />
                      </button>
                      <button
                        className="flex items-center justify-center px-3 h-8 rounded-full bg-white dark:bg-gray-900 shadow-sm text-sm font-medium text-text-main active:opacity-70 border border-border-light/50"
                        onClick={() => handleCopy(overview.invite_code)}
                      >
                        <Copy size={12} className="mr-1" /> 复制
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </Card>

          {/* Search & Filter */}
          <div className="mb-4">
            <div className="flex items-center bg-white dark:bg-gray-900 rounded-full px-3 py-2 mb-3 shadow-sm border border-border-light">
              <Search size={16} className="text-text-aux mr-2 shrink-0" />
              <input
                type="text"
                placeholder="搜索手机号/昵称/ID"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-md outline-none text-text-main placeholder:text-text-aux min-w-0"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="p-1 text-text-aux active:text-text-sub shrink-0">
                  <XCircle size={14} />
                </button>
              )}
            </div>
            <div className="flex items-center overflow-x-auto no-scrollbar pb-1 -mx-4 px-4">
              {FILTERS.map(f => (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id)}
                  className={`whitespace-nowrap px-4 py-1.5 rounded-full text-base mr-2 transition-colors shrink-0 ${
                    activeFilter === f.id
                      ? 'bg-red-50 text-primary-start font-medium border border-primary-start/30'
                      : 'bg-white dark:bg-gray-900 text-text-sub border border-border-light shadow-sm'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Friend List */}
          <div className="space-y-3">
            {loading ? (
              [1, 2, 3].map(i => (
                <Card key={i} className="p-3 flex items-center">
                  <Skeleton className="w-12 h-12 rounded-full mr-3 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="w-32 h-4" />
                    <Skeleton className="w-48 h-3" />
                    <Skeleton className="w-full h-3" />
                  </div>
                </Card>
              ))
            ) : filteredMembers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Users size={48} className="text-text-aux mb-4 opacity-30" strokeWidth={1.5} />
                <p className="text-md text-text-main mb-2">暂无符合条件的好友</p>
                <p className="text-sm text-text-sub mb-6">快去邀请更多好友加入吧</p>
                <button
                  className="px-6 py-2 bg-gradient-to-r from-primary-start to-primary-end text-white rounded-full text-md font-medium shadow-sm active:opacity-80"
                  onClick={() => goTo('/invite')}
                >
                  立即邀请好友
                </button>
              </div>
            ) : (
              filteredMembers.map(member => (
                <Card key={member.id} className="p-3 flex items-center active:bg-bg-base transition-colors cursor-pointer">
                  <div className="w-12 h-12 rounded-full bg-bg-base mr-3 overflow-hidden shrink-0 flex items-center justify-center border border-border-light relative">
                    {member.avatar ? (
                      <>
                        <img
                          src={member.avatar}
                          alt="avatar"
                          className="w-full h-full object-cover absolute inset-0 z-10"
                          referrerPolicy="no-referrer"
                          onError={e => { e.currentTarget.style.display = 'none'; }}
                        />
                        <User size={20} className="text-text-aux absolute z-0" />
                      </>
                    ) : (
                      <User size={20} className="text-text-aux" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center mb-1">
                      <span className="text-lg font-medium text-text-main truncate mr-2 max-w-[120px]">
                        {member.nickname || member.username}
                      </span>
                      {member.username && member.username !== '未实名' && (
                        <span className="bg-green-100 text-green-700 text-xs px-1.5 py-0.5 rounded flex items-center shrink-0">
                          <ShieldCheck size={10} className="mr-0.5" /> 已实名
                        </span>
                      )}
                      {member.username === '未实名' && (
                        <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs px-1.5 py-0.5 rounded flex items-center shrink-0">
                          未实名
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-text-sub mb-1.5 flex items-center">
                      <span className="font-mono">{member.mobile}</span>
                      <span className="mx-1.5 text-border-light">|</span>
                      <span>{member.level_text}</span>
                    </div>
                    <div className="text-s text-text-aux">
                      注册: {member.register_time}
                    </div>
                  </div>
                  <div className="ml-2 text-text-aux shrink-0">
                    <ChevronRight size={16} />
                  </div>
                </Card>
              ))
            )}

            {/* Load More */}
            {!loading && filteredMembers.length > 0 && hasMore && !searchQuery && (
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="w-full py-3 text-sm text-text-sub active:text-text-main"
              >
                {loadingMore ? '加载中...' : '加载更多'}
              </button>
            )}
          </div>

          {/* Bottom Hint */}
          {!loading && filteredMembers.length > 0 && (
            <div className="mt-6 mb-4 flex justify-center">
              <button
                className="text-sm text-text-aux flex items-center active:text-text-main transition-colors"
                onClick={() => setShowRulesModal(true)}
              >
                好友规则与有效口径说明 <Info size={12} className="ml-1" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Rules Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowRulesModal(false)} />
          <Card className="w-full max-w-[320px] relative z-10 p-6 flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-text-main">好友规则说明</h3>
              <button onClick={() => setShowRulesModal(false)} className="text-text-aux active:text-text-main">
                <XCircle size={20} />
              </button>
            </div>
            <div className="space-y-4 text-base text-text-sub max-h-[60vh] overflow-y-auto no-scrollbar">
              <div>
                <h4 className="font-medium text-text-main mb-1">1. 好友层级</h4>
                <p>一级直推：通过您的邀请码直接注册的用户。二级间推：您的一级好友邀请注册的用户。</p>
              </div>
              <div>
                <h4 className="font-medium text-text-main mb-1">2. 邀请奖励</h4>
                <p>每成功邀请一名好友注册，您将获得相应奖励，具体以当前活动规则为准。</p>
              </div>
              <div>
                <h4 className="font-medium text-text-main mb-1">3. 状态说明</h4>
                <p>• <span className="text-green-600">已实名</span>：已完成身份认证，可正常参与平台活动。</p>
                <p>• <span className="text-gray-600 dark:text-gray-400">未实名</span>：仅注册未认证，部分功能受限。</p>
              </div>
            </div>
            <button
              className="w-full mt-6 py-2.5 bg-bg-base text-text-main rounded-full text-md font-medium active:bg-border-light transition-colors"
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
