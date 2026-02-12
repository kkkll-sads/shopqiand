import React from 'react';
import { Calendar, Clock, Wallet, Zap, CheckCircle2, ArrowRight } from 'lucide-react';
import type { ReservationItem } from '@/services';
import { ReservationStatus } from '@/constants/statusEnums';
import ReservationRecordStatusBadge from './ReservationRecordStatusBadge';

interface ReservationRecordCardProps {
  record: ReservationItem;
  onClickDetail: (record: ReservationItem) => void;
  onGoCollection: () => void;
}

const ReservationRecordCard: React.FC<ReservationRecordCardProps> = ({
  record,
  onClickDetail,
  onGoCollection,
}) => {
  return (
    <div
      className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 cursor-pointer active:bg-gray-50 transition-all"
      onClick={() => onClickDetail(record)}
    >
      <div className="flex justify-between items-start mb-3 pb-2 border-b border-gray-50">
        <div className="text-xs text-gray-400 flex items-center gap-1">
          <Calendar size={12} />
          {record.create_time || ''}
        </div>
        <ReservationRecordStatusBadge status={record.status} statusText={record.status_text} />
      </div>

      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-gray-900 font-bold text-sm">{record.session_title || '盲盒预约'}</h3>
          <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-medium">
            {record.zone_name || `分区${record.zone_id}`}
          </span>
        </div>
        {(record.session_start_time || record.session_end_time) && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock size={11} className="text-gray-400" />
            <span>
              场次: {record.session_start_time || '--:--'} - {record.session_end_time || '--:--'}
            </span>
          </div>
        )}
      </div>

      <div className="bg-gray-50 rounded-lg p-3 grid grid-cols-2 gap-2 mb-3">
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-400 flex items-center gap-1 mb-0.5">
            <Wallet size={10} /> 冻结金额
          </span>
          <span className="text-sm font-bold text-red-600">
            ¥{Number(record.freeze_amount || 0).toLocaleString()}
          </span>
        </div>
        {record.status === ReservationStatus.APPROVED && record.actual_buy_price !== undefined && (
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 mb-0.5">实际金额</span>
            <span className="text-sm font-bold text-green-600">
              ¥{Number(record.actual_buy_price || 0).toLocaleString()}
            </span>
          </div>
        )}
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-400 flex items-center gap-1 mb-0.5">
            <Zap size={10} /> 消耗算力
          </span>
          <span className="text-sm font-bold text-gray-900">{record.power_used || 5}</span>
        </div>
      </div>

      {record.status === ReservationStatus.APPROVED &&
        record.refund_diff !== undefined &&
        Number(record.refund_diff) > 0 && (
          <div className="mb-3 p-2.5 bg-green-50 rounded-lg border border-green-100">
            <div className="flex items-center gap-2 text-xs text-green-700">
              <CheckCircle2 size={14} className="flex-shrink-0" />
              <span className="font-medium">
                已退还差价：¥{Number(record.refund_diff).toLocaleString()}
              </span>
            </div>
          </div>
        )}

      <div className="flex justify-between items-center text-xs">
        <div className="text-gray-400">
          {record.status === ReservationStatus.PENDING &&
            record.session_end_time &&
            `预计 ${record.session_end_time} 结束撮合`}
          {record.status === ReservationStatus.APPROVED &&
            record.match_time &&
            `撮合时间: ${record.match_time}`}
          {record.status === ReservationStatus.REFUNDED && '未中签，冻结金额已退回'}
        </div>

        {record.status === ReservationStatus.APPROVED && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onGoCollection();
            }}
            className="text-xs font-medium text-white flex items-center gap-1 bg-gradient-to-r from-red-500 to-red-600 pl-3 pr-2 py-1.5 rounded-full shadow-sm"
          >
            去持仓 <ArrowRight size={12} />
          </button>
        )}
      </div>
    </div>
  );
};

export default ReservationRecordCard;
