import type { QueryParams } from '../core/query';
import { http } from '../http';

export interface ShopProductQuery {
  category?: string;
  keyword?: string;
  limit?: number;
  page?: number;
  price_order?: 'asc' | 'desc';
  purchase_type?: 'money' | 'score' | 'both';
}

export interface ShopProductItem {
  balance_available_amount?: number | null;
  category: string;
  green_power_amount?: number | null;
  id: number;
  is_physical: string;
  name: string;
  price?: number | null;
  purchase_type: string;
  sales: number;
  score_price?: number | null;
  stock: number;
  thumbnail: string;
}

export interface ShopProductListResponse {
  limit: number;
  list: ShopProductItem[];
  page: number;
  total: number;
}

export interface ShopProductDetailSpec {
  name: string;
  value: string;
}

export interface ShopProductDeliveryInfo {
  delivery_time?: string;
  free_shipping?: boolean;
  support_same_day?: boolean;
}

export interface ShopProductAfterSale {
  exchange_policy?: string;
  return_policy?: string;
  warranty?: string;
}

export interface ShopProductSkuSpecValue {
  id?: number;
  image?: string;
  value?: string;
}

export interface ShopProductSkuSpec {
  id?: number;
  name?: string;
  options?: string[];
  product_id?: number;
  sort?: number;
  create_time?: number;
  values?: Array<string | ShopProductSkuSpecValue>;
}

export interface ShopProductSku {
  activity_price?: number | null;
  available_stock?: number | null;
  balance_available_amount?: number | null;
  green_power_amount?: number | null;
  id?: number;
  image?: string;
  limit_buy?: number | null;
  member_price?: number | null;
  min_buy?: number | null;
  original_price?: number | null;
  price?: number | null;
  purchase_type?: string;
  score_price?: number | null;
  sku_code?: string;
  spec_value_ids?: number[];
  spec_value_names?: string;
  spec_values?: string[];
  stock?: number;
  sales?: number | null;
}

export interface ShopProductDetail extends ShopProductItem {
  after_sale?: ShopProductAfterSale | null;
  delivery_info?: ShopProductDeliveryInfo | null;
  description?: string;
  detail_images: string[];
  has_sku?: string;
  images: string[];
  skus?: ShopProductSku[];
  sku_specs?: ShopProductSkuSpec[];
  specs?: ShopProductDetailSpec[];
}

export interface ShopProductReviewFollowUp {
  content?: string;
  images?: string[];
  time?: string;
}

export interface ShopProductReview {
  avatar?: string;
  content?: string;
  follow_up?: ShopProductReviewFollowUp | null;
  has_reply?: boolean;
  id: number;
  images?: string[];
  level?: string;
  likes?: number;
  member_tag?: string;
  purchase_info?: string;
  rating?: number;
  reply_content?: string;
  reply_time?: string;
  time?: string;
  user?: string;
  video?: string;
  video_duration?: number;
}

export interface ShopProductReviewSummary {
  follow_up_count: number;
  good_rate: number;
  preview: ShopProductReview[];
  total: number;
  with_media_count: number;
}

export interface ShopProductReviewListResponse {
  good_rate?: number;
  limit: number;
  list: ShopProductReview[];
  page: number;
  stats?: {
    all?: number;
    follow_up?: number;
    with_media?: number;
  };
  total: number;
}

export interface ShopProductReviewQuery {
  filter?: 'all' | 'follow_up' | 'with_media';
  limit?: number;
  page?: number;
  product_id: number;
}

export interface SubmitReviewPayload {
  order_id: number;
  product_id: number;
  rating: number;
  content?: string;
  images?: string;
  video?: string;
  is_anonymous?: 0 | 1;
}

export interface SubmitReviewResult {
  review_id?: number;
}

export const shopProductApi = {
  categories(signal?: AbortSignal) {
    return http.get<{ list: string[] }>('/api/shopProduct/categories', { signal });
  },
  detail(id: number, signal?: AbortSignal) {
    return http.get<ShopProductDetail>('/api/shopProduct/detail', {
      query: { id },
      signal,
    });
  },
  latest(query: ShopProductQuery = {}, signal?: AbortSignal) {
    return http.get<ShopProductListResponse>('/api/shopProduct/latest', {
      query: query as QueryParams,
      signal,
    });
  },
  list(query: ShopProductQuery = {}, signal?: AbortSignal) {
    return http.get<ShopProductListResponse>('/api/shopProduct/index', {
      query: query as QueryParams,
      signal,
    });
  },
  reviews(query: ShopProductReviewQuery, signal?: AbortSignal) {
    return http.get<ShopProductReviewListResponse>('/api/shopProduct/reviews', {
      query: query as unknown as QueryParams,
      signal,
    });
  },
  reviewSummary(productId: number, signal?: AbortSignal) {
    return http.get<ShopProductReviewSummary>('/api/shopProduct/reviewSummary', {
      query: { product_id: productId },
      signal,
    });
  },
  sales(query: ShopProductQuery = {}, signal?: AbortSignal) {
    return http.get<ShopProductListResponse>('/api/shopProduct/sales', {
      query: query as QueryParams,
      signal,
    });
  },
  submitReview(payload: SubmitReviewPayload, signal?: AbortSignal) {
    return http.post<SubmitReviewResult, SubmitReviewPayload>(
      '/api/shopProduct/submitReview',
      payload,
      { signal },
    );
  },
};
