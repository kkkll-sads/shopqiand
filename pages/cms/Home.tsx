import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Newspaper, Palette, Trophy, ChevronRight, UserCheck, TreeDeciduous, Search, Wallet, Vault, Zap, FileBadge, ClipboardList, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Banner, Artist, NewsItem } from '../../types';
import { fetchBanners, fetchArtists, normalizeAssetUrl, ArtistApiItem, fetchReservations, ReservationItem, ReservationStatus } from '../../services/api';
import { isSuccess } from '../../utils/apiHelpers';

interface HomeProps {
  announcements?: NewsItem[];
}

const Home: React.FC<HomeProps> = ({ announcements = [] }) => {
  const navigate = useNavigate();
  const [currentBanner, setCurrentBanner] = useState(0);
  const [noticeIndex, setNoticeIndex] = useState(0);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [reservationRecords, setReservationRecords] = useState<ReservationItem[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
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

  // 加载轮播图与艺术家数据
  useEffect(() => {
    const load = async () => {
      try {
        // 并行请求，提高首屏速度
        const [bannerRes, artistRes] = await Promise.all([
          fetchBanners({ page: 1, limit: 10 }),
          fetchArtists({ page: 1, limit: 4 }),
        ]);

        // 轮播图
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

        // 首页展示前四位艺术家
        const artistList: ArtistApiItem[] = artistRes.data?.list ?? [];
        const mappedArtists: Artist[] = artistList.slice(0, 4).map((a) => ({
          id: String(a.id),
          name: a.name,
          image: normalizeAssetUrl(a.image),
          title: a.title,
          bio: a.bio,
        }));
        setArtists(mappedArtists);
      } catch (error) {
        console.error('加载首页数据失败:', error);
        setBanners([]);
        setCurrentBanner(0);
        setArtists([]);
      }
    };

    load();
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
        console.error('加载申购记录失败:', error);
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
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
      action: () => handleNavigate('balance-recharge')
    },
    {
      label: '收益提现',
      icon: Vault,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
      action: () => handleNavigate('balance-withdraw')
    },
    {
      label: '算力补充',
      icon: Zap,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
      action: () => handleNavigate('hashrate-exchange')
    },
    {
      label: '确权申报',
      icon: FileBadge,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
      action: () => handleNavigate('cumulative-rights')
    },
  ];

  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      {/* Top Background Gradient */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-[#FFD6A5] to-gray-50 z-0" />

      {/* Header - Fixed Positioning */}
      <header className="px-4 py-3 fixed top-0 left-0 right-0 z-20 bg-gradient-to-r from-[#FFD6A5] to-[#FFC3A0] shadow-sm max-w-md mx-auto">
        <div
          className="flex items-center bg-white rounded-full p-1 pl-4 shadow-sm cursor-pointer active:scale-[0.99] transition-transform"
          onClick={() => handleNavigate('search')}
        >
          <Search size={16} className="text-gray-400 mr-2 flex-shrink-0" />
          <span className="text-sm text-gray-400 flex-1 truncate">数据资产溯源查询...</span>
          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-medium px-4 py-1.5 rounded-full flex-shrink-0 ml-2">
            搜索
          </div>
        </div>
      </header>

      {/* Banner Carousel - Added padding top for fixed header */}
      <div className="p-4 pb-0 pt-[72px] relative z-0">
        <div
          className="w-full h-40 rounded-xl overflow-hidden relative shadow-lg touch-pan-y"
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
              </div>
            ))}
          </div>

          {/* Indicators */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {banners.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${currentBanner === idx ? 'w-4 bg-white' : 'w-1.5 bg-white/60'
                  }`}
              />
            ))}
          </div>
        </div>

        {/* Scrolling Notice */}
        <div
          className={`flex items-center mt-3 text-xs text-gray-600 bg-white/80 backdrop-blur-sm p-2 rounded-lg transition-colors shadow-sm ${announcements.length ? 'cursor-pointer active:bg-white' : 'opacity-60'}`}
          onClick={() => {
            if (announcements.length) {
              const targetId = announcements[noticeIndex]?.id;
              if (targetId) {
                handleNavigate('news-detail', { id: targetId });
              }
            }
          }}
        >
          <span className="bg-orange-500 text-white px-1 rounded text-[10px] mr-2 flex-shrink-0 font-medium">平台资讯</span>
          <div className="flex-1 h-5 overflow-hidden relative">
            <div
              className="absolute w-full transition-transform duration-500 ease-in-out"
              style={{ transform: `translateY(-${noticeIndex * 1.25}rem)` }}
            >
              {(announcements.length ? announcements : [{ id: 'placeholder', title: '暂无公告' } as NewsItem]).map((item) => (
                <div key={item.id} className="h-5 flex items-center w-full">
                  <span className="truncate text-gray-700">{item.title}</span>
                </div>
              ))}
            </div>
          </div>
          <ChevronRight size={14} className="text-gray-400 flex-shrink-0 ml-1" />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="pb-4 pt-4 relative z-0">
        <div className="grid grid-cols-4 gap-2 px-2">
          {quickActions.map((item, index) => (
            <div
              key={index}
              className="flex flex-col items-center cursor-pointer active:opacity-70 transition-opacity"
              onClick={item.action}
            >
              <div className={`w-10 h-10 rounded-full ${item.bgColor} flex items-center justify-center mb-1 ${item.color} shadow-sm`}>
                <item.icon size={20} />
              </div>
              <span className="text-[10px] text-gray-700 font-medium whitespace-nowrap">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Trading Zone Entrance */}
      <div className="px-4 py-2 mb-2 relative z-0">
        <div
          className="w-full h-24 rounded-xl overflow-hidden relative shadow-md cursor-pointer transform transition active:scale-95 duration-200 group bg-gradient-to-r from-[#FFD6A5] to-[#FFC3A0]"
          onClick={() => handleNavigate('trading-zone')}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <h2 className="text-2xl font-bold text-white tracking-widest drop-shadow-md">交易专区</h2>
            <div className="w-8 h-1 bg-white/80 mt-2 rounded-full shadow-sm"></div>
          </div>
        </div>
      </div>

      {/* Subscription Records Preview */}
      <div className="mt-2 bg-white p-4 rounded-t-2xl shadow-sm relative z-0 pb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-gray-800 text-lg border-l-4 border-orange-500 pl-2 flex items-center gap-2">
            申购记录
          </h2>
          <button
            onClick={() => handleNavigate('reservation-record')}
            className="text-gray-400 flex items-center text-xs bg-gray-50 px-2 py-1 rounded-full"
          >
            全部记录 <ChevronRight size={14} />
          </button>
        </div>

        <div className="space-y-3">
          {loadingRecords ? (
            <div className="text-center py-8 text-gray-400">
              <Clock size={24} className="mx-auto mb-2 animate-pulse" />
              <p className="text-sm">加载中...</p>
            </div>
          ) : reservationRecords.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <ClipboardList size={24} className="mx-auto mb-2" />
              <p className="text-sm">暂无申购记录</p>
            </div>
          ) : (
            reservationRecords.map((record) => {
              const getStatusBadge = (item: ReservationItem) => {
                switch (item.status) {
                  case 0: // 待撮合
                    return (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 whitespace-nowrap text-orange-600 bg-orange-100 border-orange-200">
                        <Clock size={10} className="text-orange-500" /> 待撮合
                      </span>
                    );
                  case 1: // 已中签
                    return (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 whitespace-nowrap text-green-600 bg-green-100 border-green-200">
                        <CheckCircle2 size={10} className="text-green-500" /> 已中签
                      </span>
                    );
                  case 2: // 未中签/已退款
                    return (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 whitespace-nowrap text-gray-400 bg-gray-100 border-gray-200">
                        <AlertCircle size={10} className="text-gray-400" /> 未中签
                      </span>
                    );
                  default:
                    return (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 whitespace-nowrap text-gray-400 bg-gray-100 border-gray-200">
                        <Clock size={10} /> {item.status_text || '未知'}
                      </span>
                    );
                }
              };

              return (
                <div
                  key={record.id}
                  className="bg-gray-50 rounded-xl p-3 flex flex-col gap-2 active:scale-[0.99] transition-transform cursor-pointer"
                  onClick={() => handleNavigate('reservation-record')}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">{record.status_text || '待撮合'}</h3>
                      <span className="text-xs text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100">
                        {record.session_id ? `场次${record.session_id}` : '盲盒预约'}
                      </span>
                    </div>
                    {getStatusBadge(record)}
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">
                      冻结金额 <span className="text-red-600 font-bold">¥{Number(record.freeze_amount || 0).toLocaleString()}</span>
                    </span>
                    <span className="text-gray-400">消耗算力: {record.power_used || 5}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;