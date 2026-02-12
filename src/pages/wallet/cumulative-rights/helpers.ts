import {
  Award,
  CalendarCheck,
  Coins,
  Gift,
  MoreHorizontal,
  Pickaxe,
  ShieldCheck,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react'
import type { AccountBalanceInfo, AccountIncomeInfo, CollectionInfo } from '@/services/wallet'
import { formatAmount } from '@/utils/format'
import type { BalanceCardItem, CollectionStatItem, FundExplanationItem, IncomeCardItem } from './types'

export function createBalanceData(balance: AccountBalanceInfo | null): BalanceCardItem[] {
  return [
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
  ]
}

export function createIncomeData(income: AccountIncomeInfo | null): IncomeCardItem[] {
  return [
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
  ]
}

export function createCollectionStats(collection: CollectionInfo | null): CollectionStatItem[] {
  return [
    { label: '藏品总数', value: collection?.total_count || 0, unit: '件' },
    { label: '持有中', value: collection?.holding_count || 0, unit: '件' },
    { label: '寄售中', value: collection?.consigning_count || 0, unit: '件' },
    { label: '已售出', value: collection?.sold_count || 0, unit: '件' },
    { label: '矿机数量', value: collection?.mining_count || 0, unit: '台' },
  ]
}

export const FUND_EXPLANATIONS: FundExplanationItem[] = [
  { dotColorClass: 'bg-blue-500', text: '总资产：显示值为所有账户（专项金+可提现+消费金+确权金）之和，仅供展示。' },
  { dotColorClass: 'bg-indigo-500', text: '专项金：主要用于购买藏品，优先扣除。' },
  { dotColorClass: 'bg-red-500', text: '可提现：所有的成交回款、分红收益、现金奖励均进入此账户，可直接提现。' },
  { dotColorClass: 'bg-green-500', text: '确权金：用于支付寄售手续费，可由其他账户划转，不可逆。' },
]
