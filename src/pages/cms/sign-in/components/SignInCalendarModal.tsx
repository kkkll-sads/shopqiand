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

const getDaysInMonth = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const days = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  return { days, firstDay };
};

const isSignedDate = (
  signedInDates: string[],
  year: number,
  month: number,
  day: number
) => {
  return signedInDates.some((signedDate) => {
    try {
      const parsed = new Date(signedDate);
      return (
        parsed.getFullYear() === year &&
        parsed.getMonth() === month &&
        parsed.getDate() === day
      );
    } catch {
      return false;
    }
  });
};

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
  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  const todayString = new Date().toDateString();

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < firstDay; i += 1) {
    cells.push(<div key={`empty-${i}`} className="h-10" />);
  }

  for (let day = 1; day <= days; day += 1) {
    const date = new Date(year, month, day);
    const signed = isSignedDate(signedInDates, year, month, day);
    const isToday = date.toDateString() === todayString;

    cells.push(
      <div key={day} className="h-10 flex items-center justify-center relative">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            signed
              ? 'bg-red-500 text-white shadow-md'
              : isToday
                ? 'border border-red-500 text-red-500'
                : 'text-gray-700'
          }`}
        >
          {day}
        </div>
        {signed && <div className="absolute -bottom-1 text-[10px] text-red-500 font-bold">✓</div>}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-in fade-in duration-200 p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl p-4 relative shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 z-10">
          <X size={24} />
        </button>
        <h3 className="text-center font-bold text-lg mb-2">签到记录</h3>

        <div className="bg-white rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={onPrevMonth} className="p-1 hover:bg-gray-100 rounded">
              <ChevronLeft size={20} className="text-gray-500" />
            </button>
            <div className="font-bold text-lg text-gray-800">{year}年 {monthNames[month]}</div>
            <button onClick={onNextMonth} className="p-1 hover:bg-gray-100 rounded">
              <ChevronRight size={20} className="text-gray-500" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs text-gray-400 font-medium">
            <div>日</div><div>一</div><div>二</div><div>三</div><div>四</div><div>五</div><div>六</div>
          </div>
          <div className="grid grid-cols-7 gap-1">{cells}</div>
          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span>已签到</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full border border-red-500" />
              <span>今天</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInCalendarModal;
