import type { ApiResponse } from '../networking';
import { API_ENDPOINTS } from '../config';
import { authedFetch } from '../client';

export interface CompanyAccountItem {
  id: number;
  type: string;
  type_text?: string;
  account_name: string;
  account_number: string;
  bank_name?: string;
  bank_branch?: string;
  icon: string;
  remark: string;
  status: number;
  status_text?: string;
  [key: string]: any;
}

export async function fetchCompanyAccountList(
  params: { usage?: string; token?: string } = {}
): Promise<ApiResponse<{ list: CompanyAccountItem[] }>> {
  const search = new URLSearchParams();
  if (params.usage) search.set('usage', params.usage);

  const path = `${API_ENDPOINTS.recharge.companyAccountList}?${search.toString()}`;
  return authedFetch<{ list: CompanyAccountItem[] }>(path, {
    method: 'GET',
    token: params.token,
  });
}

export interface SubmitRechargeOrderParams {
  company_account_id: number;
  amount: number | string;
  voucher?: File;
  payment_screenshot?: File;
  payment_screenshot_id?: number | string;
  payment_screenshot_url?: string;
  payment_type?: string;
  payment_method?: 'online' | 'offline';
  remark?: string;
  card_last_four?: string;
  token?: string;
}

export async function submitRechargeOrder(
  params: SubmitRechargeOrderParams
): Promise<ApiResponse<{ order_id?: number; order_no?: string; pay_url?: string }>> {
  const payload = new FormData();
  payload.append('company_account_id', String(params.company_account_id));
  payload.append('amount', String(params.amount));

  if (params.payment_method) {
    payload.append('payment_method', params.payment_method);
  } else {
    payload.append('payment_method', 'offline');
  }

  const image = params.voucher || params.payment_screenshot;
  if (image) payload.append('payment_screenshot', image);

  if (params.remark) payload.append('remark', params.remark);
  if (params.payment_type) payload.append('payment_type', params.payment_type);
  if (params.card_last_four) payload.append('user_remark', params.card_last_four);

  return authedFetch<{ order_id?: number; order_no?: string; pay_url?: string }>(
    API_ENDPOINTS.recharge.submitOrder,
    {
      method: 'POST',
      body: payload,
      token: params.token,
    }
  );
}

export interface UpdateRechargeOrderRemarkParams {
  order_id?: string | number;
  order_no?: string;
  user_remark: string;
  token?: string;
}

export async function updateRechargeOrderRemark(
  params: UpdateRechargeOrderRemarkParams
): Promise<ApiResponse> {
  const payload = new FormData();

  if (params.order_id) {
    payload.append('order_id', String(params.order_id));
  } else if (params.order_no) {
    payload.append('order_no', String(params.order_no));
  }

  payload.append('user_remark', params.user_remark);

  return authedFetch(API_ENDPOINTS.recharge.updateOrderRemark, {
    method: 'POST',
    body: payload,
    token: params.token,
  });
}

export interface SubmitWithdrawParams {
  payment_id?: string | number;
  payment_account_id?: string | number;
  amount: number | string;
  pay_password?: string;
  token?: string;
  remark?: string;
}

export async function submitWithdraw(params: SubmitWithdrawParams): Promise<ApiResponse> {
  const payload = new FormData();
  payload.append('payment_account_id', String(params.payment_account_id || params.payment_id));
  payload.append('amount', String(params.amount));

  if (params.pay_password) payload.append('pay_password', params.pay_password);
  if (params.remark) payload.append('remark', params.remark);

  return authedFetch(API_ENDPOINTS.recharge.submitWithdraw, {
    method: 'POST',
    body: payload,
    token: params.token,
  });
}

export async function submitStaticIncomeWithdraw(params: SubmitWithdrawParams): Promise<ApiResponse> {
  const payload = new FormData();
  payload.append('user_account_id', String(params.payment_id || params.payment_account_id));
  payload.append('money', String(params.amount));
  if (params.pay_password) payload.append('pay_password', params.pay_password);

  return authedFetch(API_ENDPOINTS.recharge.submitStaticIncomeWithdraw, {
    method: 'POST',
    body: payload,
    token: params.token,
  });
}

export interface RechargeOrderItem {
  id: number;
  order_no: string;
  money: number;
  amount?: number | string;
  status: number;
  status_text: string;
  createtime: number;
  create_time?: number;
  payment_type?: string;
  payment_type_text?: string;
  [key: string]: any;
}

export async function getMyRechargeOrders(
  params: { page?: number; limit?: number; status?: number; token?: string } = {}
): Promise<
  ApiResponse<{
    data: RechargeOrderItem[];
    total: number;
    last_page: number;
    current_page: number;
  }>
> {
  const search = new URLSearchParams();
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  if (params.status !== undefined) search.set('status', String(params.status));

  const path = `${API_ENDPOINTS.recharge.getMyOrderList}?${search.toString()}`;
  return authedFetch<{
    data: RechargeOrderItem[];
    total: number;
    last_page: number;
    current_page: number;
  }>(path, {
    method: 'GET',
    token: params.token,
  });
}

export interface WithdrawRecordItem {
  id: number;
  amount: number | string;
  fee: number | string;
  actual_amount: number | string;
  account_type: string;
  account_type_text: string;
  account_name: string;
  account_number: string;
  bank_name?: string;
  status: number;
  status_text: string;
  audit_reason?: string;
  pay_reason?: string;
  remark?: string;
  create_time: number;
  create_time_text: string;
  audit_time?: number;
  audit_time_text?: string;
  pay_time?: number;
  pay_time_text?: string;
  order_no?: string;
  money?: number;
  createtime?: number;
}

interface WithdrawListResponse {
  data: WithdrawRecordItem[];
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

export async function getMyWithdrawList(
  params: { page?: number; limit?: number; status?: number; token?: string } = {}
): Promise<ApiResponse<WithdrawListResponse>> {
  const search = new URLSearchParams();
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  if (params.status !== undefined) search.set('status', String(params.status));

  const path = `${API_ENDPOINTS.recharge.getMyWithdrawList}?${search.toString()}`;
  return authedFetch<WithdrawListResponse>(path, {
    method: 'GET',
    token: params.token,
  });
}

export interface RechargeOrderDetail {
  id: number;
  order_no: string;
  amount: number;
  payment_type: string;
  payment_type_text?: string;
  status: number;
  status_text: string;
  payment_screenshot?: string;
  audit_remark?: string;
  create_time: number;
  create_time_text: string;
  audit_time?: number;
  audit_time_text?: string;
  [key: string]: any;
}

export async function getRechargeOrderDetail(
  id: number | string,
  token?: string
): Promise<ApiResponse<RechargeOrderDetail>> {
  const search = new URLSearchParams();
  search.set('id', String(id));

  const path = `${API_ENDPOINTS.recharge.detail}?${search.toString()}`;
  return authedFetch<RechargeOrderDetail>(path, {
    method: 'GET',
    token,
  });
}
