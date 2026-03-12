import { createApiHeaders, type ApiAuthOptions } from '../core/headers';
import { http } from '../http';
import { resolveUploadUrl } from './upload';

export interface ShopFavoriteRequestOptions extends ApiAuthOptions {
  signal?: AbortSignal;
}

interface ShopFavoriteItemRaw {
  id?: number | string;
  product_id?: number | string;
  name?: string;
  thumbnail?: string;
  price?: number | string;
  score_price?: number | string;
  purchase_type?: string;
  stock?: number | string;
  sales?: number | string;
  product_status?: string;
  create_time?: number | string;
}

interface ShopFavoriteListRaw {
  list?: ShopFavoriteItemRaw[];
  limit?: number | string;
  page?: number | string;
  total?: number | string;
}

export interface ShopFavoriteItem {
  id: number;
  productId: number;
  name: string;
  thumbnail?: string;
  price: number;
  scorePrice: number;
  purchaseType: string;
  stock: number;
  sales: number;
  productStatus: string;
  createTime?: number;
}

export interface ShopFavoriteList {
  list: ShopFavoriteItem[];
  limit: number;
  page: number;
  total: number;
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

function normalizeItem(payload: ShopFavoriteItemRaw): ShopFavoriteItem {
  const thumbnail = readString(payload.thumbnail) || undefined;
  return {
    id: readNumber(payload.id),
    productId: readNumber(payload.product_id),
    name: readString(payload.name),
    thumbnail: thumbnail ? resolveUploadUrl(thumbnail) : undefined,
    price: readNumber(payload.price),
    scorePrice: readNumber(payload.score_price),
    purchaseType: readString(payload.purchase_type, 'money'),
    stock: readNumber(payload.stock),
    sales: readNumber(payload.sales),
    productStatus: readString(payload.product_status, '0'),
    createTime:
      payload.create_time == null ? undefined : readNumber(payload.create_time),
  };
}

export const shopFavoriteApi = {
  async list(options: ShopFavoriteRequestOptions = {}): Promise<ShopFavoriteList> {
    const payload = await http.get<ShopFavoriteListRaw>('/api/ShopFavorite/index', {
      headers: createApiHeaders(options),
      signal: options.signal,
    });

    return {
      list: (payload.list ?? []).map(normalizeItem),
      limit: readNumber(payload.limit, 50),
      page: readNumber(payload.page, 1),
      total: readNumber(payload.total),
    };
  },

  async add(productId: number, options: ShopFavoriteRequestOptions = {}): Promise<void> {
    await http.post<null, { product_id: number }>(
      '/api/ShopFavorite/add',
      { product_id: productId },
      {
        headers: createApiHeaders(options),
        signal: options.signal,
      },
    );
  },

  async remove(ids: number[], options: ShopFavoriteRequestOptions = {}): Promise<void> {
    await http.post<null, { ids: number[] }>(
      '/api/ShopFavorite/remove',
      { ids },
      {
        headers: createApiHeaders(options),
        signal: options.signal,
      },
    );
  },
};
