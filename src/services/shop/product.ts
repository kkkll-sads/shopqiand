import type { ApiResponse } from '../networking';
import { API_ENDPOINTS } from '../config';
import { authedFetch } from '../client';

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
  price_order?: string;
  purchase_type?: string;
}

/**
 * 规格值定义
 */
export interface SkuSpecValue {
  id: number;
  value: string;
  image?: string;
}

/**
 * 规格定义
 */
export interface SkuSpec {
  id: number;
  name: string;
  values: SkuSpecValue[];
}

/**
 * SKU 定义
 */
export interface Sku {
  id: number;
  spec_value_ids: string;
  spec_value_names: string;
  sku_code?: string;
  price: number;
  score_price?: number;
  original_price?: number;
  stock: number;
  image?: string;
  purchase_type?: string;
}

/**
 * 价格范围（多规格商品）
 */
export interface PriceRange {
  min: number;
  max: number;
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
  specs?: ProductSpec[];
  detail_images?: string[];
  max_purchase?: number;
  has_sku?: '0' | '1';
  sku_specs?: SkuSpec[];
  skus?: Sku[];
  price_range?: PriceRange | null;
}

export interface ShopProductCategoriesData {
  list: string[];
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

const buildProductSearch = (params: FetchShopProductsParams = {}) => {
  const search = new URLSearchParams();
  if (params.page !== undefined) search.set('page', String(params.page));
  if (params.limit !== undefined) search.set('limit', String(params.limit));
  if (params.category) search.set('category', params.category);
  if (params.keyword) search.set('keyword', params.keyword);
  if (params.price_order) search.set('price_order', params.price_order);
  if (params.purchase_type) search.set('purchase_type', params.purchase_type);
  return search.toString();
};

export async function fetchShopProducts(
  params: FetchShopProductsParams = {}
): Promise<ApiResponse<ShopProductListData>> {
  const path = `${API_ENDPOINTS.shopProduct.list}?${buildProductSearch(params)}`;
  return authedFetch<ShopProductListData>(path, {
    method: 'GET',
  });
}

export async function fetchShopProductDetail(
  id: number | string
): Promise<ApiResponse<ShopProductDetailData>> {
  const path = `${API_ENDPOINTS.shopProduct.detail}?id=${id}`;
  return authedFetch<ShopProductDetailData>(path, {
    method: 'GET',
  });
}

export async function fetchShopProductCategories(): Promise<ApiResponse<ShopProductCategoriesData>> {
  return authedFetch<ShopProductCategoriesData>(API_ENDPOINTS.shopProduct.categories, {
    method: 'GET',
  });
}

export async function fetchShopProductsBySales(
  params: FetchShopProductsParams = {}
): Promise<ApiResponse<ShopProductListData>> {
  const path = `${API_ENDPOINTS.shopProduct.sales}?${buildProductSearch(params)}`;
  return authedFetch<ShopProductListData>(path, {
    method: 'GET',
  });
}

export async function fetchShopProductsByLatest(
  params: FetchShopProductsParams = {}
): Promise<ApiResponse<ShopProductListData>> {
  const path = `${API_ENDPOINTS.shopProduct.latest}?${buildProductSearch(params)}`;
  return authedFetch<ShopProductListData>(path, {
    method: 'GET',
  });
}

export async function fetchShopProductShare(
  id: number | string
): Promise<ApiResponse<ShopProductShareData>> {
  const path = `${API_ENDPOINTS.shopProduct.share}?id=${id}`;
  return authedFetch<ShopProductShareData>(path, {
    method: 'GET',
  });
}
