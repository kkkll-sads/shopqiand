/**
 * @file GrowthRights/index.tsx - 成长权益页面
 * @description 展示用户成长权益信息，包括成长天数、待激活金、周期进度、成长阶段、配资规则、成长记录。
 */

import React, { useState } from 'react'; // React 核心 Hook
import { TrendingUp, Calendar, Award, Activity, CheckCircle2, XCircle, Gift } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { useRequest } from '../../hooks/useRequest';
import { accountApi, type GrowthRightsModeProgressItemRaw } from '../../api/modules/account';

/** 成长权益内容区（无顶部返回栏），用于确权中心 Tab 内嵌 */
export const GrowthRightsContent = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'logs'>('overview');

  const { data, loading, error, reload } = useRequest(
    (signal) => accountApi.getGrowthRightsInfo({ signal }),
    { cacheKey: 'growthRightsInfo' },
  );

  const pendingGold =
    data?.pending_activation_gold != null
      ? Number(data.pending_activation_gold)
      : 0;
  const stage = data?.stage ?? { key: '', label: '--', rights_status: '--', min_days: 0 };
  const stages = data?.stages ?? [];
  const status = data?.status ?? {
    can_activate: false,
    can_unlock_package: false,
    financing_enabled: false,
    is_accelerated_mode: false,
  };
  const financing = data?.financing ?? { ratio: '--', rules: [] };
  const cycle = data?.cycle ?? {
    active_mode: '',
    cycle_days: 0,
    completed_cycles: 0,
    next_cycle_in_days: 0,
    remaining_days_in_cycle: 0,
    unlock_amount_per_cycle: 0,
    unlockable_amount: 0,
    mode_progress: {},
  };
  const dailyGrowthLogs = data?.daily_growth_logs ?? [];
  const modeProgressEntries = Object.entries(cycle.mode_progress ?? {}) as Array<
    [string, GrowthRightsModeProgressItemRaw]
  >;

  if (loading && !data) {
    return (
      <div className="flex-1 bg-bg-base flex flex-col">
        <div className="p-4 space-y-4">
          <Skeleton className="w-full h-40 rounded-[16px]" />
          <Skeleton className="w-full h-32 rounded-[16px]" />
          <Skeleton className="w-full h-64 rounded-[16px]" />
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-bg-base">
        <p className="text-[14px] text-text-sub text-center mb-4">
          {error instanceof Error ? error.message : '加载失败'}
        </p>
        <button
          onClick={() => void reload().catch(() => undefined)}
          className="px-4 py-2 bg-primary-start text-white text-[14px] font-medium rounded-lg"
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-full no-scrollbar pb-safe bg-bg-base">
        {/* Top Banner */}
        <div className="bg-gradient-to-br from-primary-start to-primary-end px-6 py-8 text-white relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
          <div className="relative z-10">
            <div className="text-[14px] text-white/80 mb-1 flex items-center">
              <TrendingUp size={16} className="mr-1.5" /> 累计成长天数
            </div>
            <div className="flex items-baseline">
              <span className="text-[40px] font-bold leading-none mr-2">{data?.growth_days ?? 0}</span>
              <span className="text-[14px] text-white/80">天</span>
            </div>
            <div className="mt-4 inline-block bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-[12px]">
              当前阶段：{stage.label} ({stage.rights_status})
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex px-4 border-b border-border-light bg-white dark:bg-gray-900">
          <button
            className={`flex-1 py-3 text-[14px] font-medium relative transition-colors ${activeTab === 'overview' ? 'text-primary-start' : 'text-text-sub'}`}
            onClick={() => setActiveTab('overview')}
          >
            权益概览
            {activeTab === 'overview' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-start rounded-t-full"></div>}
          </button>
          <button
            className={`flex-1 py-3 text-[14px] font-medium relative transition-colors ${activeTab === 'logs' ? 'text-primary-start' : 'text-text-sub'}`}
            onClick={() => setActiveTab('logs')}
          >
            成长记录
            {activeTab === 'logs' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-start rounded-t-full"></div>}
          </button>
        </div>

        <div className="p-4 space-y-4">
          {activeTab === 'overview' ? (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="p-4 bg-white dark:bg-gray-900 shadow-sm border-none">
                  <div className="text-[12px] text-text-sub mb-1 flex items-center">
                    <Activity size={14} className="mr-1" /> 今日交易笔数
                  </div>
                  <div className="text-[18px] font-bold text-text-main">{data?.today_trade_count ?? 0}</div>
                </Card>
                <Card className="p-4 bg-white dark:bg-gray-900 shadow-sm border-none">
                  <div className="text-[12px] text-text-sub mb-1 flex items-center">
                    <Activity size={14} className="mr-1" /> 累计交易笔数
                  </div>
                  <div className="text-[18px] font-bold text-text-main">{data?.total_trade_count ?? 0}</div>
                </Card>
                <Card className="p-4 bg-white dark:bg-gray-900 shadow-sm border-none col-span-2 flex justify-between items-center">
                  <div>
                    <div className="text-[12px] text-text-sub mb-1">待激活金</div>
                    <div className="text-[20px] font-bold text-primary-start">¥{pendingGold.toLocaleString('zh-CN', { useGrouping: false })}</div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-orange-50 dark:bg-orange-500/15 flex items-center justify-center text-orange-500 dark:text-orange-300">
                    <Award size={20} />
                  </div>
                </Card>
              </div>

              {/* Cycle Info */}
              <Card className="p-4 shadow-sm border-none">
                <h3 className="text-[15px] font-bold text-text-main mb-4 flex items-center">
                  <Calendar size={16} className="mr-1.5 text-primary-start" /> 周期进度
                  {status.is_accelerated_mode && (
                    <span className="ml-2 bg-red-50 text-primary-start text-[10px] px-2 py-0.5 rounded-full font-medium border border-red-100 dark:border-red-500/20 dark:bg-red-500/12 dark:text-red-300">加速模式</span>
                  )}
                </h3>

                <div className="space-y-4">
                  {modeProgressEntries.map(([modeKey, mode]) => {
                    const isActive = cycle.active_mode === modeKey;
                    const progress =
                      (mode.required_days ?? 0) > 0
                        ? Math.min(((mode.growth_days ?? 0) / (mode.required_days ?? 1)) * 100, 100)
                        : 0;

                    return (
                      <div key={modeKey} className={`p-3 rounded-[12px] border ${isActive ? 'border-primary-start bg-red-50/30 dark:bg-red-900/10' : 'border-border-light bg-bg-base'}`}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[14px] font-medium text-text-main">{mode.label}</span>
                          <span className="text-[12px] text-text-sub">
                            <span className={isActive ? 'text-primary-start font-bold' : 'text-text-main'}>{mode.growth_days}</span> / {mode.required_days} 天
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${isActive ? 'bg-primary-start' : 'bg-gray-400'}`}
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                        <div className="text-[11px] text-text-sub flex justify-between">
                          <span>距离下次结算还需 {mode.summary?.remaining_days_in_cycle ?? 0} 天</span>
                          {isActive && <span>每次解锁: ¥{cycle.unlock_amount_per_cycle ?? 0}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Stages Timeline */}
              <Card className="p-4 shadow-sm border-none">
                <h3 className="text-[15px] font-bold text-text-main mb-4">成长阶段</h3>
                <div className="relative pl-4 border-l-2 border-border-light space-y-6">
                  {stages.map((s) => {
                    const isCurrent = s.key === stage.key;
                    const isPast = (s.max_days != null) && (data?.growth_days ?? 0) > s.max_days;

                    return (
                      <div key={s.key} className="relative">
                        <div className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 bg-white dark:bg-gray-900 ${isCurrent ? 'border-primary-start ring-4 ring-red-50 dark:ring-red-500/15' : isPast ? 'border-green-500' : 'border-gray-300 dark:border-gray-600'}`}></div>
                        <div className="flex justify-between items-start">
                          <div>
                            <div className={`text-[14px] font-bold mb-1 ${isCurrent ? 'text-primary-start' : isPast ? 'text-text-main' : 'text-text-sub'}`}>
                              {s.label}
                            </div>
                            <div className="text-[12px] text-text-sub">
                              {s.max_days != null ? `${s.min_days} - ${s.max_days} 天` : `${s.min_days} 天以上`}
                            </div>
                          </div>
                          <div className={`text-[12px] px-2 py-1 rounded bg-bg-base ${isCurrent ? 'text-primary-start font-medium' : 'text-text-sub'}`}>
                            {s.rights_status}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Financing Rules */}
              <Card className="p-4 shadow-sm border-none">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-[15px] font-bold text-text-main">配资比例规则</h3>
                  <span className="text-[13px] text-text-sub">当前比例: <span className="text-text-main font-bold">{financing.ratio}</span></span>
                </div>
                <div className="bg-bg-base rounded-[8px] overflow-hidden border border-border-light">
                  <div className="flex bg-gray-100 dark:bg-gray-800 text-[12px] text-text-sub font-medium">
                    <div className="flex-1 p-2 text-center border-r border-border-light">天数范围</div>
                    <div className="flex-1 p-2 text-center">配资比例</div>
                  </div>
                  {(financing.rules ?? []).map((rule, idx) => (
                    <div key={idx} className="flex text-[13px] text-text-main border-t border-border-light">
                      <div className="flex-1 p-2 text-center border-r border-border-light">
                        {rule.max_days != null ? `${rule.min_days}-${rule.max_days}天` : `${rule.min_days}天以上`}
                      </div>
                      <div className="flex-1 p-2 text-center font-medium">{rule.ratio}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          ) : (
            /* Logs Tab */
            <div className="space-y-3">
              {dailyGrowthLogs.map((log, idx) => (
                <Card key={idx} className="p-4 shadow-sm border-none">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[14px] font-bold text-text-main">{log.date}</span>
                    {log.counted ? (
                      <span className="text-[12px] text-green-500 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded flex items-center">
                        <CheckCircle2 size={12} className="mr-1" /> 已计入
                      </span>
                    ) : (
                      <span className="text-[12px] text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded flex items-center">
                        <XCircle size={12} className="mr-1" /> 未计入
                      </span>
                    )}
                  </div>

                  <div className="flex items-start mt-2">
                    {log.is_activity_bonus ? (
                      <Gift size={16} className="mr-2 shrink-0 mt-0.5 text-orange-500 dark:text-orange-300" />
                    ) : (
                      <Activity size={16} className="mr-2 shrink-0 mt-0.5 text-blue-500 dark:text-blue-300" />
                    )}
                    <div className="text-[13px] text-text-sub leading-relaxed">
                      {log.reason}
                    </div>
                  </div>

                  {!log.is_activity_bonus && (
                    <div className="mt-3 pt-3 border-t border-border-light flex justify-between text-[12px]">
                      <span className="text-text-sub">交易笔数</span>
                      <span className="text-text-main font-medium">{log.trade_count} 笔</span>
                    </div>
                  )}
                </Card>
              ))}
              <div className="py-4 text-center text-[12px] text-text-aux">
                仅展示最近的成长记录
              </div>
            </div>
          )}
        </div>
      </div>
  );
};

