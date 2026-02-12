import React from 'react';
import { AlertCircle, CheckCircle, ClipboardList, Clock, XCircle } from 'lucide-react';
import { LoadingSpinner } from '@/components/common';
import { QuestionnaireItem } from '@/services/questionnaire';

interface UserSurveyHistoryPanelProps {
  historyList: QuestionnaireItem[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onOpenImage: (url: string) => void;
}

const getStatusBadge = (status: number, text: string) => {
  switch (status) {
    case 0:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-yellow-50 text-yellow-600 border border-yellow-100">
          <Clock size={12} /> {text || '待审核'}
        </span>
      );
    case 1:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-600 border border-green-100">
          <CheckCircle size={12} /> {text || '已采纳'}
        </span>
      );
    case 2:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-600 border border-red-100">
          <XCircle size={12} /> {text || '已拒绝'}
        </span>
      );
    default:
      return null;
  }
};

const UserSurveyHistoryPanel: React.FC<UserSurveyHistoryPanelProps> = ({
  historyList,
  loading,
  hasMore,
  onLoadMore,
  onOpenImage,
}) => (
  <div className="space-y-3">
    {historyList.map((item) => (
      <div key={item.id} className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-sm font-bold text-gray-900 line-clamp-1 flex-1 mr-2">{item.title}</h3>
          {getStatusBadge(item.status, item.status_text)}
        </div>
        <div className="text-xs text-gray-600 mb-3 bg-gray-50 p-2.5 rounded-lg leading-relaxed">
          {item.content}
        </div>

        {item.images && item.images.length > 0 && (
          <div className="flex gap-2 mb-3 overflow-x-auto pb-2 scrollbar-none">
            {item.images.split(',').map((imgUrl, idx) => (
              <div
                key={idx}
                className="w-16 h-16 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden shrink-0"
              >
                <img
                  src={imgUrl}
                  alt={`feedback-${idx}`}
                  className="w-full h-full object-cover"
                  onClick={() => onOpenImage(imgUrl)}
                />
              </div>
            ))}
          </div>
        )}

        {(item.admin_remark || item.reward_power > 0) && (
          <div className="bg-red-50 rounded-xl p-3 text-xs mb-3 border border-red-100">
            {item.reward_power > 0 && (
              <div className="flex items-center gap-1 text-red-600 font-bold mb-1">
                <span className="text-lg">🎁</span> 获得奖励：{item.reward_power} 算力
              </div>
            )}
            {item.admin_remark && (
              <div className="flex gap-2">
                <span className="font-bold text-gray-700 shrink-0">管理员回复:</span>
                <span className="text-gray-600">{item.admin_remark}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-between items-center text-[10px] text-gray-400">
          <span>{item.create_time_text}</span>
          <span>ID: {item.id}</span>
        </div>
      </div>
    ))}

    {loading && (
      <div className="py-4 flex justify-center">
        <LoadingSpinner />
      </div>
    )}

    {!loading && historyList.length === 0 && (
      <div className="py-20 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
          <ClipboardList size={32} />
        </div>
        <p className="text-gray-400 text-xs">暂无反馈记录</p>
      </div>
    )}

    {!loading && historyList.length > 0 && hasMore && (
      <button onClick={onLoadMore} className="w-full py-2 text-xs text-gray-400 text-center active:bg-gray-50">
        点击加载更多
      </button>
    )}
  </div>
);

export default UserSurveyHistoryPanel;
