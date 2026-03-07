import React from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  Wallet,
} from 'lucide-react';
import { SkeletonSubscriptionCard } from '@/components/common';
import type { ReservationItem } from '@/services';
import { ReservationStatus } from '@/constants/statusEnums';
import MixedPaymentBadge from '@/pages/market/components/MixedPaymentBadge';
import {
  getReservationPaymentSummary,
  getReservationRefundInlineText,
  getReservationSplitInlineText,
} from '@/pages/market/utils/reservationPayment';

interface HomeReservationRecordsProps {
  loadingRecords: boolean;
  reservationRecords: ReservationItem[];
  onViewAll: () => void;
  onOpenRecord: () => void;
}

const TEXT = {
  pending: '\u5F85\u64AE\u5408',
  approved: '\u5DF2\u4E2D\u7B7E',
  refunded: '\u672A\u4E2D\u7B7E',
  unknown: '\u672A\u77E5',
  title: '\u9884\u7EA6\u8BB0\u5F55',
  viewAll: '\u5168\u90E8',
  empty: '\u6682\u65E0\u9884\u7EA6\u8BB0\u5F55',
  emptyHint: '\u53C2\u4E0E\u9884\u7EA6\u540E\u8FD9\u91CC\u4F1A\u663E\u793A\u8BB0\u5F55',
  defaultTitle: '\u76F2\u76D2\u9884\u7EA6',
  zonePrefix: '\u5206\u533A',
  freeze: '\u51BB\u7ED3',
  refundDestination: '\u9000\u6B3E\u53BB\u5411\uff1A',
};

const getStatusBadge = (item: ReservationItem) => {
  switch (item.status) {
    case ReservationStatus.PENDING:
      return (
        <span className="flex items-center gap-1 whitespace-nowrap rounded-lg bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-600">
          <Clock size={10} /> {TEXT.pending}
        </span>
      );
    case ReservationStatus.APPROVED:
      return (
        <span className="flex items-center gap-1 whitespace-nowrap rounded-lg bg-green-50 px-2 py-1 text-[10px] font-semibold text-green-600">
          <CheckCircle2 size={10} /> {TEXT.approved}
        </span>
      );
    case ReservationStatus.REFUNDED:
      return (
        <span className="flex items-center gap-1 whitespace-nowrap rounded-lg bg-gray-100 px-2 py-1 text-[10px] font-semibold text-gray-500">
          <AlertCircle size={10} /> {TEXT.refunded}
        </span>
      );
    default:
      return (
        <span className="flex items-center gap-1 whitespace-nowrap rounded-lg bg-gray-100 px-2 py-1 text-[10px] font-semibold text-gray-500">
          <Clock size={10} /> {item.status_text || TEXT.unknown}
        </span>
      );
  }
};

const HomeReservationRecords: React.FC<HomeReservationRecordsProps> = ({
  loadingRecords,
  reservationRecords,
  onViewAll,
  onOpenRecord,
}) => (
  <div className="relative z-0 mx-4 overflow-hidden rounded-2xl bg-white shadow-sm">
    <div className="flex items-center justify-between p-4 pb-3">
      <div className="flex items-center gap-2">
        <div className="h-5 w-1 rounded-full bg-gradient-to-b from-red-600 to-red-500" />
        <h2 className="text-base font-bold text-gray-800">{TEXT.title}</h2>
      </div>
      <button
        onClick={onViewAll}
        className="flex items-center text-xs font-medium text-red-600 active:opacity-70"
      >
        {TEXT.viewAll} <ChevronRight size={16} />
      </button>
    </div>

    <div className="px-4 pb-4">
      {loadingRecords ? (
        <div className="space-y-2.5">
          {Array.from({ length: 3 }).map((_, index) => (
            <SkeletonSubscriptionCard key={index} />
          ))}
        </div>
      ) : reservationRecords.length === 0 ? (
        <div className="py-10 text-center text-gray-400">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <ClipboardList size={24} className="text-gray-400" />
          </div>
          <p className="text-sm">{TEXT.empty}</p>
          <p className="mt-1 text-xs text-gray-300">{TEXT.emptyHint}</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {reservationRecords.map((record) => {
            const paymentSummary = getReservationPaymentSummary(record);
            const freezeSplitText = getReservationSplitInlineText(paymentSummary.freeze);
            const refundDestination = getReservationRefundInlineText(
              paymentSummary.refund,
              record.status === ReservationStatus.REFUNDED
                ? paymentSummary.freeze.total
                : undefined,
            );

            return (
              <div
                key={record.id}
                className="flex cursor-pointer flex-col gap-2.5 rounded-xl bg-gray-50 p-3.5 transition-colors active:bg-gray-100"
                onClick={onOpenRecord}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-col gap-1">
                    <h3 className="truncate text-sm font-bold text-gray-800">
                      {record.session_title || TEXT.defaultTitle}
                    </h3>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="w-fit rounded-md bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-600">
                        {record.zone_name || `${TEXT.zonePrefix}${record.zone_id}`}
                      </span>
                      <MixedPaymentBadge
                        type={record.pay_type}
                        fallbackText={paymentSummary.payTypeLabel ?? record.pay_type_text}
                        balanceAvailableAmount={paymentSummary.freeze.balanceAvailableAmount}
                        pendingActivationGoldAmount={paymentSummary.freeze.pendingActivationGoldAmount}
                        size="sm"
                      />
                    </div>
                  </div>
                  {getStatusBadge(record)}
                </div>

                <div className="border-t border-gray-100 pt-1 text-xs">
                  <div className="flex items-center gap-1 text-gray-500">
                    <Wallet size={10} className="text-gray-400" />
                    <span>
                      {TEXT.freeze}{' '}
                      <span className="font-bold text-red-600">
                        {paymentSummary.freeze.totalText}
                      </span>
                    </span>
                  </div>
                  {freezeSplitText && (
                    <div className="mt-1 line-clamp-2 text-[10px] text-gray-400">
                      {freezeSplitText}
                    </div>
                  )}
                  {record.status === ReservationStatus.REFUNDED && refundDestination && (
                    <div className="mt-1 line-clamp-2 text-[10px] text-emerald-600">
                      {TEXT.refundDestination}
                      {refundDestination}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  </div>
);

export default HomeReservationRecords;
