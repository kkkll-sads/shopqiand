/**
 * @file Home/index.tsx - 首页
 * @description 应用主页面，包括轮播图、快捷入口、滚动公告、交易专区、订单状态、申购记录、弹出公告。
 */

import React, { useCallback, useEffect, useRef, useState } from 'react'; // React 核心 Hook
import { useAppNavigate } from '../../lib/navigation';
import { Search, Headset, Store, ShieldCheck, FileText, Volume2, Wallet, Package, Truck, WifiOff, RefreshCcw, ArrowRight, User } from 'lucide-react';
import { Skeleton } from '../../components/ui/Skeleton';
import { PullToRefreshContainer } from '../../components/ui/PullToRefreshContainer';
import { ForceAnnouncementModal } from '../../components/biz/ForceAnnouncementModal';
import { useRouteScrollRestoration } from '../../hooks/useRouteScrollRestoration';
import { useRequest } from '../../hooks/useRequest';
import { bannerApi, type BannerItem } from '../../api/modules/banner';
import { announcementApi } from '../../api/modules/announcement';
import { accountApi } from '../../api/modules/account';
import { reservationApi } from '../../api/modules/reservation';
import { resolveUploadUrl } from '../../api/modules/upload';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { ReservationCard } from '../../features/reservation/ReservationCard';
import { openCustomerServiceLink } from '../../lib/customerService';



/**
 * HomePage - 应用首页
 * 功能：轮播图 → 快捷入口 → 公告 → 交易专区 → 订单状态 → 申购记录
 */
export const HomePage = () => {
  const { goTo } = useAppNavigate();
  const { showToast } = useFeedback();
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [error, setError] = useState(false);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  /* ---- 轮播图数据（来自后端 API） ---- */
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [bannersLoading, setBannersLoading] = useState(true);

  /* 请求轮播图列表 */
  const fetchBanners = useCallback(async (signal?: AbortSignal) => {
    setBannersLoading(true);
    try {
      const response = await bannerApi.getList({ page: 1, limit: 10 }, signal);
      const list = response?.list;
      setBanners(Array.isArray(list) ? list : []);
    } catch {
      /* 请求失败时置空，不展示轮播图 */
      setBanners([]);
    } finally {
      setBannersLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void fetchBanners(controller.signal);
    return () => controller.abort();
  }, [fetchBanners]);

  /* ---- 申购记录（实时 API） ---- */
  const reservationsRequest = useRequest(
    (signal) => reservationApi.getList({ page: 1, limit: 3 }, signal),
    { cacheKey: 'home:reservations' },
  );
  const reservations = reservationsRequest.data?.list ?? [];

  /* ---- 滚动公告（实时 API） ---- */
  const scrollAnnouncementsRequest = useRequest(
    (signal) => announcementApi.getScrollList(signal),
    { cacheKey: 'home:scroll-announcements' },
  );
  const scrollAnnouncements = scrollAnnouncementsRequest.data?.list ?? [];

  /* ---- 用户资料（头像） ---- */
  const profileRequest = useRequest(
    (signal) => accountApi.getProfile({ signal }),
    { cacheKey: 'home:profile' },
  );
  const userAvatar = profileRequest.data?.userInfo?.avatar;

  /* ---- 弹出公告 ---- */
  const popupRequest = useRequest(
    (signal) => announcementApi.getPopupList(signal),
    { cacheKey: 'home:popup-announcements' },
  );
  const popupList = popupRequest.data?.list ?? [];
  const unreadPopups = popupList.filter((a) => !a.is_read);

  const [showPopupIndex, setShowPopupIndex] = useState(0);
  const [popupVisible, setPopupVisible] = useState(false);
  const popupDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setShowPopupIndex(0);
    setPopupVisible(false);
  }, [popupList.length]);

  useEffect(() => {
    if (unreadPopups.length === 0) return;

    const item = unreadPopups[showPopupIndex];
    if (!item) return;

    const delayMs = Math.max(0, item.popup_delay ?? 0) * 1000;

    popupDelayRef.current = window.setTimeout(() => {
      setPopupVisible(true);
    }, delayMs);

    return () => {
      if (popupDelayRef.current) {
        window.clearTimeout(popupDelayRef.current);
        popupDelayRef.current = null;
      }
    };
  }, [unreadPopups, showPopupIndex]);

  const handlePopupClose = useCallback(() => {
    setPopupVisible(false);
    if (showPopupIndex < unreadPopups.length - 1) {
      setShowPopupIndex((i) => i + 1);
    }
  }, [showPopupIndex, unreadPopups.length]);

  /** 下拉刷新回调 */
  const handleRefresh = useCallback(async () => {
    setLoading(true);
    await Promise.allSettled([
      fetchBanners(),
      reservationsRequest.reload(),
      scrollAnnouncementsRequest.reload(),
      profileRequest.reload(),
      popupRequest.reload(),
    ]);
    setLoading(false);
  }, [fetchBanners, reservationsRequest, scrollAnnouncementsRequest, profileRequest, popupRequest]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  /* 自动轮播：依赖 banners 长度 */
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveBannerIndex((current) => (current + 1) % banners.length);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [banners.length]);

  useRouteScrollRestoration({
    containerRef: scrollContainerRef,
    namespace: 'home-page',
    restoreDeps: [error, loading],
    restoreWhen: !error && !loading,
  });

  /** 解析轮播图图片地址（支持后端返回相对路径） */
  const resolveBannerImage = (item: BannerItem) => {
    if (!item.image) return '';
    if (/^https?:\/\//i.test(item.image)) return item.image;
    return resolveUploadUrl(item.image);
  };

  const handleOpenSupport = useCallback(() => {
    void openCustomerServiceLink(({ duration, message, type }) => {
      showToast({ duration, message, type });
    });
  }, [showToast]);

  const renderHeader = () => (
    <div className="sticky top-0 z-40 bg-white dark:bg-gray-900/90 backdrop-blur-md px-4 py-2 flex items-center space-x-3 border-b border-gray-100 dark:border-gray-800">
      <div
        className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-[#FF4142] flex items-center justify-center text-white cursor-pointer active:opacity-80"
        onClick={() => goTo('user')}
      >
        {userAvatar ? (
          <img src={userAvatar} alt="头像" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <User size={18} />
        )}
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
        onClick={handleOpenSupport}
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
        {/* ===== 轮播图区域（数据来自 /api/Banner/getBannerList） ===== */}
        <div className="mx-4 mt-4 mb-4">
          <div className="relative overflow-hidden rounded-[24px] shadow-[0_18px_45px_rgba(15,23,42,0.14)]">
            {bannersLoading ? (
              /* 加载骨架屏 */
              <Skeleton className="w-full min-h-[168px] rounded-none" />
            ) : banners.length > 0 ? (
              <>
                <div
                  className="flex transition-transform duration-500 ease-out"
                  style={{ transform: `translateX(-${activeBannerIndex * 100}%)` }}
                >
                  {banners.map((banner) => {
                    const imageUrl = resolveBannerImage(banner);

                    return (
                      <div
                        key={banner.id}
                        className="relative min-h-[168px] w-full shrink-0 overflow-hidden bg-gradient-to-r from-[#171717] via-[#2D1B69] to-[#FF4B2B]"
                        aria-label={banner.title || '轮播图'}
                      >
                        {/* 有图片则展示图片，否则展示渐变背景 + 文字 */}
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={banner.title || '轮播图'}
                            className="absolute inset-0 h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <>
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.24),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.18),transparent_32%)]" />
                            <div className="absolute -right-6 top-4 h-24 w-24 rounded-full border border-white/20" />
                            <div className="absolute right-10 bottom-[-30px] h-28 w-28 rounded-full bg-white/10 blur-2xl" />
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* 轮播指示器 */}
                {banners.length > 1 && (
                  <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex items-center justify-between px-4">
                    <div className="pointer-events-auto flex items-center gap-2">
                      {banners.map((banner, index) => {
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
                      {String(activeBannerIndex + 1).padStart(2, '0')} / {String(banners.length).padStart(2, '0')}
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>

        {/* Quick Entry */}
        <div className="grid grid-cols-5 gap-2 px-4 mb-4">
          <div 
            className="flex flex-col items-center cursor-pointer active:opacity-70"
            onClick={() => goTo('store')}
          >
            <div className="w-11 h-11 rounded-[14px] bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center text-[#FF4142] dark:text-red-300 mb-1.5">
              <Store size={22} strokeWidth={1.5} />
            </div>
            <span className="text-[12px] text-gray-900 dark:text-gray-100">商城</span>
          </div>
          <div 
            className="flex flex-col items-center cursor-pointer active:opacity-70"
            onClick={() => goTo('shield')}
          >
            <div className="w-11 h-11 rounded-[14px] bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center text-[#FF4142] dark:text-red-300 mb-1.5">
              <ShieldCheck size={22} strokeWidth={1.5} />
            </div>
            <span className="text-[12px] text-gray-900 dark:text-gray-100">确权中心</span>
          </div>
          <div 
            className="flex flex-col items-center cursor-pointer active:opacity-70"
            onClick={() => goTo('order')}
          >
            <div className="w-11 h-11 rounded-[14px] bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center text-[#FF4142] dark:text-red-300 mb-1.5">
              <FileText size={22} strokeWidth={1.5} />
            </div>
            <span className="text-[12px] text-gray-900 dark:text-gray-100">订单</span>
          </div>
          <div 
            className="flex flex-col items-center cursor-pointer active:opacity-70"
            onClick={() => goTo('live')}
          >
            <div className="w-11 h-11 rounded-[14px] bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center text-[#FF4142] dark:text-red-300 mb-1.5">
              <Volume2 size={22} strokeWidth={1.5} />
            </div>
            <span className="text-[12px] text-gray-900 dark:text-gray-100">直播</span>
          </div>
          <div 
            className="flex flex-col items-center cursor-pointer active:opacity-70"
            onClick={handleOpenSupport}
          >
            <div className="w-11 h-11 rounded-[14px] bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center text-[#FF4142] dark:text-red-300 mb-1.5">
              <Headset size={22} strokeWidth={1.5} />
            </div>
            <span className="text-[12px] text-gray-900 dark:text-gray-100">客服</span>
          </div>
        </div>

        {/* Announcement - 滚动公告 */}
        {scrollAnnouncements.length > 0 && (
          <div 
            className="mx-4 mb-4 h-9 bg-white dark:bg-gray-800 rounded-full flex items-center px-3 shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden cursor-pointer active:opacity-80"
            onClick={() => goTo('announcement')}
          >
            <Volume2 size={16} className="text-[#FF4142] dark:text-red-300 mr-2 shrink-0" />
            <div className="flex-1 overflow-hidden relative h-full flex items-center">
              <div className="absolute whitespace-nowrap text-[12px] text-gray-900 dark:text-gray-100 animate-marquee">
                {scrollAnnouncements.map((a) => a.title).join('　　　')}
              </div>
            </div>
          </div>
        )}

        {/* Trading Zone Banner */}
        <div 
          className="mx-4 mb-4 rounded-[16px] bg-gradient-to-r from-[#D32F2F] to-[#FF4B2B] p-5 relative overflow-hidden shadow-md cursor-pointer active:opacity-90 transition-opacity flex items-center justify-between min-h-[88px]"
          onClick={() => goTo('trading_zone')}
        >
          <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-white/10 to-transparent"></div>
          <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full border-4 border-white/10"></div>
          
          <div className="relative z-10">
            <h3 className="text-white font-bold text-[20px] mb-1 tracking-wide">交易专区</h3>
            <p className="text-white/90 text-[13px] font-medium">数据资产确权交易</p>
          </div>
          
          <div className="relative z-10 w-10 h-10 rounded-full bg-white dark:bg-gray-900/20 backdrop-blur-sm flex items-center justify-center border border-white/30 shrink-0">
            <ArrowRight size={20} className="text-[#FF4142] dark:text-red-100" />
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

        {/* 申购记录 */}
        <div className="px-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[16px] font-bold text-gray-900 dark:text-gray-100 flex items-center">
              <span className="w-4 h-px bg-gray-300 dark:bg-gray-600 mr-2"></span>
              申购记录
              <span className="w-4 h-px bg-gray-300 dark:bg-gray-600 ml-2"></span>
            </h3>
            <button
              className="text-[12px] text-gray-500 dark:text-gray-400 flex items-center active:opacity-70"
              onClick={() => goTo('reservations')}
            >
              查看更多 <ArrowRight size={12} className="ml-0.5" />
            </button>
          </div>

          {reservationsRequest.loading && reservations.length === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white dark:bg-gray-900 rounded-[14px] p-4 border border-gray-100 dark:border-gray-800 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <Skeleton className="w-36 h-4" />
                    <Skeleton className="w-14 h-5 rounded-full" />
                  </div>
                  <Skeleton className="w-24 h-3 mb-2" />
                  <Skeleton className="w-32 h-3" />
                </div>
              ))}
            </div>
          ) : reservations.length > 0 ? (
            <div className="space-y-3">
              {reservations.map((item) => (
                <ReservationCard
                  key={item.id}
                  item={item}
                  onClick={() => goTo(`/reservation_detail/${item.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-[14px] p-6 border border-gray-100 dark:border-gray-800 shadow-sm text-center">
              <p className="text-[14px] text-gray-400 dark:text-gray-500">暂无申购记录</p>
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
        <div className="bg-red-50 dark:bg-red-900/30 text-[#FF4142] dark:text-red-300 px-4 py-2 flex items-center justify-between text-[12px] z-50 absolute top-0 left-0 right-0">
          <div className="flex items-center">
            <WifiOff size={14} className="mr-2" />
            <span>网络不稳定，请检查网络设置</span>
          </div>
          <button onClick={() => setOffline(false)} className="font-medium px-2 py-1 bg-white dark:bg-gray-800 rounded shadow-sm dark:text-gray-100">刷新</button>
        </div>
      )}

      

      {renderHeader()}
      <PullToRefreshContainer onRefresh={handleRefresh} disabled={error || offline}>
        {renderContent()}
      </PullToRefreshContainer>

      {/* 弹出公告 */}
      {popupVisible && unreadPopups[showPopupIndex] && (
        <ForceAnnouncementModal
          item={unreadPopups[showPopupIndex]}
          isOpen={popupVisible}
          loading={popupRequest.loading}
          error={Boolean(popupRequest.error)}
          onClose={handlePopupClose}
          onRetry={() => void popupRequest.reload()}
          onViewDetail={() => {
            handlePopupClose();
            goTo('announcement');
          }}
        />
      )}
    </div>
  );
};


