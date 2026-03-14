import type { ChangeEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  FileText,
  Info,
  Landmark,
  ShieldCheck,
  Wallet,
  WifiOff,
  XCircle,
} from 'lucide-react';
import { accountApi, rechargeApi, userApi, type PaymentAccount } from '../../api';
import { getErrorMessage } from '../../api/core/errors';
import { WalletPageHeader } from '../../components/layout/WalletPageHeader';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { Input } from '../../components/ui/Input';
import { PullToRefreshContainer } from '../../components/ui/PullToRefreshContainer';
import { Skeleton } from '../../components/ui/Skeleton';
import { useAuthSession } from '../../hooks/useAuthSession';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useRequest } from '../../hooks/useRequest';
import { useRouteScrollRestoration } from '../../hooks/useRouteScrollRestoration';
import { getBillingPath } from '../../lib/billing';
import { useAppNavigate } from '../../lib/navigation';

const MIN_WITHDRAW_AMOUNT = 100;
const ESTIMATED_FEE_RATE = 0.01;
const ESTIMATED_MIN_FEE = 1;

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

function getPaymentIcon(type: string): LucideIcon {
  switch (type) {
    case 'bank_card':
    case 'unionpay':
      return Landmark;
    default:
      return Wallet;
  }
}

function getPaymentColor(type: string) {
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

function buildPaymentSubtitle(account: PaymentAccount) {
  if (account.type === 'bank_card' || account.type === 'unionpay') {
    return `${account.bankName || account.typeText || '银行卡'} ${maskAccountNumber(account.accountNumber)}`;
  }

  return maskAccountNumber(account.accountNumber);
}

export const WithdrawPage = () => {
  const { goTo, goBack } = useAppNavigate();
  const { showToast } = useFeedback();
  const { isAuthenticated } = useAuthSession();
  const { isOffline, refreshStatus } = useNetworkStatus();
  const [amount, setAmount] = useState('');
  const [payPassword, setPayPassword] = useState('');
  const [remark, setRemark] = useState('');
  const [selectedMethodId, setSelectedMethodId] = useState<number | null>(null);
  const [showMethodModal, setShowMethodModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const {
    data: accountOverview,
    error: accountOverviewError,
    loading: accountOverviewLoading,
    reload: reloadAccountOverview,
  } = useRequest((signal) => accountApi.getAccountOverview({ signal }), {
    cacheKey: 'withdraw:account-overview',
    deps: [isAuthenticated],
    manual: !isAuthenticated,
  });

  const {
    data: paymentAccounts,
    error: paymentAccountsError,
    loading: paymentAccountsLoading,
    reload: reloadPaymentAccounts,
  } = useRequest((signal) => userApi.getPaymentAccountList({ signal }), {
    cacheKey: 'withdraw:payment-accounts',
    deps: [isAuthenticated],
    manual: !isAuthenticated,
  });

  const paymentAccountList = Array.isArray(paymentAccounts) ? paymentAccounts : [];
  const paymentMethods = useMemo(
    () =>
      paymentAccountList.map((account) => ({
        ...account,
        colorClassName: getPaymentColor(account.type),
        iconComponent: getPaymentIcon(account.type),
        iconUrl: account.icon,
        subtitle: buildPaymentSubtitle(account),
        title: account.accountName || account.typeText || '收款账户',
      })),
    [paymentAccountList],
  );

  useEffect(() => {
    if (!paymentMethods.length) {
      setSelectedMethodId(null);
      return;
    }

    setSelectedMethodId((current) => {
      if (current && paymentMethods.some((item) => item.id === current)) {
        return current;
      }

      const defaultMethod = paymentMethods.find((item) => item.isDefault);
      return defaultMethod?.id ?? paymentMethods[0].id;
    });
  }, [paymentMethods]);

  const selectedMethod =
    paymentMethods.find((item) => item.id === selectedMethodId) ?? paymentMethods[0] ?? null;
  const withdrawableBalance = Number(accountOverview?.balance.withdrawableMoney ?? 0);
  const numAmount = parseFloat(amount) || 0;
  const feePreview =
    numAmount > 0 ? Math.max(numAmount * ESTIMATED_FEE_RATE, ESTIMATED_MIN_FEE) : 0;
  const actualArrival = Math.max(0, numAmount - feePreview);
  const hasBlockingError =
    isAuthenticated &&
    !accountOverview &&
    paymentAccountList.length === 0 &&
    (Boolean(accountOverviewError) || Boolean(paymentAccountsError));
  const isLoading = isAuthenticated && (accountOverviewLoading || paymentAccountsLoading);
  const isPayPasswordValid = /^\d{6}$/.test(payPassword.trim());
  const amountValidationMessage =
    numAmount > withdrawableBalance
      ? '输入金额超过可提现余额'
      : numAmount > 0 && numAmount < MIN_WITHDRAW_AMOUNT
        ? `提现金额不得低于 ${MIN_WITHDRAW_AMOUNT} 元`
        : '';
  const payPasswordValidationMessage =
    payPassword.trim().length > 0 && !isPayPasswordValid ? '请输入 6 位数字支付密码' : '';
  const isAmountValid =
    numAmount > 0 &&
    numAmount <= withdrawableBalance &&
    numAmount >= MIN_WITHDRAW_AMOUNT;
  const canSubmit =
    isAuthenticated &&
    !isOffline &&
    !submitting &&
    Boolean(selectedMethod) &&
    isAmountValid &&
    isPayPasswordValid;

  useRouteScrollRestoration({
    containerRef: scrollContainerRef,
    enabled: isAuthenticated && !hasBlockingError,
    namespace: 'withdraw-page',
    restoreDeps: [isAuthenticated, hasBlockingError, isLoading, selectedMethodId],
    restoreWhen: isAuthenticated && !hasBlockingError && !isLoading,
  });

  const handleAmountChange = (value: string) => {
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      const nextAmount = value === '' ? 0 : Number.parseFloat(value);
      if (Number.isFinite(nextAmount) && nextAmount > withdrawableBalance) {
        setAmount(withdrawableBalance.toFixed(2));
        return;
      }

      setAmount(value);
    }
  };

  const handleReload = () => {
    refreshStatus();
    return Promise.allSettled([reloadAccountOverview(), reloadPaymentAccounts()]);
  };

  const handleSelectMethod = async (methodId: number) => {
    setSelectedMethodId(methodId);
    setShowMethodModal(false);

    try {
      await userApi.setDefaultPaymentAccount(methodId);
    } catch (error) {
      showToast({
        message: getErrorMessage(error),
        type: 'warning',
      });
    }
  };

  const handleSubmit = async () => {
    if (!selectedMethod) {
      showToast({ message: '请选择收款账户', type: 'warning' });
      return;
    }

    if (numAmount <= 0) {
      showToast({ message: '请输入有效的提现金额', type: 'warning' });
      return;
    }

    if (numAmount > withdrawableBalance) {
      showToast({ message: '提现金额不能超过可提现余额', type: 'warning' });
      return;
    }

    if (numAmount < MIN_WITHDRAW_AMOUNT) {
      showToast({
        message: `提现金额不得低于 ${MIN_WITHDRAW_AMOUNT} 元`,
        type: 'warning',
      });
      return;
    }

    if (!isPayPasswordValid) {
      showToast({ message: '请输入 6 位数字支付密码', type: 'warning' });
      return;
    }

    setSubmitting(true);

    try {
      const result = await rechargeApi.submitWithdraw({
        amount: numAmount,
        payPassword: payPassword.trim(),
        paymentAccountId: selectedMethod.id,
        remark: remark.trim() || undefined,
      });

      showToast({
        message:
          typeof result.actualAmount === 'number' && Number.isFinite(result.actualAmount) && result.actualAmount > 0
            ? `提现已提交，预计到账 ${formatMoney(result.actualAmount)} 元`
            : '提现申请已提交，请等待审核',
        type: 'success',
        duration: 3000,
      });
      setAmount('');
      setPayPassword('');
      setRemark('');
      void reloadAccountOverview().catch(() => undefined);
    } catch (error) {
      showToast({
        message: getErrorMessage(error),
        type: 'error',
        duration: 3000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderHeader = () => (
    <WalletPageHeader
      title="收益提现"
      onBack={goBack}
      action={{
        icon: FileText,
        label: '提现记录',
        onClick: () => goTo(getBillingPath('withdraw')),
      }}
    />
  );

  if (!isAuthenticated) {
    return (
      <div className="flex h-full flex-1 flex-col bg-bg-base">
        {renderHeader()}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 pb-10">
          <EmptyState
            message="登录后才能发起提现申请"
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
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
          <ErrorState
            message={getErrorMessage(accountOverviewError || paymentAccountsError)}
            onRetry={() => {
              void handleReload();
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-1 flex-col bg-bg-base">
      {isOffline && (
        <div className="absolute left-0 right-0 top-12 z-50 flex items-center justify-between border-b border-red-100 bg-red-50 px-4 py-2 text-sm text-primary-start dark:border-red-500/25 dark:bg-red-500/12 dark:text-red-300">
          <div className="flex items-center">
            <WifiOff size={14} className="mr-2" />
            <span>网络不稳定，请检查后重试</span>
          </div>
          <button
            onClick={() => {
              void handleReload();
            }}
            className="rounded bg-bg-card px-2 py-1 font-medium text-text-main shadow-soft"
          >
            刷新
          </button>
        </div>
      )}

      {renderHeader()}

      <PullToRefreshContainer
        className="flex-1 overflow-y-auto no-scrollbar"
        onRefresh={handleReload}
        disabled={isOffline}
      >
        <div ref={scrollContainerRef} className="pb-[112px]">
          <div className="space-y-3 px-4 py-4">
            <Card className="relative overflow-hidden p-4">
              <div className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-bl-full" style={{ background: 'linear-gradient(to bottom left, rgba(233,59,59,0.05), transparent)' }} />
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-40" />
                  <Skeleton className="h-3 w-36" />
                </div>
              ) : (
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-base text-text-sub">可提现余额（元）</span>
                    <button
                      className="flex items-center text-sm text-text-aux active:opacity-70"
                      onClick={() => setShowRulesModal(true)}
                    >
                      提现规则 <Info size={12} className="ml-1" />
                    </button>
                  </div>
                  <div className="mb-2 text-7xl font-bold tracking-tight text-primary-start">
                    {formatMoney(withdrawableBalance)}
                  </div>
                  <div className="hidden">
                    可提现收益总额：{formatMoney(accountOverview?.income.totalIncomeWithdrawable)}
                  </div>
                </div>
              )}
            </Card>

            <Card className="overflow-hidden p-0">
              {isLoading ? (
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center">
                    <Skeleton className="mr-3 h-8 w-8 rounded-full" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-4" />
                </div>
              ) : selectedMethod ? (
                <button
                  type="button"
                  className="flex w-full items-center justify-between p-4 text-left transition-colors active:bg-bg-base"
                  onClick={() => setShowMethodModal(true)}
                >
                  <div className="flex items-center">
                    <div
                      className={`mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-bg-base ${selectedMethod.colorClassName}`}
                    >
                      {selectedMethod.iconUrl ? (
                        <img
                          src={selectedMethod.iconUrl}
                          alt={selectedMethod.title}
                          className="h-5 w-5 rounded-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <selectedMethod.iconComponent size={18} />
                      )}
                    </div>
                    <div>
                      <div className="mb-0.5 text-lg font-medium text-text-main">
                        {selectedMethod.title}
                      </div>
                      <div className="text-sm text-text-sub">{selectedMethod.subtitle}</div>
                    </div>
                  </div>
                  <div className="flex items-center text-text-aux">
                    <span className="mr-1 text-sm">切换</span>
                    <ChevronRight size={16} />
                  </div>
                </button>
              ) : (
                <div className="p-4">
                  <EmptyState
                    message="暂无收款账户"
                    actionText="去添加账户"
                    onAction={() => goTo('payment_accounts')}
                  />
                </div>
              )}
            </Card>

            <Card className="p-4">
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-3 w-40" />
                </div>
              ) : (
                <>
                  <div className="mb-3 text-md font-medium text-text-main">提现金额</div>
                  <div className="mb-3 flex items-center border-b border-border-light pb-2">
                    <span className="mr-2 shrink-0 text-5xl font-medium text-text-main">¥</span>
                    <input
                      type="text"
                      value={amount}
                      onChange={(event) => handleAmountChange(event.target.value)}
                      placeholder={`最低提现 ${MIN_WITHDRAW_AMOUNT} 元`}
                      className="min-w-0 flex-1 bg-transparent text-6xl font-bold text-text-main outline-none placeholder:text-xl placeholder:font-normal placeholder:text-text-aux"
                    />
                    {amount && (
                      <button
                        type="button"
                        onClick={() => setAmount('')}
                        className="shrink-0 p-1 text-text-aux active:text-text-sub"
                      >
                        <XCircle size={16} />
                      </button>
                    )}
                    <div className="mx-3 h-4 w-px shrink-0 bg-border-light" />
                    <button
                      type="button"
                      onClick={() => setAmount(withdrawableBalance.toFixed(2))}
                      className="shrink-0 whitespace-nowrap text-md font-medium text-primary-start active:opacity-70"
                    >
                      全部
                    </button>
                  </div>
                  <div className="min-h-[18px]">
                    {amountValidationMessage ? (
                      <div className="flex items-center text-sm text-primary-start">
                        <AlertCircle size={12} className="mr-1" />
                        {amountValidationMessage}
                      </div>
                    ) : numAmount > 0 ? (
                      <div className="flex items-center justify-between text-sm text-text-sub">
                        <span>预计手续费：¥{formatMoney(feePreview)}</span>
                        <span className="text-text-main">预计 T+1 到账</span>
                      </div>
                    ) : (
                      <div className="text-sm text-text-aux">
                        预计手续费 {ESTIMATED_FEE_RATE * 100}% ，最低 ¥{ESTIMATED_MIN_FEE}
                      </div>
                    )}
                  </div>
                </>
              )}
            </Card>

            <Card className="space-y-3 p-4">
              <div>
                <div className="mb-2 text-md font-medium text-text-main">支付密码</div>
                <Input
                  type="password"
                  placeholder="请输入 6 位数字支付密码"
                  value={payPassword}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => setPayPassword(event.target.value)}
                />
                <div className="mt-2 min-h-[18px] text-sm text-primary-start">
                  {payPasswordValidationMessage ? (
                    <span className="flex items-center">
                      <AlertCircle size={12} className="mr-1" />
                      {payPasswordValidationMessage}
                    </span>
                  ) : null}
                </div>
              </div>

              <div>
                <div className="mb-2 text-md font-medium text-text-main">备注</div>
                <Input
                  type="text"
                  placeholder="选填"
                  value={remark}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => setRemark(event.target.value)}
                />
              </div>
            </Card>

            <div className="mt-4 flex items-start px-1">
              <ShieldCheck size={14} className="mr-1.5 mt-0.5 shrink-0 text-green-500" />
              <p className="text-s leading-relaxed text-text-sub">
                为保障资金安全，提现可能触发短信或支付密码校验，请确认由本人操作。
              </p>
            </div>
          </div>
        </div>
      </PullToRefreshContainer>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border-light bg-bg-card pb-safe">
        <div className="mx-auto flex w-full items-center justify-between px-4 py-3 sm:max-w-[430px]">
          <div className="flex flex-col">
            <span className="mb-0.5 text-s text-text-sub">预计到账</span>
            <div className="flex items-baseline text-primary-start">
              <span className="mr-0.5 text-md font-medium">¥</span>
              <span className="text-4xl font-bold">{formatMoney(actualArrival)}</span>
            </div>
          </div>
          <button
            disabled={!canSubmit}
            onClick={() => void handleSubmit()}
            className={`h-[44px] w-[160px] rounded-full text-lg font-medium transition-all shadow-sm ${
              canSubmit
                ? 'gradient-primary-r text-white active:opacity-80'
                : 'border border-border-light bg-bg-base text-text-aux shadow-none'
            }`}
          >
            {submitting ? '提交中...' : '确认提现'}
          </button>
        </div>
      </div>

      {showMethodModal && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowMethodModal(false)}
          />
          <div className="relative z-10 mx-auto flex max-h-[70vh] w-full flex-col rounded-t-[20px] bg-bg-card animate-in slide-in-from-bottom duration-200 sm:max-w-[430px]">
            <div className="flex items-center justify-between border-b border-border-light p-4">
              <h3 className="text-xl font-bold text-text-main">选择收款方式</h3>
              <button
                type="button"
                onClick={() => setShowMethodModal(false)}
                className="p-1 text-text-aux active:text-text-main"
              >
                <XCircle size={20} />
              </button>
            </div>
            <div className="overflow-y-auto p-2">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  className="mb-1 flex w-full items-center justify-between rounded-xl p-3 text-left transition-colors active:bg-bg-base"
                  onClick={() => void handleSelectMethod(method.id)}
                >
                  <div className="flex items-center">
                    <div
                      className={`mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-bg-base ${method.colorClassName}`}
                    >
                      {method.iconUrl ? (
                        <img
                          src={method.iconUrl}
                          alt={method.title}
                          className="h-5 w-5 rounded-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <method.iconComponent size={18} />
                      )}
                    </div>
                    <div>
                      <div className="mb-0.5 text-lg font-medium text-text-main">{method.title}</div>
                      <div className="text-sm text-text-sub">{method.subtitle}</div>
                    </div>
                  </div>
                  {selectedMethodId === method.id && (
                    <CheckCircle2 size={20} className="text-primary-start" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showRulesModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowRulesModal(false)}
          />
          <Card className="relative z-10 flex w-full max-w-[320px] flex-col p-6 animate-in fade-in zoom-in duration-200">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-text-main">提现规则说明</h3>
              <button
                type="button"
                onClick={() => setShowRulesModal(false)}
                className="text-text-aux active:text-text-main"
              >
                <XCircle size={20} />
              </button>
            </div>
            <div className="max-h-[60vh] space-y-4 overflow-y-auto text-base text-text-sub">
              <div>
                <h4 className="mb-1 font-medium text-text-main">1. 提现金额</h4>
                <p>单笔提现金额不得低于 {MIN_WITHDRAW_AMOUNT} 元。</p>
              </div>
              <div>
                <h4 className="mb-1 font-medium text-text-main">2. 手续费</h4>
                <p>
                  当前页面按 {ESTIMATED_FEE_RATE * 100}% 进行预估，最低 ¥{ESTIMATED_MIN_FEE}，
                  实际到账金额以后端返回为准。
                </p>
              </div>
              <div>
                <h4 className="mb-1 font-medium text-text-main">3. 到账时间</h4>
                <p>正常情况下将在 T+1 个工作日内处理并打款至所选收款账户。</p>
              </div>
            </div>
            <button
              type="button"
              className="mt-6 w-full rounded-full bg-bg-base py-2.5 text-md font-medium text-text-main transition-colors active:bg-border-light"
              onClick={() => setShowRulesModal(false)}
            >
              我知道了
            </button>
          </Card>
        </div>
      )}
    </div>
  );
};

export default WithdrawPage;
