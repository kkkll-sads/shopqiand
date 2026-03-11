/**
 * @file Recharge/index.tsx - 充值页面
 * @description 用户充值页面，支持多种充值方式和金额选择。
 */

import type { ChangeEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  FileText,
  ImagePlus,
  Info,
  Landmark,
  Loader2,
  ShieldCheck,
  Smartphone,
  Wallet,
  X,
  XCircle,
} from 'lucide-react';
import {
  accountApi,
  rechargeApi,
  uploadApi,
  type CompanyAccount,
  type RechargePaymentMethod,
  type RechargeOrderRecord,
  type UploadedFile,
} from '../../api';
import { getErrorMessage } from '../../api/core/errors';
import { OfflineBanner } from '../../components/layout/OfflineBanner';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { Skeleton } from '../../components/ui/Skeleton';
import { useAuthSession } from '../../hooks/useAuthSession';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useRequest } from '../../hooks/useRequest';
import { useRouteScrollRestoration } from '../../hooks/useRouteScrollRestoration';
import { copyToClipboard } from '../../lib/clipboard';
import { useAppNavigate } from '../../lib/navigation';
import { PageHeader } from '../../components/layout/PageHeader';
import { PullToRefreshContainer } from '../../components/ui/PullToRefreshContainer';

const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000];

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

function maskAccountNumber(value: string | undefined) {
  const nextValue = value?.trim();
  if (!nextValue) {
    return '--';
  }

  if (nextValue.length <= 8) {
    return nextValue;
  }

  return `${nextValue.slice(0, 4)} **** ${nextValue.slice(-4)}`;
}

function getCompanyAccountIcon(type: string): LucideIcon {
  switch (type) {
    case 'bank_card':
    case 'unionpay':
      return Landmark;
    case 'alipay':
    case 'wechat':
      return Smartphone;
    default:
      return Wallet;
  }
}

function getCompanyAccountColor(type: string) {
  switch (type) {
    case 'bank_card':
    case 'unionpay':
      return 'text-blue-600';
    case 'alipay':
      return 'text-blue-500';
    case 'wechat':
      return 'text-green-600';
    case 'usdt':
      return 'text-emerald-600';
    default:
      return 'text-text-main';
  }
}

function buildCompanyAccountSubtitle(account: CompanyAccount) {
  if (account.type === 'bank_card' || account.type === 'unionpay') {
    const bankName = account.bankName || account.typeText || '银行卡';
    return `${bankName} ${maskAccountNumber(account.accountNumber)}`;
  }

  return maskAccountNumber(account.accountNumber);
}

function getOrderStatusClassName(status: number) {
  if (status === 1) {
    return 'bg-green-50 text-green-600 dark:bg-green-500/15 dark:text-green-300';
  }

  if (status === 2) {
    return 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300';
  }

  return 'bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300';
}

function getOrderTitle(record: RechargeOrderRecord) {
  if (record.recordType === 'transfer') {
    return '余额划转';
  }

  return record.paymentTypeText || '充值申请';
}

type MatchStep = 'select' | 'matching' | 'matched';

export function RechargePage() {
  const { goBack, goTo } = useAppNavigate();
  const { isAuthenticated } = useAuthSession();
  const { isOffline, refreshStatus } = useNetworkStatus();
  const { showToast } = useFeedback();
  const screenshotInputRef = useRef<HTMLInputElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const [showBalance, setShowBalance] = useState(true);
  const [amount, setAmount] = useState('');
  const [selectedPaymentType, setSelectedPaymentType] = useState<string>('');
  const [matchStep, setMatchStep] = useState<MatchStep>('select');
  const [matchedAccount, setMatchedAccount] = useState<CompanyAccount | null>(null);
  const [matchedAccountId, setMatchedAccountId] = useState<number>(0);
  const [matchedPaymentMethod, setMatchedPaymentMethod] = useState<RechargePaymentMethod>('offline');
  const [remark, setRemark] = useState('');
  const [paymentScreenshot, setPaymentScreenshot] = useState<UploadedFile | null>(null);
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    data: profile,
    error: profileError,
    loading: profileLoading,
    reload: reloadProfile,
  } = useRequest((signal) => accountApi.getProfile({ signal }), {
    cacheKey: 'recharge:profile',
    deps: [isAuthenticated],
    manual: !isAuthenticated,
  });
  const {
    data: companyAccounts,
    error: companyAccountsError,
    loading: companyAccountsLoading,
    reload: reloadCompanyAccounts,
  } = useRequest((signal) => rechargeApi.getCompanyAccountList({ usage: 'recharge' }, { signal }), {
    cacheKey: 'recharge:company-accounts',
    deps: [isAuthenticated],
    manual: !isAuthenticated,
  });
  const {
    data: recentOrders,
    error: recentOrdersError,
    loading: recentOrdersLoading,
    reload: reloadRecentOrders,
  } = useRequest((signal) => rechargeApi.getMyOrderList({ limit: 3, page: 1 }, { signal }), {
    cacheKey: 'recharge:recent-orders',
    deps: [isAuthenticated],
    manual: !isAuthenticated,
  });

  const paymentAccounts = useMemo(
    () =>
      (Array.isArray(companyAccounts) ? companyAccounts : []).map((account) => ({
        ...account,
        color: getCompanyAccountColor(account.type),
        iconComponent: getCompanyAccountIcon(account.type),
        subtitle: buildCompanyAccountSubtitle(account),
        title: account.accountName || account.typeText || '收款账户',
      })),
    [companyAccounts],
  );
  const paymentTypeOptions = useMemo(() => {
    const options = new Map<string, typeof paymentAccounts[number]>();

    paymentAccounts.forEach((account) => {
      if (!account.type || options.has(account.type)) {
        return;
      }

      options.set(account.type, account);
    });

    return Array.from(options.values());
  }, [paymentAccounts]);
  const recentOrderList = Array.isArray(recentOrders?.list) ? recentOrders.list : [];

  useEffect(() => {
    if (!paymentTypeOptions.length) {
      setSelectedPaymentType('');
      return;
    }

    setSelectedPaymentType((current) => {
      if (current && paymentTypeOptions.some((item) => item.type === current)) {
        return current;
      }

      return paymentTypeOptions[0].type;
    });
  }, [paymentTypeOptions]);

  const selectedPaymentOption =
    paymentTypeOptions.find((item) => item.type === selectedPaymentType) ?? paymentTypeOptions[0] ?? null;
  const totalBalance = profile?.userInfo?.money;
  const availableBalance = profile?.userInfo?.balanceAvailable;
  const frozenBalance = profile?.userInfo?.frozenAmount;
  const numAmount = parseFloat(amount) || 0;
  const mainLoading = isAuthenticated && (profileLoading || companyAccountsLoading);
  const hasBlockingError =
    isAuthenticated &&
    !profile &&
    !companyAccounts &&
    (Boolean(profileError) || Boolean(companyAccountsError));
  const canSubmit =
    isAuthenticated &&
    !isOffline &&
    !submitting &&
    !uploadingScreenshot &&
    Boolean(matchedAccount) &&
    matchedAccountId > 0 &&
    numAmount > 0 &&
    (matchedPaymentMethod === 'online' || Boolean(paymentScreenshot));

  useRouteScrollRestoration({
    containerRef: scrollContainerRef,
    enabled: isAuthenticated && !hasBlockingError,
    namespace: 'recharge-page',
    restoreDeps: [isAuthenticated, hasBlockingError, mainLoading, recentOrderList.length],
    restoreWhen: isAuthenticated && !hasBlockingError && !mainLoading,
  });

  const handleReload = () => {
    refreshStatus();
    void Promise.allSettled([reloadProfile(), reloadCompanyAccounts(), reloadRecentOrders()]);
  };

  const resetMatchState = () => {
    setMatchStep('select');
    setMatchedAccount(null);
    setMatchedAccountId(0);
    setMatchedPaymentMethod('offline');
    setPaymentScreenshot(null);
    setRemark('');
  };

  const handleAmountChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    if (nextValue === '' || /^\d*\.?\d{0,2}$/.test(nextValue)) {
      if (matchStep !== 'select') {
        resetMatchState();
      }
      setAmount(nextValue);
    }
  };

  const handleCopy = async (text: string | undefined, successMessage = '已复制') => {
    const nextValue = text?.trim();
    if (!nextValue) {
      return;
    }

    const ok = await copyToClipboard(nextValue);
    showToast({ message: ok ? successMessage : '复制失败，请稍后重试', type: ok ? 'success' : 'error' });
  };

  const handlePickScreenshot = () => {
    if (uploadingScreenshot || submitting) {
      return;
    }

    screenshotInputRef.current?.click();
  };

  const handleStartMatching = async () => {
    if (!selectedPaymentOption) {
      showToast({ message: '请选择支付方式', type: 'warning' });
      return;
    }

    if (numAmount <= 0) {
      showToast({ message: '请输入充值金额', type: 'warning' });
      return;
    }

    setMatchStep('matching');
    setMatchedAccount(null);
    setMatchedAccountId(0);
    setPaymentScreenshot(null);
    setRemark('');

    try {
      const result = await rechargeApi.matchAccount({
        amount: numAmount,
        paymentType: selectedPaymentOption.type,
      });

      const resolvedPaymentMethod = result.paymentMethod ?? 'online';

      if (resolvedPaymentMethod !== 'offline') {
        try {
          const submitResult = await submitMatchedOrder({
            account: result.account,
            matchedId: result.matchedAccountId,
            paymentMethod: 'online',
            successMessage: '支付订单已创建，正在打开支付页面',
          });

          if (submitResult?.payUrl) {
            return;
          }
        } catch {
          // Fall back to manual flow below when auto-submit fails.
        }
      }

      setMatchedAccount(result.account);
      setMatchedAccountId(result.matchedAccountId);
      setMatchedPaymentMethod(resolvedPaymentMethod);
      setMatchStep('matched');
    } catch (error) {
      setMatchStep('select');
      showToast({
        message: getErrorMessage(error),
        type: 'error',
        duration: 3000,
      });
    }
  };

  const handleScreenshotChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    setUploadingScreenshot(true);

    try {
      const uploadedFile = await uploadApi.upload({
        file,
        topic: 'recharge',
      });

      setPaymentScreenshot(uploadedFile);
      showToast({ message: '付款截图上传成功', type: 'success' });
    } catch (error) {
      showToast({
        message: getErrorMessage(error),
        type: 'error',
        duration: 3000,
      });
    } finally {
      setUploadingScreenshot(false);
    }
  };

  const submitMatchedOrder = async ({
    account,
    matchedId,
    paymentMethod,
    screenshotId,
    screenshotUrl,
    successMessage,
  }: {
    account: CompanyAccount;
    matchedId: number;
    paymentMethod: RechargePaymentMethod;
    screenshotId?: number;
    screenshotUrl?: string;
    successMessage?: string;
  }) => {
    setSubmitting(true);

    try {
      const result = await rechargeApi.submitOrder({
        amount: numAmount,
        matchedAccountId: matchedId,
        paymentMethod,
        paymentScreenshotId: paymentMethod === 'offline' ? screenshotId : undefined,
        paymentScreenshotUrl: paymentMethod === 'offline' ? screenshotUrl : undefined,
        paymentType: account.type,
        userRemark: remark.trim() || undefined,
      });

      showToast({
        message:
          successMessage ||
          (result.orderNo ? `充值申请已提交，订单号 ${result.orderNo}` : '充值申请已提交，请等待审核'),
        type: 'success',
        duration: 3200,
      });

      setAmount('');
      resetMatchState();
      void Promise.allSettled([reloadProfile(), reloadRecentOrders()]);

      if (result.payUrl) {
        window.open(result.payUrl, '_blank', 'noopener,noreferrer');
      }

      return result;
    } catch (error) {
      showToast({
        message: getErrorMessage(error),
        type: 'error',
        duration: 3000,
      });
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!matchedAccount || !canSubmit) {
      return;
    }

    await submitMatchedOrder({
      account: matchedAccount,
      matchedId: matchedAccountId,
      paymentMethod: matchedPaymentMethod,
      screenshotId: paymentScreenshot?.id,
      screenshotUrl: paymentScreenshot?.url,
    });
  };

  const renderHeader = () => (
    <PageHeader
      title="专项金充值"
      onBack={goBack}
      rightAction={
        <button
          type="button"
          className="flex items-center text-sm text-text-sub active:opacity-70"
          onClick={() => goTo('billing')}
        >
          <FileText size={16} className="mr-1" />
          记录
        </button>
      }
    />
  );

  if (!isAuthenticated) {
    return (
      <div className="flex h-full flex-1 flex-col bg-bg-base">
        {renderHeader()}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto no-scrollbar px-4">
          <EmptyState
            message="登录后才能发起充值申请"
            actionText="去登录"
            actionVariant="primary"
            onAction={() => goTo('login')}
          />
        </div>
      </div>
    );
  }

  if (hasBlockingError) {
    return (
      <div className="flex h-full flex-1 flex-col bg-bg-base">
        {renderHeader()}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto no-scrollbar">
          <ErrorState
            message={getErrorMessage(profileError || companyAccountsError)}
            onRetry={handleReload}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-1 flex-col bg-bg-base">
      {isOffline && <OfflineBanner onAction={handleReload} className="absolute top-12 right-0 left-0 z-50" />}

      {renderHeader()}

      <PullToRefreshContainer
        className="flex-1"
        onRefresh={async () => {
          handleReload();
        }}
        disabled={isOffline}
      >
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto no-scrollbar pb-[112px]">
          <div className="space-y-3 px-4 py-4">
          <Card className="relative overflow-hidden p-4">
            <div className="pointer-events-none absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-gradient-to-bl from-primary-start/5 to-transparent" />
            {mainLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-44" />
                <div className="flex items-center space-x-5">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            ) : (
              <>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-base text-text-sub">账户资金</span>
                  <button
                    type="button"
                    onClick={() => setShowBalance((current) => !current)}
                    className="flex items-center text-sm text-text-aux active:opacity-70"
                  >
                    {showBalance ? <Eye size={14} className="mr-1" /> : <EyeOff size={14} className="mr-1" />}
                    {showBalance ? '隐藏' : '显示'}
                  </button>
                </div>
                <div className="mb-3 text-7xl font-bold tracking-tight text-text-main">
                  {showBalance ? formatMoney(totalBalance) : '****'}
                </div>
                <div className="flex items-center space-x-6 text-sm">
                  <div>
                    <span className="mr-1 text-text-sub">可用</span>
                    <span className="font-medium text-text-main">
                      {showBalance ? formatMoney(availableBalance) : '****'}
                    </span>
                  </div>
                  <div>
                    <span className="mr-1 text-text-sub">冻结</span>
                    <span className="font-medium text-text-main">
                      {showBalance ? formatMoney(frozenBalance) : '****'}
                    </span>
                  </div>
                </div>
              </>
            )}
          </Card>

          <Card className="p-4">
            <div className="mb-4 text-lg font-medium text-text-main">充值金额</div>
            <div className="mb-4 flex items-center border-b border-border-light pb-2">
              <span className="mr-2 shrink-0 text-5xl font-medium text-text-main">¥</span>
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={handleAmountChange}
                placeholder="请输入充值金额"
                className="min-w-0 flex-1 bg-transparent text-6xl font-bold text-text-main outline-none placeholder:text-2xl placeholder:font-normal placeholder:text-text-aux"
              />
              {amount ? (
                <button
                  type="button"
                  onClick={() => setAmount('')}
                  className="shrink-0 p-1 text-text-aux active:text-text-sub"
                >
                  <XCircle size={18} />
                </button>
              ) : null}
            </div>

            <div className="mb-4 flex overflow-x-auto no-scrollbar gap-2">
              {QUICK_AMOUNTS.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setAmount(String(value))}
                  className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                    amount === String(value)
                      ? 'border-primary-start bg-red-50 text-primary-start dark:bg-red-500/12 dark:text-red-300'
                      : 'border-transparent bg-bg-base text-text-main'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>

            <div className="flex items-start text-sm text-text-sub">
              <Info size={14} className="mt-0.5 mr-1.5 shrink-0 text-text-aux" />
              <span>
                选择支付方式后，系统会自动匹配线上或线下充值通道；若为线下转账，匹配成功后再上传付款截图。
              </span>
            </div>
          </Card>

          <Card className="overflow-hidden p-0">
            <div className="border-b border-border-light px-4 py-3">
              <div className="text-lg font-medium text-text-main">支付方式</div>
            </div>
            {mainLoading ? (
              <div className="space-y-3 p-4">
                {[1, 2].map((item) => (
                  <div key={item} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Skeleton className="mr-3 h-9 w-9 rounded-full" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-36" />
                      </div>
                    </div>
                    <Skeleton className="h-5 w-5 rounded-full" />
                  </div>
                ))}
              </div>
            ) : paymentTypeOptions.length ? (
              <div className="divide-y divide-border-light">
                {paymentTypeOptions.map((account) => {
                  const isSelected = account.type === selectedPaymentType;
                  const Icon = account.iconComponent;

                  return (
                    <button
                      key={account.type}
                      type="button"
                      onClick={() => {
                        if (selectedPaymentType !== account.type && matchStep !== 'select') {
                          resetMatchState();
                        }
                        setSelectedPaymentType(account.type);
                      }}
                      className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors active:bg-bg-base"
                    >
                      <div className="flex min-w-0 items-center">
                        <div
                          className={`mr-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-bg-base ${account.color}`}
                        >
                          {account.icon ? (
                            <img
                              src={account.icon}
                              alt={account.title}
                              className="h-5 w-5 rounded-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <Icon size={18} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-md font-medium text-text-main">
                            {account.typeText || account.title}
                          </div>
                          <div className="truncate text-sm text-text-sub">
                            系统将自动分配具体收款账户
                          </div>
                        </div>
                      </div>
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                          isSelected
                            ? 'border-primary-start bg-primary-start text-white'
                            : 'border-border-main text-transparent'
                        }`}
                      >
                        <CheckCircle2 size={12} />
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-4">
                <EmptyState
                  message="暂无可用支付方式"
                  actionText="重新加载"
                  onAction={handleReload}
                />
              </div>
            )}
          </Card>

          {matchStep === 'matching' ? (
            <Card className="overflow-hidden p-0">
              <div className="flex flex-col items-center px-6 py-10 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-primary-start dark:bg-red-500/10">
                  <Loader2 size={28} className="animate-spin" />
                </div>
                <div className="text-xl font-semibold text-text-main">匹配中</div>
                <div className="mt-2 text-sm leading-6 text-text-sub">
                  正在为你匹配可用的
                  {selectedPaymentOption?.typeText || '支付'}
                  充值通道，请稍候。
                </div>
              </div>
            </Card>
          ) : null}

          {matchStep === 'matched' && matchedAccount ? (
            <>
              <Card className="overflow-hidden p-0">
                <div className="border-b border-border-light px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-medium text-text-main">
                      {matchedPaymentMethod === 'online' ? '已匹配支付通道' : '已匹配收款账户'}
                    </div>
                    <button
                      type="button"
                      className="text-sm text-text-sub active:opacity-70"
                      onClick={resetMatchState}
                    >
                      重新匹配
                    </button>
                  </div>
                </div>
                <div className="space-y-4 p-4">
                  <div className="rounded-2xl bg-bg-base p-4">
                    <div className="mb-1 text-sm text-text-sub">支付方式</div>
                    <div className="text-lg font-semibold text-text-main">
                      {matchedAccount.typeText || selectedPaymentOption?.typeText || '收款账户'}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-bg-base p-4">
                    <div className="mb-1 text-sm text-text-sub">充值通道</div>
                    <div className="text-lg font-semibold text-text-main">
                      {matchedPaymentMethod === 'online' ? '线上支付' : '线下转账'}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-bg-base p-4">
                    <div className="mb-1 text-sm text-text-sub">收款人</div>
                    <div className="text-lg font-semibold text-text-main">
                      {matchedAccount.accountName || '--'}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-bg-base p-4">
                    <div className="mb-1 text-sm text-text-sub">收款账号</div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="break-all text-lg font-semibold text-text-main">
                        {matchedAccount.accountNumber || '--'}
                      </div>
                      {matchedAccount.accountNumber ? (
                        <button
                          type="button"
                          className="shrink-0 rounded-full bg-white px-3 py-1.5 text-sm text-text-sub active:opacity-70"
                          onClick={() => void handleCopy(matchedAccount.accountNumber, '账号已复制')}
                        >
                          <Copy size={14} className="mr-1 inline-block" />
                          复制
                        </button>
                      ) : null}
                    </div>
                  </div>
                  {matchedAccount.bankName || matchedAccount.bankBranch ? (
                    <div className="rounded-2xl bg-bg-base p-4">
                      <div className="mb-1 text-sm text-text-sub">开户信息</div>
                      <div className="space-y-1 text-sm text-text-main">
                        {matchedAccount.bankName ? <div>{matchedAccount.bankName}</div> : null}
                        {matchedAccount.bankBranch ? <div>{matchedAccount.bankBranch}</div> : null}
                      </div>
                    </div>
                  ) : null}
                  {matchedAccount.remark ? (
                    <div className="rounded-2xl bg-red-50/60 p-4 text-sm leading-6 text-text-sub dark:bg-red-500/10">
                      {matchedAccount.remark}
                    </div>
                  ) : null}
                  {matchedPaymentMethod === 'online' ? (
                    <div className="rounded-2xl bg-red-50/60 p-4 text-sm leading-6 text-text-sub dark:bg-red-500/10">
                      在线支付提交后将直接跳转到后端返回的三方支付链接，无需上传付款截图。
                    </div>
                  ) : null}
                </div>
              </Card>

              {matchedPaymentMethod === 'offline' ? (
                <Card className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-lg font-medium text-text-main">付款截图</div>
                  {paymentScreenshot ? (
                    <button
                      type="button"
                      onClick={() => setPaymentScreenshot(null)}
                      className="text-sm text-text-sub active:opacity-70"
                    >
                      重新上传
                    </button>
                  ) : null}
                </div>

                <input
                  ref={screenshotInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp,image/bmp"
                  className="hidden"
                  onChange={handleScreenshotChange}
                />

                {uploadingScreenshot ? (
                  <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-primary-start/30 bg-red-50/50 dark:bg-red-500/10">
                    <div className="flex items-center text-sm text-primary-start">
                      <Loader2 size={16} className="mr-2 animate-spin" />
                      正在上传付款截图
                    </div>
                  </div>
                ) : paymentScreenshot ? (
                  <div className="relative overflow-hidden rounded-2xl border border-border-light">
                    <img
                      src={paymentScreenshot.url}
                      alt={paymentScreenshot.name}
                      className="h-48 w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      type="button"
                      onClick={() => setPaymentScreenshot(null)}
                      className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white active:scale-95"
                    >
                      <X size={16} />
                    </button>
                    <div className="flex items-center justify-between px-3 py-2 text-sm">
                      <span className="truncate text-text-main">{paymentScreenshot.name}</span>
                      <button
                        type="button"
                        className="ml-2 shrink-0 text-text-sub active:opacity-70"
                        onClick={handlePickScreenshot}
                      >
                        更换
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handlePickScreenshot}
                    className="flex h-40 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-border-main bg-bg-base text-text-sub transition-colors active:bg-red-50/50 dark:active:bg-red-500/10"
                  >
                    <ImagePlus size={28} className="mb-2 text-text-aux" />
                    <span className="text-base font-medium">上传付款截图</span>
                    <span className="mt-1 text-sm text-text-aux">支持 JPG、PNG、GIF、WEBP、BMP</span>
                  </button>
                )}

                <textarea
                  value={remark}
                  onChange={(event) => setRemark(event.target.value.slice(0, 500))}
                  rows={3}
                  placeholder="备注转账时间、付款账户等信息（选填）"
                  className="mt-4 w-full resize-none rounded-2xl border border-border-light bg-bg-base px-4 py-3 text-sm text-text-main outline-none placeholder:text-text-aux focus:border-primary-start"
                />
                </Card>
              ) : (
                <Card className="p-4">
                  <div className="text-lg font-medium text-text-main">支付说明</div>
                  <textarea
                    value={remark}
                    onChange={(event) => setRemark(event.target.value.slice(0, 500))}
                    rows={3}
                    placeholder="备注订单信息（选填）"
                    className="mt-4 w-full resize-none rounded-2xl border border-border-light bg-bg-base px-4 py-3 text-sm text-text-main outline-none placeholder:text-text-aux focus:border-primary-start"
                  />
                </Card>
              )}
            </>
          ) : null}

          <Card className="overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-border-light px-4 py-3">
              <div className="text-lg font-medium text-text-main">最近记录</div>
              <button
                type="button"
                className="flex items-center text-sm text-text-sub active:opacity-70"
                onClick={() => goTo('billing')}
              >
                查看更多
                <FileText size={14} className="ml-1" />
              </button>
            </div>
            {recentOrdersLoading && !recentOrders ? (
              <div className="space-y-3 p-4">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="flex items-center justify-between">
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <div className="space-y-1.5 text-right">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-3 w-14" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentOrdersError && !recentOrderList.length ? (
              <div className="flex items-center justify-between px-4 py-4">
                <span className="mr-4 text-sm text-text-sub">{getErrorMessage(recentOrdersError)}</span>
                <button
                  type="button"
                  className="shrink-0 rounded-full border border-border-main px-3 py-1 text-sm text-text-main active:bg-bg-base"
                  onClick={() => void reloadRecentOrders().catch(() => undefined)}
                >
                  重试
                </button>
              </div>
            ) : recentOrderList.length ? (
              <div className="divide-y divide-border-light">
                {recentOrderList.map((record) => (
                  <div key={record.id} className="flex items-center justify-between px-4 py-3">
                    <div className="min-w-0">
                      <div className="mb-1 truncate text-md font-medium text-text-main">
                        {getOrderTitle(record)}
                      </div>
                      <div className="truncate text-sm text-text-sub">
                        {record.createTimeText || `记录 #${record.id}`}
                      </div>
                      {record.orderNo ? (
                        <div className="mt-1 truncate text-xs text-text-aux">订单号：{record.orderNo}</div>
                      ) : null}
                    </div>
                    <div className="ml-3 text-right">
                      <div className="mb-1 text-md font-semibold text-text-main">
                        ¥ {formatMoney(record.amount)}
                      </div>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs ${getOrderStatusClassName(record.status)}`}
                      >
                        {record.statusText || '处理中'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-10 text-center text-sm text-text-sub">暂无充值记录</div>
            )}
          </Card>

          <div className="flex items-start px-2 py-1 text-sm text-text-sub">
            <ShieldCheck size={14} className="mt-0.5 mr-1.5 shrink-0 text-green-600 dark:text-green-400" />
            <span>为保障资金安全，请确认转账信息与收款账户一致，平台不会以任何理由要求您私下转账到个人账户。</span>
          </div>
        </div>
        </div>
      </PullToRefreshContainer>

      <div className="absolute right-0 bottom-0 left-0 border-t border-border-light bg-bg-card px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between">
          <div>
            <div className="mb-0.5 text-sm text-text-sub">充值金额</div>
            <div className="text-4xl font-bold text-primary-start">
              <span className="mr-1 text-base">¥</span>
              {numAmount > 0 ? formatMoney(numAmount) : '0.00'}
            </div>
          </div>
          <button
            type="button"
            disabled={
              matchStep === 'matched'
                ? !canSubmit
                : !isAuthenticated || isOffline || submitting || mainLoading || matchStep === 'matching' || numAmount <= 0 || !selectedPaymentOption
            }
            onClick={matchStep === 'matched' ? handleSubmit : handleStartMatching}
            className={`flex h-12 min-w-[148px] items-center justify-center rounded-full px-6 text-lg font-medium transition ${
              (matchStep === 'matched'
                ? canSubmit
                : isAuthenticated && !isOffline && !submitting && !mainLoading && matchStep !== 'matching' && numAmount > 0 && Boolean(selectedPaymentOption))
                ? 'bg-gradient-to-r from-primary-start to-primary-end text-white shadow-md shadow-red-500/20 active:scale-[0.98]'
                : 'bg-gray-200 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
            }`}
          >
            {matchStep === 'matched' && submitting ? (
              <>
                <Loader2 size={18} className="mr-2 animate-spin" />
                提交中
              </>
            ) : (
              matchStep === 'matched'
                ? matchedPaymentMethod === 'online'
                  ? '前往支付'
                  : '确认已转账并提交'
                : matchStep === 'matching'
                  ? '匹配中'
                  : '开始匹配'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}




