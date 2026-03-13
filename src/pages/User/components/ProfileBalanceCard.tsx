import React from 'react';
import { ChevronRight } from 'lucide-react';
import type { AccountProfileUserInfo } from '../../../api/modules/account';

function formatPriceSmart(value: number | string | undefined | null) {
  const nextValue = typeof value === 'string' ? Number(value) : value;
  if (typeof nextValue !== 'number' || !Number.isFinite(nextValue)) {
    return '0.00';
  }

  return nextValue.toLocaleString('zh-CN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    useGrouping: false,
  });
}

interface ProfileBalanceCardProps {
  userInfo: AccountProfileUserInfo | undefined;
  onNavigate: (path: string) => void;
}

const ProfileBalanceCard: React.FC<ProfileBalanceCardProps> = ({ userInfo, onNavigate }) => {
  return (
    <div className="relative z-10 px-4 transition-transform">
      <div className="profile-balance-card-bg relative overflow-hidden rounded-2xl font-sans text-white shadow-xl">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="balance-card-glow-light absolute top-0 right-0 h-48 w-48 -translate-y-1/2 translate-x-1/2 rounded-full" />
          <div className="balance-card-glow-warm absolute bottom-0 left-0 h-40 w-40 -translate-x-1/4 translate-y-1/4 rounded-full" />
        </div>

        <div className="relative z-10 p-4">
          <div className="mb-3 flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-red-50">供应链专项金</span>
              <span className="rounded-full border border-white/30 bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                采购本金
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('/recharge')}
              className="flex items-center gap-0.5 text-sm font-medium text-red-50 transition-opacity active:opacity-70"
            >
              去充值
              <ChevronRight size={14} />
            </button>
          </div>

          <div
            className="mb-4 cursor-pointer transition-opacity active:opacity-70"
            onClick={() => onNavigate('/recharge')}
          >
            <div className="flex items-baseline overflow-hidden">
              <span className="mr-1 text-2xl font-medium tracking-tight">¥</span>
              <span className="truncate font-mono text-[32px] font-bold leading-none tracking-tight">
                {formatPriceSmart(userInfo?.balanceAvailable)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-1 border-t border-white/20 pt-3">
            <div
              className="cursor-pointer text-center active:opacity-70"
              onClick={() => onNavigate('/withdraw')}
            >
              <div className="mb-1 whitespace-nowrap text-[10px] text-red-100">可提现收益</div>
              <div className="truncate font-mono text-sm font-bold">
                {formatPriceSmart(userInfo?.withdrawableMoney)}
              </div>
            </div>

            <div
              className="cursor-pointer text-center active:opacity-70"
              onClick={() => onNavigate('/store')}
            >
              <div className="mb-1 whitespace-nowrap text-[10px] text-red-100">消费金</div>
              <div className="truncate font-mono text-sm font-bold">{formatPriceSmart(userInfo?.score)}</div>
            </div>

            <div
              className="cursor-pointer text-center active:opacity-70"
              onClick={() => onNavigate('/hashrate-exchange')}
            >
              <div className="mb-1 whitespace-nowrap text-[10px] text-red-100">绿色算力</div>
              <div className="truncate font-mono text-sm font-bold">
                {formatPriceSmart(userInfo?.greenPower)}
              </div>
            </div>

            <div
              className="cursor-pointer text-center active:opacity-70"
              onClick={() => onNavigate('/service-recharge')}
            >
              <div className="mb-1 whitespace-nowrap text-[10px] text-red-100">确权金</div>
              <div className="truncate font-mono text-sm font-bold">
                {formatPriceSmart(userInfo?.serviceFeeBalance)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileBalanceCard;
