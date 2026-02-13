import React from 'react';
import type { ActiveRankTopItem } from '@/services/activeRank';
import LeaderboardItem from './LeaderboardItem';

interface LeaderboardListProps {
    items: ActiveRankTopItem[];
    loading: boolean;
}

const LeaderboardList: React.FC<LeaderboardListProps> = ({ items, loading }) => {
    if (loading && items.length === 0) {
        return <div className="py-20 text-center text-gray-400 text-sm">加载中...</div>;
    }

    if (items.length === 0) {
        return <div className="py-20 text-center text-gray-400 text-sm">暂无榜单数据</div>;
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mb-safe-offset-20">
            <div className="grid grid-cols-[44px_minmax(0,1fr)_88px_74px] items-center gap-1 px-1.5 py-1.5 bg-gray-50 border-b border-gray-100 text-[11px] font-semibold text-gray-500">
                <div className="text-center whitespace-nowrap">排名</div>
                <div className="truncate whitespace-nowrap">团队名称</div>
                <div className="text-center whitespace-nowrap">贡献值</div>
                <div className="text-right whitespace-nowrap">奖励</div>
            </div>
            {items.map((item) => (
                <LeaderboardItem key={item.team_id || item.rank} item={item} />
            ))}
        </div>
    );
};

export default LeaderboardList;
