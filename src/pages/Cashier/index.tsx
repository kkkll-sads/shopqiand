import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  Circle,
  Clock3,
  Coins,
  Copy,
  ShieldCheck,
  Wallet,
  WifiOff,
} from 'lucide-react';
import { shopOrderApi, rechargeApi } from '../../api';
import { getErrorMessage } from '../../api/core/errors';
import { Button } from '../../components/ui/Button';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { Skeleton } from '../../components/ui/Skeleton';
import { copyToClipboard } from '../../lib/clipboard';
import { openCustomerServiceLink } from '../../lib/customerService';
import { useAppNavigate } from '../../lib/navigation';

interface PaymentMethod {
  id: string;
  name: string;
  desc: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}

interface MallCashierSnapshot {
  orderNo: string;
  amount: number;
  totalScore: number;
  payType: string;
  balance: string;
  scoreBalance: string;
}

function formatMinuteClock(seconds: number) {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60)
    .toString()
    .padStart(1, '0');
  const remain = (safeSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remain}`;
}

const RechargeCashierView = ({
  amount,
  orderNo,
  orderId,
  payUrl,
  expireSeconds,
}: {
  amount: number;
  orderNo: string;
  orderId: number;
  payUrl?: string;
  expireSeconds: number;
}) => {
  const { goBack, navigate } = useAppNavigate();
  const { showToast, showLoading, hideLoading } = useFeedback();
  const pollAbortRef = useRef<AbortController | null>(null);
  const pollStateRef = useRef<'idle' | 'polling' | 'done'>('idle');
  const windowCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [timeLeft, setTimeLeft] = useState(expireSeconds);
  const [opening, setOpening] = useState(false);
  const [hasOpenedPay, setHasOpenedPay] = useState(false);
  const [pollState, setPollState] = useState<'idle' | 'polling' | 'done'>('idle');
  const [pollCount, setPollCount] = useState(0);
  const [pollResult, setPollResult] = useState<'pending' | 'success' | 'failure' | null>(null);

  useEffect(() => {
    setTimeLeft(expireSeconds);
    setHasOpenedPay(false);
    setOpening(false);
    setPollState('idle');
    setPollCount(0);
    setPollResult(null);
    pollAbortRef.current?.abort();
    if (windowCheckRef.current) {
      clearInterval(windowCheckRef.current);
      windowCheckRef.current = null;
    }
  }, [expireSeconds]);

  // 同步 ref
  useEffect(() => { pollStateRef.current = pollState; }, [pollState]);

  const cancelPolling = useCallback((showCancelToast = true) => {
    pollAbortRef.current?.abort();
    pollAbortRef.current = null;
    setPollState('idle');
    setPollCount(0);
    setPollResult(null);

    if (showCancelToast) {
      showToast({
        message: '已取消查询，可稍后再次确认支付结果',
        type: 'info',
      });
    }
  }, [showToast]);

  /** 轮询后端订单状态（最多 maxAttempts 次，每次间隔 intervalMs） */
  const startPolling = useCallback(async (maxAttempts = 5, intervalMs = 3000) => {
    if ((!orderNo && !orderId) || pollStateRef.current === 'polling') {
      return;
    }

    pollAbortRef.current?.abort();
    const abort = new AbortController();
    pollAbortRef.current = abort;
    setPollState('polling');
    setPollCount(0);
    setPollResult(null);

    for (let i = 0; i < maxAttempts; i++) {
      if (abort.signal.aborted) break;

      setPollCount(i + 1);

      try {
        const detail = await rechargeApi.detail(
          orderId ? { id: orderId } : { order_no: orderNo },
        );
        // 充值: 0=待审核(pending), 1=已通过(success), 2=已拒绝(failure)
        if (detail.status === 1) {
          hideLoading();
          setPollResult('success');
          setPollState('done');
          // 自动跳转到成功结果页
          const params = new URLSearchParams({
            scene: 'recharge',
            status: 'success',
            amount: String(amount),
            order_no: orderNo,
            order_id: String(orderId),
          });
          navigate(`/payment/result?${params.toString()}`, { replace: true });
          return;
        }
        if (detail.status === 2) {
          hideLoading();
          setPollResult('failure');
          setPollState('done');
          return;
        }
      } catch {
        // 网络错误，继续轮询
      }

      // 等待下次轮询（最后一次不等）
      if (i < maxAttempts - 1 && !abort.signal.aborted) {
        await new Promise((r) => window.setTimeout(r, intervalMs));
      }
    }

    // 轮询结束仍为 pending
    if (!abort.signal.aborted) {
      hideLoading();
      setPollResult('pending');
      setPollState('done');
      showToast({
        message: '暂未确认支付结果，请稍后重试或查看结果',
        type: 'warning',
      });
    }
  }, [orderNo, orderId, amount, navigate, showToast, hideLoading]);

  /** 备用：visibilitychange 兼容无法检测 window.closed 的场景 */
  useEffect(() => {
    if (!hasOpenedPay) return undefined;

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && pollStateRef.current === 'idle') {
        void startPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [hasOpenedPay, startPolling]);

  /** 组件卸载时中止轮询 + 清理窗口检测 */
  useEffect(() => {
    return () => {
      pollAbortRef.current?.abort();
      hideLoading();
      if (windowCheckRef.current) clearInterval(windowCheckRef.current);
    };
  }, [hideLoading]);

  useEffect(() => {
    if (timeLeft <= 0) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setTimeLeft((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [timeLeft]);

  const handleCopyOrderNo = () => {
    if (!orderNo) {
      return;
    }

    copyToClipboard(orderNo).then((ok) => {
      showToast({
        message: ok ? '订单号已复制' : '复制失败，请稍后重试',
        type: ok ? 'success' : 'error',
      });
    });
  };

  const handleOpenPay = () => {
    if (!payUrl || opening || timeLeft <= 0) {
      return;
    }

    cancelPolling(false);
    hideLoading();
    setOpening(true);

    try {
      const newWindow = window.open(payUrl, '_blank');

      if (newWindow) {
        showToast({ message: '已打开支付页面，完成后请返回', type: 'success' });

        // 轮询检测支付窗口是否已关闭（参考 shopqiand PaymentRedirect）
        if (windowCheckRef.current) clearInterval(windowCheckRef.current);
        windowCheckRef.current = setInterval(() => {
          try {
            if (newWindow.closed) {
              if (windowCheckRef.current) clearInterval(windowCheckRef.current);
              // 支付窗口已关闭，自动开始轮询订单状态
              if (pollStateRef.current === 'idle') {
                void startPolling();
              }
            }
          } catch {
            // 跨域情况下忽略
          }
        }, 500);
      } else {
        // 移动端 webview 中 window.open 返回 null 但可能已打开
        showToast({ message: '已打开支付页面，完成后请返回', type: 'success' });
      }

      setHasOpenedPay(true);
    } finally {
      window.setTimeout(() => setOpening(false), 600);
    }
  };

  const handleOpenResult = (status: 'pending' | 'failure' = 'pending') => {
    const params = new URLSearchParams({
      scene: 'recharge',
      status,
      amount: String(amount),
      order_no: orderNo,
      order_id: String(orderId),
    });

    navigate(`/payment/result?${params.toString()}`, { replace: true });
  };

  const handleOpenSupport = () => {
    void openCustomerServiceLink(({ duration, message, type }) => {
      showToast({ duration, message, type });
    });
  };

  const isPolling = pollState === 'polling';
  const isFailureState = pollState === 'done' && pollResult === 'failure';
  const showCompletionAction = hasOpenedPay && !isFailureState;

  useEffect(() => {
    if (!isPolling) {
      hideLoading();
      return undefined;
    }

    showLoading({
      message: '查询支付结果中...',
      subMessage: `正在确认支付结果 (${Math.max(pollCount, 1)}/5)，可取消后稍后再查`,
      cancelable: true,
      onCancel: () => cancelPolling(),
      timeout: 20000,
    });

    return () => {
      hideLoading();
    };
  }, [cancelPolling, hideLoading, isPolling, pollCount, showLoading]);

  const primaryAction = isFailureState
    ? {
        className:
          'mt-8 h-14 rounded-full text-[18px] font-semibold !bg-gradient-to-r !from-[#ff1530] !to-[#ff0019] !shadow-[0_14px_28px_rgba(255,0,25,0.22)]',
        disabled: false,
        label: '支付未完成 · 查看详情',
        leftIcon: <AlertTriangle size={18} />,
        loading: false,
        onClick: () => handleOpenResult('failure'),
        rightIcon: undefined,
      }
    : showCompletionAction
      ? {
          className:
            'mt-8 h-14 rounded-full text-[18px] font-semibold !bg-gradient-to-r !from-[#16a34a] !to-[#22c55e] !shadow-[0_14px_28px_rgba(22,163,74,0.22)]',
          disabled: isPolling,
          label: '已完成支付',
          leftIcon: <CheckCircle2 size={18} />,
          loading: false,
          onClick: () => {
            void startPolling();
          },
          rightIcon: undefined,
        }
      : {
          className:
            'mt-8 h-14 rounded-full text-[18px] font-semibold !bg-gradient-to-r !from-[#ff1530] !to-[#ff0019] !shadow-[0_14px_28px_rgba(255,0,25,0.22)]',
          disabled: !payUrl || timeLeft <= 0 || opening,
          label: opening ? '打开中...' : '去支付',
          leftIcon: opening ? undefined : <span className="text-[18px] leading-none">▶</span>,
          loading: opening,
          onClick: handleOpenPay,
          rightIcon: opening ? undefined : <ArrowRight size={19} />,
        };

  const secondaryAction = isFailureState
    ? {
        label: '重新支付',
        onClick: handleOpenPay,
      }
    : showCompletionAction && !isPolling
      ? {
          label: '支付遇到问题，获取新链接',
          onClick: handleOpenPay,
        }
      : null;

  return (
    <div className="relative flex h-full flex-1 flex-col overflow-hidden bg-[#f4f4f5]">
      <div className="relative z-20 border-b border-[#e7e7ea] bg-white/92 px-4 pt-safe backdrop-blur">
        <div className="flex h-14 items-center">
          <button
            type="button"
            className="flex w-10 items-center justify-start text-[#5b6472] active:opacity-70"
            onClick={goBack}
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="flex-1 text-center text-[18px] font-semibold text-[#111827]">支付收银台</h1>
          <div className="flex w-10 justify-end" />
        </div>
      </div>

      <div className="pointer-events-none absolute right-4 top-[calc(env(safe-area-inset-top,0px)+16px)] z-30 inline-flex items-center rounded-full bg-white/90 px-2.5 py-1 text-[13px] text-[#6b7280] shadow-sm">
        <Clock3 size={13} className="mr-1 text-[#6b7280]" />
        {formatMinuteClock(timeLeft)}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-28 pt-14">
        <div className="pt-[18vh] text-center">
          <div className="mb-4 text-[16px] text-[#6b7280]">支付金额</div>
          <div className="mb-5 flex items-end justify-center text-[#e50019]">
            <span className="mr-1 pb-1 text-[20px] font-semibold text-[#111827]">¥</span>
            <span className="text-[62px] font-bold leading-none tracking-tight">
              {Number.isFinite(amount) ? Math.round(amount).toString() : '0'}
            </span>
          </div>

          <button
            type="button"
            className="mx-auto flex items-center text-[13px] text-[#9ca3af] active:opacity-70"
            onClick={handleCopyOrderNo}
          >
            <span>订单号：{orderNo || '--'}</span>
            <Copy size={13} className="ml-1.5" />
          </button>
        </div>

        <div className="mt-12 rounded-[20px] border border-[#f2ca77] bg-[#fff6df] px-5 py-4 text-left">
          <div className="mb-2 flex items-center text-[15px] font-semibold text-[#e46a00]">
            <AlertTriangle size={16} className="mr-2" />
            重要提醒
          </div>
          <div className="space-y-1 text-[14px] leading-6 text-[#c75c00]">
            <div>请核对支付金额，否则无法到账</div>
            <div>请勿保存二维码稍后支付</div>
            <div>支付链接 5 分钟内有效</div>
          </div>
        </div>

        <Button
          type="button"
          size="lg"
          className={primaryAction.className}
          onClick={primaryAction.onClick}
          disabled={primaryAction.disabled}
          loading={primaryAction.loading}
          leftIcon={primaryAction.leftIcon}
          rightIcon={primaryAction.rightIcon}
        >
          {primaryAction.label}
        </Button>

        {secondaryAction ? (
          <button
            type="button"
            className="mx-auto mt-3 flex items-center text-[14px] text-[#6b7280] active:opacity-70"
            onClick={secondaryAction.onClick}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
            {secondaryAction.label}
          </button>
        ) : null}

        {!secondaryAction && !isPolling && !showCompletionAction ? (
          <div className="mt-6 flex items-center justify-center text-[14px] text-[#9ca3af]">
            <ShieldCheck size={14} className="mr-1.5" />
            安全支付保障
          </div>
        ) : null}
      </div>

      <button
        type="button"
        className="absolute bottom-20 right-0 z-20 flex h-14 w-14 translate-x-1/3 items-center justify-center rounded-full bg-[#ff8a00] text-white shadow-[0_10px_24px_rgba(255,138,0,0.28)] active:scale-95"
        onClick={handleOpenSupport}
        aria-label="联系客服"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>

      {timeLeft <= 0 ? (
        <div className="absolute inset-x-4 bottom-6 z-30 rounded-2xl border border-[#fecaca] bg-white px-4 py-3 text-sm text-[#b91c1c] shadow-sm">
          支付链接已过期，请返回重新发起匹配。
          <button
            type="button"
            className="ml-2 font-medium text-[#ef4444]"
            onClick={() => handleOpenResult('failure')}
          >
            查看结果
          </button>
        </div>
      ) : null}
    </div>
  );
};

const MallCashierView = () => {
  const [searchParams] = useSearchParams();
  const { goBack, navigate } = useAppNavigate();
  const { showToast, showLoading, hideLoading } = useFeedback();

  const orderId = Number(searchParams.get('order_id')) || 0;
  const [snapshot, setSnapshot] = useState<MallCashierSnapshot>({
    orderNo: searchParams.get('order_no') ?? '',
    amount: Number(searchParams.get('amount')) || 0,
    totalScore: Number(searchParams.get('total_score')) || 0,
    payType: searchParams.get('pay_type') ?? '',
    balance: searchParams.get('balance') ?? '0',
    scoreBalance: searchParams.get('score_balance') ?? '0',
  });
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [moduleError, setModuleError] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('balance');
  const [timeLeft, setTimeLeft] = useState(29 * 60 + 59);
  const [showFailureModal, setShowFailureModal] = useState(false);
  const [paying, setPaying] = useState(false);

  const displayOrderNo = snapshot.orderNo || '--';
  const isScoreOnly = snapshot.payType === 'score' || (snapshot.totalScore > 0 && snapshot.amount <= 0);
  const isMoneyOnly = snapshot.payType === 'money' || (snapshot.amount > 0 && snapshot.totalScore <= 0);

  const loadOrderSnapshot = React.useCallback(async () => {
    if (orderId <= 0) {
      setModuleError(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setModuleError(false);

    try {
      const detail = await shopOrderApi.detail({ id: orderId });
      setSnapshot({
        orderNo: detail.order_no ?? '',
        amount: Number(detail.total_amount) || 0,
        totalScore: Number(detail.total_score) || 0,
        payType: detail.pay_type ?? '',
        balance: detail.balance_available ?? '0',
        scoreBalance: detail.score ?? '0',
      });
    } catch (error) {
      setModuleError(true);
      showToast({ message: getErrorMessage(error), type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [orderId, showToast]);

  const paymentMethods = useMemo<PaymentMethod[]>(() => {
    if (isScoreOnly) {
      return [
        {
          id: 'score',
          name: '消费金支付',
          desc: `可用消费金 ${Number(snapshot.scoreBalance).toLocaleString('zh-CN')}`,
          icon: Coins,
          color: 'text-orange-500',
          bg: 'bg-orange-50 dark:bg-orange-500/15',
        },
      ];
    }

    if (isMoneyOnly) {
      return [
        {
          id: 'balance',
          name: '余额支付',
          desc: `可用余额 ¥${Number(snapshot.balance).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`,
          icon: Wallet,
          color: 'text-primary-start',
          bg: 'bg-primary-start/10 dark:bg-red-500/15',
        },
      ];
    }

    return [
      {
        id: 'balance',
        name: '余额支付',
        desc: `可用余额 ¥${Number(snapshot.balance).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`,
        icon: Wallet,
        color: 'text-primary-start',
        bg: 'bg-primary-start/10 dark:bg-red-500/15',
      },
      {
        id: 'score',
        name: '消费金支付',
        desc: `可用消费金 ${Number(snapshot.scoreBalance).toLocaleString('zh-CN')}`,
        icon: Coins,
        color: 'text-orange-500',
        bg: 'bg-orange-50 dark:bg-orange-500/15',
      },
    ];
  }, [isMoneyOnly, isScoreOnly, snapshot.balance, snapshot.scoreBalance]);

  useEffect(() => {
    void loadOrderSnapshot();
  }, [loadOrderSnapshot]);

  useEffect(() => {
    setSelectedMethod(isScoreOnly ? 'score' : 'balance');
  }, [isScoreOnly]);

  useEffect(() => {
    if (timeLeft <= 0 || loading || moduleError) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setTimeLeft((current) => current - 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [loading, moduleError, timeLeft]);

  const handleCopy = () => {
    if (!displayOrderNo || displayOrderNo === '--') {
      return;
    }

    copyToClipboard(displayOrderNo).then((ok) => {
      showToast({
        message: ok ? '订单号已复制' : '复制失败，请手动复制',
        type: ok ? 'success' : 'error',
      });
    });
  };

  const handlePay = async () => {
    if (paying) {
      return;
    }

    if (orderId <= 0) {
      showToast({ message: '订单信息无效，请返回重新下单', type: 'error' });
      return;
    }

    setPaying(true);
    showLoading('支付中...');

    try {
      const payParams: { order_id: number; pay_money?: number; pay_score?: number } = {
        order_id: orderId,
      };

      if (isScoreOnly) {
        payParams.pay_score = snapshot.totalScore;
        payParams.pay_money = 0;
      } else if (isMoneyOnly) {
        payParams.pay_money = snapshot.amount;
        payParams.pay_score = 0;
      } else {
        payParams.pay_money = snapshot.amount;
        payParams.pay_score = snapshot.totalScore;
      }

      const result = await shopOrderApi.pay(payParams);
      const params = new URLSearchParams({
        status: 'success',
        order_no: result.order_no,
        pay_type: snapshot.payType,
      });

      if (isScoreOnly) {
        params.set('amount', String(result.pay_score ?? 0));
      } else if (isMoneyOnly) {
        params.set('amount', String(result.pay_money ?? 0));
      } else {
        params.set('amount', String(result.pay_money ?? 0));
        params.set('total_score', String(result.pay_score ?? 0));
      }

      navigate(`/payment/result?${params.toString()}`, { replace: true });
    } catch (error) {
      showToast({ message: getErrorMessage(error), type: 'error', duration: 3000 });
      setShowFailureModal(true);
    } finally {
      hideLoading();
      setPaying(false);
    }
  };

  const renderAmountDisplay = () => {
    if (isScoreOnly) {
      return (
        <div className="mb-4 flex items-baseline font-bold text-primary-start">
          <span className="text-7xl leading-none">{snapshot.totalScore}</span>
          <span className="ml-1 text-2xl">消费金</span>
        </div>
      );
    }

    if (isMoneyOnly) {
      const [integerPart, decimalPart] = snapshot.amount.toFixed(2).split('.');
      return (
        <div className="mb-4 flex items-baseline font-bold text-primary-start">
          <span className="mr-0.5 text-3xl">¥</span>
          <span className="text-7xl leading-none">{integerPart}</span>
          <span className="text-3xl">.{decimalPart}</span>
        </div>
      );
    }

    const [integerPart, decimalPart] = snapshot.amount.toFixed(2).split('.');
    return (
      <div className="mb-4 flex flex-col items-center gap-1">
        <div className="flex items-baseline font-bold text-primary-start">
          <span className="mr-0.5 text-2xl">¥</span>
          <span className="text-5xl leading-none">{integerPart}</span>
          <span className="text-2xl">.{decimalPart}</span>
        </div>
        <div className="flex items-baseline font-bold text-orange-500">
          <span className="text-3xl leading-none">+{snapshot.totalScore}</span>
          <span className="ml-1 text-lg">消费金</span>
        </div>
      </div>
    );
  };

  const payButtonText = () => {
    if (isScoreOnly) return `确认支付 ${snapshot.totalScore}消费金`;
    if (isMoneyOnly) return `确认支付 ¥${snapshot.amount.toFixed(2)}`;
    return `确认支付 ¥${snapshot.amount.toFixed(2)} + ${snapshot.totalScore}消费金`;
  };

  if (moduleError) {
    return (
      <div className="flex flex-1 flex-col bg-bg-base">
        <div className="bg-white dark:bg-gray-900 z-40 relative shrink-0 border-b border-border-light">
          <div className="h-12 flex items-center justify-between px-3 pt-safe">
            <div className="flex items-center w-1/3">
              <button onClick={goBack} className="p-1 -ml-1 text-text-main active:opacity-70">
                <ChevronLeft size={24} />
              </button>
            </div>
            <h1 className="text-xl font-bold text-text-main text-center w-1/3">收银台</h1>
            <div className="w-1/3" />
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center p-4">
          <button
            onClick={() => {
              void loadOrderSnapshot();
            }}
            className="rounded-full border border-border-light px-6 py-2 text-base text-text-main"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-bg-base relative h-full overflow-hidden">
      <div className="bg-white dark:bg-gray-900 z-40 relative shrink-0 border-b border-border-light">
        {offline ? (
          <div className="bg-red-50 dark:bg-red-900/30 text-primary-start dark:text-red-300 px-4 py-2 flex items-center justify-between text-sm">
            <div className="flex items-center">
              <WifiOff size={14} className="mr-2" />
              <span>网络不稳定，请检查网络设置</span>
            </div>
            <button onClick={() => setOffline(false)} className="font-medium px-2 py-1 bg-white dark:bg-gray-800 rounded shadow-sm">
              刷新
            </button>
          </div>
        ) : null}
        <div className="h-12 flex items-center justify-between px-3 pt-safe">
          <div className="flex items-center w-1/3">
            <button onClick={goBack} className="p-1 -ml-1 text-text-main active:opacity-70">
              <ChevronLeft size={24} />
            </button>
          </div>
          <h1 className="text-xl font-bold text-text-main text-center w-1/3">收银台</h1>
          <div className="w-1/3" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar relative">
        {loading ? (
          <div className="p-3">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 mb-3 shadow-sm flex flex-col items-center">
              <Skeleton className="w-16 h-4 mb-3" />
              <Skeleton className="w-32 h-10 mb-4" />
              <Skeleton className="w-48 h-6 rounded-full" />
            </div>
          </div>
        ) : (
          <div className="p-3 pb-24">
            <div className="mb-3 flex justify-center">
              <div className="bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                支付剩余时间 {formatMinuteClock(timeLeft)}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm mb-3 p-6 flex flex-col items-center">
              <span className="text-base text-text-sub mb-2">应付金额</span>
              {renderAmountDisplay()}
              <div className="flex items-center text-sm text-text-sub bg-bg-base px-3 py-1.5 rounded-full max-w-full cursor-pointer" onClick={handleCopy}>
                <span className="truncate mr-2">订单号：{displayOrderNo}</span>
                <span className="flex items-center text-text-main font-medium shrink-0 whitespace-nowrap">
                  <Copy size={12} className="mr-1" />
                  复制
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm mb-4 overflow-hidden">
              {paymentMethods.map((method, index) => (
                <div
                  key={method.id}
                  className={`flex items-center p-4 cursor-pointer ${
                    index !== paymentMethods.length - 1 ? 'border-b border-border-light/50' : ''
                  }`}
                  onClick={() => setSelectedMethod(method.id)}
                >
                  <div className={`w-6 h-6 rounded-full ${method.bg} flex items-center justify-center shrink-0`}>
                    <method.icon size={14} className={method.color} />
                  </div>
                  <div className="flex-1 ml-3 min-w-0">
                    <div className="text-md text-text-main font-medium truncate">{method.name}</div>
                    <div className="text-sm text-text-sub truncate mt-0.5">{method.desc}</div>
                  </div>
                  {selectedMethod === method.id ? (
                    <CheckCircle2 size={20} className="text-primary-start fill-primary-start/10" />
                  ) : (
                    <Circle size={20} className="text-text-aux" />
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center text-text-sub text-s">
              <ShieldCheck size={12} className="mr-1" />
              <span>支付安全由平台及合作机构保障</span>
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-border-light px-4 py-3 z-40 pb-safe">
        <button
          onClick={handlePay}
          disabled={paying || orderId <= 0}
          className="w-full h-11 rounded-full bg-gradient-to-r from-primary-start to-primary-end text-white text-lg font-medium shadow-sm active:opacity-80 flex items-center justify-center disabled:opacity-60"
        >
          {paying ? '支付中...' : payButtonText()}
        </button>
      </div>

      {showFailureModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-10">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full overflow-hidden flex flex-col items-center pt-6 pb-5 px-5">
            <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-500/15 flex items-center justify-center mb-3">
              <AlertTriangle size={24} className="text-primary-start" />
            </div>
            <h3 className="text-xl font-bold text-text-main mb-2">支付失败</h3>
            <p className="text-base text-text-sub text-center mb-6 leading-relaxed">
              余额不足或支付异常，请稍后重试。
            </p>
            <div className="w-full flex space-x-3">
              <button
                onClick={() => setShowFailureModal(false)}
                className="flex-1 h-10 rounded-full border border-border-light text-md font-medium text-text-main active:bg-bg-base"
              >
                取消
              </button>
              <button
                onClick={() => {
                  setShowFailureModal(false);
                  void handlePay();
                }}
                className="flex-1 h-10 rounded-full bg-gradient-to-r from-primary-start to-primary-end text-md font-medium text-white"
              >
                重新支付
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export const CashierPage = () => {
  const [searchParams] = useSearchParams();

  const scene = searchParams.get('scene') ?? '';
  const payUrl = searchParams.get('pay_url') ?? '';
  const amount = Number(searchParams.get('amount')) || 0;
  const orderNo = searchParams.get('order_no') ?? '';
  const expireSeconds = Number(searchParams.get('expire_seconds')) || 300;

  if (scene === 'recharge' || payUrl) {
    return (
      <RechargeCashierView
        amount={amount}
        orderNo={orderNo}
        orderId={Number(searchParams.get('order_id')) || 0}
        payUrl={payUrl || undefined}
        expireSeconds={expireSeconds}
      />
    );
  }

  return <MallCashierView />;
};

export default CashierPage;
