import { useCallback, useEffect, useState } from 'react';
import { useAppNavigate } from '../../../lib/navigation';
import { getErrorMessage } from '../../../api/core/errors';
import { getAuthSessionSnapshot } from '../../../lib/auth';
import { useFeedback } from '../../../components/ui/FeedbackProvider';
import {
  signInApi,
  type SignInInfoData,
  type SignInProgressData,
  type SignInRulesData,
} from '../../../api';

const LAST_SIGN_IN_DATE_KEY = 'sign_in_last_date';

function parseSignedDates(source?: string[]): string[] {
  if (!source?.length) return [];
  return source.map((dateStr) => {
    try {
      const date = new Date(dateStr);
      return Number.isNaN(date.getTime()) ? dateStr : date.toDateString();
    } catch {
      return dateStr;
    }
  });
}

export interface UseSignInPageResult {
  loading: boolean;
  balance: number;
  hasSignedIn: boolean;
  showRedPacket: boolean;
  showCalendar: boolean;
  redPacketAmount: number;
  inviteCount: number;
  signedInDates: string[];
  activityInfo: SignInRulesData | null;
  progressInfo: SignInProgressData | null;
  currentDate: Date;
  currentBalance: number;
  canWithdraw: boolean;
  withdrawMinAmount: number | null;
  setShowRedPacket: (value: boolean) => void;
  setShowCalendar: (value: boolean) => void;
  goPrevMonth: () => void;
  goNextMonth: () => void;
  handleSignIn: () => Promise<void>;
  handleInvite: () => void;
  handleWithdrawClick: () => void;
  handleBack: () => void;
}

export function useSignInPage(): UseSignInPageResult {
  const { goTo, goBack } = useAppNavigate();
  const { showToast } = useFeedback();

  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [hasSignedIn, setHasSignedIn] = useState(false);
  const [showRedPacket, setShowRedPacket] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [redPacketAmount, setRedPacketAmount] = useState(0);
  const [inviteCount, setInviteCount] = useState(0);
  const [signedInDates, setSignedInDates] = useState<string[]>([]);
  const [activityInfo, setActivityInfo] = useState<SignInRulesData | null>(null);
  const [progressInfo, setProgressInfo] = useState<SignInProgressData | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  const isLoggedIn = useCallback(() => {
    const session = getAuthSessionSnapshot();
    return Boolean(session?.isAuthenticated);
  }, []);

  const applyInfoData = useCallback((data: SignInInfoData) => {
    setBalance(data.total_reward || 0);
    setHasSignedIn(data.today_signed);
    setSignedInDates(parseSignedDates(data.calendar?.signed_dates));

    if (data.today_signed) {
      localStorage.setItem(LAST_SIGN_IN_DATE_KEY, new Date().toISOString().split('T')[0]);
    }
  }, []);

  const applyProgressData = useCallback((data: SignInProgressData) => {
    setProgressInfo(data);
    if (data.withdrawable_money !== undefined) {
      setBalance(data.withdrawable_money);
    } else if (data.total_money !== undefined) {
      setBalance(data.total_money);
    }
    if (data.today_signed !== undefined) {
      setHasSignedIn(data.today_signed);
    }
    if (data.invite_count !== undefined) {
      setInviteCount(data.invite_count);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const loadData = async () => {
      setLoading(true);
      const loggedIn = isLoggedIn();

      try {
        const [rulesData, infoData, progressData] = await Promise.all([
          signInApi.getRules(signal),
          loggedIn ? signInApi.getInfo(signal).catch(() => null) : Promise.resolve(null),
          loggedIn ? signInApi.getProgress(signal).catch(() => null) : Promise.resolve(null),
        ]);

        if (rulesData) {
          setActivityInfo(rulesData);
          if (rulesData.today_signed != null) {
            setHasSignedIn(rulesData.today_signed);
          }
        }

        if (infoData) {
          applyInfoData(infoData);
        }

        if (progressData) {
          applyProgressData(progressData);
        }
      } catch (error: any) {
        if (error?.name !== 'AbortError') {
          showToast('加载失败，请重试');
        }
      } finally {
        setLoading(false);
      }
    };

    void loadData();
    return () => controller.abort();
  }, [applyInfoData, applyProgressData, isLoggedIn, showToast]);

  const handleSignIn = useCallback(async () => {
    if (hasSignedIn) {
      setShowCalendar(true);
      return;
    }

    if (!isLoggedIn()) {
      showToast('请先登录');
      goTo('/login');
      return;
    }

    try {
      const data = await signInApi.doSignIn();
      setRedPacketAmount(data.daily_reward || 0);
      setShowRedPacket(true);
      setBalance(data.total_reward || 0);
      setHasSignedIn(true);

      localStorage.setItem(LAST_SIGN_IN_DATE_KEY, new Date().toISOString().split('T')[0]);

      try {
        const [freshInfo, freshProgress] = await Promise.all([
          signInApi.getInfo().catch(() => null),
          signInApi.getProgress().catch(() => null),
        ]);

        if (freshInfo) {
          applyInfoData(freshInfo);
        }
        if (freshProgress) {
          applyProgressData(freshProgress);
        }
      } catch {
        // Ignore refresh failures after a successful sign-in.
      }
    } catch (error) {
      showToast(getErrorMessage(error) || '签到失败，请重试');
    }
  }, [applyInfoData, applyProgressData, goTo, hasSignedIn, isLoggedIn, showToast]);

  const handleInvite = useCallback(() => {
    goTo('/invite');
  }, [goTo]);

  const withdrawMinAmount =
    progressInfo?.withdraw_min_amount ??
    activityInfo?.activity?.withdraw_min_amount ??
    null;
  const currentBalance =
    progressInfo?.withdrawable_money ?? progressInfo?.total_money ?? balance;
  const canWithdraw =
    withdrawMinAmount != null && currentBalance >= withdrawMinAmount;

  const handleWithdrawClick = useCallback(() => {
    if (withdrawMinAmount == null) {
      showToast('暂未获取提现规则');
      return;
    }

    const canDo = progressInfo?.can_withdraw ?? (currentBalance >= withdrawMinAmount);
    if (!canDo) {
      showToast(`余额不足 ${withdrawMinAmount.toFixed(2)} 元，暂不可提现`);
      return;
    }

    goTo('/withdraw');
  }, [currentBalance, goTo, progressInfo?.can_withdraw, showToast, withdrawMinAmount]);

  return {
    loading,
    balance,
    hasSignedIn,
    showRedPacket,
    showCalendar,
    redPacketAmount,
    inviteCount,
    signedInDates,
    activityInfo,
    progressInfo,
    currentDate,
    currentBalance,
    canWithdraw,
    withdrawMinAmount,
    setShowRedPacket,
    setShowCalendar,
    goPrevMonth: () =>
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)),
    goNextMonth: () =>
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)),
    handleSignIn,
    handleInvite,
    handleWithdrawClick,
    handleBack: () => goBack(),
  };
}
