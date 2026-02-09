import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Search, Wallet, Vault, Zap, FileBadge, ClipboardList, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Banner, NewsItem } from '@/types';
import { fetchBanners, normalizeAssetUrl, fetchReservations, ReservationItem, fetchAnnouncements } from '@/services';
import { isSuccess, extractData } from '@/utils/apiHelpers';
import { SkeletonSubscriptionCard } from '@/components/common';
import { errorLog } from '@/utils/logger';

interface HomeProps {
  announcements?: NewsItem[];
}

const Home: React.FC<HomeProps> = ({ announcements: announcementsProp = [] }) => {
  const navigate = useNavigate();
  const [currentBanner, setCurrentBanner] = useState(0);
  const [noticeIndex, setNoticeIndex] = useState(0);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [localAnnouncements, setLocalAnnouncements] = useState<NewsItem[]>([]);
  const [reservationRecords, setReservationRecords] = useState<ReservationItem[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const announcements =
    announcementsProp.length > 0 ? announcementsProp : localAnnouncements;
  const touchStartRef = useRef(0);
  const touchEndRef = useRef(0);
  const bannerTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const noticeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleNavigate = (routeName: string, params?: { id?: string | number }) => {
    switch (routeName) {
      case 'balance-recharge':
        navigate('/balance-recharge');
        return;
      case 'balance-withdraw':
        navigate('/balance-withdraw');
        return;
      case 'hashrate-exchange':
        navigate('/hashrate-exchange');
        return;
      case 'cumulative-rights':
        navigate('/cumulative-rights');
        return;
      case 'search':
        navigate('/search');
        return;
      case 'trading-zone':
        navigate('/trading-zone');
        return;
      case 'reservation-record':
        navigate('/reservation-record');
        return;
      case 'news-detail':
        navigate(`/news/${params?.id ?? ''}`);
        return;
      default:
        navigate('/');
    }
  };

  // Banner Auto-play
  const startBannerTimer = () => {
    if (!banners.length) return;
    if (bannerTimerRef.current) clearInterval(bannerTimerRef.current);
    bannerTimerRef.current = setInterval(() => {
      setCurrentBanner(prev => (prev + 1) % banners.length);
    }, 4000);
  };

  // Notice Auto-scroll
  useEffect(() => {
    if (!announcements.length) return;
    noticeTimerRef.current = setInterval(() => {
      setNoticeIndex(prev => (prev + 1) % announcements.length);
    }, 3000);
    return () => {
      if (noticeTimerRef.current) clearInterval(noticeTimerRef.current);
    };
  }, [announcements.length]);

  // Reset index when数据长度变化
  useEffect(() => {
    if (!announcements.length) {
      setNoticeIndex(0);
      return;
    }
    setNoticeIndex((prev) => prev % announcements.length);
  }, [announcements.length]);

  useEffect(() => {
    if (!banners.length) {
      if (bannerTimerRef.current) {
        clearInterval(bannerTimerRef.current);
        bannerTimerRef.current = null;
      }
      setCurrentBanner(0);
      return;
    }
    startBannerTimer();
    return () => {
      if (bannerTimerRef.current) clearInterval(bannerTimerRef.current);
    };
  }, [banners.length]);

  // 加载轮播图数据
  useEffect(() => {
    const load = async () => {
      try {
        const bannerRes = await fetchBanners({ page: 1, limit: 10 });

        if (isSuccess(bannerRes) && bannerRes.data?.list?.length) {
          const mappedBanners: Banner[] = bannerRes.data.list.map((item) => ({
            id: String(item.id),
            image: normalizeAssetUrl(item.image),
            tag: item.description || '',
            title: item.title || '',
          }));
          setBanners(mappedBanners);
          setCurrentBanner(0);
        } else {
          setBanners([]);
          setCurrentBanner(0);
        }
      } catch (error) {
        errorLog('Home', '加载首页数据失败', error);
        setBanners([]);
        setCurrentBanner(0);
      }
    };

    load();
  }, []);

  // 加载首页公告栏数据（滚动公告）
  useEffect(() => {
    const loadAnnouncements = async () => {
      try {
        const response = await fetchAnnouncements({
          page: 1,
          limit: 10,
          type: 'normal',
        });
        const data = extractData(response) as { list?: { id: number; title: string; createtime?: string; content?: string }[] } | null;
        const list = data?.list ?? [];
        const mapped: NewsItem[] = list.map((item) => ({
          id: String(item.id),
          date: item.createtime ?? '',
          title: item.title ?? '',
          isUnread: false,
          type: 'announcement' as const,
          content: item.content,
        }));
        setLocalAnnouncements(mapped);
      } catch (error) {
        errorLog('Home', '加载首页公告失败', error);
        setLocalAnnouncements([]);
      }
    };
    loadAnnouncements();
  }, []);

  // 加载申购记录
  useEffect(() => {
    const loadReservationRecords = async () => {
      try {
        setLoadingRecords(true);
        const response = await fetchReservations({
          // status: -1, // 全部 (Default is all if omitted)
          page: 1,
          limit: 3, // 首页只显示最新3条
        });

        if (isSuccess(response) && response.data?.list) {
          setReservationRecords(response.data.list);
        } else {
          setReservationRecords([]);
        }
      } catch (error) {
        errorLog('Home', '加载申购记录失败', error);
        // 如果未登录，静默失败
        setReservationRecords([]);
      } finally {
        setLoadingRecords(false);
      }
    };

    loadReservationRecords();
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.targetTouches[0].clientX;
    if (bannerTimerRef.current) clearInterval(bannerTimerRef.current); // Pause on touch
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!banners.length) {
      startBannerTimer();
      return;
    }
    if (!touchStartRef.current || !touchEndRef.current) {
      startBannerTimer();
      return;
    }

    const distance = touchStartRef.current - touchEndRef.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    } else if (isRightSwipe) {
      setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length);
    }

    // Reset
    touchStartRef.current = 0;
    touchEndRef.current = 0;
    startBannerTimer();
  };

  const quickActions = [
    {
      label: '专项金申购',
      icon: Wallet,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      action: () => handleNavigate('balance-recharge')
    },
    {
      label: '收益提现',
      icon: Vault,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      action: () => handleNavigate('balance-withdraw')
    },
    {
      label: '算力补充',
      icon: Zap,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      action: () => handleNavigate('hashrate-exchange')
    },
    {
      label: '确权申报',
      icon: FileBadge,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      action: () => navigate('/rights')
    },
  ];

  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      {/* Top Background Gradient - 京东红渐变 */}
      <div className="absolute top-0 left-0 right-0 h-72 bg-gradient-to-b from-red-50 via-red-50/50 to-gray-50 z-0" />

      {/* Header - Fixed Positioning */}
      <header className="px-4 py-3 fixed top-0 left-0 right-0 z-20 max-w-md mx-auto">
        {/* 搜索栏 - 毛玻璃效果 */}
        <div
          className="flex items-center bg-white/90 backdrop-blur-md rounded-full p-1.5 pl-4 shadow-lg shadow-red-500/10 cursor-pointer active:scale-[0.98] transition-all border border-white/50"
          onClick={() => handleNavigate('search')}
        >
          <Search size={18} className="text-red-400 mr-2 flex-shrink-0" />
          <span className="text-sm text-gray-400 flex-1 truncate">搜索数据资产、藏品...</span>
          <div className="bg-gradient-to-r from-red-600 to-red-500 text-white text-xs font-semibold px-5 py-2 rounded-full flex-shrink-0 ml-2 shadow-md shadow-red-500/30">
            搜索
          </div>
        </div>
      </header>

      {/* Banner Carousel - Added padding top for fixed header */}
      <div className="px-4 pb-0 pt-[68px] relative z-0">
        <div
          className="w-full h-44 rounded-2xl overflow-hidden relative shadow-xl shadow-orange-500/15 touch-pan-y"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="flex h-full transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${currentBanner * 100}%)` }}
          >
            {banners.map((banner) => (
              <div key={banner.id} className="w-full flex-shrink-0 relative h-full">
                <img
                  src={banner.image}
                  alt={banner.title || "Banner"}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
                {/* 底部渐变遮罩 */}
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent" />
              </div>
            ))}
          </div>

          {/* Indicators - 胶囊形指示器 */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 bg-black/20 backdrop-blur-sm rounded-full px-2 py-1">
            {banners.map((_, idx) => (
              <div
                key={idx}
                className={`h-1 rounded-full transition-all duration-300 ${currentBanner === idx ? 'w-4 bg-white' : 'w-1 bg-white/50'}`}
              />
            ))}
          </div>
        </div>

        {/* Scrolling Notice - 公告栏 */}
        <div
          className={`flex items-center mt-3 text-xs bg-white rounded-xl p-2.5 shadow-sm border border-red-100/50 ${announcements.length ? 'cursor-pointer active:bg-red-50/50' : 'opacity-60'}`}
          onClick={() => {
            if (announcements.length) {
              const targetId = announcements[noticeIndex]?.id;
              if (targetId) {
                handleNavigate('news-detail', { id: targetId });
              }
            }
          }}
        >
          <span className="bg-gradient-to-r from-red-600 to-red-500 text-white px-2 py-0.5 rounded-md text-[10px] mr-2.5 flex-shrink-0 font-semibold shadow-sm">公告</span>
          <div className="flex-1 h-5 overflow-hidden relative">
            <div
              className="absolute w-full transition-transform duration-500 ease-in-out"
              style={{ transform: `translateY(-${noticeIndex * 1.25}rem)` }}
            >
              {(announcements.length ? announcements : [{ id: 'placeholder', title: '暂无最新公告' } as NewsItem]).map((item) => (
                <div key={item.id} className="h-5 flex items-center w-full">
                  <span className="truncate text-gray-600 font-medium">{item.title}</span>
                </div>
              ))}
            </div>
          </div>
          <ChevronRight size={16} className="text-red-400 flex-shrink-0 ml-1" />
        </div>
      </div>

      {/* Quick Actions - 快捷操作 */}
      <div className="py-4 px-4 relative z-0">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="grid grid-cols-4 gap-3">
            {quickActions.map((item, index) => (
              <div
                key={index}
                className="flex flex-col items-center cursor-pointer active:scale-95 transition-transform"
                onClick={item.action}
              >
                <div className={`w-12 h-12 rounded-2xl ${item.bgColor} flex items-center justify-center mb-2 ${item.color} shadow-sm`}>
                  <item.icon size={22} strokeWidth={1.8} />
                </div>
                <span className="text-[11px] text-gray-700 font-medium whitespace-nowrap">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trading Zone Entrance - 交易专区入口 */}
      <div className="px-4 mb-3 relative z-0">
        <div
          className="w-full h-20 rounded-2xl overflow-hidden relative cursor-pointer active:scale-[0.98] transition-transform bg-gradient-to-r from-red-600 via-red-500 to-rose-500 shadow-lg shadow-red-500/25"
          onClick={() => handleNavigate('trading-zone')}
        >
          {/* 装饰性背景元素 */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/4" />
          
          <div className="absolute inset-0 flex items-center justify-between px-6">
            <div>
              <h2 className="text-xl font-bold text-white tracking-wide">交易专区</h2>
              <p className="text-white/80 text-xs mt-0.5">数据资产确权交易</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
              <ChevronRight size={24} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Records Preview - 申购记录 */}
      <div className="mx-4 bg-white rounded-2xl shadow-sm relative z-0 overflow-hidden">
        {/* 标题栏 */}
        <div className="flex justify-between items-center p-4 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-gradient-to-b from-red-600 to-red-500 rounded-full" />
            <h2 className="font-bold text-gray-800 text-base">申购记录</h2>
          </div>
          <button
            onClick={() => handleNavigate('reservation-record')}
            className="text-red-600 flex items-center text-xs font-medium active:opacity-70"
          >
            全部 <ChevronRight size={16} />
          </button>
        </div>

        <div className="px-4 pb-4">
          {loadingRecords ? (
            <div className="space-y-2.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonSubscriptionCard key={i} />
              ))}
            </div>
          ) : reservationRecords.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                <ClipboardList size={24} className="text-gray-400" />
              </div>
              <p className="text-sm">暂无申购记录</p>
              <p className="text-xs text-gray-300 mt-1">参与申购后这里会显示记录</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {reservationRecords.map((record) => {
                const getStatusBadge = (item: ReservationItem) => {
                  switch (item.status) {
                    case 0: // 待撮合
                      return (
                        <span className="text-[10px] font-semibold px-2 py-1 rounded-lg flex items-center gap-1 whitespace-nowrap text-amber-600 bg-amber-50">
                          <Clock size={10} /> 待撮合
                        </span>
                      );
                    case 1: // 已中签
                      return (
                        <span className="text-[10px] font-semibold px-2 py-1 rounded-lg flex items-center gap-1 whitespace-nowrap text-green-600 bg-green-50">
                          <CheckCircle2 size={10} /> 已中签
                        </span>
                      );
                    case 2: // 未中签/已退款
                      return (
                        <span className="text-[10px] font-semibold px-2 py-1 rounded-lg flex items-center gap-1 whitespace-nowrap text-gray-500 bg-gray-100">
                          <AlertCircle size={10} /> 未中签
                        </span>
                      );
                    default:
                      return (
                        <span className="text-[10px] font-semibold px-2 py-1 rounded-lg flex items-center gap-1 whitespace-nowrap text-gray-500 bg-gray-100">
                          <Clock size={10} /> {item.status_text || '未知'}
                        </span>
                      );
                  }
                };

                return (
                  <div
                    key={record.id}
                    className="bg-gray-50 rounded-xl p-3.5 flex flex-col gap-2.5 active:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => handleNavigate('reservation-record')}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col gap-1">
                        <h3 className="font-bold text-gray-800 text-sm">{record.status_text || '待撮合'}</h3>
                        <span className="text-[10px] text-red-600 bg-red-50 px-2 py-0.5 rounded-md font-medium w-fit">
                          {record.session_id ? `场次 ${record.session_id}` : '盲盒预约'}
                        </span>
                      </div>
                      {getStatusBadge(record)}
                    </div>
                    <div className="flex justify-between items-center text-xs pt-1 border-t border-gray-100">
                      <span className="text-gray-500">
                        冻结 <span className="text-red-600 font-bold">¥{Number(record.freeze_amount || 0).toLocaleString()}</span>
                      </span>
                      <span className="text-gray-400 flex items-center gap-1">
                        <Zap size={10} className="text-yellow-500" /> 算力 {record.power_used || 5}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 底部留白 */}
      <div className="h-6" />
    </div>
  );
};

export default Home;