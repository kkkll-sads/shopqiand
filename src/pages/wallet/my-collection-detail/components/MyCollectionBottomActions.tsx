import React from 'react';
import { Cpu, Store } from 'lucide-react';

interface MyCollectionBottomActionsProps {
  currentValuation: string;
  onUpgradeNode: () => void;
  onConsignment: () => void;
}

const MyCollectionBottomActions: React.FC<MyCollectionBottomActionsProps> = ({
  currentValuation,
  onUpgradeNode,
  onConsignment,
}) => (
  <div className="fixed bottom-0 left-0 right-0 p-4 pb-safe bg-white/90 backdrop-blur-md border-t border-gray-100 z-[9999] pointer-events-auto">
    <div className="flex justify-between items-center mb-3 px-1">
      <span className="text-sm text-gray-500 font-medium">当前估值</span>
      <div className="text-right">
        <span className="text-lg font-bold text-gray-700 font-mono">¥{currentValuation}</span>
      </div>
    </div>

    <div className="flex items-center justify-between gap-3">
      <button
        onClick={onUpgradeNode}
        className="flex-1 bg-gray-500 text-white hover:bg-gray-600 transition-colors py-3.5 rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg shadow-gray-500/20 active:scale-[0.98] pointer-events-auto touch-manipulation"
      >
        <Cpu size={18} />
        共识验证节点
      </button>
      <button
        onClick={onConsignment}
        className="flex-1 bg-[#8B0000] text-amber-100 hover:bg-[#A00000] transition-colors py-3.5 rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-900/20 active:scale-[0.98] pointer-events-auto touch-manipulation"
      >
        <Store size={18} />
        立即上架寄售
      </button>
    </div>
  </div>
);

export default MyCollectionBottomActions;
