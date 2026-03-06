import React, { useState, useEffect } from 'react';
import { ChevronLeft, HeadphonesIcon, AlertCircle, WifiOff, RefreshCcw, PlayCircle, Clock, RotateCcw } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { useAppNavigate } from '../../lib/navigation';
import { PageHeader } from '../../components/layout/PageHeader';

interface LiveStream {
  id: string;
  title: string;
  streamer: string;
  startTime: string;
  description: string;
  coverUrl: string;
  status: 'live' | 'upcoming' | 'replay';
  domain: string;
  viewers?: number;
}

const MOCK_LIVES: LiveStream[] = [
  {
    id: '1',
    title: '京东家电超级品牌日，全场5折起！',
    streamer: '京东家电官方旗舰店',
    startTime: '今天 20:00',
    description: '看直播抽免单，更有万元红包雨等你来抢！',
    coverUrl: 'https://picsum.photos/seed/jd1/400/400',
    status: 'live',
    domain: 'live.jd.com',
    viewers: 125000
  },
  {
    id: '2',
    title: '数码新品发布会，抢先体验',
    streamer: '科技前沿',
    startTime: '明天 10:00',
    description: '年度旗舰手机首发，直播间专属优惠',
    coverUrl: 'https://picsum.photos/seed/jd2/400/400',
    status: 'upcoming',
    domain: 'live.jd.com'
  },
  {
    id: '3',
    title: '美妆护肤大讲堂，达人教你选',
    streamer: '美妆达人小美',
    startTime: '昨天 19:00',
    description: '干货满满，带你避坑不踩雷',
    coverUrl: 'https://picsum.photos/seed/jd3/400/400',
    status: 'replay',
    domain: 'live.jd.com'
  },
  {
    id: '4',
    title: '生鲜产地直发，新鲜看得见',
    streamer: '助农直播间',
    startTime: '今天 14:00',
    description: '果园直采，顺丰包邮到家',
    coverUrl: 'https://picsum.photos/seed/jd4/400/400',
    status: 'live',
    domain: 'live.jd.com',
    viewers: 8900
  }
];

export const LivePage = () => {
  const { goTo, goBack } = useAppNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [offline, setOffline] = useState(!navigator.onLine);
  const [lives, setLives] = useState<LiveStream[]>([]);
  const [selectedLive, setSelectedLive] = useState<LiveStream | null>(null);

  useEffect(() => {
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchData = () => {
    if (offline) return;
    setLoading(true);
    setError(false);
    setTimeout(() => {
      // Simulate network request
      if (Math.random() > 0.9) {
        setError(true);
      } else {
        setLives(MOCK_LIVES);
      }
      setLoading(false);
    }, 800);
  };

  useEffect(() => {
    fetchData();
  }, [offline]);

  const handleBack = () => {
    goBack();
  };

  const handleLiveClick = (live: LiveStream) => {
    setSelectedLive(live);
  };

  const confirmEnterLive = () => {
    if (selectedLive) {
      goTo('live_webview');
      setSelectedLive(null);
    }
  };

  const renderBadge = (status: string) => {
    switch (status) {
      case 'live':
        return (
          <div className="flex items-center bg-gradient-to-r from-brand-start to-brand-end text-white text-xs px-1.5 py-0.5 rounded-sm">
            <span className="w-1.5 h-1.5 bg-white rounded-full mr-1 animate-pulse" />
            直播中
          </div>
        );
      case 'upcoming':
        return (
          <div className="flex items-center bg-[#FF8C00] text-white text-xs px-1.5 py-0.5 rounded-sm">
            <Clock size={10} className="mr-1" />
            预告
          </div>
        );
      case 'replay':
        return (
          <div className="flex items-center bg-[#999999] text-white text-xs px-1.5 py-0.5 rounded-sm">
            <RotateCcw size={10} className="mr-1" />
            回放
          </div>
        );
      default:
        return null;
    }
  };

  const formatViewers = (count?: number) => {
    if (!count) return '';
    if (count > 10000) {
      return `${(count / 10000).toFixed(1)}万观看`;
    }
    return `${count}观看`;
  };

  return (
    <div className="flex-1 flex flex-col bg-[#FFF9F9] dark:bg-bg-base h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-12 bg-white dark:bg-bg-card sticky top-0 z-10">
        <button onClick={handleBack} className="p-2 -ml-2 text-text-main dark:text-text-main active:opacity-70">
          <ChevronLeft size={24} />
        </button>
        <span className="text-2xl font-medium text-text-main dark:text-text-main">直播</span>
        <button className="p-2 -mr-2 text-text-sub dark:text-text-aux active:opacity-70 flex items-center">
          <HeadphonesIcon size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-6">
        {offline ? (
          <div className="flex flex-col items-center justify-center pt-32 px-4">
            <WifiOff size={48} className="text-text-aux dark:text-text-sub mb-4" />
            <p className="text-text-sub dark:text-text-aux text-lg mb-6">网络连接已断开，请检查网络设置</p>
            <button 
              onClick={fetchData}
              className="h-[48px] px-8 rounded-2xl border border-[#CCCCCC] dark:border-[#666666] text-text-main dark:text-text-main font-medium active:bg-bg-hover dark:active:bg-[#2A2A2A]"
            >
              刷新重试
            </button>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center pt-32 px-4">
            <AlertCircle size={48} className="text-text-aux dark:text-text-sub mb-4" />
            <p className="text-text-sub dark:text-text-aux text-lg mb-6">加载失败，请稍后再试</p>
            <button 
              onClick={fetchData}
              className="h-[48px] px-8 rounded-2xl border border-[#CCCCCC] dark:border-[#666666] text-text-main dark:text-text-main font-medium active:bg-bg-hover dark:active:bg-[#2A2A2A]"
            >
              重新加载
            </button>
          </div>
        ) : loading ? (
          <div className="p-4 space-y-4">
            {/* Skeleton for Featured Card */}
            <div className="bg-white dark:bg-bg-card rounded-2xl overflow-hidden shadow-sm">
              <div className="w-full aspect-video bg-bg-hover dark:bg-bg-hover animate-pulse" />
              <div className="p-4 space-y-3">
                <div className="h-5 bg-bg-hover dark:bg-bg-hover rounded w-3/4 animate-pulse" />
                <div className="h-4 bg-bg-hover dark:bg-bg-hover rounded w-1/2 animate-pulse" />
                <div className="h-[48px] bg-bg-hover dark:bg-bg-hover rounded-2xl w-full mt-2 animate-pulse" />
              </div>
            </div>
            {/* Skeleton for List Cards */}
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white dark:bg-bg-card rounded-2xl p-3 flex shadow-sm">
                <div className="w-[100px] h-[100px] bg-bg-hover dark:bg-bg-hover rounded-lg animate-pulse shrink-0" />
                <div className="ml-3 flex-1 flex flex-col justify-between py-1">
                  <div className="space-y-2">
                    <div className="h-4 bg-bg-hover dark:bg-bg-hover rounded w-full animate-pulse" />
                    <div className="h-4 bg-bg-hover dark:bg-bg-hover rounded w-2/3 animate-pulse" />
                  </div>
                  <div className="h-3 bg-bg-hover dark:bg-bg-hover rounded w-1/3 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : lives.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-32 px-4">
            <PlayCircle size={48} className="text-text-aux dark:text-text-sub mb-4" />
            <p className="text-text-sub dark:text-text-aux text-lg mb-6">暂无直播内容</p>
            <button 
              onClick={handleBack}
              className="h-[48px] px-8 rounded-2xl border border-[#CCCCCC] dark:border-[#666666] text-text-main dark:text-text-main font-medium active:bg-bg-hover dark:active:bg-[#2A2A2A]"
            >
              返回首页
            </button>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Featured Live Card */}
            {lives.length > 0 && (
              <div 
                className="bg-white dark:bg-bg-card rounded-2xl overflow-hidden shadow-sm active:scale-[0.98] transition-transform"
                onClick={() => handleLiveClick(lives[0])}
              >
                <div className="relative w-full aspect-video bg-bg-hover dark:bg-bg-hover">
                  <img 
                    src={lives[0].coverUrl} 
                    alt={lives[0].title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22400%22%20height%3D%22225%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20225%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_18f2b3b3b3b%20text%20%7B%20fill%3A%23999%3Bfont-weight%3Anormal%3Bfont-family%3A-apple-system%2CBlinkMacSystemFont%2C%26quot%3BSegoe%20UI%26quot%3B%2CRoboto%2C%26quot%3BHelvetica%20Neue%26quot%3B%2CArial%2C%26quot%3BNoto%20Sans%26quot%3B%2Csans-serif%2C%26quot%3BApple%20Color%20Emoji%26quot%3B%2C%26quot%3BSegoe%20UI%20Emoji%26quot%3B%2C%26quot%3BSegoe%20UI%20Symbol%26quot%3B%2C%26quot%3BNoto%20Color%20Emoji%26quot%3B%2C%20monospace%3Bfont-size%3A20pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_18f2b3b3b3b%22%3E%3Crect%20width%3D%22400%22%20height%3D%22225%22%20fill%3D%22%23F5F5F5%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%22149.5%22%20y%3D%22120.5%22%3E%E5%9B%BE%E7%89%87%E5%8A%A0%E8%BD%BD%E5%A4%B1%E8%B4%A5%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E';
                    }}
                  />
                  <div className="absolute top-3 left-3 flex items-center">
                    {renderBadge(lives[0].status)}
                    {lives[0].viewers && (
                      <div className="bg-black/40 text-white text-xs px-1.5 py-0.5 rounded-sm ml-1">
                        {formatViewers(lives[0].viewers)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-medium text-text-main dark:text-text-main line-clamp-1 mb-1">
                    {lives[0].title}
                  </h3>
                  <div className="flex items-center text-base text-text-sub dark:text-text-aux mb-4">
                    <span className="truncate max-w-[150px]">{lives[0].streamer}</span>
                    <span className="mx-2">|</span>
                    <span>{lives[0].startTime}</span>
                  </div>
                  <button className="w-full h-[48px] rounded-2xl bg-gradient-to-r from-brand-start to-brand-end text-white font-medium text-lg flex items-center justify-center active:opacity-80">
                    进入直播
                  </button>
                </div>
              </div>
            )}

            {/* Live List */}
            <div className="space-y-3">
              {lives.slice(1).map(live => (
                <div 
                  key={live.id}
                  className="bg-white dark:bg-bg-card rounded-2xl p-3 flex shadow-sm active:bg-bg-hover dark:active:bg-[#2A2A2A] transition-colors"
                  onClick={() => handleLiveClick(live)}
                >
                  <div className="relative w-[100px] h-[100px] rounded-lg overflow-hidden shrink-0 bg-bg-hover dark:bg-bg-hover">
                    <img 
                      src={live.coverUrl} 
                      alt={live.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22100%22%20height%3D%22100%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_18f2b3b3b3c%20text%20%7B%20fill%3A%23999%3Bfont-weight%3Anormal%3Bfont-family%3A-apple-system%2CBlinkMacSystemFont%2C%26quot%3BSegoe%20UI%26quot%3B%2CRoboto%2C%26quot%3BHelvetica%20Neue%26quot%3B%2CArial%2C%26quot%3BNoto%20Sans%26quot%3B%2Csans-serif%2C%26quot%3BApple%20Color%20Emoji%26quot%3B%2C%26quot%3BSegoe%20UI%20Emoji%26quot%3B%2C%26quot%3BSegoe%20UI%20Symbol%26quot%3B%2C%26quot%3BNoto%20Color%20Emoji%26quot%3B%2C%20monospace%3Bfont-size%3A10pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_18f2b3b3b3c%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20fill%3D%22%23F5F5F5%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%2225%22%20y%3D%2254%22%3E%E5%A4%B1%E8%B4%A5%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E';
                      }}
                    />
                    <div className="absolute top-1 left-1">
                      {renderBadge(live.status)}
                    </div>
                  </div>
                  <div className="ml-3 flex-1 flex flex-col py-0.5">
                    <h4 className="text-lg font-medium text-text-main dark:text-text-main line-clamp-2 leading-snug mb-1">
                      {live.title}
                    </h4>
                    <div className="text-sm text-text-aux dark:text-text-sub line-clamp-1 mt-auto mb-1">
                      {live.description}
                    </div>
                    <div className="flex items-center justify-between text-sm text-text-sub dark:text-text-aux">
                      <span className="truncate max-w-[100px]">{live.streamer}</span>
                      <span>{live.startTime}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Security Notice */}
            <div className="pt-6 pb-2 text-center">
              <p className="text-sm text-text-aux dark:text-text-sub">
                直播内容由第三方页面提供，将在App内打开网页。
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {selectedLive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setSelectedLive(null)}
          />
          <div className="relative w-full max-w-[320px] bg-white dark:bg-bg-card rounded-2xl overflow-hidden shadow-xl p-6">
            <h3 className="text-3xl font-medium text-text-main dark:text-text-main mb-2 text-center">
              即将打开直播网页
            </h3>
            <p className="text-md text-text-sub dark:text-text-aux mb-1 text-center">
              即将访问：<span className="text-text-main dark:text-text-main">{selectedLive.domain}</span>
            </p>
            <p className="text-base text-text-aux dark:text-text-sub text-center mb-6">
              请确认来源可信，注意保护个人信息安全。
            </p>
            <div className="flex space-x-3">
              <button 
                className="flex-1 h-[44px] rounded-2xl border border-[#CCCCCC] dark:border-[#666666] text-text-sub dark:text-text-aux font-medium active:bg-bg-hover dark:active:bg-[#2A2A2A]"
                onClick={() => setSelectedLive(null)}
              >
                取消
              </button>
              <button 
                className="flex-1 h-[44px] rounded-2xl bg-gradient-to-r from-brand-start to-brand-end text-white font-medium active:opacity-80 shadow-sm"
                onClick={confirmEnterLive}
              >
                继续
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
