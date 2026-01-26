import React from 'react';
import { History } from 'lucide-react';
import { RightsDeclarationRecord } from '@/services/rightsDeclaration';

interface ClaimHistoryListProps {
  history: RightsDeclarationRecord[];
  loading: boolean;
  onNavigateHistory?: () => void;
}

const getStatusTag = (status: string) => {
  switch (status) {
    case 'pending':
      return (
        <span className="text-xs px-3 py-1 rounded bg-[#FFE4C4] text-[#8B4513] font-medium border border-[#DEB887]">
          待审核
        </span>
      );
    case 'approved':
      return (
        <span className="text-xs px-3 py-1 rounded bg-[#DEF7EC] text-[#03543F] font-medium border border-[#84E1BC]">
          确权成功
        </span>
      );
    case 'rejected':
      return (
        <span className="text-xs px-3 py-1 rounded bg-[#FDE8E8] text-[#9B1C1C] font-medium border border-[#F8B4B4]">
          审核失败
        </span>
      );
    case 'cancelled':
      return (
        <span className="text-xs px-3 py-1 rounded bg-[#F3F4F6] text-[#6B7280] font-medium border border-[#D1D5DB]">
          已撤销
        </span>
      );
    default:
      return null;
  }
};

const ClaimHistoryList: React.FC<ClaimHistoryListProps> = ({ history, loading, onNavigateHistory }) => {
  return (
    <div className="space-y-4 pb-4">
      <div className="flex justify-between items-center px-2">
        <h3 className="font-bold text-[#333333] text-lg flex items-center gap-2">
          <History size={18} />
          历史记录区
        </h3>
        <button
          className="text-[#FF4500] text-sm font-medium hover:text-[#E63E00]"
          onClick={onNavigateHistory}
        >
          查看更多
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-400 text-sm bg-white rounded-xl border border-gray-100">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#FF4500] mx-auto mb-2"></div>
          加载中...
        </div>
      ) : history.length > 0 ? (
        history.map((record) => (
          <div key={record.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <div className="text-[#666666] text-base font-medium">{record.voucher_type_text}</div>
                <div className="text-[#999999] text-sm">¥{Number(record.amount).toFixed(2)}</div>
              </div>
              {getStatusTag(record.status)}
            </div>

            <div className="text-right">
              <div className="text-[#999999] text-sm">{record.create_time_text}</div>
              {record.review_remark && (
                <div className="text-[#FF4D4F] text-xs mt-1">{record.review_remark}</div>
              )}
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-8 text-gray-400 text-sm bg-white rounded-xl border border-gray-100">
          暂无提交记录
        </div>
      )}
    </div>
  );
};

export default ClaimHistoryList;

