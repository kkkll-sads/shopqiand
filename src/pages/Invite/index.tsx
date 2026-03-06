import React, { useState, useEffect } from 'react';
import { ChevronLeft, WifiOff, AlertCircle, Copy, QrCode, Download, Share2, Link as LinkIcon, Image as ImageIcon, MessageCircle, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { useAppNavigate } from '../../lib/navigation';
import { PageHeader } from '../../components/layout/PageHeader';
import { ErrorState } from '../../components/ui/ErrorState';

export const InvitePage = () => {
  const { goTo, goBack } = useAppNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [offline, setOffline] = useState(false);
  const [empty, setEmpty] = useState(false);
  
  const [selectedTemplate, setSelectedTemplate] = useState(0);
  const [rulesExpanded, setRulesExpanded] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const inviteCode = 'A8B9C0';
  const inviteLink = `https://shujiaosuo.com/inv/${inviteCode}`;
  
  const templates = [
    'https://picsum.photos/seed/poster1/200/300',
    'https://picsum.photos/seed/poster2/200/300',
    'https://picsum.photos/seed/poster3/200/300',
    'https://picsum.photos/seed/poster4/200/300',
  ];

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

  const handleCopy = (text: string, type: string) => {
    alert(`${type}已复制: ${text}`);
  };

  const handleSaveImage = () => {
    // Simulate save failure randomly for demonstration
    if (Math.random() > 0.5) {
      setSaveError(true);
    } else {
      setSaveError(false);
      alert('图片已保存到相册');
    }
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center w-1/3">邀请推广</h1>
        <div className="w-1/3"></div>
      </div>
    </div>
  );

  const renderSkeleton = () => (
    <div className="p-4 space-y-4">
      {/* Invite Card Skeleton */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm animate-pulse flex flex-col items-center">
        <div className="w-24 h-4 bg-gray-200 dark:bg-gray-800 rounded mb-4"></div>
        <div className="w-48 h-10 bg-gray-200 dark:bg-gray-800 rounded mb-6"></div>
        <div className="w-32 h-32 bg-gray-200 dark:bg-gray-800 rounded-xl mb-6"></div>
        <div className="w-full h-10 bg-gray-100 dark:bg-gray-800 rounded-lg"></div>
      </div>
      
      {/* Templates Skeleton */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm animate-pulse">
        <div className="w-24 h-5 bg-gray-200 dark:bg-gray-800 rounded mb-4"></div>
        <div className="flex space-x-3 overflow-hidden">
          {[1, 2, 3].map(i => (
            <div key={i} className="w-[100px] h-[150px] bg-gray-200 dark:bg-gray-800 rounded-lg shrink-0"></div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderError = () => (
    <ErrorState onRetry={fetchData} />
  );

  const renderContent = () => {
    if (loading) return renderSkeleton();
    if (error) return renderError();

    return (
      <div className="p-4 pb-10 space-y-4">
        
        {/* Invite Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm dark:shadow-none border border-transparent dark:border-gray-800 flex flex-col items-center relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-red-50 dark:from-transparent to-transparent"></div>
          

          <div className="text-md text-gray-500 dark:text-gray-400 mb-2 relative z-10">我的专属邀请码</div>
          <div className="flex items-center justify-center mb-6 relative z-10">
            <span className="text-7xl font-bold text-brand-start tracking-wider leading-none mr-3">{inviteCode}</span>
            <button 
              onClick={() => handleCopy(inviteCode, '邀请码')}
              className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-brand-start active:opacity-70"
            >
              <Copy size={16} />
            </button>
          </div>

          <div className="w-40 h-40 bg-gray-50 dark:bg-gray-800 rounded-2xl p-3 mb-6 relative z-10 border border-gray-100 dark:border-gray-700 flex items-center justify-center">
            {/* Placeholder for actual QR Code */}
            <QrCode size={120} className="text-gray-800 dark:text-gray-200" strokeWidth={1} />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/50 rounded-2xl transition-opacity cursor-pointer" onClick={handleSaveImage}>
              <div className="flex flex-col items-center text-white">
                <Download size={24} className="mb-1" />
                <span className="text-sm">保存二维码</span>
              </div>
            </div>
          </div>

          <div className="w-full bg-gray-50 dark:bg-gray-800 rounded-lg p-3 flex items-center justify-between relative z-10">
            <div className="flex-1 min-w-0 mr-3">
              <div className="text-sm text-gray-400 dark:text-gray-500 mb-1">专属邀请链接</div>
              <div className="text-base text-gray-900 dark:text-gray-100 truncate">{inviteLink}</div>
            </div>
            <button 
              onClick={() => handleCopy(inviteLink, '邀请链接')}
              className="px-4 py-1.5 rounded-full border border-[#FF4142] text-brand-start text-sm font-medium active:bg-red-50 dark:active:bg-red-900/20 whitespace-nowrap"
            >
              复制链接
            </button>
          </div>
        </div>

        {/* Save Error Banner */}
        {saveError && (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-3 flex items-start">
            <AlertTriangle size={16} className="text-orange-500 mt-0.5 mr-2 shrink-0" />
            <div className="flex-1">
              <div className="text-base text-orange-700 dark:text-orange-400 font-medium mb-1">保存图片失败</div>
              <div className="text-sm text-orange-600/80 dark:text-orange-400/80 mb-2">请在系统设置中允许应用访问相册权限</div>
              <button 
                onClick={handleSaveImage}
                className="text-sm text-white bg-orange-500 px-3 py-1 rounded-full active:opacity-80"
              >
                重新尝试
              </button>
            </div>
          </div>
        )}

        {/* Poster Templates */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm dark:shadow-none border border-transparent dark:border-gray-800">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">海报模板</h3>
          </div>
          
          {empty ? (
            <div className="py-8 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
              <ImageIcon size={32} className="mb-2 opacity-50" />
              <span className="text-base">暂无可用海报模板</span>
            </div>
          ) : (
            <>
              <div className="flex space-x-3 overflow-x-auto no-scrollbar pb-2 mb-4">
                {templates.map((url, idx) => (
                  <div 
                    key={idx}
                    onClick={() => setSelectedTemplate(idx)}
                    className={`relative shrink-0 rounded-lg overflow-hidden cursor-pointer transition-all ${
                      selectedTemplate === idx 
                        ? 'border-2 border-[#FF4142] shadow-md scale-105' 
                        : 'border border-gray-200 dark:border-gray-700 opacity-80'
                    }`}
                  >
                    <img src={url} alt={`Template ${idx + 1}`} className="w-[100px] h-[150px] object-cover" referrerPolicy="no-referrer" />
                    {selectedTemplate === idx && (
                      <div className="absolute bottom-0 left-0 right-0 bg-brand-start text-white text-xs text-center py-0.5">
                        已选择
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <button className="w-full h-[48px] rounded-full bg-gradient-to-r from-brand-start to-brand-end text-white text-xl font-medium shadow-sm active:opacity-80 transition-opacity flex items-center justify-center">
                生成专属海报
              </button>
            </>
          )}
        </div>

        {/* Share Methods */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm dark:shadow-none border border-transparent dark:border-gray-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">分享至</h3>
          <div className="grid grid-cols-4 gap-4">
            <div className="flex flex-col items-center cursor-pointer active:opacity-70">
              <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center text-success mb-2">
                <MessageCircle size={24} />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">微信好友</span>
            </div>
            <div className="flex flex-col items-center cursor-pointer active:opacity-70">
              <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center text-success mb-2">
                <Share2 size={24} />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">朋友圈</span>
            </div>
            <div 
              className="flex flex-col items-center cursor-pointer active:opacity-70"
              onClick={() => handleCopy(inviteLink, '链接')}
            >
              <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500 mb-2">
                <LinkIcon size={24} />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">复制链接</span>
            </div>
            <div 
              className="flex flex-col items-center cursor-pointer active:opacity-70"
              onClick={handleSaveImage}
            >
              <div className="w-12 h-12 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-500 mb-2">
                <Download size={24} />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">保存图片</span>
            </div>
          </div>
        </div>

        {/* Rules Foldable Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-none border border-transparent dark:border-gray-800 overflow-hidden">
          <div 
            className="px-4 py-4 flex justify-between items-center cursor-pointer active:bg-gray-50 dark:active:bg-gray-800 transition-colors"
            onClick={() => setRulesExpanded(!rulesExpanded)}
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">奖励说明与注意事项</h3>
            {rulesExpanded ? <ChevronUp size={20} className="text-gray-400 dark:text-gray-500" /> : <ChevronDown size={20} className="text-gray-400 dark:text-gray-500" />}
          </div>
          
          {rulesExpanded && (
            <div className="px-4 pb-4 pt-1 border-t border-gray-100 dark:border-gray-800 text-base text-gray-500 dark:text-gray-400 leading-relaxed space-y-2">
              <p>1. 邀请好友注册并完成首次实名认证，您和好友各得 100 积分奖励。</p>
              <p>2. 好友在注册后 30 天内完成首笔交易，您将获得交易额 1% 的现金返利，最高不超过 1000 元。</p>
              <p>3. 邀请奖励将在满足条件后的 24 小时内自动发放到您的账户余额/积分中。</p>
              <p>4. 严禁通过作弊手段（如恶意注册、虚假交易等）获取奖励，一经发现，平台有权取消奖励并封禁账号。</p>
              <p>5. 本活动最终解释权归树交所所有。</p>
            </div>
          )}
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
