import React from 'react';
import { Phone, MapPin } from 'lucide-react';

interface OrderRecipientCardProps {
  recipientName: string;
  recipientPhone?: string;
  recipientAddress?: string;
}

const OrderRecipientCard: React.FC<OrderRecipientCardProps> = ({
  recipientName,
  recipientPhone,
  recipientAddress,
}) => {
  return (
    <div className="bg-white/80 backdrop-blur-sm mx-4 rounded-2xl shadow-lg shadow-gray-200/50 border border-white p-5 mb-4">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
          <MapPin className="w-4 h-4 text-blue-500" />
        </div>
        <h2 className="font-semibold text-gray-900 text-base">收货信息</h2>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3 py-2">
          <span className="text-sm text-gray-500 w-16 flex-shrink-0">收货人</span>
          <span className="text-sm text-gray-900 font-medium">{recipientName}</span>
        </div>
        {recipientPhone && (
          <div className="flex items-center gap-3 py-2 border-t border-gray-50 pt-4">
            <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-sm text-gray-900 font-medium">{recipientPhone}</span>
          </div>
        )}
        {recipientAddress && (
          <div className="flex items-start gap-3 py-2 border-t border-gray-50 pt-4">
            <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-gray-900 leading-relaxed">{recipientAddress}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderRecipientCard;
