import React from 'react';
import { TeamRankItem } from '../mockData';
import LeaderboardItem from './LeaderboardItem';

interface LeaderboardListProps {
    items: TeamRankItem[];
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-safe-offset-24">
            {items.map((item) => (
                <LeaderboardItem key={item.rank} item={item} />
            ))}
        </div>
    );
};

export default LeaderboardList;
