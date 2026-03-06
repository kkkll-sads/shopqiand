import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, ShieldCheck, RefreshCcw, Truck, Headset, 
  ChevronDown, ChevronUp, WifiOff, AlertCircle
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { useAppNavigate } from '../../lib/navigation';
import { PageHeader } from '../../components/layout/PageHeader';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';

const SERVICES = [
  {
    id: 'official',
    icon: ShieldCheck,
    title: '自营/官方保障',
    summary: '正品行货，品质保证',
    details: '本商品由品牌官方直接提供，100%正品保证。我们承诺提供与实体店同等的质量标准和售后服务，让您购物无忧。所有商品均经过严格的质量检测，确保送达您手中的商品完美无瑕。'
  },
  {
    id: 'return',
    icon: RefreshCcw,
    title: '7天无理由退换',
    summary: '满足条件可享7天无理由退换货',
    details: '自收到商品之日起7天内，在商品完好、不影响二次销售的前提下，可申请无理由退换货。部分特殊商品（如生鲜、定制商品、已拆封的音像制品等）除外。退换货运费由买家承担（商品质量问题除外）。'
  },
  {
    id: 'shipping',
    icon: Truck,
    title: '极速发货/运费说明',
    summary: '24小时内发货，满99元包邮',
    details: '我们承诺在订单支付成功后24小时内完成发货（预售商品除外）。普通会员单笔订单满99元免基础运费，PLUS会员尊享全年无限次免邮权益。偏远地区可能需要额外支付部分运费，具体以结算页面显示为准。'
  },
  {
    id: 'aftersales',
    icon: Headset,
    title: '售后无忧',
    summary: '专业客服团队，快速响应',
    details: '提供7x24小时在线客服支持。如遇商品质量问题，可享受15天内免费换货，1年内免费维修服务。退换货流程简便：提交申请 -> 快递上门取件 -> 仓库核验 -> 快速退款/换新。'
  }
];

export const ServiceDescriptionPage = () => {
  const { goTo, goBack } = useAppNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [empty, setEmpty] = useState(false);
  const [offline, setOffline] = useState(!navigator.onLine);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleBack = () => {
    goBack();
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const renderSkeleton = () => (
    <div className="p-4 space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="p-4">
          <div className="flex items-center space-x-3">
            <Skeleton className="w-6 h-6 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="w-1/3 h-4" />
              <Skeleton className="w-2/3 h-3" />
            </div>
            <Skeleton className="w-4 h-4" />
          </div>
        </Card>
      ))}
    </div>
  );

  const renderError = () => (
    <ErrorState onRetry={fetchData} />
  );

  const renderEmpty = () => (
    <EmptyState message="暂无服务说明" />
  );

  return (
    <div className="w-full h-full bg-bg-base flex flex-col relative overflow-hidden">
      {/* Header */}
      <div className="h-12 bg-white dark:bg-[#1A1A1A] flex items-center px-4 shrink-0 relative z-10">
        <button 
          onClick={handleBack}
          className="p-1 -ml-1 active:bg-bg-base rounded-full transition-colors"
        >
          <ChevronLeft size={24} className="text-text-main" />
        </button>
        <h1 className="flex-1 text-center text-xl font-medium text-text-main pr-8">
          服务说明
        </h1>
      </div>

      {/* Offline Banner */}
      {offline && (
        <div className="bg-red-50 dark:bg-red-900/20 px-4 py-2 flex items-center shrink-0">
          <WifiOff size={14} className="text-primary-start mr-2 shrink-0" />
          <span className="text-sm text-primary-start">当前网络不可用，请检查网络设置</span>
        </div>
      )}

      {/* Dev Controls (Hidden in production) */}
      <div className="absolute top-14 right-4 z-50 flex flex-col gap-2 opacity-50 hover:opacity-100 transition-opacity">
        <button className="text-xs bg-black/50 text-white px-2 py-1 rounded" onClick={() => { setLoading(false); setError(false); setEmpty(false); }}>Normal</button>
        <button className="text-xs bg-black/50 text-white px-2 py-1 rounded" onClick={() => { setLoading(true); setError(false); setEmpty(false); }}>Loading</button>
        <button className="text-xs bg-black/50 text-white px-2 py-1 rounded" onClick={() => { setLoading(false); setError(true); setEmpty(false); }}>Error</button>
        <button className="text-xs bg-black/50 text-white px-2 py-1 rounded" onClick={() => { setLoading(false); setError(false); setEmpty(true); }}>Empty</button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-safe">
        {loading ? (
          renderSkeleton()
        ) : error ? (
          renderError()
        ) : empty ? (
          renderEmpty()
        ) : (
          <div className="p-4 flex flex-col min-h-full">
            <div className="space-y-3 flex-1">
              {SERVICES.map((service) => {
                const Icon = service.icon;
                const isExpanded = expandedId === service.id;
                
                return (
                  <Card 
                    key={service.id} 
                    className="overflow-hidden transition-all duration-300"
                  >
                    <div 
                      className="p-4 flex items-start cursor-pointer active:bg-bg-base transition-colors"
                      onClick={() => toggleExpand(service.id)}
                    >
                      <Icon size={20} className="text-primary-start mt-0.5 shrink-0" />
                      <div className="ml-3 flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-medium text-text-main">
                            {service.title}
                          </h3>
                          {isExpanded ? (
                            <ChevronUp size={16} className="text-text-secondary shrink-0" />
                          ) : (
                            <ChevronDown size={16} className="text-text-secondary shrink-0" />
                          )}
                        </div>
                        <p className="text-base text-text-secondary mt-1">
                          {service.summary}
                        </p>
                      </div>
                    </div>
                    
                    {/* Expandable Details */}
                    <div 
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        isExpanded ? 'max-h-[200px] opacity-100' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <div className="px-4 pb-4 pt-1 ml-8">
                        <div className="p-3 bg-bg-base rounded-lg">
                          <p className="text-sm text-text-secondary leading-relaxed">
                            {service.details}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
            
            {/* Bottom Hint */}
            <div className="mt-8 mb-4 text-center">
              <p className="text-sm text-text-tertiary">
                具体以订单与页面展示为准
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
