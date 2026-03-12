import { http } from '../http';

function readNumber(value: unknown, fallback = 0): number {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : fallback;
}

function readString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function padDatePart(value: number): string {
  return String(value).padStart(2, '0');
}

function formatTimestamp(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return '';
  }

  const timestamp = value > 1_000_000_000_000 ? value : value * 1000;
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return [
    `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`,
    `${padDatePart(date.getHours())}:${padDatePart(date.getMinutes())}:${padDatePart(date.getSeconds())}`,
  ].join(' ');
}

function readDateTime(value: unknown, fallback = ''): string {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return fallback;
    }

    if (/^\d+$/.test(trimmed)) {
      return formatTimestamp(Number(trimmed)) || fallback;
    }

    return trimmed;
  }

  if (typeof value === 'number') {
    return formatTimestamp(value) || fallback;
  }

  return fallback;
}

export interface CollectionBuyOrder {
  order_no: string;
  order_id: number;
  user_collection_id: number;
  item_title: string;
  image: string;
  buy_price: number;
  pay_type_text: string;
  pay_balance_available: number;
  pay_pending_activation_gold: number;
  status_text: string;
  buy_time: string;
}

export interface CollectionBuyOrdersResponse {
  list: CollectionBuyOrder[];
  total: number;
  page: number;
  limit: number;
}

export interface CollectionSellOrder {
  order_no: string;
  order_id: number;
  consignment_id: number;
  user_collection_id: number;
  item_title: string;
  image: string;
  buy_price: number;
  sold_price: number;
  status_text: string;
  sold_time: string;
}

export interface CollectionSellOrdersResponse {
  list: CollectionSellOrder[];
  total: number;
  page: number;
  limit: number;
}

export interface CollectionOrderDetailItem {
  id: number;
  order_id?: number;
  item_id: number;
  item_title: string;
  item_image: string;
  price: number;
  quantity: number;
  subtotal: number;
  create_time?: number;
}

export interface CollectionOrderDetailResponse {
  id: number;
  order_no: string;
  user_id: number;
  total_amount: number;
  pay_type: string;
  pay_type_text: string;
  status: string;
  status_text: string;
  remark: string | null;
  reservation_id: number;
  pay_balance_available: number;
  pay_pending_activation_gold: number;
  pay_ratio: string;
  freeze_amount: number;
  freeze_balance_available: number;
  freeze_pending_activation_gold: number;
  refund_diff: number;
  refund_balance_available: number;
  refund_pending_activation_gold: number;
  pay_time: number;
  pay_time_text: string;
  complete_time: number;
  complete_time_text: string;
  create_time: number;
  create_time_text: string;
  update_time?: number;
  items: CollectionOrderDetailItem[];
}

export interface CollectionBuyOrderDetail {
  order_id: number;
  order_no: string;
  item_title: string;
  image: string;
  buy_price: number;
  total_amount: number;
  pay_type_text: string;
  pay_balance_available: number;
  pay_pending_activation_gold: number;
  pay_ratio: string;
  status_text: string;
  order_status: string;
  order_status_text: string;
  user_collection_id: number;
  mining_status: number;
  buy_time: string;
  create_time: string;
}

export interface CollectionSellOrderDetail {
  consignment_id: number;
  order_id: number;
  order_no: string;
  item_title: string;
  image: string;
  buy_price: number;
  sold_price: number;
  consign_price: number;
  profit_amount: number;
  service_fee: number;
  status_text: string;
  consign_time: string;
  sold_time: string;
  settle_status: number;
  settle_time: string;
  payout_total_withdrawable: number;
  payout_total_consume: number;
}

export type MyCollectionStatus =
  | 'all'
  | 'holding'
  | 'consigned'
  | 'mining'
  | 'failed'
  | 'sold';

export interface MyCollectionQuery {
  page?: number;
  limit?: number;
  status?: MyCollectionStatus;
  session_id?: number;
  zone_id?: number;
  keyword?: string;
  sort?: 'create_time' | 'price' | 'market_price' | 'consignment_price' | 'id';
  order?: 'asc' | 'desc';
}

interface MyCollectionItemRaw {
  id?: number | string;
  user_collection_id?: number | string;
  consignment_id?: number | string;
  unique_id?: string;
  title?: string;
  image?: string;
  asset_code?: string;
  hash?: string;
  price?: number | string;
  buy_price?: number | string;
  market_price?: number | string;
  sold_price?: number | string;
  principal_amount?: number | string;
  profit_amount?: number | string;
  transaction_count?: number | string;
  fail_count?: number | string;
  consignment_status?: number | string;
  consignment_status_text?: string;
  status_text?: string;
  session_id?: number | string;
  session_title?: string;
  session_start_time?: string;
  session_end_time?: string;
  zone_id?: number | string;
  price_zone?: string;
  zone_name?: string;
  price_zone_calc?: number | string;
  mining_status?: number | string;
  mining_start_time?: number | string;
  mining_start_time_text?: string;
  create_time?: number | string;
  create_time_text?: string;
  sold_time?: number | string;
  settle_status?: number | string;
  settle_time?: number | string | null;
  payout_total_withdrawable?: number | string;
  payout_total_consume?: number | string;
  service_fee?: number | string;
}

interface MyCollectionResponseRaw {
  list?: MyCollectionItemRaw[];
  total?: number | string;
  page?: number | string;
  limit?: number | string;
  current_page?: number | string;
  per_page?: number | string;
  last_page?: number | string;
}

export interface MyCollectionItem {
  id: number;
  user_collection_id: number;
  consignment_id: number;
  unique_id: string;
  title: string;
  image: string;
  asset_code: string;
  hash: string;
  price: number;
  buy_price: number;
  market_price: number;
  sold_price: number;
  principal_amount: number;
  profit_amount: number;
  transaction_count: number;
  fail_count: number;
  consignment_status: number;
  consignment_status_text: string;
  status_text: string;
  session_id: number;
  session_title: string;
  session_start_time: string;
  session_end_time: string;
  zone_id: number;
  price_zone: string;
  zone_name: string;
  price_zone_calc: number;
  mining_status: number;
  mining_start_time: number;
  mining_start_time_text: string;
  create_time: number;
  create_time_text: string;
  sold_time: string;
  settle_status: number;
  settle_time: string;
  payout_total_withdrawable: number;
  payout_total_consume: number;
  service_fee: number;
}

export interface MyCollectionResponse {
  list: MyCollectionItem[];
  total: number;
  page: number;
  limit: number;
  last_page: number;
}

function normalizeMyCollectionStatus(item: MyCollectionItemRaw): string {
  const miningStatus = readNumber(item.mining_status);
  const consignmentStatus = readNumber(item.consignment_status);
  const statusText = readString(item.status_text).trim();
  const consignmentStatusText = readString(item.consignment_status_text).trim();

  if (statusText) {
    return statusText;
  }

  if (consignmentStatusText) {
    return consignmentStatusText;
  }

  if (miningStatus === 1) {
    return '\u77ff\u673a\u8fd0\u884c\u4e2d';
  }

  if (consignmentStatus === 1) {
    return '\u5bc4\u552e\u4e2d';
  }

  if (consignmentStatus === 2) {
    return '\u5df2\u552e\u51fa';
  }

  if (consignmentStatus === 3) {
    return '\u5bc4\u552e\u5931\u8d25';
  }

  return '\u6301\u6709\u4e2d';
}

function normalizeMyCollectionItem(item: MyCollectionItemRaw): MyCollectionItem {
  const id = readNumber(item.id);
  const userCollectionId = readNumber(item.user_collection_id, id);
  const consignmentId = readNumber(item.consignment_id);
  const buyPrice = readNumber(item.buy_price, readNumber(item.price));
  const createTime = readNumber(item.create_time);
  const miningStartTime = readNumber(item.mining_start_time);

  return {
    id,
    user_collection_id: userCollectionId,
    consignment_id: consignmentId,
    unique_id: readString(item.unique_id, String(id || userCollectionId || consignmentId || 0)),
    title: readString(item.title),
    image: readString(item.image),
    asset_code: readString(item.asset_code),
    hash: readString(item.hash),
    price: readNumber(item.price, buyPrice),
    buy_price: buyPrice,
    market_price: readNumber(item.market_price, buyPrice),
    sold_price: readNumber(item.sold_price),
    principal_amount: readNumber(item.principal_amount, buyPrice),
    profit_amount: readNumber(item.profit_amount),
    transaction_count: readNumber(item.transaction_count),
    fail_count: readNumber(item.fail_count),
    consignment_status: readNumber(item.consignment_status),
    consignment_status_text: readString(item.consignment_status_text),
    status_text: normalizeMyCollectionStatus(item),
    session_id: readNumber(item.session_id),
    session_title: readString(item.session_title),
    session_start_time: readString(item.session_start_time),
    session_end_time: readString(item.session_end_time),
    zone_id: readNumber(item.zone_id),
    price_zone: readString(item.price_zone),
    zone_name: readString(item.zone_name),
    price_zone_calc: readNumber(item.price_zone_calc),
    mining_status: readNumber(item.mining_status),
    mining_start_time: miningStartTime,
    mining_start_time_text:
      readString(item.mining_start_time_text) || readDateTime(item.mining_start_time),
    create_time: createTime,
    create_time_text: readString(item.create_time_text) || readDateTime(item.create_time),
    sold_time: readDateTime(item.sold_time),
    settle_status: readNumber(item.settle_status),
    settle_time: readDateTime(item.settle_time),
    payout_total_withdrawable: readNumber(item.payout_total_withdrawable),
    payout_total_consume: readNumber(item.payout_total_consume),
    service_fee: readNumber(item.service_fee),
  };
}

export const collectionTradeApi = {
  myCollection(
    params: MyCollectionQuery = {},
    signal?: AbortSignal,
  ) {
    return http
      .get<MyCollectionResponseRaw>('/api/collectionTrade/myCollection', {
        query: {
          page: params.page ?? 1,
          limit: params.limit ?? 10,
          status: params.status ?? 'holding',
          ...(params.session_id != null && { session_id: params.session_id }),
          ...(params.zone_id != null && { zone_id: params.zone_id }),
          ...(params.keyword ? { keyword: params.keyword } : {}),
          ...(params.sort ? { sort: params.sort } : {}),
          ...(params.order ? { order: params.order } : {}),
        },
        signal,
      })
      .then((response): MyCollectionResponse => {
        const page = readNumber(response.current_page ?? response.page, params.page ?? 1);
        const limit = readNumber(response.per_page ?? response.limit, params.limit ?? 10);
        const total = readNumber(response.total);
        const lastPage = Math.max(
          1,
          readNumber(response.last_page, Math.ceil(total / Math.max(limit, 1))),
        );

        return {
          list: Array.isArray(response.list) ? response.list.map(normalizeMyCollectionItem) : [],
          total,
          page,
          limit,
          last_page: lastPage,
        };
      });
  },

  buyOrders(
    params?: { page?: number; limit?: number },
    signal?: AbortSignal,
  ) {
    return http.get<CollectionBuyOrdersResponse>('/api/collectionTrade/buyOrders', {
      query: { page: params?.page ?? 1, limit: params?.limit ?? 10 },
      signal,
    });
  },

  sellOrders(
    params?: { page?: number; limit?: number },
    signal?: AbortSignal,
  ) {
    return http.get<CollectionSellOrdersResponse>('/api/collectionTrade/sellOrders', {
      query: { page: params?.page ?? 1, limit: params?.limit ?? 10 },
      signal,
    });
  },

  detail(id: number, signal?: AbortSignal) {
    return http.get<CollectionOrderDetailResponse>('/api/collectionTrade/orderDetail', {
      query: { id },
      signal,
    });
  },

  buyOrderDetail(params: { id?: number; order_no?: string }, signal?: AbortSignal) {
    return http.get<CollectionBuyOrderDetail>('/api/collectionTrade/buyOrderDetail', {
      query: params,
      signal,
    });
  },

  sellOrderDetail(params: { id: number }, signal?: AbortSignal) {
    return http.get<CollectionSellOrderDetail>('/api/collectionTrade/sellOrderDetail', {
      query: params,
      signal,
    });
  },

  async toMining(userCollectionId: number | string, signal?: AbortSignal): Promise<void> {
    const formData = new FormData();
    formData.append('user_collection_id', String(userCollectionId));

    await http.post<Record<string, unknown>, FormData>('/api/collectionTrade/toMining', formData, {
      signal,
    });
  },
};
