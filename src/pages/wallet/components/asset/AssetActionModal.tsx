import React from 'react';
import { AlertCircle, CheckCircle, ShoppingBag, X } from 'lucide-react';
import { normalizeAssetUrl, type MyCollectionItem } from '@/services';
import type { useAssetActionModal } from '@/hooks/useAssetActionModal';

type AssetActionModalState = ReturnType<typeof useAssetActionModal>;

interface AssetActionModalProps {
  actionModal: AssetActionModalState;
  consignmentTicketCount: number;
  hasConsignedBefore: (item: MyCollectionItem) => boolean;
  hasConsignedSuccessfully: (item: MyCollectionItem) => boolean;
  isConsigning: (item: MyCollectionItem) => boolean;
  isDelivered: (item: MyCollectionItem) => boolean;
}

const AssetActionModal: React.FC<AssetActionModalProps> = ({
  actionModal,
  consignmentTicketCount,
  hasConsignedBefore,
  hasConsignedSuccessfully,
  isConsigning,
  isDelivered,
}) => {
  if (!actionModal.isOpen || !actionModal.context.selectedItem) {
    return null;
  }

  const item = actionModal.context.selectedItem;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={actionModal.close}>
      <div className="bg-white rounded-xl p-6 max-w-sm w-full relative" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600"
          onClick={actionModal.close}
        >
          <X size={20} />
        </button>

        <div className="flex gap-3 mb-4">
          <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
            <img
              src={normalizeAssetUrl(item.image) || undefined}
              alt={item.title}
              className="w-full h-full object-cover"
              onError={(event) => {
                (event.target as HTMLImageElement).style.visibility = 'hidden';
              }}
            />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-800 mb-1">{item.title}</div>
            <div className="text-xs text-gray-500">购买时间: {item.pay_time_text || item.buy_time_text}</div>
            <div className="text-sm font-bold text-gray-900 mt-1">¥ {item.price}</div>
          </div>
        </div>

        {(() => {
          if (
            isConsigning(item) ||
            hasConsignedSuccessfully(item) ||
            isDelivered(item) ||
            hasConsignedBefore(item)
          ) {
            return null;
          }

          return (
            <div className="flex bg-gray-100 p-1 rounded-lg mb-4">
              <button
                onClick={actionModal.switchToDelivery}
                className={`flex-1 py-2 text-xs rounded-md transition-colors ${
                  actionModal.context.actionType === 'delivery'
                    ? 'bg-white text-red-600 font-medium shadow-sm'
                    : 'text-gray-600'
                }`}
              >
                权益分割
              </button>
              <button
                onClick={actionModal.switchToConsignment}
                className={`flex-1 py-2 text-xs rounded-md transition-colors ${
                  actionModal.context.actionType === 'consignment'
                    ? 'bg-white text-red-600 font-medium shadow-sm'
                    : 'text-gray-600'
                }`}
              >
                寄售
              </button>
            </div>
          );
        })()}

        <div className="space-y-3 mb-4">
          {actionModal.context.actionType === 'delivery' ? (
            actionModal.deliveryCheckResult && (
              <>
                {actionModal.deliveryCheckResult.isConsigning && (
                  <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                    <AlertCircle size={16} />
                    <span>该藏品正在寄售中，无法提货</span>
                  </div>
                )}
                {!actionModal.deliveryCheckResult.isConsigning &&
                  actionModal.deliveryCheckResult.hasConsignedSuccessfully && (
                    <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                      <AlertCircle size={16} />
                      <span>该藏品已经寄售成功（已售出），无法提货</span>
                    </div>
                  )}
                {!actionModal.deliveryCheckResult.isConsigning &&
                  !actionModal.deliveryCheckResult.hasConsignedSuccessfully &&
                  actionModal.deliveryCheckResult.isDelivered && (
                    <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                      <AlertCircle size={16} />
                      <span>该藏品已经提货，无法再次提货</span>
                    </div>
                  )}
                {!actionModal.deliveryCheckResult.isConsigning &&
                  !actionModal.deliveryCheckResult.hasConsignedSuccessfully &&
                  !actionModal.deliveryCheckResult.isDelivered &&
                  (actionModal.deliveryCheckResult.can48Hours ? (
                    <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                      <CheckCircle size={16} />
                      <span>已满足48小时提货条件</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                      <AlertCircle size={16} />
                      <span>还需等待 {actionModal.deliveryCheckResult.hoursLeft} 小时才能提货</span>
                    </div>
                  ))}
                {!actionModal.deliveryCheckResult.isConsigning &&
                  !actionModal.deliveryCheckResult.hasConsignedSuccessfully &&
                  !actionModal.deliveryCheckResult.isDelivered &&
                  actionModal.deliveryCheckResult.hasConsignedBefore && (
                    <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                      <AlertCircle size={16} />
                      <span>该藏品曾经寄售过，将执行强制提货</span>
                    </div>
                  )}
              </>
            )
          ) : (
            actionModal.consignmentCheckResult &&
            actionModal.deliveryCheckResult && (
              <>
                {actionModal.deliveryCheckResult.isConsigning && (
                  <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                    <AlertCircle size={16} />
                    <span>该藏品正在寄售中，无法再次寄售</span>
                  </div>
                )}
                {!actionModal.deliveryCheckResult.isConsigning &&
                  actionModal.deliveryCheckResult.hasConsignedSuccessfully && (
                    <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                      <AlertCircle size={16} />
                      <span>该藏品已经寄售成功（已售出），无法再次寄售</span>
                    </div>
                  )}
                {!actionModal.deliveryCheckResult.isConsigning &&
                  !actionModal.deliveryCheckResult.hasConsignedSuccessfully &&
                  (actionModal.consignmentCheckResult.unlocked ? (
                    <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                      <CheckCircle size={16} />
                      <span>已满足48小时寄售条件</span>
                    </div>
                  ) : (
                    <div className="bg-red-50 px-3 py-2 rounded-lg">
                      <div className="flex items-center gap-2 text-xs text-red-600 mb-1">
                        <AlertCircle size={16} />
                        <span>距离可寄售时间还有：</span>
                      </div>
                      {actionModal.consignmentCheckResult.remainingText ? (
                        <div className="text-sm font-bold text-red-700 text-center">
                          {actionModal.consignmentCheckResult.remainingText}
                        </div>
                      ) : actionModal.context.countdown ? (
                        <div className="text-sm font-bold text-red-700 text-center">
                          {String(actionModal.context.countdown.hours).padStart(2, '0')}:
                          {String(actionModal.context.countdown.minutes).padStart(2, '0')}:
                          {String(actionModal.context.countdown.seconds).padStart(2, '0')}
                        </div>
                      ) : typeof actionModal.consignmentCheckResult.remainingSeconds === 'number' &&
                        actionModal.consignmentCheckResult.remainingSeconds > 0 ? (
                        <div className="text-sm font-bold text-red-700 text-center">
                          {Math.floor(actionModal.consignmentCheckResult.remainingSeconds / 3600)}h{' '}
                          {Math.floor((actionModal.consignmentCheckResult.remainingSeconds % 3600) / 60)}m{' '}
                          {actionModal.consignmentCheckResult.remainingSeconds % 60}s
                        </div>
                      ) : (
                        <div className="text-sm font-bold text-red-700 text-center">寄售需要满足购买后48小时，请稍后重试</div>
                      )}
                    </div>
                  ))}
                {!actionModal.deliveryCheckResult.isConsigning &&
                  !actionModal.deliveryCheckResult.hasConsignedSuccessfully && (
                    <div className="bg-red-50 px-3 py-2 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-red-600">
                          <ShoppingBag size={16} />
                          <span>我的寄售券：</span>
                        </div>
                        <div className="text-sm font-bold text-red-700">{consignmentTicketCount} 张</div>
                      </div>
                      {consignmentTicketCount === 0 && (
                        <div className="text-xs text-red-600 mt-1">您没有寄售券，无法进行寄售</div>
                      )}
                    </div>
                  )}
              </>
            )
          )}
        </div>

        {actionModal.context.error && (
          <div className="text-xs text-red-600 mb-2">{actionModal.context.error}</div>
        )}

        <button
          onClick={actionModal.handleSubmit}
          disabled={actionModal.isSubmitting || !actionModal.canSubmit}
          className={`w-full py-3 rounded-lg text-sm font-medium transition-colors ${
            !actionModal.isSubmitting && actionModal.canSubmit
              ? 'bg-red-600 text-white active:bg-red-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {actionModal.isSubmitting
            ? '提交中...'
            : actionModal.context.actionType === 'delivery'
              ? '权益分割'
              : '确认寄售'}
        </button>
      </div>
    </div>
  );
};

export default AssetActionModal;
