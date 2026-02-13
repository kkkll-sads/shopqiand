import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronRight, ChevronUp } from 'lucide-react';
import { getBalanceTypeLabel } from '@/constants/balanceTypes';
import { getAllLogMergedItems, type AllLogItem } from '@/services';
import { getStoredToken } from '@/services/client';
import { extractData } from '@/utils/apiHelpers';
import { errorLog } from '@/utils/logger';

interface AssetHistoryLogCardProps {
  item: AllLogItem;
  expanded: boolean;
  onToggleExpand: (logId: number) => void;
  onOpenDetail: (item: AllLogItem) => void;
}

const formatTime = (timestamp: number | string | null): string => {
  if (!timestamp) return '';
  const date = new Date(typeof timestamp === 'string' ? parseInt(timestamp, 10) * 1000 : timestamp * 1000);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getTypeLabel = (type: string, fieldType?: string): string => {
  const typeToUse = fieldType || type;
  return getBalanceTypeLabel(typeToUse);
};

const getTypeTagStyle = (type: string, fieldType?: string): string => {
  const typeToCheck = fieldType || type;
  if (typeToCheck === 'green_power' || typeToCheck === '绿色能量' || typeToCheck === '算力') {
    return 'bg-emerald-50 text-emerald-600';
  }
  if (typeToCheck === 'balance_available' || typeToCheck === 'balance' || typeToCheck === '余额') {
    return 'bg-blue-50 text-blue-600';
  }
  if (typeToCheck === 'withdrawable_money' || typeToCheck === '可提现余额') {
    return 'bg-indigo-50 text-indigo-600';
  }
  if (typeToCheck === 'service_fee_balance' || typeToCheck === '服务费') {
    return 'bg-amber-50 text-amber-600';
  }
  if (typeToCheck === 'score' || typeToCheck === '积分' || typeToCheck === '消费金') {
    return 'bg-purple-50 text-purple-600';
  }
  return 'bg-gray-100 text-gray-500';
};

const toSafeNumber = (value: any): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const formatSignedValue = (value: number, unit = '元'): string => {
  const sign = value >= 0 ? '+' : '-';
  const absVal = Math.abs(value).toFixed(2);
  return unit ? `${sign}${absVal} ${unit}` : `${sign}${absVal}`;
};

const formatPlainValue = (value: number, unit = '元'): string => {
  const absVal = Math.abs(value).toFixed(2);
  return unit ? `${absVal} ${unit}` : absVal;
};

const AssetHistoryLogCard: React.FC<AssetHistoryLogCardProps> = ({
  item,
  expanded,
  onToggleExpand,
  onOpenDetail,
}) => {
  const isGreenPower = item.field_type === 'green_power' || item.type === 'green_power';
  const isScore = item.type === 'score';
  const isSignRecord = item.sign_record_id !== undefined || item.activity_name !== undefined;
  const isMatchingSellerIncome = item.biz_type === 'matching_seller_income';
  const breakdown = item.breakdown && typeof item.breakdown === 'object' ? item.breakdown : null;
  const mergeRowCount = toSafeNumber((breakdown as any)?.merge_row_count);
  const canExpandMergedFlows = mergeRowCount > 1;
  const hasSellerBreakdown =
    isMatchingSellerIncome &&
    breakdown &&
    [
      (breakdown as any)?.dispatchable_income,
      (breakdown as any)?.score_income,
      (breakdown as any)?.principal_income,
      (breakdown as any)?.sold_price,
    ].some((value) => value !== undefined && value !== null && value !== '');
  const canExpandBreakdown = Boolean(hasSellerBreakdown);
  const canExpand = canExpandBreakdown || canExpandMergedFlows;
  const amountVal = Number(item.amount);
  const [mergedFlowItems, setMergedFlowItems] = useState<AllLogItem[]>([]);
  const [mergedFlowLoading, setMergedFlowLoading] = useState(false);
  const [mergedFlowLoaded, setMergedFlowLoaded] = useState(false);
  const mergedFlowInFlightRef = useRef(false);

  let isPositive = amountVal > 0;
  if (item.before_value !== undefined && item.after_value !== undefined) {
    isPositive = Number(item.after_value) > Number(item.before_value);
  } else if (item.before_balance !== undefined && item.after_balance !== undefined) {
    isPositive = Number(item.after_balance) > Number(item.before_balance);
  } else if (item.flow_direction) {
    isPositive = item.flow_direction === 'in';
  }

  const typeLabel = getTypeLabel(item.type, item.field_type);
  const typeTagStyle = getTypeTagStyle(item.type, item.field_type);
  const dispatchableIncome = toSafeNumber(breakdown?.dispatchable_income);
  const scoreIncome = toSafeNumber(breakdown?.score_income);
  const principalIncome = toSafeNumber(breakdown?.principal_income);
  const soldPrice = toSafeNumber(breakdown?.sold_price);
  const beforeBalanceValue = toSafeNumber(item.before_value ?? item.before_balance);
  const afterBalanceValue = toSafeNumber(item.after_value ?? item.after_balance);

  const balanceChangeNode = (
    <span className="text-xs text-gray-400 flex items-center font-mono">
      {beforeBalanceValue.toFixed(2)}
      <span className="mx-1.5 text-gray-300">→</span>
      <span className={isPositive ? (isGreenPower ? 'text-emerald-500' : 'text-red-500') : 'text-gray-600'}>
        {afterBalanceValue.toFixed(2)}
      </span>
    </span>
  );

  const onCardClick = () => {
    if (canExpand) {
      onToggleExpand(item.id);
      return;
    }
    onOpenDetail(item);
  };

  useEffect(() => {
    if (!expanded || !canExpandMergedFlows || mergedFlowLoaded || mergedFlowInFlightRef.current) {
      return;
    }

    const token = getStoredToken();
    if (!token) {
      setMergedFlowLoaded(true);
      setMergedFlowItems([]);
      return;
    }

    let cancelled = false;
    mergedFlowInFlightRef.current = true;
    setMergedFlowLoading(true);

    const loadMergedFlows = async () => {
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      try {
        const timeoutMs = 15000;
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('加载合并流水超时')), timeoutMs);
        });

        const responsePromise = getAllLogMergedItems({
          id: item.id,
          flow_no: item.flow_no,
          account_type: (item as any).account_type || item.field_type || item.type,
          token,
        });

        const response = await Promise.race<Awaited<typeof responsePromise>>([
          responsePromise,
          timeoutPromise,
        ]);

        const data = extractData(response);
        if (cancelled) return;
        setMergedFlowItems(Array.isArray(data?.list) ? data.list : []);
      } catch (error) {
        if (!cancelled) {
          setMergedFlowItems([]);
          errorLog('AssetHistoryLogCard', '加载合并流水子明细失败', error);
        }
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        mergedFlowInFlightRef.current = false;
        if (!cancelled) {
          setMergedFlowLoading(false);
          setMergedFlowLoaded(true);
        }
      }
    };

    void loadMergedFlows();

    return () => {
      cancelled = true;
    };
  }, [
    expanded,
    canExpandMergedFlows,
    mergedFlowLoaded,
    item.id,
    item.flow_no,
    item.field_type,
    item.type,
  ]);

  const formatFlowAmount = (row: AllLogItem): string => {
    const rowAmount = toSafeNumber(row.amount);
    const rowAccountType = String((row as any).account_type || row.field_type || row.type || '');
    const noUnit = rowAccountType === 'score' || rowAccountType === 'green_power';
    return formatSignedValue(rowAmount, noUnit ? '' : '元');
  };

  return (
    <div
      className="bg-white rounded-xl p-4 mb-3 border border-gray-100 shadow-sm relative cursor-pointer active:bg-gray-50 active:scale-[0.99] transition-all"
      onClick={onCardClick}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1 pr-4 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 font-medium ${typeTagStyle}`}>
              {typeLabel}
            </span>
            <span className="text-sm text-gray-700 font-medium truncate">
              {isSignRecord ? item.activity_name || '签到奖励' : item.memo || item.remark || '资金变动'}
            </span>
          </div>
          <div className="text-xs text-gray-400">
            {isSignRecord
              ? item.sign_date || formatTime(item.createtime || item.create_time)
              : formatTime(item.createtime || item.create_time)}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="text-right">
            <div
              className={`text-base font-bold font-[DINAlternate-Bold,Roboto,sans-serif] ${
                isGreenPower
                  ? isPositive
                    ? 'text-emerald-500'
                    : 'text-emerald-600'
                  : isPositive
                    ? 'text-red-600'
                    : 'text-gray-900'
              }`}
            >
              {isPositive ? '+' : ''}
              {Math.abs(amountVal).toFixed(2)}
              <span className="text-xs font-normal ml-0.5 text-gray-400">
                {isGreenPower ? '算力' : isScore ? '' : '元'}
              </span>
            </div>
          </div>
          {canExpand ? (
            expanded ? (
              <ChevronUp size={16} className="text-gray-400" />
            ) : (
              <ChevronDown size={16} className="text-gray-400" />
            )
          ) : (
            <ChevronRight size={16} className="text-gray-300" />
          )}
        </div>
      </div>

      {!canExpandBreakdown && <div className="mt-2 pt-2 border-t border-gray-50 flex justify-end">{balanceChangeNode}</div>}

      {canExpandBreakdown && expanded && (
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">余额变动</span>
            {balanceChangeNode}
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">寄售价</span>
              <span className="font-medium text-gray-900">{formatPlainValue(soldPrice, '元')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">可调度收益</span>
              <span className="font-medium text-red-600">{formatSignedValue(dispatchableIncome, '元')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">消费金</span>
              <span className="font-medium text-purple-600">{formatSignedValue(scoreIncome, '')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">本金</span>
              <span className="font-medium text-gray-900">{formatSignedValue(principalIncome, '元')}</span>
            </div>
          </div>
          <button
            type="button"
            className="w-full mt-1 py-2 text-xs text-red-600 bg-red-50 rounded-lg active:opacity-80 transition-opacity"
            onClick={(event) => {
              event.stopPropagation();
              onOpenDetail(item);
            }}
          >
            查看完整明细
          </button>
        </div>
      )}

      {canExpandMergedFlows && expanded && (
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">流水明细</span>
            <span className="text-xs text-gray-400">{mergeRowCount} 笔</span>
          </div>
          {mergedFlowLoading ? (
            <div className="text-xs text-gray-400 py-2">加载中...</div>
          ) : mergedFlowItems.length === 0 ? (
            <div className="text-xs text-gray-400 py-2">暂无子流水</div>
          ) : (
            <div className="max-h-72 overflow-y-auto space-y-2">
              {mergedFlowItems.map((row, idx) => {
                const rowBefore = toSafeNumber((row as any).before_value ?? (row as any).before_balance);
                const rowAfter = toSafeNumber((row as any).after_value ?? (row as any).after_balance);
                const rowType = String((row as any).account_type || row.field_type || row.type || '');
                return (
                  <div
                    key={`merged-${item.id}-${row.id}-${row.flow_no || idx}`}
                    className="rounded-lg bg-gray-50 border border-gray-100 p-2.5"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${getTypeTagStyle(rowType, row.field_type)}`}>
                        {getTypeLabel(rowType, row.field_type)}
                      </span>
                      <span className="text-xs font-semibold text-gray-900">{formatFlowAmount(row)}</span>
                    </div>
                    <div className="text-[11px] text-gray-500 break-all">
                      流水号：{row.flow_no || '-'}
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5">
                      {formatTime((row as any).create_time || (row as any).createtime)}
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">
                      {(row.memo || row.remark || '-') as string}
                    </div>
                    <div className="text-[11px] text-gray-400 mt-1 font-mono">
                      {rowBefore.toFixed(2)} → {rowAfter.toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AssetHistoryLogCard;
