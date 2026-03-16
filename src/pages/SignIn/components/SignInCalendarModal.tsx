import React from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface SignInCalendarModalProps {
  open: boolean;
  currentDate: Date;
  signedInDates: string[];
  onClose: () => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

function getDaysInMonth(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  return {
    days: new Date(year, month + 1, 0).getDate(),
    firstDay: new Date(year, month, 1).getDay(),
  };
}

function isSignedDate(
  signedInDates: string[],
  year: number,
  month: number,
  day: number,
) {
  return signedInDates.some((s) => {
    try {
      const d = new Date(s);
      return (
        d.getFullYear() === year &&
        d.getMonth() === month &&
        d.getDate() === day
      );
    } catch {
      return false;
    }
  });
}

const MONTH_NAMES = [
  '1月', '2月', '3月', '4月', '5月', '6月',
  '7月', '8月', '9月', '10月', '11月', '12月',
];
const WEEK_DAYS = ['日', '一', '二', '三', '四', '五', '六'];

const SignInCalendarModal: React.FC<SignInCalendarModalProps> = ({
  open,
  currentDate,
  signedInDates,
  onClose,
  onPrevMonth,
  onNextMonth,
}) => {
  if (!open) return null;

  const { days, firstDay } = getDaysInMonth(currentDate);
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const todayString = new Date().toDateString();

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < firstDay; i += 1) {
    cells.push(<div key={`empty-${i}`} className="h-10" />);
  }

  for (let day = 1; day <= days; day += 1) {
    const d = new Date(year, month, day);
    const signed = isSignedDate(signedInDates, year, month, day);
    const isToday = d.toDateString() === todayString;

    cells.push(
      <div key={day} className="h-10 flex items-center justify-center relative">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            signed
              ? 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-md'
              : isToday
                ? 'border border-red-500 text-red-500 dark:border-red-400 dark:text-red-300'
                : 'text-text-main'
          }`}
        >
          {day}
        </div>
        {signed && (
          <div className="absolute -bottom-1 text-2xs text-red-500 font-bold">
            ✓
          </div>
        )}
      </div>,
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-in fade-in duration-200 p-4">
      <div className="relative w-full max-w-sm rounded-2xl border border-border-light bg-bg-card p-4 shadow-2xl animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-10 rounded-full p-1 text-text-aux transition-colors hover:bg-bg-hover hover:text-text-main"
        >
          <X size={24} />
        </button>
        <h3 className="mb-2 text-center text-lg font-bold text-text-main">签到记录</h3>

        <div className="rounded-xl bg-bg-base p-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onPrevMonth}
              className="rounded p-1 transition-colors hover:bg-bg-hover"
            >
              <ChevronLeft size={20} className="text-text-sub" />
            </button>
            <div className="text-lg font-bold text-text-main">
              {year}年 {MONTH_NAMES[month]}
            </div>
            <button
              onClick={onNextMonth}
              className="rounded p-1 transition-colors hover:bg-bg-hover"
            >
              <ChevronRight size={20} className="text-text-sub" />
            </button>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-medium text-text-aux">
            {WEEK_DAYS.map((w) => (
              <div key={w}>{w}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">{cells}</div>

          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-text-sub">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span>已签到</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-full border border-red-500 dark:border-red-400" />
              <span>今天</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInCalendarModal;
