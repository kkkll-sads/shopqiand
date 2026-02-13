import React from 'react';
import { MyTeamStatus } from '../mockData';
import { ChevronRight, Trophy } from 'lucide-react';

interface MyTeamCardProps {
    status: MyTeamStatus;
}

const MyTeamCard: React.FC<MyTeamCardProps> = ({ status }) => {
    const isRanked = status.rank > 0 && status.rank <= 50;

    return (
        <div className="bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] p-4 pb-safe-offset-4">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                        <Trophy size={16} />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-gray-900">我的团队</div>
                        <div className="text-xs text-gray-500">
                            {isRanked
                                ? `当前排名第 ${status.rank} 名，请保持活跃`
                                : `距离入榜还差 ${status.gap_to_top50} 活跃值`
                            }
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-lg font-black text-red-600 font-[DINAlternate-Bold]">
                        {status.active_score.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-gray-400">当前活跃值</div>
                </div>
            </div>

            <button className="w-full py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-bold rounded-lg shadow-lg shadow-red-100 active:scale-[0.99] transition-transform flex items-center justify-center gap-1">
                提升活跃值
                <ChevronRight size={14} />
            </button>
        </div>
    );
};

export default MyTeamCard;
