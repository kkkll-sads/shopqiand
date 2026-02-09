/**
 * 资产挂牌弹窗组件
 */
import React from 'react';
import { X, CheckCircle } from 'lucide-react';
import { MyCollectionItem, normalizeAssetUrl, computeConsignmentPrice } from '@/services';
import { toString, toNumber, multiply } from '@/utils/currency';
import { useNotification } from '@/context/NotificationContext';
import { UserInfo } from '@/types';
import {
  check48Hours,
  formatSeconds,
  isConsigning,
  hasConsignedSuccessfully,
  isDelivered,
} from '../../hooks/useConsignmentAction';
import { debugLog } from '@/utils/logger';

interface AssetConsignModalProps {
  visible: boolean;
  item: MyCollectionItem | null;
  userInfo: UserInfo | null;
  consignmentCheckData: any;
  availableCouponCount: number;
  actionLoading: boolean;
  actionError: string | null;
  canPerformAction: boolean;
  onClose: () => void;
  onDelivery: () => void;
  onConsign: () => void;
}

export const AssetConsignModal: React.FC<AssetConsignModalProps> = ({
  visible,
  item,
  userInfo,
  consignmentCheckData,
  availableCouponCount,
  actionLoading,
  actionError,
  canPerformAction,
  onClose,
  onDelivery,
  onConsign,
}) => {
  const { showToast } = useNotification();

  if (!visible || !item) return null;

  // 计算核心数据
  const check = consignmentCheckData || {};
  const buyPrice = Number(
    check.buy_price ?? item.buy_price ?? item.price ?? item.current_price ?? item.original_price ?? 0
  );
  const appreciationRate = Number(item.appreciation_rate ?? check.appreciation_rate ?? 0);
  const consignmentPriceVal = buyPrice > 0 ? buyPrice * (1 + appreciationRate) : 0;
  const isOldAsset = !!(item.is_old_asset_package ?? check.is_old_asset_package);

  // 计算锁定状态
  let isLocked = false;
  let remainingSecs = 0;

  if (typeof check.unlocked === 'boolean' && !check.unlocked) {
    isLocked = true;
    remainingSecs = Number(check.remaining_seconds || 0);
  } else if (typeof check.remaining_seconds === 'number' && Number(check.remaining_seconds) > 0) {
    isLocked = true;
    remainingSecs = Number(check.remaining_seconds);
  } else {
    const timeCheck = check48Hours(item.pay_time || item.buy_time || 0);
    if (!timeCheck.passed) {
      isLocked = true;
      remainingSecs = timeCheck.hoursLeft * 3600;
    }
  }

  // 计算服务费
  const serviceFeePrice =
    computeConsignmentPrice(check) ||
    (() => {
      const buy = Number(check.buy_price ?? item.buy_price ?? item.price ?? 0);
      const rate = Number(check.appreciation_rate ?? 0);
      return buy > 0 ? buy * (1 + rate) : 0;
    })();
  const serviceFee = toNumber(multiply(serviceFeePrice, 0.03));
  const balance = parseFloat(userInfo?.service_fee_balance || '0');
  const isBalanceEnough = balance >= serviceFee;
  const hasVoucher = availableCouponCount > 0;

  // 调试日志
  debugLog('AssetConsignModal', '挂牌弹窗数据', {
    buyPrice,
    appreciationRate,
    consignmentPriceVal,
    isOldAsset,
  });

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[#F9F9F9] rounded-xl overflow-hidden max-w-sm w-full relative shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 弹窗标题 */}
        <div className="bg-white px-5 py-4 flex justify-between items-center border-b border-gray-100">
          <div className="text-base font-bold text-gray-900">资产挂牌委托</div>
          <button
            type="button"
            className="p-1 text-gray-400 hover:text-gray-600 active:scale-95 transition-transform"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* 资产卡片 */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex gap-3 mb-4">
              <div className="w-14 h-14 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                <img
                  src={normalizeAssetUrl(item.item_image || item.image || '')}
                  alt={item.item_title || item.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.visibility = 'hidden';
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-gray-900 mb-1 truncate leading-tight">
                  {item.item_title || item.title}
                </div>
                <div className="text-xs text-gray-500 font-mono truncate bg-gray-50 inline-block px-1.5 py-0.5 rounded">
                  确权编号：{item.asset_code || item.order_no || 'Pending...'}
                </div>
              </div>
            </div>

            {/* 核心数据网格 */}
            <div className="pt-3 border-t border-dashed border-gray-100 space-y-2">
              {isOldAsset && (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 rounded-lg border border-amber-200 w-fit">
                  <span className="text-xs font-medium text-amber-700">旧资产</span>
                </div>
              )}
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-400 mb-0.5">买入价</span>
                  <span className="text-sm font-bold text-gray-900 font-[DINAlternate-Bold]">
                    ¥{toString(buyPrice, 2)}
                  </span>
                </div>
                <div className="flex flex-col items-center border-l border-r border-gray-50">
                  <span className="text-[10px] text-gray-400 mb-0.5">增值比例</span>
                  <span
                    className={`text-sm font-bold font-[DINAlternate-Bold] ${
                      appreciationRate >= 0 ? 'text-red-500' : 'text-green-600'
                    }`}
                  >
                    {(appreciationRate >= 0 ? '+' : '') + (appreciationRate * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-gray-400 mb-0.5">预估回款</span>
                  <span className="text-sm font-bold text-gray-900 font-[DINAlternate-Bold]">
                    ¥{toString(consignmentPriceVal, 2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 状态栏 */}
          {isLocked ? (
            <div className="flex items-center justify-center gap-2 bg-red-50 text-red-600 py-2.5 rounded-lg border border-red-100 px-3">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-medium">🔒 锁定期剩余 {formatSeconds(remainingSecs)}</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 bg-green-50 text-green-700 py-2.5 rounded-lg border border-green-100">
              <CheckCircle size={14} className="text-green-600" />
              <span className="text-xs font-medium">T+1 解锁期已满，当前可流转</span>
            </div>
          )}

          {/* 挂牌成本清单 */}
          <div>
            <div className="flex items-center gap-2 mb-2 px-1">
              <div className="w-0.5 h-3 bg-gray-300 rounded-full"></div>
              <span className="text-xs font-bold text-gray-500">挂牌成本核算</span>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-4">
              {/* 服务费 */}
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm font-medium text-gray-700">确权技术服务费 (3%)</div>
                  <div className={`text-xs mt-0.5 ${isBalanceEnough ? 'text-gray-400' : 'text-red-500'}`}>
                    当前确权金: ¥{balance.toFixed(2)} {!isBalanceEnough && '(不足)'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900 font-[DINAlternate-Bold]">¥{serviceFee.toFixed(2)}</div>
                  {!isBalanceEnough && (
                    <button
                      className="text-[10px] text-red-600 bg-red-50 px-1.5 py-0.5 rounded mt-1"
                      onClick={() => {
                        showToast('info', '余额不足', '请前往【我的-服务费】进行充值');
                      }}
                    >
                      去充值
                    </button>
                  )}
                </div>
              </div>

              <div className="w-full h-px bg-gray-50" />

              {/* 流转券 */}
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm font-medium text-gray-700">资产流转券</div>
                  <div className={`text-xs mt-0.5 ${hasVoucher ? 'text-gray-400' : 'text-red-500'}`}>
                    持有数量: {availableCouponCount} 张
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`text-sm font-bold font-[DINAlternate-Bold] ${hasVoucher ? 'text-gray-900' : 'text-red-500'}`}
                  >
                    1 张
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 错误提示 */}
          {actionError && (
            <div className="text-xs text-red-600 text-center bg-red-50 py-2 rounded-lg">{actionError}</div>
          )}

          {/* 底部双按钮 */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onDelivery}
              disabled={actionLoading || isConsigning(item) || hasConsignedSuccessfully(item) || isDelivered(item)}
              className="flex-[3] flex flex-col items-center justify-center py-3 rounded-xl bg-white border border-gray-200 text-gray-600 active:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              <span className="text-sm font-bold">权益交割</span>
              <span className="text-[10px] text-gray-400 font-normal scale-90">转为每日分红</span>
            </button>

            <button
              onClick={onConsign}
              disabled={actionLoading || !canPerformAction || isConsigning(item)}
              className="flex-[7] flex flex-col items-center justify-center py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-200 active:scale-[0.98] disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed transition-all"
            >
              {actionLoading ? (
                <span className="text-sm font-bold">提交中...</span>
              ) : (
                <>
                  <span className="text-sm font-bold">确认挂牌上架</span>
                  <span className="text-[10px] text-white/80 font-normal scale-90">立即发布到撮合池</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetConsignModal;
