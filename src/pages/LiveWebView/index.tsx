import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, MoreHorizontal, X, RefreshCcw, Copy, ExternalLink, MessageSquare, AlertCircle, WifiOff, ShieldAlert } from 'lucide-react';
import { useAppNavigate } from '../../lib/navigation';
import { PageHeader } from '../../components/layout/PageHeader';

export const LiveWebViewPage = () => {
  const { goTo, goBack } = useAppNavigate();

  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(false);
  const [offline, setOffline] = useState(!navigator.onLine);
  const [showSecurityPrompt, setShowSecurityPrompt] = useState(true);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showToast, setShowToast] = useState('');
  
  const domain = 'live.jd.com';
  const url = `https://${domain}/room/12345`;

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

  const simulateLoad = () => {
    if (offline) return;
    setLoading(true);
    setError(false);
    setProgress(0);
    
    // Simulate progress bar
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + Math.random() * 30;
      });
    }, 200);

    setTimeout(() => {
      clearInterval(interval);
      // Randomly fail for demonstration purposes (10% chance)
      if (Math.random() > 0.9) {
        setError(true);
        setLoading(false);
      } else {
        setProgress(100);
        setTimeout(() => {
          setLoading(false);
        }, 300);
      }
    }, 1500);
  };

  useEffect(() => {
    simulateLoad();
  }, [offline]);

  const handleBack = () => {
    goBack();
  };

  const handleRefresh = () => {
    setShowActionSheet(false);
    simulateLoad();
  };

  const handleCopyLink = () => {
    setShowActionSheet(false);
    // In a real app, use navigator.clipboard.writeText
    showToastMessage('链接已复制');
  };

  const handleOpenBrowser = () => {
    setShowActionSheet(false);
    showToastMessage('正在打开默认浏览器');
  };

  const handleContactCS = () => {
    setShowActionSheet(false);
    goTo('help_center');
  };

  const showToastMessage = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(''), 2000);
  };

  return (
    <div className="flex-1 flex flex-col bg-bg-hover dark:bg-bg-base h-full overflow-hidden relative">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-12 bg-white dark:bg-bg-card relative z-20">
        <button onClick={handleBack} className="p-2 -ml-2 text-text-main dark:text-text-main active:opacity-70">
          <ChevronLeft size={24} />
        </button>
        <span className="text-2xl font-medium text-text-main dark:text-text-main">直播</span>
        <button 
          onClick={() => setShowActionSheet(true)}
          className="p-2 -mr-2 text-text-main dark:text-text-main active:opacity-70"
        >
          <MoreHorizontal size={24} />
        </button>
        
        {/* Progress Bar */}
        {loading && !offline && (
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-transparent">
            <div 
              className="h-full bg-brand-start transition-all duration-200 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Offline Banner */}
      {offline && (
        <div className="bg-[#FFF3F3] dark:bg-[#3A1E1E] px-4 py-2 flex items-center justify-between z-10">
          <div className="flex items-center text-brand-start dark:text-brand-start">
            <WifiOff size={16} className="mr-2" />
            <span className="text-base">网络不稳定，请检查网络设置</span>
          </div>
          <button 
            onClick={simulateLoad}
            className="text-base text-brand-start dark:text-brand-start px-2 py-1 active:opacity-70"
          >
            刷新
          </button>
        </div>
      )}

      {/* Security Prompt */}
      {showSecurityPrompt && !error && !offline && (
        <div className="bg-[#FFF9E6] dark:bg-[#2A2415] px-4 py-2 flex items-center justify-between z-10 border-b border-[#FFE5B4] dark:border-[#4A3B1C]">
          <div className="flex items-center text-[#B27B00] dark:text-[#D4A347] flex-1 mr-2">
            <ShieldAlert size={14} className="mr-1.5 shrink-0" />
            <span className="text-sm line-clamp-1">当前内容来自第三方网页：{domain}</span>
          </div>
          <button 
            onClick={() => setShowSecurityPrompt(false)}
            className="text-[#B27B00] dark:text-[#D4A347] p-1 -mr-1 active:opacity-70 shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 relative overflow-hidden bg-white dark:bg-bg-card">
        {error ? (
          // Error Fallback
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 bg-bg-hover dark:bg-bg-base">
            <AlertCircle size={64} className="text-text-aux dark:text-text-sub mb-4" />
            <h3 className="text-3xl font-medium text-text-main dark:text-text-main mb-2">页面加载失败</h3>
            <p className="text-md text-text-sub dark:text-text-aux text-center mb-8">
              网络不稳定或链接已失效，请稍后再试
            </p>
            <div className="w-full space-y-3 max-w-[240px]">
              <button 
                onClick={simulateLoad}
                className="w-full h-[44px] rounded-3xl bg-gradient-to-r from-brand-start to-brand-end text-white font-medium text-lg active:opacity-80"
              >
                刷新重试
              </button>
              <button 
                onClick={handleCopyLink}
                className="w-full h-[44px] rounded-3xl border border-[#E2231A] dark:border-[#FF6B6B] text-brand-start dark:text-brand-start font-medium text-lg active:bg-[#FFF3F3] dark:active:bg-[#3A1E1E]"
              >
                复制链接
              </button>
            </div>
            <div className="mt-8 flex items-center space-x-4 text-base text-text-aux dark:text-text-sub">
              <span onClick={simulateLoad} className="active:underline cursor-pointer">检查网络</span>
              <span>|</span>
              <span onClick={handleContactCS} className="active:underline cursor-pointer">联系客服</span>
            </div>
          </div>
        ) : loading ? (
          // Loading Skeleton
          <div className="absolute inset-0 p-4 space-y-4 bg-white dark:bg-bg-card">
            <div className="w-full aspect-video bg-bg-hover dark:bg-bg-hover rounded-lg animate-pulse" />
            <div className="space-y-3 mt-6">
              <div className="h-6 bg-bg-hover dark:bg-bg-hover rounded w-3/4 animate-pulse" />
              <div className="h-4 bg-bg-hover dark:bg-bg-hover rounded w-1/2 animate-pulse" />
              <div className="h-4 bg-bg-hover dark:bg-bg-hover rounded w-5/6 animate-pulse mt-4" />
              <div className="h-4 bg-bg-hover dark:bg-bg-hover rounded w-full animate-pulse" />
              <div className="h-4 bg-bg-hover dark:bg-bg-hover rounded w-4/5 animate-pulse" />
            </div>
          </div>
        ) : (
          // Mock WebView Content
          <div className="absolute inset-0 overflow-y-auto">
            <div className="w-full aspect-video bg-black relative flex items-center justify-center">
              <img 
                src="https://picsum.photos/seed/jd1/800/450" 
                alt="Live Stream" 
                className="w-full h-full object-cover opacity-80"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-black/50 border-2 border-white/50 flex items-center justify-center backdrop-blur-sm">
                  <div className="w-0 h-0 border-t-8 border-t-transparent border-l-[14px] border-l-white border-b-8 border-b-transparent ml-1" />
                </div>
              </div>
              <div className="absolute top-4 left-4 flex items-center space-x-2">
                <div className="bg-black/40 rounded-full px-2 py-1 flex items-center">
                  <div className="w-6 h-6 rounded-full bg-brand-start mr-2 overflow-hidden">
                    <img src="https://picsum.photos/seed/avatar/100/100" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <span className="text-white text-sm mr-2">京东家电官方旗舰店</span>
                  <button className="bg-brand-start text-white text-xs px-2 py-0.5 rounded-full">关注</button>
                </div>
              </div>
              <div className="absolute top-4 right-4 bg-black/40 rounded-full px-2 py-1">
                <span className="text-white text-xs">12.5w 观看</span>
              </div>
            </div>
            <div className="p-4">
              <h1 className="text-3xl font-medium text-text-main dark:text-text-main mb-2">京东家电超级品牌日，全场5折起！</h1>
              <p className="text-md text-text-sub dark:text-text-aux mb-6">看直播抽免单，更有万元红包雨等你来抢！</p>
              
              <div className="space-y-4">
                <h3 className="text-xl font-medium text-text-main dark:text-text-main">直播商品</h3>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex bg-bg-hover dark:bg-bg-hover rounded-xl p-2">
                    <div className="w-20 h-20 bg-white dark:bg-bg-card rounded-lg shrink-0 overflow-hidden">
                      <img src={`https://picsum.photos/seed/prod${i}/200/200`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="ml-3 flex-1 flex flex-col justify-between py-1">
                      <div className="text-md text-text-main dark:text-text-main line-clamp-2">海尔（Haier）513升十字对开门冰箱 一级能效</div>
                      <div className="flex items-end justify-between">
                        <div className="text-brand-start dark:text-brand-start font-medium">
                          <span className="text-sm">¥</span>
                          <span className="text-xl">3299</span>
                        </div>
                        <button className="bg-brand-start text-white text-sm px-3 py-1 rounded-full">抢购</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Bottom Safe Area Padding */}
            <div className="h-safe-bottom pb-8" />
          </div>
        )}
      </div>

      {/* Action Sheet */}
      {showActionSheet && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div 
            className="absolute inset-0 bg-black/40 transition-opacity"
            onClick={() => setShowActionSheet(false)}
          />
          <div className="relative bg-bg-hover dark:bg-bg-base rounded-t-[16px] overflow-hidden pb-safe">
            <div className="p-4 grid grid-cols-4 gap-4">
              <div className="flex flex-col items-center" onClick={handleRefresh}>
                <div className="w-14 h-14 bg-white dark:bg-bg-card rounded-2xl flex items-center justify-center mb-2 active:bg-bg-skeleton dark:active:bg-[#2A2A2A]">
                  <RefreshCcw size={24} className="text-text-main dark:text-text-main" />
                </div>
                <span className="text-sm text-text-sub dark:text-text-aux">刷新页面</span>
              </div>
              <div className="flex flex-col items-center" onClick={handleCopyLink}>
                <div className="w-14 h-14 bg-white dark:bg-bg-card rounded-2xl flex items-center justify-center mb-2 active:bg-bg-skeleton dark:active:bg-[#2A2A2A]">
                  <Copy size={24} className="text-text-main dark:text-text-main" />
                </div>
                <span className="text-sm text-text-sub dark:text-text-aux">复制链接</span>
              </div>
              <div className="flex flex-col items-center" onClick={handleOpenBrowser}>
                <div className="w-14 h-14 bg-white dark:bg-bg-card rounded-2xl flex items-center justify-center mb-2 active:bg-bg-skeleton dark:active:bg-[#2A2A2A]">
                  <ExternalLink size={24} className="text-text-main dark:text-text-main" />
                </div>
                <span className="text-sm text-text-sub dark:text-text-aux">默认浏览器</span>
              </div>
              <div className="flex flex-col items-center" onClick={handleContactCS}>
                <div className="w-14 h-14 bg-white dark:bg-bg-card rounded-2xl flex items-center justify-center mb-2 active:bg-bg-skeleton dark:active:bg-[#2A2A2A]">
                  <MessageSquare size={24} className="text-text-main dark:text-text-main" />
                </div>
                <span className="text-sm text-text-sub dark:text-text-aux">问题反馈</span>
              </div>
            </div>
            <div className="h-2 bg-bg-skeleton dark:bg-bg-base" />
            <button 
              className="w-full h-[56px] bg-white dark:bg-bg-card text-xl text-text-main dark:text-text-main font-medium active:bg-bg-hover dark:active:bg-[#2A2A2A]"
              onClick={() => setShowActionSheet(false)}
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {showToast && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/70 text-white px-4 py-2 rounded-lg text-md z-50">
          {showToast}
        </div>
      )}
    </div>
  );
};
