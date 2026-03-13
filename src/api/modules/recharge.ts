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
  sort?: number | string;
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

interface WithdrawRecordRaw {
  account_name?: string;
  account_number?: string;
  account_type?: string;
  account_type_text?: string;
  actual_amount?: number | string;
  amount?: number | string;
  audit_reason?: string;
  audit_time?: number | string;
  audit_time_text?: string;
  bank_name?: string;
  create_time?: number | string;
  create_time_text?: string;
  fee?: number | string;
  id?: number | string;
  pay_reason?: string;
  pay_time?: number | string;
  pay_time_text?: string;
  remark?: string;
  status?: number | string;
  status_text?: string;
}

interface WithdrawRecordListRaw {
  current_page?: number | string;
  data?: WithdrawRecordRaw[];
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
  sort?: number;
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
  companyAccountId?: number;
  matchedAccountId?: number;
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
  paymentAccountId?: number;
  paymentId?: number;
  remark?: string;
}

export interface SubmitWithdrawResult {
  actualAmount?: number;
  fee?: number;
  status?: number;
  withdrawId?: number;
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

export interface GetMyWithdrawListParams {
  limit?: number;
  page?: number;
}

export interface WithdrawRecord {
  accountName?: string;
  accountNumber?: string;
  accountType?: string;
  accountTypeText?: string;
  actualAmount: number;
  amount: number;
  auditReason?: string;
  auditTime?: number;
  auditTimeText?: string;
  bankName?: string;
  createTime?: number;
  createTimeText?: string;
  fee: number;
  id: number;
  payReason?: string;
  payTime?: number;
  payTimeText?: string;
  remark?: string;
  status: number;
  statusText?: string;
}

export interface WithdrawRecordList {
  currentPage: number;
  hasMore: boolean;
  list: WithdrawRecord[];
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
    sort: readOptionalNumber(payload.sort),
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

function normalizeWithdrawRecord(payload: WithdrawRecordRaw): WithdrawRecord {
  return {
    accountName: readOptionalString(payload.account_name),
    accountNumber: readOptionalString(payload.account_number),
    accountType: readOptionalString(payload.account_type),
    accountTypeText: readOptionalString(payload.account_type_text),
    actualAmount: readNumber(payload.actual_amount),
    amount: readNumber(payload.amount),
    auditReason: readOptionalString(payload.audit_reason),
    auditTime: readOptionalNumber(payload.audit_time),
    auditTimeText: readOptionalString(payload.audit_time_text),
    bankName: readOptionalString(payload.bank_name),
    createTime: readOptionalNumber(payload.create_time),
    createTimeText: readOptionalString(payload.create_time_text),
    fee: readNumber(payload.fee),
    id: readNumber(payload.id),
    payReason: readOptionalString(payload.pay_reason),
    payTime: readOptionalNumber(payload.pay_time),
    payTimeText: readOptionalString(payload.pay_time_text),
    remark: readOptionalString(payload.remark),
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
    if (!payload.companyAccountId && !payload.matchedAccountId) {
      throw new Error('缺少充值通道信息');
    }

    const response = await http.post<
      SubmitOrderRaw,
      {
        amount: number;
        company_account_id?: number;
        matched_account_id?: number;
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
        company_account_id: payload.companyAccountId,
        matched_account_id: payload.matchedAccountId || undefined,
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
    const paymentAccountId = payload.paymentAccountId ?? payload.paymentId;
    if (!paymentAccountId) {
      throw new Error('请选择收款账户');
    }

    const formData = new FormData();
    formData.append('payment_account_id', String(paymentAccountId));
    formData.append('amount', String(payload.amount));

    const payPassword = payload.payPassword.trim();
    if (payPassword) {
      formData.append('pay_password', payPassword);
    }

    const remark = payload.remark?.trim();
    if (remark) {
      formData.append('remark', remark);
    }

    const response = await http.post<SubmitWithdrawRaw | null, FormData>(
      '/api/Recharge/submitWithdraw',
      formData,
      {
        headers: createApiHeaders(options),
        signal: options.signal,
        useMock: false,
      },
    );

    return {
      actualAmount:
        response?.actual_amount == null ? undefined : readNumber(response.actual_amount),
      fee: response?.fee == null ? undefined : readNumber(response.fee),
      status: response?.status == null ? undefined : readNumber(response.status),
      withdrawId: response?.withdraw_id == null ? undefined : readNumber(response.withdraw_id),
    };
  },

  async getMyWithdrawList(
    params: GetMyWithdrawListParams = {},
    options: RechargeRequestOptions = {},
  ): Promise<WithdrawRecordList> {
    const payload = await http.get<WithdrawRecordListRaw>('/api/Recharge/getMyWithdrawList', {
      headers: createApiHeaders(options),
      query: {
        limit: params.limit,
        page: params.page,
      },
      signal: options.signal,
    });

    const currentPage = readNumber(payload.current_page, params.page ?? 1);
    const perPage = readNumber(payload.per_page, params.limit ?? 10);
    const total = readNumber(payload.total);
    const list = (payload.data ?? []).map(normalizeWithdrawRecord);

    return {
      currentPage,
      hasMore: currentPage * perPage < total,
      list,
      perPage,
      total,
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
