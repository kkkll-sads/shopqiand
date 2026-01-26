/**
 * PaymentMethodCard - 支付方式卡片组件
 */
import React from 'react';
import { CheckCircle, CreditCard } from 'lucide-react';
import { PaymentMethod } from '../../hooks/usePaymentMethods';

interface PaymentMethodCardProps {
  method: PaymentMethod;
  selected: boolean;
  onSelect: (methodId: string) => void;
}

const PaymentMethodCard: React.FC<PaymentMethodCardProps> = ({
  method,
  selected,
  onSelect,
}) => {
  return (
    <button
      onClick={() => onSelect(method.id)}
      className={`relative p-4 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-3 ${
        selected
          ? `bg-red-50 text-red-600 border-red-200 shadow-lg scale-[1.02]`
          : 'bg-white border-gray-100 text-gray-600 hover:border-red-100 hover:shadow-md'
      }`}
    >
      <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm relative overflow-hidden">
        {method.icon && (
          <img
            src={method.icon}
            alt={method.name}
            className="w-full h-full object-cover p-2"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('opacity-0');
            }}
          />
        )}
        <CreditCard size={24} className={`text-red-600 absolute transition-opacity ${method.icon ? 'opacity-0' : ''}`} />
      </div>
      <span className="font-bold text-sm">{method.name}</span>
      {selected && (
        <div className="absolute top-2 right-2">
          <CheckCircle size={16} fill="currentColor" />
        </div>
      )}
    </button>
  );
};

export default PaymentMethodCard;
