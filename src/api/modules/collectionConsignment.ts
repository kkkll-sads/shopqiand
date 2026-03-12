import { http } from '../http';

function readNumber(value: unknown, fallback = 0): number {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : fallback;
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

function parseRemainingSeconds(value: string): number | null {
  const match = value.match(/(\d+):(\d{2}):(\d{2})/);
  if (!match) {
    return null;
  }

  const [, hours, minutes, seconds] = match;
  return readNumber(hours) * 3600 + readNumber(minutes) * 60 + readNumber(seconds);
}

interface CollectionConsignmentCheckRaw {
  [key: string]: unknown;
  appreciation_rate?: number | string;
  buy_price?: number | string;
  can_consign?: boolean | number | string;
  consignment_unlock_hours?: number | string;
  is_old_asset_package?: boolean | number | string;
  remaining_seconds?: number | string | null;
  remaining_text?: string;
  service_fee_rate?: number | string;
  unlock_hours?: number | string;
  unlocked?: boolean | number | string;
}

export interface CollectionConsignmentCheckData {
  [key: string]: unknown;
  appreciation_rate: number;
  buy_price: number;
  can_consign: boolean;
  consignment_unlock_hours: number;
  is_old_asset_package: boolean;
  remaining_seconds: number | null;
  remaining_text: string;
  service_fee_rate: number;
  unlock_hours: number;
  unlocked: boolean;
}

export interface ConsignCollectionPayload {
  price: number;
  user_collection_id: number | string;
}

export interface ConsignCollectionResult {
  [key: string]: unknown;
  coupon_remaining: number;
  coupon_used: number;
  rollback_reason: string;
  waive_type: string;
}

function normalizeConsignmentCheck(
  payload: CollectionConsignmentCheckRaw | null | undefined,
): CollectionConsignmentCheckData {
  const rawRemainingText = readString(payload?.remaining_text);
  const rawRemainingSeconds =
    payload?.remaining_seconds == null ? null : readNumber(payload.remaining_seconds);
  const remainingSeconds =
    rawRemainingSeconds ?? (rawRemainingText ? parseRemainingSeconds(rawRemainingText) : null);
  const unlocked =
    readBoolean(payload?.can_consign)
    || readBoolean(payload?.unlocked)
    || (typeof remainingSeconds === 'number' && remainingSeconds <= 0);

  return {
    ...payload,
    appreciation_rate: readNumber(payload?.appreciation_rate),
    buy_price: readNumber(payload?.buy_price),
    can_consign: unlocked,
    consignment_unlock_hours: readNumber(payload?.consignment_unlock_hours),
    is_old_asset_package: readBoolean(payload?.is_old_asset_package),
    remaining_seconds: remainingSeconds,
    remaining_text: rawRemainingText,
    service_fee_rate: readNumber(payload?.service_fee_rate, 0.03),
    unlock_hours: readNumber(payload?.unlock_hours),
    unlocked,
  };
}

export function computeConsignmentPrice(
  check: Pick<CollectionConsignmentCheckData, 'buy_price' | 'appreciation_rate'> | null | undefined,
): number {
  if (!check) {
    return 0;
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

    const response = await http.post<Record<string, unknown>, FormData>(
      '/api/collectionConsignment/consign',
      formData,
      { signal },
    );

    return {
      ...response,
      coupon_remaining: readNumber(response.coupon_remaining),
      coupon_used: readNumber(response.coupon_used),
      rollback_reason: readString(response.rollback_reason),
      waive_type: readString(response.waive_type),
    };
  },
};
