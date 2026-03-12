import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Clock3, Copy, Loader2, Store, Ticket, Wallet, X } from 'lucide-react';
import type { CollectionConsignmentCheckData, UserCollectionDetail } from '../../../api';

interface MyCollectionConsignmentModalProps {
  checkData: CollectionConsignmentCheckData | null;
  checkError: string | null;
  checkLoading: boolean;
  consignmentCouponCount: number;
  consignmentPrice: number;
  countdownSeconds: number | null;
  isOpen: boolean;
  isSubmitting: boolean;
  item: UserCollectionDetail;
  onClose: () => void;
  onCopy: (text: string, successMessage?: string) => void | Promise<void>;
  onOpenVoucherCenter: () => void;
  onRetry: () => void;
  onSubmit: () => void;
  serviceFeeBalance: string;
  submitError: string | null;
}

function formatCurrency(value: number | string | undefined): string {
  const amount = typeof value === 'string' ? Number(value) : value;
  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    return '0.00';
  }

  return amount.toFixed(2);
}

function formatCountdown(totalSeconds: number): string {
  const normalizedValue = Math.max(0, Math.floor(totalSeconds));
  const hours = String(Math.floor(normalizedValue / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((normalizedValue % 3600) / 60)).padStart(2, '0');
  const seconds = String(normalizedValue % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

export function MyCollectionConsignmentModal({
  checkData,
  checkError,
  checkLoading,
  consignmentCouponCount,
  consignmentPrice,
  countdownSeconds,
  isOpen,
  isSubmitting,
  item,
  onClose,
  onCopy,
  onOpenVoucherCenter,
  onRetry,
  onSubmit,
  serviceFeeBalance,
  submitError,
}: MyCollectionConsignmentModalProps) {
  const [isRendered, setIsRendered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
      return undefined;
    }

    setIsVisible(false);
    const timer = setTimeout(() => {
      setIsRendered(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [isOpen]);

  const isUnlocked =
    Boolean(checkData?.unlocked) || (typeof countdownSeconds === 'number' && countdownSeconds <= 0);
  const serviceFeeRate = checkData?.service_fee_rate && checkData.service_fee_rate > 0
    ? checkData.service_fee_rate
    : 0.03;
  const serviceFee = useMemo(
    () => Number((consignmentPrice * serviceFeeRate).toFixed(2)),
    [consignmentPrice, serviceFeeRate],
  );
  const serviceFeeBalanceValue = Number(serviceFeeBalance);
  const hasServiceFeeWarning =
    Number.isFinite(serviceFeeBalanceValue) && serviceFeeBalanceValue < serviceFee;
  const countdownText =
    typeof countdownSeconds === 'number'
      ? formatCountdown(countdownSeconds)
      : checkData?.remaining_text || '--';
  const canSubmit =
    !checkLoading && !isSubmitting && Boolean(checkData) && isUnlocked && consignmentCouponCount > 0;

  if (!isRendered) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[90] flex flex-col justify-end">
      <button
        type="button"
        aria-label="关闭寄售弹层"
        className={`absolute inset-0 bg-black/55 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      <div
        className={`relative mx-auto w-full max-w-[430px] px-3 pb-safe transition-transform duration-300 ease-out ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="overflow-hidden rounded-[28px] bg-[#F7F4EE] shadow-2xl">
          <div className="border-b border-[#e8dfd2] bg-white/90 px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="text-base font-bold text-gray-900">资产寄售委托</div>
              <button
                type="button"
                className="rounded-full p-1 text-gray-400 transition-colors active:bg-gray-100 active:text-gray-700"
                onClick={onClose}
                aria-label="关闭"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="max-h-[78vh] space-y-4 overflow-y-auto px-4 py-4">
            <div className="rounded-[22px] border border-[#eadfce] bg-white p-4 shadow-[0_10px_24px_rgba(56,40,20,0.06)]">
              <div className="flex gap-3">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[18px] bg-[#f4efe7]">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[#9c8468]">
                      <Store size={20} />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="line-clamp-2 text-sm font-semibold leading-6 text-gray-900">
                    {item.title || '未命名藏品'}
                  </div>
                  <button
                    type="button"
                    onClick={() => void onCopy(item.asset_code, '确权编号已复制')}
                    className="mt-2 inline-flex max-w-full items-center gap-1 rounded-full border border-[#eadfce] bg-[#fcf8f1] px-2.5 py-1 text-[11px] text-[#8c6136]"
                  >
                    <span className="truncate">确权编号 {item.asset_code || '--'}</span>
                    <Copy size={11} />
                  </button>
                  {checkData?.is_old_asset_package ? (
                    <div className="mt-2">
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-medium text-amber-700">
                        老资产
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div
              className={`rounded-[22px] border px-4 py-3 ${
                isUnlocked
                  ? 'border-emerald-200 bg-emerald-50'
                  : 'border-amber-200 bg-amber-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 rounded-full p-2 ${
                    isUnlocked ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {checkLoading ? <Loader2 size={16} className="animate-spin" /> : <Clock3 size={16} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className={`text-sm font-semibold ${isUnlocked ? 'text-emerald-700' : 'text-amber-800'}`}>
                    {checkLoading ? '寄售资格校验中' : isUnlocked ? '已满足寄售条件' : 'T+1 解锁倒计时'}
                  </div>
                  <div className={`mt-1 text-xs leading-5 ${isUnlocked ? 'text-emerald-700/80' : 'text-amber-700/90'}`}>
                    {checkLoading
                      ? '正在获取该藏品当前寄售状态，请稍候。'
                      : isUnlocked
                        ? '当前资产可以提交寄售申请，提交后会进入寄售流程。'
                        : `剩余 ${countdownText} 后可提交寄售申请。`}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[22px] border border-[#eadfce] bg-white p-4 shadow-[0_10px_24px_rgba(56,40,20,0.06)]">
              <div className="mb-3 text-sm font-bold text-gray-800">挂牌成本核算</div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-500">预估寄售价</span>
                  <span className="font-semibold text-gray-900">¥{formatCurrency(consignmentPrice)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-500">确权技术服务费</span>
                  <span className="font-semibold text-gray-900">
                    ¥{formatCurrency(serviceFee)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1 text-gray-500">
                    <Wallet size={14} />
                    服务费余额
                  </span>
                  <span className={`font-semibold ${hasServiceFeeWarning ? 'text-amber-700' : 'text-gray-900'}`}>
                    ¥{formatCurrency(serviceFeeBalance)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1 text-gray-500">
                    <Ticket size={14} />
                    可用寄售券
                  </span>
                  <span className={`font-semibold ${consignmentCouponCount > 0 ? 'text-gray-900' : 'text-amber-700'}`}>
                    {consignmentCouponCount} 张
                  </span>
                </div>
              </div>
            </div>

            {hasServiceFeeWarning ? (
              <div className="rounded-[20px] border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-700">
                当前服务费余额小于本次寄售所需费用，提交前请先确认账户余额是否充足。
              </div>
            ) : null}

            {checkError ? (
              <div className="rounded-[20px] border border-red-200 bg-red-50 px-4 py-3">
                <div className="flex items-start gap-2 text-sm text-red-600">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                  <span className="flex-1">{checkError}</span>
                </div>
                <button
                  type="button"
                  onClick={onRetry}
                  className="mt-3 rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 active:bg-red-100"
                >
                  重新校验
                </button>
              </div>
            ) : null}

            {submitError ? (
              <div className="rounded-[20px] border border-red-200 bg-red-50 px-4 py-3 text-xs leading-5 text-red-600">
                {submitError}
              </div>
            ) : null}

            {consignmentCouponCount <= 0 ? (
              <div className="rounded-[22px] border border-[#eadfce] bg-white p-4">
                <div className="text-sm font-semibold text-gray-900">寄售券不足</div>
                <div className="mt-1 text-xs leading-5 text-gray-500">
                  当前账户没有可用寄售券，暂时无法提交寄售申请。
                </div>
                <button
                  type="button"
                  onClick={onOpenVoucherCenter}
                  className="mt-3 rounded-full border border-[#d6c5ad] bg-[#fcf7ef] px-3 py-1.5 text-xs font-medium text-[#8c6136] active:bg-[#f6eee2]"
                >
                  去寄售券中心
                </button>
              </div>
            ) : null}

            <button
              type="button"
              onClick={onSubmit}
              disabled={!canSubmit}
              className={`flex h-12 w-full items-center justify-center gap-2 rounded-[16px] text-sm font-bold transition ${
                canSubmit
                  ? 'bg-gradient-to-r from-[#8B0000] to-[#A00000] text-amber-50 shadow-lg shadow-red-900/15 active:scale-[0.98]'
                  : 'bg-gray-200 text-gray-400'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>提交中...</span>
                </>
              ) : (
                <span>
                  {checkLoading
                    ? '校验中...'
                    : !isUnlocked
                      ? '暂未解锁寄售'
                      : consignmentCouponCount <= 0
                        ? '寄售券不足'
                        : '确认挂牌'}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
