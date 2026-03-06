import React, { useState, useEffect } from 'react';
import { ChevronLeft, WifiOff, AlertCircle, RefreshCcw, ShieldCheck, ShieldAlert, Smartphone, Lock, MonitorSmartphone, History, Fingerprint, ChevronRight } from 'lucide-react';
import { useAppNavigate } from '../../lib/navigation';
import { PageHeader } from '../../components/layout/PageHeader';
import { ErrorState } from '../../components/ui/ErrorState';

export const SecurityPage = () => {
  const { goTo, goBack } = useAppNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [offline, setOffline] = useState(false);
  
  const securityLevel = '高';
  const phone = '138****8888';
  const lastLogin = '02-28 深圳 IP:113.116.*.*';

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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center w-1/3">账号与安全</h1>
        <div className="w-1/3"></div>
      </div>
    </div>
  );

  const renderSkeleton = () => (
    <div className="p-4 space-y-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm animate-pulse">
        <div className="flex items-center mb-3">
          <div className="w-6 h-6 bg-gray-200 dark:bg-gray-800 rounded-full mr-2"></div>
          <div className="w-32 h-5 bg-gray-200 dark:bg-gray-800 rounded"></div>
        </div>
        <div className="w-full h-10 bg-gray-100 dark:bg-gray-800 rounded-lg"></div>
      </div>
      
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm animate-pulse overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="px-4 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-5 h-5 bg-gray-200 dark:bg-gray-800 rounded mr-3"></div>
              <div className="w-24 h-5 bg-gray-200 dark:bg-gray-800 rounded"></div>
            </div>
            <div className="w-16 h-4 bg-gray-200 dark:bg-gray-800 rounded"></div>
          </div>
        ))}
      </div>
      
      <div className="w-full h-[48px] bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse mt-6"></div>
    </div>
  );

  const renderError = () => (
    <ErrorState onRetry={fetchData} />
  );

  const renderContent = () => {
    if (loading) return renderSkeleton();
    if (error) return renderError();

    return (
      <div className="p-4 pb-10">
        {/* Security Status Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 mb-4 shadow-sm dark:shadow-none border border-transparent dark:border-gray-800">
          <div className="flex items-center mb-3">
            {securityLevel === '高' ? (
              <ShieldCheck size={24} className="text-green-500 mr-2" />
            ) : (
              <ShieldAlert size={24} className="text-orange-500 mr-2" />
            )}
            <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
              账号安全评级：{securityLevel}
            </span>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            建议定期修改密码，并开启多重身份验证，以保障账号资产安全。
          </div>
        </div>

        {/* List Group Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-none border border-transparent dark:border-gray-800 overflow-hidden mb-6">
          <div className="px-4 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between active:bg-gray-50 dark:active:bg-gray-800 transition-colors cursor-pointer">
            <div className="flex items-center">
              <Lock size={20} className="text-gray-600 dark:text-gray-400 mr-3" />
              <span className="text-lg text-gray-900 dark:text-gray-100">登录密码</span>
            </div>
            <div className="flex items-center">
              <span className="text-base text-gray-400 dark:text-gray-500 mr-1">修改</span>
              <ChevronRight size={16} className="text-gray-300 dark:text-gray-600" />
            </div>
          </div>

          <div className="px-4 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between active:bg-gray-50 dark:active:bg-gray-800 transition-colors cursor-pointer">
            <div className="flex items-center">
              <Smartphone size={20} className="text-gray-600 dark:text-gray-400 mr-3" />
              <span className="text-lg text-gray-900 dark:text-gray-100">绑定手机</span>
            </div>
            <div className="flex items-center">
              <span className="text-base text-gray-400 dark:text-gray-500 mr-1">{phone}</span>
              <ChevronRight size={16} className="text-gray-300 dark:text-gray-600" />
            </div>
          </div>

          <div className="px-4 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between active:bg-gray-50 dark:active:bg-gray-800 transition-colors cursor-pointer">
            <div className="flex items-center">
              <MonitorSmartphone size={20} className="text-gray-600 dark:text-gray-400 mr-3" />
              <span className="text-lg text-gray-900 dark:text-gray-100">登录设备管理</span>
            </div>
            <div className="flex items-center">
              <span className="text-base text-gray-400 dark:text-gray-500 mr-1">查看与下线</span>
              <ChevronRight size={16} className="text-gray-300 dark:text-gray-600" />
            </div>
          </div>

          <div className="px-4 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between active:bg-gray-50 dark:active:bg-gray-800 transition-colors cursor-pointer">
            <div className="flex items-center">
              <History size={20} className="text-gray-600 dark:text-gray-400 mr-3" />
              <span className="text-lg text-gray-900 dark:text-gray-100">登录记录</span>
            </div>
            <div className="flex items-center">
              <span className="text-base text-gray-400 dark:text-gray-500 mr-1 truncate max-w-[120px]">{lastLogin}</span>
              <ChevronRight size={16} className="text-gray-300 dark:text-gray-600" />
            </div>
          </div>

          <div className="px-4 py-4 flex items-center justify-between active:bg-gray-50 dark:active:bg-gray-800 transition-colors cursor-pointer">
            <div className="flex items-center">
              <Fingerprint size={20} className="text-gray-600 dark:text-gray-400 mr-3" />
              <span className="text-lg text-gray-900 dark:text-gray-100">支付安全</span>
            </div>
            <div className="flex items-center">
              <span className="text-base text-gray-400 dark:text-gray-500 mr-1">密码/指纹/面容</span>
              <ChevronRight size={16} className="text-gray-300 dark:text-gray-600" />
            </div>
          </div>
        </div>

        {/* Key Action Button */}
        <button className="w-full h-[48px] rounded-full bg-gradient-to-r from-brand-start to-brand-end text-white text-xl font-medium shadow-sm active:opacity-80 transition-opacity flex items-center justify-center">
          修改登录密码
        </button>
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
