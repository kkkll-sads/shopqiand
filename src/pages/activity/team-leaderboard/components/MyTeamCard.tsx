import React from 'react';
import { ChevronRight, Trophy } from 'lucide-react';
import type { ActiveRankMyData } from '@/services/activeRank';

interface MyTeamCardProps {
    status: ActiveRankMyData;
    onAction?: () => void;
}

const MyTeamCard: React.FC<MyTeamCardProps> = ({ status, onAction }) => {
    const isRanked = status.rank > 0 && status.rank <= 50;

    return (
        <div className="bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] px-3 py-2.5 pb-safe-offset-3">
            <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                        <Trophy size={14} />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-gray-900">我的团队</div>
                        <div className="text-[11px] text-gray-500">
                            {isRanked
                                ? `当前排名第 ${status.rank} 名`
                                : '当前未进入前50榜单'
                            }
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-[17px] font-black text-red-600 font-[DINAlternate-Bold] leading-none">
                        {(Number(status.contribution_value) || 0).toLocaleString('zh-CN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })}
                    </div>
                    <div className="text-[10px] text-gray-400">当前贡献值</div>
                </div>
            </div>

            <button
                onClick={onAction}
                className="w-full py-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-bold rounded-lg shadow-lg shadow-red-100 active:scale-[0.99] transition-transform flex items-center justify-center gap-1"
            >
                查看我的团队
                <ChevronRight size={14} />
            </button>
        </div>
    );
};

export default MyTeamCard;
