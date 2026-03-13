/**
 * @file MyCardPacks/index.tsx
 * @description 我的卡包页面，展示可购买权益卡与已持有权益卡。
 */

import { Coins, CreditCard, ShieldCheck, Ticket, Wallet } from 'lucide-react';
import { useMemo, useRef } from 'react';
import {
  accountApi,
  membershipCardApi,
  type MembershipCardOwnedCard,
  type MembershipCardProduct,
} from '../../api';
import { getErrorMessage } from '../../api/core/errors';
import { WalletPageHeader } from '../../components/layout/WalletPageHeader';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { PullToRefreshContainer } from '../../components/ui/PullToRefreshContainer';
import { Skeleton } from '../../components/ui/Skeleton';
import { useAuthSession } from '../../hooks/useAuthSession';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useRequest } from '../../hooks/useRequest';
import { useRouteScrollRestoration } from '../../hooks/useRouteScrollRestoration';
import { useSessionState } from '../../hooks/useSessionState';
import { useAppNavigate } from '../../lib/navigation';

type CardTab = 'owned' | 'market';
type PurchaseMethod = 'supply' | 'pending' | 'mixed';

interface PurchasePlan {
  canBuy: boolean;
  displayPendingPay: number;
  displaySupplyPay: number;
  paymentMethod?: PurchaseMethod;
  pendingPay: number;
  reason?: string;
  supplyPay: number;
}

function formatMoney(value: number | string | undefined, fractionDigits = 2) {
  const nextValue = typeof value === 'string' ? Number(value) : value;
  if (typeof nextValue !== 'number' || !Number.isFinite(nextValue)) {
    return '--';
  }

  return nextValue.toLocaleString('zh-CN', {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
    useGrouping: false,
  });
}

function formatPercent(value: number) {
  const nextValue = Number.isFinite(value) ? value * 100 : 0;
  return `${formatMoney(nextValue, Number.isInteger(nextValue) ? 0 : 2)}%`;
}

function ceilMoney(value: number) {
  return Math.ceil((value + Number.EPSILON) * 100) / 100;
}

function computeMixedPaymentPlan(
  product: MembershipCardProduct,
  minPayRatio: number,
  balanceAvailable: number,
  pendingActivationGold: number,
): PurchasePlan {
  const price = Math.max(0, Number(product.price) || 0);
  const supply = Math.max(0, Number(balanceAvailable) || 0);
  const pending = Math.max(0, Number(pendingActivationGold) || 0);

  if (supply + pending < price) {
    return {
      canBuy: false,
      displayPendingPay: 0,
      displaySupplyPay: price,
      pendingPay: 0,
      reason: '总余额不足',
      supplyPay: 0,
    };
  }

  const minSupply = Math.max(0.01, ceilMoney(price * Math.min(Math.max(minPayRatio, 0), 0.99)));
  const supplyPay = Math.max(minSupply, Math.max(0.01, ceilMoney(price - pending)));
  const pendingPay = Math.round((price - supplyPay) * 100) / 100;

  if (pendingPay <= 0 || supplyPay >= price) {
    return {
      canBuy: false,
      displayPendingPay: pendingPay,
      displaySupplyPay: supplyPay,
      pendingPay,
      reason: '待激活确权金余额不足',
      supplyPay,
    };
  }

  if (supply < supplyPay) {
    return {
      canBuy: false,
      displayPendingPay: pendingPay,
      displaySupplyPay: supplyPay,
      pendingPay,
      reason: `专项金至少需支付 ¥${formatMoney(supplyPay)}`,
      supplyPay,
    };
  }

  if (pending < pendingPay) {
    return {
      canBuy: false,
      displayPendingPay: pendingPay,
      displaySupplyPay: supplyPay,
      pendingPay,
      reason: '待激活确权金余额不足',
      supplyPay,
    };
  }

  return {
    canBuy: true,
    displayPendingPay: pendingPay,
    displaySupplyPay: supplyPay,
    paymentMethod: 'mixed',
    pendingPay,
    supplyPay,
  };
}

function computePlan(
  product: MembershipCardProduct,
  minPayRatio: number,
  balanceAvailable: number,
  pendingActivationGold: number,
): PurchasePlan {
  const supplyPrice = Math.max(0, Number(product.price) || 0);
  const pendingPrice = Math.max(0, Number(product.pendingActivationPrice) || 0);
  const supply = Math.max(0, Number(balanceAvailable) || 0);
  const pending = Math.max(0, Number(pendingActivationGold) || 0);

  if (pendingPrice > 0) {
    const canUseSupply = supplyPrice > 0 && supply >= supplyPrice;
    const canUsePending = pending >= pendingPrice;

    if (canUseSupply) {
      return {
        canBuy: true,
        displayPendingPay: pendingPrice,
        displaySupplyPay: supplyPrice,
        paymentMethod: 'supply',
        pendingPay: 0,
        supplyPay: supplyPrice,
      };
    }

    if (canUsePending) {
      return {
        canBuy: true,
        displayPendingPay: pendingPrice,
        displaySupplyPay: supplyPrice,
        paymentMethod: 'pending',
        pendingPay: pendingPrice,
        reason: '当前将使用待激活确权金支付',
        supplyPay: 0,
      };
    }

    const shortageMessages: string[] = [];
    if (supplyPrice > 0) {
      shortageMessages.push(`专项金需 ¥${formatMoney(supplyPrice)}`);
    }
    shortageMessages.push(`待激活确权金需 ¥${formatMoney(pendingPrice)}`);

    return {
      canBuy: false,
      displayPendingPay: pendingPrice,
      displaySupplyPay: supplyPrice,
      pendingPay: 0,
      reason: shortageMessages.join('，'),
      supplyPay: 0,
    };
  }

  return computeMixedPaymentPlan(product, minPayRatio, balanceAvailable, pendingActivationGold);
}

function buildConfirmMessage(product: MembershipCardProduct, plan: PurchasePlan) {
  const lines = [`确认购买“${product.name}”吗？`, ''];

  if (plan.paymentMethod === 'pending') {
    lines.push(`待激活确权金支付：¥${formatMoney(plan.pendingPay)}`);
  } else if (plan.paymentMethod === 'supply') {
    lines.push(`专项金支付：¥${formatMoney(plan.supplyPay)}`);
  } else {
    lines.push(`专项金支付：¥${formatMoney(plan.supplyPay)}`);
    lines.push(`待激活确权金支付：¥${formatMoney(plan.pendingPay)}`);
  }

  return lines.join('\n');
}

function getStatusMeta(card: MembershipCardOwnedCard) {
  if (card.isActive) {
    return {
      badge: 'bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-300',
      label: '生效中',
    };
  }

  if (card.status === 2) {
    return {
      badge: 'bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
      label: '已过期',
    };
  }

  return {
    badge: 'bg-gray-100 text-gray-600 dark:bg-gray-700/60 dark:text-gray-300',
    label: '已停用',
  };
}

export function MyCardPacksPage() {
  const { goBack, goTo } = useAppNavigate();
  const { isAuthenticated } = useAuthSession();
  const { isOffline, refreshStatus } = useNetworkStatus();
  const { hideLoading, showConfirm, showLoading, showToast } = useFeedback();
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [activeTab, setActiveTab] = useSessionState<CardTab>('my-card-packs:tab', 'owned');

  const productsRequest = useRequest((signal) => membershipCardApi.products({ signal }), {
    cacheKey: 'membership-card:products',
    deps: [],
  });
  const profileRequest = useRequest((signal) => accountApi.getProfile({ signal }), {
    cacheKey: 'my-card-packs:profile',
    deps: [isAuthenticated],
    manual: !isAuthenticated,
  });
  const myCardsRequest = useRequest((signal) => membershipCardApi.myCards({ signal }), {
    cacheKey: 'my-card-packs:owned-cards',
    deps: [isAuthenticated],
    manual: !isAuthenticated,
  });

  const productsData = productsRequest.data;
  const ownedCards = Array.isArray(myCardsRequest.data) ? myCardsRequest.data : [];
  const productList = Array.isArray(productsData?.list) ? productsData.list : [];
  const balanceAvailable = Number(profileRequest.data?.userInfo?.balanceAvailable ?? 0);
  const pendingActivationGold = Number(profileRequest.data?.userInfo?.pendingActivationGold ?? 0);
  const activeCardsCount = ownedCards.filter((card) => card.isActive).length;
  const todayRemainingCount = ownedCards.reduce((total, card) => total + card.todayRemaining, 0);
  const usesDualPricing = productList.some((product) => product.pendingActivationPrice > 0);

  const plans = useMemo(() => {
    const map = new Map<number, PurchasePlan>();
    for (const product of productList) {
      map.set(
        product.id,
        computePlan(product, productsData?.minPayRatio ?? 0, balanceAvailable, pendingActivationGold),
      );
    }
    return map;
  }, [balanceAvailable, pendingActivationGold, productList, productsData?.minPayRatio]);

  useRouteScrollRestoration({
    containerRef: scrollContainerRef,
    namespace: `my-card-packs:${activeTab}`,
    restoreDeps: [activeTab, ownedCards.length, productList.length, isAuthenticated],
    restoreWhen: !productsRequest.loading && (!isAuthenticated || (!profileRequest.loading && !myCardsRequest.loading)),
  });

  const handleRefresh = () => {
    refreshStatus();
    const tasks: Array<Promise<unknown>> = [productsRequest.reload()];
    if (isAuthenticated) {
      tasks.push(profileRequest.reload(), myCardsRequest.reload());
    }
    return Promise.allSettled(tasks);
  };

  const handleBuy = async (product: MembershipCardProduct) => {
    if (!isAuthenticated) {
      goTo('login');
      return;
    }

    const plan = plans.get(product.id);
    if (!plan?.canBuy) {
      showToast({ message: plan?.reason || '当前条件暂不支持购买', type: 'warning' });
      return;
    }

    const confirmed = await showConfirm({
      title: '购买卡包',
      message: buildConfirmMessage(product, plan),
      confirmText: '确认购买',
      cancelText: '取消',
    });
    if (!confirmed) {
      return;
    }

    showLoading({
      message: '正在购买卡包',
      subMessage: '购买成功后会自动刷新持卡记录',
    });

    try {
      await membershipCardApi.buy({
        cardProductId: product.id,
        paySupplyChainAmount: plan.supplyPay,
        payPendingActivationAmount: plan.pendingPay,
      });
      showToast({ message: `${product.name} 购买成功`, type: 'success' });
      setActiveTab('owned');
      await Promise.allSettled([profileRequest.reload(), myCardsRequest.reload()]);
    } catch (error) {
      showToast({ message: getErrorMessage(error), type: 'error', duration: 3000 });
    } finally {
      hideLoading();
    }
  };

  const renderSummary = () => {
    if (!isAuthenticated) {
      return (
        <Card className="border-0 bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 text-white">
          <div className="mb-2 flex items-center text-sm text-white/75">
            <Ticket size={16} className="mr-2" />
            卡包购买与持卡抵扣
          </div>
          <div className="mb-2 text-2xl font-bold">登录后查看你的卡包与余额</div>
          <div className="text-sm leading-6 text-white/70">
            可以先浏览可购买卡包，登录后再完成购买与查看持卡记录。
          </div>
          <button
            type="button"
            onClick={() => goTo('login')}
            className="mt-4 h-11 rounded-full bg-white px-5 text-base font-medium text-slate-900 dark:bg-slate-100"
          >
            去登录
          </button>
        </Card>
      );
    }

    if (profileRequest.loading && !profileRequest.data) {
      return (
        <Card className="space-y-3 border-0 bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 text-white">
          <Skeleton className="h-5 w-28 bg-white/25" />
          <Skeleton className="h-9 w-40 bg-white/25" />
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((item) => (
              <Skeleton key={item} className="h-16 rounded-2xl bg-white/20" />
            ))}
          </div>
        </Card>
      );
    }

    return (
      <Card className="border-0 bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 text-white">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="mb-1 text-sm text-white/80">我的卡包</div>
            <div className="text-3xl font-bold">{activeCardsCount}</div>
          </div>
          <div className="rounded-full border border-white/20 bg-white/15 px-3 py-1 text-sm text-white/85">
            {usesDualPricing ? '支持双账户购买' : `专项金至少支付 ${formatPercent(productsData?.minPayRatio ?? 0)}`}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-white/14 p-3">
            <div className="mb-2 flex items-center text-xs text-white/75">
              <ShieldCheck size={14} className="mr-1.5" />
              专项金
            </div>
            <div className="text-lg font-semibold">¥{formatMoney(balanceAvailable)}</div>
          </div>
          <div className="rounded-2xl bg-white/14 p-3">
            <div className="mb-2 flex items-center text-xs text-white/75">
              <Coins size={14} className="mr-1.5" />
              待激活确权金
            </div>
            <div className="text-lg font-semibold">¥{formatMoney(pendingActivationGold)}</div>
          </div>
          <div className="rounded-2xl bg-white/14 p-3">
            <div className="mb-2 flex items-center text-xs text-white/75">
              <CreditCard size={14} className="mr-1.5" />
              今日剩余
            </div>
            <div className="text-lg font-semibold">{todayRemainingCount} 次</div>
          </div>
        </div>
      </Card>
    );
  };

  const renderOwnedCards = () => {
    if (!isAuthenticated) {
      return (
        <Card>
          <EmptyState
            icon={<CreditCard size={48} />}
            message="登录后查看你的持卡记录"
            actionText="去登录"
            actionVariant="primary"
            onAction={() => goTo('login')}
          />
        </Card>
      );
    }

    if (myCardsRequest.loading && !myCardsRequest.data) {
      return (
        <div className="space-y-3">
          {[1, 2].map((item) => (
            <Card key={item} className="space-y-3">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-16 rounded-2xl" />
              <Skeleton className="h-4 w-full" />
            </Card>
          ))}
        </div>
      );
    }

    if (myCardsRequest.error && !myCardsRequest.data) {
      return (
        <Card>
          <ErrorState
            message={getErrorMessage(myCardsRequest.error)}
            onRetry={() => void myCardsRequest.reload().catch(() => undefined)}
          />
        </Card>
      );
    }

    if (!ownedCards.length) {
      return (
        <Card>
          <EmptyState
            icon={<Ticket size={48} />}
            message="你还没有购买任何卡包"
            actionText="去购买"
            actionVariant="primary"
            onAction={() => setActiveTab('market')}
          />
        </Card>
      );
    }

    return (
      <div className="space-y-3">
        {ownedCards.map((card) => {
          const status = getStatusMeta(card);

          return (
            <Card key={card.id} className="overflow-hidden p-0">
              <div className="bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 p-4 text-white">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-lg font-semibold">{card.cardName}</span>
                      <span className="rounded-full border border-white/20 bg-white/15 px-2 py-0.5 text-xs text-white/85">
                        {card.levelText || '权益卡'}
                      </span>
                    </div>
                    <div className="text-sm text-white/75">
                      {card.cycleTypeText || '周期卡'} · {card.source === 'manual' ? '后台发放' : '购买获得'}
                    </div>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${status.badge}`}>
                    {status.label}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-2xl bg-white/14 p-3">
                    <div className="mb-1 text-xs text-white/70">单次抵扣</div>
                    <div className="text-lg font-semibold">¥{formatMoney(card.deductAmountPerUse)}</div>
                  </div>
                  <div className="rounded-2xl bg-white/14 p-3">
                    <div className="mb-1 text-xs text-white/70">今日剩余</div>
                    <div className="text-lg font-semibold">{card.todayRemaining} 次</div>
                  </div>
                  <div className="rounded-2xl bg-white/14 p-3">
                    <div className="mb-1 text-xs text-white/70">最低手续费</div>
                    <div className="text-lg font-semibold">¥{formatMoney(card.minFee)}</div>
                  </div>
                </div>
              </div>
              <div className="space-y-3 p-4 text-sm text-text-sub">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-bg-base px-2.5 py-1 text-xs">每日限用 {card.dailyLimit} 次</span>
                  <span className="rounded-full bg-bg-base px-2.5 py-1 text-xs">已用 {card.todayUsage} 次</span>
                  <span className="rounded-full bg-bg-base px-2.5 py-1 text-xs">剩余 {card.remainingDays} 天</span>
                </div>
                <div>
                  生效时间：{card.startTimeText || '--'}
                  <br />
                  到期时间：{card.endTimeText || '--'}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderProducts = () => {
    if (productsRequest.loading && !productsData) {
      return (
        <div className="space-y-3">
          {[1, 2].map((item) => (
            <Card key={item} className="space-y-3">
              <Skeleton className="h-32 rounded-2xl" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-10 rounded-full" />
            </Card>
          ))}
        </div>
      );
    }

    if (productsRequest.error && !productsData) {
      return (
        <Card>
          <ErrorState
            message={getErrorMessage(productsRequest.error)}
            onRetry={() => void productsRequest.reload().catch(() => undefined)}
          />
        </Card>
      );
    }

    if (!productsData?.enabled) {
      return (
        <Card>
          <EmptyState
            icon={<Wallet size={48} />}
            message="卡包功能暂未开启"
            actionText="刷新"
            onAction={() => void productsRequest.reload().catch(() => undefined)}
          />
        </Card>
      );
    }

    if (!productList.length) {
      return (
        <Card>
          <EmptyState
            icon={<Wallet size={48} />}
            message="当前没有可购买的卡包"
            actionText="刷新"
            onAction={() => void productsRequest.reload().catch(() => undefined)}
          />
        </Card>
      );
    }

    return (
      <div className="space-y-3">
        <Card className="border border-orange-100 bg-orange-50/70 text-sm leading-6 text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-200">
          {usesDualPricing
            ? '卡包支持专项金或待激活确权金购买，页面展示的是各支付方式对应金额；下单时会优先使用可用的专项金方案。'
            : `卡包购买会同时扣除专项金与待激活确权金，专项金至少支付 ${formatPercent(productsData.minPayRatio)}，系统会按当前余额自动拆分。`}
        </Card>

        {productList.map((product) => {
          const plan = plans.get(product.id);

          return (
            <Card key={product.id} className="overflow-hidden p-0">
              <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 p-4 text-white">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-lg font-semibold">{product.name}</span>
                      <span className="rounded-full border border-white/20 bg-white/15 px-2 py-0.5 text-xs text-white/85">
                        {product.levelText || '权益卡'}
                      </span>
                    </div>
                    <div className="text-sm text-white/75">
                      {product.cycleTypeText || '周期卡'} · 有效期 {product.validDays} 天
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-white/70">售价</div>
                    <div className="text-2xl font-bold">¥{formatMoney(product.price)}</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-2xl bg-white/14 p-3">
                    <div className="mb-1 text-xs text-white/70">单次抵扣</div>
                    <div className="text-lg font-semibold">¥{formatMoney(product.deductAmountPerUse)}</div>
                  </div>
                  <div className="rounded-2xl bg-white/14 p-3">
                    <div className="mb-1 text-xs text-white/70">每日上限</div>
                    <div className="text-lg font-semibold">{product.dailyLimit} 次</div>
                  </div>
                  <div className="rounded-2xl bg-white/14 p-3">
                    <div className="mb-1 text-xs text-white/70">最低手续费</div>
                    <div className="text-lg font-semibold">¥{formatMoney(product.minFee)}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 p-4">
                {isAuthenticated ? (
                  <div className="rounded-2xl bg-bg-base p-3 text-sm text-text-sub">
                    <div className="flex items-center justify-between">
                      <span>专项金支付</span>
                      <span className="font-medium text-text-main">¥{formatMoney(plan?.displaySupplyPay ?? 0)}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span>待激活确权金支付</span>
                      <span className="font-medium text-text-main">¥{formatMoney(plan?.displayPendingPay ?? 0)}</span>
                    </div>
                    {plan?.reason ? (
                      <div className="mt-2 text-xs text-orange-600 dark:text-orange-300">{plan.reason}</div>
                    ) : null}
                  </div>
                ) : (
                  <div className="rounded-2xl bg-bg-base p-3 text-sm text-text-sub">
                    登录后可查看余额与购买方式。
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => void handleBuy(product)}
                  disabled={isAuthenticated ? !plan?.canBuy : false}
                  className={`flex h-11 w-full items-center justify-center rounded-full text-base font-medium ${
                    isAuthenticated
                      ? plan?.canBuy
                        ? 'bg-gradient-to-r from-primary-start to-primary-end text-white'
                        : 'bg-gray-200 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                      : 'bg-gradient-to-r from-primary-start to-primary-end text-white'
                  }`}
                >
                  {!isAuthenticated ? '登录后购买' : plan?.canBuy ? '立即购买' : '暂不可购买'}
                </button>
              </div>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex h-full flex-1 flex-col bg-bg-base">
      <WalletPageHeader
        title="我的卡包"
        onBack={goBack}
        offline={isOffline}
        onRefresh={handleRefresh}
        action={
          isAuthenticated
            ? {
                icon: Wallet,
                label: '去充值',
                onClick: () => goTo('recharge'),
              }
            : undefined
        }
      />

      <PullToRefreshContainer onRefresh={handleRefresh}>
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto no-scrollbar">
          <div className="space-y-3 px-4 py-4 pb-8">
            {renderSummary()}

            <div className="flex rounded-2xl bg-bg-card p-1 shadow-soft">
              {[
                { id: 'owned', label: '我的卡包' },
                { id: 'market', label: '可购买' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as CardTab)}
                  className={`flex-1 rounded-[14px] px-4 py-2.5 text-sm font-medium ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-primary-start to-primary-end text-white shadow-sm'
                      : 'text-text-sub'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'owned' ? renderOwnedCards() : renderProducts()}
          </div>
        </div>
      </PullToRefreshContainer>
    </div>
  );
}

export default MyCardPacksPage;
