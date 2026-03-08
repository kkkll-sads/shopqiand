/**
 * @file 专场商品明细页
 * @description 点击资产包卡片后，展示该包下的价格分区列表。
 *   数据来自 GET /api/collectionItem/bySessionDetail（新结构：zones 列表）
 *   用户可选择分区进入预约申购页。
 */

import React, { useState, useCallback, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Lock, RefreshCcw, Tag, Zap, Wallet, ArrowRight } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../components/layout/PageHeader';
import { PullToRefreshContainer } from '../../components/ui/PullToRefreshContainer';
import { useAppNavigate } from '../../lib/navigation';
import { useRequest } from '../../hooks/useRequest';
import { collectionItemApi, type CollectionZone } from '../../api';
import { resolveUploadUrl } from '../../api/modules/upload';

export const ItemDetailPage = () => {
  const { goBack, navigate } = useAppNavigate();
  const { sessionId: sessionIdStr, packageId: packageIdStr } = useParams();
  const [searchParams] = useSearchParams();

  const sessionId = Number(sessionIdStr) || 0;
  const packageId = Number(packageIdStr) || 0;

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  /* ---- 页面标题 ---- */
  const [pageTitle, setPageTitle] = useState('商品明细');

  /* ---- 加载数据 ---- */
  const {
    data: detailData,
    error: firstError,
    loading: firstLoading,
    reload: reloadFirst,
  } = useRequest(
    async (signal) => {
      if (!sessionId || !packageId) return null;
      const res = await collectionItemApi.getBySessionDetail(
        { session_id: sessionId, package_id: packageId },
        signal,
      );
      if (res?.package_name) setPageTitle(res.package_name);
      return res;
    },
    {
      cacheKey: sessionId && packageId ? `item-detail:${sessionId}:${packageId}` : undefined,
      deps: [sessionId, packageId],
      manual: !sessionId || !packageId,
    },
  );

  const zones = detailData?.zones ?? [];
  const userInfo = detailData?.user;

  const handleRefresh = useCallback(async () => {
    await reloadFirst().catch(() => undefined);
  }, [reloadFirst]);

  /** 点击分区 → 进入预约申购页 */
  const handleZoneClick = (zone: CollectionZone) => {
    if (zone.stock <= 0) return;
    navigate(`/trading/pre-order/${sessionId}?package_id=${packageId}&zone_id=${zone.zone_id}`);
  };

  /* ---- 渲染骨架屏 ---- */
  const renderSkeleton = () => (
    <div className="px-4 space-y-4 mt-4">
      <Card className="p-4"><Skeleton className="w-full h-20 rounded-xl" /></Card>
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4"><Skeleton className="w-full h-16 rounded-lg" /></Card>
        ))}
      </div>
    </div>
  );

  /* ---- 渲染内容 ---- */
  const renderContent = () => {
    if (firstLoading) return renderSkeleton();

    if (firstError && zones.length === 0) {
      return <ErrorState message="加载失败，请检查网络" onRetry={reloadFirst} />;
    }

    if (zones.length === 0) {
      return <EmptyState message="暂无分区" actionText="返回" onAction={goBack} />;
    }

    return (
      <div className="px-4 space-y-4 mt-4">
        {/* 资产包信息 */}
        <Card className="p-4 relative overflow-hidden border border-white/50 shadow-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-start/5 rounded-bl-full -z-10" />
          <div className="flex items-start mb-3">
            {detailData?.image && (
              <div className="w-14 h-14 rounded-lg bg-bg-base overflow-hidden mr-3 shrink-0 border border-border-light/50">
                <img
                  src={resolveUploadUrl(detailData.image)}
                  alt={detailData.package_name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-xl font-bold text-text-main leading-tight mb-1">
                {detailData?.package_name}
              </h2>
              <div className="flex items-center text-sm text-text-sub">
                <Tag size={12} className="mr-1" />
                可用数量: {detailData?.total_available?.toLocaleString('zh-CN', { useGrouping: false }) ?? '--'}
              </div>
            </div>
          </div>

          {/* 用户资产 */}
          {userInfo && (
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2 rounded-xl border border-border-light/50 bg-bg-base p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-start/10 text-primary-start">
                  <Wallet size={18} strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-2xs text-text-sub block">可用余额</span>
                  <span className="text-sm font-bold text-text-main">¥{userInfo.balance_available.toLocaleString('zh-CN', { useGrouping: false })}</span>
                </div>
              </div>
              <div className="flex-1 flex items-center gap-2 rounded-xl border border-border-light/50 bg-bg-base p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Lock size={18} strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-2xs text-text-sub block">待激活金</span>
                  <span className="text-sm font-bold text-text-main">¥{userInfo.pending_activation_gold.toLocaleString('zh-CN', { useGrouping: false })}</span>
                </div>
              </div>
              <div className="flex-1 flex items-center gap-2 rounded-xl border border-border-light/50 bg-bg-base p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-500/10 text-green-600 dark:text-green-400">
                  <Zap size={18} strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-2xs text-text-sub block">绿色算力</span>
                  <span className="text-sm font-bold text-primary-start">{userInfo.green_power}</span>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* 分区标题 */}
        <h3 className="text-lg font-bold text-text-main px-1">选择分区</h3>

        {/* 分区列表 */}
        <div className="space-y-3">
          {zones.map((zone) => {
            const soldOut = zone.stock <= 0;
            return (
              <button
                key={zone.zone_id}
                onClick={() => handleZoneClick(zone)}
                disabled={soldOut}
                className={`w-full text-left active:opacity-80 transition-opacity ${soldOut ? 'opacity-50' : ''}`}
              >
                <Card className="p-4 flex items-center justify-between border border-white/50 shadow-sm">
                  <div className="flex-1">
                    <div className="text-xl font-bold text-text-main mb-1">
                      ¥{zone.zone_name}
                    </div>
                    <div className="flex items-center space-x-3 text-sm text-text-sub">
                      <span>价格区间: ¥{zone.min_price} - ¥{zone.max_price}</span>
                    </div>
                    <div className="mt-1 text-sm">
                      {soldOut ? (
                        <span className="text-text-aux">已售罄</span>
                      ) : (
                        <span className="text-text-sub">库存 <span className="text-text-main font-medium">{zone.stock}</span></span>
                      )}
                    </div>
                  </div>
                  {!soldOut && (
                    <div className="flex items-center text-primary-start ml-3">
                      <span className="text-sm font-medium mr-1">申购</span>
                      <ArrowRight size={16} />
                    </div>
                  )}
                </Card>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-bg-base relative overflow-hidden">
      <PageHeader title={pageTitle} onBack={goBack} />

      <PullToRefreshContainer onRefresh={handleRefresh}>
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto no-scrollbar pb-8">
          {renderContent()}
        </div>
      </PullToRefreshContainer>
    </div>
  );
};
