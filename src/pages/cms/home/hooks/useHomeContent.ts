import { useEffect, useRef, useState } from 'react';
import type { TouchEvent } from 'react';
import type { Banner, NewsItem } from '@/types';
import {
  fetchAnnouncements,
  fetchBanners,
  fetchReservations,
  normalizeAssetUrl,
  type ReservationItem,
} from '@/services';
import { extractData, isSuccess } from '@/utils/apiHelpers';
import { errorLog } from '@/utils/logger';

interface UseHomeContentOptions {
  announcementsProp: NewsItem[];
}

interface UseHomeContentResult {
  currentBanner: number;
  noticeIndex: number;
  banners: Banner[];
  announcements: NewsItem[];
  reservationRecords: ReservationItem[];
  loadingRecords: boolean;
  onTouchStart: (event: TouchEvent) => void;
  onTouchMove: (event: TouchEvent) => void;
  onTouchEnd: () => void;
}

export function useHomeContent({ announcementsProp }: UseHomeContentOptions): UseHomeContentResult {
  const [currentBanner, setCurrentBanner] = useState(0);
  const [noticeIndex, setNoticeIndex] = useState(0);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [localAnnouncements, setLocalAnnouncements] = useState<NewsItem[]>([]);
  const [reservationRecords, setReservationRecords] = useState<ReservationItem[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(true);

  const announcements = announcementsProp.length > 0 ? announcementsProp : localAnnouncements;

  const touchStartRef = useRef(0);
  const touchEndRef = useRef(0);
  const bannerTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const noticeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startBannerTimer = () => {
    if (!banners.length) return;

    if (bannerTimerRef.current) {
      clearInterval(bannerTimerRef.current);
    }

    bannerTimerRef.current = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 4000);
  };

  useEffect(() => {
    if (!announcements.length) return;

    noticeTimerRef.current = setInterval(() => {
      setNoticeIndex((prev) => (prev + 1) % announcements.length);
    }, 3000);

    return () => {
      if (noticeTimerRef.current) {
        clearInterval(noticeTimerRef.current);
      }
    };
  }, [announcements.length]);

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
      if (bannerTimerRef.current) {
        clearInterval(bannerTimerRef.current);
      }
    };
  }, [banners.length]);

  useEffect(() => {
    const loadBanners = async () => {
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
          return;
        }

        setBanners([]);
        setCurrentBanner(0);
      } catch (error) {
        errorLog('Home', '加载首页数据失败', error);
        setBanners([]);
        setCurrentBanner(0);
      }
    };

    void loadBanners();
  }, []);

  useEffect(() => {
    const loadAnnouncements = async () => {
      try {
        const response = await fetchAnnouncements({
          page: 1,
          limit: 10,
          type: 'normal',
        });

        const data = extractData(response) as
          | { list?: { id: number; title: string; createtime?: string; content?: string }[] }
          | null;
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

    void loadAnnouncements();
  }, []);

  useEffect(() => {
    const loadReservationRecords = async () => {
      try {
        setLoadingRecords(true);
        const response = await fetchReservations({ page: 1, limit: 3 });

        if (isSuccess(response) && response.data?.list) {
          setReservationRecords(response.data.list);
        } else {
          setReservationRecords([]);
        }
      } catch (error) {
        errorLog('Home', '加载申购记录失败', error);
        setReservationRecords([]);
      } finally {
        setLoadingRecords(false);
      }
    };

    void loadReservationRecords();
  }, []);

  const onTouchStart = (event: TouchEvent) => {
    touchStartRef.current = event.targetTouches[0].clientX;
    if (bannerTimerRef.current) {
      clearInterval(bannerTimerRef.current);
    }
  };

  const onTouchMove = (event: TouchEvent) => {
    touchEndRef.current = event.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
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

    touchStartRef.current = 0;
    touchEndRef.current = 0;
    startBannerTimer();
  };

  return {
    currentBanner,
    noticeIndex,
    banners,
    announcements,
    reservationRecords,
    loadingRecords,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
}
