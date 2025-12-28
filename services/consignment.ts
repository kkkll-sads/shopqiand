/**
 * consignment.ts - 寄售与提货服务
 * 
 * 包含：寄售申请、取消寄售、申请提货、寄售列表、提货列表等
 * 
 * @author 树交所前端团队
 * @version 1.0.0
 */

import { ApiResponse } from './networking';
import { API_ENDPOINTS, AUTH_TOKEN_KEY } from './config';
// 统一的带 token 请求封装，避免重复从 localStorage 取值
import { authedFetch } from './client';
import type { ShopOrderItem } from './shop';

// ============================================================================
// 寄售券相关
// ============================================================================

/**
 * 寄售券项目接口
 * 对应后端表结构: ba_user_consignment_coupon
 */
export interface ConsignmentCouponItem {
    id: number;                   // 主键
    user_id: number;              // 用户ID
    session_id: number;           // 绑定场次ID
    zone_id: number;              // 绑定价格区间ID
    price_zone: string;           // 价格区间名称 (例如: "500元区", "1000元区")
    expire_time: number;          // 过期时间戳
    status: number;               // 状态: 1=可用, 0=已使用
    create_time: number;          // 创建时间戳
    update_time: number;          // 更新时间戳
    [key: string]: any;           // 其他额外字段
}

/**
 * 寄售券列表返回数据接口
 */
export interface ConsignmentCouponListData {
    list: ConsignmentCouponItem[]; // 寄售券列表
    total: number;                 // 总记录数
    has_more?: boolean;            // 是否有更多
}

/**
 * 获取用户寄售券列表
 * API: GET /api/user/consignmentCoupons (需后端确认实际接口路径)
 * 
 * @param params - 查询参数
 * @param params.page - 页码，默认1
 * @param params.limit - 每页数量，默认20
 * @param params.status - 状态筛选: 1=可用, 0=已使用, 不传=全部
 */
export async function fetchConsignmentCoupons(params: {
    page?: number;
    limit?: number;
    status?: number;
    token?: string;
} = {}): Promise<ApiResponse<ConsignmentCouponListData>> {
    const search = new URLSearchParams();
    if (params.page) search.set('page', String(params.page));
    if (params.limit) search.set('limit', String(params.limit));
    if (params.status !== undefined) search.set('status', String(params.status));

    // 寄售券列表接口
    const path = `${API_ENDPOINTS.user.consignmentCoupons}?${search.toString()}`;
    return authedFetch<ConsignmentCouponListData>(path, { method: 'GET', token: params.token });
}

// ============================================================================
// 寄售相关
// ============================================================================

export async function consignCollectionItem(params: {
    user_collection_id?: number | string;
    id?: number;
    price: number;
    token?: string
}): Promise<ApiResponse> {
    const payload = new FormData();
    payload.append('user_collection_id', String(params.user_collection_id || params.id));
    payload.append('price', String(params.price));

    return authedFetch(API_ENDPOINTS.collectionItem.consign, {
        method: 'POST',
        body: payload,
        token: params.token,
    });
}


/**
 * 取消寄售的参数接口
 * API: POST /api/collectionItem/cancelConsignment
 */
export interface CancelConsignmentParams {
    consignment_id: number;  // 寄售记录ID（必填）
    token?: string;          // 用户登录Token（可选，会自动从localStorage获取）
}

/**
 * 取消寄售
 * API: POST /api/collectionItem/cancelConsignment
 * 
 * 请求头需要包含：
 * - ba-token
 * - ba-user-token
 * - batoken: 用户登录Token
 * 
 * @param params - 取消参数
 * @param params.consignment_id - 寄售记录ID（必填）
 * @param params.token - 用户登录Token（可选，会自动从localStorage获取）
 * 
 * @returns 返回取消寄售结果
 */
export async function cancelConsignment(params: CancelConsignmentParams): Promise<ApiResponse> {
    // 根据 API 文档，使用 JSON 格式传递参数
    const payload = {
        consignment_id: Number(params.consignment_id),
    };

    return authedFetch(API_ENDPOINTS.collectionItem.cancelConsignment, {
        method: 'POST',
        body: JSON.stringify(payload),
        token: params.token,
    });
}

/**
 * 寄售商品基本信息接口
 */
export interface ConsignmentItem {
    id: number;                   // 寄售商品ID
    consignment_id: number;       // 寄售记录ID
    session_id?: number | string; // 专场ID
    title: string;                // 商品标题
    image: string;                // 商品图片
    price: number;                // 原价
    consignment_price?: number;   // 寄售价格
    stock?: number;               // 库存
    sales?: number;               // 销量
    [key: string]: any;           // 其他额外字段
}

/**
 * 寄售商品列表返回数据接口
 */
export interface ConsignmentListData {
    list: ConsignmentItem[];      // 寄售商品列表
    total: number;                // 总记录数
}

/**
 * 获取寄售商品列表
 * API: GET /api/collectionItem/consignmentList
 * 
 * @param params - 查询参数
 * @param params.page - 页码，默认1
 * @param params.limit - 每页数量，默认10，最大50
 * 
 * @returns 返回数据包括：
 *          - list: 寄售商品列表
 *          - total: 总记录数
 */
export async function getConsignmentList(params: { page?: number; limit?: number } = {}): Promise<ApiResponse<ConsignmentListData>> {
    const search = new URLSearchParams();
    if (params.page) search.set('page', String(params.page));
    if (params.limit) search.set('limit', String(params.limit));

    return authedFetch<ConsignmentListData>(`${API_ENDPOINTS.collectionItem.consignmentList}?${search.toString()}`, { method: 'GET' });
}

/**
 * 寄售交易区列表项接口
 */
export interface TradeListItem {
    id: number;                   // 交易区商品ID
    consignment_id: number;       // 寄售记录ID
    session_id?: number | string; // 专场ID
    title: string;                // 商品标题
    image: string;                // 商品图片
    price: number;                // 价格
    consignment_price?: number;   // 寄售价格
    stock?: number;               // 库存
    sales?: number;               // 销量
    [key: string]: any;           // 其他额外字段
}

/**
 * 寄售交易区列表返回数据接口
 */
export interface TradeListData {
    list: TradeListItem[];        // 寄售交易区列表
    total: number;                // 总记录数
}

/**
 * 寄售交易区列表查询参数接口
 */
export interface FetchTradeListParams {
    page?: number;                // 页码，默认1
    limit?: number;               // 每页数量，默认10，最大50
    session_id?: number;          // 专场ID
    token?: string;               // 用户登录Token（可选，会自动从localStorage获取）
}

/**
 * 获取寄售交易区列表
 * API: GET /api/collectionItem/tradeList
 * 
 * @param params - 查询参数
 * @param params.page - 页码，默认1
 * @param params.limit - 每页数量，默认10，最大50
 * @param params.session_id - 专场ID（可选）
 * 
 * @returns 返回数据包括：
 *          - list: 寄售交易区列表
 *          - total: 总记录数
 */
export async function getTradeList(params: FetchTradeListParams = {}): Promise<ApiResponse<TradeListData>> {
    const search = new URLSearchParams();
    if (params.page) search.set('page', String(params.page));
    if (params.limit) search.set('limit', String(params.limit));
    if (params.session_id) search.set('session_id', String(params.session_id));

    return authedFetch<TradeListData>(`${API_ENDPOINTS.collectionItem.tradeList}?${search.toString()}`, { method: 'GET', token: params.token });
}

/**
 * 我的寄售列表项接口
 */
export interface MyConsignmentItem {
    id: number;                       // 寄售记录 ID
    consignment_price: number | string; // 挂牌寄售价格
    service_fee?: number | string;    // 确权技术服务费 (3%)
    total_cost?: number | string;     // 用户总回款成本参考
    status_text: string;              // 寄售状态文字
    item_title: string;               // 藏品名称
    [key: string]: any;
}

/**
 * 我的寄售列表查询参数接口
 */
export interface FetchMyConsignmentListParams {
    page?: number;    // 页码，默认1
    limit?: number;   // 每页数量，默认10，最大50
    status?: number;  // 寄售状态: 0=全部, 1=寄售中, 2=已售出, 3=已取消
    token?: string;   // 用户登录Token（可选，会自动从localStorage获取）
}

/**
 * 我的寄售列表返回数据接口
 */
export interface MyConsignmentListData {
    list: MyConsignmentItem[];  // 寄售列表
    total: number;              // 总记录数
    has_more?: boolean;         // 是否有更多数据
}

/**
 * 获取我的寄售列表
 * API: GET /api/collectionItem/myConsignmentList
 * 
 * 请求头需要包含：
 * - ba-token
 * - ba-user-token
 * - batoken: 用户登录Token
 * 
 * @param params - 查询参数
 * @param params.page - 页码，默认1
 * @param params.limit - 每页数量，默认10，最大50
 * @param params.status - 寄售状态: 0=全部, 1=寄售中, 2=已售出, 3=已取消
 * @param params.token - 用户登录Token（可选，会自动从localStorage获取）
 * 
 * @returns 返回数据包括：
 *          - list: 寄售列表
 *          - total: 总记录数
 *          - has_more: 是否有更多数据
 */
export async function getMyConsignmentList(params: FetchMyConsignmentListParams = {}): Promise<ApiResponse<MyConsignmentListData>> {
    const search = new URLSearchParams();
    if (params.page) search.set('page', String(params.page));
    if (params.limit) search.set('limit', String(params.limit));
    if (params.status !== undefined && params.status !== 0) {
        search.set('status', String(params.status));
    }

    const path = `${API_ENDPOINTS.collectionItem.myConsignmentList}?${search.toString()}`;
    return authedFetch<MyConsignmentListData>(path, { method: 'GET', token: params.token });
}

export interface ConsignmentDetailData {
    id: number;
    title: string;
    image: string;
    images?: string[];
    description?: string;
    price: number;
    consignment_price: number;
    status: number;
    status_text: string;
    [key: string]: any;
}

export async function getConsignmentDetail(params: {
    consignment_id: number;
    token?: string
}): Promise<ApiResponse<ConsignmentDetailData>> {
    const path = `${API_ENDPOINTS.collectionItem.consignmentDetail}?id=${params.consignment_id}`;
    return authedFetch<ConsignmentDetailData>(path, { method: 'GET', token: params.token });
}
/**
 * 寄售解锁状态检查接口返回数据
 */
export interface ConsignmentCheckData {
    unlocked?: boolean;
    remaining_seconds?: number;
    remaining_text?: string;
    unlock_hours?: number;
    consignment_unlock_hours?: number;
    [key: string]: any;
}

/**
 * 检查寄售解锁状态
 * API: GET /api/collectionItem/consignmentCheck
 *
 * @param params.user_collection_id - 用户藏品记录ID（必填）
 * @param params.token - 用户登录Token（可选，会自动从localStorage获取）
 */
export async function getConsignmentCheck(params: { user_collection_id: number | string; token?: string }): Promise<ApiResponse<ConsignmentCheckData>> {
    const search = new URLSearchParams();
    search.set('user_collection_id', String(params.user_collection_id));
    const path = `${API_ENDPOINTS.collectionItem.consignmentCheck}?${search.toString()}`;
    return authedFetch<ConsignmentCheckData>(path, { method: 'GET', token: params.token });
}

// ============================================================================
// 提货相关
// ============================================================================

/**
 * 申请提货的参数接口
 * API: POST /api/collectionItem/deliver
 */
export interface DeliverParams {
    user_collection_id: number | string; // 用户藏品记录ID（必填）
    address_id: number;                  // 收货地址ID（必填）
    token?: string;                      // 用户登录Token（可选，会自动从localStorage获取）
}

/**
 * 申请提货
 * API: POST /api/collectionItem/deliver
 * 
 * 请求头需要包含：
 * - ba-token
 * - ba-user-token
 * - batoken: 用户登录Token
 * 
 * @param params - 提货参数
 * @param params.user_collection_id - 用户藏品记录ID（必填）
 * @param params.address_id - 收货地址ID（必填）
 * @param params.token - 用户登录Token（可选，会自动从localStorage获取）
 * 
 * @returns 返回提货申请结果
 */
export async function deliverCollectionItem(params: DeliverParams): Promise<ApiResponse> {
    // 根据 API 文档，使用 JSON 格式传递参数
    const payload = {
        user_collection_id: Number(params.user_collection_id),
        address_id: Number(params.address_id),
    };

    return authedFetch(API_ENDPOINTS.collectionItem.deliver, {
        method: 'POST',
        body: JSON.stringify(payload),
        token: params.token,
    });
}

// 兼容旧名称
export const applyDelivery = deliverCollectionItem;

/**
 * 提货订单状态枚举
 */
export type DeliveryStatus = 'paid' | 'shipped' | 'completed';

/**
 * 藏品提货列表查询参数接口
 * API: GET /api/collectionItem/deliveryList
 */
export interface FetchDeliveryListParams {
    page?: number;           // 页码，默认1
    limit?: number;          // 每页数量，默认10，最大50
    status?: DeliveryStatus; // 订单状态: paid=待发货, shipped=已发货, completed=已完成
    token?: string;          // 用户登录Token（可选，会自动从localStorage获取）
}

/**
 * 提货订单列表返回数据接口
 */
export interface DeliveryListData {
    list: ShopOrderItem[];  // 提货订单列表
    total: number;          // 总记录数
    has_more?: boolean;     // 是否有更多数据
}

/**
 * 获取藏品提货列表
 * API: GET /api/collectionItem/deliveryList
 * 
 * 请求头需要包含：
 * - ba-token
 * - ba-user-token
 * - batoken: 用户登录Token
 * 
 * @param params - 查询参数
 * @param params.page - 页码，默认1
 * @param params.limit - 每页数量，默认10，最大50
 * @param params.status - 订单状态: paid=待发货, shipped=已发货, completed=已完成
 * @param params.token - 用户登录Token（可选，会自动从localStorage获取）
 * 
 * @returns 返回数据包括：
 *          - list: 提货订单列表
 *          - total: 总记录数
 *          - has_more: 是否有更多数据
 */
export async function getDeliveryList(params: FetchDeliveryListParams = {}): Promise<ApiResponse<DeliveryListData>> {
    const search = new URLSearchParams();
    if (params.page) search.set('page', String(params.page));
    if (params.limit) search.set('limit', String(params.limit));
    if (params.status) search.set('status', params.status);

    const path = `${API_ENDPOINTS.collectionItem.deliveryList}?${search.toString()}`;
    return authedFetch<DeliveryListData>(path, { method: 'GET', token: params.token });
}

// ============================================================================
// 购买记录
// ============================================================================

export interface PurchaseRecordItem {
    order_id: number;
    item_title: string;
    item_image: string;
    quantity: number;
    price: number | string;
    total_amount: number | string;
    pay_type_text: string;
    status_text: string;
    order_status_text?: string;
    pay_time: number;
    pay_time_text: string;
    [key: string]: any;
}

export async function getPurchaseRecords(params: {
    page?: number;
    limit?: number;
    token?: string
} = {}): Promise<ApiResponse<{ list: PurchaseRecordItem[], has_more?: boolean }>> {
    const search = new URLSearchParams();
    if (params.page) search.set('page', String(params.page));
    if (params.limit) search.set('limit', String(params.limit));

    const path = `${API_ENDPOINTS.collectionItem.purchaseRecords}?${search.toString()}`;
    return authedFetch<{ list: PurchaseRecordItem[], has_more?: boolean }>(path, { method: 'GET', token: params.token });
}

/**
 * 权益分割的参数接口
 * API: POST /api/collectionItem/rightsDeliver
 */
export interface RightsDeliverParams {
    user_collection_id: number | string; // 用户藏品记录ID
    token?: string;                    // 用户登录Token（可选，会自动从localStorage获取）
}

/**
 * 权益分割的返回结果接口
 */
export interface RightsDeliverResult {
    code: number;    // 业务代码
    message: string; // 业务信息
    data: object;    // 业务数据
}

/**
 * 权益分割
 * API: POST /api/collectionItem/rightsDeliver
 *
 * @param params - 权益分割参数
 * @param params.user_collection_id - 用户藏品记录ID
 * @param params.token - 用户登录Token（可选，会自动从localStorage获取）
 *
 * @returns 返回权益分割结果
 */
export async function rightsDeliver(params: RightsDeliverParams): Promise<ApiResponse<RightsDeliverResult>> {
    const token = params.token || localStorage.getItem(AUTH_TOKEN_KEY) || '';

    const payload: Record<string, any> = {
        user_collection_id: Number(params.user_collection_id),
    };

    return authedFetch<RightsDeliverResult>(API_ENDPOINTS.collectionItem.rightsDeliver, {
        method: 'POST',
        body: JSON.stringify(payload),
        token: params.token,
    });
}
