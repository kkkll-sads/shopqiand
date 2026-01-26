/**
 * 批量寄售按钮组件
 */
import React from 'react';
import { BatchConsignableListData } from '@/services/api';

interface BatchConsignButtonProps {
  batchData: BatchConsignableListData | null;
  loading: boolean;
  checking: boolean;
  onBatchConsign: () => void;
}

export const BatchConsignButton: React.FC<BatchConsignButtonProps> = ({
  batchData,
  loading,
  checking,
  onBatchConsign,
}) => {
  // 不显示条件：无数据 或 不在交易时间
  if (!batchData || batchData.items.length === 0 || !batchData.stats.is_in_trading_time) {
    return null;
  }

  return (
    <div className="bg-white px-4 py-3 border-b border-gray-100/80">
      <button
        onClick={onBatchConsign}
        disabled={loading || checking}
        className="w-full py-3 px-4 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl shadow-lg shadow-red-200 hover:shadow-xl disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>批量寄售中...</span>
          </>
        ) : (
          <>
            <span>⚡ 一键批量寄售</span>
            <span className="text-sm bg-white/20 px-2 py-0.5 rounded-full">
              {batchData.available_now_count || batchData.stats.available_collections} 个可寄售
            </span>
          </>
        )}
      </button>
      <div className="text-xs text-gray-500 text-center mt-2">
        当前时间: {batchData.stats.current_time} • 活跃场次: {batchData.stats.active_sessions}
      </div>
    </div>
  );
};

export default BatchConsignButton;
