/**
 * SignIn - 签到页面
 * 已迁移: 使用 React Router 导航
 */
import React from 'react';
import SignInPageHeader from './sign-in/components/SignInPageHeader';
import SignInBalanceCard from './sign-in/components/SignInBalanceCard';
import SignInWithdrawCard from './sign-in/components/SignInWithdrawCard';
import SignInRulesCard from './sign-in/components/SignInRulesCard';
import SignInRewardModal from './sign-in/components/SignInRewardModal';
import SignInCalendarModal from './sign-in/components/SignInCalendarModal';
import { useSignInPage } from './sign-in/hooks/useSignInPage';

const SignIn: React.FC = () => {
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
      <div className="min-h-screen bg-red-50 pb-safe flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500">加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-red-50 pb-safe">
      <SignInPageHeader
        activityName={activityInfo?.activity?.name || '共识建设与通道测试活动'}
        startTime={activityInfo?.activity?.start_time}
        endTime={activityInfo?.activity?.end_time}
        onBack={handleBack}
      />

      <div className="px-4 -mt-20 relative z-10 space-y-4">
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
          deficitAmount={Math.max(0, 10 - currentBalance)}
          onWithdraw={handleWithdrawClick}
        />

        <SignInRulesCard rules={activityInfo?.rules as any} />
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

export default SignIn;
