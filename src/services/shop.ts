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
import { bizLog, debugLog, warnLog, errorLog } from '@/utils/logger';
import { extractData } from '@/utils/apiHelpers';

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
  category?: string;
  keyword?: string;
  price_order?: string; // 'asc' | 'desc'
  purchase_type?: string; // 'money' | 'score' | 'both'
}

export async function fetchShopProducts(
  params: FetchShopProductsParams = {}
): Promise<ApiResponse<ShopProductListData>> {
  const search = new URLSearchParams();
  if (params.page !== undefined) search.set('page', String(params.page));
  if (params.limit !== undefined) search.set('limit', String(params.limit));
  if (params.category) search.set('category', params.category);
  if (params.keyword) search.set('keyword', params.keyword);
  if (params.price_order) search.set('price_order', params.price_order);
  if (params.purchase_type) search.set('purchase_type', params.purchase_type);

  const path = `${API_ENDPOINTS.shopProduct.list}?${search.toString()}`;
  return authedFetch<ShopProductListData>(path, {
    method: 'GET',
  });
}

// ============================================================================
// SKU 相关类型定义（根据后端API文档 v1.0）
// ============================================================================

/**
 * 规格值定义
 */
export interface SkuSpecValue {
  id: number;           // 规格值ID
  value: string;        // 规格值，如"红色"、"M"
  image?: string;       // 规格图片URL（可选）
}

/**
 * 规格定义
 */
export interface SkuSpec {
  id: number;           // 规格ID
  name: string;         // 规格名称，如"颜色"、"尺寸"
  values: SkuSpecValue[]; // 规格值列表
}

/**
 * SKU 定义
 */
export interface Sku {
  id: number;                  // SKU ID（购买时需传此ID）
  spec_value_ids: string;      // 规格值ID组合（逗号分隔，如"1,3"）
  spec_value_names: string;    // 规格值名称组合（用于显示，如"红色 / M"）
  sku_code?: string;           // SKU编码（可选）
  price: number;               // 销售价格（人民币）
  score_price?: number;        // 消费金价格
  original_price?: number;     // 原价/划线价（可选）
  stock: number;               // 库存数量
  image?: string;              // SKU图片URL（可选）
  purchase_type?: string;      // 购买类型（score=消费金）
}

/**
 * 价格范围（多规格商品）
 */
export interface PriceRange {
  min: number;  // 最低价格
  max: number;  // 最高价格
}

// 兼容旧版规格定义（向后兼容）
export interface ProductSpecOption {
  id: string;
  name: string;
  image?: string;
  price_diff?: number;
  stock?: number;
}

export interface ProductSpec {
  id: string;
  name: string;
  values: string[];
  options?: ProductSpecOption[];
}

/**
 * 商品详情数据（支持多规格SKU）
 */
export interface ShopProductDetailData extends ShopProductItem {
  images?: string[];
  description?: string;
  specs?: ProductSpec[];        // 旧版规格列表（向后兼容）
  detail_images?: string[];     // 商品详情图片
  max_purchase?: number;        // 最大购买数量
  // SKU 相关字段（新增）
  has_sku?: '0' | '1';          // 是否多规格商品："0"单规格，"1"多规格
  sku_specs?: SkuSpec[];        // 规格列表（仅多规格商品返回）
  skus?: Sku[];                 // SKU列表（仅多规格商品返回）
  price_range?: PriceRange | null; // 价格范围（仅多规格商品返回）
}

export async function fetchShopProductDetail(
  id: number | string
): Promise<ApiResponse<ShopProductDetailData>> {
  const path = `${API_ENDPOINTS.shopProduct.detail}?id=${id}`;
  return authedFetch<ShopProductDetailData>(path, {
    method: 'GET',
  });
}

export interface ShopProductCategoriesData {
  list: string[];
}

export async function fetchShopProductCategories(): Promise<
  ApiResponse<ShopProductCategoriesData>
> {
  return authedFetch<ShopProductCategoriesData>(API_ENDPOINTS.shopProduct.categories, {
    method: 'GET',
  });
}

export async function fetchShopProductsBySales(
  params: FetchShopProductsParams = {}
): Promise<ApiResponse<ShopProductListData>> {
  const search = new URLSearchParams();
  if (params.page !== undefined) search.set('page', String(params.page));
  if (params.limit !== undefined) search.set('limit', String(params.limit));
  if (params.category) search.set('category', params.category);
  if (params.keyword) search.set('keyword', params.keyword);
  if (params.price_order) search.set('price_order', params.price_order);
  if (params.purchase_type) search.set('purchase_type', params.purchase_type);

  const path = `${API_ENDPOINTS.shopProduct.sales}?${search.toString()}`;
  return authedFetch<ShopProductListData>(path, {
    method: 'GET',
  });
}

export async function fetchShopProductsByLatest(
  params: FetchShopProductsParams = {}
): Promise<ApiResponse<ShopProductListData>> {
  const search = new URLSearchParams();
  if (params.page !== undefined) search.set('page', String(params.page));
  if (params.limit !== undefined) search.set('limit', String(params.limit));
  if (params.category) search.set('category', params.category);
  if (params.keyword) search.set('keyword', params.keyword);
  if (params.price_order) search.set('price_order', params.price_order);
  if (params.purchase_type) search.set('purchase_type', params.purchase_type);

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

export async function fetchShopProductShare(
  id: number | string
): Promise<ApiResponse<ShopProductShareData>> {
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
  is_commented?: number; // 0=未评价，1=已评价
  [key: string]: any;
}

export interface FetchShopOrderParams {
  page?: number;
  limit?: number;
  pay_type?: string; // 'score' for points orders, 'balance' for regular orders
  token?: string;
}

export async function fetchPendingPayOrders(
  params: FetchShopOrderParams = {}
): Promise<ApiResponse<{ list: ShopOrderItem[]; total: number }>> {
  const token = params.token ?? getStoredToken();
  const search = new URLSearchParams();
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  if (params.pay_type) search.set('pay_type', params.pay_type);

  const path = `${API_ENDPOINTS.shopOrder.pendingPay}?${search.toString()}`;
  return authedFetch<{ list: ShopOrderItem[]; total: number }>(path, { method: 'GET', token });
}

export async function fetchPendingShipOrders(
  params: FetchShopOrderParams = {}
): Promise<ApiResponse<{ list: ShopOrderItem[]; total: number }>> {
  const token = params.token ?? getStoredToken();
  const search = new URLSearchParams();
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  if (params.pay_type) search.set('pay_type', params.pay_type);

  const path = `${API_ENDPOINTS.shopOrder.pendingShip}?${search.toString()}`;
  return authedFetch<{ list: ShopOrderItem[]; total: number }>(path, { method: 'GET', token });
}

export async function fetchPendingConfirmOrders(
  params: FetchShopOrderParams = {}
): Promise<ApiResponse<{ list: ShopOrderItem[]; total: number }>> {
  const token = params.token ?? getStoredToken();
  const search = new URLSearchParams();
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  if (params.pay_type) search.set('pay_type', params.pay_type);

  const path = `${API_ENDPOINTS.shopOrder.pendingConfirm}?${search.toString()}`;
  return authedFetch<{ list: ShopOrderItem[]; total: number }>(path, { method: 'GET', token });
}

export async function fetchCompletedOrders(
  params: FetchShopOrderParams = {}
): Promise<ApiResponse<{ list: ShopOrderItem[]; total: number }>> {
  const token = params.token ?? getStoredToken();
  const search = new URLSearchParams();
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  if (params.pay_type) search.set('pay_type', params.pay_type);

  const path = `${API_ENDPOINTS.shopOrder.completed}?${search.toString()}`;
  return authedFetch<{ list: ShopOrderItem[]; total: number }>(path, { method: 'GET', token });
}

export async function confirmOrder(params: {
  id: number | string;
  token?: string;
}): Promise<ApiResponse> {
  const token = params.token ?? getStoredToken();
  const payload = new FormData();
  payload.append('id', String(params.id));

  return authedFetch(API_ENDPOINTS.shopOrder.confirm, {
    method: 'POST',
    body: payload,
    token,
  });
}

export async function payOrder(params: {
  id: number | string;
  token?: string;
}): Promise<ApiResponse> {
  const token = params.token ?? getStoredToken();
  const payload = new FormData();
  payload.append('order_id', String(params.id));

  return authedFetch(API_ENDPOINTS.shopOrder.pay, {
    method: 'POST',
    body: payload,
    token,
  });
}

export async function deleteOrder(params: {
  id: number | string;
  token?: string;
}): Promise<ApiResponse> {
  const token = params.token ?? getStoredToken();
  const payload = new FormData();
  payload.append('order_id', String(params.id));

  return authedFetch(API_ENDPOINTS.shopOrder.delete, {
    method: 'POST',
    body: payload,
    token,
  });
}

export async function cancelOrder(params: {
  id: number | string;
  token?: string;
}): Promise<ApiResponse> {
  const token = params.token ?? getStoredToken();
  const payload = new FormData();
  payload.append('order_id', String(params.id));

  return authedFetch(API_ENDPOINTS.shopOrder.cancel, {
    method: 'POST',
    body: payload,
    token,
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

export interface CreateOrderItem {
  product_id: number;
  quantity: number;
  sku_id?: number;  // SKU ID（多规格商品必填）
}

export interface CreateOrderParams {
  items: CreateOrderItem[];
  pay_type: 'money' | 'score';
  address_id?: number | null;
  remark?: string;
  token?: string;
  is_physical?: boolean;      // 是否为实物商品（传入可避免额外请求）
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
    const result: { product_id: number; quantity: number; sku_id?: number } = {
      product_id: productId,
      quantity,
    };
    // 如果有 sku_id，添加到请求中（多规格商品必填）
    if (item.sku_id !== undefined && item.sku_id !== null) {
      const skuId = Number(item.sku_id);
      if (Number.isFinite(skuId) && skuId > 0) {
        result.sku_id = skuId;
      }
    }
    return result;
  });

  let addressId = params.address_id;
  if (addressId === undefined || addressId === null) {
    try {
      const defaultAddressResponse = await fetchDefaultAddress(token);
      const defaultAddress = extractData(defaultAddressResponse);
      if (defaultAddress?.id) {
        addressId =
          typeof defaultAddress.id === 'string'
            ? parseInt(defaultAddress.id, 10)
            : defaultAddress.id;
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
  items: CreateOrderItem[];  // CreateOrderItem 已支持 sku_id
  pay_type: 'money' | 'score';
  address_id?: number | null;
  remark?: string;
  token?: string;
  is_physical?: boolean;      // 是否为实物商品（传入可避免额外请求）
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
    const result: { product_id: number; quantity: number; sku_id?: number } = {
      product_id: productId,
      quantity,
    };
    // 如果有 sku_id，添加到请求中（多规格商品必填）
    if (item.sku_id !== undefined && item.sku_id !== null) {
      const skuId = Number(item.sku_id);
      if (Number.isFinite(skuId) && skuId > 0) {
        result.sku_id = skuId;
      }
    }
    return result;
  });

  // 判断是否为实物商品（优先使用传入参数，避免额外请求）
  let isPhysicalProduct = false;
  if (params.is_physical !== undefined) {
    isPhysicalProduct = params.is_physical;
  } else if (params.items && params.items.length > 0) {
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
        addressId =
          typeof defaultAddressResponse.data.id === 'string'
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

// ============================================================================
// 商品评价相关接口
// ============================================================================

/**
 * 评价项接口
 */
export interface ReviewItem {
  id: number;
  user_id: number;
  user_name: string;
  user_avatar: string;
  rating: number;
  content: string;
  images: string[];
  video?: string;
  likes: number;
  is_liked: boolean;
  has_reply: boolean;
  reply_content?: string;
  reply_time?: number;
  follow_up_content?: string;
  follow_up_time?: number;
  create_time: number;
}

/**
 * 评价统计
 */
export interface ReviewStats {
  all: number;
  with_media: number;
  follow_up: number;
}

/**
 * 评价列表响应
 */
export interface ReviewListData {
  list: ReviewItem[];
  total: number;
  page: number;
  limit: number;
  good_rate: number;
  stats: ReviewStats;
}

/**
 * 评价摘要响应
 */
export interface ReviewSummaryData {
  total: number;
  good_rate: number;
  with_media_count: number;
  follow_up_count: number;
  preview: Pick<ReviewItem, 'id' | 'user_name' | 'rating' | 'content' | 'create_time'>[];
}

export interface FetchReviewsParams {
  product_id: number | string;
  page?: number;
  limit?: number;
  filter?: 'all' | 'with_media' | 'follow_up';
}

/**
 * 获取商品评价列表
 */
export async function fetchProductReviews(
  params: FetchReviewsParams
): Promise<ApiResponse<ReviewListData>> {
  const search = new URLSearchParams();
  search.set('product_id', String(params.product_id));
  if (params.page !== undefined) search.set('page', String(params.page));
  if (params.limit !== undefined) search.set('limit', String(params.limit));
  if (params.filter) search.set('filter', params.filter);

  const path = `${API_ENDPOINTS.shopProduct.reviews}?${search.toString()}`;
  return authedFetch<ReviewListData>(path, {
    method: 'GET',
  });
}

/**
 * 获取商品评价摘要
 */
export async function fetchReviewSummary(
  productId: number | string
): Promise<ApiResponse<ReviewSummaryData>> {
  const search = new URLSearchParams();
  search.set('product_id', String(productId));

  const path = `${API_ENDPOINTS.shopProduct.reviewSummary}?${search.toString()}`;
  return authedFetch<ReviewSummaryData>(path, {
    method: 'GET',
  });
}

export interface LikeReviewParams {
  review_id: number;
  action: 'like' | 'unlike';
  token?: string;
}

/**
 * 点赞/取消点赞评价
 */
export async function likeReview(
  params: LikeReviewParams
): Promise<ApiResponse<{ likes: number; is_liked: boolean }>> {
  const token = params.token ?? getStoredToken();

  return authedFetch(API_ENDPOINTS.shopProduct.likeReview, {
    method: 'POST',
    body: JSON.stringify({
      review_id: params.review_id,
      action: params.action,
    }),
    token,
  });
}

export interface SubmitReviewParams {
  order_id: number;
  product_id: number;
  rating: number;
  content: string;
  images?: string[];
  video?: string;
  is_anonymous?: boolean;
  token?: string;
}

/**
 * 提交商品评价
 */
export async function submitReview(
  params: SubmitReviewParams
): Promise<ApiResponse<{ review_id: number }>> {
  const token = params.token ?? getStoredToken();

  return authedFetch(API_ENDPOINTS.shopProduct.submitReview, {
    method: 'POST',
    body: JSON.stringify({
      order_id: params.order_id,
      product_id: params.product_id,
      rating: params.rating,
      content: params.content,
      images: params.images && params.images.length > 0 ? JSON.stringify(params.images) : undefined,
      video: params.video,
      is_anonymous: params.is_anonymous ? '1' : '0',
    }),
    token,
  });
}
