import type { ApiResponse } from '../../networking'
import { API_ENDPOINTS } from '../../config'
import { authedFetch, getStoredToken } from '../../client'
import { bizLog, debugLog } from '@/utils/logger'

/**
 * 闂佺儵鏅炵亸娆徝洪崨顕嗙矗闁告洦鍘奸濠囨偣娴ｈ绶茬紓宥呯Ч閹晠鎳滅喊妯轰壕? * -1: 闂佺绻堥崝鎴﹀磿? 0: 閻庡灚婢橀幊蹇涘箰閹惰棄瑙? 1: 閻庤鐡曞鎾绘嚈閹寸姷椹? 2: 闂佸搫鐗滄禍娆撴嚈閹寸姷椹?閻庣懓鎲￠悡锟犲焵椤戣棄浜惧┑? */
export type ReservationStatus = -1 | 0 | 1 | 2
export type ReservationRecordStatus = Exclude<ReservationStatus, -1>
export type ReservationPaymentType =
  | 'balance_available'
  | 'pending_activation_gold'
  | 'mixed'
  | 'money'
  | 'combined'
export type ReservationOrderStatus = number | string
export type ReservationPaymentAmount = number | string
export type ReservationPreviewPayload = Record<string, unknown>

export interface ReservationRelatedOrder {
  id: number
  order_no?: string
  status?: ReservationOrderStatus
  status_text?: string
  pay_type?: ReservationPaymentType
  pay_type_text?: string
  total_amount?: ReservationPaymentAmount
  total_score?: ReservationPaymentAmount
}

export interface ReservationPaymentSummary {
  source: 'preview' | 'fallback'
  freezeAmount: number
  specialFundFreezeAmount: number
  pendingActivationGoldFreezeAmount: number
  specialFundBalance: number
  pendingActivationGoldBalance: number
  specialFundRatio: number
  pendingActivationGoldRatio: number
  specialFundRatioText: string
  pendingActivationGoldRatioText: string
  ratioText: string
  payType: ReservationPaymentType
  payTypeText: string
  canPay: boolean
  isMixedPayment: boolean
}

export interface ReservationPaymentSummaryFallbacks {
  freezeAmount?: number
  specialFundBalance?: number
  pendingActivationGoldBalance?: number
}

export interface MixedPaymentExpectedAmounts {
  total_amount?: ReservationPaymentAmount
  balance_amount?: ReservationPaymentAmount
  pending_activation_gold_amount?: ReservationPaymentAmount
  can_cover?: boolean
  need_balance_amount?: ReservationPaymentAmount
  have_balance_amount?: ReservationPaymentAmount
  need_pending_activation_gold_amount?: ReservationPaymentAmount
  have_pending_activation_gold_amount?: ReservationPaymentAmount
}

export interface MixedPaymentAvailableAmounts {
  balance_available?: ReservationPaymentAmount
  pending_activation_gold?: ReservationPaymentAmount
}

export interface MixedPaymentActualAmounts {
  total_amount?: ReservationPaymentAmount
  balance_amount?: ReservationPaymentAmount
  pending_activation_gold_amount?: ReservationPaymentAmount
}

export interface MixedPaymentInfo {
  enabled?: boolean
  eligible?: boolean
  available?: boolean
  applied?: boolean
  reason?: string
  reason_text?: string
  notice?: string
  source?: string
  ratio?: string
  daily_limit_once?: boolean
  daily_used?: boolean
  remaining_times?: number
  remaining_times_text?: string
  available_amounts?: MixedPaymentAvailableAmounts
  expected_amounts?: MixedPaymentExpectedAmounts
  actual_amounts?: MixedPaymentActualAmounts
  actual_pay_type?: ReservationPaymentType
  actual_pay_type_text?: string
}

/**
 * 闂佺儵鏅炵亸娆徝洪崨顕嗙矗闁告洦鍘奸濠囨偣娴ｈ绶茬紓宥呯У閵囧嫮鎲撮崟顐㈩槻闂? */
export interface ReservationItem {
  id: number
  session_id: number
  session_title?: string
  session_start_time?: string
  session_end_time?: string

  zone_id: number
  zone_name?: string
  zone_min_price?: number
  zone_max_price?: number

  product_id?: number
  item_title?: string
  item_image?: string
  item_price?: number

  actual_buy_price?: number
  refund_diff?: number

  freeze_amount: number
  power_used: number
  base_hashrate_cost?: number
  extra_hashrate_cost?: number
  weight: number

  status: ReservationRecordStatus
  status_text: string
  pay_type?: ReservationPaymentType
  pay_type_text?: string

  match_order_id?: number
  match_time?: number
  create_time?: number
  update_time?: number
  create_time_str?: string
  order?: ReservationRelatedOrder | null
  [key: string]: unknown
}

/**
 * 闂佸搫琚崕鎾敋濡ゅ懏鍎庨柤纰卞墯绾绢亜螞閺夊灝顏悗鐟扮－閹峰寮剁捄銊梺姹囧妼鐎氼剙顕ｉ鍕瀬闁绘鐗嗘径宥夋煕? */
export interface FetchReservationsParams {
  status?: ReservationStatus
  page?: number
  limit?: number
  session_id?: number | string
  zone_id?: number | string
  start_time?: number
  end_time?: number
  sort?: 'create_time' | 'weight' | 'freeze_amount'
  order?: 'asc' | 'desc'
  token?: string
}

/**
 * 闂佺儵鏅炵亸娆徝洪崨顕嗙矗闁告洦鍘奸濠囨偣娴ｈ绶茬紓宥呯Ч瀹曟艾螖閸曗斁鍋撻崘鈺備氦闁哄倹瀵х粈鈧梺杞拌兌婢ф鐣垫笟鈧獮鎺楀Ψ閵夈儳绋? */
export interface ReservationsListData {
  list: ReservationItem[]
  total: number
  page: number
  limit: number
}

/**
 * 闂佸搫琚崕鎾敋濡ゅ懏鍎庨柤纰卞墯绾绢亜螞閺夊灝顏悗鐟扮－閹峰寮剁捄銊梺鍛婂笚椤ㄥ濡? */
export async function fetchReservations(
  params: FetchReservationsParams = {},
): Promise<ApiResponse<ReservationsListData>> {
  const token = params.token ?? getStoredToken()
  const search = new URLSearchParams()

  if (params.status !== undefined && params.status !== -1) {
    search.set('status', String(params.status))
  }
  if (params.page) search.set('page', String(params.page))
  if (params.limit) search.set('limit', String(params.limit))
  if (params.session_id != null) search.set('session_id', String(params.session_id))
  if (params.zone_id != null) search.set('zone_id', String(params.zone_id))
  if (params.start_time != null) search.set('start_time', String(params.start_time))
  if (params.end_time != null) search.set('end_time', String(params.end_time))
  if (params.sort) search.set('sort', params.sort)
  if (params.order) search.set('order', params.order)

  const path = `${API_ENDPOINTS.collectionReservation.reservations}?${search.toString()}`
  return authedFetch<ReservationsListData>(path, {
    method: 'GET',
    token,
  })
}

/**
 * 婵☆偅婢樼€氼喚鈧懓纾幏瀣级鐠恒劎协闁荤姴娴勯梽鍕磿韫囨稑鏋侀柣妤€鐗嗙粊锕傛煙閹帒鍔氱憸? */
export interface ReservationDetailData extends ReservationItem {}

/**
 * 闂佸吋鍎抽崲鑼躲亹閸ヮ煉绱ｉ柛鏇ㄥ幖椤斿﹪鎮规担瑙勭凡缂傚秴绉堕幏鐘绘晜閽樺澹? */
export async function fetchReservationDetail(
  id: number | string,
  token?: string,
): Promise<ApiResponse<ReservationDetailData>> {
  const authToken = token ?? getStoredToken()
  const search = new URLSearchParams()
  search.set('id', String(id))

  const path = `${API_ENDPOINTS.collectionReservation.reservationDetail}?${search.toString()}`
  return authedFetch<ReservationDetailData>(path, {
    method: 'GET',
    token: authToken,
  })
}

/**
 * 闂佺儵鏅炵亸娆徝洪崨顕嗙矗闁告洦鍘奸濠囨煕濞嗗繐鈧綊寮抽悢鐓庣闁靛鍎辩紞? */
export interface BidBuyParams {
  session_id: number | string
  zone_id: number | string
  package_id: number | string
  extra_hashrate?: number
  quantity?: number
  token?: string
}

export interface ReservationPreviewParams extends BidBuyParams {}

/**
 * 闂佺儵鏅炵亸娆徝洪崨顕嗙矗闁告洦鍘奸濠囧级閳哄倹鐓ユ繛鍙夌墵瀵偊鎮ч崼婵堛偊闂佽浜介崕杈亹? */
export interface BidBuyResult {
  reservation_id?: number
  freeze_amount?: number
  power_used?: number
  weight?: number
  zone_name?: string
  package_id?: number
  package_name?: string
  pay_type?: ReservationPaymentType
  pay_type_text?: string
  message?: string
  mixed_payment_notice?: string
  mixed_payment_enabled?: boolean
  mixed_payment_available?: boolean
  mixed_payment_reason?: string
  mixed_payment_reason_text?: string
  mixed_payment_remaining_times?: number
  mixed_payment_display_ratio?: string
  mixed_payment_expected_balance_amount?: ReservationPaymentAmount
  mixed_payment_expected_pending_activation_gold_amount?: ReservationPaymentAmount
  mixed_payment_info?: MixedPaymentInfo
  [key: string]: unknown
}

export interface ReservationPreviewResult extends BidBuyResult {
  can_pay?: boolean
  can_submit?: boolean
  available?: boolean
  balance_available?: ReservationPaymentAmount
  score?: ReservationPaymentAmount
  pending_activation_gold?: ReservationPaymentAmount
  confirm_rights_gold?: ReservationPaymentAmount
  ratio_text?: string
  payment_summary?: ReservationPreviewPayload
  freeze_summary?: ReservationPreviewPayload
  freeze_split?: ReservationPreviewPayload
  freeze_breakdown?: ReservationPreviewPayload
  breakdown?: ReservationPreviewPayload
}

const PREVIEW_ENDPOINT_CANDIDATES = Array.from(
  new Set([
    API_ENDPOINTS.collectionReservation.previewBidBuy,
    API_ENDPOINTS.collectionReservation.bidBuyPreview,
    API_ENDPOINTS.collectionReservation.preview,
    '/collectionReservation/bidPreview',
  ]),
)

let resolvedPreviewEndpoint: string | null = null

const SPECIAL_FUND_LABEL = '\u4E13\u9879\u91D1'
const PENDING_ACTIVATION_GOLD_LABEL = '\u5F85\u6FC0\u6D3B\u786E\u6743\u91D1'
const MIXED_PAYMENT_LABEL = '\u6DF7\u5408\u652F\u4ED8'
const NO_DATA_LABEL = '\u6682\u65E0'

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
}

const BALANCE_AVAILABLE_HINTS = [
  'balance_available',
  'balanceavailable',
  'balance',
  'special_fund',
  'specialfund',
  'money',
  'cash',
  '\u4E13\u9879\u91D1',
]

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
]

const MONEY_HINTS = ['money', 'balance', 'cash', '\u4F59\u989D', '\u73B0\u91D1']

const toNumber = (value: unknown): number | undefined => {
  if (value === '' || value === null || value === undefined) return undefined
  const num = Number(value)
  return Number.isFinite(num) ? num : undefined
}

const toRatio = (value: unknown): number | undefined => {
  const num = toNumber(value)
  if (num === undefined) return undefined
  if (num > 1 && num <= 100) {
    return num / 100
  }
  return Math.max(0, Math.min(1, num))
}

const toBoolean = (value: unknown): boolean | undefined => {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value > 0
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (['1', 'true', 'yes', 'ok', 'available'].includes(normalized)) return true
    if (['0', 'false', 'no', 'none', 'unavailable'].includes(normalized)) return false
  }
  return undefined
}

const pickNumber = (...values: unknown[]): number | undefined => {
  for (const value of values) {
    const num = toNumber(value)
    if (num !== undefined) return num
  }
  return undefined
}

const pickRatio = (...values: unknown[]): number | undefined => {
  for (const value of values) {
    const ratio = toRatio(value)
    if (ratio !== undefined) return ratio
  }
  return undefined
}

const pickBoolean = (...values: unknown[]): boolean | undefined => {
  for (const value of values) {
    const result = toBoolean(value)
    if (result !== undefined) return result
  }
  return undefined
}

const pickString = (...values: unknown[]): string | undefined => {
  for (const value of values) {
    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (trimmed) return trimmed
    }
  }
  return undefined
}

const getObject = (value: unknown): ReservationPreviewPayload | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as ReservationPreviewPayload
}

const clampMoney = (value: number): number => Math.max(0, Number(value.toFixed(2)))

const formatPercentText = (ratio: number): string => String(Math.round(ratio * 100)) + '%'

const normalizeToken = (value: string) => value.trim().toLowerCase().replace(/[\s+-]+/g, '_')

const includesHint = (source: string, hints: string[]) =>
  hints.some((hint) => source.includes(hint.toLowerCase()))

const normalizeReservationPayType = (value?: string | null): ReservationPaymentType | undefined => {
  if (!value) return undefined

  const rawValue = value.trim()
  if (!rawValue) return undefined

  const normalizedValue = normalizeToken(rawValue)
  const aliasedValue = PAYMENT_TYPE_ALIASES[rawValue] ?? PAYMENT_TYPE_ALIASES[normalizedValue]
  if (aliasedValue) {
    return aliasedValue
  }

  const lowercaseValue = rawValue.toLowerCase()
  const hasBalanceAvailable =
    includesHint(lowercaseValue, BALANCE_AVAILABLE_HINTS) ||
    includesHint(normalizedValue, BALANCE_AVAILABLE_HINTS)
  const hasPendingActivationGold =
    includesHint(lowercaseValue, PENDING_ACTIVATION_GOLD_HINTS) ||
    includesHint(normalizedValue, PENDING_ACTIVATION_GOLD_HINTS)
  const hasMoney =
    includesHint(lowercaseValue, MONEY_HINTS) || includesHint(normalizedValue, MONEY_HINTS)

  if ((hasBalanceAvailable && hasPendingActivationGold) || (hasPendingActivationGold && hasMoney)) {
    return 'mixed'
  }

  if (hasPendingActivationGold) {
    return 'pending_activation_gold'
  }

  if (hasBalanceAvailable || hasMoney) {
    return 'balance_available'
  }

  return undefined
}

const getReservationPayTypeText = (payType: ReservationPaymentType): string => {
  switch (payType) {
    case 'pending_activation_gold':
      return PENDING_ACTIVATION_GOLD_LABEL
    case 'mixed':
    case 'combined':
      return MIXED_PAYMENT_LABEL
    case 'money':
    case 'balance_available':
    default:
      return SPECIAL_FUND_LABEL
  }
}

const derivePayType = (
  specialFundFreezeAmount: number,
  pendingActivationGoldFreezeAmount: number,
): ReservationPaymentType => {
  if (specialFundFreezeAmount > 0 && pendingActivationGoldFreezeAmount > 0) return 'mixed'
  if (pendingActivationGoldFreezeAmount > 0) return 'pending_activation_gold'
  return 'balance_available'
}

const buildRatioText = (specialFundRatio: number, pendingActivationGoldRatio: number): string => {
  if (specialFundRatio <= 0 && pendingActivationGoldRatio <= 0) return NO_DATA_LABEL
  if (pendingActivationGoldRatio <= 0) {
    return SPECIAL_FUND_LABEL + ' ' + formatPercentText(specialFundRatio || 1)
  }
  if (specialFundRatio <= 0) {
    return PENDING_ACTIVATION_GOLD_LABEL + ' ' + formatPercentText(pendingActivationGoldRatio || 1)
  }
  return (
    SPECIAL_FUND_LABEL +
    ' ' +
    formatPercentText(specialFundRatio) +
    ' / ' +
    PENDING_ACTIVATION_GOLD_LABEL +
    ' ' +
    formatPercentText(pendingActivationGoldRatio)
  )
}

export function buildEstimatedReservationPaymentSummary(
  fallbacks: ReservationPaymentSummaryFallbacks = {},
): ReservationPaymentSummary {
  const freezeAmount = clampMoney(fallbacks.freezeAmount ?? 0)
  const specialFundBalance = clampMoney(fallbacks.specialFundBalance ?? 0)
  const pendingActivationGoldBalance = clampMoney(fallbacks.pendingActivationGoldBalance ?? 0)

  const specialFundFreezeAmount = clampMoney(Math.min(specialFundBalance, freezeAmount))
  const pendingActivationGoldFreezeAmount = clampMoney(
    Math.max(0, freezeAmount - specialFundFreezeAmount),
  )
  const canPay = specialFundBalance + pendingActivationGoldBalance >= freezeAmount
  const specialFundRatio = freezeAmount > 0 ? specialFundFreezeAmount / freezeAmount : 0
  const pendingActivationGoldRatio =
    freezeAmount > 0 ? pendingActivationGoldFreezeAmount / freezeAmount : 0

  const payType = derivePayType(specialFundFreezeAmount, pendingActivationGoldFreezeAmount)

  return {
    source: 'fallback',
    freezeAmount,
    specialFundFreezeAmount,
    pendingActivationGoldFreezeAmount,
    specialFundBalance,
    pendingActivationGoldBalance,
    specialFundRatio,
    pendingActivationGoldRatio,
    specialFundRatioText: formatPercentText(specialFundRatio || 0),
    pendingActivationGoldRatioText: formatPercentText(pendingActivationGoldRatio || 0),
    ratioText: buildRatioText(specialFundRatio, pendingActivationGoldRatio),
    payType,
    payTypeText: getReservationPayTypeText(payType),
    canPay,
    isMixedPayment: specialFundFreezeAmount > 0 && pendingActivationGoldFreezeAmount > 0,
  }
}

export function normalizeReservationPaymentSummary(
  raw: ReservationPreviewPayload | null | undefined,
  fallbacks: ReservationPaymentSummaryFallbacks = {},
): ReservationPaymentSummary {
  const estimated = buildEstimatedReservationPaymentSummary(fallbacks)
  const sourceRoot = getObject(raw)
  if (!sourceRoot) return estimated

  const mixedPaymentInfoNode = getObject(sourceRoot.mixed_payment_info)
  const mixedActualAmounts = getObject(mixedPaymentInfoNode?.actual_amounts)
  const mixedExpectedAmounts = getObject(mixedPaymentInfoNode?.expected_amounts)

  const summaryRoot =
    getObject(sourceRoot.payment_summary) ??
    getObject(sourceRoot.freeze_summary) ??
    getObject(sourceRoot.payment_structure) ??
    getObject(sourceRoot.payment) ??
    getObject(sourceRoot.freeze_split) ??
    getObject(sourceRoot.freeze_breakdown) ??
    getObject(sourceRoot.breakdown) ??
    sourceRoot

  const specialFundNode =
    getObject(summaryRoot.balance_available) ??
    getObject(summaryRoot.special_fund) ??
    getObject(summaryRoot.specialFund) ??
    getObject(summaryRoot.balance) ??
    getObject(summaryRoot.specialFundInfo) ??
    getObject(sourceRoot.balance_available_detail) ??
    getObject(sourceRoot.special_fund_detail)

  const pendingActivationGoldNode =
    getObject(summaryRoot.pending_activation_gold) ??
    getObject(summaryRoot.confirm_rights_gold) ??
    getObject(summaryRoot.pendingActivationGold) ??
    getObject(summaryRoot.confirmRightsGold) ??
    getObject(summaryRoot.score) ??
    getObject(summaryRoot.consume_gold) ??
    getObject(summaryRoot.consumeGold) ??
    getObject(summaryRoot.green_power) ??
    getObject(summaryRoot.greenPower) ??
    getObject(summaryRoot.pendingActivationGoldInfo) ??
    getObject(sourceRoot.pending_activation_gold_detail) ??
    getObject(sourceRoot.confirm_rights_gold_detail) ??
    getObject(sourceRoot.pendingActivationGoldDetail) ??
    getObject(sourceRoot.confirmRightsGoldDetail) ??
    getObject(sourceRoot.score_detail) ??
    getObject(sourceRoot.consume_gold_detail) ??
    getObject(sourceRoot.green_power_detail)

  let freezeAmount = clampMoney(
    pickNumber(
      sourceRoot.freeze_amount,
      sourceRoot.total_freeze_amount,
      sourceRoot.total_amount,
      summaryRoot.freeze_amount,
      summaryRoot.total_freeze_amount,
      estimated.freezeAmount,
    ) ?? estimated.freezeAmount,
  )

  let specialFundFreezeAmount = pickNumber(
    mixedActualAmounts?.balance_amount,
    mixedExpectedAmounts?.balance_amount,
    specialFundNode?.freeze_amount,
    specialFundNode?.amount,
    specialFundNode?.pay_amount,
    specialFundNode?.deduct_amount,
    specialFundNode?.used_amount,
    summaryRoot.balance_available_amount,
    summaryRoot.special_fund_amount,
    summaryRoot.balance_amount,
    sourceRoot.balance_available_amount,
    sourceRoot.special_fund_amount,
    sourceRoot.balance_amount,
    sourceRoot.balance_available_freeze_amount,
    sourceRoot.freeze_balance_available_amount,
    sourceRoot.freeze_balance_available,
  )

  let pendingActivationGoldFreezeAmount = pickNumber(
    mixedActualAmounts?.pending_activation_gold_amount,
    mixedExpectedAmounts?.pending_activation_gold_amount,
    pendingActivationGoldNode?.freeze_amount,
    pendingActivationGoldNode?.amount,
    pendingActivationGoldNode?.pay_amount,
    pendingActivationGoldNode?.deduct_amount,
    pendingActivationGoldNode?.used_amount,
    summaryRoot.pending_activation_gold_amount,
    summaryRoot.confirm_rights_gold_amount,
    summaryRoot.pendingActivationGoldAmount,
    summaryRoot.confirmRightsGoldAmount,
    summaryRoot.score_amount,
    summaryRoot.consume_gold_amount,
    summaryRoot.green_power_amount,
    sourceRoot.pending_activation_gold_amount,
    sourceRoot.confirm_rights_gold_amount,
    sourceRoot.pendingActivationGoldAmount,
    sourceRoot.confirmRightsGoldAmount,
    sourceRoot.score_amount,
    sourceRoot.consume_gold_amount,
    sourceRoot.green_power_amount,
    sourceRoot.pending_activation_gold_freeze_amount,
    sourceRoot.confirm_rights_gold_freeze_amount,
    sourceRoot.score_freeze_amount,
    sourceRoot.green_power_freeze_amount,
    sourceRoot.freeze_pending_activation_gold,
  )

  const specialFundBalance = clampMoney(
    pickNumber(
      specialFundNode?.available_balance,
      specialFundNode?.balance,
      specialFundNode?.current_balance,
      specialFundNode?.remain_balance,
      specialFundNode?.fund_balance,
      summaryRoot.balance_available_balance,
      summaryRoot.special_fund_balance,
      sourceRoot.balance_available_balance,
      sourceRoot.special_fund_balance,
      sourceRoot.balance_available,
      estimated.specialFundBalance,
    ) ?? estimated.specialFundBalance,
  )

  const pendingActivationGoldBalance = clampMoney(
    pickNumber(
      pendingActivationGoldNode?.available_balance,
      pendingActivationGoldNode?.balance,
      pendingActivationGoldNode?.current_balance,
      pendingActivationGoldNode?.remain_balance,
      pendingActivationGoldNode?.fund_balance,
      summaryRoot.pending_activation_gold_balance,
      summaryRoot.confirm_rights_gold_balance,
      summaryRoot.pendingActivationGoldBalance,
      summaryRoot.confirmRightsGoldBalance,
      summaryRoot.score_balance,
      summaryRoot.consume_gold_balance,
      sourceRoot.pending_activation_gold_balance,
      sourceRoot.confirm_rights_gold_balance,
      sourceRoot.pendingActivationGoldBalance,
      sourceRoot.confirmRightsGoldBalance,
      sourceRoot.score_balance,
      sourceRoot.consume_gold_balance,
      sourceRoot.pending_activation_gold,
      sourceRoot.confirm_rights_gold,
      sourceRoot.score,
      estimated.pendingActivationGoldBalance,
    ) ?? estimated.pendingActivationGoldBalance,
  )

  if (specialFundFreezeAmount === undefined && pendingActivationGoldFreezeAmount === undefined) {
    specialFundFreezeAmount = estimated.specialFundFreezeAmount
    pendingActivationGoldFreezeAmount = estimated.pendingActivationGoldFreezeAmount
  } else if (specialFundFreezeAmount === undefined) {
    specialFundFreezeAmount = Math.max(0, freezeAmount - (pendingActivationGoldFreezeAmount ?? 0))
  } else if (pendingActivationGoldFreezeAmount === undefined) {
    pendingActivationGoldFreezeAmount = Math.max(0, freezeAmount - specialFundFreezeAmount)
  }

  specialFundFreezeAmount = clampMoney(specialFundFreezeAmount ?? 0)
  pendingActivationGoldFreezeAmount = clampMoney(pendingActivationGoldFreezeAmount ?? 0)

  if (freezeAmount <= 0) {
    freezeAmount = clampMoney(specialFundFreezeAmount + pendingActivationGoldFreezeAmount)
  }

  const payType =
    normalizeReservationPayType(
      pickString(
        sourceRoot.pay_type,
        sourceRoot.payment_type,
        summaryRoot.pay_type,
        summaryRoot.payment_type,
        sourceRoot.pay_type_text,
        sourceRoot.payment_type_text,
        summaryRoot.pay_type_text,
      ),
    ) ?? derivePayType(specialFundFreezeAmount, pendingActivationGoldFreezeAmount)

  let specialFundRatio = pickRatio(
    specialFundNode?.ratio,
    specialFundNode?.pay_ratio,
    specialFundNode?.freeze_ratio,
    specialFundNode?.percent,
    summaryRoot.balance_available_ratio,
    summaryRoot.special_fund_ratio,
    sourceRoot.balance_available_ratio,
    sourceRoot.special_fund_ratio,
  )

  let pendingActivationGoldRatio = pickRatio(
    pendingActivationGoldNode?.ratio,
    pendingActivationGoldNode?.pay_ratio,
    pendingActivationGoldNode?.freeze_ratio,
    pendingActivationGoldNode?.percent,
    summaryRoot.pending_activation_gold_ratio,
    summaryRoot.confirm_rights_gold_ratio,
    summaryRoot.pendingActivationGoldRatio,
    summaryRoot.confirmRightsGoldRatio,
    summaryRoot.score_ratio,
    summaryRoot.consume_gold_ratio,
    summaryRoot.green_power_ratio,
    sourceRoot.pending_activation_gold_ratio,
    sourceRoot.confirm_rights_gold_ratio,
    sourceRoot.pendingActivationGoldRatio,
    sourceRoot.confirmRightsGoldRatio,
    sourceRoot.score_ratio,
    sourceRoot.consume_gold_ratio,
    sourceRoot.green_power_ratio,
  )

  if (specialFundRatio === undefined && freezeAmount > 0) {
    specialFundRatio = specialFundFreezeAmount / freezeAmount
  }
  if (pendingActivationGoldRatio === undefined && freezeAmount > 0) {
    pendingActivationGoldRatio = pendingActivationGoldFreezeAmount / freezeAmount
  }

  specialFundRatio = Math.max(0, Math.min(1, specialFundRatio ?? 0))
  pendingActivationGoldRatio = Math.max(0, Math.min(1, pendingActivationGoldRatio ?? 0))

  const canPay =
    pickBoolean(
      sourceRoot.can_pay,
      sourceRoot.can_submit,
      sourceRoot.available,
      summaryRoot.can_pay,
      summaryRoot.can_submit,
      summaryRoot.available,
    ) ??
    (specialFundBalance >= specialFundFreezeAmount &&
      pendingActivationGoldBalance >= pendingActivationGoldFreezeAmount)

  const displayRatio = pickString(
    sourceRoot.mixed_payment_display_ratio as string | undefined,
    sourceRoot.mixed_payment_ratio as string | undefined,
    mixedPaymentInfoNode?.ratio as string | undefined,
  )
  const computedRatioText = buildRatioText(specialFundRatio, pendingActivationGoldRatio)
  const finalRatioText =
    displayRatio && specialFundFreezeAmount > 0 && pendingActivationGoldFreezeAmount > 0
      ? displayRatio
      : computedRatioText

  return {
    source: 'preview',
    freezeAmount,
    specialFundFreezeAmount,
    pendingActivationGoldFreezeAmount,
    specialFundBalance,
    pendingActivationGoldBalance,
    specialFundRatio,
    pendingActivationGoldRatio,
    specialFundRatioText: formatPercentText(specialFundRatio),
    pendingActivationGoldRatioText: formatPercentText(pendingActivationGoldRatio),
    ratioText: finalRatioText,
    payType,
    payTypeText: getReservationPayTypeText(payType),
    canPay,
    isMixedPayment: specialFundFreezeAmount > 0 && pendingActivationGoldFreezeAmount > 0,
  }
}
const validateReservationParams = (params: BidBuyParams) => {
  const token = params.token ?? getStoredToken()

  if (params.session_id === undefined || params.session_id === null || params.session_id === '') {
    throw new Error('session_id is required')
  }
  if (params.zone_id === undefined || params.zone_id === null || params.zone_id === '') {
    throw new Error('zone_id is required')
  }
  if (params.package_id === undefined || params.package_id === null || params.package_id === '') {
    throw new Error('package_id is required')
  }

  const extraHashrate = params.extra_hashrate ?? 0
  if (extraHashrate < 0) {
    throw new Error('extra_hashrate cannot be less than 0')
  }

  const quantity = Math.min(Math.max(params.quantity ?? 1, 1), 100)

  return {
    token,
    extraHashrate,
    quantity,
  }
}

const buildReservationFormData = (params: BidBuyParams): { token: string; formData: FormData } => {
  const { token, extraHashrate, quantity } = validateReservationParams(params)
  const formData = new FormData()
  formData.append('session_id', String(params.session_id))
  formData.append('zone_id', String(params.zone_id))
  formData.append('package_id', String(params.package_id))
  formData.append('extra_hashrate', String(extraHashrate))
  formData.append('quantity', String(quantity))

  return {
    token,
    formData,
  }
}

const buildReservationSearch = (params: BidBuyParams): { token: string; search: URLSearchParams } => {
  const { token, extraHashrate, quantity } = validateReservationParams(params)
  const search = new URLSearchParams()
  search.set('session_id', String(params.session_id))
  search.set('zone_id', String(params.zone_id))
  search.set('package_id', String(params.package_id))
  search.set('extra_hashrate', String(extraHashrate))
  search.set('quantity', String(quantity))

  return {
    token,
    search,
  }
}

const isEndpointMissingError = (error: unknown): boolean => {
  const message = String(error instanceof Error ? error.message : error ?? '').toLowerCase()
  return (
    message.includes('404') ||
    message.includes('410') ||
    message.includes('not found') ||
    message.includes('gone')
  )
}

const isMethodNotAllowedError = (error: unknown): boolean => {
  const message = String(error instanceof Error ? error.message : error ?? '').toLowerCase()
  return message.includes('405') || message.includes('method not allowed')
}

const requestReservationPreview = async (
  endpoint: string,
  params: ReservationPreviewParams,
  method: 'POST' | 'GET',
): Promise<ApiResponse<ReservationPreviewResult>> => {
  if (method === 'POST') {
    const { token, formData } = buildReservationFormData(params)
    return authedFetch<ReservationPreviewResult>(endpoint, {
      method,
      token,
      body: formData,
    })
  }

  const { token, search } = buildReservationSearch(params)
  return authedFetch<ReservationPreviewResult>(`${endpoint}?${search.toString()}`, {
    method,
    token,
  })
}

export async function fetchReservationPreview(
  params: ReservationPreviewParams,
): Promise<ApiResponse<ReservationPreviewResult>> {
  debugLog('collection.reservationPreview', 'Start preview request', params)

  const endpoints = resolvedPreviewEndpoint
    ? [resolvedPreviewEndpoint, ...PREVIEW_ENDPOINT_CANDIDATES.filter((endpoint) => endpoint !== resolvedPreviewEndpoint)]
    : PREVIEW_ENDPOINT_CANDIDATES

  let lastError: unknown = null

  for (const endpoint of endpoints) {
    try {
      const response = await requestReservationPreview(endpoint, params, 'POST')
      resolvedPreviewEndpoint = endpoint
      debugLog('collection.reservationPreview', 'Preview response', response)
      return response
    } catch (error: unknown) {
      lastError = error

      if (isMethodNotAllowedError(error)) {
        try {
          const response = await requestReservationPreview(endpoint, params, 'GET')
          resolvedPreviewEndpoint = endpoint
          debugLog('collection.reservationPreview', 'Preview response', response)
          return response
        } catch (getError: unknown) {
          lastError = getError
          if (isEndpointMissingError(getError)) {
            continue
          }
          throw getError
        }
      }

      if (isEndpointMissingError(error)) {
        continue
      }

      throw error
    }
  }

  throw lastError ?? new Error('Reservation preview endpoint unavailable')
}

/**
 * 闂佺儵鏅炵亸娆徝洪崨顕嗙矗闁告洦鍘奸濠囨煥濞戞澧曢柛鐘虫礈缁辨帡骞橀懠顒傛噰婵＄偑鍊楅、濠勭矈椤愶附鐓傞柟瀛樼矌閻熴垻绱掗悩鎰佹當濠殿喖绻橀弫? */
export async function bidBuy(params: BidBuyParams): Promise<ApiResponse<BidBuyResult>> {
  debugLog('collection.bidBuy', 'Start bidBuy request', params)
  const { token, formData } = buildReservationFormData(params)

  const response = await authedFetch<BidBuyResult>(API_ENDPOINTS.collectionReservation.bidBuy, {
    method: 'POST',
    token,
    body: formData,
  })

  bizLog('collection.bidBuy', {
    sessionId: params.session_id,
    zoneId: params.zone_id,
    packageId: params.package_id,
    code: response.code,
  })
  debugLog('collection.bidBuy', 'BidBuy response', response)
  return response
}
