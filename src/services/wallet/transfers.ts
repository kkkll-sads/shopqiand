import type { ApiResponse } from '../networking';
import { API_ENDPOINTS } from '../config';
import { authedFetch } from '../client';

export interface TransferBalanceToServiceFeeParams {
  amount: number | string;
  pay_type?: 'money' | 'withdraw';
  token?: string;
}

export interface TransferBalanceToServiceFeeResponse {
  balance_available: number;
  service_fee_balance: number;
}

export async function transferBalanceToServiceFee(
  params: TransferBalanceToServiceFeeParams
): Promise<ApiResponse<TransferBalanceToServiceFeeResponse>> {
  if (!params.amount || Number(params.amount) <= 0) {
    throw new Error('请输入有效的划转金额');
  }

  const path = `${API_ENDPOINTS.account.transferBalanceToServiceFee}?amount=${params.amount}${
    params.pay_type ? `&pay_type=${params.pay_type}` : ''
  }`;

  return authedFetch<TransferBalanceToServiceFeeResponse>(path, {
    method: 'POST',
    token: params.token,
  });
}

export interface RechargeServiceFeeParams {
  amount: number | string;
  remark?: string;
  source?: 'balance_available' | 'withdrawable_money' | '';
  token?: string;
}

export async function rechargeServiceFee(params: RechargeServiceFeeParams): Promise<ApiResponse> {
  if (!params.amount || Number(params.amount) <= 0) {
    throw new Error('请输入有效的充值金额');
  }

  const search = new URLSearchParams();
  search.append('amount', String(params.amount));
  if (params.remark) search.append('remark', params.remark);

  const path = `${API_ENDPOINTS.account.rechargeServiceFee}?${search.toString()}`;

  const payload: Record<string, any> = {
    amount: Number(params.amount),
  };
  if (params.source) payload.source = params.source;

  return authedFetch(path, {
    method: 'POST',
    body: JSON.stringify(payload),
    token: params.token,
  });
}

export interface TransferIncomeToPurchaseParams {
  amount: number | string;
  remark?: string;
  token?: string;
}

export interface TransferIncomeToPurchaseResponse {
  transfer_amount: number;
  remaining_withdrawable: number;
  new_balance_available: number;
}

export async function transferIncomeToPurchase(
  params: TransferIncomeToPurchaseParams
): Promise<ApiResponse<TransferIncomeToPurchaseResponse>> {
  if (!params.amount || Number(params.amount) <= 0) {
    throw new Error('请输入有效的划转金额');
  }

  const payload: Record<string, any> = {
    amount: Number(params.amount),
  };
  if (params.remark) payload.remark = params.remark;

  return authedFetch<TransferIncomeToPurchaseResponse>(
    API_ENDPOINTS.financeOrder.transferIncomeToPurchase,
    {
      method: 'POST',
      body: JSON.stringify(payload),
      token: params.token,
    }
  );
}
