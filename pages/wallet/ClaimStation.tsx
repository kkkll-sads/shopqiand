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
    <div className="min-h-screen bg-gray-50 pb-24 font-sans relative">
      {/* Top Gradient Background */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-[#FFF5E6] to-gray-50 z-0 pointer-events-none" />

      <div className="pt-safe pb-2 px-4 relative z-20">
        <div className="bg-white/80 backdrop-blur-md p-1 rounded-2xl flex relative shadow-sm border border-white/50">
          <button
            onClick={() => setActiveTab('apply')}
            className={`flex-1 py-3 text-center rounded-xl text-base font-bold transition-all duration-300 relative z-10 ${activeTab === 'apply'
              ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md'
              : 'text-gray-500 hover:bg-white/50'
              }`}
          >
            确权申请
          </button>
          <button
            onClick={() => setActiveTab('unlock')}
            className={`flex-1 py-3 text-center rounded-xl text-base font-bold transition-all duration-300 relative z-10 ${activeTab === 'unlock'
              ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md'
              : 'text-gray-500 hover:bg-white/50'
              }`}
          >
            旧资产解锁
          </button>
        </div>
      </div>

      <div className="px-4 mt-2 relative z-10">
        {activeTab === 'apply' ? (
          <>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-orange-100/50 mb-4 backdrop-blur-sm bg-opacity-80">
              <ClaimSteps reviewStats={reviewStats} />
            </div>

            <ReviewStatsSummary reviewStats={reviewStats} onNavigateHistory={navigateHistory} />

            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-4">
              <ClaimForm
                userBalance={unlockStatus.currentGold || 0}
                reviewStats={reviewStats}
                loadHistory={loadHistory}
                loadReviewStats={loadReviewStats}
                onNavigateHistory={navigateHistory}
              />
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <ClaimHistoryList
                  history={history}
                  loading={historyLoading}
                  onNavigateHistory={navigateHistory}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="">
            <UnlockPanel
              userInfo={userInfo}
              unlockStatus={unlockStatus}
              unlockLoading={unlockLoading}
              onUnlock={handleUnlockLegacy}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ClaimStation;


