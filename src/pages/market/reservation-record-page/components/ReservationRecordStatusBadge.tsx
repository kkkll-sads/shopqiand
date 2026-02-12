import React from 'react';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { ReservationStatus } from '@/constants/statusEnums';

interface ReservationRecordStatusBadgeProps {
  status: number;
  statusText?: string;
}

const ReservationRecordStatusBadge: React.FC<ReservationRecordStatusBadgeProps> = ({
  status,
  statusText,
}) => {
  switch (status) {
    case ReservationStatus.PENDING:
      return (
        <span className="text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 bg-gradient-to-r from-amber-500/10 to-red-500/10 text-amber-600 border border-amber-200/50 shadow-sm">
          <Clock size={12} className="animate-pulse" /> 待撮合
        </span>
      );
    case ReservationStatus.APPROVED:
      return (
        <span className="text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 bg-gradient-to-r from-emerald-500/10 to-green-500/10 text-emerald-600 border border-emerald-200/50 shadow-sm">
          <CheckCircle2 size={12} /> 已撮合
        </span>
      );
    case ReservationStatus.REFUNDED:
      return (
        <span className="text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 bg-gray-100 text-gray-500 border border-gray-200/50 shadow-sm">
          <AlertCircle size={12} /> 已退款
        </span>
      );
    default:
      return (
        <span className="text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 bg-gray-50 text-gray-500 border border-gray-200/50">
          <Clock size={12} /> {statusText || '未知'}
        </span>
      );
  }
};

export default ReservationRecordStatusBadge;
