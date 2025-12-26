import React from 'react';
import { ArrowRight } from 'lucide-react';
import { UserInfo } from '../../../../types';
import { formatAmount } from '../../../../utils/format';
import { Route } from '../../../../router/routes';

interface AssetHeaderCardProps {
  userInfo: UserInfo | null;
  onNavigate: (route: Route) => void;
}

const AssetHeaderCard: React.FC<AssetHeaderCardProps> = ({ userInfo, onNavigate }) => {
  return (
    <div className="relative rounded-3xl shadow-xl mb-3 overflow-hidden text-white font-sans">
      <div className="absolute inset-0 bg-gradient-to-br from-[#FF884D] to-[#FF5500] z-0">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-300 opacity-20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4"></div>
      </div>

      <div className="relative z-10 p-4">
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-1 opacity-90 text-sm font-medium mb-1">
            供应链专项金 (元)
          </div>
          <div className="text-4xl font-[DINAlternate-Bold,Roboto,sans-serif] font-bold tracking-tight drop-shadow-sm">
            {formatAmount(userInfo?.money)}
          </div>
        </div>

        <div className="w-full h-px bg-white/20 mb-5"></div>

        <div className="grid grid-cols-3 gap-4 items-start relative">
          <div className="absolute left-1/3 top-2 bottom-2 w-px bg-white/10"></div>
          <div className="absolute right-1/3 top-2 bottom-2 w-px bg-white/10"></div>

          <div className="text-center">
            <div className="text-xs text-white/80 mb-1">可调度收益</div>
            <div className="text-lg font-bold font-[DINAlternate-Bold,Roboto,sans-serif]">
              {formatAmount(userInfo?.withdrawable_money)}
            </div>
          </div>

          <button
            type="button"
            className="text-center"
            onClick={() =>
              onNavigate({ name: 'hashrate-exchange', source: 'asset-view', back: { name: 'asset-view' } })
            }
          >
            <div className="text-xs text-white/80 mb-1 flex items-center justify-center gap-1">
              绿色算力 <ArrowRight size={10} className="opacity-70" />
            </div>
            <div className="text-lg font-bold font-[DINAlternate-Bold,Roboto,sans-serif] text-[#E0F2F1] drop-shadow-[0_0_8px_rgba(0,255,0,0.3)]">
              {userInfo?.green_power || 0} <span className="text-xs font-normal opacity-70">GHs</span>
            </div>
          </button>

          <div className="text-center">
            <div className="text-xs text-white/80 mb-1">消费金</div>
            <div className="text-lg font-bold font-[DINAlternate-Bold,Roboto,sans-serif]">
              {userInfo?.score ?? 0}
            </div>
          </div>
        </div>

        <div className="mt-3 pt-2 flex justify-between text-xs text-white/95 border-t border-white/20 px-1 font-medium tracking-wide">
          <span>确权金: ¥{formatAmount(userInfo?.service_fee_balance)}</span>
          <span>待激活: ¥{formatAmount(userInfo?.pending_service_fee || 0)}</span>
        </div>
      </div>
    </div>
  );
};

export default AssetHeaderCard;

