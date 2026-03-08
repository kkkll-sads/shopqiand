import React from 'react';
import { ChevronRight } from 'lucide-react';
import type { AccountProfileUserInfo } from '../../../api/modules/account'; 

// 辅助方法，将 undefined/null/非数值转为合法数字以确保能够 format 
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
    <div className="px-4 relative z-10 transition-transform">
      <div className="relative rounded-2xl shadow-xl overflow-hidden text-white font-sans bg-gradient-to-br from-red-600 to-red-500">
        
        {/* 背景光晕装饰 */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-orange-300 opacity-20 rounded-full blur-2xl translate-y-1/4 -translate-x-1/4"></div>
        </div>

        <div className="relative z-10 p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-red-50">供应链专项金</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-white/20 text-white border border-white/30 backdrop-blur-sm">采购本金</span>
            </div>
            <button
              onClick={() => onNavigate('/recharge')}
              className="text-red-50 text-sm font-medium flex items-center gap-0.5 active:opacity-70 transition-opacity"
            >
              去充值 <ChevronRight size={14} />
            </button>
          </div>

          <div
            className="mb-4 cursor-pointer active:opacity-70 transition-opacity"
            onClick={() => onNavigate('/coupon')} // 替换之前 tab=0 资产明细
          >
            <div className="flex items-baseline overflow-hidden">
              <span className="text-2xl font-medium mr-1 tracking-tight">¥</span>
              <span className="text-[32px] font-bold font-mono tracking-tight leading-none truncate">
                {formatPriceSmart(userInfo?.balanceAvailable)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-1 pt-3 border-t border-white/20">
            <div
              className="text-center cursor-pointer active:opacity-70"
              onClick={() => onNavigate('/withdraw')} // 替换 tab=1
            >
              <div className="text-[10px] text-red-100 mb-1 whitespace-nowrap">可提现收益</div>
              <div className="text-sm font-bold font-mono truncate">
                {formatPriceSmart(userInfo?.withdrawableMoney)}
              </div>
            </div>

            <div
              className="text-center cursor-pointer active:opacity-70"
              onClick={() => onNavigate('/store')}
            >
              <div className="text-[10px] text-red-100 mb-1 whitespace-nowrap">消费金</div>
              <div className="text-sm font-bold font-mono truncate">
                {formatPriceSmart(userInfo?.score)}
              </div>
            </div>

            <div
              className="text-center cursor-pointer active:opacity-70"
              onClick={() => onNavigate('/growth_rights')}
            >
              <div className="text-[10px] text-red-100 mb-1 whitespace-nowrap">绿色算力</div>
              <div className="text-sm font-bold font-mono truncate">
                {formatPriceSmart(userInfo?.greenPower)}
              </div>
            </div>

            <div
              className="text-center cursor-pointer active:opacity-70"
              onClick={() => onNavigate('/rights_transfer')} // 替换 tab=3 
            >
              <div className="text-[10px] text-red-100 mb-1 whitespace-nowrap">确权金</div>
              <div className="text-sm font-bold font-mono truncate">
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
