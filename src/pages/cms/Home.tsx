import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileBadge, Vault, Wallet, Zap } from 'lucide-react';
import type { NewsItem } from '@/types';
import HomeBannerSection from './home/components/HomeBannerSection';
import HomeHeaderSearch from './home/components/HomeHeaderSearch';
import HomeQuickActions, { type QuickActionItem } from './home/components/HomeQuickActions';
import HomeReservationRecords from './home/components/HomeReservationRecords';
import HomeTradingZoneCard from './home/components/HomeTradingZoneCard';
import { useHomeContent } from './home/hooks/useHomeContent';

interface HomeProps {
  announcements?: NewsItem[];
}

const Home: React.FC<HomeProps> = ({ announcements: announcementsProp = [] }) => {
  const navigate = useNavigate();

  const {
    currentBanner,
    noticeIndex,
    banners,
    announcements,
    reservationRecords,
    loadingRecords,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  } = useHomeContent({ announcementsProp });

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

  const quickActions: QuickActionItem[] = [
    {
      label: '专项金申购',
      icon: Wallet,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      action: () => handleNavigate('balance-recharge'),
    },
    {
      label: '收益提现',
      icon: Vault,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      action: () => handleNavigate('balance-withdraw'),
    },
    {
      label: '算力补充',
      icon: Zap,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      action: () => handleNavigate('hashrate-exchange'),
    },
    {
      label: '确权申报',
      icon: FileBadge,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      action: () => navigate('/rights'),
    },
  ];

  const handleOpenNotice = () => {
    if (!announcements.length) return;

    const targetId = announcements[noticeIndex]?.id;
    if (targetId) {
      handleNavigate('news-detail', { id: targetId });
    }
  };

  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      <div className="absolute top-0 left-0 right-0 h-72 bg-gradient-to-b from-red-50 via-red-50/50 to-gray-50 z-0" />

      <HomeHeaderSearch onSearch={() => handleNavigate('search')} />

      <HomeBannerSection
        banners={banners}
        currentBanner={currentBanner}
        announcements={announcements}
        noticeIndex={noticeIndex}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onOpenNotice={handleOpenNotice}
      />

      <HomeQuickActions actions={quickActions} />

      <HomeTradingZoneCard onClick={() => handleNavigate('trading-zone')} />

      <HomeReservationRecords
        loadingRecords={loadingRecords}
        reservationRecords={reservationRecords}
        onViewAll={() => handleNavigate('reservation-record')}
        onOpenRecord={() => handleNavigate('reservation-record')}
      />

      <div className="h-6" />
    </div>
  );
};

export default Home;
