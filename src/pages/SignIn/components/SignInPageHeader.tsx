import React from 'react';
import { ChevronLeft } from 'lucide-react';

interface SignInPageHeaderProps {
  activityName?: string;
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
}) => (
  <div className="relative bg-gradient-to-b from-red-600 to-red-500 pb-24 text-white dark:from-red-700 dark:to-red-950">
    <div className="flex items-center px-4 py-3 pt-safe">
      <button onClick={onBack} className="p-1 -ml-2 active:opacity-70">
        <ChevronLeft size={24} />
      </button>
      <h1 className="flex-1 pr-6 text-center text-lg font-bold">每日签到</h1>
    </div>

    <div className="px-6 pt-4 text-center">
      <div className="mb-1 text-xs opacity-80">树拍 · 签到活动</div>
      {activityName ? <h2 className="mb-2 text-2xl font-bold">{activityName}</h2> : null}
      {(startTime || endTime) && (
        <div className="mt-2 text-xs opacity-75">
          活动时间：{formatDateText(startTime, '--')} - {formatDateText(endTime, '--')}
        </div>
      )}
    </div>
  </div>
);

export default SignInPageHeader;
