import React from 'react';
import { Calendar, CreditCard, FileText, MapPin, Phone, User, X } from 'lucide-react';
import { ConsignmentDetailData } from '@/services';
import { formatAmount, formatTime } from '@/utils/format';

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
              <span className="text-xs font-medium text-gray-800">{detail.title}</span>
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard size={16} className="text-blue-600" />
                <span className="text-xs text-gray-600">寄售价</span>
              </div>
              <span className="text-xs text-gray-800">
                ¥ {formatOrderPrice(detail.consignment_price)}
              </span>
            </div>
          </div>

          {(detail.buyer_id ||
            detail.buyer_username ||
            detail.buyer_nickname ||
            detail.buyer_mobile) && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <User size={16} className="text-blue-600" />
                  买家信息
                </h4>
                <div className="space-y-2 text-xs text-gray-700">
                  {detail.buyer_id && (
                    <div>买家ID：{detail.buyer_id}</div>
                  )}
                  {detail.buyer_username && (
                    <div>用户名：{detail.buyer_username}</div>
                  )}
                  {detail.buyer_nickname && (
                    <div>昵称：{detail.buyer_nickname}</div>
                  )}
                  {detail.buyer_mobile && (
                    <div className="flex items-center gap-1">
                      <Phone size={14} className="text-gray-400" />
                      <span>{detail.buyer_mobile}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

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
                <div className="text-xs text-gray-600">
                  物流单号：{detail.delivery_info.tracking_no}
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

