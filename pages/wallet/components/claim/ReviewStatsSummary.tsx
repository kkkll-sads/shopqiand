import React from 'react';
import { BarChart2, Clock, CheckCircle2 } from 'lucide-react';

type ReviewStats = {
  pending_count: number;
  approved_count: number;
  isLoading: boolean;
};

interface ReviewStatsSummaryProps {
  reviewStats: ReviewStats;
  onNavigateHistory?: () => void;
}

const ReviewStatsSummary: React.FC<ReviewStatsSummaryProps> = ({ reviewStats, onNavigateHistory }) => {
  const { pending_count, approved_count, isLoading } = reviewStats;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#FFE4C4]/60 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-[#333333] font-bold">
          <BarChart2 size={18} className="text-[#FF6B00]" />
          审核概览
        </div>
        <button
          className="text-sm text-[#FF4500] font-medium hover:text-[#E63E00]"
          onClick={onNavigateHistory}
        >
          查看历史
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-[#FFF8F0] border border-[#FFE4C4] p-3 flex items-center justify-between">
          <div>
            <div className="text-xs text-[#8B4513]/70">审核中</div>
            <div className="text-2xl font-bold text-[#FF6B00]">{isLoading ? '--' : pending_count}</div>
          </div>
          <Clock size={22} className="text-[#FF6B00]" />
        </div>
        <div className="rounded-xl bg-[#F2FFFA] border border-[#B8EEDC] p-3 flex items-center justify-between">
          <div>
            <div className="text-xs text-[#0F5132]/70">已通过</div>
            <div className="text-2xl font-bold text-[#0F5132]">{isLoading ? '--' : approved_count}</div>
          </div>
          <CheckCircle2 size={22} className="text-[#0F5132]" />
        </div>
      </div>
    </div>
  );
};

export default ReviewStatsSummary;

