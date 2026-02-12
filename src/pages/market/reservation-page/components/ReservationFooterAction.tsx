import React from 'react';

interface ReservationFooterActionProps {
  userInfoLoading: boolean;
  isHashrateSufficient: boolean;
  isFundSufficient: boolean;
  onClick: () => void;
}

const ReservationFooterAction: React.FC<ReservationFooterActionProps> = ({
  userInfoLoading,
  isHashrateSufficient,
  isFundSufficient,
  onClick,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 pb-safe">
      <button
        onClick={userInfoLoading ? undefined : onClick}
        disabled={userInfoLoading}
        className={`w-full py-3.5 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-red-200 transition-all active:scale-[0.98] ${
          userInfoLoading
            ? 'bg-gray-400 text-gray-200 cursor-not-allowed shadow-none'
            : isHashrateSufficient && isFundSufficient
              ? 'bg-gradient-to-r from-red-500 to-red-600 text-white'
              : 'bg-gradient-to-r from-red-500 to-red-600 text-white opacity-90'
        }`}
      >
        {userInfoLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            加载中...
          </>
        ) : !isHashrateSufficient ? (
          '前往获取算力'
        ) : !isFundSufficient ? (
          '前往充值专项金'
        ) : (
          '确认预约'
        )}
      </button>
    </div>
  );
};

export default ReservationFooterAction;
