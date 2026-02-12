import React from 'react';
import { Clock, X } from 'lucide-react';

interface PaymentRedirectHeaderProps {
  title: string;
  isExpired: boolean;
  remainingTime: number;
  formatTime: (seconds: number) => string;
  onClose: () => void;
}

const PaymentRedirectHeader: React.FC<PaymentRedirectHeaderProps> = ({
  title,
  isExpired,
  remainingTime,
  formatTime,
  onClose,
}) => (
  <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 shadow-sm shrink-0">
    <button
      onClick={onClose}
      className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
    >
      <X size={24} />
    </button>

    <div className="flex-1 text-center mx-2">
      <span className="font-bold text-gray-900">{title}</span>
    </div>

    <div
      className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-mono ${
        isExpired
          ? 'bg-red-100 text-red-600'
          : remainingTime <= 60
            ? 'bg-amber-100 text-amber-600'
            : 'bg-gray-100 text-gray-600'
      }`}
    >
      <Clock size={12} />
      {isExpired ? '已超时' : formatTime(remainingTime)}
    </div>
  </div>
);

export default PaymentRedirectHeader;
