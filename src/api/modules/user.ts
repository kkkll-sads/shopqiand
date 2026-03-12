import { createApiHeaders, type ApiAuthOptions } from '../core/headers';
import { http } from '../http';
import { resolveUploadUrl } from './upload';

export interface UserRequestOptions extends ApiAuthOptions {
  signal?: AbortSignal;
}

interface RealNameStatusRaw {
  audit_reason?: string;
  audit_time?: string;
  id_card: string;
  id_card_back?: string;
  id_card_front?: string;
  real_name: string;
  real_name_status: number;
}

interface H5AuthTokenRaw {
  authToken: string;
  authUrl: string;
}

interface SubmitRealNameRaw {
  real_name_status?: number | string;
}

interface AgentReviewStatusRaw {
  apply_time?: string;
  audit_remark?: string;
  company_name?: string;
  id?: number | string;
  legal_id_number?: string;
  legal_person?: string;
  license_image?: string;
  review_reason?: string;
  review_time?: string;
  status?: number | string;
  status_text?: string;
  subject_type?: number | string;
  user_id?: number | string;
}

interface PaymentAccountRaw {
  account_name?: string;
  account_type?: string;
  account_type_text?: string;
  account_number?: string;
  account_number_display?: string;
  audit_status?: number | string;
  audit_status_text?: string;
  bank_branch?: string;
  bank_name?: string;
  branch_info?: string;
  icon?: string;
  id: number | string;
  is_default?: number | string | boolean;
  network_type?: string;
  remark?: string;
  screenshot?: string;
  type?: string;
  type_text?: string;
}

interface PaymentAccountListRaw {
  list?: PaymentAccountRaw[];
}

interface ConsignmentCouponRaw {
  create_time?: number | string;
  create_time_text?: string;
  expire_time?: number | string;
  expire_time_text?: string;
  id?: number | string;
  price_zone?: string;
  session_id?: number | string;
  session_title?: string;
  status?: number | string;
  status_text?: string;
  zone_id?: number | string;
  zone_name?: string;
}

interface ConsignmentCouponListRaw {
  available_count?: number | string;
  limit?: number | string;
  list?: ConsignmentCouponRaw[];
  page?: number | string;
  total?: number | string;
}

export interface RealNameStatus {
  auditReason?: string;
  auditTime?: string;
  idCard: string;
  idCardBack?: string;
  idCardFront?: string;
  realName: string;
  realNameStatus: number;
}

export interface H5AuthTokenInfo {
  authToken: string;
  authUrl: string;
}

export interface GetH5AuthTokenPayload {
  idCard: string;
  realName: string;
  redirectUrl: string;
}

export interface SubmitRealNamePayload {
  authToken?: string;
  idCard: string;
  idCardBack?: string;
  idCardFront?: string;
  realName: string;
}

export interface SubmitRealNameResult {
  realNameStatus: number;
}

export interface AgentReviewStatus {
  applyTime?: string;
  auditRemark?: string;
  companyName?: string;
  id?: number;
  legalIdNumber?: string;
  legalPerson?: string;
  licenseImage?: string;
  reviewReason?: string;
  reviewTime?: string;
  status: number;
  statusText?: string;
  subjectType: number;
  userId?: number;
}

export interface SubmitAgentReviewPayload {
  companyName: string;
  legalPerson: string;
  legalIdNumber: string;
  licenseImage: string;
  reason?: string;
  subjectType: 1 | 2;
}

export interface PaymentAccount {
  accountName?: string;
  accountType: PaymentAccountOwnerType;
  accountTypeText?: string;
  accountNumber?: string;
  auditStatus: number;
  auditStatusText?: string;
  bankBranch?: string;
  bankName?: string;
  branchInfo?: string;
  icon?: string;
  id: number;
  isDefault: boolean;
  networkType?: string;
  remark?: string;
  screenshot?: string;
  type: string;
  typeText?: string;
}

export type PaymentAccountType = 'bank_card' | 'alipay' | 'wechat' | 'usdt';

export type PaymentAccountOwnerType = 'personal' | 'company';

export interface AddPaymentAccountPayload {
  accountName: string;
  accountNumber: string;
  accountType: PaymentAccountOwnerType;
  bankBranch?: string;
  bankName?: string;
  screenshot?: File;
  type: PaymentAccountType;
}

export interface EditPaymentAccountPayload {
  accountName?: string;
  accountNumber?: string;
  bankBranch?: string;
  bankName?: string;
  id: number;
  screenshot?: File;
}

export type ConsignmentCouponStatus = 'available' | 'used' | 'expired';

export interface ConsignmentCoupon {
  createTime?: number;
  createTimeText?: string;
  expireTime?: number;
  expireTimeText?: string;
  id: number;
  priceZone?: string;
  sessionId?: number;
  sessionTitle?: string;
  status: ConsignmentCouponStatus;
  statusCode: number;
  statusText: string;
  zoneId?: number;
  zoneName?: string;
}

export interface ConsignmentCouponList {
  availableCount: number;
  limit: number;
  list: ConsignmentCoupon[];
  page: number;
  total: number;
}

export interface GetConsignmentCouponsParams {
  limit?: number;
  page?: number;
  status?: 0 | 1;
}

export interface UpdatePayPasswordPayload {
  oldPayPassword: string;
  newPayPassword: string;
}

export interface ResetPayPasswordBySmsPayload {
  mobile: string;
  captcha: string;
  newPayPassword: string;
}

export interface UpdateAvatarPayload {
  avatar: string;
  avatarUrl?: string;
}

export interface UpdateNicknamePayload {
  nickname: string;
}

function readOptionalString(value: string | undefined) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const nextValue = value.trim();
  return nextValue || undefined;
}

function readNumber(value: number | string | undefined, fallback = 0) {
  const nextValue = typeof value === 'string' ? Number(value) : value;
  return typeof nextValue === 'number' && Number.isFinite(nextValue) ? nextValue : fallback;
}

function readOptionalNumber(value: number | string | undefined) {
  if (value == null) {
    return undefined;
  }

  const nextValue = typeof value === 'string' ? Number(value) : value;
  return typeof nextValue === 'number' && Number.isFinite(nextValue) ? nextValue : undefined;
}

function readBooleanFlag(value: boolean | number | string | undefined): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value === 1;
  }

  if (typeof value === 'string') {
    const normalizedValue = value.trim().toLowerCase();
    return normalizedValue === '1' || normalizedValue === 'true';
  }

  return false;
}

function normalizeRealNameStatus(payload: RealNameStatusRaw): RealNameStatus {
  return {
    auditReason: payload.audit_reason || undefined,
    auditTime: payload.audit_time || undefined,
    idCard: payload.id_card,
    idCardBack: payload.id_card_back ? resolveUploadUrl(payload.id_card_back) : undefined,
    idCardFront: payload.id_card_front ? resolveUploadUrl(payload.id_card_front) : undefined,
    realName: payload.real_name,
    realNameStatus: payload.real_name_status,
  };
}

function normalizeAgentReviewStatus(payload: AgentReviewStatusRaw | null | undefined): AgentReviewStatus | null {
  if (!payload) {
    return null;
  }

  return {
    applyTime: readOptionalString(payload.apply_time),
    auditRemark: readOptionalString(payload.audit_remark),
    companyName: readOptionalString(payload.company_name),
    id: readOptionalNumber(payload.id),
    legalIdNumber: readOptionalString(payload.legal_id_number),
    legalPerson: readOptionalString(payload.legal_person),
    licenseImage: payload.license_image ? resolveUploadUrl(payload.license_image) : undefined,
    reviewReason: readOptionalString(payload.review_reason),
    reviewTime: readOptionalString(payload.review_time),
    status: readNumber(payload.status, -1),
    statusText: readOptionalString(payload.status_text),
    subjectType: readNumber(payload.subject_type, 1),
    userId: readOptionalNumber(payload.user_id),
  };
}

function normalizePaymentAccount(payload: PaymentAccountRaw): PaymentAccount {
  return {
    accountName: readOptionalString(payload.account_name),
    accountType:
      (readOptionalString(payload.account_type) as PaymentAccountOwnerType | undefined) || 'personal',
    accountTypeText: readOptionalString(payload.account_type_text),
    accountNumber: readOptionalString(payload.account_number_display ?? payload.account_number),
    auditStatus: readNumber(payload.audit_status),
    auditStatusText: readOptionalString(payload.audit_status_text),
    bankBranch: readOptionalString(payload.bank_branch),
    bankName: readOptionalString(payload.bank_name),
    branchInfo: readOptionalString(payload.branch_info),
    icon: payload.icon ? resolveUploadUrl(payload.icon) : undefined,
    id: Number(payload.id),
    isDefault: readBooleanFlag(payload.is_default),
    networkType: readOptionalString(payload.network_type),
    remark: readOptionalString(payload.remark),
    screenshot: payload.screenshot ? resolveUploadUrl(payload.screenshot) : undefined,
    type: readOptionalString(payload.type) || 'bank_card',
    typeText: readOptionalString(payload.type_text),
  };
}

function buildPaymentAccountFormData(
  payload: AddPaymentAccountPayload | EditPaymentAccountPayload,
  includeId = false,
): FormData {
  const formData = new FormData();

  if (includeId && 'id' in payload) {
    formData.append('id', String(payload.id));
  }

  if ('type' in payload) {
    formData.append('type', payload.type);
  }

  if ('accountType' in payload) {
    formData.append('account_type', payload.accountType);
  }

  if (typeof payload.bankName === 'string') {
    formData.append('bank_name', payload.bankName);
  }

  if (typeof payload.accountName === 'string') {
    formData.append('account_name', payload.accountName);
  }

  if (typeof payload.accountNumber === 'string') {
    formData.append('account_number', payload.accountNumber);
  }

  if (typeof payload.bankBranch === 'string') {
    formData.append('bank_branch', payload.bankBranch);
  }

  if (payload.screenshot instanceof File) {
    formData.append('screenshot', payload.screenshot);
  }

  return formData;
}

function normalizeConsignmentCoupon(payload: ConsignmentCouponRaw): ConsignmentCoupon {
  const expireTime = readOptionalNumber(payload.expire_time);
  const now = Math.floor(Date.now() / 1000);
  const statusCode = readNumber(payload.status, 1);
  const status: ConsignmentCouponStatus =
    statusCode === 0
      ? 'used'
      : expireTime && expireTime <= now
        ? 'expired'
        : 'available';

  const derivedStatusText =
    status === 'available'
      ? '可用'
      : status === 'used'
        ? '已使用'
        : '已过期';

  return {
    createTime: readOptionalNumber(payload.create_time),
    createTimeText: readOptionalString(payload.create_time_text),
    expireTime,
    expireTimeText: readOptionalString(payload.expire_time_text),
    id: readNumber(payload.id),
    priceZone: readOptionalString(payload.price_zone),
    sessionId: readOptionalNumber(payload.session_id),
    sessionTitle: readOptionalString(payload.session_title),
    status,
    statusCode,
    statusText: readOptionalString(payload.status_text) || derivedStatusText,
    zoneId: readOptionalNumber(payload.zone_id),
    zoneName: readOptionalString(payload.zone_name),
  };
}

export const userApi = {
  async getAgentReviewStatus(options: UserRequestOptions = {}): Promise<AgentReviewStatus | null> {
    const payload = await http.get<AgentReviewStatusRaw | null>('/api/User/agentReviewStatus', {
      headers: createApiHeaders(options),
      signal: options.signal,
    });

    return normalizeAgentReviewStatus(payload);
  },

  async submitAgentReview(
    payload: SubmitAgentReviewPayload,
    options: UserRequestOptions = {},
  ): Promise<void> {
    const formData = new FormData();

    formData.append('company_name', payload.companyName);
    formData.append('legal_person', payload.legalPerson);
    formData.append('legal_id_number', payload.legalIdNumber);
    formData.append('subject_type', String(payload.subjectType));
    formData.append('license_image', payload.licenseImage);

    if (payload.reason) {
      formData.append('reason', payload.reason);
    }

    await http.post<null, FormData>('/api/User/submitAgentReview', formData, {
      headers: createApiHeaders(options),
      signal: options.signal,
    });
  },

  async getRealNameStatus(options: UserRequestOptions = {}): Promise<RealNameStatus> {
    const payload = await http.get<RealNameStatusRaw>('/api/User/realNameStatus', {
      headers: createApiHeaders(options),
      signal: options.signal,
    });

    return normalizeRealNameStatus(payload);
  },

  async getH5AuthToken(
    payload: GetH5AuthTokenPayload,
    options: UserRequestOptions = {},
  ): Promise<H5AuthTokenInfo> {
    const response = await http.post<H5AuthTokenRaw, Record<string, string>>(
      '/api/User/getH5AuthToken',
      {
        id_card: payload.idCard,
        real_name: payload.realName,
        redirect_url: payload.redirectUrl,
      },
      {
        headers: createApiHeaders(options),
        signal: options.signal,
      },
    );

    return {
      authToken: response.authToken,
      authUrl: response.authUrl,
    };
  },

  async submitRealName(
    payload: SubmitRealNamePayload,
    options: UserRequestOptions = {},
  ): Promise<SubmitRealNameResult> {
    const response = await http.post<SubmitRealNameRaw | null, Record<string, string>>(
      '/api/User/submitRealName',
      {
        auth_token: payload.authToken,
        id_card: payload.idCard,
        id_card_back: payload.idCardBack ?? '',
        id_card_front: payload.idCardFront ?? '',
        real_name: payload.realName,
      },
      {
        headers: createApiHeaders(options),
        signal: options.signal,
      },
    );

    return {
      realNameStatus: readNumber(response?.real_name_status, 0),
    };
  },

  async getPaymentAccountList(options: UserRequestOptions = {}): Promise<PaymentAccount[]> {
    const payload = await http.get<PaymentAccountListRaw>('/api/User/getPaymentAccountList', {
      headers: createApiHeaders(options),
      signal: options.signal,
    });

    return (payload.list ?? []).map(normalizePaymentAccount);
  },

  async setDefaultPaymentAccount(id: number, options: UserRequestOptions = {}) {
    await http.post<unknown, { id: number }>(
      '/api/User/setDefaultPaymentAccount',
      { id },
      {
        headers: createApiHeaders(options),
        signal: options.signal,
      },
    );
  },

  async addPaymentAccount(
    payload: AddPaymentAccountPayload,
    options: UserRequestOptions = {},
  ): Promise<{ id: number }> {
    const response = await http.post<{ id?: number | string }, FormData>(
      '/api/User/addPaymentAccount',
      buildPaymentAccountFormData(payload),
      {
        headers: createApiHeaders(options),
        signal: options.signal,
      },
    );

    return {
      id: readNumber(response.id),
    };
  },

  async editPaymentAccount(
    payload: EditPaymentAccountPayload,
    options: UserRequestOptions = {},
  ) {
    await http.post<unknown, FormData>(
      '/api/User/editPaymentAccount',
      buildPaymentAccountFormData(payload, true),
      {
        headers: createApiHeaders(options),
        signal: options.signal,
      },
    );
  },

  async deletePaymentAccount(id: number, options: UserRequestOptions = {}) {
    await http.post<unknown, { id: number }>(
      '/api/User/deletePaymentAccount',
      { id },
      {
        headers: createApiHeaders(options),
        signal: options.signal,
      },
    );
  },

  async updateAvatar(
    payload: UpdateAvatarPayload,
    options: UserRequestOptions = {},
  ): Promise<void> {
    const avatar = payload.avatar.trim();
    const avatarUrl = payload.avatarUrl?.trim() ?? '';

    if (!avatar && !avatarUrl) {
      throw new Error('头像地址不能为空');
    }

    await http.post<null, Record<string, string>>(
      '/api/User/updateAvatar',
      {
        avatar: avatar || avatarUrl,
        avatar_url: avatarUrl,
      },
      {
        headers: createApiHeaders(options),
        signal: options.signal,
        useMock: false,
      },
    );
  },

  async updateNickname(
    payload: UpdateNicknamePayload,
    options: UserRequestOptions = {},
  ): Promise<void> {
    const nickname = payload.nickname.trim();

    if (!nickname) {
      throw new Error('昵称不能为空');
    }

    const formData = new FormData();
    formData.append('nickname', nickname);

    await http.post<null, FormData>('/api/User/updateNickname', formData, {
      headers: createApiHeaders(options),
      signal: options.signal,
      useMock: false,
    });
  },

  async updatePayPassword(
    payload: UpdatePayPasswordPayload,
    options: UserRequestOptions = {},
  ): Promise<void> {
    await http.post<null, Record<string, string>>(
      '/api/User/updatePayPassword',
      {
        old_pay_password: payload.oldPayPassword,
        new_pay_password: payload.newPayPassword,
      },
      {
        headers: createApiHeaders(options),
        signal: options.signal,
        useMock: false,
      },
    );
  },

  async resetPayPasswordBySms(
    payload: ResetPayPasswordBySmsPayload,
    options: UserRequestOptions = {},
  ): Promise<void> {
    await http.post<null, Record<string, string>>(
      '/api/User/resetPayPasswordBySms',
      {
        mobile: payload.mobile,
        captcha: payload.captcha,
        new_pay_password: payload.newPayPassword,
      },
      {
        headers: createApiHeaders(options),
        signal: options.signal,
        useMock: false,
      },
    );
  },

  async getConsignmentCoupons(
    params: GetConsignmentCouponsParams = {},
    options: UserRequestOptions = {},
  ): Promise<ConsignmentCouponList> {
    const payload = await http.get<ConsignmentCouponListRaw>('/api/User/consignmentCoupons', {
      headers: createApiHeaders(options),
      query: {
        limit: params.limit,
        page: params.page,
        status: params.status,
      },
      signal: options.signal,
    });

    return {
      availableCount: readNumber(payload.available_count),
      limit: readNumber(payload.limit, params.limit ?? 50),
      list: (payload.list ?? []).map(normalizeConsignmentCoupon),
      page: readNumber(payload.page, params.page ?? 1),
      total: readNumber(payload.total),
    };
  },
};






