import type { ApiResponse } from '../../networking'
import { API_ENDPOINTS } from '../../config'
import { authedFetch, getStoredToken } from '../../client'

/**
 * 将藏品升级为共识验证节点
 */
export async function toMining(params: { user_collection_id: number; token?: string }): Promise<ApiResponse<any>> {
  const token = params.token ?? getStoredToken()
  const formData = new FormData()
  formData.append('user_collection_id', String(params.user_collection_id))

  return authedFetch<any>(API_ENDPOINTS.collectionTrade.toMining, {
    method: 'POST',
    token,
    body: formData,
  })
}

/**
 * 撮合池状态枚举
 */
export type MatchingPoolStatus = 'pending' | 'matched' | 'cancelled'

/**
 * 撮合池列表项接口
 */
export interface MatchingPoolItem {
  id: number
  item_id: number
  session_id?: number
  status: MatchingPoolStatus

  item_title?: string
  item_image?: string
  item_price?: number

  power_used?: number
  weight?: number

  session_title?: string
  zone_name?: string
  session_start_time?: string
  session_end_time?: string

  create_time?: number
  match_time?: number
  status_text?: string

  user_id?: number
  user_nickname?: string
  user_avatar?: string

  [key: string]: any
}

/**
 * 查询撮合池列表的参数接口
 */
export interface FetchMatchingPoolParams {
  item_id?: number
  session_id?: number
  status?: MatchingPoolStatus
  page?: number
  limit?: number
  token?: string
  sort_by_weight?: boolean
}

/**
 * 撮合池列表返回数据接口
 */
export interface MatchingPoolListData {
  list: MatchingPoolItem[]
  total: number
}

/**
 * 查询撮合池列表
 */
export async function fetchMatchingPool(
  params: FetchMatchingPoolParams = {},
): Promise<ApiResponse<MatchingPoolListData>> {
  const token = params.token ?? getStoredToken()
  const search = new URLSearchParams()

  if (params.item_id) search.set('item_id', String(params.item_id))
  if (params.session_id) search.set('session_id', String(params.session_id))
  if (params.status) search.set('status', params.status)
  if (params.page) search.set('page', String(params.page))
  if (params.limit) search.set('limit', String(params.limit))
  if (params.sort_by_weight) search.set('sort_by_weight', '1')

  const path = `${API_ENDPOINTS.collectionTrade.matchingPool}?${search.toString()}`
  return authedFetch<MatchingPoolListData>(path, {
    method: 'GET',
    token,
  })
}

/**
 * 取消竞价（从撮合池移除）的参数接口
 */
export interface CancelBidParams {
  matching_pool_id: number
  token?: string
}

/**
 * 取消竞价的返回结果接口
 */
export interface CancelBidResult {
  power_returned: number
  [key: string]: any
}

/**
 * 取消竞价（从撮合池移除）
 */
export async function cancelBid(params: CancelBidParams): Promise<ApiResponse<CancelBidResult>> {
  const token = params.token ?? getStoredToken()

  const search = new URLSearchParams()
  search.set('matching_pool_id', String(params.matching_pool_id))

  const path = `${API_ENDPOINTS.collectionTrade.cancelBid}?${search.toString()}`
  return authedFetch<CancelBidResult>(path, {
    method: 'POST',
    token,
  })
}
