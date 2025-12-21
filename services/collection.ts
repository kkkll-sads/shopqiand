/**
 * collection.ts - 藏品与艺术家服务
 * 
 * 包含：交易专场、藏品列表、藏品详情、艺术家等
 * 
 * @author 树交所前端团队
 * @version 1.0.0
 */

import { apiFetch, ApiResponse } from './networking';
import { API_ENDPOINTS, AUTH_TOKEN_KEY } from './config';

// ============================================================================
// 交易专场
// ============================================================================

export interface CollectionSessionItem {
    id: number;
    title: string;
    image: string;
    start_time: string;
    end_time: string;
    status: string; // pre, active, ended
    [key: string]: any;
}

export async function fetchCollectionSessions(): Promise<ApiResponse<{ list: CollectionSessionItem[] }>> {
    return apiFetch<{ list: CollectionSessionItem[] }>(API_ENDPOINTS.collectionSession.index, {
        method: 'GET',
    });
}

export async function fetchCollectionSessionDetail(id: number): Promise<ApiResponse<CollectionSessionItem>> {
    return apiFetch<CollectionSessionItem>(`${API_ENDPOINTS.collectionSession.detail}?id=${id}`, {
        method: 'GET',
    });
}

// ============================================================================
// 藏品交易
// ============================================================================

/**
 * 藏品商品基本信息接口
 */
export interface CollectionItem {
    id: number;           // 商品ID
    session_id: number;   // 专场ID
    title: string;        // 商品标题
    image: string;        // 商品图片完整URL
    price: number;        // 价格
    stock: number;        // 库存数量
    sales?: number;       // 销量
    artist?: string;      // 艺术家/创作者
    description?: string; // 商品描述
    [key: string]: any;   // 其他额外字段
}

/**
 * 藏品商品详情数据接口（包含完整字段）
 * API: GET /api/collectionItem/detail
 */
export interface CollectionItemDetailData {
    id: number;           // 商品ID
    title: string;        // 商品标题
    image: string;        // 商品图片完整URL
    images: string[];     // 商品详情图片列表
    price: number;        // 价格
    description: string;  // 商品描述
    artist: string;       // 艺术家/创作者
    stock: number;        // 库存数量
    sales: number;        // 销量
    [key: string]: any;   // 其他额外字段
}

/**
 * 获取藏品商品列表的参数接口
 */
export interface FetchCollectionItemsParams {
    page?: number;       // 页码，默认1
    limit?: number;      // 每页数量，默认10，最大50
    session_id?: number; // 专场ID
}

/**
 * 藏品商品列表返回数据接口
 */
export interface CollectionItemListData {
    list: CollectionItem[]; // 商品列表
    total: number;          // 总记录数
}

/**
 * 获取藏品商品列表
 * @param params - 查询参数（页码、每页数量、专场ID）
 * @returns 返回商品列表及总数
 */
export async function fetchCollectionItems(params: FetchCollectionItemsParams = {}): Promise<ApiResponse<CollectionItemListData>> {
    const search = new URLSearchParams();
    if (params.session_id) search.set('session_id', String(params.session_id));
    if (params.page) search.set('page', String(params.page));
    if (params.limit) search.set('limit', String(params.limit));

    const path = `${API_ENDPOINTS.collectionItem.index}?${search.toString()}`;
    return apiFetch<CollectionItemListData>(path, {
        method: 'GET',
    });
}

/**
 * 获取藏品商品详情
 * API: GET /api/collectionItem/detail
 * 
 * @param id - 商品ID
 * @returns 返回商品详细信息，包括：
 *          - id: 商品ID
 *          - title: 商品标题
 *          - image: 商品主图完整URL
 *          - images: 商品详情图片列表
 *          - price: 价格
 *          - description: 商品描述
 *          - artist: 艺术家/创作者
 *          - stock: 库存数量
 *          - sales: 销量
 */
export async function fetchCollectionItemDetail(id: number): Promise<ApiResponse<CollectionItemDetailData>> {
    return apiFetch<CollectionItemDetailData>(`${API_ENDPOINTS.collectionItem.detail}?id=${id}`, {
        method: 'GET',
    });
}

/**
 * 根据专场获取商品列表的参数接口
 */
export interface FetchCollectionItemsBySessionParams {
    page?: number;   // 页码，默认1
    limit?: number;  // 每页数量，默认10，最大50
}

/**
 * 根据专场获取商品列表
 * API: GET /api/collectionItem/bySession
 * 
 * @param sessionId - 专场ID
 * @param params - 可选参数
 * @param params.page - 页码，默认1
 * @param params.limit - 每页数量，默认10，最大50
 * @returns 返回数据包括：
 *          - list: 商品列表
 *          - total: 总记录数
 */
export async function fetchCollectionItemsBySession(
    sessionId: number | string,
    params: FetchCollectionItemsBySessionParams = {}
): Promise<ApiResponse<CollectionItemListData>> {
    const search = new URLSearchParams();
    search.set('session_id', String(sessionId));
    if (params.page) search.set('page', String(params.page));
    if (params.limit) search.set('limit', String(params.limit));

    const path = `${API_ENDPOINTS.collectionItem.bySession}?${search.toString()}`;
    return apiFetch<CollectionItemListData>(path, { method: 'GET' });
}

/**
 * 官方商品原始详情数据接口
 * API: GET /api/collectionItem/originalDetail
 */
export interface CollectionItemOriginalDetailData extends CollectionItemDetailData {
    status_text: string;  // 上架状态文本
}

/**
 * 获取官方商品原始详情
 * API: GET /api/collectionItem/originalDetail
 * 
 * @param id - 商品ID
 * @returns 返回商品详细信息，包括：
 *          - 所有商品详情字段（id、title、image、images、price、description、artist、stock、sales）
 *          - status_text: 上架状态文本
 */
export async function fetchCollectionItemOriginalDetail(id: number | string): Promise<ApiResponse<CollectionItemOriginalDetailData>> {
    const path = `${API_ENDPOINTS.collectionItem.originalDetail}?id=${id}`;
    return apiFetch<CollectionItemOriginalDetailData>(path, { method: 'GET' });
}

/**
 * 购买藏品/寄售藏品的参数接口
 * API: POST /api/collectionItem/buy
 */
export interface BuyCollectionItemParams {
    item_id?: number | string;        // 藏品ID（购买普通藏品时必填）
    quantity?: number;                 // 购买数量，默认1
    pay_type?: 'money' | 'score';     // 支付方式: money=余额, score=积分
    product_id_record?: string;        // 产品ID记录（如'第一天产品'）
    consignment_id?: number | string;  // 寄售记录ID（购买寄售藏品时传此参数，优先按寄售购买）
    token?: string;                    // 用户登录Token（可选，会自动从localStorage获取）
}

/**
 * 购买藏品/寄售藏品的返回结果接口
 */
export interface BuyCollectionItemResult {
    order_no: string;          // 订单号
    order_id: number;          // 订单ID
    total_amount: number;      // 订单总金额
    user_type_updated: boolean; // 用户状态是否已更新
    [key: string]: any;        // 其他额外字段
}

/**
 * 购买藏品/寄售藏品
 * API: POST /api/collectionItem/buy
 * 
 * 请求头需要包含：
 * - ba-token
 * - ba-user-token  
 * - batoken: 用户登录Token
 * 
 * @param params - 购买参数
 * @param params.item_id - 藏品ID（购买普通藏品时必填）
 * @param params.quantity - 购买数量，默认1
 * @param params.pay_type - 支付方式: money=余额, score=积分
 * @param params.product_id_record - 产品ID记录（如'第一天产品'）
 * @param params.consignment_id - 寄售记录ID（购买寄售藏品时传此参数，优先按寄售购买）
 * @param params.token - 用户登录Token（可选，会自动从localStorage获取）
 * 
 * @returns 返回数据包括：
 *          - order_no: 订单号
 *          - order_id: 订单ID
 *          - total_amount: 订单总金额
 *          - user_type_updated: 用户状态是否已更新
 */
export async function buyCollectionItem(params: BuyCollectionItemParams): Promise<ApiResponse<BuyCollectionItemResult>> {
    const token = params.token || localStorage.getItem(AUTH_TOKEN_KEY) || '';

    // 根据 API 文档，使用 JSON 格式传递参数
    const payload: Record<string, any> = {
        quantity: params.quantity ?? 1,
    };

    // 藏品ID（购买普通藏品时必填）
    if (params.item_id) {
        payload.item_id = Number(params.item_id);
    }

    // 支付方式: money=余额, score=积分
    if (params.pay_type) {
        payload.pay_type = params.pay_type;
    }

    // 产品ID记录
    if (params.product_id_record) {
        payload.product_id_record = params.product_id_record;
    }

    // 寄售记录ID（购买寄售藏品时传此参数，优先按寄售购买）
    if (params.consignment_id) {
        payload.consignment_id = Number(params.consignment_id);
    }

    return apiFetch<BuyCollectionItemResult>(API_ENDPOINTS.collectionItem.buy, {
        method: 'POST',
        body: JSON.stringify(payload),
        token,
    });
}

// ============================================================================
// 撮合池
// ============================================================================

/**
 * 撮合池状态枚举
 */
export type MatchingPoolStatus = 'pending' | 'matched' | 'cancelled';

/**
 * 撮合池列表项接口
 */
export interface MatchingPoolItem {
    id: number;              // 撮合池记录ID
    item_id: number;         // 藏品ID
    session_id?: number;     // 时段ID
    status: MatchingPoolStatus; // 状态：pending-待撮合，matched-已撮合，cancelled-已取消

    // New fields from API
    item_title?: string;
    item_image?: string;
    item_price?: number;     // 价格

    power_used?: number;     // 消耗算力
    weight?: number;         // 权重

    session_title?: string;
    session_start_time?: string;
    session_end_time?: string;

    create_time?: number;    // 创建时间戳
    match_time?: number;     // 撮合时间戳
    status_text?: string;    // 状态文本

    user_id?: number;
    user_nickname?: string;
    user_avatar?: string;

    [key: string]: any;      // 其他额外字段
}

/**
 * 查询撮合池列表的参数接口
 * API: GET /api/collectionItem/matchingPool
 */
export interface FetchMatchingPoolParams {
    item_id?: number;        // 藏品ID
    session_id?: number;     // 时段ID
    status?: MatchingPoolStatus; // 状态：pending-待撮合，matched-已撮合，cancelled-已取消
    page?: number;           // 页码，默认1
    limit?: number;          // 每页数量，默认20
    token?: string;          // 用户登录Token（可选，会自动从localStorage获取）
}

/**
 * 撮合池列表返回数据接口
 */
export interface MatchingPoolListData {
    list: MatchingPoolItem[]; // 撮合池列表
    total: number;            // 总记录数
}

/**
 * 查询撮合池列表
 * API: GET /api/collectionItem/matchingPool
 * 
 * @param params - 查询参数
 * @param params.item_id - 藏品ID
 * @param params.session_id - 时段ID
 * @param params.status - 状态：pending-待撮合，matched-已撮合，cancelled-已取消
 * @param params.page - 页码，默认1
 * @param params.limit - 每页数量，默认20
 * 
 * @returns 返回数据包括：
 *          - list: 撮合池列表
 *          - total: 总记录数
 */
export async function fetchMatchingPool(params: FetchMatchingPoolParams = {}): Promise<ApiResponse<MatchingPoolListData>> {
    const token = params.token || localStorage.getItem(AUTH_TOKEN_KEY) || '';
    const search = new URLSearchParams();

    if (params.item_id) search.set('item_id', String(params.item_id));
    if (params.session_id) search.set('session_id', String(params.session_id));
    if (params.status) search.set('status', params.status);
    if (params.page) search.set('page', String(params.page));
    if (params.limit) search.set('limit', String(params.limit));

    const path = `${API_ENDPOINTS.collectionItem.matchingPool}?${search.toString()}`;
    return apiFetch<MatchingPoolListData>(path, {
        method: 'GET',
        token,
    });
}

/**
 * 取消竞价（从撮合池移除）的参数接口
 * API: POST /api/collectionItem/cancelBid
 */
export interface CancelBidParams {
    matching_pool_id: number; // 撮合池记录ID
    token?: string;           // 用户登录Token（可选，会自动从localStorage获取）
}

/**
 * 取消竞价的返回结果接口
 */
export interface CancelBidResult {
    power_returned: number;   // 返还的算力
    [key: string]: any;       // 其他额外字段
}

/**
 * 取消竞价（从撮合池移除）
 * API: POST /api/collectionItem/cancelBid
 * 
 * @param params - 取消参数
 * @param params.matching_pool_id - 撮合池记录ID
 * @param params.token - 用户登录Token（可选，会自动从localStorage获取）
 * 
 * @returns 返回数据包括：
 *          - power_returned: 返还的算力
 */
export async function cancelBid(params: CancelBidParams): Promise<ApiResponse<CancelBidResult>> {
    const token = params.token || localStorage.getItem(AUTH_TOKEN_KEY) || '';

    const search = new URLSearchParams();
    search.set('matching_pool_id', String(params.matching_pool_id));

    const path = `${API_ENDPOINTS.collectionItem.cancelBid}?${search.toString()}`;
    return apiFetch<CancelBidResult>(path, {
        method: 'POST',
        token,
    });
}

/**
 * 竞价购买藏品的参数接口
 */
export interface BidBuyParams {
    item_id: number;       // 藏品ID（必填）
    power_used?: number;   // 使用的算力，默认5
    token?: string;        // 用户登录Token
}

/**
 * 竞价购买藏品的返回数据接口
 */
export interface BidBuyResult {
    matching_pool_id: number;  // 撮合池记录ID
    power_used: number;        // 消耗的算力
    weight: number;            // 获得的权重
    message: string;           // 提示信息
}

/**
 * 竞价购买藏品（进入撮合池）
 * API: POST /api/collectionItem/bidBuy
 */
export async function bidBuy(params: BidBuyParams): Promise<ApiResponse<BidBuyResult>> {
    const token = params.token || localStorage.getItem(AUTH_TOKEN_KEY) || '';
    const search = new URLSearchParams();
    search.set('item_id', String(params.item_id));
    if (params.power_used !== undefined) {
        search.set('power_used', String(params.power_used));
    }
    const path = `${API_ENDPOINTS.collectionItem.bidBuy}?${search.toString()}`;
    return apiFetch<BidBuyResult>(path, {
        method: 'POST',
        token,
    });
}

// ============================================================================
// 我的藏品
// ============================================================================

export interface MyCollectionItem {
    id: number;
    item_id: number;
    title?: string;
    item_title?: string;
    image?: string;
    item_image?: string;
    price: string;
    buy_time?: number;
    pay_time?: number;
    buy_time_text?: string;
    pay_time_text?: string;
    delivery_status: number;
    delivery_status_text: string;
    consignment_status: number;
    consignment_status_text: string;
    user_collection_id?: number | string;
    original_record?: any;
    [key: string]: any;
}

export async function getMyCollection(params: { page?: number; type?: string; token?: string } = {}): Promise<ApiResponse<{ list: MyCollectionItem[], total: number, has_more?: boolean }>> {
    const token = params.token || localStorage.getItem(AUTH_TOKEN_KEY) || '';
    const search = new URLSearchParams();
    if (params.page) search.set('page', String(params.page));
    if (params.type) search.set('type', params.type);

    const path = `${API_ENDPOINTS.collectionItem.purchaseRecords}?${search.toString()}`;
    return apiFetch<{ list: MyCollectionItem[], total: number, has_more?: boolean }>(path, {
        method: 'GET',
        token,
    });
}

// 兼容旧名称
export const fetchMyCollectionList = getMyCollection;

// ============================================================================
// 艺术家
// ============================================================================

export interface ArtistItem {
    id: number;
    name: string;
    avatar: string;
    title: string;
    description: string;
}

export async function fetchArtistList(): Promise<ApiResponse<{ list: ArtistItem[] }>> {
    return apiFetch<{ list: ArtistItem[] }>(API_ENDPOINTS.artist.index, {
        method: 'GET',
    });
}

export interface ArtistWorkItem {
    id: number;
    title: string;
    image: string;
    price?: number;
    description?: string;
    [key: string]: any;
}

export interface ArtistDetailData extends ArtistItem {
    works?: ArtistWorkItem[];
    [key: string]: any;
}

export async function fetchArtistDetail(id: number | string): Promise<ApiResponse<ArtistDetailData>> {
    const path = `${API_ENDPOINTS.artist.detail}?id=${id}`;
    return apiFetch<ArtistDetailData>(path, { method: 'GET' });
}

export interface ArtistAllWorkItem {
    id: number;
    artist_id: number;
    image: string;
    title: string;
    artist_title?: string;
    artist_name: string;
    description?: string;
    [key: string]: any;
}

export interface ArtistAllWorksListData {
    list: ArtistAllWorkItem[];
    total: number;
}

export async function fetchArtistAllWorks(params: { page?: number; limit?: number } = {}): Promise<ApiResponse<ArtistAllWorksListData>> {
    const search = new URLSearchParams();
    if (params.page) search.set('page', String(params.page));
    if (params.limit) search.set('limit', String(params.limit));

    const path = `${API_ENDPOINTS.artist.allWorks}?${search.toString()}`;
    return apiFetch<ArtistAllWorksListData>(path, { method: 'GET' });
}

// 兼容旧名称
export type ArtistApiItem = ArtistItem;
export type ArtistListData = { list: ArtistItem[] };
export const fetchArtists = fetchArtistList;
