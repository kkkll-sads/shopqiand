/**
 * useRealNameAuth - 实名认证业务 Hook
 *
 * 功能说明：
 * - 封装实名认证的完整状态管理逻辑
 * - 使用状态机模式确保状态互斥
 * - 处理H5核身回调
 * - 统一错误处理
 *
 * @author 树交所前端团队
 * @version 1.0.0
 * @created 2025-12-29
 */

import { useEffect } from 'react';
import { useNotification } from '@/context/NotificationContext';
import { useStateMachine } from './useStateMachine';
import { debugLog, errorLog, warnLog } from '@/utils/logger';
import {
  fetchRealNameStatus,
  RealNameStatusData,
  submitRealName,
  fetchH5AuthToken,
  h5Recheck,
  H5RecheckResult,
} from '@/services';
import { getStoredToken } from '@/services/client';
import { withErrorHandling, extractError } from '@/utils/apiHelpers';
import { RealNameStatus } from '@/constants/statusEnums';
import { useAuthStore } from '@/stores/authStore';

/**
 * 实名认证状态枚举
 */
export enum RealNameState {
  IDLE = 'idle',              // 初始状态
  LOADING = 'loading',        // 加载实名认证状态
  FORM = 'form',              // 显示表单（未认证）
  VERIFYING = 'verifying',    // 跳转H5核身中
  PROCESSING = 'processing',  // 处理核身结果
  SUBMITTING = 'submitting',  // 提交实名认证
  SUCCESS = 'success',        // 已通过实名认证
  PENDING = 'pending',        // 审核中
  ERROR = 'error',            // 错误状态
}

/**
 * 实名认证事件枚举
 */
export enum RealNameEvent {
  LOAD = 'LOAD',
  LOAD_SUCCESS_VERIFIED = 'LOAD_SUCCESS_VERIFIED',
  LOAD_SUCCESS_PENDING = 'LOAD_SUCCESS_PENDING',
  LOAD_SUCCESS_FORM = 'LOAD_SUCCESS_FORM',
  LOAD_ERROR = 'LOAD_ERROR',
  SUBMIT = 'SUBMIT',
  VERIFY_CALLBACK = 'VERIFY_CALLBACK',
  VERIFY_SUCCESS = 'VERIFY_SUCCESS',
  VERIFY_ERROR = 'VERIFY_ERROR',
  SUBMIT_SUCCESS = 'SUBMIT_SUCCESS',
  SUBMIT_ERROR = 'SUBMIT_ERROR',
  RETRY = 'RETRY',
  RETRY_LOAD = 'RETRY_LOAD',
}

/**
 * 实名认证上下文数据
 */
interface RealNameContext {
  /** API返回的状态数据 */
  status: RealNameStatusData | null;
  /** 错误信息 */
  error: string | null;
  /** 真实姓名 */
  realName: string;
  /** 身份证号 */
  idCard: string;
  /** H5核身authToken */
  authToken: string | null;
  /** 核身回调code */
  callbackCode: string | null;
  /** 核身回调success */
  callbackSuccess: boolean | null;
}

interface PendingRealNameCallback {
  authToken: string;
  callbackCode: string | null;
  callbackSuccess: boolean | null;
  createdAt: number;
}

const REAL_NAME_CALLBACK_STORAGE_KEY = 'real_name_h5_callback_pending';
const REAL_NAME_CALLBACK_MAX_AGE_MS = 30 * 60 * 1000;

/**
 * 状态转换表
 */
const REAL_NAME_TRANSITIONS: Record<
  RealNameState,
  Partial<Record<RealNameEvent, RealNameState>>
> = {
  [RealNameState.IDLE]: {
    [RealNameEvent.LOAD]: RealNameState.LOADING,
    [RealNameEvent.VERIFY_CALLBACK]: RealNameState.PROCESSING,
  },
  [RealNameState.LOADING]: {
    [RealNameEvent.LOAD_SUCCESS_VERIFIED]: RealNameState.SUCCESS,
    [RealNameEvent.LOAD_SUCCESS_PENDING]: RealNameState.PENDING,
    [RealNameEvent.LOAD_SUCCESS_FORM]: RealNameState.FORM,
    [RealNameEvent.LOAD_ERROR]: RealNameState.ERROR,
  },
  [RealNameState.FORM]: {
    [RealNameEvent.SUBMIT]: RealNameState.VERIFYING,
  },
  [RealNameState.VERIFYING]: {
    // 跳转到H5页面，不在这里转换
  },
  [RealNameState.PROCESSING]: {
    [RealNameEvent.VERIFY_SUCCESS]: RealNameState.SUBMITTING,
    [RealNameEvent.VERIFY_ERROR]: RealNameState.ERROR,
  },
  [RealNameState.SUBMITTING]: {
    [RealNameEvent.SUBMIT_SUCCESS]: RealNameState.SUCCESS,
    [RealNameEvent.SUBMIT_ERROR]: RealNameState.ERROR,
  },
  [RealNameState.SUCCESS]: {},
  [RealNameState.PENDING]: {},
  [RealNameState.ERROR]: {
    [RealNameEvent.RETRY]: RealNameState.FORM,
    [RealNameEvent.RETRY_LOAD]: RealNameState.LOADING,
  },
};

/**
 * useRealNameAuth Hook返回值
 */
interface UseRealNameAuthReturn {
  /** 当前状态 */
  state: RealNameState;
  /** 上下文数据 */
  context: RealNameContext;
  /** 是否可以提交 */
  canSubmit: boolean;
  /** 是否正在加载 */
  isLoading: boolean;
  /** 是否显示表单 */
  showForm: boolean;
  /** 是否显示成功页 */
  showSuccess: boolean;
  /** 是否显示审核中页 */
  showPending: boolean;
  /** 是否显示错误 */
  showError: boolean;
  /** 提交表单 */
  handleSubmit: () => Promise<void>;
  /** 重试 */
  handleRetry: () => void;
  /** 重新加载 */
  handleRetryLoad: () => void;
  /** 更新表单 */
  updateForm: (data: { realName?: string; idCard?: string }) => void;
}

/**
 * useRealNameAuth - 实名认证业务Hook
 *
 * @returns 实名认证控制器
 */
export function useRealNameAuth(): UseRealNameAuthReturn {
  const { showToast } = useNotification();

  const { state, context, send, setContext } = useStateMachine<
    RealNameState,
    RealNameEvent,
    RealNameContext
  >({
    initial: RealNameState.IDLE,
    transitions: REAL_NAME_TRANSITIONS,
    context: {
      status: null,
      error: null,
      realName: '',
      idCard: '',
      authToken: null,
      callbackCode: null,
      callbackSuccess: null,
    },
    debug: false, // 设置为true可启用调试日志
  });

  /**
   * 组件初始化：检查URL参数判断是否从H5返回
   */
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authToken = urlParams.get('authToken') || urlParams.get('auth_token');

    if (authToken) {
      const callbackPayload: PendingRealNameCallback = {
        authToken,
        callbackCode: urlParams.get('code'),
        callbackSuccess: parseCallbackSuccess(urlParams.get('success')),
        createdAt: Date.now(),
      };

      // 保存回调参数，避免部分机型回跳时刷新导致参数丢失
      savePendingCallback(callbackPayload);

      // 从H5核身页面返回，清除URL参数
      window.history.replaceState({}, '', window.location.pathname);

      // 触发回调处理
      send(RealNameEvent.VERIFY_CALLBACK, {
        authToken: callbackPayload.authToken,
        callbackCode: callbackPayload.callbackCode,
        callbackSuccess: callbackPayload.callbackSuccess,
      });
      return;
    }

    // URL参数已被清除时，尝试从会话缓存恢复回调上下文
    const pendingCallback = readPendingCallback();
    if (pendingCallback) {
      send(RealNameEvent.VERIFY_CALLBACK, {
        authToken: pendingCallback.authToken,
        callbackCode: pendingCallback.callbackCode,
        callbackSuccess: pendingCallback.callbackSuccess,
      });
      return;
    }

    // 正常加载
    send(RealNameEvent.LOAD);
  }, [send]);

  /**
   * 状态：LOADING - 加载实名认证状态
   */
  useEffect(() => {
    if (state === RealNameState.LOADING) {
      loadRealNameStatus();
    }
  }, [state]);

  /**
   * 状态：PROCESSING - 处理核身回调
   */
  useEffect(() => {
    if (state === RealNameState.PROCESSING) {
      handleAuthCallback();
    }
  }, [state]);

  /**
   * 认证完成后清理回调缓存，避免重复处理
   */
  useEffect(() => {
    if (state === RealNameState.SUCCESS || state === RealNameState.PENDING) {
      clearPendingCallback();
    }
  }, [state]);

  /**
   * 状态：SUBMITTING - 提交实名认证
   */
  useEffect(() => {
    debugLog('useRealNameAuth', 'SUBMITTING 状态检查', {
      state,
      hasAuthToken: !!context.authToken,
      authToken: context.authToken
    });

    if (state === RealNameState.SUBMITTING && context.authToken) {
      debugLog('useRealNameAuth', '条件满足，调用 submitRealNameWithAuthToken');
      submitRealNameWithAuthToken();
    } else {
      debugLog('useRealNameAuth', '条件不满足，等待中...');
    }
  }, [state, context.authToken]);

  /**
   * 加载实名认证状态
   */
  const loadRealNameStatus = async () => {
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

      if (!data) {
        // withErrorHandling 已经触发了 LOAD_ERROR
        return;
      }

      // 根据认证状态分发到不同状态
      if (data.real_name_status === RealNameStatus.APPROVED) {
        clearPendingCallback();
        // ✅ 同步更新 authStore 中的实名状态（确保状态一致）
        useAuthStore.getState().setRealNameVerified(true, data.real_name || '');
        send(RealNameEvent.LOAD_SUCCESS_VERIFIED, {
          status: data,
          realName: data.real_name || '',
          idCard: data.id_card || '',
        });
      } else if (data.real_name_status === RealNameStatus.PENDING) {
        clearPendingCallback();
        send(RealNameEvent.LOAD_SUCCESS_PENDING, {
          status: data,
        });
      } else {
        send(RealNameEvent.LOAD_SUCCESS_FORM, {
          status: data,
          realName: data.real_name || '',
          idCard: data.id_card || '',
        });
      }
    } catch (e: any) {
      const errorMsg = extractError(e, '获取实名认证状态失败，请稍后重试');
      send(RealNameEvent.LOAD_ERROR, { error: errorMsg });
    }
  };

  /**
   * 处理H5核身回调
   */
  const handleAuthCallback = async () => {
    const token = getStoredToken() || '';
    if (!token) {
      send(RealNameEvent.VERIFY_ERROR, {
        error: '未找到登录信息，请先登录',
      });
      return;
    }

    // 检查URL中的错误码
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
      // 调用校验接口获取核身结果
      const result = await withErrorHandling(
        () => h5Recheck({ authToken: context.authToken!, token }),
        (errorMsg) => {
          showToast('error', '核身失败', errorMsg);
          send(RealNameEvent.VERIFY_ERROR, { error: errorMsg });
        }
      );

      if (!result) {
        // withErrorHandling 已经触发了 VERIFY_ERROR
        return;
      }

      // 检查核身结果：status == 1（通过）且 faceMatched == 1（人脸比对成功）
      debugLog('useRealNameAuth', '核身结果检查', {
        status: result.status,
        faceMatched: result.faceMatched,
        reasonTypeDesc: result.reasonTypeDesc,
        statusDesc: result.statusDesc
      });

      if (result.status === 1 && result.faceMatched === 1) {
        // 核身通过
        debugLog('useRealNameAuth', '核身验证通过，准备提交实名认证');
        send(RealNameEvent.VERIFY_SUCCESS);
      } else {
        // 核身不通过
        const errorMsg =
          result.reasonTypeDesc ||
          result.statusDesc ||
          getErrorMsgByStatus(result.status, result.reasonType);
        showToast('error', '核身失败', errorMsg);
        clearPendingCallback();
        send(RealNameEvent.VERIFY_ERROR, { error: errorMsg });
      }
    } catch (e: any) {
      const errorMsg = extractError(e, '处理核身结果失败，请稍后重试');
      showToast('error', '处理失败', errorMsg);
      send(RealNameEvent.VERIFY_ERROR, { error: errorMsg });
    }
  };

  /**
   * 使用authToken提交实名认证
   */
  const submitRealNameWithAuthToken = async () => {
    debugLog('useRealNameAuth', 'submitRealNameWithAuthToken 被调用');
    const token = getStoredToken() || '';

    // 前端必须传递 auth_token
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

      if (result) {
        showToast('success', '提交成功', '实名认证提交成功');
        // ✅ 更新 authStore 中的实名状态
        useAuthStore.getState().setRealNameVerified(true, context.realName);
        clearPendingCallback();
        send(RealNameEvent.SUBMIT_SUCCESS);
      }
    } catch (e: any) {
      const errorMsg = extractError(e, '提交实名认证失败，请稍后重试');
      showToast('error', '提交失败', errorMsg);
      send(RealNameEvent.SUBMIT_ERROR, { error: errorMsg });
    }
  };

  /**
   * 提交表单 - 获取H5认证地址并跳转
   */
  const handleSubmit = async () => {
    // 表单验证
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
      // 清除错误
      setContext((prev) => ({ ...prev, error: null }));

      // 触发状态转换
      send(RealNameEvent.SUBMIT);

      // 构建重定向URL
      const redirectUrl = `${window.location.origin}${window.location.pathname}`;

      // 获取H5认证地址
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
          // 不改变状态，让用户重试
        }
      );

      if (!data?.authUrl) {
        const errorMsg = '获取认证地址失败，返回数据为空';
        setContext((prev) => ({ ...prev, error: errorMsg }));
        showToast('error', '获取认证地址失败', errorMsg);
        return;
      }

      // 跳转到H5核身页面
      window.location.href = data.authUrl;
    } catch (e: any) {
      const errorMsg = extractError(e, '获取认证地址失败，请稍后重试');
      setContext((prev) => ({ ...prev, error: errorMsg }));
      showToast('error', '网络错误', errorMsg);
    }
  };

  /**
   * 重试（返回表单）
   */
  const handleRetry = () => {
    clearPendingCallback();
    send(RealNameEvent.RETRY);
  };

  /**
   * 重新加载（刷新状态）
   */
  const handleRetryLoad = () => {
    send(RealNameEvent.RETRY_LOAD);
  };

  /**
   * 更新表单数据
   */
  const updateForm = (data: { realName?: string; idCard?: string }) => {
    setContext((prev) => ({ ...prev, ...data }));
  };

  return {
    state,
    context,
    canSubmit: state === RealNameState.FORM,
    isLoading: [
      RealNameState.LOADING,
      RealNameState.PROCESSING,
      RealNameState.SUBMITTING,
    ].includes(state),
    showForm: state === RealNameState.FORM,
    showSuccess: state === RealNameState.SUCCESS,
    showPending: state === RealNameState.PENDING,
    showError: state === RealNameState.ERROR,
    handleSubmit,
    handleRetry,
    handleRetryLoad,
    updateForm,
  };
}

function parseCallbackSuccess(rawValue: string | null): boolean | null {
  if (!rawValue) return null;

  const value = rawValue.trim().toLowerCase();
  if (['true', '1', 'yes', 'y', 'success'].includes(value)) {
    return true;
  }
  if (['false', '0', 'no', 'n', 'fail', 'failed', 'error'].includes(value)) {
    return false;
  }
  return null;
}

function savePendingCallback(payload: PendingRealNameCallback): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.setItem(REAL_NAME_CALLBACK_STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    warnLog('useRealNameAuth', '保存实名回调缓存失败', error);
  }
}

function readPendingCallback(): PendingRealNameCallback | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = sessionStorage.getItem(REAL_NAME_CALLBACK_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<PendingRealNameCallback>;
    const createdAt = Number(parsed.createdAt || 0);

    if (!parsed.authToken || typeof parsed.authToken !== 'string' || !createdAt) {
      clearPendingCallback();
      return null;
    }

    if (Date.now() - createdAt > REAL_NAME_CALLBACK_MAX_AGE_MS) {
      clearPendingCallback();
      return null;
    }

    return {
      authToken: parsed.authToken,
      callbackCode: typeof parsed.callbackCode === 'string' ? parsed.callbackCode : null,
      callbackSuccess:
        typeof parsed.callbackSuccess === 'boolean' ? parsed.callbackSuccess : null,
      createdAt,
    };
  } catch (error) {
    warnLog('useRealNameAuth', '读取实名回调缓存失败', error);
    clearPendingCallback();
    return null;
  }
}

function clearPendingCallback(): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.removeItem(REAL_NAME_CALLBACK_STORAGE_KEY);
  } catch (error) {
    warnLog('useRealNameAuth', '清理实名回调缓存失败', error);
  }
}

/**
 * 根据错误码获取错误信息
 */
function getErrorMsgByCode(code: string): string {
  const errorMap: Record<string, string> = {
    '2': '身份信息不匹配',
    '3': '身份信息不匹配',
    '4': '活体检测不通过',
    '5': '活体检测超时，请重试',
    '6': '身份信息不一致',
    '7': '无身份证照片',
    '8': '照片过大',
    '9': '权威数据错误，请重试',
    '10': '活体检测不通过',
    '11': '识别到未成年人',
  };
  return errorMap[code] || '人脸核身验证失败';
}

/**
 * 根据状态码和原因类型获取错误信息
 */
function getErrorMsgByStatus(status: number, reasonType?: number): string {
  if (status === 2) {
    if (reasonType) {
      return getErrorMsgByCode(String(reasonType));
    }
    return '人脸核身验证失败';
  }
  if (status === 0) {
    return '核身待定，请稍后重试';
  }
  return '人脸核身验证失败';
}

export default useRealNameAuth;
