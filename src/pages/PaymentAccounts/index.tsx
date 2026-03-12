/**
 * @file PaymentAccounts/index.tsx - 支付账户管理页面
 * @description 管理用户银行卡等支付账户，支持添加、删除、设为默认。
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'; // React 核心 Hook
import type { ChangeEvent } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  AlertCircle,
  Check,
  Copy,
  CreditCard,
  Edit3,
  ImagePlus,
  Landmark,
  QrCode,
  ShieldCheck,
  Smartphone,
  Trash2,
  Wallet,
} from 'lucide-react';
import {
  userApi,
  type AddPaymentAccountPayload,
  type EditPaymentAccountPayload,
  type PaymentAccount,
  type PaymentAccountOwnerType,
  type PaymentAccountType,
} from '../../api';
import { getErrorMessage } from '../../api/core/errors';
import { PageHeader } from '../../components/layout/PageHeader';
import { PullToRefreshContainer } from '../../components/ui/PullToRefreshContainer';
import { Button } from '../../components/ui/Button';
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

type ViewMode = 'list' | 'form';

interface PaymentAccountFormState {
  accountName: string;
  accountNumber: string;
  accountType: PaymentAccountOwnerType;
  bankBranch: string;
  bankName: string;
  existingScreenshotUrl: string;
  screenshotFile: File | null;
  screenshotPreviewUrl: string;
  type: PaymentAccountType;
}

const PAYMENT_TYPE_OPTIONS: Array<{
  description: string;
  icon: LucideIcon;
  label: string;
  value: PaymentAccountType;
}> = [
  { value: 'bank_card', label: '银行卡', icon: Landmark, description: '提现和收款常用银行卡' },
  { value: 'alipay', label: '支付宝', icon: Wallet, description: '支持个人和公司支付宝账户' },
  { value: 'wechat', label: '微信', icon: Smartphone, description: '可上传微信收款二维码' },
  { value: 'usdt', label: 'USDT', icon: CreditCard, description: '支持 TRC20 / ERC20 等网络' },
];

const ACCOUNT_OWNER_OPTIONS: Array<{
  description: string;
  label: string;
  value: PaymentAccountOwnerType;
}> = [
  { value: 'personal', label: '个人', description: '个人账户，通常可直接使用' },
  { value: 'company', label: '公司', description: '公司账户，部分类型需要打款截图' },
];

const USDT_NETWORK_OPTIONS = ['TRC20', 'ERC20', 'BEP20', 'OMNI'] as const;

const fieldClassName =
  'h-12 w-full rounded-2xl border border-border-light bg-bg-base px-4 text-lg text-text-main outline-none transition-colors placeholder:text-text-aux focus:border-primary-start';

function createEmptyForm(realName = ''): PaymentAccountFormState {
  return {
    accountName: realName,
    accountNumber: '',
    accountType: 'personal',
    bankBranch: '',
    bankName: '',
    existingScreenshotUrl: '',
    screenshotFile: null,
    screenshotPreviewUrl: '',
    type: 'bank_card',
  };
}

function isRealNameApproved(status: number | undefined) {
  return status === 2;
}

function maskAccountNumber(value: string | undefined): string {
  const nextValue = value?.trim();
  if (!nextValue) {
    return '--';
  }

  if (nextValue.length <= 8) {
    return nextValue;
  }

  return `${nextValue.slice(0, 4)} **** ${nextValue.slice(-4)}`;
}

function getPaymentIcon(type: PaymentAccountType | string): LucideIcon {
  switch (type) {
    case 'bank_card':
      return Landmark;
    case 'wechat':
      return Smartphone;
    case 'usdt':
      return CreditCard;
    case 'alipay':
    default:
      return Wallet;
  }
}

function getPaymentColor(type: PaymentAccountType | string): string {
  switch (type) {
    case 'bank_card':
      return 'text-blue-600 bg-blue-50 dark:bg-blue-500/15 dark:text-blue-300';
    case 'wechat':
      return 'text-green-600 bg-green-50 dark:bg-green-500/15 dark:text-green-300';
    case 'usdt':
      return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/15 dark:text-emerald-300';
    case 'alipay':
    default:
      return 'text-sky-600 bg-sky-50 dark:bg-sky-500/15 dark:text-sky-300';
  }
}

function getAuditClassName(status: number): string {
  switch (status) {
    case 2:
    case 1:
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200';
    case 0:
      return 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200';
    case 3:
      return 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-200';
    default:
      return 'bg-bg-base text-text-sub';
  }
}

function getAccountNumberLabel(type: PaymentAccountType): string {
  switch (type) {
    case 'bank_card':
      return '银行卡号';
    case 'alipay':
      return '支付宝账号';
    case 'wechat':
      return '微信账号';
    case 'usdt':
      return 'USDT 地址';
    default:
      return '账号';
  }
}

function buildAccountSubtitle(account: PaymentAccount): string {
  if (account.type === 'bank_card') {
    return `${account.bankName || account.typeText || '银行卡'} ${maskAccountNumber(account.accountNumber)}`;
  }

  if (account.type === 'usdt') {
    return `${account.networkType || account.bankBranch || 'TRC20'} ${maskAccountNumber(account.accountNumber)}`;
  }

  return maskAccountNumber(account.accountNumber);
}

function canSetAsDefault(account: PaymentAccount): boolean {
  return !(
    account.type === 'alipay'
    && account.accountType === 'company'
    && account.auditStatus !== 1
  );
}

function requiresScreenshot(type: PaymentAccountType, accountType: PaymentAccountOwnerType): boolean {
  return accountType === 'company' && (type === 'bank_card' || type === 'alipay');
}

function supportsScreenshot(type: PaymentAccountType, accountType: PaymentAccountOwnerType): boolean {
  return type === 'wechat' || requiresScreenshot(type, accountType);
}

function supportsBankName(type: PaymentAccountType): boolean {
  return type === 'bank_card';
}

function supportsBankBranchInput(type: PaymentAccountType): boolean {
  return type === 'bank_card';
}

function supportsUsdtNetwork(type: PaymentAccountType): boolean {
  return type === 'usdt';
}

function getScreenshotHint(type: PaymentAccountType, accountType: PaymentAccountOwnerType): string {
  if (requiresScreenshot(type, accountType)) {
    return '公司银行卡/支付宝账户需要上传打款截图';
  }

  if (type === 'wechat') {
    return '微信账户可选上传收款二维码';
  }

  return '';
}

function getVisibleScreenshotUrl(formData: PaymentAccountFormState): string {
  return formData.screenshotPreviewUrl || formData.existingScreenshotUrl;
}

function PaymentAccountSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((item) => (
        <Card key={item} className="space-y-4 border border-border-light p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center">
              <Skeleton className="mr-3 h-12 w-12 rounded-2xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-36" />
              </div>
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-20 rounded-full" />
            <Skeleton className="h-9 w-20 rounded-full" />
          </div>
        </Card>
      ))}
    </div>
  );
}

export function PaymentAccountsPage() {
  const { goBackOr, goTo } = useAppNavigate();
  const { isAuthenticated } = useAuthSession();
  const { isOffline, refreshStatus } = useNetworkStatus();
  const { showToast, showConfirm } = useFeedback();
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [view, setView] = useState<ViewMode>('list');
  const [editingAccount, setEditingAccount] = useState<PaymentAccount | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<PaymentAccountFormState>(() => createEmptyForm());

  const {
    data: paymentAccounts,
    error: paymentAccountsError,
    loading: paymentAccountsLoading,
    reload: reloadPaymentAccounts,
  } = useRequest((signal) => userApi.getPaymentAccountList({ signal }), {
    cacheKey: 'payment-accounts:list',
    deps: [isAuthenticated],
    manual: !isAuthenticated,
  });
  const {
    data: realNameStatus,
    loading: realNameStatusLoading,
    reload: reloadRealNameStatus,
  } = useRequest((signal) => userApi.getRealNameStatus({ signal }), {
    cacheKey: 'payment-accounts:real-name',
    deps: [isAuthenticated],
    manual: !isAuthenticated,
  });

  const accountList = Array.isArray(paymentAccounts) ? paymentAccounts : [];
  const isRealNameVerified = isRealNameApproved(realNameStatus?.realNameStatus);
  const realName = realNameStatus?.realName?.trim() || '';
  const isLoading = isAuthenticated && paymentAccountsLoading && accountList.length === 0;
  const hasBlockingError =
    isAuthenticated && accountList.length === 0 && Boolean(paymentAccountsError);
  const visibleScreenshotUrl = getVisibleScreenshotUrl(formData);
  const isEditing = editingAccount != null;
  const formTitle = isEditing ? '编辑账户' : '新增账户';
  const pageTitle = view === 'list' ? '卡号管理' : formTitle;
  const screenshotHint = getScreenshotHint(formData.type, formData.accountType);
  const showScreenshotUploader = supportsScreenshot(formData.type, formData.accountType);
  const showBankNameField = supportsBankName(formData.type);
  const showBankBranchField = supportsBankBranchInput(formData.type);
  const showUsdtNetworkField = supportsUsdtNetwork(formData.type);
  const disableAddButton = realNameStatusLoading || !isRealNameVerified;

  useEffect(() => {
    return () => {
      if (formData.screenshotPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(formData.screenshotPreviewUrl);
      }
    };
  }, [formData.screenshotPreviewUrl]);

  useRouteScrollRestoration({
    containerRef: scrollContainerRef,
    enabled: view === 'list' && isAuthenticated,
    namespace: 'payment-accounts-page',
    restoreDeps: [view, accountList.length, hasBlockingError, isLoading],
    restoreWhen: view === 'list' && isAuthenticated && !hasBlockingError && !isLoading,
  });

  const handleReload = useCallback(() => {
    refreshStatus();
    void Promise.allSettled([reloadPaymentAccounts(), reloadRealNameStatus()]);
  }, [refreshStatus, reloadPaymentAccounts, reloadRealNameStatus]);

  const resetForm = useCallback((account?: PaymentAccount | null) => {
    setFormErrors({});
    setEditingAccount(account ?? null);
    setView('form');
    setFormData((current) => {
      if (current.screenshotPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(current.screenshotPreviewUrl);
      }

      if (!account) {
        return createEmptyForm(realName);
      }

      return {
        accountName: account.accountName || realName,
        accountNumber: account.accountNumber || '',
        accountType: account.accountType,
        bankBranch: account.networkType || account.bankBranch || '',
        bankName: account.bankName || '',
        existingScreenshotUrl: account.screenshot || '',
        screenshotFile: null,
        screenshotPreviewUrl: '',
        type: (account.type as PaymentAccountType) || 'bank_card',
      };
    });
  }, [realName]);

  const handleBack = () => {
    if (view === 'form') {
      setView('list');
      setEditingAccount(null);
      setFormErrors({});
      setFormData((current) => {
        if (current.screenshotPreviewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(current.screenshotPreviewUrl);
        }

        return createEmptyForm(realName);
      });
      return;
    }

    goBackOr('user');
  };

  const handleOpenAdd = () => {
    if (!isRealNameVerified) {
      showToast({ message: '请先完成实名认证', type: 'warning' });
      goTo('real_name_auth');
      return;
    }

    resetForm(null);
  };

  const handleOpenEdit = (account: PaymentAccount) => {
    resetForm(account);
  };

  const handleCopy = async (value: string | undefined) => {
    if (!value) {
      return;
    }

    const copied = await copyToClipboard(value);
    showToast({
      message: copied ? '账号已复制' : '复制失败，请稍后重试',
      type: copied ? 'success' : 'error',
    });
  };

  const handleTypeChange = (type: PaymentAccountType) => {
    if (isEditing) {
      return;
    }

    setFormData((current) => ({
      ...current,
      accountName:
        (type === 'bank_card' || type === 'alipay') && !current.accountName.trim() && realName
          ? realName
          : current.accountName,
      bankBranch:
        type === 'usdt'
          ? (USDT_NETWORK_OPTIONS.includes(current.bankBranch as (typeof USDT_NETWORK_OPTIONS)[number])
            ? current.bankBranch
            : 'TRC20')
          : type === 'bank_card'
            ? current.bankBranch
            : '',
      bankName: type === 'bank_card' ? current.bankName : '',
      existingScreenshotUrl:
        type === 'wechat' || requiresScreenshot(type, current.accountType)
          ? current.existingScreenshotUrl
          : '',
      type,
    }));
  };

  const handleAccountTypeChange = (accountType: PaymentAccountOwnerType) => {
    if (isEditing) {
      return;
    }

    setFormData((current) => ({
      ...current,
      accountType,
      existingScreenshotUrl:
        current.type === 'wechat' || requiresScreenshot(current.type, accountType)
          ? current.existingScreenshotUrl
          : '',
    }));
  };

  const handleScreenshotPick = () => {
    fileInputRef.current?.click();
  };

  const handleScreenshotChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = '';

    setFormData((current) => {
      if (current.screenshotPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(current.screenshotPreviewUrl);
      }

      return {
        ...current,
        screenshotFile: file,
        screenshotPreviewUrl: file ? URL.createObjectURL(file) : '',
      };
    });
  };

  const handleSetDefault = async (account: PaymentAccount) => {
    if (account.isDefault) {
      return;
    }

    if (!canSetAsDefault(account)) {
      showToast({ message: '该账户审核通过后才能设为默认', type: 'warning' });
      return;
    }

    try {
      await userApi.setDefaultPaymentAccount(account.id);
      showToast({ message: '已设为默认账户', type: 'success' });
      await reloadPaymentAccounts().catch(() => undefined);
    } catch (error) {
      showToast({ message: getErrorMessage(error), type: 'error' });
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    const accountName = formData.accountName.trim();
    const accountNumber = formData.accountNumber.trim();
    const bankName = formData.bankName.trim();
    const bankBranch = formData.bankBranch.trim();

    if (!accountName) {
      errors.accountName = '账户名不能为空';
    }

    if (!accountNumber) {
      errors.accountNumber = `${getAccountNumberLabel(formData.type)}不能为空`;
    }

    if (formData.type === 'bank_card' && !bankName) {
      errors.bankName = '银行名称不能为空';
    }

    if (formData.type === 'usdt' && !bankBranch) {
      errors.bankBranch = '请选择 USDT 网络类型';
    }

    if ((formData.type === 'bank_card' || formData.type === 'alipay') && realName && accountName && accountName !== realName) {
      errors.accountName = '账户名必须与实名认证姓名一致';
    }

    if (
      requiresScreenshot(formData.type, formData.accountType)
      && !formData.screenshotFile
      && !formData.existingScreenshotUrl
    ) {
      errors.screenshot = '请上传打款截图';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const buildAddPayload = (): AddPaymentAccountPayload => ({
    accountName: formData.accountName.trim(),
    accountNumber: formData.accountNumber.trim(),
    accountType: formData.accountType,
    bankBranch: formData.bankBranch.trim() || undefined,
    bankName: formData.bankName.trim() || undefined,
    screenshot: formData.screenshotFile ?? undefined,
    type: formData.type,
  });

  const buildEditPayload = (): EditPaymentAccountPayload => ({
    accountName: formData.accountName.trim(),
    accountNumber: formData.accountNumber.trim(),
    bankBranch: formData.bankBranch.trim() || undefined,
    bankName: formData.bankName.trim() || undefined,
    id: editingAccount?.id || 0,
    screenshot: formData.screenshotFile ?? undefined,
  });

  const handleSubmit = async () => {
    if (!validateForm() || saving) {
      return;
    }

    setSaving(true);

    try {
      if (isEditing) {
        await userApi.editPaymentAccount(buildEditPayload());
        showToast({ message: '账户已更新', type: 'success' });
      } else {
        await userApi.addPaymentAccount(buildAddPayload());
        showToast({ message: '账户已添加', type: 'success' });
      }

      setView('list');
      setEditingAccount(null);
      setFormData((current) => {
        if (current.screenshotPreviewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(current.screenshotPreviewUrl);
        }

        return createEmptyForm(realName);
      });
      await reloadPaymentAccounts().catch(() => undefined);
    } catch (error) {
      showToast({ message: getErrorMessage(error), type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingAccount || deleting) {
      return;
    }

    const confirmed = await showConfirm({
      title: '删除账户',
      message: '确定要删除这个收款账户吗？',
      confirmText: '确认删除',
      cancelText: '取消',
      danger: true,
    });
    if (!confirmed) {
      return;
    }

    setDeleting(true);

    try {
      await userApi.deletePaymentAccount(editingAccount.id);
      showToast({ message: '账户已删除', type: 'success' });
      setView('list');
      setEditingAccount(null);
      setFormData((current) => {
        if (current.screenshotPreviewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(current.screenshotPreviewUrl);
        }

        return createEmptyForm(realName);
      });
      await reloadPaymentAccounts().catch(() => undefined);
    } catch (error) {
      showToast({ message: getErrorMessage(error), type: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const formSummary = useMemo(() => {
    const selectedType = PAYMENT_TYPE_OPTIONS.find((item) => item.value === formData.type);
    const selectedOwner = ACCOUNT_OWNER_OPTIONS.find((item) => item.value === formData.accountType);
    return {
      ownerText: selectedOwner?.label || '个人',
      typeDescription: selectedType?.description || '',
      typeText: selectedType?.label || '银行卡',
    };
  }, [formData.accountType, formData.type]);

  const renderList = () => {
    if (isLoading) {
      return <PaymentAccountSkeleton />;
    }

    if (hasBlockingError) {
      return (
        <ErrorState
          message={getErrorMessage(paymentAccountsError)}
          onRetry={handleReload}
        />
      );
    }

    if (accountList.length === 0) {
      return (
        <EmptyState
          icon={<CreditCard size={46} />}
          message={isRealNameVerified ? '暂未添加任何收款账户' : '实名认证后可添加收款账户'}
          actionText={isRealNameVerified ? '新增账户' : '去实名认证'}
          actionVariant="primary"
          onAction={isRealNameVerified ? handleOpenAdd : () => goTo('real_name_auth')}
        />
      );
    }

    return (
      <div className="space-y-4">
        {!isRealNameVerified ? (
          <Card className="border border-amber-200/80 bg-amber-50/60 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
            <div className="flex items-start gap-3">
              <ShieldCheck size={18} className="mt-0.5 text-amber-600" />
              <div className="flex-1">
                <div className="text-sm font-medium text-amber-700">新增账户前需要完成实名认证</div>
                <div className="mt-1 text-sm text-amber-700/80">
                  当前账户仍可查看、编辑已有收款信息，但新增账户前必须先实名认证。
                </div>
                <button
                  type="button"
                  className="mt-3 text-sm font-medium text-primary-start"
                  onClick={() => goTo('real_name_auth')}
                >
                  去实名认证
                </button>
              </div>
            </div>
          </Card>
        ) : null}

        {accountList.map((account) => {
          const Icon = getPaymentIcon(account.type);
          const canDefault = canSetAsDefault(account);

          return (
            <Card key={account.id} className="border border-border-light p-0">
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-start">
                    <div
                      className={`mr-3 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${getPaymentColor(account.type)}`}
                    >
                      {account.icon ? (
                        <img
                          src={account.icon}
                          alt={account.typeText || '账户'}
                          className="h-6 w-6 rounded-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <Icon size={22} />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-semibold text-text-main">
                          {account.accountName || account.typeText || '收款账户'}
                        </h2>
                        {account.isDefault ? (
                          <span className="rounded-full bg-primary-start/10 px-2 py-0.5 text-xs font-medium text-primary-start">
                            默认
                          </span>
                        ) : null}
                        {account.auditStatusText ? (
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getAuditClassName(account.auditStatus)}`}>
                            {account.auditStatusText}
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-1 text-sm text-text-sub">
                        {buildAccountSubtitle(account)}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-text-aux">
                        <span className="rounded-full bg-bg-base px-2 py-1">
                          {account.typeText || account.type}
                        </span>
                        <span className="rounded-full bg-bg-base px-2 py-1">
                          {account.accountTypeText || (account.accountType === 'company' ? '公司' : '个人')}
                        </span>
                        {account.branchInfo ? (
                          <span className="rounded-full bg-bg-base px-2 py-1">
                            {account.branchInfo}
                          </span>
                        ) : null}
                        {account.networkType ? (
                          <span className="rounded-full bg-bg-base px-2 py-1">
                            {account.networkType}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="shrink-0 rounded-full bg-bg-base p-2 text-text-sub active:text-text-main"
                    onClick={() => handleOpenEdit(account)}
                  >
                    <Edit3 size={16} />
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center rounded-full border border-border-light px-3 py-1.5 text-sm text-text-main active:bg-bg-base"
                    onClick={() => void handleCopy(account.accountNumber)}
                  >
                    <Copy size={14} className="mr-1.5" />
                    复制账号
                  </button>

                  <button
                    type="button"
                    disabled={account.isDefault || !canDefault}
                    className={`inline-flex items-center rounded-full px-3 py-1.5 text-sm ${
                      account.isDefault
                        ? 'bg-bg-base text-text-aux'
                        : canDefault
                          ? 'border border-primary-start text-primary-start active:bg-red-50 dark:active:bg-red-500/10'
                          : 'bg-bg-base text-text-aux'
                    }`}
                    onClick={() => {
                      void handleSetDefault(account);
                    }}
                  >
                    <Check size={14} className="mr-1.5" />
                    {account.isDefault ? '已默认' : canDefault ? '设为默认' : '待审核'}
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderForm = () => (
    <div className="space-y-4">
      <Card className="border border-border-light p-5">
        <div className="mb-4">
          <div className="text-xs uppercase tracking-[0.2em] text-text-aux">Type</div>
          <div className="mt-2 text-lg font-semibold text-text-main">{formSummary.typeText}</div>
          <div className="mt-1 text-sm text-text-sub">{formSummary.typeDescription}</div>
        </div>

        {isEditing ? (
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-bg-base px-3 py-1 text-sm text-text-main">
              {formSummary.typeText}
            </span>
            <span className="rounded-full bg-bg-base px-3 py-1 text-sm text-text-main">
              {formSummary.ownerText}
            </span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              {PAYMENT_TYPE_OPTIONS.map((option) => {
                const Icon = option.icon;
                const selected = formData.type === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleTypeChange(option.value)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      selected
                        ? 'border-primary-start bg-red-50 dark:bg-red-500/10'
                        : 'border-border-light bg-bg-card active:bg-bg-base'
                    }`}
                  >
                    <div className="mb-3 inline-flex rounded-2xl bg-bg-base p-2 text-text-main">
                      <Icon size={18} />
                    </div>
                    <div className="text-sm font-medium text-text-main">{option.label}</div>
                    <div className="mt-1 text-xs leading-5 text-text-sub">{option.description}</div>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {ACCOUNT_OWNER_OPTIONS.map((option) => {
                const selected = formData.accountType === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleAccountTypeChange(option.value)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      selected
                        ? 'border-primary-start bg-red-50 dark:bg-red-500/10'
                        : 'border-border-light bg-bg-card active:bg-bg-base'
                    }`}
                  >
                    <div className="text-sm font-medium text-text-main">{option.label}</div>
                    <div className="mt-1 text-xs leading-5 text-text-sub">{option.description}</div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </Card>
      {(formData.type === 'bank_card' || formData.type === 'alipay') && realName ? (
        <Card className="border border-blue-200/80 bg-blue-50/60 p-4 dark:border-blue-500/30 dark:bg-blue-500/10">
          <div className="flex items-start gap-3">
            <ShieldCheck size={18} className="mt-0.5 text-blue-600 dark:text-blue-300" />
            <div className="text-sm text-blue-700 dark:text-blue-200">
              当前实名认证姓名为 <span className="font-medium">{realName}</span>，银行卡和支付宝账户名必须与该姓名一致。
            </div>
          </div>
        </Card>
      ) : null}

      <Card className="border border-border-light p-5">
        <div className="space-y-4">
          {showBankNameField ? (
            <div>
              <div className="mb-2 text-sm text-text-sub">银行名称</div>
              <input
                type="text"
                value={formData.bankName}
                onChange={(event) => {
                  setFormData((current) => ({ ...current, bankName: event.target.value }));
                  if (formErrors.bankName) {
                    setFormErrors((current) => ({ ...current, bankName: '' }));
                  }
                }}
                placeholder="请输入银行名称"
                className={fieldClassName}
              />
              {formErrors.bankName ? <div className="mt-2 text-sm text-primary-start">{formErrors.bankName}</div> : null}
            </div>
          ) : null}

          <div>
            <div className="mb-2 text-sm text-text-sub">账户名</div>
            <input
              type="text"
              value={formData.accountName}
              onChange={(event) => {
                setFormData((current) => ({ ...current, accountName: event.target.value }));
                if (formErrors.accountName) {
                  setFormErrors((current) => ({ ...current, accountName: '' }));
                }
              }}
              placeholder="请输入账户名"
              className={fieldClassName}
            />
            {formErrors.accountName ? <div className="mt-2 text-sm text-primary-start">{formErrors.accountName}</div> : null}
          </div>

          <div>
            <div className="mb-2 text-sm text-text-sub">{getAccountNumberLabel(formData.type)}</div>
            <input
              type="text"
              value={formData.accountNumber}
              onChange={(event) => {
                setFormData((current) => ({ ...current, accountNumber: event.target.value }));
                if (formErrors.accountNumber) {
                  setFormErrors((current) => ({ ...current, accountNumber: '' }));
                }
              }}
              placeholder={`请输入${getAccountNumberLabel(formData.type)}`}
              className={fieldClassName}
            />
            {formErrors.accountNumber ? <div className="mt-2 text-sm text-primary-start">{formErrors.accountNumber}</div> : null}
          </div>

          {showBankBranchField ? (
            <div>
              <div className="mb-2 text-sm text-text-sub">开户行</div>
              <input
                type="text"
                value={formData.bankBranch}
                onChange={(event) => {
                  setFormData((current) => ({ ...current, bankBranch: event.target.value }));
                  if (formErrors.bankBranch) {
                    setFormErrors((current) => ({ ...current, bankBranch: '' }));
                  }
                }}
                placeholder="请输入开户行，可选"
                className={fieldClassName}
              />
              {formErrors.bankBranch ? <div className="mt-2 text-sm text-primary-start">{formErrors.bankBranch}</div> : null}
            </div>
          ) : null}

          {showUsdtNetworkField ? (
            <div>
              <div className="mb-2 text-sm text-text-sub">USDT 网络类型</div>
              <div className="grid grid-cols-2 gap-3">
                {USDT_NETWORK_OPTIONS.map((network) => {
                  const selected = formData.bankBranch === network;
                  return (
                    <button
                      key={network}
                      type="button"
                      onClick={() => {
                        setFormData((current) => ({ ...current, bankBranch: network }));
                        if (formErrors.bankBranch) {
                          setFormErrors((current) => ({ ...current, bankBranch: '' }));
                        }
                      }}
                      className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                        selected
                          ? 'border-primary-start bg-red-50 text-primary-start dark:bg-red-500/10'
                          : 'border-border-light bg-bg-card text-text-main active:bg-bg-base'
                      }`}
                    >
                      {network}
                    </button>
                  );
                })}
              </div>
              {formErrors.bankBranch ? <div className="mt-2 text-sm text-primary-start">{formErrors.bankBranch}</div> : null}
            </div>
          ) : null}
        </div>
      </Card>

      {showScreenshotUploader ? (
        <Card className="border border-border-light p-5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={handleScreenshotChange}
          />

          <div className="mb-2 text-sm text-text-sub">
            {formData.type === 'wechat' ? '收款二维码' : '打款截图'}
          </div>

          {screenshotHint ? (
            <div className="mb-3 flex items-start gap-2 rounded-2xl bg-bg-base p-3 text-sm text-text-sub">
              <AlertCircle size={16} className="mt-0.5 shrink-0 text-primary-start" />
              <span>{screenshotHint}</span>
            </div>
          ) : null}

          {visibleScreenshotUrl ? (
            <div className="overflow-hidden rounded-2xl border border-border-light">
              <img
                src={visibleScreenshotUrl}
                alt="Screenshot"
                className="h-48 w-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="flex items-center justify-between px-3 py-3">
                <div className="flex items-center text-sm text-text-sub">
                  {formData.type === 'wechat' ? <QrCode size={16} className="mr-2" /> : <ImagePlus size={16} className="mr-2" />}
                  {formData.screenshotFile ? formData.screenshotFile.name : '已上传图片'}
                </div>
                <button
                  type="button"
                  className="text-sm font-medium text-primary-start"
                  onClick={handleScreenshotPick}
                >
                  重新选择
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleScreenshotPick}
              className="flex h-40 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-border-main bg-bg-base text-text-sub active:bg-red-50/50 dark:active:bg-red-500/10"
            >
              {formData.type === 'wechat' ? <QrCode size={30} className="mb-2" /> : <ImagePlus size={30} className="mb-2" />}
              <span className="text-base font-medium">
                {formData.type === 'wechat' ? '上传收款二维码' : '上传打款截图'}
              </span>
              <span className="mt-1 text-sm text-text-aux">支持 JPG、PNG、WEBP、GIF</span>
            </button>
          )}

          {formErrors.screenshot ? <div className="mt-2 text-sm text-primary-start">{formErrors.screenshot}</div> : null}
        </Card>
      ) : null}

      {isEditing ? (
        <Card className="border border-border-light p-5">
          <button
            type="button"
            onClick={() => {
              void handleDelete();
            }}
            disabled={deleting}
            className="flex h-11 w-full items-center justify-center rounded-full border border-red-200 text-red-600 active:opacity-80 disabled:opacity-50"
          >
            <Trash2 size={16} className="mr-2" />
            {deleting ? '删除中...' : '删除账户'}
          </button>
        </Card>
      ) : null}
    </div>
  );

  if (!isAuthenticated) {
    return (
      <div className="flex h-full flex-1 flex-col overflow-hidden bg-bg-base">
        <PageHeader title="卡号管理" onBack={() => goBackOr('user')} />
        <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-8">
          <EmptyState
            icon={<CreditCard size={46} />}
            message="登录后查看并管理收款账户"
            actionText="去登录"
            actionVariant="primary"
            onAction={() => goTo('login')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-bg-base">
      <PageHeader
        title={pageTitle}
        onBack={handleBack}
        offline={isOffline}
        onRefresh={handleReload}
        rightAction={
          view === 'list' ? (
            <button
              type="button"
              onClick={handleOpenAdd}
              disabled={disableAddButton}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                disableAddButton
                  ? 'bg-bg-base text-text-aux'
                  : 'bg-red-50 text-primary-start active:opacity-70 dark:bg-red-500/10'
              }`}
            >
              新增
            </button>
          ) : null
        }
      />

      <PullToRefreshContainer
        className="flex-1 overflow-y-auto no-scrollbar"
        onRefresh={async () => {
          handleReload();
        }}
        disabled={isOffline}
      >
        <div ref={scrollContainerRef} className="px-4 py-4 pb-28">
          {view === 'list' ? renderList() : renderForm()}
        </div>
      </PullToRefreshContainer>

      {view === 'form' ? (
        <div className="shrink-0 border-t border-border-light bg-bg-card px-4 py-3 pb-safe">
          <Button disabled={saving} onClick={() => void handleSubmit()}>
            {saving ? '保存中...' : isEditing ? '保存修改' : '确认新增'}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export default PaymentAccountsPage;


