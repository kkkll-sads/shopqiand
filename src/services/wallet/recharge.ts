import type { ApiResponse } from '../networking';
import { API_ENDPOINTS } from '../config';
import { authedFetch } from '../client';
import type {
  CompanyAccountItem,
  RechargeOrderDetail,
  RechargeOrderListData,
  RechargeOrderItem,
  SubmitRechargeOrderParams,
  SubmitRechargeOrderResult,
  SubmitWithdrawParams,
  UpdateRechargeOrderRemarkParams,
  WithdrawListResponse,
  WithdrawRecordItem,
} from '../contracts/wallet-recharge';
export type {
  CompanyAccountItem,
  RechargeOrderDetail,
  RechargeOrderListData,
  RechargeOrderItem,
  SubmitRechargeOrderParams,
  SubmitRechargeOrderResult,
  SubmitWithdrawParams,
  UpdateRechargeOrderRemarkParams,
  WithdrawListResponse,
  WithdrawRecordItem,
} from '../contracts/wallet-recharge';

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

export async function submitRechargeOrder(
  params: SubmitRechargeOrderParams
): Promise<ApiResponse<SubmitRechargeOrderResult>> {
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

  return authedFetch<SubmitRechargeOrderResult>(
    API_ENDPOINTS.recharge.submitOrder,
    {
      method: 'POST',
      body: payload,
      token: params.token,
    }
  );
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

export async function getMyRechargeOrders(
  params: { page?: number; limit?: number; status?: number; token?: string } = {}
): Promise<ApiResponse<RechargeOrderListData>> {
  const search = new URLSearchParams();
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  if (params.status !== undefined) search.set('status', String(params.status));

  const path = `${API_ENDPOINTS.recharge.getMyOrderList}?${search.toString()}`;
  return authedFetch<RechargeOrderListData>(path, {
    method: 'GET',
    token: params.token,
  });
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
