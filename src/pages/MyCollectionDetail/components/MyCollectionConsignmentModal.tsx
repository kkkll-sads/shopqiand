import { useEffect, useState } from 'react';
import { AlertTriangle, ChevronRight, Clock3, Copy, CreditCard, Loader2, Store, Ticket, Wallet, X } from 'lucide-react';
import type { CollectionConsignmentCheckData, ConsignmentEquityCard } from '../../../api';
import type { UserCollectionDetail } from '../../../api/modules/userCollection';

interface MyCollectionConsignmentModalProps {
  availableConsignmentCouponCount: number;
  availableEquityCards: ConsignmentEquityCard[];
  checkData: CollectionConsignmentCheckData | null;
  checkError: string | null;
  checkLoading: boolean;
  consignmentPrice: number;
  countdownSeconds: number | null;
  freeResendDescription?: string;
  isOpen: boolean;
  isFreeResend?: boolean;
  isSubmitting: boolean;
  item: UserCollectionDetail;
  membershipDeduction: number;
  onClose: () => void;
  onCopy: (text: string, successMessage?: string) => void | Promise<void>;
  onOpenCardSelect: () => void;
  onOpenVoucherCenter: () => void;
  onRetry: () => void;
  onSubmit: () => void;
  originalServiceFee: number;
  requiredConsignmentCouponCount: number;
  selectedEquityCardId: number | null;
  serviceFee: number;
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
  availableConsignmentCouponCount,
  availableEquityCards,
  checkData,
  checkError,
  checkLoading,
  consignmentPrice,
  countdownSeconds,
  freeResendDescription,
  isOpen,
  isFreeResend = false,
  isSubmitting,
  item,
  membershipDeduction,
  onClose,
  onCopy,
  onOpenCardSelect,
  onOpenVoucherCenter,
  onRetry,
  onSubmit,
  originalServiceFee,
  requiredConsignmentCouponCount,
  selectedEquityCardId,
  serviceFee,
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
  const serviceFeeBalanceValue = Number(serviceFeeBalance);
  const hasServiceFeeWarning =
    !isFreeResend && Number.isFinite(serviceFeeBalanceValue) && serviceFeeBalanceValue < serviceFee;
  const hasCouponShortage =
    !isFreeResend && availableConsignmentCouponCount < requiredConsignmentCouponCount;
  const countdownText =
    typeof countdownSeconds === 'number'
      ? formatCountdown(countdownSeconds)
      : checkData?.remaining_text || '--';
  const statusDescription = checkLoading
    ? '正在获取该藏品当前寄售状态，请稍候。'
    : checkData?.message?.trim()
      ? checkData.message.trim()
      : isUnlocked
        ? '当前资产可以提交寄售申请，提交后会进入寄售流程。'
        : `剩余 ${countdownText} 后可提交寄售申请。`;
  const canSubmit =
    !checkLoading
    && !isSubmitting
    && Boolean(checkData)
    && isUnlocked
    && !hasServiceFeeWarning
    && !hasCouponShortage;

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
                        老资产包
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
                    {statusDescription}
                  </div>
                </div>
              </div>
            </div>

            {isFreeResend ? (
              <div className="rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-emerald-100 p-2 text-emerald-700">
                    <Ticket size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-emerald-800">流拍免费重发</div>
                    <div className="mt-1 text-xs leading-5 text-emerald-700/90">
                      {freeResendDescription || '本次寄售不消耗寄售券，也不收取服务费。'}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="rounded-[22px] border border-[#eadfce] bg-white p-4 shadow-[0_10px_24px_rgba(56,40,20,0.06)]">
              <div className="mb-3 text-sm font-bold text-gray-800">挂牌成本核算</div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-500">预计寄售价</span>
                  <span className="font-semibold text-gray-900">¥{formatCurrency(consignmentPrice)}</span>
                </div>
                {!isFreeResend && originalServiceFee > 0 ? (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-gray-500">原始手续费</span>
                    <span className="font-semibold text-gray-900">¥{formatCurrency(originalServiceFee)}</span>
                  </div>
                ) : null}
                {!isFreeResend && availableEquityCards.length > 0 ? (
                  <button
                    type="button"
                    onClick={onOpenCardSelect}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-[#eadfce] bg-[#fcf8f1] px-3 py-2.5 text-left transition-colors active:bg-[#f6eee2]"
                  >
                    <span className="inline-flex items-center gap-1.5 text-sm text-gray-600">
                      <CreditCard size={15} className="text-[#8c6136]" />
                      权益卡
                    </span>
                    <span className="inline-flex items-center gap-1 text-sm">
                      {selectedEquityCardId ? (
                        <span className="font-semibold text-emerald-600">
                          已选择 · 抵扣 ¥{formatCurrency(membershipDeduction)}
                        </span>
                      ) : (
                        <span className="text-[#8c6136]">选择权益卡</span>
                      )}
                      <ChevronRight size={14} className="text-gray-400" />
                    </span>
                  </button>
                ) : null}
                {!isFreeResend && membershipDeduction > 0 ? (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-gray-500">权益卡抵扣</span>
                    <span className="font-semibold text-emerald-600">-¥{formatCurrency(membershipDeduction)}</span>
                  </div>
                ) : null}
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-500">本次所需确权金</span>
                  <span className={`font-semibold ${isFreeResend ? 'text-emerald-700' : 'text-gray-900'}`}>
                    {isFreeResend ? '已豁免' : `¥${formatCurrency(serviceFee)}`}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1 text-gray-500">
                    <Wallet size={14} />
                    确权金余额
                  </span>
                  <span className={`font-semibold ${hasServiceFeeWarning ? 'text-amber-700' : 'text-gray-900'}`}>
                    ¥{formatCurrency(serviceFeeBalance)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1 text-gray-500">
                    <Ticket size={14} />
                    本次需用寄售券
                  </span>
                  <span className={`font-semibold ${isFreeResend ? 'text-emerald-700' : 'text-gray-900'}`}>
                    {isFreeResend ? '已豁免' : `${requiredConsignmentCouponCount} 张`}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1 text-gray-500">
                    <Ticket size={14} />
                    可用寄售券
                  </span>
                  <span
                    className={`font-semibold ${
                      isFreeResend
                        ? 'text-emerald-700'
                        : hasCouponShortage
                          ? 'text-amber-700'
                          : 'text-gray-900'
                    }`}
                  >
                    {isFreeResend ? '本次不消耗' : `${availableConsignmentCouponCount} 张`}
                  </span>
                </div>
              </div>
            </div>

            {hasServiceFeeWarning ? (
              <div className="rounded-[20px] border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-700">
                当前确权金余额不足，本次寄售需要 ¥{formatCurrency(serviceFee)}，当前余额 ¥{formatCurrency(serviceFeeBalance)}。
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

            {hasCouponShortage ? (
              <div className="rounded-[22px] border border-[#eadfce] bg-white p-4">
                <div className="text-sm font-semibold text-gray-900">寄售券不足</div>
                <div className="mt-1 text-xs leading-5 text-gray-500">
                  当前账户可用寄售券不足，本次寄售需要 {requiredConsignmentCouponCount} 张，当前可用 {availableConsignmentCouponCount} 张。
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
              aria-busy={isSubmitting}
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
                      : hasServiceFeeWarning
                        ? '确权金不足'
                        : hasCouponShortage
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
