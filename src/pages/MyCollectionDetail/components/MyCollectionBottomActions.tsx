import { Cpu, Loader2, Store } from 'lucide-react';

interface MyCollectionBottomActionsProps {
  consignmentLoading?: boolean;
  currentValuation: string;
  nodeLoading?: boolean;
  onConsignment: () => void;
  onUpgradeNode: () => void;
}

export function MyCollectionBottomActions({
  consignmentLoading = false,
  currentValuation,
  nodeLoading = false,
  onConsignment,
  onUpgradeNode,
}: MyCollectionBottomActionsProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] border-t border-border-light bg-bg-card/90 p-4 pb-safe backdrop-blur-md">
      <div className="mb-3 flex items-center justify-between px-1">
        <span className="text-sm font-medium text-text-sub">当前估值</span>
        <div className="text-right">
          <span className="font-mono text-lg font-bold text-text-main">¥{currentValuation}</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onUpgradeNode}
          disabled={nodeLoading}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-3.5 font-bold text-white shadow-lg transition-colors active:scale-[0.98] ${
            nodeLoading
              ? 'cursor-not-allowed bg-gray-400 shadow-gray-400/20 dark:bg-gray-700 dark:shadow-black/20'
              : 'bg-gray-500 shadow-gray-500/20 active:bg-gray-600 dark:bg-gray-600 dark:active:bg-gray-500'
          }`}
        >
          {nodeLoading ? <Loader2 size={18} className="animate-spin" /> : <Cpu size={18} />}
          <span>{nodeLoading ? '升级中...' : '升级权益节点'}</span>
        </button>

        <button
          type="button"
          onClick={onConsignment}
          disabled={consignmentLoading}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-3.5 font-bold shadow-lg transition-colors active:scale-[0.98] ${
            consignmentLoading
              ? 'cursor-not-allowed bg-[#b97777] text-amber-50 shadow-red-900/10 dark:bg-red-900/50 dark:text-amber-200'
              : 'bg-[#8B0000] text-amber-100 shadow-red-900/20 active:bg-[#A00000] dark:bg-red-800 dark:text-amber-100 dark:active:bg-red-700'
          }`}
        >
          {consignmentLoading ? <Loader2 size={18} className="animate-spin" /> : <Store size={18} />}
          <span>{consignmentLoading ? '校验中...' : '申请寄售'}</span>
        </button>
      </div>
    </div>
  );
}
