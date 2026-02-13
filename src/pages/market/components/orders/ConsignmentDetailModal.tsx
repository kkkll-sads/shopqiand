import React from 'react';
import { Calendar, Copy, CreditCard, FileText, MapPin, Phone, ReceiptText, User, X } from 'lucide-react';
import { useNotification } from '@/context/NotificationContext';
import { ConsignmentDetailData } from '@/services';
import { copyWithToast } from '@/utils/copyWithToast';
import { formatTime } from '@/utils/format';

interface ConsignmentDetailModalProps {
  visible: boolean;
  detail: ConsignmentDetailData | null;
  onClose: () => void;
  formatOrderPrice: (price: number | string | undefined) => string;
}

const ConsignmentDetailModal: React.FC<ConsignmentDetailModalProps> = ({
  visible,
  detail,
  onClose,
  formatOrderPrice,
}) => {
  const { showToast } = useNotification();

  const handleCopy = async (value: string, description: string) => {
    await copyWithToast(value, showToast, {
      successDescription: description,
    });
  };

  const getTimeText = (text?: string, rawTime?: number | string) => {
    if (text) return text;
    if (!rawTime) return '-';
    return formatTime(rawTime);
  };

  if (!visible || !detail) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between z-10">
          <h3 className="text-lg font-bold text-gray-900">寄售详情</h3>
          <button
            type="button"
            className="p-1 text-gray-400 hover:text-gray-600 active:bg-gray-100 rounded-full"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-blue-600" />
                <span className="text-xs text-gray-600">藏品名称</span>
              </div>
              <span className="text-xs font-medium text-gray-800">
                {detail.title || '-'}
              </span>
            </div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-blue-600" />
                <span className="text-xs text-gray-600">寄售状态</span>
              </div>
              <span className="text-xs font-medium text-blue-600">
                {detail.consignment_status_text || '已售出'}
              </span>
            </div>
            {detail.asset_code && (
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ReceiptText size={16} className="text-blue-600" />
                  <span className="text-xs text-gray-600">确权编号</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-800">{detail.asset_code}</span>
                  <button
                    type="button"
                    className="p-0.5 rounded text-gray-400 active:bg-gray-100"
                    onClick={() => {
                      void handleCopy(detail.asset_code!, '确权编号已复制到剪贴板');
                    }}
                    aria-label="复制确权编号"
                  >
                    <Copy size={11} />
                  </button>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CreditCard size={16} className="text-blue-600" />
                <span className="text-xs text-gray-600">买入价</span>
              </div>
              <span className="text-xs text-gray-800">
                ¥ {formatOrderPrice(detail.buy_price ?? detail.original_price)}
              </span>
            </div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CreditCard size={16} className="text-blue-600" />
                <span className="text-xs text-gray-600">寄售价</span>
              </div>
              <span className="text-xs text-gray-800">
                ¥ {formatOrderPrice(detail.consignment_price)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard size={16} className="text-blue-600" />
                <span className="text-xs text-gray-600">成交价</span>
              </div>
              <span className="text-xs text-gray-800">
                ¥ {formatOrderPrice(detail.sold_price ?? detail.consignment_price)}
              </span>
            </div>
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2">
                <CreditCard size={16} className="text-blue-600" />
                <span className="text-xs text-gray-600">服务费</span>
              </div>
              <span className="text-xs text-gray-800">
                ¥ {formatOrderPrice(detail.service_fee)}
              </span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <ReceiptText size={16} className="text-blue-600" />
              交易信息
            </h4>
            <div className="space-y-2 text-xs text-gray-700">
              <div className="flex items-start justify-between gap-2">
                <span className="text-gray-500">订单号</span>
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="break-all text-right">{detail.order_no || '-'}</span>
                  {detail.order_no && (
                    <button
                      type="button"
                      className="p-0.5 rounded text-gray-400 active:bg-gray-100 flex-shrink-0"
                      onClick={() => {
                        void handleCopy(detail.order_no!, '订单号已复制到剪贴板');
                      }}
                      aria-label="复制订单号"
                    >
                      <Copy size={11} />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-gray-500">流水号</span>
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="break-all text-right">{detail.flow_no || '-'}</span>
                  {detail.flow_no && (
                    <button
                      type="button"
                      className="p-0.5 rounded text-gray-400 active:bg-gray-100 flex-shrink-0"
                      onClick={() => {
                        void handleCopy(detail.flow_no!, '流水号已复制到剪贴板');
                      }}
                      aria-label="复制流水号"
                    >
                      <Copy size={11} />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">寄售时间</span>
                <span>{getTimeText(detail.create_time_text, detail.create_time)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">成交时间</span>
                <span>{getTimeText(detail.sold_time_text, detail.sold_time)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">流水时间</span>
                <span>{getTimeText(detail.money_log_time_text, detail.money_log_time)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">更新时间</span>
                <span>{getTimeText(detail.update_time_text, detail.update_time)}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <CreditCard size={16} className="text-blue-600" />
              结算信息
            </h4>
            <div className="space-y-2 text-xs text-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">结算状态</span>
                <span>{detail.settle_status_text || '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">结算规则</span>
                <span>{detail.settle_rule || '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">本金</span>
                <span>¥ {formatOrderPrice(detail.principal_amount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">收益</span>
                <span>¥ {formatOrderPrice(detail.profit_amount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">到账可提余额</span>
                <span>¥ {formatOrderPrice(detail.payout_total_withdrawable)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">到账消费金</span>
                <span>{formatOrderPrice(detail.payout_total_consume)}</span>
              </div>
            </div>
          </div>

          {detail.description && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <h4 className="text-sm font-semibold text-gray-800 mb-2">说明</h4>
              <p className="text-xs text-gray-600 leading-relaxed">{detail.description}</p>
            </div>
          )}

          {detail.delivery_info && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 space-y-2">
              <h4 className="text-sm font-semibold text-gray-800">物流信息</h4>
              {detail.delivery_info?.address && (
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <MapPin size={14} className="text-gray-400" />
                  <span className="truncate">{detail.delivery_info.address}</span>
                </div>
              )}
              {detail.delivery_info?.receiver && (
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <User size={14} className="text-gray-400" />
                  <span>{detail.delivery_info.receiver}</span>
                </div>
              )}
              {detail.delivery_info?.phone && (
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Phone size={14} className="text-gray-400" />
                  <span>{detail.delivery_info.phone}</span>
                </div>
              )}
              {detail.delivery_info?.logistics_company && (
                <div className="text-xs text-gray-600">
                  物流公司：{detail.delivery_info.logistics_company}
                </div>
              )}
              {detail.delivery_info?.tracking_no && (
                <div className="text-xs text-gray-600 flex items-center gap-1.5">
                  <span>物流单号：{detail.delivery_info.tracking_no}</span>
                  <button
                    type="button"
                    className="p-0.5 rounded text-gray-400 active:bg-gray-100"
                    onClick={() => {
                      void handleCopy(detail.delivery_info!.tracking_no!, '物流单号已复制到剪贴板');
                    }}
                    aria-label="复制物流单号"
                  >
                    <Copy size={11} />
                  </button>
                </div>
              )}
              {detail.delivery_info?.status_text && (
                <div className="text-xs text-gray-600">
                  状态：{detail.delivery_info.status_text}
                </div>
              )}
              {detail.delivery_info?.update_time && (
                <div className="text-xs text-gray-600">
                  更新时间：{formatTime(detail.delivery_info.update_time)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConsignmentDetailModal;
