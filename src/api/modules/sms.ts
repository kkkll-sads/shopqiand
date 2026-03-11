import { createApiHeaders, type ApiAuthOptions } from '../core/headers';
import { http } from '../http';

export type SmsEvent =
  | 'user_login'
  | 'user_register'
  | 'user_retrieve_pwd'
  | 'user_mobile_verify'
  | 'reset_pay_password';

export interface SendSmsPayload {
  mobile: string;
  event: SmsEvent;
}

export interface SendSmsOptions extends ApiAuthOptions {
  signal?: AbortSignal;
}

export type SendSmsResponseData = Record<string, unknown> | null;

export const smsApi = {
  send(payload: SendSmsPayload, options: SendSmsOptions = {}) {
    return http.post<SendSmsResponseData, SendSmsPayload>('/api/Sms/send', payload, {
      headers: createApiHeaders(options),
      signal: options.signal,
      useMock: false,
    });
  },
};

