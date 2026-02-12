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
import { debugLog } from '@/utils/logger';
import {
  clearPendingCallback,
} from './real-name-auth/callbackPersistence';
import {
  RealNameState,
  RealNameEvent,
  type RealNameContext,
  REAL_NAME_TRANSITIONS,
} from './real-name-auth/state';
import {
  handleInitialRealNameLoad,
  loadRealNameStatusFlow,
  verifyAuthCallbackFlow,
  submitRealNameWithAuthTokenFlow,
  submitRealNameFormFlow,
} from './real-name-auth/flows';
import type { UseRealNameAuthReturn } from './real-name-auth/types';

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
    debug: false,
  });

  useEffect(() => {
    handleInitialRealNameLoad(send);
  }, [send]);

  useEffect(() => {
    if (state === RealNameState.LOADING) {
      void loadRealNameStatusFlow(send);
    }
  }, [state, send]);

  useEffect(() => {
    if (state === RealNameState.PROCESSING) {
      void verifyAuthCallbackFlow(context, send, showToast);
    }
  }, [state, context, send, showToast]);

  useEffect(() => {
    if (state === RealNameState.SUCCESS || state === RealNameState.PENDING) {
      clearPendingCallback();
    }
  }, [state]);

  useEffect(() => {
    debugLog('useRealNameAuth', 'SUBMITTING 状态检查', {
      state,
      hasAuthToken: !!context.authToken,
      authToken: context.authToken,
    });

    if (state === RealNameState.SUBMITTING && context.authToken) {
      debugLog('useRealNameAuth', '条件满足，调用 submitRealNameWithAuthToken');
      void submitRealNameWithAuthTokenFlow(context, send, showToast);
      return;
    }

    debugLog('useRealNameAuth', '条件不满足，等待中...');
  }, [state, context, send, showToast]);

  const handleSubmit = async () => {
    await submitRealNameFormFlow(context, send, setContext, showToast);
  };

  const handleRetry = () => {
    clearPendingCallback();
    send(RealNameEvent.RETRY);
  };

  const handleRetryLoad = () => {
    send(RealNameEvent.RETRY_LOAD);
  };

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

export { RealNameState, RealNameEvent };

export default useRealNameAuth;
