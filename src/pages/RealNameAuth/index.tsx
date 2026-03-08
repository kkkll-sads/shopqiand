import type { ChangeEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  Loader2,
  User,
  Wifi,
  XCircle,
} from 'lucide-react';
import { getErrorMessage } from '../../api/core/errors';
import { userApi, uploadApi, type UploadedFile } from '../../api';
import { Card } from '../../components/ui/Card';
import { ErrorState } from '../../components/ui/ErrorState';
import { PageHeader } from '../../components/layout/PageHeader';
import { useRequest } from '../../hooks/useRequest';
import { useAppNavigate } from '../../lib/navigation';

type AuditStatus = 'none' | 'auditing' | 'passed' | 'rejected';
type DocumentStatus = 'idle' | 'uploading' | 'success' | 'error';

interface UploadedDocumentState {
  errorMessage?: string;
  file?: File;
  status: DocumentStatus;
  uploaded?: UploadedFile;
  url: string | null;
}

function createEmptyDocument(): UploadedDocumentState {
  return {
    status: 'idle',
    url: null,
  };
}

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

function revokePreviewUrl(url: string | null) {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

function maskIdCard(idCard: string) {
  if (idCard.length < 8) {
    return idCard;
  }

  return `${idCard.slice(0, 4)} ******** ${idCard.slice(-4)}`;
}

const FACE_AUTH_QUERY_KEYS = ['authToken', 'auth_token'] as const;
const FACE_AUTH_TOKEN_STORAGE_KEY = 'real-name-auth-token';
const FACE_AUTH_URL_STORAGE_KEY = 'real-name-auth-url';
const FACE_AUTH_RESTORED_MESSAGE = '已恢复人脸核身凭证，请确认人脸核身已完成后提交实名认证。';
const FACE_AUTH_CALLBACK_MESSAGE = '已收到人脸核身回跳，请核对资料后提交实名认证。';

interface PersistedFaceAuthState {
  authToken: string;
  authUrl: string;
}

function readPersistedFaceAuthState(): PersistedFaceAuthState {
  if (typeof window === 'undefined') {
    return {
      authToken: '',
      authUrl: '',
    };
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

function consumeFaceAuthTokenFromLocation(): string {
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

  if (authToken) {
    window.history.replaceState(window.history.state, document.title, currentUrl.toString());
  }

  return authToken;
}

function buildFaceAuthRedirectUrl(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  const currentUrl = new URL(window.location.href);

  for (const key of FACE_AUTH_QUERY_KEYS) {
    currentUrl.searchParams.delete(key);
  }

  return currentUrl.toString();
}

export const RealNameAuthPage = () => {
  const { goBack } = useAppNavigate();
  const persistedFaceAuthStateRef = useRef<PersistedFaceAuthState>(readPersistedFaceAuthState());
  const [offline, setOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false,
  );
  const [name, setName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [frontDocument, setFrontDocument] = useState<UploadedDocumentState>(createEmptyDocument);
  const [backDocument, setBackDocument] = useState<UploadedDocumentState>(createEmptyDocument);
  const [auditStatus, setAuditStatus] = useState<AuditStatus>('none');
  const [auditTime, setAuditTime] = useState('');
  const [auditReason, setAuditReason] = useState('');
  const [authToken, setAuthToken] = useState(persistedFaceAuthStateRef.current.authToken);
  const [authUrl, setAuthUrl] = useState(persistedFaceAuthStateRef.current.authUrl);
  const [authMessage, setAuthMessage] = useState(
    persistedFaceAuthStateRef.current.authToken ? FACE_AUTH_RESTORED_MESSAGE : '',
  );
  const [loadingFaceAuth, setLoadingFaceAuth] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  const {
    data: realNameStatus,
    error,
    loading,
    reload,
  } = useRequest((signal) => userApi.getRealNameStatus({ signal }), {
    keepPreviousData: false,
  });

  useEffect(() => {
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const callbackAuthToken = consumeFaceAuthTokenFromLocation();
    if (!callbackAuthToken) {
      return;
    }

    setAuthToken(callbackAuthToken);
    setAuthMessage(FACE_AUTH_CALLBACK_MESSAGE);
  }, []);

  useEffect(() => {
    persistFaceAuthState(authToken, authUrl);
  }, [authToken, authUrl]);

  useEffect(() => {
    if (!realNameStatus) {
      return;
    }

    const nextAuditStatus = mapAuditStatus(realNameStatus.realNameStatus);

    setName(realNameStatus.realName || '');
    setIdNumber(realNameStatus.idCard || '');
    setAuditStatus(nextAuditStatus);
    setAuditTime(realNameStatus.auditTime || '');
    setAuditReason(realNameStatus.auditReason || '');
    setSubmitMessage('');

    if (nextAuditStatus !== 'none') {
      setAuthToken('');
      setAuthUrl('');
      setAuthMessage('');
    }

    setFrontDocument((current) => {
      if (current.url !== realNameStatus.idCardFront) {
        revokePreviewUrl(current.url);
      }

      if (!realNameStatus.idCardFront) {
        return createEmptyDocument();
      }

      return {
        status: 'success',
        url: realNameStatus.idCardFront,
      };
    });

    setBackDocument((current) => {
      if (current.url !== realNameStatus.idCardBack) {
        revokePreviewUrl(current.url);
      }

      if (!realNameStatus.idCardBack) {
        return createEmptyDocument();
      }

      return {
        status: 'success',
        url: realNameStatus.idCardBack,
      };
    });
  }, [realNameStatus]);

  useEffect(() => {
    if (auditStatus !== 'none' || authToken.trim().length === 0) {
      return;
    }

    setAuthMessage((current) => current || FACE_AUTH_RESTORED_MESSAGE);
  }, [auditStatus, authToken]);

  useEffect(() => {
    return () => {
      revokePreviewUrl(frontDocument.url);
      revokePreviewUrl(backDocument.url);
    };
  }, [frontDocument.url, backDocument.url]);

  const isInfoFilled = name.trim().length > 0 && idNumber.trim().length > 0;
  const isUploadFilled =
    frontDocument.status === 'success' && backDocument.status === 'success';
  const canSubmit =
    auditStatus === 'none' &&
    isInfoFilled &&
    isUploadFilled &&
    authToken.trim().length > 0 &&
    !submitting;

  let currentStepIdx = 0;
  if (auditStatus !== 'none') {
    currentStepIdx = 3;
  } else if (authToken) {
    currentStepIdx = 2;
  } else if (isUploadFilled) {
    currentStepIdx = 1;
  }

  const steps = ['填写信息', '上传证件', '人脸核验', '审核结果'];

  const retryFetch = () => {
    void reload().catch(() => undefined);
  };

  const openAuthPage = (url: string) => {
    const openedWindow = window.open(url, '_blank', 'noopener,noreferrer');
    if (!openedWindow) {
      setAuthMessage('浏览器拦截了新窗口，请允许弹窗后重新打开认证页面。');
    }
  };

  const uploadDocument = async (
    file: File,
    side: 'front' | 'back',
  ) => {
    const previewUrl = URL.createObjectURL(file);
    const setDocument = side === 'front' ? setFrontDocument : setBackDocument;

    setDocument((current) => {
      revokePreviewUrl(current.url);
      return {
        errorMessage: undefined,
        file,
        status: 'uploading',
        url: previewUrl,
      };
    });

    try {
      const uploaded = await uploadApi.upload({
        file,
        topic: 'real-name',
      });

      setDocument((current) => {
        if (current.url !== uploaded.url) {
          revokePreviewUrl(current.url);
        }

        return {
          errorMessage: undefined,
          file,
          status: 'success',
          uploaded,
          url: uploaded.url,
        };
      });
    } catch (uploadError) {
      setDocument((current) => ({
        ...current,
        errorMessage: getErrorMessage(uploadError),
        file,
        status: 'error',
        url: current.url || previewUrl,
      }));
    }
  };

  const handleDocumentChange =
    (side: 'front' | 'back') => (event: ChangeEvent<HTMLInputElement>) => {
      const nextFile = event.target.files?.[0];
      if (!nextFile) {
        return;
      }

      void uploadDocument(nextFile, side);
      event.target.value = '';
    };

  const handleRetryUpload = (side: 'front' | 'back') => {
    const document = side === 'front' ? frontDocument : backDocument;
    if (!document.file) {
      return;
    }

    void uploadDocument(document.file, side);
  };

  const handleStartFaceAuth = async () => {
    if (!isInfoFilled) {
      setAuthMessage('请先填写真实姓名和身份证号。');
      return;
    }

    if (!isUploadFilled) {
      setAuthMessage('请先上传身份证正反面。');
      return;
    }

    const redirectUrl = buildFaceAuthRedirectUrl();
    if (!redirectUrl) {
      setAuthMessage('无法生成实名认证回跳地址，请刷新页面后重试。');
      return;
    }

    setLoadingFaceAuth(true);
    setAuthMessage('');
    setSubmitMessage('');

    try {
      const result = await userApi.getH5AuthToken({
        idCard: idNumber.trim(),
        realName: name.trim(),
        redirectUrl,
      });
      setAuthToken(result.authToken);
      setAuthUrl(result.authUrl);
      persistFaceAuthState(result.authToken, result.authUrl);
      setAuthMessage('已获取人脸核身凭证，请在新打开的页面完成认证后回到当前页提交。');

      if (result.authUrl) {
        openAuthPage(result.authUrl);
      }
    } catch (authError) {
      setAuthToken('');
      setAuthUrl('');
      setAuthMessage(getErrorMessage(authError));
    } finally {
      setLoadingFaceAuth(false);
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      return;
    }

    setSubmitting(true);
    setSubmitMessage('');

    try {
      const result = await userApi.submitRealName({
        authToken,
        idCard: idNumber.trim(),
        idCardBack: backDocument.uploaded?.url ?? backDocument.url ?? undefined,
        idCardFront: frontDocument.uploaded?.url ?? frontDocument.url ?? undefined,
        realName: name.trim(),
      });

      const nextStatus = mapAuditStatus(result.realNameStatus);
      setAuditStatus(nextStatus === 'none' ? 'auditing' : nextStatus);
      setAuthToken('');
      setAuthUrl('');
      setAuthMessage('');
      setSubmitMessage('实名认证信息已提交。');

      const latest = await reload().catch(() => undefined);
      if (!latest) {
        setAuditStatus(nextStatus === 'none' ? 'auditing' : nextStatus);
      }
    } catch (submitError) {
      setSubmitMessage(getErrorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  };

  const renderHeader = () => (
    <PageHeader
      title="实名认证"
      onBack={goBack}
      offline={offline}
      onRefresh={retryFetch}
    />
  );

  const renderStepBar = () => (
    <Card className="relative mx-4 mt-4 mb-4 flex items-center justify-between border border-transparent p-4 dark:border-gray-800">
      <div className="absolute top-1/2 left-[12%] right-[12%] z-0 h-px -translate-y-1/2 bg-gray-100 dark:bg-gray-800" />
      {steps.map((step, index) => {
        const isActive = currentStepIdx >= index;
        const isCurrent = currentStepIdx === index;

        return (
          <div
            key={step}
            className="relative z-10 flex flex-col items-center bg-bg-card px-1"
          >
            <div
              className={`mb-1.5 flex h-5 w-5 items-center justify-center rounded-full text-s font-bold transition-colors ${
                isActive
                  ? 'bg-brand-start text-white'
                  : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
              }`}
            >
              {isActive && index < currentStepIdx ? <CheckCircle2 size={12} /> : index + 1}
            </div>
            <span
              className={`text-xs ${
                isCurrent
                  ? 'font-medium text-brand-start'
                  : isActive
                    ? 'text-gray-900 dark:text-gray-100'
                    : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              {step}
            </span>
          </div>
        );
      })}
    </Card>
  );

  const renderSkeleton = () => (
    <div className="space-y-4 p-4">
      <div className="h-20 w-full animate-pulse rounded-2xl bg-white dark:bg-gray-900" />
      <div className="h-40 w-full animate-pulse rounded-2xl bg-white dark:bg-gray-900" />
      <div className="h-48 w-full animate-pulse rounded-2xl bg-white dark:bg-gray-900" />
    </div>
  );

  const renderDocumentCard = (
    title: string,
    document: UploadedDocumentState,
    onPick: () => void,
    onRetry: () => void,
  ) => (
    <button
      type="button"
      onClick={onPick}
      className="relative flex-1 overflow-hidden rounded-xl border border-dashed border-gray-300 bg-gray-50 transition-opacity active:opacity-80 dark:border-gray-600 dark:bg-gray-800"
    >
      <div className="aspect-[1.6/1] w-full">
        {document.url ? (
          <img
            src={document.url}
            className="h-full w-full object-cover"
            alt={title}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center">
            <Camera size={24} className="mb-2 text-gray-400 dark:text-gray-500" />
            <span className="text-sm text-gray-500 dark:text-gray-400">{title}</span>
          </div>
        )}
      </div>

      {document.status === 'uploading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/45 text-white">
          <Loader2 size={20} className="mb-2 animate-spin" />
          <span className="text-sm">上传中...</span>
        </div>
      )}

      {document.status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/55 px-3 text-white">
          <AlertCircle size={18} className="mb-2 text-red-300" />
          <span className="mb-2 text-center text-xs">
            {document.errorMessage || '上传失败'}
          </span>
          <span
            className="rounded bg-white px-2 py-0.5 text-xs text-gray-900"
            onClick={(event) => {
              event.stopPropagation();
              onRetry();
            }}
          >
            重试
          </span>
        </div>
      )}
    </button>
  );

  const renderResult = () => {
    if (auditStatus === 'auditing') {
      return (
        <div className="px-6 pt-16">
          <Card className="flex flex-col items-center p-6 text-center">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-blue-500 dark:bg-blue-900/20">
              <Clock size={40} />
            </div>
            <h2 className="mb-3 text-3xl font-bold text-gray-900 dark:text-gray-100">审核中</h2>
            <p className="mb-3 text-base leading-relaxed text-gray-500 dark:text-gray-400">
              您的实名认证信息已提交，预计 1-3 个工作日内完成审核。
            </p>
            {auditTime && (
              <p className="mb-8 text-sm text-gray-400 dark:text-gray-500">
                提交时间：{auditTime}
              </p>
            )}
            <button
              className="h-[48px] w-full rounded-2xl border border-gray-200 font-medium text-gray-900 transition-colors active:bg-gray-50 dark:border-gray-700 dark:text-gray-100 dark:active:bg-gray-800"
              onClick={goBack}
            >
              返回
            </button>
          </Card>
        </div>
      );
    }

    if (auditStatus === 'passed') {
      return (
        <div className="px-6 pt-16">
          <Card className="flex flex-col items-center p-6 text-center">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-green-50 text-green-600 dark:bg-green-900/20">
              <CheckCircle2 size={40} />
            </div>
            <h2 className="mb-3 text-3xl font-bold text-gray-900 dark:text-gray-100">认证通过</h2>
            <p className="mb-3 text-base leading-relaxed text-gray-500 dark:text-gray-400">
              实名认证已通过，当前账户已具备实名状态。
            </p>
            <div className="mb-8 w-full rounded-xl bg-gray-50 p-4 text-left dark:bg-gray-800">
              <div className="mb-2 text-sm text-gray-500 dark:text-gray-400">真实姓名</div>
              <div className="mb-4 text-base font-medium text-gray-900 dark:text-gray-100">
                {name || '--'}
              </div>
              <div className="mb-2 text-sm text-gray-500 dark:text-gray-400">身份证号</div>
              <div className="text-base font-medium text-gray-900 dark:text-gray-100">
                {maskIdCard(idNumber)}
              </div>
              {auditTime && (
                <>
                  <div className="mt-4 mb-2 text-sm text-gray-500 dark:text-gray-400">
                    审核时间
                  </div>
                  <div className="text-base font-medium text-gray-900 dark:text-gray-100">
                    {auditTime}
                  </div>
                </>
              )}
            </div>
            <button
              className="h-[48px] w-full rounded-2xl bg-gradient-to-r from-brand-start to-brand-end font-medium text-white shadow-sm transition-opacity active:opacity-80"
              onClick={goBack}
            >
              完成
            </button>
          </Card>
        </div>
      );
    }

    if (auditStatus === 'rejected') {
      return (
        <div className="px-6 pt-16">
          <Card className="flex flex-col items-center p-6 text-center">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-brand-start dark:bg-red-900/20">
              <XCircle size={40} />
            </div>
            <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-gray-100">认证驳回</h2>
            <div className="mb-8 w-full rounded-xl border border-gray-100 bg-gray-50 p-4 text-left dark:border-gray-700 dark:bg-gray-800">
              <p className="mb-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                驳回原因
              </p>
              <p className="text-base leading-relaxed text-brand-start">
                {auditReason || '请核对身份证信息与人脸核验信息后重新提交。'}
              </p>
              {auditTime && (
                <p className="mt-3 text-sm text-gray-400 dark:text-gray-500">
                  审核时间：{auditTime}
                </p>
              )}
            </div>
            <button
              className="mb-3 h-[48px] w-full rounded-2xl bg-gradient-to-r from-brand-start to-brand-end font-medium text-white shadow-sm transition-opacity active:opacity-80"
              onClick={() => {
                setAuditStatus('none');
                setAuthToken('');
                setAuthUrl('');
                setAuthMessage('');
                setSubmitMessage('');
              }}
            >
              重新提交
            </button>
            <button
              className="h-[48px] w-full rounded-2xl border border-gray-200 font-medium text-gray-900 transition-colors active:bg-gray-50 dark:border-gray-700 dark:text-gray-100 dark:active:bg-gray-800"
              onClick={goBack}
            >
              返回
            </button>
          </Card>
        </div>
      );
    }

    return null;
  };

  const renderForm = () => (
    <div className="space-y-4 px-4 pb-28">
      <Card className="border border-transparent p-5 dark:border-gray-800">
        <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-gray-100">1. 身份信息</h3>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="请输入真实姓名"
            className="h-12 w-full rounded-2xl border border-transparent bg-gray-50 px-4 text-md text-gray-900 transition-all placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#FF4142] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <input
            type="text"
            placeholder="请输入身份证号"
            className="h-12 w-full rounded-2xl border border-transparent bg-gray-50 px-4 text-md text-gray-900 transition-all placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#FF4142] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            value={idNumber}
            onChange={(event) => setIdNumber(event.target.value)}
          />
          <p className="flex items-center text-sm text-gray-400 dark:text-gray-500">
            <AlertCircle size={12} className="mr-1" />
            请确保填写信息与证件一致
          </p>
        </div>
      </Card>

      <Card className="border border-transparent p-5 dark:border-gray-800">
        <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-gray-100">2. 证件上传</h3>
        <div className="mb-4 flex space-x-3">
          {renderDocumentCard(
            '上传人像面',
            frontDocument,
            () => frontInputRef.current?.click(),
            () => handleRetryUpload('front'),
          )}
          {renderDocumentCard(
            '上传国徽面',
            backDocument,
            () => backInputRef.current?.click(),
            () => handleRetryUpload('back'),
          )}
        </div>
        <input
          ref={frontInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleDocumentChange('front')}
        />
        <input
          ref={backInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleDocumentChange('back')}
        />
        <p className="text-s leading-relaxed text-gray-400 dark:text-gray-500">
          证件图片仅用于实名认证审核，请确保照片清晰、完整、无遮挡。
        </p>
      </Card>

      <Card className="border border-transparent p-5 dark:border-gray-800">
        <div className="mb-2 flex items-center">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">3. 人脸核验</h3>
          <span className="ml-1 text-s text-gray-400 dark:text-gray-500">（H5 人脸核身）</span>
        </div>
        <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
          点击按钮后将打开认证页面，完成后返回当前页面再提交实名信息。
        </p>

        <div className="mb-5 flex justify-around rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/50">
          <div className="flex flex-col items-center">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-600 shadow-sm dark:bg-gray-700 dark:text-gray-400">
              <User size={18} />
            </div>
            <span className="text-s text-gray-500 dark:text-gray-400">保持正脸</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-600 shadow-sm dark:bg-gray-700 dark:text-gray-400">
              <Wifi size={18} />
            </div>
            <span className="text-s text-gray-500 dark:text-gray-400">网络稳定</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-600 shadow-sm dark:bg-gray-700 dark:text-gray-400">
              <Camera size={18} />
            </div>
            <span className="text-s text-gray-500 dark:text-gray-400">光线充足</span>
          </div>
        </div>

        {authToken ? (
          <div className="space-y-3">
            <div className="flex h-[48px] items-center justify-center rounded-2xl border border-green-200 bg-green-50 text-lg font-medium text-green-600 dark:border-green-800/50 dark:bg-green-900/20">
              <CheckCircle2 size={18} className="mr-2" />
              已获取认证凭证
            </div>
            {authUrl && (
              <button
                type="button"
                className="flex h-[44px] w-full items-center justify-center rounded-2xl border border-gray-200 text-base font-medium text-gray-900 transition-colors active:bg-gray-50 dark:border-gray-700 dark:text-gray-100 dark:active:bg-gray-800"
                onClick={() => openAuthPage(authUrl)}
              >
                重新打开认证页面
                <ExternalLink size={14} className="ml-2" />
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            className="flex h-[48px] w-full items-center justify-center rounded-2xl bg-gradient-to-r from-brand-start to-brand-end text-lg font-medium text-white shadow-sm transition-opacity active:opacity-80"
            onClick={handleStartFaceAuth}
            disabled={loadingFaceAuth}
          >
            {loadingFaceAuth ? (
              <>
                <Loader2 size={18} className="mr-2 animate-spin" />
                获取中...
              </>
            ) : (
              '开始人脸核验'
            )}
          </button>
        )}

        {authMessage && (
          <p className="mt-4 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
            {authMessage}
          </p>
        )}

        <div className="mt-4 text-center">
          <button className="flex w-full items-center justify-center text-sm text-gray-400 transition-colors active:text-gray-600 dark:text-gray-500 dark:active:text-gray-300">
            核验遇到问题？
            <ChevronRight size={12} />
          </button>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="relative flex h-full flex-1 flex-col overflow-hidden bg-[#FFF8F8] dark:bg-gray-950">
      {renderHeader()}

      <div className="relative flex-1 overflow-y-auto no-scrollbar">
        {loading ? (
          renderSkeleton()
        ) : error ? (
          <ErrorState message={getErrorMessage(error)} onRetry={retryFetch} />
        ) : (
          <>
            {renderStepBar()}
            {auditStatus === 'none' ? renderForm() : renderResult()}
          </>
        )}
      </div>

      {auditStatus === 'none' && !loading && !error && (
        <div className="absolute right-0 bottom-0 left-0 z-40 border-t border-gray-100 bg-white px-4 py-3 pb-safe dark:border-gray-800 dark:bg-gray-900">
          {submitMessage && (
            <p className="mb-2 text-sm text-brand-start dark:text-red-400">{submitMessage}</p>
          )}
          <button
            className={`h-[48px] w-full rounded-2xl text-lg font-medium transition-all ${
              canSubmit
                ? 'bg-gradient-to-r from-brand-start to-brand-end text-white shadow-sm active:opacity-80'
                : 'cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
            }`}
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {submitting ? (
              <span className="inline-flex items-center">
                <Loader2 size={18} className="mr-2 animate-spin" />
                提交中...
              </span>
            ) : (
              '提交审核'
            )}
          </button>
        </div>
      )}
    </div>
  );
};
