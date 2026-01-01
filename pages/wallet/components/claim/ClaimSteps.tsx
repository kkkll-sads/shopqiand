import React from 'react';
import { Check } from 'lucide-react';

type ReviewStats = {
  pending_count: number;
  approved_count: number;
  isLoading: boolean;
};

interface ClaimStepsProps {
  reviewStats: ReviewStats;
}

const ClaimSteps: React.FC<ClaimStepsProps> = ({ reviewStats }) => {
  const steps = [
    { label: '实名认证', status: 'done' as const },
    { label: '上传凭证', status: 'active' as const },
    {
      label: '等待审核',
      status: reviewStats.pending_count > 0 ? ('active' as const) : ('wait' as const),
    },
    {
      label: '确权成功',
      status: reviewStats.approved_count > 0 ? ('done' as const) : ('wait' as const),
    },
  ];

  return (
    <div className="bg-[#FFF8F0] py-4 mb-2">
      <div className="flex items-center justify-between relative px-4">
        <div className="absolute top-3 left-8 right-8 h-[3px] bg-[#FFE4C4] -z-10 rounded-full"></div>
        {steps.map((s, idx) => (
          <div key={idx} className="flex flex-col items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full border-[3px] flex items-center justify-center z-10 bg-[#FFF8F0] shadow-sm transition-colors duration-300
                ${s.status === 'done'
                  ? 'border-[#FF6B00] bg-[#FF6B00]'
                  : s.status === 'active'
                    ? 'border-[#FF6B00] ring-2 ring-[#FF6B00]/20'
                    : 'border-[#E0E0E0]'}
             `}
            >
              {s.status === 'done' && <Check size={14} className="text-white" strokeWidth={3} />}
              {s.status === 'active' && <div className="w-2.5 h-2.5 rounded-full bg-[#FF6B00]"></div>}
            </div>
            <span
              className={`text-xs font-medium scale-90 ${s.status === 'active'
                ? 'text-[#FF4500]'
                : s.status === 'done'
                  ? 'text-[#8B4513]'
                  : 'text-[#BBBBBB]'
                }`}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClaimSteps;

