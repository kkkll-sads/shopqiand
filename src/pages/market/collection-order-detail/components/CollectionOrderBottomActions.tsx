import React from 'react';
import { getOrderActionLabel, OrderActionType, resolveOrderAction } from '../types';

interface CollectionOrderBottomActionsProps {
  statusText: string;
  onAction: (action: OrderActionType) => void;
}

const CollectionOrderBottomActions: React.FC<CollectionOrderBottomActionsProps> = ({
  statusText,
  onAction,
}) => {
  const action = resolveOrderAction(statusText);
  if (!action) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-100 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] max-w-[480px] mx-auto pb-safe">
      <div className="p-4">
        <button
          onClick={() => onAction(action)}
          className="flex-1 h-12 w-full rounded-xl bg-gradient-to-r from-orange-500 to-orange-400 text-white hover:from-orange-600 hover:to-orange-500 font-semibold shadow-lg shadow-orange-500/30 transition-all active:scale-[0.98]"
        >
          {getOrderActionLabel(action)}
        </button>
      </div>
    </div>
  );
};

export default CollectionOrderBottomActions;
