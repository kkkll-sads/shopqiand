import type { ChangeEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  CheckCircle2,
  ChevronLeft,
  Copy,
  CreditCard,
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
import { useAppNavigate } from '../../lib/navigation';

const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000];

function formatMoney(value: number | string | undefined, fractionDigits = 2) {
  const nextValue = typeof value === 'string' ? Number(value) : value;
  if (typeof nextValue !== 'number' || !Number.isFinite(nextValue)) {
    return '--';
  }

  return nextValue.toLocaleString('zh-CN', {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
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
    return 'bg-green-50 text-green-600';
  }

  if (status === 2) {
    return 'bg-red-50 text-red-600';
  }

  return 'bg-orange-50 text-orange-600';
}

function getOrderTitle(record: RechargeOrderRecord) {
  if (record.recordType === 'transfer') {
    return '余额划转';
  }

  return record.paymentTypeText || '充值申请';
}

export function RechargePage() {
  const { goBack, goTo } = useAppNavigate();
  const { isAuthenticated } = useAuthSession();
  const { isOffline, refreshStatus } = useNetworkStatus();
  const { showToast } = useFeedback();
  const screenshotInputRef = useRef<HTMLInputElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const [showBalance, setShowBalance] = useState(true);
  const [amount, setAmount] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
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
    deps: [isAuthenticated],
    manual: !isAuthenticated,
  });
  const {
    data: companyAccounts,
    error: companyAccountsError,
    loading: companyAccountsLoading,
    reload: reloadCompanyAccounts,
  } = useRequest((signal) => rechargeApi.getCompanyAccountList({ usage: 'recharge' }, { signal }), {
    deps: [isAuthenticated],
    manual: !isAuthenticated,
  });
  const {
    data: recentOrders,
    error: recentOrdersError,
    loading: recentOrdersLoading,
    reload: reloadRecentOrders,
  } = useRequest((signal) => rechargeApi.getMyOrderList({ limit: 3, page: 1 }, { signal }), {
    deps: [isAuthenticated],
    manual: !isAuthenticated,
  });

  const paymentAccounts = useMemo(
    () =>
      (companyAccounts ?? []).map((account) => ({
        ...account,
        color: getCompanyAccountColor(account.type),
        iconComponent: getCompanyAccountIcon(account.type),
        subtitle: buildCompanyAccountSubtitle(account),
        title: account.accountName || account.typeText || '收款账户',
      })),
    [companyAccounts],
  );

  useEffect(() => {
    if (!paymentAccounts.length) {
      setSelectedAccountId(null);
      return;
    }

    setSelectedAccountId((current) => {
      if (current && paymentAccounts.some((item) => item.id === current)) {
        return current;
      }

      return paymentAccounts[0].id;
    });
  }, [paymentAccounts]);

  const selectedAccount =
    paymentAccounts.find((item) => item.id === selectedAccountId) ?? paymentAccounts[0] ?? null;
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
    Boolean(selectedAccount) &&
    numAmount > 0 &&
    Boolean(paymentScreenshot);

  useRouteScrollRestoration({
    containerRef: scrollContainerRef,
    enabled: isAuthenticated && !hasBlockingError,
    namespace: 'recharge-page',
    restoreDeps: [isAuthenticated, hasBlockingError, mainLoading, recentOrders?.list.length ?? 0],
    restoreWhen: isAuthenticated && !hasBlockingError && !mainLoading,
  });

  const handleReload = () => {
    refreshStatus();
    void Promise.allSettled([reloadProfile(), reloadCompanyAccounts(), reloadRecentOrders()]);
  };

  const handleAmountChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    if (nextValue === '' || /^\d*\.?\d{0,2}$/.test(nextValue)) {
      setAmount(nextValue);
    }
  };

  const handleCopy = async (text: string | undefined, successMessage = '已复制') => {
    const nextValue = text?.trim();
    if (!nextValue) {
      return;
    }

    try {
      await navigator.clipboard.writeText(nextValue);
      showToast({ message: successMessage, type: 'success' });
    } catch {
      showToast({ message: '复制失败，请稍后重试', type: 'error' });
    }
  };

  const handlePickScreenshot = () => {
    if (uploadingScreenshot || submitting) {
      return;
    }

    screenshotInputRef.current?.click();
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

  const handleSubmit = async () => {
    if (!selectedAccount || !paymentScreenshot || !canSubmit) {
      return;
    }

    setSubmitting(true);

    try {
      const result = await rechargeApi.submitOrder({
        amount: numAmount,
        companyAccountId: selectedAccount.id,
        paymentMethod: 'offline',
        paymentScreenshotId: paymentScreenshot.id,
        paymentScreenshotUrl: paymentScreenshot.url,
        paymentType: selectedAccount.type,
        userRemark: remark.trim() || undefined,
      });

      showToast({
        message: result.orderNo
          ? `充值申请已提交，订单号 ${result.orderNo}`
          : '充值申请已提交，请等待审核',
        type: 'success',
        duration: 3200,
      });

      setAmount('');
      setRemark('');
      setPaymentScreenshot(null);
      void Promise.allSettled([reloadProfile(), reloadRecentOrders()]);

      if (result.payUrl) {
        window.open(result.payUrl, '_blank', 'noopener,noreferrer');
      }
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
    <div className="sticky top-0 z-40 bg-bg-base/90 backdrop-blur-md">
      <div className="flex h-12 items-center justify-between px-4">
        <button onClick={goBack} className="p-1 -ml-1 text-text-main active:opacity-70">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-2xl font-medium text-text-main">专项金充值</h1>
        <button
          type="button"
          className="flex items-center text-sm text-text-sub active:opacity-70"
          onClick={() => goTo('billing')}
        >
          <FileText size={16} className="mr-1" />
          记录
        </button>
      </div>
    </div>
  );

  if (!isAuthenticated) {
    return (
      <div className="flex h-full flex-1 flex-col bg-red-50/30">
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
      <div className="flex h-full flex-1 flex-col bg-red-50/30">
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
    <div className="relative flex h-full flex-1 flex-col bg-red-50/30">
      {isOffline && <OfflineBanner onAction={handleReload} className="absolute top-12 right-0 left-0 z-50" />}

      {renderHeader()}

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
                      ? 'border-primary-start bg-red-50 text-primary-start'
                      : 'border-transparent bg-bg-base text-text-main'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>

            <div className="flex items-start text-sm text-text-sub">
              <Info size={14} className="mt-0.5 mr-1.5 shrink-0 text-text-aux" />
              <span>完成转账后请上传付款截图，审核通过后充值金额会进入账户余额。</span>
            </div>
          </Card>

          <Card className="overflow-hidden p-0">
            <div className="border-b border-border-light px-4 py-3">
              <div className="text-lg font-medium text-text-main">收款账户</div>
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
            ) : paymentAccounts.length ? (
              <div className="divide-y divide-border-light">
                {paymentAccounts.map((account) => {
                  const isSelected = account.id === selectedAccount?.id;
                  const Icon = account.iconComponent;

                  return (
                    <button
                      key={account.id}
                      type="button"
                      onClick={() => setSelectedAccountId(account.id)}
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
                            {account.title}
                          </div>
                          <div className="truncate text-sm text-text-sub">{account.subtitle}</div>
                          {account.remark ? (
                            <div className="mt-0.5 truncate text-xs text-text-aux">{account.remark}</div>
                          ) : null}
                        </div>
                      </div>
                      <div className="ml-3 flex shrink-0 items-center">
                        {account.accountNumber ? (
                          <button
                            type="button"
                            className="mr-2 flex items-center rounded-full bg-bg-base px-2 py-1 text-xs text-text-sub"
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleCopy(account.accountNumber, '账号已复制');
                            }}
                          >
                            <Copy size={12} className="mr-1" />
                            复制
                          </button>
                        ) : null}
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                            isSelected
                              ? 'border-primary-start bg-primary-start text-white'
                              : 'border-border-main text-transparent'
                          }`}
                        >
                          <CheckCircle2 size={12} />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-4">
                <EmptyState
                  message="暂无可用收款账户"
                  actionText="重新加载"
                  onAction={handleReload}
                />
              </div>
            )}
          </Card>

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
              <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-primary-start/30 bg-red-50/50">
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
                className="flex h-40 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-border-main bg-bg-base text-text-sub transition-colors active:bg-red-50/50"
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
            ) : recentOrdersError && !recentOrders?.list.length ? (
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
            ) : recentOrders?.list.length ? (
              <div className="divide-y divide-border-light">
                {recentOrders.list.map((record) => (
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
            <ShieldCheck size={14} className="mt-0.5 mr-1.5 shrink-0 text-green-600" />
            <span>为保障资金安全，请确认转账信息与收款账户一致，平台不会以任何理由要求您私下转账到个人账户。</span>
          </div>
        </div>
      </div>

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
            disabled={!canSubmit}
            onClick={handleSubmit}
            className={`flex h-12 min-w-[148px] items-center justify-center rounded-full px-6 text-lg font-medium transition ${
              canSubmit
                ? 'bg-gradient-to-r from-primary-start to-primary-end text-white shadow-md shadow-red-500/20 active:scale-[0.98]'
                : 'bg-gray-200 text-gray-400'
            }`}
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="mr-2 animate-spin" />
                提交中
              </>
            ) : (
              '确认充值'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
