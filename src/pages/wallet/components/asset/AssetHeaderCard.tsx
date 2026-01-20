/**
 * AssetHeaderCard - 资产头部卡片组件
 * 已迁移: 使用 React Router 导航
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, HelpCircle, ChevronRight } from 'lucide-react';
import { UserInfo } from '../../../../../types';
import { formatPriceSmart } from '../../../../../utils/format';
import { fetchAnnouncements } from '../../../../../services/cms';
import BalanceHelpModal from './BalanceHelpModal';
import { extractData } from '../../../../../utils/apiHelpers';
import { errorLog } from '../../../../../utils/logger';

interface AssetHeaderCardProps {
  userInfo: UserInfo | null;
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

const AssetHeaderCard: React.FC<AssetHeaderCardProps> = ({ userInfo }) => {
  const navigate = useNavigate();
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
      errorLog('AssetHeaderCard', '获取余额说明失败', error);
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
      className="inline-flex items-center justify-center ml-0.5 p-0.5 rounded-full hover:bg-white/20 active:bg-white/30 transition-colors cursor-pointer"
      onClick={(e) => {
        e.stopPropagation();
        handleHelpClick(type);
      }}
    >
      <HelpCircle size={12} className="text-white/70" />
    </span>
  );

  return (
    <>
      <div className="relative rounded-2xl shadow-lg mb-3 overflow-hidden text-white font-sans">
        {/* 渐变背景 */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#FF7A45] via-[#FF5722] to-[#E64A19] z-0" />

        <div className="relative z-10 p-4">
          {/* 顶部：标题 + 标签 + 充值入口 */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white/90">供应链专项金</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-white/20 rounded text-white/80">采购本金</span>
            </div>
            <button
              onClick={() => navigate('/balance-recharge')}
              className="text-xs text-white/90 flex items-center gap-0.5 active:opacity-70"
            >
              去充值 <ChevronRight size={14} />
            </button>
          </div>

          {/* 主金额 */}
          <div className="mb-4">
            <div className="flex items-baseline">
              <span className="text-2xl font-medium mr-0.5">¥</span>
              <span className="text-[32px] font-bold font-[DINAlternate-Bold,Roboto,sans-serif] tracking-tight leading-none">
                {formatPriceSmart(userInfo?.balance_available)}
              </span>
            </div>
          </div>

          {/* 四个字段 - 使用 Grid 均匀分布 */}
          <div className="grid grid-cols-4 gap-1 pt-3 border-t border-white/15">
            {/* 可调度收益 */}
            <div className="text-center">
              <div className="text-[10px] text-white/70 mb-1 flex items-center justify-center whitespace-nowrap">
                可调度收益
                <HelpIcon type="withdrawable_income" />
              </div>
              <div className="text-sm font-bold font-[DINAlternate-Bold,Roboto,sans-serif] truncate">
                {formatPriceSmart(userInfo?.withdrawable_money)}
              </div>
            </div>

            {/* 消费金 */}
            <div className="text-center">
              <div className="text-[10px] text-white/70 mb-1 flex items-center justify-center whitespace-nowrap">
                消费金
                <HelpIcon type="consumer_points" />
              </div>
              <div className="text-sm font-bold font-[DINAlternate-Bold,Roboto,sans-serif] truncate">
                {formatPriceSmart(userInfo?.score)}
              </div>
            </div>

            {/* 绿色算力 */}
            <button
              type="button"
              className="text-center"
              onClick={() => navigate('/hashrate-exchange')}
            >
              <div className="text-[10px] text-white/70 mb-1 flex items-center justify-center whitespace-nowrap">
                绿色算力
                <ArrowRight size={10} className="ml-0.5 opacity-60" />
              </div>
              <div className="text-sm font-bold font-[DINAlternate-Bold,Roboto,sans-serif] text-emerald-200 truncate">
                {formatPriceSmart(userInfo?.green_power)}
              </div>
            </button>

            {/* 确权金 */}
            <div className="text-center">
              <div className="text-[10px] text-white/70 mb-1 flex items-center justify-center whitespace-nowrap">
                确权金
                <HelpIcon type="rights_fund" />
              </div>
              <div className="text-sm font-bold font-[DINAlternate-Bold,Roboto,sans-serif] truncate">
                {formatPriceSmart(userInfo?.service_fee_balance)}
              </div>
            </div>
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
