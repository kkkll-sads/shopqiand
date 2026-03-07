import { ReservationStatus } from '@/constants/statusEnums';

export type ReservationPaymentSegmentType = 'balance_available' | 'pending_activation_gold';
export type ReservationPaymentType = ReservationPaymentSegmentType | 'mixed';
export type PaymentSplitRowTone = ReservationPaymentSegmentType | 'neutral';

export interface PaymentSplitRowData {
  key: string;
  label: string;
  amountText: string;
  amountValue?: number;
  tone?: PaymentSplitRowTone;
}

export interface ReservationPaymentPart {
  key: ReservationPaymentSegmentType;
  label: string;
  value: number;
  valueText: string;
  text: string;
  tone: ReservationPaymentSegmentType;
}

export interface ReservationPaymentSplit {
  total: number;
  totalText: string;
  balanceAvailableAmount: number;
  pendingActivationGoldAmount: number;
  parts: ReservationPaymentPart[];
  rows: PaymentSplitRowData[];
  inlineText: string | null;
  hasBreakdown: boolean;
  hasValue: boolean;
  isMixed: boolean;
}

export interface ReservationPaymentSummary {
  freeze: ReservationPaymentSplit;
  actual: ReservationPaymentSplit;
  refund: ReservationPaymentSplit;
  payType: ReservationPaymentType | null;
  payTypeLabel: string | null;
  isMixedPayment: boolean;
}

interface ResolveReservationPaymentTypeParams {
  type?: string | null;
  balanceAvailableAmount?: unknown;
  pendingActivationGoldAmount?: unknown;
  scoreAmount?: unknown;
  greenPowerAmount?: unknown;
}

interface BuildReservationPaymentSplitRowsParams {
  balanceAvailableAmount?: unknown;
  pendingActivationGoldAmount?: unknown;
  scoreAmount?: unknown;
  greenPowerAmount?: unknown;
  includeZero?: boolean;
  balanceAvailablePrefix?: string;
  balanceAvailableSuffix?: string;
  pendingActivationGoldPrefix?: string;
  pendingActivationGoldSuffix?: string;
  scorePrefix?: string;
  scoreSuffix?: string;
  greenPowerPrefix?: string;
  greenPowerSuffix?: string;
  balanceAvailableLabel?: string;
  pendingActivationGoldLabel?: string;
  scoreLabel?: string;
  greenPowerLabel?: string;
}

type ReservationPaymentRecord = Record<string, unknown>;

const SPECIAL_FUND_LABEL = '\u4E13\u9879\u91D1';
const PENDING_ACTIVATION_GOLD_LABEL = '\u5F85\u6FC0\u6D3B\u786E\u6743\u91D1';
const MIXED_PAYMENT_LABEL = '\u6DF7\u5408\u652F\u4ED8';
const MONEY_PREFIX = '\u00A5';

export const RESERVATION_PAYMENT_LABELS: Record<ReservationPaymentType, string> = {
  balance_available: SPECIAL_FUND_LABEL,
  pending_activation_gold: PENDING_ACTIVATION_GOLD_LABEL,
  mixed: MIXED_PAYMENT_LABEL,
};

const PAYMENT_TYPE_ALIASES: Record<string, ReservationPaymentType> = {
  balance_available: 'balance_available',
  balanceavailable: 'balance_available',
  balance: 'balance_available',
  special_fund: 'balance_available',
  specialfund: 'balance_available',
  money: 'balance_available',
  cash: 'balance_available',
  '\u4E13\u9879\u91D1': 'balance_available',
  '\u4E13\u9879\u91D1\u652F\u4ED8': 'balance_available',
  score: 'pending_activation_gold',
  score_payment: 'pending_activation_gold',
  scorepay: 'pending_activation_gold',
  consume_gold: 'pending_activation_gold',
  consumegold: 'pending_activation_gold',
  '\u6D88\u8D39\u91D1': 'pending_activation_gold',
  '\u6D88\u8D39\u91D1\u652F\u4ED8': 'pending_activation_gold',
  pending_activation_gold: 'pending_activation_gold',
  pendingactivationgold: 'pending_activation_gold',
  confirm_rights_gold: 'pending_activation_gold',
  confirmrightsgold: 'pending_activation_gold',
  green_power: 'pending_activation_gold',
  greenpower: 'pending_activation_gold',
  hashrate: 'pending_activation_gold',
  '\u7EFF\u8272\u7B97\u529B': 'pending_activation_gold',
  '\u5F85\u6FC0\u6D3B\u786E\u6743\u91D1': 'pending_activation_gold',
  '\u5F85\u6FC0\u6D3B\u786E\u6743\u91D1\u652F\u4ED8': 'pending_activation_gold',
  mixed: 'mixed',
  mixed_payment: 'mixed',
  mixedpay: 'mixed',
  combo: 'mixed',
  combination: 'mixed',
  combined: 'mixed',
  '\u6DF7\u5408\u652F\u4ED8': 'mixed',
};

const BALANCE_AVAILABLE_HINTS = [
  'balance_available',
  'balanceavailable',
  'balance',
  'special_fund',
  'specialfund',
  'money',
  'cash',
  '\u4E13\u9879\u91D1',
];

const PENDING_ACTIVATION_GOLD_HINTS = [
  'pending_activation_gold',
  'pendingactivationgold',
  'confirm_rights_gold',
  'confirmrightsgold',
  'score',
  'consume_gold',
  'consumegold',
  'green_power',
  'greenpower',
  'hashrate',
  '\u6D88\u8D39\u91D1',
  '\u7EFF\u8272\u7B97\u529B',
  '\u5F85\u6FC0\u6D3B\u786E\u6743\u91D1',
];

const FREEZE_TOTAL_KEYS = [
  'freeze_amount',
  'frozen_amount',
  'freeze_total_amount',
  'frozen_total_amount',
];

const FREEZE_BALANCE_AVAILABLE_KEYS = [
  'freeze_balance_available',
  'freeze_balance_available_amount',
  'frozen_balance_available',
  'frozen_balance_available_amount',
  'freeze_balance_amount',
  'frozen_balance_amount',
  'freeze_money_amount',
  'frozen_money_amount',
  'freeze_special_fund_amount',
  'frozen_special_fund_amount',
];

const FREEZE_PENDING_ACTIVATION_GOLD_KEYS = [
  'freeze_pending_activation_gold',
  'freeze_pending_activation_gold_amount',
  'frozen_pending_activation_gold',
  'frozen_pending_activation_gold_amount',
  'freeze_confirm_rights_gold',
  'freeze_confirm_rights_gold_amount',
  'frozen_confirm_rights_gold',
  'frozen_confirm_rights_gold_amount',
  'freeze_score_amount',
  'frozen_score_amount',
  'freeze_score',
  'frozen_score',
  'freeze_consume_gold_amount',
  'frozen_consume_gold_amount',
  'freeze_green_power_amount',
  'frozen_green_power_amount',
  'pending_activation_gold_freeze_amount',
  'confirm_rights_gold_freeze_amount',
  'score_freeze_amount',
  'green_power_freeze_amount',
];

const ACTUAL_TOTAL_KEYS = [
  'actual_pay_amount',
  'actual_amount',
  'pay_amount',
  'actual_total_amount',
  'actual_buy_price',
];

const ACTUAL_BALANCE_AVAILABLE_KEYS = [
  'actual_pay_balance_available',
  'actual_pay_balance_available_amount',
  'actual_balance_available',
  'actual_balance_available_amount',
  'actual_buy_balance_available_amount',
  'pay_balance_available_amount',
  'actual_balance_amount',
  'actual_money_amount',
  'actual_special_fund_amount',
];

const ACTUAL_PENDING_ACTIVATION_GOLD_KEYS = [
  'actual_pay_pending_activation_gold',
  'actual_pay_pending_activation_gold_amount',
  'actual_pending_activation_gold',
  'actual_pending_activation_gold_amount',
  'actual_pay_confirm_rights_gold',
  'actual_pay_confirm_rights_gold_amount',
  'actual_confirm_rights_gold',
  'actual_confirm_rights_gold_amount',
  'actual_buy_green_power_amount',
  'actual_pay_green_power_amount',
  'actual_green_power_amount',
  'pay_green_power_amount',
  'actual_pay_score_amount',
  'actual_score_amount',
  'pay_score_amount',
  'actual_score',
  'actual_total_score',
];

const REFUND_TOTAL_KEYS = [
  'refund_amount',
  'refund_total_amount',
  'returned_amount',
  'return_amount',
  'refund_diff',
];

const REFUND_BALANCE_AVAILABLE_KEYS = [
  'refund_balance_available',
  'refund_balance_available_amount',
  'returned_balance_available',
  'returned_balance_available_amount',
  'return_balance_available',
  'return_balance_available_amount',
  'refund_balance_amount',
  'returned_balance_amount',
  'refund_money_amount',
  'refund_special_fund_amount',
];

const REFUND_PENDING_ACTIVATION_GOLD_KEYS = [
  'refund_pending_activation_gold',
  'refund_pending_activation_gold_amount',
  'returned_pending_activation_gold',
  'returned_pending_activation_gold_amount',
  'return_pending_activation_gold',
  'return_pending_activation_gold_amount',
  'refund_confirm_rights_gold',
  'refund_confirm_rights_gold_amount',
  'returned_confirm_rights_gold',
  'returned_confirm_rights_gold_amount',
  'return_confirm_rights_gold',
  'return_confirm_rights_gold_amount',
  'refund_green_power_amount',
  'returned_green_power_amount',
  'return_green_power_amount',
  'refund_score_amount',
  'returned_score_amount',
  'refund_total_score',
  'refund_score',
];

const ZERO_SPLIT: ReservationPaymentSplit = {
  total: 0,
  totalText: `${MONEY_PREFIX}0`,
  balanceAvailableAmount: 0,
  pendingActivationGoldAmount: 0,
  parts: [],
  rows: [],
  inlineText: null,
  hasBreakdown: false,
  hasValue: false,
  isMixed: false,
};

const normalizeToken = (value: string) => value.trim().toLowerCase().replace(/[\s+-]+/g, '_');

const includesHint = (source: string, hints: string[]) =>
  hints.some((hint) => source.includes(hint.toLowerCase()));

const asPaymentRecord = (value: unknown): ReservationPaymentRecord | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as ReservationPaymentRecord;
};

const hasOwn = (source: ReservationPaymentRecord, key: string) =>
  Object.prototype.hasOwnProperty.call(source, key);

const toOptionalPaymentNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().replace(/,/g, '');
    if (!normalized) {
      return null;
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const readFirstPaymentNumber = (
  source: ReservationPaymentRecord,
  keys: string[],
): number | null => {
  for (const key of keys) {
    if (!hasOwn(source, key)) {
      continue;
    }

    const value = toOptionalPaymentNumber(source[key]);
    if (value !== null) {
      return value;
    }
  }

  return null;
};

const readFirstPaymentText = (
  source: ReservationPaymentRecord,
  keys: string[],
): string | null => {
  for (const key of keys) {
    if (!hasOwn(source, key)) {
      continue;
    }

    const value = source[key];
    if (typeof value === 'string') {
      const trimmedValue = value.trim();
      if (trimmedValue) {
        return trimmedValue;
      }
    }
  }

  return null;
};

const isRefundedStatus = (status?: unknown) =>
  Number(status) === ReservationStatus.REFUNDED || Number(status) === ReservationStatus.FAILED;

const buildReservationPaymentSplit = (
  total: number | null,
  balanceAvailableAmount: number | null,
  pendingActivationGoldAmount: number | null,
): ReservationPaymentSplit => {
  const safeBalanceAvailableAmount = Math.max(0, balanceAvailableAmount ?? 0);
  const safePendingActivationGoldAmount = Math.max(0, pendingActivationGoldAmount ?? 0);
  const breakdownTotal = safeBalanceAvailableAmount + safePendingActivationGoldAmount;
  const safeTotal = Math.max(0, total ?? breakdownTotal);
  const rows = buildReservationPaymentSplitRows({
    balanceAvailableAmount: safeBalanceAvailableAmount,
    pendingActivationGoldAmount: safePendingActivationGoldAmount,
    balanceAvailablePrefix: MONEY_PREFIX,
    pendingActivationGoldPrefix: MONEY_PREFIX,
  });
  const parts: ReservationPaymentPart[] = rows.map((row) => ({
    key: row.key as ReservationPaymentSegmentType,
    label: row.label,
    value: row.amountValue ?? 0,
    valueText: row.amountText,
    text: `${row.label} ${row.amountText}`,
    tone: (row.tone as ReservationPaymentSegmentType) ?? 'balance_available',
  }));
  const inlineText = parts.length ? parts.map((part) => part.text).join(' + ') : null;

  return {
    total: safeTotal,
    totalText: formatPaymentValue(safeTotal, { prefix: MONEY_PREFIX }),
    balanceAvailableAmount: safeBalanceAvailableAmount,
    pendingActivationGoldAmount: safePendingActivationGoldAmount,
    parts,
    rows,
    inlineText,
    hasBreakdown: balanceAvailableAmount !== null || pendingActivationGoldAmount !== null,
    hasValue: safeTotal > 0 || breakdownTotal > 0,
    isMixed: safeBalanceAvailableAmount > 0 && safePendingActivationGoldAmount > 0,
  };
};

export const toPaymentNumber = (value: unknown): number => {
  const amount = toOptionalPaymentNumber(value);
  return amount ?? 0;
};

export const formatPaymentValue = (
  value: unknown,
  options: { prefix?: string; suffix?: string } = {},
): string => {
  const { prefix = '', suffix = '' } = options;
  const amount = toPaymentNumber(value);
  const maximumFractionDigits = Number.isInteger(amount) ? 0 : 2;

  return `${prefix}${amount.toLocaleString('zh-CN', {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  })}${suffix}`;
};

export const normalizeReservationPaymentType = (
  value?: string | null,
): ReservationPaymentType | null => {
  if (!value) {
    return null;
  }

  const rawValue = value.trim();
  if (!rawValue) {
    return null;
  }

  const normalizedValue = normalizeToken(rawValue);
  const aliasedValue = PAYMENT_TYPE_ALIASES[rawValue] ?? PAYMENT_TYPE_ALIASES[normalizedValue];
  if (aliasedValue) {
    return aliasedValue;
  }

  const lowercaseValue = rawValue.toLowerCase();
  const hasBalanceAvailable =
    includesHint(lowercaseValue, BALANCE_AVAILABLE_HINTS) ||
    includesHint(normalizedValue, BALANCE_AVAILABLE_HINTS);
  const hasPendingActivationGold =
    includesHint(lowercaseValue, PENDING_ACTIVATION_GOLD_HINTS) ||
    includesHint(normalizedValue, PENDING_ACTIVATION_GOLD_HINTS);

  if (hasBalanceAvailable && hasPendingActivationGold) {
    return 'mixed';
  }

  if (hasPendingActivationGold) {
    return 'pending_activation_gold';
  }

  if (hasBalanceAvailable) {
    return 'balance_available';
  }

  return null;
};

export const resolveReservationPaymentType = ({
  type,
  balanceAvailableAmount,
  pendingActivationGoldAmount,
  scoreAmount,
  greenPowerAmount,
}: ResolveReservationPaymentTypeParams): ReservationPaymentType | null => {
  const normalizedType = normalizeReservationPaymentType(type);
  if (normalizedType) {
    return normalizedType;
  }

  const hasBalanceAvailable = toPaymentNumber(balanceAvailableAmount ?? scoreAmount) > 0;
  const hasPendingActivationGold =
    toPaymentNumber(pendingActivationGoldAmount ?? greenPowerAmount) > 0;

  if (hasBalanceAvailable && hasPendingActivationGold) {
    return 'mixed';
  }

  if (hasPendingActivationGold) {
    return 'pending_activation_gold';
  }

  if (hasBalanceAvailable) {
    return 'balance_available';
  }

  return null;
};

export const getReservationPaymentLabel = (
  type?: string | null,
  fallbackText?: string | null,
): string | null => {
  const normalizedType =
    normalizeReservationPaymentType(type) ?? normalizeReservationPaymentType(fallbackText);

  if (normalizedType) {
    return RESERVATION_PAYMENT_LABELS[normalizedType];
  }

  return fallbackText?.trim() || null;
};

export const buildReservationPaymentSplitRows = ({
  balanceAvailableAmount,
  pendingActivationGoldAmount,
  scoreAmount,
  greenPowerAmount,
  includeZero = false,
  balanceAvailablePrefix,
  balanceAvailableSuffix,
  pendingActivationGoldPrefix,
  pendingActivationGoldSuffix,
  scorePrefix,
  scoreSuffix,
  greenPowerPrefix,
  greenPowerSuffix,
  balanceAvailableLabel,
  pendingActivationGoldLabel,
  scoreLabel,
  greenPowerLabel,
}: BuildReservationPaymentSplitRowsParams): PaymentSplitRowData[] => {
  const rows: PaymentSplitRowData[] = [];
  const normalizedBalanceAvailable = toPaymentNumber(balanceAvailableAmount ?? scoreAmount);
  const normalizedPendingActivationGold = toPaymentNumber(
    pendingActivationGoldAmount ?? greenPowerAmount,
  );

  const resolvedBalanceAvailablePrefix = balanceAvailablePrefix ?? scorePrefix ?? '';
  const resolvedBalanceAvailableSuffix = balanceAvailableSuffix ?? scoreSuffix ?? '';
  const resolvedPendingActivationGoldPrefix = pendingActivationGoldPrefix ?? greenPowerPrefix ?? '';
  const resolvedPendingActivationGoldSuffix = pendingActivationGoldSuffix ?? greenPowerSuffix ?? '';
  const resolvedBalanceAvailableLabel =
    balanceAvailableLabel ?? scoreLabel ?? RESERVATION_PAYMENT_LABELS.balance_available;
  const resolvedPendingActivationGoldLabel =
    pendingActivationGoldLabel ??
    greenPowerLabel ??
    RESERVATION_PAYMENT_LABELS.pending_activation_gold;

  if (includeZero || normalizedBalanceAvailable > 0) {
    rows.push({
      key: 'balance_available',
      label: resolvedBalanceAvailableLabel,
      amountText: formatPaymentValue(normalizedBalanceAvailable, {
        prefix: resolvedBalanceAvailablePrefix,
        suffix: resolvedBalanceAvailableSuffix,
      }),
      amountValue: normalizedBalanceAvailable,
      tone: 'balance_available',
    });
  }

  if (includeZero || normalizedPendingActivationGold > 0) {
    rows.push({
      key: 'pending_activation_gold',
      label: resolvedPendingActivationGoldLabel,
      amountText: formatPaymentValue(normalizedPendingActivationGold, {
        prefix: resolvedPendingActivationGoldPrefix,
        suffix: resolvedPendingActivationGoldSuffix,
      }),
      amountValue: normalizedPendingActivationGold,
      tone: 'pending_activation_gold',
    });
  }

  return rows;
};

export const getReservationPaymentSummary = (
  record: unknown,
): ReservationPaymentSummary => {
  const source = asPaymentRecord(record) ?? {};
  const freeze = buildReservationPaymentSplit(
    readFirstPaymentNumber(source, FREEZE_TOTAL_KEYS),
    readFirstPaymentNumber(source, FREEZE_BALANCE_AVAILABLE_KEYS),
    readFirstPaymentNumber(source, FREEZE_PENDING_ACTIVATION_GOLD_KEYS),
  );
  const refund = buildReservationPaymentSplit(
    readFirstPaymentNumber(source, REFUND_TOTAL_KEYS) ??
      (isRefundedStatus(source.status) ? freeze.total : null),
    readFirstPaymentNumber(source, REFUND_BALANCE_AVAILABLE_KEYS),
    readFirstPaymentNumber(source, REFUND_PENDING_ACTIVATION_GOLD_KEYS),
  );
  const actual = buildReservationPaymentSplit(
    readFirstPaymentNumber(source, ACTUAL_TOTAL_KEYS) ??
      ((freeze.total > 0 || refund.total > 0) ? Math.max(0, freeze.total - refund.total) : null),
    readFirstPaymentNumber(source, ACTUAL_BALANCE_AVAILABLE_KEYS),
    readFirstPaymentNumber(source, ACTUAL_PENDING_ACTIVATION_GOLD_KEYS),
  );
  const rawPayType = readFirstPaymentText(source, ['pay_type']);
  const rawPayTypeText = readFirstPaymentText(source, ['pay_type_text']);
  const payType = resolveReservationPaymentType({
    type: rawPayType ?? rawPayTypeText,
    balanceAvailableAmount:
      freeze.balanceAvailableAmount ||
      actual.balanceAvailableAmount ||
      refund.balanceAvailableAmount,
    pendingActivationGoldAmount:
      freeze.pendingActivationGoldAmount ||
      actual.pendingActivationGoldAmount ||
      refund.pendingActivationGoldAmount,
  });
  const payTypeLabel = getReservationPaymentLabel(rawPayType, rawPayTypeText);

  return {
    freeze,
    actual,
    refund,
    payType,
    payTypeLabel,
    isMixedPayment:
      payType === 'mixed' || freeze.isMixed || actual.isMixed || refund.isMixed,
  };
};

export const getReservationSplitInlineText = (
  split: ReservationPaymentSplit,
): string | null => split.inlineText;

export const getReservationRefundInlineText = (
  split: ReservationPaymentSplit,
  fallbackTotal?: number,
): string | null => {
  if (split.inlineText) {
    return split.inlineText;
  }

  if ((fallbackTotal ?? split.total) > 0) {
    return `\u5DF2\u9000\u56DE ${formatPaymentValue(fallbackTotal ?? split.total, {
      prefix: MONEY_PREFIX,
    })}`;
  }

  return null;
};

export const hasReservationSplit = (split: ReservationPaymentSplit) =>
  split.hasBreakdown && split.parts.length > 0;

export const emptyReservationPaymentSplit = ZERO_SPLIT;
