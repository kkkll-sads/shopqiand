/**
 * @file 预约记录卡片组件
 * @description 首页和列表页共用的预约记录卡片。
 */

import type { ReservationItem } from '../../api';
import type React from 'react';
import {
  formatReservationAmount,
  getReservationStatusConfig,
} from './utils';

interface ReservationCardProps {
  item: ReservationItem;
  onClick?: () => void;
}

export const ReservationCard: React.FC<ReservationCardProps> = ({ item, onClick }) => {
  const cfg = getReservationStatusConfig(item.status);
  const isMixed = item.payment?.is_mixed;
  const payTypeTag = isMixed ? '混合支付' : '专项金支付';

  // 是否已撮合完成
  const isMatched = item.deal?.matched;

  return (
    <div
      className="bg-white dark:bg-gray-900 rounded-[14px] p-4 border border-gray-100 dark:border-gray-800 shadow-sm cursor-pointer active:opacity-80 transition-opacity"
      onClick={onClick}
    >
      {/* 标题行 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 mr-3">
          <div className="flex items-center mb-1">
            <span className="inline-block px-1.5 py-0.5 bg-[#FF4142]/10 text-[#FF4142] text-2xs font-bold rounded mr-2 shrink-0">
              {item.session_title}
            </span>
            <span className="text-base font-medium text-gray-900 dark:text-gray-100 truncate">
              {item.package_name || `预约申购 #${item.id}`}
            </span>
          </div>
          <div className="text-s text-gray-500 dark:text-gray-400">
            {item.create_time}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
            {item.status_text || cfg.text}
          </span>
          <span className="px-2 py-0.5 rounded text-2xs bg-primary-start/10 text-primary-start font-medium">
            {payTypeTag}
          </span>
        </div>
      </div>

      {/* 金额明细区 */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-xs flex flex-col gap-2">
        {/* 1. 冻结金额（始终存在） */}
        <div className="flex justify-between text-gray-600 dark:text-gray-400">
          <span>冻结金额</span>
          <span className="text-gray-900 dark:text-gray-100 font-medium font-mono text-sm">
            {formatReservationAmount(item.freeze_amount)}
          </span>
        </div>

        {isMixed && (
          <div className="flex flex-col gap-1 rounded-md bg-white/70 px-2.5 py-2 dark:bg-gray-900/30">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center before:mr-1.5 before:h-1 before:w-1 before:rounded-full before:bg-gray-300 before:content-['']">
                冻结专项金
              </span>
              <span className="font-mono">{formatReservationAmount(item.freeze_balance_available)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center before:mr-1.5 before:h-1 before:w-1 before:rounded-full before:bg-gray-300 before:content-['']">
                冻结待激活确权金
              </span>
              <span className="font-mono">{formatReservationAmount(item.freeze_pending_activation_gold)}</span>
            </div>
          </div>
        )}

        {/* 2. 撮合成功后的 实际支付 与 退还差价 */}
        {isMatched && (
          <>
            <div className="flex flex-col gap-1 pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span className="font-medium">实际支付</span>
                <span className="text-gray-900 dark:text-gray-100 font-medium font-mono text-sm">
                  {formatReservationAmount(item.actual_payment?.total_amount)}
                </span>
              </div>
              {/* 混合支付下展开实付明细 */}
              {isMixed && (
                <>
                  <div className="flex justify-between pl-2 text-gray-500 dark:text-gray-500 text-xs">
                    <span className="flex items-center before:content-[''] before:w-1 before:h-1 before:bg-gray-300 before:rounded-full before:mr-1.5">- 专项金</span>
                    <span className="font-mono">{formatReservationAmount(item.actual_payment?.balance_amount)}</span>
                  </div>
                  <div className="flex justify-between pl-2 text-gray-500 dark:text-gray-500 text-xs">
                    <span className="flex items-center before:content-[''] before:w-1 before:h-1 before:bg-gray-300 before:rounded-full before:mr-1.5">- 待活化金</span>
                    <span className="font-mono">{formatReservationAmount(item.actual_payment?.pending_activation_gold_amount)}</span>
                  </div>
                </>
              )}
            </div>

            {item.refund?.total_amount > 0 && (
              <div className="flex flex-col gap-1 pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span className="font-medium text-green-600 dark:text-green-500">已退还差价</span>
                  <span className="text-green-600 dark:text-green-500 font-medium font-mono text-sm">
                    +{formatReservationAmount(item.refund?.total_amount)}
                  </span>
                </div>
                {/* 混合支付下展开退差明细 */}
                {isMixed && (
                  <>
                    <div className="flex justify-between pl-2 text-green-600/70 dark:text-green-500/70 text-xs">
                      <span className="flex items-center before:content-[''] before:w-1 before:h-1 before:bg-green-300 before:rounded-full before:mr-1.5">- 退回专项金</span>
                      <span className="font-mono">+{formatReservationAmount(item.refund?.balance_amount)}</span>
                    </div>
                    <div className="flex justify-between pl-2 text-green-600/70 dark:text-green-500/70 text-xs">
                      <span className="flex items-center before:content-[''] before:w-1 before:h-1 before:bg-green-300 before:rounded-full before:mr-1.5">- 退回待活化金</span>
                      <span className="font-mono">+{formatReservationAmount(item.refund?.pending_activation_gold_amount)}</span>
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
