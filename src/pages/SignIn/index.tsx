/**
 * @file SignIn/index.tsx - 每日签到页面
 * @description 用户每日签到页面，展示签到日历、连续签到奖励。
 */

import React from 'react'; // React 核心
import SignInPageHeader from './components/SignInPageHeader';
import SignInBalanceCard from './components/SignInBalanceCard';
import SignInWithdrawCard from './components/SignInWithdrawCard';
import SignInRulesCard from './components/SignInRulesCard';
import SignInRewardModal from './components/SignInRewardModal';
import SignInCalendarModal from './components/SignInCalendarModal';
import { useSignInPage } from './hooks/useSignInPage';

export const SignInPage: React.FC = () => {
  const {
    loading,
    balance,
    hasSignedIn,
    showRedPacket,
    showCalendar,
    redPacketAmount,
    inviteCount,
    signedInDates,
    activityInfo,
    currentDate,
    currentBalance,
    canWithdraw,
    withdrawMinAmount,
    setShowRedPacket,
    setShowCalendar,
    goPrevMonth,
    goNextMonth,
    handleSignIn,
    handleInvite,
    handleWithdrawClick,
    handleBack,
  } = useSignInPage();

  if (loading) {
    return (
      <div className="flex h-full flex-1 items-center justify-center bg-bg-base">
        <div className="animate-spin w-8 h-8 rounded-full border-2 border-red-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-1 flex-col overflow-hidden bg-bg-base">
      <div className="min-h-0 flex-1 overflow-y-auto no-scrollbar pb-safe">
        <SignInPageHeader
          activityName={activityInfo?.activity?.name}
          startTime={activityInfo?.activity?.start_time}
          endTime={activityInfo?.activity?.end_time}
          onBack={handleBack}
        />

        <div className="relative z-10 -mt-20 space-y-4 px-4 pb-4">
          <SignInBalanceCard
            inviteCount={inviteCount}
            balance={balance}
            hasSignedIn={hasSignedIn}
            onSignIn={() => {
              void handleSignIn();
            }}
            onInvite={handleInvite}
          />

          <SignInWithdrawCard
            currentBalance={currentBalance}
            canWithdraw={canWithdraw}
            deficitAmount={
              withdrawMinAmount != null
                ? Math.max(0, withdrawMinAmount - currentBalance)
                : 0
            }
            onWithdraw={handleWithdrawClick}
          />

          <SignInRulesCard rules={activityInfo?.rules} />
        </div>
      </div>

      <SignInRewardModal
        open={showRedPacket}
        amount={redPacketAmount}
        onClose={() => setShowRedPacket(false)}
      />

      <SignInCalendarModal
        open={showCalendar}
        currentDate={currentDate}
        signedInDates={signedInDates}
        onClose={() => setShowCalendar(false)}
        onPrevMonth={goPrevMonth}
        onNextMonth={goNextMonth}
      />
    </div>
  );
};

export default SignInPage;
