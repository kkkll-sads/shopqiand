import React from 'react';

interface LeaderboardStatsProps {
    participantCount: number;
    myRank: number;
}

const LeaderboardStats: React.FC<LeaderboardStatsProps> = ({ participantCount, myRank }) => {
    return (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-red-50 flex justify-between items-center text-center">
            <div className="flex-1 border-r border-gray-100">
                <div className="text-xs text-gray-400 mb-1">截止时间</div>
                <div className="text-sm font-bold text-gray-800">02.15 24:00</div>
            </div>
            <div className="flex-1 border-r border-gray-100">
                <div className="text-xs text-gray-400 mb-1">已参与团队</div>
                <div className="text-sm font-bold text-gray-800">{participantCount}</div>
            </div>
            <div className="flex-1">
                <div className="text-xs text-gray-400 mb-1">我的排名</div>
                <div className={`text-sm font-bold ${myRank > 0 && myRank <= 50 ? 'text-red-500' : 'text-gray-800'}`}>
                    {myRank > 0 ? `第 ${myRank} 名` : '未上榜'}
                </div>
            </div>
        </div>
    );
};

export default LeaderboardStats;
