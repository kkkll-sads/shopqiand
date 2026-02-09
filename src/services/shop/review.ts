import type { ApiResponse } from '../networking';
import { API_ENDPOINTS } from '../config';
import { authedFetch, getStoredToken } from '../client';

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

export interface ReviewStats {
  all: number;
  with_media: number;
  follow_up: number;
}

export interface ReviewListData {
  list: ReviewItem[];
  total: number;
  page: number;
  limit: number;
  good_rate: number;
  stats: ReviewStats;
}

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
