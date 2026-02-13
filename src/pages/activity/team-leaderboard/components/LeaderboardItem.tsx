import React from 'react';
import { Medal } from 'lucide-react';
import type { ActiveRankTopItem } from '@/services/activeRank';

interface LeaderboardItemProps {
    item: ActiveRankTopItem;
}

const formatContribution = (value: number): string => {
    const amount = Number(value || 0);
    return amount.toLocaleString('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

const getRewardLabel = (item: ActiveRankTopItem): string => {
    if (item.reward_tier === 1) return '封顶3000';
    if (item.reward_tier === 2) return '封顶2500';
    if (item.reward_tier === 3) return '封顶2000';
    if (item.reward_label) {
        const amountMatch = item.reward_label.match(/(\d{3,5})/);
        if (amountMatch) {
            return `封顶${amountMatch[1]}`;
        }
        return item.reward_label.replace('团建报销', '').trim() || '-';
    }
    switch (item.reward_tier) {
        default:
            return '-';
    }
};

const getRewardStyle = (tier: number): string => {
    switch (tier) {
        case 1:
            return 'text-amber-700 bg-amber-50 border-amber-200';
        case 2:
            return 'text-orange-700 bg-orange-50 border-orange-200';
        case 3:
            return 'text-lime-700 bg-lime-50 border-lime-200';
        default:
            return 'text-gray-500 bg-gray-50 border-gray-200';
    }
};

const RankCell: React.FC<{ rank: number }> = ({ rank }) => {
    if (rank === 1) return <Medal size={18} className="mx-auto text-yellow-500 fill-yellow-100" />;
    if (rank === 2) return <Medal size={18} className="mx-auto text-gray-400 fill-gray-100" />;
    if (rank === 3) return <Medal size={18} className="mx-auto text-amber-700 fill-amber-100" />;
    return <span className="text-[13px] font-semibold text-gray-700">{rank}</span>;
};

const LeaderboardItem: React.FC<LeaderboardItemProps> = ({ item }) => {
    const rewardLabel = getRewardLabel(item);

    return (
        <div className="grid grid-cols-[44px_minmax(0,1fr)_88px_74px] items-center gap-1 px-1.5 py-2.5 border-b border-gray-50 last:border-none">
            <div className="text-center">
                <RankCell rank={item.rank} />
            </div>
            <div className="min-w-0">
                <div className="truncate text-[13px] font-bold text-gray-900">{item.team_name}</div>
            </div>
            <div className="text-center text-[12px] font-black text-gray-900 font-[DINAlternate-Bold] whitespace-nowrap">
                {formatContribution(item.contribution_value)}
            </div>
            <div className="text-right">
                <span
                    className={`inline-flex items-center rounded-md border px-1 py-0.5 text-[10px] font-semibold whitespace-nowrap ${getRewardStyle(item.reward_tier)}`}
                >
                    {rewardLabel}
                </span>
            </div>
        </div>
    );
};

export default LeaderboardItem;
