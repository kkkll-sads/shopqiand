/**
 * poolConfig - 资产池主题配置工具
 */
import { Globe, Coins, Gem, Award } from 'lucide-react';
import { TradingSession } from '../hooks/useTradingZone';

export const POOL_THEME_PRESETS: Record<string, any> = {
  morning: {
    code: 'Pool-A',
    name: '数字鲁商资产池',
    subName: '山东产业带数字化营销权益',
    roi: '+5.5%',
    quota: '100万',
    icon: Globe,
    themeColor: 'text-blue-600',
    gradient: 'from-blue-600 to-cyan-500',
    softBg: 'bg-blue-50',
    dataBg: 'bg-[#F0F7FF]',
    buttonClass: 'bg-gradient-to-r from-blue-600 to-cyan-600 shadow-blue-200',
  },
  afternoon: {
    code: 'Pool-B',
    name: '助农供应链资产池',
    subName: '优质果蔬集群应收账款确权',
    roi: '+8.2%',
    quota: '500万',
    icon: Coins,
    themeColor: 'text-red-600',
    gradient: 'from-red-500 to-red-600',
    softBg: 'bg-red-50',
    dataBg: 'bg-[#FFF5F5]',
    buttonClass: 'bg-gradient-to-r from-red-500 to-red-600 shadow-red-200',
  },
  evening: {
    code: 'Pool-C',
    name: '林业碳汇权益池',
    subName: '林业碳汇数据资产映射',
    roi: '+12.0%',
    quota: '200万',
    icon: Gem,
    themeColor: 'text-emerald-600',
    gradient: 'from-emerald-600 to-teal-600',
    softBg: 'bg-emerald-50',
    dataBg: 'bg-[#F0FDF4]',
    buttonClass: 'bg-gradient-to-r from-emerald-600 to-teal-500 shadow-emerald-200',
  },
  default: {
    code: 'D-Asset',
    name: '新手体验试炼场',
    subName: '虚拟资产确权体验专区',
    roi: '+3.0%',
    quota: '不限',
    icon: Award,
    themeColor: 'text-purple-600',
    gradient: 'from-purple-600 to-pink-500',
    softBg: 'bg-purple-50',
    dataBg: 'bg-[#FAF5FF]',
    buttonClass: 'bg-gradient-to-r from-purple-600 to-pink-500 shadow-purple-200',
  }
};

export const getPoolType = (startTime: string) => {
  const hour = parseInt(startTime.split(':')[0]);
  if (hour >= 9 && hour < 12) return 'morning';
  if (hour >= 13 && hour < 16) return 'afternoon';
  if (hour >= 18 && hour < 21) return 'evening';
  return 'default';
};

export const buildPoolConfig = (session?: TradingSession | null) => {
  const poolType = session ? getPoolType(session.startTime) : 'default';
  const preset = POOL_THEME_PRESETS[poolType] || POOL_THEME_PRESETS.default;
  return {
    ...preset,
    name: session?.title || preset.name,
    subName: session ? `${session.startTime} - ${session.endTime}` : preset.subName,
    roi: (session as any)?.roi || preset.roi,
    quota: (session as any)?.quota || preset.quota,
    code: (session as any)?.code || preset.code,
  };
};

export const formatDuration = (ms: number) => {
  if (ms < 0) return "00:00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};
