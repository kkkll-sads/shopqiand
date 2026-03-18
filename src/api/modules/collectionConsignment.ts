import { http } from '../http';

function readNumber(value: unknown, fallback = 0): number {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : fallback;
}

function readNullableNumber(value: unknown): number | null {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : null;
}

function readString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function readBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value === 1;
  }

  if (typeof value === 'string') {
    const normalizedValue = value.trim().toLowerCase();
    return normalizedValue === '1' || normalizedValue === 'true' || normalizedValue === 'yes';
  }

  return false;
}

function readOptionalBoolean(value: unknown): boolean | undefined {
  if (
    typeof value !== 'boolean'
    && typeof value !== 'number'
    && typeof value !== 'string'
  ) {
    return undefined;
  }

  return readBoolean(value);
}

function readRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function readFirstNumber(
  source: Record<string, unknown> | null | undefined,
  keys: string[],
  fallback = 0,
): number {
  if (!source) {
    return fallback;
  }

  for (const key of keys) {
    const nextValue = Number(source[key]);
    if (Number.isFinite(nextValue)) {
      return nextValue;
    }
  }

  return fallback;
}

function readFirstString(
  source: Record<string, unknown> | null | undefined,
  keys: string[],
  fallback = '',
): string {
  if (!source) {
    return fallback;
  }

  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string') {
      return value;
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
  }

  return fallback;
}

function parseRemainingSeconds(value: string): number | null {
  const match = value.match(/(\d+):(\d{2}):(\d{2})/);
  if (!match) {
    return null;
  }

  const [, hours, minutes, seconds] = match;
  return readNumber(hours) * 3600 + readNumber(minutes) * 60 + readNumber(seconds);
}

export interface ConsignmentEquityCard {
  id: number;
  card_name: string;
  deduct_amount_per_use: number;
  actual_deduct_amount: number;
  remaining_days: number;
  today_remaining: number;
  end_time_text: string;
  end_time: number;
}

interface CollectionConsignmentCheckRaw {
  [key: string]: unknown;
  appreciation_rate?: number | string;
  available_confirm_fee_balance?: number | string;
  available_consignment_coupon_count?: number | string;
  available_coupon_count?: number | string;
  available_equity_cards?: Array<Record<string, unknown>>;
  available_service_fee_balance?: number | string;
  base_fee?: number | string;
  global_min_fee?: number | string;
  buy_price?: number | string;
  can_consign?: boolean | number | string;
  confirm_fee_balance?: number | string;
  consignment_coupon?: number | string;
  consignment_coupon_count?: number | string;
  consignment_coupon_required?: number | string;
  consignment_price?: number | string;
  consignment_service_fee?: number | string;
  consignment_unlock_hours?: number | string;
  consume_coupon_count?: number | string;
  coupon_balance?: number | string;
  coupon_count?: number | string;
  coupon_remaining?: number | string;
  coupon_required?: number | string;
  estimated_price?: number | string;
  estimate_price?: number | string;
  fail_count?: number | string;
  fee?: number | string;
  free_attempts_remaining?: number | string;
  free_consign_attempts?: number | string;
  membership_deduction?: number | string;
  need_coupon_count?: number | string;
  original_service_fee?: number | string;
  price?: number | string;
  required_consignment_coupon?: number | string;
  required_coupon_count?: number | string;
  required_service_fee?: number | string;
  is_old_asset_package?: boolean | number | string;
  is_free_resend?: boolean | number | string;
  message?: string;
  sell_price?: number | string;
  recommended_equity_card_id?: number | string | null;
  remaining_seconds?: number | string | null;
  remaining_text?: string;
  service_fee?: number | string;
  service_fee_balance?: number | string;
  service_fee_rate?: number | string;
  unlock_hours?: number | string;
  unlocked?: boolean | number | string;
  waive_type?: string;
}

interface BatchConsignableItemRaw {
  user_collection_id?: number | string;
  title?: string;
  image?: string;
  buy_price?: number | string;
  consignment_price?: number | string;
  service_fee?: number | string;
  service_fee_rate?: number | string;
  session_title?: string;
  zone_name?: string;
}

interface BatchConsignableListRaw {
  available_now_count?: number | string;
  current_page?: number | string;
  has_more?: boolean | number | string;
  items?: BatchConsignableItemRaw[];
  last_page?: number | string;
  note?: string;
  per_page?: number | string;
  returned_items_count?: number | string;
  stats?: {
    active_sessions?: number | string;
    available_collections?: number | string;
    current_time?: string;
    is_in_trading_time?: boolean | number | string;
    total_collections?: number | string;
  };
  total?: number | string;
}

interface BatchConsignResultItemRaw {
  data?: {
    consignment_id?: number | string;
    price?: number | string;
    service_fee?: number | string;
    waive_type?: string;
  };
  index?: number | string;
  message?: string;
  success?: boolean | number | string;
  user_collection_id?: number | string;
}

interface BatchConsignResultRaw {
  failure_count?: number | string;
  failure_summary?: Record<string, number | string> | null;
  note?: string;
  results?: BatchConsignResultItemRaw[];
  success_count?: number | string;
  total_count?: number | string;
}

export interface CollectionConsignmentCheckData {
  [key: string]: unknown;
  appreciation_rate: number;
  available_coupon_count: number;
  buy_price: number;
  can_consign: boolean;
  consignment_price: number;
  consignment_unlock_hours: number;
  fail_count: number;
  free_attempts_remaining: number;
  free_consign_attempts: number;
  is_old_asset_package: boolean;
  is_free_resend: boolean;
  membership_deduction: number;
  message: string;
  original_service_fee: number;
  required_coupon_count: number;
  remaining_seconds: number | null;
  remaining_text: string;
  service_fee: number;
  service_fee_balance: string;
  service_fee_rate: number;
  unlock_hours: number;
  unlocked: boolean;
  waive_type: string;
  available_equity_cards: ConsignmentEquityCard[];
  recommended_equity_card_id: number | null;
  base_fee?: number;
  global_min_fee?: number;
}

export interface ConsignCollectionPayload {
  user_collection_id: number | string;
  price: number;
  equity_card_ids?: number[];
}

export interface ConsignCollectionResult {
  [key: string]: unknown;
  consignment_id: number;
  coupon_remaining: number;
  coupon_used: number;
  envelope_message: string;
  error_code: number | null;
  free_attempts_remaining: number;
  is_free_resend: boolean;
  required_coupon_count: number;
  rollback_reason: string;
  service_fee: number;
  service_fee_balance: string;
  success: boolean | undefined;
  waive_type: string;
}

export interface BatchConsignableListItem {
  user_collection_id: number;
  title?: string;
  image?: string | null;
  buy_price?: number;
  consignment_price?: number;
  service_fee?: number;
  service_fee_rate?: number;
}

export interface BatchConsignableListData {
  available_now_count: number;
  current_page: number;
  has_more: boolean;
  items: BatchConsignableListItem[];
  last_page: number;
  note: string;
  per_page: number;
  returned_items_count: number;
  stats: {
    active_sessions: number;
    available_collections: number;
    current_time: string;
    is_in_trading_time: boolean;
    total_collections: number;
  };
  total: number;
}

export interface BatchConsignResultItem {
  data?: {
    consignment_id: number;
    price: number;
    service_fee: number;
    waive_type: string;
  };
  index: number;
  message: string;
  success: boolean;
  user_collection_id: number;
}

export interface BatchConsignResult {
  failure_count: number;
  failure_summary: Record<string, number>;
  note: string;
  results: BatchConsignResultItem[];
  success_count: number;
  total_count: number;
}

function normalizeConsignmentCheck(
  payload: CollectionConsignmentCheckRaw | null | undefined,
): CollectionConsignmentCheckData {
  const record = readRecord(payload);
  const rawRemainingText = readString(payload?.remaining_text);
  const rawRemainingSeconds =
    payload?.remaining_seconds == null ? null : readNumber(payload.remaining_seconds);
  const remainingSeconds =
    rawRemainingSeconds ?? (rawRemainingText ? parseRemainingSeconds(rawRemainingText) : null);
  const isFreeResend = readBoolean(payload?.is_free_resend);
  const unlocked =
    readBoolean(payload?.can_consign)
    || readBoolean(payload?.unlocked)
    || (typeof remainingSeconds === 'number' && remainingSeconds <= 0);
  const consignmentPrice = readFirstNumber(record, [
    'consignment_price',
    'estimated_price',
    'estimate_price',
    'sell_price',
    'price',
  ]);

  const rawEquityCards = payload?.available_equity_cards ?? record?.available_equity_cards;
  const equityCards: ConsignmentEquityCard[] = Array.isArray(rawEquityCards)
    ? rawEquityCards.map((item) => {
        const r = readRecord(item);
        return {
          id: readFirstNumber(r, ['id']),
          card_name: readFirstString(r, ['card_name']) || '权益卡',
          deduct_amount_per_use: readFirstNumber(r, ['deduct_amount_per_use']),
          actual_deduct_amount: readFirstNumber(r, ['actual_deduct_amount']),
          remaining_days: readFirstNumber(r, ['remaining_days']),
          today_remaining: readFirstNumber(r, ['today_remaining']),
          end_time_text: readFirstString(r, ['end_time_text']),
          end_time: readFirstNumber(r, ['end_time']),
        };
      })
    : [];

  const recommendedId = payload?.recommended_equity_card_id ?? record?.recommended_equity_card_id;
  const recommendedEquityCardId =
    recommendedId == null || recommendedId === '' ? null : readNumber(recommendedId);

  const baseFee = readNumber(payload?.base_fee ?? record?.base_fee);
  const globalMinFee = readNumber(payload?.global_min_fee ?? record?.global_min_fee);

  return {
    ...payload,
    appreciation_rate: readNumber(payload?.appreciation_rate),
    available_coupon_count: readFirstNumber(record, [
      'available_coupon_count',
      'available_consignment_coupon_count',
      'consignment_coupon_count',
      'consignment_coupon',
      'coupon_balance',
      'coupon_remaining',
      'coupon_count',
    ]),
    buy_price: readNumber(payload?.buy_price),
    can_consign: unlocked,
    consignment_price: consignmentPrice,
    consignment_unlock_hours: readNumber(payload?.consignment_unlock_hours),
    fail_count: readNumber(payload?.fail_count),
    free_attempts_remaining: readNumber(payload?.free_attempts_remaining),
    free_consign_attempts: readNumber(payload?.free_consign_attempts),
    is_old_asset_package: readBoolean(payload?.is_old_asset_package),
    is_free_resend: isFreeResend,
    membership_deduction: readNumber(payload?.membership_deduction),
    message: readString(payload?.message),
    original_service_fee: readNumber(payload?.original_service_fee),
    required_coupon_count: isFreeResend
      ? 0
      : Math.max(
          1,
          readFirstNumber(record, [
            'required_coupon_count',
            'need_coupon_count',
            'coupon_required',
            'consignment_coupon_required',
            'required_consignment_coupon',
            'consume_coupon_count',
          ], 1),
        ),
    remaining_seconds: remainingSeconds,
    remaining_text: rawRemainingText,
    service_fee: readFirstNumber(record, [
      'service_fee',
      'required_service_fee',
      'consignment_service_fee',
      'fee',
    ]),
    service_fee_balance: readFirstString(record, [
      'service_fee_balance',
      'available_service_fee_balance',
      'confirm_fee_balance',
      'available_confirm_fee_balance',
    ]),
    service_fee_rate: readNumber(payload?.service_fee_rate, 0.03),
    unlock_hours: readNumber(payload?.unlock_hours),
    unlocked,
    waive_type: readString(payload?.waive_type),
    available_equity_cards: equityCards,
    recommended_equity_card_id: recommendedEquityCardId,
    base_fee: baseFee > 0 ? baseFee : undefined,
    global_min_fee: globalMinFee > 0 ? globalMinFee : undefined,
  };
}

function normalizeBatchConsignableList(
  payload: BatchConsignableListRaw | null | undefined,
): BatchConsignableListData {
  const total = readNumber(payload?.total);
  const perPage = Math.min(50, Math.max(1, readNumber(payload?.per_page, 20)));
  const currentPage = readNumber(payload?.current_page, 1);
  const lastPage = readNumber(payload?.last_page, 1);
  const hasMore = readBoolean(payload?.has_more) || currentPage < lastPage;

  return {
    available_now_count: readNumber(payload?.available_now_count),
    current_page: currentPage,
    has_more: hasMore,
    items: Array.isArray(payload?.items)
      ? payload.items.map((item) => ({
          user_collection_id: readNumber(item.user_collection_id),
          title: readString(item.title) || undefined,
          image: readString(item.image) || undefined,
          buy_price: readNumber(item.buy_price) || undefined,
          consignment_price: readNumber(item.consignment_price) || undefined,
          service_fee: readNumber(item.service_fee) || undefined,
          service_fee_rate: readNumber(item.service_fee_rate) || undefined,
        }))
      : [],
    last_page: lastPage,
    note: readString(payload?.note),
    per_page: perPage,
    returned_items_count: readNumber(payload?.returned_items_count),
    stats: {
      active_sessions: readNumber(payload?.stats?.active_sessions),
      available_collections: readNumber(payload?.stats?.available_collections),
      current_time: readString(payload?.stats?.current_time),
      is_in_trading_time: readBoolean(payload?.stats?.is_in_trading_time),
      total_collections: readNumber(payload?.stats?.total_collections),
    },
    total,
  };
}

function normalizeBatchConsignResult(
  payload: BatchConsignResultRaw | null | undefined,
): BatchConsignResult {
  const summaryEntries = payload?.failure_summary
    ? Object.entries(payload.failure_summary).map(([key, value]) => [key, readNumber(value)])
    : [];

  return {
    failure_count: readNumber(payload?.failure_count),
    failure_summary: Object.fromEntries(summaryEntries),
    note: readString(payload?.note),
    results: Array.isArray(payload?.results)
      ? payload.results.map((item) => ({
          data: item.data
            ? {
                consignment_id: readNumber(item.data.consignment_id),
                price: readNumber(item.data.price),
                service_fee: readNumber(item.data.service_fee),
                waive_type: readString(item.data.waive_type),
              }
            : undefined,
          index: readNumber(item.index),
          message: readString(item.message),
          success: readBoolean(item.success),
          user_collection_id: readNumber(item.user_collection_id),
        }))
      : [],
    success_count: readNumber(payload?.success_count),
    total_count: readNumber(payload?.total_count),
  };
}

export function computeConsignmentPrice(
  check: Pick<CollectionConsignmentCheckData, 'appreciation_rate' | 'buy_price' | 'consignment_price'> | null | undefined,
): number {
  if (!check) {
    return 0;
  }

  const directPrice = readNumber(check.consignment_price);
  if (directPrice > 0) {
    return Number(directPrice.toFixed(2));
  }

  const buyPrice = readNumber(check.buy_price);
  if (buyPrice <= 0) {
    return 0;
  }

  return Number((buyPrice * (1 + readNumber(check.appreciation_rate))).toFixed(2));
}

export const collectionConsignmentApi = {
  consignmentCheck(userCollectionId: number | string, signal?: AbortSignal) {
    return http
      .get<CollectionConsignmentCheckRaw>('/api/collectionConsignment/consignmentCheck', {
        query: { user_collection_id: userCollectionId },
        signal,
      })
      .then(normalizeConsignmentCheck);
  },

  async consign(
    payload: ConsignCollectionPayload,
    signal?: AbortSignal,
  ): Promise<ConsignCollectionResult> {
    const formData = new FormData();
    formData.append('user_collection_id', String(payload.user_collection_id));
    formData.append('price', String(payload.price));
    if (Array.isArray(payload.equity_card_ids) && payload.equity_card_ids.length > 0) {
      for (const cardId of payload.equity_card_ids) {
        if (cardId > 0) {
          formData.append('equity_card_ids[]', String(cardId));
        }
      }
    }

    const response = await http.post<{
      biz_code?: number | string;
      code: number | string;
      data: Record<string, unknown> | null;
      message?: string;
      msg?: string;
    }, FormData>(
      '/api/collectionConsignment/consign',
      formData,
      { signal, unwrapEnvelope: false },
    );
    const data = readRecord(response.data);

    return {
      ...data,
      consignment_id: readFirstNumber(data, ['consignment_id', 'id']),
      coupon_remaining: readFirstNumber(data, [
        'coupon_remaining',
        'available_coupon_count',
        'available_consignment_coupon_count',
      ]),
      coupon_used: readFirstNumber(data, [
        'coupon_used',
        'used_coupon_count',
        'consume_coupon_count',
      ]),
      envelope_message: readString(response.message, readString(response.msg)),
      error_code: readNullableNumber(data?.error_code ?? data?.biz_error_code),
      free_attempts_remaining: readNumber(data?.free_attempts_remaining),
      is_free_resend: readBoolean(data?.is_free_resend),
      required_coupon_count: readFirstNumber(data, [
        'required_coupon_count',
        'need_coupon_count',
        'coupon_required',
        'consignment_coupon_required',
        'required_consignment_coupon',
        'consume_coupon_count',
      ], 1),
      rollback_reason: readFirstString(data, ['rollback_reason', 'fail_reason', 'reason']),
      service_fee: readFirstNumber(data, [
        'service_fee',
        'required_service_fee',
        'consignment_service_fee',
        'fee',
      ]),
      service_fee_balance: readFirstString(data, [
        'service_fee_balance',
        'available_service_fee_balance',
        'confirm_fee_balance',
        'available_confirm_fee_balance',
      ]),
      success: readOptionalBoolean(data?.success),
      waive_type: readString(data?.waive_type),
    };
  },

  /** 寄售详情：用于已售出藏品的成交订单号、卖家收益流水号等 */
  consignmentDetail(consignmentId: number | string, signal?: AbortSignal) {
    return http
      .get<{ buy_price?: number; order_no?: string; flow_no?: string }>(
        '/api/collectionConsignment/consignmentDetail',
        { query: { consignment_id: consignmentId }, signal },
      )
      .then((res) => ({
        buy_price: readNumber(res?.buy_price),
        order_no: readString(res?.order_no),
        flow_no: readString(res?.flow_no),
      }));
  },

  batchConsignableList(
    params?: { page?: number; limit?: number },
    signal?: AbortSignal,
  ) {
    const page = Math.max(1, params?.page ?? 1);
    const limit = Math.min(50, Math.max(1, params?.limit ?? 20));
    return http
      .get<BatchConsignableListRaw>('/api/collectionConsignment/batchConsignableList', {
        query: { page, limit },
        signal,
      })
      .then(normalizeBatchConsignableList);
  },

  async batchConsign(
    payload: {
      consignments: Array<{
        user_collection_id: number | string;
        equity_card_ids?: number[];
      }>;
    },
    signal?: AbortSignal,
  ): Promise<BatchConsignResult> {
    const response = await http.post<BatchConsignResultRaw, typeof payload>(
      '/api/collectionConsignment/batchConsign',
      payload,
      { signal },
    );

    return normalizeBatchConsignResult(response);
  },
};

export function getConsignFailureMessage(
  result: Pick<ConsignCollectionResult, 'consignment_id' | 'envelope_message' | 'rollback_reason' | 'success'>,
): string {
  const rollbackReason = readString(result.rollback_reason).trim();
  if (rollbackReason) {
    return rollbackReason;
  }

  const envelopeMessage = readString(result.envelope_message).trim();
  if (!envelopeMessage) {
    return '';
  }

  if (result.success === false) {
    return envelopeMessage;
  }

  if (result.consignment_id <= 0 && /(不足|失败|错误|异常|无法|不可|不能|驳回|回滚)/.test(envelopeMessage)) {
    return envelopeMessage;
  }

  return '';
}
