import React from 'react';
import { Store, X, Copy } from 'lucide-react';
import {
  type MyCollectionItem,
  consignCollectionItem,
  computeConsignmentPrice,
  normalizeAssetUrl,
} from '@/services';
import type { UserInfo } from '@/types';
import { getStoredToken } from '@/services/client';
import { isSuccess } from '@/utils/apiHelpers';
import { copyToClipboard } from '@/utils/clipboard';

interface ConsignmentModalProps {
  visible: boolean;
  item: any;
  initialItem?: MyCollectionItem | null;
  routeId?: string;
  userInfo: UserInfo | null;
  consignmentCheckData: any;
  consignmentTicketCount: number;
  actionError: string | null;
  actionLoading: boolean;
  onClose: () => void;
  onActionError: (error: string | null) => void;
  onActionLoadingChange: (loading: boolean) => void;
  onConsignmentSuccess: () => void;
  showToast: (type: string, title: string, description?: string) => void;
}

const ConsignmentModal: React.FC<ConsignmentModalProps> = ({
  visible,
  item,
  initialItem,
  routeId,
  userInfo,
  consignmentCheckData,
  consignmentTicketCount,
  actionError,
  actionLoading,
  onClose,
  onActionError,
  onActionLoadingChange,
  onConsignmentSuccess,
  showToast,
}) => {
  const handleCopyAssetCode = async () => {
    const text = item?.asset_code || item?.order_no || '';
    if (!text) return;

    const success = await copyToClipboard(text);
    if (success) {
      showToast('success', '复制成功', '确权编号已复制到剪贴板');
    } else {
      showToast('error', '复制失败', '请手动复制');
    }
  };

  const isConsignmentUnlocked = (() => {
    if (!consignmentCheckData) return false;
    if (consignmentCheckData.can_consign === true || consignmentCheckData.unlocked === true) {
      return true;
    }
    const remainingSecondsRaw = consignmentCheckData.remaining_seconds;
    if (
      remainingSecondsRaw !== undefined &&
      remainingSecondsRaw !== null &&
      remainingSecondsRaw !== ''
    ) {
      const remainingSeconds = Number(remainingSecondsRaw);
      if (Number.isFinite(remainingSeconds)) {
        return remainingSeconds <= 0;
      }
    }
    return false;
  })();

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[#F9F9F9] rounded-xl overflow-hidden max-w-sm w-full relative shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
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

        <div className="p-5 space-y-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex gap-3 mb-3">
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
                <div className="text-sm font-bold text-gray-900 mb-1 truncate">
                  {item.item_title || item.title}
                </div>
                <div className="text-xs text-gray-500 font-mono truncate bg-gray-50 inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded">
                  <span>确权编号：{item.asset_code || item.order_no || 'Pending...'}</span>
                  {(item.asset_code || item.order_no) && (
                    <button
                      type="button"
                      className="p-0.5 rounded text-gray-400 active:bg-gray-100"
                      onClick={() => {
                        void handleCopyAssetCode();
                      }}
                      aria-label="复制确权编号"
                    >
                      <Copy size={11} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {(() => {
              const check = consignmentCheckData || {};
              const buyPrice = Number(check.buy_price ?? item.buy_price ?? item.price ?? 0);
              const appreciationRate = Number(item.appreciation_rate ?? check.appreciation_rate ?? 0);
              const consignmentPriceVal = buyPrice > 0 ? buyPrice * (1 + appreciationRate) : 0;
              const isOldAsset = !!(item.is_old_asset_package ?? check.is_old_asset_package);

              return (
                <div className="pt-3 border-t border-dashed border-gray-100 space-y-2">
                  {isOldAsset && (
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 rounded-lg border border-amber-200 w-fit mb-2">
                      <span className="text-xs font-medium text-amber-700">旧资产</span>
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-400 mb-1">买入价</span>
                      <span className="text-sm font-bold text-gray-900">¥{buyPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-400 mb-1">增值比例</span>
                      <span
                        className={`text-sm font-bold ${
                          appreciationRate >= 0 ? 'text-red-500' : 'text-green-600'
                        }`}
                      >
                        {(appreciationRate >= 0 ? '+' : '') + (appreciationRate * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-400 mb-1">预期回款</span>
                      <span className="text-sm font-bold text-gray-900">¥{consignmentPriceVal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {consignmentCheckData && (() => {
            if (!isConsignmentUnlocked) {
              return (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <div className="text-sm text-orange-700 font-medium mb-1">⏰ T+1 解锁倒计时</div>
                  <div className="text-xs text-orange-600">
                    {consignmentCheckData.remaining_text || '计算中...'}
                  </div>
                </div>
              );
            }
            return (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="text-sm text-green-700 font-medium">✓ 已解锁，可申请寄售</div>
              </div>
            );
          })()}

          {(() => {
            const check = consignmentCheckData || {};
            const consignmentPriceVal = computeConsignmentPrice(check) || (() => {
              const buy = Number(check.buy_price ?? item.buy_price ?? item.price ?? 0);
              const rate = Number(check.appreciation_rate ?? 0);
              return buy > 0 ? buy * (1 + rate) : 0;
            })();
            const serviceFee = consignmentPriceVal * 0.03;

            return (
              <div className="bg-white rounded-lg p-4 border border-gray-100">
                <div className="text-sm font-bold text-gray-700 mb-3">挂牌成本核算</div>

                <div className="flex justify-between items-center mb-3">
                  <div>
                    <div className="text-sm font-medium text-gray-700">确权技术服务费 (3%)</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      当前余额: ¥{userInfo?.service_fee_balance || '0'}
                    </div>
                  </div>
                  <div className="text-sm font-bold text-gray-900">{serviceFee.toFixed(2)} 元</div>
                </div>

                <div className="w-full h-px bg-gray-50" />

                <div className="flex justify-between items-center mt-3">
                  <div>
                    <div className="text-sm font-medium text-gray-700">资产流转券</div>
                    <div className="text-xs text-gray-400 mt-0.5">持有数量: {consignmentTicketCount}张</div>
                  </div>
                  <div className="text-sm font-bold text-gray-900">{consignmentTicketCount}张</div>
                </div>
              </div>
            );
          })()}

          {actionError && (
            <div className="text-xs text-red-600 text-center bg-red-50 py-2 rounded-lg">{actionError}</div>
          )}

          <button
            onClick={async () => {
              const token = getStoredToken();
              if (!token) {
                showToast('warning', '请登录');
                return;
              }

              if (!isConsignmentUnlocked) {
                showToast('warning', '时间未到', '寄售需要满足购买后48小时');
                return;
              }

              onActionLoadingChange(true);
              onActionError(null);

              try {
                const collectionId =
                  item?.user_collection_id ||
                  item?.id ||
                  initialItem?.user_collection_id ||
                  initialItem?.id ||
                  (routeId ? Number(routeId) : undefined);

                if (!collectionId) {
                  onActionError('无法获取藏品ID，请返回重试');
                  onActionLoadingChange(false);
                  return;
                }

                const priceValue = computeConsignmentPrice(consignmentCheckData) || (() => {
                  const c = consignmentCheckData || {};
                  const buy = Number(c.buy_price ?? item.buy_price ?? item.price ?? 0);
                  const rate = Number(c.appreciation_rate ?? 0);
                  return buy > 0 ? buy * (1 + rate) : 0;
                })();

                const res = await consignCollectionItem({
                  user_collection_id: collectionId,
                  price: priceValue,
                  token,
                });

                if (isSuccess(res)) {
                  showToast('success', '提交成功', res.msg || '寄售申请已提交');
                  onConsignmentSuccess();
                } else {
                  const errorMsg = res.msg || res.message || '寄售申请失败';
                  onActionError(errorMsg);
                  showToast('error', '操作失败', errorMsg);
                }
              } catch (err: any) {
                const errorMsg = err?.msg || err?.message || '寄售申请失败';
                onActionError(errorMsg);
                showToast('error', '提交失败', errorMsg);
              } finally {
                onActionLoadingChange(false);
              }
            }}
            disabled={actionLoading}
            className={`w-full py-3.5 rounded-lg font-bold text-white transition-all ${
              actionLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-[#8B0000] to-[#A00000] hover:shadow-lg active:scale-[0.98]'
            }`}
          >
            {actionLoading ? '提交中...' : '确认挂牌'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConsignmentModal;
