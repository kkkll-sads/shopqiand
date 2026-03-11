/**
 * @file 预约申购页
 * @description 流程：
 *   1. 页面加载 → bySessionDetail → 获取分区列表 + 用户余额 + 算力配置
 *   2. 用户选分区/数量，点"确认" → previewBidBuy → 展示确认弹窗
 *   3. 用户点"提交" → bidBuy → 执行申购（待接入）
 *
 *   路由：/trading/pre-order/:id（id = session_id）
 *   可选查询参数：package_id, zone_id
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  HelpCircle,
  Image as ImageIcon,
  Check,
  ChevronDown,
  AlertCircle,
  RefreshCcw,
  Tag,
  Wallet,
  Zap,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../components/layout/PageHeader';
import { PullToRefreshContainer } from '../../components/ui/PullToRefreshContainer';
import { useAppNavigate } from '../../lib/navigation';
import { useRequest } from '../../hooks/useRequest';
import {
  collectionItemApi,
  reservationApi,
  type CollectionZone,
  type CollectionDetailResponse,
  type ReservationPreviewResponse,
} from '../../api';
import { resolveUploadUrl } from '../../api/modules/upload';
import { getErrorMessage } from '../../api/core/errors';
import { WheelPicker, type WheelPickerItem } from '../../components/ui/WheelPicker';
import { useFeedback } from '../../components/ui/FeedbackProvider';

export const PreOrderPage = () => {
  const { goBack } = useAppNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();

  const sessionId = Number(id) || 0;
  const packageId = searchParams.get('package_id') ? Number(searchParams.get('package_id')) : undefined;
  const initialZoneId = searchParams.get('zone_id') ? Number(searchParams.get('zone_id')) : undefined;

  // 表单状态
  const [selectedZone, setSelectedZone] = useState<CollectionZone | null>(null);
  const [quantity, setQuantity] = useState<number | string>(1);
  const [extraHashrate, setExtraHashrate] = useState<number | string>(0);
  const [agreed, setAgreed] = useState(true);
  const [showZonePicker, setShowZonePicker] = useState(false);

  // 预约预览
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<ReservationPreviewResponse | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');

  /* ---- 页面加载：请求 bySessionDetail ---- */
  const {
    data: detailData,
    error: loadError,
    loading,
    reload,
  } = useRequest(
    async (signal) => {
      if (!sessionId) return null;
      const res = await collectionItemApi.getBySessionDetail(
        { session_id: sessionId, package_id: packageId ?? 0 },
        signal,
      );
      // 自动选中第一个有库存的分区或 URL 指定的分区
      const zones = res?.zones ?? [];
      if (zones.length > 0 && !selectedZone) {
        const target = initialZoneId
          ? zones.find((z) => z.zone_id === initialZoneId)
          : zones.find((z) => z.stock > 0);
        setSelectedZone(target ?? zones[0]);
      }
      return res;
    },
    {
      cacheKey: sessionId ? `pre-order-detail:${sessionId}:${packageId}` : undefined,
      deps: [sessionId, packageId],
      manual: !sessionId,
    },
  );

  const zones = detailData?.zones ?? [];
  const userInfo = detailData?.user;
  const config = detailData?.config;

  /* ---- 表单逻辑 ---- */
  const numQuantity = typeof quantity === 'number' ? quantity : parseInt(quantity || '0', 10);
  const numExtraHashrate = typeof extraHashrate === 'number' ? extraHashrate : parseInt(extraHashrate || '0', 10);
  const maxQuantity = selectedZone ? Math.min(selectedZone.stock, 99) : 0;
  const quantityError = numQuantity < 1 || numQuantity > maxQuantity;
  const extraHashrateError = config ? numExtraHashrate > config.max_extra_hashrate : false;

  // 本地价格计算
  const unitPrice = selectedZone ? selectedZone.max_price : 0;
  const subtotal = unitPrice * numQuantity;
  const hashrateCost = config ? config.base_hashrate_cost * numQuantity + numExtraHashrate : 0;
  const canAfford = userInfo ? subtotal <= userInfo.balance_available : true;
  const hasEnoughPower = userInfo ? hashrateCost <= userInfo.green_power : true;

  const canSubmit =
    selectedZone &&
    selectedZone.stock > 0 &&
    !quantityError &&
    !extraHashrateError &&
    canAfford &&
    hasEnoughPower &&
    agreed;

  const submitButtonText = previewLoading
    ? '预览中...'
    : !canAfford
      ? '余额不足'
      : !hasEnoughPower
        ? '算力不足'
        : !agreed
          ? '请先同意协议'
          : '确认预约';

  const handleRefresh = useCallback(async () => {
    await reload().catch(() => undefined);
  }, [reload]);

  /** 点击「确认预约」→ 调用预约预览 API */
  const handleSubmit = useCallback(async () => {
    if (!canSubmit || !selectedZone) return;
    setPreviewLoading(true);
    setPreviewError('');
    try {
      const res = await reservationApi.previewBidBuy({
        session_id: detailData?.session_id ?? sessionId,
        zone_id: selectedZone.zone_id,
        package_id: detailData?.package_id ?? packageId ?? 0,
        extra_hashrate: numExtraHashrate,
        quantity: numQuantity,
      });
      setPreviewData(res);
      setShowPreview(true);
    } catch (err) {
      setPreviewError(getErrorMessage(err));
      setShowPreview(true);
    } finally {
      setPreviewLoading(false);
    }
  }, [canSubmit, selectedZone, detailData, sessionId, packageId, numExtraHashrate, numQuantity]);

  // Stepper 组件
  const Stepper = ({
    value, onChange, min = 0, max = 9999,
  }: { value: number | string; onChange: (v: number | string) => void; min?: number; max?: number }) => {
    const numVal = typeof value === 'number' ? value : parseInt(value || '0', 10);
    return (
      <div className="flex items-center border border-border-light rounded-lg overflow-hidden h-9">
        <button
          onClick={() => numVal > min && onChange(numVal - 1)}
          disabled={numVal <= min}
          className="w-9 h-full flex items-center justify-center bg-bg-base text-text-main disabled:text-text-aux active:bg-border-light transition-colors"
        >-</button>
        <div className="w-px h-full bg-border-light" />
        <input
          type="text"
          value={value}
          onChange={(e) => {
            const val = e.target.value.replace(/[^\d]/g, '');
            onChange(val === '' ? '' : parseInt(val, 10));
          }}
          onBlur={() => {
            if (value === '' || numVal < min) onChange(min);
            else if (numVal > max) onChange(max);
          }}
          className="w-14 h-full text-center text-md font-medium text-text-main bg-white dark:bg-gray-900 outline-none"
        />
        <div className="w-px h-full bg-border-light" />
        <button
          onClick={() => numVal < max && onChange(numVal + 1)}
          disabled={numVal >= max}
          className="w-9 h-full flex items-center justify-center bg-bg-base text-text-main disabled:text-text-aux active:bg-border-light transition-colors"
        >+</button>
      </div>
    );
  };

  /* ---- 渲染骨架屏 ---- */
  const renderSkeleton = () => (
    <div className="px-4 space-y-4 pb-24 mt-4">
      <Card className="p-4"><Skeleton className="w-full h-24 rounded-xl" /></Card>
      <Card className="p-4"><Skeleton className="w-full h-16 rounded-xl" /></Card>
      <Card className="p-4"><Skeleton className="w-full h-16 rounded-xl" /></Card>
      <Card className="p-4"><Skeleton className="w-full h-20 rounded-xl" /></Card>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col bg-bg-base relative overflow-hidden">
      <PageHeader
        title="预约申购"
        onBack={goBack}
        rightAction={
          <button className="p-1 active:opacity-70 transition-opacity">
            <HelpCircle size={20} className="text-text-main" />
          </button>
        }
      />

      <PullToRefreshContainer onRefresh={handleRefresh}>
        <div className="flex-1 overflow-y-auto no-scrollbar pb-32 bg-gradient-to-b from-red-50/50 to-bg-base dark:from-bg-base dark:to-bg-base">
          {loading ? (
            renderSkeleton()
          ) : loadError && zones.length === 0 ? (
            <ErrorState message="加载失败，请检查网络" onRetry={reload} />
          ) : zones.length === 0 ? (
            <EmptyState message="暂无可申购分区" actionText="返回" onAction={goBack} />
          ) : (
            <div className="px-4 space-y-4 mt-4">
              {/* 资产包信息卡片 */}
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
                    <h2 className="text-xl font-bold text-text-main leading-tight mb-2">
                       {detailData?.package_name || '资产申购'}
                    </h2>
                    {detailData?.session?.is_mixed_pay_available === true && (
                      <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                        <span className="text-xs text-orange-500 border border-orange-500/30 px-2 py-0.5 rounded-sm bg-orange-50/50">
                          支持混合支付
                        </span>
                      </div>
                    )}
                  </div>
                </div>

              </Card>

              {/* 选择分区 - iOS 滚轮选择器 */}
              <Card className="p-4 border border-white/50 shadow-sm">
                <h3 className="text-lg font-bold text-text-main mb-2">选择分区</h3>
                <WheelPicker
                  items={zones.map((zone) => ({
                    value: zone.zone_id,
                    label: `${Math.floor(Number(zone.zone_name))}${zone.stock <= 0 ? ' (售罄)' : ''}`,
                    disabled: zone.stock <= 0,
                  }))}
                  value={selectedZone?.zone_id}
                  onChange={(val) => {
                    const zone = zones.find((z) => z.zone_id === val);
                    if (zone && zone.stock > 0) {
                      setSelectedZone(zone);
                      setQuantity(1);
                    }
                  }}
                />
              </Card>



              {/* 协议 */}
              <div className="flex items-start px-2 mt-6 mb-4">
                <button
                  onClick={() => setAgreed(!agreed)}
                  className="mt-0.5 mr-2 shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors"
                  style={{
                    borderColor: agreed ? '#F2271C' : '#D1D5DB',
                    backgroundColor: agreed ? '#F2271C' : 'transparent',
                  }}
                >
                  {agreed && <Check size={12} className="text-white" />}
                </button>
                <div className="text-sm text-text-sub leading-snug">
                  我已阅读并同意 <span className="text-blue-500">《预约申购规则》</span> <span className="text-blue-500">《风险提示书》</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </PullToRefreshContainer>

      {/* 底部固定栏 */}
      {!loading && selectedZone && selectedZone.stock > 0 && (
        <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-border-light px-4 py-3 pb-safe z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          {/* 余额信息 */}
          {userInfo && (
            <div className="flex items-center justify-between text-sm mb-3">
              <div className="flex items-center text-text-sub">
                <Wallet size={14} className="mr-1" />
                <span>余额 <span className="text-text-main font-medium">¥{userInfo.balance_available.toLocaleString('zh-CN', { useGrouping: false })}</span></span>
              </div>
              <div className="flex items-center text-text-sub">
                <Zap size={14} className="mr-1" />
                <span>算力 <span className="text-primary-start font-medium">{userInfo.green_power}</span></span>
              </div>
            </div>
          )}
          <button
            disabled={!canSubmit || previewLoading}
            onClick={handleSubmit}
            className={`w-full h-[48px] rounded-full text-lg font-bold text-white shadow-sm transition-all ${
              canSubmit && !previewLoading
                ? 'bg-gradient-to-r from-primary-start to-primary-end active:opacity-80'
                : 'bg-border-light text-text-aux cursor-not-allowed'
            }`}
          >
            {previewLoading ? (
              <span className="inline-flex items-center">
                <RefreshCcw size={16} className="mr-2 animate-spin" />
                {submitButtonText}
              </span>
            ) : (
              submitButtonText
            )}
          </button>
        </div>
      )}

      {/* 预约预览弹窗 */}
      {showPreview && (
        <PreviewSheet
          detailData={detailData}
          selectedZone={selectedZone}
          quantity={quantity}
          setQuantity={setQuantity}
          extraHashrate={extraHashrate}
          setExtraHashrate={setExtraHashrate}
          maxQuantity={maxQuantity}
          config={config}
          subtotal={subtotal}
          numQuantity={numQuantity}
          numExtraHashrate={numExtraHashrate}
          sessionId={sessionId}
          packageId={packageId}
          previewData={previewData}
          setPreviewData={setPreviewData}
          previewError={previewError}
          setPreviewError={setPreviewError}
          onClose={() => setShowPreview(false)}
        />
      )}

      <style>{`
        .pb-safe { padding-bottom: max(env(safe-area-inset-bottom), 12px); }
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.25s ease-out;
        }
      `}</style>
    </div>
  );
};

/* ================================================================
 * 预约预览底部弹窗（独立组件，支持下拉关闭 + 数量变更重新预览）
 * ================================================================ */
interface PreviewSheetProps {
  detailData: CollectionDetailResponse | null;
  selectedZone: CollectionZone | null;
  quantity: number | string;
  setQuantity: (v: number | string) => void;
  extraHashrate: number | string;
  setExtraHashrate: (v: number | string) => void;
  maxQuantity: number;
  config: CollectionDetailResponse['config'] | undefined;
  subtotal: number;
  numQuantity: number;
  numExtraHashrate: number;
  sessionId: number;
  packageId: number | undefined;
  previewData: ReservationPreviewResponse | null;
  setPreviewData: (d: ReservationPreviewResponse | null) => void;
  previewError: string;
  setPreviewError: (e: string) => void;
  onClose: () => void;
}

const PreviewSheet: React.FC<PreviewSheetProps> = ({
  detailData,
  selectedZone,
  quantity,
  setQuantity,
  extraHashrate,
  setExtraHashrate,
  maxQuantity,
  config,
  subtotal,
  numQuantity,
  numExtraHashrate,
  sessionId,
  packageId,
  previewData,
  setPreviewData,
  previewError,
  setPreviewError,
  onClose,
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const maskRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ startY: 0, currentY: 0, isDragging: false, offset: 0 });
  const [isClosing, setIsClosing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { showToast } = useFeedback();

  // 数量/算力变更时重新预览
  const refreshPreview = useCallback(async () => {
    if (!selectedZone) return;
    setRefreshing(true);
    try {
      const res = await reservationApi.previewBidBuy({
        session_id: detailData?.session_id ?? sessionId,
        zone_id: selectedZone.zone_id,
        package_id: detailData?.package_id ?? packageId ?? 0,
        extra_hashrate: numExtraHashrate,
        quantity: numQuantity,
      });
      setPreviewData(res);
      setPreviewError('');
    } catch (err) {
      setPreviewError(getErrorMessage(err));
    } finally {
      setRefreshing(false);
    }
  }, [selectedZone, detailData, sessionId, packageId, numExtraHashrate, numQuantity, setPreviewData, setPreviewError]);

  /** 显示提示 */
  const showTip = useCallback((msg: string) => {
    showToast({ message: msg, type: 'warning', duration: 3000 });
  }, [showToast]);

  const [submitting, setSubmitting] = useState(false);

  /** 执行申购提交 */
  const handleBidBuy = useCallback(async () => {
    if (!selectedZone || submitting) return;
    setSubmitting(true);
    try {
      await reservationApi.bidBuy({
        session_id: detailData?.session_id ?? sessionId,
        zone_id: selectedZone.zone_id,
        package_id: detailData?.package_id ?? packageId ?? 0,
        extra_hashrate: numExtraHashrate,
        quantity: numQuantity,
      });
      showToast({ message: '申购提交成功！', type: 'success' });
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      showToast({ message: getErrorMessage(err), type: 'error', duration: 3000 });
      setSubmitting(false);
    }
  }, [selectedZone, submitting, detailData, sessionId, packageId, numExtraHashrate, numQuantity, showTip, onClose]);

  // 数量变化时自动刷新预览（算力仅本地计算，不需重新请求）
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      refreshPreview();
    }, 500);
    return () => clearTimeout(debounceTimer.current);
  }, [numQuantity]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- 下拉关闭手势 (Ref 驱动，避免掉帧) ---- */
  const handleDragStart = useCallback((clientY: number) => {
    dragRef.current = { startY: clientY, currentY: clientY, isDragging: true, offset: dragRef.current.offset };
    if (sheetRef.current) sheetRef.current.style.transition = 'none';
    if (maskRef.current) maskRef.current.style.transition = 'none';
  }, []);

  const handleDragMove = useCallback((clientY: number) => {
    if (!dragRef.current.isDragging) return;
    const delta = -Math.min(0, dragRef.current.startY - clientY); // 只允许向下拖拽 (delta >= 0)
    dragRef.current.currentY = clientY;
    dragRef.current.offset = delta;

    // 使用 requestAnimationFrame 保证流畅更新 DOM，不触发 React Render
    requestAnimationFrame(() => {
      if (sheetRef.current) {
        sheetRef.current.style.transform = `translateY(${delta}px)`;
      }
      if (maskRef.current) {
        maskRef.current.style.opacity = `${Math.max(0, 1 - delta / 400)}`;
      }
    });
  }, []);

  const handleDragEnd = useCallback(() => {
    if (!dragRef.current.isDragging) return;
    dragRef.current.isDragging = false;
    
    const finalOffset = dragRef.current.offset;
    if (sheetRef.current) sheetRef.current.style.transition = 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
    if (maskRef.current) maskRef.current.style.transition = 'opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1)';

    if (finalOffset > 120) {
      setIsClosing(true);
      if (sheetRef.current) sheetRef.current.style.transform = `translateY(100%)`;
      if (maskRef.current) maskRef.current.style.opacity = '0';
      setTimeout(onClose, 250);
    } else {
      dragRef.current.offset = 0;
      if (sheetRef.current) sheetRef.current.style.transform = `translateY(0px)`;
      if (maskRef.current) maskRef.current.style.opacity = '1';
    }
  }, [onClose]);

  useEffect(() => {
    const onTouchMove = (e: TouchEvent) => {
      if (dragRef.current.isDragging) {
        e.preventDefault();
        handleDragMove(e.touches[0].clientY);
      }
    };
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', handleDragEnd);
    window.addEventListener('mouseup', handleDragEnd);
    return () => {
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', handleDragEnd);
      window.removeEventListener('mouseup', handleDragEnd);
    };
  }, [handleDragMove, handleDragEnd]);


  /** 混合支付时的数量上限 */
  const mixedMaxQuantity = previewData?.mixed_payment?.enabled && previewData.mixed_payment.remaining_times > 0
    ? Math.min(maxQuantity, previewData.mixed_payment.remaining_times)
    : maxQuantity;

  /** 数量变更拦截 */
  const handleQuantityChange = useCallback((val: number | string) => {
    const n = typeof val === 'number' ? val : parseInt(val || '0', 10);
    if (previewData?.mixed_payment?.enabled && previewData.mixed_payment.remaining_times > 0 && n > previewData.mixed_payment.remaining_times) {
      showTip(`混合支付剩余次数为 ${previewData.mixed_payment.remaining_times} 次，无法选择更多数量`);
      setQuantity(previewData.mixed_payment.remaining_times);
      return;
    }
    setQuantity(val);
  }, [previewData, setQuantity, showTip]);

  const Stepper = ({
    value, onChange, min = 0, max = 9999, onMaxReached,
  }: { value: number | string; onChange: (v: number | string) => void; min?: number; max?: number; onMaxReached?: () => void }) => {
    const numVal = typeof value === 'number' ? value : parseInt(value || '0', 10);
    return (
      <div className="flex items-center border border-border-light rounded-lg overflow-hidden h-9">
        <button onClick={() => numVal > min && onChange(numVal - 1)} disabled={numVal <= min}
          className="w-9 h-full flex items-center justify-center bg-bg-base text-text-main disabled:text-text-aux active:bg-border-light transition-colors">-</button>
        <div className="w-px h-full bg-border-light" />
        <input type="text" value={value}
          onChange={(e) => { const val = e.target.value.replace(/[^\d]/g, ''); onChange(val === '' ? '' : parseInt(val, 10)); }}
          onBlur={() => { const nv = typeof value === 'number' ? value : parseInt(value || '0', 10); if (value === '' || nv < min) onChange(min); else if (nv > max) onChange(max); }}
          className="w-14 h-full text-center text-md font-medium text-text-main bg-white dark:bg-gray-900 outline-none" />
        <div className="w-px h-full bg-border-light" />
        <button
          onClick={() => { if (numVal >= max) { onMaxReached?.(); } else { onChange(numVal + 1); } }}
          className={`w-9 h-full flex items-center justify-center bg-bg-base active:bg-border-light transition-colors ${numVal >= max ? 'text-text-aux' : 'text-text-main'}`}
        >+</button>
      </div>
    );
  };

  return (
    <>
      <div
        ref={maskRef}
        className="absolute inset-0 bg-black/50 z-50 transition-opacity duration-300"
        style={{ opacity: isClosing ? 0 : 1 }}
        onClick={onClose}
      />
      <div
        ref={sheetRef}
        className={`absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-[20px] z-50 flex flex-col max-h-[80vh] transition-transform duration-300 ${isClosing ? 'translate-y-full' : 'animate-slide-up'}`}
      >
        {/* 整个头部即为拖拽区域 */}
        <div
          className="shrink-0 cursor-grab active:cursor-grabbing"
          onTouchStart={(e) => handleDragStart(e.touches[0].clientY)}
          onMouseDown={(e) => { e.preventDefault(); handleDragStart(e.clientY); window.addEventListener('mousemove', (ev) => handleDragMove(ev.clientY)); }}
        >
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-border-light rounded-full" />
          </div>
          <div className="flex items-center justify-between px-4 pb-3 border-b border-border-light">
            <button onClick={onClose} className="text-md text-text-sub px-2 py-1">取消</button>
            <h3 className="text-xl font-bold text-text-main">预约确认</h3>
            <div className="w-14 flex justify-end">
              {refreshing && <RefreshCcw size={16} className="animate-spin text-text-sub" />}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {/* 分区 + 数量 */}
            <Card className="p-4 border border-border-light/50">
              <div className="flex justify-between items-center mb-3">
                <span className="text-base text-text-sub">分区</span>
                <span className="text-xl font-bold text-primary-start">¥{Math.floor(Number(selectedZone?.zone_name))}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-base text-text-sub">数量</span>
                <Stepper
                  value={quantity}
                  onChange={handleQuantityChange}
                  min={1}
                  max={mixedMaxQuantity}
                  onMaxReached={() => {
                    if (previewData?.mixed_payment?.enabled && previewData.mixed_payment.remaining_times > 0) {
                      showTip(`混合支付剩余次数为 ${previewData.mixed_payment.remaining_times} 次，无法选择更多数量`);
                    }
                  }}
                />
              </div>
            </Card>

            {/* 额外算力 */}
            {config && (
              <Card className="p-4 border border-border-light/50">
                <div className="flex justify-between items-center">
                  <span className="text-base text-text-sub flex items-center">
                    <Zap size={14} className="mr-1 text-primary-start" /> 额外算力
                  </span>
                  <Stepper value={extraHashrate} onChange={setExtraHashrate} min={0} max={config.max_extra_hashrate} />
                </div>
              </Card>
            )}

            {/* 冻结金额 */}
            <div className="p-3 bg-bg-base rounded-xl">
              <div className="flex justify-between items-center">
                <span className="text-base text-text-sub">冻结金额</span>
                <span className="text-2xl font-bold text-primary-start">
                  ¥{(previewData?.total_freeze_amount ?? subtotal).toLocaleString('zh-CN', { useGrouping: false })}
                </span>
              </div>
              {/* 混合支付时显示明细 */}
              {previewData?.payment?.is_mixed && (
                <div className="mt-2 pt-2 border-t border-border-light/50 space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-sub">专项金</span>
                    <span className="text-text-main font-medium">¥{previewData.payment.balance_amount.toLocaleString('zh-CN', { useGrouping: false })}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-sub">待激活确权金</span>
                    <span className="text-text-main font-medium">¥{previewData.payment.pending_activation_gold_amount.toLocaleString('zh-CN', { useGrouping: false })}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-sub">支付方式</span>
                    <span className="text-text-main font-medium">混合支付（{previewData.payment.mixed_payment_ratio}）</span>
                  </div>
                </div>
              )}
            </div>

            {/* 算力消耗 */}
            {previewData && previewData.total_power_used > 0 && (
              <div className="flex justify-between items-center p-3 bg-bg-base rounded-xl">
                <span className="text-sm text-text-sub flex items-center">
                  <Zap size={14} className="mr-1 text-primary-start" /> 算力消耗
                </span>
                <span className="text-sm font-medium text-primary-start">{previewData.total_power_used}</span>
              </div>
            )}

            {/* 预览错误提示（如混合支付次数不足） */}
            {previewError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/20 flex items-start">
                <AlertCircle size={16} className="text-primary-start mr-2 mt-0.5 shrink-0" />
                <p className="text-sm text-primary-start leading-relaxed">{previewError}</p>
              </div>
            )}

            {/* 混合支付提示（切换原因说明） */}
            {previewData?.mixed_payment?.notice && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/20 flex items-start">
                <AlertCircle size={16} className="text-amber-500 mr-2 mt-0.5 shrink-0" />
                <p className="text-sm text-amber-600 dark:text-amber-400 leading-relaxed">{previewData.mixed_payment.notice}</p>
              </div>
            )}

            {/* 混合支付剩余次数 */}
            {previewData?.mixed_payment?.enabled && (
              <div className="flex justify-between items-center p-3 bg-bg-base rounded-xl">
                <span className="text-sm text-text-sub">混合支付剩余次数</span>
                <span className={`text-sm font-medium ${previewData.mixed_payment.remaining_times <= 0 ? 'text-primary-start' : 'text-text-main'}`}>
                  {previewData.mixed_payment.remaining_times}
                </span>
              </div>
            )}

            {/* 说明（来自 API） */}
            {previewData?.message && (
              <div className="p-3 bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-orange-100 dark:border-orange-900/20">
                <p className="text-sm text-orange-600 dark:text-orange-400 leading-relaxed">{previewData.message}</p>
              </div>
            )}
          </div>
        </div>

        {/* 底部提交按钮 */}
        <div className="px-4 py-3 pb-safe border-t border-border-light shrink-0">
          <button
            disabled={!!previewError || refreshing || submitting}
            onClick={handleBidBuy}
            className={`w-full h-[48px] rounded-full text-lg font-bold text-white transition-opacity shadow-sm ${
              previewError || refreshing || submitting
                ? 'bg-border-light text-text-aux cursor-not-allowed'
                : 'bg-gradient-to-r from-primary-start to-primary-end active:opacity-80'
            }`}
          >
            {submitting ? (
              <span className="inline-flex items-center">
                <RefreshCcw size={16} className="mr-2 animate-spin" />
                提交中...
              </span>
            ) : (
              '确认并提交'
            )}
          </button>
        </div>
      </div>
    </>
  );
};

