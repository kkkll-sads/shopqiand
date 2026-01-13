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
import { isSuccess, extractError } from '../../utils/apiHelpers';

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
  const [activeTab, setActiveTab] = useState<'direct' | 'indirect'>('direct');
  const containerRef = useRef<HTMLDivElement>(null);

  // 获取滚动容器
  const getScrollContainer = useCallback(() => {
    return containerRef.current?.parentElement?.parentElement as HTMLElement;
  }, []);

  // 自动滚动到底部的函数
  const scrollToBottom = useCallback(() => {
    const scrollContainer = getScrollContainer();
    if (!scrollContainer) {
      return;
    }

    // 使用 setTimeout 确保DOM已更新
    setTimeout(() => {
      // 留出一些空间，让用户可以继续滚动触发下一次加载
      const scrollBuffer = 300; // 留出300px的空间，确保大于检测阈值
      const newScrollTop = Math.max(0, scrollContainer.scrollHeight - scrollContainer.clientHeight - scrollBuffer);


      scrollContainer.scrollTop = newScrollTop;

      // 再次检查滚动是否成功
      setTimeout(() => {
        const actualScrollTop = scrollContainer.scrollTop;
        if (Math.abs(actualScrollTop - newScrollTop) > 10) {
          scrollContainer.scrollTop = newScrollTop;
          scrollContainer.scrollTo({ top: newScrollTop, behavior: 'smooth' });
        }
      }, 50);
    }, 100);
  }, [getScrollContainer]);

  // 加载好友列表
  const loadTeamMembers = useCallback(async (pageNum: number, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const level = activeTab === 'direct' ? 1 : 2;
      const response = await fetchTeamMembers({ page: pageNum, page_size: PAGE_SIZE, level });


      if ((isSuccess(response) || response.code === 0) && response.data) {
        const newList = response.data.list || [];
        const totalCount = response.data.total || 0;


        if (append) {
          setFriends(prev => {
            const updated = [...prev, ...newList];
            return updated;
          });
          // 追加数据后自动滚动到底部
          setTimeout(() => {
            scrollToBottom();
          }, 150);
        } else {
          setFriends(newList);
        }
        setTotal(totalCount);
        setPage(pageNum);
        setHasMore(pageNum * PAGE_SIZE < totalCount);
      } else {
        setError(extractError(response, '获取好友列表失败'));
      }
    } catch (err: any) {
      setError(err.message || '获取好友列表失败，请稍后重试');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [activeTab, scrollToBottom]);

  // 滑动加载更多
  const handleScroll = useCallback(() => {
    const scrollContainer = getScrollContainer();
    if (!scrollContainer || loadingMore || !hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
    // 当距离底部200px时就开始加载，给用户更多滚动空间
    if (scrollTop + clientHeight >= scrollHeight - 200) {
      loadTeamMembers(page + 1, true);
    }
  }, [getScrollContainer, loadingMore, hasMore, page, loadTeamMembers]);

  useEffect(() => {
    loadTeamMembers(1, false);
  }, [loadTeamMembers]);


  // 动态添加滚动事件监听器
  useEffect(() => {
    const scrollContainer = containerRef.current?.parentElement?.parentElement;
    if (!scrollContainer) return;

    const handleScrollEvent = () => handleScroll();
    scrollContainer.addEventListener('scroll', handleScrollEvent);

    return () => {
      scrollContainer.removeEventListener('scroll', handleScrollEvent);
    };
  }, [handleScroll]);


  /**
   * 格式化日期

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    // 优先使用 register_time 字段 (API 返回)
    if (friend.register_time) return friend.register_time;

    // 其次使用 join_date 字段
    if (friend.join_date) return friend.join_date;

    // 尝试使用 join_time 时间戳
    if (friend.join_time) {
      return formatTime(friend.join_time, 'YYYY-MM-DD');
    }

    // 尝试使用其他可能的时间字段
      loadTeamMembers(page + 1, true);
    if (anyFriend.create_time) {
      return formatTime(anyFriend.create_time, 'YYYY-MM-DD');
    }
  }, [loadingMore, hasMore, page, loadTeamMembers]);

  /**
   * 格式化日期
   */
  const formatDate = (friend: TeamMember) => {
    // 优先使用 register_time 字段 (API 返回)
    if (friend.register_time) return friend.register_time;

    // 其次使用 join_date 字段
    if (friend.join_date) return friend.join_date;

    // 尝试使用 join_time 时间戳
    if (friend.join_time) {
      return formatTime(friend.join_time, 'YYYY-MM-DD');
    }

    // 尝试使用其他可能的时间字段
    const anyFriend = friend as any;
    if (anyFriend.create_time) {
      return formatTime(anyFriend.create_time, 'YYYY-MM-DD');
    }
    if (anyFriend.createtime) {
      return formatTime(anyFriend.createtime, 'YYYY-MM-DD');
    }
    if (anyFriend.add_time) {
      return formatTime(anyFriend.add_time, 'YYYY-MM-DD');
    }
    if (anyFriend.reg_time) {
      return formatTime(anyFriend.reg_time, 'YYYY-MM-DD');
    }

    // 如果都没有，返回默认值
    return '-';
  };

  return (
    <PageContainer title="我的好友" onBack={onBack}>
      <div
        ref={containerRef}
        className="flex-1"
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

        {/* Tab 切换 */}
        <div className="flex items-center justify-center mt-4 mb-2">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('direct')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'direct'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              直推好友
            </button>
            <button
              onClick={() => setActiveTab('indirect')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'indirect'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              间推好友
            </button>
          </div>
        </div>

        {/* 好友列表标题 */}
        <h3 className="text-sm font-bold text-gray-800 mb-3 pl-1">
          {activeTab === 'direct' ? '直推列表' : '间推列表'} ({total})
        </h3>


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
            {friends.map((friend, index) => {
              // 生成唯一的key
              const key = `${friend.id}-${index}-${activeTab}`;
              return (
              <div
                key={key}
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
                    加入时间: {formatDate(friend)}
                  </div>
                </div>
                <button
                  onClick={() => onNavigate?.({ name: 'friend-detail', id: String(friend.id), friend, back: { name: 'my-friends' } })}
                  className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full"
                >
                  查看
                </button>
              </div>
              );
            })}

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

