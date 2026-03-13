import { http } from '../http';

export type LoginTab = 'login' | 'sms_login';
export type CheckInTab = LoginTab | 'register';
export type CheckInCode = number | string;

export interface CheckInEnvelope<TData> {
  code: CheckInCode;
  biz_code?: CheckInCode;
  message?: string;
  msg?: string;
  time?: number | string;
  data: TData;
}

export interface UserInfo {
  id?: number | string;
  uid?: number | string;
  username?: string;
  nickname?: string;
  mobile?: string;
  avatar?: string;
  [key: string]: unknown;
}

export interface CheckInConfig {
  userLoginCaptchaSwitch: boolean;
  accountVerificationType: string[] | string | null;
  loginTabs?: LoginTab[] | string[] | string | null;
  defaultTab?: LoginTab | string | null;
}

export interface CheckInResponseData {
  userInfo?: UserInfo;
  routePath?: string;
  token?: string;
  accessToken?: string;
  userToken?: string;
  baToken?: string;
  baUserToken?: string;
  [key: string]: unknown;
}

export interface AccountLoginPayload {
  tab: 'login';
  username: string;
  password: string;
  captchaId?: string;
  captchaInfo?: string;
  keep?: 0 | 1;
}

export interface SmsLoginPayload {
  tab: 'sms_login';
  mobile: string;
  captcha: string;
  keep?: 0 | 1;
}

export interface RegisterPayload {
  tab: 'register';
  mobile: string;
  password: string;
  pay_password: string;
  captcha: string;
  invite_code?: string;
}

export interface RetrievePasswordPayload {
  type: 'mobile';
  account: string;
  captcha: string;
  password: string;
}

export function isCheckInSuccessCode(code: CheckInCode | undefined): boolean {
  return code === 1 || code === '1';
}

function isCheckInHandledCode(code: CheckInCode): boolean {
  return isCheckInSuccessCode(code) || code === 0 || code === '0';
}

export function resolveCheckInCode(response: Pick<CheckInEnvelope<unknown>, 'biz_code' | 'code'>) {
  return response.biz_code ?? response.code;
}

export function getCheckInResponseMessage(
  response: Partial<Pick<CheckInEnvelope<unknown>, 'message' | 'msg'>>,
  fallback: string,
) {
  const nextMessage =
    typeof response.message === 'string' && response.message.trim()
      ? response.message.trim()
      : typeof response.msg === 'string' && response.msg.trim()
        ? response.msg.trim()
        : '';

  return nextMessage || fallback;
}

export const authApi = {
  getCheckInConfig(signal?: AbortSignal) {
    return http.get<CheckInConfig>('/api/User/checkIn', {
      signal,
      useMock: false,
    });
  },

  login(payload: Omit<AccountLoginPayload, 'tab'>, signal?: AbortSignal) {
    return http.post<CheckInEnvelope<CheckInResponseData | null>, AccountLoginPayload>(
      '/api/User/checkIn',
      {
        tab: 'login',
        ...payload,
      },
      {
        isSuccessCode: isCheckInHandledCode,
        signal,
        unwrapEnvelope: false,
        useMock: false,
      },
    );
  },

  smsLogin(payload: Omit<SmsLoginPayload, 'tab'>, signal?: AbortSignal) {
    return http.post<CheckInEnvelope<CheckInResponseData | null>, SmsLoginPayload>(
      '/api/User/checkIn',
      {
        tab: 'sms_login',
        ...payload,
      },
      {
        isSuccessCode: isCheckInHandledCode,
        signal,
        unwrapEnvelope: false,
        useMock: false,
      },
    );
  },

  register(payload: Omit<RegisterPayload, 'tab'>, signal?: AbortSignal) {
    return http.post<CheckInResponseData, RegisterPayload>(
      '/api/User/checkIn',
      {
        tab: 'register',
        ...payload,
      },
      {
        signal,
        useMock: false,
      },
    );
  },

  retrievePassword(payload: RetrievePasswordPayload, signal?: AbortSignal) {
    return http.post<Record<string, unknown> | null, RetrievePasswordPayload>(
      '/api/Account/retrievePassword',
      payload,
      {
        signal,
        useMock: false,
      },
    );
  },
};
