import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ReservationStatus } from '@/constants/statusEnums';
import type { ReservationDetailData } from '@/services/collection/trade';

interface ReservationStatusConfig {
  icon: LucideIcon;
  gradient: string;
  bg: string;
  text: string;
  border: string;
  label: string;
}

export const getReservationStatusConfig = (
  record: ReservationDetailData,
): ReservationStatusConfig => {
  switch (record.status) {
    case ReservationStatus.PENDING:
      return {
        icon: Clock,
        gradient: 'from-amber-500 to-orange-500',
        bg: 'from-amber-50 to-orange-50',
        text: 'text-amber-600',
        border: 'border-amber-200',
        label: record.status_text || '待撮合',
      };
    case ReservationStatus.APPROVED:
      return {
        icon: CheckCircle2,
        gradient: 'from-emerald-500 to-green-500',
        bg: 'from-emerald-50 to-green-50',
        text: 'text-emerald-600',
        border: 'border-emerald-200',
        label: record.status_text || '已中签',
      };
    case ReservationStatus.REFUNDED:
      return {
        icon: XCircle,
        gradient: 'from-gray-400 to-gray-500',
        bg: 'from-gray-50 to-slate-50',
        text: 'text-gray-600',
        border: 'border-gray-200',
        label: record.status_text || '未中签',
      };
    default:
      return {
        icon: Clock,
        gradient: 'from-gray-400 to-gray-500',
        bg: 'from-gray-50 to-slate-50',
        text: 'text-gray-600',
        border: 'border-gray-200',
        label: record.status_text || '未知状态',
      };
  }
};
