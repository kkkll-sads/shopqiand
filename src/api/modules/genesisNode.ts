import { http } from '../http';
import { resolveUploadUrl } from './upload';

function readNumber(value: unknown, fallback = 0): number {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : fallback;
}

function readString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function readBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value === 1;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === '1' || normalized === 'true') {
      return true;
    }
    if (normalized === '0' || normalized === 'false') {
      return false;
    }
  }

  return fallback;
}

interface GenesisNodeTierRaw {
  tier_id?: number | string;
  amount?: number | string;
  title?: string;
  image?: string;
  session_id?: number | string;
  zone_id?: number | string;
  enabled?: boolean | number | string;
}

interface GenesisNodePaymentRaw {
  ok?: boolean | number | string;
  pay_type?: string;
  pay_type_text?: string;
  ratio?: string;
  total_amount?: number | string;
  balance_amount?: number | string;
  pending_activation_gold_amount?: number | string;
  available_amounts?: {
    balance_available?: number | string;
    pending_activation_gold?: number | string;
  };
  need_amounts?: {
    balance_available?: number | string;
    pending_activation_gold?: number | string;
  };
}

interface GenesisNodeOrderRaw {
  id?: number | string;
  order_no?: string;
  activity_id?: number | string;
  tier_id?: number | string;
  user_id?: number | string;
  activity_date?: string;
  amount?: number | string;
  title?: string;
  status?: number | string;
  status_text?: string;
  frontend_status_text?: string;
  freeze_amount?: number | string;
  freeze_balance_available?: number | string;
  freeze_pending_activation_gold?: number | string;
  refund_display_status?: number | string;
  refund_display_status_text?: string;
  refund_balance_available?: number | string;
  refund_pending_activation_gold?: number | string;
  user_collection_id?: number | string;
  item_id?: number | string;
  result_time?: string;
  refund_time?: string;
  create_time?: string;
  activity_name?: string;
  activity_title?: string;
  rush_start_time?: string;
  draw_time?: string;
  image?: string;
  payment?: GenesisNodePaymentRaw;
}

interface GenesisNodeActivityRaw {
  activity_id?: number | string;
  name?: string;
  title?: string;
  start_date?: string;
  end_date?: string;
  rush_start_time?: string;
  draw_time?: string;
  display_total_quota?: number | string;
  pay_ratio?: string;
  per_user_daily_limit?: number | string;
  title_fixed?: string;
  fixed_amounts?: Array<number | string>;
  stage?: string;
  stage_text?: string;
  can_buy?: boolean | number | string;
  countdown_target_time?: string;
  countdown_seconds?: number | string;
  server_time?: string;
  tiers?: GenesisNodeTierRaw[];
  today_order?: GenesisNodeOrderRaw | null;
  user_has_order_today?: boolean | number | string;
  user_balance?: {
    balance_available?: number | string;
    pending_activation_gold?: number | string;
  };
}

interface GenesisNodeListRaw {
  list?: GenesisNodeOrderRaw[];
  page?: number | string;
  limit?: number | string;
  total?: number | string;
  status_filter?: string;
}

export type GenesisNodeStage = 'upcoming' | 'rushing' | 'result_pending' | 'ended';
export type GenesisNodeOrderStatusFilter = 'pending' | 'won' | 'lost';

export interface GenesisNodeTier {
  tierId: number;
  amount: number;
  title: string;
  image: string;
  sessionId: number;
  zoneId: number;
  enabled: boolean;
}

export interface GenesisNodePayment {
  ok: boolean;
  payType: string;
  payTypeText: string;
  ratio: string;
  totalAmount: number;
  balanceAmount: number;
  pendingActivationGoldAmount: number;
  availableAmounts?: {
    balanceAvailable: number;
    pendingActivationGold: number;
  };
  needAmounts?: {
    balanceAvailable: number;
    pendingActivationGold: number;
  };
}

export interface GenesisNodeOrder {
  id: number;
  orderNo: string;
  activityId: number;
  tierId: number;
  userId: number;
  activityDate: string;
  amount: number;
  title: string;
  status: number;
  statusText: string;
  frontendStatusText: string;
  freezeAmount: number;
  freezeBalanceAvailable: number;
  freezePendingActivationGold: number;
  refundDisplayStatus: number;
  refundDisplayStatusText: string;
  refundBalanceAvailable: number;
  refundPendingActivationGold: number;
  userCollectionId: number;
  itemId: number;
  resultTime: string;
  refundTime: string;
  createTime: string;
  activityName: string;
  activityTitle: string;
  rushStartTime: string;
  drawTime: string;
  image: string;
  payment?: GenesisNodePayment;
}

export interface GenesisNodeActivity {
  activityId: number;
  name: string;
  title: string;
  startDate: string;
  endDate: string;
  rushStartTime: string;
  drawTime: string;
  displayTotalQuota: number;
  payRatio: string;
  perUserDailyLimit: number;
  titleFixed: string;
  fixedAmounts: number[];
  stage: GenesisNodeStage;
  stageText: string;
  canBuy: boolean;
  countdownTargetTime: string;
  countdownSeconds: number;
  serverTime: string;
  tiers: GenesisNodeTier[];
  todayOrder: GenesisNodeOrder | null;
  userHasOrderToday: boolean;
  userBalance?: {
    balanceAvailable: number;
    pendingActivationGold: number;
  };
}

export interface GenesisNodePreview {
  activityId: number;
  amount: number;
  title: string;
  stage: GenesisNodeStage;
  stageText: string;
  canBuy: boolean;
  tier: GenesisNodeTier;
  payment: GenesisNodePayment;
  message: string;
}

export interface GenesisNodeBuyResult {
  activityId: number;
  orderId: number;
  orderNo: string;
  amount: number;
  title: string;
  status: number;
  statusText: string;
  activityDate: string;
  payment: GenesisNodePayment;
  userBalance?: {
    balanceAvailable: number;
    pendingActivationGold: number;
  };
  message: string;
}

export interface GenesisNodeOrderList {
  list: GenesisNodeOrder[];
  page: number;
  limit: number;
  total: number;
  statusFilter: string;
}

function normalizePayment(raw?: GenesisNodePaymentRaw): GenesisNodePayment | undefined {
  if (!raw) {
    return undefined;
  }

  return {
    ok: readBoolean(raw.ok),
    payType: readString(raw.pay_type, 'combined'),
    payTypeText: readString(raw.pay_type_text, '混合支付'),
    ratio: readString(raw.ratio, '9:1'),
    totalAmount: readNumber(raw.total_amount),
    balanceAmount: readNumber(raw.balance_amount),
    pendingActivationGoldAmount: readNumber(raw.pending_activation_gold_amount),
    availableAmounts: raw.available_amounts
      ? {
          balanceAvailable: readNumber(raw.available_amounts.balance_available),
          pendingActivationGold: readNumber(raw.available_amounts.pending_activation_gold),
        }
      : undefined,
    needAmounts: raw.need_amounts
      ? {
          balanceAvailable: readNumber(raw.need_amounts.balance_available),
          pendingActivationGold: readNumber(raw.need_amounts.pending_activation_gold),
        }
      : undefined,
  };
}

function normalizeTier(raw: GenesisNodeTierRaw): GenesisNodeTier {
  return {
    tierId: readNumber(raw.tier_id),
    amount: readNumber(raw.amount),
    title: readString(raw.title),
    image: raw.image ? resolveUploadUrl(readString(raw.image)) : '',
    sessionId: readNumber(raw.session_id),
    zoneId: readNumber(raw.zone_id),
    enabled: readBoolean(raw.enabled),
  };
}

function normalizeOrder(raw: GenesisNodeOrderRaw): GenesisNodeOrder {
  return {
    id: readNumber(raw.id),
    orderNo: readString(raw.order_no),
    activityId: readNumber(raw.activity_id),
    tierId: readNumber(raw.tier_id),
    userId: readNumber(raw.user_id),
    activityDate: readString(raw.activity_date),
    amount: readNumber(raw.amount),
    title: readString(raw.title),
    status: readNumber(raw.status),
    statusText: readString(raw.status_text, '待开奖'),
    frontendStatusText: readString(raw.frontend_status_text, readString(raw.status_text, '待开奖')),
    freezeAmount: readNumber(raw.freeze_amount),
    freezeBalanceAvailable: readNumber(raw.freeze_balance_available),
    freezePendingActivationGold: readNumber(raw.freeze_pending_activation_gold),
    refundDisplayStatus: readNumber(raw.refund_display_status),
    refundDisplayStatusText: readString(raw.refund_display_status_text),
    refundBalanceAvailable: readNumber(raw.refund_balance_available),
    refundPendingActivationGold: readNumber(raw.refund_pending_activation_gold),
    userCollectionId: readNumber(raw.user_collection_id),
    itemId: readNumber(raw.item_id),
    resultTime: readString(raw.result_time),
    refundTime: readString(raw.refund_time),
    createTime: readString(raw.create_time),
    activityName: readString(raw.activity_name),
    activityTitle: readString(raw.activity_title),
    rushStartTime: readString(raw.rush_start_time),
    drawTime: readString(raw.draw_time),
    image: raw.image ? resolveUploadUrl(readString(raw.image)) : '',
    payment: normalizePayment(raw.payment),
  };
}

function normalizeActivity(raw: GenesisNodeActivityRaw): GenesisNodeActivity {
  return {
    activityId: readNumber(raw.activity_id),
    name: readString(raw.name),
    title: readString(raw.title),
    startDate: readString(raw.start_date),
    endDate: readString(raw.end_date),
    rushStartTime: readString(raw.rush_start_time, '17:00:00'),
    drawTime: readString(raw.draw_time, '20:00:00'),
    displayTotalQuota: readNumber(raw.display_total_quota, 500),
    payRatio: readString(raw.pay_ratio, '9:1'),
    perUserDailyLimit: readNumber(raw.per_user_daily_limit, 1),
    titleFixed: readString(raw.title_fixed, '创世节点算力权益证'),
    fixedAmounts: Array.isArray(raw.fixed_amounts)
      ? raw.fixed_amounts.map((item) => readNumber(item)).filter((item) => item > 0)
      : [],
    stage: readString(raw.stage, 'upcoming') as GenesisNodeStage,
    stageText: readString(raw.stage_text),
    canBuy: readBoolean(raw.can_buy),
    countdownTargetTime: readString(raw.countdown_target_time),
    countdownSeconds: readNumber(raw.countdown_seconds),
    serverTime: readString(raw.server_time),
    tiers: Array.isArray(raw.tiers) ? raw.tiers.map(normalizeTier) : [],
    todayOrder: raw.today_order ? normalizeOrder(raw.today_order) : null,
    userHasOrderToday: readBoolean(raw.user_has_order_today),
    userBalance: raw.user_balance
      ? {
          balanceAvailable: readNumber(raw.user_balance.balance_available),
          pendingActivationGold: readNumber(raw.user_balance.pending_activation_gold),
        }
      : undefined,
  };
}

export const genesisNodeApi = {
  getActivity(
    options: { activityId?: number; signal?: AbortSignal } = {},
  ) {
    const { activityId, signal } = options;

    return http
      .get<GenesisNodeActivityRaw>('/api/genesisNode/activity', {
        query: activityId ? { activity_id: activityId } : undefined,
        signal,
      })
      .then(normalizeActivity);
  },

  preview(
    payload: { activityId?: number; amount: number },
    signal?: AbortSignal,
  ) {
    return http
      .post<{
        activity_id?: number | string;
        amount?: number | string;
        title?: string;
        stage?: string;
        stage_text?: string;
        can_buy?: boolean | number | string;
        tier?: GenesisNodeTierRaw;
        payment?: GenesisNodePaymentRaw;
        message?: string;
      }>('/api/genesisNode/preview', {
        activity_id: payload.activityId,
        amount: payload.amount,
      }, {
        signal,
      })
      .then((raw) => ({
        activityId: readNumber(raw.activity_id),
        amount: readNumber(raw.amount),
        title: readString(raw.title),
        stage: readString(raw.stage, 'upcoming') as GenesisNodeStage,
        stageText: readString(raw.stage_text),
        canBuy: readBoolean(raw.can_buy),
        tier: normalizeTier(raw.tier ?? {}),
        payment: normalizePayment(raw.payment) ?? {
          ok: false,
          payType: 'combined',
          payTypeText: '混合支付',
          ratio: '9:1',
          totalAmount: 0,
          balanceAmount: 0,
          pendingActivationGoldAmount: 0,
        },
        message: readString(raw.message),
      }));
  },

  buy(
    payload: { activityId?: number; amount: number },
    signal?: AbortSignal,
  ) {
    return http
      .post<{
        activity_id?: number | string;
        order_id?: number | string;
        order_no?: string;
        amount?: number | string;
        title?: string;
        status?: number | string;
        status_text?: string;
        activity_date?: string;
        payment?: GenesisNodePaymentRaw;
        user_balance?: {
          balance_available?: number | string;
          pending_activation_gold?: number | string;
        };
        message?: string;
      }>('/api/genesisNode/buy', {
        activity_id: payload.activityId,
        amount: payload.amount,
      }, {
        signal,
      })
      .then((raw) => ({
        activityId: readNumber(raw.activity_id),
        orderId: readNumber(raw.order_id),
        orderNo: readString(raw.order_no),
        amount: readNumber(raw.amount),
        title: readString(raw.title),
        status: readNumber(raw.status),
        statusText: readString(raw.status_text, '待开奖'),
        activityDate: readString(raw.activity_date),
        payment: normalizePayment(raw.payment) ?? {
          ok: true,
          payType: 'combined',
          payTypeText: '混合支付',
          ratio: '9:1',
          totalAmount: readNumber(raw.amount),
          balanceAmount: 0,
          pendingActivationGoldAmount: 0,
        },
        userBalance: raw.user_balance
          ? {
              balanceAvailable: readNumber(raw.user_balance.balance_available),
              pendingActivationGold: readNumber(raw.user_balance.pending_activation_gold),
            }
          : undefined,
        message: readString(raw.message),
      }));
  },

  getOrders(
    params: { page?: number; limit?: number; status?: GenesisNodeOrderStatusFilter | string } = {},
    signal?: AbortSignal,
  ) {
    const { page = 1, limit = 10, status } = params;

    return http
      .get<GenesisNodeListRaw>('/api/genesisNode/orders', {
        query: {
          page,
          limit,
          status,
        },
        signal,
      })
      .then((raw) => ({
        list: Array.isArray(raw.list) ? raw.list.map(normalizeOrder) : [],
        page: readNumber(raw.page, page),
        limit: readNumber(raw.limit, limit),
        total: readNumber(raw.total),
        statusFilter: readString(raw.status_filter),
      }));
  },

  getOrderDetail(id: number | string, signal?: AbortSignal) {
    return http
      .get<GenesisNodeOrderRaw>('/api/genesisNode/orderDetail', {
        query: { id },
        signal,
      })
      .then(normalizeOrder);
  },
};
