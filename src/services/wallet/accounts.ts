import type { ApiResponse } from '../networking';
import { API_ENDPOINTS } from '../config';
import { authedFetch } from '../client';

export interface PaymentAccountItem {
  id: number;
  user_id: number;
  type: string;
  type_text?: string;
  account: string;
  account_number?: string;
  account_number_display?: string;
  account_name: string;
  bank_name?: string;
  bank_branch?: string;
  qrcode?: string;
  is_default: number;
  [key: string]: any;
}

export interface PaymentAccountListData {
  list: PaymentAccountItem[];
  [key: string]: any;
}

export async function fetchPaymentAccountList(
  token: string
): Promise<ApiResponse<PaymentAccountListData>> {
  return authedFetch<PaymentAccountListData>(API_ENDPOINTS.user.paymentAccountList, {
    method: 'GET',
    token,
  });
}

export interface AddPaymentAccountParams {
  type: string;
  account_type: 'personal' | 'company';
  bank_name: string;
  account_name: string;
  account_number: string;
  bank_branch?: string;
  screenshot?: File;
  token?: string;
}

export async function addPaymentAccount(params: AddPaymentAccountParams): Promise<ApiResponse> {
  const payload = new FormData();
  payload.append('type', params.type);
  payload.append('account_type', params.account_type);
  payload.append('bank_name', params.bank_name);
  payload.append('account_name', params.account_name);
  payload.append('account_number', params.account_number);
  if (params.bank_branch) payload.append('bank_branch', params.bank_branch);
  if (params.screenshot) payload.append('screenshot', params.screenshot);

  return authedFetch(API_ENDPOINTS.user.addPaymentAccount, {
    method: 'POST',
    body: payload,
    token: params.token,
  });
}

export interface EditPaymentAccountParams {
  id: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  bank_branch?: string;
  screenshot?: File;
  token?: string;
}

export async function editPaymentAccount(params: EditPaymentAccountParams): Promise<ApiResponse> {
  const payload = new FormData();
  payload.append('id', params.id);
  payload.append('bank_name', params.bank_name);
  payload.append('account_name', params.account_name);
  payload.append('account_number', params.account_number);
  if (params.bank_branch) payload.append('bank_branch', params.bank_branch);
  if (params.screenshot) payload.append('screenshot', params.screenshot);

  return authedFetch(API_ENDPOINTS.user.editPaymentAccount, {
    method: 'POST',
    body: payload,
    token: params.token,
  });
}

export async function deletePaymentAccount(params: {
  id: string;
  token?: string;
}): Promise<ApiResponse> {
  const payload = new FormData();
  payload.append('id', params.id);

  return authedFetch(API_ENDPOINTS.user.deletePaymentAccount, {
    method: 'POST',
    body: payload,
    token: params.token,
  });
}

export async function setDefaultPaymentAccount(params: {
  id: string;
  token?: string;
}): Promise<ApiResponse> {
  const payload = new FormData();
  payload.append('id', params.id);

  return authedFetch(API_ENDPOINTS.user.setDefaultPaymentAccount, {
    method: 'POST',
    body: payload,
    token: params.token,
  });
}
