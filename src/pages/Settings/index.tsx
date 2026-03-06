import React, { useState, useEffect } from 'react';
import { ChevronLeft, WifiOff, AlertCircle, ChevronRight, LogOut } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAppNavigate } from '../../lib/navigation';
import { PageHeader } from '../../components/layout/PageHeader';
import { ErrorState } from '../../components/ui/ErrorState';

export const SettingsPage = () => {
  const { goTo, goBack } = useAppNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [offline, setOffline] = useState(false);
  
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { theme, setTheme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [cacheSize, setCacheSize] = useState('12.5MB');

  useEffect(() => {
    fetchData();
  }, []);

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

  const clearCache = () => {
    alert('缓存清理成功');
    setCacheSize('0.0MB');
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
        <div className="flex items-center w-1/3">
          <button onClick={handleBack} className="p-1 -ml-1 text-gray-900 dark:text-gray-100 active:opacity-70">
            <ChevronLeft size={24} />
          </button>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center w-1/3">设置</h1>
        <div className="w-1/3"></div>
      </div>
    </div>
  );

  const renderSkeleton = () => (
    <div className="p-4 space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm animate-pulse">
          <div className="w-full h-5 bg-gray-200 dark:bg-gray-800 rounded mb-4"></div>
          <div className="w-full h-5 bg-gray-200 dark:bg-gray-800 rounded mb-4"></div>
          <div className="w-full h-5 bg-gray-200 dark:bg-gray-800 rounded"></div>
        </div>
      ))}
    </div>
  );

  const renderError = () => (
    <ErrorState onRetry={fetchData} />
  );

  const renderContent = () => {
    if (loading) return renderSkeleton();
    if (error) return renderError();

    return (
      <div className="p-4 space-y-4 pb-24">
        
        {/* Appearance & Language */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-none border border-transparent dark:border-gray-800 overflow-hidden">
          <div className="px-4 py-3.5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <span className="text-lg text-gray-900 dark:text-gray-100">外观设置</span>
            <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-full">
              <button 
                className={`px-3 py-1 text-sm rounded-full transition-colors ${theme === 'light' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
                onClick={() => setTheme('light')}
              >
                浅色
              </button>
              <button 
                className={`px-3 py-1 text-sm rounded-full transition-colors ${theme === 'dark' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
                onClick={() => setTheme('dark')}
              >
                深色
              </button>
              <button 
                className={`px-3 py-1 text-sm rounded-full transition-colors ${theme === 'system' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
                onClick={() => setTheme('system')}
              >
                跟随系统
              </button>
            </div>
          </div>
          <div className="px-4 py-3.5 flex items-center justify-between cursor-pointer active:bg-gray-50 dark:active:bg-gray-800 transition-colors">
            <span className="text-lg text-gray-900 dark:text-gray-100">语言设置</span>
            <div className="flex items-center">
              <span className="text-base text-gray-500 dark:text-gray-400 mr-2">简体中文</span>
              <ChevronRight size={16} className="text-gray-400 dark:text-gray-500" />
            </div>
          </div>
        </div>

        {/* Notifications & Cache */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-none border border-transparent dark:border-gray-800 overflow-hidden">
          <div className="px-4 py-3.5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <span className="text-lg text-gray-900 dark:text-gray-100">消息通知</span>
            <button 
              className={`w-10 h-6 rounded-full p-0.5 transition-colors ${notificationsEnabled ? 'bg-brand-start' : 'bg-gray-300 dark:bg-gray-600'}`}
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
            >
              <div className={`w-5 h-5 bg-white dark:bg-gray-900 rounded-full shadow-sm transform transition-transform ${notificationsEnabled ? 'translate-x-4' : 'translate-x-0'}`}></div>
            </button>
          </div>
          <div 
            className="px-4 py-3.5 flex items-center justify-between cursor-pointer active:bg-gray-50 dark:active:bg-gray-800 transition-colors"
            onClick={clearCache}
          >
            <span className="text-lg text-gray-900 dark:text-gray-100">清理缓存</span>
            <div className="flex items-center">
              <span className="text-base text-gray-500 dark:text-gray-400 mr-2">{cacheSize}</span>
              <ChevronRight size={16} className="text-gray-400 dark:text-gray-500" />
            </div>
          </div>
        </div>

        {/* Privacy & About */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-none border border-transparent dark:border-gray-800 overflow-hidden">
          <div className="px-4 py-3.5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between cursor-pointer active:bg-gray-50 dark:active:bg-gray-800 transition-colors">
            <span className="text-lg text-gray-900 dark:text-gray-100">隐私与协议</span>
            <ChevronRight size={16} className="text-gray-400 dark:text-gray-500" />
          </div>
          <div 
            className="px-4 py-3.5 flex items-center justify-between cursor-pointer active:bg-gray-50 dark:active:bg-gray-800 transition-colors"
            onClick={() => goTo('about')}
          >
            <span className="text-lg text-gray-900 dark:text-gray-100">关于我们</span>
            <div className="flex items-center">
              <span className="text-base text-gray-500 dark:text-gray-400 mr-2">v1.0.0</span>
              <ChevronRight size={16} className="text-gray-400 dark:text-gray-500" />
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <div className="pt-6">
          <button 
            onClick={() => setShowLogoutModal(true)}
            className="w-full h-[48px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 rounded-2xl text-lg font-medium flex items-center justify-center active:bg-gray-50 dark:active:bg-gray-800 transition-colors shadow-sm dark:shadow-none"
          >
            退出登录
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-[#FFF8F8] dark:bg-gray-950 relative h-full overflow-hidden">
      

      {renderHeader()}
      
      <div className="flex-1 overflow-y-auto no-scrollbar relative">
        {renderContent()}
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowLogoutModal(false)}></div>
          <div className="w-full max-w-[320px] bg-white dark:bg-gray-900 rounded-3xl relative z-10 p-6 flex flex-col items-center animate-in fade-in zoom-in duration-200 shadow-xl">
            <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-brand-start mb-4">
              <LogOut size={24} />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">确认退出登录？</h3>
            <p className="text-base text-gray-500 dark:text-gray-400 text-center mb-6">退出后将无法查看订单和确权进度，需要重新登录。</p>
            <div className="flex w-full space-x-3">
              <button 
                className="flex-1 h-[44px] rounded-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-lg font-medium active:bg-gray-200 dark:active:bg-gray-700 transition-colors"
                onClick={() => setShowLogoutModal(false)}
              >
                取消
              </button>
              <button 
                className="flex-1 h-[44px] rounded-full bg-gradient-to-r from-brand-start to-brand-end text-white text-lg font-medium shadow-sm active:opacity-80 transition-opacity"
                onClick={() => {
                  setShowLogoutModal(false);
                  goTo('login');
                }}
              >
                确认退出
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
