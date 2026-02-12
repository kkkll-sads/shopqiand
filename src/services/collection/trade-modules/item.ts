import type { ApiResponse } from '../../networking'
import { API_ENDPOINTS } from '../../config'
import { authedFetch } from '../../client'

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
  package_name?: string
  [key: string]: any
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
  [key: string]: any
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
  [key: string]: any
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
): Promise<ApiResponse<CollectionItemListData>> {
  const search = new URLSearchParams()
  search.set('session_id', String(sessionId))
  if (params.page) search.set('page', String(params.page))
  if (params.limit) search.set('limit', String(params.limit))

  const path = `${API_ENDPOINTS.collectionItem.bySession}?${search.toString()}`
  return authedFetch<CollectionItemListData>(path, { method: 'GET' })
}
