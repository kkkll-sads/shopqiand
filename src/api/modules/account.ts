import { createApiHeaders, type ApiAuthOptions } from '../core/headers';
import { http } from '../http';
import { resolveUploadUrl } from './upload';

export interface AccountRequestOptions extends ApiAuthOptions {
  signal?: AbortSignal;
}

export type AccountLogType =
  | 'all'
  | 'balance_available'
  | 'withdrawable_money'
  | 'service_fee_balance'
  | 'static_income'
  | 'score'
  | 'green_power'
  | 'pending_activation_gold';

export type AccountLogFlowDirection = 'in' | 'out';
export type AccountLogViewMode = 'merged' | 'normal';

interface AccountBalanceOverviewRaw {
  balance_available?: string;
  green_power?: string;
  score?: number | string;
  service_fee_balance?: string;
  total_assets?: string;
  withdrawable_money?: string;
}

interface AccountIncomeSummaryRaw {
  total_income_score?: number | string;
  total_income_withdrawable?: string;
}

interface AccountCollectionSummaryRaw {
  consignment_count?: number | string;
  consigning_count?: number | string;
  holding_count?: number | string;
  mining_count?: number | string;
  sold_count?: number | string;
  total_count?: number | string;
  total_value?: string;
}

interface AccountOverviewRaw {
  balance?: AccountBalanceOverviewRaw;
  collection?: AccountCollectionSummaryRaw;
  income?: AccountIncomeSummaryRaw;
}

interface AccountProfileUserInfoRaw {
  agent_level?: number | string;
  agent_level_text?: string;
  agent_review_status?: number | string;
  avatar?: string;
  balance_available?: string;
  birthday?: string;
  consignment_coupon?: number | string;
  email?: string;
  frozen_amount?: string;
  gender?: number | string;
  green_power?: string;
  id?: number | string;
  invite_code?: string;
  is_real_name?: number | string;
  join_time?: number | string;
  last_login_ip?: string;
  last_login_time?: number | string;
  mobile?: string;
  motto?: string;
  nickname?: string;
  old_assets_status?: number | string;
  pending_activation_gold?: string;
  real_name_info?: {
    real_name_status?: number | string;
    real_name_status_text?: string;
    real_name?: string;
    id_card?: string;
    id_card_front?: string;
    id_card_back?: string;
    audit_time?: string;
    audit_reason?: string;
  };
  score?: number | string;
  service_fee_balance?: string;
  user_type?: number | string;
  user_type_text?: string;
  username?: string;
  withdrawable_money?: string;
}

interface AccountProfileRaw {
  accountVerificationType?: string[] | string | null;
  userInfo?: AccountProfileUserInfoRaw;
}

interface AccountLogItemRaw {
  account_type?: string;
  after_value?: number | string;
  amount?: number | string;
  batch_no?: string;
  before_value?: number | string;
  biz_id?: number | string;
  biz_type?: string;
  breakdown?: unknown;
  create_time?: number | string;
  create_time_text?: string;
  flow_no?: string;
  id?: number | string;
  image_snapshot?: string;
  is_merged?: boolean | number | string;
  merge_key?: string;
  merge_row_count?: number | string;
  memo?: string;
  title_snapshot?: string;
}

interface AccountLogListRaw {
  current_page?: number | string;
  list?: AccountLogItemRaw[];
  per_page?: number | string;
  total?: number | string;
}

interface AccountMoneyLogDetailRaw {
  account_type?: string;
  after_value?: number | string;
  amount?: number | string;
  batch_no?: string;
  before_value?: number | string;
  biz_id?: number | string;
  biz_type?: string;
  breakdown?: unknown;
  create_time?: number | string;
  create_time_text?: string;
  flow_no?: string;
  id?: number | string;
  image_snapshot?: string;
  is_merged?: boolean | number | string;
  item_id?: number | string;
  merge_key?: string;
  merge_row_count?: number | string;
  memo?: string;
  title_snapshot?: string;
  user_collection_id?: number | string;
}

export interface AccountBalanceOverview {
  balanceAvailable: string;
  greenPower: string;
  score: number;
  serviceFeeBalance: string;
  totalAssets: string;
  withdrawableMoney: string;
}

export interface AccountIncomeSummary {
  totalIncomeScore: number;
  totalIncomeWithdrawable: string;
}

export interface AccountCollectionSummary {
  consignmentCount: number;
  holdingCount: number;
  miningCount: number;
  soldCount: number;
  totalCount: number;
  totalValue: string;
}

export interface AccountOverview {
  balance: AccountBalanceOverview;
  collection: AccountCollectionSummary;
  income: AccountIncomeSummary;
}

export interface AccountProfileUserInfo {
  agentLevel: number;
  agentLevelText: string;
  agentReviewStatus: number;
  avatar?: string;
  balanceAvailable: string;
  birthday?: string;
  consignmentCoupon: number;
  email?: string;
  frozenAmount: string;
  gender: number;
  greenPower: string;
  id?: number | string;
  inviteCode?: string;
  isRealName: boolean;
  joinTime?: number;
  lastLoginIp?: string;
  lastLoginTime?: number;
  mobile?: string;
  motto?: string;
  nickname?: string;
  oldAssetsStatus: number;
  pendingActivationGold: string;
  realNameInfo?: {
    realNameStatus: number;
    realNameStatusText: string;
    realName: string;
    idCard: string;
    idCardFront: string;
    idCardBack: string;
    auditTime: string;
    auditReason: string;
  };
  score: number;
  serviceFeeBalance: string;
  userType: number;
  userTypeText: string;
  username?: string;
  withdrawableMoney: string;
}

export interface AccountProfile {
  accountVerificationType: string[];
  userInfo?: AccountProfileUserInfo;
}

export interface AccountLogItem {
  accountType?: string;
  afterValue: number;
  amount: number;
  batchNo?: string;
  beforeValue: number;
  bizId?: string;
  bizType?: string;
  breakdown?: Record<string, unknown>;
  createTime?: number;
  createTimeText?: string;
  flowNo?: string;
  id: number;
  imageSnapshot?: string;
  isMerged: boolean;
  mergeKey?: string;
  mergeRowCount?: number;
  memo?: string;
  titleSnapshot?: string;
}

export interface AccountLogList {
  currentPage: number;
  list: AccountLogItem[];
  perPage: number;
  total: number;
}

export interface GetAccountLogListParams {
  bizType?: string;
  endTime?: number;
  flowDirection?: AccountLogFlowDirection;
  keyword?: string;
  limit?: number;
  page?: number;
  startTime?: number;
  type?: AccountLogType;
  viewMode?: AccountLogViewMode;
}

export interface GetMoneyLogDetailParams {
  flowNo?: string;
  id?: number;
  mergeKey?: string;
  viewMode?: AccountLogViewMode;
}

export interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
}

export interface CancelAccountPayload {
  password: string;
  reason?: string;
}

export interface RechargeServiceFeePayload {
  amount: number;
  remark?: string;
  source?: 'balance_available' | 'withdrawable_money';
}

export interface RechargeServiceFeeResult {
  balanceAvailable?: string;
  serviceFeeBalance?: string;
  withdrawableMoney?: string;
}

export interface AccountMoneyLogDetail {
  accountType?: string;
  afterValue: number;
  amount: number;
  batchNo?: string;
  beforeValue: number;
  bizId?: string;
  bizType?: string;
  breakdown?: Record<string, unknown>;
  createTime?: number;
  createTimeText?: string;
  flowNo?: string;
  id: number;
  imageSnapshot?: string;
  isMerged: boolean;
  itemId?: number;
  mergeKey?: string;
  mergeRowCount?: number;
  memo?: string;
  titleSnapshot?: string;
  userCollectionId?: number;
}

function readNumber(value: number | string | undefined, fallback = 0): number {
  const nextValue = typeof value === 'string' ? Number(value) : value;
  return typeof nextValue === 'number' && Number.isFinite(nextValue) ? nextValue : fallback;
}

function readString(value: string | undefined, fallback = '0.00'): string {
  if (typeof value !== 'string') {
    return fallback;
  }

  const nextValue = value.trim();
  return nextValue || fallback;
}

function readOptionalString(value: string | undefined): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const nextValue = value.trim();
  return nextValue || undefined;
}

function readOptionalId(value: number | string | undefined): string | undefined {
  if (value == null) {
    return undefined;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === 'string') {
    const nextValue = value.trim();
    return nextValue || undefined;
  }

  return undefined;
}

function readOptionalTimestamp(value: number | string | undefined): number | undefined {
  if (value == null) {
    return undefined;
  }

  const nextValue = typeof value === 'string' ? Number(value) : value;
  return typeof nextValue === 'number' && Number.isFinite(nextValue) ? nextValue : undefined;
}

function readBoolean(value: boolean | number | string | undefined): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value === 1;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === '1' || normalized === 'true' || normalized === 'yes';
  }

  return false;
}

function readBreakdown(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function normalizeOverview(payload: AccountOverviewRaw): AccountOverview {
  return {
    balance: {
      balanceAvailable: readString(payload.balance?.balance_available),
      greenPower: readString(payload.balance?.green_power),
      score: readNumber(payload.balance?.score),
      serviceFeeBalance: readString(payload.balance?.service_fee_balance),
      totalAssets: readString(payload.balance?.total_assets),
      withdrawableMoney: readString(payload.balance?.withdrawable_money),
    },
    collection: {
      consignmentCount: readNumber(
        payload.collection?.consignment_count ?? payload.collection?.consigning_count,
      ),
      holdingCount: readNumber(payload.collection?.holding_count),
      miningCount: readNumber(payload.collection?.mining_count),
      soldCount: readNumber(payload.collection?.sold_count),
      totalCount: readNumber(payload.collection?.total_count),
      totalValue: readString(payload.collection?.total_value),
    },
    income: {
      totalIncomeScore: readNumber(payload.income?.total_income_score),
      totalIncomeWithdrawable: readString(payload.income?.total_income_withdrawable),
    },
  };
}

function normalizeProfileUserInfo(
  payload: AccountProfileUserInfoRaw | undefined,
): AccountProfileUserInfo | undefined {
  if (!payload) {
    return undefined;
  }

  return {
    agentLevel: readNumber(payload.agent_level),
    agentLevelText: payload.agent_level_text ?? '',
    agentReviewStatus: readNumber(payload.agent_review_status, -1),
    avatar: payload.avatar ? resolveUploadUrl(payload.avatar) : undefined,
    balanceAvailable: readString(payload.balance_available),
    birthday: readOptionalString(payload.birthday),
    consignmentCoupon: readNumber(payload.consignment_coupon),
    email: readOptionalString(payload.email),
    frozenAmount: readString(payload.frozen_amount),
    gender: readNumber(payload.gender),
    greenPower: readString(payload.green_power),
    id: payload.id,
    inviteCode: readOptionalString(payload.invite_code),
    isRealName: readNumber(payload.is_real_name) === 1,
    joinTime: payload.join_time == null ? undefined : readNumber(payload.join_time),
    lastLoginIp: readOptionalString(payload.last_login_ip),
    lastLoginTime: payload.last_login_time == null ? undefined : readNumber(payload.last_login_time),
    mobile: readOptionalString(payload.mobile),
    motto: readOptionalString(payload.motto),
    nickname: readOptionalString(payload.nickname),
    oldAssetsStatus: readNumber(payload.old_assets_status),
    pendingActivationGold: readString(payload.pending_activation_gold),
    realNameInfo: payload.real_name_info
      ? {
          realNameStatus: readNumber(payload.real_name_info.real_name_status),
          realNameStatusText: payload.real_name_info.real_name_status_text ?? '',
          realName: payload.real_name_info.real_name ?? '',
          idCard: payload.real_name_info.id_card ?? '',
          idCardFront: payload.real_name_info.id_card_front ?? '',
          idCardBack: payload.real_name_info.id_card_back ?? '',
          auditTime: payload.real_name_info.audit_time ?? '',
          auditReason: payload.real_name_info.audit_reason ?? '',
        }
      : undefined,
    score: readNumber(payload.score),
    serviceFeeBalance: readString(payload.service_fee_balance),
    userType: readNumber(payload.user_type),
    userTypeText: payload.user_type_text ?? '',
    username: readOptionalString(payload.username),
    withdrawableMoney: readString(payload.withdrawable_money),
  };
}

function normalizeVerificationTypes(payload: string[] | string | null | undefined): string[] {
  if (Array.isArray(payload)) {
    return payload.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  }

  if (typeof payload !== 'string') {
    return [];
  }

  return payload
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeLogItem(payload: AccountLogItemRaw): AccountLogItem {
  return {
    accountType: readOptionalString(payload.account_type),
    afterValue: readNumber(payload.after_value),
    amount: readNumber(payload.amount),
    batchNo: readOptionalString(payload.batch_no),
    beforeValue: readNumber(payload.before_value),
    bizId: readOptionalId(payload.biz_id),
    bizType: readOptionalString(payload.biz_type),
    breakdown: readBreakdown(payload.breakdown),
    createTime: readOptionalTimestamp(payload.create_time),
    createTimeText: readOptionalString(payload.create_time_text),
    flowNo: readOptionalString(payload.flow_no),
    id: readNumber(payload.id),
    imageSnapshot: payload.image_snapshot ? resolveUploadUrl(payload.image_snapshot) : undefined,
    isMerged: readBoolean(payload.is_merged),
    mergeKey: readOptionalString(payload.merge_key),
    mergeRowCount: payload.merge_row_count == null ? undefined : readNumber(payload.merge_row_count),
    memo: readOptionalString(payload.memo),
    titleSnapshot: readOptionalString(payload.title_snapshot),
  };
}

function normalizeMoneyLogDetail(payload: AccountMoneyLogDetailRaw): AccountMoneyLogDetail {
  return {
    accountType: readOptionalString(payload.account_type),
    afterValue: readNumber(payload.after_value),
    amount: readNumber(payload.amount),
    batchNo: readOptionalString(payload.batch_no),
    beforeValue: readNumber(payload.before_value),
    bizId: readOptionalId(payload.biz_id),
    bizType: readOptionalString(payload.biz_type),
    breakdown: readBreakdown(payload.breakdown),
    createTime: readOptionalTimestamp(payload.create_time),
    createTimeText: readOptionalString(payload.create_time_text),
    flowNo: readOptionalString(payload.flow_no),
    id: readNumber(payload.id),
    imageSnapshot: payload.image_snapshot ? resolveUploadUrl(payload.image_snapshot) : undefined,
    isMerged: readBoolean(payload.is_merged),
    itemId: payload.item_id == null ? undefined : readNumber(payload.item_id),
    mergeKey: readOptionalString(payload.merge_key),
    mergeRowCount: payload.merge_row_count == null ? undefined : readNumber(payload.merge_row_count),
    memo: readOptionalString(payload.memo),
    titleSnapshot: readOptionalString(payload.title_snapshot),
    userCollectionId:
      payload.user_collection_id == null ? undefined : readNumber(payload.user_collection_id),
  };
}

/* ==================== 鎴愰暱鏉冪泭淇℃伅 ==================== */

/** 褰撳墠鎴愰暱闃舵锛圓PI 杩斿洖 snake_case锛?*/
export interface GrowthRightsStageRaw {
  key?: string;
  label?: string;
  rights_status?: string;
  min_days?: number | null;
  max_days?: number | null;
}

/** 閰嶈祫瑙勫垯椤?*/
export interface GrowthRightsFinancingRuleRaw {
  min_days?: number;
  max_days?: number | null;
  ratio?: string;
}

/** 閰嶈祫瑙勫垯涓庡綋鍓嶆瘮渚?*/
export interface GrowthRightsFinancingRaw {
  ratio?: string;
  rules?: GrowthRightsFinancingRuleRaw[];
}

/** 鎴愰暱鍛ㄦ湡妯″紡杩涘害锛堝姣忔棩1娆?姣忔棩3娆★級 */
export interface GrowthRightsModeProgressItemRaw {
  label?: string;
  growth_days?: number;
  required_days?: number;
  summary?: { remaining_days_in_cycle?: number };
}

/** 鎴愰暱鍛ㄦ湡涓庡彲瑙ｉ攣棰濆害 */
export interface GrowthRightsCycleRaw {
  active_mode?: string;
  cycle_days?: number;
  completed_cycles?: number;
  next_cycle_in_days?: number;
  remaining_days_in_cycle?: number;
  unlock_amount_per_cycle?: number;
  unlockable_amount?: number;
  mode_progress?: Record<string, GrowthRightsModeProgressItemRaw>;
}

/** 鎴愰暱鏄庣粏鏃ュ織锛堟寜澶╋級 */
export interface GrowthRightsDailyLogRaw {
  date?: string;
  trade_count?: number;
  counted?: boolean;
  reason?: string;
  is_activity_bonus?: boolean;
}

/** 鎴愰暱鏉冪泭淇℃伅 API 杩斿洖鐨?data 缁撴瀯锛坰nake_case锛?*/
export interface GrowthRightsInfoRaw {
  growth_days?: number;
  effective_trade_days?: number;
  today_trade_count?: number;
  total_trade_count?: number;
  pending_activation_gold?: number | string;
  stage?: GrowthRightsStageRaw;
  stages?: GrowthRightsStageRaw[];
  financing?: GrowthRightsFinancingRaw;
  cycle?: GrowthRightsCycleRaw;
  profit_distribution?: Record<string, unknown>;
  daily_growth_logs?: GrowthRightsDailyLogRaw[];
  growth_start_date?: string;
  /** 閮ㄥ垎鍚庣鍙兘杩斿洖鐨勬墿灞曠姸鎬?*/
  status?: {
    can_activate?: boolean;
    can_unlock_package?: boolean;
    financing_enabled?: boolean;
    is_accelerated_mode?: boolean;
  };
}

export const accountApi = {
  async getGrowthRightsInfo(
    options: AccountRequestOptions = {},
  ): Promise<GrowthRightsInfoRaw> {
    const payload = await http.get<GrowthRightsInfoRaw>('/api/Account/growthRightsInfo', {
      headers: createApiHeaders(options),
      signal: options.signal,
    });
    return payload;
  },

  async getAccountOverview(options: AccountRequestOptions = {}): Promise<AccountOverview> {
    const payload = await http.get<AccountOverviewRaw>('/api/Account/accountOverview', {
      headers: createApiHeaders(options),
      signal: options.signal,
    });

    return normalizeOverview(payload);
  },

  async getProfile(options: AccountRequestOptions = {}): Promise<AccountProfile> {
    const payload = await http.get<AccountProfileRaw>('/api/Account/profile', {
      headers: createApiHeaders(options),
      signal: options.signal,
    });

    return {
      accountVerificationType: normalizeVerificationTypes(payload.accountVerificationType),
      userInfo: normalizeProfileUserInfo(payload.userInfo),
    };
  },

  async changePassword(
    payload: ChangePasswordPayload,
    options: AccountRequestOptions = {},
  ): Promise<void> {
    await http.post<null, ChangePasswordPayload>('/api/Account/changePassword', payload, {
      headers: createApiHeaders(options),
      signal: options.signal,
      useMock: false,
    });
  },

  async cancelAccount(
    payload: CancelAccountPayload,
    options: AccountRequestOptions = {},
  ): Promise<void> {
    await http.post<null, CancelAccountPayload>('/api/Account/cancelAccount', payload, {
      headers: createApiHeaders(options),
      signal: options.signal,
      query: {
        password: payload.password,
        reason: payload.reason,
      },
      useMock: false,
    });
  },

  async rechargeServiceFee(
    payload: RechargeServiceFeePayload,
    options: AccountRequestOptions = {},
  ): Promise<RechargeServiceFeeResult> {
    const response = await http.post<Record<string, unknown>, RechargeServiceFeePayload>(
      '/api/Account/rechargeServiceFee',
      payload,
      {
        headers: createApiHeaders(options),
        signal: options.signal,
        query: {
          amount: payload.amount,
          remark: payload.remark,
        },
      },
    );

    return {
      balanceAvailable:
        typeof response.balance_available === 'string' ? readString(response.balance_available) : undefined,
      serviceFeeBalance:
        typeof response.service_fee_balance === 'string' ? readString(response.service_fee_balance) : undefined,
      withdrawableMoney:
        typeof response.withdrawable_money === 'string'
          ? readString(response.withdrawable_money)
          : undefined,
    };
  },

  async getLogList(
    params: GetAccountLogListParams = {},
    options: AccountRequestOptions = {},
  ): Promise<AccountLogList> {
    const payload = await http.get<AccountLogListRaw>(
      params.viewMode === 'merged' ? '/api/Account/mergedLog' : '/api/Account/allLog',
      {
      headers: createApiHeaders(options),
      query: {
        biz_type: params.bizType,
        end_time: params.endTime,
        flow_direction: params.flowDirection,
        keyword: params.keyword,
        limit: params.limit,
        page: params.page,
        start_time: params.startTime,
        type: params.type,
        view_mode: params.viewMode,
      },
      signal: options.signal,
      },
    );

    return {
      currentPage: readNumber(payload.current_page, 1),
      list: (payload.list ?? []).map(normalizeLogItem),
      perPage: readNumber(payload.per_page, params.limit ?? 10),
      total: readNumber(payload.total),
    };
  },

  async getAllLog(
    params: GetAccountLogListParams = {},
    options: AccountRequestOptions = {},
  ): Promise<AccountLogList> {
    return this.getLogList({
      ...params,
      viewMode: 'normal',
    }, options);
  },

  async getMergedLog(
    params: GetAccountLogListParams = {},
    options: AccountRequestOptions = {},
  ): Promise<AccountLogList> {
    return this.getLogList({
      ...params,
      viewMode: 'merged',
    }, options);
  },

  async getMoneyLogDetail(
    params: GetMoneyLogDetailParams,
    options: AccountRequestOptions = {},
  ): Promise<AccountMoneyLogDetail> {
    const payload = await http.get<AccountMoneyLogDetailRaw>('/api/Account/moneyLogDetail', {
      headers: createApiHeaders(options),
      query: {
        flow_no: params.flowNo,
        id: params.id,
        merge_key: params.mergeKey,
        view_mode: params.viewMode,
      },
      signal: options.signal,
    });

    return normalizeMoneyLogDetail(payload);
  },

  /**
   * 消费金兑换绿色算力
   * POST /api/Account/exchangeScoreToGreenPower?score=N
   */
  async exchangeScoreToGreenPower(
    params: { score: number },
    options: AccountRequestOptions = {},
  ): Promise<{
    scoreConsumed: number;
    greenPowerGained: number;
    beforeScore: number;
    afterScore: number;
    beforeGreenPower: number;
    afterGreenPower: number;
    exchangeRate: number;
  }> {
    const payload = await http.post<Record<string, unknown>>(
      '/api/Account/exchangeScoreToGreenPower',
      undefined,
      {
        headers: createApiHeaders(options),
        signal: options.signal,
        query: { score: params.score },
      },
    );

    return {
      scoreConsumed: readNumber(payload.score_consumed as number | string | undefined),
      greenPowerGained: readNumber(payload.green_power_gained as number | string | undefined),
      beforeScore: readNumber(payload.before_score as number | string | undefined),
      afterScore: readNumber(payload.after_score as number | string | undefined),
      beforeGreenPower: readNumber(payload.before_green_power as number | string | undefined),
      afterGreenPower: readNumber(payload.after_green_power as number | string | undefined),
      exchangeRate: readNumber(payload.exchange_rate as number | string | undefined),
    };
  },

  /**
   * 可提现余额划转到可用余额
   * POST /api/financeOrder/transferIncomeToPurchase
   */
  async transferIncomeToPurchase(
    params: { amount: number; remark?: string },
    options: AccountRequestOptions = {},
  ): Promise<{
    transferAmount: number;
    remainingWithdrawable: number;
    newBalanceAvailable: number;
  }> {
    const payload = await http.post<Record<string, unknown>>(
      '/api/financeOrder/transferIncomeToPurchase',
      { amount: params.amount, remark: params.remark || '余额划转' },
      {
        headers: createApiHeaders(options),
        signal: options.signal,
      },
    );

    return {
      transferAmount: readNumber(
        payload.transfer_amount as number | string | undefined,
        params.amount,
      ),
      remainingWithdrawable: readNumber(
        (payload.remaining_withdrawable ??
          payload.withdrawable_money) as number | string | undefined,
      ),
      newBalanceAvailable: readNumber(
        (payload.new_balance_available ??
          payload.balance_available) as number | string | undefined,
      ),
    };

  },
};

/* ==================== 鏃ц祫浜цВ閿?==================== */

export interface OldAssetsUnlockConditionsRaw {
  has_transaction?: boolean;
  transaction_count?: number;
  direct_referrals_count?: number;
  qualified_referrals?: number;
  is_qualified?: boolean;
  messages?: string[];
}

export interface OldAssetsUnlockStatusRaw {
  unlock_status?: number;
  unlock_conditions?: OldAssetsUnlockConditionsRaw;
  required_gold?: number;
  current_gold?: number;
  can_unlock?: boolean;
  required_transactions?: number;
  required_referrals?: number;
  reward_value?: number;
}

export interface OldAssetsUnlockResultRaw {
  unlock_status?: number;
  consumed_gold?: number;
  reward_equity_package?: number;
  reward_consignment_coupon?: number;
  unlock_conditions?: OldAssetsUnlockConditionsRaw;
}

export const oldAssetsApi = {
  /**
   * 妫€鏌ユ棫璧勪骇瑙ｉ攣鐘舵€?
   * GET /api/Account/checkOldAssetsUnlockStatus
   */
  async checkStatus(
    options: AccountRequestOptions = {},
  ): Promise<OldAssetsUnlockStatusRaw> {
    const payload = await http.get<OldAssetsUnlockStatusRaw>(
      '/api/Account/checkOldAssetsUnlockStatus',
      {
        headers: createApiHeaders(options),
        signal: options.signal,
      },
    );
    return payload;
  },

  /**
   * 纭瑙ｉ攣鏃ц祫浜?
   * POST /api/Account/unlockOldAssets
   */
  async unlock(options: AccountRequestOptions = {}): Promise<OldAssetsUnlockResultRaw> {
    const payload = await http.post<OldAssetsUnlockResultRaw>(
      '/api/Account/unlockOldAssets',
      undefined,
      {
        headers: createApiHeaders(options),
        signal: options.signal,
      },
    );
    return payload;
  },
};

/* ==================== 鎴愰暱鏉冪泭瑙ｉ攣钘忓搧 ==================== */

export interface UnlockGrowthRightsAssetResultRaw {
  unlock_count?: number | string;
  consumed_gold?: number | string;
  reward_item_id?: number | string;
  reward_item_title?: string;
  reward_item_price?: number | string;
  reward_consignment_coupon?: number | string;
  claimed_cycles?: number | string;
  remaining_claimable_cycles?: number | string;
}

export interface UnlockGrowthRightsAssetResult {
  unlockCount: number;
  consumedGold: number;
  rewardItemId: number;
  rewardItemTitle: string;
  rewardItemPrice: number;
  rewardConsignmentCoupon: number;
  claimedCycles: number;
  remainingClaimableCycles: number;
}

function normalizeUnlockGrowthRightsAssetResult(
  payload: UnlockGrowthRightsAssetResultRaw,
): UnlockGrowthRightsAssetResult {
  return {
    unlockCount: readNumber(payload.unlock_count),
    consumedGold: readNumber(payload.consumed_gold),
    rewardItemId: readNumber(payload.reward_item_id),
    rewardItemTitle: readString(payload.reward_item_title, ''),
    rewardItemPrice: readNumber(payload.reward_item_price),
    rewardConsignmentCoupon: readNumber(payload.reward_consignment_coupon),
    claimedCycles: readNumber(payload.claimed_cycles),
    remainingClaimableCycles: readNumber(payload.remaining_claimable_cycles),
  };
}

/**
 * 鎴愰暱鏉冪泭瑙ｉ攣钘忓搧
 * POST /api/Account/unlockGrowthRightsAsset
 * 璇锋眰澶达細ba-token, ba-user-token锛堢敱 createApiHeaders 娉ㄥ叆锛?
 */
export const growthRightsAssetApi = {
  async unlock(options: AccountRequestOptions = {}): Promise<UnlockGrowthRightsAssetResult> {
    const payload = await http.post<UnlockGrowthRightsAssetResultRaw>(
      '/api/Account/unlockGrowthRightsAsset',
      undefined,
      {
        headers: createApiHeaders(options),
        signal: options.signal,
      },
    );
    return normalizeUnlockGrowthRightsAssetResult(payload ?? {});
  },

};

