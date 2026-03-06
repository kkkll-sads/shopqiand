import React, { useState, useEffect } from 'react';
import { ChevronLeft, MessageCircleQuestion, RefreshCcw, WifiOff } from 'lucide-react';
import { useAppNavigate } from '../../lib/navigation';
import { PageHeader } from '../../components/layout/PageHeader';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';

export const ProductQAPage = () => {
  const { goTo, goBack } = useAppNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [offline, setOffline] = useState(!navigator.onLine);
  const [empty, setEmpty] = useState(false);
  
  const [activeFilter, setActiveFilter] = useState<'latest' | 'hottest'>('hottest');

  const mockData = [
    {
      id: '1',
      question: '请问这款手机玩原神会发热严重吗？',
      answer: '您好，这款手机搭载了最新的散热系统，日常玩原神等大型游戏时会有轻微发热，属于正常现象，不会严重影响游戏体验和握持手感。',
      time: '2023-10-25',
      answerCount: 12
    },
    {
      id: '2',
      question: '电池续航怎么样？能用一天吗？',
      answer: '正常中度使用情况下，满电可以满足一整天的使用需求。如果重度游戏或长时间亮屏，建议随身携带充电宝。',
      time: '2023-10-24',
      answerCount: 5
    },
    {
      id: '3',
      question: '支持无线充电吗？',
      answer: '这款机型不支持无线充电，但支持120W有线快充，充电速度非常快。',
      time: '2023-10-20',
      answerCount: 2
    },
    {
      id: '4',
      question: '拍照效果好不好？夜景清晰吗？',
      answer: '拍照非常清晰！主摄是5000万像素大底传感器，夜景模式下噪点控制得很好，出片率很高。',
      time: '2023-10-18',
      answerCount: 8
    }
  ];

  useEffect(() => {
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    fetchData();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [activeFilter]);

  const fetchData = () => {
    setLoading(true);
    setError(false);
    setTimeout(() => {
      setLoading(false);
    }, 800);
  };

  const handleBack = () => {
    goBack();
  };

  const renderHeader = () => (
    <div className="bg-white dark:bg-gray-900 z-40 relative shrink-0 border-b border-gray-100 dark:border-gray-800">
      <div className="h-11 flex items-center justify-between px-3">
        <div className="flex items-center w-1/3">
          <button onClick={handleBack} className="p-1 -ml-1 text-gray-900 dark:text-gray-100 active:opacity-70">
            <ChevronLeft size={24} />
          </button>
        </div>
        <h1 className="text-2xl font-medium text-gray-900 dark:text-gray-100 text-center w-1/3">问大家</h1>
        <div className="w-1/3"></div>
      </div>
    </div>
  );

  const renderFilters = () => (
    <div className="bg-white dark:bg-gray-900 px-4 py-3 flex items-center space-x-6 border-b border-gray-100 dark:border-gray-800 shrink-0">
      <button 
        className={`text-md font-medium transition-colors relative pb-1 ${activeFilter === 'hottest' ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}
        onClick={() => setActiveFilter('hottest')}
      >
        最热
        {activeFilter === 'hottest' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-1 bg-brand-start rounded-full"></div>}
      </button>
      <button 
        className={`text-md font-medium transition-colors relative pb-1 ${activeFilter === 'latest' ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}
        onClick={() => setActiveFilter('latest')}
      >
        最新
        {activeFilter === 'latest' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-1 bg-brand-start rounded-full"></div>}
      </button>
    </div>
  );

  const renderSkeleton = () => (
    <div className="p-3 space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white dark:bg-gray-900 rounded-xl p-4 animate-pulse">
          <div className="flex items-start mb-3">
            <div className="w-5 h-5 bg-gray-200 dark:bg-gray-800 rounded mr-2 shrink-0"></div>
            <div className="w-3/4 h-5 bg-gray-200 dark:bg-gray-800 rounded"></div>
          </div>
          <div className="flex items-start">
            <div className="w-5 h-5 bg-gray-200 dark:bg-gray-800 rounded mr-2 shrink-0"></div>
            <div className="flex-1 space-y-2">
              <div className="w-full h-4 bg-gray-200 dark:bg-gray-800 rounded"></div>
              <div className="w-2/3 h-4 bg-gray-200 dark:bg-gray-800 rounded"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderError = () => (
    <ErrorState onRetry={fetchData} />
  );

  const renderEmpty = () => (
    <EmptyState message="暂无问答" />
  );

  const renderContent = () => {
    if (loading) return renderSkeleton();
    if (error) return renderError();
    if (empty || mockData.length === 0) return renderEmpty();

    return (
      <div className="p-3 space-y-3 pb-24">
        {mockData.map((item) => (
          <div key={item.id} className="bg-white dark:bg-gray-900 rounded-xl p-4">
            <div className="flex items-start mb-3">
              <span className="bg-[#ff9600] text-white text-sm font-bold w-5 h-5 flex items-center justify-center rounded-sm mr-2 shrink-0 mt-0.5">问</span>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 leading-snug">
                {item.question}
              </h3>
            </div>
            <div className="flex items-start mb-3">
              <span className="bg-[#25b513] text-white text-sm font-bold w-5 h-5 flex items-center justify-center rounded-sm mr-2 shrink-0 mt-0.5">答</span>
              <p className="text-md text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3">
                {item.answer}
              </p>
            </div>
            <div className="flex justify-between items-center text-sm text-gray-400 dark:text-gray-500 mt-2 pt-3 border-t border-gray-50 dark:border-gray-800">
              <span>{item.time}</span>
              <span>共 {item.answerCount} 个回答</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-bg-hover dark:bg-gray-950 relative h-full overflow-hidden">
      {/* Offline Banner */}
      {offline && (
        <div className="bg-[#ffe4e4] text-text-price text-sm py-2 px-4 flex items-center justify-center sticky top-0 z-50">
          <WifiOff size={14} className="mr-2" />
          网络连接已断开，请检查网络设置
        </div>
      )}

      

      {renderHeader()}
      {renderFilters()}
      
      <div className="flex-1 overflow-y-auto no-scrollbar relative">
        {renderContent()}
      </div>

      {/* Bottom Action Bar */}
      {!loading && !error && (
        <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 px-4 py-3 pb-safe z-40">
          <button 
            className="w-full h-[40px] rounded-full bg-gradient-to-r from-brand-start to-brand-end text-white text-lg font-medium active:opacity-80 transition-opacity shadow-sm"
            onClick={() => alert('提问功能开发中')}
          >
            向已买过的人提问
          </button>
        </div>
      )}
    </div>
  );
};
