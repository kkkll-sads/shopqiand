/**
 * @file 资产交易场次列表页
 * @description 从 /api/collectionSession/index 加载专场列表，点击跳转到详情页。
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Headset, Clock, ArrowRight, Image as ImageIcon } from 'lucide-react';
import { useAppNavigate } from '../../lib/navigation';
import { getCollectionSessionTiming } from '../../lib/collectionSessionTiming';
import { PageHeader } from '../../components/layout/PageHeader';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { PullToRefreshContainer } from '../../components/ui/PullToRefreshContainer';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { useRouteScrollRestoration } from '../../hooks/useRouteScrollRestoration';
import { useRequest } from '../../hooks/useRequest';
import { collectionSessionApi, type CollectionSession } from '../../api';
import { resolveUploadUrl } from '../../api/modules/upload';
import { openCustomerServiceLink } from '../../lib/customerService';

export const TradingZonePage = () => {
  const { goTo, goBack, navigate } = useAppNavigate();
  const { showToast } = useFeedback();
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  /* ---- 数据请求 ---- */
  const {
    data,
    error,
    loading,
    reload,
  } = useRequest(
    (signal) => collectionSessionApi.getList(signal),
    { cacheKey: 'trading-zone:sessions' },
  );

  const sessions = data?.list ?? [];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useRouteScrollRestoration({
    containerRef: scrollContainerRef,
    namespace: 'trading-zone',
    restoreDeps: [loading, sessions.length],
    restoreWhen: !loading && sessions.length > 0,
  });

  /* ---- 下拉刷新 ---- */
  const handleRefresh = useCallback(async () => {
    await reload().catch(() => undefined);
  }, [reload]);

  /** 跳转详情页，携带专场 ID */
  const handleCardClick = (session: CollectionSession) => {
    const timing = getCollectionSessionTiming(session.start_time, session.end_time, nowMs);
    if (timing.status !== 'in_progress') {
      return;
    }

    navigate(`/trading/detail/${session.id}`);
  };

  const handleOpenSupport = useCallback(() => {
    void openCustomerServiceLink(({ duration, message, type }) => {
      showToast({ duration, message, type });
    });
  }, [showToast]);

  /** 获取专场图片 */
  const getSessionImage = (url: string) => {
    if (!url) return '';
    return resolveUploadUrl(url);
  };

  /* ---- 渲染骨架屏 ---- */
  const renderSkeleton = () => (
    <div className="p-4 space-y-4">
      {[1, 2].map((i) => (
        <div
          key={i}
          className="w-full bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800"
        >
          <div className="w-full h-32 bg-gray-100 dark:bg-gray-800 animate-pulse"></div>
          <div className="p-4 space-y-3">
            <div className="w-2/3 h-5 bg-gray-100 dark:bg-gray-800 animate-pulse rounded"></div>
            <div className="flex space-x-4">
              <div className="w-1/3 h-10 bg-gray-100 dark:bg-gray-800 animate-pulse rounded"></div>
              <div className="w-1/3 h-10 bg-gray-100 dark:bg-gray-800 animate-pulse rounded"></div>
            </div>
            <div className="w-full h-12 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-3xl"></div>
          </div>
        </div>
      ))}
    </div>
  );

  /* ---- 渲染列表 ---- */
  const renderContent = () => {
    if (loading && sessions.length === 0) return renderSkeleton();

    if (error && sessions.length === 0) {
      return <ErrorState message="加载失败，请检查网络" onRetry={reload} />;
    }

    if (sessions.length === 0) {
      return (
        <EmptyState
          message="暂无可参与场次"
          actionText="返回商城"
          onAction={() => goTo('store')}
        />
      );
    }

    return (
      <div className="p-4 space-y-4 pb-24">
        {sessions.map((session) => {
          const timeSlot = `${session.start_time || '--:--'} - ${session.end_time || '--:--'}`;
          const sessionTiming = getCollectionSessionTiming(session.start_time, session.end_time, nowMs);
          const canEnter = sessionTiming.status === 'in_progress';
          const isEnded = sessionTiming.status === 'ended';

          return (
            <div
              key={session.id}
              className={`bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 transition-opacity ${
                canEnter ? 'cursor-pointer active:opacity-95' : 'opacity-80 cursor-not-allowed'
              }`}
              onClick={() => handleCardClick(session)}
            >
              {/* Top Banner / Theme Image */}
              <div className="relative w-full h-32 bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                {/* Fallback icon */}
                <div className="absolute inset-0 flex items-center justify-center text-gray-300 dark:text-gray-700">
                  <ImageIcon size={32} />
                </div>
                {session.image && (
                  <img
                    src={getSessionImage(session.image)}
                    alt={session.title}
                    className="w-full h-full object-cover relative z-10"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 z-10"></div>

                {/* Top Left Badge - Pool Code */}
                <div className="absolute top-3 left-3 flex flex-wrap gap-2 items-center z-20">
                  {session.code && (
                    <div className="bg-black/40 text-white text-s px-2 py-0.5 rounded-full border border-white/20 backdrop-blur-sm">
                      {session.code}
                    </div>
                  )}
                  {session.is_mixed_pay_available === true && (
                    <div className="bg-orange-500/80 text-white text-s px-2 py-0.5 rounded-full border border-orange-300/30 backdrop-blur-sm">
                      支持混合支付
                    </div>
                  )}
                </div>

                <div
                  className={`absolute top-3 right-3 z-20 rounded-full px-2 py-0.5 text-s border backdrop-blur-sm ${
                    isEnded
                      ? 'bg-black/40 text-white border-white/20'
                      : sessionTiming.status === 'not_started'
                        ? 'bg-white/20 text-white border-white/30'
                        : 'bg-green-500/20 text-white border-green-300/30'
                  }`}
                >
                  {isEnded ? '已结束' : sessionTiming.status === 'not_started' ? '未开始' : '进行中'}
                </div>

                {/* Bottom Info */}
                <div className="absolute bottom-3 left-3 right-3 z-20">
                  <h2 className="text-white text-xl font-bold leading-tight mb-1 drop-shadow-md">
                    {session.title}
                  </h2>
                  {session.sub_name && (
                    <p className="text-white/80 text-sm mb-0.5">{session.sub_name}</p>
                  )}
                  <div className="flex items-center text-white/90 text-sm">
                    <Clock size={12} className="mr-1" />
                    {timeSlot}
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4">
                {/* Metrics */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">预期收益率</div>
                    <div className="text-4xl font-bold text-brand-start">
                      {session.roi || '--'}
                    </div>
                  </div>
                  <div className="w-px h-8 bg-gray-100 dark:bg-gray-800 mx-4"></div>
                  <div className="flex-1">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">本期额度</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {session.quota || '--'}
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  className={`w-full h-10 rounded-full text-md font-medium flex items-center justify-center transition-all shadow-sm ${
                    !canEnter
                      ? 'bg-border-light text-text-aux cursor-not-allowed'
                      : 'bg-gradient-to-r from-brand-start to-brand-end text-white active:opacity-80'
                  }`}
                  disabled={!canEnter}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (canEnter) {
                      handleCardClick(session);
                    }
                  }}
                >
                  {isEnded
                    ? '本场已结束'
                    : sessionTiming.status === 'not_started'
                      ? `距开始 ${sessionTiming.countdownText}`
                      : `距结束 ${sessionTiming.countdownText}`}
                  {canEnter && <ArrowRight size={16} className="ml-1" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-bg-hover dark:bg-gray-950 relative h-full overflow-hidden">
      <PageHeader
        title="资产交易"
        onBack={goBack}
        rightAction={
          <div className="flex items-center bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full border border-green-100 dark:border-green-800/50">
            <div className="w-1.5 h-1.5 rounded-full bg-success mr-1.5 animate-pulse"></div>
            <span className="text-xs text-success font-medium">实时交易</span>
          </div>
        }
      />

      <PullToRefreshContainer onRefresh={handleRefresh}>
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto no-scrollbar relative"
        >
          {renderContent()}
        </div>
      </PullToRefreshContainer>

      {/* Floating Customer Service Button */}
      {!loading && !error && sessions.length > 0 && (
        <button
          className="absolute right-4 bottom-8 w-12 h-12 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-100 dark:border-gray-700 flex items-center justify-center text-gray-900 dark:text-gray-100 active:scale-95 transition-transform z-40"
          onClick={handleOpenSupport}
        >
          <Headset size={24} />
        </button>
      )}
    </div>
  );
};
