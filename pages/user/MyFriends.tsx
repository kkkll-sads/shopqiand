/**
 * MyFriends - 我的好友页面
 * 
 * 使用 PageContainer、LoadingSpinner、EmptyState 组件重构
 * 使用 formatTime 工具函数
 * 
 * @author 树交所前端团队
 * @version 2.1.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { UserPlus, Loader2 } from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer';
import { LoadingSpinner, EmptyState, ListItem } from '../../components/common';
import { fetchTeamMembers, normalizeAssetUrl } from '../../services/api';
import { Route } from '../../router/routes';
import { TeamMember } from '../../types';
import { formatTime } from '../../utils/format';

const PAGE_SIZE = 10;

/**
 * MyFriends 组件属性接口
 */
interface MyFriendsProps {
  onBack: () => void;
  onNavigate?: (route: Route) => void;
}

/**
 * MyFriends 我的好友页面组件
 */
const MyFriends: React.FC<MyFriendsProps> = ({ onBack, onNavigate }) => {
  const [friends, setFriends] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // 加载好友列表
  const loadTeamMembers = useCallback(async (pageNum: number, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await fetchTeamMembers({ page: pageNum, page_size: PAGE_SIZE });
      if ((response.code === 0 || response.code === 1) && response.data) {
        const newList = response.data.list || [];
        const totalCount = response.data.total || 0;

        if (append) {
          setFriends(prev => [...prev, ...newList]);
        } else {
          setFriends(newList);
        }
        setTotal(totalCount);
        setPage(pageNum);
        setHasMore(pageNum * PAGE_SIZE < totalCount);
      } else {
        setError(response.msg || '获取好友列表失败');
      }
    } catch (err: any) {
      console.error('加载好友列表失败:', err);
      setError(err.message || '获取好友列表失败，请稍后重试');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadTeamMembers(1, false);
  }, [loadTeamMembers]);

  // 滑动加载更多
  const handleScroll = useCallback(() => {
    if (!containerRef.current || loadingMore || !hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      loadTeamMembers(page + 1, true);
    }
  }, [loadingMore, hasMore, page, loadTeamMembers]);

  /**
   * 格式化日期
   */
  const formatDate = (timestamp?: number, dateStr?: string) => {
    if (dateStr) return dateStr;
    if (timestamp) {
      return formatTime(timestamp, 'YYYY-MM-DD');
    }
    return '';
  };

  return (
    <PageContainer title="我的好友" onBack={onBack}>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto"
      >
        {/* 邀请好友入口 */}
        <ListItem
          icon={
            <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center">
              <UserPlus size={20} />
            </div>
          }
          title="邀请好友"
          subtitle="邀请好友加入，共享艺术价值"
          onClick={() => onNavigate?.({ name: 'invite-friends' })}
        />

        {/* 好友列表标题 */}
        <h3 className="text-sm font-bold text-gray-800 mb-3 pl-1 mt-4">好友列表 ({total})</h3>

        {/* 加载状态 */}
        {loading && <LoadingSpinner text="加载中..." />}

        {/* 错误状态 */}
        {!loading && error && (
          <div className="text-center py-8 text-red-500">{error}</div>
        )}

        {/* 空状态 */}
        {!loading && !error && friends.length === 0 && (
          <EmptyState title="暂无好友" description="快去邀请好友吧" />
        )}

        {/* 好友列表 */}
        {!loading && !error && friends.length > 0 && (
          <div className="space-y-3 pb-4">
            {friends.map((friend) => (
              <div
                key={friend.id}
                className="bg-white p-3 rounded-xl shadow-sm flex items-center gap-3"
              >
                <img
                  src={
                    normalizeAssetUrl(friend.avatar) ||
                    '/static/images/avatar.png'
                  }
                  alt={friend.nickname || friend.username}
                  className="w-10 h-10 rounded-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/static/images/avatar.png';
                  }}
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-800">
                    {friend.nickname || friend.username}
                  </div>
                  <div className="text-xs text-gray-400">
                    加入时间: {formatDate(friend.join_time, friend.join_date)}
                  </div>
                </div>
                <button
                  onClick={() => onNavigate?.({ name: 'friend-detail', id: String(friend.id), friend })}
                  className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full"
                >
                  查看
                </button>
              </div>
            ))}

            {/* 加载更多指示器 */}
            {loadingMore && (
              <div className="py-3 flex items-center justify-center text-gray-400 text-xs">
                <Loader2 size={16} className="animate-spin mr-2" />
                加载中...
              </div>
            )}

            {/* 没有更多数据 */}
            {!hasMore && friends.length > 0 && (
              <div className="py-3 text-center text-gray-400 text-xs">
                已加载全部
              </div>
            )}
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default MyFriends;
