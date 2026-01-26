/**
 * CumulativeRights - 累计权益页面
 *
 * 使用 PageContainer、LoadingSpinner、EmptyState 组件重构
 * 使用 formatMoney 工具函数
 * 接入新的 /api/Account/accountOverview 接口
 *
 * @author 树交所前端团队
 * @version 3.0.0
 */

/**
 * CumulativeRights - 累计权益页面
 * 已迁移: 使用 React Router 导航
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  FileText,
  TrendingUp,
  Award,
  Gift,
  Receipt,
  Package,
  Coins,
  Users,
  CalendarCheck,
  UserPlus,
  MoreHorizontal,
  Pickaxe,
} from 'lucide-react';
import PageContainer from '@/layouts/PageContainer';
import { LoadingSpinner } from '@/components/common';
import {
  fetchAccountOverview,
  AccountOverviewData,
  AccountBalanceInfo,
  AccountIncomeInfo,
  CollectionInfo,
} from '@/services/wallet';
import { getStoredToken } from '@/services/client';
import { formatAmount } from '@/utils/format';
import { isSuccess, extractError } from '@/utils/apiHelpers';
import { useStateMachine } from '@/hooks/useStateMachine';
import { LoadingEvent, LoadingState } from '@/types/states';

const CumulativeRights: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [overviewData, setOverviewData] = useState<AccountOverviewData | null>(null);

  const loadMachine = useStateMachine<LoadingState, LoadingEvent>({
    initial: LoadingState.IDLE,
    transitions: {
      [LoadingState.IDLE]: { [LoadingEvent.LOAD]: LoadingState.LOADING },
      [LoadingState.LOADING]: {
        [LoadingEvent.SUCCESS]: LoadingState.SUCCESS,
        [LoadingEvent.ERROR]: LoadingState.ERROR,
      },
      [LoadingState.SUCCESS]: {
        [LoadingEvent.LOAD]: LoadingState.LOADING,
        [LoadingEvent.RETRY]: LoadingState.LOADING,
      },
      [LoadingState.ERROR]: {
        [LoadingEvent.LOAD]: LoadingState.LOADING,
        [LoadingEvent.RETRY]: LoadingState.LOADING,
      },
    },
  });
  const loading = loadMachine.state === LoadingState.LOADING;

  // 加载账户一览数据
  useEffect(() => {
    const loadData = async () => {
      const token = getStoredToken();
      if (!token) {
        setError('请先登录');
        loadMachine.send(LoadingEvent.ERROR);
        return;
      }

      loadMachine.send(LoadingEvent.LOAD);
      setError(null);

      try {
        const response = await fetchAccountOverview(token);
        if (isSuccess(response) && response.data) {
          setOverviewData(response.data);
          loadMachine.send(LoadingEvent.SUCCESS);
        } else {
          setError(extractError(response, '获取账户信息失败'));
          loadMachine.send(LoadingEvent.ERROR);
        }
      } catch (err: any) {
        setError(err?.message || '获取账户信息失败');
        loadMachine.send(LoadingEvent.ERROR);
      }
    };

    loadData();
  }, []);

  // 从 overviewData 提取数据
  const balance: AccountBalanceInfo | null = overviewData?.balance || null;
  const income: AccountIncomeInfo | null = overviewData?.income || null;
  const collection: CollectionInfo | null = overviewData?.collection || null;

  // 账户余额数据
  const balanceData = [
    {
      icon: Award,
      label: '总资产',
      value: formatAmount(balance?.total_assets || 0),
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: '所有账户资产总和',
    },
    {
      icon: TrendingUp,
      label: '专项金(可用)',
      value: formatAmount(balance?.balance_available || 0),
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      description: '充值余额，优先购买扣除',
    },
    {
      icon: Gift,
      label: '可提现余额',
      value: formatAmount(balance?.withdrawable_money || 0),
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      description: '收益/分红/奖励，可申请提现',
    },
    {
      icon: ShieldCheck,
      label: '消费金',
      value: balance?.score?.toString() || '0',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: '利润/分红转化，用于商城消费',
    },
    {
      icon: TrendingUp,
      label: '确权金',
      value: formatAmount(balance?.service_fee_balance || 0),
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: '寄售手续费账户',
    },
    {
      icon: Award,
      label: '绿色算力',
      value: formatAmount(balance?.green_power || 0),
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      description: '绿色算力余额',
    },
  ];

  // 历史收益数据
  const incomeData = [
    {
      icon: Coins,
      label: '寄售收益',
      value: formatAmount(income?.consignment_income?.withdrawable_income || 0),
      scoreValue: income?.consignment_income?.score_income || 0,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      icon: Pickaxe,
      label: '矿机分红',
      value: formatAmount(income?.mining_dividend?.withdrawable_income || 0),
      scoreValue: income?.mining_dividend?.score_income || 0,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
    {
      icon: Users,
      label: '好友分润',
      value: formatAmount(income?.friend_commission?.withdrawable_income || 0),
      scoreValue: income?.friend_commission?.score_income || 0,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
    },
    {
      icon: CalendarCheck,
      label: '签到奖励',
      value: formatAmount(income?.sign_in?.withdrawable_income || 0),
      scoreValue: income?.sign_in?.score_income || 0,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
    },
    {
      icon: UserPlus,
      label: '注册奖励',
      value: formatAmount(income?.register_reward?.withdrawable_income || 0),
      scoreValue: income?.register_reward?.score_income || 0,
      color: 'text-sky-600',
      bgColor: 'bg-sky-50',
    },
    {
      icon: MoreHorizontal,
      label: '其他收益',
      value: formatAmount(income?.other?.withdrawable_income || 0),
      scoreValue: income?.other?.score_income || 0,
      color: 'text-slate-600',
      bgColor: 'bg-slate-50',
    },
  ];

  // 藏品统计数据
  const collectionStats = [
    { label: '藏品总数', value: collection?.total_count || 0, unit: '件' },
    { label: '持有中', value: collection?.holding_count || 0, unit: '件' },
    { label: '寄售中', value: collection?.consigning_count || 0, unit: '件' },
    { label: '已售出', value: collection?.sold_count || 0, unit: '件' },
    { label: '矿机数量', value: collection?.mining_count || 0, unit: '台' },
  ];

  return (
    <PageContainer title="权益总览" onBack={() => navigate(-1)}>
      {/* 加载状态 - 骨架屏 */}
      {loading && (
        <div className="space-y-6">
          {/* 头部卡片骨架 */}
          <div className="skeleton h-40 rounded-2xl" />
          {/* 权益网格骨架 */}
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="skeleton w-10 h-10 rounded-full mb-2" />
                <div className="skeleton h-3 w-16 rounded mb-1" />
                <div className="skeleton h-6 w-24 rounded mb-1" />
                <div className="skeleton h-2 w-full rounded" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 错误状态 */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-12 text-red-400">
          <div className="w-16 h-16 mb-4 border-2 border-red-200 rounded-lg flex items-center justify-center">
            <FileText size={32} className="opacity-50" />
          </div>
          <span className="text-xs">{error}</span>
        </div>
      )}

      {/* 内容区域 */}
      {!loading && !error && (
        <>
          {/* 权益概览卡片 */}
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-lg mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck size={24} />
                <div className="text-sm opacity-90">我的权益</div>
              </div>
              <div className="text-2xl font-bold mb-4">资产全景</div>
              <div className="text-sm opacity-80">当前所有资金账户概览</div>
            </div>
          </div>

          {/* 账户余额统计 */}
          <div className="mb-6">
            <div className="text-sm font-bold text-gray-800 mb-3 border-l-4 border-red-500 pl-2">
              账户余额
            </div>
            <div className="grid grid-cols-2 gap-4">
              {balanceData.map((item, idx) => (
                <div key={idx} className="bg-white rounded-xl p-4 shadow-sm">
                  <div className={`w-10 h-10 rounded-full ${item.bgColor} flex items-center justify-center mb-2`}>
                    <item.icon size={20} className={item.color} />
                  </div>
                  <div className="text-xs text-gray-500 mb-0.5">{item.label}</div>
                  <div className={`text-lg font-bold ${item.color} mb-1 font-[DINAlternate-Bold,Roboto,sans-serif]`}>{item.value}</div>
                  {item.description && (
                    <div className="text-[10px] text-gray-400 leading-tight">{item.description}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 历史收益统计 */}
          <div className="mb-6">
            <div className="text-sm font-bold text-gray-800 mb-3 border-l-4 border-orange-500 pl-2">
              历史收益统计
            </div>
            {/* 收益总计卡片 */}
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl p-4 text-white mb-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-xs opacity-80 mb-1">累计可提现收益</div>
                  <div className="text-xl font-bold font-[DINAlternate-Bold,Roboto,sans-serif]">
                    {formatAmount(income?.total_income_withdrawable || 0)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs opacity-80 mb-1">累计消费金收益</div>
                  <div className="text-xl font-bold font-[DINAlternate-Bold,Roboto,sans-serif]">
                    {income?.total_income_score || 0}
                  </div>
                </div>
              </div>
            </div>
            {/* 各项收益明细 */}
            <div className="grid grid-cols-2 gap-3">
              {incomeData.map((item, idx) => (
                <div key={idx} className="bg-white rounded-xl p-3 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-8 h-8 rounded-full ${item.bgColor} flex items-center justify-center`}>
                      <item.icon size={16} className={item.color} />
                    </div>
                    <div className="text-xs text-gray-600">{item.label}</div>
                  </div>
                  <div className={`text-base font-bold ${item.color} font-[DINAlternate-Bold,Roboto,sans-serif]`}>
                    {item.value}
                  </div>
                  {item.scoreValue > 0 && (
                    <div className="text-[10px] text-gray-400 mt-0.5">
                      消费金: {item.scoreValue}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 藏品价值统计 */}
          <div className="mb-6">
            <div className="text-sm font-bold text-gray-800 mb-3 border-l-4 border-purple-500 pl-2">
              藏品价值统计
            </div>
            {/* 藏品总价值卡片 */}
            <div className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl p-4 text-white mb-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-xs opacity-80 mb-1">藏品总价值</div>
                  <div className="text-xl font-bold font-[DINAlternate-Bold,Roboto,sans-serif]">
                    {formatAmount(collection?.total_value || 0)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs opacity-80 mb-1">平均价格</div>
                  <div className="text-xl font-bold font-[DINAlternate-Bold,Roboto,sans-serif]">
                    {formatAmount(collection?.avg_price || 0)}
                  </div>
                </div>
              </div>
            </div>
            {/* 藏品统计数据 */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="grid grid-cols-5 gap-2 text-center">
                {collectionStats.map((stat, idx) => (
                  <div key={idx}>
                    <div className="text-lg font-bold text-gray-800 font-[DINAlternate-Bold,Roboto,sans-serif]">
                      {stat.value}
                    </div>
                    <div className="text-[10px] text-gray-500">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* 矿机价值 */}
            {collection && collection.mining_count > 0 && (
              <div className="bg-white rounded-xl p-4 shadow-sm mt-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                    <Pickaxe size={20} className="text-amber-600" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">矿机总价值</div>
                    <div className="text-base font-bold text-amber-600 font-[DINAlternate-Bold,Roboto,sans-serif]">
                      {formatAmount(collection.mining_value || 0)}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  共 {collection.mining_count} 台
                </div>
              </div>
            )}
          </div>

          {/* 订单资金详情入口 */}
          <div className="mb-6">
            <button
              onClick={() => navigate('/order-fund-detail')}
              className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <Receipt size={20} className="text-white" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-base">订单资金详情</div>
                  <div className="text-xs text-white/80">查看订单相关的资金明细记录</div>
                </div>
              </div>
              <TrendingUp size={20} className="opacity-80" />
            </button>
          </div>

          {/* 权益说明 */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-3 border-l-4 border-red-500 pl-2">
              资金说明
            </div>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                <div>总资产：显示值为所有账户（专项金+可提现+消费金+确权金）之和，仅供展示。</div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                <div>专项金：主要用于购买藏品，优先扣除。</div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                <div>可提现：所有的成交回款、分红收益、现金奖励均进入此账户，可直接提现。</div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                <div>确权金：用于支付寄售手续费，可由其他账户划转，不可逆。</div>
              </div>
            </div>
          </div>
        </>
      )}
    </PageContainer>
  );
};

export default CumulativeRights;
