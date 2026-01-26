/**
 * TradingZone - 交易区页面
 * 已重构: 拆分为多个子组件和 hooks
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, ClipboardList } from 'lucide-react';
import { LoadingSpinner } from '@/components/common';
import PopupAnnouncementModal from '@/components/common/PopupAnnouncementModal';
import { Product } from '@/types';
import { fetchAnnouncements, AnnouncementItem } from '@/services/api';
import { isSuccess } from '@/utils/apiHelpers';
import { errorLog } from '@/utils/logger';
import { ZoneFilters, ProductGrid, SessionCard } from './components/trading';
import { useTradingZone } from './hooks/useTradingZone';
import { buildPoolConfig, formatDuration } from './utils/poolConfig';

interface TradingZoneProps {
  onProductSelect?: (product: Product) => void;
  initialSessionId?: string;
  initialSessionTitle?: string;
  initialSessionStartTime?: string;
  initialSessionEndTime?: string;
}

const TradingZone: React.FC<TradingZoneProps> = ({
  onProductSelect,
  initialSessionId,
  initialSessionTitle,
  initialSessionStartTime,
  initialSessionEndTime
}) => {
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());
  const [showTradeNotice, setShowTradeNotice] = useState(false);
  const [tradeNoticeAnnouncement, setTradeNoticeAnnouncement] = useState<AnnouncementItem | null>(null);

  const {
    sessions,
    selectedSession,
    tradingItems,
    activePriceZone,
    loading,
    itemsLoading,
    hasSessionError,
    sessionErrorMessage,
    hasItemsError,
    itemsErrorMessage,
    navigating,
    priceZones,
    setSelectedSession,
    setTradingItems,
    setActivePriceZone,
    setNavigating,
    loadSessionItems,
    getSessionStatus,
  } = useTradingZone({
    initialSessionId,
    initialSessionTitle,
    initialSessionStartTime,
    initialSessionEndTime,
  });

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load trade notice
  useEffect(() => {
    const loadTradeNotice = async () => {
      try {
        const response = await fetchAnnouncements({ page: 1, limit: 10, type: 'normal' });
        if (isSuccess(response) && response.data?.list) {
          const notice = response.data.list.find((item: AnnouncementItem) =>
            item.title && item.title.includes('交易须知')
          );

          if (notice) {
            const dismissedKey = `trade_notice_dismissed_${notice.id}`;
            const dismissedDate = localStorage.getItem(dismissedKey);
            const today = new Date().toDateString();

            if (dismissedDate !== today) {
              setTradeNoticeAnnouncement(notice);
              setShowTradeNotice(true);
            }
          }
        }
      } catch (error) {
        errorLog('TradingZone', '加载交易须知失败', error);
      }
    };

    loadTradeNotice();
  }, []);

  const handleBack = () => {
    if (selectedSession) {
      if (initialSessionId) {
        navigate(-1);
      } else {
        setSelectedSession(null);
        setTradingItems([]);
      }
    } else {
      navigate(-1);
    }
  };

  const handleSessionSelect = async (session: any) => {
    if (navigating) return;
    setNavigating(true);
    try {
      setSelectedSession(session);
      await loadSessionItems(session);
    } finally {
      setTimeout(() => setNavigating(false), 500);
    }
  };

  // 详情页渲染
  if (selectedSession) {
    const config = buildPoolConfig(selectedSession);
    const { status, target } = getSessionStatus(selectedSession);

    return (
      <div className="min-h-screen bg-[#F8F9FA] text-gray-900 font-sans pb-safe">
        <div className="absolute top-0 left-0 right-0 h-72 bg-gradient-to-b from-[#FFE4C4] via-[#FFF0E0] to-[#F8F9FA] z-0" />

        <div className="relative z-10 p-5">
          {/* 顶部导航 */}
          <div className="flex justify-between items-center mb-6">
            <button
              type="button"
              onClick={handleBack}
              className="p-2 bg-white/60 backdrop-blur rounded-full shadow-sm hover:bg-white transition-all text-gray-700"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="text-xs font-bold text-gray-500/50 font-serif tracking-widest uppercase"></div>
          </div>

          {/* 头部大标题卡片 */}
          <div className="bg-white rounded-[32px] p-6 shadow-xl shadow-gray-200/60 mb-8 border border-white/60 relative overflow-hidden ring-1 ring-gray-50">
            <div className={`absolute -right-8 -top-8 w-40 h-40 rounded-full opacity-10 ${config.softBg}`}></div>

            <div className="flex justify-between items-start mb-6">
              <div>
                <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${config.softBg} ${config.themeColor} mb-3 inline-block shadow-sm`}>
                  {config.code}
                </span>
                <h1 className="text-2xl font-bold text-gray-900 leading-tight mb-1 tracking-tight">{config.name}</h1>
                <p className="text-sm text-gray-500 font-medium">{config.subName}</p>
              </div>
              <div className={`p-4 rounded-2xl ${config.softBg} ${config.themeColor} shadow-inner`}>
                <config.icon size={28} />
              </div>
            </div>

            {/* 核心指标区域 */}
            <div className={`relative z-10 flex items-stretch rounded-2xl ${config.dataBg} p-4 mb-5 border border-black/[0.02]`}>
              <div className="flex-1">
                <div className="text-xs text-gray-500 font-bold mb-1">预期收益率</div>
                <div className={`text-2xl font-black ${config.themeColor} tracking-tight leading-none pt-1`}>
                  {config.roi}
                </div>
              </div>
              <div className="w-px bg-black/[0.06] mx-4 self-center h-8"></div>
              <div className="flex-1">
                <div className="text-xs text-gray-500 font-bold mb-1">本期额度</div>
                <div className="text-lg font-extrabold text-gray-700 leading-none pt-1">
                  {config.quota}
                </div>
              </div>
            </div>
          </div>

          {/* 列表头部 */}
          <div className="flex items-center justify-between mb-5 px-2">
            <div className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="w-1 h-5 rounded-full bg-red-500"></span>
              <span>资产申购列表</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/reservation-record')}
                className="flex items-center gap-1.5 bg-red-50 text-red-600 px-3 py-1.5 rounded-full text-xs font-bold border border-red-100 active:scale-95 transition-transform"
              >
                <ClipboardList size={14} />
                <span>申购记录</span>
              </button>
              {status === 'active' && target && (
                <div className="text-xs font-mono text-white bg-red-500 px-3 py-1.5 rounded-full shadow-md shadow-red-200 flex items-center gap-1.5 animate-pulse">
                  <Clock size={12} />
                  <span className="font-bold tracking-wide">{formatDuration(target.getTime() - now.getTime())}</span>
                </div>
              )}
            </div>
          </div>

          {/* 价格分区筛选 */}
          <ZoneFilters
            priceZones={priceZones}
            activeZone={activePriceZone}
            onZoneChange={setActivePriceZone}
          />

          {/* 商品网格 */}
          <ProductGrid
            items={tradingItems}
            activePriceZone={activePriceZone}
            loading={itemsLoading}
            error={hasItemsError ? itemsErrorMessage : null}
          />
        </div>
      </div>
    );
  }

  // 列表页渲染
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50/50 via-white to-pink-50/30 text-gray-900 font-sans pb-safe">
      {/* 顶部背景渐变 */}
      <div className="absolute top-0 left-0 right-0 h-72 bg-gradient-to-br from-red-500 via-pink-500 to-rose-500 opacity-90 z-0" />
      <div className="absolute top-0 left-0 right-0 h-72 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent z-0" />

      {/* 顶部导航区 */}
      <div className="relative z-10 px-5 pt-4 pb-2 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="p-2.5 -ml-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full transition-all active:scale-95"
          >
            <ArrowLeft size={22} className="text-white" />
          </button>
          <h1 className="font-bold text-xl text-white tracking-tight drop-shadow-sm">资产交易</h1>
        </div>
        <div className="flex items-center gap-2 bg-white/90 backdrop-blur-xl px-4 py-2 rounded-full shadow-lg border border-white/50">
          <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 animate-pulse shadow-lg shadow-green-500/50"></div>
          <span className="text-xs font-bold text-gray-700 tracking-wide">实时交易</span>
        </div>
      </div>

      {/* 滚动列表 */}
      <div className="relative z-10 p-5 space-y-6">
        {loading ? (
          <div className="mt-20"><LoadingSpinner /></div>
        ) : hasSessionError ? (
          <div className="mt-20 text-center text-red-500 text-sm">{sessionErrorMessage}</div>
        ) : sessions.map(session => {
          const config = buildPoolConfig(session);
          const { status, target } = getSessionStatus(session);

          return (
            <SessionCard
              key={session.id}
              session={session}
              status={status}
              target={target}
              now={now}
              navigating={navigating}
              config={config}
              formatDuration={formatDuration}
              onSelect={handleSessionSelect}
            />
          );
        })}
      </div>

      {/* 交易须知弹窗 */}
      <PopupAnnouncementModal
        visible={showTradeNotice}
        announcement={tradeNoticeAnnouncement}
        onClose={() => setShowTradeNotice(false)}
        onDontShowToday={() => {
          if (tradeNoticeAnnouncement) {
            const dismissedKey = `trade_notice_dismissed_${tradeNoticeAnnouncement.id}`;
            const today = new Date().toDateString();
            localStorage.setItem(dismissedKey, today);
          }
        }}
      />
    </div>
  );
};

export default TradingZone;
