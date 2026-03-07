import type { ApiResponse } from '../../networking'
import { API_ENDPOINTS } from '../../config'
import { authedFetch, type RequestStrategyConfig } from '../../client'

export interface CollectionItemSessionRef {
  id?: number | string
  session_id?: number | string
  title?: string
  name?: string
  start_time?: string
  end_time?: string
}

export interface CollectionItemZoneRef {
  id?: number | string
  name?: string
  min_price?: number | string
  max_price?: number | string
}

export interface CollectionItemPackageRef {
  id?: number | string
  name?: string
}

/**
 * 藏品商品基本信息接口
 */
export interface CollectionItem {
  id: number
  session_id: number
  title: string
  image: string
  price: number
  stock: number
  sales?: number
  artist?: string
  description?: string
  price_zone?: string
  price_zone_id?: number | string
  package_id?: number | string
  package_name?: string
  zone_id?: number | string
  official_stock?: number
  consignment_count?: number
  total_available?: number
  price_range?: string
  min_price?: number | string
  max_price?: number | string
  [key: string]: unknown
}

/**
 * 藏品商品详情数据接口（包含完整字段）
 */
export interface CollectionItemDetailData {
  id: number
  title: string
  image: string
  images: string[]
  price: number
  description: string
  artist: string
  stock: number
  sales: number
  supplier_name?: string
  tx_hash?: string
  asset_code?: string
  type?: string
  session_name?: string
  sessionName?: string
  session_title?: string
  session_start_time?: string
  sessionStartTime?: string
  session_end_time?: string
  sessionEndTime?: string
  core_enterprise?: string
  coreEnterprise?: string
  farmer_info?: string
  farmerInfo?: string
  farmer_count_text?: string
  asset_status?: string
  assetStatus?: string
  status_text?: string
  status?: string
  session_id?: number | string
  sessionId?: number | string
  zone_id?: number | string
  zoneId?: number | string
  price_zone?: string
  priceZone?: string
  price_zone_id?: number | string
  priceZoneId?: number | string
  zone_max_price?: number | string
  zoneMaxPrice?: number | string
  max_price?: number | string
  maxPrice?: number | string
  package_id?: number | string
  packageId?: number | string
  session?: CollectionItemSessionRef
  zone?: CollectionItemZoneRef
  package?: CollectionItemPackageRef
  reservation_rules?: {
    min_qty?: number
    max_qty?: number
    max_extra_hashrate?: number
  }
  [key: string]: unknown
}

/**
 * 获取藏品商品列表的参数接口
 */
export interface FetchCollectionItemsParams {
  page?: number
  limit?: number
  session_id?: number
}

/**
 * 藏品商品列表返回数据接口
 */
export interface CollectionItemListData {
  list: CollectionItem[]
  total: number
}

/**
 * 获取藏品商品列表
 */
export async function fetchCollectionItems(
  params: FetchCollectionItemsParams = {},
): Promise<ApiResponse<CollectionItemListData>> {
  const search = new URLSearchParams()
  if (params.session_id) search.set('session_id', String(params.session_id))
  if (params.page) search.set('page', String(params.page))
  if (params.limit) search.set('limit', String(params.limit))

  const path = `${API_ENDPOINTS.collectionItem.index}?${search.toString()}`
  return authedFetch<CollectionItemListData>(path, {
    method: 'GET',
  })
}

export async function fetchCollectionItemDetail(id: number | string): Promise<ApiResponse<CollectionItemDetailData>> {
  return authedFetch<CollectionItemDetailData>(`${API_ENDPOINTS.collectionItem.detail}?id=${id}`, {
    method: 'GET',
  })
}

/**
 * 用户藏品详情数据接口
 */
export interface UserCollectionDetailData {
  object_type: 'user_collection'
  user_collection_id: number
  item_id: number
  title: string
  image: string
  buy_price: number
  market_price: number
  asset_code: string
  hash: string
  consignment_status: number
  rights_status: string
  appreciation_rate?: number
  is_old_asset_package?: boolean
  [key: string]: unknown
}

/**
 * 获取我的藏品详情
 */
export async function fetchUserCollectionDetail(
  userCollectionId: number | string,
): Promise<ApiResponse<UserCollectionDetailData>> {
  const search = new URLSearchParams()
  search.set('user_collection_id', String(userCollectionId))

  const path = `${API_ENDPOINTS.userCollection.detail}?${search.toString()}`
  return authedFetch<UserCollectionDetailData>(path, { method: 'GET' })
}

/**
 * 根据专场获取商品列表的参数接口
 */
export interface FetchCollectionItemsBySessionParams {
  page?: number
  limit?: number
}

/**
 * 根据专场获取商品列表
 */
export async function fetchCollectionItemsBySession(
  sessionId: number | string,
  params: FetchCollectionItemsBySessionParams = {},
  strategy?: RequestStrategyConfig,
): Promise<ApiResponse<CollectionItemListData>> {
  const search = new URLSearchParams()
  search.set('session_id', String(sessionId))
  const page = typeof params.page === 'number' && params.page > 0 ? Math.floor(params.page) : 1
  const requestedLimit = typeof params.limit === 'number' ? Math.floor(params.limit) : 10
  const limit = Math.min(Math.max(requestedLimit, 1), 10)
  search.set('page', String(page))
  search.set('limit', String(limit))

  const path = `${API_ENDPOINTS.collectionItem.bySession}?${search.toString()}`
  return authedFetch<CollectionItemListData>(path, {
    method: 'GET',
    cacheTTL: strategy?.cacheTTL ?? 60000,
    dedup: strategy?.dedup ?? true,
    forceRefresh: strategy?.forceRefresh ?? false,
  })
}
