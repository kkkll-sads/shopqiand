import React, { useState, useEffect, useMemo } from 'react';
import { Trash2, ArrowRight, ChevronLeft } from 'lucide-react';
import { EmptyState } from '../../components/common';
import { NewsItem } from '../../types';
import { STORAGE_KEYS } from '../../constants/storageKeys';
import { formatTime } from '../../utils/format';

interface NewsProps {
  newsList: NewsItem[];
  onNavigate: (id: string) => void;
  onMarkAllRead: () => void;
  onBack?: () => void;
}

/**
 * News 资讯页面组件
 */
const News: React.FC<NewsProps> = ({ newsList, onNavigate, onMarkAllRead, onBack }) => {
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

  // 过滤新闻列表
  const filteredNews = useMemo(() => {
    return newsList.filter(item => {
      if (activeTab === 'announcement') return item.type === 'announcement';
      return item.type === 'dynamic';
    });
  }, [activeTab, newsList]);

  // 是否有未读消息
  const hasUnread = useMemo(() => newsList.some(item => item.isUnread), [newsList]);

  return (
    <div className="pb-24 min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white sticky top-0 z-10">
        <div className="flex items-center justify-center p-3 border-b border-gray-100 relative">
          {onBack && (
            <button
              onClick={onBack}
              className="absolute left-3 p-1 text-gray-800 active:opacity-70"
            >
              <ChevronLeft size={24} />
            </button>
          )}
          <h1 className="font-bold text-lg">资讯</h1>
          <button
            onClick={hasUnread ? onMarkAllRead : undefined}
            disabled={!hasUnread}
            className={`absolute right-4 flex items-center gap-1 text-xs font-medium rounded-full px-3 py-1 transition-colors border ${hasUnread
              ? 'text-orange-600 border-orange-100 hover:bg-orange-50 active:bg-orange-100'
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
            className={`flex-1 py-3 text-sm font-medium relative transition-colors ${activeTab === 'announcement' ? 'text-orange-600' : 'text-gray-500'
              }`}
          >
            平台公告
            {activeTab === 'announcement' && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-orange-600 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('dynamics')}
            className={`flex-1 py-3 text-sm font-medium relative transition-colors ${activeTab === 'dynamics' ? 'text-orange-600' : 'text-gray-500'
              }`}
          >
            平台动态
            {activeTab === 'dynamics' && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-orange-600 rounded-full" />
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
              onClick={() => {
                const targetTab = item.type === 'announcement' ? 'announcement' : 'dynamics';
                if (activeTab !== targetTab) {
                  setActiveTab(targetTab);
                }
                onNavigate(item.id);
              }}
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
          <EmptyState
            title={`暂无${activeTab === 'announcement' ? '公告' : '动态'}`}
          />
        )}
      </div>
    </div>
  );
};

export default News;