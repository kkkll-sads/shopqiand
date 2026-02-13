import React from 'react';
import { TeamRankItem } from '../mockData';
import { Minus, TrendingDown, TrendingUp, Medal } from 'lucide-react';

interface LeaderboardItemProps {
    item: TeamRankItem;
}

const LeaderboardItem: React.FC<LeaderboardItemProps> = ({ item }) => {
    const isTop3 = item.rank <= 3;

    // Reward label based on tier
    const getRewardLabel = (tier: number) => {
        switch (tier) {
            case 1: return '封顶3000';
            case 2: return '封顶2500';
            case 3: return '封顶2000';
            default: return '';
        }
    };

    return (
        <div className={`flex items-center justify-between p-4 border-b border-gray-50 last:border-none ${isTop3 ? 'bg-gradient-to-r from-yellow-50/50 to-white' : ''
            }`}>
            <div className="flex items-center gap-3 flex-1">
                <div className="w-8 flex justify-center flex-shrink-0">
                    {item.rank === 1 && <Medal size={24} className="text-yellow-500 fill-yellow-100" />}
                    {item.rank === 2 && <Medal size={24} className="text-gray-400 fill-gray-100" />}
                    {item.rank === 3 && <Medal size={24} className="text-amber-700 fill-amber-100" />}
                    {item.rank > 3 && (
                        <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-xs font-bold flex items-center justify-center">
                            {item.rank}
                        </span>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900 truncate">
                            {item.team_name}
                        </span>
                        {item.leader_name && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">
                                {item.leader_name}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="text-right flex flex-col items-end">
                <div className="text-base font-black text-gray-900 font-[DINAlternate-Bold]">
                    {item.active_score.toLocaleString()}
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-amber-600 bg-amber-50 px-1 py-0.5 rounded border border-amber-100">
                        团建{getRewardLabel(item.reward_tier)}
                    </span>

                    {/* Rank Change Indicator */}
                    {item.rank_change !== 0 ? (
                        <div className={`flex items-center text-[10px] font-medium ${item.rank_change > 0 ? 'text-red-500' : 'text-green-500'
                            }`}>
                            {item.rank_change > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                            {Math.abs(item.rank_change)}
                        </div>
                    ) : (
                        <div className="text-gray-300">
                            <Minus size={10} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LeaderboardItem;
