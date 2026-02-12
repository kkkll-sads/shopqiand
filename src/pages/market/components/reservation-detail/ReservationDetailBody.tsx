import React from 'react';
import {
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  DollarSign,
  Sparkles,
  TrendingUp,
  Wallet,
  Zap,
} from 'lucide-react';
import { useNotification } from '@/context/NotificationContext';
import { ReservationStatus } from '@/constants/statusEnums';
import type { ReservationDetailData } from '@/services/collection/trade';
import { copyWithToast } from '@/utils/copyWithToast';
import { getReservationStatusConfig } from './statusConfig';

interface ReservationDetailBodyProps {
  record: ReservationDetailData;
  onGoCollection: () => void;
}

const ReservationDetailBody: React.FC<ReservationDetailBodyProps> = ({
  record,
  onGoCollection,
}) => {
  const { showToast } = useNotification();
  const statusConfig = getReservationStatusConfig(record);
  const StatusIcon = statusConfig.icon;

  const handleCopy = async (value: string, description: string) => {
    await copyWithToast(value, showToast, {
      successDescription: description,
    });
  };

  return (
    <>
      <div className="mx-4 mt-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-xl bg-gradient-to-br ${statusConfig.gradient} flex items-center justify-center shadow-md`}
            >
              <StatusIcon size={24} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">预约状态</p>
              <p className="text-lg font-bold text-gray-900">{statusConfig.label}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-400">预约编号</p>
            <div className="flex items-center justify-end gap-1.5">
              <p className="text-sm font-mono text-gray-600">#{record.id}</p>
              <button
                type="button"
                className="p-1 rounded-md text-gray-400 active:bg-gray-100"
                onClick={() => {
                  void handleCopy(String(record.id), '预约编号已复制到剪贴板');
                }}
                aria-label="复制预约编号"
              >
                <Copy size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center">
              <Calendar size={14} className="text-orange-600" />
            </div>
            场次信息
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-gray-500">场次名称</span>
              <span className="font-bold text-gray-900">{record.session_title || '-'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-gray-500">时间段</span>
              <span className="font-medium text-gray-700">
                {record.session_start_time} - {record.session_end_time}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-gray-500">价格分区</span>
              <span className="font-bold text-transparent bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text">
                {record.zone_name || '-'}
              </span>
            </div>
            {record.zone_min_price !== undefined && record.zone_max_price !== undefined && (
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-500">分区范围</span>
                <span className="font-medium text-gray-700 font-mono">
                  ¥{record.zone_min_price} - ¥{record.zone_max_price}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center">
              <DollarSign size={14} className="text-green-600" />
            </div>
            金额详情
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-gray-500 flex items-center gap-1.5">
                <Wallet size={14} className="text-gray-400" />
                冻结金额
              </span>
              <span className="font-bold text-rose-600 font-mono text-lg">
                ¥{Number(record.freeze_amount || 0).toLocaleString()}
              </span>
            </div>
            {record.status === ReservationStatus.APPROVED && record.actual_buy_price !== undefined && (
              <>
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-gray-500 flex items-center gap-1.5">
                    <TrendingUp size={14} className="text-gray-400" />
                    实际购买价
                  </span>
                  <span className="font-bold text-emerald-600 font-mono text-lg">
                    ¥{Number(record.actual_buy_price).toLocaleString()}
                  </span>
                </div>
                {record.refund_diff !== undefined && Number(record.refund_diff) > 0 && (
                  <div className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-100 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2 text-emerald-700">
                        <CheckCircle2 size={16} />
                        <span className="font-medium">退还差价</span>
                      </span>
                      <span className="font-bold font-mono text-emerald-600 text-lg">
                        +¥{Number(record.refund_diff).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
              <Zap size={14} className="text-amber-600" />
            </div>
            算力信息
          </h3>
          <div
            className={`grid gap-3 ${
              record.extra_hashrate_cost !== undefined && Number(record.extra_hashrate_cost) > 0
                ? 'grid-cols-2'
                : 'grid-cols-1'
            }`}
          >
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-3 text-center border border-amber-100">
              <p className="text-[10px] text-gray-500 mb-1">消耗算力</p>
              <p className="text-xl font-black text-amber-600">{record.power_used || 0}</p>
            </div>
            {record.extra_hashrate_cost !== undefined && Number(record.extra_hashrate_cost) > 0 && (
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-3 text-center border border-emerald-100">
                <p className="text-[10px] text-gray-500 mb-1">额外算力</p>
                <p className="text-xl font-black text-emerald-600">+{record.extra_hashrate_cost}</p>
              </div>
            )}
          </div>
        </div>

        {record.status === ReservationStatus.APPROVED && record.item_title && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center">
                <Award size={14} className="text-orange-600" />
              </div>
              中签藏品
            </h3>
            <div className="flex gap-3 items-center p-3 bg-orange-50 rounded-lg border border-orange-100">
              {record.item_image && (
                <img
                  src={record.item_image}
                  alt={record.item_title}
                  className="w-20 h-20 rounded-xl object-cover shadow-lg"
                />
              )}
              <div className="flex-1">
                <div className="font-bold text-gray-900 mb-1">{record.item_title}</div>
                {record.match_order_id && (
                  <div className="text-xs text-gray-500 flex items-center gap-1.5">
                    <span>订单编号: #{record.match_order_id}</span>
                    <button
                      type="button"
                      className="p-0.5 rounded text-gray-400 active:bg-gray-100"
                      onClick={() => {
                        void handleCopy(String(record.match_order_id), '订单编号已复制到剪贴板');
                      }}
                      aria-label="复制订单编号"
                    >
                      <Copy size={11} />
                    </button>
                  </div>
                )}
                <div className="mt-2 flex items-center gap-1 text-xs text-orange-600">
                  <Sparkles size={12} />
                  <span>恭喜获得此藏品</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
              <Clock size={14} className="text-gray-600" />
            </div>
            时间线
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-gray-500">申购时间</span>
              <span className="font-medium text-gray-700">{record.create_time}</span>
            </div>
            {record.match_time && (
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-gray-500">撮合时间</span>
                <span className="font-medium text-gray-700">{record.match_time}</span>
              </div>
            )}
            {record.update_time && (
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-500">更新时间</span>
                <span className="font-medium text-gray-700">{record.update_time}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {record.status === ReservationStatus.APPROVED && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 pb-safe">
          <button
            onClick={onGoCollection}
            className="w-full py-3.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Award size={18} />
            去持仓查看
          </button>
        </div>
      )}
    </>
  );
};

export default ReservationDetailBody;
