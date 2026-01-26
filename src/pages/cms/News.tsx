/**
 * News - 资讯页面组件
 * 已迁移: 使用 React Router 导航，内部管理数据
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, ArrowRight, ChevronLeft } from 'lucide-react';
import { EmptyState } from '@/components/common';
import { useAppStore } from '@/stores/appStore';
import { STORAGE_KEYS } from '@/constants/storageKeys';
import { formatTime } from '@/utils/format';
import { fetchAnnouncements, AnnouncementItem } from '@/services/api';
import { extractData } from '@/utils/apiHelpers';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { useStateMachine } from '@/hooks/useStateMachine';
import { LoadingEvent, LoadingState } from '@/types/states';

const News: React.FC = () => {
  const navigate = useNavigate();
  const { newsList, markNewsRead, markAllNewsRead } = useAppStore();

  // 从 localStorage 恢复标签页状态
  const [activeTab, setActiveTab] = useState<'announcement' | 'dynamics'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NEWS_ACTIVE_TAB_KEY);
      return (saved === 'dynamics' || saved === 'announcement') ? saved : 'announcement';
    } catch {
      return 'announcement';
    }
  });

  // 保存标签页状态到 localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.NEWS_ACTIVE_TAB_KEY, activeTab);
    } catch {
      // 忽略存储错误
    }
  }, [activeTab]);

  // Loading State Machine
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
  const loading = loadMachine.state === LoadingState.LOADING;

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Infinite Scroll Handler
  const handleLoadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  const bottomRef = useInfiniteScroll(handleLoadMore, hasMore, loading);

  // 加载数据函数
  const loadData = async (pageNum: number, isRefresh = false) => {
    loadMachine.send(LoadingEvent.LOAD);
    try {
      const apiType = activeTab === 'announcement' ? 'normal' : 'important';
      const res = await fetchAnnouncements({ page: pageNum, limit: 10, type: apiType });
      const data = extractData(res) as { list: AnnouncementItem[] } | null;
      if (data) {
        const list = data.list || [];
        const mappedList = list.map((item: any) => ({
          id: String(item.id),
          title: item.title,
          date: item.createtime,
          type: activeTab === 'announcement' ? 'announcement' : 'dynamic',
          isUnread: true,
          content: item.content
        }));

        const currentList = useAppStore.getState().newsList;
        const currentType = activeTab === 'announcement' ? 'announcement' : 'dynamic';
        const otherTypeItems = currentList.filter(i => i.type !== currentType);
        const currentTypeItems = currentList.filter(i => i.type === currentType);

        let finalCurrentTypeItems;
        if (isRefresh) {
          finalCurrentTypeItems = mappedList;
        } else {
          const newIds = new Set(mappedList.map((i: any) => i.id));
          finalCurrentTypeItems = [...currentTypeItems.filter(i => !newIds.has(i.id)), ...mappedList];
        }

        useAppStore.getState().setNewsList([...otherTypeItems, ...finalCurrentTypeItems]);

        setHasMore((list.length || 0) >= 10);
        loadMachine.send(LoadingEvent.SUCCESS);
      } else {
        loadMachine.send(LoadingEvent.ERROR);
      }
    } catch (err) {
      loadMachine.send(LoadingEvent.ERROR);
    }
  };

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    loadData(1, true);
  }, [activeTab]);

  useEffect(() => {
    if (page > 1) {
      loadData(page, false);
    }
  }, [page]);

  // 过滤新闻列表
  const filteredNews = useMemo(() => {
    return newsList.filter(item => {
      if (activeTab === 'announcement') return item.type === 'announcement';
      return item.type === 'dynamic';
    });
  }, [activeTab, newsList]);

  // 是否有未读消息
  const hasUnread = useMemo(() => newsList.some(item => item.isUnread), [newsList]);

  // 处理新闻点击
  const handleNewsClick = (id: string, type: string) => {
    const targetTab = type === 'announcement' ? 'announcement' : 'dynamics';
    if (activeTab !== targetTab) {
      setActiveTab(targetTab);
    }
    markNewsRead(id);
    navigate(`/news/${id}`);
  };

  // 处理全部标记已读
  const handleMarkAllRead = () => {
    if (hasUnread) {
      markAllNewsRead();
    }
  };

  return (
    <div className="pb-24 min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white sticky top-0 z-10">
        <div className="flex items-center justify-center p-3 border-b border-gray-100 relative">
          <button
            onClick={() => navigate(-1)}
            className="absolute left-3 p-1 text-gray-800 active:opacity-70"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="font-bold text-lg">资讯</h1>
          <button
            onClick={handleMarkAllRead}
            disabled={!hasUnread}
            className={`absolute right-4 flex items-center gap-1 text-xs font-medium rounded-full px-3 py-1 transition-colors border ${hasUnread
              ? 'text-red-600 border-red-100 hover:bg-red-50 active:bg-red-100'
              : 'text-gray-300 border-gray-100 cursor-not-allowed'
              }`}
            title={hasUnread ? '一键清除未读' : '暂无未读公告'}
          >
            <Trash2 size={16} />
          </button>
        </div>

        {/* 标签页切换 */}
        <div className="flex">
          <button
            onClick={() => setActiveTab('announcement')}
            className={`flex-1 py-3 text-sm font-medium relative transition-colors ${activeTab === 'announcement' ? 'text-red-600' : 'text-gray-500'
              }`}
          >
            平台公告
            {activeTab === 'announcement' && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-red-600 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('dynamics')}
            className={`flex-1 py-3 text-sm font-medium relative transition-colors ${activeTab === 'dynamics' ? 'text-red-600' : 'text-gray-500'
              }`}
          >
            平台动态
            {activeTab === 'dynamics' && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-red-600 rounded-full" />
            )}
          </button>
        </div>
      </header>

      {/* 新闻列表 */}
      <div className="p-4 space-y-4">
        {filteredNews.length > 0 ? (
          filteredNews.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl p-4 shadow-sm relative cursor-pointer active:bg-gray-50 transition-colors"
              onClick={() => handleNewsClick(item.id, item.type)}
            >
              {/* 未读标记 */}
              {item.isUnread && (
                <div className="absolute top-4 right-4 w-2 h-2 bg-red-500 rounded-full ring-4 ring-white" />
              )}
              <div className="text-xs text-gray-400 mb-3">{formatTime(item.date, 'YYYY-MM-DD HH:mm')}</div>
              <h3 className="text-sm text-gray-800 font-medium leading-relaxed mb-4 pr-4">
                {item.title}
              </h3>
              <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                <span className="text-xs text-gray-500">查看详情</span>
                <ArrowRight size={14} className="text-gray-400" />
              </div>
            </div>
          ))
        ) : (
          !loading && <EmptyState
            title={`暂无${activeTab === 'announcement' ? '公告' : '动态'}`}
          />
        )}

        {/* Infinite Scroll Sentinel */}
        <div ref={bottomRef} className="h-4" />
        {loading && (
          <div className="py-4 text-center text-xs text-gray-400">加载中...</div>
        )}
      </div>
    </div>
  );
};

export default News;
