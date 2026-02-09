import type { ApiResponse } from '../networking';
import { API_ENDPOINTS } from '../config';
import { authedFetch } from '../client';

export interface AccountBalanceInfo {
  balance_available: string;
  withdrawable_money: string;
  score: number;
  service_fee_balance: string;
  green_power: string;
  total_assets: string;
}

export interface IncomeItemInfo {
  withdrawable_income: string;
  score_income: number;
}

export interface AccountIncomeInfo {
  consignment_income: IncomeItemInfo;
  mining_dividend: IncomeItemInfo;
  friend_commission: IncomeItemInfo;
  sign_in: IncomeItemInfo;
  register_reward: IncomeItemInfo;
  other: IncomeItemInfo;
  total_income_withdrawable: string;
  total_income_score: number;
}

export interface CollectionInfo {
  total_count: number;
  total_value: string;
  avg_price: string;
  holding_count: number;
  consigning_count: number;
  sold_count: number;
  mining_count: number;
  mining_value: string;
}

export interface AccountOverviewData {
  balance: AccountBalanceInfo;
  income: AccountIncomeInfo;
  collection: CollectionInfo;
}

export async function fetchAccountOverview(
  token?: string
): Promise<ApiResponse<AccountOverviewData>> {
  return authedFetch<AccountOverviewData>(API_ENDPOINTS.account.accountOverview, {
    method: 'GET',
    token,
  });
}

export interface ExchangeConfigData {
  standard_rate: number;
  subsidized_rate: number;
  quick_amounts: number[];
  min_amount: number;
  max_amount: number;
  daily_limit: number;
  tips: string[];
}

export async function fetchExchangeConfig(
  token?: string
): Promise<ApiResponse<ExchangeConfigData>> {
  return authedFetch<ExchangeConfigData>(API_ENDPOINTS.account.exchangeConfig, {
    method: 'GET',
    token,
  });
}
