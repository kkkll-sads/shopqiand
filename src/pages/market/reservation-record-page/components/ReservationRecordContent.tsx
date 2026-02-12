import React from 'react';
import { AlertCircle, Clock, Loader2 } from 'lucide-react';
import type { ReservationItem } from '@/services';
import ReservationRecordCard from './ReservationRecordCard';

interface ReservationRecordContentProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  isLoggedIn: boolean;
  loading: boolean;
  error: string | null;
  records: ReservationItem[];
  hasMore: boolean;
  loadingMore: boolean;
  onRetry: () => void;
  onLogin: () => void;
  onCardClick: (record: ReservationItem) => void;
  onGoCollection: () => void;
  onScroll: () => void;
}

const ReservationRecordContent: React.FC<ReservationRecordContentProps> = ({
  containerRef,
  isLoggedIn,
  loading,
  error,
  records,
  hasMore,
  loadingMore,
  onRetry,
  onLogin,
  onCardClick,
  onGoCollection,
  onScroll,
}) => {
  return (
    <div
      ref={containerRef}
      onScroll={onScroll}
      className="p-4 space-y-3 h-[calc(100vh-260px)] overflow-y-auto"
    >
      {!isLoggedIn ? (
        <div className="py-16 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} className="text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">请先登录</h3>
          <p className="text-sm text-gray-500 mb-6">登录后即可查看您的申购记录</p>
          <button
            onClick={onLogin}
            className="px-8 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-200 active:scale-95 transition-all"
          >
            去登录
          </button>
        </div>
      ) : loading ? (
        <div className="py-20 text-center">
          <div className="w-12 h-12 border-4 border-red-100 border-t-orange-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500">加载中...</p>
        </div>
      ) : error ? (
        <div className="py-20 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={28} className="text-red-400" />
          </div>
          <p className="text-red-500 text-sm mb-4">{error}</p>
          <button
            onClick={onRetry}
            className="px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg text-sm font-bold shadow-lg active:scale-95 transition-transform"
          >
            重试
          </button>
        </div>
      ) : records.length === 0 ? (
        <div className="py-20 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock size={28} className="text-gray-300" />
          </div>
          <p className="text-gray-400 text-sm">暂无申购记录</p>
        </div>
      ) : (
        records.map((record) => (
          <ReservationRecordCard
            key={record.id}
            record={record}
            onClickDetail={onCardClick}
            onGoCollection={onGoCollection}
          />
        ))
      )}

      {loadingMore && (
        <div className="py-4 flex items-center justify-center text-gray-400 text-xs">
          <Loader2 size={16} className="animate-spin mr-2" />
          加载中...
        </div>
      )}

      {!loading && !hasMore && records.length > 0 && (
        <div className="py-4 text-center text-gray-400 text-xs">— 已加载全部 —</div>
      )}
    </div>
  );
};

export default ReservationRecordContent;
