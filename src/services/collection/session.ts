import type { ApiResponse } from '../networking';
import { API_ENDPOINTS } from '../config';
import { authedFetch } from '../client';

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
  return authedFetch<{ list: CollectionSessionItem[] }>(API_ENDPOINTS.collectionSession.index, {
    method: 'GET',
  });
}

export async function fetchCollectionSessionDetail(id: number): Promise<ApiResponse<CollectionSessionItem>> {
  return authedFetch<CollectionSessionItem>(`${API_ENDPOINTS.collectionSession.detail}?id=${id}`, {
    method: 'GET',
  });
}
