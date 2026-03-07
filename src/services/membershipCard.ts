import { apiFetch, type ApiResponse } from './networking';
import { getStoredToken } from './client';
import { API_ENDPOINTS } from './api-endpoints';

// ─── 类型定义 ───

/** 权益卡产品 */
export interface CardProduct {
  id: number;
  name: string;
  cycle_type: string;
  cycle_type_text: string;
  level: number;
  level_text: string;
  price: number;
  valid_days: number;
  deduct_amount_per_use: number;
  daily_limit: number;
  min_fee: number;
}

/** 权益卡产品列表响应 */
export interface CardProductsData {
  enabled: number;
  min_pay_ratio: number;
  list: CardProduct[];
}

/** 购买权益卡参数 */
export interface BuyCardParams {
  card_product_id: number;
  pay_supply_chain_amount: number;
  pay_pending_activation_amount: number;
  token?: string;
}

/** 购买成功响应 */
export interface BuyCardResult {
  card_id: number;
}

/** 我的持卡记录 */
export interface MyCard {
  id: number;
  card_product_id: number;
  card_name: string;
  cycle_type_text: string;
  level_text: string;
  deduct_amount_per_use: number;
  daily_limit: number;
  min_fee: number;
  start_time_text: string;
  end_time_text: string;
  status: number;
  today_usage: number;
  today_remaining: number;
  is_active: boolean;
  remaining_days: number;
  source: string;
}

/** 我的卡列表响应 */
export interface MyCardsData {
  list: MyCard[];
}

/** 抵扣参与卡 */
export interface DeductionCard {
  card_id: number;
  card_name: string;
  deduct_amount: number;
}

/** 抵扣预览响应 */
export interface DeductionPreviewData {
  enabled: number;
  original_fee: number;
  deduct_total: number;
  final_fee: number;
  cards: DeductionCard[];
}

// ─── API 函数 ───

/** 获取可购买的权益卡产品列表 */
export async function getCardProducts(
  token?: string,
): Promise<ApiResponse<CardProductsData>> {
  const t = token ?? getStoredToken();
  return apiFetch<CardProductsData>(API_ENDPOINTS.membershipCard.products, {
    method: 'GET',
    token: t || undefined,
  });
}

/** 购买权益卡 */
export async function buyCard(
  params: BuyCardParams,
): Promise<ApiResponse<BuyCardResult>> {
  const t = params.token ?? getStoredToken();
  return apiFetch<BuyCardResult>(API_ENDPOINTS.membershipCard.buy, {
    method: 'POST',
    token: t || undefined,
    body: JSON.stringify({
      card_product_id: params.card_product_id,
      pay_supply_chain_amount: params.pay_supply_chain_amount,
      pay_pending_activation_amount: params.pay_pending_activation_amount,
    }),
  });
}

/** 获取我的持卡列表 */
export async function getMyCards(
  token?: string,
): Promise<ApiResponse<MyCardsData>> {
  const t = token ?? getStoredToken();
  return apiFetch<MyCardsData>(API_ENDPOINTS.membershipCard.myCards, {
    method: 'GET',
    token: t || undefined,
  });
}

/** 寄售前预览可抵扣金额 */
export async function previewDeduction(
  consignmentPrice: number,
  token?: string,
): Promise<ApiResponse<DeductionPreviewData>> {
  const t = token ?? getStoredToken();
  return apiFetch<DeductionPreviewData>(API_ENDPOINTS.membershipCard.previewDeduction, {
    method: 'POST',
    token: t || undefined,
    body: JSON.stringify({ consignment_price: consignmentPrice }),
  });
}
