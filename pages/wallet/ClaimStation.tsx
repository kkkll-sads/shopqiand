import React, { useCallback, useEffect, useState } from 'react';
import { useNotification } from '../../context/NotificationContext';
import useClaimData from './hooks/useClaimData';
import ClaimSteps from './components/claim/ClaimSteps';
import ClaimHistoryList from './components/claim/ClaimHistoryList';
import UnlockPanel from './components/claim/UnlockPanel';
import useClaimUnlock from './hooks/useClaimUnlock';
import ClaimForm from './components/claim/ClaimForm';
import ReviewStatsSummary from './components/claim/ReviewStatsSummary';
import { Route } from '../../router/routes';

interface ClaimStationProps {
  onBack?: () => void;
  onNavigate?: (route: Route) => void;
}

const ClaimStation: React.FC<ClaimStationProps> = ({ onNavigate }) => {
  const { showToast } = useNotification();
  const [activeTab, setActiveTab] = useState<'apply' | 'unlock'>('apply');

  const {
    userInfo,
    setUserInfo,
    history,
    historyLoading,
    reviewStats,
    loadInitialData,
    loadHistory,
    loadReviewStats,
  } = useClaimData(showToast);

  const { unlockStatus, unlockLoading, loadUnlockStatus, handleUnlockLegacy } = useClaimUnlock({
    showToast,
    userInfo,
    setUserInfo: (info) => setUserInfo(info),
  });

  useEffect(() => {
    loadInitialData();
    loadUnlockStatus(); // Load on mount to get current_gold
  }, [loadInitialData, loadUnlockStatus]);

  useEffect(() => {
    if (activeTab === 'unlock') {
      loadUnlockStatus();
    }
  }, [activeTab, loadUnlockStatus]);

  const navigateHistory = useCallback(() => onNavigate?.({ name: 'claim-history' }), [onNavigate]);

  return (
    <div className="min-h-screen bg-[#FFF8F0] pb-24 font-sans relative">
      <div className="bg-[#FFDAB9] pt-safe pb-2 px-4 sticky top-0 z-20">
        <div className="bg-[#FFE4C4]/50 p-1 rounded-2xl flex relative">
          <button
            onClick={() => setActiveTab('apply')}
            className={`flex-1 py-2.5 text-center rounded-xl text-base font-bold transition-all duration-300 relative z-10 ${activeTab === 'apply'
              ? 'bg-white text-[#FF4500] shadow-sm'
              : 'text-[#8B4513]/70 hover:bg-white/30'
              }`}
          >
            确权申请
          </button>
          <button
            onClick={() => setActiveTab('unlock')}
            className={`flex-1 py-2.5 text-center rounded-xl text-base font-bold transition-all duration-300 relative z-10 ${activeTab === 'unlock'
              ? 'bg-white text-[#FF4500] shadow-sm'
              : 'text-[#8B4513]/70 hover:bg-white/30'
              }`}
          >
            旧资产解锁
          </button>
        </div>
      </div>

      <div className="px-4 -mt-2 relative z-10">
        {activeTab === 'apply' ? (
          <>
            <ClaimSteps reviewStats={reviewStats} />
            <ReviewStatsSummary reviewStats={reviewStats} onNavigateHistory={navigateHistory} />
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <ClaimForm
                userBalance={unlockStatus.currentGold || 0}
                reviewStats={reviewStats}
                loadHistory={loadHistory}
                loadReviewStats={loadReviewStats}
                onNavigateHistory={navigateHistory}
              />
              <ClaimHistoryList
                history={history}
                loading={historyLoading}
                onNavigateHistory={navigateHistory}
              />
            </div>
          </>
        ) : (
          <UnlockPanel
            userInfo={userInfo}
            unlockStatus={unlockStatus}
            unlockLoading={unlockLoading}
            onUnlock={handleUnlockLegacy}
          />
        )}
      </div>
    </div>
  );
};

export default ClaimStation;


