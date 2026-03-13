import { createApiHeaders, type ApiAuthOptions } from '../core/headers';
import { http } from '../http';

export interface ShopCouponRequestOptions extends ApiAuthOptions {
  signal?: AbortSignal;
}

export type ShopCouponTab = 'available' | 'received' | 'expired';
export type ShopCouponType = 'amount' | 'discount';

interface ShopCouponItemRaw {
  id?: number | string;
  coupon_id?: number | string;
  type?: string;
  value?: number | string;
  threshold?: number | string;
  title?: string;
  scope?: string;
  valid_until?: string;
  status?: string;
  rules?: string[];
  unusable_reason?: string;
}

interface ShopCouponListRaw {
  list?: ShopCouponItemRaw[];
  limit?: number | string;
  page?: number | string;
  total?: number | string;
}

export interface ShopCouponItem {
  id: string;
  couponId: number;
  type: ShopCouponType;
  value: number;
  threshold: number;
  title: string;
  scope: string;
  validUntil: string;
  status: ShopCouponTab;
  rules: string[];
  unusableReason?: string;
}

export interface ShopCouponList {
  list: ShopCouponItem[];
  limit: number;
  page: number;
  total: number;
}

export interface GetShopCouponListParams {
  limit?: number;
  page?: number;
  tab: ShopCouponTab;
}

function readNumber(value: number | string | undefined, fallback = 0) {
  const nextValue = typeof value === 'string' ? Number(value) : value;
  return typeof nextValue === 'number' && Number.isFinite(nextValue) ? nextValue : fallback;
}

function readString(value: string | undefined, fallback = '') {
  if (typeof value !== 'string') {
    return fallback;
  }
  const nextValue = value.trim();
  return nextValue || fallback;
}

function normalizeItem(payload: ShopCouponItemRaw): ShopCouponItem {
  const status = readString(payload.status, 'available') as ShopCouponTab;
  const type = readString(payload.type, 'amount') as ShopCouponType;

  return {
    id: readString(typeof payload.id === 'number' ? String(payload.id) : payload.id, '0'),
    couponId: readNumber(payload.coupon_id ?? payload.id),
    type,
    value: readNumber(payload.value),
    threshold: readNumber(payload.threshold),
    title: readString(payload.title),
    scope: readString(payload.scope),
    validUntil: readString(payload.valid_until),
    status,
    rules: Array.isArray(payload.rules) ? payload.rules.filter((item): item is string => typeof item === 'string') : [],
    unusableReason: readString(payload.unusable_reason) || undefined,
  };
}

export const shopCouponApi = {
  async list(
    params: GetShopCouponListParams,
    options: ShopCouponRequestOptions = {},
  ): Promise<ShopCouponList> {
    const payload = await http.get<ShopCouponListRaw>('/api/ShopCoupon/index', {
      headers: createApiHeaders(options),
      query: {
        limit: params.limit,
        page: params.page,
        tab: params.tab,
      },
      signal: options.signal,
    });

    return {
      list: (payload.list ?? []).map(normalizeItem),
      limit: readNumber(payload.limit, params.limit ?? 50),
      page: readNumber(payload.page, params.page ?? 1),
      total: readNumber(payload.total),
    };
  },

  async claim(couponId: number, options: ShopCouponRequestOptions = {}): Promise<void> {
    await http.post<null, { coupon_id: number }>(
      '/api/ShopCoupon/claim',
      { coupon_id: couponId },
      {
        headers: createApiHeaders(options),
        signal: options.signal,
      },
    );
  },
};
