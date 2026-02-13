import React from 'react';

interface LeaderboardStatsProps {
    endTime: number;
    rankedCount: number;
    myRank: number;
    updatedAt: number;
}

const formatTime = (timestamp: number): string => {
    if (!timestamp) return '--';
    const date = new Date(timestamp * 1000);
    if (Number.isNaN(date.getTime())) return '--';

    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${month}.${day} ${hours}:${minutes}`;
};

const LeaderboardStats: React.FC<LeaderboardStatsProps> = ({ endTime, rankedCount, myRank, updatedAt }) => {
    return (
        <div className="bg-white rounded-lg px-3 py-2.5 shadow-sm border border-red-50">
            <div className="flex justify-between items-center text-center">
                <div className="flex-1 border-r border-gray-100">
                    <div className="text-[11px] text-gray-400 mb-0.5">截止时间</div>
                    <div className="text-[13px] font-bold text-gray-800">{formatTime(endTime)}</div>
                </div>
                <div className="flex-1 border-r border-gray-100">
                    <div className="text-[11px] text-gray-400 mb-0.5">榜单名额</div>
                    <div className="text-[13px] font-bold text-gray-800">50</div>
                </div>
                <div className="flex-1">
                    <div className="text-[11px] text-gray-400 mb-0.5">我的排名</div>
                    <div className={`text-[13px] font-bold ${myRank > 0 && myRank <= 50 ? 'text-red-500' : 'text-gray-800'}`}>
                        {myRank > 0 ? `第 ${myRank} 名` : '未上榜'}
                    </div>
                </div>
            </div>
            <div>
                <div className="mt-2 pt-2 border-t border-gray-100 text-[10px] text-gray-500 flex justify-between">
                    <span>已上榜团队：{rankedCount}</span>
                    <span>更新时间：{formatTime(updatedAt)}</span>
                </div>
            </div>
        </div>
    );
};

export default LeaderboardStats;
