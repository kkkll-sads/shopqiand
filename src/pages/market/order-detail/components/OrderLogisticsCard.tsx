import React from 'react';
import { Copy, Truck } from 'lucide-react';
import { useNotification } from '@/context/NotificationContext';
import { copyWithToast } from '@/utils/copyWithToast';

interface OrderLogisticsCardProps {
  shippingCompany: string;
  shippingNo?: string;
}

const OrderLogisticsCard: React.FC<OrderLogisticsCardProps> = ({
  shippingCompany,
  shippingNo,
}) => {
  const { showToast } = useNotification();

  const handleCopyShippingNo = async (text: string) => {
    await copyWithToast(text, showToast, {
      successDescription: '物流单号已复制到剪贴板',
    });
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm mx-4 rounded-2xl shadow-lg shadow-gray-200/50 border border-white p-5 mb-4">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
          <Truck className="w-4 h-4 text-red-500" />
        </div>
        <h2 className="font-semibold text-gray-900 text-base">物流信息</h2>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center py-2">
          <span className="text-sm text-gray-500">物流公司</span>
          <span className="text-sm text-gray-900 font-medium">{shippingCompany}</span>
        </div>
        {shippingNo && (
          <div className="flex justify-between items-center py-2 border-t border-gray-50 pt-4">
            <span className="text-sm text-gray-500">物流单号</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-900 font-medium font-mono">{shippingNo}</span>
              <button
                type="button"
                onClick={() => {
                  void handleCopyShippingNo(shippingNo);
                }}
                className="p-1.5 hover:bg-gray-50 rounded-lg transition-colors active:scale-95"
                aria-label="复制物流单号"
              >
                <Copy className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderLogisticsCard;
