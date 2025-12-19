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

export interface CollectionItem {
    id: number;
    session_id: number;
    title: string;
    image: string;
    price: number;
    stock: number;
    [key: string]: any;
}

export async function fetchCollectionItems(params: { session_id?: number; page?: number } = {}): Promise<ApiResponse<{ list: CollectionItem[] }>> {
    const search = new URLSearchParams();
    if (params.session_id) search.set('session_id', String(params.session_id));
    if (params.page) search.set('page', String(params.page));

    const path = `${API_ENDPOINTS.collectionItem.index}?${search.toString()}`;
    return apiFetch<{ list: CollectionItem[] }>(path, {
        method: 'GET',
    });
}

export async function fetchCollectionItemDetail(id: number): Promise<ApiResponse<CollectionItem>> {
    return apiFetch<CollectionItem>(`${API_ENDPOINTS.collectionItem.detail}?id=${id}`, {
        method: 'GET',
    });
}

export async function fetchCollectionItemsBySession(sessionId: number | string, params: { page?: number; limit?: number } = {}): Promise<ApiResponse<{ list: CollectionItem[] }>> {
    const search = new URLSearchParams();
    search.set('session_id', String(sessionId));
    if (params.page) search.set('page', String(params.page));
    if (params.limit) search.set('limit', String(params.limit));

    const path = `${API_ENDPOINTS.collectionItem.bySession}?${search.toString()}`;
    return apiFetch<{ list: CollectionItem[] }>(path, { method: 'GET' });
}

export type CollectionItemDetailData = CollectionItem & {
    images?: string[];
    description?: string;
    [key: string]: any;
};

export async function fetchCollectionItemOriginalDetail(id: number | string): Promise<ApiResponse<CollectionItemDetailData>> {
    const path = `${API_ENDPOINTS.collectionItem.originalDetail}?id=${id}`;
    return apiFetch<CollectionItemDetailData>(path, { method: 'GET' });
}

export async function buyCollectionItem(params: {
    id?: number;
    item_id?: number;
    consignment_id?: number | string;
    quantity?: number;
    pay_password?: string;
    token?: string;
    pay_type?: 'money' | 'score';
    product_id_record?: string;
}): Promise<ApiResponse> {
    const token = params.token || localStorage.getItem(AUTH_TOKEN_KEY) || '';
    const payload = new FormData();

    const itemId = params.item_id ?? params.id;
    if (itemId) {
        payload.append('item_id', String(itemId));
    }

    if (params.consignment_id) {
        payload.append('consignment_id', String(params.consignment_id));
    }

    payload.append('quantity', String(params.quantity ?? 1));

    if (params.pay_type) {
        payload.append('pay_type', params.pay_type);
    }

    if (params.product_id_record) {
        payload.append('product_id_record', params.product_id_record);
    }

    return apiFetch(API_ENDPOINTS.collectionItem.buy, {
        method: 'POST',
        body: payload,
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
