import React from 'react';
import { ChevronRight } from 'lucide-react';
import { formatPriceSmart } from '@/utils/format';
import type { UserInfo } from '@/types';

interface ProfileBalanceCardProps {
  userInfo: UserInfo | null;
  onNavigate: (path: string) => void;
  maxPurchase?: number;
}

const ProfileBalanceCard: React.FC<ProfileBalanceCardProps> = ({ userInfo, onNavigate }) => {
  return (
    <div className="px-4 relative z-10">
      <div className="relative rounded-2xl shadow-xl overflow-hidden text-white font-sans">
        <div className="absolute inset-0 profile-balance-card-bg z-0">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-300 opacity-20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4"></div>
        </div>

        <div className="relative z-10 p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium profile-balance-text-soft">供应链专项金</span>
              <span className="profile-balance-chip text-[10px] px-2 py-0.5 rounded-full font-bold">采购本金</span>
            </div>
            <button
              onClick={() => onNavigate('/balance-recharge')}
              className="profile-balance-text-soft text-sm font-medium flex items-center gap-0.5 active:opacity-70"
            >
              去充值 <ChevronRight size={14} />
            </button>
          </div>

          <div
            className="mb-4 cursor-pointer active:opacity-70 transition-opacity"
            onClick={() => onNavigate('/asset-view?tab=0')}
          >
            <div className="flex items-baseline">
              <span className="text-2xl font-medium mr-0.5">¥</span>
              <span className="text-[32px] font-bold font-[DINAlternate-Bold,Roboto,sans-serif] tracking-tight leading-none">
                {formatPriceSmart(userInfo?.balance_available)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-1 pt-3 profile-balance-divider">
            <div
              className="text-center cursor-pointer active:opacity-70"
              onClick={() => onNavigate('/asset-view?tab=1')}
            >
              <div className="text-[10px] profile-balance-text-dim mb-1 whitespace-nowrap">可调度收益</div>
              <div className="text-sm font-bold font-[DINAlternate-Bold,Roboto,sans-serif] truncate">
                {formatPriceSmart(userInfo?.withdrawable_money)}
              </div>
            </div>

            <div
              className="text-center cursor-pointer active:opacity-70"
              onClick={() => onNavigate('/market')}
            >
              <div className="text-[10px] profile-balance-text-dim mb-1 whitespace-nowrap">消费金</div>
              <div className="text-sm font-bold font-[DINAlternate-Bold,Roboto,sans-serif] truncate">
                {formatPriceSmart(userInfo?.score)}
              </div>
            </div>

            <div
              className="text-center cursor-pointer active:opacity-70"
              onClick={() => onNavigate('/hashrate-exchange')}
            >
              <div className="text-[10px] profile-balance-text-dim mb-1 whitespace-nowrap">绿色算力</div>
              <div className="text-sm font-bold font-[DINAlternate-Bold,Roboto,sans-serif] truncate">
                {formatPriceSmart(userInfo?.green_power)}
              </div>
            </div>

            <div
              className="text-center cursor-pointer active:opacity-70"
              onClick={() => onNavigate('/asset-view?tab=3')}
            >
              <div className="text-[10px] profile-balance-text-dim mb-1 whitespace-nowrap">确权金</div>
              <div className="text-sm font-bold font-[DINAlternate-Bold,Roboto,sans-serif] truncate">
                {formatPriceSmart(userInfo?.service_fee_balance)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileBalanceCard;
