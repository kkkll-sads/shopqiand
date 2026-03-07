import { formatAmount, formatPriceSmart } from '@/utils/format';
import {
  buildReservationPaymentSplitRows,
  formatPaymentValue,
  getReservationPaymentLabel,
  resolveReservationPaymentType,
  type PaymentSplitRowData,
  type PaymentSplitRowTone,
} from '@/pages/market/utils/reservationPayment';

type UnknownRecord = Record<string, unknown>;

export interface OrderPaymentSummaryLine {
  label: string;
  value: string;
  tone?: 'default' | 'money' | 'score' | 'positive';
}

export interface OrderPaymentSummary {
  payTypeLabel: string;
  paymentTagText?: string;
  shortSummary: string;
  detailLines: OrderPaymentSummaryLine[];
  reservationLines: OrderPaymentSummaryLine[];
  paymentRows: PaymentSplitRowData[];
  freezeRows: PaymentSplitRowData[];
  refundRows: PaymentSplitRowData[];
  payBalanceAvailable: number;
  payPendingActivationGold: number;
  payRatioText?: string;
  reservationId?: string | number;
  freezeTotal?: number;
  freezeTotalText?: string;
  refundTotal?: number;
  refundTotalText?: string;
  isMixed: boolean;
  isReservationSource: boolean;
  hasReservationSummary: boolean;
}

const SPECIAL_FUND_LABEL = getReservationPaymentLabel('balance_available') ?? '专项金';
const PENDING_ACTIVATION_GOLD_LABEL =
  getReservationPaymentLabel('pending_activation_gold') ?? '待激活确权金';

const MIXED_PAY_RE = /combined|mix|combo|combination|混合|组合/i;
const RESERVATION_SOURCE_RE = /reservation|预约|申购|blind[_\s-]?box|match|撮合/i;

const PAY_TYPE_PATHS = ['pay_type', 'payment_type', 'payment_mode'];
const PAY_TYPE_TEXT_PATHS = ['pay_type_text', 'payment_type_text', 'payment_mode_text'];
const PAY_RATIO_PATHS = [
  'pay_ratio',
  'pay_ratio_text',
  'payment_summary.pay_ratio',
  'payment_summary.pay_ratio_text',
  'payment_summary.ratio_text',
  'payment_breakdown.pay_ratio',
  'payment_detail.pay_ratio',
  'reservation_summary.pay_ratio',
  'reservation_summary.ratio_text',
  'ratio_text',
];
const SOURCE_TYPE_PATHS = [
  'source_type',
  'order_source',
  'source',
  'from_type',
  'order_from',
  'biz_type',
  'trade_type',
];
const DIRECT_RESERVATION_ID_PATHS = [
  'reservation.reservation_id',
  'reservation.id',
  'reservation_id',
  'reservationRecordId',
  'reservation_record_id',
  'match_reservation_id',
];
const SOURCE_ID_PATHS = ['source_id', 'origin_id', 'from_id'];

const PAY_BALANCE_AVAILABLE_PATHS = [
  'pay_balance_available',
  'pay_balance_available_amount',
  'payment_summary.pay_balance_available',
  'payment_summary.pay_balance_available_amount',
  'payment_breakdown.pay_balance_available',
  'payment_breakdown.pay_balance_available_amount',
  'payment_detail.pay_balance_available',
  'payment_detail.pay_balance_available_amount',
  'pay_summary.pay_balance_available',
  'pay_summary.pay_balance_available_amount',
  'pay_breakdown.pay_balance_available',
  'pay_breakdown.pay_balance_available_amount',
  'balance_amount',
  'money_amount',
  'cash_amount',
  'balance_pay_amount',
  'balance_available_amount',
];

const PAY_PENDING_ACTIVATION_GOLD_PATHS = [
  'pay_pending_activation_gold',
  'pay_pending_activation_gold_amount',
  'pay_confirm_rights_gold',
  'pay_confirm_rights_gold_amount',
  'pay_score',
  'pay_score_amount',
  'payment_summary.pay_pending_activation_gold',
  'payment_summary.pay_pending_activation_gold_amount',
  'payment_summary.pay_confirm_rights_gold',
  'payment_summary.pay_confirm_rights_gold_amount',
  'payment_summary.pay_score',
  'payment_summary.pay_score_amount',
  'payment_breakdown.pay_pending_activation_gold',
  'payment_breakdown.pay_pending_activation_gold_amount',
  'payment_detail.pay_pending_activation_gold',
  'payment_detail.pay_pending_activation_gold_amount',
  'pay_summary.pay_pending_activation_gold',
  'pay_summary.pay_pending_activation_gold_amount',
  'pay_breakdown.pay_pending_activation_gold',
  'pay_breakdown.pay_pending_activation_gold_amount',
  'score_amount',
  'consume_score',
  'pay_score',
  'score_pay_amount',
];

const RESERVATION_FREEZE_TOTAL_PATHS = [
  'reservation_summary.freeze_amount',
  'reservation.freeze_amount',
  'freeze_amount',
  'freeze_total_amount',
  'frozen_amount',
  'origin_freeze_amount',
  'reservation_freeze_amount',
];

const RESERVATION_FREEZE_BALANCE_PATHS = [
  'reservation_summary.freeze_balance_available',
  'reservation_summary.freeze_balance_available_amount',
  'reservation.freeze_balance_available',
  'reservation.freeze_balance_available_amount',
  'freeze_balance_available',
  'freeze_balance_available_amount',
  'freeze_balance_amount',
  'freeze_special_fund_amount',
];

const RESERVATION_FREEZE_PENDING_PATHS = [
  'reservation_summary.freeze_pending_activation_gold',
  'reservation_summary.freeze_pending_activation_gold_amount',
  'reservation_summary.freeze_confirm_rights_gold',
  'reservation_summary.freeze_confirm_rights_gold_amount',
  'reservation.freeze_pending_activation_gold',
  'reservation.freeze_pending_activation_gold_amount',
  'freeze_pending_activation_gold',
  'freeze_pending_activation_gold_amount',
  'freeze_confirm_rights_gold',
  'freeze_confirm_rights_gold_amount',
  'freeze_score_amount',
  'freeze_green_power_amount',
];

const RESERVATION_REFUND_TOTAL_PATHS = [
  'reservation_summary.refund_amount',
  'reservation_summary.refund_total_amount',
  'reservation_summary.refund_diff',
  'reservation.refund_amount',
  'reservation.refund_total_amount',
  'reservation.refund_diff',
  'refund_amount',
  'refund_total_amount',
  'refund_diff',
  'reservation_refund_amount',
];

const RESERVATION_REFUND_BALANCE_PATHS = [
  'reservation_summary.refund_balance_available',
  'reservation_summary.refund_balance_available_amount',
  'reservation.refund_balance_available',
  'reservation.refund_balance_available_amount',
  'refund_balance_available',
  'refund_balance_available_amount',
  'refund_balance_amount',
  'refund_special_fund_amount',
];

const RESERVATION_REFUND_PENDING_PATHS = [
  'reservation_summary.refund_pending_activation_gold',
  'reservation_summary.refund_pending_activation_gold_amount',
  'reservation_summary.refund_confirm_rights_gold',
  'reservation_summary.refund_confirm_rights_gold_amount',
  'reservation.refund_pending_activation_gold',
  'reservation.refund_pending_activation_gold_amount',
  'refund_pending_activation_gold',
  'refund_pending_activation_gold_amount',
  'refund_confirm_rights_gold',
  'refund_confirm_rights_gold_amount',
  'refund_score_amount',
  'refund_green_power_amount',
];

const asRecord = (value: unknown): UnknownRecord | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as UnknownRecord;
};

const getPathValue = (source: unknown, path: string): unknown =>
  path.split('.').reduce<unknown>((current, key) => {
    const record = asRecord(current);
    return record ? record[key] : undefined;
  }, source);

const firstDefined = (source: unknown, paths: string[]): unknown => {
  for (const path of paths) {
    const value = getPathValue(source, path);
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }

  return undefined;
};

const parseNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().replace(/,/g, '');
    if (!normalized) {
      return undefined;
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
};

const firstNumber = (source: unknown, paths: string[]): number | undefined => {
  const value = firstDefined(source, paths);
  return parseNumber(value);
};

const firstString = (source: unknown, paths: string[]): string | undefined => {
  const value = firstDefined(source, paths);
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || undefined;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  return undefined;
};

const getItems = (source: unknown): UnknownRecord[] => {
  const record = asRecord(source);
  if (!record || !Array.isArray(record.items)) {
    return [];
  }

  return record.items.filter((item): item is UnknownRecord => Boolean(asRecord(item)));
};

const getItemTotal = (
  item: UnknownRecord,
  subtotalPaths: string[],
  unitPaths: string[],
): number | undefined => {
  const subtotal = firstNumber(item, subtotalPaths);
  if (subtotal !== undefined) {
    return subtotal;
  }

  const unitPrice = firstNumber(item, unitPaths);
  if (unitPrice === undefined) {
    return undefined;
  }

  const quantity = firstNumber(item, ['quantity']) ?? 1;
  return unitPrice * quantity;
};

const sumItemTotals = (
  items: UnknownRecord[],
  subtotalPaths: string[],
  unitPaths: string[],
): number =>
  items.reduce((total, item) => total + (getItemTotal(item, subtotalPaths, unitPaths) ?? 0), 0);

const formatMoneyValue = (value: number) => `¥${formatAmount(value)}`;
const formatPendingActivationGoldValue = (value: number) => formatPaymentValue(value);
const formatPendingActivationGoldDisplay = (value: number) =>
  `${formatPendingActivationGoldValue(value)}${PENDING_ACTIVATION_GOLD_LABEL}`;

const formatPercentLike = (value: number): string => {
  if (!Number.isFinite(value)) {
    return '0%';
  }

  if (value <= 1) {
    return `${Math.round(value * 100)}%`;
  }

  if (value <= 100) {
    return `${Math.round(value)}%`;
  }

  return `${formatPriceSmart(value)}%`;
};

const formatRatioTextFromObject = (value: unknown): string | undefined => {
  const record = asRecord(value);
  if (!record) {
    return undefined;
  }

  const directText = firstString(record, ['text', 'label', 'ratio_text', 'pay_ratio_text', 'display']);
  if (directText) {
    return directText;
  }

  const balanceRatio = firstNumber(record, [
    'balance_available',
    'balance_available_ratio',
    'balance',
    'balance_ratio',
    'special_fund',
    'special_fund_ratio',
  ]);
  const pendingRatio = firstNumber(record, [
    'pending_activation_gold',
    'pending_activation_gold_ratio',
    'confirm_rights_gold',
    'confirm_rights_gold_ratio',
    'score',
    'score_ratio',
    'green_power',
    'green_power_ratio',
  ]);

  const parts: string[] = [];
  if (balanceRatio !== undefined) {
    parts.push(`${SPECIAL_FUND_LABEL} ${formatPercentLike(balanceRatio)}`);
  }
  if (pendingRatio !== undefined) {
    parts.push(`${PENDING_ACTIVATION_GOLD_LABEL} ${formatPercentLike(pendingRatio)}`);
  }

  return parts.length ? parts.join(' / ') : undefined;
};

const toLineTone = (tone?: PaymentSplitRowTone): OrderPaymentSummaryLine['tone'] => {
  if (tone === 'balance_available') {
    return 'money';
  }

  if (tone === 'pending_activation_gold') {
    return 'score';
  }

  return 'default';
};

const getFallbackPayTypeLabel = (
  payType: string | undefined,
  payTypeText: string | undefined,
  isMixed: boolean,
  payBalanceAvailable: number,
  payPendingActivationGold: number,
): string => {
  if (payTypeText) {
    return payTypeText;
  }

  const resolvedType = resolveReservationPaymentType({
    type: payType,
    balanceAvailableAmount: payBalanceAvailable,
    pendingActivationGoldAmount: payPendingActivationGold,
  });

  if (resolvedType === 'mixed' || isMixed) {
    return '混合支付';
  }

  if (resolvedType === 'pending_activation_gold') {
    return `${PENDING_ACTIVATION_GOLD_LABEL}支付`;
  }

  if (resolvedType === 'balance_available') {
    return `${SPECIAL_FUND_LABEL}支付`;
  }

  return '支付方式待确认';
};

const buildShortSummary = (
  payBalanceAvailable: number,
  payPendingActivationGold: number,
  payTypeLabel: string,
): string => {
  if (payBalanceAvailable > 0 && payPendingActivationGold > 0) {
    return `${SPECIAL_FUND_LABEL} ${formatMoneyValue(payBalanceAvailable)} + ${PENDING_ACTIVATION_GOLD_LABEL} ${formatPendingActivationGoldValue(payPendingActivationGold)}`;
  }

  if (payBalanceAvailable > 0) {
    return `实付 ${formatMoneyValue(payBalanceAvailable)}`;
  }

  if (payPendingActivationGold > 0) {
    return `实付 ${formatPendingActivationGoldDisplay(payPendingActivationGold)}`;
  }

  return payTypeLabel;
};

const buildDerivedRatioText = (
  payBalanceAvailable: number,
  payPendingActivationGold: number,
): string | undefined => {
  if (payBalanceAvailable <= 0 || payPendingActivationGold <= 0) {
    return undefined;
  }

  const total = payBalanceAvailable + payPendingActivationGold;
  if (total <= 0) {
    return undefined;
  }

  return `${SPECIAL_FUND_LABEL} ${formatPercentLike(payBalanceAvailable / total)} / ${PENDING_ACTIVATION_GOLD_LABEL} ${formatPercentLike(payPendingActivationGold / total)}`;
};

const buildRatioText = (
  order: unknown,
  payBalanceAvailable: number,
  payPendingActivationGold: number,
): string | undefined => {
  const rawRatio = firstDefined(order, PAY_RATIO_PATHS);

  if (typeof rawRatio === 'string') {
    const trimmed = rawRatio.trim();
    if (trimmed) {
      return trimmed;
    }
  }

  if (typeof rawRatio === 'number' && Number.isFinite(rawRatio)) {
    return formatPercentLike(rawRatio);
  }

  const ratioFromObject = formatRatioTextFromObject(rawRatio);
  if (ratioFromObject) {
    return ratioFromObject;
  }

  return buildDerivedRatioText(payBalanceAvailable, payPendingActivationGold);
};

export const getReservationRecordId = (order: unknown): string | number | undefined => {
  const directReservationId = firstDefined(order, DIRECT_RESERVATION_ID_PATHS);
  if (directReservationId !== undefined && directReservationId !== null && directReservationId !== '') {
    return directReservationId as string | number;
  }

  const sourceType = firstString(order, SOURCE_TYPE_PATHS);
  if (!sourceType || !RESERVATION_SOURCE_RE.test(sourceType)) {
    return undefined;
  }

  const sourceId = firstDefined(order, SOURCE_ID_PATHS);
  if (sourceId !== undefined && sourceId !== null && sourceId !== '') {
    return sourceId as string | number;
  }

  return undefined;
};

export const buildOrderPaymentSummary = (
  order: unknown,
  reservationRecord?: unknown,
): OrderPaymentSummary => {
  const items = getItems(order);
  const rawPayType = firstString(order, PAY_TYPE_PATHS);
  const payTypeText = firstString(order, PAY_TYPE_TEXT_PATHS);
  const sourceType = firstString(order, SOURCE_TYPE_PATHS);

  const explicitPayBalanceAvailable = firstNumber(order, PAY_BALANCE_AVAILABLE_PATHS);
  const explicitPayPendingActivationGold = firstNumber(order, PAY_PENDING_ACTIVATION_GOLD_PATHS);
  const hasExplicitPaySplit =
    explicitPayBalanceAvailable !== undefined || explicitPayPendingActivationGold !== undefined;

  const itemBalanceAvailable = sumItemTotals(
    items,
    ['subtotal_balance_available', 'subtotal'],
    ['balance_available_amount', 'price'],
  );
  const itemPendingActivationGold = sumItemTotals(
    items,
    ['subtotal_pending_activation_gold', 'subtotal_score'],
    ['pending_activation_gold_price', 'confirm_rights_gold_price', 'score_price'],
  );

  const totalAmount = firstNumber(order, ['total_amount']) ?? 0;
  const totalScore = firstNumber(order, ['total_score']) ?? 0;

  const payBalanceAvailable = hasExplicitPaySplit
    ? explicitPayBalanceAvailable ?? 0
    : itemBalanceAvailable > 0
      ? itemBalanceAvailable
      : totalAmount;
  const payPendingActivationGold = hasExplicitPaySplit
    ? explicitPayPendingActivationGold ?? 0
    : itemPendingActivationGold > 0
      ? itemPendingActivationGold
      : totalScore;

  const isMixed = MIXED_PAY_RE.test(`${rawPayType || ''} ${payTypeText || ''}`)
    || (payBalanceAvailable > 0 && payPendingActivationGold > 0);

  const payTypeLabel = getFallbackPayTypeLabel(
    rawPayType,
    payTypeText,
    isMixed,
    payBalanceAvailable,
    payPendingActivationGold,
  );
  const payRatioText = buildRatioText(order, payBalanceAvailable, payPendingActivationGold);

  const paymentRows = buildReservationPaymentSplitRows({
    balanceAvailableAmount: payBalanceAvailable,
    pendingActivationGoldAmount: payPendingActivationGold,
    balanceAvailablePrefix: '¥',
    balanceAvailableLabel: `${SPECIAL_FUND_LABEL}支付`,
    pendingActivationGoldLabel: `${PENDING_ACTIVATION_GOLD_LABEL}支付`,
  });

  const detailLines: OrderPaymentSummaryLine[] = paymentRows.map((row) => ({
    label: row.label,
    value: row.amountText,
    tone: toLineTone(row.tone),
  }));

  if (payRatioText) {
    detailLines.push({
      label: '支付比例',
      value: payRatioText,
    });
  }

  if (detailLines.length === 0 && payTypeLabel) {
    detailLines.push({
      label: '支付方式',
      value: payTypeLabel,
    });
  }

  const reservationId = getReservationRecordId(order);
  const reservationSource = reservationRecord ?? order;

  const freezeTotal = firstNumber(reservationSource, RESERVATION_FREEZE_TOTAL_PATHS);
  const freezeBalanceAvailable = firstNumber(reservationSource, RESERVATION_FREEZE_BALANCE_PATHS);
  const freezePendingActivationGold = firstNumber(reservationSource, RESERVATION_FREEZE_PENDING_PATHS);
  const refundTotal = firstNumber(reservationSource, RESERVATION_REFUND_TOTAL_PATHS);
  const refundBalanceAvailable = firstNumber(reservationSource, RESERVATION_REFUND_BALANCE_PATHS);
  const refundPendingActivationGold = firstNumber(reservationSource, RESERVATION_REFUND_PENDING_PATHS);

  const freezeRows = buildReservationPaymentSplitRows({
    balanceAvailableAmount: freezeBalanceAvailable,
    pendingActivationGoldAmount: freezePendingActivationGold,
    balanceAvailablePrefix: '¥',
    balanceAvailableLabel: `冻结${SPECIAL_FUND_LABEL}`,
    pendingActivationGoldLabel: `冻结${PENDING_ACTIVATION_GOLD_LABEL}`,
  });

  const refundRows = buildReservationPaymentSplitRows({
    balanceAvailableAmount: refundBalanceAvailable,
    pendingActivationGoldAmount: refundPendingActivationGold,
    balanceAvailablePrefix: '¥',
    balanceAvailableLabel: `退回${SPECIAL_FUND_LABEL}`,
    pendingActivationGoldLabel: `退回${PENDING_ACTIVATION_GOLD_LABEL}`,
  });

  const freezeTotalText = freezeTotal && freezeTotal > 0 ? formatMoneyValue(freezeTotal) : undefined;
  const refundTotalText = refundTotal && refundTotal > 0 ? `+${formatMoneyValue(refundTotal)}` : undefined;

  const reservationLines: OrderPaymentSummaryLine[] = [];
  if (freezeTotalText) {
    reservationLines.push({
      label: '冻结合计',
      value: freezeTotalText,
      tone: 'money',
    });
  }
  if (refundTotalText) {
    reservationLines.push({
      label: '退款合计',
      value: refundTotalText,
      tone: 'positive',
    });
  }

  const isReservationSource =
    Boolean(reservationRecord) ||
    Boolean(reservationId) ||
    Boolean(sourceType && RESERVATION_SOURCE_RE.test(sourceType)) ||
    freezeTotal !== undefined ||
    refundTotal !== undefined ||
    freezeRows.length > 0 ||
    refundRows.length > 0;

  const hasReservationSummary =
    Boolean(reservationId) &&
    (Boolean(freezeTotalText) || Boolean(refundTotalText) || freezeRows.length > 0 || refundRows.length > 0);

  return {
    payTypeLabel,
    paymentTagText: isMixed ? '混合支付' : undefined,
    shortSummary: buildShortSummary(payBalanceAvailable, payPendingActivationGold, payTypeLabel),
    detailLines,
    reservationLines,
    paymentRows,
    freezeRows,
    refundRows,
    payBalanceAvailable,
    payPendingActivationGold,
    payRatioText,
    reservationId,
    freezeTotal,
    freezeTotalText,
    refundTotal,
    refundTotalText,
    isMixed,
    isReservationSource,
    hasReservationSummary,
  };
};
