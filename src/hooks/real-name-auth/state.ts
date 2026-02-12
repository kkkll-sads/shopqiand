import type { RealNameStatusData } from '@/services';

/**
 * 实名认证状态枚举
 */
export enum RealNameState {
  IDLE = 'idle',
  LOADING = 'loading',
  FORM = 'form',
  VERIFYING = 'verifying',
  PROCESSING = 'processing',
  SUBMITTING = 'submitting',
  SUCCESS = 'success',
  PENDING = 'pending',
  ERROR = 'error',
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
export interface RealNameContext {
  status: RealNameStatusData | null;
  error: string | null;
  realName: string;
  idCard: string;
  authToken: string | null;
  callbackCode: string | null;
  callbackSuccess: boolean | null;
}

/**
 * 状态转换表
 */
export const REAL_NAME_TRANSITIONS: Record<
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
