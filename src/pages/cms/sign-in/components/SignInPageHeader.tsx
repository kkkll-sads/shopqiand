import React from 'react';
import { ChevronLeft } from 'lucide-react';

interface SignInPageHeaderProps {
  activityName: string;
  startTime?: string;
  endTime?: string;
  onBack: () => void;
}

const formatDateText = (value?: string, fallback = '') => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback || value;
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

const SignInPageHeader: React.FC<SignInPageHeaderProps> = ({
  activityName,
  startTime,
  endTime,
  onBack,
}) => {
  return (
    <div className="relative bg-gradient-to-b from-red-600 to-red-500 text-white pb-24">
      <div className="flex items-center px-4 py-3">
        <button onClick={onBack} className="p-1 -ml-2">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-bold flex-1 text-center pr-6">每日签到</h1>
      </div>

      <div className="px-6 pt-4 text-center">
        <div className="text-xs opacity-80 mb-1">树拍·星火燎原</div>
        <h2 className="text-2xl font-bold mb-2">{activityName}</h2>
        <div className="mt-2 text-xs opacity-75">
          活动时间：{formatDateText(startTime, '2025.11.29')} - {formatDateText(endTime, '2025.12.04')}
        </div>
      </div>
    </div>
  );
};

export default SignInPageHeader;
