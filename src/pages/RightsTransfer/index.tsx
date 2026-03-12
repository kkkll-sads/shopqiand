import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Eye,
  EyeOff,
  FileText,
  Info,
  WifiOff,
  X,
  XCircle,
} from 'lucide-react';
import {
  accountTransferApi,
  type AccountTransferSummary,
  type AccountTransferTargetAccount,
} from '../../api';
import { getErrorMessage, isAbortError } from '../../api/core/errors';
import { WalletPageHeader } from '../../components/layout/WalletPageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { useFeedback } from '../../components/ui/FeedbackProvider';
import { PullToRefreshContainer } from '../../components/ui/PullToRefreshContainer';
import { useAuthSession } from '../../hooks/useAuthSession';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useRouteScrollRestoration } from '../../hooks/useRouteScrollRestoration';
import { getBillingPath } from '../../lib/billing';
import { useAppNavigate } from '../../lib/navigation';

function formatMoney(value: number, fractionDigits = 2) {
  return value.toLocaleString('zh-CN', {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
    useGrouping: false,
  });
}

function formatRate(value: number) {
  const percent = value * 100;
  const fractionDigits = Number.isInteger(percent) ? 0 : 2;
  return `${percent.toFixed(fractionDigits)}%`;
}

export function RightsTransferPage() {
  const { goBack, goTo } = useAppNavigate();
  const { isAuthenticated } = useAuthSession();
  const { isOffline, refreshStatus } = useNetworkStatus();
  const { showConfirm, showToast } = useFeedback();

  const [summary, setSummary] = useState<AccountTransferSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [amount, setAmount] = useState('');
  const [selectedTargetId, setSelectedTargetId] = useState('');
  const [showTargetSelector, setShowTargetSelector] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const loadSummary = async (signal?: AbortSignal) => {
    if (!isAuthenticated) {
      setSummary(null);
      setError(null);
      setIsLoading(false);
      setSelectedTargetId('');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await accountTransferApi.summary('rights', { signal });
      setSummary(response);
      setSelectedTargetId((current) => {
        if (current && response.targetAccounts.some((item) => item.id === current)) {
          return current;
        }
        return response.targetAccounts[0]?.id ?? '';
      });
    } catch (nextError) {
      if (isAbortError(nextError)) {
        return;
      }
      setSummary(null);
      setSelectedTargetId('');
      setError(nextError instanceof Error ? nextError : new Error('加载划转信息失败'));
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    void loadSummary(controller.signal);
    return () => controller.abort();
  }, [isAuthenticated]);

  useRouteScrollRestoration({
    containerRef: scrollContainerRef,
    enabled: isAuthenticated,
    namespace: 'rights-transfer-page',
    restoreDeps: [isAuthenticated, isLoading, Boolean(error), selectedTargetId, showBalance],
    restoreWhen: isAuthenticated && !isLoading && !error && !showTargetSelector,
  });

  const handleRefresh = async () => {
    refreshStatus();
    await loadSummary();
  };

  const handleGoHistory = () => {
    goTo(getBillingPath('transfer'));
  };

  const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    if (nextValue === '' || /^\d*\.?\d{0,2}$/.test(nextValue)) {
      setAmount(nextValue);
    }
  };

  const sourceAccount = summary?.sourceAccount ?? null;
  const selectedTarget =
    summary?.targetAccounts.find((item) => item.id === selectedTargetId) ?? summary?.targetAccounts[0] ?? null;
  const numAmount = Number(amount);
  const fee = selectedTarget ? numAmount * selectedTarget.feeRate : 0;
  const actualArrival = Math.max(0, numAmount - fee);
  const unmetConditions = (summary?.conditions ?? []).filter((item) => !item.isMet);
  const hasUnmetConditions = unmetConditions.length > 0;
  const isAmountExceed = sourceAccount ? numAmount > sourceAccount.available : false;
  const minAmount = selectedTarget?.minAmount ?? 0;
  const isAmountTooLow = numAmount > 0 && minAmount > 0 && numAmount < minAmount;
  const willExceedDailyLimit =
    Boolean(selectedTarget) &&
    numAmount > 0 &&
    (selectedTarget?.dailyLimit ?? 0) > 0 &&
    numAmount + (selectedTarget?.todayAmount ?? 0) > (selectedTarget?.dailyLimit ?? 0);
  const isNoCount =
    selectedTarget?.remainingCount != null && selectedTarget.remainingCount <= 0;

  const isSubmitDisabled =
    !selectedTarget ||
    !amount ||
    !Number.isFinite(numAmount) ||
    numAmount <= 0 ||
    isOffline ||
    isAmountExceed ||
    isAmountTooLow ||
    willExceedDailyLimit ||
    isNoCount ||
    hasUnmetConditions ||
    isSubmitting;

  const handleSelectAll = () => {
    if (!sourceAccount) {
      return;
    }
    setAmount(sourceAccount.available.toFixed(2));
  };

  const handleSubmit = async () => {
    if (!selectedTarget || isSubmitDisabled) {
      return;
    }

    const confirmed = await showConfirm({
      title: '确认划转',
      message: `确认将 ¥${formatMoney(numAmount)} 划转至${selectedTarget.name}吗？`,
      confirmText: '确认划转',
      cancelText: '取消',
    });

    if (!confirmed) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await accountTransferApi.submit({
        scene: 'rights',
        targetAccount: selectedTarget.id,
        amount: numAmount,
      });
      showToast({
        message: `已划转 ¥${formatMoney(result.actualAmount)} 至${result.targetName}`,
        type: 'success',
        duration: 3000,
      });
      setAmount('');
      await loadSummary();
      goBack();
    } catch (nextError) {
      showToast({ message: getErrorMessage(nextError), type: 'error', duration: 3000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderHeader = () => (
    <WalletPageHeader
      title="确权金划转"
      onBack={goBack}
      action={{
        icon: FileText,
        label: '划转记录',
        onClick: handleGoHistory,
      }}
    />
  );

  const renderSkeleton = () => (
    <div className="space-y-4 p-4">
      <div className="h-32 rounded-2xl bg-white animate-pulse dark:bg-gray-800" />
      <div className="h-48 rounded-2xl bg-white animate-pulse dark:bg-gray-800" />
      <div className="h-32 rounded-2xl bg-white animate-pulse dark:bg-gray-800" />
    </div>
  );

  const renderOfflineBanner = () =>
    isOffline ? (
      <div className="flex items-center justify-between bg-orange-50 px-4 py-2 text-base text-orange-500 dark:bg-orange-500/15 dark:text-orange-300">
        <div className="flex items-center">
          <WifiOff size={14} className="mr-1.5 shrink-0" />
          <span>当前网络不可用，请检查网络设置</span>
        </div>
        <button
          type="button"
          onClick={() => {
            void handleRefresh();
          }}
          className="rounded bg-bg-card px-2 py-1 text-sm font-medium text-text-main shadow-soft"
        >
          刷新
        </button>
      </div>
    ) : null;

  const renderContent = () => {
    if (!isAuthenticated) {
      return (
        <EmptyState
          message="登录后才能发起确权金划转"
          actionText="去登录"
          actionVariant="primary"
          onAction={() => goTo('login')}
        />
      );
    }

    if (isLoading && !summary) {
      return renderSkeleton();
    }

    if (error && !summary) {
      return <ErrorState message={getErrorMessage(error)} onRetry={() => void handleRefresh()} />;
    }

    if (!summary || !sourceAccount || !selectedTarget) {
      return <EmptyState message="暂无可用划转账户" />;
    }

    return (
      <div className="space-y-3 p-4">
        <Card className="relative overflow-hidden border-none bg-gradient-to-br from-red-50 to-white p-4 dark:from-gray-900 dark:to-gray-900">
          <div className="pointer-events-none absolute top-0 right-0 -mt-10 -mr-10 h-24 w-24 rounded-full bg-red-100 blur-2xl dark:bg-transparent" />

          <div className="relative z-10 mb-4 flex items-center justify-between">
            <div className="flex-1">
              <div className="mb-1 flex items-center text-base text-text-sub">
                转出账户
                <button type="button" onClick={() => setShowBalance((current) => !current)} className="ml-1.5 text-text-aux">
                  {showBalance ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
              </div>
              <div className="text-xl font-bold text-text-main">{sourceAccount.name}</div>
              <div className="mt-1 text-sm text-text-sub">
                可用:{' '}
                <span className="font-mono text-text-main">
                  {showBalance ? `¥${formatMoney(sourceAccount.available)}` : '****'}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center px-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-brand-red shadow-sm dark:bg-gray-900 dark:text-red-300">
                <ArrowRight size={16} />
              </div>
            </div>

            <div className="flex-1 text-right">
              <div className="mb-1 text-base text-text-sub">转入账户</div>
              <button
                type="button"
                onClick={() => setShowTargetSelector(true)}
                className="flex w-full items-center justify-end text-right text-xl font-bold text-text-main active:opacity-70"
              >
                <span className="truncate">{selectedTarget.name}</span>
                <ChevronDown size={16} className="ml-1 shrink-0 text-text-sub" />
              </button>
              <div className="mt-1 text-sm text-text-sub">
                余额:{' '}
                <span className="font-mono text-text-main">
                  {showBalance ? `¥${formatMoney(selectedTarget.balance)}` : '****'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border-light/50 pt-3 text-sm">
            <span className="text-text-sub">确权金冻结金额</span>
            <span className="font-mono text-text-main">
              {showBalance ? `¥${formatMoney(sourceAccount.frozen)}` : '****'}
            </span>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="mb-4 text-lg font-medium text-text-main">划转金额</h3>

          <div className={`mb-3 flex items-center border-b pb-2 transition-colors ${isAmountExceed ? 'border-red-500' : 'border-border-light'}`}>
            <span className="mr-2 text-5xl font-medium text-text-main">¥</span>
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={handleAmountChange}
              placeholder="请输入划转金额"
              className="min-w-0 flex-1 bg-transparent text-6xl font-bold text-text-main outline-none placeholder:text-gray-300 dark:placeholder:text-gray-600 font-mono"
            />
            {amount ? (
              <button
                type="button"
                onClick={() => setAmount('')}
                className="mr-2 shrink-0 p-1 text-gray-300 hover:text-gray-400 dark:text-gray-600 dark:hover:text-gray-500"
              >
                <XCircle size={20} />
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleSelectAll}
              className="shrink-0 whitespace-nowrap border-l border-border-light pl-3 text-md font-medium text-brand-red active:opacity-70"
            >
              全部
            </button>
          </div>

          {isAmountExceed ? (
            <div className="mb-3 flex items-center text-sm text-red-500">
              <AlertCircle size={12} className="mr-1" />
              输入金额超过可用余额
            </div>
          ) : null}

          {isAmountTooLow ? (
            <div className="mb-3 flex items-center text-sm text-red-500">
              <AlertCircle size={12} className="mr-1" />
              最低划转金额为 ¥{formatMoney(minAmount)}
            </div>
          ) : null}

          {willExceedDailyLimit ? (
            <div className="mb-3 flex items-center text-sm text-red-500">
              <AlertCircle size={12} className="mr-1" />
              今日累计划转金额将超过日限额
            </div>
          ) : null}

          {isNoCount ? (
            <div className="mb-3 flex items-center text-sm text-red-500">
              <AlertCircle size={12} className="mr-1" />
              今日划转次数已达上限
            </div>
          ) : null}

          <div className="space-y-2 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-sub">手续费率</span>
              <span className="font-medium text-text-main">{formatRate(selectedTarget.feeRate)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-sub">到账时间</span>
              <span className="font-medium text-text-main">{selectedTarget.arrivalText}</span>
            </div>
            {selectedTarget.remainingCount != null ? (
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-sub">今日剩余次数</span>
                <span className={`font-medium ${isNoCount ? 'text-red-500' : 'text-text-main'}`}>
                  {selectedTarget.remainingCount} / {selectedTarget.dailyCountLimit || '--'}
                </span>
              </div>
            ) : null}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="mb-3 flex items-center text-lg font-medium text-text-main">
            划转条件
            {hasUnmetConditions ? (
              <span className="ml-2 text-sm font-normal text-red-500 dark:text-red-300">有未满足的条件</span>
            ) : null}
          </h3>
          <div className="space-y-3">
            {(summary.conditions.length > 0 ? summary.conditions : [{ key: 'default', text: '当前无额外限制', isMet: true }]).map((condition) => (
              <div key={condition.key} className="flex items-start">
                {condition.isMet ? (
                  <CheckCircle2 size={16} className="mr-2 mt-0.5 shrink-0 text-green-500" />
                ) : (
                  <div className="mr-2 mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                )}
                <span className={`text-base ${condition.isMet ? 'text-text-main' : 'text-text-sub'}`}>
                  {condition.text}
                  {!condition.isMet && condition.currentCount != null && condition.requiredCount != null ? (
                    <span className="ml-1 text-sm">({condition.currentCount}/{condition.requiredCount})</span>
                  ) : null}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {numAmount > 0 && !isAmountExceed && !isAmountTooLow && !willExceedDailyLimit ? (
          <Card className="p-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h3 className="mb-3 text-lg font-medium text-text-main">确认信息</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-base">
                <span className="text-text-sub">划转金额</span>
                <span className="font-mono text-text-main">¥{formatMoney(numAmount)}</span>
              </div>
              {fee > 0 ? (
                <div className="flex items-center justify-between text-base">
                  <span className="text-text-sub">手续费</span>
                  <span className="font-mono text-orange-500">-¥{formatMoney(fee)}</span>
                </div>
              ) : null}
              <div className="flex items-center justify-between border-t border-border-light pt-3">
                <span className="text-md font-medium text-text-main">实际到账</span>
                <span className="font-mono text-3xl font-bold text-brand-red">¥{formatMoney(actualArrival)}</span>
              </div>
            </div>
          </Card>
        ) : null}

        <Card className="border border-blue-100 bg-blue-50/50 p-3 dark:border-blue-500/25 dark:bg-blue-500/12">
          <div className="flex items-start">
            <Info size={16} className="mr-2 mt-0.5 shrink-0 text-blue-500 dark:text-blue-300" />
            <div className="text-sm leading-relaxed text-blue-700 dark:text-blue-300">
              为保障资金安全，大额划转或异常操作可能触发风控审核，导致到账延迟。请确保本人操作，谨防诈骗。
            </div>
          </div>
        </Card>
      </div>
    );
  };

  const renderTargetSelector = () => {
    if (!showTargetSelector || !summary) {
      return null;
    }

    return (
      <div className="absolute inset-0 z-50 flex flex-col justify-end">
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowTargetSelector(false)}
        />
        <div className="relative z-10 rounded-t-2xl bg-white pb-safe animate-in slide-in-from-bottom-full duration-300 dark:bg-gray-800">
          <div className="flex items-center justify-between border-b border-border-light p-4">
            <h3 className="text-xl font-medium text-text-main">选择转入账户</h3>
            <button
              type="button"
              onClick={() => setShowTargetSelector(false)}
              className="p-1 text-text-sub hover:text-text-main"
            >
              <X size={20} />
            </button>
          </div>
          <div className="max-h-[60vh] overflow-y-auto p-2">
            {summary.targetAccounts.map((account: AccountTransferTargetAccount) => {
              const isSelected = selectedTargetId === account.id;
              return (
                <button
                  key={account.id}
                  type="button"
                  onClick={() => {
                    setSelectedTargetId(account.id);
                    setShowTargetSelector(false);
                  }}
                  className={`mb-2 flex w-full items-center justify-between rounded-xl p-4 text-left transition-colors ${
                    isSelected
                      ? 'border border-brand-red/30 bg-red-50 dark:border-red-500/30 dark:bg-red-500/12'
                      : 'border border-transparent bg-white active:bg-gray-50 dark:bg-gray-900 dark:active:bg-gray-800'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center">
                      <span className="mr-2 text-lg font-medium text-text-main">{account.name}</span>
                      {account.feeRate === 0 ? (
                        <span className="rounded-sm bg-green-100 px-1.5 py-0.5 text-xs text-green-600 dark:bg-green-500/15 dark:text-green-300">
                          免手续费
                        </span>
                      ) : null}
                    </div>
                    <div className="mb-1 text-sm text-text-sub">{account.desc}</div>
                    <div className="text-sm text-text-sub">
                      当前余额:{' '}
                      <span className="font-mono text-text-main">
                        {showBalance ? `¥${formatMoney(account.balance)}` : '****'}
                      </span>
                    </div>
                  </div>
                  <div
                    className={`ml-4 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                      isSelected ? 'border-brand-red bg-brand-red' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {isSelected ? <CheckCircle2 size={14} className="text-white" /> : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative flex h-full flex-col bg-bg-hover dark:bg-gray-900">
      {renderHeader()}
      {renderOfflineBanner()}

      {isAuthenticated ? (
        <PullToRefreshContainer
          className="flex-1"
          onRefresh={handleRefresh}
          disabled={showTargetSelector || isSubmitting}
        >
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto pb-[112px]">
            {renderContent()}
          </div>
        </PullToRefreshContainer>
      ) : (
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto pb-[112px]">
          {renderContent()}
        </div>
      )}

      {isAuthenticated && summary && selectedTarget ? (
        <div className="absolute right-0 bottom-0 left-0 z-20 border-t border-border-light bg-white px-4 py-3 pb-safe shadow-[0_-4px_16px_rgba(0,0,0,0.05)] dark:bg-gray-800 dark:shadow-[0_-4px_16px_rgba(0,0,0,0.2)]">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-md text-text-sub">实际到账</span>
            <span className="font-mono text-4xl font-bold text-brand-red">
              {showBalance && numAmount > 0 && !isAmountExceed && !isAmountTooLow ? `¥${formatMoney(actualArrival)}` : '¥0.00'}
            </span>
          </div>
          <Button
            className={`h-12 w-full rounded-full text-xl font-medium ${
              isSubmitDisabled
                ? 'bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                : 'bg-gradient-to-r from-brand-start to-brand-end text-white shadow-md shadow-red-500/20 active:scale-[0.98]'
            }`}
            disabled={isSubmitDisabled}
            onClick={() => void handleSubmit()}
          >
            {isSubmitting ? '处理中...' : '确认划转'}
          </Button>
        </div>
      ) : null}

      {renderTargetSelector()}
    </div>
  );
}
