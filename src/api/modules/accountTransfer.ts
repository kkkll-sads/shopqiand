import { createApiHeaders, type ApiAuthOptions } from '../core/headers';
import { http } from '../http';

export interface AccountTransferRequestOptions extends ApiAuthOptions {
  signal?: AbortSignal;
}

export type AccountTransferScene = 'special' | 'rights';

interface AccountTransferConditionRaw {
  key?: string;
  text?: string;
  is_met?: boolean;
  current_count?: number | string;
  required_count?: number | string;
}

interface AccountTransferSourceRaw {
  type?: string;
  name?: string;
  available?: number | string;
  frozen?: number | string;
}

interface AccountTransferTargetRaw {
  id?: string;
  name?: string;
  balance?: number | string;
  fee_rate?: number | string;
  desc?: string;
  arrival_text?: string;
  min_amount?: number | string;
  daily_limit?: number | string;
  daily_count_limit?: number | string;
  remaining_count?: number | string | null;
  today_amount?: number | string;
}

interface AccountTransferSummaryRaw {
  scene?: string;
  source_account?: AccountTransferSourceRaw;
  target_accounts?: AccountTransferTargetRaw[];
  conditions?: AccountTransferConditionRaw[];
}

interface AccountTransferSubmitRaw {
  record_id?: number | string;
  scene?: string;
  source_account?: string;
  target_account?: string;
  amount?: number | string;
  fee?: number | string;
  actual_amount?: number | string;
  source_balance?: number | string;
  target_balance?: number | string;
  source_name?: string;
  target_name?: string;
}

export interface AccountTransferCondition {
  key: string;
  text: string;
  isMet: boolean;
  currentCount?: number;
  requiredCount?: number;
}

export interface AccountTransferSourceAccount {
  type: string;
  name: string;
  available: number;
  frozen: number;
}

export interface AccountTransferTargetAccount {
  id: string;
  name: string;
  balance: number;
  feeRate: number;
  desc: string;
  arrivalText: string;
  minAmount: number;
  dailyLimit: number;
  dailyCountLimit: number;
  remainingCount?: number | null;
  todayAmount: number;
}

export interface AccountTransferSummary {
  scene: AccountTransferScene;
  sourceAccount: AccountTransferSourceAccount;
  targetAccounts: AccountTransferTargetAccount[];
  conditions: AccountTransferCondition[];
}

export interface AccountTransferSubmitResult {
  recordId: number;
  scene: AccountTransferScene;
  sourceAccount: string;
  targetAccount: string;
  amount: number;
  fee: number;
  actualAmount: number;
  sourceBalance: number;
  targetBalance: number;
  sourceName: string;
  targetName: string;
}

function readNumber(value: number | string | undefined, fallback = 0) {
  const nextValue = typeof value === 'string' ? Number(value) : value;
  return typeof nextValue === 'number' && Number.isFinite(nextValue) ? nextValue : fallback;
}

function readOptionalNumber(value: number | string | null | undefined) {
  if (value == null) {
    return undefined;
  }
  const nextValue = typeof value === 'string' ? Number(value) : value;
  return typeof nextValue === 'number' && Number.isFinite(nextValue) ? nextValue : undefined;
}

function readString(value: string | undefined, fallback = '') {
  if (typeof value !== 'string') {
    return fallback;
  }
  const nextValue = value.trim();
  return nextValue || fallback;
}

function normalizeSummary(payload: AccountTransferSummaryRaw): AccountTransferSummary {
  return {
    scene: (readString(payload.scene, 'special') as AccountTransferScene),
    sourceAccount: {
      type: readString(payload.source_account?.type),
      name: readString(payload.source_account?.name),
      available: readNumber(payload.source_account?.available),
      frozen: readNumber(payload.source_account?.frozen),
    },
    targetAccounts: (payload.target_accounts ?? []).map((item) => ({
      id: readString(item.id),
      name: readString(item.name),
      balance: readNumber(item.balance),
      feeRate: readNumber(item.fee_rate),
      desc: readString(item.desc),
      arrivalText: readString(item.arrival_text, '预计实时到账'),
      minAmount: readNumber(item.min_amount),
      dailyLimit: readNumber(item.daily_limit),
      dailyCountLimit: readNumber(item.daily_count_limit),
      remainingCount: item.remaining_count == null ? null : readOptionalNumber(item.remaining_count),
      todayAmount: readNumber(item.today_amount),
    })),
    conditions: (payload.conditions ?? []).map((item) => ({
      key: readString(item.key),
      text: readString(item.text),
      isMet: Boolean(item.is_met),
      currentCount: readOptionalNumber(item.current_count),
      requiredCount: readOptionalNumber(item.required_count),
    })),
  };
}

function normalizeSubmitResult(payload: AccountTransferSubmitRaw): AccountTransferSubmitResult {
  return {
    recordId: readNumber(payload.record_id),
    scene: readString(payload.scene, 'special') as AccountTransferScene,
    sourceAccount: readString(payload.source_account),
    targetAccount: readString(payload.target_account),
    amount: readNumber(payload.amount),
    fee: readNumber(payload.fee),
    actualAmount: readNumber(payload.actual_amount),
    sourceBalance: readNumber(payload.source_balance),
    targetBalance: readNumber(payload.target_balance),
    sourceName: readString(payload.source_name),
    targetName: readString(payload.target_name),
  };
}

export const accountTransferApi = {
  async summary(
    scene: AccountTransferScene,
    options: AccountTransferRequestOptions = {},
  ): Promise<AccountTransferSummary> {
    const payload = await http.get<AccountTransferSummaryRaw>('/api/AccountTransfer/summary', {
      headers: createApiHeaders(options),
      query: { scene },
      signal: options.signal,
    });

    return normalizeSummary(payload);
  },

  async submit(
    payload: { scene: AccountTransferScene; targetAccount: string; amount: number },
    options: AccountTransferRequestOptions = {},
  ): Promise<AccountTransferSubmitResult> {
    const response = await http.post<AccountTransferSubmitRaw, { scene: string; target_account: string; amount: number }>(
      '/api/AccountTransfer/submit',
      {
        scene: payload.scene,
        target_account: payload.targetAccount,
        amount: payload.amount,
      },
      {
        headers: createApiHeaders(options),
        signal: options.signal,
      },
    );

    return normalizeSubmitResult(response);
  },
};
