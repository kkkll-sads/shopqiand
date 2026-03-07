import React from 'react';
import { AlertCircle, Info, Zap } from 'lucide-react';

interface ReservationPurchaseConfigCardProps {
  baseHashrate: number;
  extraHashrate: number;
  canIncreaseHashrate: boolean;
  quantity: number;
  zoneMaxPrice: number;
  frozenAmount: number;
  totalRequiredHashrate: number;
  userInfoLoading: boolean;
  availableHashrate: number;
  isHashrateSufficient: boolean;
  mixedPaymentAvailable: boolean;
  onDecreaseExtraHashrate: () => void;
  onIncreaseExtraHashrate: () => void;
  onDecreaseQuantity: () => void;
  onIncreaseQuantity: () => void;
}

const TEXT = {
  title: '申购配置',
  baseHashrate: '基础算力需求',
  extraHashrate: '额外加注算力（提升中签率）',
  currentHashrate: '当前持有绿色算力',
  quantity: '申购数量',
  unitFreezeAmount: '单份冻结金额',
  unitHashrate: '单份算力需求',
  totalFreezeAmount: '合计冻结金额',
  totalHashrate: '合计算力需求',
  loading: '加...',
  insufficient: '持有算力不足，请前往【我的】-【权益资产】查看',
  pieceSuffix: '份',
  info: '每份预约将独立参与撮合，最多可一次申购100份。',
};

const MONEY_SYMBOL = '\u00A5';

const ReservationPurchaseConfigCard: React.FC<ReservationPurchaseConfigCardProps> = ({
  baseHashrate,
  extraHashrate,
  canIncreaseHashrate,
  quantity,
  zoneMaxPrice,
  frozenAmount,
  totalRequiredHashrate,
  userInfoLoading,
  availableHashrate,
  isHashrateSufficient,
  mixedPaymentAvailable,
  onDecreaseExtraHashrate,
  onIncreaseExtraHashrate,
  onDecreaseQuantity,
  onIncreaseQuantity,
}) => {
  const singleHashrate = baseHashrate + extraHashrate;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 font-bold text-gray-900">
          <div className="flex w-7 h-7 items-center justify-center rounded border border-orange-100 bg-orange-50">
            <Zap size={14} className="fill-orange-500 text-orange-500" />
          </div>
          <span className="text-sm">{TEXT.title}</span>
        </h3>
        {mixedPaymentAvailable && (
          <span className="inline-flex flex-shrink-0 items-center rounded-full border border-orange-200 bg-red-500 px-2 py-0.5 text-[11px] font-medium text-white shadow-sm whitespace-nowrap">
            混合支付可用
          </span>
        )}
      </div>

      <div className="space-y-4">
        {/* 加注算力区 */}
        <div>
          <div className="mb-2 flex justify-between text-[13px] text-gray-600">
            <span>{TEXT.baseHashrate}</span>
            <span className="font-mono font-medium">{baseHashrate}</span>
          </div>
          <div className="mb-2.5 flex justify-between text-[13px] text-gray-600">
            <span>{TEXT.extraHashrate}</span>
            <span className="font-mono font-medium text-orange-600 tabular-nums">+{extraHashrate}</span>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/50 p-1.5 h-11">
            <button
              onClick={onDecreaseExtraHashrate}
              disabled={extraHashrate <= 0}
              className={`flex h-8 w-10 items-center justify-center rounded-lg font-medium transition-colors ${
                extraHashrate <= 0
                  ? 'cursor-not-allowed text-gray-300'
                  : 'bg-white text-gray-700 shadow-sm border border-gray-200 active:bg-gray-50'
              }`}
            >
              -
            </button>
            <div className="flex-1 text-center font-mono text-base font-bold text-gray-900 tabular-nums">
              {extraHashrate.toFixed(0)}
            </div>
            <button
              onClick={onIncreaseExtraHashrate}
              disabled={!canIncreaseHashrate}
              className={`flex h-8 w-10 items-center justify-center rounded-lg font-medium transition-colors ${
                !canIncreaseHashrate
                  ? 'cursor-not-allowed text-gray-300'
                  : 'bg-white text-orange-600 shadow-sm border border-orange-100 active:bg-orange-50'
              }`}
            >
              +
            </button>
          </div>
        </div>

        {/* 算力不足提醒区 */}
        <div className="rounded-xl bg-gray-50 p-2.5 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">{TEXT.currentHashrate}</span>
            {userInfoLoading ? (
              <span className="text-xs text-gray-400 font-mono">{TEXT.loading}</span>
            ) : (
              <span
                className={`font-mono font-bold tabular-nums text-sm ${
                  isHashrateSufficient ? 'text-gray-900' : 'text-red-500'
                }`}
              >
                {availableHashrate.toFixed(1)}
              </span>
            )}
          </div>
          {!userInfoLoading && !isHashrateSufficient && (
            <div className="flex items-start gap-1 text-[11px] text-red-500 mt-0.5 leading-tight">
              <AlertCircle size={12} className="shrink-0 mt-px" />
              <span>{TEXT.insufficient}</span>
            </div>
          )}
        </div>

        {/* 申购数量区 */}
        <div className="pt-2 border-t border-gray-100">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-[13px] font-medium text-gray-800">{TEXT.quantity}</span>
          </div>
          
          <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/50 p-1.5 h-12">
            <button
              onClick={onDecreaseQuantity}
              disabled={quantity <= 1}
              className={`flex h-9 w-11 items-center justify-center rounded-lg font-medium transition-colors ${
                quantity <= 1
                  ? 'cursor-not-allowed text-gray-300'
                  : 'bg-white text-gray-700 shadow-sm border border-gray-200 active:bg-gray-50'
              }`}
            >
              -
            </button>
            <div className="flex-1 flex items-baseline justify-center gap-0.5">
              <span className="font-mono text-xl font-bold text-gray-900 tabular-nums leading-none">{quantity}</span>
              <span className="text-[11px] text-gray-500">{TEXT.pieceSuffix}</span>
            </div>
            <button
              onClick={onIncreaseQuantity}
              disabled={quantity >= 100}
              className={`flex h-9 w-11 items-center justify-center rounded-lg font-medium transition-colors ${
                quantity >= 100
                  ? 'cursor-not-allowed text-gray-300'
                  : 'bg-white text-red-600 shadow-sm border border-red-100 active:bg-red-50'
              }`}
            >
              +
            </button>
          </div>

          <div className="mt-3.5 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">{TEXT.unitFreezeAmount}</span>
              <span className="font-mono text-gray-700 tabular-nums">
                {MONEY_SYMBOL}{zoneMaxPrice.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">{TEXT.unitHashrate}</span>
              <span className="font-mono text-gray-700 tabular-nums">{singleHashrate}</span>
            </div>
            
            <div className="flex justify-between text-sm font-bold pt-1.5 border-t border-gray-50/50">
              <span className="text-gray-800">{TEXT.totalFreezeAmount}</span>
              <span className="font-mono text-red-600 tabular-nums">
                {MONEY_SYMBOL}{frozenAmount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold">
              <span className="text-gray-800">{TEXT.totalHashrate}</span>
              <span className="font-mono text-orange-500 tabular-nums">{totalRequiredHashrate}</span>
            </div>
          </div>

          <div className="mt-3.5 rounded-lg bg-green-50/50 px-2.5 py-2">
            <div className="flex items-start gap-1.5">
              <Info size={13} className="shrink-0 text-green-500 mt-px" />
              <p className="text-[11px] leading-relaxed text-green-700/90">{TEXT.info}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservationPurchaseConfigCard;
