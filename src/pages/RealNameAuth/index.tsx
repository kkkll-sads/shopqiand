/**
 * @file RealNameAuth/index.tsx - 实名认证页面
 * @description 用户实名认证页面，提交身份证信息进行身份验证。
 */

import { useEffect, useMemo, useRef, useState } from 'react'; // React 核心 Hook
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Loader2,
  ScanFace,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { userApi } from '../../api';
import { getErrorMessage } from '../../api/core/errors';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Skeleton } from '../../components/ui/Skeleton';
import { PullToRefreshContainer } from '../../components/ui/PullToRefreshContainer';
import { useAuthSession } from '../../hooks/useAuthSession';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useRequest } from '../../hooks/useRequest';
import { useAppNavigate } from '../../lib/navigation';

type AuditStatus = 'none' | 'auditing' | 'passed' | 'rejected';

const FACE_AUTH_QUERY_KEYS = ['authToken', 'auth_token'] as const;
const FACE_AUTH_TOKEN_STORAGE_KEY = 'real-name-auth-token';
const FACE_AUTH_URL_STORAGE_KEY = 'real-name-auth-url';

function mapAuditStatus(value: number | undefined): AuditStatus {
  switch (value) {
    case 1:
      return 'auditing';
    case 2:
      return 'passed';
    case 3:
      return 'rejected';
    default:
      return 'none';
  }
}

function maskIdCard(idCard: string) {
  if (idCard.length < 8) {
    return idCard;
  }

  return `${idCard.slice(0, 4)} ******** ${idCard.slice(-4)}`;
}

function isValidChineseIdCard(idCard: string) {
  return /^(?:\d{15}|\d{17}[\dXx])$/.test(idCard);
}

function readPersistedFaceAuthState() {
  if (typeof window === 'undefined') {
    return { authToken: '', authUrl: '' };
  }

  return {
    authToken: window.sessionStorage.getItem(FACE_AUTH_TOKEN_STORAGE_KEY)?.trim() ?? '',
    authUrl: window.sessionStorage.getItem(FACE_AUTH_URL_STORAGE_KEY)?.trim() ?? '',
  };
}

function persistFaceAuthState(authToken: string, authUrl: string) {
  if (typeof window === 'undefined') {
    return;
  }

  if (authToken) {
    window.sessionStorage.setItem(FACE_AUTH_TOKEN_STORAGE_KEY, authToken);
  } else {
    window.sessionStorage.removeItem(FACE_AUTH_TOKEN_STORAGE_KEY);
  }

  if (authUrl) {
    window.sessionStorage.setItem(FACE_AUTH_URL_STORAGE_KEY, authUrl);
  } else {
    window.sessionStorage.removeItem(FACE_AUTH_URL_STORAGE_KEY);
  }
}

function splitHashPathAndQuery(hash: string) {
  const normalizedHash = hash.startsWith('#') ? hash.slice(1) : hash;
  const [path, query = ''] = normalizedHash.split('?');
  return {
    path,
    params: new URLSearchParams(query),
  };
}

function consumeFaceAuthTokenFromLocation() {
  if (typeof window === 'undefined') {
    return '';
  }

  const currentUrl = new URL(window.location.href);
  let authToken = '';

  for (const key of FACE_AUTH_QUERY_KEYS) {
    const nextValue = currentUrl.searchParams.get(key)?.trim() ?? '';
    if (!nextValue) {
      continue;
    }

    authToken = nextValue;
    currentUrl.searchParams.delete(key);
  }

  const hashState = splitHashPathAndQuery(currentUrl.hash);
  for (const key of FACE_AUTH_QUERY_KEYS) {
    const nextValue = hashState.params.get(key)?.trim() ?? '';
    if (!nextValue) {
      continue;
    }

    authToken = nextValue;
    hashState.params.delete(key);
  }

  const nextHashQuery = hashState.params.toString();
  currentUrl.hash = nextHashQuery ? `${hashState.path}?${nextHashQuery}` : hashState.path;

  if (authToken) {
    window.history.replaceState(window.history.state, document.title, currentUrl.toString());
  }

  return authToken;
}

function buildFaceAuthRedirectUrl() {
  if (typeof window === 'undefined') {
    return '';
  }

  const currentUrl = new URL(window.location.href);
  for (const key of FACE_AUTH_QUERY_KEYS) {
    currentUrl.searchParams.delete(key);
  }

  const hashState = splitHashPathAndQuery(currentUrl.hash);
  for (const key of FACE_AUTH_QUERY_KEYS) {
    hashState.params.delete(key);
  }

  const nextHashQuery = hashState.params.toString();
  currentUrl.hash = nextHashQuery ? `${hashState.path}?${nextHashQuery}` : hashState.path;
  return currentUrl.toString();
}

export const RealNameAuthPage = () => {
  const { goBack, goTo } = useAppNavigate();
  const { isAuthenticated } = useAuthSession();
  const { isOffline, refreshStatus } = useNetworkStatus();
  const persistedFaceAuthState = readPersistedFaceAuthState();
  const autoSubmittedTokenRef = useRef('');
  const [name, setName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [auditStatus, setAuditStatus] = useState<AuditStatus>('none');
  const [auditTime, setAuditTime] = useState('');
  const [auditReason, setAuditReason] = useState('');
  const [authToken, setAuthToken] = useState(persistedFaceAuthState.authToken);
  const [authUrl, setAuthUrl] = useState(persistedFaceAuthState.authUrl);
  const [authMessage, setAuthMessage] = useState(
    persistedFaceAuthState.authToken ? '已恢复人脸核身凭证，等待自动提交审核。' : '',
  );
  const [submitError, setSubmitError] = useState('');
  const [loadingFaceAuth, setLoadingFaceAuth] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    data: realNameStatus,
    error,
    loading,
    reload,
  } = useRequest((signal) => userApi.getRealNameStatus({ signal }), {
    manual: !isAuthenticated,
  });

  useEffect(() => {
    const callbackAuthToken = consumeFaceAuthTokenFromLocation();
    if (!callbackAuthToken) {
      return;
    }

    setAuthToken(callbackAuthToken);
    setAuthMessage('已收到人脸核身回跳，正在准备自动提交审核。');
  }, []);

  useEffect(() => {
    persistFaceAuthState(authToken, authUrl);
  }, [authToken, authUrl]);

  useEffect(() => {
    if (!realNameStatus) {
      return;
    }

    const nextStatus = mapAuditStatus(realNameStatus.realNameStatus);
    setName(realNameStatus.realName || '');
    setIdNumber(realNameStatus.idCard || '');
    setAuditStatus(nextStatus);
    setAuditTime(realNameStatus.auditTime || '');
    setAuditReason(realNameStatus.auditReason || '');
    setSubmitError('');

    if (nextStatus !== 'none' && nextStatus !== 'rejected') {
      setAuthToken('');
      setAuthUrl('');
      setAuthMessage('');
      autoSubmittedTokenRef.current = '';
    }
  }, [realNameStatus]);

  const formError = useMemo(() => {
    const trimmedName = name.trim();
    const trimmedId = idNumber.trim();

    if (!trimmedName) {
      return '请输入真实姓名';
    }

    if (trimmedName.length < 2) {
      return '姓名至少 2 个字符';
    }

    if (!trimmedId) {
      return '请输入身份证号';
    }

    if (!isValidChineseIdCard(trimmedId)) {
      return '身份证号格式不正确';
    }

    return '';
  }, [idNumber, name]);

  const canEdit = auditStatus === 'none' || auditStatus === 'rejected';
  const canSubmit =
    isAuthenticated && canEdit && !formError && !!authToken.trim() && !loadingFaceAuth && !submitting;

  const handleRetry = () => {
    refreshStatus();
    void reload().catch(() => undefined);
  };

  const openAuthPage = (url: string) => {
    const openedWindow = window.open(url, '_blank', 'noopener,noreferrer');
    if (!openedWindow) {
      setAuthMessage('浏览器拦截了新窗口，请允许弹窗后重试。');
    }
  };

  const handleSubmit = async (mode: 'manual' | 'auto' = 'manual') => {
    if (!canSubmit) {
      if (mode === 'manual') {
        setSubmitError(formError || '请先完成人脸核身');
      }
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      const result = await userApi.submitRealName({
        authToken,
        idCard: idNumber.trim(),
        realName: name.trim(),
      });

      const reloadedStatus = await reload().catch(() => undefined);
      const nextStatus = mapAuditStatus(reloadedStatus?.realNameStatus ?? result.realNameStatus);
      setAuditStatus(nextStatus === 'none' ? 'passed' : nextStatus);
    } catch (submitErr) {
      setSubmitError(getErrorMessage(submitErr));
      if (mode === 'auto') {
        setAuthMessage('已收到回跳 token，但自动提交失败，请手动重试。');
      }
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const trimmedToken = authToken.trim();
    if (!trimmedToken || !canEdit || !!formError || submitting || loadingFaceAuth) {
      return;
    }

    if (autoSubmittedTokenRef.current === trimmedToken) {
      return;
    }

    autoSubmittedTokenRef.current = trimmedToken;
    void handleSubmit('auto');
  }, [authToken, canEdit, formError, loadingFaceAuth, submitting]);

  const handleStartFaceAuth = async () => {
    if (formError) {
      setAuthMessage(formError);
      return;
    }

    const redirectUrl = buildFaceAuthRedirectUrl();
    if (!redirectUrl) {
      setAuthMessage('无法生成回跳地址，请刷新页面后重试。');
      return;
    }

    setLoadingFaceAuth(true);
    setSubmitError('');
    setAuthMessage('');
    autoSubmittedTokenRef.current = '';

    try {
      const result = await userApi.getH5AuthToken({
        idCard: idNumber.trim(),
        realName: name.trim(),
        redirectUrl,
      });

      setAuthToken('');
      setAuthUrl(result.authUrl);
      setAuthMessage('人脸核身链接已生成，完成核身后会自动回填 token 并提交。');

      if (result.authUrl) {
        openAuthPage(result.authUrl);
      }
    } catch (authErr) {
      setAuthToken('');
      setAuthUrl('');
      setAuthMessage(getErrorMessage(authErr));
    } finally {
      setLoadingFaceAuth(false);
    }
  };

  const renderLoading = () => (
    <div className="space-y-4 px-4 py-4">
      <Card className="border border-border-light p-5">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="mt-4 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-2/3" />
      </Card>
      <Card className="border border-border-light p-5">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="mt-4 h-12 w-full rounded-2xl" />
        <Skeleton className="mt-4 h-12 w-full rounded-2xl" />
        <Skeleton className="mt-4 h-20 w-full rounded-2xl" />
      </Card>
    </div>
  );

  const renderStatusCard = () => {
    if (auditStatus === 'passed') {
      return (
        <Card className="mx-4 mt-4 border border-emerald-200/80 p-5 dark:border-emerald-900/60">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300">
              <CheckCircle2 size={24} />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-text-main">实名认证已通过</h2>
              <p className="mt-1 text-sm text-text-sub">当前账户已具备实名状态。</p>
              <div className="mt-4 rounded-2xl bg-bg-base p-4">
                <div className="text-xs text-text-aux">真实姓名</div>
                <div className="mt-1 text-sm font-medium text-text-main">{name || '--'}</div>
                <div className="mt-3 text-xs text-text-aux">身份证号</div>
                <div className="mt-1 text-sm font-medium text-text-main">{maskIdCard(idNumber)}</div>
                {auditTime ? (
                  <>
                    <div className="mt-3 text-xs text-text-aux">审核时间</div>
                    <div className="mt-1 text-sm font-medium text-text-main">{auditTime}</div>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </Card>
      );
    }

    if (auditStatus === 'auditing') {
      return (
        <Card className="mx-4 mt-4 border border-blue-200/80 p-5 dark:border-blue-900/60">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
              <Clock3 size={24} />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-text-main">实名认证审核中</h2>
              <p className="mt-1 text-sm text-text-sub">资料已提交，请等待平台审核结果。</p>
            </div>
          </div>
        </Card>
      );
    }

    if (auditStatus === 'rejected') {
      return (
        <Card className="mx-4 mt-4 border border-red-200/80 p-5 dark:border-red-900/60">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-500 dark:bg-red-950/40 dark:text-red-300">
              <XCircle size={24} />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-text-main">实名认证未通过</h2>
              <p className="mt-1 text-sm text-text-sub">请根据驳回原因修改资料后重新提交。</p>
              <div className="mt-4 rounded-2xl bg-bg-base p-4">
                <div className="text-xs text-text-aux">驳回原因</div>
                <div className="mt-1 text-sm font-medium text-red-500 dark:text-red-300">
                  {auditReason || '请核对姓名和身份证号后重新发起认证'}
                </div>
              </div>
            </div>
          </div>
        </Card>
      );
    }

    return (
      <Card className="mx-4 mt-4 border border-orange-200/80 p-5 dark:border-orange-900/60">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-500 dark:bg-orange-950/40 dark:text-orange-300">
            <ShieldCheck size={24} />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-text-main">填写身份信息并完成人脸核身</h2>
            <p className="mt-1 text-sm text-text-sub">
              流程：填写身份信息，发起人脸核身，回跳后自动提交审核。
            </p>
          </div>
        </div>
      </Card>
    );
  };

  const renderForm = () => {
    if (!canEdit) {
      return null;
    }

    return (
      <div className="mx-4 mt-4 mb-28 space-y-4">
        <Card className="border border-border-light p-5">
          <h3 className="text-base font-semibold text-text-main">身份信息</h3>

          <div className="mt-4 space-y-4">
            <div>
              <div className="mb-2 text-sm text-text-sub">真实姓名</div>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="请输入真实姓名"
                className="h-12 w-full rounded-2xl border border-border-light bg-bg-base px-4 text-lg text-text-main outline-none transition-colors placeholder:text-text-aux focus:border-orange-400"
              />
            </div>

            <div>
              <div className="mb-2 text-sm text-text-sub">身份证号</div>
              <input
                type="text"
                value={idNumber}
                onChange={(event) =>
                  setIdNumber(event.target.value.replace(/\s+/g, '').toUpperCase())
                }
                placeholder="请输入身份证号"
                className="h-12 w-full rounded-2xl border border-border-light bg-bg-base px-4 text-lg text-text-main outline-none transition-colors placeholder:text-text-aux focus:border-orange-400"
              />
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-2xl bg-bg-base p-4 text-sm text-text-sub">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-orange-500" />
            <div>
              <div>请确保填写信息与身份证一致。</div>
              <div className="mt-1">修改姓名或身份证号后，应重新发起人脸核身。</div>
            </div>
          </div>
        </Card>

        <Card className="border border-border-light p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-text-main">人脸核身</h3>
              <p className="mt-1 text-sm text-text-sub">
                完成核身后会自动回到当前页，并自动提交审核。
              </p>
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-bg-base text-orange-500">
              <ScanFace size={22} />
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div className="rounded-2xl bg-bg-base p-4 text-sm text-text-sub">
              {authToken
                ? '已收到回跳 token，正在自动提交。'
                : authUrl
                  ? '核身链接已生成，请在新页面完成认证。'
                  : '尚未发起人脸核身。'}
            </div>

            <button
              type="button"
              onClick={handleStartFaceAuth}
              disabled={loadingFaceAuth || submitting}
              className="flex h-12 w-full items-center justify-center rounded-2xl border border-border-main bg-bg-card text-sm font-medium text-text-main transition-colors active:bg-bg-base disabled:cursor-not-allowed disabled:text-text-aux"
            >
              {loadingFaceAuth ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  获取中...
                </>
              ) : (
                '开始人脸核身'
              )}
            </button>

            {authUrl ? (
              <button
                type="button"
                onClick={() => openAuthPage(authUrl)}
                className="flex h-11 w-full items-center justify-center rounded-2xl text-sm text-text-sub transition-colors active:text-text-main"
              >
                打开核身页面
                <ExternalLink size={14} className="ml-2" />
              </button>
            ) : null}

            {authMessage ? <div className="text-sm text-text-sub">{authMessage}</div> : null}
            {submitError ? <div className="text-sm text-red-500 dark:text-red-300">{submitError}</div> : null}
          </div>
        </Card>
      </div>
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="flex h-full flex-1 flex-col overflow-hidden bg-bg-base">
        <PageHeader title="实名认证" onBack={goBack} />
        <EmptyState
          icon={<ShieldCheck size={48} />}
          message="登录后查看并提交实名认证信息"
          actionText="去登录"
          actionVariant="primary"
          onAction={() => goTo('login')}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-bg-base">
      <PageHeader title="实名认证" onBack={goBack} offline={isOffline} onRefresh={handleRetry} />

      <PullToRefreshContainer
        className="flex-1 overflow-y-auto no-scrollbar"
        onRefresh={async () => {
          handleRetry();
        }}
        disabled={isOffline}
      >
        <div className="pb-6">
          {loading ? (
            renderLoading()
          ) : error ? (
            <div className="px-4 py-6">
              <ErrorState message={getErrorMessage(error)} onRetry={handleRetry} />
            </div>
          ) : (
            <>
              {renderStatusCard()}
              {renderForm()}
            </>
          )}
        </div>
      </PullToRefreshContainer>

      {canEdit && !loading && !error ? (
        <div className="shrink-0 border-t border-border-light bg-bg-card px-4 py-3 pb-safe">
          <button
            type="button"
            onClick={() => void handleSubmit('manual')}
            disabled={!canSubmit}
            className={`h-12 w-full rounded-2xl text-sm font-medium transition-all ${
              canSubmit
                ? 'bg-gradient-to-r from-brand-start to-brand-end text-white shadow-sm active:opacity-80'
                : 'cursor-not-allowed bg-bg-hover text-text-aux'
            }`}
          >
            {submitting ? '提交中...' : '手动提交审核'}
          </button>
        </div>
      ) : null}
    </div>
  );
};


