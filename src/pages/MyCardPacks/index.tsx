/**
 * @file MyCardPacks/index.tsx
 * @description 我的卡包页面，展示可购买权益卡与已持有权益卡。
 */

import { Coins, CreditCard, ShieldCheck, Ticket, TrendingUp, Wallet, Zap } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  accountApi,
  type BindableMiningItem,
  membershipCardApi,
  nodeAmplifyCardApi,
  type AmplifyCardOwnedCard,
  type MembershipCardOwnedCard,
  type MembershipCardProduct,
  type MembershipCardType,
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
import { MiningSelectionSheet } from './components/MiningSelectionSheet';

type CardTab = MembershipCardType | 'owned';

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

function getCardGradient(levelText?: string, isExpired = false): string {
  if (isExpired) return 'from-gray-400 to-gray-600';
  if (!levelText) return 'from-emerald-600 to-emerald-800';
  if (levelText.includes('尊享')) return 'from-yellow-600 to-yellow-800';
  if (levelText.includes('高级')) return 'from-slate-600 to-slate-800';
  return 'from-emerald-600 to-emerald-800';
}




export function MyCardPacksPage() {
  const { goBack, goTo } = useAppNavigate();
  const { isAuthenticated } = useAuthSession();
  const { isOffline, refreshStatus } = useNetworkStatus();
  const { showConfirm, showLoading, showToast } = useFeedback();
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [activeTab, setActiveTab] = useSessionState<CardTab>('my-card-packs:tab', 'membership');

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
  const myCardsData = myCardsRequest.data;
  const ownedMembershipCards = myCardsData?.membershipList ?? [];
  const ownedAmplifyCards = myCardsData?.amplifyList ?? [];
  const allProducts = Array.isArray(productsData?.list) ? productsData.list : [];
  const productList = activeTab === 'owned' ? [] : allProducts.filter((p) => p.cardType === activeTab);
  const balanceAvailable = Number(profileRequest.data?.userInfo?.balanceAvailable ?? 0);
  const pendingActivationGold = Number(profileRequest.data?.userInfo?.pendingActivationGold ?? 0);
  const activeCardsCount =
    ownedMembershipCards.filter((c) => c.isActive).length +
    ownedAmplifyCards.filter((c) => c.isActive).length;
  const todayRemainingCount = ownedMembershipCards.reduce((total, card) => total + card.todayRemaining, 0);
  const isTabEnabled =
    activeTab === 'owned' ? true :
    activeTab === 'membership' ? productsData?.membershipEnabled : productsData?.nodeAmplifyEnabled;

  useRouteScrollRestoration({
    containerRef: scrollContainerRef,
    namespace: `my-card-packs:${activeTab}`,
    restoreDeps: [activeTab, ownedMembershipCards.length, ownedAmplifyCards.length, allProducts.length, isAuthenticated],
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

  const [miningSheetOpen, setMiningSheetOpen] = useState(false);
  const [miningSheetProduct, setMiningSheetProduct] = useState<MembershipCardProduct | null>(null);
  const [miningList, setMiningList] = useState<BindableMiningItem[]>([]);
  const [miningLoading, setMiningLoading] = useState(false);
  const [miningLoadingMore, setMiningLoadingMore] = useState(false);
  const [miningHasMore, setMiningHasMore] = useState(false);
  const [miningPage, setMiningPage] = useState(1);
  const [selectedMiningId, setSelectedMiningId] = useState<number | null>(null);
  const [amplifyBuying, setAmplifyBuying] = useState(false);

  const openMiningSheet = useCallback(async (product: MembershipCardProduct) => {
    if (!isAuthenticated) {
      goTo('login');
      return;
    }
    setMiningSheetProduct(product);
    setSelectedMiningId(null);
    setMiningSheetOpen(true);
    setMiningLoading(true);
    setMiningPage(1);
    setMiningHasMore(false);
    try {
      const res = await nodeAmplifyCardApi.bindableMining({ page: 1, limit: 10 });
      setMiningList(res.list);
      setMiningHasMore(res.hasMore);
    } catch (error) {
      showToast({ message: getErrorMessage(error), type: 'error' });
      setMiningList([]);
    } finally {
      setMiningLoading(false);
    }
  }, [goTo, isAuthenticated, showToast]);

  const loadMoreMining = useCallback(async () => {
    if (miningLoadingMore || !miningHasMore) return;
    const nextPage = miningPage + 1;
    setMiningLoadingMore(true);
    try {
      const res = await nodeAmplifyCardApi.bindableMining({ page: nextPage, limit: 10 });
      setMiningList((prev) => [...prev, ...res.list]);
      setMiningPage(nextPage);
      setMiningHasMore(res.hasMore);
    } catch (error) {
      showToast({ message: getErrorMessage(error), type: 'error' });
    } finally {
      setMiningLoadingMore(false);
    }
  }, [miningLoadingMore, miningHasMore, miningPage, showToast]);

  const closeMiningSheet = useCallback(() => {
    setMiningSheetOpen(false);
    setMiningSheetProduct(null);
    setSelectedMiningId(null);
  }, []);

  const handleAmplifyBuy = useCallback(async () => {
    if (!miningSheetProduct || selectedMiningId === null) return;

    const confirmLines = [`确认购买"${miningSheetProduct.name}"并绑定所选矿机吗？`, ''];
    confirmLines.push(`专项金：¥${formatMoney(miningSheetProduct.price)}`);
    if (miningSheetProduct.pendingActivationPrice > 0) {
      confirmLines.push(`待激活确权金：¥${formatMoney(miningSheetProduct.pendingActivationPrice)}`);
    }

    const confirmed = await showConfirm({
      title: '购买节点赋能卡',
      message: confirmLines.join('\n'),
      confirmText: '确认购买',
      cancelText: '取消',
    });
    if (!confirmed) return;

    setAmplifyBuying(true);
    try {
      await nodeAmplifyCardApi.buy({
        productId: miningSheetProduct.id,
        userCollectionId: selectedMiningId,
      });
      showToast({ message: `${miningSheetProduct.name} 购买成功`, type: 'success' });
      closeMiningSheet();
      await Promise.allSettled([profileRequest.reload(), myCardsRequest.reload()]);
    } catch (error) {
      showToast({ message: getErrorMessage(error), type: 'error', duration: 3000 });
    } finally {
      setAmplifyBuying(false);
    }
  }, [closeMiningSheet, miningSheetProduct, myCardsRequest, profileRequest, selectedMiningId, showConfirm, showToast]);

  const handleBuy = async (product: MembershipCardProduct) => {
    if (!isAuthenticated) {
      goTo('login');
      return;
    }

    if (product.cardType === 'node_amplify') {
      void openMiningSheet(product);
      return;
    }

    const priceLines = [`确认购买"${product.name}"吗？`, ''];
    priceLines.push(`专项金：¥${formatMoney(product.price)}`);
    if (product.pendingActivationPrice > 0) {
      priceLines.push(`待激活确权金：¥${formatMoney(product.pendingActivationPrice)}`);
    }

    const confirmed = await showConfirm({
      title: '购买卡包',
      message: priceLines.join('\n'),
      confirmText: '确认购买',
      cancelText: '取消',
    });
    if (!confirmed) return;

    showLoading({ message: '正在购买...' });

    try {
      await membershipCardApi.buy({ cardProductId: product.id });
      showToast({ message: `${product.name} 购买成功`, type: 'success' });
      await Promise.allSettled([profileRequest.reload(), myCardsRequest.reload()]);
    } catch (error) {
      showToast({ message: getErrorMessage(error), type: 'error', duration: 3000 });
    } finally {
      showLoading(false);
    }
  };

  const renderSummary = () => {
    if (!isAuthenticated) {
      return (
        <Card className="border-0 gradient-dark-br text-white">
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
        <Card className="space-y-3 border-0 gradient-warm-br text-white">
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
      <Card className="border-0 gradient-warm-br text-white">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="mb-1 text-sm text-white/80">我的卡包</div>
            <div className="text-3xl font-bold">{activeCardsCount}</div>
          </div>
          <div className="rounded-full border border-white/20 bg-white/15 px-3 py-1 text-sm text-white/85">
            生效中
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="min-w-0 rounded-2xl bg-white/14 p-3 overflow-hidden">
            <div className="mb-2 flex items-center text-xs text-white/75">
              <ShieldCheck size={14} className="mr-1.5 shrink-0" />
              <span className="truncate">专项金</span>
            </div>
            <div className="truncate text-lg font-semibold" title={`¥${formatMoney(balanceAvailable)}`}>
              ¥{formatMoney(balanceAvailable)}
            </div>
          </div>
          <div className="min-w-0 rounded-2xl bg-white/14 p-3 overflow-hidden">
            <div className="mb-2 flex items-center text-xs text-white/75">
              <Coins size={14} className="mr-1.5 shrink-0" />
              <span className="truncate">待激活确权金</span>
            </div>
            <div className="truncate text-lg font-semibold" title={`¥${formatMoney(pendingActivationGold)}`}>
              ¥{formatMoney(pendingActivationGold)}
            </div>
          </div>
          <div className="min-w-0 rounded-2xl bg-white/14 p-3 overflow-hidden">
            <div className="mb-2 flex items-center text-xs text-white/75">
              <CreditCard size={14} className="mr-1.5 shrink-0" />
              <span className="truncate">今日剩余</span>
            </div>
            <div className="truncate text-lg font-semibold" title={`${todayRemainingCount} 次`}>
              {todayRemainingCount} 次
            </div>
          </div>
        </div>
      </Card>
    );
  };

  const getStatusMeta = (status: number, isActive: boolean) => {
    if (isActive) {
      return {
        badge: 'bg-green-600 text-white',
        label: '生效中',
      };
    }
    if (status === 2) {
      return {
        badge: 'bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
        label: '已过期',
      };
    }
    return {
      badge: 'bg-gray-100 text-gray-600 dark:bg-gray-700/60 dark:text-gray-300',
      label: '已停用',
    };
  };

  const getOwnedCardStatusBadge = (status: number, isActive: boolean) => {
    if (isActive) return 'bg-green-600 text-white';
    if (status === 2) return 'bg-gray-500/90 text-white';
    return 'bg-gray-500/70 text-white';
  };

  const renderOwnedMembershipCard = (card: MembershipCardOwnedCard) => {
    const status = getStatusMeta(card.status, card.isActive);
    const gradient = getCardGradient(card.levelText, !card.isActive);
    const statusBadge = getOwnedCardStatusBadge(card.status, card.isActive);
    return (
      <div key={`m-${card.id}`} className={`rounded-[16px] p-5 mb-4 bg-gradient-to-br ${gradient} text-white shadow-md relative overflow-hidden`}>
        <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10 blur-xl" />
        <div className="relative z-10">
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
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusBadge}`}>
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
        <div className="space-y-3 p-4 pt-2 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/20 px-2.5 py-1 text-xs text-white">每日限用 {card.dailyLimit} 次</span>
            <span className="rounded-full bg-white/20 px-2.5 py-1 text-xs text-white">已用 {card.todayUsage} 次</span>
            <span className="rounded-full bg-white/20 px-2.5 py-1 text-xs text-white">剩余 {card.remainingDays} 天</span>
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-white/20 pt-2 text-xs text-white">
            <span className="min-w-0 flex-1 truncate" title={card.startTimeText}>生效：{card.startTimeText || '--'}</span>
            <span className="min-w-0 flex-1 truncate text-right" title={card.endTimeText}>失效：{card.endTimeText || '--'}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderOwnedAmplifyCard = (card: AmplifyCardOwnedCard) => {
    const status = getStatusMeta(card.status, card.isActive);
    const amplifyDisplay =
      card.amplifyType === 'percentage'
        ? formatPercent(card.amplifyValue / 100)
        : `¥${formatMoney(card.amplifyValue)}`;
    const scoreDisplay =
      card.amplifyType === 'percentage'
        ? formatPercent(card.scoreAmplifyValue / 100)
        : `¥${formatMoney(card.scoreAmplifyValue)}`;

    return (
      <Card key={`a-${card.id}`} className="overflow-hidden p-0">
        <div className="gradient-dark-br p-4 text-white">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Zap size={18} className="text-amber-300" />
                <span className="text-lg font-semibold">{card.productName}</span>
                {card.levelText ? (
                  <span className="rounded-full border border-white/20 bg-white/15 px-2 py-0.5 text-xs text-white/85">
                    {card.levelText}
                  </span>
                ) : null}
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
              <div className="mb-1 flex items-center text-xs text-white/70">
                <TrendingUp size={12} className="mr-1" />
                余额增幅
              </div>
              <div className="text-lg font-semibold">{amplifyDisplay}</div>
            </div>
            <div className="rounded-2xl bg-white/14 p-3">
              <div className="mb-1 text-xs text-white/70">消费金增幅</div>
              <div className="text-lg font-semibold">{scoreDisplay}</div>
            </div>
            <div className="rounded-2xl bg-white/14 p-3">
              <div className="mb-1 text-xs text-white/70">增幅类型</div>
              <div className="text-base font-semibold">{card.amplifyTypeText || (card.amplifyType === 'percentage' ? '比例' : '固定')}</div>
            </div>
          </div>
          {card.collectionTitle ? (
            <div className="mt-2 flex items-center gap-2 rounded-2xl bg-white/14 p-3">
              {card.collectionImage ? (
                <img src={card.collectionImage} alt="" className="size-10 rounded-lg object-cover" />
              ) : null}
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{card.collectionTitle}</div>
                <div className="text-xs text-white/70">绑定矿机 · ¥{formatMoney(card.collectionPrice)}</div>
              </div>
            </div>
          ) : null}
        </div>
        <div className="space-y-3 border-t border-border-main p-4 text-sm text-text-sub">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-bg-base px-2.5 py-1 text-xs">剩余 {card.remainingDays} 天</span>
          </div>
          <div className="flex justify-between gap-3 text-xs">
            <span className="min-w-0 flex-1 truncate">生效：{card.startTimeText || '--'}</span>
            <span className="min-w-0 flex-1 truncate text-right">失效：{card.endTimeText || '--'}</span>
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

    if (myCardsRequest.loading && !myCardsData) {
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

    if (myCardsRequest.error && !myCardsData) {
      return (
        <Card>
          <ErrorState
            message={getErrorMessage(myCardsRequest.error)}
            onRetry={() => void myCardsRequest.reload().catch(() => undefined)}
          />
        </Card>
      );
    }

    const hasMembership = ownedMembershipCards.length > 0;
    const hasAmplify = ownedAmplifyCards.length > 0;

    if (!hasMembership && !hasAmplify) {
      return (
        <Card>
          <EmptyState
            icon={<Ticket size={48} />}
            message="你还没有持有任何卡"
            actionText="去购买"
            actionVariant="primary"
            onAction={() => setActiveTab('membership')}
          />
        </Card>
      );
    }

    return (
      <div className="space-y-3">
        {hasMembership ? (
          <>
            <div className="text-sm font-medium text-text-sub">寄售权益卡</div>
            {ownedMembershipCards.map(renderOwnedMembershipCard)}
          </>
        ) : null}
        {hasAmplify ? (
          <>
            <div className="text-sm font-medium text-text-sub">节点赋能卡</div>
            {ownedAmplifyCards.map(renderOwnedAmplifyCard)}
          </>
        ) : null}
      </div>
    );
  };

  const renderMembershipProduct = (product: MembershipCardProduct) => (
    <div key={product.id} className={`rounded-[16px] p-5 mb-4 bg-gradient-to-br ${getCardGradient(product.levelText)} text-white shadow-md relative overflow-hidden`}>
      <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10 blur-xl" />
      <div className="absolute -left-6 -bottom-6 w-24 h-24 rounded-full bg-black/10 blur-xl" />
      <div className="relative z-10 p-0">
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
            <div className="text-xs text-white/70">专项金</div>
            <div className="text-2xl font-bold">¥{formatMoney(product.price)}</div>
            {product.pendingActivationPrice > 0 ? (
              <div className="mt-0.5 text-xs text-white/70">
                确权金 ¥{formatMoney(product.pendingActivationPrice)}
              </div>
            ) : null}
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

      <div className="relative z-10 mt-4">
        <button
          type="button"
          onClick={() => void handleBuy(product)}
          className="w-full py-2.5 bg-white text-gray-900 rounded-full text-[14px] font-bold active:bg-gray-100 transition-colors shadow-sm"
        >
          {isAuthenticated ? '立即购买' : '登录后购买'}
        </button>
      </div>
    </div>
  );

  const renderNodeAmplifyProduct = (product: MembershipCardProduct) => {
    const amplifyDisplay =
      product.amplifyType === 'percentage'
        ? formatPercent(product.amplifyValue / 100)
        : `¥${formatMoney(product.amplifyValue)}`;
    const scoreDisplay =
      product.amplifyType === 'percentage'
        ? formatPercent(product.scoreAmplifyValue / 100)
        : `¥${formatMoney(product.scoreAmplifyValue)}`;

    return (
      <div key={product.id} className={`rounded-[16px] p-5 mb-4 bg-gradient-to-br ${getCardGradient(product.levelText)} text-white shadow-md relative overflow-hidden`}>
        <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10 blur-xl" />
        <div className="absolute -left-6 -bottom-6 w-24 h-24 rounded-full bg-black/10 blur-xl" />
        <div className="relative z-10">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Zap size={18} className="text-amber-300" />
                <span className="text-lg font-semibold">{product.name}</span>
                {product.levelText ? (
                  <span className="rounded-full border border-white/20 bg-white/15 px-2 py-0.5 text-xs text-white/85">
                    {product.levelText}
                  </span>
                ) : null}
              </div>
              <div className="text-sm text-white/75">
                {product.cycleTypeText || '周期卡'} · 有效期 {product.validDays} 天
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-white/70">专项金</div>
              <div className="text-2xl font-bold">¥{formatMoney(product.price)}</div>
              {product.pendingActivationPrice > 0 ? (
                <div className="mt-0.5 text-xs text-white/70">
                  确权金 ¥{formatMoney(product.pendingActivationPrice)}
                </div>
              ) : null}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-white/14 p-3">
              <div className="mb-1 flex items-center text-xs text-white/70">
                <TrendingUp size={12} className="mr-1" />
                余额增幅
              </div>
              <div className="text-lg font-semibold">{amplifyDisplay}</div>
            </div>
            <div className="rounded-2xl bg-white/14 p-3">
              <div className="mb-1 text-xs text-white/70">消费金增幅</div>
              <div className="text-lg font-semibold">{scoreDisplay}</div>
            </div>
            <div className="rounded-2xl bg-white/14 p-3">
              <div className="mb-1 text-xs text-white/70">增幅类型</div>
              <div className="text-base font-semibold">{product.amplifyTypeText || (product.amplifyType === 'percentage' ? '比例' : '固定')}</div>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-4">
          <button
            type="button"
            onClick={() => void handleBuy(product)}
            className="w-full py-2.5 bg-white text-gray-900 rounded-full text-[14px] font-bold active:bg-gray-100 transition-colors shadow-sm"
          >
            {isAuthenticated ? '选择矿机购买' : '登录后购买'}
          </button>
        </div>
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

    if (!isTabEnabled) {
      return (
        <Card>
          <EmptyState
            icon={activeTab === 'membership' ? <Ticket size={48} /> : <Zap size={48} />}
            message={activeTab === 'membership' ? '寄售权益卡功能暂未开启' : '节点赋能卡功能暂未开启'}
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
            icon={activeTab === 'membership' ? <Ticket size={48} /> : <Zap size={48} />}
            message={activeTab === 'membership' ? '当前没有可购买的寄售权益卡' : '当前没有可购买的节点赋能卡'}
            actionText="刷新"
            onAction={() => void productsRequest.reload().catch(() => undefined)}
          />
        </Card>
      );
    }

    return (
      <div className="space-y-3">
        {productList.map((product) =>
          product.cardType === 'node_amplify'
            ? renderNodeAmplifyProduct(product)
            : renderMembershipProduct(product),
        )}
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
                { id: 'membership' as const, label: '寄售权益卡' },
                { id: 'node_amplify' as const, label: '节点赋能卡' },
                { id: 'owned' as const, label: '持有中' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 rounded-[14px] px-4 py-2.5 text-sm font-medium ${activeTab === tab.id
                      ? 'gradient-primary-r text-white shadow-sm'
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

      <MiningSelectionSheet
        isOpen={miningSheetOpen}
        product={miningSheetProduct}
        loading={miningLoading}
        loadingMore={miningLoadingMore}
        hasMore={miningHasMore}
        list={miningList}
        selectedId={selectedMiningId}
        buying={amplifyBuying}
        onSelect={setSelectedMiningId}
        onBuy={handleAmplifyBuy}
        onClose={closeMiningSheet}
        onLoadMore={loadMoreMining}
        formatMoney={formatMoney}
      />
    </div>
  );
}


export default MyCardPacksPage;
