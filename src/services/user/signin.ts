import type { ApiResponse } from '../networking';
import { API_ENDPOINTS } from '../config';
import { authedFetch } from '../client';
import { debugLog, errorLog } from '@/utils/logger';

// -----------------------------------------------------------------------------
// 签到相关接口
// -----------------------------------------------------------------------------

/**
 * 签到活动配置
 */
export interface SignInConfig {
  daily_reward: number;
  referrer_reward: number;
  calendar_range_months: number;
  calendar_start: string;
  calendar_end: string;
}

/**
 * 签到活动信息
 */
export interface SignInActivity {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
  register_reward: number;
  sign_reward_min: number;
  sign_reward_max: number;
  invite_reward_min: number;
  invite_reward_max: number;
  withdraw_min_amount: number;
  withdraw_daily_limit: number;
  withdraw_audit_hours: number;
}

/**
 * 签到规则项
 */
export interface SignInRule {
  key: string;
  title: string;
  description: string;
}

/**
 * 签到记录项
 */
export interface SignInRecordItem {
  id: number;
  sign_date: string;
  reward_score: number;
  reward_money: number;
  reward_type: string;
  create_time: number;
  config?: {
    daily_reward: number;
    referrer_reward: number;
  };
}

/**
 * 签到日历数据
 */
export interface SignInCalendar {
  start: string;
  end: string;
  signed_dates: string[];
  records: Array<{
    date: string;
    reward_score: number;
    record_id: number;
  }>;
}

/**
 * 签到信息数据
 */
export interface SignInInfoData {
  today_signed: boolean;
  today_reward: number;
  daily_reward: number;
  total_reward: number;
  sign_days: number;
  streak: number;
  calendar: SignInCalendar;
  recent_records: SignInRecordItem[];
  config: {
    daily_reward: number;
    referrer_reward: number;
  };
  activity: SignInActivity;
  reward_type: string;
}

/**
 * 执行签到响应数据
 */
export interface SignInDoData extends SignInInfoData {
  sign_record_id: number;
  sign_date: string;
  referrer_reward: number;
  message: string;
}

/**
 * 签到提现进度数据
 */
export interface SignInProgressData {
  withdrawable_money: number;
  withdraw_min_amount: number;
  progress: number;
  remaining_amount: number;
  can_withdraw: boolean;
  total_money: number;
  activity: {
    id: number;
    name: string;
    withdraw_min_amount: number;
    withdraw_daily_limit: number;
    withdraw_audit_hours: number;
  };
}

export interface SignInRulesData {
  config: SignInConfig;
  activity: SignInActivity;
  rules: SignInRule[];
}

export interface SignInRecordsData {
  total: number;
  page: number;
  page_size: number;
  total_score: number;
  total_money: number;
  is_today_signed: boolean;
  lucky_draw_info?: {
    current_draw_count: number;
    daily_limit: number;
    used_today: number;
    remaining_count: number;
  };
  lucky_draw_rules?: string;
  records: SignInRecordItem[];
}

/**
 * 获取签到活动规则
 */
export async function fetchSignInRules(): Promise<ApiResponse<SignInRulesData>> {
  try {
    const data = await authedFetch<SignInRulesData>(API_ENDPOINTS.signIn.rules, {
      method: 'GET',
    });
    debugLog('api.signIn.rules.raw', data);
    return data;
  } catch (error: any) {
    errorLog('api.signIn.rules', '获取签到规则失败', error);
    throw error;
  }
}

/**
 * 获取签到信息
 */
export async function fetchSignInInfo(token: string): Promise<ApiResponse<SignInInfoData>> {
  if (!token) {
    throw new Error('未找到用户登录信息，请先登录后再查看签到信息');
  }

  try {
    const data = await authedFetch<SignInInfoData>(API_ENDPOINTS.signIn.info, {
      method: 'GET',
      token,
    });
    debugLog('api.signIn.info.raw', data);
    return data;
  } catch (error: any) {
    errorLog('api.signIn.info', '获取签到信息失败', error);
    throw error;
  }
}

/**
 * 执行签到
 */
export async function doSignIn(token: string): Promise<ApiResponse<SignInDoData>> {
  if (!token) {
    throw new Error('未找到用户登录信息，请先登录后再签到');
  }

  try {
    const data = await authedFetch<SignInDoData>(API_ENDPOINTS.signIn.do, {
      method: 'POST',
      body: JSON.stringify({}),
      token,
    });
    debugLog('api.signIn.do.raw', data);
    return data;
  } catch (error: any) {
    errorLog('api.signIn.do', '执行签到失败', error);
    throw error;
  }
}

/**
 * 获取签到提现进度
 */
export async function fetchSignInProgress(token: string): Promise<ApiResponse<SignInProgressData>> {
  if (!token) {
    throw new Error('未找到用户登录信息，请先登录后再查看提现进度');
  }

  try {
    const data = await authedFetch<SignInProgressData>(API_ENDPOINTS.signIn.progress, {
      method: 'GET',
      token,
    });
    debugLog('api.signIn.progress.raw', data);
    return data;
  } catch (error: any) {
    errorLog('api.signIn.progress', '获取签到提现进度失败', error);
    throw error;
  }
}
