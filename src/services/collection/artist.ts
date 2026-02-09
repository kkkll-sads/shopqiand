import type { ApiResponse } from '../networking';
import { API_ENDPOINTS } from '../config';
import { authedFetch } from '../client';

export interface ArtistItem {
  id: number;
  name: string;
  avatar: string;
  title: string;
  description: string;
}

export async function fetchArtistList(): Promise<ApiResponse<{ list: ArtistItem[] }>> {
  return authedFetch<{ list: ArtistItem[] }>(API_ENDPOINTS.artist.index, {
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
  return authedFetch<ArtistDetailData>(path, { method: 'GET' });
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

export async function fetchArtistAllWorks(
  params: { page?: number; limit?: number } = {}
): Promise<ApiResponse<ArtistAllWorksListData>> {
  const search = new URLSearchParams();
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));

  const path = `${API_ENDPOINTS.artist.allWorks}?${search.toString()}`;
  return authedFetch<ArtistAllWorksListData>(path, { method: 'GET' });
}

// 兼容旧名称
export type ArtistApiItem = ArtistItem;
export type ArtistListData = { list: ArtistItem[] };
export const fetchArtists = fetchArtistList;
