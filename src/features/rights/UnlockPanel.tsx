import React from 'react';
import { AlertCircle, Check, Gift, Lock, ShoppingBag, Ticket, Users } from 'lucide-react';
import type { UnlockStatusState } from './types';

interface UnlockPanelProps {
  unlockStatus: UnlockStatusState;
  unlockLoading: boolean;
  onUnlock: () => void;
}

export const UnlockPanel: React.FC<UnlockPanelProps> = ({
  unlockStatus,
  unlockLoading,
  onUnlock,
}) => {
  const currentGoldText =
    unlockStatus.currentGold != null
      ? `¥ ${Number(unlockStatus.currentGold).toFixed(2)}`
      : '--';
  const transactionCount = unlockStatus.unlockConditions?.transaction_count;
  const requiredTransactions = unlockStatus.requiredTransactions;
  const activeReferrals = unlockStatus.activeReferrals;
  const requiredReferrals =
    unlockStatus.requiredReferrals ?? unlockStatus.referralTarget;
  const referralCompleted =
    activeReferrals != null &&
    requiredReferrals != null &&
    activeReferrals >= requiredReferrals;
  const transactionProgressText =
    transactionCount != null && requiredTransactions != null
      ? `${transactionCount}/${requiredTransactions}`
      : transactionCount != null
        ? `${transactionCount}/--`
        : requiredTransactions != null
          ? `0/${requiredTransactions}`
          : '--';
  const referralProgressText =
    activeReferrals != null && requiredReferrals != null
      ? `${activeReferrals}/${requiredReferrals}`
      : activeReferrals != null
        ? `${activeReferrals}/--`
        : requiredReferrals != null
          ? `0/${requiredReferrals}`
          : '--';
  const rewardValueText =
    unlockStatus.rewardValue != null ? `¥${unlockStatus.rewardValue}` : '--';
  const requiredGoldText =
    unlockStatus.requiredGold != null ? unlockStatus.requiredGold : '--';

  return (
    <div className="space-y-6 pt-4">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#FF8C42] via-[#FF6B6B] to-[#FF4757] p-6 text-white shadow-xl shadow-orange-200/50 ring-1 ring-white/20 dark:shadow-orange-900/20">
        <div className="pointer-events-none absolute top-0 right-0 scale-150 rotate-12 p-8 opacity-[0.08]">
          <Lock size={140} />
        </div>
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />

        <div className="relative z-10">
          <div className="mb-2 flex items-center gap-2">
            <div className="rounded-lg bg-white/20 p-1.5 backdrop-blur-md">
              <Lock size={16} className="text-white" />
            </div>
            <span className="text-sm font-medium tracking-wide text-white/90">
              待激活确权金余额
            </span>
          </div>

          <div className="mb-6 text-4xl font-bold tracking-tight text-white text-shadow-sm">
            {currentGoldText}
          </div>

          <div className="flex items-start gap-2.5 rounded-xl border border-white/10 bg-black/10 px-4 py-3 backdrop-blur-sm">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-white/90" />
            <span className="text-xs font-light leading-relaxed text-white/90">
              完成下方任务后即可解锁老资产，未返回的门槛以接口最新结果为准。
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-gray-100/80 bg-white p-5 shadow-sm dark:border-border-light dark:bg-bg-card">
        <div className="mb-5 flex items-center border-b border-gray-50 pb-3 dark:border-border-light">
          <div className="mr-2.5 h-4 w-1.5 rounded-full bg-gradient-to-b from-[#FF6B6B] to-[#FF4757]" />
          <h3 className="text-[15px] font-bold text-gray-800 dark:text-text-main">
            解锁条件检测
          </h3>
          <span className="ml-auto text-[10px] font-normal text-gray-400 dark:text-text-sub">
            需全部达成
          </span>
        </div>

        <div className="space-y-3">
          <div
            className={`group flex items-center justify-between rounded-2xl border p-4 transition-all ${
              unlockStatus.hasSelfTrade
                ? 'border-blue-100/50 bg-[#F0F9FF] dark:border-blue-500/20 dark:bg-blue-500/10'
                : 'border-gray-100 bg-white shadow-sm dark:border-border-light dark:bg-bg-base'
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                  unlockStatus.hasSelfTrade
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
                    : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-text-sub'
                }`}
              >
                <ShoppingBag size={20} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col gap-0.5">
                <div className="text-sm font-bold text-gray-800 dark:text-text-main">
                  自身完成交易
                </div>
                <div className="text-xs text-gray-500 dark:text-text-sub">
                  {transactionCount != null ? (
                    <span className="font-medium text-blue-600 dark:text-blue-400">
                      已完成 {transactionCount} 笔
                    </span>
                  ) : requiredTransactions != null ? (
                    `需至少完成 ${requiredTransactions} 笔任意交易`
                  ) : (
                    '等待接口返回解锁条件'
                  )}
                </div>
              </div>
            </div>
            <div>
              {unlockStatus.isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-blue-500 dark:border-gray-700" />
              ) : unlockStatus.hasSelfTrade ? (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 shadow-md shadow-blue-200 dark:shadow-blue-900/30">
                  <Check size={14} className="text-white" />
                </div>
              ) : (
                <div className="flex h-6 min-w-10 items-center justify-center rounded-full bg-gray-100 px-2 dark:bg-gray-800">
                  <span className="text-xs font-bold text-gray-400 dark:text-text-sub">
                    {transactionProgressText}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div
            className={`group flex items-center justify-between rounded-2xl border p-4 transition-all ${
              referralCompleted
                ? 'border-green-100/50 bg-[#F0FDF4] dark:border-green-500/20 dark:bg-green-500/10'
                : 'border-gray-100 bg-white shadow-sm dark:border-border-light dark:bg-bg-base'
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                  referralCompleted
                    ? 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400'
                    : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-text-sub'
                }`}
              >
                <Users size={20} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col gap-0.5">
                <div className="text-sm font-bold text-gray-800 dark:text-text-main">
                  直推有效用户
                </div>
                <div className="text-xs text-gray-500 dark:text-text-sub">
                  {requiredReferrals != null ? (
                    <>
                      <span
                        className={referralCompleted ? 'font-medium text-green-600 dark:text-green-400' : ''}
                      >
                        {activeReferrals ?? 0}
                      </span>
                      <span className="mx-1">/</span>
                      <span>{requiredReferrals}（需有交易记录）</span>
                    </>
                  ) : (
                    '等待接口返回解锁条件'
                  )}
                </div>
              </div>
            </div>
            <div>
              {unlockStatus.isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-green-500 dark:border-gray-700" />
              ) : referralCompleted ? (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 shadow-md shadow-green-200 dark:shadow-green-900/30">
                  <Check size={14} className="text-white" />
                </div>
              ) : (
                <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-bold text-gray-400 dark:bg-gray-800 dark:text-text-sub">
                  {referralProgressText}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-gray-100/80 bg-white p-5 shadow-sm dark:border-border-light dark:bg-bg-card">
        <div className="mb-5 flex items-center border-b border-gray-50 pb-3 dark:border-border-light">
          <div className="mr-2.5 h-4 w-1.5 rounded-full bg-gradient-to-b from-[#FF6B6B] to-[#FF4757]" />
          <h3 className="text-[15px] font-bold text-gray-800 dark:text-text-main">
            解锁后将获得
          </h3>
        </div>

        <div className="mb-6 flex items-center gap-3">
          <div className="group relative flex flex-1 flex-col items-center justify-center overflow-hidden rounded-2xl border border-[#FFEDD5] bg-gradient-to-br from-[#FFF8F0] to-[#FFFBF5] p-4 text-center shadow-sm dark:border-orange-500/20 dark:from-orange-500/5 dark:to-orange-500/10">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-8 w-8 rounded-bl-2xl bg-[#FFEDD5] transition-colors group-hover:bg-orange-200 dark:bg-orange-500/20 dark:group-hover:bg-orange-500/30" />
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFEDD5] text-[#E65100] dark:bg-orange-500/20 dark:text-orange-400">
              <Gift size={22} strokeWidth={2} />
            </div>
            <div className="mb-1.5 text-[15px] font-bold tracking-tight text-[#E65100] transition-transform group-hover:scale-105 dark:text-orange-400">
              权益资产包
            </div>
            <div className="rounded-full bg-[#FFEDD5] px-2 py-0.5 text-[10px] font-medium text-[#9A3412] dark:bg-orange-500/20 dark:text-orange-400/80">
              价值 ≈ {rewardValueText}
            </div>
          </div>

          <div className="text-xl font-light text-[#FFCCAA] dark:text-orange-400/60">+</div>

          <div className="group relative flex flex-1 flex-col items-center justify-center overflow-hidden rounded-2xl border border-[#FFDCDC] bg-gradient-to-br from-[#FFF0F0] to-[#FFFAFA] p-4 text-center shadow-sm dark:border-red-500/20 dark:from-red-500/5 dark:to-red-500/10">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-8 w-8 rounded-bl-2xl bg-[#FFDCDC] transition-colors group-hover:bg-red-200 dark:bg-red-500/20 dark:group-hover:bg-red-500/30" />
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFDCDC] text-[#D32F2F] dark:bg-red-500/20 dark:text-red-400">
              <Ticket size={22} strokeWidth={2} />
            </div>
            <div className="mb-1.5 text-[15px] font-bold tracking-tight text-[#D32F2F] transition-transform group-hover:scale-105 dark:text-red-400">
              寄售券 x1
            </div>
            <div className="rounded-full bg-[#FFDCDC] px-2 py-0.5 text-[10px] font-medium text-[#B71C1C] dark:bg-red-500/20 dark:text-red-400/80">
              解锁赠送
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-gray-100 bg-gray-50 p-3 dark:border-border-light dark:bg-bg-base">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-gray-500 dark:text-text-sub">
              本次消耗
            </span>
            <span className="font-[DINAlternate-Bold] text-base font-bold text-[#FF4500] dark:text-primary-start">
              {requiredGoldText}
              <span className="ml-1 text-xs font-normal text-gray-500 dark:text-text-sub">
                待激活确权金
              </span>
            </span>
          </div>

          {(unlockStatus.unlockedCount !== undefined ||
            (unlockStatus.availableQuota !== undefined &&
              unlockStatus.availableQuota > 0)) && (
            <div className="my-2 h-[1px] w-full bg-gray-200 dark:bg-border-light" />
          )}

          {unlockStatus.unlockedCount !== undefined && (
            <div className="flex items-center justify-between pt-1 text-xs text-gray-400 dark:text-text-sub">
              <span>已成功解锁</span>
              <span className="font-medium text-gray-800 dark:text-text-main">
                {unlockStatus.unlockedCount} 次
              </span>
            </div>
          )}

          {unlockStatus.availableQuota !== undefined &&
            unlockStatus.availableQuota > 0 && (
              <div className="flex items-center justify-between pt-1 text-xs text-gray-400 dark:text-text-sub">
                <span>剩余可解锁</span>
                <span className="font-bold text-orange-500 dark:text-primary-start">
                  {unlockStatus.availableQuota} 次
                </span>
              </div>
            )}
        </div>

        {!unlockStatus.canUnlock &&
        (unlockStatus.availableQuota === 0 ||
          unlockStatus.availableQuota === undefined) &&
        unlockStatus.alreadyUnlocked ? (
          <div className="flex cursor-default items-center justify-center gap-2 rounded-full bg-green-500/90 py-4 text-center text-base font-bold text-white shadow-lg shadow-green-200 dark:shadow-green-900/30">
            <Check size={20} strokeWidth={3} />
            已全部解锁
          </div>
        ) : (
          <button
            onClick={onUnlock}
            disabled={
              unlockLoading ||
              unlockStatus.isLoading ||
              !unlockStatus.canUnlock
            }
            className={`group relative w-full overflow-hidden rounded-full py-4 text-base font-bold text-white shadow-xl transition-all active:scale-[0.98] ${
              unlockLoading ||
              unlockStatus.isLoading ||
              !unlockStatus.canUnlock
                ? 'cursor-not-allowed bg-gray-200 text-gray-400 shadow-none dark:bg-gray-700 dark:text-text-sub'
                : 'bg-gradient-to-r from-[#FF6B00] via-[#FF5E62] to-[#FF4500] shadow-orange-500/30 hover:shadow-orange-500/40'
            }`}
          >
            <div className="pointer-events-none absolute top-0 left-0 h-full w-full -translate-x-full bg-white/20 group-hover:animate-[shimmer_1s_infinite]" />

            {unlockLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                <span>正在解锁...</span>
              </span>
            ) : unlockStatus.unlockedCount && unlockStatus.unlockedCount > 0 ? (
              '再次解锁资产'
            ) : (
              '立即解锁获得权益'
            )}
          </button>
        )}

        {!unlockStatus.canUnlock &&
          !unlockStatus.isLoading &&
          !unlockStatus.alreadyUnlocked && (
            <div className="mt-3 text-center text-[10px] text-gray-400 dark:text-text-sub">
              请先完成所有解锁条件
            </div>
          )}
      </div>
    </div>
  );
};
