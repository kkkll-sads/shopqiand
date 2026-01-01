import React, { useState } from 'react';
import { ArrowRight, HelpCircle } from 'lucide-react';
import { UserInfo } from '../../../../types';
import { formatAmount } from '../../../../utils/format';
import { Route } from '../../../../router/routes';
import { fetchAnnouncements, AnnouncementItem } from '../../../../services/cms';
import BalanceHelpModal from './BalanceHelpModal';
import { extractData } from '../../../../utils/apiHelpers';

interface AssetHeaderCardProps {
  userInfo: UserInfo | null;
  onNavigate: (route: Route) => void;
}

// 余额类型与公告标题的映射
const BALANCE_HELP_TITLES: Record<string, string> = {
  'supply_chain_fund': '供应链专项金',
  'total_assets': '总资产',
  'withdrawable_income': '可调度收益',
  'green_power': '绿色算力',
  'consumer_points': '消费金',
  'rights_fund': '确权金',
  'pending_activation': '待激活',
};

const AssetHeaderCard: React.FC<AssetHeaderCardProps> = ({ userInfo, onNavigate }) => {
  const [helpModal, setHelpModal] = useState<{
    visible: boolean;
    title: string;
    content: string;
    loading: boolean;
  }>({
    visible: false,
    title: '',
    content: '',
    loading: false,
  });

  const handleHelpClick = async (balanceType: keyof typeof BALANCE_HELP_TITLES) => {
    const title = BALANCE_HELP_TITLES[balanceType];
    setHelpModal({ visible: true, title, content: '', loading: true });

    try {
      const res = await fetchAnnouncements({ title, limit: 1 });
      const data = extractData(res);
      if (data?.list?.length > 0) {
        const announcement = data.list[0];
        setHelpModal((prev) => ({
          ...prev,
          content: announcement.content,
          loading: false,
        }));
      } else {
        setHelpModal((prev) => ({
          ...prev,
          content: '',
          loading: false,
        }));
      }
    } catch (error) {
      console.error('获取余额说明失败:', error);
      setHelpModal((prev) => ({
        ...prev,
        content: '',
        loading: false,
      }));
    }
  };

  const closeHelpModal = () => {
    setHelpModal((prev) => ({ ...prev, visible: false }));
  };

  const HelpIcon: React.FC<{ type: keyof typeof BALANCE_HELP_TITLES }> = ({ type }) => (
    <span
      role="button"
      tabIndex={0}
      className="inline-flex items-center justify-center ml-0.5 p-0.5 rounded-full hover:bg-white/20 active:bg-white/30 transition-colors cursor-pointer"
      onClick={(e) => {
        e.stopPropagation();
        handleHelpClick(type);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          handleHelpClick(type);
        }
      }}
    >
      <HelpCircle size={12} className="text-white/70" />
    </span>
  );

  return (
    <>
      <div className="relative rounded-3xl shadow-xl mb-3 overflow-hidden text-white font-sans">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FF884D] to-[#FF5500] z-0">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-300 opacity-20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4"></div>
        </div>

        <div className="relative z-10 p-3">
          <div className="mb-4 text-center">
            <div className="flex items-center justify-center gap-1 opacity-90 text-sm font-medium mb-1">
              总资产 (CNY)
              <HelpIcon type="total_assets" />
            </div>
            <div className="text-3xl font-[DINAlternate-Bold,Roboto,sans-serif] font-bold tracking-tight drop-shadow-sm">
              {formatAmount(userInfo?.money)}
            </div>
          </div>

          <div className="w-full h-px bg-white/20 mb-3"></div>

          <div className="grid grid-cols-2 gap-y-4 gap-x-2 relative mb-2">
            {/* Row 1 */}
            <div className="text-center border-r border-white/10">
              <div className="text-xs text-white/80 mb-1 flex items-center justify-center">
                供应链专项金
                <HelpIcon type="supply_chain_fund" />
              </div>
              <div className="text-lg font-bold font-[DINAlternate-Bold,Roboto,sans-serif]">
                {formatAmount(userInfo?.balance_available)}
              </div>
            </div>

            <div className="text-center">
              <div className="text-xs text-white/80 mb-1 flex items-center justify-center">
                可调度收益
                <HelpIcon type="withdrawable_income" />
              </div>
              <div className="text-lg font-bold font-[DINAlternate-Bold,Roboto,sans-serif]">
                {formatAmount(userInfo?.withdrawable_money)}
              </div>
            </div>

            {/* Row 2 */}
            <div className="text-center border-r border-white/10 border-t border-white/10 pt-3">
              <div className="text-xs text-white/80 mb-1 flex items-center justify-center">
                消费金
                <HelpIcon type="consumer_points" />
              </div>
              <div className="text-lg font-bold font-[DINAlternate-Bold,Roboto,sans-serif]">
                {userInfo?.score ?? 0}
              </div>
            </div>

            <button
              type="button"
              className="text-center border-t border-white/10 pt-3"
              onClick={() =>
                onNavigate({ name: 'hashrate-exchange', source: 'asset-view', back: { name: 'asset-view' } })
              }
            >
              <div className="text-xs text-white/80 mb-1 flex items-center justify-center gap-1">
                绿色算力 <ArrowRight size={10} className="opacity-70" />
                <span onClick={(e) => e.stopPropagation()}>
                  <HelpIcon type="green_power" />
                </span>
              </div>
              <div className="text-lg font-bold font-[DINAlternate-Bold,Roboto,sans-serif] text-[#E0F2F1] drop-shadow-[0_0_8px_rgba(0,255,0,0.3)]">
                {userInfo?.green_power || 0} <span className="text-xs font-normal opacity-70">GHs</span>
              </div>
            </button>
          </div>

          <div className="mt-2 pt-2 flex justify-between text-xs text-white/95 border-t border-white/20 px-1 font-medium tracking-wide">
            <span className="flex items-center">
              确权金: ¥{formatAmount(userInfo?.service_fee_balance)}
              <HelpIcon type="rights_fund" />
            </span>
            <span className="flex items-center">
              待激活: ¥{formatAmount(userInfo?.pending_activation_gold || 0)}
              <HelpIcon type="pending_activation" />
            </span>
          </div>
        </div>
      </div>

      <BalanceHelpModal
        visible={helpModal.visible}
        title={helpModal.title}
        content={helpModal.content}
        loading={helpModal.loading}
        onClose={closeHelpModal}
      />
    </>
  );
};

export default AssetHeaderCard;
