import React, { useRef, useState, useEffect } from 'react';
import { useAppNavigate } from '../../lib/navigation';
import { Search, Headset, Store, ShieldCheck, FileText, Volume2, Wallet, Package, Truck, ShoppingCart, WifiOff, RefreshCcw, FileX, ArrowRight } from 'lucide-react';
import { Skeleton } from '../../components/ui/Skeleton';
import { useRouteScrollRestoration } from '../../hooks/useRouteScrollRestoration';

const HOME_BANNERS = [
  {
    id: 'store-hot',
    title: '精选商城限时上新',
    description: '数码好物、热销 SKU 与自营专区快速直达。',
    eyebrow: 'HOT DROP',
    route: 'store',
    cta: '去逛商城',
    icon: Store,
    gradientClassName: 'from-[#171717] via-[#2D1B69] to-[#FF4B2B]',
    accentClassName: 'bg-[#FFD84D] text-[#2B1600]',
  },
  {
    id: 'trade-zone',
    title: '交易专区场次开放中',
    description: '查看当前可参与场次、额度与倒计时信息。',
    eyebrow: 'LIVE ACCESS',
    route: 'trading_zone',
    cta: '进入专区',
    icon: Wallet,
    gradientClassName: 'from-[#B71C1C] via-[#D32F2F] to-[#FF7A18]',
    accentClassName: 'bg-white/20 text-white',
  },
  {
    id: 'shield-entry',
    title: '实名认证与权益中心',
    description: '资料提交、实名状态和权益服务入口集中管理。',
    eyebrow: 'ACCOUNT',
    route: 'shield',
    cta: '立即查看',
    icon: ShieldCheck,
    gradientClassName: 'from-[#0F766E] via-[#0D9488] to-[#38BDF8]',
    accentClassName: 'bg-white/20 text-white',
  },
] as const;

export const HomePage = () => {
  const { goTo } = useAppNavigate();
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [error, setError] = useState(false);
  const [emptyFeed, setEmptyFeed] = useState(false);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveBannerIndex((current) => (current + 1) % HOME_BANNERS.length);
    }, 4000);

    return () => window.clearInterval(timer);
  }, []);

  useRouteScrollRestoration({
    containerRef: scrollContainerRef,
    namespace: 'home-page',
    restoreDeps: [emptyFeed, error, loading],
    restoreWhen: !error && !loading,
  });

  const renderHeader = () => (
    <div className="sticky top-0 z-40 bg-white dark:bg-gray-900/90 dark:bg-gray-900/90 backdrop-blur-md px-4 py-2 flex items-center space-x-3 border-b border-gray-100 dark:border-gray-800">
      <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-[#FF4142] flex items-center justify-center text-white">
        <img src="https://picsum.photos/seed/jdlogo/100/100" alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
      </div>
      <div 
        className="flex-1 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center px-3 shadow-sm border border-transparent dark:border-gray-700 cursor-pointer"
        onClick={() => goTo('search')}
      >
        <Search size={14} className="text-gray-400 dark:text-gray-500 mr-2 shrink-0" />
        <span className="text-[12px] text-gray-400 dark:text-gray-500 truncate">搜索商品 / SKU / 订单</span>
      </div>
      <button 
        className="flex items-center justify-center w-8 h-8 text-gray-900 dark:text-gray-100 shrink-0 active:opacity-70"
        onClick={() => goTo('help_center')}
      >
        <Headset size={20} />
      </button>
    </div>
  );

  const renderContent = () => {
    if (error) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-4 pt-20">
          <RefreshCcw size={40} className="text-gray-300 dark:text-gray-600 dark:text-gray-400 mb-4" />
          <p className="text-[14px] text-gray-500 dark:text-gray-400 mb-6">页面加载失败，请检查网络后重试</p>
          <button 
            onClick={() => { setLoading(true); setError(false); setTimeout(() => setLoading(false), 1000); }} 
            className="px-6 py-2 border border-gray-200 dark:border-gray-700 rounded-full text-[13px] text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 shadow-sm active:bg-gray-50 dark:active:bg-gray-700"
          >
            重新加载
          </button>
        </div>
      );
    }

    return (
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto no-scrollbar pb-4">
        <div className="mx-4 mt-4 mb-4">
          <div className="relative overflow-hidden rounded-[24px] shadow-[0_18px_45px_rgba(15,23,42,0.14)]">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${activeBannerIndex * 100}%)` }}
            >
              {HOME_BANNERS.map((banner) => {
                const Icon = banner.icon;

                return (
                  <button
                    key={banner.id}
                    type="button"
                    className={`relative min-h-[168px] w-full shrink-0 overflow-hidden bg-gradient-to-r px-5 py-5 text-left ${banner.gradientClassName}`}
                    onClick={() => goTo(banner.route)}
                    aria-label={banner.title}
                  >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.24),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.18),transparent_32%)]" />
                    <div className="absolute -right-6 top-4 h-24 w-24 rounded-full border border-white/20" />
                    <div className="absolute right-10 bottom-[-30px] h-28 w-28 rounded-full bg-white/10 blur-2xl" />

                    <div className="relative z-10 flex h-full items-start justify-between gap-4">
                      <div className="max-w-[72%]">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-[0.16em] ${banner.accentClassName}`}>
                          {banner.eyebrow}
                        </span>
                        <h3 className="mt-3 text-[24px] font-bold leading-tight text-white">
                          {banner.title}
                        </h3>
                        <p className="mt-2 text-[13px] leading-6 text-white/88">
                          {banner.description}
                        </p>
                        <span className="mt-4 inline-flex items-center rounded-full border border-white/25 bg-white/12 px-3 py-1.5 text-[12px] font-medium text-white backdrop-blur-sm">
                          {banner.cta}
                          <ArrowRight size={14} className="ml-1.5" />
                        </span>
                      </div>

                      <div className="relative mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/12 text-white shadow-[0_10px_28px_rgba(15,23,42,0.2)] backdrop-blur-sm">
                        <Icon size={24} strokeWidth={1.8} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex items-center justify-between px-4">
              <div className="pointer-events-auto flex items-center gap-2">
                {HOME_BANNERS.map((banner, index) => {
                  const isActive = index === activeBannerIndex;

                  return (
                    <button
                      key={banner.id}
                      type="button"
                      aria-label={`切换到第 ${index + 1} 张轮播`}
                      onClick={() => setActiveBannerIndex(index)}
                      className={`h-2.5 rounded-full transition-all ${
                        isActive ? 'w-6 bg-white' : 'w-2.5 bg-white/45'
                      }`}
                    />
                  );
                })}
              </div>

              <div className="rounded-full border border-white/20 bg-black/15 px-2.5 py-1 text-[11px] font-medium tracking-[0.18em] text-white backdrop-blur-sm">
                {String(activeBannerIndex + 1).padStart(2, '0')} / {String(HOME_BANNERS.length).padStart(2, '0')}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Entry */}
        <div className="grid grid-cols-5 gap-2 px-4 mb-4">
          <div 
            className="flex flex-col items-center cursor-pointer active:opacity-70"
            onClick={() => goTo('store')}
          >
            <div className="w-11 h-11 rounded-[14px] bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center text-[#FF4142] mb-1.5">
              <Store size={22} strokeWidth={1.5} />
            </div>
            <span className="text-[12px] text-gray-900 dark:text-gray-100">商城</span>
          </div>
          <div 
            className="flex flex-col items-center cursor-pointer active:opacity-70"
            onClick={() => goTo('shield')}
          >
            <div className="w-11 h-11 rounded-[14px] bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center text-[#FF4142] mb-1.5">
              <ShieldCheck size={22} strokeWidth={1.5} />
            </div>
            <span className="text-[12px] text-gray-900 dark:text-gray-100">确权中心</span>
          </div>
          <div 
            className="flex flex-col items-center cursor-pointer active:opacity-70"
            onClick={() => goTo('order')}
          >
            <div className="w-11 h-11 rounded-[14px] bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center text-[#FF4142] mb-1.5">
              <FileText size={22} strokeWidth={1.5} />
            </div>
            <span className="text-[12px] text-gray-900 dark:text-gray-100">订单</span>
          </div>
          <div 
            className="flex flex-col items-center cursor-pointer active:opacity-70"
            onClick={() => goTo('live')}
          >
            <div className="w-11 h-11 rounded-[14px] bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center text-[#FF4142] mb-1.5">
              <Volume2 size={22} strokeWidth={1.5} />
            </div>
            <span className="text-[12px] text-gray-900 dark:text-gray-100">直播</span>
          </div>
          <div 
            className="flex flex-col items-center cursor-pointer active:opacity-70"
            onClick={() => goTo('help_center')}
          >
            <div className="w-11 h-11 rounded-[14px] bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center text-[#FF4142] mb-1.5">
              <Headset size={22} strokeWidth={1.5} />
            </div>
            <span className="text-[12px] text-gray-900 dark:text-gray-100">客服</span>
          </div>
        </div>

        {/* Announcement */}
        <div 
          className="mx-4 mb-4 h-9 bg-white dark:bg-gray-800 rounded-full flex items-center px-3 shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden cursor-pointer active:opacity-80"
          onClick={() => goTo('announcement')}
        >
          <Volume2 size={16} className="text-[#FF4142] mr-2 shrink-0" />
          <div className="flex-1 overflow-hidden relative h-full flex items-center">
            <div className="absolute whitespace-nowrap text-[12px] text-gray-900 dark:text-gray-100 animate-marquee">
              最新公告：数据资产确权交易平台正式上线，欢迎体验...
            </div>
          </div>
        </div>

        {/* Trading Zone Banner (Replaced Asset/Flash Sale Banner) */}
        <div 
          className="mx-4 mb-4 rounded-[16px] bg-gradient-to-r from-[#D32F2F] to-[#FF4B2B] p-5 relative overflow-hidden shadow-md cursor-pointer active:opacity-90 transition-opacity flex items-center justify-between min-h-[88px]"
          onClick={() => goTo('trading_zone')}
        >
          {/* Decorative background elements */}
          <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-white/10 to-transparent"></div>
          <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full border-4 border-white/10"></div>
          
          <div className="relative z-10">
            <h3 className="text-white font-bold text-[20px] mb-1 tracking-wide">交易专区</h3>
            <p className="text-white/90 text-[13px] font-medium">数据资产确权交易</p>
          </div>
          
          <div className="relative z-10 w-10 h-10 rounded-full bg-white dark:bg-gray-900/20 backdrop-blur-sm flex items-center justify-center border border-white/30 shrink-0">
            <ArrowRight size={20} className="text-[#FF4142] dark:text-white" />
          </div>
        </div>

        {/* Order Status */}
        <div className="mx-4 mb-4 bg-white dark:bg-gray-900 rounded-[16px] shadow-sm border border-gray-100 dark:border-gray-800 py-4">
          <div className="flex justify-around">
            <div 
              className="flex flex-col items-center text-gray-900 dark:text-gray-100 relative cursor-pointer active:opacity-70 w-1/4"
              onClick={() => goTo('order')}
            >
              <Wallet size={24} strokeWidth={1.5} className="mb-1.5 text-gray-700 dark:text-gray-400" />
              <span className="text-[12px]">待付款</span>
              <div className="absolute top-0 right-4 bg-[#FF4142] text-white text-[10px] font-bold px-1.5 rounded-full border border-white dark:border-gray-900">2</div>
            </div>
            <div 
              className="flex flex-col items-center text-gray-900 dark:text-gray-100 cursor-pointer active:opacity-70 w-1/4"
              onClick={() => goTo('order')}
            >
              <Package size={24} strokeWidth={1.5} className="mb-1.5 text-gray-700 dark:text-gray-400" />
              <span className="text-[12px]">待发货</span>
            </div>
            <div 
              className="flex flex-col items-center text-gray-900 dark:text-gray-100 cursor-pointer active:opacity-70 w-1/4"
              onClick={() => goTo('order')}
            >
              <Truck size={24} strokeWidth={1.5} className="mb-1.5 text-gray-700 dark:text-gray-400" />
              <span className="text-[12px]">待收货</span>
            </div>
            <div 
              className="flex flex-col items-center text-gray-900 dark:text-gray-100 cursor-pointer active:opacity-70 w-1/4"
              onClick={() => goTo('after_sales')}
            >
              <Headset size={24} strokeWidth={1.5} className="mb-1.5 text-gray-700 dark:text-gray-400" />
              <span className="text-[12px]">售后</span>
            </div>
          </div>
        </div>

        {/* Product Feed */}
        <div className="px-4 mb-4">
          <h3 className="text-[16px] font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center justify-center">
            <span className="w-4 h-px bg-gray-300 dark:bg-gray-600 mr-2"></span>
            推荐商品
            <span className="w-4 h-px bg-gray-300 dark:bg-gray-600 ml-2"></span>
          </h3>
          
          {emptyFeed ? (
            <div className="bg-white dark:bg-gray-900 rounded-[16px] flex flex-col items-center justify-center py-10 border border-gray-100 dark:border-gray-800 shadow-sm">
              <FileX size={40} className="text-gray-300 dark:text-gray-600 dark:text-gray-400 mb-3" strokeWidth={1.5} />
              <p className="text-[14px] text-gray-500 dark:text-gray-400 mb-4">暂无推荐商品</p>
              <button 
                className="px-5 py-2 border border-[#FF4142] text-[#FF4142] rounded-full text-[13px] font-medium active:bg-red-50 dark:active:bg-red-900/20 transition-colors"
                onClick={() => goTo('category')}
              >
                去分类看看
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {loading ? (
                [1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-white dark:bg-gray-900 rounded-[16px] overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col">
                    <Skeleton className="w-full aspect-square rounded-none" />
                    <div className="p-3 space-y-2">
                      <Skeleton className="w-full h-3" />
                      <Skeleton className="w-2/3 h-3" />
                      <Skeleton className="w-1/2 h-4 mt-2" />
                    </div>
                  </div>
                ))
              ) : (
                [1, 2, 3, 4].map((i) => (
                  <div 
                    key={i} 
                    className="bg-white dark:bg-gray-900 rounded-[16px] overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 cursor-pointer active:opacity-70 transition-opacity flex flex-col"
                    onClick={() => goTo('product_detail')}
                  >
                    <img src={`https://picsum.photos/seed/prod${i}/200/200`} alt="Product" className="w-full aspect-square object-cover" referrerPolicy="no-referrer" />
                    <div className="p-3 flex-1 flex flex-col">
                      <div className="text-[13px] text-gray-900 dark:text-gray-100 line-clamp-2 mb-2 leading-tight">
                        <span className="inline-block bg-[#FF4142] text-white text-[10px] px-1 rounded-[4px] mr-1 font-medium">自营</span>
                        Sony/索尼 WH-1000XM5 头戴式无线降噪耳机 蓝牙耳机
                      </div>
                      <div className="flex space-x-1 mb-2 mt-auto">
                        <span className="text-[10px] text-[#FF4142] border border-[#FF4142]/30 rounded-[4px] px-1">包邮</span>
                        <span className="text-[10px] text-[#FF4142] border border-[#FF4142]/30 rounded-[4px] px-1">热卖</span>
                      </div>
                      <div className="flex justify-between items-end">
                        <div className="text-[16px] font-bold text-[#FF4142] leading-none">
                          <span className="text-[12px]">¥</span>2499
                        </div>
                        <button className="w-6 h-6 rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-900 dark:text-gray-100">
                          <ShoppingCart size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F7F8FA] dark:bg-gray-950 relative overflow-hidden">
      {/* Offline Banner */}
      {offline && (
        <div className="bg-red-50 dark:bg-red-900/30 text-[#FF4142] dark:text-red-400 px-4 py-2 flex items-center justify-between text-[12px] z-50 absolute top-0 left-0 right-0">
          <div className="flex items-center">
            <WifiOff size={14} className="mr-2" />
            <span>网络不稳定，请检查网络设置</span>
          </div>
          <button onClick={() => setOffline(false)} className="font-medium px-2 py-1 bg-white dark:bg-gray-800 rounded shadow-sm">刷新</button>
        </div>
      )}

      

      {renderHeader()}
      {renderContent()}


    </div>
  );
};
