import React, { useState, useEffect } from 'react';
import { ChevronLeft, WifiOff, AlertCircle, Megaphone, RefreshCcw } from 'lucide-react';
import { useAppNavigate } from '../../lib/navigation';
import { PageHeader } from '../../components/layout/PageHeader';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';

export const AnnouncementPage = () => {
  const { goTo, goBack } = useAppNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [offline, setOffline] = useState(!navigator.onLine);
  const [empty, setEmpty] = useState(false);
  
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);

  const announcements = [
    { 
      id: '1', 
      title: '关于防范虚假客服诈骗的风险提示', 
      time: '2023-10-25 10:00', 
      summary: '近期发现有不法分子冒充平台客服进行诈骗，请广大用户提高警惕，切勿轻信非官方渠道的信息。',
      content: '尊敬的用户：\n\n近期，平台接到反馈，有不法分子通过电话、短信、社交软件等方式冒充“京东”官方客服，以“订单异常”、“退款理赔”、“账号安全”等为由，诱导用户点击不明链接、下载第三方APP或进行转账汇款操作。\n\n为此，平台郑重提醒广大用户：\n\n1. 平台官方客服不会以任何理由要求您提供密码、验证码等敏感信息。\n2. 平台官方客服不会要求您脱离平台进行私下转账或交易。\n3. 如遇可疑情况，请立即通过APP内官方客服渠道进行核实，或拨打官方客服热线。\n\n请大家提高警惕，谨防上当受骗！\n\n京东安全团队\n2023年10月25日',
      isPinned: true 
    },
    { 
      id: '2', 
      title: '平台系统升级维护公告', 
      time: '2023-10-20 14:30', 
      summary: '为了提供更优质的服务体验，平台将于本周日凌晨进行系统升级维护。',
      content: '尊敬的用户：\n\n为了给您提供更加稳定、优质的服务体验，平台计划于 2023年10月29日（本周日）凌晨 02:00 - 06:00 进行系统停机维护升级。\n\n维护期间，APP内的商品浏览、下单支付、确权等功能将暂停服务。请您提前做好相关安排，避免在维护期间进行重要操作。\n\n维护完成后，各项服务将自动恢复正常。给您带来的不便，敬请谅解！感谢您对京东的支持与理解。\n\n京东运营团队\n2023年10月20日',
      isPinned: false 
    },
    { 
      id: '3', 
      title: '双11大促活动规则说明', 
      time: '2023-10-15 09:00', 
      summary: '年度最大折扣季即将开启，快来了解活动玩法和优惠规则吧！',
      content: '尊敬的用户：\n\n一年一度的双11大促即将拉开帷幕！本次活动包含跨店满减、限时秒杀、超级红包等多种玩法。具体规则请前往活动主会场查看详细说明。\n\n祝您购物愉快！',
      isPinned: false 
    },
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
  }, []);

  const fetchData = () => {
    setLoading(true);
    setError(false);
    setTimeout(() => {
      setLoading(false);
    }, 800);
  };

  const handleBack = () => {
    if (selectedAnnouncement) {
      setSelectedAnnouncement(null);
    } else {
      goTo('profile');
    }
  };

  const renderHeader = () => (
    <div className="bg-white dark:bg-gray-900 z-40 relative shrink-0 border-b border-gray-100 dark:border-gray-800">
      <div className="h-11 flex items-center justify-between px-3">
        <div className="flex items-center w-1/3">
          <button onClick={handleBack} className="p-1 -ml-1 text-gray-900 dark:text-gray-100 active:opacity-70">
            <ChevronLeft size={24} />
          </button>
        </div>
        <h1 className="text-2xl font-medium text-gray-900 dark:text-gray-100 text-center w-1/3">
          {selectedAnnouncement ? '公告详情' : '公告中心'}
        </h1>
        <div className="w-1/3"></div>
      </div>
    </div>
  );

  const renderSkeleton = () => (
    <div className="p-3 space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white dark:bg-gray-900 rounded-xl p-4 animate-pulse">
          <div className="w-3/4 h-4 bg-gray-200 dark:bg-gray-800 rounded mb-3"></div>
          <div className="w-1/4 h-3 bg-gray-200 dark:bg-gray-800 rounded mb-3"></div>
          <div className="w-full h-3 bg-gray-200 dark:bg-gray-800 rounded mb-2"></div>
          <div className="w-2/3 h-3 bg-gray-200 dark:bg-gray-800 rounded"></div>
        </div>
      ))}
    </div>
  );

  const renderError = () => (
    <ErrorState onRetry={fetchData} />
  );

  const renderEmpty = () => (
    <EmptyState message="暂无公告" />
  );

  const renderList = () => {
    if (loading) return renderSkeleton();
    if (error) return renderError();
    if (empty || announcements.length === 0) return renderEmpty();

    return (
      <div className="p-3 space-y-3 pb-safe">
        {announcements.map((item) => (
          <div 
            key={item.id} 
            className="bg-white dark:bg-gray-900 rounded-xl p-4 active:bg-gray-50 dark:bg-gray-800 transition-colors cursor-pointer"
            onClick={() => setSelectedAnnouncement(item)}
          >
            <div className="flex items-start mb-2">
              {item.isPinned && (
                <span className="bg-[#ffe4e4] text-text-price text-xs px-1.5 py-0.5 rounded-sm font-medium mr-2 shrink-0 mt-0.5">
                  置顶
                </span>
              )}
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 leading-snug line-clamp-2">
                {item.title}
              </h3>
            </div>
            <div className="text-sm text-gray-400 dark:text-gray-500 mb-2">{item.time}</div>
            <p className="text-base text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
              {item.summary}
            </p>
          </div>
        ))}
      </div>
    );
  };

  const renderDetail = () => {
    if (!selectedAnnouncement) return null;
    return (
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 h-full relative">
        <div className="flex-1 overflow-y-auto p-5 pb-24">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-gray-100 leading-snug mb-3">
            {selectedAnnouncement.title}
          </h2>
          <div className="text-base text-gray-400 dark:text-gray-500 mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
            发布时间：{selectedAnnouncement.time}
          </div>
          <div className="text-lg text-gray-700 dark:text-gray-400 leading-loose whitespace-pre-wrap">
            {selectedAnnouncement.content}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 px-4 py-3 pb-safe z-40">
          <button 
            onClick={() => setSelectedAnnouncement(null)}
            className="w-full h-[40px] rounded-full bg-gradient-to-r from-brand-start to-brand-end text-white text-lg font-medium active:opacity-80 transition-opacity"
          >
            我知道了
          </button>
        </div>
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

      {/* Demo Controls */}
      {!selectedAnnouncement && (
        <div className="px-4 py-2 flex space-x-2 overflow-x-auto no-scrollbar bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 text-xs absolute top-11 left-0 right-0 z-50 opacity-30 hover:opacity-100 transition-opacity">
          <span className="text-gray-500 dark:text-gray-400 flex items-center shrink-0">状态切换:</span>
          <button onClick={() => {setLoading(false); setError(false); setEmpty(false);}} className={`px-2 py-1 rounded border ${!loading && !error && !empty ? 'bg-brand-start text-white border-[#f2270c]' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}>正常</button>
          <button onClick={() => {setLoading(true); setError(false); setEmpty(false);}} className={`px-2 py-1 rounded border ${loading ? 'bg-brand-start text-white border-[#f2270c]' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}>加载中</button>
          <button onClick={() => {setLoading(false); setError(true); setEmpty(false);}} className={`px-2 py-1 rounded border ${error ? 'bg-brand-start text-white border-[#f2270c]' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}>错误</button>
          <button onClick={() => {setLoading(false); setError(false); setEmpty(true);}} className={`px-2 py-1 rounded border ${empty ? 'bg-brand-start text-white border-[#f2270c]' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}>空态</button>
        </div>
      )}

      {renderHeader()}
      
      <div className="flex-1 overflow-y-auto no-scrollbar relative">
        {selectedAnnouncement ? renderDetail() : renderList()}
      </div>
    </div>
  );
};
