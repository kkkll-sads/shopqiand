/**
 * MyFriends - 我的好友页面（新路由系统版）
 * 
 * ✅ 已迁移：使用 React Router + useNavigate
 * 
 * @author 树交所前端团队
 * @version 3.0.0（新路由版）
 * @refactored 2026-01-14
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { UserPlus, Loader2 } from 'lucide-react';
import PageContainer from '../../../components/layout/PageContainer';
import { LoadingSpinner, EmptyState, ListItem } from '../../../components/common';
import { fetchTeamMembers, normalizeAssetUrl } from '../../../services/api';
import { TeamMember } from '../../../types';
import { formatTime } from '../../../utils/format';
import { extractData, extractError } from '../../../utils/apiHelpers';
import { useNavigate } from 'react-router-dom';
import { useStateMachine } from '../../../hooks/useStateMachine';
import { LoadingEvent, LoadingState } from '../../../types/states';

const PAGE_SIZE = 10;

/**
 * MyFriends 我的好友页面组件
 */
const MyFriends: React.FC = () => {
  const navigate = useNavigate();
  const [friends, setFriends] = useState<TeamMember[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState<'direct' | 'indirect'>('direct');
  const containerRef = useRef<HTMLDivElement>(null);
  const loadMachine = useStateMachine<LoadingState, LoadingEvent>({
    initial: LoadingState.IDLE,
    transitions: {
      [LoadingState.IDLE]: { [LoadingEvent.LOAD]: LoadingState.LOADING },
      [LoadingState.LOADING]: {
        [LoadingEvent.SUCCESS]: LoadingState.SUCCESS,
        [LoadingEvent.ERROR]: LoadingState.ERROR,
      },
      [LoadingState.SUCCESS]: {
        [LoadingEvent.LOAD]: LoadingState.LOADING,
        [LoadingEvent.RETRY]: LoadingState.LOADING,
      },
      [LoadingState.ERROR]: {
        [LoadingEvent.LOAD]: LoadingState.LOADING,
        [LoadingEvent.RETRY]: LoadingState.LOADING,
      },
    },
  });
  const loadMoreMachine = useStateMachine<LoadingState, LoadingEvent>({
    initial: LoadingState.IDLE,
    transitions: {
      [LoadingState.IDLE]: { [LoadingEvent.LOAD]: LoadingState.LOADING },
      [LoadingState.LOADING]: {
        [LoadingEvent.SUCCESS]: LoadingState.SUCCESS,
        [LoadingEvent.ERROR]: LoadingState.ERROR,
      },
      [LoadingState.SUCCESS]: {
        [LoadingEvent.LOAD]: LoadingState.LOADING,
        [LoadingEvent.RETRY]: LoadingState.LOADING,
      },
      [LoadingState.ERROR]: {
        [LoadingEvent.LOAD]: LoadingState.LOADING,
        [LoadingEvent.RETRY]: LoadingState.LOADING,
      },
    },
  });
  const loading = loadMachine.state === LoadingState.LOADING;
  const loadingMore = loadMoreMachine.state === LoadingState.LOADING;

  // 获取滚动容器 - 尝试多种方式找到正确的滚动容器
  const getScrollContainer = useCallback(() => {
    // 方法1: 通过 containerRef 的父元素查找（PageContainer的内容区域）
    let scrollContainer = containerRef.current?.closest('.overflow-y-auto') as HTMLElement;
    
    // 方法2: 如果找不到，尝试查找父级元素
    if (!scrollContainer) {
      scrollContainer = containerRef.current?.parentElement?.parentElement as HTMLElement;
    }
    
    // 方法3: 如果还是找不到，尝试查找具有 overflow-y-auto 或 overflow-y-scroll 的元素
    if (!scrollContainer || scrollContainer.scrollHeight <= scrollContainer.clientHeight) {
      const allElements = document.querySelectorAll('*');
      for (const el of allElements) {
        const style = window.getComputedStyle(el);
        if ((style.overflowY === 'auto' || style.overflowY === 'scroll') && el.contains(containerRef.current)) {
          const htmlEl = el as HTMLElement;
          if (htmlEl.scrollHeight > htmlEl.clientHeight) {
            scrollContainer = htmlEl;
            break;
          }
        }
      }
    }
    
    return scrollContainer;
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
        loadMoreMachine.send(LoadingEvent.LOAD);
      } else {
        loadMachine.send(LoadingEvent.LOAD);
      }
      setError(null);

      const level = activeTab === 'direct' ? 1 : 2;
      const response = await fetchTeamMembers({ page: pageNum, page_size: PAGE_SIZE, level });
      const data = extractData(response);

      if (data) {
        const newList = data.list || [];
        const totalCount = data.total || 0;


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
        if (append) {
          loadMoreMachine.send(LoadingEvent.SUCCESS);
        } else {
          loadMachine.send(LoadingEvent.SUCCESS);
        }
      } else {
        setError(extractError(response, '获取好友列表失败'));
        if (append) {
          loadMoreMachine.send(LoadingEvent.ERROR);
        } else {
          loadMachine.send(LoadingEvent.ERROR);
        }
      }
    } catch (err: any) {
      setError(err.message || '获取好友列表失败，请稍后重试');
      if (append) {
        loadMoreMachine.send(LoadingEvent.ERROR);
      } else {
        loadMachine.send(LoadingEvent.ERROR);
      }
    } finally {
      // 状态机已处理成功/失败
    }
  }, [activeTab, scrollToBottom]);

  // 滑动加载更多
  const handleScroll = useCallback(() => {
    if (loadingMore || !hasMore) return;
    
    const scrollContainer = getScrollContainer();
    if (!scrollContainer) return;

    let scrollTop: number;
    let scrollHeight: number;
    let clientHeight: number;

    // 获取滚动位置信息
    const el = scrollContainer as HTMLElement;
    scrollTop = el.scrollTop;
    scrollHeight = el.scrollHeight;
    clientHeight = el.clientHeight;

    // 当距离底部200px时就开始加载，给用户更多滚动空间
    if (scrollTop + clientHeight >= scrollHeight - 200) {
      loadTeamMembers(page + 1, true);
    }
  }, [getScrollContainer, loadingMore, hasMore, page, loadTeamMembers]);

  // 切换tab时重置状态并重新加载
  useEffect(() => {
    setPage(1);
    setFriends([]);
    setHasMore(true);
    setError(null);
    loadMachine.send(LoadingEvent.LOAD);
    loadTeamMembers(1, false);
  }, [activeTab]);

  // 初始加载（仅在组件挂载时）
  useEffect(() => {
    // 初始加载已在 activeTab 的 useEffect 中处理，这里不需要重复加载
  }, []);

  // 动态添加滚动事件监听器
  useEffect(() => {
    const scrollContainer = getScrollContainer();
    if (!scrollContainer) return;

    const handleScrollEvent = () => handleScroll();
    scrollContainer.addEventListener('scroll', handleScrollEvent, { passive: true });

    return () => {
      scrollContainer.removeEventListener('scroll', handleScrollEvent);
    };
  }, [handleScroll, getScrollContainer]);

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
    <PageContainer title="我的好友" onBack={() => navigate(-1)}>
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
          onClick={() => navigate('/invite-friends')}
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
                  alt={friend.username || friend.nickname || '用户'}
                  className="w-10 h-10 rounded-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/static/images/avatar.png';
                  }}
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-800">
                    {friend.username || friend.nickname || '用户'}
                  </div>
                  <div className="text-xs text-gray-400">
                    加入时间: {formatDate(friend)}
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/friend-detail/${friend.id}`)}
                  className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full"
                >
                  查看
                </button>
              </div>
              );
            })}

            {/* 加载更多按钮 */}
            {!loadingMore && hasMore && friends.length > 0 && (
              <button
                onClick={() => loadTeamMembers(page + 1, true)}
                disabled={loadingMore}
                className="w-full mt-4 py-3 text-sm font-medium text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98]"
              >
                加载更多
              </button>
            )}

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

