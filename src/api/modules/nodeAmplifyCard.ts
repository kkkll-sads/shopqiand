import { ApiError } from '../core/errors';
import { createApiHeaders, type ApiAuthOptions } from '../core/headers';
import { http } from '../http';

export interface NodeAmplifyCardRequestOptions extends ApiAuthOptions {
  signal?: AbortSignal;
}

interface BindableMiningItemRaw {
  image?: string;
  item_id?: number | string;
  mining_start_time?: number | string;
  price?: number | string;
  title?: string;
  user_collection_id?: number | string;
}

interface BindableMiningResponseRaw {
  list?: BindableMiningItemRaw[];
  total?: number | string;
}

export interface BindableMiningParams {
  limit?: number;
  page?: number;
}

export interface BindableMiningResponse {
  hasMore: boolean;
  list: BindableMiningItem[];
  page: number;
  total: number;
}

interface BuyNodeAmplifyCardResponseRaw {
  card_id?: number | string;
}

export interface BindableMiningItem {
  image?: string;
  itemId: number;
  miningStartTime: number;
  price: number;
  title: string;
  userCollectionId: number;
}

export interface BuyNodeAmplifyCardPayload {
  productId: number;
  userCollectionId: number;
}

export interface BuyNodeAmplifyCardResult {
  cardId: number;
}

function readNumber(value: number | string | undefined, fallback = 0): number {
  const v = typeof value === 'string' ? Number(value) : value;
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

function readOptionalString(value: string | undefined): string | undefined {
  if (typeof value !== 'string') return undefined;
  const v = value.trim();
  return v || undefined;
}

function normalizeMiningItem(raw: BindableMiningItemRaw): BindableMiningItem {
  return {
    image: readOptionalString(raw.image),
    itemId: readNumber(raw.item_id),
    miningStartTime: readNumber(raw.mining_start_time),
    price: readNumber(raw.price),
    title: readOptionalString(raw.title) || '矿机',
    userCollectionId: readNumber(raw.user_collection_id),
  };
}

export const nodeAmplifyCardApi = {
  async bindableMining(
    params: BindableMiningParams = {},
    options: NodeAmplifyCardRequestOptions = {},
  ): Promise<BindableMiningResponse> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;

    const payload = await http.get<BindableMiningResponseRaw>(
      '/api/nodeAmplifyCard/bindableMining',
      {
        headers: createApiHeaders(options),
        query: { page, limit },
        signal: options.signal,
      },
    );

    const list = (payload.list ?? []).map(normalizeMiningItem);
    const total = readNumber(payload.total);

    return {
      hasMore: page * limit < total,
      list,
      page,
      total,
    };
  },

  async buy(
    data: BuyNodeAmplifyCardPayload,
    options: NodeAmplifyCardRequestOptions = {},
  ): Promise<BuyNodeAmplifyCardResult> {
    interface BuyEnvelope {
      code?: number | string;
      data: BuyNodeAmplifyCardResponseRaw | null;
      message?: string;
      msg?: string;
    }

    const envelope = await http.post<BuyEnvelope, { product_id: number; user_collection_id: number }>(
      '/api/nodeAmplifyCard/buy',
      {
        product_id: data.productId,
        user_collection_id: data.userCollectionId,
      },
      {
        headers: createApiHeaders(options),
        signal: options.signal,
        unwrapEnvelope: false,
      },
    );

    const responseData = envelope?.data;
    if (responseData == null) {
      throw new ApiError(
        envelope?.message || envelope?.msg || '购买失败',
        { code: envelope?.code, details: envelope },
      );
    }

    return {
      cardId: readNumber(responseData.card_id),
    };
  },
};
