import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, WifiOff, RefreshCcw, ChevronDown, ChevronRight } from 'lucide-react';

interface ForceAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewDetail?: () => void;
}

export const ForceAnnouncementModal: React.FC<ForceAnnouncementModalProps> = ({
  isOpen,
  onClose,
  onViewDetail
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [offline, setOffline] = useState(!navigator.onLine);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 8) {
      setIsScrolledToBottom(true);
    }
  };

  useEffect(() => {
    if (!loading && !error) {
      setTimeout(checkScroll, 100);
    }
  }, [loading, error]);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

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
    setLoading(true);
    setError(false);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  if (!isOpen) return null;

  const renderSkeleton = () => (
    <div className="p-5 space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <div className="w-10 h-5 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
        <div className="w-48 h-6 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
      </div>
      <div className="space-y-3">
        <div className="w-full h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
        <div className="w-full h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
        <div className="w-3/4 h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
      </div>
      <div className="space-y-3 pt-4">
        <div className="w-full h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
        <div className="w-5/6 h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
      </div>
    </div>
  );

  const renderError = () => (
    <div className="flex flex-col items-center justify-center p-8 text-center h-[40vh]">
      <div className="w-16 h-16 mb-4 text-gray-300 dark:text-gray-600">
        <AlertCircle className="w-full h-full" />
      </div>
      <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">加载失败</h3>
      <p className="text-base text-gray-500 dark:text-gray-400 mb-6">请检查您的网络设置后重试</p>
      <button 
        onClick={fetchData}
        className="px-6 py-2 border border-gray-300 dark:border-gray-700 rounded-full text-md text-gray-700 dark:text-gray-300 flex items-center active:bg-gray-50 dark:active:bg-gray-800"
      >
        <RefreshCcw size={16} className="mr-2" />
        重新加载
      </button>
    </div>
  );

  const renderContent = () => {
    if (loading) return renderSkeleton();
    if (error) return renderError();

    return (
      <>
        {/* Header */}
        <div className="px-5 pt-6 pb-3 shrink-0">
          <div className="flex items-start mb-1">
            <span className="bg-[#ffe4e4] dark:bg-red-900/30 text-text-price dark:text-red-400 text-xs px-1.5 py-0.5 rounded-sm font-medium mr-2 shrink-0 border border-red-100 dark:border-red-800/50 mt-1">
              公告
            </span>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 leading-snug">
              关于防范虚假客服诈骗的风险提示
            </h2>
          </div>
          <div className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            发布时间：2023-10-25 10:00
          </div>
        </div>

        {/* Scrollable Content */}
        <div 
          ref={scrollRef}
          onScroll={checkScroll}
          className="px-5 overflow-y-auto no-scrollbar flex-1 relative min-h-0"
        >
          <div className="text-md text-gray-700 dark:text-gray-300 leading-relaxed pb-4">
            <p className="mb-3 font-medium">尊敬的用户：</p>
            <p className="mb-3">近期，平台接到反馈，有不法分子通过电话、短信、社交软件等方式冒充“京东”官方客服，以“订单异常”、“退款理赔”、“账号安全”等为由，诱导用户点击不明链接、下载第三方APP或进行转账汇款操作。</p>
            <p className="mb-3">为此，平台郑重提醒广大用户：</p>
            <div className="mb-3 pl-1 space-y-1.5">
              <p>1. 平台官方客服不会以任何理由要求您提供密码、验证码等敏感信息。</p>
              <p>2. 平台官方客服不会要求您脱离平台进行私下转账或交易。</p>
              <p>3. 如遇可疑情况，请立即通过APP内官方客服渠道进行核实，或拨打官方客服热线。</p>
            </div>
            <p className="mb-4 font-medium text-text-price dark:text-red-400">请大家提高警惕，谨防上当受骗！</p>
            <div className="text-right text-base text-gray-500 dark:text-gray-400">
              <p>京东安全团队</p>
              <p className="mt-0.5">2023年10月25日</p>
            </div>
          </div>
        </div>

        {/* Risk Warning */}
        <div className="px-5 shrink-0 pb-4 pt-2 relative">
          {/* Scroll Hint */}
          {!isScrolledToBottom && (
            <div className="absolute -top-10 left-0 right-0 flex justify-center pointer-events-none animate-bounce">
              <div className="bg-black/60 text-white text-s px-3 py-1.5 rounded-full flex items-center shadow-sm">
                下滑阅读全文 <ChevronDown size={12} className="ml-1" />
              </div>
            </div>
          )}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 flex items-start">
            <AlertCircle size={14} className="text-gray-400 dark:text-gray-500 mr-2 shrink-0 mt-0.5" />
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-snug">
              安全提示：请勿轻信非官方渠道信息，保护好个人财产安全。
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 pb-6 shrink-0 flex flex-col items-center">
          <button 
            className={`w-full h-[44px] min-h-[44px] flex items-center justify-center rounded-full text-xl font-medium transition-all shadow-sm shrink-0 ${
              isScrolledToBottom 
                ? 'bg-gradient-to-r from-brand-start to-brand-end text-white active:opacity-80' 
                : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
            }`}
            onClick={isScrolledToBottom ? onClose : undefined}
            disabled={!isScrolledToBottom}
          >
            {isScrolledToBottom ? '我已阅读并知晓' : '下滑阅读后可确认'}
          </button>
          
          {onViewDetail && (
            <button 
              className="mt-3 text-base text-gray-500 dark:text-gray-400 active:text-gray-700 dark:active:text-gray-300 transition-colors flex items-center"
              onClick={onViewDetail}
            >
              查看详情 <ChevronRight size={12} className="ml-0.5" />
            </button>
          )}
        </div>
      </>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop - No click to close */}
      <div className="absolute inset-0 bg-black/60 transition-opacity"></div>
      
      {/* Modal Container */}
      <div className="bg-white dark:bg-gray-900 w-full max-w-[340px] rounded-2xl shadow-lg relative z-10 flex flex-col overflow-hidden max-h-[85vh] animate-in zoom-in-95 duration-200">
        
        {/* Offline Banner */}
        {offline && (
          <div className="bg-[#ffe4e4] dark:bg-red-900/30 text-text-price dark:text-red-400 text-sm py-2 px-4 flex items-center justify-center shrink-0">
            <WifiOff size={14} className="mr-2" />
            网络连接已断开，请检查网络设置
          </div>
        )}

        {/* Demo Controls (Hidden in production) */}
        <div className="px-4 py-2 flex space-x-2 overflow-x-auto no-scrollbar bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 text-xs shrink-0">
          <span className="text-gray-500 flex items-center shrink-0">状态切换:</span>
          <button onClick={() => {setLoading(false); setError(false);}} className={`px-2 py-1 rounded border ${!loading && !error ? 'bg-brand-start text-white border-[#f2270c]' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300'}`}>正常</button>
          <button onClick={() => {setLoading(true); setError(false);}} className={`px-2 py-1 rounded border ${loading ? 'bg-brand-start text-white border-[#f2270c]' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300'}`}>加载中</button>
          <button onClick={() => {setLoading(false); setError(true);}} className={`px-2 py-1 rounded border ${error ? 'bg-brand-start text-white border-[#f2270c]' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300'}`}>错误</button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};
