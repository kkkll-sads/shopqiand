import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  doSignIn,
  fetchPromotionCard,
  fetchSignInInfo,
  fetchSignInProgress,
  fetchSignInRules,
  fetchTeamMembers,
  type SignInProgressData,
  type SignInRulesData,
} from '@/services';
import { getStoredToken } from '@/services/client';
import { useNotification } from '@/context/NotificationContext';
import { extractData, extractError, isSuccess } from '@/utils/apiHelpers';
import { STORAGE_KEYS } from '@/constants/storageKeys';
import { useStateMachine } from '@/hooks/useStateMachine';
import { LoadingEvent, LoadingState } from '@/types/states';
import { errorLog } from '@/utils/logger';

const parseSignedDates = (source?: string[]) => {
  return (
    source?.map((dateStr) => {
      try {
        const date = new Date(dateStr);
        if (!Number.isNaN(date.getTime())) {
          return date.toDateString();
        }
        return dateStr;
      } catch {
        return dateStr;
      }
    }) || []
  );
};

interface UseSignInPageResult {
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
  minAmount: number;
  canWithdraw: boolean;
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
  const navigate = useNavigate();
  const { showToast } = useNotification();

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

  const loadMachine = useStateMachine<LoadingState, LoadingEvent>({
    initial: LoadingState.IDLE,
    transitions: {
      [LoadingState.IDLE]: { [LoadingEvent.LOAD]: LoadingState.LOADING },
      [LoadingState.LOADING]: {
        [LoadingEvent.SUCCESS]: LoadingState.SUCCESS,
        [LoadingEvent.ERROR]: LoadingState.ERROR,
      },
      [LoadingState.SUCCESS]: {
        [LoadingEvent.LOAD]: LoadingState.LOADING,
        [LoadingEvent.RETRY]: LoadingState.LOADING,
      },
      [LoadingState.ERROR]: {
        [LoadingEvent.LOAD]: LoadingState.LOADING,
        [LoadingEvent.RETRY]: LoadingState.LOADING,
      },
    },
  });

  const loading = loadMachine.state === LoadingState.LOADING;

  useEffect(() => {
    const loadData = async () => {
      loadMachine.send(LoadingEvent.LOAD);
      const token = getStoredToken();

      try {
        const requests: Promise<any>[] = [fetchSignInRules()];

        if (token) {
          requests.push(
            fetchSignInInfo(token),
            fetchSignInProgress(token),
            fetchPromotionCard(token).catch(() => ({ code: -1, data: null })),
            fetchTeamMembers({ level: 1, page: 1, limit: 1 }).catch(() => ({ code: -1, data: null })),
          );
        }

        const results = await Promise.all(requests);

        const rulesRes = results[0];
        const rulesData = extractData(rulesRes) as SignInRulesData | null;
        if ((isSuccess(rulesRes) || rulesRes.code === 0) && rulesData) {
          setActivityInfo(rulesData);
        }

        if (token && results.length > 1) {
          const [infoRes, progressRes, promotionRes, teamRes] = results.slice(1);

          const infoData = extractData(infoRes) as {
            total_reward?: number;
            today_signed?: boolean;
            calendar?: { signed_dates?: string[] };
          } | null;

          if ((isSuccess(infoRes) || infoRes.code === 0) && infoData) {
            setBalance(infoData.total_reward || 0);
            setHasSignedIn(infoData.today_signed || false);
            setSignedInDates(parseSignedDates(infoData.calendar?.signed_dates));

            if (infoData.today_signed) {
              const todayStr = new Date().toISOString().split('T')[0];
              localStorage.setItem(STORAGE_KEYS.LAST_SIGN_IN_DATE_KEY, todayStr);
            }
          }

          const progressData = extractData(progressRes) as SignInProgressData | null;
          if (progressData) {
            setProgressInfo(progressData);
            if (progressData.withdrawable_money !== undefined) {
              setBalance(progressData.withdrawable_money);
            } else if (progressData.total_money !== undefined) {
              setBalance(progressData.total_money);
            }
          }

          if ((isSuccess(teamRes) || teamRes.code === 0) && teamRes.data) {
            setInviteCount((teamRes.data as any).total || 0);
          } else {
            const promotionData = extractData(promotionRes) as { team_count?: number } | null;
            if (promotionData) {
              setInviteCount(promotionData.team_count || 0);
            }
          }
        }

        loadMachine.send(LoadingEvent.SUCCESS);
      } catch (error: any) {
        errorLog('SignIn', '加载签到数据失败', error);
        showToast('error', '加载失败', '加载数据失败，请重试');
        loadMachine.send(LoadingEvent.ERROR);
      }
    };

    void loadData();
    // 保持与原页面一致，仅首屏加载一次。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSignIn = async () => {
    if (hasSignedIn) {
      setShowCalendar(true);
      return;
    }

    const token = getStoredToken();
    if (!token) {
      showToast('warning', '请先登录');
      return;
    }

    try {
      const response = await doSignIn(token);
      const data = extractData(response) as {
        daily_reward?: number;
        total_reward?: number;
        calendar?: { signed_dates?: string[] };
      } | null;

      if (!data) {
        showToast('error', '签到失败', extractError(response, '请重试'));
        return;
      }

      const rewardAmount = data.daily_reward || 0;
      setRedPacketAmount(rewardAmount);
      setShowRedPacket(true);
      setBalance(data.total_reward || 0);
      setHasSignedIn(true);

      const todayStr = new Date().toISOString().split('T')[0];
      localStorage.setItem(STORAGE_KEYS.LAST_SIGN_IN_DATE_KEY, todayStr);
      setSignedInDates(parseSignedDates(data.calendar?.signed_dates));

      const latestToken = getStoredToken();
      if (latestToken) {
        try {
          const progressRes = await fetchSignInProgress(latestToken);
          const refreshedProgressData = extractData(progressRes) as SignInProgressData | null;
          if (refreshedProgressData) {
            setProgressInfo(refreshedProgressData);
            if (refreshedProgressData.withdrawable_money !== undefined) {
              setBalance(refreshedProgressData.withdrawable_money);
            } else if (refreshedProgressData.total_money !== undefined) {
              setBalance(refreshedProgressData.total_money);
            }
          }
        } catch (error) {
          errorLog('SignIn', '刷新进度信息失败', error);
        }
      }
    } catch (error: any) {
      errorLog('SignIn', '签到失败', error);
      showToast('error', '签到失败', error?.msg || error?.message || '请重试');
    }
  };

  const handleInvite = () => {
    navigate('/invite-friends');
  };

  const handleWithdrawClick = () => {
    const minWithdrawAmount =
      progressInfo?.withdraw_min_amount || activityInfo?.activity?.withdraw_min_amount || 10;
    const canDoWithdraw = progressInfo?.can_withdraw ?? (balance >= minWithdrawAmount);

    if (!canDoWithdraw) {
      showToast('warning', '余额不足', `余额不足 ${minWithdrawAmount.toFixed(2)} 元，暂不可提现`);
      return;
    }

    navigate('/balance-withdraw');
  };

  const currentBalance = progressInfo?.withdrawable_money ?? progressInfo?.total_money ?? balance;
  const minAmount = 10;
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
    minAmount,
    canWithdraw,
    setShowRedPacket,
    setShowCalendar,
    goPrevMonth: () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)),
    goNextMonth: () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)),
    handleSignIn,
    handleInvite,
    handleWithdrawClick,
    handleBack: () => navigate(-1),
  };
}
