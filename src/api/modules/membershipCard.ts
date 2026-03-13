import { createApiHeaders, type ApiAuthOptions } from '../core/headers';
import { http } from '../http';

export interface MembershipCardRequestOptions extends ApiAuthOptions {
  signal?: AbortSignal;
}

interface MembershipCardProductRaw {
  cycle_type?: string;
  cycle_type_text?: string;
  daily_limit?: number | string;
  deduct_amount_per_use?: number | string;
  id?: number | string;
  level?: number | string;
  level_text?: string;
  min_fee?: number | string;
  name?: string;
  pending_activation_price?: number | string;
  price?: number | string;
  stackable?: boolean | number | string;
  valid_days?: number | string;
}

interface MembershipCardProductsResponseRaw {
  enabled?: boolean | number | string;
  list?: MembershipCardProductRaw[];
  min_pay_ratio?: number | string;
}

interface MembershipCardBuyResponseRaw {
  card_id?: number | string;
}

interface MembershipCardOwnedCardRaw {
  card_name?: string;
  card_product_id?: number | string;
  cycle_type_text?: string;
  daily_limit?: number | string;
  deduct_amount_per_use?: number | string;
  end_time_text?: string;
  id?: number | string;
  is_active?: boolean | number | string;
  level_text?: string;
  min_fee?: number | string;
  remaining_days?: number | string;
  source?: string;
  start_time_text?: string;
  status?: number | string;
  today_remaining?: number | string;
  today_usage?: number | string;
}

interface MembershipCardOwnedCardsResponseRaw {
  list?: MembershipCardOwnedCardRaw[];
}

interface MembershipCardDeductionPreviewCardRaw {
  card_id?: number | string;
  card_name?: string;
  deduct_amount?: number | string;
}

interface MembershipCardDeductionPreviewRaw {
  cards?: MembershipCardDeductionPreviewCardRaw[];
  deduct_total?: number | string;
  enabled?: boolean | number | string;
  final_fee?: number | string;
  original_fee?: number | string;
}

export interface MembershipCardProduct {
  cycleType: string;
  cycleTypeText?: string;
  dailyLimit: number;
  deductAmountPerUse: number;
  id: number;
  level: number;
  levelText?: string;
  minFee: number;
  name: string;
  pendingActivationPrice: number;
  price: number;
  stackable: boolean;
  validDays: number;
}

export interface MembershipCardProductsResponse {
  enabled: boolean;
  list: MembershipCardProduct[];
  minPayRatio: number;
}

export interface BuyMembershipCardPayload {
  cardProductId: number;
  payPendingActivationAmount: number;
  paySupplyChainAmount: number;
}

export interface BuyMembershipCardResult {
  cardId: number;
}

export type MembershipCardSource = 'purchase' | 'manual';

export interface MembershipCardOwnedCard {
  cardName: string;
  cardProductId: number;
  cycleTypeText?: string;
  dailyLimit: number;
  deductAmountPerUse: number;
  endTimeText?: string;
  id: number;
  isActive: boolean;
  levelText?: string;
  minFee: number;
  remainingDays: number;
  source: MembershipCardSource | string;
  startTimeText?: string;
  status: number;
  todayRemaining: number;
  todayUsage: number;
}

export interface MembershipCardDeductionPreviewCard {
  cardId: number;
  cardName: string;
  deductAmount: number;
}

export interface MembershipCardDeductionPreview {
  cards: MembershipCardDeductionPreviewCard[];
  deductTotal: number;
  enabled: boolean;
  finalFee: number;
  originalFee: number;
}

function readNumber(value: number | string | undefined, fallback = 0): number {
  const nextValue = typeof value === 'string' ? Number(value) : value;
  return typeof nextValue === 'number' && Number.isFinite(nextValue) ? nextValue : fallback;
}

function readBoolean(value: boolean | number | string | undefined): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  if (typeof value === 'string') {
    const normalizedValue = value.trim().toLowerCase();
    return normalizedValue === '1' || normalizedValue === 'true';
  }

  return false;
}

function readOptionalString(value: string | undefined): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const nextValue = value.trim();
  return nextValue || undefined;
}

function normalizeProduct(payload: MembershipCardProductRaw): MembershipCardProduct {
  return {
    cycleType: readOptionalString(payload.cycle_type) || 'quarter',
    cycleTypeText: readOptionalString(payload.cycle_type_text),
    dailyLimit: readNumber(payload.daily_limit),
    deductAmountPerUse: readNumber(payload.deduct_amount_per_use),
    id: readNumber(payload.id),
    level: readNumber(payload.level, 1),
    levelText: readOptionalString(payload.level_text),
    minFee: readNumber(payload.min_fee),
    name: readOptionalString(payload.name) || '权益卡',
    pendingActivationPrice: readNumber(payload.pending_activation_price),
    price: readNumber(payload.price),
    stackable: readBoolean(payload.stackable),
    validDays: readNumber(payload.valid_days),
  };
}

function normalizeOwnedCard(payload: MembershipCardOwnedCardRaw): MembershipCardOwnedCard {
  return {
    cardName: readOptionalString(payload.card_name) || '权益卡',
    cardProductId: readNumber(payload.card_product_id),
    cycleTypeText: readOptionalString(payload.cycle_type_text),
    dailyLimit: readNumber(payload.daily_limit),
    deductAmountPerUse: readNumber(payload.deduct_amount_per_use),
    endTimeText: readOptionalString(payload.end_time_text),
    id: readNumber(payload.id),
    isActive: readBoolean(payload.is_active),
    levelText: readOptionalString(payload.level_text),
    minFee: readNumber(payload.min_fee),
    remainingDays: readNumber(payload.remaining_days),
    source: readOptionalString(payload.source) || 'purchase',
    startTimeText: readOptionalString(payload.start_time_text),
    status: readNumber(payload.status),
    todayRemaining: readNumber(payload.today_remaining),
    todayUsage: readNumber(payload.today_usage),
  };
}

function normalizeDeductionPreviewCard(
  payload: MembershipCardDeductionPreviewCardRaw,
): MembershipCardDeductionPreviewCard {
  return {
    cardId: readNumber(payload.card_id),
    cardName: readOptionalString(payload.card_name) || '权益卡',
    deductAmount: readNumber(payload.deduct_amount),
  };
}

export const membershipCardApi = {
  async buy(
    payload: BuyMembershipCardPayload,
    options: MembershipCardRequestOptions = {},
  ): Promise<BuyMembershipCardResult> {
    const response = await http.post<
      MembershipCardBuyResponseRaw,
      {
        card_product_id: number;
        pay_pending_activation_amount: number;
        pay_supply_chain_amount: number;
      }
    >(
      '/api/membershipCard/buy',
      {
        card_product_id: payload.cardProductId,
        pay_pending_activation_amount: payload.payPendingActivationAmount,
        pay_supply_chain_amount: payload.paySupplyChainAmount,
      },
      {
        headers: createApiHeaders(options),
        signal: options.signal,
      },
    );

    return {
      cardId: readNumber(response.card_id),
    };
  },

  async myCards(options: MembershipCardRequestOptions = {}): Promise<MembershipCardOwnedCard[]> {
    const payload = await http.get<MembershipCardOwnedCardsResponseRaw>(
      '/api/membershipCard/myCards',
      {
        headers: createApiHeaders(options),
        signal: options.signal,
      },
    );

    return (payload.list ?? []).map(normalizeOwnedCard);
  },

  async previewDeduction(
    consignmentPrice: number,
    options: MembershipCardRequestOptions = {},
  ): Promise<MembershipCardDeductionPreview> {
    const payload = await http.post<
      MembershipCardDeductionPreviewRaw,
      { consignment_price: number }
    >(
      '/api/membershipCard/previewDeduction',
      {
        consignment_price: consignmentPrice,
      },
      {
        headers: createApiHeaders(options),
        signal: options.signal,
      },
    );

    return {
      cards: (payload.cards ?? []).map(normalizeDeductionPreviewCard),
      deductTotal: readNumber(payload.deduct_total),
      enabled: readBoolean(payload.enabled),
      finalFee: readNumber(payload.final_fee),
      originalFee: readNumber(payload.original_fee),
    };
  },

  async products(
    options: MembershipCardRequestOptions = {},
  ): Promise<MembershipCardProductsResponse> {
    const payload = await http.get<MembershipCardProductsResponseRaw>(
      '/api/membershipCard/products',
      {
        headers: createApiHeaders(options),
        signal: options.signal,
      },
    );

    return {
      enabled: readBoolean(payload.enabled),
      list: (payload.list ?? []).map(normalizeProduct),
      minPayRatio: readNumber(payload.min_pay_ratio),
    };
  },
};
