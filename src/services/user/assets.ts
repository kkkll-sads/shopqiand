import type { ApiResponse } from '../networking';
import { API_ENDPOINTS } from '../config';
import { authedFetch, getStoredToken } from '../client';
import { bizLog, debugLog, errorLog } from '@/utils/logger';

export interface ExchangeScoreToGreenPowerParams {
  score: number | string;
  token?: string;
}

export interface ExchangeScoreToGreenPowerResult {
  score_consumed: number;
  green_power_gained: number;
  before_score: number;
  after_score: number;
  before_green_power: number;
  after_green_power: number;
  exchange_rate: number;
}

export async function exchangeScoreToGreenPower(
  params: ExchangeScoreToGreenPowerParams
): Promise<ApiResponse<ExchangeScoreToGreenPowerResult>> {
  const token = params.token ?? getStoredToken();
  if (!params.score || Number(params.score) <= 0) {
    throw new Error('请输入有效的消费金数量');
  }

  const search = new URLSearchParams();
  search.set('score', String(params.score));

  const path = `${API_ENDPOINTS.account.exchangeScoreToGreenPower}?${search.toString()}`;

  return authedFetch<ExchangeScoreToGreenPowerResult>(path, {
    method: 'POST',
    token,
  });
}

export interface GrowthStageRule {
  key: string;
  label: string;
  min_days: number;
  max_days?: number | null;
  rights_status: string;
}

export interface GrowthFinancingRule {
  min_days: number;
  max_days?: number | null;
  ratio: string;
}

export interface GrowthDailyLog {
  date: string;
  trade_count: number;
  counted: boolean;
  reason: string;
}

export interface GrowthRightsInfoResult {
  growth_days: number;
  effective_trade_days: number;
  today_trade_count: number;
  total_trade_count: number;
  pending_activation_gold: number;
  stage: {
    key: string;
    label: string;
    rights_status: string;
    min_days: number;
  };
  stages: GrowthStageRule[];
  status: {
    can_activate: boolean;
    can_unlock_package: boolean;
    financing_enabled: boolean;
    is_accelerated_mode: boolean;
  };
  financing: {
    ratio: string;
    rules: GrowthFinancingRule[];
  };
  cycle: {
    unlock_threshold_days: number;
    normal_cycle_days: number;
    accelerated_cycle_days: number;
    accelerated_daily_trades: number;
    cycle_days: number;
    completed_cycles: number;
    ready_for_cycle_claim: boolean;
    next_cycle_in_days: number;
    remaining_days_in_cycle: number;
    unlock_amount_per_cycle: number;
    unlockable_amount: number;
    collectibles_per_cycle: number;
    max_collectibles_claimable: number;
    claimed_cycles: number;
    claimable_cycles: number;
    claimable_amount: number;
  };
  profit_distribution: {
    score_percent: number;
    balance_percent: number;
  };
  daily_growth_logs: GrowthDailyLog[];
  as_of_date: string;
}

export async function fetchGrowthRightsInfo(token?: string): Promise<ApiResponse<GrowthRightsInfoResult>> {
  const authToken = token ?? getStoredToken();

  if (!authToken) {
    throw new Error('未找到用户登录信息，请先登录后再查看成长权益');
  }

  try {
    const data = await authedFetch<GrowthRightsInfoResult>(API_ENDPOINTS.account.growthRightsInfo, {
      method: 'GET',
      token: authToken,
    });
    debugLog('api.assets.growth.rights.raw', data);
    bizLog('assets.growth.rights', {
      code: data.code,
      growthDays: data.data?.growth_days,
      ratio: data.data?.financing?.ratio,
    });
    return data;
  } catch (error: unknown) {
    errorLog('api.assets.growth.rights', '获取成长权益信息失败', error);
    throw error;
  }
}

export interface UnlockGrowthRightsAssetResult {
  unlock_count: number;
  consumed_gold: number;
  reward_item_id?: number;
  reward_item_title?: string;
  reward_item_price?: number;
  user_collection_id?: number;
  reward_consignment_coupon?: number;
  claimed_cycles?: number;
  remaining_claimable_cycles?: number;
  message?: string;
}

export async function unlockGrowthRightsAsset(token?: string): Promise<ApiResponse<UnlockGrowthRightsAssetResult>> {
  const authToken = token ?? getStoredToken();

  if (!authToken) {
    throw new Error('未找到用户登录信息，请先登录后再解锁成长权益藏品');
  }

  try {
    const data = await authedFetch<UnlockGrowthRightsAssetResult>(API_ENDPOINTS.account.unlockGrowthRightsAsset, {
      method: 'POST',
      body: JSON.stringify({}),
      token: authToken,
    });
    debugLog('api.assets.growth.unlock.raw', data);
    bizLog('assets.growth.unlock', {
      code: data.code,
      unlockCount: data.data?.unlock_count,
      rewardItemId: data.data?.reward_item_id,
    });
    return data;
  } catch (error: unknown) {
    errorLog('api.assets.growth.unlock', '解锁成长权益藏品失败', error);
    throw error;
  }
}

/**
 * 检查旧资产解锁状态接口返回数据
 */
export interface CheckOldAssetsUnlockStatusResult {
  unlock_status: number; // 0=未解锁,1=已解锁
  unlocked_count?: number; // 已解锁次数
  available_quota?: number; // 可用解锁资格
  unlock_conditions: {
    has_transaction: boolean; // 是否完成过交易
    transaction_count: number; // 交易次数
    direct_referrals_count: number; // 直推用户总数
    qualified_referrals: number; // 有交易记录的直推用户数
    unlocked_count?: number; // 已解锁次数
    available_quota?: number; // 可用解锁资格
    is_qualified: boolean; // 是否满足解锁条件
    messages: string[]; // 状态说明信息
  };
  required_gold: number; // 需要的待激活金
  current_gold: number; // 当前待激活金余额
  can_unlock: boolean; // 是否可以解锁
}

/**
 * 解锁旧资产接口返回数据
 */
export interface UnlockOldAssetsResult {
  unlock_count?: number; // 当前解锁次数
  consumed_gold: number; // 消耗的待激活金
  reward_item_id?: number; // 获得的藏品ID
  reward_item_title?: string; // 获得的藏品名称
  reward_item_price?: number; // 藏品价值
  user_collection_id?: number; // 用户藏品记录ID
  reward_consignment_coupon: number; // 获得的寄售券数量
  remaining_quota?: number; // 剩余可用解锁资格
  unlock_conditions?: any; // 本次解锁时的条件详情
  message?: string; // 友好提示信息
  [key: string]: any;
}

/**
 * 检查旧资产解锁状态
 */
export async function checkOldAssetsUnlockStatus(
  token?: string
): Promise<ApiResponse<CheckOldAssetsUnlockStatusResult>> {
  const authToken = token ?? getStoredToken();

  if (!authToken) {
    throw new Error('未找到用户登录信息，请先登录后再检查解锁状态');
  }

  try {
    const data = await authedFetch<CheckOldAssetsUnlockStatusResult>(
      API_ENDPOINTS.account.checkOldAssetsUnlockStatus,
      {
        method: 'GET',
        token: authToken,
      }
    );
    debugLog('api.assets.unlock.check.raw', data);
    bizLog('assets.unlock.check', { code: data.code, unlockStatus: data.data?.unlock_status });
    return data;
  } catch (error: any) {
    errorLog('api.assets.unlock.check', '检查旧资产解锁状态失败', error);
    throw error;
  }
}

/**
 * 解锁旧资产
 */
export async function unlockOldAssets(token?: string): Promise<ApiResponse<UnlockOldAssetsResult>> {
  const authToken = token ?? getStoredToken();

  if (!authToken) {
    throw new Error('未找到用户登录信息，请先登录后再尝试解锁旧资产');
  }

  try {
    const data = await authedFetch<UnlockOldAssetsResult>(API_ENDPOINTS.account.unlockOldAssets, {
      method: 'POST',
      body: JSON.stringify({}),
      token: authToken,
    });
    debugLog('api.assets.unlock.execute.raw', data);
    bizLog('assets.unlock.execute', { code: data.code, unlockStatus: data.data?.unlock_status });
    return data;
  } catch (error: any) {
    errorLog('api.assets.unlock.execute', '解锁旧资产失败', error);
    throw error;
  }
}
