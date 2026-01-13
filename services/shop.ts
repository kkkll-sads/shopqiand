/**
 * shop.ts - 商城商品与订单服务
 * 
 * 包含：商品列表、商品详情、商品分类、订单管理等
 * 
 * @author 树交所前端团队
 * @version 1.0.0
 */

import { ApiResponse } from './networking';
import { API_ENDPOINTS } from './config';
import { authedFetch, getStoredToken } from './client';
import { fetchDefaultAddress } from './user';
import { bizLog, debugLog, warnLog, errorLog } from '../utils/logger';

// ============================================================================
// 商品相关接口
// ============================================================================

export interface ShopProductItem {
    id: number;
    name: string;
    thumbnail: string;
    category: string;
    price: number;
    score_price: number;
    stock: number;
    sales: number;
    purchase_type: string;
    is_physical: string;
    [key: string]: any;
}

export interface ShopProductListData {
    list: ShopProductItem[];
    total: number;
    page: number;
    limit: number;
}

export interface FetchShopProductsParams {
    page?: number;
    limit?: number;
}

export async function fetchShopProducts(params: FetchShopProductsParams = {}): Promise<ApiResponse<ShopProductListData>> {
    const search = new URLSearchParams();
    if (params.page !== undefined) search.set('page', String(params.page));
    if (params.limit !== undefined) search.set('limit', String(params.limit));

    const path = `${API_ENDPOINTS.shopProduct.list}?${search.toString()}`;
    return authedFetch<ShopProductListData>(path, {
        method: 'GET',
    });
}

export interface ShopProductDetailData extends ShopProductItem {
    images?: string[];
    description?: string;
}

export async function fetchShopProductDetail(id: number | string): Promise<ApiResponse<ShopProductDetailData>> {
    const path = `${API_ENDPOINTS.shopProduct.detail}?id=${id}`;
    return authedFetch<ShopProductDetailData>(path, {
        method: 'GET',
    });
}

export interface ShopProductCategoriesData {
    list: string[];
}

export async function fetchShopProductCategories(): Promise<ApiResponse<ShopProductCategoriesData>> {
    return authedFetch<ShopProductCategoriesData>(API_ENDPOINTS.shopProduct.categories, {
        method: 'GET',
    });
}

export async function fetchShopProductsBySales(params: FetchShopProductsParams = {}): Promise<ApiResponse<ShopProductListData>> {
    const search = new URLSearchParams();
    if (params.page !== undefined) search.set('page', String(params.page));
    if (params.limit !== undefined) search.set('limit', String(params.limit));

    const path = `${API_ENDPOINTS.shopProduct.sales}?${search.toString()}`;
    return authedFetch<ShopProductListData>(path, {
        method: 'GET',
    });
}

export async function fetchShopProductsByLatest(params: FetchShopProductsParams = {}): Promise<ApiResponse<ShopProductListData>> {
    const search = new URLSearchParams();
    if (params.page !== undefined) search.set('page', String(params.page));
    if (params.limit !== undefined) search.set('limit', String(params.limit));

    const path = `${API_ENDPOINTS.shopProduct.latest}?${search.toString()}`;
    return authedFetch<ShopProductListData>(path, {
        method: 'GET',
    });
}


export interface ShopProductShareData {
    product: {
        id: number;
        name: string;
        thumbnail: string;
        price: number;
        score_price: number;
        purchase_type: string;
        category: string;
    };
    share_url: string;
    share_title: string;
    share_desc: string;
    share_image: string;
    share_code: string;
}

export async function fetchShopProductShare(id: number | string): Promise<ApiResponse<ShopProductShareData>> {
    const path = `${API_ENDPOINTS.shopProduct.share}?id=${id}`;
    return authedFetch<ShopProductShareData>(path, {
        method: 'GET',
    });
}

// ============================================================================
// 订单相关接口
// ============================================================================

export interface ShopOrderItemDetail {
    id: number;
    shop_order_id: number;
    product_id: number;
    product_name: string;
    product_image: string;
    product_thumbnail?: string;
    price: number;
    score_price?: number;
    subtotal: number;
    subtotal_score?: number;
    quantity: number;
    [key: string]: any;
}

export interface ShopOrderItem {
    id: number;
    order_no: string;
    total_amount: number | string;
    total_score: number | string;
    status: number;
    status_text: string;
    pay_type: string;
    createtime: number;
    items: ShopOrderItemDetail[];
    product_image?: string;
    product_name?: string;
    thumbnail?: string;
    quantity?: number;
    [key: string]: any;
}

export interface FetchShopOrderParams {
    page?: number;
    limit?: number;
    pay_type?: string; // 'score' for points orders, 'balance' for regular orders
    token?: string;
}


export async function fetchPendingPayOrders(params: FetchShopOrderParams = {}): Promise<ApiResponse<{ list: ShopOrderItem[], total: number }>> {
    const token = params.token ?? getStoredToken();
    const search = new URLSearchParams();
    if (params.page) search.set('page', String(params.page));
    if (params.limit) search.set('limit', String(params.limit));
    if (params.pay_type) search.set('pay_type', params.pay_type);

    const path = `${API_ENDPOINTS.shopOrder.pendingPay}?${search.toString()}`;
    return authedFetch<{ list: ShopOrderItem[], total: number }>(path, { method: 'GET', token });
}

export async function fetchPendingShipOrders(params: FetchShopOrderParams = {}): Promise<ApiResponse<{ list: ShopOrderItem[], total: number }>> {
    const token = params.token ?? getStoredToken();
    const search = new URLSearchParams();
    if (params.page) search.set('page', String(params.page));
    if (params.limit) search.set('limit', String(params.limit));
    if (params.pay_type) search.set('pay_type', params.pay_type);

    const path = `${API_ENDPOINTS.shopOrder.pendingShip}?${search.toString()}`;
    return authedFetch<{ list: ShopOrderItem[], total: number }>(path, { method: 'GET', token });
}

export async function fetchPendingConfirmOrders(params: FetchShopOrderParams = {}): Promise<ApiResponse<{ list: ShopOrderItem[], total: number }>> {
    const token = params.token ?? getStoredToken();
    const search = new URLSearchParams();
    if (params.page) search.set('page', String(params.page));
    if (params.limit) search.set('limit', String(params.limit));
    if (params.pay_type) search.set('pay_type', params.pay_type);

    const path = `${API_ENDPOINTS.shopOrder.pendingConfirm}?${search.toString()}`;
    return authedFetch<{ list: ShopOrderItem[], total: number }>(path, { method: 'GET', token });
}

export async function fetchCompletedOrders(params: FetchShopOrderParams = {}): Promise<ApiResponse<{ list: ShopOrderItem[], total: number }>> {
    const token = params.token ?? getStoredToken();
    const search = new URLSearchParams();
    if (params.page) search.set('page', String(params.page));
    if (params.limit) search.set('limit', String(params.limit));
    if (params.pay_type) search.set('pay_type', params.pay_type);

    const path = `${API_ENDPOINTS.shopOrder.completed}?${search.toString()}`;
    return authedFetch<{ list: ShopOrderItem[], total: number }>(path, { method: 'GET', token });
}

export async function confirmOrder(params: { id: number | string; token?: string }): Promise<ApiResponse> {
    const token = params.token ?? getStoredToken();
    const payload = new FormData();
    payload.append('id', String(params.id));

    return authedFetch(API_ENDPOINTS.shopOrder.confirm, {
        method: 'POST', body: payload, token
    });
}

export async function payOrder(params: { id: number | string; token?: string }): Promise<ApiResponse> {
    const token = params.token ?? getStoredToken();
    const payload = new FormData();
    payload.append('order_id', String(params.id));

    return authedFetch(API_ENDPOINTS.shopOrder.pay, {
        method: 'POST', body: payload, token
    });
}

export async function deleteOrder(params: { id: number | string; token?: string }): Promise<ApiResponse> {
    const token = params.token ?? getStoredToken();
    const payload = new FormData();
    payload.append('order_id', String(params.id));

    return authedFetch(API_ENDPOINTS.shopOrder.delete, {
        method: 'POST', body: payload, token
    });
}

export async function cancelOrder(params: { id: number | string; token?: string }): Promise<ApiResponse> {
    const token = params.token ?? getStoredToken();
    const payload = new FormData();
    payload.append('order_id', String(params.id));

    return authedFetch(API_ENDPOINTS.shopOrder.cancel, {
        method: 'POST', body: payload, token
    });
}

export interface ShopOrderStatistics {
    all_count: number;
    pending_count: number;
    paid_count: number;
    shipped_count: number;
    completed_count: number;
    cancelled_count: number;
    refunded_count: number;
}

export async function fetchShopOrderStatistics(token?: string): Promise<ApiResponse<ShopOrderStatistics>> {
    const t = token ?? getStoredToken();
    return authedFetch<ShopOrderStatistics>(API_ENDPOINTS.shopOrder.statistics, {
        method: 'GET',
        token: t
    });
}

export async function getOrderDetail(params: { id: number | string; token?: string }): Promise<ApiResponse<ShopOrderItem>> {
    const token = params.token ?? getStoredToken();
    const path = `${API_ENDPOINTS.shopOrder.detail}?id=${params.id}`;
    return authedFetch<ShopOrderItem>(path, { method: 'GET', token });
}

export interface CreateOrderItem {
    product_id: number;
    quantity: number;
}

export interface CreateOrderParams {
    items: CreateOrderItem[];
    pay_type: 'money' | 'score';
    address_id?: number | null;
    remark?: string;
    token?: string;
}

export async function createOrder(params: CreateOrderParams): Promise<ApiResponse> {
    const token = params.token ?? getStoredToken();

    if (!token) {
        throw new Error('未找到用户登录信息，请先登录后再创建订单');
    }

    if (!params.items || params.items.length === 0) {
        throw new Error('请选择要购买的商品');
    }

    if (!params.pay_type) {
        throw new Error('请选择支付方式');
    }

    const normalizedItems = params.items.map((item) => {
        const productId = Number(item.product_id);
        const quantity = Number(item.quantity);
        if (!Number.isFinite(productId) || productId <= 0) {
            throw new Error('无效的商品ID');
        }
        if (!Number.isFinite(quantity) || quantity <= 0) {
            throw new Error('商品数量必须大于0');
        }
        return { product_id: productId, quantity };
    });

    let addressId = params.address_id;
    if (addressId === undefined || addressId === null) {
        try {
            const defaultAddressResponse = await fetchDefaultAddress(token);
            if (defaultAddressResponse.code === 1 && defaultAddressResponse.data?.id) {
                addressId = typeof defaultAddressResponse.data.id === 'string'
                    ? parseInt(defaultAddressResponse.data.id, 10)
                    : defaultAddressResponse.data.id;
            }
        } catch (error) {
            warnLog('order.create', '获取默认收货地址失败，将使用 null', error);
            addressId = null;
        }
    }

    const requestBody = {
        items: normalizedItems,
        pay_type: params.pay_type,
        address_id: addressId ?? null,
        remark: params.remark || '',
    };

    try {
        const data = await authedFetch(API_ENDPOINTS.shopOrder.create, {
            method: 'POST',
            body: JSON.stringify(requestBody),
            token,
        });
        debugLog('api.shop.createOrder.raw', data);
        bizLog('order.create', {
            code: data.code,
            addressId: addressId ?? null,
            payType: params.pay_type,
            itemCount: normalizedItems.length,
        });
        return data;
    } catch (error: any) {
        errorLog('api.shop.createOrder', '创建订单失败', error);
        throw error;
    }
}

export interface BuyShopOrderParams {
    items: CreateOrderItem[];
    pay_type: 'money' | 'score';
    address_id?: number | null;
    remark?: string;
    token?: string;
}

export async function buyShopOrder(params: BuyShopOrderParams): Promise<ApiResponse> {
    const token = params.token ?? getStoredToken();

    if (!token) {
        throw new Error('未找到用户登录信息，请先登录后再购买商品');
    }

    if (!params.items || params.items.length === 0) {
        throw new Error('请选择要购买的商品');
    }

    if (!params.pay_type) {
        throw new Error('请选择支付方式');
    }

    const normalizedItems = params.items.map((item) => {
        const productId = Number(item.product_id);
        const quantity = Number(item.quantity);
        if (!Number.isFinite(productId) || productId <= 0) {
            throw new Error('无效的商品ID');
        }
        if (!Number.isFinite(quantity) || quantity <= 0) {
            throw new Error('商品数量必须大于0');
        }
        return { product_id: productId, quantity };
    });

    let isPhysicalProduct = false;
    if (params.items && params.items.length > 0) {
        try {
            const firstProductId = params.items[0].product_id;
            const productDetailResponse = await fetchShopProductDetail(firstProductId);
            if (productDetailResponse.code === 1 && productDetailResponse.data) {
                isPhysicalProduct = productDetailResponse.data.is_physical === '1';
            }
        } catch (error) {
            warnLog('order.buy', '获取商品详情失败，无法判断是否为实物商品', error);
            isPhysicalProduct = true;
        }
    }

    let addressId = params.address_id;
    if (addressId === undefined || addressId === null) {
        try {
            const defaultAddressResponse = await fetchDefaultAddress(token);
            if (defaultAddressResponse.code === 1 && defaultAddressResponse.data?.id) {
                addressId = typeof defaultAddressResponse.data.id === 'string'
                    ? parseInt(defaultAddressResponse.data.id, 10)
                    : defaultAddressResponse.data.id;
            }
        } catch (error) {
            if (isPhysicalProduct) {
                throw new Error('实物商品必须填写收货地址，请先添加收货地址');
            }
            warnLog('order.buy', '获取默认收货地址失败，将使用 null', error);
            addressId = null;
        }
    }

    if (isPhysicalProduct && (addressId === null || addressId === undefined)) {
        throw new Error('实物商品必须填写收货地址，请先添加收货地址');
    }

    const requestBody = {
        items: normalizedItems,
        pay_type: params.pay_type,
        address_id: addressId ?? null,
        remark: params.remark || '',
    };

    try {
        const data = await authedFetch(API_ENDPOINTS.shopOrder.buy, {
            method: 'POST',
            body: JSON.stringify(requestBody),
            token,
        });
        debugLog('api.shop.buy.raw', data);
        bizLog('order.buy', {
            code: data.code,
            addressId: addressId ?? null,
            payType: params.pay_type,
            itemCount: normalizedItems.length,
            isPhysicalProduct,
        });
        return data;
    } catch (error: any) {
        errorLog('api.shop.buy', '购买商品失败', error);
        throw error;
    }
}
