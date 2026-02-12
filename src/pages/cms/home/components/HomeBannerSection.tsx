import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Banner, NewsItem } from '@/types';

interface HomeBannerSectionProps {
  banners: Banner[];
  currentBanner: number;
  announcements: NewsItem[];
  noticeIndex: number;
  onTouchStart: (event: React.TouchEvent) => void;
  onTouchMove: (event: React.TouchEvent) => void;
  onTouchEnd: () => void;
  onOpenNotice: () => void;
}

const HomeBannerSection: React.FC<HomeBannerSectionProps> = ({
  banners,
  currentBanner,
  announcements,
  noticeIndex,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onOpenNotice,
}) => (
  <div className="px-4 pb-0 pt-[68px] relative z-0">
    <div
      className="w-full h-44 rounded-2xl overflow-hidden relative shadow-xl shadow-orange-500/15 touch-pan-y"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div
        className="flex h-full transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${currentBanner * 100}%)` }}
      >
        {banners.map((banner) => (
          <div key={banner.id} className="w-full flex-shrink-0 relative h-full">
            <img
              src={banner.image}
              alt={banner.title || 'Banner'}
              className="w-full h-full object-cover"
              draggable={false}
            />
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        ))}
      </div>

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 bg-black/20 backdrop-blur-sm rounded-full px-2 py-1">
        {banners.map((_, index) => (
          <div
            key={index}
            className={`h-1 rounded-full transition-all duration-300 ${
              currentBanner === index ? 'w-4 bg-white' : 'w-1 bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>

    <div
      className={`flex items-center mt-3 text-xs bg-white rounded-xl p-2.5 shadow-sm border border-red-100/50 ${
        announcements.length ? 'cursor-pointer active:bg-red-50/50' : 'opacity-60'
      }`}
      onClick={onOpenNotice}
    >
      <span className="bg-gradient-to-r from-red-600 to-red-500 text-white px-2 py-0.5 rounded-md text-[10px] mr-2.5 flex-shrink-0 font-semibold shadow-sm">
        公告
      </span>
      <div className="flex-1 h-5 overflow-hidden relative">
        <div
          className="absolute w-full transition-transform duration-500 ease-in-out"
          style={{ transform: `translateY(-${noticeIndex * 1.25}rem)` }}
        >
          {(announcements.length
            ? announcements
            : [{ id: 'placeholder', title: '暂无最新公告' } as NewsItem]
          ).map((item) => (
            <div key={item.id} className="h-5 flex items-center w-full">
              <span className="truncate text-gray-600 font-medium">{item.title}</span>
            </div>
          ))}
        </div>
      </div>
      <ChevronRight size={16} className="text-red-400 flex-shrink-0 ml-1" />
    </div>
  </div>
);

export default HomeBannerSection;
