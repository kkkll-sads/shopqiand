import { createApiHeaders, type ApiAuthOptions } from '../core/headers';
import { http } from '../http';

export interface ShopProductQaRequestOptions extends ApiAuthOptions {
  signal?: AbortSignal;
}

export type ShopProductQaSort = 'latest' | 'hottest';

interface ShopProductQaItemRaw {
  id?: number | string;
  question?: string;
  answer?: string;
  time?: string;
  answer_count?: number | string;
  has_answer?: boolean;
  asker?: string;
  answerer?: string;
  is_hot?: boolean;
}

interface ShopProductQaListRaw {
  list?: ShopProductQaItemRaw[];
  limit?: number | string;
  page?: number | string;
  total?: number | string;
}

export interface ShopProductQaItem {
  id: number;
  question: string;
  answer: string;
  time: string;
  answerCount: number;
  hasAnswer: boolean;
  asker?: string;
  answerer?: string;
  isHot: boolean;
}

export interface ShopProductQaList {
  list: ShopProductQaItem[];
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

function normalizeItem(payload: ShopProductQaItemRaw): ShopProductQaItem {
  return {
    id: readNumber(payload.id),
    question: readString(payload.question),
    answer: readString(payload.answer),
    time: readString(payload.time),
    answerCount: readNumber(payload.answer_count),
    hasAnswer: Boolean(payload.has_answer),
    asker: readString(payload.asker) || undefined,
    answerer: readString(payload.answerer) || undefined,
    isHot: Boolean(payload.is_hot),
  };
}

export const shopProductQaApi = {
  async list(
    productId: number,
    sort: ShopProductQaSort,
    options: ShopProductQaRequestOptions = {},
  ): Promise<ShopProductQaList> {
    const payload = await http.get<ShopProductQaListRaw>('/api/ShopProductQa/index', {
      headers: createApiHeaders(options),
      query: {
        product_id: productId,
        sort,
      },
      signal: options.signal,
    });

    return {
      list: (payload.list ?? []).map(normalizeItem),
      limit: readNumber(payload.limit, 20),
      page: readNumber(payload.page, 1),
      total: readNumber(payload.total),
    };
  },

  async ask(
    payload: { productId: number; content: string },
    options: ShopProductQaRequestOptions = {},
  ): Promise<number> {
    const response = await http.post<{ id?: number | string }, { product_id: number; content: string }>(
      '/api/ShopProductQa/ask',
      {
        product_id: payload.productId,
        content: payload.content,
      },
      {
        headers: createApiHeaders(options),
        signal: options.signal,
      },
    );

    return readNumber(response.id);
  },
};
