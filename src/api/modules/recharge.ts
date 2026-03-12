import { createApiHeaders, type ApiAuthOptions } from '../core/headers';
import { http } from '../http';
import { resolveUploadUrl } from './upload';

export interface RechargeRequestOptions extends ApiAuthOptions {
  signal?: AbortSignal;
}

export type CompanyAccountUsage = 'all' | 'recharge' | 'withdraw';
export type RechargePaymentMethod = 'offline' | 'online';

interface CompanyAccountRaw {
  account_name?: string;
  account_number?: string;
  bank_branch?: string;
  bank_name?: string;
  icon?: string;
  id?: number | string;
  remark?: string;
  status?: number | string;
  status_text?: string;
  type?: string;
  type_text?: string;
}

interface CompanyAccountListRaw {
  list?: CompanyAccountRaw[];
}

interface SubmitOrderRaw {
  order_id?: number | string;
  order_no?: string;
  pay_url?: string;
}

interface MatchAccountRaw {
  account?: CompanyAccountRaw;
  matched_account_id?: number | string;
  payment_method?: RechargePaymentMethod;
}

interface RechargeOrderRecordRaw {
  amount?: number | string;
  audit_remark?: string;
  audit_time?: number | string;
  audit_time_text?: string;
  create_time?: number | string;
  create_time_text?: string;
  id?: number | string;
  order_no?: string;
  payment_screenshot?: string;
  payment_type?: string;
  payment_type_text?: string;
  record_type?: string;
  status?: number | string;
  status_text?: string;
}

interface RechargeOrderListRaw {
  current_page?: number | string;
  data?: RechargeOrderRecordRaw[];
  has_more?: boolean;
  last_page?: number | string;
  per_page?: number | string;
  total?: number | string;
}

interface SubmitWithdrawRaw {
  actual_amount?: number | string;
  fee?: number | string;
  status?: number | string;
  withdraw_id?: number | string;
}

export interface CompanyAccount {
  accountName?: string;
  accountNumber?: string;
  bankBranch?: string;
  bankName?: string;
  icon?: string;
  id: number;
  remark?: string;
  status: number;
  statusText?: string;
  type: string;
  typeText?: string;
}

export interface GetCompanyAccountListParams {
  usage?: CompanyAccountUsage;
}

export interface SubmitOrderPayload {
  amount: number;
  matchedAccountId: number;
  paymentMethod?: RechargePaymentMethod;
  paymentScreenshotId?: number;
  paymentScreenshotUrl?: string;
  paymentType: string;
  userRemark?: string;
}

export interface MatchAccountPayload {
  amount: number;
  paymentType: string;
}

export interface MatchAccountResult {
  account: CompanyAccount;
  matchedAccountId: number;
  paymentMethod?: RechargePaymentMethod;
}

export interface SubmitOrderResult {
  orderId: number;
  orderNo: string;
  payUrl?: string;
}

export interface SubmitWithdrawPayload {
  amount: number;
  payPassword: string;
  paymentAccountId: number;
  remark?: string;
}

export interface SubmitWithdrawResult {
  actualAmount: number;
  fee: number;
  status: number;
  withdrawId: number;
}

export interface GetMyOrderListParams {
  limit?: number;
  page?: number;
  paymentType?: string;
  status?: number;
}

export interface RechargeOrderRecord {
  amount: number;
  auditRemark?: string;
  auditTime?: number;
  auditTimeText?: string;
  createTime?: number;
  createTimeText?: string;
  id: number;
  orderNo?: string;
  paymentScreenshot?: string;
  paymentType?: string;
  paymentTypeText?: string;
  recordType: string;
  status: number;
  statusText?: string;
}

export interface RechargeOrderList {
  currentPage: number;
  hasMore: boolean;
  lastPage: number;
  list: RechargeOrderRecord[];
  perPage: number;
  total: number;
}

function readNumber(value: number | string | undefined, fallback = 0): number {
  const nextValue = typeof value === 'string' ? Number(value) : value;
  return typeof nextValue === 'number' && Number.isFinite(nextValue) ? nextValue : fallback;
}

function readOptionalNumber(value: number | string | undefined): number | undefined {
  const nextValue = typeof value === 'string' ? Number(value) : value;
  return typeof nextValue === 'number' && Number.isFinite(nextValue) ? nextValue : undefined;
}

function readOptionalString(value: string | undefined) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const nextValue = value.trim();
  return nextValue || undefined;
}

function normalizeCompanyAccount(payload: CompanyAccountRaw): CompanyAccount {
  return {
    accountName: readOptionalString(payload.account_name),
    accountNumber: readOptionalString(payload.account_number),
    bankBranch: readOptionalString(payload.bank_branch),
    bankName: readOptionalString(payload.bank_name),
    icon: payload.icon ? resolveUploadUrl(payload.icon) : undefined,
    id: readNumber(payload.id),
    remark: readOptionalString(payload.remark),
    status: readNumber(payload.status),
    statusText: readOptionalString(payload.status_text),
    type: readOptionalString(payload.type) || 'bank_card',
    typeText: readOptionalString(payload.type_text),
  };
}

function normalizeRechargeOrderRecord(payload: RechargeOrderRecordRaw): RechargeOrderRecord {
  return {
    amount: readNumber(payload.amount),
    auditRemark: readOptionalString(payload.audit_remark),
    auditTime: readOptionalNumber(payload.audit_time),
    auditTimeText: readOptionalString(payload.audit_time_text),
    createTime: readOptionalNumber(payload.create_time),
    createTimeText: readOptionalString(payload.create_time_text),
    id: readNumber(payload.id),
    orderNo: readOptionalString(payload.order_no),
    paymentScreenshot: payload.payment_screenshot
      ? resolveUploadUrl(payload.payment_screenshot)
      : undefined,
    paymentType: readOptionalString(payload.payment_type),
    paymentTypeText: readOptionalString(payload.payment_type_text),
    recordType: readOptionalString(payload.record_type) || 'recharge',
    status: readNumber(payload.status),
    statusText: readOptionalString(payload.status_text),
  };
}

export const rechargeApi = {
  async getCompanyAccountList(
    params: GetCompanyAccountListParams = {},
    options: RechargeRequestOptions = {},
  ): Promise<CompanyAccount[]> {
    const payload = await http.get<CompanyAccountListRaw>('/api/Recharge/getCompanyAccountList', {
      headers: createApiHeaders(options),
      query: {
        usage: params.usage,
      },
      signal: options.signal,
    });

    const list = Array.isArray(payload?.list) ? payload.list : Array.isArray(payload) ? payload : [];
    return list.map(normalizeCompanyAccount);
  },

  async submitOrder(
    payload: SubmitOrderPayload,
    options: RechargeRequestOptions = {},
  ): Promise<SubmitOrderResult> {
    const response = await http.post<
      SubmitOrderRaw,
      {
        amount: number;
        matched_account_id: number;
        payment_method?: RechargePaymentMethod;
        payment_screenshot_id?: number;
        payment_screenshot_url?: string;
        payment_type: string;
        user_remark?: string;
      }
    >(
      '/api/Recharge/submitOrder',
      {
        amount: payload.amount,
        matched_account_id: payload.matchedAccountId,
        payment_method: payload.paymentMethod,
        payment_screenshot_id: payload.paymentScreenshotId,
        payment_screenshot_url: payload.paymentScreenshotUrl,
        payment_type: payload.paymentType,
        user_remark: payload.userRemark?.trim() || undefined,
      },
      {
        headers: createApiHeaders(options),
        signal: options.signal,
      },
    );

    return {
      orderId: readNumber(response.order_id),
      orderNo: readOptionalString(response.order_no) || '',
      payUrl: readOptionalString(response.pay_url),
    };
  },

  async matchAccount(
    payload: MatchAccountPayload,
    options: RechargeRequestOptions = {},
  ): Promise<MatchAccountResult> {
    const response = await http.post<
      MatchAccountRaw,
      {
        amount: number;
        payment_type: string;
      }
    >(
      '/api/Recharge/matchAccount',
      {
        amount: payload.amount,
        payment_type: payload.paymentType,
      },
      {
        headers: createApiHeaders(options),
        signal: options.signal,
      },
    );

    return {
      account: normalizeCompanyAccount(response.account || {}),
      matchedAccountId: readNumber(response.matched_account_id),
      paymentMethod: response.payment_method === 'online' || response.payment_method === 'offline'
        ? response.payment_method
        : undefined,
    };
  },

  async getMyOrderList(
    params: GetMyOrderListParams = {},
    options: RechargeRequestOptions = {},
  ): Promise<RechargeOrderList> {
    const payload = await http.get<RechargeOrderListRaw>('/api/Recharge/getMyOrderList', {
      headers: createApiHeaders(options),
      query: {
        limit: params.limit,
        page: params.page,
        payment_type: params.paymentType,
        status: params.status,
      },
      signal: options.signal,
    });

    return {
      currentPage: readNumber(payload.current_page, 1),
      hasMore: Boolean(payload.has_more),
      lastPage: readNumber(payload.last_page, 1),
      list: (payload.data ?? []).map(normalizeRechargeOrderRecord),
      perPage: readNumber(payload.per_page, params.limit ?? 10),
      total: readNumber(payload.total),
    };
  },

  async submitWithdraw(
    payload: SubmitWithdrawPayload,
    options: RechargeRequestOptions = {},
  ): Promise<SubmitWithdrawResult> {
    const response = await http.post<
      SubmitWithdrawRaw,
      {
        amount: number;
        pay_password: string;
        payment_account_id: number;
        remark?: string;
      }
    >(
      '/api/Recharge/submitWithdraw',
      {
        amount: payload.amount,
        pay_password: payload.payPassword,
        payment_account_id: payload.paymentAccountId,
        remark: payload.remark?.trim() || undefined,
      },
      {
        headers: createApiHeaders(options),
        signal: options.signal,
      },
    );

    return {
      actualAmount: readNumber(response.actual_amount),
      fee: readNumber(response.fee),
      status: readNumber(response.status),
      withdrawId: readNumber(response.withdraw_id),
    };
  },

  /**
   * 充值订单详情
   * GET /api/Recharge/detail
   * @param params 订单 ID 或订单号（至少传一个）
   */
  async detail(
    params: { id?: number; order_no?: string },
    options: RechargeRequestOptions = {},
  ): Promise<RechargeOrderRecord> {
    const payload = await http.get<RechargeOrderRecordRaw>('/api/Recharge/detail', {
      headers: createApiHeaders(options),
      query: params,
      signal: options.signal,
    });

    return normalizeRechargeOrderRecord(payload);
  },
};
