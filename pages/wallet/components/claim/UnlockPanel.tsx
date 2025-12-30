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
      <div className="bg-gradient-to-br from-[#FF9966] to-[#FF5E62] rounded-2xl p-6 text-white shadow-lg shadow-orange-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Lock size={100} />
        </div>
        <div className="relative z-10">
          <div className="text-white/80 text-sm font-medium mb-1">待激活确权金余额</div>
          <div className="text-3xl font-bold font-mono tracking-wider">
            ¥{unlockStatus.currentGold ? Number(unlockStatus.currentGold).toFixed(2) : '0.00'}
          </div>
          <div className="mt-4 flex items-center gap-2 text-white/90 text-xs bg-white/20 px-3 py-1.5 rounded-full w-fit backdrop-blur-sm">
            <AlertCircle size={12} />
            <span>完成任务即可解锁旧资产</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#FFE4C4]/60">
        <div className="flex items-center mb-4 border-b border-gray-100 pb-3">
          <div className="w-1 h-4 bg-[#FF4500] rounded-full mr-2"></div>
          <h3 className="text-[#333333] font-bold text-base">解锁条件检测</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${unlockStatus.hasSelfTrade ? 'bg-[#DEF7EC] text-[#03543F]' : 'bg-[#FDE8E8] text-[#9B1C1C]'}`}>
                <ShoppingBag size={18} />
              </div>
              <div>
                <div className="text-[#333] font-medium text-sm">自身完成交易</div>
                <div className="text-xs text-gray-500">
                  已完成 {unlockStatus.unlockConditions?.transaction_count || 0} 笔交易
                  {unlockStatus.unlockConditions?.transaction_count === 0 && '，需至少完成一笔买入或卖出'}
                </div>
              </div>
            </div>
            <div>
              {unlockStatus.isLoading ? (
                <span className="text-gray-400 text-xs">检测中...</span>
              ) : unlockStatus.hasSelfTrade ? (
                <Check size={20} className="text-[#03543F]" />
              ) : (
                <X size={20} className="text-[#9B1C1C]" />
              )}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${unlockStatus.activeReferrals >= unlockStatus.referralTarget ? 'bg-[#DEF7EC] text-[#03543F]' : 'bg-[#FFF8F0] text-[#8B4513]'}`}>
                <Users size={18} />
              </div>
              <div>
                <div className="text-[#333] font-medium text-sm">直推有效用户</div>
                <div className="text-xs text-gray-500">
                  直推用户总数: {unlockStatus.unlockConditions?.direct_referrals_count || 0}，
                  有交易记录: {unlockStatus.unlockConditions?.qualified_referrals || 0}
                  {unlockStatus.unlockConditions &&
                    unlockStatus.unlockConditions.qualified_referrals < unlockStatus.referralTarget &&
                    `，需 ${unlockStatus.referralTarget} 个`}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end">
              {unlockStatus.isLoading ? (
                <span className="text-gray-400 text-xs">检测中...</span>
              ) : (
                <>
                  <span className={`text-sm font-bold ${unlockStatus.activeReferrals >= unlockStatus.referralTarget ? 'text-[#03543F]' : 'text-[#FF4500]'}`}>
                    {unlockStatus.activeReferrals}/{unlockStatus.referralTarget}
                  </span>
                  {unlockStatus.activeReferrals >= unlockStatus.referralTarget && <Check size={14} className="text-[#03543F] mt-1" />}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#FFE4C4]/60">
        <div className="flex items-center mb-4 border-b border-gray-100 pb-3">
          <div className="w-1 h-4 bg-[#FF4500] rounded-full mr-2"></div>
          <h3 className="text-[#333333] font-bold text-base">解锁权益</h3>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 bg-[#FFF8F0] p-3 rounded-xl border border-[#FFE4C4] flex flex-col items-center justify-center text-center">
            <div className="text-[#FF4500] font-bold text-lg mb-1">权益资产包</div>
            <div className="text-xs text-[#8B4513]">价值 ¥1000</div>
          </div>
          <div className="text-[#D48E58]">+</div>
          <div className="flex-1 bg-[#FFF8F0] p-3 rounded-xl border border-[#FFE4C4] flex flex-col items-center justify-center text-center">
            <div className="text-[#FF4500] font-bold text-lg mb-1">寄售券 x1</div>
            <div className="text-xs text-[#8B4513]">解锁赠送</div>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-center text-sm mb-2">
            <span className="text-gray-600">解锁消耗</span>
            <span className="font-bold text-[#FF4500]">{unlockStatus.requiredGold || 1000} 确权金</span>
          </div>
          {unlockStatus.unlockedCount !== undefined && (
            <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
              <span>已解锁次数</span>
              <span className="font-medium text-gray-900">{unlockStatus.unlockedCount} 次</span>
            </div>
          )}
          {unlockStatus.availableQuota !== undefined && unlockStatus.availableQuota > 0 && (
            <div className="flex justify-between items-center text-xs text-orange-500 mb-1">
              <span>可解锁名额</span>
              <span className="font-bold">{unlockStatus.availableQuota} 次</span>
            </div>
          )}
          <div className="text-[10px] text-center text-gray-400 mt-2">点击解锁后系统将自动扣除余额并发放权益</div>
        </div>

        {(!unlockStatus.canUnlock && (unlockStatus.availableQuota === 0 || unlockStatus.availableQuota === undefined) && unlockStatus.alreadyUnlocked) ? (
          <div className="w-full py-3.5 rounded-full text-lg font-bold text-white bg-green-500 shadow-lg text-center">
            已解锁 ✓
          </div>
        ) : (
          <button
            onClick={onUnlock}
            disabled={unlockLoading || unlockStatus.isLoading || !unlockStatus.canUnlock}
            className={`w-full py-3.5 rounded-full text-lg font-bold text-white shadow-lg transition-all active:scale-[0.98]
              ${(unlockLoading || unlockStatus.isLoading || !unlockStatus.canUnlock)
                ? 'bg-gray-300 shadow-none cursor-not-allowed'
                : 'bg-gradient-to-r from-[#FF6B00] to-[#FF4500] shadow-orange-200'}`}
          >
            {unlockLoading ? (
              <span className="flex items-center justify-center gap-2">
                解锁中 <span className="animate-spin">◌</span>
              </span>
            ) : unlockStatus.unlockedCount && unlockStatus.unlockedCount > 0 ? '再次解锁资产' : '立即解锁'}
          </button>
        )}
      </div>
    </div>
  );
};

export default UnlockPanel;

