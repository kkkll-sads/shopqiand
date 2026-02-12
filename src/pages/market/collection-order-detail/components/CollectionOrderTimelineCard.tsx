import React from 'react';
import { Calendar, CheckCircle } from 'lucide-react';
import { OrderStepItem } from '../types';

interface CollectionOrderTimelineCardProps {
  orderSteps: OrderStepItem[];
  formatDateTime: (timestamp?: number) => string;
}

const CollectionOrderTimelineCard: React.FC<CollectionOrderTimelineCardProps> = ({
  orderSteps,
  formatDateTime,
}) => (
  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-white/50 mx-4">
    <div className="flex items-center gap-2.5 mb-5">
      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
        <Calendar className="w-4 h-4 text-blue-600" />
      </div>
      <h2 className="font-semibold text-gray-900 text-base">订单进度</h2>
    </div>

    <div className="relative">
      {orderSteps.map((step, index) => (
        <div key={step.key} className="relative pb-8 last:pb-0 flex items-start">
          <div
            className={`relative z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
              step.active
                ? 'bg-gradient-to-br from-orange-500 to-orange-400 border-orange-500 shadow-lg shadow-orange-500/30 scale-110'
                : 'bg-white border-gray-300'
            }`}
          >
            {step.active && <CheckCircle className="w-3.5 h-3.5 text-white font-bold" strokeWidth={3} />}
          </div>

          {index < orderSteps.length - 1 && (
            <div
              className={`absolute left-3 top-8 w-0.5 h-full transition-colors z-0 ${
                step.active ? 'bg-gradient-to-b from-orange-500 to-orange-300' : 'bg-gray-200'
              }`}
            />
          )}

          <div className="flex-1 pt-0.5 ml-4 min-w-0">
            <p
              className={`text-sm mb-1.5 transition-colors ${
                step.active ? 'text-gray-900 font-semibold' : 'text-gray-400'
              }`}
            >
              {step.label}
            </p>
            <p className={`text-xs transition-colors ${step.active ? 'text-gray-600' : 'text-gray-400'}`}>
              {step.time && step.time > 0 ? formatDateTime(step.time) : '等待中...'}
            </p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default CollectionOrderTimelineCard;
