import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useNotification } from '@/context/NotificationContext';
import useClaimData from './hooks/useClaimData';
import ClaimSteps from './components/claim/ClaimSteps';
import ClaimHistoryList from './components/claim/ClaimHistoryList';
import UnlockPanel from './components/claim/UnlockPanel';
import useClaimUnlock from './hooks/useClaimUnlock';
import ClaimForm from './components/claim/ClaimForm';
import ReviewStatsSummary from './components/claim/ReviewStatsSummary';

/**
 * ClaimStation - 确权申领站页面
 * 已迁移: 使用 React Router 导航
 * 样式优化: 统一渐变红色头部导航
 */
const ClaimStation: React.FC = () => {
  const navigate = useNavigate();
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

  const navigateHistory = useCallback(() => navigate('/claim-history'), [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans relative">
      {/* 渐变红色头部导航 */}
      <header className="sticky top-0 z-30 bg-gradient-to-r from-red-500 to-red-600 px-4 py-3 flex items-center justify-between text-white shadow-lg">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full active:bg-white/20 transition-all">
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-lg font-bold">数字确权</h1>
        <div className="w-10" />
      </header>

      {/* Top Gradient Background */}
      <div className="absolute top-14 left-0 right-0 h-48 bg-gradient-to-b from-[#FFF5E6] to-gray-50 z-0 pointer-events-none" />

      <div className="pt-2 pb-2 px-4 relative z-20">
        <div className="bg-white rounded-2xl p-1 flex relative shadow-lg border border-gray-100">
          <button
            onClick={() => setActiveTab('apply')}
            className={`flex-1 py-3 text-center rounded-xl text-base font-bold transition-all duration-300 relative z-10 active:scale-95 ${activeTab === 'apply'
              ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-200'
              : 'text-gray-600 hover:bg-gray-50'
              }`}
          >
            确权申请
          </button>
          <button
            onClick={() => setActiveTab('unlock')}
            className={`flex-1 py-3 text-center rounded-xl text-base font-bold transition-all duration-300 relative z-10 active:scale-95 ${activeTab === 'unlock'
              ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-200'
              : 'text-gray-600 hover:bg-gray-50'
              }`}
          >
            旧资产解锁
          </button>
        </div>
      </div>

      <div className="px-4 mt-2 relative z-10">
        {activeTab === 'apply' ? (
          <>
            <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 mb-4">
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
              <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
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


