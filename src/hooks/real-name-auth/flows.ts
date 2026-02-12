import { getStoredToken } from '@/services/client';
import { debugLog, errorLog } from '@/utils/logger';
import { withErrorHandling, extractErrorFromException } from '@/utils/apiHelpers';
import { RealNameStatus } from '@/constants/statusEnums';
import { useAuthStore } from '@/stores/authStore';
import {
  fetchRealNameStatus,
  submitRealName,
  fetchH5AuthToken,
  h5Recheck,
} from '@/services';
import {
  parseCallbackSuccess,
  savePendingCallback,
  readPendingCallback,
  clearPendingCallback,
  type PendingRealNameCallback,
} from './callbackPersistence';
import { getErrorMsgByCode, getErrorMsgByStatus } from './errorMessages';
import { RealNameEvent, type RealNameContext } from './state';

type SendEvent = (event: RealNameEvent, payload?: Partial<RealNameContext>) => void;
type ShowToast = (type: 'success' | 'error' | 'warning', title: string, message?: string) => void;
type SetContext = (updater: (prev: RealNameContext) => RealNameContext) => void;

export const handleInitialRealNameLoad = (send: SendEvent) => {
  const urlParams = new URLSearchParams(window.location.search);
  const authToken = urlParams.get('authToken') || urlParams.get('auth_token');

  if (authToken) {
    const callbackPayload: PendingRealNameCallback = {
      authToken,
      callbackCode: urlParams.get('code'),
      callbackSuccess: parseCallbackSuccess(urlParams.get('success')),
      createdAt: Date.now(),
    };

    savePendingCallback(callbackPayload);
    window.history.replaceState({}, '', window.location.pathname);

    send(RealNameEvent.VERIFY_CALLBACK, {
      authToken: callbackPayload.authToken,
      callbackCode: callbackPayload.callbackCode,
      callbackSuccess: callbackPayload.callbackSuccess,
    });
    return;
  }

  const pendingCallback = readPendingCallback();
  if (pendingCallback) {
    send(RealNameEvent.VERIFY_CALLBACK, {
      authToken: pendingCallback.authToken,
      callbackCode: pendingCallback.callbackCode,
      callbackSuccess: pendingCallback.callbackSuccess,
    });
    return;
  }

  send(RealNameEvent.LOAD);
};

export const loadRealNameStatusFlow = async (send: SendEvent) => {
  const token = getStoredToken() || '';
  if (!token) {
    send(RealNameEvent.LOAD_ERROR, {
      error: '未找到登录信息，请先登录',
    });
    return;
  }

  try {
    const data = await withErrorHandling(
      () => fetchRealNameStatus(token),
      (errorMsg) => send(RealNameEvent.LOAD_ERROR, { error: errorMsg })
    );

    if (!data) return;

    if (data.real_name_status === RealNameStatus.APPROVED) {
      clearPendingCallback();
      useAuthStore.getState().setRealNameVerified(true, data.real_name || '');
      send(RealNameEvent.LOAD_SUCCESS_VERIFIED, {
        status: data,
        realName: data.real_name || '',
        idCard: data.id_card || '',
      });
      return;
    }

    if (data.real_name_status === RealNameStatus.PENDING) {
      clearPendingCallback();
      send(RealNameEvent.LOAD_SUCCESS_PENDING, {
        status: data,
      });
      return;
    }

    send(RealNameEvent.LOAD_SUCCESS_FORM, {
      status: data,
      realName: data.real_name || '',
      idCard: data.id_card || '',
    });
  } catch (error: unknown) {
    const errorMsg = extractErrorFromException(error, '获取实名认证状态失败，请稍后重试');
    send(RealNameEvent.LOAD_ERROR, { error: errorMsg });
  }
};

export const verifyAuthCallbackFlow = async (
  context: RealNameContext,
  send: SendEvent,
  showToast: ShowToast
) => {
  const token = getStoredToken() || '';
  if (!token) {
    send(RealNameEvent.VERIFY_ERROR, {
      error: '未找到登录信息，请先登录',
    });
    return;
  }

  if (context.callbackCode && context.callbackCode !== '0') {
    const errorMsg = getErrorMsgByCode(context.callbackCode);
    showToast('error', '核身失败', errorMsg);
    clearPendingCallback();
    send(RealNameEvent.VERIFY_ERROR, { error: errorMsg });
    return;
  }

  if (context.callbackSuccess === false) {
    const errorMsg = '人脸核身验证失败，请重试';
    showToast('error', '核身失败', errorMsg);
    clearPendingCallback();
    send(RealNameEvent.VERIFY_ERROR, { error: errorMsg });
    return;
  }

  if (!context.authToken) {
    clearPendingCallback();
    send(RealNameEvent.VERIFY_ERROR, {
      error: 'authToken缺失',
    });
    return;
  }

  try {
    const result = await withErrorHandling(
      () => h5Recheck({ authToken: context.authToken!, token }),
      (errorMsg) => {
        showToast('error', '核身失败', errorMsg);
        send(RealNameEvent.VERIFY_ERROR, { error: errorMsg });
      }
    );

    if (!result) return;

    debugLog('useRealNameAuth', '核身结果检查', {
      status: result.status,
      faceMatched: result.faceMatched,
      reasonTypeDesc: result.reasonTypeDesc,
      statusDesc: result.statusDesc,
    });

    if (result.status === 1 && result.faceMatched === 1) {
      debugLog('useRealNameAuth', '核身验证通过，准备提交实名认证');
      send(RealNameEvent.VERIFY_SUCCESS);
      return;
    }

    const errorMsg =
      result.reasonTypeDesc ||
      result.statusDesc ||
      getErrorMsgByStatus(result.status, result.reasonType);
    showToast('error', '核身失败', errorMsg);
    clearPendingCallback();
    send(RealNameEvent.VERIFY_ERROR, { error: errorMsg });
  } catch (error: unknown) {
    const errorMsg = extractErrorFromException(error, '处理核身结果失败，请稍后重试');
    showToast('error', '处理失败', errorMsg);
    send(RealNameEvent.VERIFY_ERROR, { error: errorMsg });
  }
};

export const submitRealNameWithAuthTokenFlow = async (
  context: RealNameContext,
  send: SendEvent,
  showToast: ShowToast
) => {
  debugLog('useRealNameAuth', 'submitRealNameWithAuthToken 被调用');
  const token = getStoredToken() || '';

  if (!context.authToken) {
    const errorMsg = 'auth_token 参数缺失，请重新进行人脸核身验证';
    errorLog('useRealNameAuth', 'submitRealNameWithAuthToken 失败', errorMsg);
    showToast('error', '提交失败', errorMsg);
    clearPendingCallback();
    send(RealNameEvent.SUBMIT_ERROR, {
      error: errorMsg,
    });
    return;
  }

  if (!token) {
    const errorMsg = '用户登录信息缺失，请重新登录';
    showToast('error', '提交失败', errorMsg);
    send(RealNameEvent.SUBMIT_ERROR, {
      error: errorMsg,
    });
    return;
  }

  try {
    const result = await withErrorHandling(
      () => submitRealName({ auth_token: context.authToken!, token }),
      (errorMsg) => {
        showToast('error', '提交失败', errorMsg);
        send(RealNameEvent.SUBMIT_ERROR, { error: errorMsg });
      }
    );

    if (!result) return;

    showToast('success', '提交成功', '实名认证提交成功');
    useAuthStore.getState().setRealNameVerified(true, context.realName);
    clearPendingCallback();
    send(RealNameEvent.SUBMIT_SUCCESS);
  } catch (error: unknown) {
    const errorMsg = extractErrorFromException(error, '提交实名认证失败，请稍后重试');
    showToast('error', '提交失败', errorMsg);
    send(RealNameEvent.SUBMIT_ERROR, { error: errorMsg });
  }
};

export const submitRealNameFormFlow = async (
  context: RealNameContext,
  send: SendEvent,
  setContext: SetContext,
  showToast: ShowToast
) => {
  if (!context.realName?.trim()) {
    setContext((prev) => ({ ...prev, error: '请输入真实姓名' }));
    showToast('warning', '请输入真实姓名');
    return;
  }

  if (!context.idCard?.trim()) {
    setContext((prev) => ({ ...prev, error: '请输入身份证号码' }));
    showToast('warning', '请输入身份证号码');
    return;
  }

  const token = getStoredToken() || '';
  if (!token) {
    setContext((prev) => ({ ...prev, error: '未找到登录信息，请先登录' }));
    showToast('error', '登录信息缺失');
    return;
  }

  try {
    setContext((prev) => ({ ...prev, error: null }));
    send(RealNameEvent.SUBMIT);

    const redirectUrl = `${window.location.origin}${window.location.pathname}`;

    const data = await withErrorHandling(
      () =>
        fetchH5AuthToken({
          real_name: context.realName.trim(),
          id_card: context.idCard.trim(),
          redirect_url: redirectUrl,
          token,
        }),
      (errorMsg) => {
        showToast('error', '获取认证地址失败', errorMsg);
        setContext((prev) => ({ ...prev, error: errorMsg }));
      }
    );

    if (!data?.authUrl) {
      const errorMsg = '获取认证地址失败，返回数据为空';
      setContext((prev) => ({ ...prev, error: errorMsg }));
      showToast('error', '获取认证地址失败', errorMsg);
      return;
    }

    window.location.href = data.authUrl;
  } catch (error: unknown) {
    const errorMsg = extractErrorFromException(error, '获取认证地址失败，请稍后重试');
    setContext((prev) => ({ ...prev, error: errorMsg }));
    showToast('error', '网络错误', errorMsg);
  }
};
