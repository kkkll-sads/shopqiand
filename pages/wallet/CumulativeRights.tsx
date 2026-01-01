/**
 * CumulativeRights - 累计权益页面
 * 
 * 使用 PageContainer、LoadingSpinner、EmptyState 组件重构
 * 使用 formatMoney 工具函数
 * 
 * @author 树交所前端团队
 * @version 2.0.0
 */

import React, { useState, useEffect } from 'react';
import { ShieldCheck, FileText, TrendingUp, Award, Gift, Receipt } from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer';
import { LoadingSpinner } from '../../components/common';
import { AUTH_TOKEN_KEY, fetchProfile } from '../../services/api';
import { UserInfo } from '../../types';
import { formatAmount } from '../../utils/format';
import { isSuccess, extractError } from '../../utils/apiHelpers';
import { Route } from '../../router/routes';

/**
 * CumulativeRights 组件属性接口
 */
interface CumulativeRightsProps {
  onBack: () => void;
  onNavigate?: (route: Route) => void;
}

/**
 * CumulativeRights 累计权益页面组件
 */
const CumulativeRights: React.FC<CumulativeRightsProps> = ({ onBack, onNavigate }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  // 加载用户数据
  useEffect(() => {
    const loadData = async () => {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) {
        setError('请先登录');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetchProfile(token);
        if (isSuccess(response) && response.data?.userInfo) {
          setUserInfo(response.data.userInfo);
        } else {
          setError(extractError(response, '获取权益信息失败'));
        }
      } catch (err: any) {
        setError(err?.message || '获取权益信息失败');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // 权益数据
  const rightsData = [
    {
      icon: Award,
      label: '总资产',
      value: formatAmount(userInfo?.money || 0),
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: '所有账户资产总和',
    },
    {
      icon: TrendingUp,
      label: '专项金(可用)',
      value: formatAmount(userInfo?.balance_available || 0),
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      description: '充值余额，优先购买扣除',
    },
    {
      icon: Gift,
      label: '可提现余额',
      value: formatAmount(userInfo?.withdrawable_money || 0),
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      description: '收益/分红/奖励，可申请提现',
    },
    {
      icon: ShieldCheck,
      label: '消费金',
      value: userInfo?.score?.toString() || '0',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: '利润/分红转化，用于商城消费',
    },
    {
      icon: TrendingUp,
      label: '确权金',
      value: formatAmount(userInfo?.service_fee_balance || 0),
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: '寄售手续费账户',
    },
    {
      icon: Award,
      label: '待激活金',
      value: formatAmount(userInfo?.pending_activation_gold || 0),
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      description: '旧资产解锁，独立核算',
    },
  ];

  return (
    <PageContainer title="权益总览" onBack={onBack}>
      {/* 加载状态 */}
      {loading && <LoadingSpinner text="加载中..." />}

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
          <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl p-6 text-white shadow-lg mb-6 relative overflow-hidden">
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

          {/* 权益统计 */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {rightsData.map((item, idx) => (
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

          {/* 订单资金详情入口 */}
          {onNavigate && (
            <div className="mb-6">
              <button
                onClick={() => onNavigate({ name: 'order-fund-detail', back: { name: 'cumulative-rights' } })}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-between"
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
          )}

          {/* 权益说明 */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-3 border-l-4 border-blue-300 pl-2">
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
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
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
