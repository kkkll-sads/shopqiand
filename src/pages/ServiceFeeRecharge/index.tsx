import { useMemo, useState } from 'react';
import { AlertCircle, CreditCard, FileText, ShieldCheck, Wallet } from 'lucide-react';
import { accountApi } from '../../api';
import { getErrorMessage } from '../../api/core/errors';
import { OfflineBanner } from '../../components/layout/OfflineBanner';
import { WalletPageHeader } from '../../components/layout/WalletPageHeader';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { Skeleton } from '../../components/ui/Skeleton';
import { useAuthSession } from '../../hooks/useAuthSession';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useRequest } from '../../hooks/useRequest';
import { getBillingPath } from '../../lib/billing';
import { useAppNavigate } from '../../lib/navigation';

type RechargeSource = 'balance_available' | 'withdrawable_money';

function formatMoney(value: number | string | undefined, fractionDigits = 2) {
  const nextValue = typeof value === 'string' ? Number(value) : value;
  if (typeof nextValue !== 'number' || !Number.isFinite(nextValue)) {
    return '0.00';
  }

  return nextValue.toLocaleString('zh-CN', {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
    useGrouping: false,
  });
}

const SOURCE_OPTIONS: Array<{
  description: string;
  icon: typeof Wallet;
  key: RechargeSource;
  label: string;
}> = [
  {
    key: 'balance_available',
    label: '专项金支付',
    description: '从专项金余额转入确权金',
    icon: Wallet,
  },
  {
    key: 'withdrawable_money',
    label: '可提现收益支付',
    description: '从可提现收益转入确权金',
    icon: CreditCard,
  },
];

export function ServiceFeeRechargePage() {
  const { goBack, goTo } = useAppNavigate();
  const { isAuthenticated } = useAuthSession();
  const { isOffline, refreshStatus } = useNetworkStatus();
  const { showToast } = useFeedback();

  const [source, setSource] = useState<RechargeSource>('balance_available');
  const [amount, setAmount] = useState('');
  const [remark, setRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const {
    data: profile,
    error,
    loading,
    reload,
  } = useRequest((signal) => accountApi.getProfile({ signal }), {
    cacheKey: 'service-fee-recharge:profile',
    deps: [isAuthenticated],
    manual: !isAuthenticated,
  });

  const userInfo = profile?.userInfo;
  const currentBalance = useMemo(() => {
    if (!userInfo) {
      return 0;
    }

    const rawValue =
      source === 'balance_available' ? userInfo.balanceAvailable : userInfo.withdrawableMoney;
    const numericValue = Number(rawValue);
    return Number.isFinite(numericValue) ? numericValue : 0;
  }, [source, userInfo]);
  const serviceFeeBalance = Number(userInfo?.serviceFeeBalance ?? 0);
  const numericAmount = Number(amount);

  const handleReload = () => {
    refreshStatus();
    void reload().catch(() => undefined);
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      goTo('login');
      return;
    }

    if (!amount || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      showToast({ message: '请输入有效充值金额', type: 'warning' });
      return;
    }

    if (numericAmount > currentBalance) {
      showToast({ message: '当前来源余额不足', type: 'warning' });
      return;
    }

    setSubmitting(true);

    try {
      await accountApi.rechargeServiceFee({
        amount: numericAmount,
        remark: remark.trim() || undefined,
        source,
      });

      showToast({ message: '确权金充值成功', type: 'success' });
      setAmount('');
      setRemark('');
      await reload();
    } catch (submitError) {
      showToast({
        message: getErrorMessage(submitError),
        type: 'error',
        duration: 3000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderHeader = () => (
    <WalletPageHeader
      title="确权金充值"
      onBack={goBack}
      action={{
        icon: FileText,
        label: '充值明细',
        onClick: () => goTo(getBillingPath('service_fee_recharge')),
      }}
    />
  );

  if (!isAuthenticated) {
    return (
      <div className="flex h-full flex-1 flex-col bg-bg-base">
        {renderHeader()}
        <div className="flex-1 overflow-y-auto no-scrollbar px-4">
          <EmptyState
            message="登录后才能发起确权金充值"
            actionText="去登录"
            actionVariant="primary"
            onAction={() => goTo('login')}
          />
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="flex h-full flex-1 flex-col bg-bg-base">
        {renderHeader()}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <ErrorState message={getErrorMessage(error)} onRetry={handleReload} />
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-1 flex-col bg-bg-base">
      {isOffline ? (
        <OfflineBanner onAction={handleReload} className="absolute top-12 right-0 left-0 z-50" />
      ) : null}

      {renderHeader()}

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 pb-28">
        <div className="space-y-4">
          <Card className="relative overflow-hidden p-5">
            <div className="pointer-events-none absolute top-0 right-0 h-28 w-28 rounded-bl-full bg-gradient-to-bl from-primary-start/10 to-transparent" />
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-44" />
                <Skeleton className="h-4 w-36" />
              </div>
            ) : (
              <>
                <div className="mb-1 flex items-center text-sm text-text-sub">
                  <ShieldCheck size={14} className="mr-1.5 text-primary-start" />
                  当前确权金余额
                </div>
                <div className="text-5xl font-bold tracking-tight text-text-main">
                  ¥{formatMoney(serviceFeeBalance)}
                </div>
                <div className="mt-3 text-sm text-text-sub">
                  专项金：¥{formatMoney(userInfo?.balanceAvailable)}
                  <span className="mx-2 text-border-main">|</span>
                  可提现收益：¥{formatMoney(userInfo?.withdrawableMoney)}
                </div>
              </>
            )}
          </Card>

          <Card className="p-4">
            <div className="mb-4 text-lg font-medium text-text-main">充值来源</div>
            <div className="space-y-3">
              {SOURCE_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isSelected = option.key === source;
                const optionBalance =
                  option.key === 'balance_available'
                    ? userInfo?.balanceAvailable
                    : userInfo?.withdrawableMoney;

                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setSource(option.key)}
                    className={`flex w-full items-center justify-between rounded-2xl border px-4 py-4 text-left transition-colors ${
                      isSelected
                        ? 'border-primary-start bg-red-50/50 dark:bg-red-500/10'
                        : 'border-border-light bg-bg-card active:bg-bg-base'
                    }`}
                  >
                    <div className="flex min-w-0 items-center">
                      <div
                        className={`mr-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                          isSelected ? 'bg-white text-primary-start' : 'bg-bg-base text-text-sub'
                        }`}
                      >
                        <Icon size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-md font-medium text-text-main">{option.label}</div>
                        <div className="mt-1 text-sm text-text-sub">{option.description}</div>
                        <div className="mt-1 text-xs text-text-aux">
                          可用余额：¥{formatMoney(optionBalance)}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`h-5 w-5 rounded-full border ${
                        isSelected ? 'border-primary-start bg-primary-start' : 'border-border-main'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </Card>

          <Card className="p-4">
            <div className="mb-4 text-lg font-medium text-text-main">充值金额</div>
            <div className="flex items-center border-b border-border-light pb-2">
              <span className="mr-2 shrink-0 text-4xl font-medium text-text-main">¥</span>
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  if (nextValue === '' || /^\d*\.?\d{0,2}$/.test(nextValue)) {
                    setAmount(nextValue);
                  }
                }}
                placeholder="请输入充值金额"
                className="min-w-0 flex-1 bg-transparent text-5xl font-bold text-text-main outline-none placeholder:text-xl placeholder:font-normal placeholder:text-text-aux"
              />
            </div>
            <div className="mt-3 text-sm text-text-sub">当前来源可用：¥{formatMoney(currentBalance)}</div>

            <textarea
              value={remark}
              onChange={(event) => setRemark(event.target.value.slice(0, 200))}
              rows={3}
              placeholder="备注信息（选填）"
                    className="mt-4 w-full resize-none rounded-2xl border border-border-light bg-bg-base px-4 py-3 text-lg text-text-main outline-none placeholder:text-text-aux focus:border-primary-start"
            />
          </Card>

          <Card className="p-4">
            <div className="flex items-start text-sm text-text-sub">
              <AlertCircle size={16} className="mt-0.5 mr-2 shrink-0 text-primary-start" />
              <span>确权金仅用于订单寄售等服务费场景，无法提现或转出，请按需充值。</span>
            </div>
          </Card>
        </div>
      </div>

      <div className="absolute right-0 bottom-0 left-0 border-t border-border-light bg-bg-card px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between">
          <div>
            <div className="mb-0.5 text-sm text-text-sub">充值金额</div>
            <div className="text-4xl font-bold text-primary-start">
              <span className="mr-1 text-base">¥</span>
              {numericAmount > 0 ? formatMoney(numericAmount) : '0.00'}
            </div>
          </div>
          <button
            type="button"
            disabled={isOffline || loading || submitting}
            onClick={handleSubmit}
            className={`flex h-12 min-w-[148px] items-center justify-center rounded-full px-6 text-lg font-medium transition ${
              !isOffline && !loading && !submitting
                ? 'bg-gradient-to-r from-primary-start to-primary-end text-white shadow-md shadow-red-500/20 active:scale-[0.98]'
                : 'bg-gray-200 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
            }`}
          >
            {submitting ? '提交中' : '确认充值'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ServiceFeeRechargePage;
