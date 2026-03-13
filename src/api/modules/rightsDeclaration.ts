import { createApiHeaders, type ApiAuthOptions } from '../core/headers';
import { http } from '../http';
import { resolveUploadUrl } from './upload';

export interface RightsDeclarationRequestOptions extends ApiAuthOptions {
  signal?: AbortSignal;
}

export type RightsDeclarationVoucherType = 'screenshot' | 'transfer_record' | 'other';

export type RightsDeclarationStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

interface RightsDeclarationRecordRaw {
  amount?: number | string;
  create_time_text?: string;
  id?: number | string;
  images_array?: string[];
  review_remark?: string;
  review_time_text?: string;
  status?: string;
  status_text?: string;
  voucher_type?: string;
  voucher_type_text?: string;
}

interface RightsDeclarationListRaw {
  limit?: number | string;
  list?: RightsDeclarationRecordRaw[];
  page?: number | string;
  total?: number | string;
}

interface RightsDeclarationReviewStatusRaw extends RightsDeclarationListRaw {
  approved_count?: number | string;
  pending_count?: number | string;
}

interface RightsDeclarationSubmitResultRaw {
  declaration_id?: number | string;
}

export interface RightsDeclarationRecord {
  amount: number;
  createTimeText: string;
  id: number;
  images: string[];
  reviewRemark?: string;
  reviewTimeText?: string;
  status: RightsDeclarationStatus;
  statusText: string;
  voucherType: RightsDeclarationVoucherType;
  voucherTypeText: string;
}

export interface RightsDeclarationListResult {
  limit: number;
  list: RightsDeclarationRecord[];
  page: number;
  total: number;
}

export interface RightsDeclarationReviewStatusResult extends RightsDeclarationListResult {
  approvedCount: number;
  pendingCount: number;
}

export interface RightsDeclarationSubmitPayload {
  amount: number;
  images: string[];
  remark?: string;
  voucherType: RightsDeclarationVoucherType;
}

export interface GetRightsDeclarationListParams {
  limit?: number;
  page?: number;
  status?: RightsDeclarationStatus;
}

function readNumber(value: number | string | undefined, fallback = 0): number {
  const nextValue = typeof value === 'string' ? Number(value) : value;
  return typeof nextValue === 'number' && Number.isFinite(nextValue) ? nextValue : fallback;
}

function readString(value: string | undefined, fallback = ''): string {
  if (typeof value !== 'string') {
    return fallback;
  }

  const nextValue = value.trim();
  return nextValue || fallback;
}

function normalizeVoucherType(value: string | undefined): RightsDeclarationVoucherType {
  switch (value) {
    case 'transfer_record':
      return 'transfer_record';
    case 'other':
      return 'other';
    case 'screenshot':
    default:
      return 'screenshot';
  }
}

function normalizeStatus(value: string | undefined): RightsDeclarationStatus {
  switch (value) {
    case 'approved':
      return 'approved';
    case 'rejected':
      return 'rejected';
    case 'cancelled':
      return 'cancelled';
    case 'pending':
    default:
      return 'pending';
  }
}

function normalizeRecord(payload: RightsDeclarationRecordRaw): RightsDeclarationRecord {
  return {
    amount: readNumber(payload.amount),
    createTimeText: readString(payload.create_time_text),
    id: readNumber(payload.id),
    images: Array.isArray(payload.images_array)
      ? payload.images_array
          .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
          .map((item) => resolveUploadUrl(item))
      : [],
    reviewRemark: readString(payload.review_remark) || undefined,
    reviewTimeText: readString(payload.review_time_text) || undefined,
    status: normalizeStatus(payload.status),
    statusText: readString(payload.status_text),
    voucherType: normalizeVoucherType(payload.voucher_type),
    voucherTypeText: readString(payload.voucher_type_text),
  };
}

function normalizeListResult(payload: RightsDeclarationListRaw): RightsDeclarationListResult {
  return {
    limit: readNumber(payload.limit, 20),
    list: Array.isArray(payload.list) ? payload.list.map(normalizeRecord) : [],
    page: readNumber(payload.page, 1),
    total: readNumber(payload.total),
  };
}

export const rightsDeclarationApi = {
  async submit(
    payload: RightsDeclarationSubmitPayload,
    options: RightsDeclarationRequestOptions = {},
  ): Promise<{ declarationId: number }> {
    const response = await http.post<RightsDeclarationSubmitResultRaw, Record<string, unknown>>(
      '/api/rightsDeclaration/submit',
      {
        amount: payload.amount,
        images: payload.images,
        remark: payload.remark,
        voucher_type: payload.voucherType,
      },
      {
        headers: createApiHeaders(options),
        signal: options.signal,
      },
    );

    return {
      declarationId: readNumber(response.declaration_id),
    };
  },

  async getList(
    params: GetRightsDeclarationListParams = {},
    options: RightsDeclarationRequestOptions = {},
  ): Promise<RightsDeclarationListResult> {
    const response = await http.get<RightsDeclarationListRaw>('/api/rightsDeclaration/list', {
      headers: createApiHeaders(options),
      query: {
        limit: params.limit,
        page: params.page,
        status: params.status,
      },
      signal: options.signal,
    });

    return normalizeListResult(response);
  },

  async getReviewStatus(
    params: GetRightsDeclarationListParams = {},
    options: RightsDeclarationRequestOptions = {},
  ): Promise<RightsDeclarationReviewStatusResult> {
    const response = await http.get<RightsDeclarationReviewStatusRaw>(
      '/api/rightsDeclaration/reviewStatus',
      {
        headers: createApiHeaders(options),
        query: {
          limit: params.limit,
          page: params.page,
          status: params.status,
        },
        signal: options.signal,
      },
    );

    return {
      ...normalizeListResult(response),
      approvedCount: readNumber(response.approved_count),
      pendingCount: readNumber(response.pending_count),
    };
  },
};
