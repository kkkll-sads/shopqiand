import React, { useState, useEffect } from 'react';
import { ChevronLeft, WifiOff, AlertCircle, Bell, CheckCircle2 } from 'lucide-react';
import { useAppNavigate } from '../../lib/navigation';
import { PageHeader } from '../../components/layout/PageHeader';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';

export const MessageCenterPage = () => {
  const { goTo, goBack } = useAppNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [offline, setOffline] = useState(!navigator.onLine);
  const [empty, setEmpty] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'system' | 'order' | 'activity'>('system');
  const [messages, setMessages] = useState<any[]>([]);

  const mockData = {
    system: [
      { id: 's1', title: '系统维护升级通知', summary: '为了提供更好的服务，平台将于今晚凌晨2:00-4:00进行系统维护升级，期间部分功能可能无法使用，敬请谅解。', time: '2023-10-25 10:00', isRead: false },
      { id: 's2', title: '实名认证审核通过', summary: '您的实名认证信息已审核通过，现在您可以体验全部平台功能了。', time: '2023-10-24 15:30', isRead: true },
    ],
    order: [
      { id: 'o1', title: '订单发货通知', summary: '您的订单 1234567890 已经发货，快递公司：京东物流，运单号：JD1234567890。请注意查收。', time: '2小时前', isRead: false },
      { id: 'o2', title: '退款成功通知', summary: '您的订单 0987654321 的退款申请已处理完毕，退款金额 ¥199.00 已原路退回您的支付账户，请注意查收。', time: '昨天 14:20', isRead: true },
    ],
    activity: [
      { id: 'a1', title: '双11预售开启', summary: '双11年度大促预售正式开启！万件好物低至5折，更有大额神券等你来抢，快来看看吧！', time: '2023-10-20 00:00', isRead: false },
    ]
  };

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
  }, [activeTab]);

  const fetchData = () => {
    setLoading(true);
    setError(false);
    setTimeout(() => {
      setMessages(mockData[activeTab]);
      setLoading(false);
    }, 800);
  };

  const handleBack = () => {
    goBack();
  };

  const markAllAsRead = () => {
    setMessages(messages.map(m => ({ ...m, isRead: true })));
  };

  const renderHeader = () => (
    <div className="bg-white dark:bg-gray-900 z-40 relative shrink-0 border-b border-gray-100 dark:border-gray-800">
      <div className="h-11 flex items-center justify-between px-3">
        <div className="flex items-center w-1/3">
          <button onClick={handleBack} className="p-1 -ml-1 text-gray-900 dark:text-gray-100 active:opacity-70">
            <ChevronLeft size={24} />
          </button>
        </div>
        <h1 className="text-2xl font-medium text-gray-900 dark:text-gray-100 text-center w-1/3">消息中心</h1>
        <div className="w-1/3 flex justify-end">
          {(!empty && !loading && !error && messages.some(m => !m.isRead)) && (
            <button onClick={markAllAsRead} className="text-md text-gray-600 dark:text-gray-400 px-2 py-1 active:opacity-70 flex items-center">
              <CheckCircle2 size={14} className="mr-1" /> 全部已读
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const renderTabs = () => (
    <div className="bg-white dark:bg-gray-900 flex border-b border-gray-100 dark:border-gray-800 shrink-0">
      {[
        { id: 'system', label: '系统通知' },
        { id: 'order', label: '订单通知' },
        { id: 'activity', label: '活动通知' }
      ].map(tab => (
        <button 
          key={tab.id}
          className={`flex-1 py-3 text-md font-medium relative transition-colors ${activeTab === tab.id ? 'text-text-price' : 'text-gray-600 dark:text-gray-400'}`}
          onClick={() => setActiveTab(tab.id as any)}
        >
          {tab.label}
          {activeTab === tab.id && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-brand-start rounded-t-full"></div>}
        </button>
      ))}
    </div>
  );

  const renderSkeleton = () => (
    <div className="p-3 space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white dark:bg-gray-900 rounded-xl p-4 animate-pulse">
          <div className="flex justify-between items-center mb-3">
            <div className="w-1/2 h-4 bg-gray-200 dark:bg-gray-800 rounded"></div>
            <div className="w-16 h-3 bg-gray-200 dark:bg-gray-800 rounded"></div>
          </div>
          <div className="w-full h-3 bg-gray-200 dark:bg-gray-800 rounded mb-2"></div>
          <div className="w-3/4 h-3 bg-gray-200 dark:bg-gray-800 rounded"></div>
        </div>
      ))}
    </div>
  );

  const renderError = () => (
    <ErrorState onRetry={fetchData} />
  );

  const renderEmpty = () => (
    <EmptyState message="暂无消息" />
  );

  const renderContent = () => {
    if (loading) return renderSkeleton();
    if (error) return renderError();
    if (empty || messages.length === 0) return renderEmpty();

    return (
      <div className="p-3 space-y-3 pb-safe">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className="bg-white dark:bg-gray-900 rounded-xl p-4 active:bg-gray-50 dark:bg-gray-800 transition-colors cursor-pointer"
            onClick={() => {
              setMessages(messages.map(m => m.id === msg.id ? { ...m, isRead: true } : m));
            }}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center flex-1 min-w-0 pr-4">
                {!msg.isRead && <div className="w-2 h-2 rounded-full bg-brand-start mr-2 shrink-0"></div>}
                <h3 className={`text-lg font-medium truncate ${msg.isRead ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
                  {msg.title}
                </h3>
              </div>
              <span className="text-sm text-gray-400 dark:text-gray-500 shrink-0 mt-0.5">{msg.time}</span>
            </div>
            <p className={`text-base line-clamp-2 leading-relaxed ${msg.isRead ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-400'}`}>
              {msg.summary}
            </p>
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
      {renderTabs()}
      
      <div className="flex-1 overflow-y-auto no-scrollbar relative">
        {renderContent()}
      </div>
    </div>
  );
};
