import { useEffect, useState, useCallback } from 'react';
import { useAppNavigate } from '../../../lib/navigation';
import { getAuthSessionSnapshot } from '../../../lib/auth';
import { useFeedback } from '../../../components/ui/FeedbackProvider';
import {
  signInApi,
  type SignInRulesData,
  type SignInProgressData,
  type SignInInfoData,
} from '../../../api';

const LAST_SIGN_IN_DATE_KEY = 'sign_in_last_date';

function parseSignedDates(source?: string[]): string[] {
  if (!source?.length) return [];
  return source.map((dateStr) => {
    try {
      const d = new Date(dateStr);
      return Number.isNaN(d.getTime()) ? dateStr : d.toDateString();
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
  setShowRedPacket: (v: boolean) => void;
  setShowCalendar: (v: boolean) => void;
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
    return !!session?.isAuthenticated;
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
          loggedIn ? signInApi.getInfo(signal).catch(() => null) : null,
          loggedIn ? signInApi.getProgress(signal).catch(() => null) : null,
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
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          showToast('加载失败，请重试');
        }
      } finally {
        setLoading(false);
      }
    };

    void loadData();
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyInfoData(data: SignInInfoData) {
    setBalance(data.total_reward || 0);
    setHasSignedIn(data.today_signed);
    setSignedInDates(parseSignedDates(data.calendar?.signed_dates));

    if (data.today_signed) {
      localStorage.setItem(LAST_SIGN_IN_DATE_KEY, new Date().toISOString().split('T')[0]);
    }
  }

  function applyProgressData(data: SignInProgressData) {
    setProgressInfo(data);
    if (data.withdrawable_money !== undefined) {
      setBalance(data.withdrawable_money);
    } else if (data.total_money !== undefined) {
      setBalance(data.total_money);
    }
    if (data.today_signed !== undefined) {
      setHasSignedIn(data.today_signed);
    }
  }

  const handleSignIn = async () => {
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

      // 刷新最新数据
      try {
        const [freshInfo, freshProgress] = await Promise.all([
          signInApi.getInfo().catch(() => null),
          signInApi.getProgress().catch(() => null),
        ]);
        if (freshInfo) applyInfoData(freshInfo);
        if (freshProgress) applyProgressData(freshProgress);
      } catch {
        // 静默忽略刷新失败
      }
    } catch (err: any) {
      showToast(err?.msg || err?.message || '签到失败，请重试');
    }
  };

  const handleInvite = () => {
    goTo('/invite');
  };

  const handleWithdrawClick = () => {
    const minAmount =
      progressInfo?.withdraw_min_amount ??
      activityInfo?.activity?.withdraw_min_amount ??
      10;
    const canDo = progressInfo?.can_withdraw ?? (balance >= minAmount);

    if (!canDo) {
      showToast(`余额不足 ${minAmount.toFixed(2)} 元，暂不可提现`);
      return;
    }

    goTo('/withdraw');
  };

  const currentBalance =
    progressInfo?.withdrawable_money ?? progressInfo?.total_money ?? balance;
  const minAmount =
    progressInfo?.withdraw_min_amount ??
    activityInfo?.activity?.withdraw_min_amount ??
    10;
  const canWithdraw = currentBalance >= minAmount;

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
