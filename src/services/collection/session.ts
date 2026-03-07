import type { ApiResponse } from '../networking';
import { API_ENDPOINTS } from '../config';
import { authedFetch, type RequestStrategyConfig } from '../client';

export interface CollectionSessionZoneItem {
  id: number | string;
  name?: string;
  min_price?: number | string;
  max_price?: number | string;
  base_hashrate?: number | string;
}

export interface CollectionSessionItem {
  id: number;
  title: string;
  image: string;
  start_time: string;
  end_time: string;
  status: string;
  name?: string;
  startTime?: string;
  endTime?: string;
  zones?: CollectionSessionZoneItem[];
  reservation_rules?: {
    min_qty?: number;
    max_qty?: number;
    max_extra_hashrate?: number;
  };
  [key: string]: unknown;
}

export async function fetchCollectionSessions(
  strategy?: RequestStrategyConfig
): Promise<ApiResponse<{ list: CollectionSessionItem[] }>> {
  return authedFetch<{ list: CollectionSessionItem[] }>(API_ENDPOINTS.collectionSession.index, {
    method: 'GET',
    cacheTTL: strategy?.cacheTTL ?? 60000,
    dedup: strategy?.dedup ?? true,
    forceRefresh: strategy?.forceRefresh ?? false,
  });
}

export async function fetchCollectionSessionDetail(id: number): Promise<ApiResponse<CollectionSessionItem>> {
  return authedFetch<CollectionSessionItem>(`${API_ENDPOINTS.collectionSession.detail}?id=${id}`, {
    method: 'GET',
  });
}
