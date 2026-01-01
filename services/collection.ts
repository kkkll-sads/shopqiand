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
    package_name?: string; // 资产包名称
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
    type?: string;           // 详情类型：market（市场）/ my（我的）
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

export async function fetchCollectionItemDetail(id: number | string): Promise<ApiResponse<CollectionItemDetailData>> {
    return authedFetch<CollectionItemDetailData>(`${API_ENDPOINTS.collectionItem.detail}?id=${id}`, {
        method: 'GET',
    });
}

/**
 * 用户藏品详情数据接口
 * API: GET /api/userCollection/detail
 */
export interface UserCollectionDetailData {
    object_type: 'user_collection';
    user_collection_id: number;
    item_id: number;
    title: string;
    image: string;
    buy_price: number;         // 买入成本价
    market_price: number;      // 当前市场价 (仅用于展示，禁止用于计算)
    asset_code: string;        // 资产编号
    hash: string;              // 唯一哈希（优先取确权哈希）
    consignment_status: number; // 寄售状态
    rights_status: string;     // 确权状态
    [key: string]: any;        // 其他额外字段
}

/**
 * 获取我的藏品详情
 * API: GET /api/userCollection/detail
 * 
 * @param userCollectionId - 用户藏品ID (user_collection_id)
 * @returns 返回用户藏品详细信息
 */
export async function fetchUserCollectionDetail(userCollectionId: number | string): Promise<ApiResponse<UserCollectionDetailData>> {
    const search = new URLSearchParams();
    search.set('user_collection_id', String(userCollectionId));

    const path = `${API_ENDPOINTS.userCollection.detail}?${search.toString()}`;
    return authedFetch<UserCollectionDetailData>(path, { method: 'GET' });
}

/**
 * @deprecated 使用 fetchUserCollectionDetail 代替
 * 此函数使用错误的 API 端点，保留仅为向后兼容
 */
export async function fetchMyCollectionDetail(id: number | string): Promise<ApiResponse<any>> {
    console.warn('[DEPRECATED] fetchMyCollectionDetail 使用了错误的 API 端点，请使用 fetchUserCollectionDetail');
    return fetchUserCollectionDetail(id);
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
 * @deprecated 此接口已废弃，请使用 fetchCollectionItemDetail 替代
 */
export interface CollectionItemOriginalDetailData extends CollectionItemDetailData {
    status_text: string;  // 上架状态文本
}

/**
 * 获取官方商品原始详情
 * API: GET /api/collectionItem/originalDetail
 * 
 * @deprecated 此接口已废弃，请使用 fetchCollectionItemDetail 替代
 * @param id - 商品ID
 * @returns 返回商品详细信息，包括：
 *          - 所有商品详情字段（id、title、image、images、price、description、artist、stock、sales）
 *          - status_text: 上架状态文本
 */
export async function fetchCollectionItemOriginalDetail(id: number | string): Promise<ApiResponse<CollectionItemOriginalDetailData>> {
    console.warn('[DEPRECATED] fetchCollectionItemOriginalDetail is deprecated. Use fetchCollectionItemDetail instead.');
    const path = `${API_ENDPOINTS.collectionItem.originalDetail}?id=${id}`;
    return authedFetch<CollectionItemOriginalDetailData>(path, { method: 'GET' });
}

// buyCollectionItem 接口已移除

/**
 * 将藏品转为矿机
 * API: POST /api/collectionItem/toMining
 * 
 * @param params - 参数
 * @param params.user_collection_id - 用户藏品ID
 * @param params.token - 用户登录Token
 */
export async function toMining(params: { user_collection_id: number; token?: string }): Promise<ApiResponse<any>> {
    const token = params.token ?? getStoredToken();
    const formData = new FormData();
    formData.append('user_collection_id', String(params.user_collection_id));

    return authedFetch<any>(API_ENDPOINTS.collectionItem.toMining, {
        method: 'POST',
        token,
        body: formData,
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
    item_price?: number;          // 商品价格（增值后，仅供参考，禁止用于计算）

    // 订单快照金额（必须使用这些字段，禁止使用item_price计算）
    actual_buy_price?: number;    // 实际购买价格（订单快照）
    refund_diff?: number;         // 退还差价

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
 * 预约记录详情数据接口
 * API: GET /api/collectionItem/reservationDetail
 */
export interface ReservationDetailData extends ReservationItem {
    // Extends all ReservationItem fields
    // Additional detail fields can be added here if API returns more
}

/**
 * 获取预约记录详情
 * API: GET /api/collectionItem/reservationDetail
 * 
 * @param id - 预约记录ID
 * @param token - 用户登录Token（可选，会自动从localStorage获取）
 * @returns 返回预约记录详细信息
 */
export async function fetchReservationDetail(id: number | string, token?: string): Promise<ApiResponse<ReservationDetailData>> {
    const authToken = token ?? getStoredToken();
    const search = new URLSearchParams();
    search.set('id', String(id));

    const path = `${API_ENDPOINTS.collectionItem.reservationDetail}?${search.toString()}`;
    return authedFetch<ReservationDetailData>(path, {
        method: 'GET',
        token: authToken,
    });
}

/**
 * 盲盒预约参数接口
 */
export interface BidBuyParams {
    session_id: number | string;      // 场次ID（必填）
    zone_id: number | string;         // 价格分区ID（必填，如1=500元区）
    package_id: number | string;      // 资产包ID（必填）
    extra_hashrate?: number;          // 额外加注算力（可选，默认0，用于增加权重）
    token?: string;                   // 用户登录Token
}

/**
 * 盲盒预约返回数据接口
 */
export interface BidBuyResult {
    reservation_id?: number;          // 预约记录ID
    freeze_amount?: number;           // 冻结金额（分区最高价）
    power_used?: number;              // 消耗的算力
    weight?: number;                  // 获得的权重
    zone_name?: string;               // 分区名称
    package_id?: number;              // 资产包ID
    package_name?: string;            // 资产包名称
    message?: string;                 // 提示信息
    [key: string]: any;
}

/**
 * 盲盒预约（冻结专项资金与算力）
 * API: POST /api/collectionItem/bidBuy
 */
export async function bidBuy(params: BidBuyParams): Promise<ApiResponse<BidBuyResult>> {
    debugLog('collection.bidBuy', '开始调用', params);
    const token = params.token ?? getStoredToken();

    // 验证必填参数
    if (params.session_id === undefined || params.session_id === null || params.session_id === '') {
        throw new Error('场次ID(session_id)不能为空');
    }
    if (params.zone_id === undefined || params.zone_id === null || params.zone_id === '') {
        throw new Error('价格分区ID(zone_id)不能为空');
    }
    if (params.package_id === undefined || params.package_id === null || params.package_id === '') {
        throw new Error('资产包ID(package_id)不能为空');
    }

    const formData = new FormData();
    formData.append('session_id', String(params.session_id));
    formData.append('zone_id', String(params.zone_id));
    formData.append('package_id', String(params.package_id));
    
    const extraHashrate = params.extra_hashrate ?? 0;
    if (extraHashrate < 0) {
        throw new Error('额外算力不能小于0');
    }
    formData.append('extra_hashrate', String(extraHashrate));

    const response = await authedFetch<BidBuyResult>(API_ENDPOINTS.collectionItem.bidBuy, {
        method: 'POST',
        token,
        body: formData,
    });
    bizLog('collection.bidBuy', {
        sessionId: params.session_id,
        zoneId: params.zone_id,
        packageId: params.package_id,
        code: response.code,
    });
    debugLog('collection.bidBuy', '响应结果', response);
    return response;
}

// ============================================================================
// 我的藏品
// ============================================================================

export interface MyCollectionItem {
    id: number;                   // 用户藏品ID
    unique_id: string;            // 唯一标识ID
    title: string;                // 藏品标题
    image: string;                // 藏品图片
    asset_code: string;           // 确权编号
    md5: string;                  // MD5指纹
    fingerprint: string;          // 指纹(同MD5)
    price: number;                // 买入价格
    market_price: number;         // 当前市场价
    transaction_count: number;    // 交易次数
    fail_count: number;           // 流拍次数
    consignment_status: number;   // 寄售状态: 0=未寄售, 1=寄售中, 2=已售出

    // Specially for status=sold
    consignment_id?: number;
    consignment_status_text?: string;
    sold_price?: number;
    service_fee?: number;
    service_fee_paid_at_apply?: number | boolean;
    settle_status?: number;
    settle_time?: number;
    sold_time?: number;

    // Settlement Snapshot
    settle_rule?: string;
    is_legacy_snapshot?: number;
    legacy_unlock_price_snapshot?: number;

    principal_amount?: number;
    profit_amount?: number;

    payout_principal_withdrawable?: number;
    payout_principal_consume?: number;
    payout_profit_withdrawable?: number;
    payout_profit_consume?: number;
    payout_total_withdrawable?: number;
    payout_total_consume?: number;

    [key: string]: any;
}

/**
 * 通过确权编号或MD5指纹查询藏品
 * API: GET /api/collectionItem/queryByCode
 * 
 * @param code - 确权编号（如 37-DATA-0001-000123）或 MD5指纹（如 0x1a2b3c...）
 * @returns 藏品详细信息，包括持有人信息（如果已交付且未售出）
 */
export interface QueryByCodeParams {
    code: string;
}

export interface CollectionHolder {
    user_id: number;
    username: string;
    nickname: string;
    mobile: string; // 脱敏后的手机号
}

export interface CollectionItemDetail {
    id: number;
    session_id: number;
    title: string;
    image: string;
    price: number;
    issue_price: number;
    asset_code: string;
    fingerprint: string;
    status: string;
    description: string;
    core_enterprise: string;
    farmer_info: string;
    zone_id: number;
    holder: CollectionHolder | null;
    [key: string]: any;
}

export async function queryCollectionByCode(params: QueryByCodeParams): Promise<ApiResponse<CollectionItemDetail>> {
    const search = new URLSearchParams();
    search.set('code', params.code);

    const path = `${API_ENDPOINTS.collectionItem.queryByCode}?${search.toString()}`;
    return authedFetch<CollectionItemDetail>(path, { method: 'GET' });
}

// ============================================================================
// 藏品订单
// ============================================================================

/**
 * 藏品订单明细项接口
 */
export interface CollectionOrderItemDetail {
    id: number;
    item_id: number;
    item_title: string;
    item_image: string;
    price: number;
    quantity: number;
    subtotal: number;
    [key: string]: any;
}

/**
 * 藏品订单详情数据接口
 * API: GET /api/collectionItem/orderDetail
 */
export interface CollectionOrderDetailData {
    id: number;
    order_no: string;
    user_id: number;
    total_amount: number;
    pay_type: string;
    pay_type_text?: string;
    status: string;
    status_text: string;
    pay_time?: number;
    pay_time_text?: string;
    complete_time?: number;
    complete_time_text?: string;
    create_time: number;
    create_time_text?: string;
    remark?: string;
    items: CollectionOrderItemDetail[];
    [key: string]: any;
}

/**
 * 获取藏品订单详情的参数接口
 */
export interface GetCollectionOrderDetailParams {
    id?: number | string;
    order_no?: string;
    token?: string;
}

/**
 * 获取藏品订单详情
 * API: GET /api/collectionItem/orderDetail
 * 
 * @param params - 查询参数，支持通过 id 或 order_no 查询
 * @returns 订单详情数据
 */
export async function getCollectionOrderDetail(params: GetCollectionOrderDetailParams): Promise<ApiResponse<CollectionOrderDetailData>> {
    const token = params.token ?? getStoredToken();
    const search = new URLSearchParams();
    
    if (params.id !== undefined && params.id !== null) {
        search.set('id', String(params.id));
    }
    if (params.order_no) {
        search.set('order_no', params.order_no);
    }

    const path = `${API_ENDPOINTS.collectionItem.orderDetail}?${search.toString()}`;
    return authedFetch<CollectionOrderDetailData>(path, {
        method: 'GET',
        token,
    });
}

export async function getMyCollection(params: { page?: number; limit?: number; status?: string; token?: string } = {}): Promise<ApiResponse<{ list: MyCollectionItem[], total: number, has_more?: boolean, consignment_coupon?: number }>> {
    const token = params.token || localStorage.getItem(AUTH_TOKEN_KEY) || '';
    const search = new URLSearchParams();
    search.set('page', String(params.page || 1));
    search.set('limit', String(params.limit || 10));
    if (params.status) {
        search.set('status', params.status);
    } else {
        // Default behavior: user doc says default is 'holding'.
        // However, existing usage might expect 'all' (e.g. AssetView).
        // To be safe and compliant with new API, if not specified, we pass nothing (backend defaults) or valid value.
        // Let's pass 'all' if not specified to maintain backward compatibility with views expecting everything.
        search.set('status', 'all');
    }

    const path = `${API_ENDPOINTS.collectionItem.myCollection}?${search.toString()}`;
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
