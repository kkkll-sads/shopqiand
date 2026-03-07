import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, Headset, WifiOff, RefreshCcw, FileX, ArrowRight, Clock, Image as ImageIcon } from 'lucide-react';
import { useAppNavigate } from '../../lib/navigation';
import { PageHeader } from '../../components/layout/PageHeader';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { useRouteScrollRestoration } from '../../hooks/useRouteScrollRestoration';

interface Session {
  id: string;
  theme_image: string;
  pool_tag: string;
  title: string;
  time_slot: string;
  return_rate: string;
  quota: string;
  status: 'upcoming' | 'active' | 'ended';
  countdown: string; // e.g. "01:44:25"
}

export const TradingZonePage = () => {
  const { goTo, goBack } = useAppNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [offline, setOffline] = useState(false);
  const [empty, setEmpty] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const mockSessions: Session[] = [
    {
      id: '1',
      theme_image: 'https://picsum.photos/seed/trade1/800/400',
      pool_tag: 'Pool-A',
      title: '优质数据资产确权首发',
      time_slot: '09:00-12:00',
      return_rate: '8.5%',
      quota: '500万',
      status: 'active',
      countdown: '00:12:09',
    },
    {
      id: '2',
      theme_image: 'https://picsum.photos/seed/trade2/800/400',
      pool_tag: 'Pool-B',
      title: '高频交易数据包专场',
      time_slot: '14:00-16:00',
      return_rate: '12.0%',
      quota: '200万',
      status: 'upcoming',
      countdown: '01:44:25',
    },
    {
      id: '3',
      theme_image: 'https://picsum.photos/seed/trade3/800/400',
      pool_tag: 'Pool-C',
      title: '基础用户画像数据集',
      time_slot: '昨天 10:00-12:00',
      return_rate: '6.0%',
      quota: '1000万',
      status: 'ended',
      countdown: '00:00:00',
    }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  useRouteScrollRestoration({
    containerRef: scrollContainerRef,
    namespace: 'trading-zone',
    restoreDeps: [empty, error, loading],
    restoreWhen: !loading && !error && !empty,
  });

  const fetchData = () => {
    setLoading(true);
    setError(false);
    setTimeout(() => {
      setLoading(false);
    }, 300);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 300);
  };

  const handleBack = () => {
    goBack();
  };

  const handleCardClick = (session: Session) => {
    goTo('trading_detail');
  };

  const renderHeader = () => (
    <div className="bg-white dark:bg-gray-900 z-40 relative shrink-0 border-b border-gray-100 dark:border-gray-800">
      {offline && (
        <div className="bg-red-50 dark:bg-red-900/30 text-brand-start dark:text-red-400 px-4 py-2 flex items-center justify-between text-sm">
          <div className="flex items-center">
            <WifiOff size={14} className="mr-2" />
            <span>网络不稳定，请检查网络设置</span>
          </div>
          <button onClick={() => setOffline(false)} className="font-medium px-2 py-1 bg-white dark:bg-gray-800 rounded shadow-sm">刷新</button>
        </div>
      )}
      <div className="h-12 flex items-center justify-between px-3 pt-safe">
        <div className="flex items-center w-1/4">
          <button onClick={handleBack} className="p-1 -ml-1 text-gray-900 dark:text-gray-100 active:opacity-70">
            <ChevronLeft size={24} />
          </button>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center flex-1">资产交易</h1>
        <div className="w-1/4 flex justify-end">
          <div className="flex items-center bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full border border-green-100 dark:border-green-800/50">
            <div className="w-1.5 h-1.5 rounded-full bg-success mr-1.5 animate-pulse"></div>
            <span className="text-xs text-success font-medium">实时交易</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSkeleton = () => (
    <div className="p-4 space-y-4">
      {[1, 2].map(i => (
        <div key={i} className="w-full bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="w-full h-32 bg-gray-100 dark:bg-gray-800 animate-pulse"></div>
          <div className="p-4 space-y-3">
            <div className="w-2/3 h-5 bg-gray-100 dark:bg-gray-800 animate-pulse rounded"></div>
            <div className="flex space-x-4">
              <div className="w-1/3 h-10 bg-gray-100 dark:bg-gray-800 animate-pulse rounded"></div>
              <div className="w-1/3 h-10 bg-gray-100 dark:bg-gray-800 animate-pulse rounded"></div>
            </div>
            <div className="w-full h-12 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-3xl"></div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderError = () => (
    <ErrorState onRetry={fetchData} />
  );

  const renderEmpty = () => (
    <EmptyState message="暂无可参与场次"
      actionText="返回商城"
      onAction={() => goTo('store')} />
  );

  const renderContent = () => {
    if (loading) return renderSkeleton();
    if (error) return renderError();
    if (empty) return renderEmpty();

    return (
      <div className="p-4 space-y-4 pb-24">
        {mockSessions.map((session) => {
          const isActive = session.status === 'active';
          const isUpcoming = session.status === 'upcoming';
          const isEnded = session.status === 'ended';

          return (
            <div 
              key={session.id}
              className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 cursor-pointer active:opacity-95 transition-opacity"
              onClick={() => handleCardClick(session)}
            >
              {/* Top Banner / Theme Image */}
              <div className="relative w-full h-32 bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                {/* Fallback icon behind the image */}
                <div className="absolute inset-0 flex items-center justify-center text-gray-300 dark:text-gray-700 dark:text-gray-400">
                  <ImageIcon size={32} />
                </div>
                <img 
                  src={session.theme_image} 
                  alt={session.title}
                  className="w-full h-full object-cover relative z-10"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                
                {/* Overlay Gradients for text readability */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 z-10"></div>
                
                {/* Top Left Badge */}
                <div className="absolute top-3 left-3 z-20 bg-black/40 text-white text-s px-2 py-0.5 rounded-full border border-white/20 backdrop-blur-sm">
                  {session.pool_tag}
                </div>
                
                {/* Top Right Status Badge */}
                <div className={`absolute top-3 right-3 z-20 text-s px-2 py-0.5 rounded-full font-medium border ${
                  isActive ? 'bg-brand-start text-white border-[#FF4142]' : 
                  isUpcoming ? 'bg-warning text-white border-[#FF9900]' : 
                  'bg-black/40 text-white border-white/20'
                }`}>
                  {isActive ? '正在抢购' : isUpcoming ? '即将开始' : '已结束'}
                </div>

                {/* Bottom Info in Banner */}
                <div className="absolute bottom-3 left-3 right-3 z-20">
                  <h2 className="text-white text-xl font-bold leading-tight mb-1 drop-shadow-md">{session.title}</h2>
                  <div className="flex items-center text-white/90 text-sm">
                    <Clock size={12} className="mr-1" />
                    {session.time_slot}
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4">
                {/* Metrics */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">预期收益率</div>
                    <div className={`text-4xl font-bold ${isEnded ? 'text-gray-400 dark:text-gray-400' : 'text-brand-start'}`}>
                      {session.return_rate}
                    </div>
                  </div>
                  <div className="w-px h-8 bg-gray-100 dark:bg-gray-800 mx-4"></div>
                  <div className="flex-1">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">本期额度</div>
                    <div className={`text-xl font-bold ${isEnded ? 'text-gray-400 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
                      {session.quota}
                    </div>
                  </div>
                </div>

                {/* Countdown & Action */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 flex flex-col items-center border border-gray-100 dark:border-gray-800">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    {isActive ? '距结束仅剩' : isUpcoming ? '距开始仅剩' : '本场结束 · CLOSED'}
                  </div>
                  {!isEnded && (
                    <div className={`text-5xl font-bold tracking-wider mb-3 font-mono ${isActive ? 'text-brand-start' : 'text-gray-900 dark:text-gray-100'}`}>
                      {session.countdown}
                    </div>
                  )}
                  
                  <button 
                    className={`w-full h-10 rounded-full text-md font-medium flex items-center justify-center transition-all ${
                      isActive ? 'bg-gradient-to-r from-brand-start to-brand-end text-white shadow-sm active:opacity-80' : 
                      isUpcoming ? 'bg-white dark:bg-gray-800 border border-[#FF4142] text-brand-start active:bg-red-50 dark:active:bg-red-900/20' : 
                      'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-400 cursor-not-allowed'
                    }`}
                    disabled={isEnded}
                  >
                    {isActive ? (
                      <>立即抢购 / ACCESS <ArrowRight size={16} className="ml-1" /></>
                    ) : isUpcoming ? (
                      '即将开始'
                    ) : (
                      '本场结束'
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-bg-hover dark:bg-gray-950 relative h-full overflow-hidden">
      

      {renderHeader()}
      
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto no-scrollbar relative"
        onScroll={(e) => {
          if (e.currentTarget.scrollTop < -50 && !refreshing && !loading) {
            handleRefresh();
          }
        }}
      >
        {refreshing && (
          <div className="flex justify-center items-center py-4 text-gray-400 dark:text-gray-500">
            <RefreshCcw size={20} className="animate-spin" />
          </div>
        )}
        {renderContent()}
      </div>

      {/* Floating Customer Service Button */}
      {!loading && !error && !empty && (
        <button 
          className="absolute right-4 bottom-8 w-12 h-12 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-100 dark:border-gray-700 flex items-center justify-center text-gray-900 dark:text-gray-100 active:scale-95 transition-transform z-40"
          onClick={() => goTo('help_center')}
        >
          <Headset size={24} />
        </button>
      )}
    </div>
  );
};
