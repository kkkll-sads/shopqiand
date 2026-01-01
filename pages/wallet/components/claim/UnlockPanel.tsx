import React from 'react';
import { AlertCircle, Check, Lock, ShoppingBag, Ticket, Users, X } from 'lucide-react';
import { UserInfo } from '../../../../types';
import { UnlockStatusState } from '../../hooks/useClaimUnlock';

interface UnlockPanelProps {
  userInfo: UserInfo | null;
  unlockStatus: UnlockStatusState;
  unlockLoading: boolean;
  onUnlock: () => void;
}

const UnlockPanel: React.FC<UnlockPanelProps> = ({ userInfo, unlockStatus, unlockLoading, onUnlock }) => {
  return (
    <div className="space-y-6 pt-4 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* 顶部余额卡片 - 优化渐变和质感 */}
      <div className="bg-gradient-to-br from-[#FF8C42] via-[#FF6B6B] to-[#FF4757] rounded-3xl p-6 text-white shadow-xl shadow-orange-200/50 relative overflow-hidden ring-1 ring-white/20">
        {/* 背景装饰 */}
        <div className="absolute top-0 right-0 p-8 opacity-[0.08] transform rotate-12 scale-150 pointer-events-none">
          <Lock size={140} />
        </div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-md">
              <Lock size={16} className="text-white" />
            </div>
            <span className="text-white/90 text-sm font-medium tracking-wide">待激活确权金余额</span>
          </div>

          <div className="text-4xl font-bold font-[DINAlternate-Bold] tracking-tight mb-6 text-white text-shadow-sm">
            ¥&nbsp;{unlockStatus.currentGold ? Number(unlockStatus.currentGold).toFixed(2) : '0.00'}
          </div>

          <div className="flex items-start gap-2.5 bg-black/10 px-4 py-3 rounded-xl border border-white/10 backdrop-blur-sm">
            <AlertCircle size={16} className="text-white/90 shrink-0 mt-0.5" />
            <span className="text-xs text-white/90 leading-relaxed font-light">
              完成下方任务即可解锁旧资产，解锁后确权金将转入可用余额。
            </span>
          </div>
        </div>
      </div>

      {/* 解锁条件检测 - 优化列表样式 */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100/80">
        <div className="flex items-center mb-5 pb-3 border-b border-gray-50">
          <div className="w-1.5 h-4 bg-gradient-to-b from-[#FF6B6B] to-[#FF4757] rounded-full mr-2.5"></div>
          <h3 className="text-gray-800 font-bold text-[15px]">解锁条件检测</h3>
          <span className="ml-auto text-[10px] text-gray-400 font-normal">需全部达成</span>
        </div>

        <div className="space-y-3">
          {/* 条件1：自身交易 */}
          <div className={`group flex items-center justify-between p-4 rounded-2xl transition-all border ${unlockStatus.hasSelfTrade
              ? 'bg-[#F0F9FF] border-blue-100/50'
              : 'bg-white border-gray-100 shadow-sm'
            }`}>
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${unlockStatus.hasSelfTrade
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-gray-100 text-gray-400'
                }`}>
                <ShoppingBag size={20} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col gap-0.5">
                <div className="text-gray-800 font-bold text-sm">自身完成交易</div>
                <div className="text-xs text-gray-500">
                  {unlockStatus.unlockConditions?.transaction_count ? (
                    <span className="text-blue-600 font-medium">已完成 {unlockStatus.unlockConditions.transaction_count} 笔</span>
                  ) : (
                    '需至少完成一笔任意交易'
                  )}
                </div>
              </div>
            </div>
            <div>
              {unlockStatus.isLoading ? (
                <div className="w-4 h-4 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
              ) : unlockStatus.hasSelfTrade ? (
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-md shadow-blue-200">
                  <Check size={14} className="text-white font-bold" />
                </div>
              ) : (
                <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-gray-400 text-xs font-bold">0/1</span>
                </div>
              )}
            </div>
          </div>

          {/* 条件2：直推用户 */}
          <div className={`group flex items-center justify-between p-4 rounded-2xl transition-all border ${unlockStatus.activeReferrals >= unlockStatus.referralTarget
              ? 'bg-[#F0FDF4] border-green-100/50'
              : 'bg-white border-gray-100 shadow-sm'
            }`}>
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${unlockStatus.activeReferrals >= unlockStatus.referralTarget
                  ? 'bg-green-100 text-green-600'
                  : 'bg-gray-100 text-gray-400'
                }`}>
                <Users size={20} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col gap-0.5">
                <div className="text-gray-800 font-bold text-sm">直推有效用户</div>
                <div className="text-xs text-gray-500">
                  <span className={unlockStatus.activeReferrals >= unlockStatus.referralTarget ? 'text-green-600 font-medium' : ''}>
                    {unlockStatus.activeReferrals}
                  </span>
                  <span className="mx-1">/</span>
                  <span>{unlockStatus.referralTarget} (需有交易记录)</span>
                </div>
              </div>
            </div>
            <div>
              {unlockStatus.isLoading ? (
                <div className="w-4 h-4 border-2 border-gray-200 border-t-green-500 rounded-full animate-spin"></div>
              ) : unlockStatus.activeReferrals >= unlockStatus.referralTarget ? (
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-md shadow-green-200">
                  <Check size={14} className="text-white font-bold" />
                </div>
              ) : (
                <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-md">
                  {unlockStatus.activeReferrals}/{unlockStatus.referralTarget}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 解锁权益 - 优化资产卡片 */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100/80">
        <div className="flex items-center mb-5 pb-3 border-b border-gray-50">
          <div className="w-1.5 h-4 bg-gradient-to-b from-[#FF6B6B] to-[#FF4757] rounded-full mr-2.5"></div>
          <h3 className="text-gray-800 font-bold text-[15px]">解锁将获得</h3>
        </div>

        <div className="flex items-center gap-3 mb-6">
          {/* 资产 1 */}
          <div className="flex-1 bg-gradient-to-br from-[#FFF8F0] to-[#FFFBF5] p-4 rounded-2xl border border-[#FFEDD5] flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-8 h-8 bg-[#FFEDD5] rounded-bl-2xl -mr-4 -mt-4 group-hover:bg-orange-200 transition-colors"></div>
            <div className="text-[#E65100] font-bold text-[15px] mb-1.5 tracking-tight group-hover:scale-105 transition-transform">权益资产包</div>
            <div className="text-[10px] font-medium text-[#9A3412] bg-[#FFEDD5] px-2 py-0.5 rounded-full">
              价值 ≈ ¥1000
            </div>
          </div>

          <div className="text-[#FFCCAA] font-light text-xl">+</div>

          {/* 资产 2 */}
          <div className="flex-1 bg-gradient-to-br from-[#FFF0F0] to-[#FFFAFA] p-4 rounded-2xl border border-[#FFDCDC] flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-8 h-8 bg-[#FFDCDC] rounded-bl-2xl -mr-4 -mt-4 group-hover:bg-red-200 transition-colors"></div>
            <div className="text-[#D32F2F] font-bold text-[15px] mb-1.5 tracking-tight group-hover:scale-105 transition-transform">寄售券 x1</div>
            <div className="text-[10px] font-medium text-[#B71C1C] bg-[#FFDCDC] px-2 py-0.5 rounded-full">
              解锁赠送
            </div>
          </div>
        </div>

        <div className="mb-6 bg-gray-50 rounded-xl p-3 border border-gray-100">
          <div className="flex justify-between items-center text-sm mb-2">
            <span className="text-gray-500 font-medium">本次消耗</span>
            <span className="font-bold text-[#FF4500] text-base font-[DINAlternate-Bold]">
              {unlockStatus.requiredGold || 1000}
              <span className="text-xs font-normal text-gray-500 ml-1">待激活确权金</span>
            </span>
          </div>

          {(unlockStatus.unlockedCount !== undefined || (unlockStatus.availableQuota !== undefined && unlockStatus.availableQuota > 0)) && (
            <div className="w-full h-[1px] bg-gray-200 my-2"></div>
          )}

          {unlockStatus.unlockedCount !== undefined && (
            <div className="flex justify-between items-center text-xs text-gray-400 pt-1">
              <span>已成功解锁</span>
              <span className="font-medium text-gray-800">{unlockStatus.unlockedCount} 次</span>
            </div>
          )}
          {unlockStatus.availableQuota !== undefined && unlockStatus.availableQuota > 0 && (
            <div className="flex justify-between items-center text-xs text-gray-400 pt-1">
              <span>剩余可解锁</span>
              <span className="font-bold text-orange-500">{unlockStatus.availableQuota} 次</span>
            </div>
          )}
        </div>

        {(!unlockStatus.canUnlock && (unlockStatus.availableQuota === 0 || unlockStatus.availableQuota === undefined) && unlockStatus.alreadyUnlocked) ? (
          <div className="w-full py-4 rounded-full text-base font-bold text-white bg-green-500/90 shadow-lg shadow-green-200 text-center flex items-center justify-center gap-2 cursor-default">
            <Check size={20} strokeWidth={3} />
            已全部解锁
          </div>
        ) : (
          <button
            onClick={onUnlock}
            disabled={unlockLoading || unlockStatus.isLoading || !unlockStatus.canUnlock}
            className={`w-full py-4 rounded-full text-base font-bold text-white shadow-xl transition-all active:scale-[0.98] relative overflow-hidden group
              ${(unlockLoading || unlockStatus.isLoading || !unlockStatus.canUnlock)
                ? 'bg-gray-200 text-gray-400 shadow-none cursor-not-allowed'
                : 'bg-gradient-to-r from-[#FF6B00] via-[#FF5E62] to-[#FF4500] shadow-orange-500/30 hover:shadow-orange-500/40'}`}
          >
            {/* Button Highlight Effect */}
            <div className="absolute top-0 left-0 w-full h-full bg-white/20 -translate-x-full group-hover:animate-[shimmer_1s_infinite] pointer-events-none"></div>

            {unlockLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>正在解锁...</span>
              </span>
            ) : unlockStatus.unlockedCount && unlockStatus.unlockedCount > 0 ? '再次解锁资产' : '立即解锁获得权益'}
          </button>
        )}

        {(!unlockStatus.canUnlock && !unlockStatus.isLoading && !unlockStatus.alreadyUnlocked) && (
          <div className="text-center mt-3 text-[10px] text-gray-400">
            请先完成所有解锁条件
          </div>
        )}
      </div>
    </div>
  );
};

export default UnlockPanel;

