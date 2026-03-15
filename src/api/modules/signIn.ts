import { createApiHeaders } from '../core/headers';
import { http } from '../http';

const isSignInSuccessCode = (code: number | string) =>
  code === 0 || code === '0' || code === 1 || code === '1';

// ==================== Types ====================

export interface SignInRuleItem {
  key: string;
  title: string;
  description: string;
}

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

export interface SignInRulesConfig {
  daily_reward: number;
  referrer_reward: number;
  calendar_range_months: number;
  calendar_start: string;
  calendar_end: string;
}

export interface SignInRulesData {
  config: SignInRulesConfig;
  activity: SignInActivity | null;
  rules: SignInRuleItem[];
  today_signed: boolean | null;
}

export interface SignInInfoData {
  today_signed: boolean;
  today_reward: number;
  daily_reward: number;
  total_reward: number;
  sign_days: number;
  streak: number;
  reward_type: 'money' | 'score';
  calendar: {
    signed_dates: string[];
  };
  recent_records: unknown[];
  config: {
    daily_reward: number;
    referrer_reward: number;
  };
  activity?: SignInActivity;
}

export interface SignInDoData {
  sign_record_id: number;
  sign_date: string;
  today_signed: boolean;
  today_reward: number;
  daily_reward: number;
  total_reward: number;
  sign_days: number;
  streak: number;
  reward_type: 'money' | 'score';
  referrer_reward?: number;
}

export interface SignInProgressData {
  withdrawable_money: number;
  withdraw_min_amount: number;
  progress: number;
  remaining_amount: number;
  can_withdraw: boolean;
  total_money: number;
  today_signed: boolean;
  /** 已邀请人数（一级直推） */
  invite_count?: number;
  activity: Pick<SignInActivity, 'id' | 'name' | 'withdraw_min_amount' | 'withdraw_daily_limit' | 'withdraw_audit_hours'> | null;
}

export interface SignInRecordItem {
  id: number;
  sign_date: string;
  reward_score: number;
  reward_money: number;
  reward_type: 'money' | 'score';
  create_time: string;
  config: {
    daily_reward: number;
    referrer_reward: number;
  };
}

export interface SignInRecordsData {
  total: number;
  page: number;
  page_size: number;
  total_score: number;
  total_money: number;
  is_today_signed: boolean;
  lucky_draw_info: {
    current_draw_count: number;
    daily_limit: number;
    used_today: number;
    remaining_count: number;
  };
  lucky_draw_rules: string;
  records: SignInRecordItem[];
}

// ==================== API ====================

export const signInApi = {
  /**
   * 获取签到规则（公开接口，无需登录）
   * GET /api/SignIn/rules
   */
  async getRules(signal?: AbortSignal): Promise<SignInRulesData> {
    return http.get<SignInRulesData>('/api/SignIn/rules', {
      headers: createApiHeaders(),
      isSuccessCode: isSignInSuccessCode,
      signal,
    });
  },

  /**
   * 获取签到概览（需要登录）
   * GET /api/SignIn/info
   */
  async getInfo(signal?: AbortSignal): Promise<SignInInfoData> {
    return http.get<SignInInfoData>('/api/SignIn/info', {
      headers: createApiHeaders(),
      isSuccessCode: isSignInSuccessCode,
      signal,
    });
  },

  /**
   * 执行签到
   * POST /api/SignIn/do
   */
  async doSignIn(signal?: AbortSignal): Promise<SignInDoData> {
    return http.post<SignInDoData>('/api/SignIn/do', undefined, {
      headers: createApiHeaders(),
      isSuccessCode: isSignInSuccessCode,
      signal,
    });
  },

  /**
   * 获取签到进度
   * GET /api/SignIn/progress
   */
  async getProgress(signal?: AbortSignal): Promise<SignInProgressData> {
    return http.get<SignInProgressData>('/api/SignIn/progress', {
      headers: createApiHeaders(),
      isSuccessCode: isSignInSuccessCode,
      signal,
    });
  },

  /**
   * 获取签到记录
   * POST /api/SignIn/records
   */
  async getRecords(
    page = 1,
    pageSize = 10,
    signal?: AbortSignal,
  ): Promise<SignInRecordsData> {
    return http.post<SignInRecordsData>('/api/SignIn/records', {
      page,
      page_size: pageSize,
    }, {
      headers: createApiHeaders(),
      isSuccessCode: isSignInSuccessCode,
      signal,
    });
  },
};
