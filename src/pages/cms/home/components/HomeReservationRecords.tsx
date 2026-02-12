import React from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  Zap,
} from 'lucide-react';
import { SkeletonSubscriptionCard } from '@/components/common';
import { ReservationItem } from '@/services';

interface HomeReservationRecordsProps {
  loadingRecords: boolean;
  reservationRecords: ReservationItem[];
  onViewAll: () => void;
  onOpenRecord: () => void;
}

const getStatusBadge = (item: ReservationItem) => {
  switch (item.status) {
    case 0:
      return (
        <span className="text-[10px] font-semibold px-2 py-1 rounded-lg flex items-center gap-1 whitespace-nowrap text-amber-600 bg-amber-50">
          <Clock size={10} /> 待撮合
        </span>
      );
    case 1:
      return (
        <span className="text-[10px] font-semibold px-2 py-1 rounded-lg flex items-center gap-1 whitespace-nowrap text-green-600 bg-green-50">
          <CheckCircle2 size={10} /> 已中签
        </span>
      );
    case 2:
      return (
        <span className="text-[10px] font-semibold px-2 py-1 rounded-lg flex items-center gap-1 whitespace-nowrap text-gray-500 bg-gray-100">
          <AlertCircle size={10} /> 未中签
        </span>
      );
    default:
      return (
        <span className="text-[10px] font-semibold px-2 py-1 rounded-lg flex items-center gap-1 whitespace-nowrap text-gray-500 bg-gray-100">
          <Clock size={10} /> {item.status_text || '未知'}
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
  <div className="mx-4 bg-white rounded-2xl shadow-sm relative z-0 overflow-hidden">
    <div className="flex justify-between items-center p-4 pb-3">
      <div className="flex items-center gap-2">
        <div className="w-1 h-5 bg-gradient-to-b from-red-600 to-red-500 rounded-full" />
        <h2 className="font-bold text-gray-800 text-base">申购记录</h2>
      </div>
      <button onClick={onViewAll} className="text-red-600 flex items-center text-xs font-medium active:opacity-70">
        全部 <ChevronRight size={16} />
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
        <div className="text-center py-10 text-gray-400">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
            <ClipboardList size={24} className="text-gray-400" />
          </div>
          <p className="text-sm">暂无申购记录</p>
          <p className="text-xs text-gray-300 mt-1">参与申购后这里会显示记录</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {reservationRecords.map((record) => (
            <div
              key={record.id}
              className="bg-gray-50 rounded-xl p-3.5 flex flex-col gap-2.5 active:bg-gray-100 transition-colors cursor-pointer"
              onClick={onOpenRecord}
            >
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1">
                  <h3 className="font-bold text-gray-800 text-sm">{record.status_text || '待撮合'}</h3>
                  <span className="text-[10px] text-red-600 bg-red-50 px-2 py-0.5 rounded-md font-medium w-fit">
                    {record.session_id ? `场次 ${record.session_id}` : '盲盒预约'}
                  </span>
                </div>
                {getStatusBadge(record)}
              </div>
              <div className="flex justify-between items-center text-xs pt-1 border-t border-gray-100">
                <span className="text-gray-500">
                  冻结{' '}
                  <span className="text-red-600 font-bold">
                    ¥{Number(record.freeze_amount || 0).toLocaleString()}
                  </span>
                </span>
                <span className="text-gray-400 flex items-center gap-1">
                  <Zap size={10} className="text-yellow-500" /> 算力 {record.power_used || 5}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

export default HomeReservationRecords;
