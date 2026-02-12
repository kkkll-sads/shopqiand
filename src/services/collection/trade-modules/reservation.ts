import type { ApiResponse } from '../../networking'
import { API_ENDPOINTS } from '../../config'
import { authedFetch, getStoredToken } from '../../client'
import { bizLog, debugLog } from '@/utils/logger'

/**
 * 盲盒预约记录状态
 * -1: 全部, 0: 待撮合, 1: 已中签, 2: 未中签/已退款
 */
export type ReservationStatus = -1 | 0 | 1 | 2

/**
 * 盲盒预约记录项接口
 */
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

  status: number
  status_text: string

  match_order_id?: number
  match_time?: number
  create_time?: number
  update_time?: number
  create_time_str?: string
  order?: any
  [key: string]: any
}

/**
 * 查询盲盒预约记录的参数接口
 */
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
 * 盲盒预约记录列表返回数据接口
 */
export interface ReservationsListData {
  list: ReservationItem[]
  total: number
  page: number
  limit: number
}

/**
 * 查询盲盒预约记录列表
 */
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
 * 预约记录详情数据接口
 */
export interface ReservationDetailData extends ReservationItem {}

/**
 * 获取预约记录详情
 */
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
 * 盲盒预约参数接口
 */
export interface BidBuyParams {
  session_id: number | string
  zone_id: number | string
  package_id: number | string
  extra_hashrate?: number
  quantity?: number
  token?: string
}

/**
 * 盲盒预约返回数据接口
 */
export interface BidBuyResult {
  reservation_id?: number
  freeze_amount?: number
  power_used?: number
  weight?: number
  zone_name?: string
  package_id?: number
  package_name?: string
  message?: string
  [key: string]: any
}

/**
 * 盲盒预约（冻结专项资金与算力）
 */
export async function bidBuy(params: BidBuyParams): Promise<ApiResponse<BidBuyResult>> {
  debugLog('collection.bidBuy', '开始调用', params)
  const token = params.token ?? getStoredToken()

  if (params.session_id === undefined || params.session_id === null || params.session_id === '') {
    throw new Error('场次ID(session_id)不能为空')
  }
  if (params.zone_id === undefined || params.zone_id === null || params.zone_id === '') {
    throw new Error('价格分区ID(zone_id)不能为空')
  }
  if (params.package_id === undefined || params.package_id === null || params.package_id === '') {
    throw new Error('资产包ID(package_id)不能为空')
  }

  const formData = new FormData()
  formData.append('session_id', String(params.session_id))
  formData.append('zone_id', String(params.zone_id))
  formData.append('package_id', String(params.package_id))

  const extraHashrate = params.extra_hashrate ?? 0
  if (extraHashrate < 0) {
    throw new Error('额外算力不能小于0')
  }
  formData.append('extra_hashrate', String(extraHashrate))

  const quantity = Math.min(Math.max(params.quantity ?? 1, 1), 100)
  formData.append('quantity', String(quantity))

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
  debugLog('collection.bidBuy', '响应结果', response)
  return response
}
