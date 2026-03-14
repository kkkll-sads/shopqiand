import { ApiError } from '../core/errors';
import { createApiHeaders, type ApiAuthOptions } from '../core/headers';
import { http } from '../http';

export interface MembershipCardRequestOptions extends ApiAuthOptions {
  signal?: AbortSignal;
}

export type MembershipCardType = 'membership' | 'node_amplify';

interface MembershipCardProductRaw {
  amplify_type?: string;
  amplify_type_text?: string;
  amplify_value?: number | string;
  card_type?: string;
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
  score_amplify_value?: number | string;
  valid_days?: number | string;
}

interface MembershipCardProductsResponseRaw {
  list?: MembershipCardProductRaw[];
  membership_enabled?: boolean | number | string;
  node_amplify_enabled?: boolean | number | string;
}

interface MembershipCardBuyResponseRaw {
  card_id?: number | string;
}

interface MembershipCardOwnedCardRaw {
  card_name?: string;
  card_product_id?: number | string;
  card_type?: string;
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

interface AmplifyCardOwnedCardRaw {
  amplify_type?: string;
  amplify_type_text?: string;
  amplify_value?: number | string;
  card_type?: string;
  collection_image?: string;
  collection_price?: number | string;
  collection_title?: string;
  cycle_type?: string;
  cycle_type_text?: string;
  end_time_text?: string;
  id?: number | string;
  is_active?: boolean | number | string;
  level?: number | string;
  level_text?: string;
  product_id?: number | string;
  product_name?: string;
  remaining_days?: number | string;
  score_amplify_value?: number | string;
  source?: string;
  start_time_text?: string;
  status?: number | string;
  user_collection_id?: number | string;
}

interface MembershipCardOwnedCardsResponseRaw {
  amplify_list?: AmplifyCardOwnedCardRaw[];
  membership_list?: MembershipCardOwnedCardRaw[];
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
  amplifyType?: string;
  amplifyTypeText?: string;
  amplifyValue: number;
  cardType: MembershipCardType;
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
  scoreAmplifyValue: number;
  validDays: number;
}

export interface MembershipCardProductsResponse {
  list: MembershipCardProduct[];
  membershipEnabled: boolean;
  nodeAmplifyEnabled: boolean;
}

export interface BuyMembershipCardPayload {
  cardProductId: number;
}

export interface BuyMembershipCardResult {
  cardId: number;
}

export type MembershipCardSource = 'purchase' | 'manual';

export interface MembershipCardOwnedCard {
  cardName: string;
  cardProductId: number;
  cardType: 'membership';
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

export interface AmplifyCardOwnedCard {
  amplifyType?: string;
  amplifyTypeText?: string;
  amplifyValue: number;
  cardType: 'node_amplify';
  collectionImage?: string;
  collectionPrice: number;
  collectionTitle?: string;
  cycleType: string;
  cycleTypeText?: string;
  endTimeText?: string;
  id: number;
  isActive: boolean;
  level: number;
  levelText?: string;
  productId: number;
  productName: string;
  remainingDays: number;
  scoreAmplifyValue: number;
  source: MembershipCardSource | string;
  startTimeText?: string;
  status: number;
  userCollectionId: number;
}

export interface MyCardsResponse {
  amplifyList: AmplifyCardOwnedCard[];
  membershipList: MembershipCardOwnedCard[];
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
  const cardType = payload.card_type === 'node_amplify' ? 'node_amplify' : 'membership';
  return {
    amplifyType: readOptionalString(payload.amplify_type),
    amplifyTypeText: readOptionalString(payload.amplify_type_text),
    amplifyValue: readNumber(payload.amplify_value),
    cardType,
    cycleType: readOptionalString(payload.cycle_type) || 'quarter',
    cycleTypeText: readOptionalString(payload.cycle_type_text),
    dailyLimit: readNumber(payload.daily_limit),
    deductAmountPerUse: readNumber(payload.deduct_amount_per_use),
    id: readNumber(payload.id),
    level: readNumber(payload.level),
    levelText: readOptionalString(payload.level_text),
    minFee: readNumber(payload.min_fee),
    name: readOptionalString(payload.name) || (cardType === 'node_amplify' ? '节点赋能卡' : '权益卡'),
    pendingActivationPrice: readNumber(payload.pending_activation_price),
    price: readNumber(payload.price),
    scoreAmplifyValue: readNumber(payload.score_amplify_value),
    validDays: readNumber(payload.valid_days),
  };
}

function normalizeOwnedCard(payload: MembershipCardOwnedCardRaw): MembershipCardOwnedCard {
  return {
    cardName: readOptionalString(payload.card_name) || '权益卡',
    cardProductId: readNumber(payload.card_product_id),
    cardType: 'membership',
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

function normalizeAmplifyOwnedCard(payload: AmplifyCardOwnedCardRaw): AmplifyCardOwnedCard {
  return {
    amplifyType: readOptionalString(payload.amplify_type),
    amplifyTypeText: readOptionalString(payload.amplify_type_text),
    amplifyValue: readNumber(payload.amplify_value),
    cardType: 'node_amplify',
    collectionImage: readOptionalString(payload.collection_image),
    collectionPrice: readNumber(payload.collection_price),
    collectionTitle: readOptionalString(payload.collection_title),
    cycleType: readOptionalString(payload.cycle_type) || 'quarter',
    cycleTypeText: readOptionalString(payload.cycle_type_text),
    endTimeText: readOptionalString(payload.end_time_text),
    id: readNumber(payload.id),
    isActive: readBoolean(payload.is_active),
    level: readNumber(payload.level),
    levelText: readOptionalString(payload.level_text),
    productId: readNumber(payload.product_id),
    productName: readOptionalString(payload.product_name) || '节点赋能卡',
    remainingDays: readNumber(payload.remaining_days),
    scoreAmplifyValue: readNumber(payload.score_amplify_value),
    source: readOptionalString(payload.source) || 'purchase',
    startTimeText: readOptionalString(payload.start_time_text),
    status: readNumber(payload.status),
    userCollectionId: readNumber(payload.user_collection_id),
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
    interface BuyEnvelope {
      code?: number | string;
      data: MembershipCardBuyResponseRaw | null;
      message?: string;
      msg?: string;
    }

    const envelope = await http.post<BuyEnvelope, { card_product_id: number }>(
      '/api/membershipCard/buy',
      { card_product_id: payload.cardProductId },
      {
        headers: createApiHeaders(options),
        signal: options.signal,
        unwrapEnvelope: false,
      },
    );

    const data = envelope?.data;
    if (data == null) {
      throw new ApiError(
        envelope?.message || envelope?.msg || '购买失败',
        { code: envelope?.code, details: envelope },
      );
    }

    return {
      cardId: readNumber(data.card_id),
    };
  },

  async myCards(options: MembershipCardRequestOptions = {}): Promise<MyCardsResponse> {
    const payload = await http.get<MembershipCardOwnedCardsResponseRaw>(
      '/api/membershipCard/myCards',
      {
        headers: createApiHeaders(options),
        signal: options.signal,
      },
    );

    return {
      amplifyList: (payload.amplify_list ?? []).map(normalizeAmplifyOwnedCard),
      membershipList: (payload.membership_list ?? []).map(normalizeOwnedCard),
    };
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
      list: (payload.list ?? []).map(normalizeProduct),
      membershipEnabled: readBoolean(payload.membership_enabled),
      nodeAmplifyEnabled: readBoolean(payload.node_amplify_enabled),
    };
  },
};
