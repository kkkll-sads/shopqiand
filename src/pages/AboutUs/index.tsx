import React, { useState, useEffect } from 'react';
import { ChevronLeft, WifiOff, AlertCircle, ChevronRight, Copy } from 'lucide-react';
import { useAppNavigate } from '../../lib/navigation';
import { PageHeader } from '../../components/layout/PageHeader';
import { ErrorState } from '../../components/ui/ErrorState';

export const AboutUsPage = () => {
  const { goTo, goBack } = useAppNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    setLoading(true);
    setError(false);
    setTimeout(() => {
      setLoading(false);
    }, 500);
  };

  const handleBack = () => {
    goBack();
  };

  const handleCopy = (text: string) => {
    alert(`已复制: ${text}`);
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center w-1/3">关于我们</h1>
        <div className="w-1/3"></div>
      </div>
    </div>
  );

  const renderError = () => (
    <ErrorState onRetry={fetchData} />
  );

  const renderContent = () => {
    if (error) return renderError();

    return (
      <div className="p-4 flex flex-col items-center pb-10">
        
        {/* Logo & Brand */}
        <div className="mt-12 mb-10 flex flex-col items-center">
          <div className="w-20 h-20 bg-gradient-to-br from-brand-start to-brand-end rounded-2xl flex items-center justify-center shadow-lg mb-4">
            <span className="text-white text-7xl font-bold italic">树</span>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-1">树交所</h2>
          <p className="text-base text-gray-500 dark:text-gray-400">Version 1.0.0</p>
        </div>

        {/* Function List */}
        <div className="w-full bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-none border border-transparent dark:border-gray-800 overflow-hidden mb-8">
          <div className="px-4 py-3.5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between cursor-pointer active:bg-gray-50 dark:active:bg-gray-800 transition-colors">
            <span className="text-lg text-gray-900 dark:text-gray-100">检查更新</span>
            <div className="flex items-center">
              <span className="text-base text-gray-500 dark:text-gray-400 mr-2">已是最新版本</span>
              <ChevronRight size={16} className="text-gray-400 dark:text-gray-500" />
            </div>
          </div>
          <div className="px-4 py-3.5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between cursor-pointer active:bg-gray-50 dark:active:bg-gray-800 transition-colors">
            <span className="text-lg text-gray-900 dark:text-gray-100">用户协议</span>
            <ChevronRight size={16} className="text-gray-400 dark:text-gray-500" />
          </div>
          <div className="px-4 py-3.5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between cursor-pointer active:bg-gray-50 dark:active:bg-gray-800 transition-colors">
            <span className="text-lg text-gray-900 dark:text-gray-100">隐私政策</span>
            <ChevronRight size={16} className="text-gray-400 dark:text-gray-500" />
          </div>
          <div className="px-4 py-3.5 flex items-center justify-between cursor-pointer active:bg-gray-50 dark:active:bg-gray-800 transition-colors">
            <span className="text-lg text-gray-900 dark:text-gray-100">联系我们</span>
            <div className="flex items-center">
              <span className="text-base text-gray-500 dark:text-gray-400 mr-2">400-123-4567</span>
              <ChevronRight size={16} className="text-gray-400 dark:text-gray-500" />
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-auto flex flex-col items-center text-s text-gray-400 dark:text-gray-400">
          <p className="mb-1">Copyright © 2023 树交所 All Rights Reserved.</p>
          <div className="flex items-center">
            <span>Channel: AppStore</span>
            <span className="mx-2">|</span>
            <span>Build: 20231025.1</span>
            <button 
              onClick={() => handleCopy('20231025.1')}
              className="ml-1 p-0.5 active:text-gray-600 dark:active:text-gray-300 dark:text-gray-600"
            >
              <Copy size={10} />
            </button>
          </div>
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
    </div>
  );
};
