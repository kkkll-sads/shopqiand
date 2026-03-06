import React, { useState, useEffect } from 'react';
import { ChevronLeft, HelpCircle, WifiOff, RefreshCcw, Image as ImageIcon, AlertCircle, Clock, FileText, Award } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { useAppNavigate } from '../../lib/navigation';
import { PageHeader } from '../../components/layout/PageHeader';

export const TradingDetailPage = () => {
  const { goTo, goBack } = useAppNavigate();

  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [listError, setListError] = useState(false);
  const [emptyList, setEmptyList] = useState(false);
  const [poolStatus, setPoolStatus] = useState<'not_started' | 'in_progress' | 'ended'>('in_progress');
  const [activeFilter, setActiveFilter] = useState('全部');
  const [imageError, setImageError] = useState<Record<number, boolean>>({});

  const filters = ['全部', '500', '1000', '2000', '5000', '10000'];

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleBack = () => {
    goBack();
  };

  const handleImageError = (id: number) => {
    setImageError(prev => ({ ...prev, [id]: true }));
  };

  const renderSkeleton = () => (
    <div className="px-4 space-y-3">
      {[1, 2, 3].map(i => (
        <Card key={i} className="p-3 flex">
          <Skeleton className="w-[100px] h-[100px] rounded-xl mr-3 shrink-0" />
          <div className="flex-1 flex flex-col justify-between py-1">
            <div>
              <Skeleton className="w-full h-4 mb-2" />
              <Skeleton className="w-2/3 h-4 mb-2" />
              <Skeleton className="w-1/3 h-3" />
            </div>
            <div className="flex justify-between items-end mt-2">
              <Skeleton className="w-20 h-5" />
              <Skeleton className="w-16 h-8 rounded-full" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="flex-1 flex flex-col bg-bg-base relative overflow-hidden">
      {/* Offline Banner */}
      {offline && (
        <div className="bg-red-50 text-primary-start px-4 py-2 flex items-center justify-between text-sm z-50 absolute top-0 left-0 right-0">
          <div className="flex items-center">
            <WifiOff size={14} className="mr-2" />
            <span>网络不稳定，请检查网络设置</span>
          </div>
          <button onClick={() => setOffline(false)} className="font-medium px-2 py-1 bg-white dark:bg-gray-900 rounded shadow-sm">刷新</button>
        </div>
      )}

      

      {/* Top Navigation */}
      <div className="px-4 pt-12 pb-4 flex items-center justify-between sticky top-0 z-40 bg-gradient-to-b from-red-50 to-red-50/95 dark:from-bg-box dark:to-bg-box backdrop-blur-sm">
        <button onClick={handleBack} className="w-8 h-8 rounded-full bg-white dark:bg-gray-900/80 flex items-center justify-center shadow-sm active:opacity-70 transition-opacity">
          <ChevronLeft size={20} className="text-text-main" />
        </button>
        <h1 className="text-2xl font-bold text-text-main">资产申购</h1>
        <button className="w-8 h-8 flex items-center justify-center active:opacity-70 transition-opacity">
          <HelpCircle size={20} className="text-text-main" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-8 bg-gradient-to-b from-red-50/50 to-bg-base dark:from-bg-base dark:to-bg-base">
        {/* Top Pool Info Card */}
        <div className="px-4 mb-5">
          {loading ? (
            <Card className="p-4">
              <div className="flex justify-between mb-4">
                <div>
                  <Skeleton className="w-16 h-5 rounded-full mb-2" />
                  <Skeleton className="w-32 h-6" />
                </div>
                <Skeleton className="w-10 h-10 rounded-full" />
              </div>
              <Skeleton className="w-24 h-4 mb-4" />
              <Skeleton className="w-full h-16 rounded-xl" />
            </Card>
          ) : (
            <Card className="p-4 relative overflow-hidden border border-white/50 shadow-sm">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-start/5 rounded-bl-full -z-10"></div>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="inline-block px-2 py-0.5 bg-primary-start/10 text-primary-start text-xs font-bold rounded-tl-[8px] rounded-br-[8px] mb-2">Pool-C</span>
                  <h2 className="text-4xl font-bold text-text-main leading-tight">数字流量池</h2>
                </div>
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-primary-start/40">
                  <Award size={24} />
                </div>
              </div>
              <div className="flex items-center text-sm text-text-sub mb-4">
                <Clock size={12} className="mr-1" /> 00:00 - 21:00
              </div>
              <div className="flex bg-bg-base rounded-xl p-3 border border-border-light/50">
                <div className="flex-1 flex flex-col">
                  <span className="text-s text-text-sub mb-1">预期收益率</span>
                  <span className="text-3xl font-bold text-primary-start">5.5%</span>
                </div>
                <div className="w-px bg-border-light mx-3"></div>
                <div className="flex-1 flex flex-col">
                  <span className="text-s text-text-sub mb-1">本期额度</span>
                  <span className="text-3xl font-bold text-text-main">200万</span>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* List Header */}
        <div className="px-4 mb-3 flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-1 h-3.5 bg-primary-start rounded-full mr-2"></div>
            <h3 className="text-xl font-bold text-text-main">资产申购列表</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button className="px-2.5 py-1 border border-border-light rounded-full text-s text-text-sub flex items-center active:bg-bg-card transition-colors">
              <FileText size={12} className="mr-1" /> 申购记录
            </button>
            <div className={`px-2.5 py-1 rounded-full text-s font-medium text-white shadow-sm ${poolStatus === 'ended' ? 'bg-text-aux' : 'bg-gradient-to-r from-primary-start to-primary-end'}`}>
              {poolStatus === 'not_started' ? '距开始 03:24:00' : poolStatus === 'in_progress' ? '距结束 03:24:00' : '本场结束'}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="px-4 mb-4 overflow-x-auto no-scrollbar">
          {loading ? (
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="w-16 h-7 rounded-full shrink-0" />
              ))}
            </div>
          ) : (
            <div className="flex space-x-2">
              {filters.map(f => (
                <button 
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`shrink-0 px-4 py-1.5 rounded-full text-base font-medium transition-colors ${activeFilter === f ? 'bg-primary-start text-white border border-primary-start shadow-sm' : 'bg-white dark:bg-gray-900 text-text-sub border border-border-light active:bg-bg-base'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Asset List */}
        {loading ? (
          renderSkeleton()
        ) : listError ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <AlertCircle size={48} className="text-text-aux mb-3 opacity-50" strokeWidth={1.5} />
            <p className="text-md text-text-sub mb-4">列表加载失败，请检查网络</p>
            <button 
              onClick={() => setListError(false)} 
              className="px-6 py-2 border border-primary-start text-primary-start rounded-full text-md font-medium active:bg-red-50 transition-colors"
            >
              重新加载
            </button>
          </div>
        ) : emptyList ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="w-24 h-24 bg-bg-card rounded-full flex items-center justify-center mb-4 border border-border-light shadow-sm">
              <ImageIcon size={32} className="text-text-aux opacity-50" />
            </div>
            <p className="text-md text-text-sub mb-4">暂无可申购资产</p>
            <button 
              onClick={handleBack} 
              className="px-6 py-2 border border-primary-start text-primary-start rounded-full text-md font-medium active:bg-red-50 transition-colors"
            >
              返回交易场次
            </button>
          </div>
        ) : (
          <div className="px-4 space-y-3">
            {[1, 2, 3, 4, 5].map((item) => (
              <Card key={item} className="p-3 flex active:opacity-90 transition-opacity cursor-pointer border border-white/50 shadow-sm">
                <div className="w-[100px] h-[100px] rounded-xl bg-bg-base mr-3 shrink-0 overflow-hidden relative border border-border-light/50">
                  {imageError[item] ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-bg-card text-text-aux">
                      <ImageIcon size={20} className="mb-1 opacity-50" />
                      <span className="text-2xs">加载失败</span>
                    </div>
                  ) : (
                    <img 
                      src={`https://picsum.photos/seed/asset${item}/200/200`} 
                      alt="Asset" 
                      className="w-full h-full object-cover" 
                      onError={() => handleImageError(item)}
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <div className="absolute top-0 left-0 bg-black/50 backdrop-blur-sm text-white text-2xs px-1.5 py-0.5 rounded-br-[8px]">限量</div>
                </div>
                <div className="flex-1 flex flex-col justify-between py-0.5">
                  <div>
                    <h4 className="text-lg font-bold text-text-main leading-snug line-clamp-2 mb-1.5">
                      共识验证节点 - 高级算力包 {item}
                    </h4>
                    <div className="flex items-center space-x-1.5 mb-1.5 flex-wrap gap-y-1">
                      <span className="text-2xs text-primary-start border border-primary-start/30 px-1.5 py-0.5 rounded-sm bg-red-50/50">官方自营</span>
                      {item % 2 === 0 && <span className="text-2xs text-orange-500 border border-orange-500/30 px-1.5 py-0.5 rounded-sm bg-orange-50/50">热卖</span>}
                    </div>
                    <div className="text-s text-text-sub">剩余名额: {100 * item} / 500</div>
                  </div>
                  <div className="flex items-end justify-between mt-2">
                    <div className="flex flex-col">
                      <span className="text-xs text-text-sub mb-0.5">申购区间</span>
                      <span className="text-xl font-bold text-primary-start leading-none">¥500 - ¥10,000</span>
                    </div>
                    <button 
                      className={`h-[36px] px-5 rounded-2xl text-base font-medium text-white shadow-sm transition-opacity ${poolStatus === 'ended' ? 'bg-border-light text-text-aux cursor-not-allowed' : 'bg-gradient-to-r from-primary-start to-primary-end active:opacity-80'}`}
                      disabled={poolStatus === 'ended'}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (poolStatus !== 'ended') {
                          goTo('pre_order');
                        }
                      }}
                    >
                      申购
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
