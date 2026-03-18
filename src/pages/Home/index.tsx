/**
 * @file Home/index.tsx - 首页
 * @description 应用主页面，包括轮播图、滚动公告、交易专区、节点活动抢购列表、申购记录、弹出公告。
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'; // React 核心 Hook
import { useAppNavigate } from '../../lib/navigation';
import { Search, Headset, Volume2, WifiOff, RefreshCcw, ArrowRight, User } from 'lucide-react';
import { Skeleton } from '../../components/ui/Skeleton';
import { PullToRefreshContainer } from '../../components/ui/PullToRefreshContainer';
import { ForceAnnouncementModal } from '../../components/biz/ForceAnnouncementModal';
import { GenesisNodeModal } from '../../components/biz/GenesisNodeModal';
import { useRouteScrollRestoration } from '../../hooks/useRouteScrollRestoration';
import { useRequest } from '../../hooks/useRequest';
import { bannerApi, type BannerItem } from '../../api/modules/banner';
import { announcementApi } from '../../api/modules/announcement';
import { accountApi } from '../../api/modules/account';
import { genesisNodeApi } from '../../api/modules/genesisNode';
import { reservationApi } from '../../api/modules/reservation';
import { resolveUploadUrl } from '../../api/modules/upload';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import {
  BASE_NODE_PURCHASE_ENTRIES,
  buildGenesisNodeEntry,
  type NodePurchaseEntry,
} from '../../features/node-purchase/entries';
import { ReservationCard } from '../../features/reservation/ReservationCard';
import { openCustomerServiceLink } from '../../lib/customerService';

const HOME_DISMISSED_POPUPS_STORAGE_KEY = 'home:dismissed-popup-announcements';
const HOME_SEEN_GENESIS_MODAL_ACTIVITY_IDS_STORAGE_KEY = 'home:seen-genesis-node-modal-activity-ids';

function readDismissedPopupIds(): string[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const rawValue = window.sessionStorage.getItem(HOME_DISMISSED_POPUPS_STORAGE_KEY);
    if (!rawValue) {
      return [];
    }
    const parsedValue = JSON.parse(rawValue);
    return Array.isArray(parsedValue) ? parsedValue.map((item) => String(item)) : [];
  } catch {
    return [];
  }
}

function writeDismissedPopupIds(ids: string[]) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.sessionStorage.setItem(HOME_DISMISSED_POPUPS_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    /* 忽略本地存储异常 */
  }
}

function readSeenGenesisModalActivityIds(): string[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(HOME_SEEN_GENESIS_MODAL_ACTIVITY_IDS_STORAGE_KEY);
    if (!rawValue) {
      return [];
    }
    const parsedValue = JSON.parse(rawValue);
    return Array.isArray(parsedValue) ? parsedValue.map((item) => String(item)) : [];
  } catch {
    return [];
  }
}

function writeSeenGenesisModalActivityIds(ids: string[]) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(HOME_SEEN_GENESIS_MODAL_ACTIVITY_IDS_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    /* 忽略本地存储异常 */
  }
}

/**
 * HomePage - 应用首页
 * 功能：轮播图 → 公告 → 交易专区 → 节点活动抢购列表 → 申购记录
 */
export const HomePage = () => {
  const { goTo } = useAppNavigate();
  const { showToast } = useFeedback();
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

  /* ---- 申购记录（延迟 1.5s 加载，不阻塞首屏核心内容） ---- */
  const reservationsRequest = useRequest(
    (signal) => reservationApi.getList({ page: 1, limit: 3 }, signal),
    { cacheKey: 'home:reservations', manual: true },
  );
  const reservations = reservationsRequest.data?.list ?? [];

  /* ---- 滚动公告（低频变化，缓存 30 分钟） ---- */
  const scrollAnnouncementsRequest = useRequest(
    (signal) => announcementApi.getScrollList(signal),
    { cacheKey: 'home:scroll-announcements', cacheTTL: 30 * 60 * 1000 },
  );
  const scrollAnnouncements = scrollAnnouncementsRequest.data?.list ?? [];

  /* ---- 用户资料（头像） ---- */
  const profileRequest = useRequest(
    (signal) => accountApi.getProfile({ signal }),
    { cacheKey: 'global:profile' },
  );
  const userAvatar = profileRequest.data?.userInfo?.avatar;
  const genesisActivityRequest = useRequest(
    (signal) => genesisNodeApi.getActivity({ signal }),
    { cacheKey: 'home:genesis-node:activity' },
  );
  const homeActivityEntries = useMemo<NodePurchaseEntry[]>(
    () => [buildGenesisNodeEntry(genesisActivityRequest.data), ...BASE_NODE_PURCHASE_ENTRIES],
    [genesisActivityRequest.data],
  );

  /* ---- 弹出公告（延迟 2s，且缓存 2 分钟；用户不会立刻关注弹窗） ---- */
  const popupRequest = useRequest(
    (signal) => announcementApi.getPopupList(signal),
    { cacheKey: 'home:popup-announcements', cacheTTL: 2 * 60 * 1000, manual: true },
  );
  const [dismissedPopupIds, setDismissedPopupIds] = useState<string[]>(() => readDismissedPopupIds());
  const popupList = popupRequest.data?.list ?? [];
  const popupsToShow = popupList.filter((item) => !item.is_read && !dismissedPopupIds.includes(String(item.id)));
  const currentPopup = popupsToShow[0] ?? null;

  /* 首屏加载完成后延迟发起次要请求，避免高并发时一次打出过多 API 请求 */
  useEffect(() => {
    const t1 = window.setTimeout(() => {
      void reservationsRequest.reload().catch(() => undefined);
    }, 1500);
    const t2 = window.setTimeout(() => {
      void popupRequest.reload().catch(() => undefined);
    }, 2000);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  // 仅在组件挂载时触发一次
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [popupVisible, setPopupVisible] = useState(false);
  const [genesisNodeVisible, setGenesisNodeVisible] = useState(false);
  const [seenGenesisModalActivityIds, setSeenGenesisModalActivityIds] = useState<string[]>(() => readSeenGenesisModalActivityIds());
  const popupDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setPopupVisible(false);
  }, [currentPopup?.id]);

  useEffect(() => {
    if (!currentPopup) {
      return;
    }

    const raw = Math.max(0, currentPopup.popup_delay ?? 0);
    const delayMs = raw >= 100 ? raw : raw * 1000;

    popupDelayRef.current = window.setTimeout(() => {
      setPopupVisible(true);
    }, delayMs);

    return () => {
      if (popupDelayRef.current) {
        window.clearTimeout(popupDelayRef.current);
        popupDelayRef.current = null;
      }
    };
  }, [currentPopup]);

  useEffect(() => {
    const activityId = genesisActivityRequest.data?.activityId ?? 0;
    if (!activityId) {
      return;
    }

    const activityIdText = String(activityId);
    if (seenGenesisModalActivityIds.includes(activityIdText)) {
      return;
    }

    const nextSeenActivityIds = [...seenGenesisModalActivityIds, activityIdText];
    setSeenGenesisModalActivityIds(nextSeenActivityIds);
    writeSeenGenesisModalActivityIds(nextSeenActivityIds);
    setGenesisNodeVisible(true);
  }, [genesisActivityRequest.data?.activityId, seenGenesisModalActivityIds]);

  const handlePopupClose = useCallback(() => {
    setPopupVisible(false);
    if (popupsToShow.length === 0) {
      return;
    }
    const nextDismissedIds = Array.from(new Set([
      ...dismissedPopupIds,
      ...popupsToShow.map((item) => String(item.id)),
    ]));
    setDismissedPopupIds(nextDismissedIds);
    writeDismissedPopupIds(nextDismissedIds);
  }, [dismissedPopupIds, popupsToShow]);

  /** 下拉刷新回调：刷新所有数据（包括延迟加载的） */
  const handleRefresh = useCallback(async () => {
    await Promise.allSettled([
      fetchBanners(),
      reservationsRequest.reload(),
      scrollAnnouncementsRequest.reload(),
      profileRequest.reload(),
      genesisActivityRequest.reload(),
      popupRequest.reload(),
    ]);
  }, [fetchBanners, reservationsRequest, scrollAnnouncementsRequest, profileRequest, genesisActivityRequest, popupRequest]);

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
    restoreDeps: [error, bannersLoading, scrollAnnouncementsRequest.loading],
    restoreWhen: !error && !bannersLoading && !scrollAnnouncementsRequest.loading,
  });

  /** 解析轮播图图片地址（支持后端返回相对路径） */
  const resolveBannerImage = (item: BannerItem) => {
    if (!item.image) return '';
    if (/^https?:\/\//i.test(item.image)) return item.image;
    return resolveUploadUrl(item.image);
  };

  const getBannerKey = (banner: BannerItem, index: number) => {
    const rawId = typeof banner.id === 'string' ? banner.id.trim() : banner.id;
    return rawId === '' || rawId == null ? `banner-${index}` : `banner-${rawId}-${index}`;
  };

  const getReservationKey = (id: number | string | null | undefined, index: number) => {
    if (id == null) {
      return `reservation-${index}`;
    }
    const rawId = typeof id === 'string' ? id.trim() : id;
    return rawId === '' ? `reservation-${index}` : `reservation-${rawId}-${index}`;
  };

  const handleOpenSupport = useCallback(() => {
    void openCustomerServiceLink(({ duration, message, type }) => {
      showToast({ duration, message, type });
    });
  }, [showToast]);

  const isInitialLoading =
    bannersLoading ||
    scrollAnnouncementsRequest.loading ||
    profileRequest.loading ||
    genesisActivityRequest.loading;

  const hasInitialContent =
    banners.length > 0 ||
    scrollAnnouncements.length > 0 ||
    reservations.length > 0 ||
    homeActivityEntries.length > 0 ||
    Boolean(userAvatar) ||
    popupList.length > 0;

  const renderHomeSkeleton = () => (
    <div ref={scrollContainerRef} className="flex-1 overflow-y-auto no-scrollbar pb-4">
      <div className="mx-4 mt-4 mb-4">
        <Skeleton className="h-[168px] w-full rounded-[24px]" />
      </div>

      <div className="mx-4 mb-4">
        <Skeleton className="h-9 w-full rounded-full" />
      </div>

      <div className="mx-4 mb-4">
        <Skeleton className="h-[88px] w-full rounded-[16px]" />
      </div>

        <div className="px-4 mb-4">
          <div className="mb-3 flex items-center justify-between">
            <Skeleton className="h-5 w-28" />
          </div>
          <div className="space-y-3">
            {homeActivityEntries.map((item) => (
              <Skeleton key={item.id} className="h-[108px] w-full rounded-[24px]" />
            ))}
          </div>
        </div>

      <div className="px-4 mb-4">
        <div className="mb-3 flex items-center justify-between">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="bg-white dark:bg-gray-900 rounded-[14px] p-4 border border-gray-100 dark:border-gray-800 shadow-sm"
            >
              <div className="mb-3 flex items-start justify-between">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
              <Skeleton className="mb-2 h-3 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

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
    if (isInitialLoading && !hasInitialContent) {
      return renderHomeSkeleton();
    }
    if (error) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-4 pt-20">
          <RefreshCcw size={40} className="text-gray-300 dark:text-gray-600 dark:text-gray-400 mb-4" />
          <p className="text-[14px] text-gray-500 dark:text-gray-400 mb-6">页面加载失败，请检查网络后重试</p>
          <button
            onClick={() => {
              setError(false);
              void handleRefresh();
            }}
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
                  {banners.map((banner, index) => {
                    const imageUrl = resolveBannerImage(banner);

                    return (
                      <div
                        key={getBannerKey(banner, index)}
                        className="relative aspect-[750/336] min-h-[168px] w-full shrink-0 overflow-hidden bg-gradient-to-r from-[#171717] via-[#2D1B69] to-[#FF4B2B]"
                        aria-label={banner.title || '轮播图'}
                      >
                        {/* 有图片则展示图片，否则展示渐变背景 + 文字 */}
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={banner.title || '轮播图'}
                            className="absolute inset-0 h-full w-full object-cover object-center"
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
                            key={getBannerKey(banner, index)}
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

        {/* 节点活动抢购列表 */}
        <div className="px-4 mb-4">
          <div className="mb-3 flex items-center">
            <h3 className="text-[16px] font-bold text-gray-900 dark:text-gray-100 flex items-center">
              <span className="w-4 h-px bg-gray-300 dark:bg-gray-600 mr-2"></span>
              抢购列表
              <span className="w-4 h-px bg-gray-300 dark:bg-gray-600 ml-2"></span>
            </h3>
          </div>

          <div className="space-y-3">
            {homeActivityEntries.map((activity) => {
              const Icon = activity.icon;

              return (
                <button
                  key={activity.id}
                  type="button"
                  onClick={() => goTo(activity.homeTarget)}
                  className="group relative flex w-full items-center gap-4 overflow-hidden rounded-[24px] border border-[#2f2f30] bg-[linear-gradient(180deg,#242526_0%,#18191a_100%)] px-4 py-4 text-left text-white shadow-[0_14px_36px_rgba(15,23,42,0.16)] transition-transform active:scale-[0.98]"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_30%),linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.02)_100%)]" />
                  <div className="absolute inset-y-0 left-0 w-[88px] bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0)_100%)]" />

                  <div className="relative flex h-[64px] w-[64px] shrink-0 items-center justify-center rounded-[18px] border border-white/10 shadow-inner shadow-black/15">
                    <div className={`absolute inset-0 rounded-[18px] ${activity.iconPanelClassName}`} />
                    <Icon size={30} strokeWidth={1.9} className={`relative ${activity.iconClassName}`} />
                  </div>

                  <div className="relative min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="truncate text-[17px] font-bold leading-tight text-white">{activity.title}</h4>
                          <span className="inline-flex shrink-0 rounded-full bg-[#b83d44] px-2 py-1 text-[10px] font-semibold leading-none text-white">
                            {activity.badge}
                          </span>
                        </div>
                        <p className="mt-2 pr-2 text-[13px] leading-6 text-white/72">
                          {activity.description}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                      <div className="inline-flex items-center text-[12px] font-semibold text-[#ffd84f]">
                        {activity.homeCta} <ArrowRight size={14} className="ml-1" />
                      </div>
                        {activity.homeMeta ? (
                          <div className={`mt-2 text-[12px] font-semibold ${activity.homeMetaClassName}`}>
                            {activity.homeMeta}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
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
              {reservations.map((item, index) => (
                <ReservationCard
                  key={getReservationKey(item.id, index)}
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

      {/* 活动弹窗：创世共识节点 */}
      <GenesisNodeModal
        activity={genesisActivityRequest.data}
        error={Boolean(genesisActivityRequest.error)}
        isOpen={genesisNodeVisible}
        loading={genesisActivityRequest.loading}
        onClose={() => setGenesisNodeVisible(false)}
        onConfirm={() => {
          setGenesisNodeVisible(false);
          const phase = buildGenesisNodeEntry(genesisActivityRequest.data).pageTarget;
          goTo(phase);
        }}
        onRetry={() => void genesisActivityRequest.reload()}
      />

      {/* 弹出公告 */}
      {popupVisible && currentPopup && (
        <ForceAnnouncementModal
          item={currentPopup}
          isOpen={popupVisible}
          loading={popupRequest.loading}
          error={Boolean(popupRequest.error)}
          onClose={handlePopupClose}
          onRetry={() => void popupRequest.reload()}
          onViewDetail={() => {
            handlePopupClose();
            goTo(`/announcement/${currentPopup.id}`);
          }}
        />
      )}
    </div>
  );
};
