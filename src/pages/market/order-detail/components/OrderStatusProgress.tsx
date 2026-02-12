import React from 'react';
import { Check } from 'lucide-react';

interface OrderStep {
  key: string;
  label: string;
  time: number;
  active: boolean;
}

interface OrderStatusProgressProps {
  statusText?: string;
  orderSteps: OrderStep[];
  currentStep: number;
  formatDateTime: (timestamp: number) => string;
}

const OrderStatusProgress: React.FC<OrderStatusProgressProps> = ({
  statusText,
  orderSteps,
  currentStep,
  formatDateTime,
}) => {
  return (
    <>
      <div className="mx-4 mb-4 p-4 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl shadow-red-500/10 border border-white/50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 mb-1">订单状态</p>
            <p className="text-lg font-bold text-gray-900">{statusText || '处理中'}</p>
          </div>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`w-2 h-2 rounded-full transition-all ${
                  step <= currentStep
                    ? 'bg-gradient-to-r from-red-500 to-red-600 scale-110'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-sm mx-4 mt-0 rounded-2xl shadow-lg shadow-gray-200/50 border border-white p-6 mb-4">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-1 h-5 bg-gradient-to-b from-red-500 to-red-600 rounded-full" />
          <h2 className="font-semibold text-gray-900 text-base">物流进度</h2>
        </div>

        <div className="relative">
          {orderSteps.map((step, index) => (
            <div key={step.key} className="relative pb-8 last:pb-0 flex items-start">
              {index < orderSteps.length - 1 && (
                <div
                  className={`absolute left-3 top-8 w-0.5 h-full transition-colors z-0 ${
                    step.active ? 'bg-gradient-to-b from-red-500 to-red-400' : 'bg-gray-200'
                  }`}
                />
              )}

              <div
                className={`relative z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                  step.active
                    ? 'bg-gradient-to-br from-red-500 to-red-600 border-red-500 shadow-lg shadow-red-500/30 scale-110'
                    : 'bg-white border-gray-300'
                }`}
              >
                {step.active && <Check className="w-3.5 h-3.5 text-white font-bold" strokeWidth={3} />}
              </div>

              <div className="flex-1 ml-4 pt-0.5 min-w-0">
                <p
                  className={`text-sm mb-1.5 transition-colors ${
                    step.active ? 'text-gray-900 font-semibold' : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </p>
                <p className={`text-xs transition-colors ${step.active ? 'text-gray-600' : 'text-gray-400'}`}>
                  {step.time > 0 ? formatDateTime(step.time) : '等待中...'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default OrderStatusProgress;
