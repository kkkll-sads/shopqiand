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
  ArrowRight,
  HelpCircle,
  Image as ImageIcon,
  Check,
  ChevronDown,
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
import { ReservationAgreementDialog } from '../../components/biz/ReservationAgreementDialog';
import { useAppNavigate } from '../../lib/navigation';
import { useRequest } from '../../hooks/useRequest';
import {
  collectionItemApi,
  reservationApi,
  type CollectionZone,
  type ReservationAgreementType,
  type ReservationPreviewResponse,
} from '../../api';
import { resolveUploadUrl } from '../../api/modules/upload';
import { getErrorMessage } from '../../api/core/errors';
import { WheelPicker, type WheelPickerItem } from '../../components/ui/WheelPicker';
import { PreviewSheet } from './components/PreviewSheet';

function roundCurrency(value: number) {
  return Math.round((Math.max(0, value) + Number.EPSILON) * 100) / 100;
}

function formatCurrencyAmount(value: number) {
  const normalized = roundCurrency(value);
  return normalized.toLocaleString('zh-CN', {
    useGrouping: false,
    minimumFractionDigits: Number.isInteger(normalized) ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

function parseZoneAmount(zoneName?: string | number | null) {
  const rawValue = `${zoneName ?? ''}`.trim();
  if (!rawValue) return 0;

  const kMatch = rawValue.toUpperCase().match(/(\d+(?:\.\d+)?)\s*K/);
  if (kMatch) {
    return roundCurrency(Number.parseFloat(kMatch[1]) * 1000);
  }

  const numericMatch = rawValue.match(/(\d+(?:\.\d+)?)/);
  return numericMatch ? roundCurrency(Number.parseFloat(numericMatch[1])) : 0;
}

function resolveZoneFreezeUnitAmount(zone?: Pick<CollectionZone, 'zone_name' | 'max_price'> | null) {
  const zoneAmount = parseZoneAmount(zone?.zone_name);
  if (zoneAmount > 0) {
    return zoneAmount;
  }

  return roundCurrency(Number(zone?.max_price ?? 0));
}

function formatZoneAmountLabel(zone?: Pick<CollectionZone, 'zone_name' | 'max_price'> | null) {
  const zoneAmount = resolveZoneFreezeUnitAmount(zone);
  if (zoneAmount > 0) {
    return formatCurrencyAmount(zoneAmount);
  }

  const rawValue = `${zone?.zone_name ?? ''}`.trim();
  return rawValue || '--';
}

function parseMixedPaymentRatio(ratio?: string) {
  const match = `${ratio ?? ''}`.trim().match(/^(\d+)\s*:\s*(\d+)$/);
  const balanceWeight = Math.max(0, Number.parseInt(match?.[1] ?? '9', 10));
  const pendingWeight = Math.max(0, Number.parseInt(match?.[2] ?? '1', 10));

  if (balanceWeight === 0 && pendingWeight === 0) {
    return { balanceWeight: 9, pendingWeight: 1, ratioText: '9:1' };
  }

  return {
    balanceWeight,
    pendingWeight,
    ratioText: `${balanceWeight}:${pendingWeight}`,
  };
}

function resolveReservationFundingPlan(options: {
  totalAmount: number;
  balanceAvailable: number;
  pendingActivationGold: number;
  canUseMixedPayment: boolean;
  ratio?: string;
  allowFallbackBalanceOnly: boolean;
}) {
  const totalAmount = roundCurrency(options.totalAmount);
  const balanceAvailable = roundCurrency(options.balanceAvailable);
  const pendingActivationGold = roundCurrency(options.pendingActivationGold);

  if (totalAmount <= 0) {
    return {
      ok: true,
      useMixedPayment: false,
      balanceAmount: 0,
      pendingAmount: 0,
      shortageAmount: 0,
      fallbackToBalanceOnly: false,
      requiresPendingActivationGold: false,
      pendingRequiredAmount: 0,
      pendingShortageAmount: 0,
    };
  }

  if (options.canUseMixedPayment) {
    const { balanceWeight, pendingWeight } = parseMixedPaymentRatio(options.ratio);
    const weightTotal = Math.max(1, balanceWeight + pendingWeight);
    const pendingRequiredAmount = roundCurrency(totalAmount * (pendingWeight / weightTotal));
    const balanceAmount = roundCurrency(totalAmount - pendingRequiredAmount);
    const pendingShortageAmount = roundCurrency(Math.max(0, pendingRequiredAmount - pendingActivationGold));
    const useMixedPayment = pendingRequiredAmount > 0;

    if (useMixedPayment && pendingShortageAmount <= 0 && balanceAmount <= balanceAvailable) {
      return {
        ok: true,
        useMixedPayment: true,
        balanceAmount,
        pendingAmount: pendingRequiredAmount,
        shortageAmount: 0,
        fallbackToBalanceOnly: false,
        requiresPendingActivationGold: false,
        pendingRequiredAmount,
        pendingShortageAmount: 0,
      };
    }

    if (options.allowFallbackBalanceOnly && balanceAvailable >= totalAmount) {
      return {
        ok: true,
        useMixedPayment: false,
        balanceAmount: totalAmount,
        pendingAmount: 0,
        shortageAmount: 0,
        fallbackToBalanceOnly: true,
        requiresPendingActivationGold: false,
        pendingRequiredAmount,
        pendingShortageAmount,
      };
    }

    return {
      ok: false,
      useMixedPayment: false,
      balanceAmount,
      pendingAmount: pendingRequiredAmount,
      shortageAmount: roundCurrency(Math.max(0, balanceAmount - balanceAvailable)),
      fallbackToBalanceOnly: false,
      requiresPendingActivationGold: pendingShortageAmount > 0,
      pendingRequiredAmount,
      pendingShortageAmount,
    };
  }

  return {
    ok: balanceAvailable >= totalAmount,
    useMixedPayment: false,
    balanceAmount: totalAmount,
    pendingAmount: 0,
    shortageAmount: roundCurrency(Math.max(0, totalAmount - balanceAvailable)),
    fallbackToBalanceOnly: false,
    requiresPendingActivationGold: false,
    pendingRequiredAmount: 0,
    pendingShortageAmount: 0,
  };
}

const RESERVATION_AGREEMENT_TITLES: Record<ReservationAgreementType, string> = {
  purchase_rules: '预约申购规则',
  risk_notice: '风险提示书',
};

export const PreOrderPage = () => {
  const { goBack, goTo } = useAppNavigate();
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
  const [activeAgreementType, setActiveAgreementType] = useState<ReservationAgreementType | null>(null);

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

  const {
    data: agreementData,
    error: agreementError,
    loading: agreementLoading,
    reload: reloadAgreement,
  } = useRequest(
    async (signal) => {
      if (!activeAgreementType) return null;
      return reservationApi.getAgreement(activeAgreementType, signal);
    },
    {
      cacheKey: activeAgreementType ? `reservation-agreement:${activeAgreementType}` : undefined,
      deps: [activeAgreementType],
      keepPreviousData: false,
      manual: !activeAgreementType,
    },
  );

  /* ---- 表单逻辑 ---- */
  const numQuantity = typeof quantity === 'number' ? quantity : parseInt(quantity || '0', 10);
  const numExtraHashrate = typeof extraHashrate === 'number' ? extraHashrate : parseInt(extraHashrate || '0', 10);
  const maxQuantity = selectedZone ? Math.min(selectedZone.stock, 99) : 0;
  const quantityError = numQuantity < 1 || numQuantity > maxQuantity;
  const extraHashrateError = config ? numExtraHashrate > config.max_extra_hashrate : false;

  // 本地价格计算
  const unitPrice = resolveZoneFreezeUnitAmount(selectedZone);
  const estimatedFreezeAmount = roundCurrency(unitPrice * numQuantity);
  const hashrateCost = config ? config.base_hashrate_cost * numQuantity + numExtraHashrate : 0;
  const mixedPaymentInfo = detailData?.mixed_payment;
  const supportsMixedPayment =
    mixedPaymentInfo?.enabled === true || detailData?.is_mixed_pay_available === true || detailData?.session?.is_mixed_pay_available === true;
  const mixedPaymentRemainingTimes = Number(mixedPaymentInfo?.remaining_times ?? -1);
  const exceedsMixedPaymentTimes =
    mixedPaymentInfo?.available === true &&
    mixedPaymentRemainingTimes > 0 &&
    numQuantity > mixedPaymentRemainingTimes;
  const balanceAvailable = Number(userInfo?.balance_available ?? 0);
  const pendingActivationGold = Number(userInfo?.pending_activation_gold ?? 0);
  const fundingPlan = resolveReservationFundingPlan({
    totalAmount: estimatedFreezeAmount,
    balanceAvailable,
    pendingActivationGold,
    canUseMixedPayment:
      mixedPaymentInfo?.available === true &&
      Boolean(mixedPaymentInfo?.ratio) &&
      !exceedsMixedPaymentTimes,
    ratio: mixedPaymentInfo?.ratio,
    allowFallbackBalanceOnly: mixedPaymentInfo?.allow_fallback_balance_only ?? true,
  });
  const canAfford = userInfo ? fundingPlan.ok : true;
  const hasEnoughPower = userInfo ? hashrateCost <= userInfo.green_power : true;
  const balanceProblemTitle = fundingPlan.requiresPendingActivationGold ? '待激活确权金不足' : '余额不足';
  const balanceProblemDescription = fundingPlan.requiresPendingActivationGold
    ? `当前预约需待激活确权金 ¥${formatCurrencyAmount(fundingPlan.pendingRequiredAmount)}，当前可用 ¥${formatCurrencyAmount(pendingActivationGold)}。`
    : exceedsMixedPaymentTimes
      ? `当前申购数量已超过混合支付剩余次数 ${mixedPaymentRemainingTimes} 次，本次需专项金全额支付，还差 ¥${formatCurrencyAmount(fundingPlan.shortageAmount)}。`
    : `${supportsMixedPayment ? '当前可用资金不足' : '当前专项金不足'}，还差 ¥${formatCurrencyAmount(fundingPlan.shortageAmount)}`;
  const showRechargeGuide = !fundingPlan.ok && !fundingPlan.requiresPendingActivationGold;
  const mixedPaymentHint =
    supportsMixedPayment && exceedsMixedPaymentTimes
      ? `当前申购数量已超过混合支付剩余次数 ${mixedPaymentRemainingTimes} 次，本次按专项金支付。`
      : supportsMixedPayment && mixedPaymentInfo?.available === false && mixedPaymentInfo?.reason === 'daily_limit_reached'
        ? '今日混合支付次数已用完，本次按专项金支付。'
      : '';

  const estimatedFreezeSummary = fundingPlan.useMixedPayment
    ? `\u9884\u8ba1\u51bb\u7ed3\uff1a\u4e13\u9879\u91d1 \u00a5${formatCurrencyAmount(fundingPlan.balanceAmount)} + \u5f85\u6fc0\u6d3b\u786e\u6743\u91d1 \u00a5${formatCurrencyAmount(fundingPlan.pendingAmount)}`
    : fundingPlan.requiresPendingActivationGold
      ? `\u9884\u8ba1\u51bb\u7ed3\uff1a\u4e13\u9879\u91d1 \u00a5${formatCurrencyAmount(fundingPlan.balanceAmount)} + \u5f85\u6fc0\u6d3b\u786e\u6743\u91d1 \u00a5${formatCurrencyAmount(fundingPlan.pendingRequiredAmount)}`
      : `\u9884\u8ba1\u51bb\u7ed3\uff1a\u4e13\u9879\u91d1 \u00a5${formatCurrencyAmount(estimatedFreezeAmount)}`;
  const estimatedFreezeNotice = exceedsMixedPaymentTimes
    ? `\u7533\u8d2d\u6570\u91cf\u8d85\u8fc7\u6df7\u5408\u652f\u4ed8\u5269\u4f59\u6b21\u6570 ${mixedPaymentRemainingTimes} \u6b21\uff0c\u5df2\u5207\u6362\u4e13\u9879\u91d1\u652f\u4ed8\u3002`
    : fundingPlan.fallbackToBalanceOnly
      ? '\u5f85\u6fc0\u6d3b\u786e\u6743\u91d1\u4e0d\u8db3\uff0c\u5df2\u5207\u6362\u4e13\u9879\u91d1\u652f\u4ed8\u3002'
      : '';

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
        ? (fundingPlan.requiresPendingActivationGold ? '待激活确权金不足' : '余额不足')
      : !hasEnoughPower
        ? '算力不足'
        : !agreed
          ? '请先同意协议'
          : fundingPlan.fallbackToBalanceOnly || exceedsMixedPaymentTimes
            ? '已切换专项金支付'
            : '确认预约';

  const handleRefresh = useCallback(async () => {
    await reload().catch(() => undefined);
  }, [reload]);

  const openAgreement = useCallback((type: ReservationAgreementType) => {
    setActiveAgreementType(type);
  }, []);

  const closeAgreement = useCallback(() => {
    setActiveAgreementType(null);
  }, []);

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
          className="w-14 h-full text-center text-lg font-medium text-text-main bg-white dark:bg-gray-900 outline-none"
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
                    {supportsMixedPayment && (
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
                    label: `${formatZoneAmountLabel(zone)}${zone.stock <= 0 ? ' (售罄)' : ''}`,
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
                <div className="flex flex-wrap items-center gap-x-1 text-sm text-text-sub leading-snug">
                  <span>我已阅读并同意</span>
                  <button
                    type="button"
                    onClick={() => openAgreement('purchase_rules')}
                    className="text-blue-500 active:opacity-70"
                  >
                    《预约申购规则》
                  </button>
                  <button
                    type="button"
                    onClick={() => openAgreement('risk_notice')}
                    className="text-blue-500 active:opacity-70"
                  >
                    《风险提示书》
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </PullToRefreshContainer>

      {/* 底部固定栏 */}
      {!loading && selectedZone && selectedZone.stock > 0 && (
        <div className="absolute bottom-0 left-0 right-0 z-40 border-t border-border-light bg-white/95 px-4 py-3 pb-safe shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/10 dark:bg-[#090b10]/95">
          {/* 余额信息 */}
          {userInfo && (
            <div className="mb-3 rounded-[22px] border border-border-light/70 bg-bg-base/90 p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
              <div className={`grid gap-2 ${supportsMixedPayment ? 'grid-cols-3' : 'grid-cols-2'}`}>
                <div className="rounded-2xl border border-border-light/60 bg-white px-3 py-2.5 dark:border-white/10 dark:bg-white/[0.04]">
                  <div className="mb-1 flex items-center text-[11px] text-text-sub dark:text-white/60">
                    <Wallet size={14} className="mr-1.5 text-primary-start" />
                    <span>专项金</span>
                  </div>
                  <div className="text-sm font-bold text-text-main dark:text-white">¥{formatCurrencyAmount(balanceAvailable)}</div>
                </div>

                {supportsMixedPayment && (
                  <div className="rounded-2xl border border-border-light/60 bg-white px-3 py-2.5 dark:border-white/10 dark:bg-white/[0.04]">
                    <div className="mb-1 flex items-center text-[11px] text-text-sub dark:text-white/60">
                      <Tag size={14} className="mr-1.5 text-amber-500 dark:text-amber-300" />
                      <span>待激活确权金</span>
                    </div>
                    <div className="text-sm font-bold text-text-main dark:text-white">¥{formatCurrencyAmount(pendingActivationGold)}</div>
                  </div>
                )}

                <div className="rounded-2xl border border-border-light/60 bg-white px-3 py-2.5 dark:border-white/10 dark:bg-white/[0.04]">
                  <div className="mb-1 flex items-center text-[11px] text-text-sub dark:text-white/60">
                    <Zap size={14} className="mr-1.5 text-primary-start" />
                    <span>绿色算力</span>
                  </div>
                  <div className="text-sm font-bold text-primary-start dark:text-[#ff8d85]">{formatCurrencyAmount(userInfo.green_power)}</div>
                </div>
              </div>

              {selectedZone ? (
                <div className="mt-3 rounded-2xl bg-[#FFF7F4] px-3 py-2 text-xs text-text-sub dark:bg-white/[0.05] dark:text-white/65">
                  {estimatedFreezeNotice ? `${estimatedFreezeNotice} ${estimatedFreezeSummary}` : estimatedFreezeSummary}
                </div>
              ) : null}
            </div>
          )}
          {mixedPaymentHint ? (
            <div className="mb-3 rounded-[18px] border border-amber-200 bg-amber-50/90 px-3 py-2.5 text-xs leading-5 text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-100/85">
              {mixedPaymentHint}
            </div>
          ) : null}

          {!canAfford ? (
            <div className="mb-3 flex items-center justify-between gap-3 rounded-[18px] border border-red-100 bg-red-50/90 px-3 py-3 dark:border-red-400/15 dark:bg-red-500/10">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-primary-start">{balanceProblemTitle}</div>
                <div className="mt-1 text-xs leading-5 text-primary-start/75 dark:text-red-100/70">{balanceProblemDescription}</div>
              </div>
              {showRechargeGuide ? (
                <button
                  type="button"
                  onClick={() => goTo('recharge')}
                  className="inline-flex shrink-0 items-center rounded-full border border-primary-start/25 bg-white px-3 py-2 text-sm font-medium text-primary-start transition-opacity active:opacity-80 dark:bg-white/[0.06]"
                >
                  去充值
                  <ArrowRight size={14} className="ml-1" />
                </button>
              ) : null}
            </div>
          ) : null}

          <button
            type="button"
            disabled={!canSubmit || previewLoading}
            onClick={handleSubmit}
            className={`w-full h-[48px] rounded-full text-lg font-bold text-white shadow-sm transition-all ${
              canSubmit && !previewLoading
                ? 'gradient-primary-r active:opacity-80'
                : 'bg-border-light text-text-aux cursor-not-allowed dark:bg-white/10 dark:text-white/45'
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

      <ReservationAgreementDialog
        isOpen={activeAgreementType !== null}
        title={agreementData?.title || (activeAgreementType ? RESERVATION_AGREEMENT_TITLES[activeAgreementType] : '协议内容')}
        content={agreementData?.content || ''}
        loading={agreementLoading}
        error={agreementError ? getErrorMessage(agreementError) : ''}
        onRetry={() => {
          void reloadAgreement().catch(() => undefined);
        }}
        onClose={closeAgreement}
      />

      <PreviewSheet
        isOpen={showPreview}
        detailData={detailData}
        selectedZone={selectedZone}
        quantity={quantity}
        setQuantity={setQuantity}
        extraHashrate={extraHashrate}
        setExtraHashrate={setExtraHashrate}
        maxQuantity={maxQuantity}
        config={config}
        estimatedFreezeAmount={estimatedFreezeAmount}
        fundingPlan={fundingPlan}
        numQuantity={numQuantity}
        numExtraHashrate={numExtraHashrate}
        sessionId={sessionId}
        packageId={packageId}
        previewData={previewData}
        setPreviewData={setPreviewData}
        previewError={previewError}
        setPreviewError={setPreviewError}
        formatCurrencyAmount={formatCurrencyAmount}
        formatZoneAmountLabel={formatZoneAmountLabel}
        onClose={() => setShowPreview(false)}
      />
    </div>
  );
};

