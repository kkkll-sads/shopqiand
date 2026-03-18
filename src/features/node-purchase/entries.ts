import { ShieldCheck, Zap, type LucideIcon } from 'lucide-react';
import type { GenesisNodeActivity } from '../../api/modules/genesisNode';
import { getGenesisActivityPhase } from './genesis';

export interface NodePurchaseEntry {
  badge: string;
  coverLabel: string;
  description: string;
  detailTarget: string;
  footerText: string;
  homeCta: string;
  homeMeta: string;
  homeMetaClassName: string;
  homeTarget: string;
  icon: LucideIcon;
  iconClassName: string;
  iconPanelClassName: string;
  id: string;
  pageActionText: string;
  pageTarget: string;
  primaryMetricLabel: string;
  primaryMetricValue: string;
  purchaseTimeText: string;
  secondaryMetricLabel: string;
  secondaryMetricValue: string;
  statusText: string;
  title: string;
}

function trimTimeLabel(value: string, fallback: string): string {
  if (!value) {
    return fallback;
  }

  return value.length >= 5 ? value.slice(0, 5) : value;
}

export function buildGenesisNodeEntry(activity?: GenesisNodeActivity | null): NodePurchaseEntry {
  const phase = getGenesisActivityPhase(activity);
  const rushStartTime = trimTimeLabel(activity?.rushStartTime ?? '', '17:00');
  const drawTime = trimTimeLabel(activity?.drawTime ?? '', '20:00');

  const statusText = !activity
    ? '待配置'
    : phase === 'upcoming'
      ? '未开抢'
      : phase === 'selling'
        ? '抢购中'
        : phase === 'drawing'
          ? '待开奖'
          : '已开奖';

  const homeMeta = !activity
    ? '等待后台配置活动'
    : phase === 'selling'
      ? `当日限额 ${activity.displayTotalQuota} 份`
      : phase === 'upcoming'
        ? `${rushStartTime} 准时开抢`
        : phase === 'drawing'
          ? `${drawTime} 正在开奖`
          : '中签后直转权益节点';

  const homeCta = phase === 'selling' ? '进入抢购' : phase === 'settled' ? '查看记录' : '查看活动';
  const pageActionText = phase === 'selling' ? '抢购' : '查看';

  return {
    id: 'genesis-node',
    title: activity?.name || '创世共识节点认购',
    coverLabel: activity?.title || '创世共识池',
    description: '每日 17:00 开抢，20:00 开奖，中签后直转权益节点，不走寄售路径',
    badge: '限额',
    detailTarget: 'genesis_node_activity',
    footerText: activity
      ? `当日限额：${activity.displayTotalQuota} 份`
      : '固定金额档：1000 / 2000 / 3000 / 4000 / 5000',
    homeCta,
    homeMeta,
    homeMetaClassName: phase === 'selling'
      ? 'text-[#ff5656]'
      : phase === 'drawing'
        ? 'text-[#ffb347] dark:text-[#ffcf72]'
        : 'text-[#ffe28a]',
    homeTarget: phase === 'settled' ? 'my_genesis_nodes' : 'genesis_node_activity',
    icon: ShieldCheck,
    iconPanelClassName: 'bg-gradient-to-br from-[#f7db57] via-[#e2bc34] to-[#c89415]',
    iconClassName: 'text-[#111111]',
    pageActionText,
    pageTarget: phase === 'settled' ? 'my_genesis_nodes' : 'genesis_node_activity',
    primaryMetricLabel: '固定金额',
    primaryMetricValue: '1000-5000',
    purchaseTimeText: `每日 ${rushStartTime} 开抢 · ${drawTime} 开奖`,
    secondaryMetricLabel: '支付方式',
    secondaryMetricValue: activity?.payRatio ? `混合支付 ${activity.payRatio}` : '混合支付 9:1',
    statusText,
  };
}

export const BASE_NODE_PURCHASE_ENTRIES: NodePurchaseEntry[] = [
  {
    id: 'node-amplify-card',
    title: '节点赋能卡抢购',
    coverLabel: '节点增益池',
    description: '绑定权益节点后即时生效，专项金通道已开放',
    badge: '热销',
    detailTarget: 'my_card_packs',
    footerText: '专项金通道已开放',
    homeCta: '立即抢购',
    homeMeta: '',
    homeMetaClassName: '',
    homeTarget: 'my_card_packs',
    icon: Zap,
    iconPanelClassName: 'bg-gradient-to-br from-[#94d8ff] via-[#4ba8ff] to-[#216bff]',
    iconClassName: 'text-white',
    pageActionText: '抢购',
    pageTarget: 'my_card_packs',
    primaryMetricLabel: '抢购价',
    primaryMetricValue: '298.00',
    purchaseTimeText: '2026-03-18 21:00:00',
    secondaryMetricLabel: '市场价',
    secondaryMetricValue: '329.00',
    statusText: '抢购中',
  },
];
