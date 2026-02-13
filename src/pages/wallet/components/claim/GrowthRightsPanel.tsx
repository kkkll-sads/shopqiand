import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, TrendingUp, Zap, ShieldCheck, Unlock, ArrowRight } from 'lucide-react';
import type { GrowthDailyLog } from '@/services/user/assets';

/**
 * GrowthRightsPanel - 成长权益面板
 * 展示用户成长进度、解锁规则、配资权限等信息
 */

interface GrowthRightsPanelProps {
  /** 当前成长天数 */
  growthDays?: number;
  /** 成长阶段目标天数（通常为 45） */
  targetDays?: number;
  /** 待激活确权金余额 */
  pendingBalance?: number;
  /** 每日交易次数 */
  dailyTrades?: number;
  /** 配资权限是否开启 */
  financingEnabled?: boolean;
  /** 当前配资比例 */
  financingRatio?: string;
  /** 后端阶段标签 */
  stageLabel?: string;
  /** 后端阶段权益状态 */
  stageRightsStatus?: string;
  /** 后端阶段规则 */
  stageRules?: Array<{
    key: string;
    label: string;
    min_days: number;
    max_days?: number | null;
    rights_status: string;
  }>;
  /** 后端配资规则 */
  financingRules?: Array<{
    min_days: number;
    max_days?: number | null;
    ratio: string;
  }>;
  /** 稳健周期天数 */
  normalCycleDays?: number;
  /** 加速周期天数 */
  acceleratedCycleDays?: number;
  /** 进入加速模式的每日交易门槛 */
  acceleratedDailyTrades?: number;
  /** 当前生效周期天数 */
  cycleDays?: number;
  /** 每周期可解锁额度 */
  cycleUnlockAmount?: number;
  /** 当前可领取周期次数 */
  claimableCycles?: number;
  /** 当前可领取额度 */
  claimableAmount?: number;
  /** 收益分配（消费金） */
  scorePercent?: number;
  /** 收益分配（余额） */
  balancePercent?: number;
  /** 成长明细日志（按天） */
  dailyGrowthLogs?: GrowthDailyLog[];
  /** 数据加载态 */
  loading?: boolean;
  /** 已解锁次数 */
  unlockedCount?: number;
  /** 可用解锁资格 */
  availableQuota?: number;
  /** 是否可直接解锁 */
  canUnlockDirect?: boolean;
  /** 成长权益解锁中 */
  unlocking?: boolean;
  /** 切换到“旧资产解锁” */
  onSwitchToUnlock?: () => void;
  /** 成长权益达成条件后解锁一个藏品 */
  onUnlockGrowth?: () => void;
}

type GrowthStatus = 'inactive' | 'activated' | 'unlockable';

const STAGE_ROWS = [
  { icon: '🌱', label: '初级阶段', min: 1, max: 37, statusText: '未激活' },
  { icon: '🌿', label: '成长期', min: 38, max: 44, statusText: '可激活转向金' },
  { icon: '🌳', label: '成熟期', min: 45, max: 59, statusText: '可解锁资产包' },
  { icon: '🌟', label: '进阶期', min: 60, max: 89, statusText: '配资比例提升' },
  { icon: '💎', label: '高级阶段', min: 90, max: Number.POSITIVE_INFINITY, statusText: '优化配资比例' },
] as const;

const FINANCING_ROWS = [
  { min: 38, max: 59, ratio: '9:1' },
  { min: 60, max: 89, ratio: '8:2' },
  { min: 90, max: 119, ratio: '7:3' },
  { min: 120, max: Number.POSITIVE_INFINITY, ratio: '6:4' },
] as const;

const MILESTONES = [38, 45, 60, 90];

const GrowthRightsPanel: React.FC<GrowthRightsPanelProps> = ({
  growthDays = 0,
  targetDays = 45,
  pendingBalance = 0,
  dailyTrades = 1,
  financingEnabled,
  financingRatio: financingRatioProp,
  stageLabel,
  stageRightsStatus,
  stageRules,
  financingRules,
  normalCycleDays = 45,
  acceleratedCycleDays = 30,
  acceleratedDailyTrades = 3,
  cycleDays: cycleDaysProp,
  cycleUnlockAmount = 1000,
  claimableCycles = 0,
  claimableAmount = 0,
  scorePercent = 50,
  balancePercent = 50,
  dailyGrowthLogs = [],
  loading = false,
  unlockedCount = 0,
  availableQuota = 0,
  canUnlockDirect = false,
  unlocking = false,
  onSwitchToUnlock,
  onUnlockGrowth,
}) => {
  const navigate = useNavigate();
  const effectiveStageRows = useMemo(() => {
    if (!stageRules || stageRules.length === 0) {
      return STAGE_ROWS;
    }
    return stageRules.map((rule, index) => ({
      icon: STAGE_ROWS[index]?.icon ?? '⭐',
      label: rule.label,
      min: Number(rule.min_days),
      max: rule.max_days == null ? Number.POSITIVE_INFINITY : Number(rule.max_days),
      statusText: rule.rights_status,
    }));
  }, [stageRules]);

  const effectiveFinancingRows = useMemo(() => {
    if (!financingRules || financingRules.length === 0) {
      return FINANCING_ROWS;
    }
    return financingRules.map((rule) => ({
      min: Number(rule.min_days),
      max: rule.max_days == null ? Number.POSITIVE_INFINITY : Number(rule.max_days),
      ratio: rule.ratio,
    }));
  }, [financingRules]);

  const milestones = useMemo(() => {
    const stageMilestones = effectiveStageRows
      .map((row) => Number(row.min))
      .filter((day) => Number.isFinite(day) && day > 1);
    const base = stageMilestones.length > 0 ? stageMilestones : MILESTONES;
    return Array.from(new Set(base)).sort((a, b) => Number(a) - Number(b));
  }, [effectiveStageRows]);

  const safeGrowthDays = Number.isFinite(Number(growthDays)) ? Math.max(0, Number(growthDays)) : 0;
  const currentStage = useMemo(
    () => effectiveStageRows.find((stage) => safeGrowthDays >= stage.min && safeGrowthDays <= stage.max) ?? effectiveStageRows[0],
    [effectiveStageRows, safeGrowthDays],
  );
  const nextMilestone = useMemo(() => milestones.find((milestone) => safeGrowthDays < milestone) ?? null, [milestones, safeGrowthDays]);
  const activateThreshold = useMemo(() => {
    const firstRule = [...effectiveFinancingRows].sort((a, b) => a.min - b.min)[0];
    return firstRule?.min ?? 38;
  }, [effectiveFinancingRows]);
  const unlockThreshold = useMemo(() => {
    const matureStage = effectiveStageRows.find((stage) => stage.statusText.includes('解锁'));
    return matureStage?.min ?? 45;
  }, [effectiveStageRows]);

  const status: GrowthStatus = useMemo(() => {
    if (safeGrowthDays >= unlockThreshold) return 'unlockable';
    if (safeGrowthDays >= activateThreshold) return 'activated';
    return 'inactive';
  }, [activateThreshold, safeGrowthDays, unlockThreshold]);

  const progressPercent = useMemo(() => {
    if (!nextMilestone) return 100;
    const stageStart = Math.max(currentStage.min, 1);
    const stageRange = Math.max(nextMilestone - stageStart, 1);
    return Math.min(Math.max(((safeGrowthDays - stageStart) / stageRange) * 100, 0), 100);
  }, [currentStage.min, nextMilestone, safeGrowthDays]);

  const daysUntil38 = Math.max(activateThreshold - safeGrowthDays, 0);
  const hasFinancingAccess = financingEnabled ?? safeGrowthDays >= activateThreshold;
  const cycleDays = cycleDaysProp || (dailyTrades >= acceleratedDailyTrades ? acceleratedCycleDays : normalCycleDays);
  const cycleProgressDay = safeGrowthDays > 0 ? ((safeGrowthDays - 1) % cycleDays) + 1 : 0;
  const cycleProgressPercent = cycleProgressDay > 0 ? Math.min((cycleProgressDay / cycleDays) * 100, 100) : 0;

  const financingRatio = useMemo(() => {
    if (financingRatioProp) return financingRatioProp;
    for (const rule of effectiveFinancingRows) {
      if (safeGrowthDays < rule.min) continue;
      if (Number.isFinite(rule.max) && safeGrowthDays > rule.max) continue;
      return rule.ratio;
    }
    return '--';
  }, [effectiveFinancingRows, financingRatioProp, safeGrowthDays]);

  const growthProgressText = nextMilestone
    ? `距下一档(${nextMilestone}天) 还差 ${Math.max(nextMilestone - safeGrowthDays, 0)} 天`
    : '已达到最高配资档位';
  const highestMilestone = milestones.length > 0 ? milestones[milestones.length - 1] : targetDays;
  const progressTargetDays = nextMilestone ?? Math.max(targetDays, highestMilestone);

  const statusConfig = {
    inactive: {
      label: '未激活',
      color: 'text-gray-500',
      bg: 'bg-gray-100',
      border: 'border-gray-200',
    },
    activated: {
      label: '已激活',
      color: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-200',
    },
    unlockable: {
      label: '可解锁资产包',
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      border: 'border-orange-200',
    },
  };

  const currentStatus = statusConfig[status];
  const canUnlockGrowthCollectible =
    status === 'unlockable' &&
    Math.max(0, Number(claimableCycles) || 0) > 0 &&
    Number(pendingBalance) >= Number(cycleUnlockAmount);

  const openUnlockTab = () => {
    if (onSwitchToUnlock) {
      onSwitchToUnlock();
      return;
    }
    navigate('/rights');
  };

  return (
    <div className="space-y-4 pt-4">
      {loading && (
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs text-indigo-700">
          正在同步成长权益数据...
        </div>
      )}
      {/* 顶部大卡片 - 状态展示 */}
      <div className="bg-gradient-to-br from-[#4F46E5] via-[#6366F1] to-[#818CF8] rounded-3xl p-6 text-white shadow-xl shadow-indigo-200/50 relative overflow-hidden ring-1 ring-white/20">
        {/* 背景装饰 */}
        <div className="absolute top-0 right-0 p-8 opacity-[0.08] transform rotate-12 scale-150 pointer-events-none">
          <TrendingUp size={140} />
        </div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          {/* 标题 */}
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-md">
              <TrendingUp size={16} className="text-white" />
            </div>
            <span className="text-white/90 text-sm font-medium tracking-wide">成长进度</span>
          </div>

          {/* 进度条 */}
          <div className="mb-2">
            <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
              <div
                className="h-full bg-gradient-to-r from-white/90 to-white rounded-full transition-all duration-700 ease-out relative"
                style={{ width: `${progressPercent}%` }}
              >
                <div className="absolute right-0 top-0 w-3 h-3 bg-white rounded-full shadow-md shadow-white/50" />
              </div>
            </div>
          </div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-white/80 text-sm font-medium">
              <span className="text-white text-xl font-bold font-[DINAlternate-Bold]">{safeGrowthDays}</span>
              <span className="mx-1">/</span>
              <span className="text-white/70">{progressTargetDays} 天</span>
            </span>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${
              status === 'unlockable' ? 'bg-amber-400/30 text-amber-100' :
              status === 'activated' ? 'bg-emerald-400/30 text-emerald-100' :
              'bg-white/20 text-white/80'
            }`}>
              {currentStatus.label}
            </span>
          </div>
          <div className="text-[11px] text-white/80 mb-4">{growthProgressText}</div>

          {/* 待激活确权金余额 */}
          <div className="flex items-center gap-2.5 bg-black/10 px-4 py-3 rounded-xl border border-white/10 backdrop-blur-sm">
            <Lock size={16} className="text-white/90 shrink-0" />
            <div className="flex-1">
              <span className="text-xs text-white/70">当前待激活转向金（确权金）</span>
              <div className="text-lg font-bold font-[DINAlternate-Bold] text-white">
                ¥&nbsp;{Number(pendingBalance).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 当前权益快照 */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100/80">
        <div className="flex items-center mb-4 pb-3 border-b border-gray-50">
          <div className="w-1.5 h-4 bg-gradient-to-b from-[#6366F1] to-[#4F46E5] rounded-full mr-2.5" />
          <h3 className="text-gray-800 font-bold text-[15px]">当前权益快照</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-gray-100 bg-gray-50/70 px-3 py-2.5">
            <div className="text-[11px] text-gray-500">当前成长等级</div>
            <div className="mt-1 text-sm font-bold text-gray-800">
              {currentStage.icon} {stageLabel || currentStage.label}
            </div>
            {stageRightsStatus && <div className="text-[11px] text-gray-500 mt-1">{stageRightsStatus}</div>}
          </div>
          <div className="rounded-2xl border border-gray-100 bg-gray-50/70 px-3 py-2.5">
            <div className="text-[11px] text-gray-500">当前配资比例</div>
            <div className="mt-1 text-sm font-bold text-gray-800">{financingRatio}</div>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-gray-50/70 px-3 py-2.5">
            <div className="text-[11px] text-gray-500">已解锁次数</div>
            <div className="mt-1 text-sm font-bold text-gray-800">{Math.max(0, Number(unlockedCount) || 0)} 次</div>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-gray-50/70 px-3 py-2.5">
            <div className="text-[11px] text-gray-500">可用解锁资格</div>
            <div className="mt-1 text-sm font-bold text-gray-800">{Math.max(0, Number(availableQuota) || 0)} 次</div>
          </div>
        </div>
      </div>

      {/* 解锁规则说明 */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100/80">
        <div className="flex items-center mb-5 pb-3 border-b border-gray-50">
          <div className="w-1.5 h-4 bg-gradient-to-b from-[#6366F1] to-[#4F46E5] rounded-full mr-2.5" />
          <h3 className="text-gray-800 font-bold text-[15px]">解锁规则说明</h3>
        </div>

        <div className="space-y-3">
          {/* 稳健成长模式 */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#F0FDF4] to-[#FAFFF5] border border-green-100/80 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-green-100/40 rounded-bl-[3rem] -mr-4 -mt-4" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck size={18} className="text-green-600" />
                <span className="text-green-800 font-bold text-sm">稳健成长模式</span>
              </div>
              <div className="space-y-1.5 text-xs text-green-700/80 ml-6.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-1 h-1 bg-green-400 rounded-full shrink-0" />
                  <span>每日 <span className="font-bold text-green-700">1</span> 次交易</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1 h-1 bg-green-400 rounded-full shrink-0" />
                  <span>
                    连续 <span className="font-bold text-green-700">{normalCycleDays}</span> 天解锁{' '}
                    <span className="font-bold text-green-700">{cycleUnlockAmount}</span> 额度
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 加速成长模式 */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#FFF7ED] to-[#FFFBF5] border border-orange-100/80 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-orange-100/40 rounded-bl-[3rem] -mr-4 -mt-4" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={18} className="text-orange-600" />
                <span className="text-orange-800 font-bold text-sm">加速成长模式</span>
              </div>
              <div className="space-y-1.5 text-xs text-orange-700/80 ml-6.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-1 h-1 bg-orange-400 rounded-full shrink-0" />
                  <span>每日 <span className="font-bold text-orange-700">{acceleratedDailyTrades}</span> 次交易</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1 h-1 bg-orange-400 rounded-full shrink-0" />
                  <span>连续 <span className="font-bold text-orange-700">{acceleratedCycleDays}</span> 天即可解锁</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-gray-600">当前统计模式：{dailyTrades >= 3 ? '30 天加速周期' : '45 天稳健周期'}</span>
              <span className="text-gray-800 font-semibold">{cycleProgressDay}/{cycleDays}</span>
            </div>
            <div className="w-full h-2 bg-white rounded-full overflow-hidden border border-gray-100">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-500" style={{ width: `${cycleProgressPercent}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* 配资权限 */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100/80">
        <div className="flex items-center mb-5 pb-3 border-b border-gray-50">
          <div className="w-1.5 h-4 bg-gradient-to-b from-[#6366F1] to-[#4F46E5] rounded-full mr-2.5" />
          <h3 className="text-gray-800 font-bold text-[15px]">配资权限</h3>
        </div>

        {hasFinancingAccess ? (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#F0FDF4] to-[#FAFFF5] border border-green-200/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Unlock size={20} className="text-green-600" />
              </div>
              <div className="flex-1">
                <div className="text-green-800 font-bold text-sm">数字流量池配资已开启</div>
                <div className="text-xs text-green-600/80 mt-0.5">
                  当前比例 <span className="font-bold text-green-700">{financingRatio}</span>
                </div>
              </div>
              <div className="bg-green-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                已开启
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-50/50 border border-gray-200/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <Lock size={20} className="text-gray-400" />
              </div>
              <div className="flex-1">
                <div className="text-gray-700 font-bold text-sm">数字流量池申购配资权限未开启</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  还需成长 <span className="font-bold text-orange-600">{daysUntil38}</span> 天（达到 {activateThreshold} 天）
                </div>
              </div>
              <div className="bg-gray-200 text-gray-500 text-[10px] font-bold px-2.5 py-1 rounded-full">
                未开启
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 成长明细日志 */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100/80">
        <div className="flex items-center mb-4 pb-3 border-b border-gray-50">
          <div className="w-1.5 h-4 bg-gradient-to-b from-[#6366F1] to-[#4F46E5] rounded-full mr-2.5" />
          <h3 className="text-gray-800 font-bold text-[15px]">成长明细日志（最近30天）</h3>
        </div>

        {dailyGrowthLogs.length > 0 ? (
          <div className="max-h-80 overflow-y-auto rounded-2xl border border-gray-100 divide-y divide-gray-100">
            {dailyGrowthLogs.map((log) => (
              <div key={log.date} className="px-3 py-2.5">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-semibold text-gray-800">{log.date}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    log.counted ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {log.counted ? '已计入' : '未计入'}
                  </span>
                </div>
                <div className="text-[11px] text-gray-500 mb-0.5">有效交易：{Math.max(0, Number(log.trade_count) || 0)} 笔</div>
                <div className="text-xs text-gray-700">{log.reason || '无说明'}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-100 bg-gray-50/70 px-3 py-4 text-xs text-gray-500">
            暂无成长明细日志
          </div>
        )}
      </div>

      {/* 成长权益与配资说明 */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100/80">
        <div className="flex items-center mb-5 pb-3 border-b border-gray-50">
          <div className="w-1.5 h-4 bg-gradient-to-b from-[#6366F1] to-[#4F46E5] rounded-full mr-2.5" />
          <h3 className="text-gray-800 font-bold text-[15px]">成长权益与配资说明</h3>
        </div>

        <div className="space-y-5">
          <section>
            <h4 className="text-sm font-bold text-gray-800 mb-2">一、成长等级说明</h4>
            <div className="overflow-hidden rounded-xl border border-gray-100">
              <div className="grid grid-cols-3 bg-gray-50 text-[11px] font-bold text-gray-600 px-3 py-2">
                <span>等级</span>
                <span>成长天数</span>
                <span>权益状态</span>
              </div>
              <div className="divide-y divide-gray-100 text-xs text-gray-700">
                {effectiveStageRows.map((row) => {
                  const isCurrent = safeGrowthDays >= row.min && safeGrowthDays <= row.max;
                  const dayText = Number.isFinite(row.max) ? `${row.min}-${row.max} 天` : `≥${row.min} 天`;

                  return (
                    <div
                      key={row.label}
                      className={`grid grid-cols-3 px-3 py-2.5 ${isCurrent ? 'bg-indigo-50/70 font-semibold text-indigo-700' : ''}`}
                    >
                      <span>{row.icon} {row.label}</span>
                      <span>{dayText}</span>
                      <span>{row.statusText}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <p className="text-[11px] text-gray-500 mt-2">成长等级自动升级，无需申请。</p>
          </section>

          <section>
            <h4 className="text-sm font-bold text-gray-800 mb-2">二、不同等级配资比例</h4>
            <div className="overflow-hidden rounded-xl border border-gray-100">
              <div className="grid grid-cols-2 bg-gray-50 text-[11px] font-bold text-gray-600 px-3 py-2">
                <span>成长天数</span>
                <span>配资比例</span>
              </div>
              <div className="divide-y divide-gray-100 text-xs text-gray-700">
                {effectiveFinancingRows.map((row) => {
                  const inTier = safeGrowthDays >= row.min && safeGrowthDays <= row.max;
                  const dayText = Number.isFinite(row.max) ? `${row.min}-${row.max} 天` : `≥${row.min} 天`;

                  return (
                    <div
                      key={`${row.min}-${row.max}`}
                      className={`grid grid-cols-2 px-3 py-2.5 ${inTier ? 'bg-emerald-50/80 text-emerald-700 font-semibold' : ''}`}
                    >
                      <span>{dayText}</span>
                      <span className="font-semibold">{row.ratio}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mt-2 space-y-1 text-[11px] text-gray-500">
              <p>说明：比例仅代表资金结构分配方式。</p>
              <p>说明：仅限数字流量池开放。</p>
              <p>说明：实际参与资格以系统提示为准。</p>
            </div>
          </section>

          <section>
            <h4 className="text-sm font-bold text-gray-800 mb-2">三、周期藏品发放规则</h4>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3 text-xs text-gray-700 space-y-1.5">
              <p>
                达到解锁条件后，每完成一个成长周期（{normalCycleDays} 天或 {acceleratedCycleDays} 天加速模式），系统可解锁 {cycleUnlockAmount} 额度。
              </p>
              <p>每周期可参与一次藏品发放，每周期最多发放 1 个藏品。当前可领取周期：{Math.max(0, claimableCycles)} 次。</p>
              <p>当前可领取额度：{Number(claimableAmount).toFixed(0)}。</p>
              <p>未达周期不可提前领取，每个周期独立计算。</p>
            </div>
          </section>

          <section>
            <h4 className="text-sm font-bold text-gray-800 mb-2">四、收益分配说明</h4>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3 text-xs text-gray-700 space-y-1.5">
              <p>
                通过成长权益获得的藏品，收益按 {scorePercent}% 消费金 + {balancePercent}% 余额分配。
              </p>
              <p>分配方式自动执行，本金及周期说明以具体藏品规则为准。</p>
            </div>
          </section>

          <section>
            <h4 className="text-sm font-bold text-gray-800 mb-2">五、成长节奏说明</h4>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3 text-xs text-gray-700 space-y-1.5">
              <p>每日完成有效交易可累计成长，未参与交易可能影响成长连续性。</p>
              <p>成长记录以系统统计为准。</p>
            </div>
          </section>

          <section>
            <h4 className="text-sm font-bold text-gray-800 mb-2">六、适用范围与资格</h4>
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3 text-xs text-gray-700 space-y-1.5">
              <p>配资权益仅在数字流量池开放时生效，其他场景不适用。</p>
              <p>是否可参与以系统实时资格校验为准。</p>
              <p>当前可解锁状态：{canUnlockDirect ? '已满足，可立即解锁资产包' : '未满足，需继续累积成长'}。</p>
            </div>
          </section>

          <section>
            <h4 className="text-sm font-bold text-gray-800 mb-2">七、风险提示</h4>
            <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-3 text-xs text-amber-800 space-y-1.5">
              <p>成长权益不构成收益承诺。</p>
              <p>配资比例不等于收益保证，请根据自身情况理性参与。</p>
              <p>平台有权根据运营情况调整比例。</p>
            </div>
          </section>
        </div>
      </div>

      {/* 底部按钮区 */}
      <div className="pb-4">
        {status === 'inactive' && (
          <button
            onClick={() => navigate('/market')}
            className="w-full py-4 rounded-full text-base font-bold text-white shadow-xl bg-gradient-to-r from-[#4F46E5] via-[#6366F1] to-[#818CF8] shadow-indigo-300/40 active:scale-[0.98] transition-all relative overflow-hidden group"
          >
            <div className="absolute top-0 left-0 w-full h-full bg-white/20 -translate-x-full group-hover:animate-[shimmer_1s_infinite] pointer-events-none" />
            <span className="flex items-center justify-center gap-2">
              去交易完成今日成长
              <ArrowRight size={18} />
            </span>
          </button>
        )}

        {status === 'activated' && (
          <button
            onClick={() => navigate('/market')}
            className="w-full py-4 rounded-full text-base font-bold text-white shadow-xl bg-gradient-to-r from-[#059669] via-[#10B981] to-[#34D399] shadow-emerald-300/40 active:scale-[0.98] transition-all relative overflow-hidden group"
          >
            <div className="absolute top-0 left-0 w-full h-full bg-white/20 -translate-x-full group-hover:animate-[shimmer_1s_infinite] pointer-events-none" />
            <span className="flex items-center justify-center gap-2">
              继续成长冲刺 45 天
              <ArrowRight size={18} />
            </span>
          </button>
        )}

        {status === 'unlockable' && (
          <button
            onClick={canUnlockGrowthCollectible && onUnlockGrowth ? onUnlockGrowth : openUnlockTab}
            disabled={unlocking}
            className={`w-full py-4 rounded-full text-base font-bold text-white shadow-xl active:scale-[0.98] transition-all relative overflow-hidden group ${
              unlocking
                ? 'bg-gray-300 text-white shadow-none cursor-not-allowed'
                : 'bg-gradient-to-r from-[#FF6B00] via-[#FF5E62] to-[#FF4500] shadow-orange-300/40'
            }`}
          >
            <div className="absolute top-0 left-0 w-full h-full bg-white/20 -translate-x-full group-hover:animate-[shimmer_1s_infinite] pointer-events-none" />
            <span className="flex items-center justify-center gap-2">
              {unlocking
                ? '正在解锁...'
                : canUnlockGrowthCollectible
                ? '立即解锁一个藏品'
                : canUnlockDirect
                ? '立即解锁资产包'
                : '查看解锁条件'}
              <ArrowRight size={18} />
            </span>
          </button>
        )}
      </div>
    </div>
  );
};

export default GrowthRightsPanel;
