import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, RefreshCcw, Zap } from 'lucide-react';
import {
  reservationApi,
  type CollectionDetailResponse,
  type CollectionZone,
  type ReservationPreviewResponse,
} from '../../../api';
import { getErrorMessage } from '../../../api/core/errors';
import { Card } from '../../../components/ui/Card';
import { useFeedback } from '../../../components/ui/FeedbackProvider';
import { BottomSheet } from '../../../components/ui/BottomSheet';

interface PreviewFundingPlan {
  useMixedPayment: boolean;
  balanceAmount: number;
  pendingAmount: number;
}

interface PreviewSheetProps {
  isOpen: boolean;
  detailData: CollectionDetailResponse | null;
  selectedZone: CollectionZone | null;
  quantity: number | string;
  setQuantity: (v: number | string) => void;
  extraHashrate: number | string;
  setExtraHashrate: (v: number | string) => void;
  maxQuantity: number;
  config: CollectionDetailResponse['config'] | undefined;
  estimatedFreezeAmount: number;
  fundingPlan: PreviewFundingPlan;
  numQuantity: number;
  numExtraHashrate: number;
  sessionId: number;
  packageId: number | undefined;
  previewData: ReservationPreviewResponse | null;
  setPreviewData: (d: ReservationPreviewResponse | null) => void;
  previewError: string;
  setPreviewError: (e: string) => void;
  formatCurrencyAmount: (value: number) => string;
  formatZoneAmountLabel: (zone?: Pick<CollectionZone, 'zone_name' | 'max_price'> | null) => string;
  onClose: () => void;
}

export const PreviewSheet: React.FC<PreviewSheetProps> = ({
  isOpen,
  detailData,
  selectedZone,
  quantity,
  setQuantity,
  extraHashrate,
  setExtraHashrate,
  maxQuantity,
  config,
  estimatedFreezeAmount,
  fundingPlan,
  numQuantity,
  numExtraHashrate,
  sessionId,
  packageId,
  previewData,
  setPreviewData,
  previewError,
  setPreviewError,
  formatCurrencyAmount,
  formatZoneAmountLabel,
  onClose,
}) => {
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>();
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useFeedback();

  const mixedPaymentRatioText = previewData?.payment?.mixed_payment_ratio || detailData?.mixed_payment?.ratio || '9:1';

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

  const showTip = useCallback((message: string) => {
    showToast({ message, type: 'warning', duration: 3000 });
  }, [showToast]);

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
  }, [selectedZone, submitting, detailData, sessionId, packageId, numExtraHashrate, numQuantity, showToast, onClose]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      refreshPreview();
    }, 500);

    return () => clearTimeout(debounceTimer.current);
  }, [isOpen, numQuantity, refreshPreview]);

  const handleQuantityChange = useCallback((val: number | string) => {
    const n = typeof val === 'number' ? val : parseInt(val || '0', 10);
    const remainingTimes = Number(previewData?.mixed_payment?.remaining_times ?? -1);

    if (
      previewData?.mixed_payment?.enabled &&
      previewData?.mixed_payment?.available &&
      remainingTimes > 0 &&
      n > remainingTimes &&
      numQuantity <= remainingTimes
    ) {
      showTip(`当前申购数量已超过混合支付剩余次数 ${remainingTimes} 次，将自动切换为专项金支付`);
    }

    setQuantity(val);
  }, [numQuantity, previewData, setQuantity, showTip]);

  const Stepper = ({
    value,
    onChange,
    min = 0,
    max = 9999,
    onMaxReached,
  }: {
    value: number | string;
    onChange: (v: number | string) => void;
    min?: number;
    max?: number;
    onMaxReached?: () => void;
  }) => {
    const numVal = typeof value === 'number' ? value : parseInt(value || '0', 10);
    return (
      <div className="flex h-9 items-center overflow-hidden rounded-lg border border-border-light">
        <button
          onClick={() => numVal > min && onChange(numVal - 1)}
          disabled={numVal <= min}
          className="flex h-full w-9 items-center justify-center bg-bg-base text-text-main transition-colors active:bg-border-light disabled:text-text-aux"
        >
          -
        </button>
        <div className="h-full w-px bg-border-light" />
        <input
          type="text"
          value={value}
          onChange={(event) => {
            const val = event.target.value.replace(/[^\d]/g, '');
            onChange(val === '' ? '' : parseInt(val, 10));
          }}
          onBlur={() => {
            const nv = typeof value === 'number' ? value : parseInt(value || '0', 10);
            if (value === '' || nv < min) onChange(min);
            else if (nv > max) onChange(max);
          }}
          className="h-full w-14 bg-white text-center text-lg font-medium text-text-main outline-none dark:bg-gray-900"
        />
        <div className="h-full w-px bg-border-light" />
        <button
          onClick={() => {
            if (numVal >= max) {
              onMaxReached?.();
            } else {
              onChange(numVal + 1);
            }
          }}
          className={`flex h-full w-9 items-center justify-center bg-bg-base transition-colors active:bg-border-light ${numVal >= max ? 'text-text-aux' : 'text-text-main'}`}
        >
          +
        </button>
      </div>
    );
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="预约确认"
      headerRight={
        <div className="flex w-14 justify-end">
          {refreshing ? <RefreshCcw size={16} className="animate-spin text-text-sub" /> : null}
        </div>
      }
      footer={
        <div className="px-4 py-3">
          <button
            disabled={!!previewError || refreshing || submitting}
            onClick={handleBidBuy}
            className={`h-[48px] w-full rounded-full text-lg font-bold text-white shadow-sm transition-opacity ${
              previewError || refreshing || submitting
                ? 'cursor-not-allowed bg-border-light text-text-aux'
                : 'gradient-primary-r active:opacity-80'
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
      }
    >
      <div className="p-4">
        <div className="space-y-4">
          <Card className="border border-border-light/50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-base text-text-sub">分区</span>
              <span className="text-xl font-bold text-primary-start">¥{formatZoneAmountLabel(selectedZone)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-base text-text-sub">数量</span>
              <Stepper value={quantity} onChange={handleQuantityChange} min={1} max={maxQuantity} />
            </div>
          </Card>

          {config ? (
            <Card className="border border-border-light/50 p-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center text-base text-text-sub">
                  <Zap size={14} className="mr-1 text-primary-start" /> 额外算力
                </span>
                <Stepper value={extraHashrate} onChange={setExtraHashrate} min={0} max={config.max_extra_hashrate} />
              </div>
            </Card>
          ) : null}

          <div className="rounded-xl bg-bg-base p-3">
            <div className="flex items-center justify-between">
              <span className="text-base text-text-sub">冻结金额</span>
              <span className="text-2xl font-bold text-primary-start">¥{formatCurrencyAmount(estimatedFreezeAmount)}</span>
            </div>
            {fundingPlan.useMixedPayment ? (
              <div className="mt-2 space-y-1.5 border-t border-border-light/50 pt-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-sub">专项金</span>
                  <span className="font-medium text-text-main">¥{formatCurrencyAmount(fundingPlan.balanceAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-sub">待激活确权金</span>
                  <span className="font-medium text-text-main">¥{formatCurrencyAmount(fundingPlan.pendingAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-sub">支付方式</span>
                  <span className="font-medium text-text-main">混合支付（{mixedPaymentRatioText}）</span>
                </div>
              </div>
            ) : null}
          </div>

          {previewData && previewData.total_power_used > 0 ? (
            <div className="flex items-center justify-between rounded-xl bg-bg-base p-3">
              <span className="flex items-center text-sm text-text-sub">
                <Zap size={14} className="mr-1 text-primary-start" /> 算力消耗
              </span>
              <span className="text-sm font-medium text-primary-start">{previewData.total_power_used}</span>
            </div>
          ) : null}

          {previewError ? (
            <div className="flex items-start rounded-xl border border-red-100 bg-red-50 p-3 dark:border-red-900/20 dark:bg-red-900/10">
              <AlertCircle size={16} className="mr-2 mt-0.5 shrink-0 text-primary-start" />
              <p className="text-sm leading-relaxed text-primary-start">{previewError}</p>
            </div>
          ) : null}

          {previewData?.mixed_payment?.notice ? (
            <div className="flex items-start rounded-xl border border-amber-100 bg-amber-50 p-3 dark:border-amber-900/20 dark:bg-amber-900/10">
              <AlertCircle size={16} className="mr-2 mt-0.5 shrink-0 text-amber-500" />
              <p className="text-sm leading-relaxed text-amber-600 dark:text-amber-400">{previewData.mixed_payment.notice}</p>
            </div>
          ) : null}

          {previewData?.mixed_payment?.enabled ? (
            <div className="flex items-center justify-between rounded-xl bg-bg-base p-3">
              <span className="text-sm text-text-sub">混合支付剩余次数</span>
              <span className={`text-sm font-medium ${previewData.mixed_payment.remaining_times <= 0 ? 'text-primary-start' : 'text-text-main'}`}>
                {previewData.mixed_payment.remaining_times}
              </span>
            </div>
          ) : null}

          {previewData?.message ? (
            <div className="rounded-xl border border-orange-100 bg-orange-50 p-3 dark:border-orange-900/20 dark:bg-orange-900/10">
              <p className="text-sm leading-relaxed text-orange-600 dark:text-orange-400">{previewData.message}</p>
            </div>
          ) : null}
        </div>
      </div>
    </BottomSheet>
  );
};
