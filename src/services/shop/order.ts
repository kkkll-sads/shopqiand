import type { ApiResponse } from '../networking';
import { API_ENDPOINTS } from '../config';
import { authedFetch, getStoredToken } from '../client';
import { fetchDefaultAddress } from '../user/address';
import { fetchShopProductDetail } from './product';
import { bizLog, debugLog, warnLog, errorLog } from '@/utils/logger';
import { extractData } from '@/utils/apiHelpers';
import type {
  BuyShopOrderParams,
  CreateOrderItem,
  CreateOrderParams,
  FetchShopOrderParams,
  OrderActionParams,
  ShopOrderItem,
  ShopOrderListData,
  ShopOrderStatistics,
} from '../contracts/shop-order';
export type {
  BuyShopOrderParams,
  CreateOrderItem,
  CreateOrderParams,
  FetchShopOrderParams,
  OrderActionParams,
  ShopOrderItem,
  ShopOrderItemDetail,
  ShopOrderListData,
  ShopOrderStatistics,
} from '../contracts/shop-order';

const buildOrderSearch = (params: FetchShopOrderParams = {}) => {
  const search = new URLSearchParams();
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  if (params.pay_type) search.set('pay_type', params.pay_type);
  return search.toString();
};

const fetchOrderListByPath = async (
  endpoint: string,
  params: FetchShopOrderParams = {}
): Promise<ApiResponse<ShopOrderListData>> => {
  const token = params.token ?? getStoredToken();
  const path = `${endpoint}?${buildOrderSearch(params)}`;
  return authedFetch<ShopOrderListData>(path, { method: 'GET', token });
};

export async function fetchPendingPayOrders(
  params: FetchShopOrderParams = {}
): Promise<ApiResponse<ShopOrderListData>> {
  return fetchOrderListByPath(API_ENDPOINTS.shopOrder.pendingPay, params);
}

export async function fetchPendingShipOrders(
  params: FetchShopOrderParams = {}
): Promise<ApiResponse<ShopOrderListData>> {
  return fetchOrderListByPath(API_ENDPOINTS.shopOrder.pendingShip, params);
}

export async function fetchPendingConfirmOrders(
  params: FetchShopOrderParams = {}
): Promise<ApiResponse<ShopOrderListData>> {
  return fetchOrderListByPath(API_ENDPOINTS.shopOrder.pendingConfirm, params);
}

export async function fetchCompletedOrders(
  params: FetchShopOrderParams = {}
): Promise<ApiResponse<ShopOrderListData>> {
  return fetchOrderListByPath(API_ENDPOINTS.shopOrder.completed, params);
}

const submitOrderAction = async (
  endpoint: string,
  fieldName: 'id' | 'order_id',
  params: OrderActionParams
): Promise<ApiResponse> => {
  const token = params.token ?? getStoredToken();
  const payload = new FormData();
  payload.append(fieldName, String(params.id));

  return authedFetch(endpoint, {
    method: 'POST',
    body: payload,
    token,
  });
};

export async function confirmOrder(params: OrderActionParams): Promise<ApiResponse> {
  return submitOrderAction(API_ENDPOINTS.shopOrder.confirm, 'id', params);
}

export async function payOrder(params: OrderActionParams): Promise<ApiResponse> {
  return submitOrderAction(API_ENDPOINTS.shopOrder.pay, 'order_id', params);
}

export async function deleteOrder(params: OrderActionParams): Promise<ApiResponse> {
  return submitOrderAction(API_ENDPOINTS.shopOrder.delete, 'order_id', params);
}

export async function cancelOrder(params: OrderActionParams): Promise<ApiResponse> {
  return submitOrderAction(API_ENDPOINTS.shopOrder.cancel, 'order_id', params);
}

export async function fetchShopOrderStatistics(
  token?: string
): Promise<ApiResponse<ShopOrderStatistics>> {
  const t = token ?? getStoredToken();
  return authedFetch<ShopOrderStatistics>(API_ENDPOINTS.shopOrder.statistics, {
    method: 'GET',
    token: t,
  });
}

export async function getOrderDetail(params: {
  id: number | string;
  token?: string;
}): Promise<ApiResponse<ShopOrderItem>> {
  const token = params.token ?? getStoredToken();
  const path = `${API_ENDPOINTS.shopOrder.detail}?id=${params.id}`;
  return authedFetch<ShopOrderItem>(path, { method: 'GET', token });
}

const normalizeOrderItems = (items: CreateOrderItem[]) => {
  return items.map((item) => {
    const productId = Number(item.product_id);
    const quantity = Number(item.quantity);

    if (!Number.isFinite(productId) || productId <= 0) {
      throw new Error('无效的商品ID');
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error('商品数量必须大于0');
    }

    const result: { product_id: number; quantity: number; sku_id?: number } = {
      product_id: productId,
      quantity,
    };

    if (item.sku_id !== undefined && item.sku_id !== null) {
      const skuId = Number(item.sku_id);
      if (Number.isFinite(skuId) && skuId > 0) {
        result.sku_id = skuId;
      }
    }

    return result;
  });
};

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

  const normalizedItems = normalizeOrderItems(params.items);

  let addressId = params.address_id;
  if (addressId === undefined || addressId === null) {
    try {
      const defaultAddressResponse = await fetchDefaultAddress(token);
      const defaultAddress = extractData(defaultAddressResponse);
      if (defaultAddress?.id) {
        addressId = typeof defaultAddress.id === 'string' ? parseInt(defaultAddress.id, 10) : defaultAddress.id;
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
  } catch (error: unknown) {
    errorLog('api.shop.createOrder', '创建订单失败', error);
    throw error;
  }
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

  const normalizedItems = normalizeOrderItems(params.items);

  let isPhysicalProduct = false;
  if (params.is_physical !== undefined) {
    isPhysicalProduct = params.is_physical;
  } else if (params.items.length > 0) {
    try {
      const firstProductId = params.items[0].product_id;
      const productDetailResponse = await fetchShopProductDetail(firstProductId);
      const productDetail = extractData(productDetailResponse);
      if (productDetail) {
        isPhysicalProduct = productDetail.is_physical === '1';
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
      const defaultAddress = extractData(defaultAddressResponse);
      if (defaultAddress?.id) {
        addressId = typeof defaultAddress.id === 'string' ? parseInt(defaultAddress.id, 10) : defaultAddress.id;
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
  } catch (error: unknown) {
    errorLog('api.shop.buy', '购买商品失败', error);
    throw error;
  }
}
