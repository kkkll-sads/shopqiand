import React from 'react';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReservationStatus as ReservationStatusType } from '@/services';
import { ReservationStatus } from '@/constants/statusEnums';

interface ReservationRecordStatusTabsProps {
  statusFilter: ReservationStatusType | undefined;
  onChange: (status: ReservationStatusType) => void;
}

interface StatusOption {
  key: ReservationStatusType;
  label: string;
  icon: LucideIcon | null;
}

const STATUS_OPTIONS: StatusOption[] = [
  { key: -1 as ReservationStatusType, label: '全部', icon: null },
  { key: ReservationStatus.PENDING as ReservationStatusType, label: '待撮合', icon: Clock },
  { key: ReservationStatus.APPROVED as ReservationStatusType, label: '已撮合', icon: CheckCircle2 },
  { key: ReservationStatus.REFUNDED as ReservationStatusType, label: '已退款', icon: AlertCircle },
];

const ReservationRecordStatusTabs: React.FC<ReservationRecordStatusTabsProps> = ({
  statusFilter,
  onChange,
}) => {
  return (
    <div className="mt-4 mx-4 bg-white rounded-xl p-1 shadow-sm border border-gray-100">
      <div className="flex">
        {STATUS_OPTIONS.map((status) => (
          <button
            key={status.key}
            onClick={() => onChange(status.key)}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1 ${
              statusFilter === status.key ? 'bg-red-500 text-white shadow-sm' : 'text-gray-500'
            }`}
          >
            {status.icon && <status.icon size={12} />}
            {status.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ReservationRecordStatusTabs;
