import React from 'react';
import { Zap, AlertCircle, Info } from 'lucide-react';

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
  onDecreaseExtraHashrate: () => void;
  onIncreaseExtraHashrate: () => void;
  onDecreaseQuantity: () => void;
  onIncreaseQuantity: () => void;
}

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
  onDecreaseExtraHashrate,
  onIncreaseExtraHashrate,
  onDecreaseQuantity,
  onIncreaseQuantity,
}) => {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-lg border border-gray-100">
      <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center">
          <Zap size={18} className="text-orange-600 fill-orange-600" />
        </div>
        <span>申购配置</span>
      </h3>

      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>基础算力需求</span>
          <span className="font-mono font-bold">{baseHashrate}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600 mb-4">
          <span>额外加注算力 (提升中签率)</span>
          <span className="font-mono font-bold text-orange-600">+{extraHashrate}</span>
        </div>

        <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg">
          <button
            onClick={onDecreaseExtraHashrate}
            disabled={extraHashrate <= 0}
            className={`w-8 h-8 flex items-center justify-center bg-white rounded-full shadow font-bold transition-all ${
              extraHashrate <= 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 active:scale-95'
            }`}
          >
            -
          </button>
          <div className="flex-1 text-center font-mono font-bold text-lg text-gray-900">
            {extraHashrate.toFixed(0)}
          </div>
          <button
            onClick={onIncreaseExtraHashrate}
            disabled={!canIncreaseHashrate}
            className={`w-8 h-8 flex items-center justify-center bg-white rounded-full shadow font-bold transition-all ${
              !canIncreaseHashrate ? 'text-gray-300 cursor-not-allowed' : 'text-orange-600 active:scale-95'
            }`}
          >
            +
          </button>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-500">当前持有绿色算力</span>
          {userInfoLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
              <span className="text-sm text-gray-500">加载中...</span>
            </div>
          ) : (
            <span className={`font-mono font-bold ${isHashrateSufficient ? 'text-gray-900' : 'text-red-500'}`}>
              {availableHashrate.toFixed(1)}
            </span>
          )}
        </div>
        {!userInfoLoading && !isHashrateSufficient && (
          <div className="text-xs text-red-500 flex items-center justify-end gap-1">
            <AlertCircle size={12} />
            算力不足，请前往【我的-算力兑换】获取
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 pt-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-gray-700">申购数量</span>
        </div>
        <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg">
          <button
            onClick={onDecreaseQuantity}
            disabled={quantity <= 1}
            className={`w-10 h-10 flex items-center justify-center bg-white rounded-full shadow font-bold text-lg transition-all ${
              quantity <= 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 active:scale-95'
            }`}
          >
            -
          </button>
          <div className="flex-1 text-center">
            <span className="font-mono font-bold text-2xl text-gray-900">{quantity}</span>
            <span className="text-sm text-gray-500 ml-1">份</span>
          </div>
          <button
            onClick={onIncreaseQuantity}
            disabled={quantity >= 100}
            className={`w-10 h-10 flex items-center justify-center bg-white rounded-full shadow font-bold text-lg transition-all ${
              quantity >= 100 ? 'text-gray-300 cursor-not-allowed' : 'text-green-600 active:scale-95'
            }`}
          >
            +
          </button>
        </div>

        <div className="mt-3 flex justify-between text-sm">
          <span className="text-gray-500">单份冻结金额</span>
          <span className="font-mono text-gray-700">¥{zoneMaxPrice.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-gray-500">单份算力需求</span>
          <span className="font-mono text-gray-700">{baseHashrate + extraHashrate}</span>
        </div>
        <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between">
          <span className="text-sm font-medium text-gray-700">合计冻结金额</span>
          <span className="font-mono font-bold text-red-600">¥{frozenAmount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-sm font-medium text-gray-700">合计算力需求</span>
          <span className="font-mono font-bold text-orange-600">{totalRequiredHashrate}</span>
        </div>

        <div className="mt-3 p-2 bg-green-50 rounded-lg border border-green-100">
          <div className="flex items-start gap-2">
            <Info size={14} className="text-green-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-green-700 leading-relaxed">
              每份预约将独立参与撮合，最多可一次申购100份
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservationPurchaseConfigCard;
