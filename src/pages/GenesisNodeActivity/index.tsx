import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  CircleCheckBig,
  Info,
  Loader2,
  NotebookTabs,
  Wallet,
  Zap,
} from 'lucide-react';
import { genesisNodeApi, type GenesisNodeOrder, type GenesisNodePreview } from '../../api/modules/genesisNode';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { Skeleton } from '../../components/ui/Skeleton';
import { PageHeader } from '../../components/layout/PageHeader';
import { useRequest } from '../../hooks/useRequest';
import { useAppNavigate } from '../../lib/navigation';
import {
  GENESIS_NODE_AMOUNT_OPTIONS,
  formatCountdown,
  getGenesisActivityPhase,
  getGenesisStatusLabel,
  getGenesisStatusTone,
  hasGenesisResultBeenSeen,
  markGenesisResultSeen,
  type GenesisActivityPhase,
} from '../../features/node-purchase/genesis';

function formatMoney(value: number, fractionDigits = 2): string {
  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
    useGrouping: false,
  });
}

function formatAmount(value: number): string {
  return formatMoney(value, 0);
}

function trimTimeLabel(value: string, fallback: string): string {
  if (!value) {
    return fallback;
  }

  return value.length >= 5 ? value.slice(0, 5) : value;
}

const phaseMeta: Record<GenesisActivityPhase, { label: string; title: string; description: string }> = {
  upcoming: {
    label: '未开抢',
    title: '距离开抢还有一段时间',
    description: '当前仅开放档位预览，未到开抢时间不可提交抢购。',
  },
  selling: {
    label: '抢购中',
    title: '固定档位资格申购',
    description: '仅支持 5 个固定金额档位，不提供自定义输入金额。',
  },
  drawing: {
    label: '待开奖',
    title: '开奖结果回写中',
    description: '系统正在统一回写结果，中签后将直接转入权益节点。',
  },
  settled: {
    label: '已开奖',
    title: '结果已回写完成',
    description: '中签可直接查看权益节点，未中签记录会展示为已退回。',
  },
};

function ResultModal({
  onClose,
  onViewMiner,
  order,
}: {
  onClose: () => void;
  onViewMiner: () => void;
  order: GenesisNodeOrder;
}) {
  const won = order.status === 1;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center px-6">
      <button
        type="button"
        aria-label="关闭结果弹窗"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-[340px] rounded-[28px] border border-border-light bg-bg-card p-6 shadow-soft dark:shadow-[0_20px_60px_rgba(0,0,0,0.36)]">
        <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full ${won ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/14 dark:text-emerald-300' : 'bg-primary-start/10 text-primary-start'}`}>
          {won ? <CircleCheckBig size={24} /> : <CircleAlert size={24} />}
        </div>
        <div className="mb-2 text-4xl font-black text-text-main">
          {won ? '已中签，权益节点已锁定' : '资金已退回处理中'}
        </div>
        <p className="text-sm leading-6 text-text-sub">
          {won
            ? `¥${formatAmount(order.amount)} 档已中签，系统已将结果直转至权益节点名下。`
            : `¥${formatAmount(order.amount)} 档未中签，记录页已直接标记为已退回。`}
        </p>
        <div className="mt-5 rounded-[18px] bg-bg-hover px-4 py-3 text-s text-text-sub">
          <div>批次日期：{order.activityDate || '--'} · {trimTimeLabel(order.drawTime || '', '20:00')} 开奖</div>
          <div className="mt-1">{won ? '结果已转入权益节点' : order.frontendStatusText || '退款处理中'}</div>
        </div>
        <div className="mt-6 flex gap-3">
          {!won ? (
            <button
              type="button"
              className="h-11 flex-1 rounded-full bg-gradient-to-r from-primary-start to-primary-end text-base font-medium text-white"
              onClick={onClose}
            >
              我知道了
            </button>
          ) : (
            <>
              <button
                type="button"
                className="h-11 flex-1 rounded-full border border-border-main text-base font-medium text-text-main"
                onClick={onClose}
              >
                稍后查看
              </button>
              <button
                type="button"
                className="h-11 flex-1 rounded-full bg-gradient-to-r from-primary-start to-primary-end text-base font-medium text-white"
                onClick={onViewMiner}
              >
                查看权益节点
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-bg-base">
      <PageHeader title="创世节点抢购" className="border-b border-border-light bg-bg-base/95 backdrop-blur" />
      <div className="flex-1 overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+8.5rem)] pt-4">
        <Skeleton className="h-[240px] rounded-[28px]" />
        <Skeleton className="mt-4 h-[122px] rounded-[24px]" />
        <Skeleton className="mt-4 h-[190px] rounded-[24px]" />
        <div className="mt-4 grid grid-cols-3 gap-2.5">
          {GENESIS_NODE_AMOUNT_OPTIONS.map((amount) => (
            <Skeleton key={amount} className="h-[104px] rounded-[22px]" />
          ))}
        </div>
        <Skeleton className="mt-4 h-[210px] rounded-[24px]" />
      </div>
    </div>
  );
}

export function GenesisNodeActivityPage() {
  const { goBackOr, goTo } = useAppNavigate();
  const { showToast } = useFeedback();
  const [now, setNow] = useState(() => new Date());
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [activeResultOrder, setActiveResultOrder] = useState<GenesisNodeOrder | null>(null);
  const [submittingAmount, setSubmittingAmount] = useState<number | null>(null);

  const activityRequest = useRequest(
    (signal) => genesisNodeApi.getActivity({ signal }),
    { cacheKey: 'genesis-node:activity' },
  );
  const ordersRequest = useRequest(
    (signal) => genesisNodeApi.getOrders({ page: 1, limit: 200 }, signal),
    { cacheKey: 'genesis-node:orders:summary' },
  );

  const activity = activityRequest.data;
  const todayOrder = activity?.todayOrder ?? null;
  const phase = useMemo(() => getGenesisActivityPhase(activity), [activity]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const shouldPoll = phase === 'selling' || phase === 'drawing' || Boolean(todayOrder);
    if (!shouldPoll) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      void activityRequest.reload().catch(() => undefined);
      void ordersRequest.reload().catch(() => undefined);
    }, 10000);

    return () => window.clearInterval(timer);
  }, [activityRequest, ordersRequest, phase, todayOrder]);

  useEffect(() => {
    if (!todayOrder || todayOrder.status === 0 || hasGenesisResultBeenSeen(todayOrder.id)) {
      return;
    }

    setActiveResultOrder((current) => (current?.id === todayOrder.id ? current : todayOrder));
  }, [todayOrder]);

  const tierMap = useMemo(() => {
    const map = new Map<number, NonNullable<typeof activity>['tiers'][number]>();
    activity?.tiers.forEach((tier) => {
      map.set(tier.amount, tier);
    });
    return map;
  }, [activity]);

  const displayAmounts = useMemo(
    () => (activity?.fixedAmounts?.length ? activity.fixedAmounts : [...GENESIS_NODE_AMOUNT_OPTIONS]),
    [activity],
  );

  useEffect(() => {
    if (!displayAmounts.length) {
      return;
    }

    const preferredAmount = todayOrder?.amount ?? displayAmounts.find((amount) => tierMap.get(amount)?.enabled) ?? displayAmounts[0];
    setSelectedAmount((current) => (
      current && displayAmounts.includes(current)
        ? current
        : preferredAmount
    ));
  }, [displayAmounts, tierMap, todayOrder?.amount]);

  const selectedTier = useMemo(
    () => (selectedAmount ? tierMap.get(selectedAmount) ?? null : null),
    [selectedAmount, tierMap],
  );

  const previewRequest = useRequest<GenesisNodePreview | null>(
    (signal) => {
      if (!activity?.activityId || !selectedAmount) {
        return Promise.resolve(null);
      }

      return genesisNodeApi.preview({ activityId: activity.activityId, amount: selectedAmount }, signal);
    },
    {
      cacheKey: `genesis-node:preview:${activity?.activityId ?? 0}:${selectedAmount ?? 0}`,
      deps: [activity?.activityId, selectedAmount],
      keepPreviousData: true,
      manual: !activity?.activityId || !selectedAmount,
    },
  );

  const countdown = useMemo(
    () => formatCountdown(activity?.countdownTargetTime, now),
    [activity?.countdownTargetTime, now],
  );

  const rushStartTime = trimTimeLabel(activity?.rushStartTime ?? '', '17:00');
  const drawTime = trimTimeLabel(activity?.drawTime ?? '', '20:00');
  const orders = ordersRequest.data?.list ?? [];
  const stats = useMemo(
    () => ({
      pending: orders.filter((item) => item.status === 0).length,
      won: orders.filter((item) => item.status === 1).length,
      lost: orders.filter((item) => item.status !== 0 && item.status !== 1).length,
    }),
    [orders],
  );

  const selectedPayment = todayOrder?.payment ?? previewRequest.data?.payment;
  const cashPay = selectedPayment?.balanceAmount ?? ((selectedAmount ?? 0) * 0.9);
  const goldPay = selectedPayment?.pendingActivationGoldAmount ?? ((selectedAmount ?? 0) * 0.1);
  const availableBalance = activity?.userBalance?.balanceAvailable ?? selectedPayment?.availableAmounts?.balanceAvailable ?? 0;
  const pendingActivationGold = activity?.userBalance?.pendingActivationGold ?? selectedPayment?.availableAmounts?.pendingActivationGold ?? 0;

  const bottomActionText = useMemo(() => {
    if (submittingAmount) {
      return '提交中...';
    }

    if (todayOrder) {
      if (todayOrder.status === 1) {
        return '查看权益节点';
      }

      if (todayOrder.status === 0) {
        return '待开奖结果';
      }

      return '查看记录';
    }

    if (phase === 'selling') {
      return '立即抢购';
    }

    if (phase === 'upcoming') {
      return `${rushStartTime} 开抢`;
    }

    if (phase === 'drawing') {
      return '待开奖结果';
    }

    return '查看开奖记录';
  }, [phase, rushStartTime, submittingAmount, todayOrder]);

  const bottomActionDisabled = useMemo(() => {
    if (submittingAmount) {
      return true;
    }

    if (todayOrder) {
      return todayOrder.status === 0;
    }

    if (phase === 'selling') {
      return !activity?.canBuy || Boolean(activity?.userHasOrderToday) || !selectedTier?.enabled || !selectedAmount;
    }

    return phase !== 'settled';
  }, [activity?.canBuy, activity?.userHasOrderToday, phase, selectedAmount, selectedTier?.enabled, submittingAmount, todayOrder]);

  const infoNotice = useMemo(() => {
    if (phase === 'upcoming') {
      return `当前处于“未开抢”阶段，${rushStartTime} 前仅可查看固定档位和支付结构。`;
    }

    if (phase === 'drawing') {
      return `当前处于“待开奖”阶段，系统会在 ${drawTime} 后统一回写结果。`;
    }

    if (phase === 'settled') {
      return '当前处于“已开奖”阶段，中签可直接查看权益节点，未中签展示为已退回。';
    }

    return '当前处于“抢购中”阶段，请在倒计时结束前完成固定金额档位抢购。';
  }, [drawTime, phase, rushStartTime]);

  const handleRefresh = async () => {
    await Promise.allSettled([activityRequest.reload(), ordersRequest.reload(), previewRequest.reload()]);
  };

  const handleCloseResultModal = () => {
    if (!activeResultOrder) {
      return;
    }

    markGenesisResultSeen(activeResultOrder.id);
    setActiveResultOrder(null);
  };

  const handleViewMiner = () => {
    if (!activeResultOrder) {
      return;
    }

    markGenesisResultSeen(activeResultOrder.id);
    const targetPath = `/node-purchase/genesis/miner/${activeResultOrder.id}`;
    setActiveResultOrder(null);
    goTo(targetPath);
  };

  const submitPurchase = async () => {
    if (!activity?.activityId || !selectedAmount) {
      showToast({ type: 'warning', message: '请选择一个可用的固定金额档位' });
      return;
    }

    if (!activity.canBuy) {
      showToast({ type: 'warning', message: activity.stageText || '当前不在抢购时间内' });
      return;
    }

    setSubmittingAmount(selectedAmount);
    try {
      const response = await genesisNodeApi.buy({ activityId: activity.activityId, amount: selectedAmount });
      setShowConfirm(false);
      await handleRefresh();
      showToast({
        type: 'success',
        message: response.message || `已提交 ¥${formatAmount(selectedAmount)} 档抢购，${drawTime} 后查看结果`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '抢购提交失败，请稍后重试';
      showToast({ type: 'warning', message });
    } finally {
      setSubmittingAmount(null);
    }
  };

  const handlePrimaryAction = () => {
    if (todayOrder) {
      if (todayOrder.status === 1) {
        goTo(`/node-purchase/genesis/miner/${todayOrder.id}`);
        return;
      }

      if (todayOrder.status !== 0) {
        goTo('my_genesis_nodes');
      }
      return;
    }

    if (phase === 'selling' && selectedAmount) {
      setShowConfirm(true);
      return;
    }

    if (phase === 'settled') {
      goTo('my_genesis_nodes');
    }
  };

  if (activityRequest.loading && !activity) {
    return <ActivitySkeleton />;
  }

  if (activityRequest.error && !activity) {
    return (
      <div className="flex min-h-full flex-1 flex-col bg-bg-base">
        <PageHeader
          title="创世节点抢购"
          onBack={() => goBackOr('home')}
          className="border-b border-border-light bg-bg-base/95 backdrop-blur"
        />
        <ErrorState message={activityRequest.error.message || '活动加载失败，请稍后重试'} onRetry={() => void handleRefresh()} />
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="flex min-h-full flex-1 flex-col bg-bg-base">
        <PageHeader
          title="创世节点抢购"
          onBack={() => goBackOr('home')}
          className="border-b border-border-light bg-bg-base/95 backdrop-blur"
        />
        <EmptyState message="当前暂无可参与的创世节点活动" actionText="返回首页" onAction={() => goTo('home')} />
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-bg-base text-text-main">
      <PageHeader
        title="创世节点抢购"
        onBack={() => goBackOr('home')}
        className="border-b border-border-light bg-bg-base/95 backdrop-blur"
        titleClassName="tracking-[0.04em]"
      />

      <div className="flex-1 overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+8.5rem)] pt-4">
        <section className="relative overflow-hidden rounded-[28px] border border-border-light bg-bg-card px-5 pb-7 pt-6 shadow-soft">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(233,59,59,0.14),transparent_55%)] dark:bg-[radial-gradient(circle_at_top,rgba(211,47,47,0.18),transparent_55%)]" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary-start/20 bg-primary-start/10 px-3 py-1 text-xs font-bold text-primary-start">
              <Zap size={12} fill="currentColor" />
              <span>{activity.stageText || phaseMeta[phase].label}</span>
            </div>

            <h2 className="mt-4 text-center text-5xl font-black text-text-main">
              {activity.titleFixed || activity.title || activity.name || '创世节点算力权益证'}
            </h2>
            <p className="mt-2 text-center text-sm leading-6 text-text-sub">
              {phaseMeta[phase].description}
            </p>

            <div className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-bg-hover px-3 py-1 text-s font-medium text-text-sub">
              <Info size={12} className="text-primary-start" />
              <span>抢购时间仅剩</span>
            </div>

            <div className="mt-5 flex items-center gap-3">
              {[
                { label: '时', value: countdown.hours },
                { label: '分', value: countdown.minutes },
                { label: '秒', value: countdown.seconds },
              ].map((item, index) => (
                <div key={item.label} className="flex items-center gap-3">
                  {index > 0 ? <span className="pb-5 text-2xl font-bold text-primary-start">:</span> : null}
                  <div className="flex flex-col items-center">
                    <div className="min-w-[66px] rounded-[18px] border border-border-light bg-bg-hover px-3 py-3 text-center shadow-soft">
                      <div className="font-mono text-4xl font-black text-text-main">{item.value}</div>
                    </div>
                    <span className="mt-1 text-2xs tracking-[0.18em] text-text-aux">{item.label}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 grid w-full grid-cols-2 gap-3 border-t border-border-light pt-4 text-s">
              <div className="rounded-[18px] bg-bg-hover px-4 py-3">
                <div className="text-text-aux">活动名额</div>
                <div className="mt-1 text-lg font-black text-text-main">{activity.displayTotalQuota} 份</div>
              </div>
              <div className="rounded-[18px] bg-bg-hover px-4 py-3">
                <div className="text-text-aux">支付结构</div>
                <div className="mt-1 text-lg font-black text-text-main">混合支付 {activity.payRatio}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-[24px] border border-border-light bg-bg-card p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-s text-text-sub">
              <Wallet size={14} />
              <span>我的资产</span>
            </div>
            <div className="rounded-full border border-primary-start/16 bg-primary-start/10 px-3 py-1 text-2xs font-medium text-primary-start">
              混合支付 {selectedPayment?.ratio || activity.payRatio}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xs text-text-aux">可用余额</p>
              <p className="mt-1 text-xl font-bold text-text-main">¥ {formatMoney(availableBalance)}</p>
            </div>
            <div className="border-l border-border-light pl-4">
              <p className="text-2xs text-text-aux">待激活确权金</p>
              <p className="mt-1 text-xl font-bold text-primary-start">¥ {formatMoney(pendingActivationGold)}</p>
            </div>
          </div>
        </section>

        <section className="mt-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center text-lg font-bold text-text-main">
              <span className="mr-2 h-4 w-1 rounded-full bg-primary-start" />
              选择认购面值
            </h3>
            <span className="text-s text-text-sub">每人每日限购 {activity.perUserDailyLimit} 份</span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {displayAmounts.map((amount) => {
              const tier = tierMap.get(amount);
              const selected = selectedAmount === amount;
              const currentOrder = todayOrder?.amount === amount ? todayOrder : null;
              const disabledByLimit = Boolean(activity.userHasOrderToday && !currentOrder);
              const selectable = Boolean(tier?.enabled) && !disabledByLimit;

              const badgeText = currentOrder
                ? getGenesisStatusLabel(currentOrder)
                : !tier?.enabled
                  ? '未开放'
                  : disabledByLimit
                    ? '今日已参与'
                    : phase === 'selling'
                      ? '可抢购'
                      : phase === 'upcoming'
                        ? `${rushStartTime} 开抢`
                        : phase === 'drawing'
                          ? '待开奖'
                          : '看结果';

              const badgeTone = currentOrder
                ? getGenesisStatusTone(currentOrder)
                : selected
                  ? 'bg-primary-start/10 text-primary-start'
                  : 'bg-bg-hover text-text-sub';

              return (
                <button
                  key={amount}
                  type="button"
                  disabled={!selectable && !currentOrder}
                  onClick={() => setSelectedAmount(amount)}
                  className={`relative h-[104px] rounded-[22px] border px-2 py-3 transition-all ${selected ? 'border-primary-start bg-primary-start/8 shadow-soft' : 'border-border-light bg-bg-card'} ${!selectable && !currentOrder ? 'opacity-60' : 'active:scale-[0.98]'}`}
                >
                  {selected ? (
                    <div className="absolute right-0 top-0 rounded-bl-[12px] rounded-tr-[22px] bg-primary-start px-1.5 py-1 text-white">
                      <CheckCircle2 size={12} />
                    </div>
                  ) : null}
                  <div className={`text-4xl font-black ${selected ? 'text-primary-start' : 'text-text-main'}`}>
                    {formatAmount(amount)}
                  </div>
                  <div className="mt-1 text-s text-text-sub">认购额度</div>
                  <div className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-2xs font-medium ${badgeTone}`}>
                    {badgeText}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-4 rounded-[24px] border border-border-light bg-bg-card p-5 shadow-soft">
          <h3 className="flex items-center text-lg font-bold text-text-main">
            <span className="mr-2 h-4 w-1 rounded-full bg-primary-start" />
            认购规则
          </h3>
          <div className="mt-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-start/10 text-2xs font-bold text-primary-start">1</div>
              <p className="text-sm leading-6 text-text-sub">本期活动支持 <span className="font-bold text-text-main">混合支付 {selectedPayment?.ratio || activity.payRatio}</span>，即专项金与待激活确权金组合支付。</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-start/10 text-2xs font-bold text-primary-start">2</div>
              <p className="text-sm leading-6 text-text-sub">每日 {rushStartTime} 开抢，{drawTime} 开奖，每人每日限购 <span className="font-bold text-text-main">{activity.perUserDailyLimit}</span> 份。</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-start/10 text-2xs font-bold text-primary-start">3</div>
              <p className="text-sm leading-6 text-text-sub">中签后直接转入权益节点，不开放寄售入口；未中签记录会直接展示为“已退回”。</p>
            </div>
          </div>
        </section>

        <div className="mt-4 flex items-start gap-3 rounded-[22px] border border-primary-start/12 bg-primary-start/6 px-4 py-4">
          <Info size={16} className="mt-0.5 shrink-0 text-primary-start" />
          <p className="text-s leading-6 text-text-sub">{infoNotice}</p>
        </div>

        <button
          type="button"
          onClick={() => goTo('my_genesis_nodes')}
          className="mt-4 flex w-full items-center justify-between rounded-[24px] border border-border-light bg-bg-card px-5 py-4 text-left shadow-soft"
        >
          <div>
            <div className="flex items-center gap-2 text-s text-text-sub">
              <NotebookTabs size={14} />
              <span>我的参与记录</span>
            </div>
            <div className="mt-2 text-2xl font-bold text-text-main">我的创世节点</div>
            <div className="mt-1 text-sm text-text-sub">
              待开奖 {stats.pending} 条 / 已中签 {stats.won} 条 / 未中签 {stats.lost} 条
            </div>
          </div>
          <div className="inline-flex items-center text-base font-medium text-primary-start">
            查看记录 <ChevronRight size={16} className="ml-1" />
          </div>
        </button>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border-light bg-bg-card/92 px-4 pb-safe pt-3 backdrop-blur-xl">
        <div className="mb-3 flex items-center justify-between px-2">
          <div>
            <div className="text-2xs text-text-aux">合计需支付</div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-4xl font-bold text-primary-start">¥ {formatMoney(cashPay)}</span>
              <span className="text-s text-text-sub">+ {formatMoney(goldPay)} 确权金</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-text-main">
              {todayOrder ? getGenesisStatusLabel(todayOrder) : phaseMeta[phase].label}
            </div>
          </div>
        </div>
        <button
          type="button"
          disabled={bottomActionDisabled}
          onClick={handlePrimaryAction}
          className={`h-12 w-full rounded-[16px] text-lg font-bold transition-transform ${bottomActionDisabled ? 'bg-bg-hover text-text-sub' : 'bg-gradient-to-r from-primary-start to-primary-end text-white shadow-soft active:scale-[0.985]'}`}
        >
          {bottomActionText}
        </button>
      </div>

      <AnimatePresence>
        {showConfirm && selectedAmount ? (
          <div className="fixed inset-0 z-[110] flex items-end justify-center sm:items-center">
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => {
                if (!submittingAmount) {
                  setShowConfirm(false);
                }
              }}
            />
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="relative w-full max-w-md rounded-t-[32px] border border-border-light bg-bg-card p-6 pb-10 sm:rounded-[32px] sm:pb-6"
            >
              <div className="mx-auto mb-6 h-1 w-12 rounded-full bg-border-light" />
              <h3 className="text-center text-3xl font-bold text-text-main">确认抢购订单</h3>

              <div className="mt-6 rounded-[22px] bg-bg-hover p-4">
                <div className="space-y-4 text-base text-text-main">
                  <div className="flex items-center justify-between">
                    <span className="text-text-sub">抢购面值</span>
                    <span className="font-bold">¥ {formatAmount(selectedAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-sub">现金支付</span>
                    <span>¥ {formatMoney(cashPay)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-sub">确权金抵扣</span>
                    <span className="text-primary-start">- ¥ {formatMoney(goldPay)}</span>
                  </div>
                  <div className="border-t border-border-light pt-4">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-text-main">实付金额</span>
                      <span className="text-3xl font-bold text-primary-start">¥ {formatMoney(cashPay)}</span>
                    </div>
                    <div className="mt-2 text-s leading-6 text-text-sub">
                      支付结构：{selectedPayment?.payTypeText || '混合支付'} {selectedPayment?.ratio || activity.payRatio}，中签后将直接转入权益节点。
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  disabled={Boolean(submittingAmount)}
                  onClick={() => setShowConfirm(false)}
                  className="h-12 flex-1 rounded-[16px] bg-bg-hover text-base font-medium text-text-main"
                >
                  取消
                </button>
                <button
                  type="button"
                  disabled={Boolean(submittingAmount)}
                  onClick={() => void submitPurchase()}
                  className="flex h-12 flex-[1.4] items-center justify-center rounded-[16px] bg-gradient-to-r from-primary-start to-primary-end text-base font-bold text-white"
                >
                  {submittingAmount ? <Loader2 size={18} className="animate-spin" /> : '确认抢购'}
                </button>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      {activeResultOrder ? (
        <ResultModal
          order={activeResultOrder}
          onClose={handleCloseResultModal}
          onViewMiner={handleViewMiner}
        />
      ) : null}
    </div>
  );
}

export default GenesisNodeActivityPage;
