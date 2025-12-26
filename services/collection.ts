/**
 * collection.ts - 藏品与艺术家服务
 * 
 * 包含：交易专场、藏品列表、藏品详情、艺术家等
 * 
 * @author 树交所前端团队
 * @version 1.0.0
 */

import { ApiResponse } from './networking';
import { API_ENDPOINTS, AUTH_TOKEN_KEY } from './config';
import { authedFetch, getStoredToken } from './client';
import { bizLog, debugLog, errorLog } from '../utils/logger';

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
    return authedFetch<{ list: CollectionSessionItem[] }>(API_ENDPOINTS.collectionSession.index, {
        method: 'GET',
    });
}

export async function fetchCollectionSessionDetail(id: number): Promise<ApiResponse<CollectionSessionItem>> {
    return authedFetch<CollectionSessionItem>(`${API_ENDPOINTS.collectionSession.detail}?id=${id}`, {
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
    price_zone?: string;  // 价格分区 (例如: "500元区", "1000元区")
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
    supplier_name?: string; // 供应方名称
    tx_hash?: string;        // 上链交易哈希
    asset_code?: string;     // 资产编码
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
    return authedFetch<CollectionItemListData>(path, {
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
    return authedFetch<CollectionItemDetailData>(`${API_ENDPOINTS.collectionItem.detail}?id=${id}`, {
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
    return authedFetch<CollectionItemListData>(path, { method: 'GET' });
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
    return authedFetch<CollectionItemOriginalDetailData>(path, { method: 'GET' });
}

// buyCollectionItem 接口已移除


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
    status: MatchingPoolStatus; // 状态：pending-匹配中，matched-已匹配，cancelled-已取消

    // New fields from API
    item_title?: string;
    item_image?: string;
    item_price?: number;     // 价格

    power_used?: number;     // 消耗算力
    weight?: number;         // 权重

    session_title?: string;   // 场次名称（盲盒模式）
    zone_name?: string;       // 分区名称（盲盒模式）
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
    status?: MatchingPoolStatus; // 状态：pending-匹配中，matched-已匹配，cancelled-已取消
    page?: number;           // 页码，默认1
    limit?: number;          // 每页数量，默认20
    token?: string;          // 用户登录Token（可选，会自动从localStorage获取）
    sort_by_weight?: boolean; // 是否按权重排序（后端支持则传true）
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
    const token = params.token ?? getStoredToken();
    const search = new URLSearchParams();

    if (params.item_id) search.set('item_id', String(params.item_id));
    if (params.session_id) search.set('session_id', String(params.session_id));
    if (params.status) search.set('status', params.status);
    if (params.page) search.set('page', String(params.page));
    if (params.limit) search.set('limit', String(params.limit));
    if (params.sort_by_weight) search.set('sort_by_weight', '1');

    const path = `${API_ENDPOINTS.collectionItem.matchingPool}?${search.toString()}`;
    return authedFetch<MatchingPoolListData>(path, {
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
    const token = params.token ?? getStoredToken();

    const search = new URLSearchParams();
    search.set('matching_pool_id', String(params.matching_pool_id));

    const path = `${API_ENDPOINTS.collectionItem.cancelBid}?${search.toString()}`;
    return authedFetch<CancelBidResult>(path, {
        method: 'POST',
        token,
    });
}

// ============================================================================
// 盲盒预约记录
// ============================================================================

/**
 * 盲盒预约记录状态
 * -1: 全部, 0: 待撮合, 1: 已中签, 2: 未中签/已退款
 */
export type ReservationStatus = -1 | 0 | 1 | 2;

/**
 * 盲盒预约记录项接口
 * API: GET /api/collectionItem/reservations
 */
export interface ReservationItem {
    id: number;                   // 预约记录ID
    session_id: number;           // 场次ID
    session_title?: string;       // 场次名称
    session_start_time?: string;  // 场次开始时间
    session_end_time?: string;    // 场次结束时间

    zone_id: number;              // 价格分区ID
    zone_name?: string;           // 分区名称
    zone_min_price?: number;      // 分区最低价
    zone_max_price?: number;      // 分区最高价

    product_id?: number;          // 商品ID（撮合后才有）
    item_title?: string;          // 商品标题
    item_image?: string;          // 商品图片
    item_price?: number;          // 商品价格

    freeze_amount: number;        // 冻结金额
    power_used: number;           // 总消耗算力
    base_hashrate_cost?: number;  // 基础算力消耗
    extra_hashrate_cost?: number; // 额外算力消耗
    weight: number;               // 权重

    status: number;               // 状态: 0=待撮合, 1=已撮合/已中签, 2=已退款/未中签
    status_text: string;          // 状态文本

    match_order_id?: number;      // 匹配订单ID
    match_time?: number;          // 撮合时间
    create_time?: number;         // 创建时间戳
    update_time?: number;         // 更新时间戳
    create_time_str?: string;     // 创建时间字符串
    order?: any;                  // 中签后的订单信息
    [key: string]: any;           // 其他额外字段
}

/**
 * 查询盲盒预约记录的参数接口
 * API: GET /api/collectionItem/reservations
 */
export interface FetchReservationsParams {
    status?: ReservationStatus; // 状态筛选: -1=全部(默认), 0=待撮合, 1=已中签, 2=未中签/已退款
    page?: number;              // 页码
    limit?: number;             // 每页数量
    token?: string;             // 用户登录Token（可选，会自动从localStorage获取）
}

/**
 * 盲盒预约记录列表返回数据接口
 */
export interface ReservationsListData {
    list: ReservationItem[];  // 预约记录列表
    total: number;            // 总记录数
    page: number;             // 当前页码
    limit: number;            // 每页数量
}

/**
 * 查询盲盒预约记录列表
 * API: GET /api/collectionItem/reservations
 * 
 * @param params - 查询参数
 * @param params.status - 状态筛选: -1=全部(默认), 0=待撮合, 1=已中签, 2=未中签/已退款
 * @param params.page - 页码
 * @param params.limit - 每页数量
 * 
 * @returns 返回数据包括：
 *          - list: 预约记录列表
 *          - total: 总记录数
 *          - page: 当前页码
 *          - limit: 每页数量
 */
export async function fetchReservations(params: FetchReservationsParams = {}): Promise<ApiResponse<ReservationsListData>> {
    const token = params.token ?? getStoredToken();
    const search = new URLSearchParams();

    if (params.status !== undefined && params.status !== -1) {
        search.set('status', String(params.status));
    }
    if (params.page) search.set('page', String(params.page));
    if (params.limit) search.set('limit', String(params.limit));

    const path = `${API_ENDPOINTS.collectionItem.reservations}?${search.toString()}`;
    return authedFetch<ReservationsListData>(path, {
        method: 'GET',
        token,
    });
}

/**
 * 盲盒预约参数接口（新模式，仅保留预约）
 */
export interface BidBuyParams {
    session_id?: number | string;  // 场次ID（优先透传后端，不前端拦截）
    zone_id?: number | string;     // 价格分区ID（透传后端，不前端拦截）
    extra_hashrate?: number;       // 额外加注算力 (0-50)
    token?: string;                // 用户登录Token
}

/**
 * 盲盒预约返回数据接口
 */
export interface BidBuyResult {
    reservation_id?: number;
    freeze_amount?: number;
    power_used?: number;
    weight?: number;
    zone_id?: number;
    zone_name?: string;
    session_id?: number;
    message?: string;
    [key: string]: any;
}

/**
 * 盲盒预约（唯一模式）
 * API: POST /api/collectionItem/bidBuy
 */
export async function bidBuy(params: BidBuyParams): Promise<ApiResponse<BidBuyResult>> {
    debugLog('collection.bidBuy', '开始调用', params);
    const token = params.token ?? getStoredToken();

    // 直接透传场次/分区给后端，不做前端拦截
    const sessionIdNum = params.session_id !== undefined ? Number(params.session_id) : NaN;
    const zoneIdNum = params.zone_id !== undefined ? Number(params.zone_id) : NaN;

    const extraHashrateRaw = params.extra_hashrate ?? 0;
    const extraHashrate = Number.isFinite(extraHashrateRaw) ? extraHashrateRaw : 0;
    if (extraHashrate < 0 || extraHashrate > 50) {
        throw new Error('额外算力需在 0-50 之间');
    }

    const formData = new FormData();
    formData.append('session_id', params.session_id !== undefined ? String(params.session_id) : '');
    formData.append('zone_id', params.zone_id !== undefined ? String(params.zone_id) : '');
    formData.append('extra_hashrate', String(extraHashrate));

    const response = await authedFetch<BidBuyResult>(API_ENDPOINTS.collectionItem.bidBuy, {
        method: 'POST',
        token,
        body: formData,
    });
    bizLog('collection.bidBuy', {
        sessionId: params.session_id,
        zoneId: params.zone_id,
        code: response.code,
    });
    debugLog('collection.bidBuy', '响应结果', response);
    return response;
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

export async function getMyCollection(params: { page?: number; limit?: number; type?: string; token?: string } = {}): Promise<ApiResponse<{ list: MyCollectionItem[], total: number, has_more?: boolean, consignment_coupon?: number }>> {
    const token = params.token || localStorage.getItem(AUTH_TOKEN_KEY) || '';
    const search = new URLSearchParams();
    if (params.page) search.set('page', String(params.page));
    if (params.limit) search.set('limit', String(params.limit));
    if (params.type) search.set('type', params.type);

    const path = `${API_ENDPOINTS.collectionItem.purchaseRecords}?${search.toString()}`;
    return authedFetch<{ list: MyCollectionItem[], total: number, has_more?: boolean, consignment_coupon?: number }>(path, {
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
    return authedFetch<{ list: ArtistItem[] }>(API_ENDPOINTS.artist.index, {
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
    return authedFetch<ArtistDetailData>(path, { method: 'GET' });
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
    return authedFetch<ArtistAllWorksListData>(path, { method: 'GET' });
}

// 兼容旧名称
export type ArtistApiItem = ArtistItem;
export type ArtistListData = { list: ArtistItem[] };
export const fetchArtists = fetchArtistList;
