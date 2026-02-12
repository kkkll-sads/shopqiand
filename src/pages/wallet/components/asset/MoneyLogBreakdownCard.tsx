import React from 'react';
import { Copy, TrendingDown } from 'lucide-react';
import { useNotification } from '@/context/NotificationContext';
import { copyWithToast } from '@/utils/copyWithToast';

interface MoneyLogBreakdownCardProps {
  breakdown: Record<string, any>;
}

const fieldNameMap: Record<string, string> = {
  sign_date: '签到日期',
  sign_record_id: '签到记录ID',
  sign_days: '签到天数',
  streak: '连续签到天数',
  reward_money: '奖励金额',
  reward_score: '奖励积分',
  reward_type: '奖励类型',
  referrer_reward: '推荐人奖励',
  daily_reward: '每日奖励',
  total_reward: '累计奖励',
  activity_id: '活动ID',
  activity_name: '活动名称',
  score_consumed: '消费金消耗',
  green_power_gained: '获得绿色算力',
  exchange_rate: '兑换比例',
  recharge_amount: '充值金额',
  service_fee: '服务费',
  service_fee_rate: '服务费率',
  actual_amount: '实际到账',
  consign_price: '寄售价格',
  consignment_price: '寄售价格',
  platform_fee: '平台手续费',
  seller_income: '卖家收入',
  buyer_paid: '买家支付',
  match_price: '撮合价格',
  match_quantity: '撮合数量',
  commission: '佣金',
  order_no: '订单号',
  collection_id: '藏品ID',
  collection_name: '藏品名称',
  sold_price: '寄售价',
  principal_income: '本金',
  dispatchable_income: '可调度收益',
  score_income: '消费金',
  withdrawable_income: '到账可提余额',
  service_fee_refund: '服务费返还',
  profit_share: '收益分配',
  settlement_rule: '结算规则',
};

const MoneyLogBreakdownCard: React.FC<MoneyLogBreakdownCardProps> = ({ breakdown }) => {
  const { showToast } = useNotification();

  if (!breakdown || Object.keys(breakdown).length === 0) {
    return null;
  }

  const isCopyableField = (key: string, value: unknown) => {
    if (value === undefined || value === null) {
      return false;
    }
    const normalizedKey = key.toLowerCase();
    return (
      typeof value !== 'object' &&
      (normalizedKey.includes('_id') ||
        normalizedKey.includes('_no') ||
        normalizedKey.includes('_code') ||
        normalizedKey.includes('hash') ||
        normalizedKey.includes('tx'))
    );
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-3">
        <TrendingDown className="w-5 h-5 text-red-600" />
        <h2 className="font-semibold text-gray-900 text-base">详细信息</h2>
      </div>
      <div className="space-y-2">
        {Object.entries(breakdown).map(([key, value]) => {
          const displayKey = fieldNameMap[key] || key;
          const displayValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
          const canCopy = isCopyableField(key, value);

          return (
            <div key={key} className="flex justify-between items-center py-1.5 text-sm">
              <span className="text-gray-600">{displayKey}</span>
              <div className="flex items-center gap-1.5 max-w-[65%]">
                <span className="text-gray-900 font-medium truncate" title={displayValue}>
                  {displayValue}
                </span>
                {canCopy && (
                  <button
                    type="button"
                    className="p-1 rounded text-gray-400 active:bg-gray-100"
                    onClick={() => {
                      void copyWithToast(displayValue, showToast, {
                        successDescription: `${displayKey}已复制到剪贴板`,
                      });
                    }}
                    aria-label={`复制${displayKey}`}
                  >
                    <Copy size={11} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MoneyLogBreakdownCard;
