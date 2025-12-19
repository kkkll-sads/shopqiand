/**
 * consignment.ts - 寄售与提货服务
 * 
 * 包含：寄售申请、取消寄售、申请提货、寄售列表、提货列表等
 * 
 * @author 树交所前端团队
 * @version 1.0.0
 */

import { apiFetch, ApiResponse } from './networking';
import { API_ENDPOINTS, AUTH_TOKEN_KEY } from './config';
import type { ShopOrderItem } from './shop';

// ============================================================================
// 寄售相关
// ============================================================================

export async function consignCollectionItem(params: {
    user_collection_id?: number | string;
    id?: number;
    price: number;
    token?: string
}): Promise<ApiResponse> {
    const token = params.token || localStorage.getItem(AUTH_TOKEN_KEY) || '';
    const payload = new FormData();
    payload.append('user_collection_id', String(params.user_collection_id || params.id));
    payload.append('price', String(params.price));

    return apiFetch(API_ENDPOINTS.collectionItem.consign, {
        method: 'POST',
        body: payload,
        token,
    });
}

export async function cancelConsignment(params: {
    id?: number;
    consignment_id?: number;
    token?: string
}): Promise<ApiResponse> {
    const token = params.token || localStorage.getItem(AUTH_TOKEN_KEY) || '';
    const payload = new FormData();
    payload.append('consignment_id', String(params.consignment_id || params.id));

    return apiFetch(API_ENDPOINTS.collectionItem.cancelConsignment, {
        method: 'POST',
        body: payload,
        token,
    });
}

export interface ConsignmentItem {
    id: number;
    consignment_id: number;
    session_id?: number | string;
    title: string;
    image: string;
    price: number;
    consignment_price?: number;
    stock?: number;
    sales?: number;
    [key: string]: any;
}

export async function getConsignmentList(params: { page?: number; limit?: number } = {}): Promise<ApiResponse<{ list: ConsignmentItem[] }>> {
    const search = new URLSearchParams();
    if (params.page) search.set('page', String(params.page));
    if (params.limit) search.set('limit', String(params.limit));

    return apiFetch<{ list: ConsignmentItem[] }>(`${API_ENDPOINTS.collectionItem.consignmentList}?${search.toString()}`, { method: 'GET' });
}

export interface MyConsignmentItem {
    consignment_id: number;
    user_collection_id: number;
    title: string;
    image: string;
    original_price: number | string;
    consignment_price: number | string;
    consignment_status: number;
    consignment_status_text: string;
    create_time: number;
    create_time_text: string;
    [key: string]: any;
}

export async function getMyConsignmentList(params: {
    page?: number;
    limit?: number;
    status?: number;
    token?: string
} = {}): Promise<ApiResponse<{ list: MyConsignmentItem[], has_more?: boolean }>> {
    const token = params.token || localStorage.getItem(AUTH_TOKEN_KEY) || '';
    const search = new URLSearchParams();
    if (params.page) search.set('page', String(params.page));
    if (params.limit) search.set('limit', String(params.limit));
    if (params.status !== undefined) search.set('status', String(params.status));

    const path = `${API_ENDPOINTS.collectionItem.myConsignmentList}?${search.toString()}`;
    return apiFetch<{ list: MyConsignmentItem[], has_more?: boolean }>(path, { method: 'GET', token });
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
    const token = params.token || localStorage.getItem(AUTH_TOKEN_KEY) || '';
    const path = `${API_ENDPOINTS.collectionItem.consignmentDetail}?id=${params.consignment_id}`;
    return apiFetch<ConsignmentDetailData>(path, { method: 'GET', token });
}

// ============================================================================
// 提货相关
// ============================================================================

export interface DeliverParams {
    user_collection_id?: number | string;
    id?: number;
    address_id: number | null;
    token?: string;
}

export async function deliverCollectionItem(params: DeliverParams): Promise<ApiResponse> {
    const token = params.token || localStorage.getItem(AUTH_TOKEN_KEY) || '';
    const payload = new FormData();
    payload.append('user_collection_id', String(params.user_collection_id || params.id));
    if (params.address_id) {
        payload.append('address_id', String(params.address_id));
    }

    return apiFetch(API_ENDPOINTS.collectionItem.deliver, {
        method: 'POST',
        body: payload,
        token,
    });
}

// 兼容旧名称
export const applyDelivery = deliverCollectionItem;

export async function getDeliveryList(params: {
    page?: number;
    limit?: number;
    status?: string;
    token?: string;
} = {}): Promise<ApiResponse<{ list: ShopOrderItem[], has_more?: boolean }>> {
    const token = params.token || localStorage.getItem(AUTH_TOKEN_KEY) || '';
    const search = new URLSearchParams();
    if (params.page) search.set('page', String(params.page));
    if (params.limit) search.set('limit', String(params.limit));
    if (params.status) search.set('status', params.status);

    const path = `${API_ENDPOINTS.collectionItem.deliveryList}?${search.toString()}`;
    return apiFetch<{ list: ShopOrderItem[], has_more?: boolean }>(path, { method: 'GET', token });
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
    const token = params.token || localStorage.getItem(AUTH_TOKEN_KEY) || '';
    const search = new URLSearchParams();
    if (params.page) search.set('page', String(params.page));
    if (params.limit) search.set('limit', String(params.limit));

    const path = `${API_ENDPOINTS.collectionItem.purchaseRecords}?${search.toString()}`;
    return apiFetch<{ list: PurchaseRecordItem[], has_more?: boolean }>(path, { method: 'GET', token });
}
